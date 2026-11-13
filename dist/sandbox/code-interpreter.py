#!/usr/bin/env python3
"""
Code Interpreter Server — persistent REPL sessions inside CF Sandbox.

Maintains long-lived Python and Node.js interpreter sessions so variables
and state persist across tool calls within an MCP session.

Architecture:
  - Runs on localhost:8223 alongside the Playwright relay (8222)
  - Python sessions use code.InteractiveConsole with redirected stdout/stderr
  - Node.js sessions use a persistent child process with stdin/stdout piping
  - Sessions are keyed by language + optional session ID
  - Worker communicates via sandbox.exec('curl ...') — same pattern as relay

Endpoints:
  GET  /health          — Server status + active sessions
  POST /execute         — Execute code in a session { language, code, sessionId? }
  POST /reset           — Reset a session { language, sessionId? }
  GET  /sessions        — List all active sessions
  DELETE /sessions/:id  — Destroy a specific session
"""

import json
import os
import sys
import io
import signal
import traceback
import time
import code
import subprocess
import threading
import queue
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse

PORT = int(os.environ.get('NB_INTERP_PORT', '8223'))   # local library: one interpreter per sandbox instance

# ─── Session Registry ────────────────────────────────────────────────────────

_sessions: dict[str, 'Session'] = {}
_lock = threading.Lock()


def get_session(language: str, session_id: str = 'default') -> 'Session':
    key = f'{language}:{session_id}'
    with _lock:
        if key not in _sessions:
            if language == 'python':
                _sessions[key] = PythonSession(key)
            elif language in ('node', 'nodejs', 'javascript', 'js'):
                _sessions[key] = NodeSession(key)
            elif language == 'bash':
                _sessions[key] = BashSession(key)
            else:
                raise ValueError(f'Unsupported language: {language}. Use: python, node, bash')
        return _sessions[key]


def reset_session(language: str, session_id: str = 'default'):
    key = f'{language}:{session_id}'
    with _lock:
        if key in _sessions:
            _sessions[key].destroy()
            del _sessions[key]


def list_sessions() -> list[dict]:
    with _lock:
        return [
            {
                'id': key,
                'language': s.language,
                'created': s.created,
                'execCount': s.exec_count,
            }
            for key, s in _sessions.items()
        ]


# ─── Base Session ─────────────────────────────────────────────────────────────

class Session:
    language: str = ''

    def __init__(self, key: str):
        self.key = key
        self.created = time.time()
        self.exec_count = 0

    def execute(self, code_str: str, timeout: float = 30.0) -> dict:
        raise NotImplementedError

    def destroy(self):
        pass


# ─── Python Session ──────────────────────────────────────────────────────────

class PythonSession(Session):
    language = 'python'

    def __init__(self, key: str):
        super().__init__(key)
        self.namespace: dict = {'__builtins__': __builtins__}
        # Pre-import common modules into namespace
        try:
            exec('import os, sys, json, math, re, datetime, collections, itertools, functools', self.namespace)
        except Exception:
            pass

    def execute(self, code_str: str, timeout: float = 30.0) -> dict:
        self.exec_count += 1
        stdout_capture = io.StringIO()
        stderr_capture = io.StringIO()
        result = {'output': '', 'error': None, 'returnValue': None}

        def run():
            old_stdout, old_stderr = sys.stdout, sys.stderr
            sys.stdout = stdout_capture
            sys.stderr = stderr_capture
            try:
                # Try as expression first (returns a value)
                try:
                    compiled = compile(code_str, '<session>', 'eval')
                    val = eval(compiled, self.namespace)
                    if val is not None:
                        result['returnValue'] = repr(val)
                except SyntaxError:
                    # Fall back to exec (statements, assignments, etc.)
                    exec(code_str, self.namespace)
            except Exception:
                traceback.print_exc(file=stderr_capture)
            finally:
                sys.stdout = old_stdout
                sys.stderr = old_stderr

        thread = threading.Thread(target=run, daemon=True)
        thread.start()
        thread.join(timeout=timeout)

        if thread.is_alive():
            result['error'] = f'Execution timed out after {timeout}s'
        else:
            out = stdout_capture.getvalue()
            err = stderr_capture.getvalue()
            if out:
                result['output'] = out
            if err:
                result['error'] = err

        return result


# ─── Node.js Session ─────────────────────────────────────────────────────────

