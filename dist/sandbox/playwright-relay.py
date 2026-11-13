#!/usr/bin/env python3
"""
Playwright Relay Server — persistent browser automation inside CF Sandbox.

Maintains a long-lived Patchright browser context with a single page.
Exposes HTTP endpoints on localhost:8222 for the Worker to call via sandbox.exec('curl ...').

Architecture:
  - Patchright drives system Chrome (drop-in playwright API; closes CDC /
    AutomationControlled / runtime-inspection leaks at the protocol layer)
  - OS-level input via xdotool remains separate (undetectable)
  - This relay eliminates per-call WebSocket overhead (was: spawn node → open WS → 1 cmd → exit)

Note: We import from `patchright.sync_api` instead of `playwright.sync_api`.
The API surface is identical (`sync_playwright`, `chromium.launch_persistent_context`,
`page.evaluate`, `context.add_init_script`, etc.) so all our nexus-sense tools
(scan/grab/click/type/screenshot, bippy injection, finder/utils) keep working.
Patchright's value: it patches things our `add_init_script` can't reach
(cdc_* globals, AutomationControlled Blink feature, runtime inspection), which
Chromium sets before any user script runs.
"""

import json
import time
import os
import sys
import signal
import traceback
from collections import deque
import shutil
import tempfile
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from patchright.sync_api import sync_playwright, Browser, BrowserContext, Page

DISPLAY = os.environ.get('DISPLAY', ':99')
# NB_* overrides (2026-11-02): the LOCAL library runs one sandbox per process on its own display/ports/profile; the hosted container
# sets none of these, so it keeps the fixed values.
PORT = int(os.environ.get('NB_RELAY_PORT', '8222'))
CHROMIUM_PATH = os.environ.get('PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH', '/usr/bin/google-chrome-stable')
EXTENSIONS_DIR = '/opt/extensions'
USER_DATA_DIR = os.environ.get('NB_PROFILE_DIR', '/tmp/chrome-profile')

# Global state
_playwright = None
_context: BrowserContext | None = None
_page: Page | None = None


def _find_extensions() -> list[str]:
    """Find unpacked extension directories under EXTENSIONS_DIR."""
    extensions = []
    if os.path.isdir(EXTENSIONS_DIR):
        for name in os.listdir(EXTENSIONS_DIR):
            ext_path = os.path.join(EXTENSIONS_DIR, name)
            # Extension dir must contain a manifest.json
            if os.path.isfile(os.path.join(ext_path, 'manifest.json')):
                extensions.append(ext_path)
    return extensions



# ── Console capture (2026-10-28): console messages, uncaught page errors, failed requests and 4xx/5xx responses, buffered since the
# page was opened (newest last, capped). Served by POST /console; cleared on close. The nexus-browser worker's `console_logs` tool reads it.
_console_buf: deque = deque(maxlen=600)
_console_attached: set = set()
_RANK = {'debug': 0, 'log': 1, 'info': 2, 'warning': 3, 'warn': 3, 'error': 4}


def _console_push(kind: str, level: str, text: str, url: str | None = None):
    _console_buf.append({'t': int(time.time() * 1000), 'kind': kind, 'level': level, 'text': (text or '')[:500], **({'url': url[:200]} if url else {})})


def _attach_console_capture(page):
    key = id(page)
    if key in _console_attached:
        return
    _console_attached.add(key)
    try:
        page.on('console', lambda msg: _console_push('console', msg.type, msg.text, (msg.location or {}).get('url') if isinstance(msg.location, dict) else None))
        page.on('pageerror', lambda err: _console_push('pageerror', 'error', str(getattr(err, 'message', err))))
        page.on('requestfailed', lambda req: _console_push('requestfailed', 'error', str((req.failure or '')), req.url))
        page.on('response', lambda res: _console_push('response', 'error' if res.status >= 500 else 'warning', f'HTTP {res.status}', res.url) if res.status >= 400 else None)
    except Exception:
        traceback.print_exc()

def get_page() -> Page | None:
    return _page


