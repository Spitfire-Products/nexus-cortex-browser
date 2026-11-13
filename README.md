# @nexus-cortex/browser — the nexus-browser tools, on your own machine

The same browser tools as the hosted nexus-browser MCP (`browse`, `scan`, `grab`, `click`, `type`, `get_content`, `fill_form`,
`extract_table`, `screenshot` and the rest, about 50 in all), running locally: headless Chromium by default, plus a real headful Chrome
("sandbox" backend) on Linux for challenge pages, incognito sessions and live view. Same tools, same parameters, same results, because
it is built from the same code as the hosted service.

Part of [nexus-cortex](https://www.npmjs.com/package/nexus-cortex). Dual-licensed AGPL-3.0-only or commercial (see License).

## Same tools as the hosted browser

The package is built from the hosted service's own tool code, with only the cloud-specific pieces swapped for local ones: a local
Chromium instead of the cloud browser, local files instead of cloud storage for saved logins and workflows, and another local Chrome
instead of the cloud sandbox. A tool behaves the same whether the agent uses the hosted browser or this package, and switching between
them changes nothing in how the agent works.

## Install

With nexus-cortex (recommended):

```bash
cortex browser install          # installs this package and everything it needs, then switches the harness to it
# or, together with everything else:
cortex update --browser
```

After that, a plain `cortex update` keeps it up to date along with nexus-cortex. Check it any time:

```bash
cortex browser status           # which browser the harness uses, plus a checklist of what this machine has
cortex browser use hosted       # switch back to the hosted browser MCP (use local to switch again)
```

Manual install, for any MCP host such as Claude Code:

```bash
npm install -g @nexus-cortex/browser               # Node 22.13 or newer
nexus-browser-doctor --install                     # installs Chrome (Chrome for Testing if none) and the optional pieces
claude mcp add nexus-browser-local -- nexus-browser-local
```

In code: `import { createLocalBrowserMCP } from '@nexus-cortex/browser'` returns `{ server, close }`; connect `server` to any MCP
transport. The installer is exported too: `checkAll()`, `installPlan()`, `installAll({ interactive })`, `readInstallState()`.

The shipped `browser` skill (in nexus-cortex) teaches the agent how to use the tools: scan before acting, reading with `grab`, forms,
challenges and closing sessions.

**What a machine needs** (`nexus-browser-doctor` shows it; `--install` installs it):
- default backend (all 50 tools on headless Chromium): Node ≥ 22.13 + Chrome/Chromium.
- sandbox backend (`browse({ backend: "sandbox" })` — real headful Chrome, OS-level input for challenges, live view, interpreters):
  Linux with python3, **Xvfb (always — the sandbox runs its own display :99, whatever $DISPLAY says)**, xdotool, x11vnc; the Python
  packages go into a private venv under `~/.nexus-cortex/browser/venv`, never the system Python. macOS/Windows: default backend only.
  Missing Xvfb → a startup warning and an install hint on the "no X server" launch error.

**Paths:** tools home `NEXUS_BROWSER_HOME` (default `~/.nexus-cortex/browser`: venv, extensions, Chrome for Testing, Nix GC roots, a
`chromium` link, and `install.json` — the installer's record: Chrome path, extra tool PATH, readiness; read by the library and the
harness); state `NEXUS_BROWSER_DATA_DIR` (default the same). Chrome: `NEXUS_BROWSER_CHROMIUM`, else the installed one, else known
paths, else PATH. Extra tool dirs: `NEXUS_BROWSER_EXTRA_PATH` (merged with `install.json`).

**stdout is protocol only:** `src/stdio-guard.ts` (imported first) sends every console channel to stderr — a log line from the bundled
code or from nexus-cortex core corrupts the MCP stream otherwise.

**Secrets / proxies:** helper keys (Jev / Mercury / Gemma) come from options → env → the nexus-cortex vault; `set_proxy` resolves
`«secret:NAME»` for secrets bound `--tool nexus-browser`; external proxies are allowed locally (`NEXUS_BROWSER_PROXY=deny` turns them off).
See `omniclaude-v4/docs/secrets.md` and `docs/browser.md`.

## Desktop control

The `desktop` tool (whole screen, mouse and keyboard) is its own package now: **[@nexus-cortex/desktop](https://www.npmjs.com/package/@nexus-cortex/desktop)**.
Install it with `cortex desktop install`.

## Safety defaults
- The local sandbox server binds **127.0.0.1** on a random port and requires a random per-run token; live-view links are signed and expire.
- `run_command` / `run_code` execute on the user's machine, so they are **off** unless `NEXUS_BROWSER_ALLOW_EXEC=1` (or `allowExec: true`).
- websockify / x11vnc listen on loopback only (the container's `0.0.0.0` is rewritten); their ports are chosen free at startup.
- Banked workflows, saved logins and console data stay in the user's data dir — nothing is sent to our services.

## Validation

Each release is checked against real pages: the core checks, the sandbox backend (real Chrome on a virtual display, OS-level clicks,
incognito, live view, `run_command` / `run_code`), every tool once, hosted-versus-local parity (same tools, schemas and results), and the
Turnstile challenge flow.

## Local vs hosted
Everything runs locally. Differences: residential proxy pool (hosted SSH hosts) → bring your own proxy; captcha *image* solving needs your
own decision-model key (as hosted); the Turnstile click flow is verified (a real AuthKit Turnstile cleared), a full sign-in end to end not yet.

## License

Dual-licensed: **GNU AGPL-3.0-only** ([LICENSE](LICENSE)) **or** a **commercial license** from Spitfire Products
([LICENSE-COMMERCIAL.md](LICENSE-COMMERCIAL.md); sales@spitfire-products.com). Running it unmodified on your own machines, including at work, is free under the
AGPL. Offering a modified version to others over a network requires publishing that version's source under the AGPL, or a
commercial license. Bundled third-party code keeps its own (permissive) licenses: [NOTICE](NOTICE) and `dist/THIRD_PARTY_NOTICES.md`.
Contributions require a contributor license agreement (see LICENSE-COMMERCIAL.md).