class NodeSession(Session):
    """Persistent Node.js REPL via child process."""
    language = 'node'

    def __init__(self, key: str):
        super().__init__(key)
        self.proc: subprocess.Popen | None = None
        self.output_queue: queue.Queue = queue.Queue()
        self._start()

    def _start(self):
        # Start Node.js with a wrapper that reads JSON commands from stdin
        # and writes JSON results to stdout. The REPL maintains state via vm.createContext.
        wrapper = r'''
const vm = require('vm');
const readline = require('readline');

const ctx = vm.createContext({
    console: {
        log: (...args) => { _stdout.push(args.map(String).join(' ')); },
        error: (...args) => { _stderr.push(args.map(String).join(' ')); },
        warn: (...args) => { _stderr.push(args.map(String).join(' ')); },
        info: (...args) => { _stdout.push(args.map(String).join(' ')); },
    },
    require, setTimeout, setInterval, clearTimeout, clearInterval,
    Buffer, URL, URLSearchParams, TextEncoder, TextDecoder,
    process: { env: process.env, cwd: process.cwd, argv: process.argv },
    fetch: typeof fetch !== 'undefined' ? fetch : undefined,
});

let _stdout = [], _stderr = [];

const rl = readline.createInterface({ input: process.stdin });
rl.on('line', (line) => {
    _stdout = []; _stderr = [];
    let result = { output: '', error: null, returnValue: null };
    try {
        const val = vm.runInContext(line.replace(/\\n/g, '\n'), ctx, { timeout: 30000 });
        if (val !== undefined) result.returnValue = String(val);
    } catch (e) {
        _stderr.push(e.stack || String(e));
    }
    if (_stdout.length) result.output = _stdout.join('\n');
    if (_stderr.length) result.error = _stderr.join('\n');
    process.stdout.write(JSON.stringify(result) + '\n');
});
'''
        self.proc = subprocess.Popen(
            ['node', '-e', wrapper],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1,  # Line buffered
        )

    def execute(self, code_str: str, timeout: float = 30.0) -> dict:
        self.exec_count += 1

        if not self.proc or self.proc.poll() is not None:
            self._start()

        # Escape newlines so we can send as a single line
        escaped = code_str.replace('\\', '\\\\').replace('\n', '\\n')

        try:
            self.proc.stdin.write(escaped + '\n')
            self.proc.stdin.flush()
        except (BrokenPipeError, OSError):
            self._start()
            self.proc.stdin.write(escaped + '\n')
            self.proc.stdin.flush()

        # Read result with timeout
        def read_line():
            try:
                return self.proc.stdout.readline()
            except Exception:
                return ''

        reader = threading.Thread(target=lambda: self.output_queue.put(read_line()), daemon=True)
        reader.start()

        try:
            line = self.output_queue.get(timeout=timeout)
            if line:
                return json.loads(line.strip())
            return {'output': '', 'error': 'No output from Node.js', 'returnValue': None}
        except queue.Empty:
            return {'output': '', 'error': f'Execution timed out after {timeout}s', 'returnValue': None}

    def destroy(self):
        if self.proc:
            try:
                self.proc.terminate()
                self.proc.wait(timeout=3)
            except Exception:
                try:
                    self.proc.kill()
                except Exception:
                    pass
            self.proc = None


# ─── Bash Session ─────────────────────────────────────────────────────────────

class BashSession(Session):
    """Persistent bash session via child process. Environment persists across calls."""
    language = 'bash'

    def __init__(self, key: str):
        super().__init__(key)
        self.proc: subprocess.Popen | None = None
        self._start()

    def _start(self):
        self.proc = subprocess.Popen(
            ['bash', '--norc', '--noprofile'],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=0,
        )

    def execute(self, code_str: str, timeout: float = 30.0) -> dict:
        self.exec_count += 1

        if not self.proc or self.proc.poll() is not None:
            self._start()

        # Use a unique marker to detect end of output
        marker = f'__EXEC_DONE_{self.exec_count}_{id(self)}__'
        # Wrap command: run it, capture exit code, then echo marker with exit code
        wrapped = f'{code_str}\n__EXIT_CODE=$?\necho "{marker}:$__EXIT_CODE"\necho "{marker}" >&2\n'

        try:
            self.proc.stdin.write(wrapped)
            self.proc.stdin.flush()
        except (BrokenPipeError, OSError):
            self._start()
            self.proc.stdin.write(wrapped)
            self.proc.stdin.flush()

        stdout_lines = []
        stderr_lines = []
        exit_code = 0

        def read_stdout():
            while True:
                line = self.proc.stdout.readline()
                if not line:
                    break
                if line.strip().startswith(marker):
                    parts = line.strip().split(':')
                    if len(parts) >= 2:
                        try:
                            exit_code_str = parts[-1]
                            nonlocal exit_code
                            exit_code = int(exit_code_str)
                        except ValueError:
                            pass
                    break
                stdout_lines.append(line)

        def read_stderr():
            while True:
                line = self.proc.stderr.readline()
                if not line:
                    break
                if marker in line.strip():
                    break
                stderr_lines.append(line)

        t_out = threading.Thread(target=read_stdout, daemon=True)
        t_err = threading.Thread(target=read_stderr, daemon=True)
        t_out.start()
        t_err.start()
        t_out.join(timeout=timeout)
        t_err.join(timeout=min(timeout, 1.0))

        output = ''.join(stdout_lines)
        error = ''.join(stderr_lines)

        result = {'output': output, 'error': error if error else None, 'returnValue': None}
        if exit_code != 0:
            result['error'] = (result['error'] or '') + f'\n(exit code: {exit_code})'

        if t_out.is_alive():
            result['error'] = f'Execution timed out after {timeout}s'

        return result

    def destroy(self):
        if self.proc:
            try:
                self.proc.terminate()
                self.proc.wait(timeout=3)
            except Exception:
                try:
                    self.proc.kill()
                except Exception:
                    pass
            self.proc = None