# ── Proxy (2026-10-20, browser MCP residential egress pool) ──────────────────────────
# The context-wide proxy Chrome launches with: {'server': 'socks5://127.0.0.1:1080'} for
# an SSH SOCKS tunnel the sandbox worker opened (/api/proxy/open), or an external
# {'server','username','password'}. Set on /launch; a CHANGE relaunches the context (a
# running Chromium cannot switch proxies); None = direct. /navigate never touches it.
_UNSET = object()
_proxy_cfg: dict | None = None

# ── Incognito (2026-10-25) ───────────────────────────────────────────────────────────
# The default profile (USER_DATA_DIR) PERSISTS across MCP sessions — cookies, localStorage and a restored login survive
# close_session, so a "guest" check was silently signed in. incognito=True relaunches Chrome on a fresh throwaway profile
# directory (no cookies / storage / login), deleted when the browser closes — what an incognito window gives a human.
# A mode change relaunches the context, like a proxy change.
_incognito: bool = False
_incognito_dir: str | None = None


def _proxy_public(cfg: dict | None) -> dict | None:
    if not cfg:
        return None
    return {'server': cfg.get('server'), 'auth': bool(cfg.get('username'))}


def ensure_browser(headless: bool = False, proxy=_UNSET, incognito=_UNSET) -> Page:
    """Launch browser if not running, return the active page.

    Uses launch_persistent_context to support Chrome extensions.
    Extensions are auto-discovered from /opt/extensions/*/manifest.json.
    """
    global _playwright, _context, _page, _proxy_cfg, _incognito

    if incognito is not _UNSET and bool(incognito) != _incognito:
        _incognito = bool(incognito)
        close_browser()   # profile mode change needs a fresh context

    if proxy is not _UNSET:
        new_cfg = proxy or None
        if new_cfg != _proxy_cfg:
            _proxy_cfg = new_cfg
            close_browser()   # a proxy change needs a fresh context

    if _page and not _page.is_closed():
        return _page

    # Clean up stale state
    close_browser()

    extensions = _find_extensions()

    # Chrome flags — minimal. Patchright patches the standard automation tells
    # at the protocol layer (cdc_*, AutomationControlled, runtime inspection),
    # so we don't need elaborate launch args. Anything we'd add via
    # add_init_script that conflicts with what Patchright maintains causes
    # context inconsistencies (e.g., main-page-spoofed but Service Worker
    # showing truth) which CreepJS-style detectors weight heavily.
    args = [
        '--no-sandbox',
        # 2026-10-22: software WebGL instead of --disable-gpu. With --disable-gpu Chrome had NO WebGL at all, so map / 3D
        # pages (MapLibre: "failIfMajorPerformanceCaveat") could not render in the sandbox — and a missing WebGL context
        # is itself a stronger bot tell than a software renderer. ANGLE's SwiftShader backend renders on the CPU.
        '--use-gl=angle',
        '--use-angle=swiftshader',
        '--enable-unsafe-swiftshader',
        '--ignore-gpu-blocklist',
        '--disable-dev-shm-usage',
        '--window-size=1280,800',
        '--window-position=0,0',
        '--disable-features=TranslateUI',
        '--remote-debugging-port=' + os.environ.get('NB_CDP_PORT', '9222'),
    ]

    if extensions:
        args.append('--disable-extensions-except=' + ','.join(extensions))
        args.append('--load-extension=' + ','.join(extensions))

    _playwright = sync_playwright().start()
    global _incognito_dir
    if _incognito:
        _incognito_dir = tempfile.mkdtemp(prefix='chrome-incognito-')
    launch_kwargs = dict(
        user_data_dir=_incognito_dir if _incognito else USER_DATA_DIR,
        executable_path=CHROMIUM_PATH,
        headless=headless,
        viewport={'width': 1280, 'height': 800},
        args=args,
    )
    if _proxy_cfg:
        launch_kwargs['proxy'] = {k: v for k, v in _proxy_cfg.items() if k in ('server', 'username', 'password', 'bypass') and v}
    _context = _playwright.chromium.launch_persistent_context(**launch_kwargs)

    # Stealth fingerprint patches — run BEFORE every page script. PerimeterX,
    # DataDome, Akamai BMP all weight several signals beyond user-agent. The
    # most-watched ones (and our defaults if not patched):
    #   - WebGL renderer string: "Google Inc. (Google) ANGLE" software
    #     rasterizer; real desktops show NVIDIA/AMD/Intel hardware
    #   - Audio context fingerprint: silent baseline; real audio cards have
    #     hardware-specific waveform variance
    #   - navigator.webdriver: true under automation; real users always false
    #   - Chrome runtime: missing under automation; real Chrome has it
    #   - Plugins / mimeTypes: empty under automation; real Chrome has Chromium
    #     PDF Viewer entries
    #   - Permissions API: returns "denied" for notifications under automation
    #     in some configurations
    #
    # add_init_script runs against every page in the context BEFORE any page
    # script — same window scope as page scripts, so fingerprinting can't
    # tell our patches from real browser behavior unless they fingerprint
    # the patches themselves (some sites do — see Patchright/Camoufox for
    # the next layer of polish).
    _context.add_init_script(_STEALTH_INIT_SCRIPT)

    # Persistent context opens a blank page by default — use it
    if _context.pages:
        _page = _context.pages[0]
    else:
        _page = _context.new_page()
    _attach_console_capture(_page)

    return _page