# ─── HTTP Handler ─────────────────────────────────────────────────────────────

def json_response(handler: BaseHTTPRequestHandler, data: dict, status: int = 200):
    body = json.dumps(data).encode('utf-8')
    handler.send_response(status)
    handler.send_header('Content-Type', 'application/json')
    handler.send_header('Content-Length', str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)


def read_body(handler: BaseHTTPRequestHandler) -> dict:
    length = int(handler.headers.get('Content-Length', 0))
    if length == 0:
        return {}
    raw = handler.rfile.read(length)
    return json.loads(raw)


class InterpreterHandler(BaseHTTPRequestHandler):

    def log_message(self, format, *args):
        pass  # Suppress default logging

    def do_GET(self):
        path = urlparse(self.path).path

        if path == '/health':
            sessions = list_sessions()
            json_response(self, {
                'status': 'ok',
                'activeSessions': len(sessions),
                'sessions': sessions,
            })
            return

        if path == '/sessions':
            json_response(self, {'sessions': list_sessions()})
            return

        json_response(self, {
            'name': 'code-interpreter',
            'port': PORT,
            'languages': ['python', 'node', 'bash'],
            'endpoints': [
                'GET  /health',
                'GET  /sessions',
                'POST /execute',
                'POST /reset',
            ],
        })

    def do_POST(self):
        path = urlparse(self.path).path

        try:
            body = read_body(self)
        except Exception as e:
            json_response(self, {'error': f'invalid JSON: {e}'}, 400)
            return

        try:
            if path == '/execute':
                self._handle_execute(body)
            elif path == '/reset':
                self._handle_reset(body)
            else:
                json_response(self, {'error': f'unknown endpoint: {path}'}, 404)
        except Exception as e:
            traceback.print_exc()
            json_response(self, {'error': str(e)}, 500)

    def _handle_execute(self, body: dict):
        language = body.get('language', 'python')
        code_str = body.get('code')
        session_id = body.get('sessionId', 'default')
        timeout = min(body.get('timeout', 30), 120)

        if not code_str:
            json_response(self, {'error': 'code required'}, 400)
            return

        try:
            session = get_session(language, session_id)
        except ValueError as e:
            json_response(self, {'error': str(e)}, 400)
            return

        result = session.execute(code_str, timeout=timeout)
        result['sessionId'] = f'{language}:{session_id}'
        result['execCount'] = session.exec_count
        json_response(self, result)

    def _handle_reset(self, body: dict):
        language = body.get('language', 'python')
        session_id = body.get('sessionId', 'default')
        reset_session(language, session_id)
        json_response(self, {'reset': True, 'sessionId': f'{language}:{session_id}'})


# ─── Main ─────────────────────────────────────────────────────────────────────

def shutdown_handler(signum, frame):
    with _lock:
        for s in _sessions.values():
            s.destroy()
    sys.exit(0)


if __name__ == '__main__':
    signal.signal(signal.SIGTERM, shutdown_handler)
    signal.signal(signal.SIGINT, shutdown_handler)

    server = HTTPServer(('127.0.0.1', PORT), InterpreterHandler)
    print(f'Code interpreter listening on http://127.0.0.1:{PORT}', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        with _lock:
            for s in _sessions.values():
                s.destroy()
        server.server_close()