# Stealth init script — minimal, runs via context.add_init_script before
# every page script. Patchright handles the standard automation tells at
# the protocol layer (cdc_*, AutomationControlled, runtime inspection) so
# we don't override Navigator.prototype getters / WebGL renderer / WebGPU
# adapter info — those mods conflict with what Patchright maintains and
# create context inconsistencies (main page vs Service Worker) that make
# detection scores worse rather than better. We keep only patches that:
#   1. Patchright doesn't cover (audio context fingerprint)
#   2. Are observable in main page only (notification permission default)
_STEALTH_INIT_SCRIPT = r"""
(() => {
  // --- Audio context fingerprint: per-session noise ---
  // AudioContext fingerprinting reads back AudioBuffer values after running
  // them through OscillatorNode + DynamicsCompressor. Containers without
  // real audio hardware return identical buffers every session (easy bot
  // tell). Adding ±1e-7 noise to getChannelData reads on the typical
  // 4096-sample probe makes each session produce a unique audio hash.
  try {
    const origGetChannelData = AudioBuffer.prototype.getChannelData;
    AudioBuffer.prototype.getChannelData = function () {
      const data = origGetChannelData.apply(this, arguments);
      if (data.length === 4096) {
        for (let i = 0; i < data.length; i++) {
          data[i] = data[i] + (Math.random() - 0.5) * 1e-7;
        }
      }
      return data;
    };
  } catch {}

  // --- Permissions API: notifications "default" not "denied" ---
  // Headless Chrome can return "denied" for Notification.permission queries;
  // real desktops default to "default" (user hasn't been prompted yet).
  try {
    const origQuery = (typeof navigator !== 'undefined' && navigator.permissions && navigator.permissions.query)
      ? navigator.permissions.query.bind(navigator.permissions) : null;
    if (origQuery) {
      navigator.permissions.query = function (descriptor) {
        if (descriptor && descriptor.name === 'notifications') {
          return Promise.resolve({ state: Notification.permission || 'default', onchange: null });
        }
        return origQuery(descriptor);
      };
    }
  } catch {}
})();
"""


def close_browser():
    _console_buf.clear(); _console_attached.clear()
    """Tear down browser, context, playwright."""
    global _playwright, _context, _page
    try:
        if _page and not _page.is_closed():
            _page.close()
    except Exception:
        pass
    try:
        if _context:
            _context.close()
    except Exception:
        pass
    try:
        if _playwright:
            _playwright.stop()
    except Exception:
        pass
    _page = None
    _context = None
    _playwright = None
    global _incognito_dir
    if _incognito_dir:
        shutil.rmtree(_incognito_dir, ignore_errors=True)   # an incognito profile never outlives its browser
        _incognito_dir = None


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


class RelayHandler(BaseHTTPRequestHandler):
    """HTTP request handler for Playwright relay endpoints."""

    def log_message(self, format, *args):
        # Suppress default logging to stderr
        pass

    def do_GET(self):
        path = urlparse(self.path).path

        if path == '/health':
            page = get_page()
            json_response(self, {
                'status': 'ok',
                'browser_running': page is not None and not page.is_closed(),
                'url': page.url if page and not page.is_closed() else None,
                'proxy': _proxy_public(_proxy_cfg),
            })
            return

        if path == '/screenshot':
            page = get_page()
            if not page or page.is_closed():
                json_response(self, {'error': 'no browser running'}, 400)
                return
            try:
                import base64
                buf = page.screenshot(type='jpeg', quality=80, full_page=False)
                json_response(self, {
                    'screenshot': base64.b64encode(buf).decode('ascii'),
                    'format': 'jpeg',
                })
            except Exception as e:
                json_response(self, {'error': str(e)}, 500)
            return

        json_response(self, {
            'name': 'playwright-relay',
            'endpoints': [
                'GET  /health',
                'GET  /screenshot',
                'POST /launch',
                'POST /navigate',
                'POST /evaluate',
                'POST /cookies/get',
                'POST /cookies/set',
                'POST /wait',
                'POST /close',
                'POST /cdp',
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
            if path == '/launch':
                self._handle_launch(body)
            elif path == '/navigate':
                self._handle_navigate(body)
            elif path == '/evaluate':
                self._handle_evaluate(body)
            elif path == '/console':
                self._handle_console(body)
            elif path == '/cookies/get':
                self._handle_cookies_get(body)
            elif path == '/cookies/set':
                self._handle_cookies_set(body)
            elif path == '/wait':
                self._handle_wait(body)
            elif path == '/close':
                self._handle_close(body)
            elif path == '/cdp':
                self._handle_cdp(body)
            elif path == '/frames':
                self._handle_frames(body)
            elif path == '/mouse':
                self._handle_mouse(body)
            elif path == '/window_offset':
                self._handle_window_offset(body)
            elif path == '/init_script':
                self._handle_init_script(body)
            else:
                json_response(self, {'error': f'unknown endpoint: {path}'}, 404)
        except Exception as e:
            traceback.print_exc()
            json_response(self, {'error': str(e)}, 500)

    def _handle_launch(self, body: dict):
        """Launch browser (or return existing). Optional url to navigate immediately.
        `proxy` (2026-10-20): {'server': 'socks5://127.0.0.1:1080'[, 'username', 'password']} or null → relaunch the context
        when it differs from the current one; absent → keep whatever is running."""
        kw = {}
        if 'proxy' in body:
            kw['proxy'] = body.get('proxy')
        if 'incognito' in body:
            kw['incognito'] = bool(body.get('incognito'))
        page = ensure_browser(headless=False, **kw)
        url = body.get('url')
        if url:
            page.goto(url, wait_until='domcontentloaded', timeout=body.get('timeout', 30000))
        json_response(self, {
            'success': True,
            'url': page.url,
            'title': page.title(),
            'proxy': _proxy_public(_proxy_cfg),
            'incognito': _incognito,
        })

    def _handle_navigate(self, body: dict):
        """Navigate to URL. Reuses existing browser context."""
        url = body.get('url')
        if not url:
            json_response(self, {'error': 'url required'}, 400)
            return

        page = ensure_browser(headless=False)
        wait_until = body.get('waitUntil', 'domcontentloaded')
        timeout = body.get('timeout', 30000)

        page.goto(url, wait_until=wait_until, timeout=timeout)

        import base64
        screenshot = base64.b64encode(
            page.screenshot(type='jpeg', quality=80)
        ).decode('ascii')

        json_response(self, {
            'success': True,
            'url': page.url,
            'title': page.title(),
            'screenshot': screenshot,
            'screenshotFormat': 'jpeg',
        })

    def _handle_console(self, body: dict):
        """Return (and optionally clear) the console/error/network buffer."""
        since = body.get('since') or 0
        limit = max(1, min(int(body.get('limit') or 100), 500))
        min_rank = int(body.get('minRank') or 0)
        entries = [e for e in list(_console_buf) if _RANK.get(e['level'], 1) >= min_rank and e['t'] > since]
        total = len(entries)
        entries = entries[-limit:]
        if body.get('clear'):
            _console_buf.clear()
        json_response(self, {'total': total, 'entries': entries})

    def _handle_evaluate(self, body: dict):
        """Evaluate JavaScript in the page context."""
        script = body.get('script') or body.get('expression')
        if not script:
            json_response(self, {'error': 'script required'}, 400)
            return

        page = get_page()
        if not page or page.is_closed():
            json_response(self, {'error': 'no browser running'}, 400)
            return

        # isolatedContext (2026-10-19): Patchright runs evaluate() in an ISOLATED world by default (its Runtime.enable
        # evasion). That world cannot see page globals (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) or page-set DOM expandos
        # (__reactFiber$…), so React introspection must ask for the MAIN world explicitly. Default stays isolated.
        isolated = body.get('isolatedContext', True)
        # frame (2026-10-20): evaluate inside a CHILD frame — index into page.frames (0 = main) or a URL substring. Consent walls
        # (Sourcepoint) and captcha challenges live in cross-origin iframes; Playwright reaches them through CDP regardless of origin.
        target = page
        fr = body.get('frame')
        if fr is not None and fr != 0 and fr != '':
            frames = page.frames
            if isinstance(fr, int):
                if fr < 0 or fr >= len(frames):
                    json_response(self, {'error': f'frame index {fr} out of range ({len(frames)} frames)'}, 400)
                    return
                target = frames[fr]
            else:
                target = next((f for f in frames if str(fr) in (f.url or '')), None)
                if target is None:
                    json_response(self, {'error': f'no frame with url containing {fr!r}'}, 400)
                    return
        try:
            if target is not page:
                result = target.evaluate(script)
            elif isolated is False:
                try:
                    result = page.evaluate(script, isolated_context=False)
                except TypeError:
                    result = page.evaluate(script)  # plain Playwright (no kwarg): single world anyway
            else:
                result = page.evaluate(script)
            json_response(self, {'result': result})
        except Exception as e:
            json_response(self, {'error': str(e)}, 500)

    def _handle_cookies_get(self, body: dict):
        """Get cookies, optionally filtered by domain."""
        if not _context:
            json_response(self, {'error': 'no browser running'}, 400)
            return

        cookies = _context.cookies()
        domain = body.get('domain', '')
        if domain:
            cookies = [c for c in cookies if domain in c.get('domain', '')]

        json_response(self, {'cookies': cookies, 'count': len(cookies)})

    def _handle_cookies_set(self, body: dict):
        """Set cookies on the browser context."""
        cookies = body.get('cookies', [])
        if not cookies:
            json_response(self, {'error': 'cookies array required'}, 400)
            return

        if not _context:
            json_response(self, {'error': 'no browser running'}, 400)
            return

        _context.add_cookies(cookies)
        json_response(self, {'success': True, 'set': len(cookies)})

    def _handle_wait(self, body: dict):
        """Wait for navigation, selector, or URL pattern."""
        page = get_page()
        if not page or page.is_closed():
            json_response(self, {'error': 'no browser running'}, 400)
            return

        timeout = body.get('timeout', 30000)

        # Wait for selector
        selector = body.get('selector')
        if selector:
            try:
                page.wait_for_selector(selector, timeout=timeout)
                json_response(self, {
                    'resolved': True, 'method': 'selector',
                    'title': page.title(), 'url': page.url,
                })
            except Exception as e:
                json_response(self, {
                    'resolved': False, 'method': 'selector',
                    'error': str(e), 'title': page.title(),
                })
            return

        # Wait for URL pattern
        url_pattern = body.get('urlPattern')
        if url_pattern:
            try:
                page.wait_for_url(url_pattern, timeout=timeout)
                json_response(self, {
                    'resolved': True, 'method': 'urlPattern',
                    'title': page.title(), 'url': page.url,
                })
            except Exception as e:
                json_response(self, {
                    'resolved': False, 'method': 'urlPattern',
                    'error': str(e), 'title': page.title(),
                })
            return

        # Wait for load state
        state = body.get('state', 'networkidle')
        try:
            page.wait_for_load_state(state, timeout=timeout)
            json_response(self, {
                'resolved': True, 'method': 'loadState',
                'title': page.title(), 'url': page.url,
            })
        except Exception as e:
            json_response(self, {
                'resolved': False, 'method': 'loadState',
                'error': str(e), 'title': page.title(),
            })

    def _handle_close(self, body: dict):
        """Close browser and clean up. Also leaves incognito mode, so the next session starts on the default profile."""
        global _incognito
        close_browser()
        _incognito = False
        json_response(self, {'closed': True})

    def _handle_init_script(self, body: dict):
        """Register a script to run BEFORE any page script on every new document in the
        persistent context (Playwright context.add_init_script) — the real pre-load slot the
        worker's evaluateOnNewDocument() needs (React DevTools hook shim, utils, finder).
        applyNow (default true) also evaluates it on the current page so the open page has it.
        Keep such scripts free of navigator/runtime patches: those conflict with Patchright
        (see the launch comment above) and show up in fingerprinting."""
        script = body.get('script')
        if not script or not isinstance(script, str):
            json_response(self, {'error': 'script (string) required'}, 400)
            return
        if _context is None:
            json_response(self, {'error': 'no browser running'}, 400)
            return
        try:
            _context.add_init_script(script=script)
        except Exception as e:
            json_response(self, {'error': 'add_init_script failed: ' + str(e)}, 500)
            return
        applied_now = False
        if body.get('applyNow', True):
            page = get_page()
            if page and not page.is_closed():
                try:
                    page.evaluate(script)
                    applied_now = True
                except Exception:
                    applied_now = False
        json_response(self, {'success': True, 'registered': True, 'appliedNow': applied_now})

    def _handle_frames(self, body: dict):
        """List the page's frames: [{index, url, name, parent}] — index 0 is the main frame (2026-10-20)."""
        page = get_page()
        if not page or page.is_closed():
            json_response(self, {'error': 'no browser running'}, 400)
            return
        out = []
        for i, f in enumerate(page.frames):
            try:
                out.append({'index': i, 'url': (f.url or '')[:300], 'name': f.name or '', 'parent': page.frames.index(f.parent_frame) if f.parent_frame in page.frames else None})
            except Exception:
                out.append({'index': i, 'url': '', 'name': '', 'parent': None})
        json_response(self, {'frames': out})

    def _handle_window_offset(self, body: dict):
        """Page→screen offset for xdotool gestures: the headed window's chrome (tabs/toolbar) sits above the viewport (2026-10-20:
        coordinate clicks through xdotool landed ~131 px too high)."""
        page = get_page()
        if not page or page.is_closed():
            json_response(self, {'error': 'no browser running'}, 400)
            return
        try:
            v = page.evaluate('({ox: Math.round((window.outerWidth - window.innerWidth) / 2), oy: Math.round(window.outerHeight - window.innerHeight), sx: window.screenX || 0, sy: window.screenY || 0, iw: window.innerWidth, ih: window.innerHeight})')
            json_response(self, {'offset': v})
        except Exception as e:
            json_response(self, {'error': str(e)[:300]}, 500)

    def _handle_mouse(self, body: dict):
        """Mouse in PAGE coordinates through Playwright (CDP Input.dispatchMouseEvent) — the right space for everything that is not
        an OS-level hold. action: move | click | down | up; humanLike adds a stepped approach from a random nearby start."""
        page = get_page()
        if not page or page.is_closed():
            json_response(self, {'error': 'no browser running'}, 400)
            return
        action = body.get('action', 'click'); x = body.get('x'); y = body.get('y'); button = body.get('button', 'left')
        try:
            if action in ('move', 'click') and (x is None or y is None):
                json_response(self, {'error': 'x and y required'}, 400)
                return
            if action in ('move', 'click'):
                if body.get('humanLike', True):
                    import random
                    sx = x + random.uniform(-200, 200); sy = y + random.uniform(-160, 160)
                    page.mouse.move(max(0, sx), max(0, sy))
                    time.sleep(random.uniform(0.05, 0.15))
                    page.mouse.move(x, y, steps=int(body.get('steps', 12)))
                    time.sleep(random.uniform(0.04, 0.12))
                else:
                    page.mouse.move(x, y)
            if action == 'click':
                page.mouse.click(x, y, button=button, click_count=int(body.get('clickCount', 1)), delay=int(body.get('delay', 40)))
            elif action == 'down':
                page.mouse.down(button=button)
            elif action == 'up':
                page.mouse.up(button=button)
            elif action != 'move':
                json_response(self, {'error': f'unknown action {action!r}'}, 400)
                return
            json_response(self, {'success': True, 'action': action, 'x': x, 'y': y})
        except Exception as e:
            json_response(self, {'error': str(e)[:300]}, 500)

    def _handle_cdp(self, body: dict):
        """Execute a raw CDP command via Playwright's CDP session."""
        method = body.get('method')
        params = body.get('params', {})
        if not method:
            json_response(self, {'error': 'method required'}, 400)
            return

        page = get_page()
        if not page or page.is_closed():
            json_response(self, {'error': 'no browser running'}, 400)
            return

        try:
            cdp = _context.new_cdp_session(page)
            result = cdp.send(method, params)
            cdp.detach()
            json_response(self, result if isinstance(result, dict) else {'result': result})
        except Exception as e:
            json_response(self, {'error': str(e)}, 500)


def shutdown_handler(signum, frame):
    close_browser()
    sys.exit(0)


def _start_owner_watch():
    """LOCAL library only (NB_OWNER_PID set; the hosted container never sets it): when the process that owns this sandbox dies, take the
    sandbox down with it — this Chrome (its profile), Xvfb, the interpreter and live view on this display — then exit. 2026-11-03: a
    browse delegate killed at its time limit left relay + Chrome + Xvfb running on :99; the next delegate's Chrome could not take the
    shared profile and every browse hit the 60 s MCP timeout."""
    try:
        owner = int(os.environ.get('NB_OWNER_PID', '0') or 0)
    except ValueError:
        owner = 0
    if owner <= 0:
        return
    import threading, subprocess
    disp = DISPLAY.lstrip(':') or '99'
    def _alive(pid):
        try:
            os.kill(pid, 0)
            return True
        except PermissionError:
            return True
        except OSError:
            return False
    def _watch():
        while _alive(owner):
            time.sleep(2)
        for pat in (f'--user-data-dir={USER_DATA_DIR}( |$)', f'code-interpreter.py --nb-display={disp}', f'Xvfb :{disp} ', f'x11vnc -display :{disp} '):
            try:
                subprocess.run(['pkill', '-KILL', '-f', pat], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=5)
            except Exception:
                pass
        os._exit(0)
    threading.Thread(target=_watch, daemon=True).start()


if __name__ == '__main__':
    signal.signal(signal.SIGTERM, shutdown_handler)
    signal.signal(signal.SIGINT, shutdown_handler)
    _start_owner_watch()

    server = HTTPServer(('127.0.0.1', PORT), RelayHandler)
    print(f'Playwright relay listening on http://127.0.0.1:{PORT}', flush=True)
    # 2026-10-21 (operator-directed sandbox diagnosis via run_command + py-spy): the sync Playwright API only pumps the
    # driver's messages while a relay call is running. Patchright implements init scripts by ROUTING requests, and each
    # routed request waits for this process to answer — so between calls the page's network stalled (a busy SPA could not
    # finish loading for minutes), and the next call first drained the backlog at 100% CPU and timed out. Pump the event
    # loop whenever the server is idle: handle one request at a time with a 50 ms timeout, and spend each idle tick in a
    # 1 ms Playwright wait so routes and events are processed as they arrive.
    server.timeout = 0.05
    def _pump():
        page = _page
        if page is not None:
            try:
                if not page.is_closed():
                    page.wait_for_timeout(1)
            except Exception:
                pass
    server.handle_timeout = _pump
    try:
        while True:
            server.handle_request()
    except KeyboardInterrupt:
        pass
    finally:
        close_browser()
        server.server_close()
