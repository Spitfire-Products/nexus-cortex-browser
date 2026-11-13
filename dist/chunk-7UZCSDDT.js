// Built 2026-11-13T20:58:13.908Z from nexus-terminal/workers/nexus-browser/src/mcp.ts — do not edit; rebuild.
import { createRequire as __cr } from 'node:module'; const require = __cr(import.meta.url);
import {
  extraPath,
  findChromium
} from "./chunk-MLM4U3D5.js";
import {
  McpServer
} from "./chunk-LIOMVPKD.js";
import {
  external_exports,
  registerDesktopTool
} from "./chunk-CMAQKRK5.js";

// src/local.ts
import fs4 from "node:fs";
import os2 from "node:os";
import path5 from "node:path";
import { fileURLToPath } from "node:url";

// src/shims/agents-mcp.ts
var McpAgent = class {
  static options = {};
  env;
  ctx;
  initialState;
  _state;
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
  }
  get state() {
    return this._state ?? this.initialState;
  }
  setState(s) {
    this._state = s;
  }
};

// src/shims/cf-puppeteer.ts
import puppeteer from "puppeteer-core";
var live = /* @__PURE__ */ new Map();
var seq = 0;
var localLaunchOptions = {};
async function launch(_binding, _opts) {
  const executablePath = localLaunchOptions.executablePath || findChromium();
  if (!executablePath) throw new Error("No Chromium/Chrome found. Install one, or set NEXUS_BROWSER_CHROMIUM to its path.");
  const browser = await puppeteer.launch({
    executablePath,
    headless: localLaunchOptions.headless ?? true,
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--use-gl=swiftshader", "--enable-unsafe-swiftshader", ...localLaunchOptions.args ?? []],
    defaultViewport: localLaunchOptions.viewport ?? { width: 1280, height: 800 }
  });
  const id = `local-${process.pid}-${++seq}`;
  browser.sessionId = () => id;
  live.set(id, browser);
  browser.on("disconnected", () => live.delete(id));
  return browser;
}
async function connect(_binding, sessionId) {
  const b = live.get(sessionId);
  if (!b || !b.connected) throw new Error(`No local browser session ${sessionId}`);
  return b;
}
async function sessions(_binding) {
  return [...live.keys()].map((sessionId) => ({ sessionId, startTime: Date.now() }));
}
async function closeAll() {
  await Promise.all([...live.values()].map((b) => b.close().catch(() => {
  })));
  live.clear();
}
var cf_puppeteer_default = { launch, connect, sessions, closeAll };

// ../../../nexus-terminal/workers/nexus-browser/src/live.ts
var enc = new TextEncoder();
async function hmacHex(secret, msg) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(msg));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function signLive(secret, sessionId, expiresAt) {
  return hmacHex(secret, `live:${sessionId}:${expiresAt}`);
}
async function verifyLive(secret, sessionId, expiresAt, sig) {
  if (!sessionId || !sig || !Number.isFinite(expiresAt) || expiresAt < Date.now()) return false;
  const expected = await hmacHex(secret, `live:${sessionId}:${expiresAt}`);
  if (expected.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  return diff === 0;
}

// ../../../nexus-terminal/workers/nexus-browser/src/sandbox-page.ts
var SandboxElementHandle = class {
  constructor(sbxPage, selector) {
    this.sbxPage = sbxPage;
    this.selector = selector;
  }
  async boundingBox() {
    return this.sbxPage.evaluate(`(function() {
      var el = document.querySelector(${JSON.stringify(this.selector)});
      if (!el) return null;
      var r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    })()`);
  }
  async click() {
    const box = await this.boundingBox();
    if (box) {
      await this.sbxPage.mouse.click(
        box.x + box.width / 2,
        box.y + box.height / 2
      );
    }
  }
  /** Screenshot a specific element by clipping to its bounding box via CDP */
  async screenshot(opts) {
    const box = await this.boundingBox();
    if (!box) return "";
    return this.sbxPage.screenshot({
      ...opts,
      clip: { x: box.x, y: box.y, width: box.width, height: box.height, scale: 1 }
    });
  }
};
function cdpKeyDef(key) {
  const named = {
    Enter: ["Enter", 13, "\r"],
    Tab: ["Tab", 9],
    Escape: ["Escape", 27],
    Backspace: ["Backspace", 8],
    Delete: ["Delete", 46],
    ArrowUp: ["ArrowUp", 38],
    ArrowDown: ["ArrowDown", 40],
    ArrowLeft: ["ArrowLeft", 37],
    ArrowRight: ["ArrowRight", 39],
    Home: ["Home", 36],
    End: ["End", 35],
    PageUp: ["PageUp", 33],
    PageDown: ["PageDown", 34],
    " ": ["Space", 32, " "],
    Control: ["ControlLeft", 17, void 0, 2],
    Shift: ["ShiftLeft", 16, void 0, 8],
    Alt: ["AltLeft", 18, void 0, 1],
    Meta: ["MetaLeft", 91, void 0, 4]
  };
  const n = named[key];
  if (n) return { key, code: n[0], vk: n[1], ...n[2] ? { text: n[2] } : {}, ...n[3] ? { mod: n[3] } : {} };
  if (/^[a-zA-Z]$/.test(key)) return { key, code: "Key" + key.toUpperCase(), vk: key.toUpperCase().charCodeAt(0), text: key };
  if (/^[0-9]$/.test(key)) return { key, code: "Digit" + key, vk: key.charCodeAt(0), text: key };
  return null;
}
function imageWidth(b642) {
  try {
    const head = atob(b642.slice(0, 4e4));
    const at = (i) => head.charCodeAt(i);
    if (at(0) === 137 && at(1) === 80) return (at(16) << 24 | at(17) << 16 | at(18) << 8 | at(19)) >>> 0;
    for (let i = 2; i + 9 < head.length; ) {
      if (at(i) !== 255) return 0;
      const mk = at(i + 1), len = at(i + 2) << 8 | at(i + 3);
      if (mk >= 192 && mk <= 194) return at(i + 7) << 8 | at(i + 8);
      i += 2 + len;
    }
  } catch {
  }
  return 0;
}
var X_KEYSYMS = {
  Control: "Control_L",
  Shift: "Shift_L",
  Alt: "Alt_L",
  Meta: "Super_L",
  Enter: "Return",
  Backspace: "BackSpace",
  Escape: "Escape",
  ArrowUp: "Up",
  ArrowDown: "Down",
  ArrowLeft: "Left",
  ArrowRight: "Right",
  PageUp: "Prior",
  PageDown: "Next",
  Delete: "Delete",
  Home: "Home",
  End: "End",
  Tab: "Tab",
  " ": "space"
};
function xKeysym(key) {
  const k = X_KEYSYMS[key] ?? key;
  return /^[A-Za-z0-9_]+$/.test(k) ? k : "VoidSymbol";
}
var SandboxPage = class {
  baseUrl;
  authToken;
  sessionId;
  isSetup = false;
  _url = "";
  _title = "";
  _mainFrame;
  mouse;
  keyboard;
  constructor(baseUrl, authToken, sessionId) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.authToken = authToken;
    this.sessionId = sessionId || crypto.randomUUID();
    this._mainFrame = new SandboxFrame(this);
    const self = this;
    this.mouse = {
      // PAGE coordinates through the relay's Playwright mouse (2026-10-20; xdotool is screen space and missed by the window chrome)
      async click(x, y, opts) {
        await self.api("/api/click", { x: Math.round(x), y: Math.round(y), humanLike: true, postClickWaitMs: 200, button: opts?.button || "left", clickCount: opts?.clickCount || 1 });
      },
      async move(x, y, opts) {
        await self.api("/api/mouse", { action: "move", x: Math.round(x), y: Math.round(y), humanLike: false, steps: opts?.steps || 1 });
      },
      async down(opts) {
        await self.api("/api/mouse", { action: "down", button: opts?.button || "left" });
      },
      async up(opts) {
        await self.api("/api/mouse", { action: "up", button: opts?.button || "left" });
      },
      async pressAndHold(x, y, opts) {
        const resp = await self.api("/api/press_and_hold", {
          x: Math.round(x),
          y: Math.round(y),
          holdMs: opts?.holdMs ?? 3500,
          jitterPx: opts?.jitterPx ?? 2,
          humanLikeApproach: opts?.humanLikeApproach !== false
        });
        return {
          actualHoldMs: resp?.actualHoldMs ?? 0,
          stepCount: resp?.stepCount ?? 0
        };
      }
    };
    this.keyboard = {
      async type(text, opts) {
        await self.api("/api/type", { text, delayMs: opts?.delay ?? 80 });
      },
      async press(key) {
        if (await self.cdpKey("down", key) && await self.cdpKey("up", key)) return;
        const keyMap = {
          Enter: "Return",
          Tab: "Tab",
          Escape: "Escape",
          Backspace: "BackSpace",
          ArrowUp: "Up",
          ArrowDown: "Down",
          ArrowLeft: "Left",
          ArrowRight: "Right",
          Delete: "Delete",
          Home: "Home",
          End: "End",
          PageUp: "Prior",
          PageDown: "Next"
        };
        const k = keyMap[key] || X_KEYSYMS[key] || key;
        if (!/^[A-Za-z0-9_+]{1,40}$/.test(k) && key.length === 1) {
          await self.api("/api/type", { text: key, delayMs: 0 });
          return;
        }
        await self.api("/api/press", { key: k });
      },
      // Puppeteer key names → X keysyms (2026-11-02: `xdotool keydown Control` is not a keysym, so every Ctrl/Shift/Alt combination —
      // ctrl+a select-all before a clear, shortcuts — silently did nothing on the sandbox).
      async down(key) {
        if (await self.cdpKey("down", key)) return;
        const r = await self.api("/api/keydown", { key: xKeysym(key) }).catch(() => null);
        if (!r?.success) await self.api("/api/exec", { command: `xdotool keydown ${xKeysym(key)}` });
      },
      async up(key) {
        if (await self.cdpKey("up", key)) return;
        const r = await self.api("/api/keyup", { key: xKeysym(key) }).catch(() => null);
        if (!r?.success) await self.api("/api/exec", { command: `xdotool keyup ${xKeysym(key)}` });
      }
    };
  }
  // ─── REST API helper ─────────────────────────────────────────────────────
  async api(path6, body) {
    const resp = await fetch(`${this.baseUrl}${path6}`, {
      method: body !== void 0 ? "POST" : "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.authToken}`,
        "X-Sandbox-Session": this.sessionId
      },
      ...body !== void 0 ? { body: JSON.stringify(body) } : {}
    });
    const ct = resp.headers.get("content-type") || "";
    if (!ct.includes("application/json")) {
      const text = await resp.text();
      throw new Error(`Sandbox returned non-JSON (${resp.status}): ${text.slice(0, 200)}`);
    }
    const j = await resp.json();
    if (j && typeof j.url === "string" && /^https?:/.test(j.url) && path6 !== "/api/frames") this._url = j.url;
    return j;
  }
  // ─── Setup (install Chrome + Xvfb) ────────────────────────────────────
  async setup() {
    if (this.isSetup) return;
    await this.api("/api/setup", {});
    this.isSetup = true;
  }
  // ─── Residential egress pool (2026-10-20) ──────────────────────────────
  /** Open an `ssh -N -D` SOCKS tunnel in the container to a pool host. Resolves {open, server, localPort} or {open:false, error, log}. */
  async openProxy(args) {
    await this.setup();
    return this.api("/api/proxy/open", args);
  }
  /** (Re)launch the Chrome context through `proxy` (null = direct). A proxy CHANGE relaunches the context (cookies/pages reset). */
  async launchWithProxy(proxy, incognito) {
    await this.setup();
    return this.api("/api/launch", typeof incognito === "boolean" ? { proxy, incognito } : { proxy });
  }
  async closeProxy(localPort) {
    return this.api("/api/proxy/close", localPort ? { localPort } : {});
  }
  async proxyStatus() {
    return this.api("/api/proxy/status");
  }
  // ─── Navigate ────────────────────────────────────────────────────────────
  async goto(url, opts) {
    await this.setup();
    await this.api("/api/browse", { url, waitUntil: opts?.waitUntil ?? "domcontentloaded", timeout: opts?.timeout ?? 3e4 });
    this._url = url;
    try {
      this._title = await this.evaluate("document.title") || "";
    } catch {
      this._title = "";
    }
  }
  // ─── Solve Turnstile ────────────────────────────────────────────────────
  async solveTurnstile(url) {
    await this.setup();
    for (let i = 0; i < 3; i++) {
      const status = await this.api("/api/status");
      if (status?.xvfb === "running" && status?.relay?.status === "ok") break;
      await new Promise((r) => setTimeout(r, 2e3));
    }
    const result = await this.api("/api/solve_turnstile", { url, waitBeforeClickMs: 6e3, waitAfterClickMs: 1e4 });
    try {
      await this.evaluate("1+1");
    } catch {
      await new Promise((r) => setTimeout(r, 5e3));
      try {
        await this.evaluate("1+1");
      } catch {
      }
    }
    let challengePassed = result?.challengePassed ?? false;
    const maxVerifyAttempts = 12;
    for (let v = 0; v < maxVerifyAttempts; v++) {
      try {
        const title = await this.evaluate("document.title");
        const isChallengePage = typeof title === "string" && (title.includes("Just a moment") || title.includes("Attention Required") || title.includes("Security Check") || title === "");
        if (!isChallengePage && title) {
          challengePassed = true;
          this._title = title;
          break;
        }
      } catch {
      }
      if (v === 5 && !challengePassed) {
        try {
          await this.api("/api/solve_turnstile", { url, waitBeforeClickMs: 3e3, waitAfterClickMs: 5e3 });
          await new Promise((r) => setTimeout(r, 3e3));
          try {
            await this.evaluate("1+1");
          } catch {
          }
        } catch {
        }
      }
      await new Promise((r) => setTimeout(r, 2e3));
    }
    try {
      this._url = await this.evaluate("window.location.href") || url;
    } catch {
      this._url = url;
    }
    return { ...result, challengePassed };
  }
  // ─── Evaluate JS in the sandbox Chrome via CDP ──────────────────────────
  async evaluate(scriptOrFn, ...args) {
    let script;
    if (typeof scriptOrFn === "function") {
      const argsStr = args.map((a) => JSON.stringify(a)).join(", ");
      script = `(${scriptOrFn.toString()})(${argsStr})`;
    } else {
      script = scriptOrFn;
    }
    return this._evaluateRaw(script, true);
  }
  // Main-world evaluate (2026-10-19). Patchright's default world is ISOLATED: it cannot see page globals
  // (window.__REACT_DEVTOOLS_GLOBAL_HOOK__, window.__nexusBippyLite as pre-loaded by /init_script) nor the
  // __reactFiber$ expandos React sets on DOM nodes. React introspection must run here; everything else stays
  // isolated for stealth. Puppeteer has one world, so the worker only routes through this on the sandbox.
  async evaluateMain(script) {
    return this._evaluateRaw(script, false);
  }
  async _evaluateRaw(script, isolatedContext) {
    const maxRetries = 5;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const result = await this.api("/api/evaluate", { script, timeout: 3e4, ...isolatedContext ? {} : { isolatedContext: false } });
      if (result.error) {
        const isCdpUnavailable = result.error.includes("ECONNREFUSED") || result.error.includes("CDP unavailable") || result.error.includes("no page tab");
        if (isCdpUnavailable && attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, Math.min(3e3 + attempt * 3e3, 15e3)));
          continue;
        }
        throw new Error(`Sandbox evaluate error: ${result.error}`);
      }
      return result.result ?? null;
    }
    throw new Error("Sandbox evaluate: max retries exceeded");
  }
  // ─── evaluateOnNewDocument ─────────────────────────────────────────────
  // Parity with Puppeteer (2026-10-19): the relay's /api/init_script registers the
  // script with Playwright's context.add_init_script, so it runs BEFORE any page
  // script on every subsequent navigation (what the React hook shim needs). The relay
  // also evaluates it on the current page (applyNow) so the page we are on gets it too.
  // If the relay predates the endpoint, fall back to the old immediate evaluate.
  async evaluateOnNewDocument(fn) {
    const script = typeof fn === "function" ? `(${fn.toString()})()` : String(fn);
    try {
      const r = await this.api("/api/init_script", { script, applyNow: true });
      if (r && r.success) return;
    } catch {
    }
    try {
      await this.evaluate(script);
    } catch {
    }
  }
  // ─── Page info ───────────────────────────────────────────────────────────
  url() {
    return this._url;
  }
  /** Re-read location.href from the live page (url() is a synchronous cache; clicks and form posts navigate without telling us). */
  async syncUrl() {
    try {
      const u = await this.evaluate("location.href");
      if (typeof u === "string" && u) this._url = u;
    } catch {
    }
    return this._url;
  }
  async title() {
    try {
      const r = await this.evaluate("[document.title, location.href]");
      if (Array.isArray(r)) {
        this._title = r[0] || this._title;
        if (typeof r[1] === "string" && r[1]) this._url = r[1];
      }
    } catch {
    }
    return this._title;
  }
  // ─── Element selection ───────────────────────────────────────────────────
  async $(selector) {
    const exists = await this.evaluate(
      `!!document.querySelector(${JSON.stringify(selector)})`
    );
    return exists ? new SandboxElementHandle(this, selector) : null;
  }
  /** A real mouse-wheel event at PAGE coordinates (CDP Input.dispatchMouseEvent) — scrolls whatever is under the pointer, inner
   *  scrollers included. 2026-11-01 A/B: computer_use scroll on the sandbox used a script that left inner panels (cars.com filters,
   *  CarMax make list) and some pages unmoved. */
  async wheel(x, y, deltaX, deltaY) {
    await this.api("/api/cdp", { method: "Input.dispatchMouseEvent", params: { type: "mouseWheel", x, y, deltaX, deltaY }, timeout: 1e4 });
  }
  /** Held modifiers for CDP key events (bitmask: Alt 1, Ctrl 2, Meta 4, Shift 8). */
  _mods = 0;
  /** One key down/up through CDP Input.dispatchKeyEvent — what Puppeteer does. 2026-11-02: X-level keys (xdotool) reach the page only
   *  after a real click has put keyboard focus in the content, so keypress PageDown / ctrl+a after a navigation did nothing. These events
   *  are trusted (isTrusted) and run the browser's default actions (select-all, scroll, submit). Returns false when CDP is unavailable. */
  async cdpKey(phase, key) {
    const d = cdpKeyDef(key);
    if (!d) return false;
    if (d.mod) this._mods = phase === "down" ? this._mods | d.mod : this._mods & ~d.mod;
    const params = {
      type: phase === "down" ? d.text && !(this._mods & 7) ? "keyDown" : "rawKeyDown" : "keyUp",
      key: d.key,
      code: d.code,
      windowsVirtualKeyCode: d.vk,
      nativeVirtualKeyCode: d.vk,
      modifiers: this._mods
    };
    if (phase === "down" && d.text && !(this._mods & 7)) {
      params.text = d.text;
      params.unmodifiedText = d.text;
    }
    try {
      const r = await this.api("/api/cdp", { method: "Input.dispatchKeyEvent", params, timeout: 8e3 });
      return !r?.error;
    } catch {
      return false;
    }
  }
  _dpr = null;
  /** The page's devicePixelRatio (≈1.047 on Xvfb Chrome). A page evaluate right after a navigation can fail while Patchright recreates
   *  its isolated world — that silently fell back to 1 and the next capture came out 1340×838 (2026-11-02). Order: page evaluate (retried),
   *  then CDP Runtime.evaluate (main world), then the last good value. */
  async devicePixelRatio() {
    for (let i = 0; i < 2; i++) {
      try {
        const r = Number(await this.evaluate("window.devicePixelRatio || 1"));
        if (r > 0) {
          this._dpr = r;
          return r;
        }
      } catch {
      }
      await new Promise((z) => setTimeout(z, 150));
    }
    try {
      const m = await this.api("/api/cdp", { method: "Runtime.evaluate", params: { expression: "window.devicePixelRatio", returnByValue: true }, timeout: 8e3 });
      const v = Number(m?.result?.value ?? m?.value);
      if (v > 0) {
        this._dpr = v;
        return v;
      }
    } catch {
    }
    return this._dpr ?? 1;
  }
  // ─── Screenshot ──────────────────────────────────────────────────────────
  // Uses CDP Page.captureScreenshot for format/quality/clip parity with Puppeteer.
  // Falls back to ImageMagick (/api/screenshot/json) if CDP fails.
  async screenshot(opts) {
    try {
      const cdpParams = {};
      if (opts?.type === "png") {
        cdpParams.format = "png";
      } else {
        cdpParams.format = "jpeg";
        cdpParams.quality = opts?.quality ?? 80;
      }
      const dpr = await this.devicePixelRatio();
      if (opts?.clip) {
        cdpParams.clip = {
          x: opts.clip.x,
          y: opts.clip.y,
          width: opts.clip.width,
          height: opts.clip.height,
          scale: (opts.clip.scale ?? 1) / dpr
        };
      }
      if (opts?.captureBeyondViewport || opts?.fullPage) {
        cdpParams.captureBeyondViewport = true;
      } else if (!opts?.clip) {
        try {
          let v = await this.evaluate("({w: window.innerWidth, h: window.innerHeight})");
          if (typeof v === "string") {
            try {
              v = JSON.parse(v);
            } catch {
              v = null;
            }
          }
          if (!v?.w) {
            const w = Number(await this.evaluate("window.innerWidth")), h = Number(await this.evaluate("window.innerHeight"));
            if (w && h) v = { w, h };
          }
          if (v?.w && v?.h) cdpParams.clip = { x: 0, y: 0, width: v.w, height: v.h, scale: 1 / dpr };
        } catch {
        }
      }
      const result2 = await this.api("/api/cdp", {
        method: "Page.captureScreenshot",
        params: cdpParams,
        timeout: 15e3
      });
      if (result2?.data) {
        const clip = cdpParams.clip;
        if (clip && opts?.clip) {
          const want = Math.round(opts.clip.width * (opts.clip.scale ?? 1));
          const got = imageWidth(result2.data);
          if (got && want && Math.abs(got - want) > 2) {
            const factor = want / got;
            clip.scale = clip.scale * factor;
            this._dpr = (this._dpr ?? dpr) / factor;
            const again = await this.api("/api/cdp", { method: "Page.captureScreenshot", params: cdpParams, timeout: 15e3 });
            if (again?.data) return again.data;
          }
        }
        return result2.data;
      }
    } catch {
    }
    const result = await this.api("/api/screenshot/json");
    return result.screenshot || "";
  }
  // ─── Cookies ─────────────────────────────────────────────────────────────
  async cookies() {
    const result = await this.api("/api/extract_cookies", {});
    return result.cookies || [];
  }
  async setCookie(...cookies) {
    await this.api("/api/set_cookies", { cookies });
  }
  // ─── Frames ──────────────────────────────────────────────────────────────
  _frames = null;
  /** Synchronous view (puppeteer-shaped): the main frame plus any child frames fetched by refreshFrames(). */
  frames() {
    return this._frames && this._frames.length ? this._frames : [this._mainFrame];
  }
  /** Fetch the live frame list from the relay (2026-10-20). Index 0 = main; children evaluate through `frame`. */
  async refreshFrames() {
    try {
      const r = await this.api("/api/frames");
      const list = r?.frames || [];
      this._frames = list.map((f) => f.index === 0 ? this._mainFrame : new SandboxFrame(this, f.index, f.url, f.name));
    } catch {
      this._frames = null;
    }
    return this.frames();
  }
  mainFrame() {
    return this._mainFrame;
  }
  // ─── Wait methods (polling-based) ────────────────────────────────────────
  async waitForSelector(selector, opts) {
    const timeout = opts?.timeout ?? 1e4;
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const found = await this.evaluate(
        `!!document.querySelector(${JSON.stringify(selector)})`
      );
      if (found) return;
      await new Promise((r) => setTimeout(r, 500));
    }
    throw new Error(`waitForSelector timed out: ${selector}`);
  }
  async waitForFunction(fn, opts) {
    const timeout = opts?.timeout ?? 1e4;
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const result = await this.evaluate(fn);
      if (result) return;
      await new Promise((r) => setTimeout(r, 500));
    }
    throw new Error(`waitForFunction timed out`);
  }
  async waitForNavigation(opts) {
    const timeout = opts?.timeout ?? 1e4;
    const urlBefore = this._url;
    const start = Date.now();
    while (Date.now() - start < timeout) {
      await new Promise((r) => setTimeout(r, 500));
      try {
        const newUrl = await this.evaluate("window.location.href");
        if (newUrl && newUrl !== urlBefore) {
          this._url = newUrl;
          return;
        }
      } catch {
      }
    }
    throw new Error("waitForNavigation timed out");
  }
  async waitForNetworkIdle(opts) {
    const wait = opts?.idleTime ?? 500;
    await new Promise((r) => setTimeout(r, wait));
  }
  // ─── Viewport (no-op — real browser manages its own viewport) ────────────
  async setViewport(_opts) {
  }
  async setUserAgent(_ua) {
  }
  // ─── Content ─────────────────────────────────────────────────────────────
  async content() {
    return await this.evaluate("document.documentElement.outerHTML") || "";
  }
  // ─── New page (returns self — sandbox has one page) ──────────────────────
  async newPage() {
    return this;
  }
  // ─── Execute shell command in sandbox container ────────────────────────
  async exec(command, timeout) {
    return this.api("/api/exec", { command, timeout: timeout ?? 3e4 });
  }
  // ─── Execute code in persistent interpreter session ────────────────────
  async interpret(code, language = "python", sessionId = "default", timeout = 30) {
    return this.api("/api/interpret", { code, language, sessionId, timeout });
  }
  // ─── Reset an interpreter session ──────────────────────────────────────
  async resetInterpreter(language = "python", sessionId = "default") {
    return this.api("/api/interpret/reset", { language, sessionId });
  }
  // ─── List active interpreter sessions ──────────────────────────────────
  async interpreterSessions() {
    return this.api("/api/interpret/sessions");
  }
  // ─── Close ───────────────────────────────────────────────────────────────
  async close() {
    await this.api("/api/close");
    this.isSetup = false;
  }
};
var SandboxFrame = class {
  constructor(sbxPage, index = 0, _url = "", _name = "") {
    this.sbxPage = sbxPage;
    this.index = index;
    this._url = _url;
    this._name = _name;
  }
  async evaluate(script) {
    if (this.index === 0) return this.sbxPage.evaluate(script);
    const r = await this.sbxPage.api("/api/evaluate", { script, frame: this.index });
    if (r?.error) throw new Error(r.error);
    return r?.result ?? null;
  }
  async $(selector) {
    return this.index === 0 ? this.sbxPage.$(selector) : null;
  }
  url() {
    return this.index === 0 ? this.sbxPage.url() : this._url;
  }
  name() {
    return this._name;
  }
  frameIndex() {
    return this.index;
  }
};

// ../../../nexus-terminal/workers/nexus-browser/src/playbook.ts
var CATEGORY_KEYWORDS = {
  "travel/airlines": ["flight", "airline", "fly", "airport", "boarding", "departure", "arrival", "layover", "seat", "booking class"],
  "travel/hotels": ["hotel", "room", "reservation", "check-in", "check-out", "lodging", "accommodation", "suite", "hostel"],
  "travel/car_rental": ["rent a car", "car rental", "vehicle", "pickup", "dropoff", "rental"],
  "travel/ground": ["bus", "train", "rail", "transit", "subway", "metro", "amtrak", "greyhound"],
  "travel/restaurant": ["restaurant", "reservation", "dining", "table for", "menu", "order food"],
  "shopping/general": ["buy", "purchase", "add to cart", "checkout", "shopping", "order", "price", "product"],
  "shopping/fashion": ["clothing", "shoes", "dress", "shirt", "pants", "size", "color", "outfit", "wear"],
  "shopping/digital": ["software", "download", "subscription", "digital", "app", "license"],
  "shopping/department": ["department store", "electronics", "furniture", "appliance", "home goods"],
  "shopping/specialty": ["specialty", "gift", "flower", "jewelry", "custom"],
  "shopping/auto": ["car", "auto", "vehicle", "dealership", "new car", "used car", "test drive"],
  "entertainment/movie": ["movie", "film", "cinema", "theater", "showtime", "ticket"],
  "entertainment/music": ["music", "concert", "album", "song", "playlist", "streaming"],
  "entertainment/sports": ["sports", "game", "match", "score", "team", "player", "league", "standings"],
  "entertainment/event": ["event", "ticket", "concert", "show", "festival", "exhibition"],
  "entertainment/game": ["game", "play", "gaming", "esports"],
  "service/general": ["account", "profile", "settings", "password", "register", "sign up", "login"],
  "service/government": ["government", "dmv", "tax", "permit", "license", "public record"],
  "service/healthcare": ["doctor", "appointment", "health", "medical", "pharmacy", "prescription"],
  "service/education": ["school", "university", "course", "class", "enrollment", "grade", "degree"],
  "service/financial": ["bank", "finance", "loan", "credit", "investment", "insurance", "mortgage"],
  "information/search": ["search", "find", "look up", "information about", "wiki", "reference"],
  "information/news": ["news", "article", "headline", "breaking", "report", "journalist"],
  "information/social": ["social media", "post", "share", "follow", "like", "comment", "friend"],
  "information/maps": ["map", "directions", "navigate", "location", "address", "nearby"]
};
async function matchPlaybook(kv, url, taskIntent) {
  let hostname;
  try {
    hostname = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
  const domainKey = `playbook:domain:${hostname}`;
  const domainData = await kv.get(domainKey, "json");
  if (domainData && domainData.tasks.length > 0) {
    let relevantTasks = domainData.tasks;
    if (taskIntent) {
      relevantTasks = rankTasksByIntent(domainData.tasks, taskIntent);
    }
    const topTasks = relevantTasks.slice(0, 3);
    return {
      matchType: "domain",
      confidence: 1,
      matchKey: hostname,
      tasks: topTasks,
      agentHint: formatAgentHint("domain", hostname, domainData.category, topTasks)
    };
  }
  if (taskIntent) {
    const category = matchCategory(taskIntent);
    if (category) {
      const catKey = `playbook:category:${category}`;
      const catData = await kv.get(catKey, "json");
      if (catData) {
        return {
          matchType: "category",
          confidence: scoreCategoryMatch(taskIntent, category),
          matchKey: category,
          tasks: catData.commonPatterns.map((p) => ({
            intent: p.name,
            steps: p.steps
          })),
          commonPatterns: catData.commonPatterns,
          agentHint: formatCategoryHint(category, catData)
        };
      }
    }
  }
  const domainCategory = await kv.get(`playbook:domain-category:${hostname}`);
  if (domainCategory) {
    const catKey = `playbook:category:${domainCategory}`;
    const catData = await kv.get(catKey, "json");
    if (catData) {
      return {
        matchType: "category",
        confidence: 0.5,
        matchKey: domainCategory,
        tasks: catData.commonPatterns.map((p) => ({
          intent: p.name,
          steps: p.steps
        })),
        commonPatterns: catData.commonPatterns,
        agentHint: formatCategoryHint(domainCategory, catData)
      };
    }
  }
  return null;
}
function matchCategory(intent) {
  const lower = intent.toLowerCase();
  let bestCategory = null;
  let bestScore = 0;
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        score += kw.length;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }
  return bestScore >= 4 ? bestCategory : null;
}
function scoreCategoryMatch(intent, category) {
  const lower = intent.toLowerCase();
  const keywords = CATEGORY_KEYWORDS[category] || [];
  let matched = 0;
  for (const kw of keywords) {
    if (lower.includes(kw)) matched++;
  }
  return Math.min(0.3 + matched * 0.2, 0.9);
}
function rankTasksByIntent(tasks, intent) {
  const lower = intent.toLowerCase();
  const words = new Set(lower.split(/\s+/).filter((w) => w.length > 2));
  return [...tasks].sort((a, b) => {
    const scoreA = taskOverlap(a.intent, words);
    const scoreB = taskOverlap(b.intent, words);
    return scoreB - scoreA;
  });
}
function taskOverlap(taskIntent, intentWords) {
  const taskLower = taskIntent.toLowerCase();
  let score = 0;
  for (const word of intentWords) {
    if (taskLower.includes(word)) score++;
  }
  return score;
}
function formatAgentHint(matchType, matchKey, category, tasks) {
  const lines = [
    `[Playbook: ${matchKey} (${category})]`,
    `Known action patterns for this site:`
  ];
  for (const task of tasks) {
    lines.push(`  "${task.intent}":`);
    for (let i = 0; i < task.steps.length; i++) {
      const s = task.steps[i];
      const val = s.value ? ` "${s.value}"` : "";
      const hint = s.hints?.textContent ? ` [text: "${s.hints.textContent}"]` : "";
      lines.push(`    ${i + 1}. ${s.op} \u2192 ${s.target}${val}${hint}`);
    }
  }
  lines.push(`Use scan() to find matching elements. Patterns may be outdated \u2014 verify before acting.`);
  return lines.join("\n");
}
function formatCategoryHint(category, catData) {
  const lines = [
    `[Playbook: ${category} category pattern]`,
    `No exact site match, but this domain type typically follows these patterns:`
  ];
  for (const pattern of catData.commonPatterns.slice(0, 3)) {
    lines.push(`  "${pattern.name}":`);
    for (let i = 0; i < pattern.steps.length; i++) {
      const s = pattern.steps[i];
      const val = s.value ? ` "${s.value}"` : "";
      lines.push(`    ${i + 1}. ${s.op} \u2192 ${s.target}${val}`);
    }
  }
  lines.push(`These are generalized patterns \u2014 scan() to find actual elements.`);
  return lines.join("\n");
}

// ../../../nexus-terminal/workers/nexus-browser/src/recipes.ts
var CACHE_TTL_S = 60;
function base(env) {
  return env.STDB_SENSE_URL ? env.STDB_SENSE_URL.replace(/\/$/, "") : null;
}
function decodeRecipeRow(r) {
  if (!Array.isArray(r) || r.length < 10) return null;
  let recipe = null;
  try {
    recipe = JSON.parse(String(r[4] ?? "{}"));
  } catch {
    recipe = null;
  }
  return { recipe_id: String(r[0]), host: String(r[1]), kind: String(r[2]), fingerprint: String(r[3]), recipe, successes: Number(r[5]) || 0, failures: Number(r[6]) || 0, score: Number(r[7]) || 0, promoted: r[8] === true || r[8] === "true", source: String(r[9] ?? ""), updated_at: Number(r[10]) || 0 };
}
var RECIPE_SQL = (host) => `SELECT recipe_id, host, kind, fingerprint, recipe_json, successes, failures, score, promoted, source, updated_at FROM web_recipe WHERE host = '${host.replace(/'/g, "")}'`;
async function loadRecipes(env, host, opts = {}) {
  const h = (host || "").toLowerCase();
  if (!h) return { recipes: [], source: "none" };
  const ck = `recipes:${h}`;
  if (!opts.fresh && env.API_KEYS) {
    try {
      const c = await env.API_KEYS.get(ck, "json");
      if (c && Date.now() - c.at < CACHE_TTL_S * 1e3) return { recipes: c.recipes, source: "cache" };
    } catch {
    }
  }
  const b = base(env);
  if (!b || !env.STDB_TOKEN) return { recipes: [], source: "none", error: "STDB_SENSE_URL / STDB_TOKEN not configured" };
  try {
    const resp = await fetch(`${b}/sql`, { method: "POST", headers: { Authorization: `Bearer ${env.STDB_TOKEN}`, "Content-Type": "text/plain" }, body: RECIPE_SQL(h), signal: AbortSignal.timeout(6e3) });
    if (!resp.ok) return { recipes: [], source: "none", error: `stdb ${resp.status}` };
    const data = await resp.json();
    const rows = Array.isArray(data) && data[0]?.rows ? data[0].rows : [];
    const recipes = rows.map(decodeRecipeRow).filter((x) => !!x && !!x.recipe);
    if (env.API_KEYS) {
      try {
        await env.API_KEYS.put(ck, JSON.stringify({ at: Date.now(), recipes }), { expirationTtl: 600 });
      } catch {
      }
    }
    return { recipes, source: "stdb" };
  } catch (e) {
    return { recipes: [], source: "none", error: String(e?.message || e).slice(0, 120) };
  }
}
async function call(env, reducer, args) {
  const b = base(env);
  if (!b || !env.STDB_TOKEN) return { ok: false, error: "not configured" };
  try {
    const resp = await fetch(`${b}/call/${reducer}`, { method: "POST", headers: { Authorization: `Bearer ${env.STDB_TOKEN}`, "Content-Type": "application/json" }, body: JSON.stringify(args), signal: AbortSignal.timeout(6e3) });
    if (!resp.ok) return { ok: false, error: `${resp.status} ${(await resp.text()).slice(0, 160)}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e?.message || e).slice(0, 120) };
  }
}
function recipeId(kind, host, fingerprint) {
  return `${kind}:${host.toLowerCase()}:${fingerprint}`;
}
function fnv(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}
async function bankRecipe(env, r) {
  const host = r.host.toLowerCase();
  const id = recipeId(r.kind, host, r.fingerprint);
  const up = await call(env, "upsert_web_recipe", [id, host, r.kind, r.fingerprint, JSON.stringify(r.recipe).slice(0, 16e3), r.source || "learned:nexus-browser", false]);
  if (!up.ok) return { recipe_id: id, ok: false, error: up.error };
  const oc = await call(env, "record_web_recipe_outcome", [id, r.success, (r.note || "").slice(0, 200)]);
  if (env.API_KEYS) {
    try {
      await env.API_KEYS.delete(`recipes:${host}`);
    } catch {
    }
  }
  return { recipe_id: id, ok: oc.ok, error: oc.error };
}
async function recordOutcome(env, recipe_id, success, note = "") {
  const r = await call(env, "record_web_recipe_outcome", [recipe_id, success, note.slice(0, 200)]);
  const host = recipe_id.split(":")[1];
  if (host && env.API_KEYS) {
    try {
      await env.API_KEYS.delete(`recipes:${host}`);
    } catch {
    }
  }
  return r;
}
function recipeHints(recipes, kinds) {
  return recipes.filter((r) => !kinds || kinds.includes(r.kind)).sort((a, b) => Number(b.promoted) - Number(a.promoted) || b.score - a.score).slice(0, 6).map((r) => ({
    recipe_id: r.recipe_id,
    kind: r.kind,
    confidence: Math.round(r.score * 100) / 100,
    promoted: r.promoted,
    outcomes: `${r.successes}\u2713/${r.failures}\u2717`,
    hint: r.kind === "playbook" ? `banked workflow "${String(r.recipe?.intent || "").slice(0, 60)}": ${Array.isArray(r.recipe?.steps) ? r.recipe.steps.length : "?"} steps \u2014 ${Array.isArray(r.recipe?.steps) ? r.recipe.steps.slice(0, 4).map((st) => `${st.op} ${st.target || ""}`.trim()).join(" \u2192 ") : ""}` : r.kind === "consent" ? `dismiss_overlays will try ${r.recipe?.selector || "the banked selector"} first` : r.kind === "form" ? `fill_form knows ${Array.isArray(r.recipe?.fields) ? r.recipe.fields.length : "?"} fields; submit via ${r.recipe?.submit?.text || r.recipe?.submit?.selector || "?"}` : r.kind === "challenge" ? `${r.recipe?.vendor || "?"} ${r.recipe?.family || ""}: ${r.recipe?.method || "?"}` : `${r.recipe?.intent || r.fingerprint}: ${Array.isArray(r.recipe?.steps) ? r.recipe.steps.length + " steps" : "playbook"}`
  }));
}
var STOP = /* @__PURE__ */ new Set(["the", "a", "an", "to", "for", "of", "in", "on", "and", "with", "my", "me", "i", "it", "this", "that"]);
function intentTokens(intent) {
  return String(intent || "").toLowerCase().replace(/[^a-z0-9 ]+/g, " ").split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w));
}
function intentFingerprint(intent) {
  return fnv([...new Set(intentTokens(intent))].sort().join(" "));
}
function learnedPlaybooks(recipes, intent) {
  const want = new Set(intentTokens(intent));
  if (!want.size) return [];
  return recipes.filter((r) => r.kind === "playbook" && r.recipe && Array.isArray(r.recipe.steps)).map((r) => {
    const have = new Set(intentTokens(r.recipe.intent || ""));
    let overlap = 0;
    for (const w of want) if (have.has(w)) overlap++;
    return { recipe_id: r.recipe_id, intent: String(r.recipe.intent || "").slice(0, 120), steps: r.recipe.steps.slice(0, 40), outcomes: `${r.successes}\u2713/${r.failures}\u2717`, promoted: r.promoted, overlap };
  }).filter((x) => x.overlap > 0).sort((a, b) => Number(b.promoted) - Number(a.promoted) || b.overlap - a.overlap).slice(0, 3);
}
function cortexBase(env) {
  const b = base(env);
  return b ? b.replace(/\/database\/[^/]+$/, "/database/nexus-nexus-cortex") : null;
}
async function recordDecision(env, ev) {
  const b = cortexBase(env);
  if (!b || !env.STDB_TOKEN) return null;
  const id = `bmcp-${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 8)}`;
  try {
    const resp = await fetch(`${b}/call/record_npc_decision`, {
      method: "POST",
      headers: { Authorization: `Bearer ${env.STDB_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify([id, `browser-mcp:${ev.agent}`, ev.kind, JSON.stringify(ev.data ?? {}).slice(0, 4e3), ev.model || "none", String(ev.summary || "").slice(0, 200), 0, 0]),
      signal: AbortSignal.timeout(6e3)
    });
    return resp.ok ? id : null;
  } catch {
    return null;
  }
}

// ../../../nexus-terminal/workers/nexus-browser/src/skills-content.ts
var SKILL_INDEX = [
  {
    topic: "research-to-pdf",
    title: "Deep Research \u2192 Professional PDF Report",
    description: "Multi-source web research with data extraction, inline SVG chart generation, HTML composition, and PDF rendering via html2pdf. Produces publication-quality reports.",
    tags: ["research", "pdf", "charts", "report"]
  },
  {
    topic: "data-pipeline",
    title: "Scrape \u2192 Process \u2192 Export Data Pipeline",
    description: "Extract structured data from websites, process with Python/pandas in a persistent REPL, and export as CSV/JSON/Excel. Handles pagination, dedup, and cleaning.",
    tags: ["scraping", "data", "python", "export"]
  },
  {
    topic: "competitive-intel",
    title: "Competitive Intelligence Dashboard",
    description: "Monitor competitor websites for pricing, feature changes, and content updates. Multi-site extraction with diff tracking and summary generation.",
    tags: ["monitoring", "pricing", "competitive", "diff"]
  },
  {
    topic: "lead-generation",
    title: "Directory Scraping \u2192 Lead Export",
    description: "Extract contact information and business data from directories, review sites, and professional networks. Clean, deduplicate, and export CRM-ready data.",
    tags: ["leads", "contacts", "directory", "crm"]
  },
  {
    topic: "site-audit",
    title: "Technical Site Audit",
    description: "Crawl a website checking accessibility, broken links, SEO metadata, performance indicators, and framework detection. Generates a structured audit report.",
    tags: ["seo", "accessibility", "audit", "crawl"]
  },
  {
    topic: "content-to-dataset",
    title: "Web Content \u2192 Training Dataset",
    description: "Collect and structure web content into clean datasets for ML training, RAG pipelines, or knowledge bases. Handles multiple formats and deduplication.",
    tags: ["ml", "dataset", "rag", "knowledge-base"]
  },
  {
    topic: "form-automation",
    title: "Multi-Step Form Automation",
    description: "Navigate multi-page forms, wizards, and checkout flows with challenge handling, file uploads, and confirmation verification.",
    tags: ["forms", "automation", "checkout", "wizard"]
  },
  {
    topic: "pdf-reading",
    title: "PDF Reading, Extraction & Conversion",
    description: "Extract text, tables, images, and metadata from existing PDFs. Convert to structured HTML (PyMuPDF) or pixel-perfect lossless HTML (pdf2htmlEX). Pre-installed in sandbox via pdf2html CLI.",
    tags: ["pdf", "extraction", "tables", "html", "conversion"]
  },
  {
    topic: "pdf-form-fill",
    title: "PDF Form Detection & Filling",
    description: "Detect AcroForm fields in PDF documents, inventory field names/types/options, fill values programmatically, flatten for delivery. Handles both interactive forms and scanned-form text overlay fallback.",
    tags: ["pdf", "forms", "acroform", "fill", "flatten"]
  }
];
var SKILL_CONTENT = {
  "research-to-pdf": {
    title: "Deep Research \u2192 Professional PDF Report",
    estimatedMinutes: 15,
    quotaCost: "high",
    recipe: `# Research-to-PDF Pipeline

## Overview
Combine web research, data extraction, and PDF generation into a single pipeline.
The sandbox has html2pdf pre-installed \u2014 a Python CLI wrapper around Chrome's print-to-pdf.

## Phase 1: Research (browse + extract)

Gather data from multiple sources. Use budget "low" for text-heavy pages, "high" for interactive ones.

\`\`\`
// Source 1: Primary data
browse({ url: "https://data-source.com/topic", budget: "low" })
get_content({ format: "markdown" })
// Store key facts

// Source 2: Tables and structured data
browse({ url: "https://stats-source.com/data", budget: "medium" })
extract_table({ selector: "table.main" })
// Store as structured data

// Source 3: Interactive dashboard
browse({ url: "https://dashboard.com/charts", budget: "high" })
scan({ filter: { hasText: "current price" } })
grab({ selector: ".price-display" })
// Store current values
\`\`\`

**Tip:** Track your quota. Use session_info() between sources to check remaining time.

## Phase 2: Compose HTML Report

Build a self-contained HTML document with inline styles and SVG charts.

\`\`\`
run_code({ code: "..." })
\`\`\`

Write an HTML file to /tmp/report.html with:
- **@page CSS** for paper size and margins (size: A4, margin: 2cm)
- **Metric cards** in a grid (large numbers + small labels, executive summary pattern)
- **Inline SVG charts** (resolution-independent, no external files, Chrome renders perfectly)
- **Data tables** with striped rows and color-coded values
- **break-inside: avoid** on figures/tables to prevent page-break splits
- **Print-specific CSS** via @media print

### HTML Design Tips
- Inline SVGs render perfectly in Chrome's print-to-pdf \u2014 no rasterization needed
- Use @page { size: A4; margin: 2cm; } for paper layout
- Color-code values: green (#2ecc71) positive, red (#e74c3c) negative
- Metric cards: grid layout with .value (28px bold) + .label (13px uppercase)
- figure + figcaption with break-inside: avoid for charts

## Phase 3: Generate PDF

\`\`\`
run_command({ command: "html2pdf /tmp/report.html --output /tmp/report.pdf --no-header --paper a4" })
run_command({ command: "ls -la /tmp/report.pdf" })
\`\`\`

### html2pdf Options
| Flag | Purpose |
|------|---------|
| --no-header | Remove default header/footer (date, URL, page numbers) |
| --paper a4 or --paper letter | Paper size |
| --landscape | Landscape orientation |
| --base64 | Output base64 to stdout (for programmatic transfer) |
| --scale 1.0 | Print scale factor |

## Phase 4: Deliver

Option A \u2014 Transfer to local filesystem (if your agent has local file access):
\`\`\`
run_command({ command: "html2pdf /tmp/report.html --base64 --no-header --paper a4" })
// stdout contains base64-encoded PDF \u2014 decode and write locally
\`\`\`

Option B \u2014 Provide HTML for user to print/save:
\`\`\`
run_command({ command: "cat /tmp/report.html" })
// User opens in browser and Ctrl+P
\`\`\`

## Real Example: Silver Futures Research Report
This pipeline produced an 8-page commodity report with live pricing from Dillon Gage,
Kitco, and Trading Economics \u2014 4 inline SVG charts, scenario tables, Silver Eagle
premium tracking \u2014 rendered as a 374KB PDF with vector charts.

Key insight: inline SVGs render perfectly in Chrome print-to-pdf. No rasterization,
no external files, resolution-independent at any zoom level.`
  },
  "data-pipeline": {
    title: "Scrape \u2192 Process \u2192 Export Data Pipeline",
    estimatedMinutes: 10,
    quotaCost: "medium",
    recipe: `# Data Pipeline: Scrape \u2192 Process \u2192 Export

## Overview
Extract structured data from websites, clean and transform with Python, export as CSV/JSON.
The sandbox has a persistent Python REPL \u2014 install packages once, use across the pipeline.

## Step 1: Setup Python Environment
\`\`\`
run_command({ command: "pip3 install pandas openpyxl -q" })
run_code({ code: "import pandas as pd; import json; print('Ready')" })
\`\`\`

## Step 2: Extract Data

From tables:
\`\`\`
browse({ url: "https://example.com/data" })
extract_table({ selector: "table.results" })
\`\`\`

From paginated lists:
\`\`\`
browse({ url: "https://example.com/listings?page=1" })
// For each page: extract_table, scan for "Next", click, repeat
\`\`\`

From card/grid layouts:
\`\`\`
browse({ url: "https://example.com/products" })
scroll_and_collect({ maxScrolls: 10, waitForSelector: ".product-card" })
grab({ selectorAll: ".product-card", extract: "structured" })
\`\`\`

## Step 3: Process with Python
\`\`\`
run_code({ code: "df = pd.DataFrame(data); df.columns = df.columns.str.strip().str.lower(); df = df.drop_duplicates(); ..." })
\`\`\`
- Clean column names, parse numeric fields, remove duplicates
- Add computed columns (categories, rankings, deltas)
- Generate summary statistics

## Step 4: Export
\`\`\`
run_code({ code: "df.to_csv('/tmp/export.csv', index=False); df.to_json('/tmp/export.json', orient='records', indent=2)" })
\`\`\`
- CSV for spreadsheets
- JSON (records format) for APIs
- Excel with openpyxl for formatted output

## Step 5: Retrieve Files
\`\`\`
run_command({ command: "base64 -w0 /tmp/export.csv" })
// Decode locally, or use cat for text formats
\`\`\`

## Tips
- Persistent REPL: variables survive across run_code calls
- Multiple sessions: use sessionId for parallel pipelines
- Rate limiting: add settleMs to browse() for polite scraping
- Large datasets: process in chunks with pandas chunksize`
  },
  "competitive-intel": {
    title: "Competitive Intelligence Dashboard",
    estimatedMinutes: 12,
    quotaCost: "high",
    recipe: `# Competitive Intelligence: Multi-Site Monitoring

## Overview
Monitor competitor websites for pricing, features, and content changes.

## Step 1: Define Targets
Use run_code to define competitor URLs and CSS selectors for pricing/plans/features.

## Step 2: Extract from Each Competitor

For each competitor site:
\`\`\`
browse({ url: "<competitor_url>", budget: "medium" })
extract_table({ selector: "<pricing_table>" })
grab({ selectorAll: ".feature-list li", extract: "text" })
grab({ selector: ".price", extract: "text" })
get_content({ format: "markdown", selector: ".pricing-section" })
close_session()
\`\`\`

## Step 3: Compare and Analyze
\`\`\`
run_code({ code: "..." })
\`\`\`
- Build comparison matrix with pandas pivot tables
- Calculate relative positioning (your price vs. average)
- Feature gap analysis: set difference between your features and theirs
- Identify pricing outliers and positioning opportunities

## Step 4: Generate Report
Use the research-to-pdf skill pattern for a formatted comparison report,
or export as JSON/CSV for your own dashboards.

## Change Detection (recurring monitoring)

On subsequent runs, use scan diff for efficient change detection:
\`\`\`
browse({ url: "<competitor_url>" })
scan({ filter: { hasText: "price" } })   // Establishes baseline
// ... later ...
scan({ _diff: true })                     // Only changed elements returned
\`\`\`

## Tips
- budget: "low" for initial recon, "medium" for extraction, "high" for SPAs
- save_auth() / load_auth() for sites requiring login
- Run during off-peak hours for consistent page loads
- Store baselines in Python REPL for cross-run comparison`
  },
  "lead-generation": {
    title: "Directory Scraping \u2192 Lead Export",
    estimatedMinutes: 10,
    quotaCost: "medium",
    recipe: `# Lead Generation: Directory \u2192 CRM-Ready Export

## Overview
Extract business data from directories and review sites, clean and deduplicate,
export in CRM-ready format.

## Step 1: Navigate and Survey
\`\`\`
browse({ url: "https://directory-site.com/search?q=<industry>&location=<city>" })
scan({ filter: { isInteractive: false } })
// Understand: listing cards, pagination, filters
\`\`\`

## Step 2: Extract Listings

From card layouts:
\`\`\`
grab({ selectorAll: ".listing-card", extract: "structured" })
\`\`\`

From table listings:
\`\`\`
extract_table({ selector: ".results-table" })
\`\`\`

With pagination:
\`\`\`
// For each page: extract, scan for "Next", click, repeat
\`\`\`

## Step 3: Clean and Structure with Python
\`\`\`
run_code({ code: "..." })
\`\`\`
- Parse unstructured text into fields (regex for phone, email, address, rating)
- Deduplicate on company_name + phone
- Remove empty/incomplete rows
- Normalize phone numbers and addresses

## Step 4: Export CRM-Ready
\`\`\`
run_code({ code: "crm_df.to_csv('/tmp/leads.csv', index=False)" })
\`\`\`
Standard columns: Company, Phone, Email, Website, Address, Rating, Source, Date Added

## Tips
- Respect robots.txt and rate limits (settleMs: 3000)
- Use save_auth() / load_auth() for login-required directories
- budget: "high" with full stealth for anti-scraping protection
- Spot-check a few leads manually for data quality`
  },
  "site-audit": {
    title: "Technical Site Audit",
    estimatedMinutes: 8,
    quotaCost: "medium",
    recipe: `# Technical Site Audit

## Overview
Crawl a website checking accessibility, SEO, broken links, and performance.

## Step 1: Homepage Analysis
\`\`\`
browse({ url: "https://target-site.com", intent: "audit site structure" })
detect_framework()               // React, Vue, Next.js, Angular, etc.
accessibility_tree({ maxDepth: 4 })  // Semantic structure, ARIA landmarks
evaluate({ script: "JSON.stringify({ title: document.title, description: ..., h1Count: ..., imgWithoutAlt: ... })" })
\`\`\`

## Step 2: Link Audit
\`\`\`
extract_links()                  // All internal + external links
// Sample-check links with browse({ url: "...", budget: "low" })
// Look for 404s, redirect chains, error pages
\`\`\`

## Step 3: Page-by-Page Checks
For key pages (homepage, about, contact, product):
\`\`\`
browse({ url: "<page>" })
evaluate({ script: "JSON.stringify({ domNodes: ..., scripts: ..., images: ..., lazyImages: ... })" })
scan({ snapshot: { accessibility: true, forms: true, errors: true } })
grab({ selector: "main", extract: "headings" })   // Verify heading hierarchy
\`\`\`

## Step 4: Generate Report
Aggregate findings into a structured JSON report with:
- SEO score (title, description, OG tags, h1 count, alt text coverage)
- Accessibility score (landmarks, heading hierarchy, form labels)
- Link health (total, broken, redirect chains)
- Performance indicators (DOM nodes, scripts, heavy libraries)
- Recommendations list prioritized by impact

## Tips
- budget: "low" for link checking, "medium" for most audits, "high" for SPAs
- accessibility_tree() is more comprehensive than scan for a11y
- Combine with research-to-pdf for a formatted PDF audit report`
  },
  "content-to-dataset": {
    title: "Web Content \u2192 Training Dataset",
    estimatedMinutes: 12,
    quotaCost: "high",
    recipe: `# Content to Dataset: Build ML/RAG Datasets from the Web

## Overview
Collect, clean, and structure web content for ML fine-tuning, RAG knowledge bases,
or content analysis pipelines.

## Step 1: Crawl and Collect
\`\`\`
browse({ url: "https://docs.example.com", budget: "medium" })
extract_links({ filter: "internal" })        // Get sitemap / all pages
grab({ selector: "nav", extract: "links" })  // Or from navigation
\`\`\`

## Step 2: Extract Content per Page
For each page:
\`\`\`
browse({ url: "<page_url>", budget: "low" })  // "low" is 10-50x faster for text content
get_content({ format: "markdown", selector: "main" })
// OR for more structure:
grab({ selector: "article", extract: "structured" })
\`\`\`

## Step 3: Process into Dataset Format
\`\`\`
run_code({ code: "..." })
\`\`\`
- Deduplicate by content hash (MD5 or SHA-256)
- Skip near-empty pages (< 100 chars)
- Structure per use case:
  - RAG: { id, url, title, content, metadata: { source, section, word_count } }
  - Fine-tuning: { instruction, input, output }
  - Q&A: heading to content pairs

## Step 4: Chunk for Vector DB (Optional)
\`\`\`
run_code({ code: "..." })
\`\`\`
- Split long documents into overlapping chunks (500 words, 50-word overlap)
- Preserve metadata on each chunk (source URL, chunk index)

## Step 5: Export
\`\`\`
run_code({ code: "..." })
\`\`\`
- JSONL format (one JSON per line \u2014 standard for ML datasets, streamable)
- Retrieve via run_command + base64

## Tips
- budget: "low" is 10-50x faster for text content pages
- Persistent REPL keeps all data in memory across calls
- For sites behind auth: load_auth() before crawling
- JSONL is preferred for ML datasets (streamable, one record per line)`
  },
  "form-automation": {
    title: "Multi-Step Form Automation",
    estimatedMinutes: 8,
    quotaCost: "medium",
    recipe: `# Multi-Step Form Automation

## Overview
Navigate multi-page forms, wizards, and checkout flows with challenge handling
and confirmation verification.

## Step 1: Survey the Form
\`\`\`
browse({ url: "https://example.com/apply", budget: "high" })
detect_framework()                       // React/Vue need injectable mode
scan({ snapshot: { forms: true } })      // Full form field inventory
\`\`\`

## Step 2: Fill the Form

Simple forms (all fields visible):
\`\`\`
fill_form({ fields: [
  { selector: "#first-name", value: "John" },
  { selector: "#email", value: "john@example.com" },
  { selector: "select#country", value: "US" },
  { selector: "#agree-terms", value: "true" },
] })
\`\`\`

React/Vue controlled inputs:
\`\`\`
type({ selector: "#email", text: "john@example.com", humanLike: false })
// Uses React-aware native setter (input.value + synthetic events)
\`\`\`

Dynamic fields (appear based on selection):
\`\`\`
select({ selector: "#account-type", value: "business" })
wait_for({ selector: "#company-name" })
type({ selector: "#company-name", text: "Acme Corp" })
\`\`\`

## Step 3: Multi-Page Wizard
\`\`\`
// Page 1: fill + click "Next"
fill_form({ fields: [...] })
click({ text: "Next", waitFor: { selector: ".step-2" } })

// Page 2: re-scan, fill, next
scan({ filter: { isInteractive: true } })
fill_form({ fields: [...] })
click({ text: "Next", waitFor: { selector: ".step-3" } })

// Page 3: review + submit
scan({ filter: { isInteractive: false } })    // Verify displayed info
click({ text: "Submit", waitFor: { navigation: true } })
\`\`\`

## Step 4: Handle Challenges
\`\`\`
detect_challenge()
solve_challenge({ x: <center_x>, y: <center_y> })
// Re-submit if needed
\`\`\`

## Step 5: Verify Submission
\`\`\`
wait_for({ textContent: "Thank you" })
grab({ selector: ".confirmation" })
screenshot()     // Visual proof
close_session()
\`\`\`

## Tips
- fill_form: batch (faster) vs type: human-like (better anti-bot)
- Always use click({ ..., waitFor: { ... } }) on form submissions
- React detection: prefer humanLike: false for type/fill
- save_auth() periodically for long forms in case of session issues`
  },
  "pdf-reading": {
    title: "PDF Reading, Extraction & Conversion",
    estimatedMinutes: 5,
    quotaCost: "low",
    recipe: `# PDF Reading, Extraction & Conversion

## Overview
The sandbox has \`pdf2html\` pre-installed \u2014 a unified CLI wrapping PyMuPDF (structured
extraction) and pdf2htmlEX (lossless visual fidelity). Also available: pdfplumber for
table-heavy documents and poppler-utils (pdftotext, pdfinfo, pdftoppm).

No browser session needed for PDF processing \u2014 quota cost is near zero.

## Getting a PDF into the Sandbox

\`\`\`
// Option A: Upload directly from your agent (RECOMMENDED)
upload_to_sandbox({ content_base64: "<base64_string>", destination: "/tmp/document.pdf" })
// Handles chunking automatically for large files (>400KB)

// Option B: Download from a URL
run_command({ command: "curl -sL -o /tmp/document.pdf 'https://example.com/report.pdf'" })

// Option C: From a browsed page \u2014 find and download the link
browse({ url: "https://example.com/downloads" })
extract_links({ filter: "external" })
// Find the .pdf link, then:
run_command({ command: "curl -sL -o /tmp/document.pdf '<pdf_url>'" })
\`\`\`

## Mode 1: Structured HTML (default \u2014 best for agents)

PyMuPDF extracts text with formatting, detects headings/tables/images, and produces
clean HTML with an embedded JSON manifest.

\`\`\`
run_command({ command: "pdf2html /tmp/document.pdf" })
\`\`\`

Output: HTML with embedded manifest comment containing:
- Page count, heading hierarchy, table inventory, image locations
- Styled per-page divs with preserved formatting

### Manifest Only (cheapest \u2014 just the structure)
\`\`\`
run_command({ command: "pdf2html /tmp/document.pdf --manifest" })
\`\`\`
Returns JSON: page count, headings (with font sizes), table locations (rows/cols), image refs.

### With Image Extraction
\`\`\`
run_command({ command: "pdf2html /tmp/document.pdf --images /tmp/images/" })
run_command({ command: "ls /tmp/images/" })
\`\`\`

### Specific Pages
\`\`\`
run_command({ command: "pdf2html /tmp/document.pdf --pages 1-5" })
\`\`\`

## Mode 2: Plain Text (cheapest extraction)

\`\`\`
run_command({ command: "pdf2html /tmp/document.pdf --text" })
\`\`\`
Just text, page-delimited. Best for search, summarization, RAG chunking.

## Mode 3: Lossless HTML (pixel-perfect via pdf2htmlEX)

Preserves exact layout, fonts, positioning. Fonts embedded as base64 CSS.
Use when visual fidelity matters (legal documents, designed reports, forms).

\`\`\`
run_command({ command: "pdf2html /tmp/document.pdf --lossless" })
\`\`\`

Output: Single HTML file with all fonts/styles embedded. Can be large (100KB+).

## Mode 4: Table Extraction (pdfplumber)

When you need structured table data, pdfplumber detects rows and columns more
reliably than PyMuPDF for complex tables.

\`\`\`
run_code({ code: """
import pdfplumber
import json

with pdfplumber.open('/tmp/document.pdf') as pdf:
    all_tables = []
    for i, page in enumerate(pdf.pages):
        tables = page.extract_tables()
        for t_idx, table in enumerate(tables):
            headers = table[0] if table else []
            rows = table[1:] if len(table) > 1 else []
            all_tables.append({
                'page': i + 1,
                'headers': headers,
                'rows': rows,
            })
            print(f'Page {i+1}, Table {t_idx+1}: {len(rows)} rows x {len(headers)} cols')

    print(json.dumps(all_tables, indent=2))
""" })
\`\`\`

## Mode 5: PDF Metadata and Info

\`\`\`
run_command({ command: "pdfinfo /tmp/document.pdf" })
\`\`\`
Returns: title, author, subject, keywords, creation date, page count, file size, PDF version.

## Combining with Other Skills

- Extract data from PDF tables \u2192 feed into the **data-pipeline** skill for pandas processing
- Extract PDF content \u2192 feed into **content-to-dataset** for RAG/ML datasets
- Read a PDF report \u2192 use findings in **research-to-pdf** to compose a new report
- Read a PDF form \u2192 use **pdf-form-fill** to fill and return it

## Retrieving Processed Files

\`\`\`
// Download processed output directly
download_from_sandbox({ source: "/tmp/document.html" })
// Returns { success, content_base64, size, mimeType }

// Or for multiple extracted images
run_command({ command: "tar czf /tmp/images.tar.gz -C /tmp/images ." })
download_from_sandbox({ source: "/tmp/images.tar.gz" })
\`\`\`

## Tips
- Start with \`--manifest\` to understand the PDF structure before full extraction
- Use \`--text\` for summarization (cheapest, ~20 tokens per page)
- Use \`--lossless\` only when layout must be preserved exactly
- pdfplumber is better than PyMuPDF for tables with merged cells or complex layouts
- Use \`upload_to_sandbox\` / \`download_from_sandbox\` for file transfer \u2014 no workarounds needed
- All PDF tools work without a browser session \u2014 near-zero quota cost`
  },
  "pdf-form-fill": {
    title: "PDF Form Detection & Filling",
    estimatedMinutes: 5,
    quotaCost: "low",
    recipe: `# PDF Form Detection & Filling

## Overview
Detect form fields in PDF documents, inventory them for the user, fill values
programmatically, and deliver a completed PDF. Works with AcroForm (interactive)
PDFs and provides a fallback for scanned/non-interactive forms.

No browser session needed \u2014 all processing via PyMuPDF in the sandbox.

## Step 1: Get the PDF into the Sandbox

\`\`\`
// Option A: Upload directly from your agent (RECOMMENDED)
upload_to_sandbox({ content_base64: "<base64_string>", destination: "/tmp/form.pdf" })

// Option B: Download from a URL
run_command({ command: "curl -sL -o /tmp/form.pdf '<url>'" })
\`\`\`

## Step 2: Detect and Inventory Form Fields

\`\`\`
run_code({ code: """
import fitz  # PyMuPDF
import json

doc = fitz.open('/tmp/form.pdf')
fields = []

# PyMuPDF widget field_type values:
# 0=unknown, 1=PushButton, 2=CheckBox, 3=RadioButton,
# 4=ListBox, 5=ComboBox, 6=Signature, 7=Text
TYPE_NAMES = {0:'unknown', 1:'button', 2:'checkbox', 3:'radio',
              4:'listbox', 5:'combobox', 6:'signature', 7:'text'}

for page_num in range(len(doc)):
    page = doc[page_num]
    for widget in page.widgets():
        field = {
            'page': page_num + 1,
            'index': len(fields),
            'name': widget.field_name,
            'type': TYPE_NAMES.get(widget.field_type, 'unknown'),
            'type_id': widget.field_type,
            'value': widget.field_value,
            'rect': list(widget.rect),
            'flags': widget.field_flags,
            'read_only': bool(widget.field_flags & 1),
        }

        if widget.field_type in (4, 5) and widget.choice_values:
            field['options'] = widget.choice_values

        if widget.field_type == 7 and widget.text_maxlen > 0:
            field['max_length'] = widget.text_maxlen

        fields.append(field)

doc.close()

print(f'Found {len(fields)} form fields across {len(doc)} pages')
print()
for f in fields:
    ro = ' [READ-ONLY]' if f['read_only'] else ''
    val = f' = \\"{f["value"]}\\"' if f['value'] else ''
    opts = f' options: {f["options"]}' if 'options' in f else ''
    print(f'  [{f["index"]:2d}] p{f["page"]} | {f["type"]:12} | {f["name"]}{val}{opts}{ro}')

with open('/tmp/form-fields.json', 'w') as out:
    json.dump(fields, out, indent=2)
""" })
\`\`\`

This gives the agent (and user) a complete inventory of every fillable field \u2014 name,
type, current value, options for dropdowns, and read-only status.

**IMPORTANT:** Fields with duplicate names (e.g., multiple "County" fields) must be
addressed by index, not name. The index is the widget's position in page.widgets().

## Step 3: Present to User and Collect Data

The agent should present the field inventory to the user and collect values:

\`\`\`
"I found 12 fillable fields in this PDF:
  - Full Name (text, required)
  - Date of Birth (text)
  - SSN (text, max 11 chars)
  - State (dropdown: AL, AK, AZ, ...)
  - Filing Status (radio: Single, Married, Head of Household)
  - I Agree (checkbox)

Please provide the values you'd like me to fill in."
\`\`\`

## Step 4: Fill the Form

\`\`\`
run_code({ code: """
import fitz

fill_data = {
    'Full Name': 'John A. Smith',
    'Date of Birth': '03/15/1985',
    'SSN': '123-45-6789',
    'State': 'TX',
    'Filing Status': 'Single',
    'I Agree': True,
}

# For duplicate field names, map by index instead:
# fill_by_index = { 10: 'Jefferson', 12: 'Jefferson', 23: 'Jefferson' }

doc = fitz.open('/tmp/form.pdf')

for page in doc:
    widgets = list(page.widgets())
    for i, widget in enumerate(widgets):
        name = widget.field_name

        # Set font properties for proper appearance stream rendering
        if widget.field_type in (6, 7):  # Signature or Text
            widget.text_fontsize = 0     # auto-fit to field rect
            widget.text_color = (0, 0, 0)

        # Check index-based overrides first (for duplicate names)
        # if i in fill_by_index:
        #     widget.field_value = fill_by_index[i]
        #     widget.update()
        #     continue

        if name not in fill_data:
            continue

        value = fill_data[name]

        if widget.field_type == 2:  # checkbox
            widget.field_value = 'Yes' if value else 'Off'
        elif widget.field_type == 3:  # radio
            widget.field_value = str(value)
        elif widget.field_type == 6:  # signature \u2014 accept typed name
            widget.field_value = str(value)
        else:
            widget.field_value = str(value)

        widget.update()

# CRITICAL: Set NeedAppearances to false so baked AP streams render
# in ALL viewers. Without this, many viewers show blank fields.
cat_xref = doc.pdf_catalog()
acro_ref = doc.xref_get_key(cat_xref, 'AcroForm')
if acro_ref[0] == 'xref':
    af_xref = int(acro_ref[1].split()[0])
    doc.xref_set_key(af_xref, 'NeedAppearances', 'false')

doc.save('/tmp/form-filled.pdf', garbage=3, deflate=True)
doc.close()
print('Saved filled form to /tmp/form-filled.pdf')
""" })
\`\`\`

### Why NeedAppearances Matters

PDF forms have two ways to show field values:
1. **NeedAppearances=true** \u2014 tells the viewer to regenerate visual appearance at open time.
   Many viewers (web-based, mobile, lightweight) DON'T support this \u2192 fields appear blank.
2. **NeedAppearances=false** \u2014 PyMuPDF's \`widget.update()\` bakes an AP (appearance) stream
   into each field. These render in ALL viewers. **Always use this approach.**

## Step 5: Verify All Fields Filled

\`\`\`
run_code({ code: """
import fitz

doc = fitz.open('/tmp/form-filled.pdf')
empty = []
for page in doc:
    for i, w in enumerate(page.widgets()):
        v = w.field_value or ''
        if not v or (v == 'Off' and w.field_type != 2):
            empty.append(f'[{i}] {w.field_name}')
doc.close()

if empty:
    print(f'WARNING: {len(empty)} fields still empty: {empty}')
else:
    print('All fields verified \u2014 every field has a value')
""" })
\`\`\`

## Step 6: Flatten (Optional \u2014 Lock Fields)

Flattening converts form fields into static content. The filled values become
part of the page \u2014 they can't be edited, but they render everywhere. Recommended
before sending to recipients who may have limited PDF viewers.

\`\`\`
run_code({ code: """
import fitz

doc = fitz.open('/tmp/form-filled.pdf')

for page in doc:
    widgets = list(page.widgets())
    for widget in widgets:
        rect = widget.rect
        value = widget.field_value or ''

        if value and value != 'Off':
            page.insert_text(
                fitz.Point(rect.x0 + 2, rect.y1 - 2),
                value,
                fontsize=10,
                fontname='helv',
            )

    page.clean_contents()

doc.save('/tmp/form-final.pdf', garbage=4, deflate=True)
doc.close()
print('Flattened form saved to /tmp/form-final.pdf')
""" })
\`\`\`

**Note:** Flattening is optional. With NeedAppearances=false and baked AP streams,
the filled (non-flattened) PDF renders correctly in most viewers. Only flatten
if the recipient needs a "locked" copy or you want to strip the form entirely.

## Step 7: Deliver

\`\`\`
// Download the filled PDF directly (RECOMMENDED)
download_from_sandbox({ source: "/tmp/form-filled.pdf" })
// Returns { success, content_base64, size, mimeType }

// Or verify file size first
run_command({ command: "ls -lh /tmp/form-filled.pdf" })
\`\`\`

## Fallback: Scanned / Non-Interactive Forms

If the PDF has no AcroForm fields (it's a scanned image or flat design), the agent
can overlay text at specific coordinates:

\`\`\`
run_code({ code: """
import fitz

doc = fitz.open('/tmp/scanned-form.pdf')
page = doc[0]

# Render page as image for visual analysis
pix = page.get_pixmap(dpi=150)
pix.save('/tmp/form-preview.png')
print(f'Preview saved: {pix.width}x{pix.height}px')
print('Inspect the image to identify field positions (x, y coordinates)')
""" })

// Agent views the image (via screenshot tool or returns to user),
// identifies where fields are located, then:

run_code({ code: """
import fitz

doc = fitz.open('/tmp/scanned-form.pdf')
page = doc[0]

# Overlay text at identified positions (coordinates in PDF points, 72 per inch)
fields = [
    (fitz.Point(150, 245), 'John A. Smith'),      # Name field
    (fitz.Point(150, 290), '03/15/1985'),          # DOB field
    (fitz.Point(150, 335), '123 Main St, Dallas'), # Address field
]

for point, text in fields:
    page.insert_text(point, text, fontsize=11, fontname='helv', color=(0, 0, 0))

doc.save('/tmp/scanned-form-filled.pdf')
doc.close()
print('Filled scanned form saved')
""" })
\`\`\`

This is less reliable than AcroForm filling \u2014 coordinates must be determined
per-form. But it works for any PDF, including scanned paper forms.

## Tips
- Always inventory fields first \u2014 present to user before filling
- Watch for duplicate field names \u2014 use index-based filling when names collide
- Set \`text_fontsize = 0\` for auto-fit \u2014 PyMuPDF scales text to fit the field rect
- **Always set NeedAppearances=false** after filling \u2014 this is the #1 cause of blank fields
- Checkboxes: use 'Yes'/'Off' (or the widget's on_state() value for non-standard PDFs)
- Signature fields (type 6) accept typed text like "/s/ Name" for e-signatures
- AcroForm field names are set by the form creator and may be cryptic
- Use \`upload_to_sandbox\` / \`download_from_sandbox\` for file transfer \u2014 no gist relays needed
- No browser session needed \u2014 all Python in the sandbox, near-zero quota`
  }
};

// ../../../nexus-terminal/modules/nexus-sense/tools/injectable/build.ts
function buildUtilsInjectable() {
  return `
    window.__utils = (() => {
      const INTERACTIVE_TAGS = new Set(['a','button','input','select','textarea','details','summary','audio','video']);
      const INTERACTIVE_ROLES = new Set(['button','link','menuitem','tab','checkbox','radio','switch','option','combobox','slider','spinbutton','textbox','searchbox']);

      function isInteractiveElement(el) {
        // Defensive: text nodes / comment nodes have no tagName. Skip them
        // \u2014 they can't be interactive. Was the ".toLowerCase of undefined"
        // crash on Zillow's challenge page when scan walked nodes that
        // weren't full Elements.
        if (!el || typeof el.tagName !== 'string') return false;
        const tag = el.tagName.toLowerCase();
        if (INTERACTIVE_TAGS.has(tag)) return true;
        const role = el.getAttribute('role');
        if (role && INTERACTIVE_ROLES.has(role)) return true;
        if (el.hasAttribute('onclick') || el.hasAttribute('onkeydown')) return true;
        const tabindex = el.getAttribute('tabindex');
        if (tabindex && tabindex !== '-1') return true;
        try { if ((el.ownerDocument.defaultView || window).getComputedStyle(el).cursor === 'pointer') return true; } catch {}
        return false;
      }

      function isVisibleElement(el) {
        if (!('style' in el)) return true;
        try {
          const style = (el.ownerDocument.defaultView || window).getComputedStyle(el);
          if (style.display === 'none') return false;
          if (style.visibility === 'hidden' || style.visibility === 'collapse') return false;
          if (parseFloat(style.opacity) === 0) return false;
          if (style.overflow === 'hidden') {
            const rect = el.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return false;
          }
        } catch {}
        return true;
      }

      function truncateText(text, maxLength) {
        if (!text) return undefined;
        const trimmed = text.trim();
        if (trimmed.length === 0) return undefined;
        if (trimmed.length <= (maxLength || 100)) return trimmed;
        return trimmed.slice(0, maxLength || 100) + '...';
      }

      function computeRelevanceScore(el) {
        let score = 0;
        if (isInteractiveElement(el)) score += 10;
        const text = el.textContent?.trim();
        if (text && text.length > 0 && text.length < 500) score += 5;
        if (el.id) score += 3;
        if (el.getAttribute('name') || el.getAttribute('placeholder')) score += 3;
        if (el.getAttribute('role')) score += 2;
        if ('style' in el) {
          try {
            const style = (el.ownerDocument.defaultView || window).getComputedStyle(el);
            if (style.cursor === 'pointer') score += 2;
            const z = parseInt(style.zIndex) || 0;
            if (z > 0) score += Math.min(3, Math.floor(z / 100));
          } catch {}
        }
        const rect = el.getBoundingClientRect();
        const area = rect.width * rect.height;
        if (area > 10000) score += 3;
        else if (area > 2500) score += 2;
        else if (area > 500) score += 1;
        return score;
      }

      const SECRET_PATTERNS = [
        /sk_live_\\w+/g, /sk_test_\\w+/g, /AKIA[0-9A-Z]{16}/g,
        /ghp_[a-zA-Z0-9]{36}/g, /gho_[a-zA-Z0-9]{36}/g, /github_pat_\\w+/g,
        /glpat-\\w+/g, /xox[bporas]-\\w+/g, /sk-[a-zA-Z0-9]{32,}/g,
      ];

      function redactSecrets(text) {
        let result = text;
        for (const pattern of SECRET_PATTERNS) {
          result = result.replace(pattern, '[REDACTED]');
        }
        return result;
      }

      function generateSelector(el) {
        if (!el || typeof el.tagName !== 'string') return '';
        if (el.id) return '#' + el.id;
        const tag = el.tagName.toLowerCase();
        const role = el.getAttribute('role');
        const ariaLabel = el.getAttribute('aria-label');
        const name = el.getAttribute('name');
        if (ariaLabel) return tag + '[aria-label="' + ariaLabel + '"]';
        if (role && name) return tag + '[role="' + role + '"][name="' + name + '"]';
        if (name) return tag + '[name="' + name + '"]';
        if (role) return tag + '[role="' + role + '"]';
        const parent = el.parentElement;
        if (parent) {
          const siblings = Array.from(parent.children).filter(s => s.tagName === el.tagName);
          if (siblings.length === 1) return tag;
          const index = siblings.indexOf(el) + 1;
          return tag + ':nth-of-type(' + index + ')';
        }
        return tag;
      }

      return { isInteractiveElement, isVisibleElement, truncateText, computeRelevanceScore, redactSecrets, generateSelector };
    })();
  `;
}

// ../../../nexus-terminal/modules/nexus-sense/tools/injectable/scan.injectable.ts
var SCAN_SCRIPT = `(function(args, __utils) {
  var detail = args.detail || 'standard';
  var region = args.region;
  var filter = args.filter;
  var snapshot = args.snapshot;
  var container = args.container;
  var includeOffscreen = args.includeOffscreen;

  var DETAIL_LIMITS = { quick: 5, standard: 20, full: 50 };
  var limit = (args.limit != null) ? args.limit : (DETAIL_LIMITS[detail] || 20);

  // Default scan region: entire viewport
  var scanRegion = region || {
    x: 0,
    y: 0,
    width: window.innerWidth,
    height: window.innerHeight
  };

  // \u2500\u2500 Helpers \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

  function isInRegion(el, reg) {
    // Guard: text nodes, comment nodes, detached/dead elements may not have
    // getBoundingClientRect, or it may return a zero rect. Returning false
    // (skip element) is safer than crashing the whole scan. This was the
    // ".right of undefined" crash on Zillow's challenge page where some
    // elements were in unusual states.
    if (!el || typeof el.getBoundingClientRect !== 'function') return false;
    var rect;
    try { rect = el.getBoundingClientRect(); } catch (e) { return false; }
    if (!rect || typeof rect.right !== 'number') return false;
    return (
      rect.right >= reg.x &&
      rect.left <= reg.x + reg.width &&
      rect.bottom >= reg.y &&
      rect.top <= reg.y + reg.height &&
      rect.width > 0 &&
      rect.height > 0
    );
  }

  function truncateClassName(className, maxClasses) {
    if (!className) return undefined;
    var classes = className.split(/\\s+/).filter(Boolean);
    if (classes.length <= (maxClasses || 3)) return className;
    return classes.slice(0, maxClasses || 3).join(' ') + '...';
  }

  // \u2500\u2500 Element Collection \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

  function getElementsInRegion(reg) {
    var elements = [];
    var seen = new Set();

    // Sample points within region
    var stepX = Math.max(10, reg.width / 20);
    var stepY = Math.max(10, reg.height / 20);
    for (var x = reg.x; x < reg.x + reg.width; x += stepX) {
      for (var y = reg.y; y < reg.y + reg.height; y += stepY) {
        var el = document.elementFromPoint(x, y);
        if (el && !seen.has(el)) {
          seen.add(el);
          elements.push(el);
        }
      }
    }

    // Also get all elements and filter by bounding box
    var allElements = document.querySelectorAll('*');
    for (var i = 0; i < allElements.length; i++) {
      var elem = allElements[i];
      if (seen.has(elem)) continue;
      var rect = elem.getBoundingClientRect();
      if (
        rect.right >= reg.x &&
        rect.left <= reg.x + reg.width &&
        rect.bottom >= reg.y &&
        rect.top <= reg.y + reg.height &&
        rect.width > 0 &&
        rect.height > 0
      ) {
        seen.add(elem);
        elements.push(elem);
      }
    }

    // Shadow DOM traversal
    // A growing queue (2026-11-02): hosts found INSIDE a shadow tree are visited too \u2014 the old fixed snapshot stopped at the first level,
    // so nested web components (cars.com: 686 fuse-* hosts) stayed invisible. Our own debug widgets (react-scan / react-grab) are skipped.
    var seenArr = Array.from(seen);
    for (var s = 0; s < seenArr.length && s < 60000; s++) {
      var sEl = seenArr[s];
      if (sEl.shadowRoot && !(sEl.id === 'react-scan-root' || sEl.id === 'react-scan-toolbar-root' || (sEl.hasAttribute && sEl.hasAttribute('data-react-grab')))) {
        try {
          var shadowElements = sEl.shadowRoot.querySelectorAll('*');
          for (var j = 0; j < shadowElements.length; j++) {
            var shadowEl = shadowElements[j];
            if (shadowEl.shadowRoot) seenArr.push(shadowEl);   // descend into nested shadow trees, in or out of the region
            if (seen.has(shadowEl)) continue;
            var sRect = shadowEl.getBoundingClientRect();
            if (
              sRect.right >= reg.x &&
              sRect.left <= reg.x + reg.width &&
              sRect.bottom >= reg.y &&
              sRect.top <= reg.y + reg.height &&
              sRect.width > 0 &&
              sRect.height > 0
            ) {
              seen.add(shadowEl);
              elements.push(shadowEl);
            }
          }
        } catch (e) { /* closed shadow root */ }
      }
    }

    // Filter by CSS visibility
    return elements.filter(function(el) { return __utils.isVisibleElement(el); });
  }

  function getElementsWithOffscreen(containerSel, inclOffscreen, fallbackReg) {
    var root = document;
    if (containerSel) {
      var containerEl = document.querySelector(containerSel);
      if (!containerEl) return [];
      root = containerEl;
    }

    var elements = [];
    var allElements = root.querySelectorAll('*');

    for (var i = 0; i < allElements.length; i++) {
      var el = allElements[i];
      if (!__utils.isVisibleElement(el)) continue;
      var rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) continue;

      if (inclOffscreen) {
        elements.push(el);
      } else {
        if (
          rect.right >= fallbackReg.x &&
          rect.left <= fallbackReg.x + fallbackReg.width &&
          rect.bottom >= fallbackReg.y &&
          rect.top <= fallbackReg.y + fallbackReg.height
        ) {
          elements.push(el);
        }
      }
    }
    return elements;
  }

  // \u2500\u2500 Snapshot Aggregation \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

  function collectCounts(reg) {
    var interactive = 0, forms = 0, inputs = 0, buttons = 0;
    var links = 0, images = 0, headings = 0, landmarks = 0, errors = 0;
    var allElements = document.querySelectorAll('*');

    for (var i = 0; i < allElements.length; i++) {
      var el = allElements[i];
      if (!isInRegion(el, reg)) continue;
      var tag = el.tagName.toLowerCase();

      if (__utils.isInteractiveElement(el)) interactive++;
      if (tag === 'form') forms++;
      if (tag === 'input' || tag === 'select' || tag === 'textarea') inputs++;
      if (tag === 'button' || el.getAttribute('role') === 'button') buttons++;
      if (tag === 'a') links++;
      if (tag === 'img') images++;
      if (/^h[1-6]$/.test(tag)) headings++;

      var role = el.getAttribute('role');
      if (role && ['main','navigation','banner','contentinfo','complementary','search','region'].indexOf(role) !== -1) {
        landmarks++;
      }
      if (el.getAttribute('aria-invalid') === 'true' ||
          ('classList' in el && el.classList.contains('error'))) {
        errors++;
      }
    }
    return { interactive: interactive, forms: forms, inputs: inputs, buttons: buttons,
             links: links, images: images, headings: headings, landmarks: landmarks, errors: errors };
  }

  function collectAccessibility(reg) {
    var landmarksList = [];
    var headingsList = [];
    var ariaLiveRegions = 0;

    var landmarkRoles = ['main','navigation','banner','contentinfo','complementary','search','region','form'];
    for (var r = 0; r < landmarkRoles.length; r++) {
      var els = document.querySelectorAll('[role="' + landmarkRoles[r] + '"]');
      for (var i = 0; i < els.length; i++) {
        if (!isInRegion(els[i], reg)) continue;
        landmarksList.push({
          role: landmarkRoles[r],
          label: els[i].getAttribute('aria-label') || els[i].getAttribute('aria-labelledby') || undefined
        });
      }
    }

    var semanticMap = { main: 'main', nav: 'navigation', header: 'banner', footer: 'contentinfo', aside: 'complementary' };
    var semanticTags = Object.keys(semanticMap);
    for (var t = 0; t < semanticTags.length; t++) {
      var tag = semanticTags[t];
      var sEls = document.querySelectorAll(tag);
      for (var j = 0; j < sEls.length; j++) {
        if (!isInRegion(sEls[j], reg)) continue;
        if (!sEls[j].hasAttribute('role')) {
          landmarksList.push({
            role: semanticMap[tag],
            label: sEls[j].getAttribute('aria-label') || undefined
          });
        }
      }
    }

    for (var level = 1; level <= 6; level++) {
      var hEls = document.querySelectorAll('h' + level);
      for (var h = 0; h < hEls.length; h++) {
        if (!isInRegion(hEls[h], reg)) continue;
        var hText = hEls[h].textContent;
        headingsList.push({ level: level, text: (hText ? hText.trim().slice(0, 50) : '') });
      }
    }

    var liveEls = document.querySelectorAll('[aria-live]');
    for (var l = 0; l < liveEls.length; l++) {
      if (isInRegion(liveEls[l], reg)) ariaLiveRegions++;
    }

    return { landmarks: landmarksList, headings: headingsList, ariaLiveRegions: ariaLiveRegions };
  }

  function collectErrors(reg) {
    var invalidFields = [];
    var errorMessages = [];
    var totalErrors = 0;

    var invalidEls = document.querySelectorAll('[aria-invalid="true"]');
    for (var i = 0; i < invalidEls.length; i++) {
      var el = invalidEls[i];
      if (!isInRegion(el, reg)) continue;
      totalErrors++;
      var field = {};
      if (el.id) field.id = el.id;
      if (el.name) field.name = el.name;
      var describedBy = el.getAttribute('aria-describedby');
      if (describedBy) {
        var descEl = document.getElementById(describedBy);
        if (descEl && descEl.textContent) {
          field.message = descEl.textContent.trim().slice(0, 100);
        }
      }
      invalidFields.push(field);
    }

    var errClassEls = document.querySelectorAll('.error, .has-error, .is-invalid, .field-error');
    for (var j = 0; j < errClassEls.length; j++) {
      if (!isInRegion(errClassEls[j], reg)) continue;
      if (errClassEls[j].getAttribute('aria-invalid') !== 'true') totalErrors++;
    }

    var errMsgSels = ['.error-message', '.field-error', '.validation-error', '[role="alert"]', '.alert-danger', '.text-danger'];
    for (var k = 0; k < errMsgSels.length; k++) {
      var msgEls = document.querySelectorAll(errMsgSels[k]);
      for (var m = 0; m < msgEls.length; m++) {
        if (!isInRegion(msgEls[m], reg)) continue;
        var txt = msgEls[m].textContent ? msgEls[m].textContent.trim() : '';
        if (txt.length > 0 && txt.length < 200) errorMessages.push(txt);
      }
    }

    return { invalidFields: invalidFields, errorMessages: errorMessages.slice(0, 10), totalErrors: totalErrors };
  }

  function collectForms(reg) {
    var totalForms = 0;
    var fields = [];
    var submitButtons = 0;

    var formEls = document.querySelectorAll('form');
    for (var i = 0; i < formEls.length; i++) {
      if (isInRegion(formEls[i], reg)) totalForms++;
    }

    var inputEls = document.querySelectorAll('input, select, textarea');
    for (var j = 0; j < inputEls.length; j++) {
      var el = inputEls[j];
      if (!isInRegion(el, reg)) continue;
      var tag = el.tagName.toLowerCase();
      if (tag === 'input') {
        fields.push({ type: el.type || 'text', name: el.name || undefined, required: el.required, hasValue: el.value.length > 0, isValid: el.checkValidity() });
      } else if (tag === 'select') {
        fields.push({ type: 'select', name: el.name || undefined, required: el.required, hasValue: el.value.length > 0, isValid: el.checkValidity() });
      } else if (tag === 'textarea') {
        fields.push({ type: 'textarea', name: el.name || undefined, required: el.required, hasValue: el.value.length > 0, isValid: el.checkValidity() });
      }
    }

    var btnEls = document.querySelectorAll('button[type="submit"], input[type="submit"]');
    for (var b = 0; b < btnEls.length; b++) {
      if (isInRegion(btnEls[b], reg)) submitButtons++;
    }

    return { totalForms: totalForms, fields: fields.slice(0, 20), submitButtons: submitButtons };
  }

  function buildSnapshotData(reg, options) {
    var snap = {};
    snap.counts = collectCounts(reg);
    if (options.accessibility) snap.accessibility = collectAccessibility(reg);
    if (options.errors) snap.errors = collectErrors(reg);
    if (options.forms) snap.forms = collectForms(reg);
    return snap;
  }

  // \u2500\u2500 Main Scan Logic \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

  // Collect elements
  var elements;
  if (container || includeOffscreen) {
    elements = getElementsWithOffscreen(container, includeOffscreen, scanRegion);
  } else {
    elements = getElementsInRegion(scanRegion);
  }

  // Apply filters
  var filtered = elements;

  // In quick mode, only interactive elements
  if (detail === 'quick') {
    filtered = filtered.filter(function(el) { return __utils.isInteractiveElement(el); });
  }

  if (filter) {
    if (filter.tagName) {
      var tagLower = filter.tagName.toLowerCase();
      filtered = filtered.filter(function(el) { return el.tagName.toLowerCase() === tagLower; });
    }

    if (filter.hasText) {
      var searchText = filter.hasText.toLowerCase();
      filtered = filtered.filter(function(el) {
        var tc = el.textContent;
        return tc && tc.toLowerCase().indexOf(searchText) !== -1;
      });
    }

    // componentName filter skipped in injectable (requires Bippy fiber access)

    if (filter.isInteractive) {
      filtered = filtered.filter(function(el) { return __utils.isInteractiveElement(el); });
    }

    if (filter.id) {
      filtered = filtered.filter(function(el) { return el.id === filter.id; });
    }

    if (filter.className) {
      filtered = filtered.filter(function(el) {
        return 'classList' in el && el.classList.contains(filter.className);
      });
    }

    if (filter.placeholder) {
      var searchPlaceholder = filter.placeholder.toLowerCase();
      filtered = filtered.filter(function(el) {
        var ph = el.getAttribute('placeholder');
        return ph && ph.toLowerCase().indexOf(searchPlaceholder) !== -1;
      });
    }

    if (filter.name) {
      filtered = filtered.filter(function(el) { return el.getAttribute('name') === filter.name; });
    }

    if (filter.hasAttribute) {
      var parts = filter.hasAttribute.split('=');
      var attrName = parts[0];
      var attrValue = parts.length > 1 ? parts[1] : undefined;
      filtered = filtered.filter(function(el) {
        if (attrValue !== undefined) {
          return el.getAttribute(attrName) === attrValue;
        }
        return el.hasAttribute(attrName);
      });
    }
  }

  // Score and sort
  var scored = filtered.map(function(el) {
    var score = __utils.computeRelevanceScore(el);
    // Deprioritize footer/ticker region (bottom 30px)
    var rect = el.getBoundingClientRect();
    if (rect.y >= window.innerHeight - 30) score -= 8;
    return { el: el, score: score };
  });

  scored.sort(function(a, b) {
    var diff = b.score - a.score;
    if (diff !== 0) return diff;
    var ra = a.el.getBoundingClientRect();
    var rb = b.el.getBoundingClientRect();
    var yDiff = ra.top - rb.top;
    if (Math.abs(yDiff) > 10) return yDiff;
    return ra.left - rb.left;
  });

  var truncated = scored.length > limit;
  var limited = scored.slice(0, limit);

  var includeClassName = detail !== 'quick';

  // Build result elements
  var resultElements;
  if (snapshot && snapshot.countOnly) {
    resultElements = [];
  } else {
    resultElements = limited.map(function(item) {
      var el = item.el;
      var score = item.score;
      var rect = el.getBoundingClientRect();
      var tagName = el.tagName.toLowerCase();
      var isFormElement = (tagName === 'input' || tagName === 'select' || tagName === 'textarea');

      // Build selector hint
      var selector;
      if (el.id) {
        selector = '#' + el.id;
      } else if (isFormElement) {
        var elName = el.getAttribute('name');
        var elPlaceholder = el.getAttribute('placeholder');
        var elType = el.type;
        if (elName) {
          selector = tagName + '[name="' + elName + '"]';
        } else if (elPlaceholder) {
          selector = tagName + '[placeholder="' + elPlaceholder + '"]';
        } else if (elType && elType !== 'text') {
          selector = tagName + '[type="' + elType + '"]';
        }
      }
      if (!selector) {
        selector = __utils.generateSelector(el);
      }

      // Generate robust CSS selector via @medv/finder if injected
      var cssSelector;
      try {
        if (typeof window.__medvFinder === 'function') {
          cssSelector = window.__medvFinder(el, { timeoutMs: 500 });
        }
      } catch (e) { /* finder can fail on detached/cross-origin elements */ }

      // className handling
      var rawClassName = ('className' in el && el.className && typeof el.className === 'string')
        ? el.className : undefined;
      var className = includeClassName
        ? (detail === 'full' ? rawClassName : truncateClassName(rawClassName))
        : undefined;

      // Off-screen detection
      var offscreen;
      if (includeOffscreen) {
        offscreen = (rect.bottom < 0 || rect.top > window.innerHeight ||
                     rect.right < 0 || rect.left > window.innerWidth);
      }

      // Redact text content
      var rawText = __utils.truncateText(el.textContent, 50);
      var textContent = rawText ? __utils.redactSecrets(rawText) : undefined;

      var entry = {
        tagName: tagName,
        id: el.id || undefined,
        className: className,
        textContent: textContent,
        rect: {
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        },
        isInteractive: __utils.isInteractiveElement(el),
        relevanceScore: score,
        selector: selector,
        cssSelector: cssSelector
      };

      // Keyboard-first (2026-11-07): the element's declared key bindings, when present.
      var accessKey = el.getAttribute('accesskey'); if (accessKey) entry.accessKey = accessKey.substring(0, 10);
      var keyShortcuts = el.getAttribute('aria-keyshortcuts'); if (keyShortcuts) entry.ariaKeyShortcuts = keyShortcuts.substring(0, 60);

      // Input-specific attributes
      if (isFormElement) {
        entry.placeholder = el.getAttribute('placeholder') || undefined;
        entry.type = el.type || undefined;
        entry.name = el.getAttribute('name') || undefined;
      }

      // Off-screen flag
      if (offscreen !== undefined) {
        entry.isOffscreen = offscreen;
      }

      // Click target (2026-10-22): viewport centre + hit test \u2014 occluded when the topmost element there is not this one
      // (a sticky header, consent bar, modal). Agents should click clickPoint, or scroll / dismiss_overlays when occluded.
      try {
        if (rect.width > 0 && rect.height > 0) {
          var cpx = Math.round(rect.x + rect.width / 2), cpy = Math.round(rect.y + rect.height / 2);
          entry.clickPoint = { x: cpx, y: cpy };
          if (cpx >= 0 && cpy >= 0 && cpx < window.innerWidth && cpy < window.innerHeight) {
            var topEl = document.elementFromPoint(cpx, cpy);
            if (topEl && topEl !== el && !el.contains(topEl) && !topEl.contains(el)) {
              entry.occluded = true;
              var tcls = (typeof topEl.className === 'string' && topEl.className.trim()) ? '.' + topEl.className.trim().split(/\\s+/)[0] : '';
              entry.occludedBy = (topEl.tagName.toLowerCase() + (topEl.id ? '#' + topEl.id : '') + tcls).slice(0, 60);
            } else {
              entry.occluded = false;
            }
          }
        }
      } catch (e) { /* hit test is best effort */ }

      // Layout animation warning \u2014 flag elements animating layout-triggering properties
      // (from react-doctor's LAYOUT_PROPERTIES: width, height, top, left, right, bottom, margin, padding)
      if ('style' in el && detail === 'full') {
        try {
          var elStyle = (el.ownerDocument.defaultView || window).getComputedStyle(el);
          var transition = elStyle.transition || elStyle.webkitTransition || '';
          var animation = elStyle.animationName || elStyle.webkitAnimationName || '';
          var LAYOUT_PROPS = ['width', 'height', 'top', 'left', 'right', 'bottom', 'margin', 'padding', 'font-size', 'border'];
          var hasLayoutAnimation = false;
          if (transition && transition !== 'none') {
            for (var lp = 0; lp < LAYOUT_PROPS.length; lp++) {
              if (transition.indexOf(LAYOUT_PROPS[lp]) !== -1 || transition.indexOf('all') !== -1) {
                hasLayoutAnimation = true;
                break;
              }
            }
          }
          if (!hasLayoutAnimation && animation && animation !== 'none') {
            hasLayoutAnimation = true;
          }
          if (hasLayoutAnimation) {
            entry.hasLayoutAnimation = true;
          }
        } catch (e) { /* cross-origin */ }
      }

      return entry;
    });
  }

  var result = {
    elements: resultElements,
    count: limited.length,
    truncated: truncated,
    _meta: {
      tokenEstimate: (snapshot && snapshot.countOnly)
        ? 20
        : 20 + limited.length * 30 + (snapshot ? 50 : 0),
      detailLevel: detail,
      truncated: truncated
    }
  };

  // Add snapshot if requested
  if (snapshot) {
    result.snapshot = buildSnapshotData(scanRegion, snapshot);
  }

  return result;
})`;

// ../../../nexus-terminal/modules/nexus-sense/tools/injectable/deep-query.injectable.ts
var DEEP_QUERY_FNS = `
function __nxDq(s) {
  var e = null; try { e = document.querySelector(s); } catch (x) { return null; }
  if (e) return e;
  var stack = [document], seen = 0;
  while (stack.length && seen < 20000) {
    var root = stack.pop(); var all = root.querySelectorAll('*'); seen += all.length;
    for (var i = 0; i < all.length; i++) {
      var sr = all[i].shadowRoot;
      if (sr) { var h = null; try { h = sr.querySelector(s); } catch (x) {} if (h) return h; stack.push(sr); }
    }
  }
  return null;
}
function __nxDeepPoint(x, y) {
  var t = document.elementFromPoint(x, y), guard = 0;
  while (t && t.shadowRoot && guard++ < 20) { var u = t.shadowRoot.elementFromPoint(x, y); if (!u || u === t) break; t = u; }
  return t;
}
function __nxIsOwnWidget(el) {
  return !!el && (el.id === 'react-scan-root' || el.id === 'react-scan-toolbar-root' || (el.hasAttribute && el.hasAttribute('data-react-grab')));
}
function __nxDeepAll(root, sel) {
  // Every match under root AND inside every nested OPEN shadow root (light DOM first, then shadow trees depth-first). Our own debug
  // widgets (react-scan / react-grab hosts \u2014 shadow roots of their own) are skipped. 2026-11-02: text clicks and scan stopped at the
  // first shadow level, so cars.com's nested fuse-* components (686 hosts) stayed invisible to the nexus tools.
  var out = [], stack = [root], seen = 0;
  while (stack.length && seen < 60000) {
    var r = stack.shift(); var m = []; try { m = r.querySelectorAll(sel); } catch (x) { return out; }
    for (var i = 0; i < m.length; i++) out.push(m[i]);
    var all = r.querySelectorAll('*'); seen += all.length;
    for (var j = 0; j < all.length; j++) { var h = all[j]; if (h.shadowRoot && !__nxIsOwnWidget(h)) stack.push(h.shadowRoot); }
  }
  return out;
}
function __nxComposedParent(el) {
  // Parent that crosses a shadow boundary (shadow root \u2192 its host).
  if (!el) return null; if (el.parentElement) return el.parentElement;
  var r = el.getRootNode && el.getRootNode(); return r && r.host ? r.host : null;
}
`;

// ../../../nexus-terminal/modules/nexus-sense/tools/injectable/grab.injectable.ts
var GRAB_SCRIPT = `(function(args, __utils) {${DEEP_QUERY_FNS}
  var MAX_LENGTH = { quick: 500, standard: 2000, full: 10000, debug: 2000 };
  var detail = args.detail || 'standard';
  var maxLen = args.maxLength || MAX_LENGTH[detail] || 2000;

  // RENDERED text \u2014 what a user sees, unlike raw textContent which includes
  // the SOURCE of <style>/<script> elements and joins terminal rows without
  // newlines (port of the internal grab fix, 2026-08-16). Terminal-aware:
  // xterm windows return one line per .xterm-rows row div.
  function renderedText(el) {
    try {
      var xterm = null;
      if (el.querySelector) xterm = el.querySelector('.xterm');
      if (!xterm && el.closest) xterm = el.closest('.xterm');
      if (xterm) {
        var rows = xterm.querySelectorAll('.xterm-rows > div');
        if (rows.length > 0) {
          var lines = [];
          for (var r = 0; r < rows.length; r++) {
            lines.push((rows[r].textContent || '').replace(/\\u00a0/g, ' ').replace(/\\s+$/, ''));
          }
          while (lines.length && lines[lines.length - 1] === '') lines.pop();
          var chrome = '';
          if (el !== xterm && el.cloneNode) {
            var cclone = el.cloneNode(true);
            var strip1 = cclone.querySelectorAll('style, script, noscript, .xterm');
            for (var q = 0; q < strip1.length; q++) strip1[q].parentNode && strip1[q].parentNode.removeChild(strip1[q]);
            chrome = (cclone.textContent || '').replace(/\\s+/g, ' ').replace(/^\\s+|\\s+$/g, '');
          }
          return (chrome ? chrome + '\\n' : '') + lines.join('\\n');
        }
      }
      // 2026-10-22 (A/B): live form-control VALUES are what a user sees (calculator outputs, filled inputs, chosen
      // options), but textContent never includes them \u2014 cars.com's payment calculator read back empty. Substitute each
      // control in the clone with its current value; passwords and hidden inputs are skipped.
      var CTL = 'input:not([type=hidden]):not([type=password]):not([type=checkbox]):not([type=radio]), select, textarea, output';
      var ctlValue = function (c) {
        if (c.tagName === 'SELECT') { var o = c.options && c.options[c.selectedIndex]; return o ? (o.text || o.value || '') : ''; }
        return (c.value || c.textContent || '') + '';
      };
      if (el.matches && el.matches(CTL)) return ctlValue(el).replace(/^\\s+|\\s+$/g, '');
      var clone = el.cloneNode(true);
      if (el.querySelectorAll) {
        var origCtl = el.querySelectorAll(CTL), cloneCtl = clone.querySelectorAll(CTL);
        for (var ci2 = 0; ci2 < origCtl.length && ci2 < cloneCtl.length; ci2++) {
          var cv = ctlValue(origCtl[ci2]);
          if (cloneCtl[ci2].parentNode) cloneCtl[ci2].parentNode.replaceChild(document.createTextNode(cv ? ' ' + cv + ' ' : ' '), cloneCtl[ci2]);
        }
      }
      var strip = clone.querySelectorAll ? clone.querySelectorAll('style, script, noscript') : [];
      for (var k = 0; k < strip.length; k++) strip[k].parentNode && strip[k].parentNode.removeChild(strip[k]);
      return (clone.textContent || '').replace(/^\\s+|\\s+$/g, '');
    } catch (e) {
      return (el.textContent || '').replace(/^\\s+|\\s+$/g, '');
    }
  }

  // \u2500\u2500 Multi-element mode \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  if (args.selectorAll) {
    // 2026-11-02 (A/B: osu.edu result list, bestbuy): elements inside open shadow roots were never selected, and contains / pattern ran on
    // raw textContent (newlines + runs of spaces between words, no shadow text) so visible phrases did not match. Select across shadow
    // roots and filter on whitespace-normalised COMPOSED text (light + open shadow trees, slots resolved).
    var allEls = __nxDeepAll(document, args.selectorAll);
    var totalMatched = allEls.length;
    var composedText = function (n, depth) {
      if (!n || depth > 40) return '';
      if (n.nodeType === 3) return n.nodeValue || '';
      if (n.nodeType !== 1 && n.nodeType !== 11) return '';
      var tg = n.tagName; if (tg === 'SCRIPT' || tg === 'STYLE' || tg === 'NOSCRIPT') return '';
      var kids = n.shadowRoot ? n.shadowRoot.childNodes : n.childNodes;
      if (tg === 'SLOT' && n.assignedNodes) { var asg = n.assignedNodes({ flatten: true }); if (asg.length) kids = asg; }
      var out = ''; for (var ki = 0; ki < kids.length; ki++) out += ' ' + composedText(kids[ki], depth + 1);
      return out;
    };
    var normText = function (el) { return composedText(el, 0).replace(/\\s+/g, ' ').trim(); };

    // Apply text filters
    if (args.contains) {
      var lower = args.contains.toLowerCase().replace(/\\s+/g, ' ').trim();
      allEls = allEls.filter(function(el) {
        return normText(el).toLowerCase().indexOf(lower) !== -1;
      });
    }
    if (args.pattern) {
      try {
        var re = new RegExp(args.pattern, 'i');
        allEls = allEls.filter(function(el) { return re.test(normText(el)); });
      } catch(e) { /* invalid regex */ }
    }

    // Text-only format
    if (args.format === 'text') {
      var perMax = Math.min(maxLen, 500);
      var texts = allEls.map(function(el) {
        var raw = (el.textContent || '').trim();
        return raw.length > perMax ? raw.slice(0, perMax) + '...' : raw;
      });
      return { found: allEls.length > 0, text: texts.join('\\n---\\n'), totalMatched: totalMatched };
    }

    // Extract mode
    if (args.extract) {
      var allItems = [];
      for (var ei = 0; ei < allEls.length; ei++) {
        var ext = extractContent(allEls[ei], args.extract);
        allItems = allItems.concat(ext.items);
      }
      return { found: allEls.length > 0, extracted: { type: args.extract, items: allItems, count: allItems.length }, totalMatched: totalMatched };
    }

    // Full structured
    var results = [];
    var limit = Math.min(50, allEls.length);
    for (var ri = 0; ri < limit; ri++) {
      results.push(buildResult(allEls[ri], Math.min(maxLen, 500)));
    }
    return { found: results.length > 0, elements: results, totalMatched: totalMatched };
  }

  // \u2500\u2500 Single-element mode \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  var element = null;
  if (args.selector) {
    element = __nxDq(args.selector);
  } else if (typeof args.x === 'number' && typeof args.y === 'number') {
    element = document.elementFromPoint(args.x, args.y);
  }

  if (!element) {
    return { found: false };
  }

  // Extract mode
  if (args.extract) {
    var extracted = extractContent(element, args.extract);
    return { found: true, extracted: extracted };
  }

  // Text-only format
  if (args.format === 'text') {
    var rawText = renderedText(element);
    var text = rawText.length > maxLen ? rawText.slice(0, maxLen) + '...' : rawText;
    text = __utils.redactSecrets(text);

    if (args.contains) {
      if (text.toLowerCase().indexOf(args.contains.toLowerCase()) === -1) {
        return { found: true, text: '', totalMatched: 0, hint: 'substring not found; the element text begins: ' + rawText.slice(0, 160) };
      }
    }
    if (args.pattern) {
      try {
        var preRe = new RegExp(args.pattern, 'gi');
        var matches = text.match(preRe);
        if (!matches) return { found: true, text: '', totalMatched: 0, hint: 'pattern matched nothing; the element text begins: ' + rawText.slice(0, 160) };
        text = matches.join('\\n');
      } catch(e) { /* invalid regex */ }
    }

    return { found: true, text: text };
  }

  // Markdown format
  if (args.format === 'markdown') {
    var md = domToMarkdown(element, maxLen);
    return { found: true, markdown: __utils.redactSecrets(md) };
  }

  // Default: full structured result
  return buildResult(element, maxLen);

  // \u2500\u2500 Helper: build full structured result \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  function buildResult(el, textMax) {
    var rect = el.getBoundingClientRect();
    var tagName = el.tagName.toLowerCase();

    var rawTxt = renderedText(el);
    if (args.pattern) {
      try { var fm = rawTxt.match(new RegExp(args.pattern, 'gi')); if (fm) rawTxt = fm.join('\\n'); } catch (e) { /* invalid regex */ }
    }
    var txtOut;
    if (rawTxt.length > 0) {
      var truncated = rawTxt.length > textMax ? rawTxt.slice(0, textMax) + '...' : rawTxt;
      txtOut = __utils.redactSecrets(truncated);
    }

    var attributes = {};
    for (var i = 0; i < el.attributes.length; i++) {
      var attr = el.attributes[i];
      attributes[attr.name] = __utils.redactSecrets(attr.value);
    }

    var computedStyles = {};
    var styleProps = ['display', 'visibility', 'position', 'zIndex', 'cursor',
                      'color', 'backgroundColor', 'fontSize', 'fontWeight'];
    if ('style' in el) {
      try {
        var cs = (el.ownerDocument.defaultView || window).getComputedStyle(el);
        for (var s = 0; s < styleProps.length; s++) {
          computedStyles[styleProps[s]] = cs[styleProps[s]];
        }
      } catch (e) { /* cross-origin */ }
    }

    var innerHTMLPreview;
    try {
      var rawHTML = el.innerHTML;
      if (rawHTML && rawHTML.length > 0) {
        var htmlSlice = rawHTML.length > 200 ? rawHTML.slice(0, 200) + '...' : rawHTML;
        innerHTMLPreview = __utils.redactSecrets(htmlSlice);
      }
    } catch (e) { /* SVG */ }

    var childrenCount = el.children.length;

    var PRIORITY_ATTRS = ['id', 'class', 'role', 'aria-label', 'aria-labelledby',
                          'href', 'src', 'type', 'name', 'placeholder', 'data-testid'];
    var attrParts = [];
    for (var pa = 0; pa < PRIORITY_ATTRS.length; pa++) {
      var attrVal = el.getAttribute(PRIORITY_ATTRS[pa]);
      if (attrVal !== null) {
        var truncVal = attrVal.length > 60 ? attrVal.slice(0, 60) + '...' : attrVal;
        attrParts.push(PRIORITY_ATTRS[pa] + '="' + truncVal + '"');
      }
    }
    for (var ra = 0; ra < el.attributes.length && attrParts.length < 8; ra++) {
      var rAttr = el.attributes[ra];
      if (PRIORITY_ATTRS.indexOf(rAttr.name) === -1 && rAttr.name.indexOf('__') !== 0) {
        var rVal = rAttr.value.length > 40 ? rAttr.value.slice(0, 40) + '...' : rAttr.value;
        attrParts.push(rAttr.name + '="' + rVal + '"');
      }
    }
    var childDesc = childrenCount === 0
      ? (rawTxt.length > 50 ? rawTxt.slice(0, 50) + '...' : rawTxt)
      : childrenCount + ' children';
    var htmlPreview = '<' + tagName + (attrParts.length > 0 ? ' ' + attrParts.join(' ') : '') + '>' +
                      childDesc + '</' + tagName + '>';

    var parentChain = [];
    var parent = el.parentElement;
    var depth = 0;
    while (parent && depth < 5) {
      var pEntry = { tagName: parent.tagName.toLowerCase() };
      if (parent.id) pEntry.id = parent.id;
      if ('className' in parent && parent.className && typeof parent.className === 'string') {
        var classes = parent.className.split(/\\s+/).filter(Boolean);
        if (classes.length > 0) {
          pEntry.className = classes.slice(0, 3).join(' ') + (classes.length > 3 ? '...' : '');
        }
      }
      parentChain.push(pEntry);
      parent = parent.parentElement;
      depth++;
    }

    var firstChildrenTags = [];
    var childLimit = Math.min(5, childrenCount);
    for (var c = 0; c < childLimit; c++) {
      firstChildrenTags.push(el.children[c].tagName.toLowerCase());
    }

    var cssSelector = __utils.generateSelector(el);

    return {
      found: true,
      tagName: tagName,
      id: el.id || undefined,
      text: txtOut,
      rect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
      attributes: attributes,
      computedStyles: computedStyles,
      cssSelector: cssSelector,
      htmlPreview: htmlPreview,
      innerHTMLPreview: innerHTMLPreview,
      parentChain: parentChain,
      childrenSummary: { count: childrenCount, firstTags: firstChildrenTags },
      isInteractive: __utils.isInteractiveElement(el)
    };
  }

  // \u2500\u2500 Helper: extract structured content \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  function extractContent(el, mode) {
    var items = [];

    if (mode === 'text') {
      var children = el.children;
      if (children.length === 0) {
        var t = (el.textContent || '').trim();
        if (t) items.push({ text: t, tagName: el.tagName.toLowerCase() });
      } else {
        for (var ci = 0; ci < children.length; ci++) {
          var ct = (children[ci].textContent || '').trim();
          if (ct) items.push({ text: ct.length > 1000 ? ct.slice(0, 1000) + '...' : ct, tagName: children[ci].tagName.toLowerCase() });
        }
      }
    } else if (mode === 'links') {
      var links = el.querySelectorAll('a[href]');
      for (var li = 0; li < links.length; li++) {
        items.push({ text: (links[li].textContent || '').trim(), href: links[li].getAttribute('href') || '', tagName: 'a' });
      }
    } else if (mode === 'headings') {
      var headings = el.querySelectorAll('h1, h2, h3, h4, h5, h6');
      for (var hi = 0; hi < headings.length; hi++) {
        items.push({ text: (headings[hi].textContent || '').trim(), tagName: headings[hi].tagName.toLowerCase(), level: parseInt(headings[hi].tagName[1]) });
      }
    } else if (mode === 'list-items') {
      var lis = el.querySelectorAll('li, [role="listitem"], [role="option"]');
      for (var lii = 0; lii < lis.length; lii++) {
        items.push({ text: (lis[lii].textContent || '').trim(), tagName: lis[lii].tagName.toLowerCase() });
      }
    } else if (mode === 'table') {
      var rows = el.querySelectorAll('tr');
      for (var tri = 0; tri < rows.length; tri++) {
        var cells = Array.from(rows[tri].querySelectorAll('th, td')).map(function(c) { return (c.textContent || '').trim(); });
        items.push({ text: cells.join(' | '), cells: cells, tagName: 'tr' });
      }
    } else if (mode === 'structured') {
      var nodes = el.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li, a[href], td, th, span, div');
      var seen = {};
      for (var si = 0; si < nodes.length && items.length < 100; si++) {
        var st = (nodes[si].textContent || '').trim();
        if (!st || seen[st]) continue;
        if (st.length > 5) seen[st] = true;
        var stag = nodes[si].tagName.toLowerCase();
        var item = { text: st.length > 500 ? st.slice(0, 500) + '...' : st, tagName: stag };
        if (stag.match(/^h[1-6]$/)) item.level = parseInt(stag[1]);
        if (stag === 'a') item.href = nodes[si].getAttribute('href') || undefined;
        items.push(item);
      }
    }

    return { type: mode, items: items, count: items.length };
  }

  // \u2500\u2500 Helper: DOM to markdown \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  function domToMarkdown(el, maxL) {
    var parts = [];

    function walk(node) {
      if (parts.join('\\n').length > maxL) return;
      if (node.nodeType === 3) { // TEXT_NODE
        var txt = (node.textContent || '').trim();
        if (txt) parts.push(txt);
        return;
      }
      if (node.nodeType !== 1) return; // ELEMENT_NODE
      var tag = node.tagName.toLowerCase();

      if (tag.match(/^h[1-6]$/)) {
        var lvl = parseInt(tag[1]);
        var prefix = '';
        for (var hi = 0; hi < lvl; hi++) prefix += '#';
        parts.push(prefix + ' ' + (node.textContent || '').trim());
        return;
      }
      if (tag === 'a') {
        var href = node.getAttribute('href');
        var atxt = (node.textContent || '').trim();
        parts.push(href ? '[' + atxt + '](' + href + ')' : atxt);
        return;
      }
      if (tag === 'li') { parts.push('- ' + (node.textContent || '').trim()); return; }
      if (tag === 'p' || tag === 'br') { parts.push((node.textContent || '').trim()); parts.push(''); return; }
      if (tag === 'tr') {
        var cells = Array.from(node.querySelectorAll('th, td')).map(function(c) { return (c.textContent || '').trim(); });
        parts.push('| ' + cells.join(' | ') + ' |');
        return;
      }
      if (tag === 'pre' || tag === 'code') {
        parts.push('\\x60\\x60\\x60\\n' + (node.textContent || '').trim() + '\\n\\x60\\x60\\x60');
        return;
      }
      if (tag === 'strong' || tag === 'b') { parts.push('**' + (node.textContent || '').trim() + '**'); return; }
      if (tag === 'em' || tag === 'i') { parts.push('*' + (node.textContent || '').trim() + '*'); return; }

      for (var ci = 0; ci < node.childNodes.length; ci++) {
        walk(node.childNodes[ci]);
      }
    }

    walk(el);
    var result = parts.join('\\n').trim();
    return result.length > maxL ? result.slice(0, maxL) + '...' : result;
  }
})`;

// ../../../nexus-terminal/modules/nexus-sense/tools/injectable/click.injectable.ts
var CLICK_SCRIPT = `(function(args) {${DEEP_QUERY_FNS}
  try {
    var element = null;

    // Find element by selector or coordinates
    if (args.selector) {
      element = __nxDq(args.selector);
    } else if (typeof args.x === 'number' && typeof args.y === 'number') {
      element = __nxDeepPoint(args.x, args.y);
    }

    if (!element) {
      return {
        success: false,
        error: args.selector
          ? 'No element found for selector: ' + args.selector
          : 'No element found at coordinates (' + args.x + ', ' + args.y + ')'
      };
    }

    // Compute click coordinates
    var rect = element.getBoundingClientRect();
    var clickX = typeof args.x === 'number' ? args.x : rect.x + rect.width / 2;
    var clickY = typeof args.y === 'number' ? args.y : rect.y + rect.height / 2;
    var btn = args.button === 'right' ? 2 : args.button === 'middle' ? 1 : 0;

    var eventInit = {
      bubbles: true,
      cancelable: true,
      view: window,
      button: btn,
      clientX: clickX,
      clientY: clickY
    };

    // Dispatch events in proper order: pointer \u2192 mouse \u2192 click
    if (typeof PointerEvent !== 'undefined') {
      element.dispatchEvent(new PointerEvent('pointerdown', eventInit));
    }
    element.dispatchEvent(new MouseEvent('mousedown', eventInit));

    if (typeof PointerEvent !== 'undefined') {
      element.dispatchEvent(new PointerEvent('pointerup', eventInit));
    }
    element.dispatchEvent(new MouseEvent('mouseup', eventInit));

    // ONE click per requested click (2026-10-25): the first left click is the native element.click() (runs the element's activation
    // behaviour: links, submit, checkbox toggle); further clicks / other buttons are dispatched events. Dispatching a 'click' event AND
    // calling element.click() fired every handler twice and toggled checkboxes back to where they started.
    var count = args.clickCount || 1;
    for (var i = 0; i < count; i++) {
      if (i === 0 && btn === 0 && 'click' in element) element.click();
      else element.dispatchEvent(new MouseEvent('click', Object.assign({}, eventInit, { detail: i + 1 })));
    }

    // Right-click also dispatches contextmenu
    if (btn === 2) {
      element.dispatchEvent(new MouseEvent('contextmenu', eventInit));
    }

    // Dispatch dblclick event for double-click
    if (count >= 2) {
      element.dispatchEvent(new MouseEvent('dblclick', eventInit));
    }

    // Focus the element if focusable
    if ('focus' in element) {
      element.focus();
    }

    // Build element info
    var tagName = element.tagName.toLowerCase();
    var id = element.id || undefined;
    var text = (element.textContent || '').trim().slice(0, 80) || undefined;

    return {
      success: true,
      element: {
        tagName: tagName,
        id: id,
        text: text
      }
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err)
    };
  }
})`;

// ../../../nexus-terminal/modules/nexus-sense/tools/injectable/type.injectable.ts
var TYPE_SCRIPT = `(function(args) {${DEEP_QUERY_FNS}
  try {
    var element = null;

    // Find element by selector or coordinates
    if (args.selector) {
      element = __nxDq(args.selector);
    } else if (typeof args.x === 'number' && typeof args.y === 'number') {
      element = __nxDeepPoint(args.x, args.y);
    }

    if (!element) {
      return {
        success: false,
        error: args.selector
          ? 'No element found for selector: ' + args.selector
          : 'No element found at coordinates (' + args.x + ', ' + args.y + ')'
      };
    }

    // Determine element type using tagName (cross-document compatible)
    var tag = element.tagName ? element.tagName.toUpperCase() : '';
    var isInput = tag === 'INPUT';
    var isTextarea = tag === 'TEXTAREA';
    var isContentEditable = element.isContentEditable === true;

    if (!isInput && !isTextarea && !isContentEditable) {
      return {
        success: false,
        error: 'Element ' + element.tagName.toLowerCase() + ' is not a text input'
      };
    }

    // Get previous value
    var previousLength = 0;
    if (isInput || isTextarea) {
      previousLength = element.value.length;
    } else if (isContentEditable) {
      previousLength = (element.textContent || '').length;
    }

    // Focus the element
    element.focus();

    // Clear existing value if requested (support both 'clear' and 'clearFirst')
    var shouldClear = args.clear || args.clearFirst;
    if (shouldClear) {
      if (isInput || isTextarea) {
        var elWin = element.ownerDocument.defaultView || window;
        var clearProto = isInput ? elWin.HTMLInputElement.prototype : elWin.HTMLTextAreaElement.prototype;
        var clearSetter = Object.getOwnPropertyDescriptor(clearProto, 'value');
        if (clearSetter && clearSetter.set) {
          clearSetter.set.call(element, '');
        } else {
          element.value = '';
        }
      } else if (isContentEditable) {
        element.textContent = '';
      }
      element.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // Type the text - use React-compatible native value setter
    if (isInput || isTextarea) {
      var elWin2 = element.ownerDocument.defaultView || window;
      var proto = isInput ? elWin2.HTMLInputElement.prototype : elWin2.HTMLTextAreaElement.prototype;
      var nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value');
      var currentVal = shouldClear ? '' : element.value;
      var newVal = currentVal + args.text;

      if (nativeSetter && nativeSetter.set) {
        nativeSetter.set.call(element, newVal);
      } else {
        element.value = newVal;
      }
    } else if (isContentEditable) {
      var currentText = shouldClear ? '' : (element.textContent || '');
      element.textContent = currentText + args.text;
    }

    // Dispatch input and change events (must come after native setter for React)
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));

    // Press Enter if requested
    if (args.pressEnter) {
      var enterInit = {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true,
        cancelable: true
      };
      element.dispatchEvent(new KeyboardEvent('keydown', enterInit));
      element.dispatchEvent(new KeyboardEvent('keypress', enterInit));
      element.dispatchEvent(new KeyboardEvent('keyup', enterInit));
      // NOTE: intentionally do NOT call form.requestSubmit() / dispatch a 'submit'
      // event here. A synchronous submit that triggers a heavy SPA render/navigation
      // destroys the page.evaluate execution context this script runs in \u2192 the
      // evaluate() call never returns and hangs the whole tool. The Enter KEY events
      // above trigger most SPA handlers; the caller does a Puppeteer-native Enter for
      // real form submits (see mcp.ts type handler).
    }

    // Get final value length
    var finalLength = 0;
    if (isInput || isTextarea) {
      finalLength = element.value.length;
    } else if (isContentEditable) {
      finalLength = (element.textContent || '').length;
    }

    return {
      success: true,
      element: {
        tagName: element.tagName.toLowerCase(),
        id: element.id || undefined
      },
      typed: {
        lengthChange: finalLength - previousLength,
        finalLength: finalLength
      }
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err)
    };
  }
})`;

// ../../../nexus-terminal/modules/nexus-sense/tools/injectable/scroll.injectable.ts
var SCROLL_SCRIPT = `(function(args) {${DEEP_QUERY_FNS}
  try {
    var target = null;
    var isWindow = false;

    // Find scroll target
    if (args.selector) {
      target = __nxDq(args.selector);
      if (!target) {
        return {
          success: false,
          error: 'No element found for selector: ' + args.selector
        };
      }
    } else if (typeof args.x === 'number' && typeof args.y === 'number') {
      target = __nxDeepPoint(args.x, args.y);
      if (!target) {
        return {
          success: false,
          error: 'No element found at coordinates (' + args.x + ', ' + args.y + ')'
        };
      }
    } else {
      // Scroll the window/document
      isWindow = true;
    }

    var amount = args.amount || 300;
    var dx = 0;
    var dy = 0;

    // Map direction to scroll deltas
    switch (args.direction) {
      case 'up':    dy = -amount; break;
      case 'down':  dy = amount;  break;
      case 'left':  dx = -amount; break;
      case 'right': dx = amount;  break;
      default:
        return {
          success: false,
          error: 'Invalid direction: ' + args.direction + '. Use up, down, left, or right.'
        };
    }

    // Perform the scroll
    // 2026-10-20 (Online-Mind2Web eval): default 'auto' so the reported position is the real one (smooth returned the PRE-scroll position),
    // and when the window cannot scroll (apps that scroll an inner container \u2014 Google Finance), scroll the largest scrollable element instead.
    var scrollBehavior = args.behavior || 'auto';
    var scrollOpts = { left: dx, top: dy, behavior: scrollBehavior };

    if (isWindow) {
      var before = window.scrollY || window.pageYOffset || 0, beforeX = window.scrollX || 0;
      window.scrollBy(scrollOpts);
      var after = window.scrollY || window.pageYOffset || 0, afterX = window.scrollX || 0;
      if (after === before && afterX === beforeX) {
        var best = null, bestArea = 0, els = document.querySelectorAll('body *');
        for (var i = 0; i < els.length && i < 5000; i++) {
          var el = els[i]; var cs = getComputedStyle(el);
          var vert = dy !== 0, canV = el.scrollHeight - el.clientHeight > 20 && /(auto|scroll|overlay)/.test(cs.overflowY);
          var canH = el.scrollWidth - el.clientWidth > 20 && /(auto|scroll|overlay)/.test(cs.overflowX);
          if (vert ? !canV : !canH) continue;
          var r = el.getBoundingClientRect(); var area = Math.max(0, Math.min(r.right, innerWidth) - Math.max(r.left, 0)) * Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0));
          if (area > bestArea) { bestArea = area; best = el; }
        }
        if (best) { target = best; isWindow = false; target.scrollBy({ left: dx, top: dy, behavior: 'auto' }); }
      }
    } else {
      // 2026-11-02 (A/B: cars.com filter list, carmax make list): the element at the point / the selector is usually a LEAF (a label, a
      // checkbox) that cannot scroll, so scrollBy on it did nothing and the tool reported position 0. Scroll the nearest ancestor that can
      // scroll in this direction (crossing shadow boundaries); with none, the page.
      var canScroll = function (el) {
        if (!el || el.nodeType !== 1) return false; var cs = getComputedStyle(el);
        if (dy) { var oy = cs.overflowY; return (oy === 'auto' || oy === 'scroll' || oy === 'overlay') && el.scrollHeight > el.clientHeight + 1 && (dy > 0 ? el.scrollTop + el.clientHeight < el.scrollHeight - 1 : el.scrollTop > 0); }
        var ox = cs.overflowX; return (ox === 'auto' || ox === 'scroll' || ox === 'overlay') && el.scrollWidth > el.clientWidth + 1 && (dx > 0 ? el.scrollLeft + el.clientWidth < el.scrollWidth - 1 : el.scrollLeft > 0);
      };
      var sc = target, hops = 0;
      while (sc && !canScroll(sc) && hops++ < 60) sc = __nxComposedParent(sc);
      if (sc && sc !== document.body && sc !== document.documentElement) { target = sc; target.scrollBy(scrollOpts); }
      else { isWindow = true; window.scrollBy(scrollOpts); }
    }

    // For smooth scrolling, wait for animation to complete
    var getPosition = function() {
      if (isWindow) {
        return {
          x: Math.round(window.scrollX || window.pageXOffset || 0),
          y: Math.round(window.scrollY || window.pageYOffset || 0)
        };
      } else {
        return {
          x: Math.round(target.scrollLeft),
          y: Math.round(target.scrollTop)
        };
      }
    };

    if (scrollBehavior === 'smooth') {
      // Return a promise that resolves after smooth scroll completes
      return new Promise(function(resolve) {
        setTimeout(function() {
          resolve({
            success: true,
            scrollPosition: getPosition()
          });
        }, 350);
      });
    }

    var tdesc = isWindow ? 'page' : (target.tagName.toLowerCase() + (target.id ? '#' + target.id : (typeof target.className === 'string' && target.className.trim() ? '.' + target.className.trim().split(/\\s+/)[0] : '')));
    return {
      success: true,
      scrollPosition: getPosition(),
      scrolled: tdesc
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err)
    };
  }
})`;

// ../../../nexus-terminal/modules/nexus-sense/tools/injectable/keypress.injectable.ts
var KEYPRESS_SCRIPT = `(function(args) {${DEEP_QUERY_FNS}
  try {
    var element = null;

    // Find target element
    if (args.selector) {
      element = __nxDq(args.selector);
    } else if (typeof args.x === 'number' && typeof args.y === 'number') {
      element = document.elementFromPoint(args.x, args.y);
    }

    // Fall back to active element or body
    if (!element) {
      element = document.activeElement || document.body;
    }

    if (!element) {
      return { success: false, error: 'No target element found' };
    }

    // Key name \u2192 code mapping
    var KEY_CODES = {
      Enter: 'Enter', Escape: 'Escape', Tab: 'Tab', Backspace: 'Backspace',
      Delete: 'Delete', Space: 'Space', ArrowUp: 'ArrowUp', ArrowDown: 'ArrowDown',
      ArrowLeft: 'ArrowLeft', ArrowRight: 'ArrowRight', Home: 'Home', End: 'End',
      PageUp: 'PageUp', PageDown: 'PageDown',
      F1: 'F1', F2: 'F2', F3: 'F3', F4: 'F4', F5: 'F5', F6: 'F6',
      F7: 'F7', F8: 'F8', F9: 'F9', F10: 'F10', F11: 'F11', F12: 'F12'
    };

    var key = args.key;
    var code = KEY_CODES[key] || ('Key' + key.toUpperCase());
    var mods = args.modifiers || {};
    var repeatCount = args.repeat || 1;

    // Detect if key produces a printable character (fires keypress)
    var isPrintable = key.length === 1;

    for (var i = 0; i < repeatCount; i++) {
      var eventInit = {
        key: key,
        code: code,
        bubbles: true,
        cancelable: true,
        ctrlKey: !!mods.ctrl,
        shiftKey: !!mods.shift,
        altKey: !!mods.alt,
        metaKey: !!mods.meta,
        repeat: i > 0
      };

      element.dispatchEvent(new KeyboardEvent('keydown', eventInit));

      if (isPrintable) {
        element.dispatchEvent(new KeyboardEvent('keypress', eventInit));
      }

      element.dispatchEvent(new KeyboardEvent('keyup', eventInit));
    }

    return {
      success: true,
      element: {
        tagName: element.tagName.toLowerCase(),
        id: element.id || undefined
      },
      key: key,
      repeat: repeatCount
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err)
    };
  }
})`;

// ../../../nexus-terminal/modules/nexus-sense/tools/injectable/hover.injectable.ts
var HOVER_SCRIPT = `(function(args) {${DEEP_QUERY_FNS}
  try {
    var element = null;

    // Find element by selector or coordinates
    if (args.selector) {
      element = __nxDq(args.selector);
    } else if (typeof args.x === 'number' && typeof args.y === 'number') {
      element = __nxDeepPoint(args.x, args.y);
    }

    if (!element) {
      return {
        success: false,
        error: args.selector
          ? 'No element found for selector: ' + args.selector
          : 'No element found at coordinates (' + args.x + ', ' + args.y + ')'
      };
    }

    var rect = element.getBoundingClientRect();
    var hoverX = typeof args.x === 'number' ? args.x : rect.x + rect.width / 2;
    var hoverY = typeof args.y === 'number' ? args.y : rect.y + rect.height / 2;

    var eventInit = {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: hoverX,
      clientY: hoverY
    };

    // Dispatch pointer events first (modern browsers)
    if (typeof PointerEvent !== 'undefined') {
      element.dispatchEvent(new PointerEvent('pointerover', eventInit));
      element.dispatchEvent(new PointerEvent('pointerenter', Object.assign({}, eventInit, { bubbles: false })));
      element.dispatchEvent(new PointerEvent('pointermove', eventInit));
    }

    // Dispatch mouse events
    element.dispatchEvent(new MouseEvent('mouseover', eventInit));
    element.dispatchEvent(new MouseEvent('mouseenter', Object.assign({}, eventInit, { bubbles: false })));
    element.dispatchEvent(new MouseEvent('mousemove', eventInit));

    var tagName = element.tagName.toLowerCase();
    var id = element.id || undefined;
    var text = (element.textContent || '').trim().slice(0, 80) || undefined;

    return {
      success: true,
      element: {
        tagName: tagName,
        id: id,
        text: text,
        position: { x: Math.round(rect.x), y: Math.round(rect.y) }
      },
      duration: args.duration || 100
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err)
    };
  }
})`;

// ../../../nexus-terminal/modules/nexus-sense/tools/injectable/select.injectable.ts
var SELECT_SCRIPT = `(function(args) {${DEEP_QUERY_FNS}
  try {
    var element = __nxDq(args.selector);

    if (!element) {
      return { success: false, error: 'Element not found: ' + args.selector };
    }

    var tag = element.tagName ? element.tagName.toUpperCase() : '';
    var elWin = element.ownerDocument.defaultView || window;

    // Handle <select> elements
    if (tag === 'SELECT') {
      if (args.value === undefined) {
        return { success: false, error: 'value is required for <select> elements' };
      }

      var selectSetter = Object.getOwnPropertyDescriptor(
        elWin.HTMLSelectElement.prototype, 'value'
      );
      if (selectSetter && selectSetter.set) {
        selectSetter.set.call(element, args.value);
      } else {
        element.value = args.value;
      }

      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));

      var selectedOption = element.selectedOptions ? element.selectedOptions[0] : null;
      return {
        success: true,
        selected: {
          value: element.value,
          text: selectedOption ? (selectedOption.textContent || '').trim() : undefined
        }
      };
    }

    // Handle range and number inputs
    if (tag === 'INPUT' && (element.type === 'range' || element.type === 'number')) {
      if (args.value === undefined) {
        return { success: false, error: 'value is required for <input type="' + element.type + '"> elements' };
      }

      var numVal = parseFloat(args.value);
      if (isNaN(numVal)) {
        return { success: false, error: 'value "' + args.value + '" is not a valid number' };
      }

      // Clamp to min/max
      var min = element.min !== '' ? parseFloat(element.min) : -Infinity;
      var max = element.max !== '' ? parseFloat(element.max) : Infinity;
      var clamped = Math.min(Math.max(numVal, min), max);

      var inputSetter = Object.getOwnPropertyDescriptor(
        elWin.HTMLInputElement.prototype, 'value'
      );
      if (inputSetter && inputSetter.set) {
        inputSetter.set.call(element, String(clamped));
      } else {
        element.value = String(clamped);
      }

      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));

      return {
        success: true,
        selected: {
          value: element.value,
          text: String(clamped) + (element.min !== '' || element.max !== '' ?
            ' (range: ' + (element.min || '?') + '-' + (element.max || '?') + ')' : '')
        }
      };
    }

    // Handle checkbox and radio inputs
    if (tag === 'INPUT' && (element.type === 'checkbox' || element.type === 'radio')) {
      var newChecked = args.checked !== undefined ? args.checked : !element.checked;

      // 2026-11-01: set the state with the element's own activation. The old path set checked=newChecked and THEN dispatched a
      // synthetic click \u2014 and a click on a checkbox toggles it, so every checkbox flipped straight back (radios only passed because a
      // checked radio cannot uncheck). click() toggles once and fires click \u2192 input \u2192 change like a real click (React included).
      if (element.checked !== newChecked) element.click();
      if (element.checked !== newChecked) {
        // A handler cancelled the click: set the state directly and announce it (no click event, which would toggle it again).
        var checkedSetter = Object.getOwnPropertyDescriptor(
          elWin.HTMLInputElement.prototype, 'checked'
        );
        if (checkedSetter && checkedSetter.set) {
          checkedSetter.set.call(element, newChecked);
        } else {
          element.checked = newChecked;
        }
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
      }

      return {
        success: true,
        checked: element.checked
      };
    }

    return {
      success: false,
      error: 'Element is ' + tag.toLowerCase() + '[type=' + (element.type || 'n/a') + '], expected <select>, <input type="range|number|checkbox|radio">'
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err)
    };
  }
})`;

// ../../../nexus-terminal/modules/nexus-sense/tools/injectable/detect.injectable.ts
var DETECT_SCRIPT = `(() => {
  const w = window;
  const d = document;

  // React detection
  const hook = w.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  const hasReact = !!(hook && hook.renderers && hook.renderers.size > 0);
  let reactVersion = null;
  if (hasReact && hook.renderers) {
    try {
      const firstRenderer = hook.renderers.values().next().value;
      reactVersion = firstRenderer?.version || null;
    } catch {}
  }
  if (!reactVersion && w.React && w.React.version) {
    reactVersion = w.React.version;
  }

  // Heavy library detection
  var heavyLibs = [];
  if (w.monaco) heavyLibs.push('monaco-editor');
  if (w.Chart) heavyLibs.push('chart.js');
  if (w.CodeMirror) heavyLibs.push('codemirror');
  if (w.THREE) heavyLibs.push('three');
  if (w.d3) heavyLibs.push('d3');
  if (w.L) heavyLibs.push('leaflet');
  if (w.mapboxgl) heavyLibs.push('mapbox-gl');
  if (w.Quill) heavyLibs.push('quill');
  if (w.agGrid) heavyLibs.push('ag-grid');
  if (w.Handsontable) heavyLibs.push('handsontable');
  if (w.pdfjsLib) heavyLibs.push('pdf.js');
  // Also check script tags for libraries that may not expose globals
  var scripts = d.querySelectorAll('script[src]');
  for (var s = 0; s < scripts.length; s++) {
    var src = scripts[s].getAttribute('src') || '';
    if (src.indexOf('recharts') !== -1 && heavyLibs.indexOf('recharts') === -1) heavyLibs.push('recharts');
    if ((src.indexOf('draft-js') !== -1 || src.indexOf('draft.js') !== -1) && heavyLibs.indexOf('draft-js') === -1) heavyLibs.push('draft-js');
    if (src.indexOf('toast-ui') !== -1 && heavyLibs.indexOf('@toast-ui/editor') === -1) heavyLibs.push('@toast-ui/editor');
  }

  return {
    react: hasReact,
    reactVersion: reactVersion,
    next: !!w.__NEXT_DATA__,
    remix: !!w.__remixContext,
    gatsby: !!w.___gatsby,
    vue: !!(w.__VUE__ || w.__VUE_DEVTOOLS_GLOBAL_HOOK__ || d.querySelector('[data-v-]')),
    svelte: !!d.querySelector('[class*="svelte-"]'),
    angular: !!(w.ng || d.querySelector('[ng-version]')),
    compiler: !!w.__REACT_COMPILER_RUNTIME__,
    hasDevTools: !!hook,
    rendererCount: hook?.renderers?.size || 0,
    heavyLibraries: heavyLibs,
  };
})()`;

// ../../../nexus-terminal/modules/nexus-sense/tools/injectable/finder.injectable.ts
var FINDER_INJECTABLE = `(function() {
  if (typeof window.__medvFinder === 'function') return; // already injected

  var acceptedAttrNames = new Set(['role', 'name', 'aria-label', 'rel', 'href']);

  function attr(name, value) {
    var nameIsOk = acceptedAttrNames.has(name);
    nameIsOk = nameIsOk || (name.startsWith('data-') && wordLike(name));
    var valueIsOk = wordLike(value) && value.length < 100;
    valueIsOk = valueIsOk || (value.startsWith('#') && wordLike(value.slice(1)));
    return nameIsOk && valueIsOk;
  }

  function idName(name) { return wordLike(name); }
  function className(name) { return wordLike(name); }
  function tagNameFn(name) { return true; }

  function wordLike(name) {
    if (/^[a-z\\-]{3,}$/i.test(name)) {
      var words = name.split(/-|[A-Z]/);
      for (var w = 0; w < words.length; w++) {
        if (words[w].length <= 2) return false;
        if (/[^aeiou]{4,}/i.test(words[w])) return false;
      }
      return true;
    }
    return false;
  }

  function tie(element, config) {
    var level = [];
    var elementId = element.getAttribute('id');
    if (elementId && config.idName(elementId)) {
      level.push({ name: '#' + CSS.escape(elementId), penalty: 0 });
    }
    for (var i = 0; i < element.classList.length; i++) {
      var cn = element.classList[i];
      if (config.className(cn)) {
        level.push({ name: '.' + CSS.escape(cn), penalty: 1 });
      }
    }
    for (var j = 0; j < element.attributes.length; j++) {
      var a = element.attributes[j];
      if (config.attr(a.name, a.value)) {
        level.push({ name: '[' + CSS.escape(a.name) + '="' + CSS.escape(a.value) + '"]', penalty: 2 });
      }
    }
    var tn = element.tagName.toLowerCase();
    if (config.tagName(tn)) {
      level.push({ name: tn, penalty: 5 });
      var idx = indexOf(element, tn);
      if (idx !== undefined) {
        level.push({ name: nthOfType(tn, idx), penalty: 10 });
      }
    }
    var nth = indexOf(element);
    if (nth !== undefined) {
      level.push({ name: nthChild(tn, nth), penalty: 50 });
    }
    return level;
  }

  function selector(path) {
    var node = path[0];
    var query = node.name;
    for (var i = 1; i < path.length; i++) {
      var lvl = path[i].level || 0;
      if (node.level === lvl - 1) {
        query = path[i].name + ' > ' + query;
      } else {
        query = path[i].name + ' ' + query;
      }
      node = path[i];
    }
    return query;
  }

  function penalty(path) {
    var sum = 0;
    for (var i = 0; i < path.length; i++) sum += path[i].penalty;
    return sum;
  }

  function byPenalty(a, b) { return penalty(a) - penalty(b); }

  function indexOf(input, tn) {
    var parent = input.parentNode;
    if (!parent) return undefined;
    var child = parent.firstChild;
    if (!child) return undefined;
    var i = 0;
    while (child) {
      if (child.nodeType === Node.ELEMENT_NODE &&
          (tn === undefined || child.tagName.toLowerCase() === tn)) {
        i++;
      }
      if (child === input) break;
      child = child.nextSibling;
    }
    return i;
  }

  function nthChild(tn, index) {
    if (tn === 'html') return 'html';
    return tn + ':nth-child(' + index + ')';
  }

  function nthOfType(tn, index) {
    if (tn === 'html') return 'html';
    return tn + ':nth-of-type(' + index + ')';
  }

  function combinations(stack, path) {
    path = path || [];
    var results = [];
    if (stack.length > 0) {
      for (var n = 0; n < stack[0].length; n++) {
        var sub = combinations(stack.slice(1), path.concat(stack[0][n]));
        for (var s = 0; s < sub.length; s++) results.push(sub[s]);
      }
    } else {
      results.push(path);
    }
    return results;
  }

  function findRootDocument(rootNode, defaults) {
    if (rootNode.nodeType === Node.DOCUMENT_NODE) return rootNode;
    if (rootNode === defaults.root) return rootNode.ownerDocument;
    return rootNode;
  }

  function unique(path, rootDocument) {
    var css = selector(path);
    var count = rootDocument.querySelectorAll(css).length;
    if (count === 0) throw new Error("Can't select any node with this selector: " + css);
    return count === 1;
  }

  function fallback(input, rootDocument) {
    var i = 0;
    var current = input;
    var path = [];
    while (current && current !== rootDocument) {
      var tn = current.tagName.toLowerCase();
      var idx = indexOf(current, tn);
      if (idx === undefined) return;
      path.push({ name: nthOfType(tn, idx), penalty: NaN, level: i });
      current = current.parentElement;
      i++;
    }
    if (unique(path, rootDocument)) return path;
  }

  function optimize(path, input, config, rootDocument, startTime) {
    var results = [];
    if (path.length > 2 && path.length > config.optimizedMinLength) {
      for (var i = 1; i < path.length - 1; i++) {
        var elapsed = new Date().getTime() - startTime.getTime();
        if (elapsed > config.timeoutMs) return results;
        var newPath = path.slice();
        newPath.splice(i, 1);
        if (unique(newPath, rootDocument) &&
            rootDocument.querySelector(selector(newPath)) === input) {
          results.push(newPath);
          var sub = optimize(newPath, input, config, rootDocument, startTime);
          for (var s = 0; s < sub.length; s++) results.push(sub[s]);
        }
      }
    }
    return results;
  }

  window.__medvFinder = function finder(input, options) {
    if (input.nodeType !== Node.ELEMENT_NODE) {
      throw new Error("Can't generate CSS selector for non-element node type.");
    }
    if (input.tagName.toLowerCase() === 'html') return 'html';

    var defaults = {
      root: document.body,
      idName: idName,
      className: className,
      tagName: tagNameFn,
      attr: attr,
      timeoutMs: 1000,
      seedMinLength: 3,
      optimizedMinLength: 2,
      maxNumberOfPathChecks: Infinity
    };

    var startTime = new Date();
    var config = Object.assign({}, defaults, options || {});
    var rootDocument = findRootDocument(config.root, defaults);
    var foundPath;
    var count = 0;

    // Search phase (non-generator version for injectable compatibility)
    var stack = [];
    var paths = [];
    var current = input;
    var level = 0;
    var searching = true;

    while (current && current !== rootDocument && searching) {
      var lvl = tie(current, config);
      for (var n = 0; n < lvl.length; n++) lvl[n].level = level;
      stack.push(lvl);
      current = current.parentElement;
      level++;

      var combos = combinations(stack);
      for (var c = 0; c < combos.length; c++) paths.push(combos[c]);

      if (level >= config.seedMinLength) {
        paths.sort(byPenalty);
        for (var p = 0; p < paths.length; p++) {
          var elapsed = new Date().getTime() - startTime.getTime();
          if (elapsed > config.timeoutMs || count >= config.maxNumberOfPathChecks) {
            var fPath = fallback(input, rootDocument);
            if (!fPath) throw new Error("Timeout: Can't find a unique selector after " + config.timeoutMs + "ms");
            return selector(fPath);
          }
          count++;
          if (unique(paths[p], rootDocument)) {
            foundPath = paths[p];
            searching = false;
            break;
          }
        }
        paths = [];
      }
    }

    if (!foundPath && paths.length > 0) {
      paths.sort(byPenalty);
      for (var q = 0; q < paths.length; q++) {
        var elapsed2 = new Date().getTime() - startTime.getTime();
        if (elapsed2 > config.timeoutMs || count >= config.maxNumberOfPathChecks) {
          var fPath2 = fallback(input, rootDocument);
          if (!fPath2) throw new Error("Timeout: Can't find a unique selector after " + config.timeoutMs + "ms");
          return selector(fPath2);
        }
        count++;
        if (unique(paths[q], rootDocument)) {
          foundPath = paths[q];
          break;
        }
      }
    }

    if (!foundPath) {
      throw new Error("Selector was not found.");
    }

    var optimized = optimize(foundPath, input, config, rootDocument, startTime);
    optimized.sort(byPenalty);
    if (optimized.length > 0) return selector(optimized[0]);
    return selector(foundPath);
  };
})()`;

// ../../../nexus-terminal/modules/nexus-sense/tools/injectable/overlay-watch.injectable.ts
var OVERLAY_WATCH_SCRIPT = String.raw`(function () {
  if (window.__nxWatch || !window.MutationObserver) return;
  var seq = 0, events = [], live = new Map(), ids = new WeakMap(), nextId = 1, lastUrl = location.href, pending = null;
  var MAX_EVENTS = 200;
  var CONSENT_TEXT = /\b(cookies?|consent|gdpr|ccpa|privacy (settings|preferences|choices|center)|tracking technologies|your privacy|we value your privacy|manage (preferences|choices)|accept all)\b/i;
  var CONSENT_ATTR = /consent|cookie|onetrust|didomi|sp_message|truste|cmp-|qc-cmp|usercentrics|cybot|osano|iubenda|cky-|klaro|gdpr/i;
  var DISMISS = /^(×|x|✕|✖|close|dismiss|no thanks|not now|maybe later|skip|got it|ok|okay|accept( all)?|reject( all)?|decline|continue)$/i;
  var SKIP = '#react-scan-root,#react-scan-toolbar-root,[data-react-grab],#nexus-agent-cursor';
  var CANDIDATES = '[role="dialog"],[role="alertdialog"],[aria-modal="true"],dialog,[role="status"],[role="alert"],[aria-live],iframe';

  function idOf(el) { var i = ids.get(el); if (!i) { i = nextId++; ids.set(el, i); } return i; }
  function attr(el, n) { return (el.getAttribute && el.getAttribute(n)) || ''; }
  function cls(el) { return typeof el.className === 'string' ? el.className : (el.className && el.className.baseVal) || ''; }
  function txt(el) { return ((el.innerText || el.textContent || '') + '').replace(/\s+/g, ' ').trim(); }
  function visible(el) {
    if (!el.isConnected) return false;
    var cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || (cs.opacity !== '' && Number(cs.opacity) === 0)) return false;
    var r = el.getBoundingClientRect();
    return r.width > 8 && r.height > 8 && r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth;
  }
  function selectorOf(el) {
    if (el.id && /^[A-Za-z][\w-]*$/.test(el.id)) return '#' + el.id;
    var parts = [], cur = el, depth = 0;
    while (cur && cur.nodeType === 1 && cur !== document.body && depth < 6) {
      var p = cur.parentElement, tag = cur.tagName.toLowerCase();
      if (cur.id && /^[A-Za-z][\w-]*$/.test(cur.id)) { parts.unshift('#' + cur.id); break; }
      var r = attr(cur, 'role');
      var seg = tag + (r ? '[role="' + r + '"]' : '');
      if (p) { var same = 0, idx = 0; for (var k = 0; k < p.children.length; k++) { if (p.children[k].tagName === cur.tagName) { same++; if (p.children[k] === cur) idx = same; } } if (same > 1) seg += ':nth-of-type(' + idx + ')'; }
      parts.unshift(seg); cur = p; depth++;
    }
    return parts.join(' > ') || el.tagName.toLowerCase();
  }
  function buttonsOf(el) {
    var out = [], seen = {};
    var bs = el.querySelectorAll ? el.querySelectorAll('button,[role="button"],a[href],input[type="button"],input[type="submit"]') : [];
    for (var i = 0; i < bs.length && out.length < 8; i++) {
      var b = bs[i]; if (!visible(b)) continue;
      var t = (txt(b) || attr(b, 'aria-label') || attr(b, 'title') || b.value || '').slice(0, 40);
      if (t && !seen[t]) { seen[t] = 1; out.push(t); }
    }
    return out;
  }
  function classify(el) {
    if (!el || el.nodeType !== 1 || el === document.body || el === document.documentElement) return null;
    if (el.closest && el.closest(SKIP)) return null;
    var tag = el.tagName, role = attr(el, 'role');
    var dialogish = role === 'dialog' || role === 'alertdialog' || attr(el, 'aria-modal') === 'true' || (tag === 'DIALOG' && el.open);
    var liveRegion = role === 'status' || role === 'alert' || /^(polite|assertive)$/.test(attr(el, 'aria-live'));
    var inWindow = el.closest && el.closest('[data-window-id]');
    if (inWindow && !dialogish) return null;                    // the SPA's own canvas windows are content, not overlays
    var cs = getComputedStyle(el), fixed = cs.position === 'fixed' || cs.position === 'sticky';
    if (!dialogish && !liveRegion && !fixed) return null;
    if (!visible(el)) return null;
    var r = el.getBoundingClientRect(), area = (r.width * r.height) / Math.max(1, innerWidth * innerHeight);
    var t = txt(el), head = t.slice(0, 800);
    var consent = CONSENT_ATTR.test((el.id || '') + ' ' + cls(el)) || (CONSENT_TEXT.test(head) && t.length < 4000);
    if (liveRegion && !dialogish) return t ? { kind: consent ? 'cookie' : 'toast', r: r, t: t, strong: true, area: area } : null;
    if (consent) return { kind: 'cookie', r: r, t: t, strong: true, area: area };
    if (dialogish) return { kind: 'modal', r: r, t: t, strong: true, area: area };
    if (area >= 0.35) {
      // A big fixed layer is a modal only if it sits ABOVE the page with something to act on. Not: a decorative background
      // (spitfire-products.com #particles-js: no text, no controls), a click-through layer, or the APP SHELL itself (a full-screen
      // fixed root holding most of the page — 10-25 the SPA's #root > div was reported as a modal).
      if (cs.pointerEvents === 'none') return null;
      if ((parseInt(cs.zIndex, 10) || 0) < 1) return null;
      if (!t && !buttonsOf(el).length) return null;
      var all = document.body ? document.body.getElementsByTagName('*').length : 0;
      if (all > 10 && el.getElementsByTagName('*').length > all * 0.4) return null;
      return { kind: 'modal', r: r, t: t, strong: false, area: area };
    }
    if (tag === 'HEADER' || tag === 'NAV' || role === 'navigation' || role === 'banner' || role === 'menubar') return null;
    if (r.top <= 2 && r.height < 140 && r.width > innerWidth * 0.9 && !consent) {
      // full-width top strip: a sticky site header unless it carries a dismiss control
      var bs0 = buttonsOf(el); if (!bs0.some(function (b) { return DISMISS.test(b); })) return null;
    }
    if (tag === 'IFRAME') return area >= 0.05 ? { kind: 'modal', r: r, t: t, area: area } : null;
    if (area < 0.002) return null;
    var bs = buttonsOf(el);
    if (bs.some(function (b) { return DISMISS.test(b); }) || attr(el, 'aria-label').match(/close|dismiss/i)) return { kind: area < 0.08 ? 'toast' : 'banner', r: r, t: t, area: area };
    return null;
  }
  function push(ev) { ev.seq = ++seq; ev.t = Date.now(); events.push(ev); if (events.length > MAX_EVENTS) events.splice(0, events.length - MAX_EVENTS); }
  function summary(el, c) {
    return { id: idOf(el), kind: c.kind, text: c.t.slice(0, 200), selector: selectorOf(el),
      rect: { x: Math.round(c.r.x), y: Math.round(c.r.y), w: Math.round(c.r.width), h: Math.round(c.r.height) },
      cover: Math.round((c.area || 0) * 100) / 100, buttons: buttonsOf(el) };
  }
  function consider(el, initial) {
    var c = classify(el); if (!c) return;
    // Report the OUTERMOST overlay (a CMP's container, not the role=dialog inside it). Climb only to ancestors with a STRONG signal
    // (dialog role, consent attributes/text, live region) — never to a merely large fixed wrapper, which would swallow an app's root.
    for (var up = el.parentElement, d = 0; up && up !== document.body && d < 5; up = up.parentElement, d++) {
      if (up.matches && up.matches('[data-window-id]')) break;
      var cu = classify(up); if (cu && cu.strong) { el = up; c = cu; }
    }
    var id = idOf(el), prev = live.get(id), s = summary(el, c);
    if (!prev) {
      // an overlay nested inside one we already track is the same overlay
      var nested = false; live.forEach(function (v) { if (v.el !== el && v.el.contains(el)) nested = true; });
      if (nested) return;
      live.forEach(function (v, k) { if (el.contains(v.el)) live.delete(k); });   // the outer element supersedes inner ones
      live.set(id, { el: el, s: s });
      var ev = { type: 'appeared' }; for (var key in s) ev[key] = s[key]; if (initial) ev.initial = true; push(ev);
    } else if (prev.s.text !== s.text && s.kind === 'toast') {
      prev.s = s; var ev2 = { type: 'changed' }; for (var key2 in s) ev2[key2] = s[key2]; push(ev2);
    }
  }
  function scan(root, initial) {
    if (!root || root.nodeType !== 1) return;
    consider(root, initial);
    var list = root.querySelectorAll ? root.querySelectorAll(CANDIDATES) : [];
    for (var i = 0; i < list.length && i < 40; i++) consider(list[i], initial);
    var kids = root.children || [];
    for (var j = 0; j < kids.length && j < 12; j++) consider(kids[j], initial);
  }
  function sweepGone() {
    live.forEach(function (v, k) {
      if (!v.el.isConnected || !visible(v.el)) { live.delete(k); push({ type: 'gone', id: v.s.id, kind: v.s.kind, text: v.s.text.slice(0, 80), selector: v.s.selector }); }
    });
    if (location.href !== lastUrl) { lastUrl = location.href; push({ type: 'navigated', url: location.href }); }
  }
  var queue = [];
  function flush() {
    pending = null;
    var q = queue; queue = [];
    try { for (var i = 0; i < q.length; i++) scan(q[i], false); sweepGone(); } catch (e) { /* never break the page */ }
  }
  function enqueue(el) {
    if (!el || el.nodeType !== 1) return;
    if (queue.length < 200 && queue.indexOf(el) < 0) queue.push(el);
    if (!pending) pending = setTimeout(flush, 120);
  }
  var mo = new MutationObserver(function (records) {
    for (var i = 0; i < records.length; i++) {
      var rec = records[i];
      if (rec.type === 'childList') {
        for (var a = 0; a < rec.addedNodes.length; a++) enqueue(rec.addedNodes[a]);
        if (rec.removedNodes.length && !pending) pending = setTimeout(flush, 120);
        var lr = rec.target && rec.target.closest && rec.target.closest('[role="status"],[role="alert"],[aria-live]');
        if (lr) enqueue(lr);
      } else if (rec.type === 'attributes') {
        enqueue(rec.target);
      } else if (rec.type === 'characterData') {
        var p = rec.target.parentElement, lr2 = p && p.closest && p.closest('[role="status"],[role="alert"],[aria-live]');
        if (lr2) enqueue(lr2);
      }
    }
  });
  function start() {
    try {
      mo.observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true,
        attributeFilter: ['class', 'style', 'open', 'hidden', 'aria-hidden', 'aria-modal', 'role'] });
      if (document.body) { scan(document.body, true); var ch = document.body.children; for (var i = 0; i < ch.length && i < 60; i++) scan(ch[i], true); }
    } catch (e) { /* ignore */ }
  }
  if (document.documentElement) start(); else document.addEventListener('DOMContentLoaded', start);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { if (document.body) scan(document.body, true); });
  window.__nxWatch = {
    since: function (n) {
      try { flush(); } catch (e) { /* ignore */ }
      var from = Number(n) || 0, open = [];
      live.forEach(function (v) { open.push(v.s); });
      return { seq: seq, events: events.filter(function (e) { return e.seq > from; }), open: open, dropped: from && events.length && events[0].seq > from + 1 ? events[0].seq - from - 1 : 0 };
    },
  };
})();`;

// ../../../nexus-terminal/modules/nexus-sense/tools/injectable/bippy-lite.injectable.ts
var BIPPY_LITE_SCRIPT = `(function(args) {
  try {
    var hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;

    // Stack/fiber cache (WeakMap keyed on DOM element \u2014 from react-grab pattern)
    // Avoids redundant fiber lookups when same element is inspected multiple times
    if (!window.__nexusFiberCache) {
      window.__nexusFiberCache = typeof WeakMap !== 'undefined' ? new WeakMap() : null;
    }
    var fiberCache = window.__nexusFiberCache;

    // Check if React is present
    if (!hook || !hook.renderers || hook.renderers.size === 0) {
      return {
        available: false,
        error: 'No React detected (no __REACT_DEVTOOLS_GLOBAL_HOOK__ or no renderers)'
      };
    }

    // Get the first renderer
    var renderer = null;
    var rendererIterator = hook.renderers.values();
    var first = rendererIterator.next();
    if (!first.done) {
      renderer = first.value;
    }

    if (!renderer) {
      return {
        available: false,
        error: 'React hook exists but no renderer found'
      };
    }

    // If no selector, return availability info
    if (!args || !args.selector) {
      return {
        available: true,
        rendererCount: hook.renderers.size,
        reactVersion: renderer.version || null
      };
    }

    // Find the target element
    var element = document.querySelector(args.selector);
    if (!element) {
      return {
        available: true,
        error: 'Element not found for selector: ' + args.selector
      };
    }

    // Get fiber from element (with cache)
    var fiber = null;

    // Check cache first (WeakMap keyed on DOM element)
    if (fiberCache && fiberCache.has(element)) {
      fiber = fiberCache.get(element);
    }

    // Method 1: Use renderer's findFiberByHostInstance
    if (!fiber && renderer.findFiberByHostInstance) {
      fiber = renderer.findFiberByHostInstance(element);
    }

    // Method 2: Check __reactFiber$ or __reactInternalInstance$ keys on the element
    if (!fiber) {
      var keys = Object.keys(element);
      for (var i = 0; i < keys.length; i++) {
        if (keys[i].startsWith('__reactFiber$') || keys[i].startsWith('__reactInternalInstance$')) {
          fiber = element[keys[i]];
          break;
        }
      }
    }

    // Cache the fiber lookup result
    if (fiber && fiberCache) {
      fiberCache.set(element, fiber);
    }

    if (!fiber) {
      return {
        available: true,
        error: 'Could not find React fiber for element: ' + args.selector
      };
    }

    // Helper: get display name from fiber
    function getDisplayName(fiberNode) {
      if (!fiberNode || !fiberNode.type) return null;
      var type = fiberNode.type;
      if (typeof type === 'string') return type; // DOM element like 'div'
      if (type.displayName) return type.displayName;
      if (type.name) return type.name;
      // ForwardRef, memo wrappers
      if (type.render) {
        return type.render.displayName || type.render.name || null;
      }
      return null;
    }

    // Helper: check if name should be filtered out
    // Comprehensive filter lists from react-grab research
    var NON_COMPONENT_PREFIXES = ['motion.', 'styled.', 'chakra.', 'ark.', 'Primitive.', 'Slot.'];
    var NEXT_INTERNALS = [
      'InnerLayoutRouter', 'OuterLayoutRouter', 'RenderFromTemplateContext',
      'ScrollAndFocusHandler', 'InnerScrollAndFocusHandler',
      'ErrorBoundary', 'LoadingBoundary', 'NotFoundBoundary',
      'RedirectBoundary', 'MetadataBoundary', 'ViewportBoundary',
      'HTTPAccessFallbackBoundary', 'HotReload', 'Router', 'AppRouter',
      'ServerRoot', 'RSCComponent', 'ClientPageRoot', 'ClientSegmentRoot',
      'LayoutSegment', 'RootLayout', 'ClientSegment', 'Loading',
      'NotFound', 'Error', 'GlobalError', 'Template',
      'ServerInsertedHTMLProvider', 'BuildHTTPHeaders', 'PreloadCss', 'FlightData'
    ];
    var REACT_INTERNALS = [
      'Provider', 'Consumer', 'Context', 'Fragment', 'Suspense',
      'StrictMode', 'Profiler', 'SuspenseList',
      'OffscreenComponent', 'LegacyHiddenComponent'
    ];
    function shouldFilterName(name) {
      if (!name) return true;
      if (name.charAt(0) === '_' || name.charAt(0) === '$') return true;
      // Check non-component prefixes (e.g. motion.div, styled.button)
      for (var p = 0; p < NON_COMPONENT_PREFIXES.length; p++) {
        if (name.indexOf(NON_COMPONENT_PREFIXES[p]) === 0) return true;
      }
      // Check Next.js internals (exact match)
      for (var n = 0; n < NEXT_INTERNALS.length; n++) {
        if (name === NEXT_INTERNALS[n]) return true;
      }
      // Check React internals (substring match for wrappers like ForwardRef(...))
      var reactFilterPatterns = REACT_INTERNALS.concat(['ForwardRef(', 'Memo(']);
      for (var k = 0; k < reactFilterPatterns.length; k++) {
        if (name.indexOf(reactFilterPatterns[k]) !== -1) return true;
      }
      // Skip lowercase names (DOM elements like div, span)
      if (name.charAt(0) === name.charAt(0).toLowerCase() && name.charAt(0) !== name.charAt(0).toUpperCase()) {
        return true;
      }
      return false;
    }

    // Get component name from nearest non-host fiber
    var componentName = null;
    var inspectFiber = fiber;
    while (inspectFiber) {
      var name = getDisplayName(inspectFiber);
      if (name && !shouldFilterName(name)) {
        componentName = name;
        break;
      }
      inspectFiber = inspectFiber.return;
    }

    // Build component stack (walk up fiber.return)
    var componentStack = [];
    var current = fiber;
    var maxDepth = 15;
    while (current && componentStack.length < maxDepth) {
      var stackName = getDisplayName(current);
      if (stackName && !shouldFilterName(stackName)) {
        componentStack.push(stackName);
      }
      current = current.return;
    }

    // Extract props (shallow, serializable only)
    var props = null;
    if (fiber.memoizedProps) {
      props = {};
      var propKeys = Object.keys(fiber.memoizedProps);
      for (var j = 0; j < propKeys.length; j++) {
        var propKey = propKeys[j];
        if (propKey === 'children') continue; // Skip children (too verbose)
        var val = fiber.memoizedProps[propKey];
        var valType = typeof val;
        if (valType === 'string' || valType === 'number' || valType === 'boolean' || val === null) {
          props[propKey] = val;
        } else if (valType === 'function') {
          props[propKey] = '[function]';
        } else if (Array.isArray(val)) {
          props[propKey] = '[array(' + val.length + ')]';
        } else if (valType === 'object') {
          props[propKey] = '[object]';
        }
      }
    }

    // Try to find source location (if available via _debugSource or _debugOwner)
    var sourceLocation = null;
    var sourceFiber = fiber;
    while (sourceFiber) {
      if (sourceFiber._debugSource) {
        var src = sourceFiber._debugSource;
        sourceLocation = {
          fileName: src.fileName || null,
          lineNumber: src.lineNumber || null,
          columnNumber: src.columnNumber || null
        };
        break;
      }
      // Also check _debugOwner chain (React 19+)
      if (sourceFiber._debugOwner && sourceFiber._debugOwner._debugSource) {
        var ownerSrc = sourceFiber._debugOwner._debugSource;
        sourceLocation = {
          fileName: ownerSrc.fileName || null,
          lineNumber: ownerSrc.lineNumber || null,
          columnNumber: ownerSrc.columnNumber || null
        };
        break;
      }
      sourceFiber = sourceFiber.return;
    }

    // React 19 removed _debugSource (always null there). Fall back to _debugStack \u2014 the Error captured where the JSX element
    // was created \u2014 and take its first frame outside React / node_modules as file:line:col (2026-10-22, research rec #3).
    // Written without regex backslashes: this file is a template literal.
    if (!sourceLocation) {
      var sf = fiber;
      while (sf && !sourceLocation) {
        var ds = sf._debugStack;
        var stackStr = ds && typeof ds.stack === 'string' ? ds.stack : (typeof ds === 'string' ? ds : null);
        if (stackStr) {
          var stackLines = stackStr.split(String.fromCharCode(10));
          for (var li = 0; li < stackLines.length; li++) {
            var ln = stackLines[li].trim();
            if (ln.indexOf('at ') !== 0) continue;
            if (/react-dom|react.development|react.production|jsx-runtime|jsx-dev-runtime|node_modules|react-stack-top-frame/.test(ln)) continue;
            var loc = ln.charAt(ln.length - 1) === ')' ? ln.slice(ln.lastIndexOf('(') + 1, -1) : ln.slice(3);
            var m = loc.match(/^(.*):([0-9]+):([0-9]+)$/);
            if (m) { sourceLocation = { fileName: m[1], lineNumber: parseInt(m[2], 10), columnNumber: parseInt(m[3], 10), fromDebugStack: true }; break; }
          }
        }
        sf = sf.return;
      }
    }

    // Next.js server component symbolication \u2014 resolve minified source locations
    // via the __nextjs_original-stack-frames endpoint (available in Next.js dev mode)
    var nextjsResolved = false;
    if (sourceLocation && sourceLocation.fileName && window.__NEXT_DATA__) {
      try {
        // Check if filename looks minified (no path separators or very short)
        var fn = sourceLocation.fileName;
        if (fn && (fn.indexOf('/') === -1 || fn.length < 10)) {
          // Attempt synchronous XHR for symbolication (blocking but fast in dev)
          var xhr = new XMLHttpRequest();
          var params = 'file=' + encodeURIComponent(fn) +
            '&lineNumber=' + (sourceLocation.lineNumber || 0) +
            '&column=' + (sourceLocation.columnNumber || 0);
          xhr.open('GET', '/__nextjs_original-stack-frames?' + params, false);
          xhr.send();
          if (xhr.status === 200) {
            var resolved = JSON.parse(xhr.responseText);
            if (resolved && resolved.originalStackFrame) {
              sourceLocation = {
                fileName: resolved.originalStackFrame.file || sourceLocation.fileName,
                lineNumber: resolved.originalStackFrame.lineNumber || sourceLocation.lineNumber,
                columnNumber: resolved.originalStackFrame.column || sourceLocation.columnNumber
              };
              nextjsResolved = true;
            }
          }
        }
      } catch (e) { /* symbolication is best-effort */ }
    }

    return {
      available: true,
      componentName: componentName,
      componentStack: componentStack.length > 0 ? componentStack : undefined,
      props: props,
      sourceLocation: sourceLocation,
      nextjsResolved: nextjsResolved || undefined
    };
  } catch (err) {
    return {
      available: false,
      error: err instanceof Error ? err.message : String(err)
    };
  }
})`;

// ../../../nexus-terminal/modules/nexus-sense/tools/injectable/snapshot.injectable.ts
var SNAPSHOT_SCRIPT = `(function(opts) {${DEEP_QUERY_FNS}
  opts = opts || {};
  var maxNodes = opts.maxNodes || 400;
  var includeText = !!opts.includeText;
  var prefix = opts.prefix || 'e';
  // The TOPMOST visible element among several (2026-11-02 A/B: target.com stacked drawers \u2014 root 'div[role=dialog]' returned the underlying
  // one): the one whose centre hit-tests into itself, else the last visible in document order.
  var __vis = function (e) { var r = e.getBoundingClientRect(); var cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
  var __topmost = function (list) {
    var v = list.filter(__vis); if (!v.length) return list[0] || null;
    for (var ti = v.length - 1; ti >= 0; ti--) { var rr = v[ti].getBoundingClientRect(); var hit = __nxDeepPoint(rr.x + rr.width / 2, rr.y + Math.min(rr.height / 2, 40));
      if (hit && (hit === v[ti] || v[ti].contains(hit) || (hit.getRootNode && hit.getRootNode().host && v[ti].contains(hit.getRootNode().host)))) return v[ti]; }
    return v[v.length - 1];
  };
  var rootNote = null;
  var rootEl = document.body;
  if (opts.root) {
    var rootList = []; try { rootList = __nxDeepAll(document, opts.root); } catch (x) { rootList = []; }
    if (rootList.length) rootEl = rootList.length > 1 ? __topmost(rootList) : rootList[0];
    else {
      // No match \u2192 the whole page, and say so (jcpenney 'aside, [class*=filter]', carmax 'main' returned nothing to work with)
      var landmarks = []; var lm = document.querySelectorAll('main, [role=main], nav, aside, form, [role=dialog], dialog[open], [role=search]');
      for (var li = 0; li < lm.length && landmarks.length < 8; li++) { var le = lm[li]; if (!__vis(le)) continue; landmarks.push(le.tagName.toLowerCase() + (le.id ? '#' + le.id : '') + (le.getAttribute('role') ? '[role=' + le.getAttribute('role') + ']' : '')); }
      rootNote = 'root ' + JSON.stringify(opts.root) + ' matched nothing \u2014 showing the whole page' + (landmarks.length ? '; roots that exist: ' + landmarks.join(', ') : '');
      opts.root = null;
    }
  }
  // 2026-10-22 (A/B): an OPEN MODAL is listed FIRST (portals render it outside any page root, so it was easy to miss), then the
  // rest of the page. Round 2 showed why it must not REPLACE the page: on ups.com an empty 'Service Alert' dialog won over the
  // real panel, and a filter flyout was hidden. Only a visible modal with at least one control qualifies; the last one wins.
  var modalEl = null, modalAuto = null, modalDone = false;
  if (!opts.root) {
    var dialogs = Array.prototype.slice.call(document.querySelectorAll('dialog[open], [role="dialog"][aria-modal="true"], [role="alertdialog"][aria-modal="true"]'));
    var CONTROLS = 'a[href], button, input:not([type=hidden]), select, textarea, [role=button], [role=link], [role=checkbox], [role=radio], [role=tab], [tabindex]';
    var usable = dialogs.filter(function (d) {
      var r = d.getBoundingClientRect(); var cs = getComputedStyle(d);
      if (!(r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none')) return false;
      var ctl = d.querySelectorAll(CONTROLS);
      for (var ci = 0; ci < ctl.length; ci++) { var cr = ctl[ci].getBoundingClientRect(); if (cr.width > 0 && cr.height > 0) return true; }
      return false;
    });
    if (usable.length) {
      modalEl = usable.length > 1 ? __topmost(usable) : usable[0];
      modalAuto = (modalEl.getAttribute('aria-label') || modalEl.tagName.toLowerCase() + (modalEl.id ? '#' + modalEl.id : '')).slice(0, 60);
    }
  }
  if (!rootEl) return { error: 'Root element not found: ' + opts.root };

  // clear the previous snapshot's tags (refs are one-snapshot scoped)
  // clear the previous snapshot's refs everywhere, open shadow roots included (refs are assigned inside them too \u2014 2026-10-25)
  var clearStack = [document];
  while (clearStack.length) {
    var croot = clearStack.pop(); var old = croot.querySelectorAll('[data-nexus-ref]');
    for (var i = 0; i < old.length; i++) old[i].removeAttribute('data-nexus-ref');
    var hosts = croot.querySelectorAll('*'); for (var hi = 0; hi < hosts.length; hi++) if (hosts[hi].shadowRoot) clearStack.push(hosts[hi].shadowRoot);
  }

  var WIDGET_ROLES = { button:1, link:1, tab:1, menuitem:1, menuitemcheckbox:1, menuitemradio:1, checkbox:1, radio:1,
    combobox:1, option:1, switch:1, textbox:1, searchbox:1, slider:1, spinbutton:1, treeitem:1, gridcell:1, listbox:1 };
  var LANDMARK_TAGS = { NAV:'navigation', MAIN:'main', HEADER:'banner', FOOTER:'contentinfo', ASIDE:'complementary', FORM:'form', SECTION:'region', DIALOG:'dialog' };
  var LANDMARK_ROLES = { banner:1, complementary:1, contentinfo:1, form:1, main:1, navigation:1, region:1, search:1, dialog:1, alertdialog:1 };
  var HEADING = { H1:1, H2:2, H3:3, H4:4, H5:5, H6:6 };

  function visible(el) {
    if (el.hidden || el.getAttribute('aria-hidden') === 'true') return false;
    var cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    var r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }
  function text(el, n) { return (el.textContent || '').replace(/\\s+/g, ' ').trim().substring(0, n || 80); }
  function name(el) {
    var v = el.getAttribute('aria-label');
    if (v) return v.trim().substring(0, 80);
    var lb = el.getAttribute('aria-labelledby');
    if (lb) { var parts = lb.split(' ').map(function(id) { var t = document.getElementById(id); return t ? text(t, 40) : ''; }).join(' ').trim(); if (parts) return parts.substring(0, 80); }
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') {
      if (el.id) { var lab = document.querySelector('label[for="' + el.id.replace(/"/g, '\\\\"') + '"]'); if (lab) return text(lab, 60); }
      var wrap = el.closest && el.closest('label'); if (wrap && text(wrap, 60)) return text(wrap, 60);
      var pl = el.getAttribute('placeholder'); if (pl) return pl.substring(0, 60);
      if ((el.type === 'checkbox' || el.type === 'radio') && el.parentElement && text(el.parentElement, 60)) return text(el.parentElement, 60);
      var t = el.getAttribute('title'); if (t) return t.substring(0, 60);
      if (el.tagName === 'INPUT' && (el.type === 'submit' || el.type === 'button') && el.value) return String(el.value).substring(0, 60);
      return el.getAttribute('name') || '';
    }
    if (el.tagName === 'IMG') return (el.getAttribute('alt') || '').substring(0, 60);
    var t2 = el.getAttribute('title'); if (t2 && !text(el, 1)) return t2.substring(0, 60);
    return text(el, 80);
  }
  function role(el) {
    var r = el.getAttribute('role'); if (r) return r.split(' ')[0];
    var tag = el.tagName;
    if (tag === 'A' && el.hasAttribute('href')) return 'link';
    if (tag === 'BUTTON') return 'button';
    if (tag === 'INPUT') { var t = (el.type || 'text').toLowerCase(); return t === 'checkbox' ? 'checkbox' : t === 'radio' ? 'radio' : (t === 'submit' || t === 'button' || t === 'reset' || t === 'image') ? 'button' : t === 'range' ? 'slider' : t === 'number' ? 'spinbutton' : t === 'search' ? 'searchbox' : t === 'file' ? 'file' : 'textbox'; }
    if (tag === 'SELECT') return 'combobox';
    if (tag === 'TEXTAREA') return 'textbox';
    if (HEADING[tag]) return 'heading';
    if (LANDMARK_TAGS[tag]) return LANDMARK_TAGS[tag];
    if (tag === 'IMG') return 'img';
    if (tag === 'SUMMARY') return 'button';
    if (tag === 'LI') return 'listitem';
    if (el.isContentEditable) return 'textbox';
    if (el.tabIndex >= 0) return 'widget';
    return '';
  }
  function interactive(el, r) {
    if (WIDGET_ROLES[r]) return true;
    var tag = el.tagName;
    return (tag === 'A' && el.hasAttribute('href')) || tag === 'BUTTON' || tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' ||
      tag === 'SUMMARY' || el.isContentEditable || (el.tabIndex >= 0 && tag !== 'BODY') || el.hasAttribute('onclick');
  }
  function state(el, r) {
    var s = [];
    if (el.disabled || el.getAttribute('aria-disabled') === 'true') s.push('disabled');
    if (r === 'checkbox' || r === 'radio' || r === 'switch' || r === 'menuitemcheckbox') { var cel = (el.tagName === 'LABEL' && el.control) ? el.control : el; var c = (cel.checked !== undefined) ? cel.checked : el.getAttribute('aria-checked') === 'true'; s.push(c ? 'checked' : 'unchecked'); }
    var exp = el.getAttribute('aria-expanded'); if (exp) s.push(exp === 'true' ? 'expanded' : 'collapsed');
    var sel = el.getAttribute('aria-selected'); if (sel === 'true') s.push('selected');
    if (el.getAttribute('aria-current')) s.push('current');
    if ((r === 'textbox' || r === 'searchbox' || r === 'combobox' || r === 'spinbutton') && el.value !== undefined && el.value !== '' && el.type !== 'password') s.push('value="' + String(el.value).substring(0, 40) + '"');
    if (r === 'link' && el.href) { try { var u = new URL(el.href, location.href); if (u.origin !== location.origin) s.push('external'); } catch (e) {} }
    // 2026-11-07 keyboard-first: the element's own key bindings, when the page declares them (accesskey = Alt+key / Alt+Shift+key).
    var ak = el.getAttribute('accesskey'); if (ak) s.push('accesskey=' + ak.substring(0, 10));
    var aks = el.getAttribute('aria-keyshortcuts'); if (aks) s.push('keys="' + aks.substring(0, 40) + '"');
    return s;
  }

  var lines = [], refs = {}, n = 0, truncated = false, seq = 0;
  function emit(el, depth, r, nm, isText) {
    if (n >= maxNodes) { truncated = true; return null; }
    var ref = prefix + (++seq);
    if (!isText) el.setAttribute('data-nexus-ref', ref);
    var head = (r === 'heading') ? 'heading h' + HEADING[el.tagName] : r;
    var st = isText ? [] : state(el, r);
    var line = new Array(Math.min(depth, 8) + 1).join('  ') + '[' + ref + '] ' + head + (nm ? ': ' + JSON.stringify(nm) : '') + (st.length ? ' (' + st.join(', ') + ')' : '');
    lines.push(line); n++;
    refs[ref] = { tag: el.tagName.toLowerCase(), role: head, name: nm, selector: isText ? undefined : '[data-nexus-ref="' + ref + '"]' };
    return ref;
  }
  function walk(el, depth) {
    if (n >= maxNodes) { truncated = true; return; }
    if (!el || el.nodeType !== 1) return;
    if (modalDone && el === modalEl) return;  // already listed above
    var tag = el.tagName;
    // 2026-10-22 (A/B round 2: backcountry, carmax, jcpenney): styled checkboxes/radios hide the real input and show a <label>, so the
    // control never appeared. A label whose control is a hidden checkbox/radio is emitted as that control (clicking a label toggles it).
    if (tag === 'LABEL' && el.control && (el.control.type === 'checkbox' || el.control.type === 'radio') && !visible(el.control) && visible(el)) {
      emit(el, depth, el.control.type, text(el, 80), false);
      return;
    }
    if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' || tag === 'TEMPLATE' || tag === 'SVG' || tag === 'PATH') return;
    if (!visible(el)) return;
    var r = role(el);
    var isLandmark = !!(LANDMARK_ROLES[r]);
    var emitted = false, childDepth = depth;
    if (r === 'heading' || isLandmark || r === 'img' && name(el) || interactive(el, r)) {
      // landmarks are named by ARIA only (their text content is the whole region)
      var nm = isLandmark ? (el.getAttribute('aria-label') || el.getAttribute('title') || '').trim().substring(0, 60) : name(el);
      emit(el, depth, r, nm, false); emitted = true; childDepth = depth + 1;
    } else if (includeText && el.children.length === 0) {
      var t = text(el, 120);
      if (t && t.length >= 2) { emit(el, depth, 'text', t, true); emitted = true; }
    }
    // an interactive leaf's children are its label \u2014 do not descend into buttons/links/inputs
    if (emitted && interactive(el, r) && r !== 'listitem' && !isLandmark) return;
    var kids = el.children;
    for (var i = 0; i < kids.length; i++) { walk(kids[i], childDepth); if (n >= maxNodes) break; }
    // 2026-10-25 (A/B round 2, cars.com fuse-* components): controls inside an OPEN shadow root were invisible to snapshot. Walk the
    // shadow tree too; refs set there resolve through the deep query every action injectable uses. Closed roots stay unreachable.
    // \u2026except our own human-profile debug toolbars (react-scan / react-grab render into open shadow roots) \u2014 never agent targets.
    if (el.shadowRoot && n < maxNodes && !(el.id === 'react-scan-root' || el.id === 'react-scan-toolbar-root' || el.hasAttribute('data-react-grab'))) { var sk = el.shadowRoot.children; for (var j = 0; j < sk.length; j++) { walk(sk[j], childDepth); if (n >= maxNodes) break; } }
  }
  if (modalEl) {
    lines.push('-- open modal: ' + JSON.stringify(modalAuto) + ' (listed first; the page behind it follows) --');
    walk(modalEl, 0);
    modalDone = true;
    lines.push('-- page --');
  }
  walk(rootEl, 0);
  return { lines: lines, refs: refs, count: n, truncated: truncated, url: location.href, title: document.title, modalAuto: modalAuto || undefined, rootNote: rootNote || undefined };
})`;

// ../../../nexus-terminal/modules/nexus-sense/tools/injectable/markdown.injectable.ts
var MARKDOWN_SCRIPT = `(function(opts) {
  var maxLen = opts.maxLength || 50000;
  var selector = opts.selector || 'body';
  var root = document.querySelector(selector);
  if (!root) return '(element not found: ' + selector + ')';

  var SKIP = new Set(['SCRIPT','STYLE','NOSCRIPT','SVG','PATH','CIRCLE','RECT','LINE','POLYGON','DEFS','CLIPPATH','MASK']);
  var BLOCK = new Set(['DIV','SECTION','ARTICLE','MAIN','HEADER','FOOTER','NAV','ASIDE','FIGURE','FIGCAPTION','BLOCKQUOTE','PRE','UL','OL','DL','TABLE','THEAD','TBODY','TFOOT','TR','FORM','FIELDSET','DETAILS','SUMMARY','HR']);

  function walk(node) {
    if (node.nodeType === 3) return node.textContent;
    if (node.nodeType !== 1) return '';
    var tag = String(node.tagName).toUpperCase();  // SVG children (<style> inside <svg>) report lowercase tag names \u2014 2026-10-22 fedex
    if (SKIP.has(tag)) return '';
    if (node.hidden || node.getAttribute('aria-hidden') === 'true') return '';
    var style = node.style;
    if (style && (style.display === 'none' || style.visibility === 'hidden')) return '';
    // 2026-10-22 (A/B, fedex tracking): on a page with no <main>, the body fallback drowned the result in site chrome \u2014
    // nav/header/footer landmarks and collapsed (CSS-hidden) mega-menus. skipChrome drops those below the root.
    if (opts.skipChrome && node !== root) {
      var role = node.getAttribute('role');
      if (tag === 'NAV' || tag === 'HEADER' || tag === 'FOOTER' || role === 'navigation' || role === 'banner' || role === 'contentinfo') return '';
      var cs = getComputedStyle(node);
      if (cs.display === 'none' || cs.visibility === 'hidden') return '';
      // 2026-11-02 (A/B: osu.edu, ups.com): filter sidebars came out BEFORE the results and pushed them toward the length cap \u2014 an
      // aside / complementary region is moved to the end under its own heading.
      if (!deferring && (tag === 'ASIDE' || role === 'complementary')) { deferred.push(node); return ''; }
      // an open modal listed first is not repeated in place
      if (node === modalEl && !inModal) return '';
    }
    if (node.id === 'react-scan-root' || node.id === 'react-scan-toolbar-root' || (node.hasAttribute && node.hasAttribute('data-react-grab'))) return '';

    // Web components: an OPEN shadow root is what renders \u2014 walk it, with each <slot> replaced by the light nodes assigned to it.
    var kidNodes = node.shadowRoot ? Array.from(node.shadowRoot.childNodes) : Array.from(node.childNodes);
    if (tag === 'SLOT' && node.assignedNodes) { var asg = node.assignedNodes({ flatten: true }); if (asg.length) kidNodes = Array.from(asg); }
    var kids = kidNodes.map(walk).join('');

    switch (tag) {
      case 'H1': return '\\n# ' + kids.trim() + '\\n\\n';
      case 'H2': return '\\n## ' + kids.trim() + '\\n\\n';
      case 'H3': return '\\n### ' + kids.trim() + '\\n\\n';
      case 'H4': return '\\n#### ' + kids.trim() + '\\n\\n';
      case 'H5': return '\\n##### ' + kids.trim() + '\\n\\n';
      case 'H6': return '\\n###### ' + kids.trim() + '\\n\\n';
      case 'P': return '\\n' + kids.trim() + '\\n\\n';
      case 'BR': return '\\n';
      case 'HR': return '\\n---\\n\\n';
      case 'LI': return '- ' + kids.trim() + '\\n';
      case 'UL': case 'OL': return '\\n' + kids + '\\n';
      case 'BLOCKQUOTE': return '\\n> ' + kids.trim().replace(/\\n/g, '\\n> ') + '\\n\\n';
      case 'PRE': return '\\n' + String.fromCharCode(96,96,96) + '\\n' + (node.textContent || '').trim() + '\\n' + String.fromCharCode(96,96,96) + '\\n\\n';
      case 'CODE':
        if (node.parentElement && node.parentElement.tagName === 'PRE') return kids;
        return String.fromCharCode(96) + kids.trim() + String.fromCharCode(96);
      case 'STRONG': case 'B': return '**' + kids.trim() + '**';
      case 'EM': case 'I': return '*' + kids.trim() + '*';
      case 'A': {
        var href = node.getAttribute('href') || '';
        var linkText = kids.trim();
        if (!linkText) return '';
        if (href && href !== '#' && !href.startsWith('javascript:') && !href.startsWith('data:'))
          return '[' + linkText + '](' + href + ')';
        return linkText;
      }
      case 'IMG': {
        var alt = node.getAttribute('alt') || '';
        var src = node.getAttribute('src') || '';
        if (src.indexOf('data:') === 0) src = '(inline image)';   // a base64 data URI flooded the output (ups.com locator modal)
        return alt ? '![' + alt + '](' + src + ')' : '';
      }
      case 'TABLE': return '\\n' + kids + '\\n';
      case 'TR': return kids.replace(/\\|$/,'') + '\\n';
      case 'TH': return '| **' + kids.trim() + '** ';
      case 'TD': return '| ' + kids.trim() + ' ';
      case 'INPUT': {
        var type = node.type || 'text';
        var val = node.value || '';
        var ph = node.placeholder || '';
        return '[input:' + type + (val ? '="' + val + '"' : '') + (ph ? ' placeholder="' + ph + '"' : '') + ']';
      }
      case 'SELECT': return '[select: ' + (node.options && node.selectedIndex >= 0 ? node.options[node.selectedIndex].text : '') + ']';
      case 'TEXTAREA': return '[textarea: ' + (node.value || '').substring(0, 100) + ']';
      case 'BUTTON': return '[button: ' + kids.trim() + ']';
      default:
        if (BLOCK.has(tag)) return '\\n' + kids;
        return kids;
    }
  }

  var deferred = [], deferring = false, inModal = false;
  // An open modal outside the chosen root (portals render at the end of <body>) is listed FIRST, like snapshot.
  var modalEl = null;
  if (opts.skipChrome) {
    var dl = document.querySelectorAll('dialog[open], [role="dialog"][aria-modal="true"], [role="alertdialog"][aria-modal="true"]');
    for (var di = dl.length - 1; di >= 0; di--) { var dr = dl[di].getBoundingClientRect(); if (dr.width > 0 && dr.height > 0 && dl[di] !== root && !dl[di].contains(root)) { modalEl = dl[di]; break; } }
  }
  inModal = true; var head = modalEl ? '-- open modal --\\n' + walk(modalEl) + '\\n-- page --\\n' : ''; inModal = false;
  var body = walk(root);
  deferring = true;
  var side = deferred.map(walk).join('').trim();
  var md = (head + body + (side ? '\\n\\n---\\n## Sidebar\\n' + side : ''))
    .replace(/\\n{3,}/g, '\\n\\n')
    .replace(/^\\s+/, '')
    .replace(/\\s+$/, '');

  if (md.length > maxLen)
    md = md.substring(0, maxLen) + '\\n\\n(truncated at ' + maxLen + ' chars)';
  return md;
})`;
var MAIN_ROOT_SCRIPT = `(function(){ var m = document.querySelector('main, [role="main"], #main, #content, article'); if (!m) return 'body'; var r = m.getBoundingClientRect(); return (m.innerText || '').length > 200 && r.width > 200 ? (m.id ? '#' + CSS.escape(m.id) : (m.getAttribute('role') === 'main' ? '[role="main"]' : m.tagName.toLowerCase())) : 'body'; })`;

// ../../../nexus-terminal/modules/nexus-sense/tools/injectable/text-target.injectable.ts
var TEXT_TARGET_SCRIPT = `(function(searchText, opts) {${DEEP_QUERY_FNS}
  opts = opts || {};
  var q = String(searchText || '').toLowerCase().replace(/\\s+/g, ' ').trim();
  if (!q) return { found: false };
  var prev = __nxDeepAll(document, '[data-nexus-text-target]');
  for (var p = 0; p < prev.length; p++) prev[p].removeAttribute('data-nexus-text-target');
  // opts.within (2026-10-25): scope the match to one container (e.g. a window: [data-window-type="DBPEN"]) \u2014 the same text often
  // exists in several open windows (CORTEX and DBPEN both have a "History" tab).
  var root = opts.within ? __nxDq(opts.within) : document;
  if (!root) return { found: false, error: 'within: no element matches ' + opts.within };
  var all = __nxDeepAll(root, 'a, button, [role="button"], [role="link"], [role="tab"], [role="option"], [role="menuitem"], input[type="submit"], input[type="button"], label, summary, [onclick], [tabindex]');
  var tierOf = function (el) {
    var tag = el.tagName.toLowerCase(), role = (el.getAttribute('role') || '').toLowerCase();
    if ((tag === 'a' && el.hasAttribute('href')) || tag === 'button' || tag === 'input' || role === 'button' || role === 'link') return 0;
    if (role === 'tab' || role === 'option' || role === 'menuitem') return 1;
    return 2;
  };
  // Page context breaks ties between equal matches (2026-11-02 A/B: bestbuy 7 / carmax 10 / bbb 2 exact matches \u2014 the FIRST in document
  // order won, usually a nav or header copy): inside an open dialog \u226B main content > elsewhere; on screen > off screen; nav/header/footer last.
  var ctxOf = function (el, r) {
    var c = 0;
    if (el.closest('dialog[open], [role="dialog"], [role="alertdialog"], [aria-modal="true"]')) c += 4;
    if (el.closest('main, [role="main"]')) c += 1;
    if (el.closest('nav, header, footer, [role="navigation"], [role="banner"], [role="contentinfo"]')) c -= 2;
    if (r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth) c += 1;
    return c;
  };
  var ctxName = function (el) { return el.closest('dialog[open], [role="dialog"], [aria-modal="true"]') ? 'dialog' : el.closest('nav, header, footer, [role="navigation"], [role="banner"], [role="contentinfo"]') ? 'nav/header/footer' : el.closest('main, [role="main"]') ? 'main' : 'page'; };
  var best = null, bestLen = 1e9, exact = false, bestTier = 9, bestCtx = -9, hiddenHref = null, spanned = false, exactCount = 0, exactTexts = [];
  for (var i = 0; i < all.length; i++) {
    var el = all[i];
    // 2026-11-06 (holdout-8, recreation.gov): a text FIELD holding the typed query ("Alley Creek Camp" in the search box) matched by its
    // .value and beat the result link with the same text. A field's contents are not a label to click by \u2014 skip text-entry fields
    // (button-type inputs keep their value as the label).
    var tgn = (el.tagName || '').toLowerCase(), ity = ((el.getAttribute && el.getAttribute('type')) || 'text').toLowerCase();
    if (tgn === 'textarea' || (tgn === 'input' && ity !== 'button' && ity !== 'submit' && ity !== 'reset')) continue;
    var t = ((el.innerText || el.textContent || el.value || el.getAttribute('aria-label') || '') + '').replace(/\\s+/g, ' ').trim(); var tl = t.toLowerCase();
    if (!tl || tl.indexOf(q) < 0) continue;
    // 2026-10-25: reject a match that exists only by JOINING separate blocks \u2014 innerText puts a newline between block-level
    // children, so a container holding the tabs "Scan" and "History" read as "scan history" and won as the only candidate (the
    // click landed on the container). Inline formatting (<b>, <span>) adds no newline, so real phrases still match.
    if (el.innerText && q.indexOf(' ') > 0 && el.innerText.toLowerCase().replace(/[ \\t\\u00a0]+/g, ' ').indexOf(q) < 0) { spanned = true; continue; }
    var r0 = el.getBoundingClientRect(); var cs = getComputedStyle(el);
    if (r0.width < 1 || r0.height < 1 || cs.visibility === 'hidden' || cs.display === 'none') {
      if (!hiddenHref && el.tagName.toLowerCase() === 'a' && el.href) hiddenHref = el.href;
      continue;
    }
    var isExact = tl === q, tier = tierOf(el), ctx = ctxOf(el, r0);
    if (isExact) { exactCount++; if (exactTexts.length < 4) { var wn = el.closest && el.closest('[data-window-type]'); exactTexts.push((wn ? wn.getAttribute('data-window-type') + ': ' : '') + t.slice(0, 30)); } }
    var better = (isExact && !exact) || (isExact === exact && (tier < bestTier || (tier === bestTier && (ctx > bestCtx || (ctx === bestCtx && t.length < bestLen)))));
    if (better) { best = el; bestLen = t.length; exact = isExact; bestTier = tier; bestCtx = ctx; }
  }
  // 2026-10-25: React handlers leave no attribute, so a div tab (DBPEN "Scan" / "History") is invisible to the selector list above and
  // a container won instead. Unless a semantic element matched EXACTLY, look for the smallest visible element whose own text IS the
  // query and click it (or its nearest cursor:pointer ancestor, the usual React click target).
  if (!exact) {
    var leaf = null, leafArea = 1e12, nodes = __nxDeepAll(root === document ? (document.body || document) : root, '*');   // light + open shadow trees
    for (var k = 0; k < nodes.length && k < 20000; k++) {
      var n = nodes[k]; if (n.childElementCount > 3) continue;
      var nt = ((n.innerText || n.textContent || '') + '').replace(/\\s+/g, ' ').trim().toLowerCase();
      if (nt !== q) continue;
      if (n.innerText && n.innerText.toLowerCase().replace(/[ \\t\\u00a0]+/g, ' ').trim() !== q) continue;   // same no-joined-blocks rule
      var rn = n.getBoundingClientRect(); if (rn.width < 1 || rn.height < 1) continue;
      var csn = getComputedStyle(n); if (csn.visibility === 'hidden' || csn.display === 'none') continue;
      if (rn.width * rn.height < leafArea) { leaf = n; leafArea = rn.width * rn.height; }
    }
    if (leaf) {
      var tgt = leaf;
      for (var up = leaf, d = 0; up && up !== document.body && d < 4; up = __nxComposedParent(up), d++) {
        if (getComputedStyle(up).cursor === 'pointer') { tgt = up; break; }
      }
      best = tgt; exact = true; bestTier = 3;
    }
  }
  if (!best) {
    // Nearest visible clickable texts (each sharing a word with the query) so the agent can retry precisely.
    var words = q.split(' ').filter(function (w) { return w.length > 2; }), sugg = [];
    for (var j = 0; j < all.length && sugg.length < 6; j++) {
      var e2 = all[j], t2 = ((e2.innerText || e2.textContent || e2.getAttribute('aria-label') || '') + '').replace(/\\s+/g, ' ').trim();
      if (!t2 || t2.length > 40 || sugg.indexOf(t2) >= 0) continue;
      var r2 = e2.getBoundingClientRect(); if (r2.width < 1 || r2.height < 1) continue;
      var tl2 = t2.toLowerCase(); if (words.some(function (w) { return tl2.indexOf(w) >= 0; })) sugg.push(t2);
    }
    return { found: false, hiddenHref: hiddenHref, spansElements: spanned, suggestions: sugg };
  }
  if (opts.scroll !== false) { try { best.scrollIntoView({ behavior: 'instant', block: 'center', inline: 'center' }); } catch (e) {} }
  best.setAttribute('data-nexus-text-target', '1');
  // A menu TRIGGER whose dropdown opens only on hover/JS (2026-11-02 adoptapet "Find a shelter": the panel stayed display:none after hover
  // and click): list the hidden links in the same menu item so the agent can browse to one directly.
  var submenu = [];
  var item = best.closest('li, [role="menuitem"], [aria-haspopup]');
  if (item && !(best.tagName === 'A' && best.getAttribute('href'))) {
    var ls = item.querySelectorAll('a[href]');
    for (var si = 0; si < ls.length && submenu.length < 8; si++) { var lr = ls[si].getBoundingClientRect(); var lcs = getComputedStyle(ls[si]);
      var hiddenLink = lr.width < 1 || lr.height < 1 || lcs.visibility === 'hidden';
      var href0 = ls[si].getAttribute('href') || '';
      if (hiddenLink && href0 && href0 !== '#' && href0.indexOf('javascript:') !== 0) submenu.push({ text: ((ls[si].textContent || '') + '').replace(/\\s+/g, ' ').trim().slice(0, 50), href: ls[si].href }); }
  }
  var rect = best.getBoundingClientRect();
  return { found: true, x: rect.x + rect.width / 2, y: rect.y + rect.height / 2, text: ((best.innerText || best.textContent || '') + '').trim().substring(0, 60),
    exact: exact, tier: bestTier, selector: '[data-nexus-text-target="1"]', submenu: submenu.length ? submenu : undefined,
    ambiguous: exactCount > 1 ? { matches: exactCount, candidates: exactTexts, picked: ctxName(best) + (bestCtx >= 1 ? ', on screen' : ''), hint: 'Several elements have this exact text \u2014 picked by context (dialog > main > page, on screen first, nav/header/footer last); pass within (a container selector) to choose another' } : undefined };
})`;

// ../../../nexus-terminal/workers/nexus-browser/src/framediff.ts
var PNG_SIG = [137, 80, 78, 71, 13, 10, 26, 10];
function b64ToBytes(b642) {
  const bin = atob(b642);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
async function inflate(data) {
  const ds = new DecompressionStream("deflate");
  const stream = new Blob([data]).stream().pipeThrough(ds);
  return new Uint8Array(await new Response(stream).arrayBuffer());
}
async function decodePngLuma(b642) {
  const b = b64ToBytes(b642);
  for (let i = 0; i < 8; i++) if (b[i] !== PNG_SIG[i]) throw new Error("not a PNG");
  const view = new DataView(b.buffer, b.byteOffset, b.byteLength);
  let p = 8, width = 0, height = 0, bitDepth = 0, colorType = 0, interlace = 0;
  const idat = [];
  while (p < b.length) {
    const len = view.getUint32(p);
    const type = String.fromCharCode(b[p + 4], b[p + 5], b[p + 6], b[p + 7]);
    const body = b.subarray(p + 8, p + 8 + len);
    if (type === "IHDR") {
      width = view.getUint32(p + 8);
      height = view.getUint32(p + 12);
      bitDepth = b[p + 16];
      colorType = b[p + 17];
      interlace = b[p + 20];
    } else if (type === "IDAT") idat.push(body);
    else if (type === "IEND") break;
    p += 12 + len;
  }
  if (bitDepth !== 8 || interlace !== 0) throw new Error(`unsupported PNG (bitDepth ${bitDepth}, interlace ${interlace})`);
  const bpp = colorType === 6 ? 4 : colorType === 2 ? 3 : colorType === 0 ? 1 : colorType === 4 ? 2 : 0;
  if (!bpp) throw new Error(`unsupported PNG colour type ${colorType}`);
  const total = idat.reduce((n, c) => n + c.length, 0);
  const joined = new Uint8Array(total);
  let o = 0;
  for (const c of idat) {
    joined.set(c, o);
    o += c.length;
  }
  const raw = await inflate(joined);
  const stride = width * bpp;
  const cur = new Uint8Array(stride);
  const prev = new Uint8Array(stride);
  const luma = new Uint8Array(width * height);
  let r = 0;
  for (let y = 0; y < height; y++) {
    const ft = raw[r++];
    for (let x = 0; x < stride; x++) {
      const v = raw[r++];
      const a = x >= bpp ? cur[x - bpp] : 0;
      const up = prev[x];
      const c = x >= bpp ? prev[x - bpp] : 0;
      let pred = 0;
      if (ft === 1) pred = a;
      else if (ft === 2) pred = up;
      else if (ft === 3) pred = a + up >> 1;
      else if (ft === 4) {
        const pp = a + up - c;
        const pa = Math.abs(pp - a), pb = Math.abs(pp - up), pc = Math.abs(pp - c);
        pred = pa <= pb && pa <= pc ? a : pb <= pc ? up : c;
      }
      cur[x] = v + pred & 255;
    }
    for (let x = 0; x < width; x++) {
      const i = x * bpp;
      luma[y * width + x] = bpp >= 3 ? cur[i] * 77 + cur[i + 1] * 150 + cur[i + 2] * 29 >> 8 : cur[i];
    }
    prev.set(cur);
  }
  return { width, height, luma };
}
function diffFrames(a, b, opts = {}) {
  const cols = opts.cols ?? 16, rows = opts.rows ?? 10;
  const total = cols * rows;
  if (a.width !== b.width || a.height !== b.height) return { changedCells: total, totalCells: total, changedFraction: 1, box: [0, 0, b.width, b.height] };
  const meanT = opts.meanThreshold ?? 2.5, pixT = opts.pixelThreshold ?? 40, minPx = opts.minPixels ?? 3;
  const W = b.width, H = b.height;
  let changed = 0, x1 = W, y1 = H, x2 = 0, y2 = 0;
  for (let cy = 0; cy < rows; cy++) {
    const ya = Math.floor(cy * H / rows), yb = Math.floor((cy + 1) * H / rows);
    for (let cx = 0; cx < cols; cx++) {
      const xa = Math.floor(cx * W / cols), xb = Math.floor((cx + 1) * W / cols);
      let sum = 0, big = 0, n = 0;
      for (let y = ya; y < yb; y++) {
        const row = y * W;
        for (let x = xa; x < xb; x++) {
          const d = Math.abs(a.luma[row + x] - b.luma[row + x]);
          sum += d;
          if (d > pixT) big++;
          n++;
        }
      }
      if (n && (sum / n > meanT || big >= minPx)) {
        changed++;
        if (xa < x1) x1 = xa;
        if (ya < y1) y1 = ya;
        if (xb > x2) x2 = xb;
        if (yb > y2) y2 = yb;
      }
    }
  }
  return { changedCells: changed, totalCells: total, changedFraction: changed / total, box: changed ? [x1, y1, x2, y2] : null };
}

// ../../../nexus-terminal/workers/nexus-browser/src/sshcert.ts
var enc2 = new TextEncoder();
function u32(n) {
  const b = new Uint8Array(4);
  new DataView(b.buffer).setUint32(0, n >>> 0);
  return b;
}
function u64(n) {
  const b = new Uint8Array(8);
  new DataView(b.buffer).setBigUint64(0, n);
  return b;
}
function cat(...parts) {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}
function sshString(v) {
  const b = typeof v === "string" ? enc2.encode(v) : v;
  return cat(u32(b.length), b);
}
function b64(b) {
  let s = "";
  for (const x of b) s += String.fromCharCode(x);
  return btoa(s);
}
function unb64(s) {
  const bin = atob(s.trim());
  const b = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i);
  return b;
}
var PKCS8_ED25519_PREFIX = new Uint8Array([48, 46, 2, 1, 0, 48, 5, 6, 3, 43, 101, 112, 4, 34, 4, 32]);
function ed25519PublicBlob(pub) {
  return cat(sshString("ssh-ed25519"), sshString(pub));
}
async function importCaSeed(seedB64) {
  const seed = unb64(seedB64);
  if (seed.length !== 32) throw new Error("PROXY_SSH_CA_KEY must be the base64 of a 32-byte Ed25519 seed");
  const key = await crypto.subtle.importKey("pkcs8", cat(PKCS8_ED25519_PREFIX, seed), { name: "Ed25519" }, true, ["sign"]);
  const jwk = await crypto.subtle.exportKey("jwk", key);
  const pub = unb64(jwk.x.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - jwk.x.length % 4) % 4));
  return { key, pub };
}
async function mintProxyCredential(ca, opts) {
  const pair = await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"]);
  const pub = new Uint8Array(await crypto.subtle.exportKey("raw", pair.publicKey));
  const pkcs8 = new Uint8Array(await crypto.subtle.exportKey("pkcs8", pair.privateKey));
  const seed = pkcs8.slice(pkcs8.length - 32);
  const now = Math.floor((opts.now ?? Date.now()) / 1e3);
  const validAfter = BigInt(now - 60);
  const validBefore = BigInt(now + opts.validSeconds);
  const nonce = crypto.getRandomValues(new Uint8Array(32));
  const serialBytes = crypto.getRandomValues(new Uint8Array(8));
  const serial = new DataView(serialBytes.buffer).getBigUint64(0);
  const principals = sshString(sshString(opts.principal));
  const extensions = sshString(cat(sshString("permit-port-forwarding"), sshString("")));
  const tbs = cat(
    sshString("ssh-ed25519-cert-v01@openssh.com"),
    sshString(nonce),
    sshString(pub),
    u64(serial),
    u32(
      1
      /* SSH_CERT_TYPE_USER */
    ),
    sshString(opts.keyId),
    principals,
    u64(validAfter),
    u64(validBefore),
    sshString(new Uint8Array(0)),
    extensions,
    sshString(new Uint8Array(0)),
    sshString(ed25519PublicBlob(ca.pub))
  );
  const sig = new Uint8Array(await crypto.subtle.sign({ name: "Ed25519" }, ca.key, tbs));
  const cert = cat(tbs, sshString(cat(sshString("ssh-ed25519"), sshString(sig))));
  const pubBlob = ed25519PublicBlob(pub);
  const check = crypto.getRandomValues(new Uint8Array(4));
  let priv = cat(check, check, sshString("ssh-ed25519"), sshString(pub), sshString(cat(seed, pub)), sshString(opts.keyId));
  const pad = [];
  for (let i = 1; (priv.length + pad.length) % 8 !== 0; i++) pad.push(i);
  priv = cat(priv, new Uint8Array(pad));
  const blob = cat(enc2.encode("openssh-key-v1\0"), sshString("none"), sshString("none"), sshString(new Uint8Array(0)), u32(1), sshString(pubBlob), sshString(priv));
  const pem = "-----BEGIN OPENSSH PRIVATE KEY-----\n" + (b64(blob).match(/.{1,70}/g) || []).join("\n") + "\n-----END OPENSSH PRIVATE KEY-----\n";
  return { privateKey: pem, certificate: `ssh-ed25519-cert-v01@openssh.com ${b64(cert)} ${opts.keyId}`, validBefore: Number(validBefore), serial: serial.toString() };
}

// ../../../nexus-terminal/workers/nexus-browser/src/computer-use.ts
var COMPUTER_USE_ACTIONS = [
  "screenshot",
  "left_click",
  "right_click",
  "middle_click",
  "double_click",
  "triple_click",
  "left_click_drag",
  "mouse_move",
  "type",
  "key",
  "hold_key",
  "scroll",
  "wait",
  "cursor_position",
  "left_mouse_down",
  "left_mouse_up",
  "zoom"
];
var KEY_NAMES = {
  return: "Enter",
  enter: "Enter",
  kp_enter: "Enter",
  tab: "Tab",
  escape: "Escape",
  esc: "Escape",
  backspace: "Backspace",
  delete: "Delete",
  del: "Delete",
  space: " ",
  up: "ArrowUp",
  down: "ArrowDown",
  left: "ArrowLeft",
  right: "ArrowRight",
  prior: "PageUp",
  page_up: "PageUp",
  pageup: "PageUp",
  next: "PageDown",
  page_down: "PageDown",
  pagedown: "PageDown",
  home: "Home",
  end: "End",
  insert: "Insert",
  f1: "F1",
  f2: "F2",
  f3: "F3",
  f4: "F4",
  f5: "F5",
  f6: "F6",
  f7: "F7",
  f8: "F8",
  f9: "F9",
  f10: "F10",
  f11: "F11",
  f12: "F12",
  minus: "-",
  plus: "+",
  equal: "=",
  comma: ",",
  period: ".",
  slash: "/",
  backslash: "\\",
  semicolon: ";",
  apostrophe: "'",
  grave: "`",
  bracketleft: "[",
  bracketright: "]"
};
var MODIFIERS = {
  ctrl: "Control",
  control: "Control",
  alt: "Alt",
  option: "Alt",
  shift: "Shift",
  meta: "Meta",
  super: "Meta",
  cmd: "Meta",
  command: "Meta",
  win: "Meta"
};
function parseKeyCombo(combo) {
  const parts = combo.trim().split("+").map((p) => p.trim()).filter(Boolean);
  const modifiers = [];
  let key = "";
  for (const p of parts) {
    const low = p.toLowerCase();
    if (MODIFIERS[low]) {
      if (!modifiers.includes(MODIFIERS[low])) modifiers.push(MODIFIERS[low]);
      continue;
    }
    key = KEY_NAMES[low] ?? (p.length === 1 ? p : p);
  }
  if (!key && parts.length) key = parts[parts.length - 1];
  if (key.length === 1 && modifiers.includes("Shift") && /[a-z]/.test(key)) key = key.toUpperCase();
  return { modifiers, key };
}
function scrollDeltas(direction, amount = 3, pxPerClick = 100) {
  const px = Math.max(1, Math.round(amount)) * pxPerClick;
  switch (direction) {
    case "up":
      return { deltaX: 0, deltaY: -px };
    case "down":
      return { deltaX: 0, deltaY: px };
    case "left":
      return { deltaX: -px, deltaY: 0 };
    case "right":
      return { deltaX: px, deltaY: 0 };
  }
}
function clampCoordinate(c, vw, vh) {
  if (!c || c.length !== 2 || !Number.isFinite(c[0]) || !Number.isFinite(c[1])) return null;
  return [Math.min(Math.max(0, Math.round(c[0])), Math.max(0, vw - 1)), Math.min(Math.max(0, Math.round(c[1])), Math.max(0, vh - 1))];
}
function redactArgs(args, maxStr = 200) {
  const out = {};
  for (const [k, v] of Object.entries(args || {})) {
    if (v === void 0) continue;
    if (/pass|secret|token|cookie|auth/i.test(k)) {
      out[k] = "<redacted>";
      continue;
    }
    out[k] = typeof v === "string" && v.length > maxStr ? v.slice(0, maxStr) + `\u2026(+${v.length - maxStr})` : v;
  }
  return out;
}

// ../../../nexus-terminal/modules/nexus-sense/tools/injectable/react-hook-shim.injectable.ts
var REACT_HOOK_SHIM_SCRIPT = `(function () {
  try {
    if (typeof window === 'undefined') return;
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) return; // real DevTools (or an earlier shim) wins
    var renderers = new Map();
    var roots = new Set();
    var listeners = {};
    var nextId = 0;
    function emit(event, data) {
      var fns = listeners[event];
      if (!fns) return;
      for (var i = 0; i < fns.length; i++) { try { fns[i](data); } catch (e) {} }
    }
    var hook = {
      __nexusShim: true,
      isDisabled: false,
      supportsFiber: true,
      supportsFlight: false,
      renderers: renderers,
      _nexusRoots: roots,
      _nexusCommits: 0,
      _nexusLastCommitAt: 0,
      inject: function (renderer) {
        var id = ++nextId;
        renderers.set(id, renderer);
        emit('renderer', { id: id, renderer: renderer });
        return id;
      },
      on: function (event, fn) { (listeners[event] = listeners[event] || []).push(fn); },
      off: function (event, fn) {
        var fns = listeners[event]; if (!fns) return;
        var i = fns.indexOf(fn); if (i >= 0) fns.splice(i, 1);
      },
      sub: function (event, fn) { hook.on(event, fn); return function () { hook.off(event, fn); }; },
      emit: emit,
      onCommitFiberRoot: function (rendererId, root) {
        if (root) roots.add(root);
        hook._nexusCommits++;
        hook._nexusLastCommitAt = Date.now();
        emit('commit', { rendererId: rendererId, root: root });
      },
      onPostCommitFiberRoot: function () {},
      onCommitFiberUnmount: function () {},
      onScheduleFiberRoot: function () {},
      setStrictMode: function () {},
      checkDCE: function () {},
      registerInternalModuleStart: function () {},
      registerInternalModuleStop: function () {},
      getFiberRoots: function () { return roots; }
    };
    Object.defineProperty(window, '__REACT_DEVTOOLS_GLOBAL_HOOK__', {
      value: hook, configurable: true, enumerable: false, writable: true
    });
  } catch (e) { /* never break the page */ }
})();`;

// ../../../nexus-terminal/workers/nexus-browser/src/proxy.ts
var PROXY_OK_CLASSES = /* @__PURE__ */ new Set(["residential", "isp"]);
var PROXY_POOL_RUN_ID = "proxy-pool";
var PROXY_HOST_CACHE_TTL_S = 60;
var PROXY_EXCLUDED_DOMAINS = [
  // government / military
  ".gov",
  ".mil",
  ".gov.uk",
  ".gc.ca",
  ".gov.au",
  ".gouv.fr",
  ".bund.de",
  ".gov.in",
  // banking / payments / brokerage
  ".bank",
  "bankofamerica.com",
  "chase.com",
  "wellsfargo.com",
  "citi.com",
  "citibank.com",
  "capitalone.com",
  "usbank.com",
  "pnc.com",
  "truist.com",
  "tdbank.com",
  "td.com",
  "rbc.com",
  "scotiabank.com",
  "bmo.com",
  "cibc.com",
  "hsbc.com",
  "hsbc.co.uk",
  "barclays.co.uk",
  "lloydsbank.com",
  "natwest.com",
  "santander.com",
  "santander.co.uk",
  "bnpparibas.com",
  "deutsche-bank.de",
  "paypal.com",
  "venmo.com",
  "cash.app",
  "zellepay.com",
  "wise.com",
  "revolut.com",
  "coinbase.com",
  "kraken.com",
  "binance.com",
  "schwab.com",
  "fidelity.com",
  "vanguard.com",
  "etrade.com",
  "robinhood.com",
  "interactivebrokers.com",
  "americanexpress.com",
  "discover.com",
  "visa.com",
  "mastercard.com",
  "experian.com",
  "equifax.com",
  "transunion.com",
  // streaming
  "netflix.com",
  "hulu.com",
  "disneyplus.com",
  "hbomax.com",
  "max.com",
  "peacocktv.com",
  "primevideo.com",
  "paramountplus.com",
  "spotify.com",
  "tidal.com",
  "crunchyroll.com",
  "dazn.com",
  "espn.com",
  "nflplus.com",
  "mlb.tv",
  // ticketing
  "ticketmaster.com",
  "ticketmaster.co.uk",
  "ticketmaster.ca",
  "livenation.com",
  "axs.com",
  "stubhub.com",
  "seatgeek.com",
  "vividseats.com",
  "eventbrite.com",
  "tickets.com",
  "see.tickets",
  "ticketek.com.au",
  // webmail / identity
  "mail.google.com",
  "gmail.com",
  "accounts.google.com",
  "outlook.live.com",
  "outlook.office.com",
  "login.live.com",
  "login.microsoftonline.com",
  "mail.yahoo.com",
  "login.yahoo.com",
  "protonmail.com",
  "proton.me",
  "icloud.com",
  "appleid.apple.com",
  // gambling
  "draftkings.com",
  "fanduel.com",
  "bet365.com",
  "betmgm.com",
  "caesars.com",
  "pokerstars.com",
  "pokerstars.uk",
  "williamhill.com",
  "ladbrokes.com",
  "betway.com",
  "unibet.com",
  "888.com",
  "bovada.lv",
  "stake.com"
];
function hostnameOf(url) {
  try {
    return new URL(url).hostname.toLowerCase().replace(/\.$/, "");
  } catch {
    return null;
  }
}
function domainMatches(pattern, host) {
  if (!pattern || !pattern.trim()) return true;
  const p = pattern.trim().toLowerCase(), h = host.toLowerCase();
  if (p.includes("*")) {
    const re = new RegExp("^" + p.split("*").map((s) => s.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join(".*") + "$");
    return re.test(h);
  }
  const bare = p.replace(/^\./, "");
  return h === bare || h.endsWith("." + bare);
}
function isExcludedHost(host) {
  const h = host.toLowerCase();
  return PROXY_EXCLUDED_DOMAINS.some((d) => d.startsWith(".") ? h.endsWith(d) || h === d.slice(1) : h === d || h.endsWith("." + d));
}
function matchProxyRule(rules, host) {
  if (isExcludedHost(host)) return { type: "none", domainPattern: "(excluded domain)" };
  for (const r of rules) if (domainMatches(r.domainPattern, host)) return r;
  return null;
}
function validateProxyRules(input) {
  const errors = [];
  const rules = [];
  if (!Array.isArray(input)) return { rules, errors: ["rules must be an array"] };
  if (input.length > 20) errors.push("at most 20 rules");
  input.slice(0, 20).forEach((raw, i) => {
    const r = raw && typeof raw === "object" ? raw : {};
    const type = String(r.type || "");
    const dp = r.domainPattern === void 0 ? void 0 : String(r.domainPattern);
    if (dp !== void 0 && (dp.length > 200 || /[\s/]/.test(dp))) {
      errors.push(`rule ${i}: bad domainPattern`);
      return;
    }
    if (type === "vast") {
      const country = String(r.country || "").toUpperCase();
      if (!/^[A-Z]{2}$/.test(country)) {
        errors.push(`rule ${i}: vast needs a 2-letter country`);
        return;
      }
      const state = r.state === void 0 ? void 0 : String(r.state).toUpperCase().slice(0, 3);
      rules.push({ type: "vast", country, ...state ? { state } : {}, ...dp ? { domainPattern: dp } : {}, ...r.strictCountry === true ? { strictCountry: true } : {} });
    } else if (type === "external") {
      const server = String(r.server || "");
      if (!/^(https?|socks5h?|socks4a?):\/\/[^\s/]+$/i.test(server)) {
        errors.push(`rule ${i}: external needs server = scheme://host:port`);
        return;
      }
      rules.push({
        type: "external",
        server,
        ...r.username ? { username: String(r.username) } : {},
        ...r.password ? { password: String(r.password) } : {},
        ...dp ? { domainPattern: dp } : {}
      });
    } else if (type === "none") {
      rules.push({ type: "none", ...dp ? { domainPattern: dp } : {} });
    } else {
      errors.push(`rule ${i}: type must be vast | external | none`);
    }
  });
  return { rules, errors };
}
function proxyHostsSql(runId = PROXY_POOL_RUN_ID) {
  return `SELECT host_id, arm_id, state, ssh_host, ssh_port, egress_ip, net_class, heartbeat_json, dph_total FROM bench_host WHERE run_id = '${runId}'`;
}
function unwrapOpt(v) {
  if (v == null) return null;
  if (Array.isArray(v)) return v[0] === 0 && v[1] != null ? v[1] : null;
  return v;
}
function decodeBenchHostRows(rows) {
  const out = [];
  for (const row of rows) {
    try {
      const armId = String(row[1] ?? "");
      const hbRaw = unwrapOpt(row[7]);
      let tunnels = 0, tunnelsMax = 0, hbClass = null, hbIp = null;
      if (typeof hbRaw === "string" && hbRaw.startsWith("{")) {
        try {
          const hb = JSON.parse(hbRaw);
          tunnels = Number(hb.tunnels) || 0;
          tunnelsMax = Number(hb.tunnels_max) || 0;
          if (typeof hb.net_class === "string") hbClass = hb.net_class.toLowerCase();
          if (typeof hb.egress_ip === "string") hbIp = hb.egress_ip;
        } catch {
        }
      }
      const netClass = unwrapOpt(row[6]);
      const egressIp = unwrapOpt(row[5]);
      const port = unwrapOpt(row[4]);
      const sshHost = unwrapOpt(row[3]);
      const dph = unwrapOpt(row[8]);
      out.push({
        hostId: String(row[0] ?? ""),
        armId,
        country: armId.includes(":") ? armId.split(":").pop().toUpperCase() : "",
        state: String(row[2] ?? ""),
        sshHost: typeof sshHost === "string" && sshHost ? sshHost : null,
        sshPort: port == null ? null : Number(port) || null,
        egressIp: typeof egressIp === "string" && egressIp ? egressIp : hbIp,
        netClass: typeof netClass === "string" && netClass ? netClass.toLowerCase() : hbClass,
        tunnels,
        tunnelsMax,
        dph: typeof dph === "number" ? dph : Number(dph) || 0
      });
    } catch {
    }
  }
  return out;
}
function pickProxyHost(hosts, rule, exclude, anyCountry = false) {
  const ok = hosts.filter((h) => h.state === "running" && (anyCountry || h.country === rule.country.toUpperCase()) && h.netClass !== null && PROXY_OK_CLASSES.has(h.netClass) && !!h.sshHost && !!h.sshPort && (h.tunnelsMax === 0 || h.tunnels < h.tunnelsMax) && !exclude?.has(h.hostId));
  ok.sort((a, b) => a.tunnels - b.tunnels || a.dph - b.dph || a.hostId.localeCompare(b.hostId));
  return ok[0] ?? null;
}
var PROXY_BAD_HOST_TTL_S = 900;
var badHostKey = (hostId) => `proxy-bad:${hostId}`;
async function readBadProxyHosts(env, hosts) {
  const bad = /* @__PURE__ */ new Set();
  if (!env.API_KEYS) return bad;
  await Promise.all(hosts.map(async (h) => {
    try {
      if (await env.API_KEYS.get(badHostKey(h.hostId))) bad.add(h.hostId);
    } catch {
    }
  }));
  return bad;
}
async function markBadProxyHost(env, hostId, reason) {
  if (!env.API_KEYS) return;
  try {
    await env.API_KEYS.put(badHostKey(hostId), JSON.stringify({ reason: reason.slice(0, 300), at: Date.now() }), { expirationTtl: PROXY_BAD_HOST_TTL_S });
  } catch {
  }
}
function explainNoHost(hosts, rule) {
  const cc = rule.country.toUpperCase();
  const inCountry = hosts.filter((h) => h.country === cc);
  const running = inCountry.filter((h) => h.state === "running");
  const classed = running.filter((h) => h.netClass !== null && PROXY_OK_CLASSES.has(h.netClass));
  const withSsh = classed.filter((h) => h.sshHost && h.sshPort);
  const free = withSsh.filter((h) => h.tunnelsMax === 0 || h.tunnels < h.tunnelsMax);
  return `no_proxy_host_for_region ${cc}: pool hosts ${hosts.length}, in country ${inCountry.length}, running ${running.length}, residential/isp ${classed.length}, with ssh endpoint ${withSsh.length}, below tunnel cap ${free.length}`;
}
function nextLocalPort(used) {
  const taken = new Set(used);
  for (let p = 1081; p < 1100; p++) if (!taken.has(p)) return p;
  return 1081;
}
async function loadProxyHosts(env, opts) {
  const runId = opts?.runId ?? PROXY_POOL_RUN_ID;
  const cacheKey = `proxy:hosts:${runId}`;
  if (!opts?.fresh && env.API_KEYS) {
    try {
      const raw = await env.API_KEYS.get(cacheKey);
      if (raw) return { hosts: JSON.parse(raw), source: "kv" };
    } catch {
    }
  }
  if (!env.STDB_BENCH_SQL_URL || !env.STDB_TOKEN) return { hosts: [], source: "none", error: "STDB_BENCH_SQL_URL / STDB_TOKEN not configured" };
  try {
    const resp = await fetch(env.STDB_BENCH_SQL_URL, {
      method: "POST",
      headers: { "Authorization": `Bearer ${env.STDB_TOKEN}`, "Content-Type": "text/plain" },
      body: proxyHostsSql(runId)
    });
    if (!resp.ok) return { hosts: [], source: "none", error: `STDB ${resp.status}` };
    const results = await resp.json();
    const hosts = decodeBenchHostRows(results[0]?.rows ?? []);
    if (env.API_KEYS) {
      try {
        await env.API_KEYS.put(cacheKey, JSON.stringify(hosts), { expirationTtl: PROXY_HOST_CACHE_TTL_S });
      } catch {
      }
    }
    return { hosts, source: "stdb" };
  } catch (e) {
    return { hosts: [], source: "none", error: String(e?.message || e).slice(0, 200) };
  }
}
function proxyPolicy(props, env) {
  const p = props && typeof props === "object" ? props : null;
  if (p && typeof p.proxyAllowed === "boolean") {
    return { allowed: p.proxyAllowed, dailySeconds: Number(p.proxyDailySeconds) || 0, source: "key" };
  }
  const def = String(env.PROXY_DEFAULT_ALLOWED || "").toLowerCase() === "true";
  return { allowed: def, dailySeconds: 0, source: def ? "env-default" : "default-deny" };
}
function redactRules(rules) {
  return rules.map((r) => r.type === "external" ? { ...r, ...r.password ? { password: "***" } : {} } : r);
}

// ../../../nexus-terminal/workers/nexus-browser/src/forms.ts
var PAGE_HELPERS = `
  function vis(el){ try { var r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return false; var cs = getComputedStyle(el); return cs.visibility !== 'hidden' && cs.display !== 'none' && parseFloat(cs.opacity || '1') > 0.05; } catch (e) { return false; } }
  function rect(el){ var r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) }; }
  function txt(el){ return ((el && (el.innerText || el.textContent)) || '').replace(/\\s+/g, ' ').trim(); }
  function uniq(sel){ try { return document.querySelectorAll(sel).length === 1; } catch (e) { return false; } }
  function sel(el){
    if (el.id && uniq('#' + CSS.escape(el.id))) return '#' + CSS.escape(el.id);
    var tag = el.tagName.toLowerCase(); var name = el.getAttribute('name');
    if (name) { var s1 = tag + '[name="' + name.replace(/"/g, '\\\\"') + '"]'; if (uniq(s1)) return s1; var f = el.closest('form'); if (f) { var fs = f.id ? '#' + CSS.escape(f.id) : null; if (fs && uniq(fs + ' ' + s1)) return fs + ' ' + s1; } }
    var parts = []; var cur = el;
    while (cur && cur.nodeType === 1 && cur !== document.body && parts.length < 8) {
      var t = cur.tagName.toLowerCase(); var p = cur.parentElement; var idx = 1;
      if (p) { var sib = p.children; var n = 0; for (var i = 0; i < sib.length; i++) { if (sib[i].tagName === cur.tagName) { n++; if (sib[i] === cur) idx = n; } } }
      parts.unshift(cur.id ? '#' + CSS.escape(cur.id) : t + ':nth-of-type(' + idx + ')');
      var cand = parts.join(' > '); if (uniq(cand)) return cand; if (cur.id) break; cur = p;
    }
    return parts.join(' > ');
  }
  function labelFor(el){
    var a = el.getAttribute('aria-label'); if (a) return a.trim();
    var lb = el.getAttribute('aria-labelledby'); if (lb) { var t0 = lb.split(/\\s+/).map(function(id){ var e = document.getElementById(id); return e ? txt(e) : ''; }).join(' ').trim(); if (t0) return t0; }
    if (el.id) { try { var l = document.querySelector('label[for="' + CSS.escape(el.id) + '"]'); if (l) { var t1 = txt(l); if (t1) return t1; } } catch (e) {} }
    var wrap = el.closest('label'); if (wrap) { var clone = wrap.cloneNode(true); var inputs = clone.querySelectorAll('input,select,textarea'); for (var k = 0; k < inputs.length; k++) inputs[k].remove(); var t2 = txt(clone); if (t2) return t2; }
    var prev = el.previousElementSibling; if (prev && /^(LABEL|SPAN|DIV|P|TD|TH|DT)$/.test(prev.tagName)) { var t3 = txt(prev); if (t3 && t3.length < 60) return t3; }
    var par = el.parentElement; if (par) { var pl = par.querySelector('label'); if (pl && !pl.contains(el)) { var t4 = txt(pl); if (t4 && t4.length < 60) return t4; } }
    return el.getAttribute('placeholder') || el.getAttribute('title') || '';
  }
  function signals(){
    var pw = 0, otp = 0; var ins = document.querySelectorAll('input');
    for (var i = 0; i < ins.length; i++) { var e = ins[i]; if (!vis(e)) continue; var t = (e.type || 'text').toLowerCase(); if (t === 'password') pw++;
      var ac = (e.getAttribute('autocomplete') || '').toLowerCase(); var ml = parseInt(e.getAttribute('maxlength') || '0', 10); var im = (e.getAttribute('inputmode') || '').toLowerCase();
      if (ac === 'one-time-code' || (ml === 1 && (im === 'numeric' || t === 'tel' || t === 'number'))) otp++; }
    var cf = 0; var frs = document.querySelectorAll('iframe'); for (var j = 0; j < frs.length; j++) { var src = frs[j].getAttribute('src') || ''; if (/recaptcha|hcaptcha|challenges\\.cloudflare|arkoselabs|funcaptcha|geetest/i.test(src) && vis(frs[j])) cf++; }
    return { passwordFields: pw, otpFields: otp, captchaFrames: cf, url: location.href, title: document.title };
  }
`;
var FORM_FIELDS_SCRIPT = `(function(){
  ${PAGE_HELPERS}
  var SUBMIT_RE = /log ?in|sign ?in|sign ?up|register|continue|next|submit|create (an )?account|get started|send|verify|confirm|search|go$/i;
  var forms = []; var fl = document.querySelectorAll('form'); var formIndex = new Map();
  function submitsIn(root, formEl){ var out = []; var bs = root.querySelectorAll('button, input[type="submit"], input[type="button"], [role="button"]');
    for (var i = 0; i < bs.length && out.length < 6; i++) { var b = bs[i]; if (!vis(b)) continue; var t = (b.tagName === 'INPUT') ? (b.value || '') : txt(b); var ty = (b.getAttribute('type') || '').toLowerCase();
      var isSubmit = ty === 'submit' || (b.tagName === 'BUTTON' && !ty) || (formEl && b.form === formEl && ty !== 'button') || SUBMIT_RE.test(t);
      if (!isSubmit) continue; out.push({ selector: sel(b), text: t.slice(0, 40), rect: rect(b) }); }
    return out; }
  for (var f = 0; f < fl.length; f++) { formIndex.set(fl[f], f); forms.push({ i: f, selector: sel(fl[f]), action: fl[f].getAttribute('action') || '', method: (fl[f].getAttribute('method') || 'get').toLowerCase(), submit: submitsIn(fl[f], fl[f]) }); }
  var fields = []; var els = document.querySelectorAll('input, select, textarea, [contenteditable="true"], [contenteditable=""], [role="radio"], [role="checkbox"], [role="switch"], [role="combobox"], [role="slider"]');
  for (var i = 0; i < els.length && fields.length < 80; i++) { var el = els[i]; var tag = el.tagName.toLowerCase(); var type = tag === 'input' ? (el.type || 'text').toLowerCase() : (tag === 'select' ? 'select' : (tag === 'textarea' ? 'textarea' : 'contenteditable'));
    if (type === 'hidden') continue;
    // 2026-11-02 (A/B: cars.com loan-term radios): styled radios/checkboxes hide the real <input> behind a visible label \u2014 keep the input
    // when its label shows, and point at the label (where a click lands).
    var viaLabel = null;
    if (!vis(el)) {
      if ((type === 'radio' || type === 'checkbox') && tag === 'input') {
        var lab = null; try { if (el.id) lab = document.querySelector('label[for="' + CSS.escape(el.id) + '"]'); } catch (e) {}
        if (!lab) lab = el.closest('label');
        if (lab && vis(lab)) viaLabel = lab; else continue;
      } else continue;
    }
    if (tag !== 'input' && tag !== 'select' && tag !== 'textarea' && el.getAttribute('role') && el.getAttribute('contenteditable') === null) { type = el.getAttribute('role'); }
    var fe = el.closest('form'); var fi = fe && formIndex.has(fe) ? formIndex.get(fe) : -1;
    var info = { i: fields.length, form: fi, tag: tag, type: type, name: el.getAttribute('name') || '', id: el.id || '', label: labelFor(el).slice(0, 80), placeholder: (el.getAttribute('placeholder') || '').slice(0, 80), autocomplete: (el.getAttribute('autocomplete') || '').toLowerCase(), required: !!(el.required || el.getAttribute('aria-required') === 'true'), hasValue: !!(el.value && String(el.value).length) || (type === 'contenteditable' && txt(el).length > 0), disabled: !!el.disabled, rect: rect(el), selector: sel(el) };
    var ml = el.getAttribute('maxlength'); if (ml) info.maxlength = parseInt(ml, 10); var pt = el.getAttribute('pattern'); if (pt) info.pattern = pt.slice(0, 80); var im = el.getAttribute('inputmode'); if (im) info.inputmode = im;
    if (type === 'radio' || type === 'checkbox' || type === 'switch') { info.checked = tag === 'input' ? !!el.checked : el.getAttribute('aria-checked') === 'true'; if (tag === 'input' && el.value && el.value !== 'on') info.value = String(el.value).slice(0, 60); }
    if (tag !== 'input' && tag !== 'select' && tag !== 'textarea') info.label = (el.getAttribute('aria-label') || txt(el) || info.label).slice(0, 80);   // an ARIA widget names itself (labelFor borrowed a neighbour's label)
    if (type === 'radio' || type === 'checkbox') {   // the group heading: fieldset legend / radiogroup label ("Loan term")
      var grp = el.closest('fieldset, [role="radiogroup"], [role="group"]'); var gt = '';
      if (grp) { var lg = grp.tagName === 'FIELDSET' ? grp.querySelector('legend') : null; gt = lg ? txt(lg) : (grp.getAttribute('aria-label') || ''); if (!gt && grp.getAttribute('aria-labelledby')) { var ge = document.getElementById(grp.getAttribute('aria-labelledby').split(/\\s+/)[0]); gt = ge ? txt(ge) : ''; } }
      if (gt) info.group = gt.slice(0, 80);
    }
    if (viaLabel) { info.label = info.label || txt(viaLabel).slice(0, 80); info.styled = true; info.clickSelector = sel(viaLabel); info.rect = rect(viaLabel); }
    if (tag === 'select') { info.options = []; for (var o = 0; o < el.options.length && o < 25; o++) info.options.push({ value: el.options[o].value, text: txt(el.options[o]).slice(0, 40) }); }
    fields.push(info); }
  var pageSubmits = fields.some(function(x){ return x.form === -1; }) ? submitsIn(document, null) : [];
  if (pageSubmits.length) forms.push({ i: -1, selector: 'body', action: '', method: '', submit: pageSubmits });
  return { forms: forms, fields: fields, signals: signals() };
})()`;
var AFTER_SUBMIT_SCRIPT = `(function(){
  ${PAGE_HELPERS}
  var validation = []; var seen = new Set();
  var ins = document.querySelectorAll('input, select, textarea');
  for (var i = 0; i < ins.length && validation.length < 8; i++) { var e = ins[i]; if (!vis(e)) continue; var msg = '';
    try { if (e.willValidate && !e.checkValidity()) msg = e.validationMessage || 'invalid'; } catch (x) {}
    if (!msg && e.getAttribute('aria-invalid') === 'true') { var d = e.getAttribute('aria-describedby'); var de = d ? document.getElementById(d.split(/\\s+/)[0]) : null; msg = de ? txt(de) : 'aria-invalid'; }
    if (msg) { validation.push({ field: labelFor(e).slice(0, 60) || e.getAttribute('name') || sel(e), message: msg.slice(0, 160) }); } }
  var alerts = []; var cands = document.querySelectorAll('[role="alert"], [aria-live="assertive"], [aria-live="polite"], .error, .errors, .alert, .alert-danger, .alert-error, .invalid-feedback, .help-block, .form-error, .field-error, .error-message, .flash, .notice, [class*="error"], [class*="Error"], [id*="error"]');
  for (var j = 0; j < cands.length && alerts.length < 6; j++) { var c = cands[j]; if (!vis(c)) continue; var t = txt(c); if (!t || t.length > 240 || seen.has(t)) continue; if (c.querySelector('input,select,textarea,form')) continue; seen.add(t); alerts.push(t); }
  return { url: location.href, title: document.title, validation: validation, alerts: alerts, signals: signals() };
})()`;
function norm(s) {
  return (s || "").toLowerCase().replace(/[*:：]+$/, "").replace(/[^a-z0-9@._ -]+/g, " ").replace(/\s+/g, " ").trim();
}
function matchField(fields, spec) {
  const want = { name: norm(spec.name), label: norm(spec.label), placeholder: norm(spec.placeholder), ac: norm(spec.autocomplete), type: norm(spec.type) };
  if (want.label && spec.value !== void 0) {
    const v = norm(String(spec.value));
    const inGroup = fields.filter((f) => f.type === "radio" && !f.disabled && f.group && (norm(f.group) === want.label || norm(f.group).includes(want.label)));
    const pick = inGroup.find((f) => norm(f.value) === v) || inGroup.find((f) => norm(f.label) === v) || inGroup.find((f) => v && (norm(f.label).startsWith(v + " ") || norm(f.label).includes(v)));
    if (pick) return { field: pick, score: 12, ambiguous: false, alternatives: inGroup.filter((f) => f !== pick).slice(0, 5).map((f) => f.label || f.value || f.selector) };
  }
  const scored = fields.filter((f) => !f.disabled && f.type !== "submit" && f.type !== "button" && f.type !== "image" && f.type !== "reset").map((f) => {
    let s = 0;
    const fname = norm(f.name), fid = norm(f.id), flabel = norm(f.label), fph = norm(f.placeholder), fac = norm(f.autocomplete), ftype = norm(f.type);
    if (want.name) {
      if (fname === want.name || fid === want.name) s += 10;
      else if (fname.includes(want.name) || fid.includes(want.name)) s += 6;
      else if (flabel === want.name) s += 6;
      else if (flabel.includes(want.name) || fph.includes(want.name) || fac.includes(want.name)) s += 4;
    }
    if (want.ac) {
      if (fac === want.ac) s += 9;
      else if (fac.includes(want.ac)) s += 5;
    }
    if (want.label) {
      if (flabel === want.label) s += 8;
      else if (flabel.includes(want.label) || want.label.includes(flabel) && flabel.length > 2) s += 5;
      else if (fph.includes(want.label) || fname.includes(want.label.replace(/ /g, ""))) s += 3;
    }
    if (want.placeholder) {
      if (fph === want.placeholder) s += 6;
      else if (fph.includes(want.placeholder)) s += 3;
    }
    if (want.type) {
      if (ftype === want.type) s += 3;
      else if (want.type === "text" && (ftype === "email" || ftype === "tel" || ftype === "search")) s += 1;
      else if (want.type === "password" || want.type === "email" || want.type === "checkbox" || want.type === "select") s -= 4;
    }
    return { f, s };
  }).sort((a, b) => b.s - a.s);
  if (!scored.length || scored[0].s < 3) return { field: null, score: scored[0]?.s || 0, ambiguous: false, alternatives: fields.slice(0, 6).map((f) => f.label || f.name || f.placeholder || f.selector) };
  const ambiguous = scored.length > 1 && scored[1].s === scored[0].s;
  return { field: scored[0].f, score: scored[0].s, ambiguous, alternatives: scored.slice(1, 4).filter((x) => x.s >= 3).map((x) => x.f.label || x.f.name || x.f.selector) };
}
function dominantForm(indices) {
  const counts = /* @__PURE__ */ new Map();
  for (const i of indices) counts.set(i, (counts.get(i) || 0) + 1);
  let best = -1, n = -1;
  for (const [k, v] of counts) if (v > n || v === n && k >= 0 && best < 0) {
    best = k;
    n = v;
  }
  return best;
}
function classifyOutcome(before, after, expectMet) {
  if (expectMet) return "expected";
  if (!after) return "unknown";
  if (after.url !== before.url) return "navigated";
  if (after.validation.length) return "rejected";
  if (after.signals.otpFields > 0 && before.otpFields === 0) return "otp_required";
  if (after.signals.captchaFrames > 0 && before.captchaFrames === 0) return "captcha";
  if (after.alerts.some((a) => /invalid|incorrect|wrong|required|try again|does not match|not match|failed|error|unable/i.test(a))) return "rejected";
  if (before.passwordFields > 0 && after.signals.passwordFields === 0) return "likely_success";
  return "unchanged";
}

// ../../../nexus-terminal/workers/nexus-browser/src/challenges.ts
var CMP_RULES = [
  { name: "onetrust", accept: ["#onetrust-accept-btn-handler", "#accept-recommended-btn-handler"], reject: ["#onetrust-reject-all-handler"], close: ["#onetrust-close-btn-container button", ".onetrust-close-btn-handler"] },
  { name: "cookiebot", accept: ["#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll", "#CybotCookiebotDialogBodyButtonAccept"], reject: ["#CybotCookiebotDialogBodyButtonDecline", "#CybotCookiebotDialogBodyLevelButtonLevelOptinDeclineAll"], close: [] },
  { name: "quantcast", accept: ['.qc-cmp2-summary-buttons button[mode="primary"]', "button.qc-cmp2-accept-all"], reject: ['.qc-cmp2-summary-buttons button[mode="secondary"]'], close: [] },
  { name: "didomi", accept: ["#didomi-notice-agree-button"], reject: ["#didomi-notice-disagree-button", ".didomi-continue-without-agreeing"], close: [] },
  { name: "usercentrics", accept: ['button[data-testid="uc-accept-all-button"]'], reject: ['button[data-testid="uc-deny-all-button"]'], close: ['button[data-testid="uc-close-button"]'] },
  { name: "trustarc", accept: ["#truste-consent-button"], reject: ["#truste-consent-required"], close: ["#truste-consent-close"] },
  { name: "osano", accept: [".osano-cm-accept-all", ".osano-cm-button--type_accept"], reject: [".osano-cm-denyAll", ".osano-cm-button--type_denyAll"], close: [".osano-cm-dialog__close"] },
  { name: "cookieyes", accept: [".cky-btn-accept"], reject: [".cky-btn-reject"], close: [".cky-btn-close"] },
  { name: "iubenda", accept: [".iubenda-cs-accept-btn"], reject: [".iubenda-cs-reject-btn"], close: [".iubenda-cs-close-btn"] },
  { name: "klaro", accept: [".cm-btn-accept-all", ".cn-ok .cm-btn-success"], reject: [".cm-btn-decline", ".cn-decline"], close: [] },
  { name: "complianz", accept: [".cmplz-accept"], reject: [".cmplz-deny"], close: [".cmplz-close"] },
  { name: "cookieconsent", accept: [".cc-btn.cc-allow", ".cc-btn.cc-dismiss", "a.cc-btn.cc-allow"], reject: [".cc-btn.cc-deny"], close: [".cc-close"] },
  { name: "funding-choices", accept: [".fc-cta-consent", "button.fc-cta-consent"], reject: [".fc-cta-do-not-consent"], close: [] },
  { name: "google", accept: ["#L2AGLb", 'button[aria-label="Accept all"]', 'button[aria-label="Accept the use of cookies and other data for the purposes described"]'], reject: ["#W0wltc", 'button[aria-label="Reject all"]'], close: [] },
  { name: "sourcepoint", accept: ['button[title="Accept"]', 'button[title="Accept all"]', 'button[title="Agree"]', 'button[title="Yes, I\u2019m happy"]'], reject: ['button[title="Reject all"]', 'button[title="Reject"]', 'button[title="Do not sell or share my personal information"]'], close: [] },
  { name: "shopify", accept: ["#shopify-pc__banner__btn-accept"], reject: ["#shopify-pc__banner__btn-decline"], close: [] },
  { name: "borlabs", accept: ["a[data-cookie-accept-all]", "._brlbs-btn-accept-all"], reject: ["a[data-cookie-refuse]", "._brlbs-btn-refuse"], close: [] },
  { name: "civic", accept: ["#ccc-recommended-settings", "#ccc-accept-settings"], reject: ["#ccc-reject-settings"], close: ["#ccc-close"] },
  { name: "axeptio", accept: ["#axeptio_btn_acceptAll"], reject: ["#axeptio_btn_dismiss"], close: [] },
  { name: "tarteaucitron", accept: ["#tarteaucitronPersonalize2", ".tarteaucitronAllow"], reject: ["#tarteaucitronAllDenied2", ".tarteaucitronDeny"], close: ["#tarteaucitronClosePanel"] }
];
var ACCEPT_RE = /^(accept( all)?( cookies)?( & close)?|accept (and|&) continue|consent (and|&) continue|agree (and|&) (close|continue|proceed)|agree( and (close|continue|proceed))?|i (agree|accept|understand|consent)|allow( all)?( cookies)?|got it|ok(ay)?|yes(,? i('m| am) happy)?|continue|consent|enable all|save and (close|exit)|understood|that's ok|fine by me|(alle |alles )?akzeptieren|(allen? )?zustimmen( und weiter)?|akzeptieren und weiter|alle annehmen|einverstanden|verstanden|(tout )?accepter( et continuer| et fermer)?|j'accepte|d'accord|(aceptar|acepto)( todo| todas)?|(accetta|accetto)( tutto| tutti)?|(alles |alle cookies )?accepteren|akkoord|(aceitar|aceito)( tudo| todos)?|(zaakceptuj|akceptuj[eę]?)( wszystk(o|ie))?|zgadzam się|(godkänn|acceptera)( alla)?|(accepter|tillad)( alle)?|(godta|aksepter)( alle)?|hyväksy( kaikki)?)\.?!?$/i;
var REJECT_RE = /^(reject( all)?( cookies)?|decline( all)?|refuse( all)?|deny( all)?|disagree|(only|use) (essential|necessary|required)( cookies)?|(essential|necessary) (cookies )?only|continue without (agreeing|accepting)|do not (accept|consent|sell)|no,? thanks|no thank you|not now|maybe later|skip( for now)?|(alle )?ablehnen|nicht zustimmen|nur (notwendige|erforderliche|essenzielle)( cookies)?( akzeptieren)?|ohne (zustimmung|einwilligung) weiter|weiter ohne (zustimmung|einwilligung)|(tout )?refuser|continuer sans accepter|rejeter|uniquement (les )?(cookies )?(essentiels|nécessaires)|(rechazar|rechazo)( todo| todas)?|solo (las )?(cookies )?(esenciales|necesarias)|continuar sin aceptar|(rifiuta|rifiuto)( tutto| tutti)?|solo (i )?(cookie )?(necessari|essenziali)|(alles |alle cookies )?weigeren|alleen (noodzakelijke|essentiële)( cookies)?|(rejeitar|recusar)( tudo| todos)?|(odrzuć|odrzucam)( wszystk(o|ie))?|(neka|avvisa)( alla)?|(afvis|afslå)( alle)?|(avvis|avslå)( alle)?|hylkää( kaikki)?)\.?!?$/i;
var CLOSE_RE = /^(×|x|✕|✖|close|dismiss|no thanks|not now|maybe later|skip|later|got it|schließen|schliessen|fermer|cerrar|chiudi|sluiten|fechar|zamknij|stäng|luk|lukk|sulje)\.?$/i;
var MANAGE_RE = /^(manage( (cookies|settings|preferences|choices|options))?|(cookie )?settings|preferences|customi[sz]e|more options|learn more|options|einstellungen|anpassen|mehr (optionen|erfahren)|(gérer|personnaliser)( (les|mes) (cookies|choix|préférences))?|paramètres|(gestionar|configurar|personalizar)( cookies)?|configuración|(gestisci|personalizza)( (i )?cookie)?|impostazioni|(beheer|instellingen|aanpassen)|(gerir|personalizar|definições)|(zarządzaj|ustawienia)|(hantera|inställningar)|(administrer|indstillinger|innstillinger)|(hallitse|asetukset))\.?$/i;
var CONSENT_TEXT_RE = /cookie|consent|privacy|gdpr|ccpa|tracking|outdated browser|update your browser|unsupported browser|browser is not supported|personali[sz]ed|we use cookies|your (privacy|choices)|data protection|subscribe|newsletter|sign up|notification|accept|agree|datenschutz|zustimmung|einwilligung|akzeptieren|confidentialité|consentement|accepter|privacidad|consentimiento|aceptar|riservatezza|accetta|privacyverklaring|accepteren|privacidade|prywatno|zgod|integritet|personuppgifter|personoplysninger|personvern|tietosuoja/i;
function policyOrder(policy, fallbackToAccept = true) {
  if (policy === "accept") return ["accept", "close"];
  if (policy === "close") return fallbackToAccept ? ["close", "reject", "accept"] : ["close", "reject"];
  return fallbackToAccept ? ["reject", "close", "accept"] : ["reject", "close"];
}
function buildOverlayScript(policy, fallbackToAccept, includePromos = true) {
  const order = JSON.stringify(policyOrder(policy, fallbackToAccept));
  const promos = includePromos ? "true" : "false";
  const cmps = JSON.stringify(CMP_RULES);
  return `(function(){
    var ORDER = ${order}; var CMPS = ${cmps}; var PROMOS = ${promos};
    var ACCEPT = ${ACCEPT_RE.toString()}, REJECT = ${REJECT_RE.toString()}, CLOSE = ${CLOSE_RE.toString()}, MANAGE = ${MANAGE_RE.toString()}, CONSENT = ${CONSENT_TEXT_RE.toString()};
    function vis(el){ try { var r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2) return false; var cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none' || parseFloat(cs.opacity || '1') < 0.05) return false; return r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth; } catch (e) { return false; } }
    function rect(el){ var r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) }; }
    function txt(el){ return ((el.innerText || el.textContent || el.value || el.getAttribute('aria-label') || el.getAttribute('title') || '') + '').replace(/\\s+/g,' ').trim(); }
    function bucket(t){ if (!t || t.length > 60) return null; if (REJECT.test(t)) return 'reject'; if (ACCEPT.test(t)) return 'accept'; if (CLOSE.test(t)) return 'close'; if (MANAGE.test(t)) return 'manage'; return null; }
    function sel(el){ if (el.id) return '#' + CSS.escape(el.id); var p = el.tagName.toLowerCase(); if (el.className && typeof el.className === 'string') p += '.' + el.className.trim().split(/\\s+/).slice(0,2).map(function(c){return CSS.escape(c);}).join('.'); return p; }
    function q(root, s){ try { var list = root.querySelectorAll(s); for (var i=0;i<list.length;i++){ if (vis(list[i])) return list[i]; } } catch (e) {} return null; }
    function allRoots(){ var roots=[document]; var walk=function(n){ try { if (n.shadowRoot) roots.push(n.shadowRoot); var kids = n.children || []; for (var i=0;i<kids.length;i++) walk(kids[i]); } catch(e){} }; try { walk(document.documentElement); } catch(e){} return roots; }
    var roots = allRoots();
    // 1. known consent managers
    for (var c = 0; c < CMPS.length; c++) { var cmp = CMPS[c];
      for (var o = 0; o < ORDER.length; o++) { var list = cmp[ORDER[o]] || [];
        for (var s = 0; s < list.length; s++) { for (var r = 0; r < roots.length; r++) { var el = q(roots[r], list[s]);
          if (el) { var rc = rect(el); var t = txt(el); try { el.click(); } catch (e) {} return { clicked: { cmp: cmp.name, bucket: ORDER[o], selector: list[s], text: t.slice(0,80), rect: rc }, candidates: [], overlays: 1 }; } } } } }
    // 2. generic overlays: dialogs + fixed/sticky layers that look like consent / modal banners
    var overlays = []; var seen = new Set();
    var consider = function(el){ if (seen.has(el) || !vis(el)) return; var cs = getComputedStyle(el); var r = el.getBoundingClientRect();
      var fixed = cs.position === 'fixed' || cs.position === 'sticky'; var dialog = el.getAttribute('role') === 'dialog' || el.getAttribute('role') === 'alertdialog' || el.getAttribute('aria-modal') === 'true' || el.tagName === 'DIALOG';
      var area = (r.width * r.height) / (innerWidth * innerHeight); var edge = fixed && r.width > innerWidth * 0.6 && (r.top < 10 || r.bottom > innerHeight - 10);
      if (!(dialog || (fixed && (area > 0.08 || edge)))) return; var t = txt(el); if (!t || !CONSENT.test(t)) return; seen.add(el); overlays.push(el); };
    for (var r2 = 0; r2 < roots.length; r2++) { var cand = roots[r2].querySelectorAll('[role="dialog"],[role="alertdialog"],[aria-modal="true"],dialog,div,section,aside,form'); var n = 0;
      for (var i2 = 0; i2 < cand.length && n < 4000; i2++, n++) consider(cand[i2]);
      // custom elements (2026-11-02, bbb.org <iabbb-cookies-message>): a banner can be its own tag \u2014 the tag list above never saw it
      var all2 = roots[r2].querySelectorAll('*'); var n3 = 0;
      for (var i5 = 0; i5 < all2.length && n3 < 400; i5++) { if (all2[i5].tagName.indexOf('-') > 0) { n3++; consider(all2[i5]); } } }
    // 2b. a CMP hosted in its own iframe (Sourcepoint, Didomi, Quantcast "message" frames): the whole document IS the banner \u2014
    //     nothing inside is fixed or a dialog, so treat the body as the overlay when it reads like consent and holds choice buttons
    if (!overlays.length && window !== window.top && document.body) { var bt0 = txt(document.body); if (bt0 && bt0.length < 6000 && CONSENT.test(bt0) && document.body.querySelector('button,[role="button"],input[type="button"],input[type="submit"]')) { seen.add(document.body); overlays.push(document.body); } }
    var candidates = [];
    overlays.forEach(function(ov){ var btns = ov.querySelectorAll('button,[role="button"],a,input[type="button"],input[type="submit"]');
      for (var b = 0; b < btns.length; b++) { var bt = btns[b]; if (!vis(bt)) continue; var t2 = txt(bt); var al0 = (bt.getAttribute('aria-label') || '') + ' ' + (bt.getAttribute('title') || '') + ' ' + (bt.id || '') + ' ' + ((bt.className || '') + ''); var bk = bucket(t2) || (CLOSE.test(bt.getAttribute('aria-label') || '') || /(^|[\\s_-])(close|dismiss|schlie\xDFen|fermer|cerrar|chiudi|sluiten)([\\s_-]|$)/i.test(al0) ? 'close' : null);
        if (!t2 && !bk) continue; candidates.push({ el: bt, text: t2.slice(0,80), bucket: bk, selector: sel(bt), rect: rect(bt) }); } });
    for (var o2 = 0; o2 < ORDER.length; o2++) { for (var k = 0; k < candidates.length; k++) { if (candidates[k].bucket === ORDER[o2]) { var cl = candidates[k]; try { cl.el.click(); } catch (e) {}
      return { clicked: { cmp: 'heuristic', bucket: cl.bucket, selector: cl.selector, text: cl.text, rect: cl.rect }, candidates: candidates.filter(function(x){return x!==cl;}).slice(0,12).map(function(x){ return { text: x.text, bucket: x.bucket, selector: x.selector, rect: x.rect }; }), overlays: overlays.length }; } } }
    // 3. promo / notification bars (no consent words): a fixed or sticky edge bar \u2264 15% of the viewport with a CLOSE control
    if (PROMOS) { var bars = []; for (var r3 = 0; r3 < roots.length; r3++) { var cand2 = roots[r3].querySelectorAll('div,section,aside,header,nav'); var n2 = 0;
        for (var i3 = 0; i3 < cand2.length && n2 < 3000; i3++, n2++) { var el2 = cand2[i3]; if (seen.has(el2) || !vis(el2)) continue; var cs2 = getComputedStyle(el2); if (cs2.position !== 'fixed' && cs2.position !== 'sticky') continue;
          var r4 = el2.getBoundingClientRect(); if (r4.width < innerWidth * 0.4 || r4.height > innerHeight * 0.15) continue; if (r4.top > 80 && r4.bottom < innerHeight - 80) continue;   // floating bars sit a few px off the edge (BBC's subscribe bar)
          var btns2 = el2.querySelectorAll('button,[role="button"],a'); for (var b2 = 0; b2 < btns2.length; b2++) { var bt2 = btns2[b2]; if (!vis(bt2)) continue; var t3 = txt(bt2); var al = (bt2.getAttribute('aria-label') || '') + ' ' + (bt2.getAttribute('title') || '');
            if (CLOSE.test(t3) || /close|dismiss|schlie\xDFen|fermer|cerrar|chiudi|sluiten/i.test(al)) { try { bt2.click(); } catch (e) {} return { clicked: { cmp: 'promo-bar', bucket: 'close', selector: sel(bt2), text: (t3 || al).trim().slice(0,80), rect: rect(bt2) }, candidates: [], overlays: overlays.length + 1 }; } } } } }
    // 4. non-consent pop-up modals (newsletter / offer / survey / notification prompts \u2014 parkers.co.uk #newsletterSignup had no close
    //    button, Escape did nothing, and it swallowed clicks): a fixed or dialog layer covering \u2265 20% of the viewport whose text reads like a
    //    prompt. Click its close control; with none, HIDE it and its backdrop and say so (bucket 'hidden').
    if (PROMOS) { var PROMPT = /newsletter|subscribe|sign ?up|e-?mail|offer|discount|% ?off|deal|coupon|notification|survey|feedback|download (our|the) app|join/i;
      for (var r6 = 0; r6 < roots.length; r6++) { var cand3 = roots[r6].querySelectorAll('[role="dialog"],[aria-modal="true"],dialog,div,section,aside,form'); var n6 = 0;
        var STRONG = /cookie|consent|privacy|gdpr|ccpa|tracking|personali[sz]|datenschutz|confidentialit|privacidad/i;   // real consent \u2192 the agent chooses
        for (var i6 = 0; i6 < cand3.length && n6 < 3000; i6++, n6++) { var m = cand3[i6]; if (!vis(m)) continue; var cs6 = getComputedStyle(m); var rr = m.getBoundingClientRect();
          var isDlg = m.getAttribute('role') === 'dialog' || m.getAttribute('aria-modal') === 'true' || m.tagName === 'DIALOG';
          if (!(isDlg || cs6.position === 'fixed')) continue; if ((rr.width * rr.height) / (innerWidth * innerHeight) < 0.2) continue;
          var t6 = txt(m); if (!t6 || t6.length > 1500 || !PROMPT.test(t6) || STRONG.test(t6)) continue;
          var cbs = m.querySelectorAll('button,[role="button"],a,[aria-label]');
          for (var b6 = 0; b6 < cbs.length; b6++) { var cb = cbs[b6]; if (!vis(cb)) continue; var ct = txt(cb); var cal = (cb.getAttribute('aria-label') || '') + ' ' + (cb.getAttribute('title') || '') + ' ' + (typeof cb.className === 'string' ? cb.className : '');
            if (CLOSE.test(ct) || /^(no,? thanks|not now|maybe later|skip)/i.test(ct) || /close|dismiss/i.test(cal)) { try { cb.click(); } catch (e) {} return { clicked: { cmp: 'prompt-modal', bucket: 'close', selector: sel(cb), text: ct.slice(0,80), rect: rect(cb) }, candidates: [], overlays: 1 }; } }
          var hid = rect(m); m.style.setProperty('display', 'none', 'important');
          // a full-viewport backdrop (no text) that stayed behind
          var ds = document.querySelectorAll('div'); for (var d = 0; d < ds.length && d < 3000; d++) { var bk2 = ds[d]; if (!vis(bk2)) continue; var bcs = getComputedStyle(bk2); var br = bk2.getBoundingClientRect();
            if (bcs.position === 'fixed' && br.width >= innerWidth * 0.95 && br.height >= innerHeight * 0.95 && !txt(bk2)) bk2.style.setProperty('display', 'none', 'important'); }
          try { document.body.style.overflow = ''; document.documentElement.style.overflow = ''; } catch (e) {}
          return { clicked: { cmp: 'prompt-modal', bucket: 'hidden', selector: sel(m), text: t6.slice(0,80), rect: hid, note: 'No close control \u2014 the layer was hidden (display:none). Reload the page to bring it back.' }, candidates: [], overlays: 1 }; } } }
    return { clicked: null, candidates: candidates.slice(0,12).map(function(x){ return { text: x.text, bucket: x.bucket, selector: x.selector, rect: x.rect }; }), overlays: overlays.length };
  })()`;
}
var CAPTCHA_CLASSES = [
  "bicycle",
  "bus",
  "car",
  "crosswalk",
  "fire hydrant",
  "motorcycle",
  "traffic light",
  "boat",
  "bridge",
  "chimney",
  "palm tree",
  "stairs",
  "parking meter",
  "taxi",
  "tractor",
  "mountain",
  "airplane",
  "truck",
  "train",
  "bird",
  "cat",
  "dog",
  "horse",
  "elephant",
  "bear",
  "giraffe",
  "tree",
  "flower",
  "house",
  "umbrella",
  "sailboat",
  "bed",
  "couch",
  "chair",
  "table",
  "lamp",
  "laptop",
  "phone",
  "clock",
  "book",
  "cup",
  "bottle",
  "apple",
  "banana",
  "pizza",
  "cake",
  "seaplane",
  "helicopter",
  "ship",
  "train station",
  "other"
];
function splitGrid(grid, n) {
  const tiles = [];
  const tw = grid.width / n, th = grid.height / n;
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) tiles.push({ x: grid.x + c * tw, y: grid.y + r * th, width: tw, height: th });
  return tiles;
}
function boxToRect(box, region) {
  if (!box || typeof box.left !== "number") return null;
  return { x: region.x + box.left * region.width, y: region.y + box.top * region.height, width: (box.right - box.left) * region.width, height: (box.bottom - box.top) * region.height };
}
function centre(r) {
  return [Math.round(r.x + r.width / 2), Math.round(r.y + r.height / 2)];
}
function jevScale(r, minSide = 280, maxSide = 1568) {
  const short = Math.max(1, Math.min(r.width, r.height)), long = Math.max(r.width, r.height);
  let s = short >= minSide ? 1 : Math.ceil(minSide / short);
  if (long * s > maxSide) s = Math.max(1, Math.floor(maxSide / long));
  return s;
}
function instructionMenuQuestions(imgRef) {
  return {
    target: { type: "choice", instructions: `The CAPTCHA widget in \`${imgRef}\` shows an instruction (e.g. "Select all images with a bus"). Which object does it ask for? Choose "other" if it is not in the list.`, criteria: Object.fromEntries(CAPTCHA_CLASSES.map((c) => [c, null])) },
    grid: { type: "choice", instructions: `How are the images laid out in \`${imgRef}\`?`, criteria: { "3x3 grid": null, "4x4 grid": null, "one image to click in": null, "no image grid (text or checkbox)": null } },
    mode: { type: "choice", instructions: `What does the instruction in \`${imgRef}\` ask?`, criteria: { "select all matching images": null, "click until none are left (images replace themselves)": null, "select all squares of one large image": null, "click on a specific point or object": null, "type the characters": null, "other": null } },
    verify_present: { type: "noul", instructions: `Is there a VERIFY / NEXT / SKIP / SUBMIT button in \`${imgRef}\`?` }
  };
}
function tileNoulQuestions(n, cls) {
  return Object.fromEntries(Array.from({ length: n }, (_, i) => [`tile_${i + 1}`, { type: "noul", instructions: `Is there a ${cls} (or part of one) in \`tile_${i + 1}\`?` }]));
}
function tilesFromBox(box, n, minFrac = 0.08) {
  if (!box || ![box.top, box.bottom, box.left, box.right].every((v) => typeof v === "number" && Number.isFinite(v))) return [];
  const t = Math.max(0, Math.min(box.top, box.bottom)), b = Math.min(1, Math.max(box.top, box.bottom));
  const l = Math.max(0, Math.min(box.left, box.right)), r = Math.min(1, Math.max(box.left, box.right));
  if (b - t <= 0 || r - l <= 0 || (b - t) * (r - l) > 0.98) return [];
  const out = [];
  const c = 1 / n;
  for (let row = 0; row < n; row++) for (let col = 0; col < n; col++) {
    const ox = Math.max(0, Math.min(r, (col + 1) * c) - Math.max(l, col * c)), oy = Math.max(0, Math.min(b, (row + 1) * c) - Math.max(t, row * c));
    if (ox * oy / (c * c) >= minFrac) out.push(row * n + col + 1);
  }
  return out;
}
function selectedTiles(answers, n, threshold = 0.5) {
  const probs = [];
  const chosen = [];
  for (let i = 1; i <= n; i++) {
    const a = answers[`tile_${i}`];
    const p = typeof a?.noul === "number" ? a.noul : typeof a?.probability === "number" ? a.probability : 0;
    probs.push(p);
    if (p >= threshold) chosen.push(i);
  }
  return { chosen, probs };
}
async function jevAsk(env, args) {
  if (!env.TYPESAFE_API_KEY) throw new Error("TYPESAFE_API_KEY is not configured on the worker");
  const t0 = Date.now();
  const resp = await fetch("https://api.typesafe.ai/v1/systemone", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${env.TYPESAFE_API_KEY}`, "TypeSafe-Danger-Zone-Images": "true" },
    body: JSON.stringify({ model: args.model || "jev-preview", state: args.state, assets: args.assets, questions: args.questions })
  });
  const text = await resp.text();
  if (!resp.ok) throw new Error(`Jev ${resp.status}: ${text.slice(0, 300)}`);
  const d = JSON.parse(text);
  return { answers: d.answers || {}, latencyMs: Date.now() - t0, model: d.model };
}
function toMercuryRequest(args) {
  const refs = Object.keys(args.assets || {});
  if (refs.length > 16) return null;
  const questions = {};
  const dropped = [];
  for (const [k, q] of Object.entries(args.questions || {})) {
    if (q && q.type === "box") {
      dropped.push(k);
      continue;
    }
    if (q && q.type === "choice" && q.criteria && typeof q.criteria === "object") {
      const crit = {};
      for (const [name, v] of Object.entries(q.criteria)) crit[name] = typeof v === "string" && refs.includes(v) ? `the image labelled ${v}` : v;
      questions[k] = { ...q, criteria: crit };
    } else questions[k] = q;
  }
  if (!Object.keys(questions).length) return null;
  const head = typeof args.state === "string" ? args.state : `Images: ${Object.keys(args.state || {}).join(", ")}`;
  const parts = [{ type: "text", text: head }];
  for (const r of refs) {
    const a = args.assets[r];
    parts.push({ type: "text", text: `${r}:` }, { type: "image_url", image_url: { url: `data:image/${a.format === "jpg" ? "jpeg" : "png"};base64,${a.data_base64}` } });
  }
  return { parts, questions, dropped };
}
var _lanePolicy = null;
async function browserMcpLaneEnabled(env) {
  if (_lanePolicy && Date.now() - _lanePolicy.at < 6e4) return _lanePolicy.enabled;
  let enabled = true;
  try {
    const resp = await fetch("https://maincloud.spacetimedb.com/v1/database/nexus-terminal/sql", {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: "SELECT policy_json FROM platform_inference_policy WHERE id = 'default'"
    });
    const d = resp.ok ? await resp.json() : null;
    const cell = d?.[0]?.rows?.[0]?.[0];
    if (typeof cell === "string") enabled = JSON.parse(cell)?.laneEnables?.browserMcp !== false;
    else if (_lanePolicy) return _lanePolicy.enabled;
    else if (env.POLICY_KV) {
      const raw = await env.POLICY_KV.get("platform_policy");
      if (raw) enabled = JSON.parse(raw)?.laneEnables?.browserMcp !== false;
    }
  } catch {
    if (_lanePolicy) return _lanePolicy.enabled;
  }
  _lanePolicy = { at: Date.now(), enabled };
  return enabled;
}
function recordDecisionTelemetry(env, ev) {
  if (!env.POLICY_KV) return;
  try {
    const now = Date.now();
    const key = `ptl:${String(10 ** 13 - now).padStart(13, "0")}:${crypto.randomUUID().slice(0, 8)}`;
    void env.POLICY_KV.put(key, JSON.stringify({ ts: now, lane: "browserMcp", tier: "n/a", ...ev }), { expirationTtl: 24 * 3600 }).catch(() => {
    });
  } catch {
  }
}
var GEMMA_DECISION_MODEL = "gemma-4-26b-a4b-it";
function gemmaPrompt(args) {
  const q = Object.entries(args.questions).map(([k, v]) => {
    const ins = String(v?.instructions || "");
    if (v?.type === "noul") return `"${k}": number 0..1 \u2014 the probability the answer is YES. Question: ${ins}`;
    if (v?.type === "choice") return `"${k}": {"choice": one of ${JSON.stringify(Object.keys(v.criteria || {}))}, "confidence": number 0..1}. Question: ${ins}`;
    if (v?.type === "box") return `"${k}": {"top","bottom","left","right"} as fractions 0..1 of the referenced image's height/width. Question: ${ins}`;
    return `"${k}": your answer. Question: ${ins}`;
  }).join("\n");
  const state = typeof args.state === "string" ? args.state : JSON.stringify(args.state);
  return `Context: ${state}
Answer every question below. Reply with ONLY one JSON object whose keys are exactly the question keys.
${q}`;
}
function parseGemmaAnswers(text, questions) {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) throw new Error(`Gemma reply had no JSON: ${text.slice(0, 160)}`);
  const raw = JSON.parse(m[0]);
  const out = {};
  for (const [k, v] of Object.entries(questions)) {
    const a = raw[k];
    if (a === void 0) continue;
    if (v?.type === "noul") {
      const p = typeof a === "number" ? a : typeof a === "boolean" ? a ? 0.95 : 0.05 : Number(a?.probability ?? a?.noul);
      if (Number.isFinite(p)) out[k] = { noul: Math.max(0, Math.min(1, p)) };
    } else if (v?.type === "choice") {
      const c = typeof a === "string" ? a : a?.choice;
      if (typeof c === "string") out[k] = { choice: c, confidence: typeof a?.confidence === "number" ? a.confidence : null };
    } else if (v?.type === "box") {
      const b = a?.box ?? a;
      if (b && ["top", "bottom", "left", "right"].every((f) => typeof b[f] === "number")) out[k] = { box: { top: b.top, bottom: b.bottom, left: b.left, right: b.right } };
    } else out[k] = a;
  }
  return out;
}
async function gemmaAsk(env, args) {
  if (!env.GOOGLE_API_KEY) throw new Error("GOOGLE_API_KEY is not configured on the worker");
  const parts = [];
  for (const [ref, a] of Object.entries(args.assets || {})) parts.push({ text: `${ref}:` }, { inline_data: { mime_type: a.format === "jpg" ? "image/jpeg" : "image/png", data: a.data_base64 } });
  parts.push({ text: gemmaPrompt(args) });
  const t0 = Date.now();
  const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMMA_DECISION_MODEL}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": env.GOOGLE_API_KEY },
    body: JSON.stringify({ contents: [{ role: "user", parts }], generationConfig: { temperature: 0 } })
  });
  const body = await resp.text();
  if (!resp.ok) throw new Error(`Gemma ${resp.status}: ${body.slice(0, 200)}`);
  const d = JSON.parse(body);
  const text = (d?.candidates?.[0]?.content?.parts || []).map((x) => x?.text || "").join("");
  return { answers: parseGemmaAnswers(text, args.questions), latencyMs: Date.now() - t0 };
}
async function decideAsk(env, args) {
  if (!await browserMcpLaneEnabled(env)) {
    recordDecisionTelemetry(env, { provider: "typesafe", model: "jev", verdict: "deny", reason: "lane browserMcp disabled by the admin inference policy" });
    throw new Error("lane_disabled: platform funding for browser-MCP decision models is disabled by the admin inference policy");
  }
  if (env.DECISION_ANON) {
    const r2 = await gemmaAsk(env, args).catch((e) => {
      recordDecisionTelemetry(env, { provider: "google", model: GEMMA_DECISION_MODEL, verdict: "allow", reason: `error: ${String(e?.message || e).slice(0, 80)}` });
      throw e;
    });
    recordDecisionTelemetry(env, { provider: "google", model: GEMMA_DECISION_MODEL, verdict: "allow" });
    return { ...r2, provider: "gemma" };
  }
  let jevErr = "TYPESAFE_API_KEY not configured";
  if (env.TYPESAFE_API_KEY) {
    try {
      const r2 = await jevAsk(env, args);
      recordDecisionTelemetry(env, { provider: "typesafe", model: "jev", verdict: "allow" });
      return { ...r2, provider: "jev" };
    } catch (e) {
      jevErr = String(e?.message || e).slice(0, 200);
    }
  }
  if (!env.INCEPTION_API_KEY) throw new Error(`${jevErr}; no Mercury fallback (INCEPTION_API_KEY not configured)`);
  const m = toMercuryRequest(args);
  if (!m) throw new Error(`${jevErr}; Mercury cannot take this request (box-only questions or > 16 images)`);
  const r = await mercuryAsk(env, { parts: m.parts, questions: m.questions });
  recordDecisionTelemetry(env, { provider: "inception", model: "mercury-decide", verdict: "allow" });
  return { ...r, provider: "mercury", fallbackReason: jevErr, dropped: m.dropped };
}
async function mercuryAsk(env, args) {
  if (!env.INCEPTION_API_KEY) throw new Error("INCEPTION_API_KEY is not configured on the worker");
  const t0 = Date.now();
  const resp = await fetch("https://api.inceptionlabs.ai/v1/decisions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${env.INCEPTION_API_KEY}` },
    body: JSON.stringify({ model: "mercury-decide", state: args.parts, questions: args.questions })
  });
  const text = await resp.text();
  if (!resp.ok) throw new Error(`Mercury ${resp.status}: ${text.slice(0, 300)}`);
  const d = JSON.parse(text);
  return { answers: d.answers || {}, latencyMs: Date.now() - t0 };
}
var TURNSTILE_LOCATE_SCRIPT = `(function(){
  function vis(e){ if (!e || typeof e.getBoundingClientRect !== 'function') return null; var r = e.getBoundingClientRect(); var cs = getComputedStyle(e);
    if (r.width < 40 || r.height < 30 || cs.visibility === 'hidden' || cs.display === 'none' || r.bottom <= 0 || r.right <= 0 || r.top >= innerHeight || r.left >= innerWidth) return null;
    return { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) }; }
  var sels = ['#cf-turnstile', '[id^="cf-turnstile"]', '.cf-turnstile', '[class*="cf-turnstile"]', '#cf-turnstile-container', '[id^="cf-chl-widget"]', 'iframe[src*="challenges.cloudflare.com"]'];
  var cands = [];
  for (var i = 0; i < sels.length; i++) { var els = document.querySelectorAll(sels[i]); for (var k = 0; k < els.length; k++) cands.push({ el: els[k], via: sels[i] }); }
  var inp = document.querySelectorAll('input[name="cf-turnstile-response"], input[name$="turnstile-response"]');
  for (var j = 0; j < inp.length; j++) if (inp[j].parentElement) cands.push({ el: inp[j].parentElement, via: 'cf-turnstile-response parent' });
  for (var c = 0; c < cands.length; c++) { var r = vis(cands[c].el); if (!r) continue;
    return { found: true, via: cands[c].via, rect: r, clickPoint: { x: r.x + Math.min(28, Math.round(r.width / 2)), y: r.y + Math.round(r.height / 2) } }; }
  return { found: false, candidates: cands.length };
})()`;
var HUMAN_CHECK_TEXT_RE = "(verify|confirm|sure|prove) (that )?you are (a )?human|are you a robot|human verification";
var CAPTCHA_FRAMES_SCRIPT = `(function(){
  var out = []; var fr = document.querySelectorAll('iframe');
  for (var i = 0; i < fr.length; i++) { var f = fr[i]; var src = f.getAttribute('src') || f.src || ''; var r = f.getBoundingClientRect(); var cs = getComputedStyle(f);
    var kind = null;
    if (/recaptcha\\/api2\\/anchor|recaptcha\\/enterprise\\/anchor/.test(src)) kind = 'recaptcha_anchor';
    else if (/recaptcha\\/api2\\/bframe|recaptcha\\/enterprise\\/bframe/.test(src)) kind = 'recaptcha_challenge';
    else if (/hcaptcha\\.com\\/captcha/.test(src) && /frame=checkbox/.test(src)) kind = 'hcaptcha_anchor';
    else if (/hcaptcha\\.com\\/captcha/.test(src)) kind = 'hcaptcha_challenge';
    else if (/challenges\\.cloudflare\\.com/.test(src)) kind = 'turnstile';
    else if (/arkoselabs|funcaptcha/.test(src)) kind = 'arkose';
    else if (/geetest/.test(src)) kind = 'geetest';
    if (!kind) continue;
    var visible = r.width > 10 && r.height > 10 && cs.visibility !== 'hidden' && cs.display !== 'none' && r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth;
    out.push({ kind: kind, src: src.slice(0, 120), rect: { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) }, visible: visible, name: f.getAttribute('name') || '', title: f.getAttribute('title') || '' });
  }
  return { frames: out, viewport: { width: innerWidth, height: innerHeight } };
})()`;
var CHALLENGE_DOM_SCRIPT = `(function(){
  function rr(e){ var r = e.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; }
  function vis(e){ if (!e) return false; var r = e.getBoundingClientRect(); var cs = getComputedStyle(e); return r.width > 2 && r.height > 2 && cs.visibility !== 'hidden' && cs.display !== 'none'; }
  var out = { found: false };
  var desc = document.querySelector('.rc-imageselect-desc-no-canonical, .rc-imageselect-desc, .rc-imageselect-instructions');
  if (desc) { out.found = true; out.vendor = 'recaptcha'; out.text = (desc.textContent || '').replace(/\\s+/g, ' ').trim(); var st = desc.querySelector('strong'); out.target = st ? (st.textContent || '').trim() : '';
    out.tiles = [].slice.call(document.querySelectorAll('td.rc-imageselect-tile')).filter(vis).map(function(td){ return { rect: rr(td), selected: /rc-imageselect-tileselected/.test(td.className), dynamic: /rc-imageselect-dynamic-selected/.test(td.className) }; });
    var tb = document.querySelector('table.rc-imageselect-table-33, table.rc-imageselect-table-44, table.rc-imageselect-table-42'); out.grid = tb ? (tb.className.match(/table-(\\d\\d)/) || [])[1] || null : null;
    out.dynamic = /none left|no more|keine mehr|plus aucun/i.test(out.text); out.oneImage = out.grid === '44';
    var v = document.querySelector('#recaptcha-verify-button'); out.verify = (v && vis(v)) ? { rect: rr(v), text: (v.textContent || '').trim() } : null;
    out.errors = [].slice.call(document.querySelectorAll('.rc-imageselect-error-select-more, .rc-imageselect-incorrect-response, .rc-imageselect-error-dynamic-more, .rc-imageselect-error-select-something')).filter(vis).map(function(e){ return (e.textContent || '').trim(); });
    return out; }
  var pt = document.querySelector('.prompt-text'); var hs = document.querySelectorAll('.task-image, .task-grid .task');
  if (pt || hs.length) { out.found = true; out.vendor = 'hcaptcha'; out.text = pt ? (pt.textContent || '').replace(/\\s+/g, ' ').trim() : '';
    var cv = [].slice.call(document.querySelectorAll('canvas')).filter(function(c){ var r = c.getBoundingClientRect(); return r.width >= 200 && r.height >= 200; })[0]; out.canvas = cv ? rr(cv) : null;
    var m = out.text.match(/containing (?:a |an |the )?([^.]+?)(?:\\.|$)|with (?:a |an |the )?([^.]+?)(?:\\.|$)/i); out.target = m ? (m[1] || m[2] || '').trim() : '';
    out.tiles = [].slice.call(hs).filter(vis).map(function(t){ return { rect: rr(t), selected: /selected/.test(t.className) || t.getAttribute('aria-pressed') === 'true', dynamic: false }; });
    out.grid = out.tiles.length === 9 ? '33' : (out.tiles.length === 16 ? '44' : String(out.tiles.length));
    var b = document.querySelector('.button-submit'); out.verify = (b && vis(b)) ? { rect: rr(b), text: (b.textContent || '').trim() } : null; out.errors = []; out.dynamic = false; out.oneImage = false;
    return out; }
  return out;
})()`;
var ANCHOR_CHECKED_SCRIPT = `(function(){ var a = document.querySelector('#recaptcha-anchor, #checkbox'); return a ? a.getAttribute('aria-checked') === 'true' : null; })()`;
function offsetRect(r, frame) {
  return { x: frame.x + r.x, y: frame.y + r.y, width: r.width, height: r.height };
}
function singularTarget(t) {
  const s = (t || "").trim().toLowerCase().replace(/^(a|an|the|all|every)\s+/, "").replace(/[.!]+$/, "");
  if (!s) return s;
  const known = new Set(CAPTCHA_CLASSES);
  if (known.has(s)) return s;
  for (const c of [s.replace(/(ses|xes|shes|ches)$/, (m) => m.slice(0, -2)), s.replace(/ies$/, "y"), s.replace(/s$/, "")]) if (c !== s && known.has(c)) return c;
  if (/(us|ss|is)$/.test(s)) return s;
  if (/(ses|xes|shes|ches)$/.test(s)) return s.slice(0, -2);
  if (/ies$/.test(s)) return s.slice(0, -3) + "y";
  if (/s$/.test(s)) return s.slice(0, -1);
  return s;
}
function frameUrlPattern(kind) {
  switch (kind) {
    case "recaptcha_anchor":
      return /recaptcha\/(api2|enterprise)\/anchor/;
    case "recaptcha_challenge":
      return /recaptcha\/(api2|enterprise)\/bframe/;
    case "hcaptcha_anchor":
      return /hcaptcha\.com\/captcha/;
    case "hcaptcha_challenge":
      return /hcaptcha\.com\/captcha/;
    default:
      return /$^/;
  }
}
function anchorCheckboxPoint(anchor) {
  return [Math.round(anchor.rect.x + Math.min(30, anchor.rect.width / 2)), Math.round(anchor.rect.y + anchor.rect.height / 2)];
}
function hcaptchaTaskKind(prompt) {
  const t = (prompt || "").toLowerCase();
  if (/click (each|every|all) (image|picture|photo)s? (containing|with|that (contain|show)s?)/.test(t) || /select (all|every) (image|picture)s? (containing|with)/.test(t)) return "click_each";
  if (/match the example|count shown|same number/.test(t)) return "match_count";
  if (/drag|move the|place the|puzzle/.test(t)) return "drag";
  if (/different|odd one|does not (match|belong)/.test(t)) return "odd_one";
  return "other";
}
function plausibleGrid(box, canvas) {
  if (box) {
    const ar = box.width / Math.max(1, box.height);
    if (box.width >= canvas.width * 0.35 && box.height >= canvas.height * 0.35 && ar > 0.75 && ar < 1.33) return box;
  }
  const side = Math.round(canvas.height * 0.62);
  return { x: Math.round(canvas.x + (canvas.width - side) / 2), y: Math.round(canvas.y + canvas.height * 0.12), width: side, height: side };
}

// ../../../nexus-terminal/workers/nexus-browser/src/mcp.ts
var SCAN_CACHE_MAX_ENTRIES = 10;
var TOKEN_CHARS_DIVISOR = 4;
var FOOTER_HEIGHT_PX = 30;
var DAILY_LIMIT_SECONDS = 600;
var mcpDailyLimitSeconds = DAILY_LIMIT_SECONDS;
var mcpDailyUsage = 0;
var mcpLastResetDate = "";
function resetDailyIfNeeded() {
  const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  if (today !== mcpLastResetDate) {
    mcpDailyUsage = 0;
    mcpLastResetDate = today;
  }
}
function getQuota(sessionStartTime) {
  resetDailyIfNeeded();
  const sessionSeconds = sessionStartTime ? Math.round((Date.now() - sessionStartTime) / 1e3) : 0;
  const dailyUsed = Math.round(mcpDailyUsage + sessionSeconds);
  return {
    sessionSeconds,
    dailyUsed,
    dailyLimit: mcpDailyLimitSeconds,
    remaining: Math.max(0, mcpDailyLimitSeconds - dailyUsed)
  };
}
var waitForSchema = external_exports.object({
  selector: external_exports.string().optional().describe("Wait for element to appear"),
  textContent: external_exports.string().optional().describe("Wait for text to appear in the page"),
  selectorDisappear: external_exports.string().optional().describe("Wait for element to disappear"),
  textDisappear: external_exports.string().optional().describe("Wait for text to disappear from the page"),
  mutation: external_exports.boolean().optional().describe("Wait for any DOM change"),
  networkIdle: external_exports.boolean().optional().describe("Wait for network to settle (no requests for 200ms)"),
  timeout: external_exports.number().default(5e3).describe("Max wait time in ms")
}).optional().describe("Wait for condition after action (reduces round-trips)");
var READ_ONLY_RETRY = /* @__PURE__ */ new Set(["list_page_shortcuts", "scan", "grab", "snapshot", "screenshot", "get_content", "accessibility_tree", "extract_links", "extract_table", "form_fields", "detect_challenge", "detect_framework", "frames"]);
var TOOL_TIMEOUT_MS = { steps: 29e4, changes: 45e3, browse: 24e4, solve_captcha: 24e4, solve_challenge: 18e4, run_code: 3e5, run_command: 3e5, scroll_and_collect: 18e4, fill_form: 12e4, wait_for: 12e4, upload_to_sandbox: 18e4, download_from_sandbox: 18e4, dismiss_overlays: 9e4 };
function siteOf(host) {
  const p = host.toLowerCase().split(".").filter(Boolean);
  if (p.length <= 2) return p.join(".");
  const sld = p[p.length - 2];
  return sld.length <= 3 && p[p.length - 1].length === 2 ? p.slice(-3).join(".") : p.slice(-2).join(".");
}
function parseProxyUrl(v) {
  if (!v) return null;
  try {
    const u = new URL(v);
    const server = `${u.protocol}//${u.host}`;
    return { server, ...u.username ? { username: decodeURIComponent(u.username) } : {}, ...u.password ? { password: decodeURIComponent(u.password) } : {} };
  } catch {
    return null;
  }
}
function fieldHoldsTyped(value, typed) {
  const norm2 = (x) => x.toLowerCase().replace(/[^a-z0-9]/g, "");
  const v = norm2(value), t = norm2(typed);
  if (!t) return true;
  if (v === t) return true;
  if (v.endsWith(t) && v.length > t.length) return false;
  return v.includes(t) || t.includes(v);
}
var SINGLE_TAB_SCRIPT = `(function(){ if (window !== window.top || window.__nxSingleTab) return; window.__nxSingleTab = 1;
  var fix = function(el){ if (el && el.target && !/^_(self|top|parent)$/i.test(el.target)) el.target = '_self'; };
  document.addEventListener('click', function(e){ var p = e.composedPath ? e.composedPath() : [e.target];
    for (var i = 0; i < p.length; i++) { var n = p[i]; if (n && n.tagName === 'A' && n.href && !/^javascript:/i.test(n.getAttribute('href') || '')) { fix(n); break; } } }, true);
  document.addEventListener('submit', function(e){ fix(e.target); }, true);
  // window.open must be replaced in the PAGE's world: on the sandbox (Patchright) init scripts run in an isolated world, so the override is
  // also injected as a <script> element (main world); a page CSP that blocks inline scripts leaves window.open as it was.
  var OPEN = "(function(){ if (window.__nxOpenWrapped) return; window.__nxOpenWrapped = 1; var orig = window.open; window.open = function(url){ try { var u = url == null ? '' : String(url); if (u && u !== 'about:blank' && !/^javascript:/i.test(u)) { location.href = new URL(u, location.href).href; return window; } } catch (x) {} return orig.apply(window, arguments); }; })();";
  try { (0, eval)(OPEN); } catch (x) {}
  try { var sc = document.createElement('script'); sc.textContent = OPEN; (document.head || document.documentElement).appendChild(sc); sc.remove(); } catch (x) {}
})();`;
var PAGE_STATE_SCRIPT = String.raw`(function(){
  var vis = function(e){ var r = e.getBoundingClientRect(); var cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
  var txt = function(e){ return ((e && (e.innerText || e.textContent)) || '').replace(/\s+/g, ' ').trim(); };
  var SECONDARY = /recommend|carousel|swiper|slider|related|suggest|try-these|trythese|promo|sponsor|advert|upsell|cross-sell|also-|you-may|similar/i;
  var secondaryOf = function(e){
    for (var p = e; p && p !== document.body; p = p.parentElement) {
      var tag = p.tagName.toLowerCase(); var role = p.getAttribute('role') || '';
      if (tag === 'footer' || tag === 'nav' || tag === 'aside' || role === 'complementary' || role === 'navigation' || role === 'contentinfo') return tag + (role ? '[' + role + ']' : '');
      var cls = (typeof p.className === 'string' ? p.className : '') + ' ' + (p.id || '') + ' ' + (p.getAttribute('aria-label') || '');
      if (SECONDARY.test(cls)) return 'section "' + cls.trim().slice(0, 40) + '"';
    }
    return null;
  };
  var h1 = Array.prototype.find.call(document.querySelectorAll('h1'), vis);
  var h1y = h1 ? h1.getBoundingClientRect().top + scrollY : 0;
  var COUNT = /^(about |over |showing |)([\d][\d,.]*\+?\s*(-|–|to|of)\s*)?[\d][\d,.]*\+?\s*(results?|matches|items?|products?|listings?|vehicles?|cars|homes|properties|jobs|stores|locations|courses|reviews|hotels|flights|deals|options)\b/i;
  var counts = [];
  var all = document.body.querySelectorAll('*');
  for (var i = 0; i < all.length && counts.length < 40; i++) {
    var e = all[i]; var t = txt(e); if (!t || t.length > 60 || !COUNT.test(t)) continue;
    var childHas = Array.prototype.some.call(e.children, function(c){ return COUNT.test(txt(c)); }); if (childHas || !vis(e)) continue;
    var y = Math.round(e.getBoundingClientRect().top + scrollY);
    counts.push({ text: t, y: y, secondary: secondaryOf(e), fromHeading: h1 ? y - Math.round(h1y) : null });
  }
  var mainCands = counts.filter(function(c){ return !c.secondary; }).sort(function(a, b){ return Math.abs(a.fromHeading || a.y) - Math.abs(b.fromHeading || b.y); });
  var main = mainCands[0] || null; var mainWhy = 'nearest count to the page heading outside suggestion/sidebar/footer areas';
  if (!main) { var side = counts.filter(function(c){ return /aside|complementary/.test(c.secondary || ''); })[0];
    if (side) { main = side; mainWhy = 'only count outside suggestion/footer areas sits in a sidebar — check it describes the listing'; } }
  var labelOf = function(inp){
    var l = inp.id && document.querySelector('label[for="' + CSS.escape(inp.id) + '"]'); if (l) return txt(l);
    var w = inp.closest('label'); if (w) return txt(w);
    return inp.getAttribute('aria-label') || inp.name || '';
  };
  var filters = [];
  Array.prototype.forEach.call(document.querySelectorAll('input[type=checkbox]:checked, input[type=radio]:checked, [role=checkbox][aria-checked=true], [role=radio][aria-checked=true], [role=switch][aria-checked=true]'), function(inp){
    if (filters.length >= 25 || inp.closest('footer')) return;
    var labEl = inp.closest('label') || (inp.id && document.querySelector('label[for="' + CSS.escape(inp.id) + '"]')) || inp.parentElement;
    if (!vis(inp) && !(labEl && vis(labEl))) return;   // custom checkboxes hide the input and show a styled label
    var lab = inp.tagName === 'INPUT' ? labelOf(inp) : txt(inp); if (lab) filters.push({ kind: 'checked', label: lab.slice(0, 60) });
  });
  Array.prototype.forEach.call(document.querySelectorAll('select'), function(sel){
    if (filters.length >= 25 || !sel.options.length) return; var o = sel.options[sel.selectedIndex]; if (!o) return;
    var lab = labelOf(sel) || sel.id || ''; filters.push({ kind: 'select', label: lab.slice(0, 50), value: txt(o).slice(0, 50), isDefault: sel.selectedIndex === 0 });
  });
  return { url: location.href, title: document.title, heading: h1 ? txt(h1).slice(0, 120) : null,
    mainCount: main ? { text: main.text, why: mainWhy } : null,
    otherCounts: counts.filter(function(c){ return c !== main; }).slice(0, 10).map(function(c){ return { text: c.text, where: c.secondary || ('main area, ' + (c.fromHeading == null ? '' : c.fromHeading + ' px from the heading')) }; }),
    activeFilters: filters,
    note: (function(){
      // 2026-11-06 (holdout-8 nfl.com): flag pages that have not rendered — a template heading ("$year$ NFL $displayname$") or an empty main
      // area — so an agent waits / reloads instead of reading nothing. String checks only (this script is a template literal: no regex escapes).
      var notes = [];
      if (counts.length > 1) notes.push('Several count labels: only mainCount describes the listing under the heading; counts in suggestion/carousel/sidebar areas are for other searches.');
      var hd = h1 ? txt(h1) : '';
      if (hd && ((hd.indexOf('$') !== hd.lastIndexOf('$')) || hd.indexOf('{{') >= 0)) notes.push('The heading looks like an unrendered template (' + hd.slice(0, 50) + '): the page has not finished rendering — wait_for its content or reload.');
      // 2026-11-06: an error page (nfl.com "404 - Flag on the Play.") read as "still loading" — detect not-found pages first: the title or
      // a short visible line that starts with 404 / says the page was not found. Then the advice is to navigate elsewhere, not to wait.
      var errLine = null, tl = (document.title || '').toLowerCase();
      var lines = (((document.body && document.body.innerText) || '').slice(0, 4000)).split(String.fromCharCode(10));
      var errPhr = ['page not found', 'not found', "page doesn't exist", 'page does not exist', "can't be found", 'cannot be found', 'could not be found', 'no longer exists', 'error 404'];
      for (var li = 0; li < lines.length && !errLine; li++) {
        var ln = lines[li].trim(), ll = ln.toLowerCase();
        if (!ln || ln.length > 80) continue;
        if (ll.indexOf('404') === 0) { errLine = ln; break; }
        for (var pi = 0; pi < errPhr.length; pi++) { if (ll.indexOf(errPhr[pi]) >= 0 && (ll.length < 50 || ll.indexOf('404') >= 0)) { errLine = ln; break; } }
      }
      if (!errLine && (tl.indexOf('404') >= 0 || tl.indexOf('not found') >= 0)) errLine = document.title;
      if (errLine) notes.push('This looks like an ERROR PAGE (' + errLine.slice(0, 60) + '): the URL does not exist — do not wait or reload; go back, or reach the page from the site navigation or search.');
      var mainEl = document.querySelector('main, [role=main]') || document.body;
      var mainLen = ((mainEl && mainEl.innerText) || '').trim().length;
      if (!errLine && mainLen < 120) notes.push('The main content area is (nearly) empty (' + mainLen + ' chars): the page is still loading, needs a scroll, or was blocked — wait_for content, scroll, or reload before reading.');
      return notes.length ? notes.join(' ') : undefined;
    })() };
})()`;
var PAGE_SHORTCUTS_SCRIPT = String.raw`(function(){
  var txt = function(e){ return ((e && (e.innerText || e.textContent)) || '').replace(/\s+/g, ' ').trim(); };
  var vis = function(e){ var r = e.getBoundingClientRect(); var cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
  var label = function(e){ return (e.getAttribute('aria-label') || e.getAttribute('title') || txt(e) || e.getAttribute('name') || e.getAttribute('placeholder') || e.tagName.toLowerCase()).slice(0, 60); };
  var mac = /Mac|iPhone|iPad/.test(navigator.platform || '');
  var sel = function(e, attr){ if (e.id) return '#' + CSS.escape(e.id); return e.tagName.toLowerCase() + '[' + attr + '="' + String(e.getAttribute(attr)).replace(/"/g, '') + '"]'; };
  var accesskeys = [];
  Array.prototype.forEach.call(document.querySelectorAll('[accesskey]'), function(e){
    if (accesskeys.length >= 60) return; var k = (e.getAttribute('accesskey') || '').trim(); if (!k) return;
    accesskeys.push({ accesskey: k, press: mac ? 'Ctrl+Alt+' + k : 'Alt+' + k + ' (Alt+Shift+' + k + ' in Firefox)', label: label(e), tag: e.tagName.toLowerCase(), selector: sel(e, 'accesskey'), visible: vis(e) });
  });
  var aria = [];
  Array.prototype.forEach.call(document.querySelectorAll('[aria-keyshortcuts]'), function(e){
    if (aria.length >= 60) return; var k = (e.getAttribute('aria-keyshortcuts') || '').trim(); if (!k) return;
    aria.push({ keys: k.slice(0, 60), label: label(e), tag: e.tagName.toLowerCase(), selector: sel(e, 'aria-keyshortcuts'), visible: vis(e) });
  });
  var kbds = [];
  Array.prototype.forEach.call(document.querySelectorAll('kbd'), function(k){
    if (kbds.length >= 30 || !vis(k)) return; var host = k.parentElement && k.parentElement.tagName === 'KBD' ? null : k;
    if (!host) return; var ctx = txt(k.closest('li, tr, p, div, span') || k).slice(0, 80); kbds.push({ key: txt(k).slice(0, 20), context: ctx });
  });
  // "?" keyboard-help convention (GitHub, Gmail, YouTube, X, Jira…): advertised by a "?" binding, a <kbd>?</kbd>, or text such as
  // "Press ? for keyboard shortcuts" / a "Keyboard shortcuts" control.
  var helpEvidence = [];
  aria.forEach(function(a){ if (a.keys.split(' ').indexOf('?') >= 0 || a.keys.indexOf('Shift+?') >= 0) helpEvidence.push('aria-keyshortcuts "' + a.keys + '" on ' + a.label); });
  kbds.forEach(function(k){ if (k.key === '?') helpEvidence.push('<kbd>?</kbd>: ' + k.context); });
  var body = ((document.body && document.body.innerText) || '').slice(0, 20000).toLowerCase();
  ['press ? ', 'type ? ', 'press "?"', 'press shift+?', "press '?'", 'hit ? '].forEach(function(p){ var i = body.indexOf(p); if (i >= 0) helpEvidence.push('text: "' + body.slice(Math.max(0, i - 10), i + 50).replace(/\s+/g, ' ') + '"'); });
  var helpControls = [];
  Array.prototype.forEach.call(document.querySelectorAll('a, button, [role=button], [role=menuitem]'), function(e){
    if (helpControls.length >= 5) return; var l = (label(e) + ' ' + (e.getAttribute('href') || '')).toLowerCase();
    if (l.indexOf('keyboard shortcut') >= 0 || l.indexOf('keyboard-shortcut') >= 0 || l.indexOf('hotkey') >= 0) helpControls.push({ label: label(e), tag: e.tagName.toLowerCase(), href: e.getAttribute('href') || undefined });
  });
  var devLinks = [];
  Array.prototype.forEach.call(document.querySelectorAll('a[href]'), function(a){
    if (devLinks.length >= 8) return; var t = txt(a).toLowerCase().slice(0, 60); var h = (a.getAttribute('href') || '').toLowerCase();
    var words = (t + ' ' + h).split(/[^a-z0-9]+/);
    if (words.indexOf('api') >= 0 || words.indexOf('cli') >= 0 || words.indexOf('developer') >= 0 || words.indexOf('developers') >= 0 || words.indexOf('sdk') >= 0)
      devLinks.push({ text: txt(a).slice(0, 50), href: a.href });
  });
  var helpKey = helpEvidence.length ? '?' : null;
  var hints = [];
  if (helpKey) hints.push('The page advertises a "?" keyboard-help overlay: keypress({ key: "?" }) (focus outside text fields), then snapshot to read the shortcut list.');
  if (helpControls.length) hints.push('A "keyboard shortcuts" control exists: open it to read the full schema.');
  if (accesskeys.length) hints.push('accesskey bindings: press ' + (mac ? 'Ctrl+Alt+<key>' : 'Alt+<key> (Chrome/Edge) or Alt+Shift+<key> (Firefox)') + ' to activate the element.');
  if (devLinks.length) hints.push('Developer/API/CLI links found — an API or CLI is faster and more reliable than driving the UI.');
  if (!hints.length) hints.push('No declared shortcuts. Standard keys still work: Tab/Shift+Tab to move focus, Enter/Space to activate, Escape to close, / often focuses search.');
  return { url: location.href, title: document.title, platform: mac ? 'mac' : 'other', accesskeys: accesskeys, ariaKeyShortcuts: aria, kbdHints: kbds, helpKey: helpKey, helpEvidence: helpEvidence.slice(0, 5), helpControls: helpControls, devLinks: devLinks, hints: hints };
})()`;
var STEPS_ALLOWED = ["page_state", "list_page_shortcuts", "browse", "click", "type", "keypress", "select", "hover", "scroll", "fill_form", "wait_for", "dismiss_overlays", "scan", "grab", "snapshot", "get_content", "form_fields", "evaluate", "extract_links", "extract_table", "screenshot"];
var STEPS_MAX = 12;
function stepBrief(name, obj, text) {
  if (!obj) return text.replace(/\s+/g, " ").slice(0, 160);
  if (name === "browse") return `${JSON.stringify(obj.title ?? "")} ${obj.url ?? ""}${obj._wall ? " [WALLED]" : ""}`;
  if (name === "click" || name === "hover") return `ok ${JSON.stringify(String(obj.element?.text ?? obj.element?.tagName ?? "").slice(0, 60))}${obj.url ? ` @ ${obj.url}` : ""}`;
  if (name === "type") return `ok ${obj.typed ?? ""}`;
  if (name === "select") return `ok ${JSON.stringify(obj.selected ?? "")}`;
  if (name === "evaluate") return String(typeof obj.result === "string" ? obj.result : JSON.stringify(obj.result ?? "")).slice(0, 200);
  return "ok";
}
function McpAgent_WALL(title, url) {
  const t = (title || "").trim();
  if (/^(403 forbidden|forbidden|access denied|access to this page has been denied|just a moment|attention required|pardon our interruption|request unsuccessful|error 403|you have been blocked)\b/i.test(t)) return `title: ${t.slice(0, 40)}`;
  if (/google\.[a-z.]+\/sorry\//i.test(url)) return "google anti-bot (/sorry/)";
  return null;
}
var AGENT_MODE_SCRIPT = `(() => { try { if (/(^|\\.)spitfire-products\\.com$|(^|\\.)nexus-terminal\\.pages\\.dev$/.test(location.hostname)) window.__NEXUS_AGENT__ = true; } catch {} })();`;
function stealthPrelude() {
  Object.defineProperty(navigator, "webdriver", { get: () => false });
  delete navigator.__proto__.webdriver;
  if (!window.chrome) {
    window.chrome = {
      runtime: {
        onMessage: { addListener: () => {
        }, removeListener: () => {
        } },
        sendMessage: () => {
        },
        connect: () => ({ onMessage: { addListener: () => {
        } }, postMessage: () => {
        } })
      },
      loadTimes: () => ({}),
      csi: () => ({})
    };
  }
  Object.defineProperty(navigator, "plugins", {
    get: () => {
      const plugins = [
        { name: "Chrome PDF Plugin", filename: "internal-pdf-viewer", description: "Portable Document Format" },
        { name: "Chrome PDF Viewer", filename: "mhjfbmdgcfjbbpaeojofohoefgiehjai", description: "" },
        { name: "Native Client", filename: "internal-nacl-plugin", description: "" }
      ];
      const arr = Object.create(PluginArray.prototype);
      plugins.forEach((p, i) => {
        arr[i] = p;
      });
      Object.defineProperty(arr, "length", { get: () => plugins.length });
      arr.item = (i) => plugins[i];
      arr.namedItem = (n) => plugins.find((p) => p.name === n) || null;
      arr.refresh = () => {
      };
      return arr;
    }
  });
  Object.defineProperty(navigator, "languages", { get: () => ["en-US", "en"] });
  Object.defineProperty(navigator, "language", { get: () => "en-US" });
  const originalQuery = window.navigator.permissions?.query?.bind(window.navigator.permissions);
  if (originalQuery) {
    window.navigator.permissions.query = (params) => {
      if (params.name === "notifications") {
        return Promise.resolve({ state: Notification.permission });
      }
      return originalQuery(params);
    };
  }
  const getParameter = WebGLRenderingContext.prototype.getParameter;
  WebGLRenderingContext.prototype.getParameter = function(param) {
    if (param === 37445) return "Intel Inc.";
    if (param === 37446) return "Intel Iris OpenGL Engine";
    return getParameter.call(this, param);
  };
  if (typeof WebGL2RenderingContext !== "undefined") {
    const getParameter2 = WebGL2RenderingContext.prototype.getParameter;
    WebGL2RenderingContext.prototype.getParameter = function(param) {
      if (param === 37445) return "Intel Inc.";
      if (param === 37446) return "Intel Iris OpenGL Engine";
      return getParameter2.call(this, param);
    };
  }
  Object.defineProperty(navigator, "connection", {
    get: () => ({
      effectiveType: "4g",
      rtt: 50,
      downlink: 10,
      saveData: false
    })
  });
  Object.defineProperty(navigator, "maxTouchPoints", { get: () => 0 });
  Object.defineProperty(navigator, "hardwareConcurrency", { get: () => 8 });
  Object.defineProperty(navigator, "deviceMemory", { get: () => 8 });
  try {
    const FAKE_VENDOR = "Apple Inc.";
    const FAKE_RENDERER = "Apple M2";
    const FAKE_VENDOR_PUBLIC = "WebKit";
    const FAKE_RENDERER_PUBLIC = "WebKit WebGL";
    const patchGL = (proto) => {
      const orig = proto.getParameter;
      proto.getParameter = function(param) {
        if (param === 7936) return FAKE_VENDOR_PUBLIC;
        if (param === 7937) return FAKE_RENDERER_PUBLIC;
        if (param === 37445) return FAKE_VENDOR;
        if (param === 37446) return FAKE_RENDERER;
        return orig.apply(this, arguments);
      };
    };
    if (typeof WebGLRenderingContext !== "undefined") patchGL(WebGLRenderingContext.prototype);
    if (typeof WebGL2RenderingContext !== "undefined") patchGL(WebGL2RenderingContext.prototype);
  } catch {
  }
  try {
    const N = globalThis.Notification;
    if (N) {
      Object.defineProperty(N, "permission", {
        get: () => "default",
        configurable: true
      });
    }
  } catch {
  }
  try {
    const origGetChannelData = AudioBuffer.prototype.getChannelData;
    AudioBuffer.prototype.getChannelData = function() {
      const data = origGetChannelData.apply(this, arguments);
      if (data.length === 4096) {
        for (let i = 0; i < data.length; i++) {
          data[i] = data[i] + (Math.random() - 0.5) * 1e-7;
        }
      }
      return data;
    };
  } catch {
  }
  try {
    const origQuery = typeof navigator !== "undefined" && navigator.permissions && navigator.permissions.query ? navigator.permissions.query.bind(navigator.permissions) : null;
    if (origQuery) {
      navigator.permissions.query = function(descriptor) {
        if (descriptor && descriptor.name === "notifications") {
          return Promise.resolve({ state: Notification.permission || "default", onchange: null });
        }
        return origQuery(descriptor);
      };
    }
  } catch {
  }
  try {
    Object.defineProperty(Navigator.prototype, "languages", {
      get: () => ["en-US", "en"]
    });
  } catch {
  }
}
var NexusBrowserMCP = class _NexusBrowserMCP extends McpAgent {
  // Keep the Durable Object warm for the duration of a browser session rather
  // than hibernating between MCP requests. McpAgent defaults hibernate:true,
  // which drops this.browser/this.page on hibernation and forces a reconnect
  // dance — and during gaps between requests the DO could be evicted, killing
  // the Puppeteer session mid-flow. With hibernate:false the DO stays resident
  // while the MCP socket is connected, and Cloudflare's 2026-06-19 change (a DO
  // stays alive while it holds an active outbound connection) keeps it from
  // being evicted while the outbound Browser-Rendering connection is held — so
  // sessions survive across request gaps instead of dropping mid-session.
  static options = { hibernate: false };
  server = new McpServer(
    {
      name: "nexus-browser",
      version: "3.0.0"
    },
    {
      instructions: [
        "NexusBrowser MCP \u2014 Headless Chrome browser you control through MCP tools.",
        "Navigate websites, interact with elements, extract data, fill forms, solve CAPTCHAs.",
        "",
        "## Core Workflow: Scan \u2192 Act \u2192 Scan",
        "1. browse({ url }) \u2014 open a page (REQUIRED first step)",
        "2. scan({ filter: { isInteractive: true } }) \u2014 find elements with CSS selectors",
        "3. click/type/select \u2014 interact using cssSelector from scan results",
        "4. scan() \u2014 verify the action worked",
        "",
        "ALWAYS scan before interacting. NEVER guess selectors. Each scan result includes",
        "a unique `cssSelector` field \u2014 use it for click/type/select.",
        "",
        "## Essential Tools",
        "browse, scan, click, type, select, screenshot, get_content, fill_form,",
        "extract_table, scroll_and_collect, detect_challenge, close_session.",
        "upload_to_sandbox (send files in), download_from_sandbox (get files out).",
        "Call searchTools() to discover 35+ tools across 6 categories.",
        "",
        "## Documentation Resources (fetch on-demand)",
        "For detailed guidance, fetch these resources:",
        "- nexus-browser://docs/quickstart  \u2014 First session walkthrough",
        "- nexus-browser://docs/tools       \u2014 Complete tool reference with examples",
        "- nexus-browser://docs/patterns    \u2014 10 common workflow patterns",
        "- nexus-browser://docs/anti-patterns \u2014 Mistakes to avoid, error recovery",
        "",
        "## Workflow Prompts (invoke for step-by-step plans)",
        "Use these prompts to get structured plans for common tasks:",
        "- navigate-and-extract  \u2014 Browse a URL and extract structured data",
        "- fill-form             \u2014 Fill and submit forms",
        "- authenticate          \u2014 Log in and save session",
        "- scrape-list           \u2014 Paginated/infinite scroll data collection",
        "- monitor-page          \u2014 Watch for content changes",
        "- solve-challenge       \u2014 Handle CAPTCHAs and challenge pages",
        "",
        "## Skills (end-to-end pipeline recipes)",
        "Call skills() to discover high-value pipeline recipes:",
        "- research-to-pdf       \u2014 Deep research \u2192 professional PDF report",
        "- data-pipeline         \u2014 Scrape \u2192 process \u2192 export structured data",
        "- competitive-intel     \u2014 Multi-site competitive intelligence",
        "- lead-generation       \u2014 Directory scraping \u2192 CRM-ready export",
        "- site-audit            \u2014 Technical site audit (SEO, a11y, links)",
        "- content-to-dataset    \u2014 Web content \u2192 ML/RAG training dataset",
        "- form-automation       \u2014 Multi-step form and wizard automation",
        "- pdf-reading           \u2014 Extract text, tables, images; convert to HTML",
        "- pdf-form-fill         \u2014 Detect, fill, and flatten PDF form fields",
        "",
        "## Stealth & Human-Like Behavior",
        "Automatic stealth (webdriver hiding, fingerprint spoofing) is always active.",
        "click/type/hover default to humanLike=true (Bezier mouse, variable keystrokes).",
        "Set humanLike=false for React-compatible injectable mode (native value setters).",
        "",
        "## Browser + Code Coexist",
        "The browser (browse/scan/click/...) and the code sandbox (run_code/run_command) share",
        "ONE session and run side by side. Running code does NOT close or replace your browse",
        "page \u2014 freely interleave them. close_session() tears down both.",
        "",
        "## Key Rules",
        "- Always browse() before any other page tool",
        "- Always scan() before click/type/select",
        "- Always close_session() when done (ends both the browser and the code sandbox)",
        "- Prefer scan over screenshot for element discovery (lower token cost)"
      ].join("\n")
    }
  );
  initialState = {
    sessionId: null,
    url: null
  };
  browser = null;
  page = null;
  /** console_logs (2026-10-28): console messages, page errors, failed requests and 4xx/5xx responses captured from the puppeteer page
   *  since it was prepared (ring buffer, newest last). The sandbox backend keeps the same buffer in its Playwright relay (/console). */
  consoleBuf = [];
  consoleAttached = /* @__PURE__ */ new WeakSet();
  /** Which path produced this.page: browse | reconnect | restore | sandbox (diagnostics, surfaced by session_info). */
  pageOrigin = null;
  sessionStartTime = null;
  utilsInjected = false;
  finderInjected = false;
  bippyInjected = false;
  frameworkInfo = null;
  /** Active backend: 'puppeteer' (default/cheap) or 'sandbox' (challenge-protected sites) */
  backend = "puppeteer";
  sandboxPage = null;
  // ── Optimization: Scan Result Cache (hash-based dedup) ──────────────────
  scanCache = /* @__PURE__ */ new Map();
  // ── Optimization: Diff Tracking (element-level changes between scans) ───
  lastScanElements = /* @__PURE__ */ new Map();
  // ── Optimization: Screenshot Dedup (SHA-256 hash, LRU) ──────────────────
  screenshotCache = /* @__PURE__ */ new Map();
  screenshotStats = { exactHits: 0, misses: 0 };
  // ── 2026-10-20: ref-addressed snapshot, computer-use cursor, per-step trace ──
  /** ref ("e12") → CSS selector that resolves it (`[data-nexus-ref="e12"]`), set by the last `snapshot` call; cleared on navigation. */
  snapshotRefs = /* @__PURE__ */ new Map();
  /** Cursor into the page's overlay journal (window.__nxWatch, overlay-watch.injectable.ts) — events newer than this are unreported. */
  watchSeq = 0;
  /** Overlay events since the last report (modals / cookie banners / toasts / promo bars appearing or closing, navigations), installing
   *  the watcher on demand. A navigation restarts the page's journal at 0, so a cursor ahead of the page's seq reads from 0. */
  async readChanges(settleMs) {
    if (!this.page) return null;
    if (settleMs > 0) await new Promise((r) => setTimeout(r, settleMs));
    const js = (n) => `(() => { if (!window.__nxWatch) { ${OVERLAY_WATCH_SCRIPT} } return window.__nxWatch ? window.__nxWatch.since(${n}) : null; })()`;
    const run = async (n) => await Promise.race([this.page.evaluate(js(n)), new Promise((r) => setTimeout(() => r(null), 4e3))]);
    try {
      let out = await run(this.watchSeq);
      if (out && out.seq < this.watchSeq) out = await run(0);
      if (!out) return null;
      this.watchSeq = out.seq;
      return out;
    } catch {
      return null;
    }
  }
  /** Compact `_changes` block for an action result — only when something appeared/closed (open overlays repeat only alongside events). */
  changesBlock(ch, always = false) {
    if (!ch || !ch.events.length && !(always && ch.open.length)) return null;
    const events = ch.events.slice(-12).map((e) => e.type === "gone" ? { type: "gone", kind: e.kind, selector: e.selector, text: e.text } : e.type === "navigated" ? e : { type: e.type, kind: e.kind, text: e.text, selector: e.selector, rect: e.rect, buttons: e.buttons, ...e.initial ? { initial: true } : {} });
    const open = ch.open.map((o) => ({ kind: o.kind, selector: o.selector, text: String(o.text || "").slice(0, 80), cover: o.cover, buttons: o.buttons }));
    const blocking = ch.open.find((o) => o.kind === "modal" || o.kind === "cookie" && Number(o.cover) >= 0.04);
    return { events, open, ...blocking ? { hint: `A ${blocking.kind === "cookie" ? "cookie/consent banner" : "modal"} is open (${blocking.selector}) and may cover the page \u2014 act on it first: click one of its buttons${blocking.kind === "cookie" ? " or call dismiss_overlays()" : ""}.` } : {} };
  }
  /** Attach `_changes` to a tool result: merged into its JSON text block, or appended as its own text block (image results). */
  withChanges(r, block) {
    if (!block || !r || !Array.isArray(r.content)) return r;
    const t = r.content.findIndex((c) => c?.type === "text");
    if (t >= 0) {
      try {
        const o = JSON.parse(r.content[t].text);
        if (o && typeof o === "object" && !Array.isArray(o)) {
          o._changes = block;
          r.content[t] = { ...r.content[t], text: JSON.stringify(o) };
          return r;
        }
      } catch {
      }
    }
    r.content.push({ type: "text", text: JSON.stringify({ _changes: block }) });
    return r;
  }
  cursorPos = [0, 0];
  traceEnabled = false;
  traceScreens = false;
  traceMax = 60;
  trace = [];
  traceSeq = 0;
  /** Always-on, redacted action trail (structure only: tool, selector/text/key, host+path, outcome) — the raw material bank_workflow turns
   *  into a web_recipe playbook (2026-10-25). Unlike `trace` it has no screenshots and is never off. */
  actions = [];
  actionSeq = 0;
  recordAction(tool, args, result) {
    try {
      let ok = true;
      let url = "";
      const t = result?.content?.find?.((c) => c?.type === "text")?.text;
      if (typeof t === "string" && t.startsWith("{")) {
        const o = JSON.parse(t);
        ok = !(o.error || o.success === false);
        url = o.url || "";
      }
      if (!url) {
        try {
          url = this.page?.url?.() || "";
        } catch {
        }
      }
      let host = "", path6 = "";
      try {
        const u = new URL(url);
        host = u.hostname.toLowerCase();
        path6 = u.pathname.slice(0, 120);
      } catch {
      }
      const keep = {};
      for (const k of ["url", "selector", "ref", "text", "key", "value", "direction", "action", "x", "y", "fields", "intent", "within"]) if (args[k] !== void 0) keep[k] = args[k];
      this.actions.push({ n: ++this.actionSeq, ts: Date.now(), tool, args: redactArgs(keep, 120), host, path: path6, ok });
      while (this.actions.length > 300) this.actions.shift();
    } catch {
    }
  }
  // ── residential egress pool (2026-10-20; src/proxy.ts; design docs/research/vast-proxy-pool-design-2026-10-20.md) ──
  proxyRules = [];
  proxyActive = null;
  proxyFailedHosts = /* @__PURE__ */ new Set();
  proxySecondsUsed = 0;
  /** Why the last page recovery failed — surfaced in the "No page open" error. */
  recoverNote = null;
  /**
   * Ensure we have a live page. Called by every tool before page interaction.
   * Returns null if page is healthy; returns error content if unrecoverable.
   * Handles: null page (post-hibernation), stale page (target died mid-session).
   */
  async ensurePage() {
    if (this.page) {
      try {
        const probe = (ms) => Promise.race([
          this.page.evaluate("1").then(() => "ok"),
          new Promise((res) => setTimeout(() => res("slow"), ms))
        ]);
        let r = await probe(4e3);
        if (r === "slow" && this.browser) {
          const alive = await Promise.race([
            Promise.resolve(this.browser.version()).then(() => true, () => false),
            new Promise((res) => setTimeout(() => res(false), 3e3))
          ]);
          if (!alive) throw new Error("browser not answering (dead devtools connection)");
        }
        if (r === "slow") r = await probe(1e4);
        if (r === "slow") console.log("[DO] page busy (probe > 14 s) \u2014 proceeding without reconnect");
        return null;
      } catch (e) {
        console.log(`[DO] page error on liveness probe (${String(e?.message || e).slice(0, 80)}) \u2014 reconnecting`);
        this.page = null;
        if (this.browser) {
          try {
            this.browser.disconnect ? await this.browser.disconnect() : await this.browser.close();
          } catch {
          }
          this.browser = null;
        }
      }
    }
    this.recoverNote = null;
    const reconnected = await this.tryReconnectPuppeteer() || await this.tryReconnectSandbox() || await this.tryRestoreFromState();
    if (reconnected) return null;
    const st = this.state;
    const recovery = st?.url ? this.recoverNote || (st.backend === "sandbox" ? "sandbox container not answering (it idle-stops after 5 min)" : "reconnect and restore both failed") : "no page was browsed in this session";
    return { content: [{ type: "text", text: JSON.stringify({ error: "No page open. Call browse first.", lastUrl: st?.url, recovery }) }] };
  }
  /** @deprecated Use ensurePage() — kept as alias for backwards compat */
  async noPage() {
    return this.ensurePage();
  }
  /**
   * Reconnect to a Puppeteer browser session after DO hibernation.
   * McpAgent defaults hibernate:true — when the DO wakes, this.browser and
   * this.page are dead JS refs but the CF Browser Rendering session may still
   * be alive. Uses puppeteer.sessions() to find it and puppeteer.connect()
   * to reattach.
   */
  async tryReconnectPuppeteer() {
    if (this.page) return true;
    const state = this.state;
    if (state?.backend === "sandbox") return false;
    try {
      if (!state?.browserSessionId) return false;
      let targetSession;
      for (let i = 0; i < 5; i++) {
        const sessions2 = await cf_puppeteer_default.sessions(this.env.BROWSER);
        const mine = sessions2.find((s) => s.sessionId === state.browserSessionId);
        if (!mine) return false;
        if (!mine.connectionId) {
          targetSession = mine;
          break;
        }
        await new Promise((r) => setTimeout(r, 1500));
      }
      if (!targetSession) return false;
      this.browser = await cf_puppeteer_default.connect(this.env.BROWSER, targetSession.sessionId);
      const pages = await this.browser.pages();
      if (pages.length === 0) {
        await this.browser.close();
        this.browser = null;
        return false;
      }
      const base2 = (u) => {
        try {
          const x = new URL(u);
          return x.origin + x.pathname;
        } catch {
          return u;
        }
      };
      const want = state?.url ? base2(state.url) : null;
      const real = pages.filter((p) => !/^about:blank/.test(p.url()));
      this.page = want && real.find((p) => base2(p.url()) === want) || real[real.length - 1] || pages[pages.length - 1];
      this.pageOrigin = `reconnect(${pages.length} tabs)`;
      await this.preparePuppeteerPage(this.page);
      this.backend = "puppeteer";
      this.sessionStartTime = Date.now();
      this.utilsInjected = false;
      this.finderInjected = false;
      this.bippyInjected = false;
      this.frameworkInfo = null;
      this.invalidateCaches();
      this.lastScanElements.clear();
      await this.injectUtils();
      await this.detectFramework();
      if (this.frameworkInfo?.react) this.bippyInjected = true;
      console.log(`[DO] Reconnected to Puppeteer after hibernation (url: ${this.page.url()})`);
      return true;
    } catch {
      return false;
    }
  }
  /** Viewport, user agent, stealth and our pre-load helpers for a puppeteer page — shared by browse, session restore and
   *  reconnect. All of these are bound to the CDP connection, so a reconnect after hibernation must register them again
   *  (2026-10-21: restore and reconnect skipped them — the next reload exposed navigator.webdriver and lost every helper). */
  /** Attach the console/error/network capture once per puppeteer page (console_logs tool). */
  attachConsoleCapture(page) {
    if (!page || this.consoleAttached.has(page)) return;
    this.consoleAttached.add(page);
    const push = (e) => {
      this.consoleBuf.push({ t: Date.now(), ...e });
      if (this.consoleBuf.length > 600) this.consoleBuf.splice(0, this.consoleBuf.length - 600);
    };
    try {
      page.on("console", (msg) => {
        try {
          push({ kind: "console", level: String(msg.type()), text: String(msg.text()).slice(0, 500), url: msg.location?.()?.url?.slice(0, 200) });
        } catch {
        }
      });
      page.on("pageerror", (err2) => push({ kind: "pageerror", level: "error", text: String(err2?.message || err2).slice(0, 500) }));
      page.on("requestfailed", (req) => {
        try {
          push({ kind: "requestfailed", level: "error", text: String(req.failure()?.errorText || "failed"), url: req.url().slice(0, 200) });
        } catch {
        }
      });
      page.on("response", (res) => {
        try {
          const st = res.status();
          if (st >= 400) push({ kind: "response", level: st >= 500 ? "error" : "warning", text: `HTTP ${st}`, url: res.url().slice(0, 200) });
        } catch {
        }
      });
    } catch {
    }
  }
  async preparePuppeteerPage(page) {
    this.attachConsoleCapture(page);
    await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
    );
    await page.evaluateOnNewDocument(`(() => { const __name = (f) => f; (${stealthPrelude.toString()})(); })();`);
    try {
      await page.evaluateOnNewDocument(buildUtilsInjectable());
    } catch {
    }
    try {
      await page.evaluateOnNewDocument(FINDER_INJECTABLE);
    } catch {
    }
    try {
      await page.evaluateOnNewDocument(AGENT_MODE_SCRIPT);
    } catch {
    }
    try {
      await page.evaluateOnNewDocument(OVERLAY_WATCH_SCRIPT);
    } catch {
    }
    try {
      await page.evaluateOnNewDocument(SINGLE_TAB_SCRIPT);
    } catch {
    }
    try {
      await page.evaluateOnNewDocument(REACT_HOOK_SHIM_SCRIPT);
    } catch {
    }
    try {
      await page.evaluateOnNewDocument(`window.__nexusBippyLite = ${BIPPY_LITE_SCRIPT};`);
    } catch {
    }
  }
  /** Launch a Cloudflare Browser Rendering session; retry twice on CAPACITY errors (503 / 429 / "Unable to create new browser" —
   *  2026-10-23: seen intermittently in field probes, where browse failed outright and the agent's next call got "No page open").
   *  A launch that still fails throws, and browse()'s catch escalates capacity errors to the sandbox's real Chrome. */
  async launchCfBrowser() {
    const capacity = /\b(503|429)\b|Unable to create new browser|rate limit|too many/i;
    let last;
    for (const waitMs of [0, 1500, 4e3]) {
      if (waitMs) await new Promise((r) => setTimeout(r, waitMs));
      try {
        return await cf_puppeteer_default.launch(this.env.BROWSER, { keep_alive: 6e5 });
      } catch (e) {
        last = e;
        if (!capacity.test(String(e?.message || e))) throw e;
      }
    }
    throw last;
  }
  /** Last resort after a lost browser: reopen the last browsed URL in a fresh puppeteer session (in-page state is lost; cookies are not). */
  async tryRestoreFromState() {
    if (this.page) return true;
    const st = this.state;
    if (!st?.url || st.backend === "sandbox" || !this.env.BROWSER) return false;
    const recent = (st.restores || []).filter((t) => Date.now() - t < 12e4);
    if (recent.length >= 3) {
      this.recoverNote = "restore refused: 3 restores in the last 2 min (loop guard)";
      return false;
    }
    try {
      this.browser = await this.launchCfBrowser();
      this.page = (await this.browser.pages())[0] || await this.browser.newPage();
      await this.preparePuppeteerPage(this.page);
      this.pageOrigin = "restore";
      await this.page.goto(st.url, { waitUntil: "domcontentloaded", timeout: 3e4 });
      this.backend = "puppeteer";
      this.sessionStartTime = Date.now();
      this.utilsInjected = false;
      this.finderInjected = false;
      this.bippyInjected = false;
      this.frameworkInfo = null;
      this.invalidateCaches();
      this.lastScanElements.clear();
      this.snapshotRefs.clear();
      await this.injectUtils();
      let sid;
      try {
        sid = this.browser.sessionId?.();
      } catch {
      }
      await this.setState({ ...st, browserSessionId: sid, restoredAt: Date.now(), restores: [...recent, Date.now()] });
      console.log(`[DO] Restored a fresh browser on ${st.url}`);
      return true;
    } catch (e) {
      this.recoverNote = `restore failed: ${String(e?.message || e).slice(0, 160)}`;
      try {
        await this.browser?.close();
      } catch {
      }
      this.browser = null;
      this.page = null;
      return false;
    }
  }
  /**
   * Attempt to reconnect to a sandbox container after DO eviction.
   * The DO loses in-memory state (~60s idle) but the sandbox container stays alive.
   * If the persisted state says we had a sandbox session, recreate the SandboxPage
   * and verify it's responsive before returning it.
   */
  async tryReconnectSandbox() {
    if (this.page) return true;
    const state = this.state;
    if (state?.backend !== "sandbox" || !this.env.SANDBOX_URL) return false;
    try {
      const sbx = new SandboxPage(this.env.SANDBOX_URL, this.env.AUTH_TOKEN, this.ctx.id.toString());
      const status = await sbx.api("/api/status");
      if (!status?.relay?.status || status.relay.status !== "ok") return false;
      await sbx.evaluate("1+1");
      this.sandboxPage = sbx;
      this.page = sbx;
      this.backend = "sandbox";
      this.sessionStartTime = Date.now();
      console.log(`[DO] Reconnected to sandbox after eviction (url: ${state.url})`);
      return true;
    } catch {
      return false;
    }
  }
  /** Helper: wrap result with quota info */
  // ─── Residential egress pool helpers ─────────────────────────────────────
  /** Env for solve_captcha's decision calls: anonymous keys (no owner) are routed to the free Gemma model (challenges.ts decideAsk). */
  decisionEnv() {
    const p = this.props;
    return { ...this.env, DECISION_ANON: p?.decisionAnon === true };
  }
  proxyPolicyNow() {
    return proxyPolicy(this.props, this.env);
  }
  /** Fold the active proxy's seconds into the session meter (called before a proxy change / close). */
  noteProxyUsage() {
    if (this.proxyActive) {
      this.proxySecondsUsed += (Date.now() - this.proxyActive.since) / 1e3;
      this.proxyActive.since = Date.now();
    }
  }
  proxyInfo() {
    if (!this.proxyActive) return null;
    const { rule, server, hostId, country, egressIp, netClass, localPort, fallbackFrom } = this.proxyActive;
    return {
      type: rule.type,
      country,
      hostId,
      egressIp,
      netClass,
      server: rule.type === "external" ? server : `socks5 tunnel :${localPort}`,
      secondsUsed: Math.round(this.proxySecondsUsed + (Date.now() - this.proxyActive.since) / 1e3),
      ...fallbackFrom ? { fallbackFrom, note: `no usable ${fallbackFrom} host \u2014 routed through ${country} instead (set strictCountry:true on the rule to forbid this)` } : {}
    };
  }
  /** The rule that routes this browse() URL: the per-call override, else the session rules; null/none = direct. */
  resolveProxyRule(url, override) {
    let rules = this.proxyRules;
    if (override !== void 0) {
      const v = validateProxyRules(override);
      if (v.errors.length) return { rule: null, errors: v.errors };
      rules = v.rules;
    }
    const host = hostnameOf(url);
    if (!rules.length) {
      if (override === void 0 && host && this.stickySite && this.proxyActive && siteOf(host) === this.stickySite) return { rule: this.proxyActive.rule };
      return { rule: null };
    }
    if (!host) return { rule: null, errors: ["bad url"] };
    const rule = matchProxyRule(rules, host);
    return { rule: rule && rule.type !== "none" ? rule : null };
  }
  /**
   * Make the sandbox browser egress through `rule`: an external proxy is handed straight to Chrome; a `vast` rule picks a pool host
   * (bench_host over STDB SQL, 60-s cache), opens an ssh SOCKS tunnel in the container and points Chrome at it. Throws a plain
   * string the model can read when nothing can be opened.
   */
  async openProxyFor(rule, sbx) {
    const policy = this.proxyPolicyNow();
    if (!policy.allowed) throw `proxy_not_allowed: this key cannot use the egress pool (policy ${policy.source}); ask the operator to enable proxy_allowed on the key`;
    this.noteProxyUsage();
    if (policy.dailySeconds > 0 && this.proxySecondsUsed >= policy.dailySeconds) throw `proxy_daily_cap: ${Math.round(this.proxySecondsUsed)}s of ${policy.dailySeconds}s proxied browser-time used today`;
    if (rule.type === "external") {
      if (this.proxyActive?.localPort) {
        try {
          await sbx.closeProxy(this.proxyActive.localPort);
        } catch {
        }
      }
      this.proxyActive = { rule, server: rule.server, since: Date.now() };
      return { server: rule.server, ...rule.username ? { username: rule.username } : {}, ...rule.password ? { password: rule.password } : {} };
    }
    if (rule.type !== "vast") throw "proxy rule is none";
    if (!this.env.PROXY_SSH_CA_KEY) throw "proxy_unconfigured: PROXY_SSH_CA_KEY is not set on the worker";
    const loaded = await loadProxyHosts(this.env);
    let hosts = loaded.hosts;
    const fresh = () => loadProxyHosts(this.env, { fresh: true }).then((l) => {
      hosts = l.hosts;
    });
    let lastTunnelError = "";
    const poolBad = await readBadProxyHosts(this.env, hosts);
    for (let attempt = 0; attempt < 3; attempt++) {
      const exclude = /* @__PURE__ */ new Set([...this.proxyFailedHosts, ...poolBad]);
      let host = pickProxyHost(hosts, rule, exclude);
      let fallbackFrom;
      if (!host && !rule.strictCountry && (lastTunnelError || poolBad.size)) {
        host = pickProxyHost(hosts, rule, exclude, true);
        if (host) fallbackFrom = rule.country.toUpperCase();
      }
      if (!host) {
        if (attempt === 0 && loaded.source === "kv") {
          await fresh();
          continue;
        }
        if (lastTunnelError) throw lastTunnelError;
        throw `${explainNoHost(hosts, rule)}${loaded.error ? ` (pool read: ${loaded.error})` : ""}${this.proxyFailedHosts.size ? ` (excluded after tunnel failures this session: ${[...this.proxyFailedHosts].join(",")})` : ""}. The operator refills the pool with .bench/proxy/stdb-proxy-pool.sh`;
      }
      if (this.proxyActive?.hostId === host.hostId && this.proxyActive.localPort) {
        return { server: this.proxyActive.server };
      }
      if (this.proxyActive?.localPort) {
        try {
          await sbx.closeProxy(this.proxyActive.localPort);
        } catch {
        }
      }
      const localPort = nextLocalPort(this.proxyActive?.localPort ? [this.proxyActive.localPort] : []);
      const sshUser = this.env.PROXY_SSH_USER || "root";
      const ca = await importCaSeed(this.env.PROXY_SSH_CA_KEY);
      const m = await mintProxyCredential(ca, { principal: sshUser, validSeconds: 30 * 60, keyId: `nexus-proxy-${host.hostId}-${Date.now()}` });
      const r = await sbx.openProxy({ sshHost: host.sshHost, sshPort: host.sshPort, user: sshUser, key: m.privateKey, cert: m.certificate, localPort, hostId: host.hostId });
      if (r?.open) {
        this.proxyActive = { rule, server: r.server, hostId: host.hostId, country: host.country, egressIp: host.egressIp, netClass: host.netClass, localPort, since: Date.now(), ...fallbackFrom ? { fallbackFrom } : {} };
        return { server: r.server };
      }
      this.proxyFailedHosts.add(host.hostId);
      await markBadProxyHost(this.env, host.hostId, `${String(r?.error || "unknown")} ${String(r?.log || "")}`);
      lastTunnelError = `proxy_tunnel_failed on host ${host.hostId} (${host.sshHost}:${host.sshPort}): ${String(r?.error || "unknown")} ${String(r?.log || "").slice(0, 300)}`;
    }
    throw lastTunnelError || "proxy_tunnel_failed";
  }
  /** browse() through the sandbox backend with a proxy on the Chrome context (the puppeteer backend cannot take a proxy). */
  stickySite = null;
  async browseProxied(url, rule, opts) {
    {
      const h = hostnameOf(url);
      if (h && rule.type !== "none") this.stickySite = siteOf(h);
    }
    if (!this.env.SANDBOX_URL) throw "proxy needs the sandbox backend (SANDBOX_URL not configured)";
    if (this.page && this.page !== this.sandboxPage) {
      try {
        await this.page.close();
      } catch {
      }
    }
    if (this.browser) {
      try {
        await this.browser.close();
      } catch {
      }
      this.browser = null;
      if (this.sessionStartTime) mcpDailyUsage += (Date.now() - this.sessionStartTime) / 1e3;
    }
    if (!this.sandboxPage) this.sandboxPage = new SandboxPage(this.env.SANDBOX_URL, this.env.AUTH_TOKEN, this.ctx.id.toString());
    const proxy = rule.type === "none" ? null : await this.openProxyFor(rule, this.sandboxPage);
    const launched = await this.sandboxPage.launchWithProxy(proxy, opts.incognito);
    if (launched?.error) throw `${rule.type === "none" ? "sandbox" : "proxy"} launch failed: ${launched.error}`;
    try {
      await this.sandboxPage.evaluateOnNewDocument(buildUtilsInjectable());
    } catch {
    }
    try {
      await this.sandboxPage.evaluateOnNewDocument(FINDER_INJECTABLE);
    } catch {
    }
    try {
      await this.sandboxPage.evaluateOnNewDocument(AGENT_MODE_SCRIPT);
    } catch {
    }
    try {
      await this.sandboxPage.evaluateOnNewDocument(OVERLAY_WATCH_SCRIPT);
    } catch {
    }
    try {
      await this.sandboxPage.evaluateOnNewDocument(SINGLE_TAB_SCRIPT);
    } catch {
    }
    try {
      await this.sandboxPage.evaluateOnNewDocument(REACT_HOOK_SHIM_SCRIPT);
    } catch {
    }
    try {
      await this.sandboxPage.evaluateOnNewDocument(`window.__nexusBippyLite = ${BIPPY_LITE_SCRIPT};`);
    } catch {
    }
    const waitUntil = opts.waitUntil.startsWith("networkidle") ? "networkidle" : opts.waitUntil;
    await this.sandboxPage.goto(url, { waitUntil, timeout: opts.budget === "medium" ? 2e4 : 3e4 });
    if (opts.settleMs > 0) await new Promise((r) => setTimeout(r, Math.min(opts.settleMs, 5e3)));
    this.page = this.sandboxPage;
    this.browser = null;
    this.backend = "sandbox";
    this.sessionStartTime = Date.now();
    this.utilsInjected = false;
    this.finderInjected = false;
    this.bippyInjected = false;
    this.frameworkInfo = null;
    this.invalidateCaches();
    this.lastScanElements.clear();
    await this.injectUtils();
    await this.detectFramework();
    if (this.frameworkInfo?.react) this.bippyInjected = true;
    const title = await this.sandboxPage.title();
    const viewport = await this.sandboxPage.evaluate("({width: window.innerWidth, height: window.innerHeight, pageHeight: document.documentElement.scrollHeight})");
    await this.setState({ sessionId: crypto.randomUUID(), url, backend: "sandbox" });
    return { success: true, title, url, viewport, framework: this.frameworkInfo, _backend: "sandbox", _proxy: this.proxyInfo(), ...launched?.incognito ? { _incognito: true } : {} };
  }
  /** The hosted per-key time meter. Local runs (the @nexus-cortex/browser library, env.BROWSER.local) have no quota, so no meter: it was
   *  ~90 chars of noise on every result, re-sent with every later request, and models dropped it when quoting results (2026-11-03). */
  quotaField() {
    return this.env.BROWSER?.local ? {} : { _quota: getQuota(this.sessionStartTime) };
  }
  result(data) {
    return {
      content: [{
        type: "text",
        text: JSON.stringify({ ...data, ...this.quotaField() })
      }]
    };
  }
  // ── Optimization Helpers ──────────────────────────────────────────────────
  /** FNV-1a 32-bit hash — same algorithm as internal NexusSense __utils.quickHash */
  quickHash(obj) {
    const str = JSON.stringify(obj);
    let hash = 2166136261;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = hash * 16777619 >>> 0;
    }
    return hash.toString(36);
  }
  /** SHA-256 hash for screenshot dedup (Web Crypto API — available in Workers) */
  async sha256(data) {
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(data));
    return Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  /** Generate compact scan summary for cache hits (~25 tokens) */
  generateScanSummary(elements) {
    const types = /* @__PURE__ */ new Map();
    elements.forEach((el) => {
      const key = el.isInteractive ? `interactive ${el.tagName}` : el.tagName;
      types.set(key, (types.get(key) || 0) + 1);
    });
    const parts = [...types.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, v]) => `${v} ${k}`);
    return `${elements.length} elements (${parts.join(", ")})`;
  }
  /** Truncate elements to fit within a token budget */
  truncateToTokens(elements, maxTokens) {
    let accumulated = 0;
    const kept = [];
    for (const el of elements) {
      const elTokens = JSON.stringify(el).length / TOKEN_CHARS_DIVISOR;
      if (accumulated + elTokens > maxTokens && kept.length > 0) {
        return { elements: kept, tokenEstimate: Math.round(accumulated), truncated: true };
      }
      accumulated += elTokens;
      kept.push(el);
    }
    return { elements: kept, tokenEstimate: Math.round(accumulated), truncated: false };
  }
  /** Compute element-level diff between current and previous scan */
  diffScan(elements) {
    if (this.lastScanElements.size === 0) return null;
    const currentMap = /* @__PURE__ */ new Map();
    for (const el of elements) {
      const key = `${el.tagName}:${(el.textContent || "").slice(0, 20)}:${el.id || ""}`;
      currentMap.set(key, el);
    }
    let added = 0, changed = 0, unchanged = 0;
    const removed = [...this.lastScanElements.keys()].filter((k) => !currentMap.has(k)).length;
    for (const [key, el] of currentMap) {
      const prev = this.lastScanElements.get(key);
      if (!prev) {
        added++;
      } else if (prev.rect?.x !== el.rect?.x || prev.rect?.y !== el.rect?.y || prev.rect?.width !== el.rect?.width || prev.rect?.height !== el.rect?.height || prev.className !== el.className || prev.isInteractive !== el.isInteractive) {
        changed++;
      } else {
        unchanged++;
      }
    }
    return { added, changed, removed, unchanged };
  }
  /** Update stored elements for next diff */
  updateLastScan(elements) {
    this.lastScanElements.clear();
    for (const el of elements) {
      const key = `${el.tagName}:${(el.textContent || "").slice(0, 20)}:${el.id || ""}`;
      this.lastScanElements.set(key, {
        tagName: el.tagName,
        id: el.id,
        rect: el.rect,
        className: el.className,
        isInteractive: el.isInteractive
      });
    }
  }
  /** Check screenshot cache — returns compact message if duplicate */
  /** Last screenshot request signature + full-image hash: dedup only an IMMEDIATE repeat of the same request. */
  lastShot = null;
  async checkScreenshotCache(data, sig = "") {
    const hash = await this.sha256(sig + "|" + data);
    const repeat = !!this.lastShot && this.lastShot.sig === sig && this.lastShot.hash === hash;
    this.lastShot = { sig, hash };
    const cached = repeat ? this.screenshotCache.get(hash) : void 0;
    if (cached) {
      cached.accessCount++;
      cached.timestamp = Date.now();
      this.screenshotStats.exactHits++;
      return { isDuplicate: true, hash };
    }
    this.screenshotStats.misses++;
    if (this.screenshotCache.size >= 20) {
      let oldestKey = "", oldestTime = Infinity;
      for (const [k, v] of this.screenshotCache) {
        if (v.timestamp < oldestTime) {
          oldestTime = v.timestamp;
          oldestKey = k;
        }
      }
      if (oldestKey) this.screenshotCache.delete(oldestKey);
    }
    this.screenshotCache.set(hash, { hash, timestamp: Date.now(), accessCount: 1 });
    return { isDuplicate: false, hash };
  }
  /** Invalidate caches after mutations (click, type, scroll, etc.) */
  /** Resolve a snapshot ref ("e12") to the selector the page was tagged with. Null when unknown/stale. */
  resolveRef(ref) {
    if (!ref) return null;
    const r = this.snapshotRefs.get(ref.trim());
    return r ? { selector: r.selector, frameIndex: r.frameIndex } : null;
  }
  refError(ref) {
    return this.result({ error: `Unknown or stale ref "${ref}" \u2014 call snapshot() again (refs are valid until the next snapshot or navigation)` });
  }
  /** Viewport JPEG as base64 (no caching; used by computer_use and the trace). */
  async captureJpeg(quality = 60) {
    try {
      return await this.withTimeout(this.page.screenshot({ type: "jpeg", quality, encoding: "base64", fullPage: false }), 25e3, "screenshot");
    } catch {
      return null;
    }
  }
  /** computer_use pixel diffing (2026-10-22): the last frame the agent was SENT (quarter-scale luminance) + partials since a keyframe. */
  cuPrev = null;
  lastMutationAt = 0;
  /** Wait until the viewport stops changing and is not a blank frame (2026-11-02 A/B: frames taken 150 ms after a click / Enter were
   *  pre-action, half-rendered or blank white mid-navigation, and agents mis-clicked on them). 0.25-scale thumbnails ~300 ms apart; stable =
   *  < 0.3% of cells changed AND the frame is not uniform AND the document is not loading. Capped at maxMs; returns the wait in ms. */
  async waitVisualSettle(vw, vh, maxMs = 3e3) {
    const t0 = Date.now();
    let prev = null;
    const thumb = async () => {
      try {
        const d = await this.withTimeout(this.page.screenshot({ type: "png", encoding: "base64", clip: { x: 0, y: 0, width: vw, height: vh, scale: 0.25 } }), 8e3, "settle-thumb");
        return await decodePngLuma(d);
      } catch {
        return null;
      }
    };
    const blank = (f) => {
      let lo = 255, hi = 0;
      for (let i = 0; i < f.luma.length; i += 7) {
        const v = f.luma[i];
        if (v < lo) lo = v;
        if (v > hi) hi = v;
      }
      return hi - lo < 12;
    };
    while (Date.now() - t0 < maxMs) {
      const cur = await thumb();
      if (!cur) break;
      let loading = false;
      try {
        loading = await this.page.evaluate("document.readyState") === "loading";
      } catch {
        loading = true;
      }
      if (prev && !loading && !blank(cur) && diffFrames(prev, cur).changedFraction < 3e-3) break;
      prev = cur;
      await new Promise((r) => setTimeout(r, 300));
    }
    return Date.now() - t0;
  }
  cuPartials = 0;
  /**
   * A computer_use frame, diffed against the last frame the agent saw. Returns MCP content blocks:
   *   unchanged → text only ({unchanged:true}); small change (≤ 45% of cells) → a JPEG of ONLY the changed region + its viewport box;
   *   otherwise (first frame, navigation, big change, 8 partials in a row, diff:false, any decode problem) → a full JPEG keyframe.
   * The thumbnail is rendered by Chrome at 0.25 scale as PNG (clip.scale — both backends) and decoded in-Worker (framediff.ts).
   */
  async cuFrame(vw, vh, opts) {
    const full = async (reason, cur2) => {
      const data2 = await this.captureJpeg(opts.quality);
      if (!data2) return null;
      if (cur2) this.cuPrev = { url: this.safeUrl(), frame: cur2, at: Date.now() };
      this.cuPartials = 0;
      return [{ type: "image", data: data2, mimeType: "image/jpeg" }, { type: "text", text: JSON.stringify({ ...opts.meta, frame: "full", reason }) }];
    };
    let cur = null;
    try {
      const thumb = await this.withTimeout(this.page.screenshot({ type: "png", encoding: "base64", clip: { x: 0, y: 0, width: vw, height: vh, scale: 0.25 } }), 15e3, "frame-thumb");
      cur = await decodePngLuma(thumb);
    } catch {
      return full("thumbnail unavailable", null);
    }
    const prev = this.cuPrev;
    if (!opts.diff) return full("diff:false", cur);
    if (!prev) return full("first frame", cur);
    if (prev.url !== this.safeUrl()) return full("navigated", cur);
    if (this.cuPartials >= 8) return full("periodic keyframe", cur);
    const d = diffFrames(prev.frame, cur);
    if (!d.box) {
      return [{ type: "text", text: JSON.stringify({
        ...opts.meta,
        frame: "unchanged",
        unchanged: true,
        sinceLastFrameMs: Date.now() - prev.at,
        note: "Nothing visible changed since the last frame you received \u2014 it is still current. Pass diff:false for a fresh full frame."
      }) }];
    }
    if (d.changedFraction > 0.45) return full(`large change (${Math.round(d.changedFraction * 100)}% of the screen)`, cur);
    const sx = vw / cur.width, sy = vh / cur.height, pad = 16;
    const x1 = Math.max(0, d.box[0] * sx - pad), y1 = Math.max(0, d.box[1] * sy - pad);
    const x2 = Math.min(vw, d.box[2] * sx + pad), y2 = Math.min(vh, d.box[3] * sy + pad);
    let data = null;
    try {
      data = await this.withTimeout(this.page.screenshot({ type: "jpeg", quality: opts.quality, encoding: "base64", clip: { x: x1, y: y1, width: x2 - x1, height: y2 - y1 } }), 25e3, "frame-region");
    } catch {
      data = null;
    }
    if (!data) return full("region capture failed", cur);
    this.cuPrev = { url: prev.url, frame: cur, at: Date.now() };
    this.cuPartials++;
    const region = [x1, y1, x2, y2].map((v) => Math.round(v));
    return [{ type: "image", data, mimeType: "image/jpeg" }, { type: "text", text: JSON.stringify({
      ...opts.meta,
      frame: "region",
      region,
      changedPct: Math.round(d.changedFraction * 100),
      note: `Only this region changed since your last frame; everything else is as you last saw it. The image's top-left is viewport (${region[0]}, ${region[1]}) at 1:1 scale.`
    }) }];
  }
  /** Empty the focused (or selector) field so the next keystrokes REPLACE its text (2026-11-02 A/B: ctrl+a + Backspace left prefilled
   *  values — cars.com masked price 300,000 → 300,015; adoptapet location; ups.com — and the agent was told it typed fine).
   *  1) select the contents in-page + a trusted Backspace; 2) End + Backspace × length (masked inputs reformat a selection away);
   *  3) the native value setter + input/change (React-compatible). Returns how it was cleared, or why not. */
  async clearFocusedField(frame, selector) {
    const PICK = `${DEEP_QUERY_FNS} function __pick(s){ var e = s ? __nxDq(s) : document.activeElement; var g = 0; while (e && e.shadowRoot && e.shadowRoot.activeElement && g++ < 10) e = e.shadowRoot.activeElement; return e; }`;
    const sel = JSON.stringify(selector || null);
    const prep = await frame.evaluate(`(function(s){${PICK} var e=__pick(s); if(!e) return null; try{e.focus();}catch(x){}
      if ('value' in e) { var v = String(e.value || ''); try{ e.select(); }catch(x){} try{ e.setSelectionRange(0, v.length); }catch(x){} return { kind: 'input', len: v.length }; }
      if (e.isContentEditable) { var r = document.createRange(); r.selectNodeContents(e); var g2 = getSelection(); g2.removeAllRanges(); g2.addRange(r); return { kind: 'ce', len: (e.innerText || '').length }; }
      return { kind: 'other', len: 0 }; })(${sel})`).catch(() => null);
    if (!prep) return "no field focused";
    if (prep.len === 0) return "already empty";
    await this.page.keyboard.press("Backspace");
    if (!await this.readFieldValue(frame, selector)) return "select+Backspace";
    await this.page.keyboard.press("End");
    for (let i = 0; i < Math.min(prep.len + 2, 80); i++) await this.page.keyboard.press("Backspace");
    if (!await this.readFieldValue(frame, selector)) return "End+Backspace";
    const forced = await frame.evaluate(`(function(s){${PICK} var e=__pick(s); if(!e || !('value' in e)) return false;
      var proto = e instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      var d = Object.getOwnPropertyDescriptor(proto, 'value'); if (d && d.set) d.set.call(e, ''); else e.value = '';
      e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); return String(e.value) === ''; })(${sel})`).catch(() => false);
    return forced ? "value setter" : "could not clear (the page restores the value)";
  }
  /** The current text of the selector / focused field (null when there is no field). */
  async readFieldValue(frame, selector) {
    const v = await frame.evaluate(`(function(s){${DEEP_QUERY_FNS} var e = s ? __nxDq(s) : document.activeElement; var g = 0; while (e && e.shadowRoot && e.shadowRoot.activeElement && g++ < 10) e = e.shadowRoot.activeElement;
      if (!e) return null; if ('value' in e) return String(e.value); if (e.isContentEditable) return e.innerText; return null; })(${JSON.stringify(selector || null)})`).catch(() => null);
    return typeof v === "string" ? v : null;
  }
  safeUrl() {
    try {
      return this.page?.url() || "";
    } catch {
      return "";
    }
  }
  /** Cross-session auth-state store (2026-10-25). save_auth used to write ONLY this session's Durable Object storage, so a login saved
   *  in one MCP session was invisible to the next — despite "future sessions can skip the login flow". Now also KV, scoped to the
   *  caller's API key (props.keyHash; admin token → 'admin') because the data is live cookies; 30-day TTL. */
  authKvKey(key) {
    const kv = this.env.POLICY_KV;
    if (!kv) return null;
    const p = this.props;
    const owner = p?.keyHash || (p && p.keyHash === null ? "admin" : null);
    return owner ? `authstate:${owner}:${key}` : null;
  }
  authKv() {
    return this.env.POLICY_KV || null;
  }
  /** Live url + title. On the sandbox the page URL is a cache, so refresh it before reporting where an action landed. */
  async pageInfo() {
    if (this.backend === "sandbox" && this.sandboxPage) await this.sandboxPage.syncUrl();
    const title = await this.page.title();
    return { url: this.page.url(), title };
  }
  /** Per-step artifact trail (opt-in via the `trace` tool): url/title (+ screenshot) after every mutating tool call. */
  async recordStep(tool, args) {
    if (!this.traceEnabled || !this.page) return;
    try {
      const step = { n: ++this.traceSeq, ts: (/* @__PURE__ */ new Date()).toISOString(), tool, args: redactArgs(args) };
      try {
        const pi = await this.pageInfo();
        step.url = pi.url;
        step.title = pi.title;
      } catch {
      }
      if (this.traceScreens) step.screenshot = await this.captureJpeg(40) ?? void 0;
      this.trace.push(step);
      while (this.trace.length > this.traceMax) this.trace.shift();
    } catch {
    }
  }
  invalidateCaches() {
    this.scanCache.clear();
    this.screenshotCache.clear();
  }
  /** Inject __utils and @medv/finder into the page (idempotent) */
  async injectUtils() {
    if (!this.page) return;
    if (!this.utilsInjected) {
      await this.page.evaluate(buildUtilsInjectable());
      this.utilsInjected = true;
    }
    if (!this.finderInjected) {
      try {
        await this.page.evaluate(FINDER_INJECTABLE);
        this.finderInjected = true;
      } catch {
      }
    }
  }
  /** Evaluate in the page's MAIN world. On the sandbox backend Patchright's default evaluate world is isolated
   *  and cannot see React (hook, fiber expandos, the pre-loaded __nexusBippyLite); puppeteer has a single world. */
  async evaluateMainWorld(script) {
    if (this.backend === "sandbox" && this.sandboxPage) return this.sandboxPage.evaluateMain(script);
    return this.page.evaluate(script);
  }
  /** Inject bippy-lite on React pages (idempotent, requires detectFramework first) */
  async injectBippyLite() {
    if (!this.page || this.bippyInjected) return this.bippyInjected;
    if (!this.frameworkInfo?.react) return false;
    try {
      await this.evaluateMainWorld(`window.__nexusBippyLite = ${BIPPY_LITE_SCRIPT};`);
      this.bippyInjected = true;
      return true;
    } catch {
      return false;
    }
  }
  /** Get React component info for an element (returns null for non-React pages) */
  async getReactInfo(selector) {
    if (!this.bippyInjected || !this.frameworkInfo?.react) return null;
    try {
      const info = await this.evaluateMainWorld(
        `(${BIPPY_LITE_SCRIPT})(${JSON.stringify({ selector })})`
      );
      if (!info?.available || !info.componentName) return null;
      return {
        componentName: info.componentName,
        componentStack: info.componentStack,
        props: info.props,
        sourceLocation: info.sourceLocation
      };
    } catch {
      return null;
    }
  }
  /** Batch-enrich scan elements with React component names */
  async enrichWithReactInfo(elements) {
    if (!this.bippyInjected || !this.frameworkInfo?.react) return;
    try {
      const selectors = elements.map((el) => el.cssSelector || el.selector).filter(Boolean);
      if (selectors.length === 0) return;
      const names = await this.evaluateMainWorld(`(function(sels) {
        var bippyLite = ${BIPPY_LITE_SCRIPT};
        return sels.map(function(sel) {
          try {
            var info = bippyLite({ selector: sel });
            return (info && info.available && info.componentName) ? info.componentName : null;
          } catch(e) { return null; }
        });
      })(${JSON.stringify(selectors)})`);
      let nameIdx = 0;
      for (const el of elements) {
        const sel = el.cssSelector || el.selector;
        if (sel) {
          const name = names[nameIdx++];
          if (name) el.componentName = name;
        }
      }
    } catch {
    }
  }
  /** Run an injectable script that requires __utils */
  async evalWithUtils(script, args) {
    await this.injectUtils();
    try {
      return await this.page.evaluate(`(${script})(${JSON.stringify(args)}, window.__utils)`);
    } catch (err2) {
      if (err2?.message?.includes("__utils is not defined") || err2?.message?.includes("__utils") || err2?.message?.includes("of undefined")) {
        this.utilsInjected = false;
        this.finderInjected = false;
        this.bippyInjected = false;
        await this.injectUtils();
        return this.page.evaluate(`(${script})(${JSON.stringify(args)}, window.__utils)`);
      }
      throw err2;
    }
  }
  /** Run an injectable script that does NOT require __utils */
  // ── Web workflow corpus (recipes.ts): hints + write-back ──
  async currentHost() {
    try {
      return new URL(await this.page.url()).hostname.toLowerCase();
    } catch {
      return "";
    }
  }
  async hostRecipes(kinds) {
    const host = await this.currentHost();
    if (!host) return [];
    const { recipes } = await loadRecipes(this.env, host);
    return kinds ? recipes.filter((r) => kinds.includes(r.kind)) : recipes;
  }
  /** IP-reputation walls (Akamai/Cloudflare/403/Google sorry) seen on the default backend's datacenter IPs in the 10-20 Online-Mind2Web run
   *  (28 of 92 sites). When a browse lands on one and the caller did not choose a proxy, retry through the residential pool (US, then CA)
   *  if this key may use it; otherwise return the original result marked `_wall` with a hint. */
  static WALL_TITLE = /^(403 forbidden|forbidden|access denied|access to this page has been denied|just a moment|attention required|pardon our interruption|request unsuccessful|error 403|you have been blocked|blocked)\b/i;
  async escalateIfWalled(r, args) {
    try {
      const text = r?.content?.[0]?.text;
      if (typeof text !== "string" || !text.startsWith("{")) return r;
      const obj = JSON.parse(text);
      if (!obj || obj.success === false || !obj.url) return r;
      if (args?.proxy || obj._proxy || args?.budget === "low") return r;
      const title = String(obj.title || "").trim();
      const u = String(obj.url);
      const walled = McpAgent_WALL(title, u);
      if (!walled) {
        this.wallMemoNoteLoaded(u);
        return r;
      }
      const policy = this.proxyPolicyNow();
      const ladder = [];
      const ext = parseProxyUrl(String(this.env.ESCALATION_PROXY_URL || ""));
      if (ext && policy.allowed) ladder.push({ rule: { type: "external", ...ext }, to: "sandbox+own-proxy" });
      if (this.env.PROXY_SSH_CA_KEY && policy.allowed) for (const country of ["US", "CA"]) ladder.push({ rule: { type: "vast", country }, to: `sandbox+residential:${country}` });
      if (!ladder.length && !this.env.PROXY_SSH_CA_KEY && this.env.SANDBOX_URL && obj._backend !== "sandbox") ladder.push({ rule: { type: "none" }, to: "sandbox" });
      const proxyInLadder = ladder.some((x) => x.rule.type !== "none");
      const memo = proxyInLadder ? null : this.wallMemoGet(u);
      if (memo) {
        const loaded = this.wallMemoLoadedOnHost(u);
        obj._wall = {
          reason: walled,
          repeat: true,
          tried: memo.tried,
          since: new Date(memo.at).toISOString(),
          ...loaded.length ? { loadedOnThisSite: loaded } : {},
          hint: `Already blocked at this URL this session after ${memo.tried.join(" \u2192 ") || "the browser"}; retrying gets the same result from this IP. ` + (loaded.length ? `These pages of the same site loaded: ${loaded.join(", ")} \u2014 open one and navigate inside the site (links, filters, search) instead of loading this URL directly.` : `Try a different page of the site${this.wallShorterPaths(u).length ? ` \u2014 shorter paths of this URL: ${this.wallShorterPaths(u).join(", ")}` : " (its search or listing page)"} \u2014 then navigate inside it; or set NEXUS_BROWSER_PROXY_URL to your own proxy.`)
        };
        return { ...r, content: [{ type: "text", text: JSON.stringify(obj) }, ...r.content.slice(1)] };
      }
      if (!ladder.length) {
        if (!this.env.PROXY_SSH_CA_KEY) this.wallMemoPut(u, [String(obj._backend || "browser")], walled);
        {
          const sp = this.wallShorterPaths(u);
          if (sp.length) obj._tryInstead = sp;
        }
        obj._wall = { reason: walled, hint: this.env.PROXY_SSH_CA_KEY ? "This site blocks datacenter IPs. A key with proxy access can browse it through the residential pool (set_proxy / browse proxy)." : `This page is blocked from this IP.${obj._tryInstead ? " Walls are often per path: try the shorter paths in _tryInstead (the site's listing or search page) and navigate inside the site from there." : ""} Or set NEXUS_BROWSER_PROXY_URL (your own proxy) / use set_proxy with an external proxy.` };
        return { ...r, content: [{ type: "text", text: JSON.stringify(obj) }, ...r.content.slice(1)] };
      }
      for (const step of ladder) {
        try {
          const out = await this.browseProxied(String(args.url || u), step.rule, { waitUntil: "domcontentloaded", settleMs: 2500, budget: "high" });
          if (out && out.success !== false && !McpAgent_WALL(String(out.title || ""), String(out.url || ""))) {
            out._escalated = { reason: walled, from: obj._backend || "puppeteer", to: step.to };
            return { content: [{ type: "text", text: JSON.stringify(out) }] };
          }
        } catch {
        }
      }
      if (!proxyInLadder) this.wallMemoPut(u, ladder.map((x) => x.to), walled);
      {
        const sp = this.wallShorterPaths(u);
        if (sp.length) obj._tryInstead = sp;
      }
      obj._wall = { reason: walled, tried: ladder.map((x) => x.to), hint: !ext && !this.env.PROXY_SSH_CA_KEY ? "Still blocked from this IP (a real browser did not help). Set NEXUS_BROWSER_PROXY_URL to your own proxy (http://user:pass@host:port), or use set_proxy." : "Still blocked after escalation; the site may need a logged-in session, a different proxy, or a human." };
      return { ...r, content: [{ type: "text", text: JSON.stringify(obj) }, ...r.content.slice(1)] };
    } catch {
      return r;
    }
  }
  /** Wall memo + same-site loaded pages, in the agent's SQL storage (hosted: this session; local library: one file shared by every
   *  process, so a delegate learns what an earlier delegate hit). Never throws. */
  static WALL_MEMO_MS = 20 * 60 * 1e3;
  wallMemoKey(u) {
    try {
      const x = new URL(u);
      return x.origin + x.pathname.replace(/\/+$/, "");
    } catch {
      return u;
    }
  }
  wallMemoTable() {
    try {
      this.ctx.storage.sql.exec(`CREATE TABLE IF NOT EXISTS wall_memo (url TEXT PRIMARY KEY, host TEXT, walled INTEGER, tried TEXT, at INTEGER)`);
      return true;
    } catch {
      return false;
    }
  }
  wallMemoGet(u) {
    try {
      if (!this.wallMemoTable()) return null;
      const rows = [...this.ctx.storage.sql.exec(`SELECT tried, at FROM wall_memo WHERE url = ? AND walled = 1`, this.wallMemoKey(u))];
      if (!rows.length) return null;
      const at = Number(rows[0].at);
      if (!(Date.now() - at < _NexusBrowserMCP.WALL_MEMO_MS)) return null;
      return { at, tried: JSON.parse(String(rows[0].tried || "[]")) };
    } catch {
      return null;
    }
  }
  wallMemoPut(u, tried, reason) {
    try {
      if (reason && !/access denied|403|forbidden|request unsuccessful|you have been blocked|access to this page has been denied/i.test(reason)) return;
      if (!this.wallMemoTable()) return;
      this.ctx.storage.sql.exec(`INSERT OR REPLACE INTO wall_memo (url, host, walled, tried, at) VALUES (?, ?, 1, ?, ?)`, this.wallMemoKey(u), new URL(u).host, JSON.stringify(tried), Date.now());
    } catch {
    }
  }
  wallMemoNoteLoaded(u) {
    try {
      if (!this.wallMemoTable()) return;
      this.ctx.storage.sql.exec(`INSERT OR REPLACE INTO wall_memo (url, host, walled, tried, at) VALUES (?, ?, 0, '[]', ?)`, this.wallMemoKey(u), new URL(u).host, Date.now());
    } catch {
    }
  }
  /** browse() pre-check: the remembered wall verdict for this URL, or null to browse normally. Skipped when the call asks for a proxy,
   *  when an external proxy is configured for escalation, or when the residential pool exists (those can change the outcome). */
  wallMemoShortCircuit(args) {
    try {
      const url = typeof args?.url === "string" ? args.url : "";
      if (!url || args?.proxy || args?.budget === "low") return null;
      if (this.env.ESCALATION_PROXY_URL || this.env.PROXY_SSH_CA_KEY) return null;
      const memo = this.wallMemoGet(url);
      if (!memo) return null;
      const loaded = this.wallMemoLoadedOnHost(url);
      return this.result({ success: true, title: "Access Denied", url, _wall: {
        reason: "remembered",
        repeat: true,
        tried: memo.tried,
        since: new Date(memo.at).toISOString(),
        ...loaded.length ? { loadedOnThisSite: loaded } : {},
        hint: `Not loaded again: this URL was blocked ${Math.round((Date.now() - memo.at) / 6e4)} min ago from this IP (${memo.tried.join(" \u2192 ")}), and retrying gets the same result. ` + (loaded.length ? `These pages of the same site loaded: ${loaded.join(", ")} \u2014 open one and navigate inside the site (links, filters, search).` : `Try a different page of the site${this.wallShorterPaths(url).length ? ` \u2014 shorter paths of this URL: ${this.wallShorterPaths(url).join(", ")}` : " (its search or listing page)"} \u2014 then navigate inside it; or set NEXUS_BROWSER_PROXY_URL to your own proxy.`)
      } });
    } catch {
      return null;
    }
  }
  /** Shorter paths of a walled URL (parent listing pages), nearest first — path-level walls (CarMax 2026-11-03: /, /cars/honda/nissan,
   *  /cars/nissan?zip= blocked while /cars loaded) often let the site's listing or search page through. */
  wallShorterPaths(u) {
    try {
      const x = new URL(u);
      const parts = x.pathname.split("/").filter(Boolean);
      const out = [];
      for (let i = parts.length - 1; i >= 1; i--) out.push(`${x.origin}/${parts.slice(0, i).join("/")}`);
      if (parts.length >= 1 && x.search) out.unshift(`${x.origin}${x.pathname}`);
      return out.slice(0, 3);
    } catch {
      return [];
    }
  }
  static SANDBOX_HOST_MS = 30 * 60 * 1e3;
  noteSandboxHost(u) {
    try {
      this.ctx.storage.sql.exec(`CREATE TABLE IF NOT EXISTS sandbox_hosts (host TEXT PRIMARY KEY, at INTEGER)`);
      this.ctx.storage.sql.exec(`INSERT OR REPLACE INTO sandbox_hosts (host, at) VALUES (?, ?)`, new URL(u).host, Date.now());
    } catch {
    }
  }
  forgetSandboxHost(u) {
    try {
      this.ctx.storage.sql.exec(`DELETE FROM sandbox_hosts WHERE host = ?`, new URL(u).host);
    } catch {
    }
  }
  sandboxHostRemembered(u) {
    try {
      this.ctx.storage.sql.exec(`CREATE TABLE IF NOT EXISTS sandbox_hosts (host TEXT PRIMARY KEY, at INTEGER)`);
      const rows = [...this.ctx.storage.sql.exec(`SELECT at FROM sandbox_hosts WHERE host = ?`, new URL(u).host)];
      return rows.length > 0 && Date.now() - Number(rows[0].at) < _NexusBrowserMCP.SANDBOX_HOST_MS;
    } catch {
      return false;
    }
  }
  wallMemoLoadedOnHost(u) {
    try {
      const host = new URL(u).host;
      const rows = [...this.ctx.storage.sql.exec(`SELECT url FROM wall_memo WHERE host = ? AND walled = 0 AND at > ? ORDER BY at DESC LIMIT 5`, host, Date.now() - _NexusBrowserMCP.WALL_MEMO_MS)];
      return rows.map((x) => String(x.url));
    } catch {
      return [];
    }
  }
  /** Registered tool handlers (wrapped), so post-hooks can run another tool in-process (autoCaptcha → solve_captcha). */
  toolHandlers = /* @__PURE__ */ new Map();
  toolSchemas = /* @__PURE__ */ new Map();
  /**
   * AUTO CAPTCHA ROUTING (2026-10-22, operator go). After a successful browse, look for captcha frames:
   *  - an image challenge is already OPEN (reCAPTCHA bframe / hCaptcha challenge visible), or the page IS a captcha wall (a visible
   *    checkbox and almost nothing else on the page / a wall title) → run solve_captcha now (typed decision models) and attach `_captcha`;
   *  - only a checkbox inside an ordinary page (a login/sign-up form) → do NOT click it (the form is not filled yet); attach a hint;
   *  - Turnstile / Arkose / GeeTest → hint solve_challenge (Turnstile is already clicked inside browse at budget high).
   * Opt out per call with browse({autoCaptcha:false}); budget "low" never runs it. Never throws.
   */
  async autoCaptcha(r, args) {
    try {
      if (args?.autoCaptcha === false || args?.budget === "low") return r;
      const text = r?.content?.[0]?.text;
      if (typeof text !== "string" || !text.startsWith("{")) return r;
      const obj = JSON.parse(text);
      if (!obj || obj.success === false || !obj.url || !this.page) return r;
      const det = await Promise.race([this.page.evaluate(`(function(){ var f = ${CAPTCHA_FRAMES_SCRIPT}; var b = (document.body && document.body.innerText) || ''; return { frames: f.frames, textLen: b.replace(/\\s+/g, ' ').trim().length, controls: document.querySelectorAll('input:not([type=hidden]),select,textarea,button,a[href]').length }; })()`), new Promise((res) => setTimeout(() => res(null), 5e3))]);
      const frames = (det?.frames || []).filter((f) => f.visible);
      if (!frames.length) return r;
      const kinds = frames.map((f) => f.kind);
      const challengeOpen = kinds.some((k) => k === "recaptcha_challenge" || k === "hcaptcha_challenge");
      const anchor = kinds.some((k) => k === "recaptcha_anchor" || k === "hcaptcha_anchor");
      const wall = anchor && (McpAgent_WALL(String(obj.title || ""), String(obj.url)) || (det?.textLen ?? 9999) < 600 && (det?.controls ?? 99) <= 6);
      const other = kinds.find((k) => k === "turnstile" || k === "arkose" || k === "geetest");
      if (challengeOpen || wall) {
        const solve = this.toolHandlers.get("solve_captcha");
        if (!solve) return r;
        const sr = await solve({ maxRounds: 5, threshold: 0.5, clickAnchor: true, skipUnsupported: 2 });
        let res = {};
        try {
          res = JSON.parse(sr?.content?.[0]?.text || "{}");
        } catch {
        }
        obj._captcha = {
          auto: true,
          trigger: challengeOpen ? "challenge_open" : "captcha_wall",
          kinds,
          status: res.status ?? res.error ?? "unknown",
          ...res.status === "needs_driver" ? { hint: "An unsupported captcha task: solve it from the screenshot with computer_use, then call solve_captcha again to verify." } : {},
          rounds: Array.isArray(res.trace) ? res.trace.length : void 0
        };
      } else if (anchor) {
        obj._captcha = { auto: false, kinds, hint: "A captcha checkbox is on this page (likely part of a form). Fill the form, then call solve_captcha (it clicks the checkbox and solves any image challenge)." };
      } else if (other) {
        obj._captcha = { auto: false, kinds, hint: `A ${other} challenge is on this page: call solve_challenge.` };
      } else return r;
      return { ...r, content: [{ type: "text", text: JSON.stringify(obj) }, ...r.content.slice(1)] };
    } catch {
      return r;
    }
  }
  /** Append `_recipes` (promoted/scored recipes for the host) to a successful browse result. Never throws. */
  async attachRecipeHints(r, intent) {
    try {
      const text = r?.content?.[0]?.text;
      if (typeof text !== "string" || !text.startsWith("{")) return r;
      const obj = JSON.parse(text);
      if (!obj || obj.success === false || !obj.url) return r;
      const host = new URL(obj.url).hostname.toLowerCase();
      const { recipes, source } = await loadRecipes(this.env, host);
      const hints = recipeHints(recipes);
      const learned = intent ? learnedPlaybooks(recipes, intent) : [];
      if (learned.length) obj._learned_workflows = { intent, hint: "Workflows banked earlier on this host for a similar intent \u2014 follow the closest one, then bank_workflow() with the outcome.", workflows: learned };
      if (!hints.length) return learned.length ? { ...r, content: [{ type: "text", text: JSON.stringify(obj) }, ...r.content.slice(1)] } : r;
      obj._recipes = { source, hints, hint: "Banked workflows for this host: dismiss_overlays / fill_form / solve_captcha apply promoted ones automatically; read the hints before deriving from scratch." };
      return { ...r, content: [{ type: "text", text: JSON.stringify(obj) }, ...r.content.slice(1)] };
    } catch {
      return r;
    }
  }
  async bank(args) {
    try {
      return await bankRecipe(this.env, args);
    } catch (e) {
      return { recipe_id: "", ok: false, error: String(e?.message || e).slice(0, 120) };
    }
  }
  /** Visible form fields / forms / signals of a frame (forms.ts FORM_FIELDS_SCRIPT), guarded with a timeout. */
  async readFormInventory(frameIndex) {
    const frame = this.getFrame(frameIndex);
    const r = await Promise.race([frame.evaluate(FORM_FIELDS_SCRIPT), new Promise((_, rej) => setTimeout(() => rej(new Error("form inventory timed out (10s)")), 1e4))]);
    if (!r || !Array.isArray(r.fields)) throw new Error("form inventory returned nothing");
    return r;
  }
  async evalScript(script, args) {
    return this.page.evaluate(`(${script})(${JSON.stringify(args)})`);
  }
  /** Get a specific frame (0 = main, 1+ = child frames) */
  getFrame(frameIndex) {
    if (!this.page) return null;
    if (frameIndex === void 0 || frameIndex === 0) return this.page.mainFrame();
    const frames = this.page.frames();
    if (frameIndex >= frames.length) {
      throw new Error(`Frame index ${frameIndex} out of range (${frames.length} frames)`);
    }
    return frames[frameIndex];
  }
  /** Cubic Bezier point interpolation for smooth curves */
  bezierPt(t, p0, p1, p2, p3) {
    const u = 1 - t;
    return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
  }
  /** Move mouse along a Bezier curve to (targetX, targetY) — human-like motion */
  async humanMouseMove(targetX, targetY) {
    if (!this.page) return;
    const angle = Math.random() * Math.PI * 2;
    const dist = 50 + Math.random() * 150;
    const sx = targetX + Math.cos(angle) * dist;
    const sy = targetY + Math.sin(angle) * dist;
    const cp1x = sx + (targetX - sx) * 0.3 + (Math.random() - 0.5) * 40;
    const cp1y = sy + (targetY - sy) * 0.3 + (Math.random() - 0.5) * 40;
    const cp2x = sx + (targetX - sx) * 0.7 + (Math.random() - 0.5) * 40;
    const cp2y = sy + (targetY - sy) * 0.7 + (Math.random() - 0.5) * 40;
    const steps = 5 + Math.floor(Math.random() * 11);
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      await this.page.mouse.move(
        this.bezierPt(t, sx, cp1x, cp2x, targetX),
        this.bezierPt(t, sy, cp1y, cp2y, targetY)
      );
      await new Promise((r) => setTimeout(r, 5 + Math.floor(Math.random() * 11)));
    }
  }
  /** Fallback press-and-hold via mouse.down → drift loop → mouse.up.
   *  Used when the sandbox /api/press_and_hold endpoint is unavailable
   *  OR when the active backend is puppeteer (where local mouse calls
   *  don't have HTTP overhead). The sandbox backend should prefer the
   *  dedicated endpoint via SandboxPage.mouse.pressAndHold(). */
  async fallbackPressAndHold(x, y, holdMs, jitterPx) {
    if (!this.page) return;
    try {
      await this.page.mouse.down();
    } catch {
      return;
    }
    const totalHold = Math.max(500, holdMs + (Math.random() * 600 - 300));
    const stepMs = 80;
    const steps = Math.max(1, Math.floor(totalHold / stepMs));
    for (let i = 0; i < steps; i++) {
      const driftX = (Math.random() - 0.5) * 2 * jitterPx;
      const driftY = (Math.random() - 0.5) * 2 * jitterPx;
      try {
        await this.page.mouse.move(x + driftX, y + driftY, { steps: 1 });
      } catch {
        try {
          await this.page.mouse.move(x, y);
        } catch {
        }
      }
      await new Promise((r) => setTimeout(r, stepMs + Math.random() * 20));
    }
    try {
      await this.page.mouse.up();
    } catch {
    }
  }
  /** Type text with variable keystroke timing — human-like cadence */
  async humanType(text) {
    if (!this.page) return;
    for (const char of text) {
      if (Math.random() < 0.03) {
        await new Promise((r) => setTimeout(r, 200 + Math.floor(Math.random() * 200)));
      }
      await this.page.keyboard.type(char, { delay: 80 + Math.floor(Math.random() * 40) });
    }
  }
  /**
   * Execute a waitFor condition using Puppeteer-native APIs.
   * Parity with internal NexusSense Phase 7 waitForCondition.
   * Returns { waited, condition, waitedMs } or { error, waitedMs }.
   */
  /** Race any browser op against a hard timeout so a mid-render SPA (destroyed
   *  page.evaluate context, slow CF Browser Rendering allocation) can never hang a
   *  tool to the 120s MCP ceiling (which then kills the page). Rejects on timeout. */
  withTimeout(p, ms, label) {
    return Promise.race([
      p,
      new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms))
    ]);
  }
  async executeWaitFor(waitFor) {
    if (!this.page) return { waited: false, waitedMs: 0 };
    const timeout = waitFor.timeout ?? 5e3;
    const start = Date.now();
    try {
      const ALREADY = "it was already true when the wait started \u2014 this does not show the action changed anything; wait for something NEW (or textDisappear / selectorDisappear on the old content)";
      if (waitFor.selector) {
        await this.page.waitForSelector(waitFor.selector, { timeout });
        const ms = Date.now() - start;
        return { waited: true, condition: "selector", waitedMs: ms, ...ms < 60 ? { note: ALREADY } : {} };
      }
      if (waitFor.textContent) {
        const want = JSON.stringify(String(waitFor.textContent).toLowerCase().replace(/\s+/g, " ").trim());
        await this.page.waitForFunction(
          `(function(){ var n = function(s){ return String(s || '').toLowerCase().replace(/\\s+/g, ' '); }; return n(document.body && document.body.innerText).indexOf(${want}) >= 0 || n(document.title).indexOf(${want}) >= 0; })()`,
          { timeout }
        );
        const ms = Date.now() - start;
        return { waited: true, condition: "textContent", waitedMs: ms, ...ms < 60 ? { note: ALREADY } : {} };
      }
      if (waitFor.selectorDisappear) {
        await this.page.waitForFunction(
          `!document.querySelector(${JSON.stringify(waitFor.selectorDisappear)})`,
          { timeout }
        );
        return { waited: true, condition: "selectorDisappear", waitedMs: Date.now() - start };
      }
      if (waitFor.textDisappear) {
        await this.page.waitForFunction(
          `!((document.body && document.body.innerText) || '').includes(${JSON.stringify(waitFor.textDisappear)})`,
          { timeout }
        );
        return { waited: true, condition: "textDisappear", waitedMs: Date.now() - start };
      }
      if (waitFor.mutation) {
        await this.page.waitForFunction(`new Promise(resolve => {
          const obs = new MutationObserver(() => { obs.disconnect(); resolve(true); });
          obs.observe(document.body, { childList: true, subtree: true, attributes: true, characterData: true });
          setTimeout(() => { obs.disconnect(); resolve(true); }, ${timeout});
        })`, { timeout: timeout + 500 });
        return { waited: true, condition: "mutation", waitedMs: Date.now() - start };
      }
      if (waitFor.networkIdle) {
        try {
          await this.page.waitForNetworkIdle({ idleTime: 200, timeout });
          return { waited: true, condition: "networkIdle", waitedMs: Date.now() - start };
        } catch {
          const quiet = await this.page.evaluate(`new Promise(function (resolve) { var t0 = Date.now(), last = Date.now();
            var obs = new MutationObserver(function () { last = Date.now(); }); obs.observe(document.body || document.documentElement, { childList: true, subtree: true, characterData: true });
            var iv = setInterval(function () { if (Date.now() - last >= 500 || Date.now() - t0 > 3000) { clearInterval(iv); obs.disconnect(); resolve(Date.now() - last >= 500); } }, 100); })`).catch(() => false);
          return quiet ? { waited: true, condition: "domQuiet", waitedMs: Date.now() - start, note: `the network never went idle within ${timeout} ms (ads/analytics keep polling); the page DOM has been stable for 500 ms` } : { waited: false, error: `network not idle after ${timeout} ms and the DOM is still changing`, waitedMs: Date.now() - start };
        }
      }
    } catch (err2) {
      return { waited: false, error: `waitFor timed out after ${timeout}ms: ${err2.message}`, waitedMs: Date.now() - start };
    }
    return { waited: false, waitedMs: 0 };
  }
  /** Detect frameworks on the current page */
  async detectFramework() {
    try {
      const info = await this.evaluateMainWorld(DETECT_SCRIPT);
      this.frameworkInfo = info;
      return info;
    } catch {
      return null;
    }
  }
  async init() {
    mcpDailyLimitSeconds = Number(this.env.MCP_DAILY_LIMIT_SECONDS) || DAILY_LIMIT_SECONDS;
    {
      const MUTATING = /* @__PURE__ */ new Set(["browse", "click", "type", "keypress", "scroll", "hover", "select", "fill_form", "computer_use", "solve_challenge", "scroll_and_collect", "dismiss_overlays", "solve_captcha"]);
      const srv = this.server;
      const origTool = srv.tool.bind(srv);
      srv.tool = (name, ...rest) => {
        const cb = rest[rest.length - 1];
        if (typeof cb === "function") {
          queueMicrotask(() => this.toolHandlers.set(name, rest[rest.length - 1]));
          {
            const shape = rest.find((x) => x && typeof x === "object" && !Array.isArray(x) && typeof x !== "function");
            if (shape) {
              try {
                this.toolSchemas.set(name, external_exports.object(shape));
              } catch {
              }
            }
          }
          rest[rest.length - 1] = async (...a) => {
            if (name === "browse") {
              const pre = this.wallMemoShortCircuit(a[0] && typeof a[0] === "object" ? a[0] : {});
              if (pre) return pre;
              this.snapshotRefs.clear();
              this.watchSeq = 0;
            }
            const limitMs = TOOL_TIMEOUT_MS[name] ?? 9e4;
            let r;
            try {
              r = await Promise.race([cb(...a), new Promise((_, rej) => setTimeout(() => rej(new Error("__tool_timeout__")), limitMs))]);
            } catch (e) {
              this.invalidateCaches();
              if (String(e?.message) === "__tool_timeout__") {
                return { content: [{ type: "text", text: JSON.stringify({ error: `${name} timed out after ${Math.round(limitMs / 1e3)}s \u2014 the page may still be loading or navigating; call snapshot or screenshot to see its state, then retry`, timedOut: true }) }] };
              }
              const msg = String(e?.message || e).slice(0, 300);
              const nav = /target closed|main frame too early|execution context was destroyed|detached frame|navigat/i.test(msg);
              const lost = /target closed|session closed|browser has disconnected|connection closed/i.test(msg) && !/main frame/i.test(msg);
              if (lost) {
                try {
                  if (this.page && this.page.isClosed?.()) this.page = null;
                } catch {
                }
              }
              if (lost && READ_ONLY_RETRY.has(name)) {
                try {
                  this.page = null;
                  if (this.browser) {
                    try {
                      this.browser.disconnect ? await this.browser.disconnect() : await this.browser.close();
                    } catch {
                    }
                    this.browser = null;
                  }
                  const np = await this.ensurePage();
                  if (!np) {
                    const retried = await Promise.race([cb(...a), new Promise((_, rej) => setTimeout(() => rej(new Error("__tool_timeout__")), limitMs))]);
                    return retried;
                  }
                } catch {
                }
              }
              if (/execution context was destroyed|detached frame/i.test(msg) && ["click", "keypress", "type", "select", "fill_form", "computer_use"].includes(name)) {
                await new Promise((res) => setTimeout(res, 1500));
                let landed;
                let landedTitle;
                try {
                  if (this.backend === "sandbox" && this.sandboxPage) await this.sandboxPage.syncUrl();
                  landed = this.page?.url();
                  landedTitle = await Promise.race([this.page?.title(), new Promise((res) => setTimeout(() => res(void 0), 3e3))]);
                } catch {
                }
                await this.recordStep(name, a[0] && typeof a[0] === "object" ? a[0] : {});
                return { content: [{ type: "text", text: JSON.stringify({ success: true, navigated: true, url: landed, title: landedTitle, note: `${name} triggered a navigation; the page is loading \u2014 snapshot/scan when ready.` }) }] };
              }
              return { content: [{ type: "text", text: JSON.stringify({ error: `${name} failed: ${msg}`, ...nav ? { navigating: true, hint: "The page was navigating or reloading during this call. Wait a moment, then snapshot/screenshot and retry." } : {} }) }] };
            }
            if (MUTATING.has(name)) await this.recordStep(name, a[0] && typeof a[0] === "object" ? a[0] : {});
            if (MUTATING.has(name)) this.recordAction(name, a[0] && typeof a[0] === "object" ? a[0] : {}, r);
            if (MUTATING.has(name) && name !== "scroll_and_collect") {
              const settle = name === "browse" || name === "scroll" || name === "hover" ? 0 : 350;
              try {
                r = this.withChanges(r, this.changesBlock(await this.readChanges(settle), name === "browse"));
              } catch {
              }
            }
            if (name === "browse") {
              const bargs = a[0] && typeof a[0] === "object" ? a[0] : {};
              r = await this.escalateIfWalled(r, bargs);
              r = await this.autoCaptcha(r, bargs);
              r = await this.attachRecipeHints(r, typeof bargs.intent === "string" ? bargs.intent : void 0);
            }
            return r;
          };
        }
        return origTool(name, ...rest);
      };
    }
    this.server.tool(
      "browse",
      'Navigate to a URL. Launches a headless Chrome browser and loads the page. Returns page title, viewport info, and detected frameworks. This is the entry point \u2014 call this before scan/click/type/etc. Auto-detects and solves Cloudflare/Turnstile challenges. Use budget param to control cost: "low" (fetch-only, no browser), "medium" (browser, short settle), "high" (full session, auto-challenge, SPA-aware settle).',
      {
        url: external_exports.string().describe("The URL to navigate to"),
        intent: external_exports.string().optional().describe('What you plan to do on this site (e.g., "book a flight from NYC to LAX"). Enables playbook pre-warming with known action patterns.'),
        waitUntil: external_exports.enum(["load", "domcontentloaded", "networkidle0", "networkidle2"]).default("domcontentloaded").describe("When to consider navigation complete (domcontentloaded recommended for SPAs with Turnstile)"),
        settleMs: external_exports.number().default(2e3).describe("Extra milliseconds to wait after navigation for SPA to settle (React hydration, Turnstile challenge). Default 2000ms. Auto-adjusted upward for React/Next.js SPAs."),
        autoCaptcha: external_exports.boolean().optional().describe("Default true: when an image captcha challenge is already open or the page is a captcha wall, solve it with the typed decision models before returning (result `_captcha`). A checkbox inside an ordinary form is only reported, never clicked. false = report only."),
        budget: external_exports.enum(["low", "medium", "high"]).default("high").describe('Cost mode: "low" = fetch-only markdown (no browser session, ~0s quota, no JS/interaction), "medium" = browser with 1s settle (fast, basic pages), "high" = full session with SPA-aware settle + auto-challenge solving (default).'),
        retry: external_exports.number().min(0).max(5).default(0).describe("Number of retry attempts on navigation timeout. Uses exponential backoff (2s, 4s, 8s). Auto-capped by remaining daily quota."),
        proxy: external_exports.array(external_exports.record(external_exports.string(), external_exports.any())).optional().describe('Egress rules for THIS browse only (overrides set_proxy): [{type:"vast", country:"US", domainPattern?, strictCountry?}, {type:"external", server, username?, password?}, {type:"none"}]. First rule whose domainPattern covers the URL host wins; banking/gov/streaming/ticketing/webmail/gambling hosts are never proxied. A vast/external rule routes through the sandbox backend (real Chrome) \u2014 needs a key with proxy access; if no usable host is left in the requested country the pool falls back to another residential host and says so in _proxy.fallbackFrom (strictCountry:true forbids that); {type:"none"} means no proxy and does not by itself pick a backend (use backend).'),
        incognito: external_exports.boolean().optional().describe("true: open the page in a fresh INCOGNITO-style Chrome profile (sandbox backend) \u2014 no cookies, storage or saved login, discarded on close_session. Use it to see a site as an anonymous first-time visitor; the default sandbox profile persists between sessions (a restored login survives close_session). Stays on for this session until incognito:false."),
        backend: external_exports.enum(["auto", "sandbox"]).optional().describe(`"auto" (default): Cloudflare Browser Rendering, escalating to the sandbox on challenge pages. "sandbox": open the page in the sandbox's real Chrome (no proxy) from the start \u2014 for heavy SPAs (WebGL, live animation, large client apps) that stall headless Browser Rendering. Slower to start (container), same tools afterwards.`)
      },
      async ({ url, intent, waitUntil, settleMs, budget, retry: maxRetries, proxy: proxyOverride, backend: backendChoice, incognito }) => {
        let effectiveRetries = 0;
        const quota = getQuota(this.sessionStartTime);
        if (quota.remaining <= 0) {
          return this.result({ error: "Daily quota exhausted", quota });
        }
        const routed = this.resolveProxyRule(url, proxyOverride);
        if (routed.errors?.length) return this.result({ error: `bad proxy rules: ${routed.errors.join("; ")}` });
        if (routed.rule && budget === "low") return this.result({ error: 'proxy routing needs budget "medium" or "high" (fetch-only mode has no browser)' });
        let stickySandbox = false;
        if (!routed.rule && backendChoice === void 0 && incognito === void 0 && budget !== "low" && this.env.SANDBOX_URL && this.sandboxHostRemembered(url)) {
          routed.rule = { type: "none" };
          stickySandbox = true;
        }
        if ((backendChoice === "sandbox" || incognito !== void 0) && !routed.rule) {
          if (budget === "low") return this.result({ error: 'backend "sandbox" / incognito needs budget "medium" or "high" (fetch-only mode has no browser)' });
          routed.rule = { type: "none" };
        }
        if (routed.rule) {
          try {
            let out = await this.browseProxied(url, routed.rule, { waitUntil, settleMs: budget === "medium" ? Math.min(settleMs, 1e3) : settleMs, budget, incognito });
            if (stickySandbox && /^(just a moment|attention required|security check)/i.test(String(out?.title || "").trim())) {
              let cleared = false;
              try {
                const sr = await this.sandboxPage?.solveTurnstile(url);
                const t = String(await this.sandboxPage?.title() || "");
                if (sr?.challengePassed !== false && !/^(just a moment|attention required|security check)/i.test(t.trim())) {
                  out = { ...out, title: t, url: this.sandboxPage?.url?.() ?? out.url, _challengePassed: true, _stickySandbox: true };
                  cleared = true;
                }
              } catch {
              }
              if (!cleared) {
                this.forgetSandboxHost(url);
                out = null;
              }
            } else if (stickySandbox && out) out._stickySandbox = true;
            if (out) {
              if (intent) {
                const pb = await matchPlaybook(this.env.API_KEYS, url, intent);
                if (pb) out._playbook = pb;
              }
              return this.result(out);
            }
            routed.rule = void 0;
          } catch (e) {
            if (stickySandbox) {
              this.forgetSandboxHost(url);
              routed.rule = void 0;
            } else
              return this.result({ success: false, error: typeof e === "string" ? e : `proxied browse failed: ${String(e?.message || e).slice(0, 300)}`, _proxy: this.proxyInfo() });
          }
        }
        if (budget === "low") {
          try {
            const controller = new AbortController();
            const fetchTimeout = setTimeout(() => controller.abort(), 15e3);
            const res = await fetch(url, {
              signal: controller.signal,
              headers: {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
              },
              redirect: "follow"
            });
            clearTimeout(fetchTimeout);
            const html = await res.text();
            const text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "").replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 5e4);
            const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
            return this.result({
              success: true,
              title: titleMatch?.[1] || "",
              url: res.url,
              content: text,
              _backend: "fetch",
              _budget: "low",
              _note: 'Fetch-only mode: no browser session, no JS execution, no interaction tools available. Use budget "medium" or "high" for full browser.'
            });
          } catch (fetchErr) {
            return this.result({
              success: false,
              error: `Fetch failed: ${String(fetchErr?.message || fetchErr).slice(0, 200)}`,
              _budget: "low",
              _hint: 'Try budget "medium" or "high" for sites requiring JS or challenge solving.'
            });
          }
        }
        if (budget === "medium") {
          settleMs = Math.min(settleMs, 1e3);
        }
        if (this.page) {
          try {
            await this.page.close();
          } catch {
          }
          this.page = null;
        }
        if (this.browser) {
          try {
            await this.browser.close();
          } catch {
          }
          this.browser = null;
          if (this.sessionStartTime) {
            mcpDailyUsage += (Date.now() - this.sessionStartTime) / 1e3;
          }
        }
        try {
          const sessions2 = await cf_puppeteer_default.sessions(this.env.BROWSER);
          for (const s of sessions2) {
            if (!s.connectionId) {
              try {
                const orphan = await cf_puppeteer_default.connect(this.env.BROWSER, s.sessionId);
                await orphan.close();
              } catch {
              }
            }
          }
        } catch {
        }
        let cfBrowserSessionId;
        try {
          this.browser = await this.launchCfBrowser();
          try {
            cfBrowserSessionId = this.browser.sessionId?.();
          } catch {
          }
          this.page = (await this.browser.pages())[0] || await this.browser.newPage();
          await this.preparePuppeteerPage(this.page);
          this.pageOrigin = "browse";
          this.sessionStartTime = Date.now();
          this.utilsInjected = false;
          this.finderInjected = false;
          this.bippyInjected = false;
          this.frameworkInfo = null;
          this.invalidateCaches();
          this.lastScanElements.clear();
          this.utilsInjected = true;
          this.finderInjected = true;
          const navTimeout = budget === "medium" ? 2e4 : 3e4;
          let lastNavError = null;
          const quotaForRetry = getQuota(this.sessionStartTime);
          effectiveRetries = Math.min(maxRetries, Math.floor(quotaForRetry.remaining / 30));
          for (let attempt = 0; attempt <= effectiveRetries; attempt++) {
            try {
              await this.page.goto(url, { waitUntil, timeout: navTimeout });
              lastNavError = null;
              break;
            } catch (navErr) {
              lastNavError = navErr;
              const errMsg = String(navErr?.message || navErr || "");
              if (!errMsg.includes("timeout") && !errMsg.includes("Timeout") && !errMsg.includes("Navigation timeout")) {
                break;
              }
              if (attempt < effectiveRetries) {
                const backoffMs = Math.min(2e3 * Math.pow(2, attempt), 8e3);
                await new Promise((r) => setTimeout(r, backoffMs));
              }
            }
          }
          if (lastNavError) throw lastNavError;
          if (String(this.page.url() || "").startsWith("chrome-error://")) throw new Error(`net error page: Chrome could not load ${url}`);
        } catch (puppeteerErr) {
          const errMsg = String(puppeteerErr?.message || puppeteerErr || "");
          if (this.env.SANDBOX_URL && (/\b(503|429)\b|Unable to create new browser|rate limit|too many/i.test(errMsg) || errMsg.includes("main frame") || errMsg.includes("too early") || errMsg.includes("Target closed") || errMsg.includes("Session closed"))) {
            let puppeteerCookies = [];
            try {
              if (this.page) puppeteerCookies = await this.page.cookies();
            } catch {
            }
            try {
              if (this.page) await this.page.close();
            } catch {
            }
            try {
              if (this.browser) await this.browser.close();
            } catch {
            }
            try {
              this.sandboxPage = new SandboxPage(this.env.SANDBOX_URL, this.env.AUTH_TOKEN, this.ctx.id.toString());
              const solveResult = await this.sandboxPage.solveTurnstile(url);
              if (puppeteerCookies.length > 0) {
                try {
                  await this.sandboxPage.setCookie(...puppeteerCookies);
                } catch {
                }
              }
              this.page = this.sandboxPage;
              this.browser = null;
              this.backend = "sandbox";
              this.sessionStartTime = Date.now();
              this.utilsInjected = false;
              this.finderInjected = false;
              this.bippyInjected = false;
              this.frameworkInfo = null;
              this.invalidateCaches();
              this.lastScanElements.clear();
              try {
                await this.page.evaluateOnNewDocument(buildUtilsInjectable());
              } catch {
              }
              try {
                await this.page.evaluateOnNewDocument(FINDER_INJECTABLE);
              } catch {
              }
              try {
                await this.page.evaluateOnNewDocument(AGENT_MODE_SCRIPT);
              } catch {
              }
              try {
                await this.page.evaluateOnNewDocument(OVERLAY_WATCH_SCRIPT);
              } catch {
              }
              try {
                await this.page.evaluateOnNewDocument(SINGLE_TAB_SCRIPT);
              } catch {
              }
              try {
                await this.page.evaluateOnNewDocument(REACT_HOOK_SHIM_SCRIPT);
              } catch {
              }
              try {
                await this.page.evaluateOnNewDocument(`window.__nexusBippyLite = ${BIPPY_LITE_SCRIPT};`);
              } catch {
              }
              await this.injectUtils();
              await this.detectFramework();
              if (this.frameworkInfo?.react) this.bippyInjected = true;
              const sbxTitle = await this.sandboxPage.title();
              const sbxViewport = await this.sandboxPage.evaluate("({width: window.innerWidth, height: window.innerHeight, pageHeight: document.documentElement.scrollHeight})");
              await this.setState({ sessionId: crypto.randomUUID(), url, backend: "sandbox" });
              this.noteSandboxHost(url);
              return this.result({
                success: true,
                title: sbxTitle,
                url,
                viewport: sbxViewport,
                framework: this.frameworkInfo,
                _backend: "sandbox",
                _escalationReason: errMsg.slice(0, 100),
                _challengePassed: solveResult?.challengePassed ?? null,
                _authTransferred: puppeteerCookies.length > 0 ? { cookies: puppeteerCookies.length } : void 0
              });
            } catch (sbxErr) {
              return this.result({
                success: false,
                error: `Sandbox escalation failed: ${String(sbxErr?.message || sbxErr).slice(0, 300)}`,
                _puppeteerError: errMsg.slice(0, 100),
                _sandboxUrl: this.env.SANDBOX_URL,
                _hasAuthToken: !!this.env.AUTH_TOKEN,
                _sessionId: this.ctx.id.toString().slice(0, 20)
              });
            }
          }
          throw puppeteerErr;
        }
        await this.injectUtils();
        await this.detectFramework();
        if (this.frameworkInfo?.react) {
          this.bippyInjected = true;
        }
        let effectiveSettle = settleMs;
        if (budget === "high" && this.frameworkInfo) {
          if (this.frameworkInfo.react || this.frameworkInfo.next || this.frameworkInfo.angular) {
            effectiveSettle = Math.max(effectiveSettle, 3e3);
          } else if (this.frameworkInfo.vue || this.frameworkInfo.svelte) {
            effectiveSettle = Math.max(effectiveSettle, 2500);
          }
        }
        if (effectiveSettle > 0) {
          await new Promise((r) => setTimeout(r, effectiveSettle));
        }
        if (this.env.SANDBOX_URL) {
          const challengeCheck = await this.page.evaluate(`(function() {
            var bodyText = document.body ? document.body.innerText : '';
            var title = document.title;

            // \u2500\u2500 Cloudflare Turnstile / Cloudflare interstitial \u2500\u2500
            var hasTurnstile = !!document.querySelector('[class*="cf-turnstile"], .cf-turnstile, #cf-turnstile-container, #cf-turnstile, [id^="cf-turnstile"], [id^="cf-chl-widget"], input[name="cf-turnstile-response"]');
            var hasChallengeForm = !!document.querySelector('#challenge-running, #challenge-form');
            var hasTurnstileScript = false;
            var scripts = document.querySelectorAll('script[src]');
            for (var i = 0; i < scripts.length; i++) {
              if (scripts[i].src.indexOf('challenges.cloudflare.com') !== -1) { hasTurnstileScript = true; break; }
            }
            var hasChallengeIframe = !!document.querySelector('iframe[src*="challenges.cloudflare.com"], iframe[src*="turnstile"]');

            // \u2500\u2500 PerimeterX / HUMAN Security \u2500\u2500
            // Press-and-hold widget: #px-captcha-wrapper, .px-captcha-* classes
            var hasPerimeterX = !!document.querySelector('#px-captcha-wrapper, .px-captcha-container, [class*="px-captcha"]');
            // PerimeterX block page typically shows "Press & Hold" text
            var hasPressAndHold = bodyText.indexOf('Press & Hold') !== -1 || bodyText.indexOf('Press and Hold') !== -1;

            // \u2500\u2500 DataDome \u2500\u2500
            // Iframe served from captcha-delivery.com or geo.captcha-delivery.com
            var hasDataDome = !!document.querySelector('iframe[src*="captcha-delivery.com"], .datadome-captcha, [id^="dd-captcha"]');

            // \u2500\u2500 Akamai Bot Manager \u2500\u2500
            // Hard block page is title="Access to this page has been denied" + "Reference ID" + AKAMAI in text
            var titleAkamaiBlock = title.indexOf('Access to this page has been denied') !== -1 ||
                                   title.indexOf('Access Denied') !== -1;
            var hasReferenceId = bodyText.indexOf('Reference ID') !== -1 || bodyText.indexOf('Reference #') !== -1;
            var hasAkamaiBlock = titleAkamaiBlock && hasReferenceId;

            // \u2500\u2500 hCaptcha \u2500\u2500
            var hasHcaptcha = !!document.querySelector('.h-captcha, [data-hcaptcha-widget-id], iframe[src*="hcaptcha.com"]');

            // \u2500\u2500 reCAPTCHA \u2500\u2500
            var hasRecaptcha = !!document.querySelector('.g-recaptcha, iframe[src*="recaptcha"]');

            // \u2500\u2500 Imperva / Incapsula \u2500\u2500
            var hasImperva = bodyText.indexOf('Incapsula incident ID') !== -1 ||
                             !!document.querySelector('iframe[src*="_Incapsula_Resource"]');

            // \u2500\u2500 Cloudflare interstitial text (auto-clearing) \u2500\u2500
            var hasChallengeText = bodyText.indexOf('Verify you are human') !== -1 ||
                                   bodyText.indexOf('Just a moment') !== -1 ||
                                   bodyText.indexOf('Checking your browser') !== -1;
            var hasChallengeTitle = title.indexOf('Just a moment') !== -1 ||
                                    title.indexOf('Attention Required') !== -1 ||
                                    title.indexOf('Security Check') !== -1;

            // Aggregate: ANY interactive vendor \u2192 escalate to sandbox.
            // (Akamai block isn't "interactive" but the puppeteer backend got
            // blocked; sandbox stealth may pass on the next attempt.)
            var hasInteractiveChallenge = hasTurnstile || hasChallengeForm || hasTurnstileScript ||
                                          hasChallengeIframe || hasPerimeterX || hasPressAndHold ||
                                          hasDataDome || hasHcaptcha || hasRecaptcha || hasImperva ||
                                          hasAkamaiBlock;
            var hasTextOnlyChallenge = !hasInteractiveChallenge && (hasChallengeText || hasChallengeTitle);

            // Identify which vendor for diagnostics + sandbox solver routing.
            var vendor = 'none';
            if (hasTurnstile || hasTurnstileScript || hasChallengeIframe) vendor = 'turnstile';
            else if (hasChallengeForm) vendor = 'cloudflare_interstitial';
            else if (hasPerimeterX || hasPressAndHold) vendor = 'perimeterx';
            else if (hasDataDome) vendor = 'datadome';
            else if (hasAkamaiBlock) vendor = 'akamai';
            else if (hasHcaptcha) vendor = 'hcaptcha';
            else if (hasRecaptcha) vendor = 'recaptcha';
            else if (hasImperva) vendor = 'imperva';

            return {
              hasInteractiveChallenge: hasInteractiveChallenge,
              hasTextOnlyChallenge: hasTextOnlyChallenge,
              vendor: vendor,
              signals: {
                hasTurnstile: hasTurnstile, hasChallengeForm: hasChallengeForm,
                hasChallengeText: hasChallengeText, hasChallengeTitle: hasChallengeTitle,
                hasTurnstileScript: hasTurnstileScript, hasChallengeIframe: hasChallengeIframe,
                hasPerimeterX: hasPerimeterX, hasPressAndHold: hasPressAndHold,
                hasDataDome: hasDataDome, hasAkamaiBlock: hasAkamaiBlock,
                hasHcaptcha: hasHcaptcha, hasRecaptcha: hasRecaptcha, hasImperva: hasImperva,
              }
            };
          })()`);
          let needsSandbox = challengeCheck?.hasInteractiveChallenge;
          if (!needsSandbox && challengeCheck?.hasTextOnlyChallenge) {
            for (let wait = 0; wait < 4; wait++) {
              await new Promise((r) => setTimeout(r, 2e3));
              const cleared = await this.page.evaluate(`(function() {
                var title = document.title;
                return !title.includes('Just a moment') && !title.includes('Attention Required') && !title.includes('Security Check');
              })()`);
              if (cleared) break;
              if (wait === 3) {
                const recheck = await this.page.evaluate(`(function() {
                  return !!(document.querySelector('[class*="cf-turnstile"], .cf-turnstile, #cf-turnstile, [id^="cf-turnstile"], [id^="cf-chl-widget"], input[name="cf-turnstile-response"], iframe[src*="challenges.cloudflare.com"], iframe[src*="turnstile"], #challenge-form'));
                })()`);
                needsSandbox = recheck;
              }
            }
          }
          if (needsSandbox) {
            const puppeteerPage = this.page;
            const puppeteerBrowser = this.browser;
            let puppeteerCookies = [];
            let puppeteerLocalStorage = {};
            try {
              puppeteerCookies = await puppeteerPage.cookies();
            } catch {
            }
            try {
              puppeteerLocalStorage = await puppeteerPage.evaluate('(() => { const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k) o[k] = localStorage.getItem(k) || ""; } return o; })()') || {};
            } catch {
            }
            try {
              this.sandboxPage = new SandboxPage(this.env.SANDBOX_URL, this.env.AUTH_TOKEN, this.ctx.id.toString());
              const solveResult = await this.sandboxPage.solveTurnstile(url);
              if (puppeteerCookies.length > 0) {
                try {
                  await this.sandboxPage.setCookie(...puppeteerCookies);
                } catch {
                }
              }
              if (Object.keys(puppeteerLocalStorage).length > 0) {
                try {
                  await this.sandboxPage.evaluate(`(function(items) { for (var k in items) localStorage.setItem(k, items[k]); })(${JSON.stringify(puppeteerLocalStorage)})`);
                } catch {
                }
              }
              try {
                await puppeteerPage.close();
              } catch {
              }
              try {
                await puppeteerBrowser.close();
              } catch {
              }
              if (this.sessionStartTime) {
                mcpDailyUsage += (Date.now() - this.sessionStartTime) / 1e3;
              }
              this.page = this.sandboxPage;
              this.browser = null;
              this.backend = "sandbox";
              this.sessionStartTime = Date.now();
              this.utilsInjected = false;
              this.finderInjected = false;
              this.bippyInjected = false;
              this.frameworkInfo = null;
              try {
                await this.page.evaluateOnNewDocument(buildUtilsInjectable());
              } catch {
              }
              try {
                await this.page.evaluateOnNewDocument(FINDER_INJECTABLE);
              } catch {
              }
              try {
                await this.page.evaluateOnNewDocument(AGENT_MODE_SCRIPT);
              } catch {
              }
              try {
                await this.page.evaluateOnNewDocument(OVERLAY_WATCH_SCRIPT);
              } catch {
              }
              try {
                await this.page.evaluateOnNewDocument(SINGLE_TAB_SCRIPT);
              } catch {
              }
              try {
                await this.page.evaluateOnNewDocument(REACT_HOOK_SHIM_SCRIPT);
              } catch {
              }
              try {
                await this.page.evaluateOnNewDocument(`window.__nexusBippyLite = ${BIPPY_LITE_SCRIPT};`);
              } catch {
              }
              await this.injectUtils();
              await this.detectFramework();
              if (this.frameworkInfo?.react) {
                await this.injectBippyLite();
              }
              const sbxTitle = await this.page.title();
              const sbxViewport = await this.page.evaluate("({width: window.innerWidth, height: window.innerHeight, pageHeight: document.documentElement.scrollHeight})");
              await this.setState({ sessionId: crypto.randomUUID(), url, backend: "sandbox" });
              let _sbxPlaybook = void 0;
              try {
                const pb = await matchPlaybook(this.env.API_KEYS, url, intent);
                if (pb) {
                  _sbxPlaybook = {
                    matchType: pb.matchType,
                    confidence: pb.confidence,
                    matchKey: pb.matchKey,
                    hint: pb.agentHint
                  };
                }
              } catch {
              }
              const lsCount = Object.keys(puppeteerLocalStorage).length;
              this.noteSandboxHost(url);
              return this.result({
                success: true,
                title: sbxTitle,
                url,
                viewport: sbxViewport,
                framework: this.frameworkInfo,
                _backend: "sandbox",
                _challengeDetected: challengeCheck.signals,
                _challengePassed: solveResult?.challengePassed ?? null,
                _authTransferred: puppeteerCookies.length > 0 || lsCount > 0 ? { cookies: puppeteerCookies.length, localStorageKeys: lsCount } : void 0,
                ..._sbxPlaybook ? { _playbook: _sbxPlaybook } : {}
              });
            } catch (sandboxError) {
              this.sandboxPage = null;
              this.page = puppeteerPage;
              this.browser = puppeteerBrowser;
              this.backend = "puppeteer";
            }
          }
        }
        this.backend = "puppeteer";
        let _challengeResult = void 0;
        if (budget === "high") {
          try {
            const autoChallenge = await this.page.evaluate(`(function() {
              var t = ${TURNSTILE_LOCATE_SCRIPT};
              return t && t.found ? { x: t.clickPoint.x, y: t.clickPoint.y, type: 'turnstile', via: t.via } : null;
            })()`);
            if (autoChallenge) {
              await new Promise((r) => setTimeout(r, 300 + Math.random() * 500));
              await this.humanMouseMove(autoChallenge.x, autoChallenge.y);
              await new Promise((r) => setTimeout(r, 100 + Math.random() * 200));
              await this.page.mouse.click(autoChallenge.x, autoChallenge.y);
              const titleBefore = await this.page.title();
              const resolved = await Promise.race([
                this.page.waitForNavigation({ timeout: 8e3 }).then(() => "navigation").catch(() => null),
                this.page.waitForFunction(
                  `document.title !== '' && !document.title.includes('Just a moment') && !document.title.includes('Attention Required') && !document.title.includes('Security Check')`,
                  { timeout: 8e3 }
                ).then(() => "titleChange").catch(() => null)
              ]);
              _challengeResult = {
                detected: true,
                type: autoChallenge.type,
                autoSolved: !!resolved,
                resolveMethod: resolved || "timeout"
              };
              const hostB = await this.currentHost();
              if (hostB) _challengeResult._banked = await this.bank({
                kind: "challenge",
                host: hostB,
                fingerprint: fnv(`turnstile|${autoChallenge.via || "auto"}`),
                recipe: { vendor: "turnstile", via: autoChallenge.via, gesture: "click", method: "browse_auto" },
                success: !!resolved,
                note: String(resolved || "timeout")
              });
            }
          } catch {
          }
        }
        const title = await this.page.title();
        const viewport = await this.page.evaluate("({width: window.innerWidth, height: window.innerHeight, pageHeight: document.documentElement.scrollHeight})");
        await this.setState({ sessionId: crypto.randomUUID(), url, backend: this.backend, browserSessionId: cfBrowserSessionId });
        let initialScreenshot;
        try {
          initialScreenshot = await this.page.screenshot({ type: "jpeg", quality: 80, encoding: "base64" });
        } catch {
        }
        let _playbook = void 0;
        try {
          const pb = await matchPlaybook(this.env.API_KEYS, url, intent);
          if (pb) {
            _playbook = {
              matchType: pb.matchType,
              confidence: pb.confidence,
              matchKey: pb.matchKey,
              hint: pb.agentHint
            };
          }
        } catch {
        }
        const browseResult = {
          success: true,
          title,
          url,
          viewport,
          framework: this.frameworkInfo,
          _backend: "puppeteer",
          _settleMs: effectiveSettle,
          ..._challengeResult ? { _challenge: _challengeResult } : {},
          ..._playbook ? { _playbook } : {},
          ...maxRetries > 0 ? { _retryConfig: { maxRetries, effectiveRetries } } : {}
        };
        if (initialScreenshot) {
          return {
            content: [
              { type: "text", text: JSON.stringify({ ...browseResult, _hasScreenshot: true, ...this.quotaField() }) },
              { type: "image", data: initialScreenshot, mimeType: "image/jpeg" }
            ]
          };
        }
        return this.result(browseResult);
      }
    );
    this.server.tool(
      "scan",
      "Smart scan of page elements with relevance scoring. Returns interactive elements sorted by importance with CSS selectors. Supports snapshots (countOnly, accessibility, errors, forms) and region filtering. Always scan before clicking.",
      {
        filter: external_exports.object({
          isInteractive: external_exports.boolean().optional().describe("Only return interactive elements"),
          hasText: external_exports.string().optional().describe("Filter elements containing this text"),
          tagName: external_exports.string().optional().describe("Filter by HTML tag"),
          role: external_exports.string().optional().describe("Filter by ARIA role"),
          id: external_exports.string().optional().describe("Filter by element ID"),
          className: external_exports.string().optional().describe("Filter by CSS class"),
          placeholder: external_exports.string().optional().describe("Filter by placeholder text"),
          name: external_exports.string().optional().describe("Filter by name attribute")
        }).optional().describe("Filter criteria \u2014 same as internal NexusSense scan"),
        region: external_exports.object({
          x: external_exports.number().optional(),
          y: external_exports.number().optional(),
          width: external_exports.number().optional(),
          height: external_exports.number().optional()
        }).optional().describe("Scan region (viewport coords)"),
        limit: external_exports.number().default(30).describe("Maximum elements to return"),
        detail: external_exports.enum(["quick", "standard", "full"]).default("standard").describe('"quick"=interactive only limit 5, "standard"=20, "full"=all fields limit 50'),
        snapshot: external_exports.object({
          countOnly: external_exports.boolean().optional().describe("Return only counts (~20 tokens)"),
          accessibility: external_exports.boolean().optional().describe("Include landmarks, headings, ARIA live regions"),
          errors: external_exports.boolean().optional().describe("Include form validation errors"),
          forms: external_exports.boolean().optional().describe("Include form field inventory")
        }).optional().describe("Aggregate page data without full element list"),
        container: external_exports.string().optional().describe("CSS selector to scope scan to a subtree"),
        includeOffscreen: external_exports.boolean().optional().describe("Include off-screen elements"),
        frameIndex: external_exports.number().optional().describe("Frame to scan (0=main, 1+=child). Use frames tool to list."),
        maxTokens: external_exports.number().optional().describe("Token budget \u2014 truncate results to fit (e.g., 500)"),
        _forceRefresh: external_exports.boolean().optional().describe("Bypass scan cache (default: use cache)"),
        _trackContent: external_exports.boolean().optional().describe("Track text content changes (for monitoring live content)")
      },
      async ({ frameIndex, maxTokens, _forceRefresh, _trackContent, ...args }) => {
        {
          const np = await this.ensurePage();
          if (np) return np;
        }
        const frame = this.getFrame(frameIndex);
        if (!this.utilsInjected) {
          await frame.evaluate(buildUtilsInjectable());
          if (!frameIndex) this.utilsInjected = true;
        }
        if (!this.finderInjected) {
          try {
            await frame.evaluate(FINDER_INJECTABLE);
            if (!frameIndex) this.finderInjected = true;
          } catch {
          }
        }
        let result;
        try {
          result = await frame.evaluate(`(${SCAN_SCRIPT})(${JSON.stringify(args)}, window.__utils)`);
        } catch (err2) {
          if (err2?.message?.includes("__utils is not defined") || err2?.message?.includes("__utils") || err2?.message?.includes("of undefined")) {
            this.utilsInjected = false;
            this.finderInjected = false;
            this.bippyInjected = false;
            await frame.evaluate(buildUtilsInjectable());
            try {
              await frame.evaluate(FINDER_INJECTABLE);
            } catch {
            }
            if (!frameIndex) {
              this.utilsInjected = true;
              this.finderInjected = true;
            }
            result = await frame.evaluate(`(${SCAN_SCRIPT})(${JSON.stringify(args)}, window.__utils)`);
          } else {
            throw err2;
          }
        }
        if (result?.elements && Array.isArray(result.elements)) {
          await this.enrichWithReactInfo(result.elements);
          const diff = this.diffScan(result.elements);
          this.updateLastScan(result.elements);
          if (diff) result._diff = diff;
          if (maxTokens && result.elements.length > 0) {
            const trunc = this.truncateToTokens(result.elements, maxTokens);
            result.elements = trunc.elements;
            result.count = trunc.elements.length;
            result._tokenEstimate = trunc.tokenEstimate;
            if (trunc.truncated) result._truncated = true;
          }
          if (!args.snapshot?.countOnly) {
            const cacheKey = this.quickHash({ detail: args.detail, region: args.region, filter: args.filter, limit: args.limit, _trackContent });
            const stableElements = result.elements.filter(
              (e) => !e.rect || e.rect.y < (result._viewportHeight || 800) - FOOTER_HEIGHT_PX
            );
            const resultHash = this.quickHash(
              stableElements.map(
                (e) => _trackContent ? `${e.tagName}:${e.id}:${e.textContent}` : `${e.tagName}:${e.id}`
              )
            );
            if (!_forceRefresh) {
              const cached = this.scanCache.get(cacheKey);
              if (cached && cached.hash === resultHash) {
                return this.result({
                  _cached: true,
                  count: cached.count,
                  summary: cached.summary + " (unchanged)",
                  _diff: diff,
                  _meta: { tokenEstimate: 25, detailLevel: args.detail, cached: true }
                });
              }
            }
            if (this.scanCache.size >= SCAN_CACHE_MAX_ENTRIES) {
              const oldestKey = this.scanCache.keys().next().value;
              if (oldestKey) this.scanCache.delete(oldestKey);
            }
            this.scanCache.set(cacheKey, {
              hash: resultHash,
              count: result.count ?? result.elements?.length ?? 0,
              summary: this.generateScanSummary(result.elements),
              timestamp: Date.now()
            });
          }
        }
        return this.result(result);
      }
    );
    this.server.tool(
      "grab",
      "Content query tool for the DOM \u2014 like grep/glob for page content. Read text, extract links/headings/tables, filter by substring or regex, get markdown. On React sites, automatically includes component name, stack, props, and source location via fiber introspection. KEY INSIGHT: 40x cheaper than screenshots for reading text (~25 tokens vs ~1000). Use scan to find elements, grab to read their content.",
      {
        selector: external_exports.string().optional().describe("CSS selector to inspect (use ONE target: selector, x/y, or selectorAll)"),
        x: external_exports.number().optional().describe("X coordinate to inspect"),
        y: external_exports.number().optional().describe("Y coordinate to inspect"),
        selectorAll: external_exports.string().optional().describe("CSS selector matching ALL elements (up to 50). Returns array of results with coordinates."),
        maxLength: external_exports.number().optional().describe("Max text chars per element (default based on detail level)"),
        extract: external_exports.enum(["text", "links", "headings", "list-items", "table", "structured"]).optional().describe("Extract specific content type. links=all <a> hrefs, headings=h1-h6, table=rows/cells, structured=all semantic content"),
        contains: external_exports.string().optional().describe("Filter: only return content containing this substring"),
        pattern: external_exports.string().optional().describe("Filter: regex pattern \u2014 only return content matching this pattern"),
        format: external_exports.enum(["full", "text", "markdown"]).optional().describe("Output format. full=structured object (default), text=textContent only, markdown=DOM converted to markdown"),
        detail: external_exports.enum(["quick", "standard", "full"]).optional().describe("Detail level: quick (500 chars, minimal), standard (2000, default), full (10000, everything)")
      },
      async (args) => {
        {
          const np = await this.ensurePage();
          if (np) return np;
        }
        const result = await this.evalWithUtils(GRAB_SCRIPT, args);
        if (result && !result.error) {
          const sel = args.selector || result.cssSelector;
          if (sel) {
            const reactInfo = await this.getReactInfo(sel);
            if (reactInfo) {
              result.react = reactInfo;
            }
          }
        }
        return this.result(result);
      }
    );
    this.server.tool(
      "screenshot",
      "Capture a screenshot of the viewport, a specific element, or a region. Auto-constrains to Anthropic vision API limits (1568px max, 4MB). Defaults to JPEG for viewport (smaller), PNG for elements.",
      {
        selector: external_exports.string().optional().describe("CSS selector to screenshot a specific element"),
        region: external_exports.object({
          x: external_exports.number(),
          y: external_exports.number(),
          width: external_exports.number(),
          height: external_exports.number()
        }).optional().describe("Bounding box to capture (viewport coordinates)"),
        format: external_exports.enum(["png", "jpeg"]).optional().describe("Image format (default: jpeg for viewport, png for element)"),
        quality: external_exports.number().min(1).max(100).default(80).describe("JPEG quality (1-100)"),
        fullPage: external_exports.boolean().default(false).describe("Capture the full scrollable page"),
        scale: external_exports.number().min(0.25).max(2).default(1).describe("Device scale factor (0.25-2)")
      },
      async ({ selector, region, format, quality, fullPage, scale }) => {
        {
          const np = await this.ensurePage();
          if (np) return np;
        }
        const effectiveFormat = format || (selector ? "png" : "jpeg");
        const mimeType = effectiveFormat === "jpeg" ? "image/jpeg" : "image/png";
        let viewportClip = null;
        if (!region && !selector && !fullPage) {
          try {
            const v = await this.page.evaluate("({w: window.innerWidth, h: window.innerHeight})");
            viewportClip = { x: 0, y: 0, width: v.w, height: v.h, scale };
          } catch {
          }
        } else if (scale !== 1 && selector) {
          try {
            await this.page.setViewport({ width: await this.page.evaluate("window.innerWidth"), height: await this.page.evaluate("window.innerHeight"), deviceScaleFactor: scale });
          } catch {
          }
        }
        const opts = {
          type: effectiveFormat,
          encoding: "base64",
          fullPage: !selector && !region && fullPage
        };
        if (effectiveFormat === "jpeg") opts.quality = quality;
        if (region) {
          opts.clip = { x: region.x, y: region.y, width: region.width, height: region.height, ...scale !== 1 ? { scale } : {} };
        } else if (viewportClip) {
          opts.clip = viewportClip;
          opts.fullPage = false;
        }
        let target = this.page;
        let targetName = region ? "region" : "viewport";
        if (selector) {
          const el = await this.page.$(selector);
          if (!el) return this.result({ error: `Element not found: ${selector}` });
          target = el;
          targetName = selector;
        }
        let data = await this.withTimeout(target.screenshot(opts), 25e3, "screenshot");
        const MAX_DIMENSION = 1568;
        const MAX_BASE64_LENGTH = 52e5;
        let constrained = false;
        const dimensions = await this.withTimeout(
          this.page.evaluate(`(function() { return { width: window.innerWidth, height: window.innerHeight }; })()`),
          1e4,
          "screenshot-dimensions"
        ).catch(() => ({ width: 1280, height: 800 }));
        let imgWidth = region ? region.width : selector ? 0 : dimensions.width;
        let imgHeight = region ? region.height : selector ? 0 : dimensions.height;
        imgWidth = Math.round(imgWidth * scale);
        imgHeight = Math.round(imgHeight * scale);
        if (selector) {
          try {
            const box = await this.page.evaluate(`(function() {
              var el = document.querySelector(${JSON.stringify(selector)});
              if (!el) return null;
              var r = el.getBoundingClientRect();
              return { width: Math.round(r.width), height: Math.round(r.height) };
            })()`);
            if (box) {
              imgWidth = box.width * scale;
              imgHeight = box.height * scale;
            }
          } catch {
          }
        }
        const longest = Math.max(imgWidth, imgHeight);
        if (longest > MAX_DIMENSION && !selector) {
          constrained = true;
          const ratio = MAX_DIMENSION / longest;
          try {
            await this.page.setViewport({
              width: Math.round(dimensions.width * ratio),
              height: Math.round(dimensions.height * ratio),
              deviceScaleFactor: scale * ratio
            });
            data = await this.page.screenshot({ ...opts, fullPage: false });
            imgWidth = Math.round(imgWidth * ratio);
            imgHeight = Math.round(imgHeight * ratio);
            await this.page.setViewport({
              width: dimensions.width,
              height: dimensions.height,
              deviceScaleFactor: scale
            });
          } catch {
          }
        }
        if (data.length > MAX_BASE64_LENGTH) {
          constrained = true;
          const qualitySteps = [60, 40, 20];
          for (const q of qualitySteps) {
            const retryOpts = { ...opts, type: "jpeg", quality: q };
            data = await target.screenshot(retryOpts);
            if (data.length <= MAX_BASE64_LENGTH) break;
          }
        }
        if (scale !== 1 && !region && !viewportClip && selector) {
          try {
            await this.page.setViewport({
              width: dimensions.width,
              height: dimensions.height,
              deviceScaleFactor: 1
            });
          } catch {
          }
        }
        const cacheCheck = await this.checkScreenshotCache(data, JSON.stringify({ selector, region, format: effectiveFormat, quality, fullPage, scale }));
        if (cacheCheck.isDuplicate) {
          return this.result({
            _screenshotCached: true,
            hash: cacheCheck.hash.slice(0, 12),
            message: "Screenshot identical to previous capture \u2014 skipped to save tokens",
            width: imgWidth,
            height: imgHeight,
            format: effectiveFormat,
            target: targetName,
            _cacheStats: this.screenshotStats
          });
        }
        return {
          content: [
            { type: "image", data, mimeType },
            {
              type: "text",
              text: JSON.stringify({
                width: imgWidth,
                height: imgHeight,
                format: effectiveFormat,
                target: targetName,
                constrained,
                sizeBytes: Math.round(data.length * 0.75),
                hash: cacheCheck.hash.slice(0, 12),
                ...this.quotaField()
              })
            }
          ]
        };
      }
    );
    this.server.tool(
      "click",
      "Click an element by CSS selector, coordinates, or visible text. Default: human-like Bezier mouse movement. Supports frameIndex for iframe clicks and waitFor for dynamic content.",
      {
        selector: external_exports.string().optional().describe("CSS selector to click"),
        ref: external_exports.string().optional().describe('Snapshot ref (e.g. "e12") from the snapshot tool \u2014 resolves to the element without a selector'),
        text: external_exports.string().optional().describe("Click the element with this visible text (exact text preferred, then the tightest match; never a phrase stitched across separate elements)"),
        within: external_exports.string().optional().describe('With text: only match inside this container (CSS selector, e.g. [data-window-type="DBPEN"]) \u2014 use it when the result reports `ambiguous`'),
        x: external_exports.number().optional().describe("X coordinate to click"),
        y: external_exports.number().optional().describe("Y coordinate to click"),
        button: external_exports.enum(["left", "right", "middle"]).default("left").describe("Mouse button"),
        doubleClick: external_exports.boolean().default(false).describe("Double-click"),
        humanLike: external_exports.boolean().default(true).describe("Use Bezier mouse movement (default true). Set false for precise injectable click."),
        frameIndex: external_exports.number().optional().describe("Frame to click in (0=main, 1+=child frames). Use frames tool to list."),
        waitFor: waitForSchema
      },
      async ({ selector, ref, text, within, x, y, button, doubleClick, humanLike, frameIndex, waitFor }) => {
        {
          const np = await this.ensurePage();
          if (np) return np;
        }
        let textAmbiguity;
        let textSubmenu;
        const urlBeforeClick = this.safeUrl();
        if (ref) {
          const rr = this.resolveRef(ref);
          if (!rr) return this.refError(ref);
          selector = rr.selector;
          if (rr.frameIndex !== void 0) frameIndex = rr.frameIndex;
        }
        const frame = this.getFrame(frameIndex);
        if (text && !selector && x === void 0) {
          const found = await frame.evaluate(`${TEXT_TARGET_SCRIPT}(${JSON.stringify(text)}, ${JSON.stringify(within ? { within } : {})})`);
          if (found?.error) return this.result({ error: found.error });
          textAmbiguity = found?.ambiguous;
          textSubmenu = found?.submenu;
          if (!found.found) {
            const hh = found?.hiddenHref;
            return this.result({ error: hh ? `The link "${text}" exists but is hidden (collapsed menu) \u2014 browse to its href directly: ${hh}` : `No clickable element found with text: "${text}"${found?.spansElements ? " (those words only appear across separate elements)" : ""}`, ...hh ? { href: hh } : {}, ...found?.suggestions?.length ? { suggestions: found.suggestions, hint: "Click one of the suggestions by its exact text" } : {} });
          }
          x = found.x;
          y = found.y;
        }
        let result;
        if (humanLike) {
          let cx = x, cy = y;
          if (selector) {
            let el2 = await frame.$(selector);
            if (!el2 && this.backend !== "sandbox") {
              try {
                el2 = await frame.$(`pierce/${selector}`);
              } catch {
              }
            }
            if (!el2) {
              const deep = await frame.evaluate(`(function(s){ ${DEEP_QUERY_FNS} return !!__nxDq(s); })(${JSON.stringify(selector)})`).catch(() => false);
              if (!deep) return this.result({ error: `Selector not found: ${selector}` });
            }
            try {
              await frame.evaluate(`(function(s){ ${DEEP_QUERY_FNS} var e = __nxDq(s); if (e) e.scrollIntoView({ behavior: 'instant', block: 'center', inline: 'center' }); })(${JSON.stringify(selector)})`);
            } catch {
            }
            const box = el2 ? await el2.boundingBox() : null;
            if (box) {
              cx = box.x + box.width / 2;
              cy = box.y + box.height / 2;
              const HIT = `(function(s,x,y){${DEEP_QUERY_FNS} var e=__nxDq(s);if(!e)return 'gone';var t=__nxDeepPoint(x,y);if(!t)return 'offscreen';if(t===e||e.contains(t)||t.contains(e))return 'ok';var d=t.tagName.toLowerCase()+(t.id?'#'+t.id:'')+(typeof t.className==='string'&&t.className.trim()?'.'+t.className.trim().split(/\\s+/)[0]:'');return 'covered:'+d.slice(0,60);})`;
              let hit = String(await frame.evaluate(`${HIT}(${JSON.stringify(selector)},${cx},${cy})`).catch(() => "ok"));
              if (hit !== "ok" && hit !== "gone") {
                try {
                  await frame.evaluate(`(function(s){${DEEP_QUERY_FNS} var e=__nxDq(s);if(e){e.scrollIntoView({ behavior: 'instant', block:'start',inline:'center' });window.scrollBy({ top: -140, behavior: 'instant' });}})(${JSON.stringify(selector)})`);
                } catch {
                }
                const box2 = el2 ? await el2.boundingBox() : null;
                if (box2) {
                  cx = box2.x + box2.width / 2;
                  cy = box2.y + box2.height / 2;
                }
                hit = String(await frame.evaluate(`${HIT}(${JSON.stringify(selector)},${cx},${cy})`).catch(() => "ok"));
              }
              if (hit !== "ok" && hit !== "gone") {
                result = await frame.evaluate(`(${CLICK_SCRIPT})(${JSON.stringify({ selector, button, clickCount: doubleClick ? 2 : 1 })})`);
                if (result && typeof result === "object") result.occluded = hit.replace(/^covered:/, "");
                cx = void 0;
              }
            } else {
              result = await frame.evaluate(`(${CLICK_SCRIPT})(${JSON.stringify({ selector, button, clickCount: doubleClick ? 2 : 1 })})`);
              cx = void 0;
            }
          }
          if (cx !== void 0 && cy !== void 0) {
            let described = { tagName: "unknown" };
            try {
              const descSel = selector || (text ? '[data-nexus-text-target="1"]' : null);
              const d = await frame.evaluate(`(function(s,x,y){${DEEP_QUERY_FNS} var e = s ? __nxDq(s) : __nxDeepPoint(x,y); if(!e) return null; return { tagName: e.tagName.toLowerCase(), id: e.id || undefined, name: e.getAttribute('name') || undefined, type: e.getAttribute('type') || undefined, role: e.getAttribute('role') || undefined, text: ((e.innerText || e.textContent || e.value || e.getAttribute('aria-label') || '') + '').trim().replace(/\\s+/g, ' ').slice(0, 80) || undefined }; })(${JSON.stringify(descSel)},${cx},${cy})`);
              if (d && typeof d === "object") described = d;
            } catch {
            }
            await this.humanMouseMove(cx, cy);
            await this.page.mouse.click(cx, cy, {
              button,
              clickCount: doubleClick ? 2 : 1
            });
            result = { success: true, element: described, x: cx, y: cy };
          }
        } else {
          result = await frame.evaluate(
            `(${CLICK_SCRIPT})(${JSON.stringify({ selector, x, y, button, clickCount: doubleClick ? 2 : 1 })})`
          );
        }
        this.invalidateCaches();
        let waitResult;
        if (waitFor) {
          waitResult = await this.executeWaitFor(waitFor);
        } else {
          await new Promise((r) => setTimeout(r, 200));
        }
        let url = (await this.pageInfo().catch(() => ({ url: this.page.url(), title: "" }))).url;
        const el = result?.element || {};
        const linkLike = ["a", "var", "option", "li"].includes(String(el.tagName || "").toLowerCase()) || ["link", "option", "menuitem"].includes(String(el.role || ""));
        if (!waitFor && linkLike && url === urlBeforeClick) {
          for (let i = 0; i < 3 && url === urlBeforeClick; i++) {
            await new Promise((r) => setTimeout(r, 200));
            url = (await this.pageInfo().catch(() => ({ url, title: "" }))).url;
          }
        }
        const title = await this.page.title().catch(() => "");
        const menuNote = textSubmenu && textSubmenu.length && url === urlBeforeClick ? { submenu: textSubmenu, hint: "This is a menu trigger; its menu links are hidden (hover/JS menu). browse() to one of these hrefs directly." } : {};
        return this.result({ ...result, url, title, waitFor: waitResult, ...textAmbiguity ? { ambiguous: textAmbiguity } : {}, ...menuNote });
      }
    );
    this.server.tool(
      "computer_use",
      'Drive the page with the Anthropic computer-use action set: screenshot, left/right/middle/double/triple_click, left_click_drag, mouse_move, type, key (xdotool names like "ctrl+l", "Return"), hold_key, scroll, wait, cursor_position, left_mouse_down/up. coordinate=[x,y] in viewport pixels. screenshotAfter=true returns a fresh viewport JPEG with the result. Frames are PIXEL-DIFFED by default: a screenshot/screenshotAfter that shows nothing new returns {unchanged:true} with no image, a small change returns only the changed region (with its viewport box), large changes and navigations return a full frame; diff:false forces a full frame. zoom re-renders a region at up to 4x (lossless PNG) to read small icons/text.',
      {
        action: external_exports.enum(COMPUTER_USE_ACTIONS).describe("The action to perform"),
        coordinate: external_exports.tuple([external_exports.number(), external_exports.number()]).optional().describe("[x, y] viewport pixels for click/move/scroll (defaults to the current cursor)"),
        start_coordinate: external_exports.tuple([external_exports.number(), external_exports.number()]).optional().describe("[x, y] drag start (left_click_drag)"),
        text: external_exports.string().optional().describe("Text to type (type) or key combo (key / hold_key)"),
        scroll_direction: external_exports.enum(["up", "down", "left", "right"]).optional().describe("scroll direction (default down)"),
        scroll_amount: external_exports.number().optional().describe("scroll clicks (~100px each, default 3)"),
        duration: external_exports.number().optional().describe("seconds for wait / hold_key (max 10)"),
        screenshotAfter: external_exports.boolean().default(false).describe("Attach a viewport screenshot after the action"),
        region: external_exports.tuple([external_exports.number(), external_exports.number(), external_exports.number(), external_exports.number()]).optional().describe("zoom: [x1, y1, x2, y2] in viewport pixels \u2014 the area to inspect up close (or pass coordinate for a 160x100 area around a point)"),
        zoom_scale: external_exports.number().min(1).max(4).optional().describe("zoom: render density 1-4 (default: as high as fits 1568 px, max 4)"),
        diff: external_exports.boolean().optional().describe("screenshot / screenshotAfter: default true = pixel-diff against the last frame you received (unchanged \u2192 no image; small change \u2192 only the changed region with its viewport box). false = always a full frame.")
      },
      async (a) => {
        {
          const np = await this.ensurePage();
          if (np) return np;
        }
        let vw = 1280, vh = 720;
        try {
          const v = await this.page.evaluate("({w:window.innerWidth,h:window.innerHeight})");
          if (v?.w) {
            vw = v.w;
            vh = v.h;
          }
        } catch {
        }
        const c = clampCoordinate(a.coordinate, vw, vh) ?? this.cursorPos;
        const sleep2 = (ms) => new Promise((r) => setTimeout(r, ms));
        const out = { action: a.action };
        let mutating = true;
        const sandbox = this.backend === "sandbox";
        const modName = (m) => sandbox ? { Control: "ctrl", Alt: "alt", Shift: "shift", Meta: "super" }[m] || m : m;
        try {
          switch (a.action) {
            case "screenshot": {
              const settledMs = Date.now() - this.lastMutationAt < 3e3 ? await this.waitVisualSettle(vw, vh) : void 0;
              const blocks = await this.cuFrame(vw, vh, { diff: a.diff !== false, quality: 70, meta: { action: "screenshot", viewport: { width: vw, height: vh }, cursor: this.cursorPos, ...settledMs !== void 0 ? { settledMs } : {} } });
              if (!blocks) return this.result({ error: "screenshot failed" });
              return { content: blocks };
            }
            case "cursor_position":
              mutating = false;
              out.coordinate = this.cursorPos;
              break;
            case "wait":
              mutating = false;
              await sleep2(Math.min(Math.max(a.duration ?? 1, 0), 10) * 1e3);
              out.waited_s = Math.min(Math.max(a.duration ?? 1, 0), 10);
              break;
            case "mouse_move":
              await this.humanMouseMove(c[0], c[1]);
              this.cursorPos = c;
              out.coordinate = c;
              mutating = false;
              break;
            case "left_click":
            case "right_click":
            case "middle_click":
            case "double_click":
            case "triple_click": {
              const button = a.action === "right_click" ? "right" : a.action === "middle_click" ? "middle" : "left";
              const clickCount = a.action === "double_click" ? 2 : a.action === "triple_click" ? 3 : 1;
              await this.humanMouseMove(c[0], c[1]);
              this.cursorPos = c;
              await this.page.mouse.click(c[0], c[1], { button, clickCount });
              out.coordinate = c;
              out.button = button;
              out.clickCount = clickCount;
              break;
            }
            case "left_click_drag": {
              const from = clampCoordinate(a.start_coordinate, vw, vh) ?? this.cursorPos;
              await this.page.mouse.move(from[0], from[1]);
              await this.page.mouse.down();
              await this.humanMouseMove(c[0], c[1]);
              await this.page.mouse.up();
              this.cursorPos = c;
              out.from = from;
              out.to = c;
              break;
            }
            case "left_mouse_down":
              await this.page.mouse.down();
              break;
            case "left_mouse_up":
              await this.page.mouse.up();
              break;
            case "type": {
              if (!a.text) return this.result({ error: "type needs text" });
              await this.humanType(a.text);
              out.typed = a.text.length;
              break;
            }
            case "key": {
              if (!a.text) return this.result({ error: 'key needs text (e.g. "ctrl+l", "Return")' });
              const { modifiers, key } = parseKeyCombo(a.text);
              {
                const combo = [...modifiers.map((m) => String(m).toLowerCase()), String(key).toLowerCase()].join("+");
                const nav = { "alt+arrowleft": "back", "alt+left": "back", "browserback": "back", "alt+arrowright": "forward", "alt+right": "forward", "browserforward": "forward", "f5": "reload", "ctrl+r": "reload", "control+r": "reload" }[combo];
                if (nav) {
                  try {
                    if (nav === "back") await this.page.goBack({ waitUntil: "domcontentloaded", timeout: 2e4 });
                    else if (nav === "forward") await this.page.goForward({ waitUntil: "domcontentloaded", timeout: 2e4 });
                    else await this.page.reload({ waitUntil: "domcontentloaded", timeout: 2e4 });
                  } catch {
                    try {
                      await this.page.evaluate(nav === "back" ? "history.back()" : nav === "forward" ? "history.forward()" : "location.reload()");
                      await sleep2(1500);
                    } catch {
                    }
                  }
                  if (this.backend === "sandbox" && this.sandboxPage) {
                    try {
                      await this.sandboxPage.syncUrl();
                    } catch {
                    }
                  }
                  out.key = key;
                  out.modifiers = modifiers;
                  out.navigation = nav;
                  break;
                }
              }
              for (const m of modifiers) await this.page.keyboard.down(modName(m));
              try {
                await this.page.keyboard.press(key);
              } finally {
                for (const m of [...modifiers].reverse()) await this.page.keyboard.up(modName(m));
              }
              out.key = key;
              out.modifiers = modifiers;
              break;
            }
            case "hold_key": {
              if (!a.text) return this.result({ error: "hold_key needs text" });
              const { key } = parseKeyCombo(a.text);
              const ms = Math.min(Math.max(a.duration ?? 1, 0), 10) * 1e3;
              await this.page.keyboard.down(modName(key));
              await sleep2(ms);
              await this.page.keyboard.up(modName(key));
              out.key = key;
              out.held_ms = ms;
              break;
            }
            case "scroll": {
              const dir = a.scroll_direction ?? "down";
              const d = scrollDeltas(dir, a.scroll_amount ?? 3);
              await this.humanMouseMove(c[0], c[1]);
              this.cursorPos = c;
              if (!sandbox && typeof this.page.mouse.wheel === "function") await this.page.mouse.wheel({ deltaX: d.deltaX, deltaY: d.deltaY });
              else if (sandbox && typeof this.page.wheel === "function") {
                try {
                  await this.page.wheel(c[0], c[1], d.deltaX, d.deltaY);
                } catch {
                  await this.evalScript(SCROLL_SCRIPT, { x: c[0], y: c[1], direction: dir, amount: Math.abs(d.deltaX || d.deltaY), behavior: "instant" });
                }
              } else await this.evalScript(SCROLL_SCRIPT, { x: c[0], y: c[1], direction: dir, amount: Math.abs(d.deltaX || d.deltaY), behavior: "instant" });
              out.coordinate = c;
              out.direction = dir;
              out.px = Math.abs(d.deltaX || d.deltaY);
              break;
            }
            case "zoom": {
              let r = a.region;
              if (!r && a.coordinate) {
                const [cx, cy] = a.coordinate;
                r = [cx - 80, cy - 50, cx + 80, cy + 50];
              }
              if (!r) return this.result({ error: "zoom needs region [x1, y1, x2, y2] (viewport pixels) or coordinate [x, y]" });
              const x1 = Math.max(0, Math.min(r[0], r[2])), y1 = Math.max(0, Math.min(r[1], r[3]));
              const x2 = Math.min(vw, Math.max(r[0], r[2])), y2 = Math.min(vh, Math.max(r[1], r[3]));
              const w = x2 - x1, h = y2 - y1;
              if (w < 4 || h < 4) return this.result({ error: `zoom region too small after clamping to the viewport (${Math.round(w)}x${Math.round(h)})` });
              const scale = Math.round(Math.max(1, Math.min(4, a.zoom_scale ?? 1568 / Math.max(w, h))) * 100) / 100;
              const data = await this.withTimeout(this.page.screenshot({ type: "png", encoding: "base64", clip: { x: x1, y: y1, width: w, height: h, scale } }), 25e3, "zoom");
              if (!data) return this.result({ error: "zoom capture returned no image" });
              const meta = {
                action: "zoom",
                region: [x1, y1, x2, y2].map((v) => Math.round(v)),
                scale,
                image: [Math.round(w * scale), Math.round(h * scale)],
                note: `To act on something in this image: viewport_x = ${Math.round(x1)} + image_x / ${scale}, viewport_y = ${Math.round(y1)} + image_y / ${scale}`
              };
              return { content: [{ type: "image", data, mimeType: "image/png" }, { type: "text", text: JSON.stringify(meta) }] };
            }
          }
        } catch (e) {
          return this.result({ ...out, error: String(e?.message || e) });
        }
        if (mutating) {
          this.invalidateCaches();
          await sleep2(150);
          this.lastMutationAt = Date.now();
        }
        if (a.screenshotAfter && mutating) out.settledMs = await this.waitVisualSettle(vw, vh);
        try {
          const pi = await this.pageInfo();
          out.url = pi.url;
          out.title = pi.title;
        } catch {
        }
        if (a.screenshotAfter) {
          const blocks = await this.cuFrame(vw, vh, { diff: a.diff !== false, quality: 60, meta: out });
          if (blocks) return { content: blocks };
        }
        return this.result(out);
      }
    );
    this.server.tool(
      "type",
      "Type text into an input. Default: human-like variable keystroke timing. humanLike=false uses React-compatible native value setters. Supports frameIndex and waitFor.",
      {
        text: external_exports.string().describe("Text to type"),
        selector: external_exports.string().optional().describe("CSS selector to focus before typing"),
        ref: external_exports.string().optional().describe('Snapshot ref (e.g. "e12") from the snapshot tool'),
        x: external_exports.number().optional().describe("X coordinate of element"),
        y: external_exports.number().optional().describe("Y coordinate of element"),
        clear: external_exports.boolean().default(false).describe("Clear existing text before typing"),
        pressEnter: external_exports.boolean().default(false).describe("Press Enter after typing (submits forms)"),
        humanLike: external_exports.boolean().default(true).describe("Use variable keystroke timing (default true). Set false for React-compatible injectable."),
        frameIndex: external_exports.number().optional().describe("Frame to type in (0=main, 1+=child frames)"),
        waitFor: waitForSchema
      },
      async ({ waitFor, humanLike, frameIndex, ref, ...args }) => {
        {
          const np = await this.ensurePage();
          if (np) return np;
        }
        if (ref) {
          const rr = this.resolveRef(ref);
          if (!rr) return this.refError(ref);
          args.selector = rr.selector;
          if (rr.frameIndex !== void 0) frameIndex = rr.frameIndex;
        }
        const frame = this.getFrame(frameIndex);
        let result;
        if (humanLike) {
          if (args.selector) {
            let el = await frame.$(args.selector);
            if (!el && this.backend !== "sandbox") {
              try {
                el = await frame.$(`pierce/${args.selector}`);
              } catch {
              }
            }
            if (el) await el.click();
            else {
              const ok = await frame.evaluate(`(function(s){${DEEP_QUERY_FNS} var e=__nxDq(s); if(!e) return false; try{ e.scrollIntoView({block:'center'}); e.focus(); }catch(x){} return true; })(${JSON.stringify(args.selector)})`).catch(() => false);
              if (!ok) return this.result({ error: `Selector not found: ${args.selector}` });
            }
          } else if (args.x !== void 0 && args.y !== void 0) {
            await this.humanMouseMove(args.x, args.y);
            await this.page.mouse.click(args.x, args.y);
          }
          let clearNote;
          if (args.clear) clearNote = await this.clearFocusedField(frame, args.selector);
          await this.humanType(args.text);
          let finalValue = await this.readFieldValue(frame, args.selector);
          let repaired;
          if (finalValue !== null && !fieldHoldsTyped(finalValue, args.text)) {
            await this.clearFocusedField(frame, args.selector).catch(() => void 0);
            await this.page.keyboard.type(args.text, { delay: 60 });
            finalValue = await this.readFieldValue(frame, args.selector);
            repaired = "retyped slowly";
            if (finalValue !== null && !fieldHoldsTyped(finalValue, args.text) && args.selector) {
              await frame.evaluate(`(function(s, v){${DEEP_QUERY_FNS} var e=__nxDq(s) || document.activeElement; if(!e) return false;
                var proto = e.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
                var d = Object.getOwnPropertyDescriptor(proto, 'value'); if (d && d.set) d.set.call(e, v); else e.value = v;
                e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); return true;
              })(${JSON.stringify(args.selector)}, ${JSON.stringify(args.text)})`).catch(() => false);
              finalValue = await this.readFieldValue(frame, args.selector);
              repaired = "set via native setter + input/change events";
            }
            if (finalValue !== null && !fieldHoldsTyped(finalValue, args.text)) {
              return this.result({ success: false, error: `Typing did not stick: the field reads "${finalValue.slice(0, 60)}" after a slow retype and a native-setter set (expected "${args.text.slice(0, 60)}"). The page may rewrite the field (input mask / autocomplete); try clicking a suggestion, a different field, or a URL parameter.`, value: finalValue });
            }
          }
          if (args.pressEnter) {
            await new Promise((r) => setTimeout(r, 50 + Math.random() * 100));
            await this.page.keyboard.press("Enter");
          }
          result = {
            success: true,
            typed: args.text.length + " chars",
            ...finalValue !== null ? { value: finalValue } : {},
            ...clearNote ? { clear: clearNote } : {},
            ...repaired ? { repaired } : {},
            ...finalValue !== null && !fieldHoldsTyped(finalValue, args.text) ? { warning: `The field now reads "${finalValue.slice(0, 60)}" \u2014 it does not match what was typed (prefilled text kept, an input mask, or autocomplete). Retry with clear:true, or humanLike:false.` } : {}
          };
        } else {
          const injectArgs = { ...args, pressEnter: false };
          result = await Promise.race([
            frame.evaluate(`(${TYPE_SCRIPT})(${JSON.stringify(injectArgs)})`),
            new Promise((_, reject) => setTimeout(() => reject(new Error("type injectable evaluate timed out (10s) \u2014 likely a form submit destroyed the context")), 1e4))
          ]).catch((e) => ({ success: false, error: String(e?.message || e) }));
          if (args.pressEnter && result?.success !== false) {
            await new Promise((r) => setTimeout(r, 50));
            try {
              await this.page.keyboard.press("Enter");
            } catch {
            }
          }
        }
        this.invalidateCaches();
        let waitResult;
        if (waitFor) {
          waitResult = await this.executeWaitFor(waitFor);
        }
        return this.result({ ...result, waitFor: waitResult });
      }
    );
    this.server.tool(
      "keypress",
      "Press a keyboard key with optional modifiers. Dispatches keydown, keypress (for printable), keyup events. Supports repeat count.",
      {
        key: external_exports.string().describe('Key to press (e.g., "Enter", "Tab", "Escape", "ArrowDown", "a")'),
        selector: external_exports.string().optional().describe("CSS selector to focus before pressing"),
        ref: external_exports.string().optional().describe('Snapshot ref (e.g. "e12") from the snapshot tool'),
        x: external_exports.number().optional().describe("X coordinate of target element"),
        y: external_exports.number().optional().describe("Y coordinate of target element"),
        modifiers: external_exports.object({
          ctrl: external_exports.boolean().optional(),
          shift: external_exports.boolean().optional(),
          alt: external_exports.boolean().optional(),
          meta: external_exports.boolean().optional()
        }).optional().describe("Modifier keys to hold"),
        repeat: external_exports.number().optional().describe("Number of times to repeat the keypress")
      },
      async (args) => {
        {
          const np = await this.ensurePage();
          if (np) return np;
        }
        if (args.ref) {
          const rr = this.resolveRef(args.ref);
          if (!rr) return this.refError(args.ref);
          args = { ...args, selector: rr.selector, ref: void 0 };
        }
        try {
          if (args.selector) {
            const ok = await this.page.evaluate(`(function(s){${DEEP_QUERY_FNS} var e=__nxDq(s); if(!e) return false; try{ e.focus(); }catch(x){} return true; })(${JSON.stringify(args.selector)})`);
            if (!ok) return this.result({ success: false, error: `Selector not found: ${args.selector}` });
          } else if (args.x !== void 0 && args.y !== void 0) {
            await this.humanMouseMove(args.x, args.y);
            await this.page.mouse.click(args.x, args.y);
          }
          const mods = [["ctrl", "Control"], ["shift", "Shift"], ["alt", "Alt"], ["meta", "Meta"]].filter(([k]) => args.modifiers?.[k]).map(([, n]) => n);
          const key = args.key.length === 1 ? args.key : { Esc: "Escape", Return: "Enter", Page_Down: "PageDown", Page_Up: "PageUp", Down: "ArrowDown", Up: "ArrowUp", Left: "ArrowLeft", Right: "ArrowRight", Space: " " }[args.key] ?? args.key;
          for (let i = 0; i < Math.max(1, Math.min(args.repeat ?? 1, 100)); i++) {
            for (const m of mods) await this.page.keyboard.down(m);
            await this.page.keyboard.press(key);
            for (const m of [...mods].reverse()) await this.page.keyboard.up(m);
          }
          this.invalidateCaches();
          const focus = await this.page.evaluate(`(function(){ var e=document.activeElement; var g=0; while(e && e.shadowRoot && e.shadowRoot.activeElement && g++<10) e=e.shadowRoot.activeElement; if(!e) return null;
            var sel = ''; try { if ('selectionStart' in e && e.selectionStart !== null) sel = String(e.value || '').slice(e.selectionStart, e.selectionEnd); } catch(x){}
            return { tagName: e.tagName.toLowerCase(), id: e.id || undefined, selected: sel ? sel.slice(0, 60) : undefined }; })()`).catch(() => null);
          return this.result({ success: true, key, modifiers: mods, repeat: args.repeat ?? 1, trusted: true, focus });
        } catch {
        }
        const result = await this.evalScript(KEYPRESS_SCRIPT, args);
        this.invalidateCaches();
        return this.result(result);
      }
    );
    this.server.tool(
      "scroll",
      'Scroll the page or a specific element. Supports waitFor for lazy-loaded content and infinite scroll patterns. Example: scroll({ direction: "down", amount: 500, waitFor: { selector: ".lazy-loaded" } })',
      {
        direction: external_exports.enum(["up", "down", "left", "right"]).describe("Scroll direction"),
        amount: external_exports.number().default(300).describe("Pixels to scroll (default 300)"),
        selector: external_exports.string().optional().describe("Scroll within a specific element"),
        ref: external_exports.string().optional().describe("Snapshot ref of the element to scroll within"),
        x: external_exports.number().optional().describe("X coordinate of scrollable element"),
        y: external_exports.number().optional().describe("Y coordinate of scrollable element"),
        behavior: external_exports.enum(["smooth", "instant"]).default("smooth").describe("Scroll animation"),
        frameIndex: external_exports.number().optional().describe("Frame to scroll in (0=main, 1+=child)"),
        waitFor: waitForSchema
      },
      async ({ waitFor, frameIndex, ref, ...args }) => {
        {
          const np = await this.ensurePage();
          if (np) return np;
        }
        if (ref) {
          const rr = this.resolveRef(ref);
          if (!rr) return this.refError(ref);
          args.selector = rr.selector;
          if (rr.frameIndex !== void 0) frameIndex = rr.frameIndex;
        }
        const frame = this.getFrame(frameIndex);
        const result = await frame.evaluate(`(${SCROLL_SCRIPT})(${JSON.stringify(args)})`);
        this.invalidateCaches();
        let waitResult;
        if (waitFor) {
          waitResult = await this.executeWaitFor(waitFor);
        }
        return this.result({ ...result, waitFor: waitResult });
      }
    );
    this.server.tool(
      "hover",
      "Hover over an element. Default: human-like Bezier mouse movement. Dispatches pointer and mouse hover events.",
      {
        selector: external_exports.string().optional().describe("CSS selector to hover over"),
        ref: external_exports.string().optional().describe('Snapshot ref (e.g. "e12") from the snapshot tool'),
        x: external_exports.number().optional().describe("X coordinate to hover at"),
        y: external_exports.number().optional().describe("Y coordinate to hover at"),
        duration: external_exports.number().default(100).describe("How long to hover in milliseconds"),
        humanLike: external_exports.boolean().default(true).describe("Bezier mouse movement (default true)"),
        frameIndex: external_exports.number().optional().describe("Frame (0=main, 1+=child)")
      },
      async ({ humanLike, frameIndex, ref, ...args }) => {
        {
          const np = await this.ensurePage();
          if (np) return np;
        }
        if (ref) {
          const rr = this.resolveRef(ref);
          if (!rr) return this.refError(ref);
          args.selector = rr.selector;
          if (rr.frameIndex !== void 0) frameIndex = rr.frameIndex;
        }
        const frame = this.getFrame(frameIndex);
        let result;
        if (humanLike) {
          let hx = args.x, hy = args.y;
          if (args.selector) {
            const el = await frame.$(args.selector);
            if (!el) return this.result({ error: `Selector not found: ${args.selector}` });
            const box = await el.boundingBox();
            if (box) {
              hx = box.x + box.width / 2;
              hy = box.y + box.height / 2;
            }
          }
          if (hx !== void 0 && hy !== void 0) {
            await this.humanMouseMove(hx, hy);
            result = { success: true, x: hx, y: hy };
          } else {
            result = await frame.evaluate(`(${HOVER_SCRIPT})(${JSON.stringify(args)})`);
          }
        } else {
          result = await frame.evaluate(`(${HOVER_SCRIPT})(${JSON.stringify(args)})`);
        }
        if (args.duration > 0) {
          await new Promise((r) => setTimeout(r, args.duration));
        }
        this.invalidateCaches();
        return this.result(result);
      }
    );
    this.server.tool(
      "select",
      "Set value on form controls: <select> dropdowns, range/number inputs, checkboxes, radio buttons. Uses React-compatible native setters.",
      {
        selector: external_exports.string().optional().describe("CSS selector of the form control"),
        ref: external_exports.string().optional().describe('Snapshot ref (e.g. "e12") from the snapshot tool'),
        value: external_exports.string().optional().describe("Value to set (for select, range, number inputs)"),
        checked: external_exports.boolean().optional().describe("Checked state (for checkbox/radio)")
      },
      async (args) => {
        {
          const np = await this.ensurePage();
          if (np) return np;
        }
        if (args.ref) {
          const rr = this.resolveRef(args.ref);
          if (!rr) return this.refError(args.ref);
          args = { ...args, selector: rr.selector, ref: void 0 };
        }
        if (!args.selector) return this.result({ error: "select needs a selector or a ref" });
        const result = await this.evalScript(SELECT_SCRIPT, args);
        if (result && result.success === false && /expected <select>/i.test(String(result.error || "")) && args.value !== void 0) {
          const want = String(args.value);
          const kind = await this.page.evaluate(`(function(sel){ var el = document.querySelector(sel); if (!el) return null; return (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') ? 'input' : 'button'; })(${JSON.stringify(args.selector)})`).catch(() => null);
          const pick = `(function(want){ want = want.toLowerCase().trim();
            var cands = document.querySelectorAll('[role="option"], [role="menuitem"], [role="menuitemradio"], li, [class*="option"], [class*="Option"], [class*="item"]');
            var best = null, bestScore = 0;
            for (var i = 0; i < cands.length; i++) { var c = cands[i]; var r = c.getBoundingClientRect(); if (r.width < 2 || r.height < 2) continue;
              var t = (c.innerText || c.textContent || '').replace(/\\s+/g, ' ').trim().toLowerCase(); if (!t || t.length > 120) continue;
              var sc = t === want ? 3 : (t.indexOf(want) === 0 ? 2 : (t.indexOf(want) >= 0 ? 1 : 0)); if (sc > bestScore) { bestScore = sc; best = c; } }
            if (!best) return null; best.scrollIntoView({ behavior: 'instant', block: 'center' }); var r2 = best.getBoundingClientRect(); return { x: r2.x + r2.width / 2, y: r2.y + r2.height / 2, text: (best.innerText || '').trim().slice(0, 60) }; })(${JSON.stringify(want)})`;
          try {
            if (kind === "input") {
              const el = await this.page.$(args.selector);
              if (el) {
                await el.click();
                await this.clearFocusedField(this.page, args.selector);
                await this.humanType(want);
              }
              await new Promise((res) => setTimeout(res, 700));
            } else {
              const el = await this.page.$(args.selector);
              if (el) await el.click();
              await new Promise((res) => setTimeout(res, 500));
            }
            const opt = await this.page.evaluate(pick).catch(() => null);
            if (opt) {
              await this.humanMouseMove(opt.x, opt.y);
              await this.page.mouse.click(opt.x, opt.y);
              this.invalidateCaches();
              return this.result({ success: true, via: kind === "input" ? "typed + suggestion" : "opened + option", option: opt.text });
            }
            if (kind === "input") {
              this.invalidateCaches();
              return this.result({ success: true, via: "typed (no suggestion list found)", value: want });
            }
            this.invalidateCaches();
            return this.result({ success: false, error: `custom dropdown opened but no option matching "${want}" was visible; snapshot and click the option`, original: result.error });
          } catch (e) {
            return this.result({ success: false, error: String(e?.message || e).slice(0, 200), original: result.error });
          }
        }
        this.invalidateCaches();
        return this.result(result);
      }
    );
    this.server.tool(
      "dismiss_overlays",
      'Dismiss cookie-consent banners, GDPR/CCPA dialogs, newsletter/sign-up modals and similar overlays that block the page. Tries 20+ known consent managers (OneTrust, Cookiebot, Quantcast, Didomi, Usercentrics, TrustArc, Osano, Sourcepoint, Google, \u2026) by exact selector, then a generic overlay heuristic (fixed/dialog layers with consent wording and accept/reject/close buttons), in every frame it can reach, up to maxRounds times (stacked banners). policy "reject" = least consent (reject \u2192 close \u2192 accept), "accept" = accept all, "close" = just close. Returns what was clicked and, when nothing matched, the candidate buttons (text, selector, rect) so you can click one yourself.',
      {
        policy: external_exports.enum(["reject", "accept", "close"]).default("reject").describe("Which button to prefer"),
        fallbackToAccept: external_exports.boolean().default(true).describe("When the preferred buttons are absent, click Accept so the banner still goes away"),
        maxRounds: external_exports.number().min(1).max(5).default(3).describe("Re-scan after each dismissal (banners stack)"),
        waitMs: external_exports.number().min(0).max(5e3).default(700).describe("Wait after each click before re-scanning"),
        includePromos: external_exports.boolean().default(true).describe("Also close promo/notification bars (fixed edge bars with an X) that carry no consent wording")
      },
      async ({ policy, fallbackToAccept, maxRounds, waitMs, includePromos }) => {
        {
          const np = await this.ensurePage();
          if (np) return np;
        }
        const script = buildOverlayScript(policy, fallbackToAccept, includePromos);
        const clicked = [];
        let candidates = [];
        let overlays = 0;
        let banked = null;
        const host = await this.currentHost();
        const consentRecipes = (await this.hostRecipes(["consent"])).filter((r) => r.promoted && r.recipe?.selector);
        let triedRecipe = null;
        for (const rc of consentRecipes.slice(0, 2)) {
          triedRecipe = rc;
          try {
            let frames = [this.page];
            if (this.backend === "sandbox" && this.sandboxPage) {
              try {
                frames = await this.sandboxPage.refreshFrames();
              } catch {
                frames = [this.page];
              }
            } else {
              try {
                frames = this.page.frames();
              } catch {
                frames = [this.page];
              }
            }
            const want = String(rc.recipe.frameUrl || "");
            const ordered = want ? [...frames.filter((f) => {
              try {
                return (f.url() || "").includes(want);
              } catch {
                return false;
              }
            }), ...frames] : frames;
            for (let fi = 0; fi < ordered.length; fi++) {
              const hit = await Promise.race([ordered[fi].evaluate(`(function(sel){ var el = document.querySelector(sel); if (!el) return null; var r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2) return null; el.click(); return { text: (el.innerText || el.textContent || '').trim().slice(0, 80) }; })(${JSON.stringify(rc.recipe.selector)})`), new Promise((res) => setTimeout(() => res(null), 3e3))]).catch(() => null);
              if (hit) {
                clicked.push({ round: 0, frame: fi, cmp: rc.recipe.cmp || "recipe", bucket: rc.recipe.bucket || policy, selector: rc.recipe.selector, text: hit.text, recipe_id: rc.recipe_id });
                overlays = 1;
                break;
              }
            }
          } catch {
          }
          if (clicked.length) break;
        }
        if (clicked.length) {
          await new Promise((res) => setTimeout(res, waitMs));
          const oc = await recordOutcome(this.env, clicked[0].recipe_id, true, "fast path").catch(() => ({ ok: false }));
          this.invalidateCaches();
          this.lastScanElements.clear();
          return this.result({ dismissed: 1, clicked, overlaysSeen: 1, viaRecipe: clicked[0].recipe_id, _banked: oc, hint: "Overlay dismissed from a banked recipe; scan/snapshot again." });
        }
        for (let round = 0; round < maxRounds; round++) {
          let any = false;
          let frames = [this.page];
          if (this.backend === "sandbox" && this.sandboxPage) {
            try {
              frames = await this.sandboxPage.refreshFrames();
            } catch {
              frames = [this.page];
            }
          } else {
            try {
              frames = this.page.frames();
            } catch {
              frames = [this.page];
            }
          }
          for (let fi = 0; fi < frames.length; fi++) {
            let r = null;
            try {
              r = await frames[fi].evaluate(script);
            } catch {
              continue;
            }
            if (!r) continue;
            overlays = Math.max(overlays, r.overlays || 0);
            if (r.clicked) {
              clicked.push({ round: round + 1, frame: fi, ...r.clicked });
              any = true;
            } else if (Array.isArray(r.candidates) && r.candidates.length) candidates = r.candidates.map((c) => ({ frame: fi, ...c }));
          }
          if (!any) break;
          await new Promise((res) => setTimeout(res, waitMs));
          candidates = [];
        }
        this.invalidateCaches();
        this.lastScanElements.clear();
        if (clicked.length && host) {
          const c = clicked[0];
          let frameUrl = "";
          try {
            const fr = this.backend === "sandbox" && this.sandboxPage ? this.sandboxPage.frames()[c.frame] : this.page.frames()[c.frame];
            frameUrl = fr && c.frame > 0 ? String(fr.url() || "").replace(/^https?:\/\//, "").split(/[?#]/)[0].slice(0, 80) : "";
          } catch {
          }
          banked = await this.bank({ kind: "consent", host, fingerprint: fnv(`${c.cmp}|${c.selector}`), recipe: { cmp: c.cmp, bucket: c.bucket, selector: c.selector, text: c.text, frameUrl, policy }, success: true, note: `round ${c.round}` });
        } else if (triedRecipe && host) {
          await recordOutcome(this.env, triedRecipe.recipe_id, false, "fast path missed, scan found nothing").catch(() => {
          });
        }
        return this.result({
          dismissed: clicked.length,
          clicked,
          overlaysSeen: overlays,
          _banked: banked || void 0,
          candidates: clicked.length ? void 0 : candidates,
          hint: clicked.length ? "Overlay(s) dismissed; scan/snapshot again." : candidates.length ? "No known button matched the policy; click one of the candidates (click({selector}) or click({x,y}))." : "No consent/overlay layer found."
        });
      }
    );
    this.server.tool(
      "solve_captcha",
      'Attempt to solve an image CAPTCHA (reCAPTCHA v2 / hCaptcha grids, "click the X" prompts) with typed decision models: locates the widget iframes, clicks the anchor checkbox if needed, screenshots the challenge, reads the instruction as a menu (object class, grid size, mode), asks one yes/no per tile in a single Jev request, clicks the matching tiles with human-like motion, repeats while tiles keep replacing themselves, clicks Verify, and checks the result. Returns a step trace with every decision and probability. Pass target to override the read instruction (open-vocabulary prompts), or when the result is "needs_driver" use the returned screenshot and click the tiles yourself. Turnstile/PerimeterX: use solve_challenge instead.',
      {
        target: external_exports.string().optional().describe('Override the object to find (e.g. "crosswalk") when you already read the instruction'),
        maxRounds: external_exports.number().min(1).max(8).default(5).describe("Tile-selection rounds (dynamic grids replace tiles after each click)"),
        threshold: external_exports.number().min(0.2).max(0.9).default(0.5).describe("Per-tile yes probability needed to click"),
        clickAnchor: external_exports.boolean().default(true).describe('Click the "I am not a robot" checkbox first when no challenge is open'),
        skipUnsupported: external_exports.number().min(0).max(5).default(2).describe("hCaptcha only: press Skip up to N times when the served task type is not an image-selection grid (match-the-count, drag, odd-one-out) so a supported one is served")
      },
      async ({ target, maxRounds, threshold, clickAnchor, skipUnsupported }) => {
        {
          const np = await this.ensurePage();
          if (np) return np;
        }
        const trace = [];
        const t0 = Date.now();
        const listFrames = async () => {
          try {
            const r = await this.page.evaluate(CAPTCHA_FRAMES_SCRIPT);
            return r?.frames || [];
          } catch {
            return [];
          }
        };
        const shot = async (rect, scale) => this.page.screenshot({ type: "png", encoding: "base64", clip: { x: Math.max(0, rect.x), y: Math.max(0, rect.y), width: Math.max(1, rect.width), height: Math.max(1, rect.height), scale: scale ?? jevScale(rect) } });
        const shotJpeg = async (rect) => {
          try {
            return await this.page.screenshot({ type: "jpeg", quality: 60, encoding: "base64", clip: { x: Math.max(0, rect.x), y: Math.max(0, rect.y), width: Math.max(1, rect.width), height: Math.max(1, rect.height) } });
          } catch {
            return "";
          }
        };
        const frameHandles = async (f) => {
          const re = frameUrlPattern(f.kind);
          let list = [];
          if (this.backend === "sandbox" && this.sandboxPage) {
            try {
              list = await this.sandboxPage.refreshFrames();
            } catch {
              list = [];
            }
          } else {
            try {
              list = this.page.frames();
            } catch {
              list = [];
            }
          }
          return list.filter((fr) => {
            try {
              return re.test(fr.url() || "");
            } catch {
              return false;
            }
          });
        };
        const readDom = async (f) => {
          for (const fr of await frameHandles(f)) {
            try {
              const d = await Promise.race([fr.evaluate(CHALLENGE_DOM_SCRIPT), new Promise((r) => setTimeout(() => r(null), 6e3))]);
              if (d && d.found && ((d.tiles?.length || 0) >= 1 || d.canvas)) return d;
            } catch {
            }
          }
          return null;
        };
        const anchorChecked = async () => {
          const a = frames.find((f) => f.kind === "recaptcha_anchor" || f.kind === "hcaptcha_anchor");
          if (!a) return null;
          for (const fr of await frameHandles(a)) {
            try {
              const v = await Promise.race([fr.evaluate(ANCHOR_CHECKED_SCRIPT), new Promise((r) => setTimeout(() => r(null), 4e3))]);
              if (v === true || v === false) return v;
            } catch {
            }
          }
          return null;
        };
        const waitChallenge = async (ms) => {
          const t = Date.now();
          while (Date.now() - t < ms) {
            frames = await listFrames();
            const c = frames.find((f) => f.visible && (f.kind === "recaptcha_challenge" || f.kind === "hcaptcha_challenge"));
            if (c) return c;
            await sleep2(500);
          }
          return void 0;
        };
        const click = async (x, y) => {
          await this.humanMouseMove(x, y);
          await new Promise((r) => setTimeout(r, 60 + Math.random() * 120));
          await this.page.mouse.click(x, y);
        };
        const sleep2 = (ms) => new Promise((r) => setTimeout(r, ms));
        const meta = { vendor: "", family: "", method: "" };
        const hostC = await this.currentHost();
        const finish = async (status, extra = {}) => {
          if (hostC && meta.vendor && ["solved", "unsolved", "needs_driver"].includes(status)) {
            const egress = this.proxyInfo()?.netClass || "direct";
            extra._banked = await this.bank({ kind: "challenge", host: hostC, fingerprint: fnv(`${meta.vendor}|${meta.family}`), recipe: { vendor: meta.vendor, family: meta.family, method: status === "solved" ? meta.method || String(extra.how || "typed") : "needs_driver", egress, elapsedMs: Date.now() - t0 }, success: status === "solved", note: status });
            void recordDecision(this.env, { kind: "captcha_solve", agent: this.props?.keyHash ? String(this.props.keyHash).slice(0, 12) : "anon", data: { host: hostC, vendor: meta.vendor, family: meta.family, success: true }, model: "captcha-solver", summary: `captcha ${meta.vendor}/${meta.family} solved @ ${hostC}` });
          }
          return this.result({ status, ...extra, trace, elapsedMs: Date.now() - t0 });
        };
        if (!this.env.TYPESAFE_API_KEY) trace.push({ step: "typed_models", error: this.env.INCEPTION_API_KEY ? "TYPESAFE_API_KEY is not set \u2014 decisions fall back to Mercury Decide (no box questions)" : "no decision-model key on the worker \u2014 the challenge is handed to you (needs_driver)" });
        let frames = await listFrames();
        let challenge = frames.find((f) => f.visible && (f.kind === "recaptcha_challenge" || f.kind === "hcaptcha_challenge"));
        const anchor = frames.find((f) => f.visible && (f.kind === "recaptcha_anchor" || f.kind === "hcaptcha_anchor"));
        trace.push({ step: "frames", frames: frames.map((f) => ({ kind: f.kind, visible: f.visible, rect: f.rect })) });
        if (!challenge && !anchor) {
          const other = frames.find((f) => f.visible);
          return finish(other ? "unsupported" : "no_captcha", { kind: other?.kind, hint: other ? "Not an image captcha (Turnstile/Arkose/GeeTest): use solve_challenge or report the challenge." : "No reCAPTCHA/hCaptcha iframe is visible on this page." });
        }
        if (!challenge && anchor && clickAnchor) {
          meta.vendor = anchor.kind.startsWith("h") ? "hcaptcha" : "recaptcha";
          meta.family = "checkbox";
          meta.method = "checkbox";
          const [ax, ay] = anchorCheckboxPoint(anchor);
          await click(ax, ay);
          trace.push({ step: "anchor_click", at: [ax, ay] });
          challenge = await waitChallenge(8e3);
          if (!challenge) {
            const a2 = frames.find((f) => f.kind === anchor.kind) || anchor;
            {
              const ck = await anchorChecked();
              trace.push({ step: "anchor_dom", checked: ck });
              if (ck === true) return finish("solved", { how: "checkbox only" });
            }
            try {
              const img = await shot(a2.rect);
              const r = await decideAsk(this.decisionEnv(), { state: "Anchor widget: `img`", assets: { img: { type: "image", format: "png", data_base64: img } }, questions: { solved: { type: "noul", instructions: "Does `img` show a CHECKED checkbox (green check mark) meaning the captcha passed?" } } });
              trace.push({ step: "anchor_check", solved_p: r.answers.solved?.noul });
              if ((r.answers.solved?.noul ?? 0) >= 0.6) return finish("solved", { how: "checkbox only" });
            } catch (e) {
              trace.push({ step: "anchor_check", error: String(e?.message || e).slice(0, 160) });
            }
            return finish("no_challenge_rendered", { hint: "The checkbox was clicked but no image challenge appeared; wait a second and call again, or detect_challenge." });
          }
        }
        if (!challenge) return finish("no_challenge_open", { hint: "An anchor is present but no challenge is open; call with clickAnchor=true." });
        let cls = target?.trim() || "";
        let n = 3;
        let mode = "select all matching images";
        let passes = 0;
        for (let round = 0; round < maxRounds; round++) {
          const region = challenge.rect;
          const img = await shot(region);
          let menu;
          let gridRect = null;
          let verifyRect = null;
          let domTiles = null;
          let dom = await readDom(challenge);
          for (let k = 0; !dom && k < 8; k++) {
            await sleep2(400);
            dom = await readDom(challenge);
          }
          if (dom && dom.vendor === "hcaptcha" && (!dom.tiles || dom.tiles.length < 4) && dom.canvas) {
            const kind = hcaptchaTaskKind(dom.text || "");
            const canvasRect = offsetRect(dom.canvas, region);
            verifyRect = dom.verify ? offsetRect(dom.verify.rect, region) : null;
            trace.push({ step: "read_dom", round: round + 1, vendor: "hcaptcha", text: (dom.text || "").slice(0, 120), kind, canvas: canvasRect, button: dom.verify?.text || null });
            meta.vendor = "hcaptcha";
            meta.family = kind;
            if (kind === "click_each") {
              const m = (dom.text || "").match(/(?:containing|with|that (?:contains?|shows?)) (?:a |an |the )?([^.]+?)(?:\.|$)/i);
              if (!cls) cls = singularTarget(m?.[1] || "");
              let gb = null;
              try {
                const r = await decideAsk(this.decisionEnv(), { state: "hCaptcha task: `img`", assets: { img: { type: "image", format: "png", data_base64: await shot(canvasRect) } }, questions: { grid_box: { type: "box", instructions: "the 3x3 grid of candidate picture cards in `img`" } } });
                gb = boxToRect(r.answers.grid_box?.box, canvasRect);
              } catch {
                gb = null;
              }
              const grid = plausibleGrid(gb, canvasRect);
              domTiles = splitGrid(grid, 3);
              n = 3;
              mode = "select all matching images";
              trace.push({ step: "grid", round: round + 1, fromModel: !!gb && grid === gb, grid });
            } else if (skipUnsupported > 0 && verifyRect && /skip/i.test(dom.verify?.text || "")) {
              skipUnsupported--;
              const [vx, vy] = centre(verifyRect);
              await click(vx, vy);
              trace.push({ step: "skip", kind });
              await sleep2(2500);
              frames = await listFrames();
              const nx = frames.find((f) => f.visible && f.kind === challenge.kind);
              if (!nx) return finish("unsolved", { hint: "The challenge closed after Skip." });
              challenge = nx;
              cls = target?.trim() || "";
              continue;
            } else {
              return finish("needs_driver", { screenshot: await shotJpeg(region), prompt: dom.text, kind, canvasRect, widgetRect: region, hint: "hCaptcha task family not handled by the typed solver (match-the-count / drag / odd-one-out): read the prompt and the screenshot, then click the cards with click({x,y}) and the button at the bottom-right; or call again with skipUnsupported to rotate the task." });
            }
          }
          if (!domTiles && dom && dom.tiles && dom.tiles.length >= 4) {
            domTiles = dom.tiles.map((t) => offsetRect(t.rect, region));
            verifyRect = dom.verify ? offsetRect(dom.verify.rect, region) : null;
            if (!cls) cls = singularTarget(dom.target || "");
            n = dom.tiles.length === 16 ? 4 : 3;
            mode = dom.dynamic ? "click until none are left (images replace themselves)" : dom.oneImage ? "select all squares of one large image" : "select all matching images";
            trace.push({ step: "read_dom", round: round + 1, vendor: dom.vendor, text: (dom.text || "").slice(0, 120), target: cls, tiles: dom.tiles.length, mode, verify: dom.verify?.text || null, errors: dom.errors?.length ? dom.errors : void 0 });
            meta.vendor = dom.vendor || "";
            meta.family = mode;
            meta.method = "dom+jev";
          }
          if (!domTiles) try {
            const q = { ...instructionMenuQuestions("img"), grid_box: { type: "box", instructions: "the grid of candidate image tiles (the square picture area, excluding the instruction header and the buttons) in `img`" }, verify_box: { type: "box", instructions: "the VERIFY / NEXT / SKIP / SUBMIT button in `img`" } };
            const r = await decideAsk(this.decisionEnv(), { state: "Challenge widget screenshot: `img`", assets: { img: { type: "image", format: "png", data_base64: img } }, questions: q });
            menu = r.answers;
            gridRect = boxToRect(menu.grid_box?.box, region);
            verifyRect = boxToRect(menu.verify_box?.box, region);
            if (!cls) cls = menu.target?.choice || "";
            const g = menu.grid?.choice || "";
            n = g.startsWith("4x4") ? 4 : 3;
            mode = menu.mode?.choice || mode;
            trace.push({ step: "read", round: round + 1, target: cls, targetConf: menu.target?.confidence, grid: g, mode, verifyPresent: menu.verify_present?.noul, gridRect, latencyMs: r.latencyMs });
          } catch (e) {
            trace.push({ step: "read", error: String(e?.message || e).slice(0, 200) });
            return finish("needs_driver", { screenshot: await shotJpeg(region), hint: "The typed read failed; the challenge screenshot is attached \u2014 read the instruction and click the tiles with click({x,y}) relative to the widget rect in the trace." });
          }
          if (!domTiles && (!cls || cls === "other" || mode !== "select all matching images" && mode !== "click until none are left (images replace themselves)" && mode !== "select all squares of one large image")) {
            if (mode === "click on a specific point or object" && cls && cls !== "other") {
              try {
                const r = await decideAsk(this.decisionEnv(), { state: "Challenge: `img`", assets: { img: { type: "image", format: "png", data_base64: img } }, questions: { t: { type: "box", instructions: `the ${cls} to click in \`img\`` } } });
                const rect = boxToRect(r.answers.t?.box, region);
                if (rect) {
                  const [x, y] = centre(rect);
                  await click(x, y);
                  trace.push({ step: "point_click", at: [x, y], conf: r.answers.t?.confidence });
                  if (verifyRect) {
                    const [vx, vy] = centre(verifyRect);
                    await sleep2(600);
                    await click(vx, vy);
                  }
                  await sleep2(2500);
                  frames = await listFrames();
                  const still2 = frames.find((f) => f.visible && f.kind === challenge.kind);
                  if (!still2) return finish("solved", { how: "point click" });
                  challenge = still2;
                  continue;
                }
              } catch (e) {
                trace.push({ step: "point_click", error: String(e?.message || e).slice(0, 160) });
              }
            }
            return finish("needs_driver", { screenshot: await shotJpeg(region), target: cls, mode, widgetRect: region, hint: 'Open-vocabulary or unsupported mode: pass target="<object>" to retry, or click the tiles yourself from the attached screenshot.' });
          }
          if (!domTiles && !gridRect) return finish("needs_driver", { screenshot: await shotJpeg(region), target: cls, widgetRect: region, hint: "Could not locate the tile grid; click the tiles yourself." });
          if (!cls || cls === "other") return finish("needs_driver", { screenshot: await shotJpeg(region), target: cls, mode, widgetRect: region, hint: 'Could not read the target object: pass target="<object>".' });
          const tiles = domTiles || splitGrid(gridRect, n);
          const assets = {};
          const state = {};
          for (let i = 0; i < tiles.length; i++) {
            assets[`tile_${i + 1}`] = { type: "image", format: "png", data_base64: await shot(tiles[i], Math.max(3, jevScale(tiles[i]))) };
            state[`tile_${i + 1}`] = `tile_${i + 1}`;
          }
          let chosen = [];
          let probs = [];
          const side = Math.round(Math.sqrt(tiles.length));
          const wholeImage = mode === "select all squares of one large image" || side === 4 && !mode.startsWith("click until");
          const questions = tileNoulQuestions(tiles.length, cls);
          if (wholeImage && side * side === tiles.length) {
            const gx = Math.min(...tiles.map((t) => t.x)), gy = Math.min(...tiles.map((t) => t.y));
            const gridBox = { x: gx, y: gy, width: Math.max(...tiles.map((t) => t.x + t.width)) - gx, height: Math.max(...tiles.map((t) => t.y + t.height)) - gy };
            assets.grid = { type: "image", format: "png", data_base64: await shot(gridBox, jevScale(gridBox)) };
            state.grid = "grid";
            questions.target_box = { type: "box", instructions: `The tight bounding box around EVERY visible part of the ${cls} in \`grid\` (include wheels, edges, poles and partly visible parts).` };
          }
          try {
            const r = await decideAsk(this.decisionEnv(), { state, assets, questions });
            ({ chosen, probs } = selectedTiles(r.answers, tiles.length, threshold));
            const present = probs.some((p) => p >= threshold);
            const boxTiles = wholeImage && present ? tilesFromBox(r.answers?.target_box?.box, side) : [];
            if (boxTiles.length) chosen = [.../* @__PURE__ */ new Set([...chosen, ...boxTiles])].sort((a, b) => a - b);
            if (wholeImage) trace.push({ step: "tiles_box", boxTiles, box: r.answers?.target_box?.box ?? null });
            trace.push({ step: "tiles", provider: r.provider, ...r.fallbackReason ? { fallbackReason: r.fallbackReason } : {}, round: round + 1, n: tiles.length, target: cls, chosen, probs: probs.map((p) => Math.round(p * 100) / 100), latencyMs: r.latencyMs });
          } catch (e) {
            trace.push({ step: "tiles", error: String(e?.message || e).slice(0, 200) });
            return finish("needs_driver", { screenshot: await shotJpeg(region), target: cls, widgetRect: region });
          }
          for (const i of chosen) {
            const [x, y] = centre(tiles[i - 1]);
            await click(x, y);
            await sleep2(250 + Math.random() * 350);
          }
          if (chosen.length && mode.startsWith("click until")) {
            await sleep2(4500);
            if (++passes < 10) round--;
            continue;
          }
          if (chosen.length === 0 && round === 0 && !mode.startsWith("click until")) {
            trace.push({ step: "none_matched" });
          }
          if (verifyRect) {
            const [vx, vy] = centre(verifyRect);
            await sleep2(500);
            await click(vx, vy);
            trace.push({ step: "verify_click", at: [vx, vy] });
          }
          await sleep2(2500);
          frames = await listFrames();
          const still = frames.find((f) => f.visible && f.kind === challenge.kind);
          {
            const ck = await anchorChecked();
            if (ck === true) return finish("solved", { how: `${chosen.length} tiles, verify (anchor checked)`, rounds: round + 1 });
          }
          if (!still) {
            return finish("solved", { how: `${chosen.length} tiles, verify`, rounds: round + 1 });
          }
          const [tx, ty] = centre(challenge.rect);
          const same = Math.abs(centre(still.rect)[0] - tx) < 3 && Math.abs(centre(still.rect)[1] - ty) < 3;
          const after = await readDom(still);
          trace.push({ step: "after_verify", challengeStillVisible: true, samePlace: same, errors: after?.errors?.length ? after.errors : void 0, nextText: (after?.text || "").slice(0, 100) || void 0 });
          challenge = still;
          cls = target?.trim() || "";
        }
        const last = await shotJpeg(challenge.rect);
        return finish("unsolved", { screenshot: last, widgetRect: challenge.rect, hint: "Rounds exhausted; the current challenge screenshot is attached. Click the remaining tiles yourself or call again." });
      }
    );
    this.server.tool(
      "set_proxy",
      `Set the session's egress rules for the residential proxy pool, or read the current state (no args). Rules (first match on the URL host wins): {type:"vast", country:"US"|"CA"|\u2026, domainPattern?:"*.example.com"} routes through a pool host in that country (an SSH SOCKS tunnel from the sandbox to a Vast box on an ISP/residential line); {type:"external", server:"http://host:port", username?, password?} uses your own proxy; {type:"none", domainPattern} forces direct. Banking, government, streaming, ticketing, webmail and gambling hosts are never proxied. Later browse() calls apply the rules (a proxy CHANGE relaunches the browser context). Needs a key with proxy access; the operator fills the pool.`,
      {
        rules: external_exports.array(external_exports.record(external_exports.string(), external_exports.any())).optional().describe("The rule list (replaces the current one). Omit to read state."),
        clear: external_exports.boolean().default(false).describe("Drop the rules (browsing goes direct again; an open tunnel closes on the next browse/close_session)"),
        fresh: external_exports.boolean().default(false).describe("Re-read the pool from the control plane instead of the 60-s cache")
      },
      async ({ rules, clear, fresh }) => {
        if (clear) {
          this.proxyRules = [];
        }
        let errors = [];
        if (rules !== void 0) {
          const v = validateProxyRules(rules);
          errors = v.errors;
          if (!errors.length) this.proxyRules = v.rules;
        }
        const policy = this.proxyPolicyNow();
        let pool = null;
        let poolError;
        if (this.proxyRules.some((r) => r.type === "vast")) {
          const l = await loadProxyHosts(this.env, { fresh });
          poolError = l.error;
          pool = {};
          for (const r of this.proxyRules) if (r.type === "vast") pool[r.country] = l.hosts.filter((h) => pickProxyHost([h], r) !== null).length;
        }
        return this.result({
          rules: redactRules(this.proxyRules),
          errors: errors.length ? errors : void 0,
          policy: { allowed: policy.allowed, dailySeconds: policy.dailySeconds || null, source: policy.source },
          poolHostsAvailable: pool,
          poolError,
          active: this.proxyInfo(),
          hint: this.proxyRules.length ? "Rules apply on the next browse(); the result carries _proxy with the egress IP and class." : "No rules: browsing is direct."
        });
      }
    );
    this.server.tool(
      "trace",
      "Turn the per-step trace on/off for this session. When on, every mutating tool (browse, click, type, keypress, scroll, hover, select, fill_form, computer_use, solve_challenge) records {n, ts, tool, args, url, title} and, with screenshots=true, a small viewport JPEG. Read it back with trace_get.",
      {
        enabled: external_exports.boolean().describe("Enable or disable tracing"),
        screenshots: external_exports.boolean().default(false).describe("Also keep a JPEG per step (bigger; ~40 quality)"),
        maxSteps: external_exports.number().min(5).max(200).default(60).describe("Ring size; oldest steps drop first"),
        clear: external_exports.boolean().default(false).describe("Clear the current trail")
      },
      async ({ enabled, screenshots, maxSteps, clear }) => {
        this.traceEnabled = enabled;
        this.traceScreens = screenshots;
        this.traceMax = maxSteps;
        if (clear) {
          this.trace = [];
          this.traceSeq = 0;
        }
        return this.result({ enabled, screenshots, maxSteps, steps: this.trace.length });
      }
    );
    this.server.tool(
      "trace_get",
      "Read the per-step trace: all steps (no image data), or one step with its screenshot as an image block. Use clear=true to drop the trail after reading.",
      {
        step: external_exports.number().optional().describe("Return this step (by n) with its screenshot, if one was kept"),
        last: external_exports.number().min(1).max(200).default(60).describe("How many of the newest steps to list"),
        clear: external_exports.boolean().default(false).describe("Clear the trail after returning it")
      },
      async ({ step, last, clear }) => {
        if (step !== void 0) {
          const st = this.trace.find((t) => t.n === step);
          if (!st) return this.result({ error: `No step ${step} in the trace` });
          const { screenshot, ...rest } = st;
          if (clear) {
            this.trace = [];
          }
          if (screenshot) return { content: [{ type: "image", data: screenshot, mimeType: "image/jpeg" }, { type: "text", text: JSON.stringify(rest) }] };
          return this.result({ ...rest, screenshot: null });
        }
        const steps = this.trace.slice(-last).map(({ screenshot, ...rest }) => ({ ...rest, hasScreenshot: !!screenshot }));
        const out = { enabled: this.traceEnabled, screenshots: this.traceScreens, total: this.trace.length, steps };
        if (clear) {
          this.trace = [];
        }
        return this.result(out);
      }
    );
    this.server.tool(
      "evaluate",
      "Execute JavaScript in the page. __utils is available if browse was called. Use for custom data extraction or actions. On the sandbox backend scripts run in an isolated world by default (stealth); set mainWorld=true to run in the page's own world (needed to read React state: __REACT_DEVTOOLS_GLOBAL_HOOK__, __nexusBippyLite, fiber keys). No-op on the default backend, which has a single world.",
      {
        script: external_exports.string().describe("JavaScript expression or IIFE to evaluate"),
        frameIndex: external_exports.number().optional().describe("Frame index (0 = main, 1+ = child frames)"),
        mainWorld: external_exports.boolean().optional().describe("Sandbox backend only: evaluate in the page's main JavaScript world instead of the isolated stealth world. Required to see React (the DevTools hook, bippy-lite, __reactFiber$ expandos). Ignored on the default backend."),
        timeoutMs: external_exports.number().min(1e3).max(6e4).optional().describe("How long to wait for the result (default 15000, max 60000). Raise it for scripts that await on purpose \u2014 sampling frames, renders or events over a window \u2014 on a busy page.")
      },
      async ({ script, frameIndex, mainWorld, timeoutMs }) => {
        const capMs = Math.min(Math.max(timeoutMs ?? 15e3, 1e3), 6e4);
        const capS = Math.round(capMs / 1e3);
        {
          const np = await this.ensurePage();
          if (np) return np;
        }
        const scriptClicks = /\.click\s*\(\s*\)/.test(script);
        const fp = async () => {
          try {
            return String(await this.page.evaluate(`location.href + '|' + document.querySelectorAll('*').length + '|' + ((document.body && document.body.innerText) || '').length`));
          } catch {
            return "";
          }
        };
        const before = scriptClicks ? await fp() : "";
        const clickNote = async (r) => {
          if (!scriptClicks || !before) return r;
          await new Promise((res) => setTimeout(res, 800));
          const after = await fp();
          if (after && after === before) r._scriptClick = { changed: false, hint: "The script called .click() but the page did not change. Many React/Vue sites ignore script clicks \u2014 use the click tool (real mouse events) on the element instead." };
          return r;
        };
        try {
          if (mainWorld && this.backend === "sandbox" && this.sandboxPage) {
            const result2 = await Promise.race([
              this.sandboxPage.evaluateMain(script),
              new Promise((_, reject) => setTimeout(() => reject(new Error(`evaluate timed out (${capS}s)`)), capMs))
            ]);
            this.invalidateCaches();
            return this.result(await clickNote({ success: true, result: result2, _world: "main" }));
          }
          const frame = this.getFrame(frameIndex);
          const result = await Promise.race([
            frame.evaluate(script),
            new Promise((_, reject) => setTimeout(() => reject(new Error(`evaluate timed out (${capS}s) \u2014 the page was busy, or the script triggered a navigation/render that destroyed the page context; for scripts that wait on purpose raise timeoutMs, run navigation-triggering scripts via click/type`)), capMs))
          ]);
          this.invalidateCaches();
          return this.result(await clickNote({ success: true, result }));
        } catch (e) {
          return this.result({ error: e.message });
        }
      }
    );
    this.server.tool(
      "changes",
      "What changed on the page since you last looked: overlays that APPEARED or CLOSED \u2014 modals/dialogs, cookie & consent banners, toasts (status/alert live regions), promo or newsletter bars \u2014 and navigations, with each overlay's kind, text, CSS selector, rect and buttons, plus the overlays open right now. Every action tool already attaches the same report as `_changes`; call this to catch popups that open LATE (async session choosers, timed newsletter prompts) or with waitMs to wait for one. Cheap (~1 in-page call, no screenshot).",
      {
        waitMs: external_exports.number().min(0).max(3e4).default(0).describe("Wait up to this long for a NEW event (returns as soon as one arrives). 0 = report immediately."),
        all: external_exports.boolean().default(false).describe("true = the full journal for this page (from its load), not just what is new since the last report.")
      },
      async ({ waitMs, all }) => {
        {
          const np = await this.ensurePage();
          if (np) return np;
        }
        if (all) this.watchSeq = 0;
        const deadline = Date.now() + waitMs;
        let ch = await this.readChanges(0);
        while (ch && !ch.events.length && Date.now() < deadline) {
          ch = await this.readChanges(Math.min(400, Math.max(0, deadline - Date.now())));
        }
        if (!ch) return this.result({ error: "page-change sensor unavailable on this page (the watcher could not be installed)" });
        const block = this.changesBlock(ch, true) || { events: [], open: [] };
        return this.result({ seq: ch.seq, ...block, ...waitMs && !ch.events.length ? { timedOut: true } : {} });
      }
    );
    this.server.tool(
      "bank_workflow",
      `Bank this session's action trail on the current host as a reusable WORKFLOW (web_recipe kind "playbook", keyed by intent) and record the decision in the cortex decision lake. Call it when a multi-step task on a site succeeded (outcome "success") or failed in a way worth remembering ("failure"). Structure only \u2014 selectors, texts, keys, paths; typed values are truncated and anything password/token-like is redacted. Later browse({intent}) on this host returns the closest banked workflows as _learned_workflows.`,
      {
        intent: external_exports.string().min(3).describe('What the workflow accomplishes, in plain words (e.g. "search flights and open the cheapest result"). Keyed by its content words.'),
        outcome: external_exports.enum(["success", "failure", "partial"]).default("success").describe("How the workflow ended; drives the recipe's score/promotion."),
        fromStep: external_exports.number().optional().describe("Start the workflow at this trail step number (default: the most recent browse on the current host)."),
        note: external_exports.string().optional().describe("Short note stored with the outcome (\u2264200 chars).")
      },
      async ({ intent, outcome, fromStep, note }) => {
        let trail = this.actions;
        if (fromStep !== void 0) trail = trail.filter((s) => s.n >= fromStep);
        else {
          let i = trail.length - 1;
          while (i > 0 && trail[i].tool !== "browse") i--;
          trail = trail.slice(i);
        }
        const host = [...trail].reverse().find((s) => s.host)?.host || "";
        if (!host) return this.result({ error: "no actions on a host yet \u2014 browse and act first" });
        const kept = trail.filter((s) => (s.host === host || s.tool === "browse") && (outcome === "failure" || s.ok));
        const skippedFailed = trail.filter((s) => (s.host === host || s.tool === "browse") && !s.ok).length;
        const steps = kept.map((s) => {
          const a = s.args;
          const target = String(a.selector ?? a.text ?? a.ref ?? (a.x !== void 0 ? `(${a.x},${a.y})` : "")).slice(0, 120);
          const value = typeof a.text === "string" && s.tool === "type" ? a.text.slice(0, 40) : typeof a.value === "string" ? a.value.slice(0, 40) : typeof a.key === "string" ? a.key : void 0;
          return { op: s.tool, ...target ? { target } : {}, ...value !== void 0 ? { value } : {}, ...s.path ? { path: s.path } : {} };
        });
        if (steps.length < 2) return this.result({ error: `only ${steps.length} step(s) on ${host} \u2014 nothing to bank` });
        const recipe = { intent: intent.slice(0, 200), host, steps, bankedAt: (/* @__PURE__ */ new Date()).toISOString() };
        const banked = await this.bank({ kind: "playbook", host, fingerprint: intentFingerprint(intent), recipe, success: outcome === "success", note: `${outcome}${note ? ": " + note : ""}` });
        const decision = await recordDecision(this.env, { kind: "workflow_bank", agent: this.props?.keyHash ? String(this.props.keyHash).slice(0, 12) : "anon", data: { recipe_id: banked.recipe_id, host, steps: steps.length, outcome }, summary: `${outcome}: ${intent.slice(0, 120)} @ ${host}` });
        return this.result({ banked: banked.ok, recipe_id: banked.recipe_id, host, steps: steps.length, ...skippedFailed && outcome !== "failure" ? { skippedFailed } : {}, outcome, decision_id: decision, ...banked.error ? { error: banked.error } : {} });
      }
    );
    this.server.tool(
      "wait_for",
      "Wait for a condition: CSS selector, text, navigation, or network idle. Essential after clicks that trigger dynamic content.",
      {
        selector: external_exports.string().optional().describe("Wait for this CSS selector to appear"),
        text: external_exports.string().optional().describe("Wait for this text to appear"),
        navigation: external_exports.boolean().default(false).describe("Wait for page navigation"),
        networkIdle: external_exports.boolean().default(false).describe("Wait for network activity to settle"),
        timeout: external_exports.number().default(1e4).describe("Maximum wait time in milliseconds")
      },
      async ({ selector, text, navigation, networkIdle, timeout }) => {
        {
          const np = await this.ensurePage();
          if (np) return np;
        }
        try {
          if (selector) {
            await this.page.waitForSelector(selector, { timeout });
            return this.result({ success: true, waited: "selector", selector });
          }
          if (text) {
            await this.page.waitForFunction(
              `((document.body && document.body.innerText) || '').includes(${JSON.stringify(text)})`,
              { timeout }
            );
            return this.result({ success: true, waited: "text", text });
          }
          if (navigation) {
            await this.page.waitForNavigation({ waitUntil: "networkidle0", timeout });
            const url = this.page.url();
            const title = await this.page.title();
            return this.result({ success: true, waited: "navigation", url, title });
          }
          if (networkIdle) {
            await this.page.waitForNetworkIdle({ timeout });
            return this.result({ success: true, waited: "networkIdle" });
          }
          await new Promise((r) => setTimeout(r, Math.min(timeout, 5e3)));
          return this.result({ success: true, waited: "delay", ms: Math.min(timeout, 5e3) });
        } catch (err2) {
          return this.result({ error: `Wait timed out after ${timeout}ms: ${err2.message}` });
        }
      }
    );
    this.server.tool(
      "get_content",
      "Extract page content as clean markdown or raw HTML. Markdown mode produces readable text with headings, links, lists, and form elements.",
      {
        format: external_exports.enum(["markdown", "html"]).default("markdown").describe("Output format"),
        selector: external_exports.string().optional().describe("CSS selector to extract from (default: the page's main content \u2014 <main>/[role=main]/article \u2014 else body)"),
        maxLength: external_exports.number().default(5e4).describe("Maximum output length")
      },
      async ({ format, selector, maxLength }) => {
        {
          const np = await this.ensurePage();
          if (np) return np;
        }
        if (format === "html") {
          let html;
          if (selector) {
            html = await this.page.evaluate(`(function() { var el = document.querySelector(${JSON.stringify(selector)}); return el ? el.outerHTML : ''; })()`);
          } else {
            html = await this.page.content();
          }
          if (html.length > maxLength) html = html.substring(0, maxLength) + "\n<!-- truncated -->";
          return { content: [{ type: "text", text: html }] };
        }
        const autoRoot = selector ? null : await this.page.evaluate(`${MAIN_ROOT_SCRIPT}()`).catch(() => "body");
        const md = await this.page.evaluate(
          `${MARKDOWN_SCRIPT}(${JSON.stringify({ skipChrome: !selector, selector: selector || autoRoot || "body", maxLength })})`
          // 2026-10-21: default to the main content, not body (nav menus filled the budget)
        );
        return { content: [{ type: "text", text: md }] };
      }
    );
    this.server.tool(
      "cookies",
      "Export or import browser cookies for session persistence.",
      {
        action: external_exports.enum(["export", "import"]).describe("Export current cookies or import saved ones"),
        cookies: external_exports.array(external_exports.object({
          name: external_exports.string(),
          value: external_exports.string(),
          domain: external_exports.string().optional(),
          path: external_exports.string().optional(),
          httpOnly: external_exports.boolean().optional(),
          secure: external_exports.boolean().optional()
        })).optional().describe("Cookies to import")
      },
      async ({ action, cookies }) => {
        {
          const np = await this.ensurePage();
          if (np) return np;
        }
        if (action === "export") {
          const exported = await this.page.cookies();
          const clean = exported.map((c) => ({
            name: c.name,
            value: c.value,
            domain: c.domain,
            path: c.path,
            httpOnly: c.httpOnly || void 0,
            secure: c.secure || void 0,
            expires: c.expires > 0 ? c.expires : void 0
          }));
          return this.result({ success: true, count: clean.length, cookies: clean });
        }
        if (!cookies || cookies.length === 0) return this.result({ error: "No cookies provided" });
        await this.page.setCookie(...cookies);
        return this.result({ success: true, imported: cookies.length });
      }
    );
    this.server.tool(
      "frames",
      "List all frames (main page + iframes) with their URLs",
      {},
      async () => {
        {
          const np = await this.ensurePage();
          if (np) return np;
        }
        if (this.backend === "sandbox" && this.sandboxPage) {
          await this.sandboxPage.syncUrl();
          try {
            await this.sandboxPage.refreshFrames();
          } catch {
          }
        }
        const frameList = this.page.frames().map((f, i) => ({
          index: i,
          url: f.url(),
          name: f.name() || void 0,
          isMain: f === this.page.mainFrame()
        }));
        return this.result({ frames: frameList });
      }
    );
    this.server.tool(
      "console_logs",
      "DevTools console for the current page: console messages (log/info/warn/error), uncaught page errors, failed requests and HTTP 4xx/5xx responses, captured since the page was opened (both backends). Filter by level, time or count; clear to start a fresh window. Use after browse/click to see what the page itself reported \u2014 cheaper and more complete than screenshots or evaluate.",
      {
        level: external_exports.enum(["all", "error", "warning", "info", "log", "debug"]).optional().describe('Minimum level to return (default all). "error" = console.error + page errors + failed requests + 5xx; "warning" adds console.warn + 4xx.'),
        since: external_exports.number().optional().describe("Only entries after this epoch-ms timestamp (e.g. the time you issued the previous action)."),
        limit: external_exports.number().optional().describe("Max entries, newest last (default 100, max 500)."),
        clear: external_exports.boolean().optional().describe("true: clear the buffer after returning this batch.")
      },
      async ({ level, since, limit, clear }) => {
        {
          const np = await this.ensurePage();
          if (np) return np;
        }
        const cap = Math.min(Math.max(limit ?? 100, 1), 500);
        const rank = { debug: 0, log: 1, info: 2, warning: 3, warn: 3, error: 4 };
        const min = level && level !== "all" ? rank[level] ?? 0 : 0;
        if (this.backend === "sandbox" && this.sandboxPage) {
          const r = await this.sandboxPage.api("/api/console", { since, limit: cap, clear: !!clear, minRank: min });
          if (r?.error) return this.result({ error: r.error });
          return this.result({ backend: "sandbox", total: r.total ?? (r.entries || []).length, entries: r.entries || [] });
        }
        let entries = this.consoleBuf.filter((e) => (rank[e.level] ?? 1) >= min && (!since || e.t > since));
        const total = entries.length;
        entries = entries.slice(-cap);
        if (clear) this.consoleBuf = [];
        return this.result({ backend: "puppeteer", total, entries });
      }
    );
    this.server.tool(
      "session_info",
      "Get current session status, page URL, detected framework, and usage quota.",
      {},
      async () => {
        const quota = getQuota(this.sessionStartTime);
        if (this.page && this.backend === "sandbox" && this.sandboxPage) await this.sandboxPage.syncUrl();
        const url = this.page ? this.page.url() : null;
        const title = this.page ? await Promise.race([this.page.title().catch(() => null), new Promise((r) => setTimeout(() => r(null), 3e3))]) : null;
        let tabs;
        try {
          if (this.browser) tabs = (await Promise.race([this.browser.pages(), new Promise((r) => setTimeout(() => r([]), 3e3))])).map((p) => p.url());
        } catch {
        }
        return this.result({
          hasPage: !!this.page,
          url,
          title,
          framework: this.frameworkInfo,
          quota,
          backend: this.backend,
          pageOrigin: this.pageOrigin,
          tabs
        });
      }
    );
    this.server.tool(
      "live_view",
      `Get a live, interactive view of this session's browser for a human: a signed WebSocket URL (VNC/RFB \u2014 open it with a noVNC client, e.g. the Nexus Terminal BROWSER window's Live mode) that streams the real screen and accepts mouse/keyboard input. Requires the sandbox backend (browse with backend:"sandbox" first). The link expires (default 60 min).`,
      {
        ttlMinutes: external_exports.number().min(5).max(240).optional().describe("Link lifetime in minutes (default 60, max 240).")
      },
      async ({ ttlMinutes }) => {
        if (this.backend !== "sandbox" || !this.sandboxPage) {
          return this.result({ error: 'Live view needs the sandbox backend (real Chrome with a display). Browse with backend:"sandbox", then call live_view again.', backend: this.backend });
        }
        if (!this.env.AUTH_TOKEN) return this.result({ error: "live view not configured on this worker" });
        const sessionId = this.ctx.id.toString();
        const expiresAt = Date.now() + Math.round((ttlMinutes ?? 60) * 6e4);
        const sig = await signLive(this.env.AUTH_TOKEN, sessionId, expiresAt);
        const host = this.env.PUBLIC_HOST || "browser.spitfire-products.com";
        return this.result({
          // PUBLIC_SCHEME (2026-11-01): the local browser library serves live view on plain ws:// at 127.0.0.1; hosted stays wss.
          url: `${this.env.PUBLIC_SCHEME || "wss"}://${host}/live?s=${sessionId}&exp=${expiresAt}&sig=${sig}`,
          expiresAt: new Date(expiresAt).toISOString(),
          protocol: "RFB (VNC) over WebSocket \u2014 noVNC client",
          note: "Anyone holding this URL can watch and control this session until it expires \u2014 share it only with the person who should."
        });
      }
    );
    this.server.tool(
      "detect_framework",
      "Detect the frontend framework (React, Vue, Svelte, Angular, Next.js, etc.) and heavy libraries on the current page. Automatically called by browse but can be re-run after SPA navigation.",
      {},
      async () => {
        {
          const np = await this.ensurePage();
          if (np) return np;
        }
        const info = await this.detectFramework();
        if (info?.react && !this.bippyInjected) {
          await this.injectBippyLite();
        }
        return this.result({ framework: info });
      }
    );
    this.server.tool(
      "accessibility_tree",
      "Get the page accessibility tree: landmarks, headings, ARIA roles, live regions, and tab order. Essential for understanding non-React page structure. Returns structured semantic hierarchy.",
      {
        root: external_exports.string().optional().describe("CSS selector to scope the tree (default: body)"),
        maxDepth: external_exports.number().default(8).describe("Maximum tree depth"),
        includeTabOrder: external_exports.boolean().default(true).describe("Include tab navigation order")
      },
      async ({ root, maxDepth, includeTabOrder }) => {
        {
          const np = await this.ensurePage();
          if (np) return np;
        }
        const result = await this.page.evaluate(`(function(opts) {
          var rootEl = opts.root ? document.querySelector(opts.root) : document.body;
          if (!rootEl) return { error: 'Root element not found' };

          var maxDepth = opts.maxDepth || 8;
          var landmarks = [];
          var headings = [];
          var liveRegions = [];
          var tabOrder = [];
          var tabIdx = 0;

          // ARIA landmark roles
          var LANDMARK_ROLES = ['banner','complementary','contentinfo','form','main','navigation','region','search'];
          var HEADING_TAGS = {H1:1,H2:2,H3:3,H4:4,H5:5,H6:6};

          function getAccessibleName(el) {
            return el.getAttribute('aria-label')
              || el.getAttribute('aria-labelledby') && (function(ids) {
                   return ids.split(' ').map(function(id) {
                     var ref = document.getElementById(id);
                     return ref ? ref.textContent.trim() : '';
                   }).join(' ');
                 })(el.getAttribute('aria-labelledby'))
              || el.getAttribute('title')
              || el.textContent.trim().substring(0, 80)
              || '';
          }

          function walk(el, depth) {
            if (depth > maxDepth || !el || el.nodeType !== 1) return null;
            var tag = el.tagName;
            var role = el.getAttribute('role') || '';
            var label = getAccessibleName(el);

            // Collect landmarks
            if (LANDMARK_ROLES.indexOf(role) !== -1 || tag === 'NAV' || tag === 'MAIN' || tag === 'HEADER' || tag === 'FOOTER' || tag === 'ASIDE') {
              landmarks.push({ role: role || tag.toLowerCase(), label: label.substring(0, 60), tag: tag });
            }
            // Collect headings
            if (HEADING_TAGS[tag]) {
              headings.push({ level: HEADING_TAGS[tag], text: label.substring(0, 120), id: el.id || undefined });
            }
            // Collect ARIA live regions
            var live = el.getAttribute('aria-live');
            if (live && live !== 'off') {
              liveRegions.push({ priority: live, role: role, text: el.textContent.trim().substring(0, 200) });
            }
            // Collect tab order
            if (opts.includeTabOrder) {
              var ti = el.tabIndex;
              if (ti >= 0 || (tag === 'A' && el.href) || tag === 'BUTTON' || tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') {
                var rect = el.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                  tabOrder.push({
                    index: tabIdx++,
                    tag: tag,
                    role: role || undefined,
                    label: label.substring(0, 60),
                    selector: el.id ? '#' + el.id : undefined,
                  });
                }
              }
            }

            // Recurse children
            var children = el.children;
            for (var i = 0; i < children.length; i++) {
              walk(children[i], depth + 1);
            }
          }

          walk(rootEl, 0);

          return {
            landmarks: landmarks,
            headings: headings,
            liveRegions: liveRegions.length > 0 ? liveRegions : undefined,
            tabOrder: opts.includeTabOrder ? tabOrder : undefined,
            counts: {
              landmarks: landmarks.length,
              headings: headings.length,
              liveRegions: liveRegions.length,
              tabbable: tabOrder.length,
            },
          };
        })(${JSON.stringify({ root, maxDepth, includeTabOrder })})`);
        return this.result(result);
      }
    );
    this.server.tool(
      "snapshot",
      'Compact, ref-addressed page snapshot: one line per interactive control, landmark, heading (and short text with includeText) as `[ref] role: "name" (state)`. Pass a ref to click/type/hover/keypress/scroll/select instead of a selector. Refs are valid until the next snapshot or navigation. ~10x cheaper than scan for deciding the next action.',
      {
        root: external_exports.string().optional().describe("CSS selector to scope the snapshot (default: body)"),
        maxNodes: external_exports.number().min(20).max(2e3).default(400).describe("Node cap (default 400); `truncated` reports overflow"),
        includeText: external_exports.boolean().default(false).describe('Also list short visible text leaves (role "text")'),
        frameIndex: external_exports.number().optional().describe("Frame to snapshot (0=main, 1+=child frames)")
      },
      async ({ root, maxNodes, includeText, frameIndex }) => {
        {
          const np = await this.ensurePage();
          if (np) return np;
        }
        const frame = this.getFrame(frameIndex);
        const r = await frame.evaluate(`(${SNAPSHOT_SCRIPT})(${JSON.stringify({ root, maxNodes, includeText })})`);
        if (!r || r.error) return this.result({ error: r?.error || "snapshot failed" });
        this.snapshotRefs.clear();
        for (const [ref, meta] of Object.entries(r.refs || {})) {
          if (meta?.selector) this.snapshotRefs.set(ref, { selector: meta.selector, frameIndex, role: meta.role, name: meta.name });
        }
        return this.result({
          url: r.url,
          title: r.title,
          count: r.count,
          truncated: r.truncated,
          ...r.modalAuto ? { modal: r.modalAuto, note: "An open modal is listed first, then the page behind it." } : {},
          ...r.rootNote ? { rootNote: r.rootNote } : {},
          snapshot: (r.lines || []).join("\n")
        });
      }
    );
    this.server.tool(
      "form_fields",
      "Inventory the visible form fields on the page: for each field its label, name, type, placeholder, autocomplete, required/hasValue, select options, unique selector and owning form; each form's submit buttons; and page signals (password fields, OTP inputs, captcha frames). Call before fill_form on an unfamiliar page, or to verify what a login/signup form expects.",
      {
        frameIndex: external_exports.number().optional().describe("Frame to inventory (0 = main)")
      },
      async ({ frameIndex }) => {
        {
          const np = await this.ensurePage();
          if (np) return np;
        }
        try {
          const inv = await this.readFormInventory(frameIndex);
          return this.result({ url: inv.signals.url, forms: inv.forms, fields: inv.fields.map((f) => ({ i: f.i, form: f.form, type: f.type, label: f.label, ...f.group ? { group: f.group } : {}, ...f.checked !== void 0 ? { checked: f.checked } : {}, ...f.value ? { value: f.value } : {}, ...f.styled ? { styled: true, clickSelector: f.clickSelector } : {}, name: f.name, placeholder: f.placeholder, autocomplete: f.autocomplete, required: f.required, hasValue: f.hasValue, selector: f.selector, options: f.options })), signals: inv.signals });
        } catch (e) {
          return this.result({ error: String(e?.message || e).slice(0, 300) });
        }
      }
    );
    this.server.tool(
      "fill_form",
      `Fill a form (login, signup, checkout, search) and optionally submit it, then report what happened. Each field is found by ref (from snapshot), selector, or SEMANTICS \u2014 label / name / placeholder / autocomplete / type \u2014 so {label:"Email", value:"a@b.c"} and {type:"password", value:"\u2026"} work without selectors. Values are set React-compatibly (native setters + events) or, with humanLike, typed with trusted keystrokes. submit: true = the matched form's own submit button (trusted click), "enter" = Enter in the last text field, or a selector. After submitting it waits for a URL change / your expect condition (up to waitMs) and returns: outcome (navigated | expected | rejected | otp_required | captcha | likely_success | unchanged), validation messages, alert texts, and signals. Fields that could not be matched or set are reported as failures (never silently). Call form_fields first on unfamiliar pages.`,
      {
        fields: external_exports.array(external_exports.object({
          ref: external_exports.string().optional().describe('Snapshot ref (e.g. "e12")'),
          selector: external_exports.string().optional().describe("CSS selector"),
          label: external_exports.string().optional().describe("Visible label text (or part of it)"),
          name: external_exports.string().optional().describe("name/id attribute (or part of it)"),
          placeholder: external_exports.string().optional().describe("Placeholder text (or part of it)"),
          autocomplete: external_exports.string().optional().describe("autocomplete token: username, current-password, new-password, email, tel, one-time-code, \u2026"),
          type: external_exports.string().optional().describe("Field type to prefer/require: text, email, password, tel, checkbox, radio, select, textarea"),
          value: external_exports.string().optional().describe("Value to set (text/select/range). For select: option value or visible text"),
          checked: external_exports.boolean().optional().describe("Checked state (checkbox/radio)"),
          humanLike: external_exports.boolean().optional().describe("Type this field with trusted keystrokes (overrides the tool-level humanLike)")
        })).min(1).describe("Fields to fill, in order"),
        submit: external_exports.union([external_exports.boolean(), external_exports.string()]).optional().describe(`true = click the matched form's submit button; "enter" = press Enter in the last text field; or a CSS selector / visible button text`),
        humanLike: external_exports.boolean().default(false).describe("Type text fields with trusted keystrokes (click \u2192 select-all \u2192 type) instead of native setters"),
        waitMs: external_exports.number().min(0).max(2e4).default(4e3).describe("After submit: how long to wait for a URL change / expect condition before reading the result"),
        expect: external_exports.object({ selector: external_exports.string().optional(), text: external_exports.string().optional(), urlContains: external_exports.string().optional() }).optional().describe("Success condition to wait for after submit"),
        frameIndex: external_exports.number().optional().describe("Frame holding the form (0 = main)")
      },
      async ({ fields, submit, humanLike, waitMs, expect, frameIndex }) => {
        {
          const np = await this.ensurePage();
          if (np) return np;
        }
        const frame = this.getFrame(frameIndex);
        const sleep2 = (ms) => new Promise((r) => setTimeout(r, ms));
        let inv;
        try {
          inv = await this.readFormInventory(frameIndex);
        } catch (e) {
          return this.result({ error: `form inventory failed: ${String(e?.message || e).slice(0, 200)}` });
        }
        const before = inv.signals;
        const results = [];
        const formIdx = [];
        let lastTextSelector = null;
        for (const spec of fields) {
          let selector = null;
          let matched = null;
          let how = "";
          if (spec.ref) {
            const rr = this.resolveRef(spec.ref);
            if (!rr) {
              results.push({ spec, success: false, error: `unknown or stale ref ${spec.ref}` });
              continue;
            }
            selector = rr.selector;
            how = "ref";
          } else if (spec.selector) {
            selector = spec.selector;
            how = "selector";
          } else {
            const m = matchField(inv.fields, spec);
            if (!m.field) {
              results.push({ spec, success: false, error: "no field matched", alternatives: m.alternatives });
              continue;
            }
            selector = m.field.selector;
            matched = m.field;
            how = `semantic (score ${m.score}${m.ambiguous ? ", ambiguous" : ""})`;
            if (m.ambiguous) results.ambiguous = true;
          }
          if (!matched) matched = inv.fields.find((f) => f.selector === selector) || null;
          if (matched) formIdx.push(matched.form);
          const kind = matched?.type || await frame.evaluate(`(function(sel){ var el = document.querySelector(sel); if (!el) return null; var t = el.tagName; if (t === 'SELECT') return 'select'; if (t === 'TEXTAREA') return 'textarea'; if (t === 'INPUT') return (el.type || 'text').toLowerCase(); return el.isContentEditable ? 'contenteditable' : 'text'; })(${JSON.stringify(selector)})`).catch(() => null);
          if (kind === null) {
            results.push({ spec, selector, success: false, error: "selector not found" });
            continue;
          }
          const entry = { spec, selector, matched: matched ? { label: matched.label, name: matched.name, type: matched.type, form: matched.form } : void 0, how, kind };
          try {
            let r;
            if (spec.checked !== void 0) {
              r = await frame.evaluate(`(${SELECT_SCRIPT})(${JSON.stringify({ selector, checked: spec.checked })})`);
            } else if (spec.value === void 0) {
              r = { success: false, error: "no value or checked given" };
            } else if (kind === "select") {
              let value = spec.value;
              const opt = matched?.options?.find((o) => o.value === spec.value) || matched?.options?.find((o) => o.text.toLowerCase() === spec.value.toLowerCase()) || matched?.options?.find((o) => o.text.toLowerCase().includes(spec.value.toLowerCase()));
              if (opt) value = opt.value;
              r = await frame.evaluate(`(${SELECT_SCRIPT})(${JSON.stringify({ selector, value })})`);
            } else if (kind === "range" || kind === "number") {
              r = await frame.evaluate(`(${SELECT_SCRIPT})(${JSON.stringify({ selector, value: spec.value })})`);
            } else if (kind === "file") {
              r = { success: false, error: "file inputs are not supported yet (use upload_to_sandbox + a future set_input_files)" };
            } else if (kind === "checkbox" || kind === "radio") {
              const on = kind === "radio" ? !/^(false|0|no|off|unchecked)$/i.test(spec.value) : /^(true|1|yes|on|checked)$/i.test(spec.value);
              r = await frame.evaluate(`(${SELECT_SCRIPT})(${JSON.stringify({ selector, checked: on })})`);
            } else {
              const trusted = spec.humanLike ?? humanLike;
              if (trusted) {
                const el = await frame.$(selector);
                if (el) await el.click();
                else if (!await frame.evaluate(`(function(s){${DEEP_QUERY_FNS} var e=__nxDq(s); if(!e) return false; try{e.scrollIntoView({block:'center'}); e.focus();}catch(x){} return true; })(${JSON.stringify(selector)})`).catch(() => false)) throw new Error("selector not found for trusted typing");
                await sleep2(60);
                const how2 = await this.clearFocusedField(frame, selector);
                await this.humanType(spec.value);
                const v = await this.readFieldValue(frame, selector);
                r = { success: true, typed: spec.value.length, ...v !== null ? { value: v } : {} };
                if (v !== null && !fieldHoldsTyped(v, spec.value)) {
                  r.success = false;
                  r.error = `field reads "${v.slice(0, 60)}" after typing "${spec.value.slice(0, 40)}" (clear: ${how2})`;
                }
              } else {
                r = await Promise.race([
                  frame.evaluate(`(${TYPE_SCRIPT})(${JSON.stringify({ selector, text: spec.value, clear: true, pressEnter: false })})`),
                  new Promise((_, reject) => setTimeout(() => reject(new Error("type evaluate timed out (10s)")), 1e4))
                ]);
              }
              lastTextSelector = selector;
            }
            if (r && r.success === false) {
              entry.success = false;
              entry.error = String(r.error || "failed").slice(0, 200);
            } else {
              entry.success = true;
              if (r && typeof r === "object") {
                if (r.typed !== void 0) entry.typed = r.typed;
                if (r.value !== void 0) entry.value = String(r.value).slice(0, 80);
              }
            }
          } catch (err2) {
            entry.success = false;
            entry.error = String(err2?.message || err2).slice(0, 200);
          }
          results.push(entry);
        }
        let submitted = null;
        let after = null;
        let expectMet = false;
        if (submit) {
          const fi = dominantForm(formIdx);
          const form = inv.forms.find((f) => f.i === fi) || inv.forms.find((f) => f.i === -1);
          try {
            if (submit === "enter") {
              if (!lastTextSelector) throw new Error("no text field was filled; cannot press Enter");
              const el = await frame.$(lastTextSelector);
              if (el) await el.click();
              await sleep2(80);
              await this.page.keyboard.press("Enter");
              submitted = { how: "enter", in: lastTextSelector };
            } else {
              let btn;
              if (typeof submit === "string") {
                btn = form?.submit.find((b) => b.selector === submit || b.text.toLowerCase() === submit.toLowerCase()) || inv.forms.flatMap((f) => f.submit).find((b) => b.text.toLowerCase().includes(submit.toLowerCase()));
                if (!btn) {
                  const r0 = await frame.evaluate(`(function(sel){ var el = document.querySelector(sel); if (!el) return null; var r = el.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; })(${JSON.stringify(submit)})`).catch(() => null);
                  if (r0) btn = { selector: submit, text: "", rect: r0 };
                }
              } else {
                btn = form?.submit[0] || inv.forms.flatMap((f) => f.submit)[0];
              }
              if (!btn) throw new Error(`no submit button found${fi >= 0 ? ` in form ${fi}` : ""}; pass submit:"<selector>" or submit:"enter"`);
              try {
                const vr = await frame.evaluate(`(function(sel){ var el = document.querySelector(sel); if (!el) return null; var r = el.getBoundingClientRect(); if (r.top < 0 || r.bottom > window.innerHeight || r.left < 0 || r.right > window.innerWidth) { el.scrollIntoView({ block: 'center', inline: 'center' }); r = el.getBoundingClientRect(); } return { x: r.x, y: r.y, width: r.width, height: r.height }; })(${JSON.stringify(btn.selector)})`);
                if (vr && vr.width > 0) {
                  btn = { ...btn, rect: vr };
                  await sleep2(120);
                }
              } catch {
              }
              const cx = Math.round(btn.rect.x + btn.rect.width / 2), cy = Math.round(btn.rect.y + btn.rect.height / 2);
              if (btn.rect.width > 0 && cx > 0 && cy > 0 && (frameIndex === void 0 || frameIndex === 0)) {
                await this.humanMouseMove(cx, cy);
                await sleep2(60);
                await this.page.mouse.click(cx, cy);
                submitted = { how: "click", button: btn.text || btn.selector, at: [cx, cy] };
              } else {
                const rc = await frame.evaluate(`(${CLICK_SCRIPT})(${JSON.stringify({ selector: btn.selector })})`);
                if (rc && rc.success === false) throw new Error(rc.error || "click failed");
                submitted = { how: "synthetic click", button: btn.text || btn.selector };
              }
            }
          } catch (err2) {
            submitted = { how: "failed", error: String(err2?.message || err2).slice(0, 200) };
          }
          if (submitted && submitted.how !== "failed") {
            const t0 = Date.now();
            let urlNow = before.url;
            while (Date.now() - t0 < waitMs) {
              await sleep2(250);
              try {
                urlNow = await this.page.url();
                if (!urlNow || urlNow === before.url) {
                  const h = await Promise.race([frame.evaluate("location.href"), new Promise((r) => setTimeout(() => r(null), 1500))]).catch(() => null);
                  if (typeof h === "string" && h) urlNow = h;
                }
              } catch {
              }
              if (expect) {
                try {
                  if (expect.urlContains && urlNow.includes(expect.urlContains)) {
                    expectMet = true;
                    break;
                  }
                  if (expect.selector) {
                    const ok = await frame.evaluate(`!!document.querySelector(${JSON.stringify(expect.selector)})`).catch(() => false);
                    if (ok) {
                      expectMet = true;
                      break;
                    }
                  }
                  if (expect.text) {
                    const ok = await frame.evaluate(`(document.body && document.body.innerText || '').includes(${JSON.stringify(expect.text)})`).catch(() => false);
                    if (ok) {
                      expectMet = true;
                      break;
                    }
                  }
                } catch {
                }
              } else if (urlNow !== before.url) {
                await sleep2(600);
                break;
              }
            }
            for (let k = 0; k < 4 && !after; k++) {
              try {
                after = await Promise.race([this.getFrame(frameIndex).evaluate(AFTER_SUBMIT_SCRIPT), new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 8e3))]);
              } catch {
                await sleep2(500);
              }
            }
          }
        }
        this.invalidateCaches();
        this.lastScanElements.clear();
        const outcome = submit ? classifyOutcome(before, after, expectMet) : void 0;
        let hostF = "";
        try {
          hostF = new URL(before.url).hostname.toLowerCase();
        } catch {
        }
        let bankedForm = null;
        if (hostF && outcome && ["navigated", "expected", "likely_success"].includes(outcome)) {
          const fieldMap = results.filter((r) => r.success === true && typeof r.selector === "string").map((r) => {
            const sp = r.spec || {};
            return { label: sp.label, name: sp.name, placeholder: sp.placeholder, autocomplete: sp.autocomplete, type: sp.type, ref: sp.ref ? true : void 0, selector: r.selector, kind: r.kind, mode: sp.humanLike ?? humanLike ? "keys" : "setter" };
          });
          const fp = fnv(fieldMap.map((f) => f.selector).sort().join("|") + "|" + String(submitted?.button || ""));
          bankedForm = await this.bank({ kind: "form", host: hostF, fingerprint: fp, recipe: { path: (() => {
            try {
              return new URL(before.url).pathname;
            } catch {
              return "/";
            }
          })(), fields: fieldMap, submit: { how: submitted?.how, button: submitted?.button, in: submitted?.in }, outcome, after: after ? { path: (() => {
            try {
              return new URL(after.url).pathname;
            } catch {
              return "";
            }
          })(), passwordFields: after.signals.passwordFields } : void 0, expect: expect || void 0 }, success: true, note: outcome });
        }
        const formHints = hostF ? recipeHints(await (async () => {
          try {
            return (await loadRecipes(this.env, hostF)).recipes;
          } catch {
            return [];
          }
        })(), ["form", "challenge"]) : [];
        const allOk = results.every((r) => r.success === true);
        return this.result({ success: allOk && (!submit || submitted?.how !== "failed"), fields: results, submitted, outcome, expectMet: expect ? expectMet : void 0, _recipes: formHints.length ? formHints : void 0, _banked: bankedForm || void 0, after: after ? { url: after.url, title: after.title, validation: after.validation, alerts: after.alerts, signals: after.signals } : void 0, before: { url: before.url, passwordFields: before.passwordFields, otpFields: before.otpFields, captchaFrames: before.captchaFrames }, hint: outcome === "rejected" ? "The form rejected the input: read validation/alerts, fix the fields and call again." : outcome === "otp_required" ? 'An OTP / one-time code form appeared: obtain the code and fill it with {autocomplete:"one-time-code"}.' : outcome === "captcha" ? "A captcha appeared: call solve_captcha / solve_challenge, then submit again." : outcome === "navigated" || outcome === "likely_success" || outcome === "expected" ? "Submit succeeded; call save_auth to persist the session." : void 0 });
      }
    );
    this.server.tool(
      "extract_table",
      "Extract structured data from HTML tables. Returns rows as arrays or objects (with header keys). Works on any site \u2014 essential for data-heavy pages.",
      {
        selector: external_exports.string().default("table").describe("CSS selector for the table element"),
        format: external_exports.enum(["array", "objects"]).default("objects").describe('"objects" uses first row as keys, "array" returns raw 2D array'),
        maxRows: external_exports.number().default(100).describe("Maximum rows to extract")
      },
      async ({ selector, format, maxRows }) => {
        {
          const np = await this.ensurePage();
          if (np) return np;
        }
        const result = await this.page.evaluate(`(function(opts) {
          var table = document.querySelector(opts.selector);
          if (!table) return { error: 'Table not found: ' + opts.selector };
          if (table.tagName !== 'TABLE') {
            // Try to find a table inside the element
            table = table.querySelector('table');
            if (!table) return { error: 'No table found in: ' + opts.selector };
          }

          var rows = table.querySelectorAll('tr');
          if (rows.length === 0) return { rows: [], count: 0 };

          // Extract headers from first row (th or td)
          var headerCells = rows[0].querySelectorAll('th, td');
          var headers = [];
          for (var h = 0; h < headerCells.length; h++) {
            headers.push(headerCells[h].textContent.trim());
          }

          var data = [];
          var start = headers.length > 0 && rows[0].querySelector('th') ? 1 : 0;
          var limit = Math.min(rows.length, start + opts.maxRows);

          for (var i = start; i < limit; i++) {
            var cells = rows[i].querySelectorAll('td, th');
            var row = [];
            for (var c = 0; c < cells.length; c++) {
              row.push(cells[c].textContent.trim());
            }
            if (opts.format === 'objects' && headers.length > 0) {
              var obj = {};
              for (var j = 0; j < headers.length; j++) {
                obj[headers[j] || 'col' + j] = row[j] || '';
              }
              data.push(obj);
            } else {
              data.push(row);
            }
          }

          return {
            headers: headers,
            rows: data,
            count: data.length,
            totalRows: rows.length - start,
            truncated: rows.length - start > opts.maxRows,
          };
        })(${JSON.stringify({ selector, format, maxRows })})`);
        return this.result(result);
      }
    );
    this.server.tool(
      "scroll_and_collect",
      "Automated infinite scroll: scrolls down repeatedly, waits for new content to load each time, stops when no new content appears or limits reached. Returns total scroll distance and new element count. Use for social feeds, search results, product listings.",
      {
        maxScrolls: external_exports.number().default(5).describe("Maximum number of scroll iterations (default 5)"),
        scrollAmount: external_exports.number().default(800).describe("Pixels per scroll (default 800)"),
        waitBetween: external_exports.number().default(2e3).describe("Max ms to wait for new content per scroll (default 2000)"),
        itemSelector: external_exports.string().optional().describe("CSS selector for items being loaded (to count new items)"),
        stopText: external_exports.string().optional().describe('Stop scrolling when this text appears (e.g., "No more results")'),
        container: external_exports.string().optional().describe("Scrollable container selector (default: window)")
      },
      async ({ maxScrolls, scrollAmount, waitBetween, itemSelector, stopText, container }) => {
        {
          const np = await this.ensurePage();
          if (np) return np;
        }
        const results = [];
        let totalNewItems = 0;
        let stoppedReason = "maxScrolls";
        for (let i = 0; i < maxScrolls; i++) {
          const beforeCount = itemSelector ? await this.page.evaluate(`document.querySelectorAll(${JSON.stringify(itemSelector)}).length`) : 0;
          const beforeScrollY = await this.page.evaluate(
            container ? `(document.querySelector(${JSON.stringify(container)}) || document.documentElement).scrollTop` : "window.scrollY"
          );
          await this.page.evaluate(
            container ? `(document.querySelector(${JSON.stringify(container)}) || document.documentElement).scrollBy({ top: ${scrollAmount}, behavior: 'smooth' })` : `window.scrollBy({ top: ${scrollAmount}, behavior: 'smooth' })`
          );
          try {
            await this.page.waitForNetworkIdle({ idleTime: 200, timeout: waitBetween });
          } catch {
            await new Promise((r) => setTimeout(r, waitBetween));
          }
          const afterCount = itemSelector ? await this.page.evaluate(`document.querySelectorAll(${JSON.stringify(itemSelector)}).length`) : 0;
          const afterScrollY = await this.page.evaluate(
            container ? `(document.querySelector(${JSON.stringify(container)}) || document.documentElement).scrollTop` : "window.scrollY"
          );
          const newItems = afterCount - beforeCount;
          totalNewItems += newItems;
          results.push({ scroll: i + 1, newItems, scrollY: afterScrollY });
          if (stopText) {
            const hasStopText = await this.page.evaluate(
              `((document.body && document.body.innerText) || '').includes(${JSON.stringify(stopText)})`
            );
            if (hasStopText) {
              stoppedReason = "stopText";
              break;
            }
          }
          if (afterScrollY <= beforeScrollY) {
            stoppedReason = "reachedBottom";
            break;
          }
          if (itemSelector && newItems === 0) {
            stoppedReason = "noNewItems";
            break;
          }
        }
        this.invalidateCaches();
        return this.result({
          success: true,
          scrolls: results.length,
          totalNewItems,
          stoppedReason,
          finalScrollY: results.length > 0 ? results[results.length - 1].scrollY : 0,
          iterations: results
        });
      }
    );
    this.server.tool(
      "extract_links",
      "Extract all links from the page or a section. Categorizes into navigation, external, internal, anchors. Useful for understanding site structure.",
      {
        selector: external_exports.string().default("body").describe("Scope to a section"),
        filter: external_exports.enum(["all", "internal", "external", "navigation"]).default("all").describe("Filter link types"),
        maxLinks: external_exports.number().default(100).describe("Maximum links to return")
      },
      async ({ selector, filter, maxLinks }) => {
        {
          const np = await this.ensurePage();
          if (np) return np;
        }
        const pageUrl = this.page.url();
        const result = await this.page.evaluate(`(function(opts) {
          var root = document.querySelector(opts.selector) || document.body;
          var links = root.querySelectorAll('a[href]');
          var pageOrigin = new URL(opts.pageUrl).origin;
          var results = [];

          for (var i = 0; i < links.length && results.length < opts.maxLinks; i++) {
            var a = links[i];
            var href = a.href;
            if (!href || href === 'javascript:void(0)') continue;

            var text = (a.textContent || '').trim().substring(0, 80);
            if (!text) text = a.getAttribute('aria-label') || a.getAttribute('title') || '';
            if (!text) continue;

            var isInternal = false;
            var isAnchor = false;
            var isNav = false;
            try {
              var url = new URL(href, opts.pageUrl);
              isInternal = url.origin === pageOrigin;
              isAnchor = url.pathname === new URL(opts.pageUrl).pathname && !!url.hash;
            } catch(e) { continue; }

            // Check if in nav/header element
            var parent = a.closest('nav, header, [role="navigation"], [role="banner"]');
            isNav = !!parent;

            var type = isAnchor ? 'anchor' : isNav ? 'navigation' : isInternal ? 'internal' : 'external';

            if (opts.filter !== 'all') {
              if (opts.filter === 'internal' && !isInternal) continue;
              if (opts.filter === 'external' && isInternal) continue;
              if (opts.filter === 'navigation' && !isNav) continue;
            }

            results.push({ text: text, href: href, type: type });
          }

          return { links: results, count: results.length };
        })(${JSON.stringify({ selector, filter, maxLinks, pageUrl })})`);
        return this.result(result);
      }
    );
    this.server.tool(
      "browser_sessions",
      "List all active Browser Rendering sessions on this Cloudflare account. Useful for diagnosing rate limits and leaked sessions.",
      {},
      async () => {
        try {
          const sessions2 = await cf_puppeteer_default.sessions(this.env.BROWSER);
          return this.result({ sessions: sessions2, count: sessions2.length });
        } catch (e) {
          return this.result({ error: e.message });
        }
      }
    );
    this.server.tool(
      "detect_challenge",
      "Detect if the current page has a Turnstile, hCaptcha, reCAPTCHA, or Cloudflare challenge. Returns challenge type, location, and a screenshot of the challenge area for human/agent passthrough solving.",
      {
        screenshotRegion: external_exports.object({
          x: external_exports.number(),
          y: external_exports.number(),
          width: external_exports.number(),
          height: external_exports.number()
        }).optional().describe("Custom region to screenshot (if you already know where the challenge is)")
      },
      async ({ screenshotRegion }) => {
        {
          const np = await this.ensurePage();
          if (np) return np;
        }
        const detection = await this.page.evaluate(`(function() {
          var signals = {};
          var safeRect = function(el) {
            if (!el || typeof el.getBoundingClientRect !== 'function') return null;
            try {
              var r = el.getBoundingClientRect();
              if (!r || typeof r.width !== 'number') return null;
              return { x: r.x, y: r.y, width: r.width, height: r.height };
            } catch (e) { return null; }
          };

          // 1. Cloudflare Turnstile \u2014 shared locator (container ids/classes + the response input; the iframe is in a closed shadow root)
          var tl = ${TURNSTILE_LOCATE_SCRIPT};
          if (tl && tl.found) signals.turnstile = { found: true, rect: tl.rect, clickPoint: tl.clickPoint, via: tl.via };
          var scriptsAll = document.querySelectorAll('script[src]');
          for (var si = 0; si < scriptsAll.length; si++) {
            if (scriptsAll[si].src && scriptsAll[si].src.indexOf('challenges.cloudflare.com') !== -1) {
              signals.turnstileScript = true; break;
            }
          }

          // 2. Cloudflare interstitial page
          var cfChallenge = document.querySelector('#challenge-running, #challenge-form, .challenge-platform');
          if (cfChallenge) {
            signals.cfChallenge = { found: true, id: cfChallenge.id || cfChallenge.className };
          }

          // 3. PerimeterX / HUMAN Security press-and-hold widget
          var px = document.querySelector('#px-captcha-wrapper, .px-captcha-container, [class*="px-captcha"]');
          if (px) {
            var rPx = safeRect(px);
            if (rPx) signals.perimeterx = { found: true, rect: rPx, gesture: 'press_and_hold' };
          }

          // 4. DataDome iframe-based CAPTCHA
          var dd = document.querySelector('iframe[src*="captcha-delivery.com"], .datadome-captcha, [id^="dd-captcha"]');
          if (dd) {
            var rDd = safeRect(dd);
            if (rDd) signals.datadome = { found: true, rect: rDd };
          }

          // 5. Akamai Bot Manager hard block (title + Reference ID combo)
          var bodyText = (document.body && document.body.innerText) ? document.body.innerText : '';
          var titleText = document.title || '';
          var akamaiBlock = (titleText.indexOf('Access to this page has been denied') !== -1 ||
                             titleText.indexOf('Access Denied') !== -1) &&
                            (bodyText.indexOf('Reference ID') !== -1 || bodyText.indexOf('Reference #') !== -1);
          if (akamaiBlock) signals.akamaiBlock = { found: true, hardBlock: true };

          // 6. Imperva / Incapsula
          var imperva = document.querySelector('iframe[src*="_Incapsula_Resource"]');
          var impervaText = bodyText.indexOf('Incapsula incident ID') !== -1;
          if (imperva || impervaText) signals.imperva = { found: true };

          // 7. hCaptcha
          var hcap = document.querySelector('.h-captcha, [data-hcaptcha-widget-id], iframe[src*="hcaptcha.com"]');
          if (hcap) {
            var rH = safeRect(hcap);
            if (rH) signals.hcaptcha = { found: true, rect: rH };
          }

          // 8. reCAPTCHA
          var rec = document.querySelector('.g-recaptcha, iframe[src*="recaptcha"]');
          if (rec) {
            var rR = safeRect(rec);
            if (rR) signals.recaptcha = { found: true, rect: rR };
          }

          // 9. Generic catch-all text + iframe
          if (new RegExp(${JSON.stringify(HUMAN_CHECK_TEXT_RE)}, 'i').test(bodyText)) {
            signals.verifyHumanText = true;
          }
          if (bodyText.indexOf('Checking your browser') !== -1 || bodyText.indexOf('Just a moment') !== -1) {
            signals.browserCheck = true;
          }
          var challengeIframe = document.querySelector('iframe[src*="challenge"], iframe[src*="turnstile"], iframe[src*="captcha"]');
          if (challengeIframe && !signals.turnstile && !signals.datadome && !signals.hcaptcha && !signals.recaptcha) {
            var rC = safeRect(challengeIframe);
            if (rC) {
              signals.challengeIframe = { found: true, src: (challengeIframe.src || '').substring(0, 200), rect: rC };
            }
          }

          // Vendor + suggested gesture
          var type = 'none';
          var suggestedGesture = 'click';
          if ((signals.turnstile && signals.turnstile.found) || signals.turnstileScript) type = 'turnstile';
          else if ((signals.cfChallenge && signals.cfChallenge.found) || signals.browserCheck) type = 'cloudflare_interstitial';
          else if (signals.perimeterx && signals.perimeterx.found) { type = 'perimeterx'; suggestedGesture = 'press_and_hold'; }
          else if (signals.datadome && signals.datadome.found) { type = 'datadome'; suggestedGesture = 'human_required'; }
          else if (signals.akamaiBlock && signals.akamaiBlock.found) { type = 'akamai_block'; suggestedGesture = 'human_required'; }
          else if (signals.imperva && signals.imperva.found) { type = 'imperva'; suggestedGesture = 'human_required'; }
          else if (signals.hcaptcha && signals.hcaptcha.found) { type = 'hcaptcha'; suggestedGesture = 'human_required'; }
          else if (signals.recaptcha && signals.recaptcha.found) { type = 'recaptcha'; suggestedGesture = 'human_required'; }
          else if (signals.verifyHumanText) type = 'unknown_verify';

          return { type: type, suggestedGesture: suggestedGesture, signals: signals, url: window.location.href, title: document.title };
        })()`);
        if (this.backend === "sandbox" && this.sandboxPage) {
          try {
            await this.sandboxPage.refreshFrames();
          } catch {
          }
        }
        const cdpFrames = this.page.frames().map((f, i) => ({
          index: i,
          url: f.url(),
          name: f.name() || void 0
        })).filter((f) => f.url.includes("challenges.cloudflare.com") || f.url.includes("captcha") || f.url.includes("turnstile"));
        if (cdpFrames.length > 0 && detection.type === "none") {
          detection.type = "turnstile_oopif";
        }
        const hasChallengeDetected = detection.type !== "none";
        let screenshotData = null;
        if (hasChallengeDetected) {
          const clipRegion = screenshotRegion || detection.signals.turnstile?.rect || detection.signals.perimeterx?.rect || detection.signals.datadome?.rect || detection.signals.hcaptcha?.rect || detection.signals.recaptcha?.rect || detection.signals.challengeIframe?.rect;
          const opts = {
            type: "jpeg",
            encoding: "base64",
            quality: 80
          };
          if (clipRegion && clipRegion.width > 10 && clipRegion.height > 10) {
            opts.clip = {
              x: Math.max(0, clipRegion.x - 20),
              y: Math.max(0, clipRegion.y - 20),
              width: clipRegion.width + 40,
              height: clipRegion.height + 40
            };
          }
          screenshotData = await this.page.screenshot(opts);
        }
        const sg = detection.signals || {};
        const tgt = sg.turnstile?.rect || sg.perimeterx?.rect || sg.datadome?.rect || sg.hcaptcha?.rect || sg.recaptcha?.rect || sg.challengeIframe?.rect || null;
        const location = tgt ? { x: Math.round(tgt.x), y: Math.round(tgt.y), width: Math.round(tgt.width), height: Math.round(tgt.height) } : null;
        const clickPoint = sg.turnstile?.clickPoint || (tgt ? { x: Math.round(tgt.x + tgt.width / 2), y: Math.round(tgt.y + tgt.height / 2) } : null);
        if (detection.type === "none" && sg.verifyHumanText) detection.type = "unknown_verify";
        const response = {
          challengeDetected: hasChallengeDetected || detection.type !== "none",
          type: detection.type,
          location,
          clickPoint,
          suggestedGesture: detection.suggestedGesture,
          signals: detection.signals,
          cdpFrames,
          url: detection.url,
          title: detection.title,
          hint: hasChallengeDetected || detection.type !== "none" ? clickPoint ? `Challenge detected. Call solve_challenge() with no coordinates (it aims at clickPoint ${clickPoint.x},${clickPoint.y}), or pass x/y yourself.` : "Challenge detected but not located on the page (no widget rect). Pass the screenshot to a human/CORTEX agent, or solve_challenge({x, y}) once you know where it is." : "No challenge detected on this page."
        };
        if (screenshotData) {
          return {
            content: [
              { type: "text", text: JSON.stringify(response) },
              {
                type: "image",
                data: screenshotData,
                mimeType: "image/jpeg"
              }
            ]
          };
        }
        return this.result(response);
      }
    );
    this.server.tool(
      "solve_challenge",
      'Resolve a challenge widget. Omit x/y to let it locate the widget itself (Turnstile: its checkbox, including sites that mount it under #cf-turnstile with the iframe in a closed shadow root; PerimeterX: the hold button), or pass the coordinates from detect_challenge. Default gesture is click (Turnstile/hCaptcha/reCAPTCHA). Set gesture="press_and_hold" with holdMs \u2248 3000-5000 for PerimeterX press-and-hold challenges. Uses human-like Bezier mouse movement and (for press_and_hold) subtle position jitter during hold.',
      {
        x: external_exports.number().optional().describe("X coordinate to click (viewport coordinates). Omit (with y) to auto-locate the widget."),
        y: external_exports.number().optional().describe("Y coordinate to click (viewport coordinates). Omit (with x) to auto-locate the widget."),
        gesture: external_exports.enum(["click", "press_and_hold"]).default("click").describe('Interaction style. "click" = single click (Turnstile etc). "press_and_hold" = sustained mouse-down for PerimeterX.'),
        holdMs: external_exports.number().default(3500).describe("For press_and_hold only: how long to hold mouse-down in ms. PerimeterX typically requires 2500-5000ms. Random jitter is added."),
        holdJitterPx: external_exports.number().default(2).describe("For press_and_hold only: max pixel drift during hold (simulates natural hand tremor). Default 2px."),
        preMoveDelay: external_exports.number().default(500).describe("Random delay before moving mouse (ms, simulates human hesitation)"),
        postClickWaitMs: external_exports.number().default(8e3).describe("How long to wait after gesture for challenge to resolve (ms)"),
        successIndicator: external_exports.object({
          urlChange: external_exports.boolean().optional().describe("Wait for URL to change (page redirect after challenge)"),
          textContent: external_exports.string().optional().describe("Wait for this text to appear (e.g. dashboard content)"),
          selectorAppear: external_exports.string().optional().describe("Wait for this selector to appear"),
          selectorDisappear: external_exports.string().optional().describe("Wait for this selector to disappear (challenge element removed)")
        }).optional().describe("What indicates the challenge was solved")
      },
      async ({ x: xIn, y: yIn, gesture: gestureIn, holdMs, holdJitterPx, preMoveDelay, postClickWaitMs, successIndicator }) => {
        {
          const np = await this.ensurePage();
          if (np) return np;
        }
        let x = xIn, y = yIn, gesture = gestureIn;
        let located = void 0;
        if (typeof xIn !== "number" || typeof yIn !== "number") {
          located = await this.page.evaluate(`(function(){
            var t = ${TURNSTILE_LOCATE_SCRIPT};
            if (t && t.found) return { type: 'turnstile', via: t.via, rect: t.rect, point: t.clickPoint, gesture: 'click' };
            var px = document.querySelector('#px-captcha-wrapper, .px-captcha-container, [class*="px-captcha"], #px-captcha');
            if (px) { var r = px.getBoundingClientRect(); if (r.width > 10 && r.height > 10) return { type: 'perimeterx', rect: { x: r.x, y: r.y, width: r.width, height: r.height }, point: { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) }, gesture: 'press_and_hold' }; }
            var f = document.querySelector('iframe[src*="challenges.cloudflare.com"], iframe[src*="hcaptcha.com"], iframe[src*="recaptcha"], iframe[src*="captcha"]');
            if (f) { var q = f.getBoundingClientRect(); if (q.width > 10 && q.height > 10) return { type: 'iframe', src: (f.src || '').slice(0, 120), rect: { x: q.x, y: q.y, width: q.width, height: q.height }, point: { x: Math.round(q.x + Math.min(28, q.width / 2)), y: Math.round(q.y + q.height / 2) }, gesture: 'click' }; }
            return null;
          })()`).catch(() => null);
          if (!located) {
            return this.result({ success: false, error: "No challenge widget located on the page \u2014 pass x/y (detect_challenge returns clickPoint when it can see one, plus a screenshot otherwise)." });
          }
          x = located.point.x;
          y = located.point.y;
          if (gestureIn === "click" && located.gesture === "press_and_hold") gesture = "press_and_hold";
        }
        const urlBefore = this.page.url();
        let titleBeforeAttempt = "";
        try {
          titleBeforeAttempt = await this.page.title();
        } catch {
        }
        await new Promise((r) => setTimeout(r, preMoveDelay + Math.random() * 300));
        await this.humanMouseMove(x, y);
        await new Promise((r) => setTimeout(r, 100 + Math.random() * 200));
        if (gesture === "press_and_hold") {
          if (this.backend === "sandbox" && this.sandboxPage && typeof this.sandboxPage.mouse.pressAndHold === "function") {
            try {
              await this.sandboxPage.mouse.pressAndHold(x, y, {
                holdMs: holdMs + (Math.random() * 600 - 300),
                // ±300ms jitter
                jitterPx: holdJitterPx,
                humanLikeApproach: true
              });
            } catch (err2) {
              await this.fallbackPressAndHold(x, y, holdMs, holdJitterPx);
            }
          } else {
            await this.fallbackPressAndHold(x, y, holdMs, holdJitterPx);
          }
        } else {
          await this.page.mouse.click(x, y);
        }
        this.invalidateCaches();
        const start = Date.now();
        let resolved = false;
        let resolveMethod = "timeout";
        if (successIndicator) {
          try {
            if (successIndicator.urlChange) {
              await this.page.waitForNavigation({ timeout: postClickWaitMs, waitUntil: "domcontentloaded" });
              resolved = true;
              resolveMethod = "urlChange";
            } else if (successIndicator.textContent) {
              await this.page.waitForFunction(
                `((document.body && document.body.innerText) || '').includes(${JSON.stringify(successIndicator.textContent)})`,
                { timeout: postClickWaitMs }
              );
              resolved = true;
              resolveMethod = "textContent";
            } else if (successIndicator.selectorAppear) {
              await this.page.waitForSelector(successIndicator.selectorAppear, { timeout: postClickWaitMs });
              resolved = true;
              resolveMethod = "selectorAppear";
            } else if (successIndicator.selectorDisappear) {
              await this.page.waitForFunction(
                `!document.querySelector(${JSON.stringify(successIndicator.selectorDisappear)})`,
                { timeout: postClickWaitMs }
              );
              resolved = true;
              resolveMethod = "selectorDisappear";
            }
          } catch {
          }
        } else {
          await new Promise((r) => setTimeout(r, postClickWaitMs));
          if (this.page.url() !== urlBefore) {
            resolved = true;
            resolveMethod = "urlChange";
          } else {
            const titleNow = await this.page.title();
            let bodyStillWalled = false;
            try {
              bodyStillWalled = !!await this.page.evaluate(`/press (&|and) hold|please try again|verify (that )?you are (a )?human|not a bot|access (to this page has been )?denied/i.test((document.body && document.body.innerText || '').slice(0, 3000))`);
            } catch {
            }
            const wasChallenge = !!titleNow && titleNow !== titleBeforeAttempt && !bodyStillWalled && !titleNow.includes("Just a moment") && !titleNow.includes("Attention Required") && !titleNow.includes("Security Check") && !McpAgent_WALL(titleNow, this.page.url());
            if (wasChallenge) {
              resolved = true;
              resolveMethod = "titleChange";
            }
          }
        }
        const urlAfter = this.page.url();
        const title = await this.page.title();
        const elapsedMs = Date.now() - start;
        const titleIndicatesChallenge = title.includes("Just a moment") || title.includes("Attention Required") || title.includes("Security Check");
        if (this.backend === "sandbox" && this.sandboxPage) {
          try {
            await this.sandboxPage.refreshFrames();
          } catch {
          }
        }
        const challengeFrames = this.page.frames().filter((f) => {
          const fUrl = f.url();
          return fUrl.includes("challenges.cloudflare.com") || fUrl.includes("turnstile");
        });
        const domChallengeSignals = await this.page.evaluate(`(function(){
          var bodyText = (document.body && document.body.innerText) || '';
          return {
            hasVerifyText: new RegExp(${JSON.stringify(HUMAN_CHECK_TEXT_RE)}, 'i').test(bodyText),
            hasCheckingText: bodyText.includes('Checking your browser'),
            hasJustAMoment: bodyText.includes('Just a moment'),
            hasChallengeForm: !!document.querySelector('#challenge-running, #challenge-form'),
          };
        })()`);
        const stillHasChallenge = titleIndicatesChallenge || challengeFrames.length > 0 || domChallengeSignals.hasChallengeForm || domChallengeSignals.hasVerifyText && domChallengeSignals.hasJustAMoment;
        const screenshot = await this.page.screenshot({
          type: "jpeg",
          encoding: "base64",
          quality: 70
        });
        let _banked = void 0;
        const hostS = await this.currentHost();
        if (hostS) {
          const vendor = located?.type || "manual_coords";
          const egress = this.proxyInfo()?.netClass || "direct";
          _banked = await this.bank({
            kind: "challenge",
            host: hostS,
            fingerprint: fnv(`${vendor}|${located?.via || "xy"}`),
            recipe: { vendor, via: located?.via, gesture, clickOffset: located ? { dx: Math.round(x - located.rect.x), dy: Math.round(y - located.rect.y) } : void 0, method: "solve_challenge", egress, elapsedMs },
            success: !!resolved && !stillHasChallenge,
            note: String(resolveMethod || (stillHasChallenge ? "still_challenged" : "unresolved"))
          });
        }
        const result = {
          clicked: { x, y },
          located: located ? { type: located.type, via: located.via, rect: located.rect } : void 0,
          _banked,
          resolved,
          resolveMethod,
          elapsedMs,
          urlChanged: urlAfter !== urlBefore,
          urlBefore,
          urlAfter,
          title,
          stillHasChallenge,
          hint: resolved ? "Challenge appears to be solved! Page has progressed." : stillHasChallenge ? "Challenge still present. May need another attempt, or the challenge requires additional interaction (e.g. image selection). Take a screenshot to assess." : "Challenge element gone but no explicit success signal. Check page content."
        };
        return {
          content: [
            { type: "text", text: JSON.stringify(result) },
            {
              type: "image",
              data: screenshot,
              mimeType: "image/jpeg"
            }
          ]
        };
      }
    );
    this.server.tool(
      "wait_for_challenge_resolution",
      "Wait for a challenge to be resolved externally (e.g., by a human operator or CORTEX agent viewing a streamed screenshot). Polls the page periodically until the challenge disappears or a success condition is met.",
      {
        pollIntervalMs: external_exports.number().default(2e3).describe("How often to check for resolution (ms)"),
        timeoutMs: external_exports.number().default(6e4).describe("Maximum wait time (ms). Default 60s."),
        successUrl: external_exports.string().optional().describe("URL pattern that indicates success (substring match)"),
        successText: external_exports.string().optional().describe("Text that appears when challenge is solved"),
        challengeText: external_exports.string().optional().describe('Text present while challenge is active (disappears on solve). Default: "Verify you are human"')
      },
      async ({ pollIntervalMs, timeoutMs, successUrl, successText, challengeText }) => {
        {
          const np = await this.ensurePage();
          if (np) return np;
        }
        const start = Date.now();
        const checkText = challengeText || "Verify you are human";
        let lastUrl = this.page.url();
        let polls = 0;
        while (Date.now() - start < timeoutMs) {
          polls++;
          await new Promise((r) => setTimeout(r, pollIntervalMs));
          const currentUrl = this.page.url();
          const currentTitle = await this.page.title();
          if (successUrl && currentUrl.includes(successUrl)) {
            return this.result({
              resolved: true,
              method: "successUrl",
              polls,
              elapsedMs: Date.now() - start,
              url: currentUrl,
              title: currentTitle
            });
          }
          if (successText) {
            const hasText = await this.page.evaluate(
              (t) => document.body?.innerText?.includes(t) || false,
              successText
            );
            if (hasText) {
              return this.result({
                resolved: true,
                method: "successText",
                polls,
                elapsedMs: Date.now() - start,
                url: currentUrl,
                title: currentTitle
              });
            }
          }
          if (currentUrl !== lastUrl) {
            return this.result({
              resolved: true,
              method: "urlChange",
              polls,
              elapsedMs: Date.now() - start,
              urlBefore: lastUrl,
              url: currentUrl,
              title: currentTitle
            });
          }
          const stillHasChallenge = await this.page.evaluate(
            (t) => {
              const bodyText = document.body?.innerText || "";
              return bodyText.includes(t) || bodyText.includes("Checking your browser") || bodyText.includes("Just a moment") || !!document.querySelector("#challenge-running, #challenge-form");
            },
            checkText
          );
          if (!stillHasChallenge) {
            return this.result({
              resolved: true,
              method: "challengeDisappeared",
              polls,
              elapsedMs: Date.now() - start,
              url: currentUrl,
              title: currentTitle
            });
          }
          lastUrl = currentUrl;
        }
        const screenshot = await this.page.screenshot({
          type: "jpeg",
          encoding: "base64",
          quality: 70
        });
        return {
          content: [
            { type: "text", text: JSON.stringify({
              resolved: false,
              method: "timeout",
              polls,
              elapsedMs: Date.now() - start,
              url: this.page.url(),
              title: await this.page.title(),
              hint: "Challenge was not resolved within the timeout. The screenshot shows the current page state."
            }) },
            { type: "image", data: screenshot, mimeType: "image/jpeg" }
          ]
        };
      }
    );
    this.server.tool(
      "save_auth",
      "Save current browser auth state (cookies + localStorage) to persistent storage. Use after logging in to a site so future sessions can skip the login flow. Keyed by domain.",
      {
        label: external_exports.string().optional().describe('Optional label for this auth state (e.g. "my-account")')
      },
      async ({ label }) => {
        {
          const np = await this.ensurePage();
          if (np) return np;
        }
        try {
          const currentUrl = (await this.pageInfo()).url;
          const domain = new URL(currentUrl).hostname;
          const key = label ? `auth:${domain}:${label}` : `auth:${domain}`;
          const cookies = await this.page.cookies();
          const localStorage = await this.page.evaluate(`(function(){ var o = {}; for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k) o[k] = localStorage.getItem(k) || ''; } return o; })()`) || {};
          const authData = JSON.stringify({ cookies, localStorage, domain, savedAt: Date.now() });
          this.ctx.storage.sql.exec(
            `CREATE TABLE IF NOT EXISTS auth_states (key TEXT PRIMARY KEY, data TEXT, updated_at INTEGER)`
          );
          this.ctx.storage.sql.exec(
            `INSERT OR REPLACE INTO auth_states (key, data, updated_at) VALUES (?, ?, ?)`,
            key,
            authData,
            Date.now()
          );
          let persisted = false;
          const kvKey = this.authKvKey(key);
          const kv = this.authKv();
          if (kv && kvKey) {
            try {
              await kv.put(kvKey, authData, { expirationTtl: 30 * 86400 });
              persisted = true;
            } catch {
            }
          }
          return this.result({
            saved: true,
            key,
            domain,
            persistedAcrossSessions: persisted,
            cookieCount: cookies.length,
            localStorageKeys: Object.keys(localStorage).length
          });
        } catch (e) {
          return this.result({ error: e.message });
        }
      }
    );
    this.server.tool(
      "load_auth",
      "Load previously saved auth state (cookies + localStorage) into the current browser session. Use before navigating to skip login. Call after browse but before navigating to the target page, or after navigation to restore localStorage.",
      {
        domain: external_exports.string().describe('Domain to load auth for (e.g. "app.godelterminal.com")'),
        label: external_exports.string().optional().describe("Optional label if auth was saved with one")
      },
      async ({ domain, label }) => {
        {
          const np = await this.ensurePage();
          if (np) return np;
        }
        try {
          const key = label ? `auth:${domain}:${label}` : `auth:${domain}`;
          this.ctx.storage.sql.exec(
            `CREATE TABLE IF NOT EXISTS auth_states (key TEXT PRIMARY KEY, data TEXT, updated_at INTEGER)`
          );
          const rows = [...this.ctx.storage.sql.exec(`SELECT data FROM auth_states WHERE key = ?`, key)];
          let raw = rows.length ? rows[0].data : null;
          let source = "session";
          {
            const kv = this.authKv();
            const kvKey = this.authKvKey(key);
            if (kv && kvKey) {
              const kvRaw = await kv.get(kvKey);
              if (kvRaw) {
                const at = (r) => {
                  try {
                    return Number(JSON.parse(r || "{}").savedAt) || 0;
                  } catch {
                    return 0;
                  }
                };
                if (!raw || at(kvRaw) > at(raw)) {
                  raw = kvRaw;
                  source = "saved";
                }
              }
            }
          }
          if (!raw) {
            return this.result({ loaded: false, error: `No saved auth state for key: ${key}`, hint: "list_auth shows what this API key has saved; save_auth after logging in." });
          }
          const authData = JSON.parse(raw);
          if (authData.cookies?.length > 0) {
            await this.page.setCookie(...authData.cookies);
          }
          let localStorageRestored = 0;
          let localStorageError;
          if (authData.localStorage && Object.keys(authData.localStorage).length > 0) {
            try {
              localStorageRestored = Number(await this.page.evaluate(`(function(items){ var n = 0; for (var k in items) { try { localStorage.setItem(k, items[k]); n++; } catch (e) {} } return n; })(${JSON.stringify(authData.localStorage)})`)) || 0;
            } catch (e) {
              localStorageError = String(e?.message || e).slice(0, 160);
            }
            if (!localStorageRestored && !localStorageError) localStorageError = "no keys written \u2014 open a page on the saved domain first (browse), then load_auth";
          }
          return this.result({
            loaded: true,
            key,
            domain: authData.domain,
            cookieCount: authData.cookies?.length || 0,
            localStorageKeys: Object.keys(authData.localStorage || {}).length,
            localStorageRestored,
            localStorageError,
            savedAt: authData.savedAt,
            source,
            hint: "Navigate (or reload) the target page now so the restored cookies/localStorage take effect."
          });
        } catch (e) {
          return this.result({ error: e.message });
        }
      }
    );
    this.server.tool(
      "list_auth",
      "List all saved auth states in persistent storage.",
      {},
      async () => {
        try {
          this.ctx.storage.sql.exec(
            `CREATE TABLE IF NOT EXISTS auth_states (key TEXT PRIMARY KEY, data TEXT, updated_at INTEGER)`
          );
          const rows = [...this.ctx.storage.sql.exec(`SELECT key, updated_at FROM auth_states ORDER BY updated_at DESC`)];
          const states = rows.map((r) => ({ key: String(r.key), updatedAt: r.updated_at, scope: "session" }));
          const kv = this.authKv();
          const prefix = this.authKvKey("");
          if (kv && prefix) {
            try {
              const l = await kv.list({ prefix });
              for (const k of l.keys) {
                const key = k.name.slice(prefix.length);
                if (!states.some((s) => s.key === key)) states.push({ key, scope: "saved" });
              }
            } catch {
            }
          }
          return this.result({ authStates: states, count: states.length });
        } catch (e) {
          return this.result({ error: e.message });
        }
      }
    );
    this.server.tool(
      "searchTools",
      "Discover available tool categories and their schemas on-demand. Call with no args to list categories, or with a category to get full tool schemas. This is the most token-efficient way to explore capabilities.",
      {
        category: external_exports.string().optional().describe('Category to get tool schemas for (e.g., "interaction", "perception", "challenge")')
      },
      async ({ category }) => {
        const TOOL_CATEGORIES = {
          core: {
            description: "Essential tools (always available): browse (with playbook pre-warming via intent param), scan, click, type, screenshot",
            tools: ["browse", "scan", "click", "type", "screenshot", "computer_use"]
          },
          perception: {
            description: 'Page understanding: list_page_shortcuts (keyboard schema: accesskey / aria-keyshortcuts / "?" help / API-CLI links \u2014 check it first), grab (content query \u2014 read text, extract links/headings/tables, filter, markdown; React fiber enrichment on React sites), accessibility_tree, detect_framework, frames, get_content, extract_table, extract_links',
            tools: ["page_state", "list_page_shortcuts", "snapshot", "grab", "changes", "accessibility_tree", "detect_framework", "frames", "console_logs", "get_content", "extract_table", "extract_links", "form_fields"]
          },
          interaction: {
            description: "Page interaction: keypress, scroll, hover, select, fill_form, scroll_and_collect",
            tools: ["steps", "keypress", "scroll", "hover", "select", "fill_form", "scroll_and_collect"]
          },
          challenge: {
            description: "Challenge/CAPTCHA handling: detect_challenge, solve_challenge, wait_for_challenge_resolution",
            tools: ["detect_challenge", "solve_challenge", "wait_for_challenge_resolution", "solve_captcha", "dismiss_overlays"]
          },
          session: {
            description: "Session management: session_info, save_auth, load_auth, list_auth, cookies, close_session (stops sandbox container), browser_sessions",
            tools: ["session_info", "live_view", "save_auth", "load_auth", "list_auth", "cookies", "close_session", "browser_sessions", "trace", "trace_get", "bank_workflow", "set_proxy"]
          },
          utility: {
            description: "Code execution & advanced (a sandbox container that COEXISTS with the browser \u2014 using these does NOT close your active browse() page; interleave freely): run_code (persistent Python/Node/Bash REPL), run_command (one-off shell), upload_to_sandbox, download_from_sandbox, reset_interpreter, evaluate (JS in browser), wait_for, skills",
            tools: ["run_code", "run_command", "upload_to_sandbox", "download_from_sandbox", "reset_interpreter", "evaluate", "wait_for", "skills"]
          }
        };
        if (!category) {
          const categories = Object.entries(TOOL_CATEGORIES).map(([id, meta]) => ({
            id,
            description: meta.description,
            toolCount: meta.tools.length
          }));
          return this.result({
            categories,
            totalTools: Object.values(TOOL_CATEGORIES).reduce((n, c) => n + c.tools.length, 0),
            hint: 'Call searchTools({ category: "interaction" }) to get full schemas for a category.'
          });
        }
        const cat2 = TOOL_CATEGORIES[category];
        if (!cat2) {
          return this.result({
            error: `Unknown category: ${category}`,
            availableCategories: Object.keys(TOOL_CATEGORIES)
          });
        }
        return this.result({
          category,
          description: cat2.description,
          tools: cat2.tools,
          hint: `These ${cat2.tools.length} tools are available. Call them directly (they are already registered). Use searchTools() to explore other categories.`
        });
      }
    );
    this.server.tool(
      "skills",
      "Get end-to-end pipeline recipes for complex multi-step tasks. Call with no args to see available skills, or with a topic to get a full step-by-step recipe. Skills combine browser tools, sandbox code execution, and data processing into complete workflows.",
      {
        topic: external_exports.string().optional().describe('Skill topic (e.g., "research-to-pdf", "data-pipeline", "competitive-intel"). Omit to list all available skills.')
      },
      async ({ topic }) => {
        if (!topic) {
          return this.result({
            skills: SKILL_INDEX,
            hint: 'Call skills({ topic: "research-to-pdf" }) to get the full recipe for a skill.'
          });
        }
        const skill = SKILL_CONTENT[topic];
        if (!skill) {
          return this.result({
            error: `Unknown skill topic: "${topic}"`,
            available: SKILL_INDEX.map((s) => s.topic),
            hint: "Call skills() with no args to see all available skills with descriptions."
          });
        }
        const quota = getQuota(this.sessionStartTime);
        return this.result({
          topic,
          title: skill.title,
          estimatedMinutes: skill.estimatedMinutes,
          quotaCost: skill.quotaCost,
          recipe: skill.recipe,
          _yourQuota: quota,
          _note: quota.remaining < (skill.quotaCost === "high" ? 300 : 120) ? `Warning: this skill uses ${skill.quotaCost} quota. You have ${quota.remaining}s remaining.` : void 0
        });
      }
    );
    this.server.tool(
      "run_code",
      "Execute code in a persistent interpreter session. Variables, imports, and state persist across calls \u2014 like a Jupyter notebook. Supports Python, Node.js, and Bash. Each language gets its own session. Use for iterative data processing, analysis, scripting, or any workflow where you need state between calls. Runs in a sandbox container that COEXISTS with the browser \u2014 it does NOT close or replace an active browse() page, so you can freely interleave browser tools (browse/scan/click) and code in one session.",
      {
        code: external_exports.string().describe('Code to execute. Multi-line supported. Examples:\n- Python: "x = [1,2,3]\\nprint(sum(x))"\n- Node: "const data = {a: 1}; data.b = 2; data"\n- Bash: "export FOO=bar && echo $FOO"'),
        language: external_exports.enum(["python", "node", "bash"]).optional().describe("Language runtime (default: python)"),
        sessionId: external_exports.string().optional().describe('Session name for multiple parallel sessions (default: "default")'),
        timeout: external_exports.number().optional().describe("Timeout in seconds (default: 30, max: 120)")
      },
      async ({ code, language, sessionId, timeout }) => {
        if (!this.sandboxPage) {
          if (!this.env.SANDBOX_URL) {
            return this.result({ error: "Sandbox not configured (SANDBOX_URL not set)." });
          }
          try {
            this.sandboxPage = new SandboxPage(this.env.SANDBOX_URL, this.env.AUTH_TOKEN, this.ctx.id.toString());
            await this.sandboxPage.setup();
            if (this.sessionStartTime === null) this.sessionStartTime = Date.now();
          } catch (e) {
            return this.result({ error: `Failed to start sandbox: ${e.message}` });
          }
        }
        try {
          const result = await this.sandboxPage.interpret(
            code,
            language ?? "python",
            sessionId ?? "default",
            Math.min(timeout ?? 30, 120)
          );
          return this.result(result);
        } catch (e) {
          return this.result({ error: e.message });
        }
      }
    );
    this.server.tool(
      "run_command",
      "Execute a one-off shell command in the sandbox container. Stateless \u2014 each call is a fresh shell. For stateful execution (persistent variables), use run_code instead. Use this for file operations, installing packages, or quick system commands. Runs alongside the browser \u2014 it does NOT close an active browse() page, so browser tools and shell commands can be interleaved in one session.",
      {
        command: external_exports.string().describe('Shell command to execute (e.g., "ls -la", "curl -s https://api.example.com", "pip3 install pandas")'),
        timeout: external_exports.number().optional().describe("Timeout in milliseconds (default: 30000, max: 120000)")
      },
      async ({ command, timeout }) => {
        if (!this.sandboxPage) {
          if (!this.env.SANDBOX_URL) {
            return this.result({ error: "Sandbox not configured (SANDBOX_URL not set)." });
          }
          try {
            this.sandboxPage = new SandboxPage(this.env.SANDBOX_URL, this.env.AUTH_TOKEN, this.ctx.id.toString());
            await this.sandboxPage.setup();
            if (this.sessionStartTime === null) this.sessionStartTime = Date.now();
          } catch (e) {
            return this.result({ error: `Failed to start sandbox: ${e.message}` });
          }
        }
        const timeoutMs = Math.min(timeout ?? 3e4, 12e4);
        try {
          const result = await this.sandboxPage.exec(command, timeoutMs);
          const refused = result.error;
          return this.result({
            stdout: result.stdout || "",
            stderr: result.stderr || "",
            exitCode: result.exitCode,
            success: refused ? false : result.success,
            ...refused ? { error: refused } : {}
          });
        } catch (e) {
          return this.result({ error: e.message });
        }
      }
    );
    this.server.tool(
      "upload_to_sandbox",
      "Upload a file to the sandbox container. Send base64-encoded content and a destination path. For files larger than 400KB base64, the tool automatically chunks the transfer. Use this to get PDFs, images, datasets, or any file into the sandbox for processing with run_code/run_command.",
      {
        content_base64: external_exports.string().describe("Base64-encoded file content. For binary files, encode the raw bytes. For text files, encode the UTF-8 text."),
        destination: external_exports.string().describe('Absolute path in the sandbox where the file should be written (e.g., "/tmp/input.pdf", "/home/user/data.csv")'),
        make_executable: external_exports.boolean().optional().describe("If true, chmod +x the file after writing (default: false)")
      },
      async ({ content_base64, destination, make_executable }) => {
        if (this.backend !== "sandbox" || !this.sandboxPage) {
          if (!this.env.SANDBOX_URL) {
            return this.result({ error: "Sandbox not configured (SANDBOX_URL not set)." });
          }
          try {
            this.sandboxPage = new SandboxPage(this.env.SANDBOX_URL, this.env.AUTH_TOKEN, this.ctx.id.toString());
            await this.sandboxPage.setup();
            this.page = this.sandboxPage;
            this.backend = "sandbox";
            this.sessionStartTime = Date.now();
            await this.setState({ sessionId: crypto.randomUUID(), url: null, backend: "sandbox" });
          } catch (e) {
            return this.result({ error: `Failed to start sandbox: ${e.message}` });
          }
        }
        const CHUNK_SIZE = 4e5;
        try {
          const destDir = destination.includes("/") ? destination.slice(0, destination.lastIndexOf("/")) : "";
          if (destDir) {
            await this.sandboxPage.exec(`mkdir -p "${destDir}"`, 5e3);
          }
          if (content_base64.length <= CHUNK_SIZE) {
            const result = await this.sandboxPage.exec(
              `printf '%s' '${content_base64}' | base64 -d > "${destination}"`,
              3e4
            );
            if (!result.success) {
              return this.result({ error: result.stderr || "Write failed", success: false });
            }
          } else {
            const chunks = Math.ceil(content_base64.length / CHUNK_SIZE);
            for (let i = 0; i < chunks; i++) {
              const chunk = content_base64.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
              const op = i === 0 ? ">" : ">>";
              const result = await this.sandboxPage.exec(
                `printf '%s' '${chunk}' | base64 -d ${op} "${destination}"`,
                3e4
              );
              if (!result.success) {
                return this.result({
                  error: `Chunk ${i + 1}/${chunks} failed: ${result.stderr}`,
                  success: false
                });
              }
            }
          }
          if (make_executable) {
            await this.sandboxPage.exec(`chmod +x "${destination}"`, 5e3);
          }
          const stat = await this.sandboxPage.exec(`stat -c '%s' "${destination}" 2>/dev/null || echo 0`, 5e3);
          const fileSize = parseInt((stat.stdout || "0").trim(), 10);
          return this.result({
            success: true,
            destination,
            size: fileSize,
            base64Length: content_base64.length,
            chunked: content_base64.length > CHUNK_SIZE
          });
        } catch (e) {
          return this.result({ error: e.message, success: false });
        }
      }
    );
    this.server.tool(
      "download_from_sandbox",
      "Download a file from the sandbox container as base64. Returns the file content encoded in base64 along with metadata (size, MIME type). Use this to retrieve generated PDFs, processed images, analysis results, or any file from the sandbox.",
      {
        source: external_exports.string().describe('Absolute path in the sandbox to the file to download (e.g., "/tmp/output.pdf", "/home/user/result.csv")'),
        max_size_bytes: external_exports.number().optional().describe("Maximum file size to transfer in bytes (default: 10MB). Files larger than this return an error instead of partial content.")
      },
      async ({ source, max_size_bytes }) => {
        if (this.backend !== "sandbox" || !this.sandboxPage) {
          if (!this.env.SANDBOX_URL) {
            return this.result({ error: "Sandbox not configured (SANDBOX_URL not set)." });
          }
          try {
            this.sandboxPage = new SandboxPage(this.env.SANDBOX_URL, this.env.AUTH_TOKEN, this.ctx.id.toString());
            await this.sandboxPage.setup();
            this.page = this.sandboxPage;
            this.backend = "sandbox";
            this.sessionStartTime = Date.now();
            await this.setState({ sessionId: crypto.randomUUID(), url: null, backend: "sandbox" });
          } catch (e) {
            return this.result({ error: `Failed to start sandbox: ${e.message}` });
          }
        }
        const maxBytes = max_size_bytes ?? 10 * 1024 * 1024;
        try {
          const stat = await this.sandboxPage.exec(
            `stat -c '%s' "${source}" 2>&1`,
            5e3
          );
          if (!stat.success || stat.stdout.includes("No such file")) {
            return this.result({ error: `File not found: ${source}`, success: false });
          }
          const fileSize = parseInt((stat.stdout || "0").trim(), 10);
          if (fileSize > maxBytes) {
            return this.result({
              error: `File too large: ${fileSize} bytes (limit: ${maxBytes}). Increase max_size_bytes or process the file in the sandbox first.`,
              success: false,
              size: fileSize
            });
          }
          const result = await this.sandboxPage.exec(
            `base64 -w0 "${source}"`,
            6e4
          );
          if (!result.success) {
            return this.result({ error: result.stderr || "base64 encoding failed", success: false });
          }
          const base64Content = (result.stdout || "").trim();
          if (!base64Content) {
            return this.result({
              error: "File is empty or base64 encoding produced no output",
              success: false
            });
          }
          const ext = source.includes(".") ? source.slice(source.lastIndexOf(".") + 1).toLowerCase() : "";
          const mimeMap = {
            pdf: "application/pdf",
            png: "image/png",
            jpg: "image/jpeg",
            jpeg: "image/jpeg",
            gif: "image/gif",
            svg: "image/svg+xml",
            webp: "image/webp",
            mp4: "video/mp4",
            zip: "application/zip",
            html: "text/html",
            htm: "text/html",
            css: "text/css",
            js: "application/javascript",
            json: "application/json",
            txt: "text/plain",
            csv: "text/csv",
            xml: "application/xml",
            md: "text/markdown",
            py: "text/x-python",
            sh: "text/x-shellscript",
            yaml: "text/yaml",
            yml: "text/yaml",
            xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          };
          const mimeType = mimeMap[ext] || "application/octet-stream";
          return this.result({
            success: true,
            source,
            size: fileSize,
            mimeType,
            content_base64: base64Content
          });
        } catch (e) {
          return this.result({ error: e.message, success: false });
        }
      }
    );
    this.server.tool(
      "destroy_sandbox",
      "Force-destroy the current sandbox Durable Object after a new container image is deployed. CRITICAL: destroy succeeds but does NOT immediately rotate the image \u2014 Cloudflare's container scheduler may serve the previous image from a warm pool on the immediately-next request. The 5-minute idle eviction (sleepAfter: '5m') is what actually forces a clean image pull. Operator pattern: deploy new image \u2192 call destroy_sandbox \u2192 wait ~5 minutes without touching the sandbox \u2192 next browse/run_command spins up fresh on the new image. Verify with run_command md5sum on /opt/playwright-relay.py.",
      {},
      async () => {
        if (!this.env.SANDBOX_URL) {
          return this.result({ error: "Sandbox not configured (SANDBOX_URL not set)." });
        }
        const sessionId = this.ctx.id.toString();
        try {
          const headers = {
            "Content-Type": "application/json",
            "X-Sandbox-Session": sessionId
          };
          if (this.env.AUTH_TOKEN) headers["Authorization"] = `Bearer ${this.env.AUTH_TOKEN}`;
          const resp = await fetch(`${this.env.SANDBOX_URL}/api/destroy`, {
            method: "POST",
            headers,
            body: "{}"
          });
          const text = await resp.text();
          this.sandboxPage = null;
          if (this.backend === "sandbox") this.backend = "puppeteer";
          this.page = null;
          return this.result({
            destroyed: resp.ok,
            status: resp.status,
            response: text.slice(0, 500),
            note: "Next browse/run_command will spin up a fresh sandbox with the latest container image."
          });
        } catch (e) {
          return this.result({ error: `Destroy failed: ${e.message}` });
        }
      }
    );
    this.server.tool(
      "reset_interpreter",
      "Reset a code interpreter session, clearing all variables and state. Use when you want a clean slate without closing the browser.",
      {
        language: external_exports.enum(["python", "node", "bash"]).optional().describe("Which interpreter to reset (default: python)"),
        sessionId: external_exports.string().optional().describe('Session to reset (default: "default")')
      },
      async ({ language, sessionId }) => {
        if (this.backend !== "sandbox" || !this.sandboxPage) {
          return this.result({ error: "No sandbox session active." });
        }
        try {
          const result = await this.sandboxPage.resetInterpreter(language ?? "python", sessionId ?? "default");
          return this.result(result);
        } catch (e) {
          return this.result({ error: e.message });
        }
      }
    );
    this.server.tool(
      "page_state",
      "One read of the page after you act: URL, title, main heading, ACTIVE FILTERS (checked boxes/radios, each dropdown's current value) and the MAIN result count \u2014 told apart from count labels in suggestion, carousel, sidebar or footer areas (those describe other searches). Use it to check the outcome of a search or filter change instead of several evaluate/grab calls, and before you report a count.",
      {},
      async () => {
        {
          const np = await this.ensurePage();
          if (np) return np;
        }
        try {
          return this.result(await this.page.evaluate(PAGE_STATE_SCRIPT));
        } catch (e) {
          return this.result({ error: String(e?.message || e).slice(0, 300) });
        }
      }
    );
    this.server.tool(
      "list_page_shortcuts",
      `KEYBOARD FIRST: the page's declared keyboard schema before you click \u2014 every accesskey (with the key combo to press on this platform) and aria-keyshortcuts binding, visible <kbd> hints, whether the page advertises a "?" keyboard-help overlay (then keypress "?" and snapshot it), "keyboard shortcuts" controls, and developer / API / CLI links (an API or CLI beats driving the UI). scan and snapshot also show accessKey / aria-keyshortcuts per element.`,
      {},
      async () => {
        {
          const np = await this.ensurePage();
          if (np) return np;
        }
        try {
          return this.result(await this.page.evaluate(PAGE_SHORTCUTS_SCRIPT));
        } catch (e) {
          return this.result({ error: String(e?.message || e).slice(0, 300) });
        }
      }
    );
    this.server.tool(
      "steps",
      "Run several page actions in ONE call, in order \u2014 e.g. click a menu, type a ZIP, press search, then read the result. Each step is { tool, args } with the same tool names and args you would use one call at a time: " + STEPS_ALLOWED.join(", ") + ". Stops at the first failing step (unless continueOnError) and says which one failed. Returns a short line per step plus the full result of the LAST step, so end with a read (scan / grab / get_content / evaluate) when you need to see the outcome. Use it whenever you already know the next few actions: every call you save is a model round saved. A batch REPLACES calls you would make anyway; it is not a reason to add waits or re-checks. click/type/select already wait for the page to react, so a separate wait_for is rarely needed (one that times out is noted and the batch continues).",
      {
        steps: external_exports.array(external_exports.object({ tool: external_exports.string().optional(), args: external_exports.record(external_exports.string(), external_exports.any()).optional() })).min(1).max(STEPS_MAX).describe(`1\u2013${STEPS_MAX} actions, run in order`),
        continueOnError: external_exports.boolean().optional().describe("true: run every step even after a failure (default false: stop at the first failure)")
      },
      async ({ steps, continueOnError }) => {
        const lines = [];
        let last = null;
        let failedAt = null;
        for (let i = 0; i < steps.length; i++) {
          const st = steps[i];
          if (!st.tool && st.args && typeof st.args.tool === "string") {
            st.tool = String(st.args.tool);
            const { tool: _t, ...rest } = st.args;
            st.args = rest;
          }
          const name = String(st.tool || "");
          if (!STEPS_ALLOWED.includes(name)) {
            lines.push(`${i + 1}. ${name}: not allowed inside steps (allowed: ${STEPS_ALLOWED.join(", ")})`);
            failedAt = i + 1;
            if (!continueOnError) break;
            else continue;
          }
          const h = this.toolHandlers.get(name);
          if (!h) {
            lines.push(`${i + 1}. ${name}: unknown tool`);
            failedAt = i + 1;
            if (!continueOnError) break;
            else continue;
          }
          const t0 = Date.now();
          let r;
          const sch = this.toolSchemas.get(name);
          const parsed = sch ? sch.safeParse(st.args ?? {}) : { success: true, data: st.args ?? {} };
          if (!parsed.success) {
            r = { content: [{ type: "text", text: JSON.stringify({ error: `bad args for ${name}: ${parsed.error.issues.map((i2) => `${i2.path.join(".") || "(root)"} ${i2.message}`).join("; ").slice(0, 240)}` }) }] };
          } else {
            try {
              r = await h(parsed.data, {});
            } catch (e) {
              r = { content: [{ type: "text", text: JSON.stringify({ error: String(e?.message || e).slice(0, 300) }) }] };
            }
          }
          const text = String(r?.content?.find?.((c) => c.type === "text")?.text ?? "");
          let obj = null;
          try {
            obj = JSON.parse(text);
          } catch {
          }
          const failed = !!obj && (obj.success === false || typeof obj.error === "string" && obj.error.length > 0);
          const softWait = failed && name === "wait_for" && /timed out|timeout|exceeded/i.test(String(obj?.error || ""));
          const brief = softWait ? `timed out (continuing): ${String(obj.error).slice(0, 120)}` : failed ? `FAILED: ${String(obj.error || "success:false").slice(0, 240)}` : stepBrief(name, obj, text);
          lines.push(`${i + 1}. ${name} (${((Date.now() - t0) / 1e3).toFixed(1)}s): ${brief}`);
          last = r;
          if (failed && !softWait) {
            failedAt = i + 1;
            if (!continueOnError) break;
          }
        }
        const skipped = failedAt && !continueOnError ? steps.length - failedAt : 0;
        const head = `${failedAt ? `stopped at step ${failedAt} of ${steps.length}${skipped ? ` \u2014 steps ${failedAt + 1}\u2013${steps.length} did NOT run; fix step ${failedAt} (another selector, or scan first) and send only what is left` : ""}` : `all ${steps.length} steps ran`}
${lines.join("\n")}`;
        const lastContent = Array.isArray(last?.content) ? last.content : [];
        return { content: [{ type: "text", text: head + (lastContent.length ? "\n\n--- result of the last step that ran ---" : "") }, ...lastContent] };
      }
    );
    this.server.tool(
      "close_session",
      "Close the current browser session and release all resources. Shuts down the sandbox container (if sandbox backend) and frees the Cloudflare Browser Rendering slot. Always call when done browsing.",
      {},
      async () => {
        if (!this.page && !this.browser && !this.sandboxPage) {
          return this.result({ message: "No active session" });
        }
        const wasBackend = this.backend;
        this.noteProxyUsage();
        this.proxyActive = null;
        const capped = (p, ms) => Promise.race([p.catch(() => {
        }), new Promise((r) => setTimeout(r, ms))]);
        if (this.page && this.page !== this.sandboxPage) {
          await capped(this.page.close(), 5e3);
        }
        if (this.browser) {
          await capped(this.browser.close(), 8e3);
          this.browser = null;
        }
        if (this.sandboxPage) {
          await capped(this.sandboxPage.close(), 15e3);
          this.sandboxPage = null;
        }
        this.page = null;
        if (this.sessionStartTime) {
          mcpDailyUsage += (Date.now() - this.sessionStartTime) / 1e3;
          this.sessionStartTime = null;
        }
        this.utilsInjected = false;
        this.finderInjected = false;
        this.bippyInjected = false;
        this.frameworkInfo = null;
        this.backend = "puppeteer";
        this.invalidateCaches();
        this.lastScanElements.clear();
        await this.setState({ sessionId: null, url: null, backend: "puppeteer" });
        return this.result({
          message: `Session closed (was ${wasBackend}), resources released. Container will auto-stop after 5 min idle.`
        });
      }
    );
    this.server.registerResource(
      "quickstart",
      "nexus-browser://docs/quickstart",
      {
        description: "Quick start guide \u2014 essential workflow patterns and first steps",
        mimeType: "text/markdown"
      },
      async () => ({
        contents: [{
          uri: "nexus-browser://docs/quickstart",
          mimeType: "text/markdown",
          text: RESOURCE_QUICKSTART
        }]
      })
    );
    this.server.registerResource(
      "tools-reference",
      "nexus-browser://docs/tools",
      {
        description: "Complete tool reference \u2014 all tools organized by category with parameter details and examples",
        mimeType: "text/markdown"
      },
      async () => ({
        contents: [{
          uri: "nexus-browser://docs/tools",
          mimeType: "text/markdown",
          text: RESOURCE_TOOLS_REFERENCE
        }]
      })
    );
    this.server.registerResource(
      "patterns",
      "nexus-browser://docs/patterns",
      {
        description: "Common workflow patterns \u2014 form filling, data extraction, infinite scroll, authentication, challenge solving",
        mimeType: "text/markdown"
      },
      async () => ({
        contents: [{
          uri: "nexus-browser://docs/patterns",
          mimeType: "text/markdown",
          text: RESOURCE_PATTERNS
        }]
      })
    );
    this.server.registerResource(
      "anti-patterns",
      "nexus-browser://docs/anti-patterns",
      {
        description: "Common mistakes and how to avoid them \u2014 debugging tips and error recovery",
        mimeType: "text/markdown"
      },
      async () => ({
        contents: [{
          uri: "nexus-browser://docs/anti-patterns",
          mimeType: "text/markdown",
          text: RESOURCE_ANTI_PATTERNS
        }]
      })
    );
    this.server.registerPrompt(
      "navigate-and-extract",
      {
        title: "Navigate & Extract Data",
        description: "Navigate to a URL and extract structured data (tables, lists, text). Returns a step-by-step plan the agent should follow.",
        argsSchema: {
          url: external_exports.string().describe("The URL to navigate to"),
          target: external_exports.string().optional().describe('What data to extract (e.g., "product prices", "article text", "table of results")')
        }
      },
      async ({ url, target }) => ({
        messages: [{
          role: "user",
          content: {
            type: "text",
            text: [
              `## Task: Extract data from ${url}`,
              target ? `**Target data:** ${target}` : "",
              "",
              "## Step-by-step plan:",
              `1. \`browse({ url: "${url}" })\` \u2014 Load the page, note the detected framework`,
              "2. `scan({ filter: { isInteractive: false } })` \u2014 Survey the page content and structure",
              '3. **If the target is in a table:** `extract_table({ selector: "table" })` \u2014 Get structured rows',
              '4. **If the target is in text:** `get_content({ format: "markdown" })` \u2014 Get clean readable content',
              "5. **If the target needs scrolling:** `scroll_and_collect({ maxScrolls: 5 })` \u2014 Load lazy content first",
              "6. **If elements are behind interactions:** `scan({ filter: { isInteractive: true } })` then click/select as needed",
              "7. `close_session()` \u2014 Release browser resources when done",
              "",
              "## Tips:",
              '- Use `scan({ filter: { hasText: "..." } })` to find specific content sections',
              '- Use `grab({ selector: "..." })` to inspect element attributes and structure',
              '- Use `extract_links({ filter: "external" })` to find outbound links',
              '- For paginated data, click "Next" and repeat extraction'
            ].filter(Boolean).join("\n")
          }
        }]
      })
    );
    this.server.registerPrompt(
      "fill-form",
      {
        title: "Fill & Submit a Form",
        description: "Navigate to a page with a form, fill it out, and submit. Returns a step-by-step plan.",
        argsSchema: {
          url: external_exports.string().describe("The URL containing the form"),
          fields: external_exports.string().optional().describe('Description of fields to fill (e.g., "name: John, email: john@example.com")')
        }
      },
      async ({ url, fields }) => ({
        messages: [{
          role: "user",
          content: {
            type: "text",
            text: [
              `## Task: Fill form at ${url}`,
              fields ? `**Fields:** ${fields}` : "",
              "",
              "## Step-by-step plan:",
              `1. \`browse({ url: "${url}" })\` \u2014 Load the page`,
              "2. `scan({ filter: { isInteractive: true } })` \u2014 Find all form fields (inputs, selects, textareas, buttons)",
              "3. **Option A \u2014 Fill all at once (preferred):**",
              "   ```",
              "   fill_form({ fields: [",
              '     { selector: "#name", value: "John" },',
              '     { selector: "#email", value: "john@example.com" },',
              '     { selector: "select#country", value: "US" }',
              "   ] })",
              "   ```",
              "4. **Option B \u2014 Fill one by one:** Use `type()` for text inputs, `select()` for dropdowns/checkboxes",
              '5. `scan({ filter: { hasText: "Submit" } })` \u2014 Find the submit button',
              '6. `click({ selector: "button[type=submit]" })` \u2014 Submit the form',
              '7. `wait_for({ navigation: true })` or `wait_for({ selector: ".success-message" })` \u2014 Wait for response',
              "8. `scan()` \u2014 Verify the result (success message, error, redirect)",
              "",
              "## Tips:",
              "- `fill_form` is more reliable than individual `type()` calls \u2014 it handles framework-specific value setting",
              '- For multi-step forms (wizards), scan \u2192 fill \u2192 click "Next" \u2192 repeat',
              "- Use `screenshot()` if you need to verify visual state",
              "- If a CAPTCHA appears, use `detect_challenge()` \u2192 `solve_challenge()`"
            ].filter(Boolean).join("\n")
          }
        }]
      })
    );
    this.server.registerPrompt(
      "monitor-page",
      {
        title: "Monitor Page for Changes",
        description: "Watch a page for content changes over time (prices, availability, new posts). Returns a monitoring plan.",
        argsSchema: {
          url: external_exports.string().describe("The URL to monitor"),
          target: external_exports.string().optional().describe('What to watch for (e.g., "price changes", "new posts", "stock availability")')
        }
      },
      async ({ url, target }) => ({
        messages: [{
          role: "user",
          content: {
            type: "text",
            text: [
              `## Task: Monitor ${url} for changes`,
              target ? `**Watching for:** ${target}` : "",
              "",
              "## Step-by-step plan:",
              `1. \`browse({ url: "${url}" })\` \u2014 Load the page`,
              '2. `scan({ filter: { hasText: "..." } })` \u2014 Baseline scan of the target content',
              "3. Note the current values from scan results",
              "4. **Wait/refresh cycle:**",
              '   - `evaluate({ script: "location.reload()" })` \u2014 Refresh the page',
              "   - `wait_for({ networkIdle: true })` \u2014 Wait for page to load",
              "   - `scan({ _diff: true })` \u2014 Get only what changed since last scan",
              "5. **Compare:** Check if _diff results contain your target changes",
              "6. **If changed:** Extract the new data, report findings",
              "7. **If unchanged:** Repeat from step 4",
              "",
              "## Tips:",
              "- `scan({ _diff: true })` returns only added/changed/removed elements \u2014 very token-efficient",
              '- For price monitoring, use `grab({ selector: ".price" })` for precise element inspection',
              "- `extract_table()` is useful for monitoring tabular data like stock quotes",
              "- Set a reasonable check interval to avoid rate limiting"
            ].filter(Boolean).join("\n")
          }
        }]
      })
    );
    this.server.registerPrompt(
      "solve-challenge",
      {
        title: "Handle CAPTCHA/Challenge Pages",
        description: "Detect and solve Turnstile, hCaptcha, reCAPTCHA, or Cloudflare challenges. Returns a step-by-step plan.",
        argsSchema: {
          url: external_exports.string().optional().describe("URL that triggered the challenge (if not already browsed)")
        }
      },
      async ({ url }) => ({
        messages: [{
          role: "user",
          content: {
            type: "text",
            text: [
              "## Task: Solve a CAPTCHA or challenge page",
              url ? `**URL:** ${url}` : "",
              "",
              "## Step-by-step plan:",
              url ? `1. \`browse({ url: "${url}" })\` \u2014 Load the page` : "1. (Assuming page is already loaded)",
              "2. `detect_challenge()` \u2014 Identify challenge type and location",
              "   - Returns: challengeType, bounds (x, y, width, height), screenshot",
              "3. **For Turnstile/checkbox challenges:**",
              "   - `solve_challenge({ x: <center_x>, y: <center_y> })` \u2014 Click the checkbox",
              "   - The tool uses human-like Bezier mouse movement and monitors for resolution",
              "4. **For complex challenges (image selection, puzzles):**",
              "   - `screenshot({ region: { x, y, width, height } })` \u2014 Capture the challenge",
              "   - Analyze the image to determine the correct action",
              "   - `click({ x, y })` \u2014 Click the correct elements",
              "   - `wait_for_challenge_resolution({ timeoutMs: 30000 })` \u2014 Wait for success",
              "5. **If the challenge persists:**",
              "   - Some challenges are unsolvable by automation \u2014 report back",
              "   - `wait_for_challenge_resolution({ timeoutMs: 60000 })` \u2014 Wait for human help",
              "6. **After resolution:**",
              "   - `save_auth()` \u2014 Save cookies/session to skip challenges next time",
              "   - Continue with your original task",
              "",
              "## Tips:",
              "- Always try `solve_challenge()` first \u2014 it works for most Turnstile checkboxes",
              "- `save_auth()` / `load_auth()` can bypass challenges on return visits",
              "- If on a heavily protected site, consider switching backends (sandbox mode)"
            ].filter(Boolean).join("\n")
          }
        }]
      })
    );
    this.server.registerPrompt(
      "authenticate",
      {
        title: "Log In to a Website",
        description: "Authenticate to a website and save the session for reuse. Returns a step-by-step plan.",
        argsSchema: {
          url: external_exports.string().describe("The login page URL"),
          username: external_exports.string().optional().describe("Username or email to use")
        }
      },
      async ({ url, username }) => ({
        messages: [{
          role: "user",
          content: {
            type: "text",
            text: [
              `## Task: Log in to ${url}`,
              "",
              "## Step-by-step plan:",
              "",
              "### Check for saved session:",
              `1. \`browse({ url: "${url}" })\` \u2014 Load the login page`,
              "2. `list_auth()` \u2014 Check if we have saved auth for this domain",
              '3. **If saved auth exists:** `load_auth({ domain: "..." })` \u2192 navigate to target page \u2192 done',
              "",
              "### Fresh login:",
              "4. `scan({ filter: { isInteractive: true } })` \u2014 Find login form fields",
              "5. `fill_form({ fields: [...] })` \u2014 Fill username and password",
              username ? `   - Username: "${username}"` : "   - You'll need the username/email",
              "   - You'll need the password (ask the user if not provided)",
              '6. `click({ text: "Log in" })` or `click({ selector: "button[type=submit]" })` \u2014 Submit',
              "7. `wait_for({ navigation: true })` \u2014 Wait for redirect",
              "8. **If challenge appears:** Follow the `solve-challenge` prompt workflow",
              '9. **If MFA required:** `screenshot()` \u2192 report to user for code \u2192 `type({ text: "<code>" })`',
              "10. `scan()` \u2014 Verify logged-in state (look for profile name, dashboard, etc.)",
              "11. `save_auth()` \u2014 Save session for future reuse",
              "",
              "## Tips:",
              "- Always `save_auth()` after successful login",
              "- `load_auth()` before navigating restores cookies; after navigating restores localStorage too",
              "- Some sites use OAuth popups \u2014 these may not work in headless mode"
            ].filter(Boolean).join("\n")
          }
        }]
      })
    );
    this.server.registerPrompt(
      "scrape-list",
      {
        title: "Scrape a Paginated List",
        description: "Extract data from a paginated list, feed, or search results across multiple pages. Returns a step-by-step plan.",
        argsSchema: {
          url: external_exports.string().describe("The first page URL"),
          target: external_exports.string().optional().describe("What data to extract from each item")
        }
      },
      async ({ url, target }) => ({
        messages: [{
          role: "user",
          content: {
            type: "text",
            text: [
              `## Task: Scrape paginated list at ${url}`,
              target ? `**Extract:** ${target}` : "",
              "",
              "## Step-by-step plan:",
              `1. \`browse({ url: "${url}" })\` \u2014 Load the first page`,
              "",
              "### For infinite scroll (social feeds, product listings):",
              '2. `scroll_and_collect({ maxScrolls: 10, waitForSelector: ".item" })` \u2014 Auto-scroll and load content',
              '3. `extract_table()` or `get_content({ format: "markdown" })` \u2014 Extract loaded data',
              "",
              "### For numbered pagination (search results, directories):",
              "2. `scan({ filter: { isInteractive: false } })` \u2014 Survey the page structure",
              "3. Extract data from current page:",
              "   - `extract_table()` for tabular data",
              '   - `get_content({ selector: ".results" })` for text content',
              '   - `extract_links({ selector: ".results" })` for link lists',
              '4. `scan({ filter: { hasText: "Next" } })` \u2014 Find the Next/pagination button',
              '5. `click({ text: "Next" })` or `click({ selector: ".pagination .next" })` \u2014 Navigate',
              "6. `wait_for({ networkIdle: true })` \u2014 Wait for next page",
              "7. Repeat steps 3-6 until done",
              "",
              "## Tips:",
              "- `scroll_and_collect` returns `{ totalScrolled, newElements }` \u2014 stop when newElements is 0",
              "- For very long lists, extract in batches to manage memory",
              "- Use `screenshot()` periodically to verify you're on the right page",
              "- `extract_links()` categorizes links as internal/external/navigation \u2014 useful for crawling"
            ].filter(Boolean).join("\n")
          }
        }]
      })
    );
  }
};
var RESOURCE_QUICKSTART = `# NexusBrowser MCP \u2014 Quick Start

## What is this?

A headless Chrome browser you control through MCP tools. Navigate websites, interact with
elements, extract data, fill forms, solve challenges \u2014 all from your agent.

## Your First Session

\`\`\`
1. browse({ url: "https://example.com", intent: "find pricing info" })
   \u2192 Opens Chrome, loads page, returns playbook hints if available
2. scan({ filter: { isInteractive: true } })   \u2192 Returns clickable elements with CSS selectors
3. click({ selector: "a.nav-link" })           \u2192 Clicks using the CSS selector from scan
4. scan()                                       \u2192 Verify the navigation worked
5. get_content({ format: "markdown" })          \u2192 Extract the page as readable text
6. close_session()                              \u2192 Free browser resources + stop container
\`\`\`

## Playbook Pre-Warming

Pass \`intent\` to \`browse()\` to get pre-loaded action patterns from training data:
- **Domain match** (confidence 1.0): If the site is in our Mind2Web dataset (137 websites, 2350 tasks)
- **Category match** (confidence 0.3-0.9): Keyword matching against 25 site categories (travel, shopping, etc.)

The \`_playbook\` field in the response contains step-by-step hints. Example:
\`\`\`
browse({ url: "https://united.com", intent: "book a flight from NYC to LAX" })
\u2192 { ..., _playbook: { matchType: "domain", confidence: 1.0, hint: "Playbook: united.com\\n1. CLICK Trip type dropdown\\n..." } }
\`\`\`

## The Golden Rule: Scan \u2192 Act \u2192 Scan

**ALWAYS scan before interacting.** Never guess selectors or coordinates. The \`scan\` tool
returns elements sorted by relevance, each with a unique \`cssSelector\` field. Use that
selector in subsequent click/type/select calls.

## How Scan Works

\`scan()\` is your primary perception tool. It returns:
- **Element tag, text, id, className** \u2014 what the element is
- **cssSelector** \u2014 unique CSS selector for targeting (via @medv/finder)
- **rect** \u2014 bounding box {x, y, width, height} in viewport coordinates
- **isInteractive** \u2014 whether it's clickable/typeable
- **score** \u2014 relevance ranking

### Scan Filters

| Filter | Example | Use case |
|--------|---------|----------|
| \`isInteractive: true\` | Buttons, links, inputs | Find things to click/type |
| \`hasText: "Submit"\` | Elements containing text | Find specific buttons/labels |
| \`tagName: "input"\` | Elements by HTML tag | Find form fields |
| \`region: {x,y,w,h}\` | Elements in an area | Scope to a page section |

### Scan Optimization

- **Default scan** returns top 20 elements sorted by relevance (~600 tokens)
- \`scan({ snapshot: { countOnly: true } })\` \u2014 Just counts (~20 tokens)
- \`scan({ _diff: true })\` \u2014 Only changes since last scan (great for monitoring)
- \`scan({ maxTokens: 300 })\` \u2014 Truncate results to fit a token budget

## Tool Discovery

Call \`searchTools()\` with no arguments to see all tool categories.
Call \`searchTools({ category: "interaction" })\` to see tools in a category.

## Session Lifecycle

Each MCP connection gets its own isolated sandbox container with a dedicated Chrome instance.
Containers auto-stop after **5 minutes of inactivity** (no billing when idle).
Call \`close_session()\` when done to immediately release browser resources \u2014 the container
will then auto-stop on its idle timer.

## Authentication

- \`save_auth()\` after logging in \u2014 saves cookies + localStorage
- \`load_auth({ domain: "..." })\` on next session \u2014 skips login
- \`list_auth()\` \u2014 see all saved auth states

## Stealth & Human-Like Behavior

All sessions include **automatic stealth** (webdriver hiding, Chrome runtime spoofing, realistic
fingerprints) \u2014 no configuration needed. Interaction tools (\`click\`, \`type\`, \`hover\`) default to
**human-like behavior**: Bezier mouse curves and variable keystroke timing.

Set \`humanLike: false\` on click/type/hover for React-compatible injectable mode (framework-aware
native event dispatch, instant value setting). See the Tools Reference resource for details.
`;
var RESOURCE_TOOLS_REFERENCE = `# NexusBrowser MCP \u2014 Tool Reference

## New in 2026-10-20: snapshot refs, computer_use, trace

### snapshot \u2014 ref-addressed page snapshot
\`snapshot({ root?, maxNodes=400, includeText=false })\` \u2192 one line per interactive control / landmark / heading:
\`[e12] button: "Submit"\`, \`[e13] textbox: "Email" (value="\u2026")\`, \`[e2] navigation: "Main"\`. Then act by ref instead of selector:
\`click({ ref: "e12" })\`, \`type({ ref: "e13", text: "\u2026" })\`, \`hover/keypress/scroll/select({ ref })\`. Refs live until the next snapshot or
navigation (the element is tagged \`data-nexus-ref\`). About 10x fewer tokens than scan when you only need to decide the next action.

### computer_use \u2014 the Anthropic computer-use action set
\`computer_use({ action, coordinate?: [x,y], start_coordinate?, text?, scroll_direction?, scroll_amount?, duration?, screenshotAfter? })\`
Actions: screenshot (returns a viewport JPEG), left_click, right_click, middle_click, double_click, triple_click, left_click_drag,
mouse_move, type, key (xdotool names: "Return", "ctrl+l", "Page_Down"), hold_key, scroll, wait, cursor_position, left_mouse_down, left_mouse_up.
Coordinates default to the current cursor; clicks and moves use the human-like Bezier path. \`screenshotAfter: true\` attaches a fresh
screenshot to any action, which is the loop computer-use models expect.

### trace / trace_get \u2014 per-step artifacts
\`trace({ enabled: true, screenshots?: true, maxSteps? })\` keeps {n, ts, tool, args, url, title[, screenshot]} after every mutating tool.
\`trace_get({ last? })\` lists steps; \`trace_get({ step: n })\` returns that step's screenshot as an image block; \`clear: true\` drops the trail.


## Core Tools (Start Here)

### browse
Navigate to a URL. **Must be called first** before any other page tools.
\`\`\`
browse({ url: "https://example.com" })
\u2192 { title, url, viewport, frameworkInfo }

browse({ url: "https://united.com", intent: "book a flight" })
\u2192 { title, url, viewport, frameworkInfo, _playbook: { matchType, confidence, hint } }
\`\`\`
Returns detected framework (React, Vue, Angular, Next.js, Svelte) and heavy libraries.
Pass \`intent\` to enable **playbook pre-warming** \u2014 returns known action patterns from Mind2Web training data (137 websites, 25 categories).

### scan
Find elements on the page with smart relevance scoring.
\`\`\`
scan({ filter: { isInteractive: true } })                    \u2192 all clickable elements
scan({ filter: { hasText: "Add to Cart", tagName: "button" } }) \u2192 specific button
scan({ snapshot: { countOnly: true } })                       \u2192 element counts only (~20 tokens)
scan({ snapshot: { accessibility: true } })                   \u2192 ARIA roles and labels
scan({ _diff: true })                                         \u2192 only changes since last scan
scan({ maxTokens: 500 })                                      \u2192 truncate to token budget
\`\`\`

### click
Click elements. \`humanLike: true\` (default) uses Bezier mouse curves. \`humanLike: false\` uses injectable event dispatch.
\`\`\`
click({ selector: "button.submit" })       \u2192 by CSS selector (preferred)
click({ text: "Sign In" })                 \u2192 by visible text
click({ x: 150, y: 300 })                 \u2192 by coordinates (use scan results)
click({ selector: "a", waitFor: { navigation: true } }) \u2192 click and wait for page load
click({ selector: "#btn", humanLike: false })            \u2192 precise injectable click
\`\`\`

### type
Type text into inputs. \`humanLike: true\` (default) uses variable keystroke timing. \`humanLike: false\` uses React-compatible native value setters.
\`\`\`
type({ text: "hello@example.com", selector: "#email" })
type({ text: "search query", selector: "#search", waitFor: { selector: ".results" } })
type({ text: "value", selector: "#react-input", humanLike: false }) \u2192 React-compatible
\`\`\`

### screenshot
Capture viewport or element. Auto-constrains for vision API limits.
\`\`\`
screenshot()                               \u2192 full viewport (JPEG, ~80% quality)
screenshot({ selector: ".chart" })         \u2192 specific element (PNG)
screenshot({ region: {x:0, y:0, width:800, height:600} }) \u2192 cropped region
\`\`\`

## Perception Tools

| Tool | Purpose | Example |
|------|---------|---------|
| grab | Content query \u2014 read text, extract links/headings/tables, filter, markdown | \`grab({ selector: "#price" })\` |
| accessibility_tree | Semantic page structure | \`accessibility_tree({ maxDepth: 5 })\` |
| get_content | Page as markdown/HTML | \`get_content({ format: "markdown" })\` |
| extract_table | Structured table data | \`extract_table({ selector: "table.results" })\` |
| extract_links | All links, categorized | \`extract_links({ filter: "external" })\` |
| detect_framework | Frontend stack detection | \`detect_framework()\` |
| frames | List all page frames | \`frames()\` |

### grab \u2014 Content Query Tool (Detail)

**40x cheaper than screenshots for reading text** (~25 tokens vs ~1000).
On React sites, automatically includes component name, stack, props, and source location.

\`\`\`
grab({ selector: "#price" })                           \u2192 element text + attributes + React info
grab({ selectorAll: "a.nav-link" })                    \u2192 ALL matching elements (up to 50)
grab({ selector: "main", extract: "links" })           \u2192 all <a> hrefs and text
grab({ selector: "main", extract: "headings" })        \u2192 all h1-h6 content
grab({ selector: "table", extract: "table" })          \u2192 rows/cells as structured data
grab({ selector: "article", extract: "structured" })   \u2192 headings + paragraphs + lists + links
grab({ selector: "main", format: "markdown" })         \u2192 DOM converted to markdown
grab({ selector: "main", contains: "pricing" })        \u2192 only if text contains "pricing"
grab({ selector: "main", pattern: "\\\\d+\\\\.\\\\d{2}" }) \u2192 regex filter (e.g., prices)
grab({ selector: "main", detail: "quick" })            \u2192 minimal output (500 chars max)
\`\`\`

**When NOT to use screenshot** (use grab instead):
- Reading text content from elements
- Extracting links, headings, or table data
- Checking if specific text exists on page
- Getting element attributes or computed styles

## Interaction Tools

| Tool | Purpose | Example |
|------|---------|---------|
| select | Dropdowns, checkboxes, ranges | \`select({ selector: "#country", value: "US" })\` |
| keypress | Keyboard events | \`keypress({ key: "Enter" })\` |
| scroll | Scroll page/element | \`scroll({ direction: "down", amount: 500 })\` |
| hover | Hover over element (humanLike default) | \`hover({ selector: ".tooltip-trigger" })\` |
| fill_form | Multi-field form filling | \`fill_form({ fields: [...] })\` |
| scroll_and_collect | Infinite scroll automation | \`scroll_and_collect({ maxScrolls: 10 })\` |

## Challenge Tools

| Tool | Purpose | Example |
|------|---------|---------|
| detect_challenge | Find CAPTCHA/Turnstile | \`detect_challenge()\` |
| solve_challenge | Click challenge checkbox | \`solve_challenge({ x, y })\` |
| wait_for_challenge_resolution | Wait for human help | \`wait_for_challenge_resolution({ timeoutMs: 60000 })\` |

## Session Tools

| Tool | Purpose | Example |
|------|---------|---------|
| session_info | Current URL, framework, quota | \`session_info()\` |
| save_auth | Persist login state | \`save_auth()\` |
| load_auth | Restore login state | \`load_auth({ domain: "example.com" })\` |
| list_auth | List saved sessions | \`list_auth()\` |
| cookies | Export/import cookies | \`cookies({ action: "export" })\` |
| close_session | Release browser | \`close_session()\` |
| browser_sessions | Debug: active sessions | \`browser_sessions()\` |

## Utility Tools

| Tool | Purpose | Example |
|------|---------|---------|
| run_code | **Persistent REPL** (Python/Node/Bash) | \`run_code({ code: "x = 42" })\` then \`run_code({ code: "print(x)" })\` |
| run_command | One-off shell command | \`run_command({ command: "pip3 install pandas" })\` |
| upload_to_sandbox | Send file into sandbox | \`upload_to_sandbox({ content_base64: "...", destination: "/tmp/input.pdf" })\` |
| download_from_sandbox | Get file from sandbox | \`download_from_sandbox({ source: "/tmp/output.pdf" })\` |
| reset_interpreter | Clear interpreter state | \`reset_interpreter({ language: "python" })\` |
| evaluate | Run JS in browser page | \`evaluate({ script: "document.title" })\` |
| wait_for | Wait for condition | \`wait_for({ selector: ".loaded", timeout: 5000 })\` |
| searchTools | Discover tools by category | \`searchTools({ category: "interaction" })\` |

### run_code \u2014 Persistent Code Execution

Like a Jupyter notebook: variables, imports, and state persist across calls.

\`\`\`
run_code({ code: "import json\\ndata = {'users': 100}" })         \u2192 Python (default)
run_code({ code: "print(data['users'])" })                        \u2192 100 (variable persists!)
run_code({ code: "const x = 42; x * 2", language: "node" })      \u2192 returnValue: "84"
run_code({ code: "export API=prod", language: "bash" })            \u2192 env var persists
run_code({ code: "echo $API", language: "bash" })                  \u2192 "prod"
\`\`\`

Each language has its own session. Use \`sessionId\` for parallel sessions:
\`\`\`
run_code({ code: "x = 1", sessionId: "analysis-a" })
run_code({ code: "x = 999", sessionId: "analysis-b" })
run_code({ code: "print(x)", sessionId: "analysis-a" })  \u2192 1 (isolated!)
\`\`\`

### File Transfer \u2014 upload_to_sandbox / download_from_sandbox

Transfer files between your agent and the sandbox without workarounds:

\`\`\`
// Upload a PDF for processing
upload_to_sandbox({ content_base64: "<base64>", destination: "/tmp/input.pdf" })

// Process it
run_code({ code: "import fitz; doc = fitz.open('/tmp/input.pdf'); ..." })

// Download the result
download_from_sandbox({ source: "/tmp/output.pdf" })
// \u2192 { success: true, content_base64: "...", size: 232075, mimeType: "application/pdf" }
\`\`\`

- Auto-chunks files >400KB base64 on upload
- \`make_executable: true\` to chmod +x after writing
- \`max_size_bytes\` on download (default 10MB) \u2014 returns error for oversized files
- MIME type auto-detected from file extension

## Stealth & Human-Like Behavior

NexusBrowser includes comprehensive anti-detection and human-like interaction by default.

### The \`humanLike\` Parameter

Available on **click**, **type**, and **hover** tools. Default: \`true\`.

| Mode | click | type | hover |
|------|-------|------|-------|
| \`humanLike: true\` (default) | Bezier cubic curve mouse movement from random origin (50-200px offset, 5-15 intermediate steps, 5-15ms delays), then Puppeteer click | Variable keystroke timing (80-120ms per char, 3% chance of 200-400ms "thinking" pauses) | Bezier mouse movement to element center |
| \`humanLike: false\` | Injectable pointer\u2192mouse\u2192click event dispatch chain (framework-aware, fires all events React/Vue expect) | React-compatible native value setters (sets \`input.value\` + fires \`input\`/\`change\` events via native setter) | Injectable \`mouseover\`/\`mouseenter\` event dispatch |

**When to use \`humanLike: false\`:**
- React/Vue controlled inputs that ignore Puppeteer keystrokes (use \`type({ ..., humanLike: false })\`)
- When you need precise, instant clicks without mouse travel animation
- When interacting with framework-managed state that expects native event dispatch

### Automatic Stealth (Always Active)

Every browser session applies stealth measures via \`evaluateOnNewDocument\` \u2014 they run **before any page scripts** (including Turnstile, reCAPTCHA, bot detection):

| Signal | Spoofed Value |
|--------|---------------|
| \`navigator.webdriver\` | \`false\` (normally \`true\` in headless) |
| \`window.chrome\` | Full Chrome runtime mock (runtime, loadTimes, csi) |
| \`navigator.plugins\` | 3 Chrome plugins (PDF Plugin, PDF Viewer, Native Client) |
| \`navigator.languages\` | \`['en-US', 'en']\` |
| WebGL vendor/renderer | Intel Inc. / Intel Iris OpenGL Engine |
| \`navigator.permissions\` | Returns real notification permission state |
| \`navigator.connection\` | 4g, 50ms RTT, 10Mbps |
| \`navigator.hardwareConcurrency\` | 8 |
| \`navigator.deviceMemory\` | 8 GB |
| User-Agent | Chrome 131 on macOS 10.15.7 |
| Viewport | 1280x800, deviceScaleFactor 1 |

**You do not need to configure stealth** \u2014 it is always active. No parameters to set.
`;
var RESOURCE_PATTERNS = `# NexusBrowser MCP \u2014 Common Patterns

## Pattern 1: Data Extraction

\`\`\`
browse({ url: "https://example.com/products" })
scan({ filter: { isInteractive: false } })           \u2192 survey page structure
extract_table({ selector: "table.products" })         \u2192 structured data
// OR
get_content({ format: "markdown", selector: ".main" }) \u2192 readable text
close_session()
\`\`\`

## Pattern 2: Form Submission

\`\`\`
browse({ url: "https://example.com/signup" })
scan({ filter: { isInteractive: true } })              \u2192 find form fields
fill_form({ fields: [
  { selector: "#name", value: "John" },
  { selector: "#email", value: "john@example.com" },
  { selector: "select#plan", value: "pro" }
] })
click({ text: "Create Account", waitFor: { navigation: true } })
scan()                                                   \u2192 verify success
close_session()
\`\`\`

## Pattern 3: Search & Navigate

\`\`\`
browse({ url: "https://example.com" })
type({ text: "query", selector: "#search" })
keypress({ key: "Enter" })
wait_for({ selector: ".results" })
scan({ filter: { hasText: "relevant result" } })
click({ selector: "<cssSelector from scan>" })
wait_for({ networkIdle: true })
get_content({ format: "markdown" })
close_session()
\`\`\`

## Pattern 4: Infinite Scroll Collection

\`\`\`
browse({ url: "https://example.com/feed" })
scroll_and_collect({ maxScrolls: 10, waitForSelector: ".post" })
// \u2192 { totalScrolled: 8000, newElements: 47 }
get_content({ format: "markdown" })                    \u2192 all loaded content
close_session()
\`\`\`

## Pattern 5: Authentication + Protected Content

\`\`\`
browse({ url: "https://app.example.com" })
load_auth({ domain: "app.example.com" })               \u2192 try saved session
// If no saved auth:
scan({ filter: { isInteractive: true } })               \u2192 find login form
fill_form({ fields: [
  { selector: "#email", value: "user@example.com" },
  { selector: "#password", value: "..." }
] })
click({ text: "Log in", waitFor: { navigation: true } })
save_auth()                                              \u2192 save for next time
// Now access protected content
scan({ filter: { hasText: "Dashboard" } })
\`\`\`

## Pattern 6: Challenge Handling

\`\`\`
browse({ url: "https://protected-site.com" })
detect_challenge()
// \u2192 { challengeType: "turnstile", bounds: { x: 300, y: 400, width: 300, height: 65 } }
solve_challenge({ x: 450, y: 432 })                    \u2192 human-like click on checkbox
// \u2192 { solved: true, method: "click", ... }
save_auth()                                              \u2192 save post-challenge cookies
\`\`\`

## Pattern 7: Multi-Page Scraping

\`\`\`
browse({ url: "https://example.com/results?page=1" })
let allData = [];
for (let page = 1; page <= 5; page++) {
  const data = extract_table({ selector: ".results" });
  allData.push(...data.rows);
  scan({ filter: { hasText: "Next" } });
  click({ text: "Next", waitFor: { networkIdle: true } });
}
close_session()
\`\`\`

## Pattern 8: Visual Verification

\`\`\`
browse({ url: "https://example.com" })
click({ selector: ".add-to-cart" })
wait_for({ selector: ".cart-badge" })
screenshot()                                             \u2192 verify cart updated visually
scan({ filter: { hasText: "1 item" } })                 \u2192 verify programmatically
\`\`\`

## Pattern 9: Monitoring for Changes

\`\`\`
browse({ url: "https://example.com/status" })
scan({ filter: { hasText: "Status" } })                 \u2192 baseline
// ... wait ...
evaluate({ script: "location.reload()" })
wait_for({ networkIdle: true })
scan({ _diff: true })                                   \u2192 only changes returned
// \u2192 { _meta: { diff: { added: [...], changed: [...], removed: [...] } } }
\`\`\`

## Pattern 10: Accessibility Audit

\`\`\`
browse({ url: "https://example.com" })
accessibility_tree({ maxDepth: 6 })                     \u2192 semantic structure
scan({ snapshot: { accessibility: true } })              \u2192 ARIA roles/labels
scan({ filter: { isInteractive: true } })               \u2192 check all interactive elements have labels
\`\`\`

## Pattern 11: Playbook-Guided Navigation

Use the \`intent\` parameter on \`browse()\` to get pre-loaded action patterns:

\`\`\`
browse({ url: "https://united.com/flights", intent: "book a one-way flight from NYC to LAX" })
// \u2192 { ..., _playbook: {
//     matchType: "domain",
//     confidence: 1.0,
//     hint: "Playbook: united.com (travel/airlines)\\n1. CLICK Trip type dropdown\\n2. SELECT One-way option..."
//   } }
// Follow the playbook steps with scan \u2192 act \u2192 scan verification
scan({ filter: { hasText: "Trip type" } })
click({ selector: "<from scan>" })
\`\`\`

Playbook matching levels:
- **Domain** (1.0): Exact site match from Mind2Web training data (137 websites)
- **Category** (0.3-0.9): Semantic keyword match across 25 categories (travel, shopping, service, etc.)

## Pattern 12: Scrape + Analyze with Persistent Code

Combine browser extraction with Python data processing:

\`\`\`
browse({ url: "https://example.com/products" })
extract_table({ selector: "table.products" })              \u2192 structured rows

// Process extracted data in a persistent Python session
run_code({ code: "import json\\ndata = " + JSON.stringify(rows) })
run_code({ code: "prices = [r['price'] for r in data]" })
run_code({ code: "print(f'Avg: {sum(prices)/len(prices):.2f}, Min: {min(prices)}, Max: {max(prices)}')" })
// \u2192 "Avg: 29.99, Min: 9.99, Max: 89.99"

// Install a package and use it
run_command({ command: "pip3 install pandas -q" })
run_code({ code: "import pandas as pd\\ndf = pd.DataFrame(data)\\nprint(df.describe())" })
\`\`\`

## Pattern 13: Content Query with grab

Use grab as a content query tool (like grep/glob for page content):

\`\`\`
browse({ url: "https://docs.example.com" })

// Read text from a specific element (40x cheaper than screenshot)
grab({ selector: "main" })                              \u2192 full text + attributes

// Extract all links from a section
grab({ selector: "nav", extract: "links" })              \u2192 { items: [{ text, href }...] }

// Extract headings for page outline
grab({ selector: "article", extract: "headings" })       \u2192 { items: [{ text, level }...] }

// Get table data without extract_table
grab({ selector: "table", extract: "table" })            \u2192 { items: [{ cells: [...] }...] }

// Full structured content (headings + paragraphs + lists)
grab({ selector: "main", extract: "structured" })        \u2192 comprehensive extraction

// Get markdown representation
grab({ selector: "article", format: "markdown" })        \u2192 DOM-to-markdown conversion

// Query multiple elements at once
grab({ selectorAll: ".product-card", extract: "text" })  \u2192 array of 50 elements

// Filter content by substring or regex
grab({ selector: "main", contains: "pricing" })          \u2192 only if text matches
grab({ selector: "main", pattern: "\\\\$[0-9]+" })       \u2192 regex filter

// On React sites: automatic component context
grab({ selector: ".header" })
// \u2192 { tagName, text, react: { componentName: "Header", componentStack: [...], props: {...}, sourceLocation: {...} } }
\`\`\`

## Future Enhancements (Roadmap)

- **Agent-type-aware formatting**: Tailor grab/scan output per agent type (Lexical format for Cursor, compact text for Claude Code, structured for Codex). Inspired by react-grab relay client provider pattern.
- **Multi-agent relay**: WebSocket relay enabling multiple agents to share a browsing session \u2014 Agent A navigates, Agent B observes and queries simultaneously.
- **React-grab relay client integration**: Bidirectional agent communication via react-grab's relay protocol for richer cross-agent workflows.
- **Sandbox Docker bundling**: Bundle react-grab, bippy, and introspection libraries into the nexus-browser-sandbox Docker image for deeper fiber introspection on CAPTCHA-protected sites.
`;
var RESOURCE_ANTI_PATTERNS = `# NexusBrowser MCP \u2014 Anti-Patterns & Debugging

## Critical Anti-Patterns

### 1. Interacting before browsing
**Wrong:** \`click({ selector: "#btn" })\` \u2192 Error: "No page open"
**Right:** Always call \`browse({ url: "..." })\` first.

### 2. Clicking without scanning
**Wrong:** \`click({ selector: "#submit" })\` \u2192 May not exist, wrong selector
**Right:** \`scan({ filter: { hasText: "Submit" } })\` first, then use the \`cssSelector\` from results.

### 3. Guessing CSS selectors
**Wrong:** \`click({ selector: ".btn-primary" })\` \u2192 Could match multiple elements
**Right:** Use the \`cssSelector\` field from \`scan()\` results \u2014 guaranteed unique on the page.

### 4. Using screenshots for element discovery
**Wrong:** \`screenshot()\` \u2192 parse image to find buttons \u2192 costly, slow, error-prone
**Right:** \`scan({ filter: { isInteractive: true } })\` \u2192 structured data, CSS selectors included.

### 4b. Assuming code tools end the browser session
**Misconception:** "If I call \`run_code\`/\`run_command\` mid-task, I lose my browse page."
**Reality:** They COEXIST. The browser and the code sandbox run side by side in one session \u2014
\`browse \u2192 run_command \u2192 scan \u2192 run_code \u2192 click\` all work; your page is preserved. \`close_session()\`
tears down both. (Note: a sandbox-CPU delay between browser calls does not evict the browser page \u2014
the CF Browser Rendering session is kept alive across DO hibernation and auto-reconnects.)

### 5. Not closing sessions
**Wrong:** Disconnect without \`close_session()\` \u2192 sandbox container stays active, billing continues
**Right:** Always call \`close_session()\` when done. Containers auto-stop after 5 min idle as a safety net, but explicit close is faster and cheaper.

### 6. Ignoring framework detection
**Wrong:** Assume all pages work the same
**Right:** Check \`browse()\` result for \`frameworkInfo\`. React sites benefit from component-aware scanning. Non-React sites benefit from \`accessibility_tree()\`.

## Error Recovery

### "No page open"
Call \`browse({ url: "..." })\` first. All tools except \`browse\` and \`session_info\` require an active page.

### "Element not found"
1. \`scan({ filter: { isInteractive: true } })\` \u2014 re-survey the page
2. The element may be off-screen: \`scroll({ direction: "down" })\` then scan again
3. The element may be in an iframe: \`frames()\` \u2192 try with \`frameIndex\` parameter
4. The page may have changed: \`scan({ _forceRefresh: true })\`

### "Navigation timeout"
The page is slow or blocking. Try:
1. \`wait_for({ networkIdle: true, timeout: 15000 })\` \u2014 longer timeout
2. \`wait_for({ selector: ".content" })\` \u2014 wait for specific element instead

### "Challenge detected"
Follow the challenge workflow:
1. \`detect_challenge()\` \u2192 identify type
2. \`solve_challenge({ x, y })\` \u2192 attempt auto-solve
3. If that fails: \`wait_for_challenge_resolution()\` \u2192 wait for external help

### Stale selectors after navigation
After clicking a link or submitting a form, the page DOM changes. Previous scan results are invalidated. Always re-scan after any navigation:
\`\`\`
click({ selector: "a.next", waitFor: { navigation: true } })
scan({ filter: { isInteractive: true } })   \u2192 fresh results for new page
\`\`\`

## Performance Tips

- Use \`scan({ snapshot: { countOnly: true } })\` (~20 tokens) to quickly check page state
- Use \`scan({ _diff: true })\` to get only changes \u2014 saves tokens on repeated scans
- Use \`scan({ maxTokens: 500 })\` to cap token usage
- Use \`get_content({ format: "markdown" })\` instead of \`screenshot()\` when text is enough
- Call \`close_session()\` promptly \u2014 browser time counts against your quota
`;

// src/shims/storage.ts
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
function sqlStorage(file) {
  fs.mkdirSync(path.dirname(file), { recursive: true, mode: 448 });
  const db = new DatabaseSync(file);
  return {
    exec(query, ...bindings) {
      const stmt = db.prepare(query);
      const reads = /^\s*(select|with|pragma)\b/i.test(query);
      const rows = reads ? stmt.all(...bindings) : (stmt.run(...bindings), []);
      return Object.assign(rows, { toArray: () => rows, one: () => rows[0] ?? null, rowsRead: rows.length, rowsWritten: reads ? 0 : 1 });
    }
  };
}
function fileKV(file) {
  fs.mkdirSync(path.dirname(file), { recursive: true, mode: 448 });
  const load = () => {
    try {
      return JSON.parse(fs.readFileSync(file, "utf8"));
    } catch {
      return {};
    }
  };
  const save = (d) => fs.writeFileSync(file, JSON.stringify(d), { mode: 384 });
  const live2 = (e) => e && (!e.exp || e.exp > Date.now());
  return {
    async get(key, type) {
      const e = load()[key];
      if (!live2(e)) return null;
      const t = typeof type === "string" ? type : type?.type;
      return t === "json" ? JSON.parse(e.v) : e.v;
    },
    async put(key, value, opts) {
      const d = load();
      const exp = opts?.expirationTtl ? Date.now() + opts.expirationTtl * 1e3 : opts?.expiration ? opts.expiration * 1e3 : void 0;
      d[key] = { v: typeof value === "string" ? value : JSON.stringify(value), ...exp ? { exp } : {} };
      save(d);
    },
    async delete(key) {
      const d = load();
      delete d[key];
      save(d);
    },
    async list(opts) {
      const keys = Object.entries(load()).filter(([k, e]) => live2(e) && (!opts?.prefix || k.startsWith(opts.prefix))).map(([name]) => ({ name })).sort((a, b) => a.name.localeCompare(b.name));
      return { keys: keys.slice(0, opts?.limit ?? 1e3), list_complete: true, cursor: "" };
    }
  };
}

// src/sandbox-server.ts
import http from "node:http";
import net from "node:net";
import crypto2 from "node:crypto";
import path4 from "node:path";

// src/shims/cf-sandbox.ts
import { spawn } from "node:child_process";
import fs2 from "node:fs";
import os from "node:os";
import path2 from "node:path";
var sandboxConfig = { dir: "", extensionsDir: "", env: {}, vncPort: 5900, wsPort: 6080, display: 99, relayPort: 8222, interpPort: 8223, cdpPort: 9222 };
function claimSandboxInstance() {
  const alive = (pid) => {
    try {
      process.kill(pid, 0);
      return true;
    } catch (e) {
      return e.code === "EPERM";
    }
  };
  const ownerOf = (f) => {
    try {
      return Number(fs2.readFileSync(f, "utf8").trim()) || 0;
    } catch {
      return 0;
    }
  };
  for (let n = 99; n < 160; n++) {
    const lock = path2.join(os.tmpdir(), `nexus-browser-sandbox-${n}.lock`);
    const xlock = `/tmp/.X${n}-lock`;
    const xo = ownerOf(xlock);
    const o = ownerOf(lock);
    if (o && o !== process.pid && alive(o)) continue;
    if (xo && alive(xo) && !(o && o !== process.pid)) {
      if (!o) continue;
    }
    try {
      fs2.writeFileSync(lock, String(process.pid));
    } catch {
      continue;
    }
    if (ownerOf(lock) !== process.pid) continue;
    sandboxConfig.display = n;
    const exitClean = () => {
      try {
        if (ownerOf(lock) === process.pid) fs2.rmSync(lock);
      } catch {
      }
    };
    process.once("exit", exitClean);
    return n;
  }
  throw new Error("no free display for the local browser sandbox (:99\u2013:159 all in use)");
}
function mapPaths(cmd) {
  if (!sandboxConfig.dir) return cmd;
  return cmd.replace(/\/opt\/extensions\b/g, sandboxConfig.extensionsDir || `${sandboxConfig.dir}/extensions`).replace(/\/opt\/(playwright-relay\.py|code-interpreter\.py)\b/g, (_m, f) => `${sandboxConfig.dir}/${f}`).replace(/websockify 0\.0\.0\.0:/g, "websockify 127.0.0.1:").replace(/\b5900\b/g, String(sandboxConfig.vncPort)).replace(/\b6080\b/g, String(sandboxConfig.wsPort)).replace(/(^|[^0-9]):99\b/g, `$1:${sandboxConfig.display}`).replace(/127\.0\.0\.1:8222\b/g, `127.0.0.1:${sandboxConfig.relayPort}`).replace(/127\.0\.0\.1:8223\b/g, `127.0.0.1:${sandboxConfig.interpPort}`).replace(/pgrep -x x11vnc\b/g, `pgrep -f "x11vnc -display :${sandboxConfig.display} "`).replace(/(playwright-relay\.py|code-interpreter\.py)(\s*&)/g, `$1 --nb-display=${sandboxConfig.display}$2`).replace(/\/usr\/bin\/google-chrome-stable\b/g, sandboxConfig.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || "/usr/bin/google-chrome-stable");
}
var LocalSandbox = class {
  constructor(id) {
    this.id = id;
  }
  /** Output goes to temp FILES, not pipes: a command that starts a background process (Xvfb …&, the relay) leaves that process
   *  holding the output — with a pipe it would die of SIGPIPE once we stop reading; a file it can keep writing. Resolves when bash exits. */
  exec(cmd, opts = {}) {
    return new Promise((resolve) => {
      const base2 = path2.join(os.tmpdir(), `nb-exec-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
      const out = fs2.openSync(`${base2}.out`, "w"), err2 = fs2.openSync(`${base2}.err`, "w");
      fs2.writeFileSync(`${base2}.sh`, mapPaths(cmd), { mode: 384 });
      const inst = {
        NB_RELAY_PORT: String(sandboxConfig.relayPort),
        NB_INTERP_PORT: String(sandboxConfig.interpPort),
        NB_CDP_PORT: String(sandboxConfig.cdpPort),
        ...sandboxConfig.display !== 99 ? { NB_PROFILE_DIR: `/tmp/chrome-profile-${sandboxConfig.display}` } : {},
        // The relay takes its sandbox down when this process dies, however it dies (2026-11-03: a SIGKILLed browse delegate left relay +
        // Chrome + Xvfb on :99 and the next delegate's Chrome could not take the profile).
        NB_OWNER_PID: String(process.pid)
      };
      const child = spawn("bash", [`${base2}.sh`], { env: { ...process.env, ...sandboxConfig.env, ...inst, ...opts.env ?? {} }, stdio: ["ignore", out, err2] });
      let done = false;
      let extra = "";
      const finish = (code) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        fs2.closeSync(out);
        fs2.closeSync(err2);
        fs2.rm(`${base2}.sh`, () => {
        });
        const read = (f) => {
          try {
            return fs2.readFileSync(f, "utf8");
          } catch {
            return "";
          } finally {
            fs2.rm(f, () => {
            });
          }
        };
        const stdout = read(`${base2}.out`), stderr = read(`${base2}.err`) + extra;
        resolve({ stdout, stderr, exitCode: code, success: code === 0 });
      };
      const timer = setTimeout(() => {
        child.kill("SIGKILL");
        extra = `
[local sandbox] timed out after ${opts.timeout} ms`;
        finish(124);
      }, opts.timeout ?? 12e4);
      child.on("exit", (code) => finish(code ?? 1));
      child.on("error", (e) => {
        extra = String(e);
        finish(127);
      });
    });
  }
  async destroy() {
    await stopLocalSandboxProcesses();
  }
  /** Live view: the local server upgrades the WebSocket itself (see sandbox-server.ts); a fetch-level call only gets this marker. */
  async wsConnect(_req, port) {
    const local = port === 6080 ? sandboxConfig.wsPort : port;
    return new Response(null, { status: 426, headers: { "x-local-ws-port": String(local) } });
  }
};
var sandboxes = /* @__PURE__ */ new Map();
function getSandbox(_ns, id, _opts) {
  let s = sandboxes.get(id);
  if (!s) {
    s = new LocalSandbox(id);
    sandboxes.set(id, s);
  }
  return s;
}
async function proxyToSandbox(_req, _env) {
  return null;
}
function stopLocalSandboxProcesses() {
  return new Promise((resolve) => {
    const d = sandboxConfig.display;
    const pats = [
      `${sandboxConfig.dir}/playwright-relay.py --nb-display=${d}`,
      `${sandboxConfig.dir}/code-interpreter.py --nb-display=${d}`,
      `Xvfb :${d} `,
      `x11vnc -display :${d} `,
      `websockify 127.0.0.1:${sandboxConfig.wsPort} `
    ];
    const profile = d !== 99 ? `/tmp/chrome-profile-${d}` : "/tmp/chrome-profile";
    const pattern = [...pats.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `--user-data-dir=${profile}( |$)`].join("|");
    const kill = (sig, then) => {
      const k = spawn("pkill", [sig, "-f", pattern], { stdio: "ignore" });
      k.on("exit", then);
      k.on("error", then);
    };
    kill("-TERM", () => setTimeout(() => kill("-KILL", () => setTimeout(resolve, 200)), 2e3));
  });
}

// ../../../nexus-terminal/workers/nexus-browser-sandbox/src/index.ts
var DISPLAY = ":99";
var RESOLUTION = "1280x800x24";
var RELAY_URL = "http://127.0.0.1:8222";
var INTERPRETER_URL = "http://127.0.0.1:8223";
var CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};
function json(data, status = 200) {
  return Response.json(data, { status, headers: CORS_HEADERS });
}
function err(message, status = 400) {
  return json({ error: message }, status);
}
var ARGV_BODY_MAX = 48 * 1024;
async function postLargeBody(sandbox, url, bodyJson, timeout, label) {
  const f = `/tmp/body-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.json`;
  await sandbox.writeFile(f, bodyJson);
  const r = await sandbox.exec(`curl -s --max-time ${Math.ceil(timeout / 1e3)} -X POST -H 'Content-Type: application/json' --data-binary @${f} ${url}; rm -f ${f}`, { timeout: timeout + 5e3 });
  try {
    return JSON.parse(r.stdout.trim());
  } catch {
    return { error: r.stderr || r.stdout || `${label} call failed` };
  }
}
async function relayCall(sandbox, endpoint, body, timeout = 3e4) {
  const method = body !== void 0 ? "POST" : "GET";
  let cmd;
  if (method === "GET") {
    cmd = `curl -s --max-time ${Math.ceil(timeout / 1e3)} ${RELAY_URL}${endpoint}`;
  } else {
    const bodyJson = JSON.stringify(body);
    if (bodyJson.length > ARGV_BODY_MAX && typeof sandbox.writeFile === "function") return postLargeBody(sandbox, `${RELAY_URL}${endpoint}`, bodyJson, timeout, "relay");
    const hex = Array.from(new TextEncoder().encode(bodyJson)).map((b) => b.toString(16).padStart(2, "0")).join("");
    cmd = `python3 -c "import sys;sys.stdout.buffer.write(bytes.fromhex('${hex}'))" | curl -s --max-time ${Math.ceil(timeout / 1e3)} -X POST -H 'Content-Type: application/json' -d @- ${RELAY_URL}${endpoint}`;
  }
  const result = await sandbox.exec(cmd, { timeout: timeout + 5e3 });
  try {
    return JSON.parse(result.stdout.trim());
  } catch {
    return { error: result.stderr || result.stdout || "relay call failed" };
  }
}
async function ensureRelay(sandbox) {
  const check = await sandbox.exec(
    `curl -s --max-time 2 ${RELAY_URL}/health 2>/dev/null || echo "NOT_RUNNING"`,
    { timeout: 5e3 }
  );
  if (!check.stdout.includes("NOT_RUNNING") && check.stdout.includes('"status"')) {
    return true;
  }
  const xv = await sandbox.exec(`pgrep -f "Xvfb ${DISPLAY}" >/dev/null && echo up || echo down`, { timeout: 5e3 });
  if (xv.stdout.includes("down")) {
    await sandbox.exec(`Xvfb ${DISPLAY} -screen 0 ${RESOLUTION} -ac +extension GLX +render -noreset &`, { timeout: 5e3 });
    await sleep(1e3);
  }
  await sandbox.exec(
    `DISPLAY=${DISPLAY} PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/google-chrome-stable python3 /opt/playwright-relay.py &`,
    { timeout: 5e3 }
  );
  for (let i = 0; i < 10; i++) {
    await sleep(500);
    const probe = await sandbox.exec(
      `curl -s --max-time 1 ${RELAY_URL}/health 2>/dev/null || echo "NOT_READY"`,
      { timeout: 3e3 }
    );
    if (!probe.stdout.includes("NOT_READY") && probe.stdout.includes('"status"')) {
      return true;
    }
  }
  return false;
}
async function ensureInterpreter(sandbox) {
  const check = await sandbox.exec(
    `curl -s --max-time 2 ${INTERPRETER_URL}/health 2>/dev/null || echo "NOT_RUNNING"`,
    { timeout: 5e3 }
  );
  if (!check.stdout.includes("NOT_RUNNING") && check.stdout.includes('"status"')) {
    return true;
  }
  await sandbox.exec(`python3 /opt/code-interpreter.py &`, { timeout: 5e3 });
  for (let i = 0; i < 6; i++) {
    await sleep(500);
    const probe = await sandbox.exec(
      `curl -s --max-time 1 ${INTERPRETER_URL}/health 2>/dev/null || echo "NOT_READY"`,
      { timeout: 3e3 }
    );
    if (!probe.stdout.includes("NOT_READY") && probe.stdout.includes('"status"')) {
      return true;
    }
  }
  return false;
}
function toHex(str) {
  return Array.from(new TextEncoder().encode(str)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
var PROXY_DIR = "/tmp/nexus-proxy";
async function interpreterCall(sandbox, endpoint, body, timeout = 3e4) {
  const method = body !== void 0 ? "POST" : "GET";
  let cmd;
  if (method === "GET") {
    cmd = `curl -s --max-time ${Math.ceil(timeout / 1e3)} ${INTERPRETER_URL}${endpoint}`;
  } else {
    const bodyJson = JSON.stringify(body);
    if (bodyJson.length > ARGV_BODY_MAX && typeof sandbox.writeFile === "function") return postLargeBody(sandbox, `${INTERPRETER_URL}${endpoint}`, bodyJson, timeout, "interpreter");
    const hex = Array.from(new TextEncoder().encode(bodyJson)).map((b) => b.toString(16).padStart(2, "0")).join("");
    cmd = `python3 -c "import sys;sys.stdout.buffer.write(bytes.fromhex('${hex}'))" | curl -s --max-time ${Math.ceil(timeout / 1e3)} -X POST -H 'Content-Type: application/json' -d @- ${INTERPRETER_URL}${endpoint}`;
  }
  const result = await sandbox.exec(cmd, { timeout: timeout + 5e3 });
  try {
    return JSON.parse(result.stdout.trim());
  } catch {
    return { error: result.stderr || result.stdout || "interpreter call failed" };
  }
}
var src_default = {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }
    if (!env.AUTH_TOKEN) {
      return err("AUTH_TOKEN not configured \u2014 refusing all requests (fail-closed)", 503);
    }
    const auth = request.headers.get("Authorization");
    if (auth !== `Bearer ${env.AUTH_TOKEN}`) {
      return err("Unauthorized", 401);
    }
    const proxyResponse = await proxyToSandbox(request, env);
    if (proxyResponse) return proxyResponse;
    const url = new URL(request.url);
    const rawSessionId = request.headers.get("X-Sandbox-Session") || url.searchParams.get("session") || "default";
    const sessionId = rawSessionId.slice(0, 49);
    const sandbox = getSandbox(env.Sandbox, `nexus-browser-${sessionId}`, {
      sleepAfter: "5m"
      // Auto-stop container after 5 min idle (saves billing)
    });
    const path6 = url.pathname;
    try {
      if (path6 === "/live" && request.headers.get("Upgrade")?.toLowerCase() === "websocket") {
        const xvfb = await sandbox.exec(`pgrep -f "Xvfb ${DISPLAY}" >/dev/null && echo up || echo down`);
        if (!xvfb.stdout.includes("up")) {
          return err('No browser display in this session yet \u2014 browse with backend "sandbox" first', 409);
        }
        await sandbox.exec(
          // x11vnc stays localhost-only; websockify must listen on the container's network address because
          // sandbox.wsConnect proxies to it from outside the container (10.0.0.1:6080) — reachable only through this
          // AUTH_TOKEN-gated route. Wait (≤ 5 s) until the port actually listens before connecting.
          `pgrep -x x11vnc >/dev/null || x11vnc -display ${DISPLAY} -forever -shared -nopw -localhost -rfbport 5900 -quiet -bg -o /tmp/x11vnc.log; pgrep -f "websockify.*6080" >/dev/null || (nohup websockify 0.0.0.0:6080 127.0.0.1:5900 >/tmp/websockify.log 2>&1 &); for i in $(seq 1 25); do (exec 3<>/dev/tcp/127.0.0.1/6080) 2>/dev/null && break; sleep 0.2; done`,
          { timeout: 12e3 }
        );
        return sandbox.wsConnect(request, 6080);
      }
      if (path6 === "/api/setup" && request.method === "POST") {
        const status = [];
        const check = await sandbox.exec(
          'echo "chromium:$(which google-chrome-stable 2>/dev/null || which google-chrome 2>/dev/null || which chromium 2>/dev/null || which chromium-browser 2>/dev/null || ls /usr/bin/google-chrome* 2>/dev/null || ls /usr/bin/chromium* 2>/dev/null || echo MISSING)" && echo "xdotool:$(which xdotool 2>/dev/null || echo MISSING)" && echo "python3:$(which python3 2>/dev/null || echo MISSING)" && echo "PATH:$PATH"'
        );
        const checkOutput = check.stdout.trim();
        if (checkOutput.includes("chromium:MISSING")) {
          return err(`Chrome/Chromium not found in container. Debug: ${checkOutput.slice(0, 500)}`, 500);
        }
        if (checkOutput.includes("xdotool:MISSING")) {
          return err("xdotool not found in container image. Dockerfile may need rebuild.", 500);
        }
        const xvfbCheck = await sandbox.exec(`pgrep -f "Xvfb ${DISPLAY}" || echo "NOT_RUNNING"`);
        if (xvfbCheck.stdout.includes("NOT_RUNNING")) {
          await sandbox.exec(
            `Xvfb ${DISPLAY} -screen 0 ${RESOLUTION} -ac +extension GLX +render -noreset &`,
            { timeout: 5e3 }
          );
          await sleep(1e3);
          status.push("xvfb-started");
        } else {
          status.push("xvfb-already-running");
        }
        const relayUp = await ensureRelay(sandbox);
        status.push(relayUp ? "relay-started" : "relay-failed");
        const verify = await sandbox.exec(
          `DISPLAY=${DISPLAY} xdotool getdisplaygeometry 2>&1`
        );
        return json({
          success: relayUp,
          status,
          display: verify.stdout.trim(),
          resolution: RESOLUTION
        });
      }
      if (path6 === "/api/status") {
        const xvfb = await sandbox.exec(`pgrep -f "Xvfb ${DISPLAY}" && echo "running" || echo "stopped"`);
        const relay = await sandbox.exec(
          `curl -s --max-time 1 ${RELAY_URL}/health 2>/dev/null || echo '{"status":"stopped"}'`
        );
        let relayStatus = { status: "stopped" };
        try {
          relayStatus = JSON.parse(relay.stdout.trim());
        } catch {
        }
        return json({
          xvfb: xvfb.stdout.includes("running") ? "running" : "stopped",
          relay: relayStatus
        });
      }
      if (path6 === "/api/browse" && request.method === "POST") {
        const body = await request.json();
        if (!body.url) return err("url required");
        await ensureRelay(sandbox);
        const result = await relayCall(sandbox, "/navigate", {
          url: body.url,
          waitUntil: body.waitUntil ?? "domcontentloaded",
          timeout: body.timeout ?? 3e4
        }, (body.timeout ?? 3e4) + 5e3);
        if (result.error) return json({ error: result.error }, 500);
        return json({
          success: true,
          url: result.url,
          title: result.title,
          screenshot: result.screenshot,
          screenshotFormat: result.screenshotFormat || "jpeg"
        });
      }
      if (path6 === "/api/detect_challenge" && request.method === "POST") {
        const evalResult = await relayCall(sandbox, "/evaluate", {
          script: `(() => {
            const title = document.title;
            const isChallenge = title.includes('Just a moment') ||
              title.includes('Attention Required') ||
              title.includes('Security Check');
            return { title, isChallenge };
          })()`
        });
        const screenshotResult = await relayCall(sandbox, "/screenshot");
        return json({
          challengeDetected: evalResult?.result?.isChallenge ?? false,
          windowTitle: evalResult?.result?.title ?? "unknown",
          screenshot: screenshotResult?.screenshot ?? null,
          screenshotFormat: "jpeg",
          hint: evalResult?.result?.isChallenge ? "Challenge detected. Use /api/click with approximate checkbox coordinates." : "No challenge detected."
        });
      }
      if (path6 === "/api/click" && request.method === "POST") {
        const body = await request.json();
        if (body.x === void 0 || body.y === void 0) return err("x and y required");
        const humanLike = body.humanLike !== false;
        const postWait = body.postClickWaitMs ?? 5e3;
        if (body.xdotool === true) {
          const off = await windowOffset(sandbox);
          const sx = body.x + off.ox + off.sx, sy = body.y + off.oy + off.sy;
          if (humanLike) await humanMouseMove(sandbox, sx, sy);
          else {
            await sandbox.exec(`DISPLAY=${DISPLAY} xdotool mousemove ${sx} ${sy}`);
            await sleep(50);
          }
          await sandbox.exec(`DISPLAY=${DISPLAY} xdotool click 1`);
        } else {
          await ensureRelay(sandbox);
          const r = await relayCall(sandbox, "/mouse", { action: "click", x: body.x, y: body.y, humanLike, button: body.button || "left", clickCount: body.clickCount || 1 }, 15e3);
          if (r?.error) return json({ error: r.error }, 500);
        }
        await sleep(postWait);
        const [screenshot, title] = await Promise.all([
          relayCall(sandbox, "/screenshot"),
          relayCall(sandbox, "/evaluate", { script: "document.title" })
        ]);
        return json({
          clicked: { x: body.x, y: body.y },
          humanLike,
          windowTitle: title?.result ?? "unknown",
          screenshot: screenshot?.screenshot ?? null,
          screenshotFormat: "jpeg"
        });
      }
      if (path6 === "/api/type" && request.method === "POST") {
        const body = await request.json();
        if (!body.text) return err("text required");
        const delay = body.delayMs ?? 80;
        const safeText = body.text.replace(/'/g, "'\\''");
        await sandbox.exec(
          `DISPLAY=${DISPLAY} xdotool type --delay ${delay} '${safeText}'`
        );
        return json({ typed: body.text.length, success: true });
      }
      const KEY_OK = /^[A-Za-z0-9_+]{1,40}$/;
      const FOCUS_CHROME = `DISPLAY=${DISPLAY} xdotool search --onlyvisible --class chrom 2>/dev/null | head -1 | xargs -r -I{} xdotool windowfocus {} 2>/dev/null; `;
      if (path6 === "/api/press" && request.method === "POST") {
        const body = await request.json();
        if (!body.key) return err("key required");
        if (!KEY_OK.test(body.key)) return err("invalid key name");
        await sandbox.exec(`${FOCUS_CHROME}DISPLAY=${DISPLAY} xdotool key ${body.key}`);
        return json({ pressed: body.key, success: true });
      }
      if ((path6 === "/api/keydown" || path6 === "/api/keyup") && request.method === "POST") {
        const body = await request.json();
        if (!body.key || !KEY_OK.test(body.key)) return err("invalid key name");
        await sandbox.exec(`${FOCUS_CHROME}DISPLAY=${DISPLAY} xdotool ${path6 === "/api/keydown" ? "keydown" : "keyup"} ${body.key}`);
        return json({ success: true });
      }
      if (path6 === "/api/press_and_hold" && request.method === "POST") {
        const body = await request.json();
        if (body.x === void 0 || body.y === void 0) return err("x and y required");
        const holdMs = Math.max(500, Math.min(15e3, body.holdMs ?? 3500));
        {
          const off = await windowOffset(sandbox);
          body.x = Number(body.x) + off.ox + off.sx;
          body.y = Number(body.y) + off.oy + off.sy;
        }
        const jitterPx = Math.max(0, Math.min(8, body.jitterPx ?? 2));
        const targetX = Math.round(body.x);
        const targetY = Math.round(body.y);
        const lines = [];
        if (body.humanLikeApproach !== false) {
          const startX = targetX + Math.round((Math.random() - 0.5) * 280);
          const startY = targetY + Math.round((Math.random() - 0.5) * 220);
          const cp1x = startX + (targetX - startX) * 0.3 + (Math.random() - 0.5) * 80;
          const cp1y = startY + (targetY - startY) * 0.3 + (Math.random() - 0.5) * 80;
          const cp2x = startX + (targetX - startX) * 0.7 + (Math.random() - 0.5) * 80;
          const cp2y = startY + (targetY - startY) * 0.7 + (Math.random() - 0.5) * 80;
          const dist = Math.hypot(targetX - startX, targetY - startY);
          const steps = Math.max(8, Math.min(20, Math.round(8 + dist / 60)));
          const flightMs = Math.max(350, Math.min(700, Math.round(dist * 1.4)));
          const stepDelayMs = Math.round(flightMs / steps);
          lines.push(`xdotool mousemove ${startX} ${startY}`);
          lines.push(`sleep ${(0.08 + Math.random() * 0.12).toFixed(3)}`);
          const ease = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
          for (let i = 1; i <= steps; i++) {
            const t = ease(i / steps);
            const u = 1 - t;
            const mx = Math.round(u * u * u * startX + 3 * u * u * t * cp1x + 3 * u * t * t * cp2x + t * t * t * targetX);
            const my = Math.round(u * u * u * startY + 3 * u * u * t * cp1y + 3 * u * t * t * cp2y + t * t * t * targetY);
            lines.push(`xdotool mousemove ${mx} ${my}`);
            lines.push(`sleep ${(stepDelayMs / 1e3).toFixed(3)}`);
          }
          for (let i = 0; i < 3; i++) {
            const wx = targetX + Math.round((Math.random() - 0.5) * 4);
            const wy = targetY + Math.round((Math.random() - 0.5) * 4);
            lines.push(`xdotool mousemove ${wx} ${wy}`);
            lines.push(`sleep ${(0.04 + Math.random() * 0.04).toFixed(3)}`);
          }
          lines.push(`xdotool mousemove ${targetX} ${targetY}`);
          lines.push(`sleep ${(0.06 + Math.random() * 0.08).toFixed(3)}`);
        }
        lines.push(`xdotool mousedown 1`);
        const stepCount = Math.max(1, Math.floor(holdMs / 80));
        const range = jitterPx * 2 + 1;
        const offset = jitterPx;
        lines.push(`for i in $(seq 1 ${stepCount}); do`);
        lines.push(`  dx=$((RANDOM % ${range} - ${offset}))`);
        lines.push(`  dy=$((RANDOM % ${range} - ${offset}))`);
        lines.push(`  xdotool mousemove $((${targetX} + dx)) $((${targetY} + dy))`);
        lines.push(`  sleep 0.08`);
        lines.push(`done`);
        lines.push(`xdotool mouseup 1`);
        const script = lines.join("; ");
        const start = Date.now();
        await sandbox.exec(
          `DISPLAY=${DISPLAY} bash -c '${script}'`,
          { timeout: holdMs + 15e3 }
        );
        const actualHoldMs = Date.now() - start;
        return json({
          pressed: { x: targetX, y: targetY },
          holdMs,
          actualHoldMs,
          stepCount,
          jitterPx,
          flytoApproach: body.humanLikeApproach !== false,
          scriptLines: lines.length,
          success: true
        });
      }
      if (path6 === "/api/screenshot") {
        const result = await relayCall(sandbox, "/screenshot");
        if (result.error || !result.screenshot) {
          await sandbox.exec(
            `DISPLAY=${DISPLAY} import -window root -quality 85 /tmp/screenshot.jpg`,
            { timeout: 1e4 }
          );
          const b642 = await sandbox.exec("base64 -w0 /tmp/screenshot.jpg");
          const binary2 = atob(b642.stdout.trim());
          const bytes2 = new Uint8Array(binary2.length);
          for (let i = 0; i < binary2.length; i++) bytes2[i] = binary2.charCodeAt(i);
          return new Response(bytes2, {
            headers: { "Content-Type": "image/jpeg", "Cache-Control": "no-store", ...CORS_HEADERS }
          });
        }
        const binary = atob(result.screenshot);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        return new Response(bytes, {
          headers: { "Content-Type": "image/jpeg", "Cache-Control": "no-store", ...CORS_HEADERS }
        });
      }
      if (path6 === "/api/screenshot/json") {
        const result = await relayCall(sandbox, "/screenshot");
        if (result.error) {
          await sandbox.exec(
            `DISPLAY=${DISPLAY} import -window root -quality 80 /tmp/screenshot.jpg`,
            { timeout: 1e4 }
          );
          const b642 = await sandbox.exec("base64 -w0 /tmp/screenshot.jpg");
          return json({ screenshot: b642.stdout.trim(), format: "jpeg" });
        }
        return json({ screenshot: result.screenshot, format: "jpeg" });
      }
      if (path6 === "/api/exec" && request.method === "POST") {
        const body = await request.json();
        if (!body.command) return err("command required");
        const result = await sandbox.exec(
          `DISPLAY=${DISPLAY} ${body.command}`,
          { timeout: body.timeout ?? 3e4 }
        );
        return json({
          stdout: result.stdout,
          stderr: result.stderr,
          exitCode: result.exitCode,
          success: result.success
        });
      }
      if (path6 === "/api/interpret" && request.method === "POST") {
        const body = await request.json();
        if (!body.code) return err("code required");
        await ensureInterpreter(sandbox);
        const timeout = Math.min(body.timeout ?? 30, 120);
        const result = await interpreterCall(sandbox, "/execute", {
          language: body.language ?? "python",
          code: body.code,
          sessionId: body.sessionId ?? "default",
          timeout
        }, (timeout + 5) * 1e3);
        if (result.error && !result.output && !result.returnValue) {
          return json({ error: result.error }, 500);
        }
        return json(result);
      }
      if (path6 === "/api/interpret/reset" && request.method === "POST") {
        const body = await request.json();
        await ensureInterpreter(sandbox);
        const result = await interpreterCall(sandbox, "/reset", {
          language: body.language ?? "python",
          sessionId: body.sessionId ?? "default"
        });
        return json(result);
      }
      if (path6 === "/api/interpret/sessions") {
        await ensureInterpreter(sandbox);
        const result = await interpreterCall(sandbox, "/sessions");
        return json(result);
      }
      if (path6 === "/api/evaluate" && request.method === "POST") {
        const body = await request.json();
        if (!body.script) return err("script required");
        const result = await relayCall(sandbox, "/evaluate", {
          script: body.script,
          ...body.isolatedContext === false ? { isolatedContext: false } : {},
          ...body.frame !== void 0 && body.frame !== null ? { frame: body.frame } : {}
        }, body.timeout ?? 3e4);
        if (result.error) return json({ error: result.error }, 500);
        return json({ result: result.result ?? null });
      }
      if (path6 === "/api/console" && request.method === "POST") {
        const body = await request.json().catch(() => ({}));
        await ensureRelay(sandbox);
        const r = await relayCall(sandbox, "/console", body || {}, 15e3);
        if (r?.error) return json({ error: r.error }, 500);
        return json({ total: r.total ?? 0, entries: r.entries || [] });
      }
      if (path6 === "/api/frames") {
        await ensureRelay(sandbox);
        const r = await relayCall(sandbox, "/frames", {}, 15e3);
        if (r?.error) return json({ error: r.error }, 500);
        return json({ frames: r.frames || [] });
      }
      if (path6 === "/api/mouse" && request.method === "POST") {
        const body = await request.json();
        await ensureRelay(sandbox);
        const r = await relayCall(sandbox, "/mouse", body, 15e3);
        if (r?.error) return json({ error: r.error }, 500);
        return json(r);
      }
      if (path6 === "/api/cdp" && request.method === "POST") {
        const body = await request.json();
        if (!body.method) return err("method required");
        const result = await relayCall(sandbox, "/cdp", {
          method: body.method,
          params: body.params || {}
        }, body.timeout ?? 3e4);
        if (result.error) return json({ error: result.error }, 500);
        return json(result);
      }
      if (path6 === "/api/init_script" && request.method === "POST") {
        const body = await request.json();
        if (!body.script || typeof body.script !== "string") return err("script (string) required");
        const result = await relayCall(sandbox, "/init_script", {
          script: body.script,
          applyNow: body.applyNow ?? true
        }, body.timeout ?? 3e4);
        if (result.error) return json({ error: result.error }, 500);
        return json(result);
      }
      if (path6 === "/api/set_cookies" && request.method === "POST") {
        const body = await request.json();
        if (!body.cookies?.length) return err("cookies array required");
        const result = await relayCall(sandbox, "/cookies/set", {
          cookies: body.cookies
        });
        if (result.error) return json({ error: result.error }, 500);
        return json({ success: true, set: result.set, total: body.cookies.length });
      }
      if (path6 === "/api/extract_cookies" && request.method === "POST") {
        const body = await request.json();
        const result = await relayCall(sandbox, "/cookies/get", {
          domain: body.domain || ""
        });
        if (result.error) return json({ error: result.error }, 500);
        return json({ cookies: result.cookies, count: result.count });
      }
      if (path6 === "/api/scroll" && request.method === "POST") {
        const body = await request.json();
        const x = body.x ?? 640;
        const y = body.y ?? 400;
        const clicks = body.clicks ?? 3;
        const button = body.direction === "up" ? 4 : 5;
        await sandbox.exec(`DISPLAY=${DISPLAY} xdotool mousemove ${x} ${y}`);
        for (let i = 0; i < clicks; i++) {
          await sandbox.exec(`DISPLAY=${DISPLAY} xdotool click ${button}`);
          await sleep(50);
        }
        return json({ scrolled: true, direction: body.direction, clicks });
      }
      if (path6 === "/api/wait_for_navigation" && request.method === "POST") {
        const body = await request.json();
        const timeout = body.timeoutMs ?? 3e4;
        if (body.selector || body.urlPattern || body.state) {
          const result = await relayCall(sandbox, "/wait", {
            selector: body.selector,
            urlPattern: body.urlPattern,
            state: body.state,
            timeout
          }, timeout + 5e3);
          const screenshot2 = await relayCall(sandbox, "/screenshot");
          return json({
            ...result,
            screenshot: screenshot2?.screenshot ?? null,
            screenshotFormat: "jpeg"
          });
        }
        const poll = 1e3;
        const start = Date.now();
        let polls = 0;
        let lastTitle = "";
        while (Date.now() - start < timeout) {
          polls++;
          await sleep(poll);
          const titleResult = await relayCall(sandbox, "/evaluate", {
            script: "document.title"
          });
          const title = titleResult?.result ?? "unknown";
          lastTitle = title;
          if (body.expectTitleContains && title.includes(body.expectTitleContains)) {
            const screenshot2 = await relayCall(sandbox, "/screenshot");
            return json({
              resolved: true,
              method: "titleContains",
              polls,
              elapsedMs: Date.now() - start,
              windowTitle: title,
              screenshot: screenshot2?.screenshot,
              screenshotFormat: "jpeg"
            });
          }
          if (body.expectTitleNotContains && !title.includes(body.expectTitleNotContains)) {
            const screenshot2 = await relayCall(sandbox, "/screenshot");
            return json({
              resolved: true,
              method: "titleChanged",
              polls,
              elapsedMs: Date.now() - start,
              windowTitle: title,
              screenshot: screenshot2?.screenshot,
              screenshotFormat: "jpeg"
            });
          }
          if (!body.expectTitleContains && !body.expectTitleNotContains) {
            if (!title.includes("Just a moment") && !title.includes("Security Check") && title !== "unknown") {
              const screenshot2 = await relayCall(sandbox, "/screenshot");
              return json({
                resolved: true,
                method: "challengeGone",
                polls,
                elapsedMs: Date.now() - start,
                windowTitle: title,
                screenshot: screenshot2?.screenshot,
                screenshotFormat: "jpeg"
              });
            }
          }
        }
        const screenshot = await relayCall(sandbox, "/screenshot");
        return json({
          resolved: false,
          method: "timeout",
          polls,
          elapsedMs: Date.now() - start,
          windowTitle: lastTitle,
          screenshot: screenshot?.screenshot,
          screenshotFormat: "jpeg"
        });
      }
      if (path6 === "/api/solve_turnstile" && request.method === "POST") {
        const body = await request.json();
        if (!body.url) return err("url required");
        const waitBefore = body.waitBeforeClickMs ?? 4e3;
        const waitAfter = body.waitAfterClickMs ?? 8e3;
        const xvfbCheck = await sandbox.exec(`pgrep -f "Xvfb ${DISPLAY}" || echo "NOT_RUNNING"`);
        if (xvfbCheck.stdout.includes("NOT_RUNNING")) {
          await sandbox.exec(`Xvfb ${DISPLAY} -screen 0 ${RESOLUTION} -ac +extension GLX +render -noreset &`);
          await sleep(1e3);
        }
        await ensureRelay(sandbox);
        await relayCall(sandbox, "/close", {});
        await sleep(300);
        const navResult = await relayCall(sandbox, "/launch", {
          url: body.url,
          timeout: 15e3
        }, 2e4);
        await sleep(waitBefore);
        const findResult = await relayCall(sandbox, "/evaluate", {
          script: `(() => {
            var iframe = document.querySelector('iframe[src*="challenges.cloudflare.com"], iframe[src*="turnstile"]');
            if (iframe) {
              var r = iframe.getBoundingClientRect();
              return { x: Math.round(r.x + 30), y: Math.round(r.y + r.height / 2), method: 'iframe', rect: { x: r.x, y: r.y, width: r.width, height: r.height } };
            }
            var container = document.querySelector('[class*="cf-turnstile"], .cf-turnstile, #cf-turnstile-container');
            if (container) {
              var r = container.getBoundingClientRect();
              return { x: Math.round(r.x + 30), y: Math.round(r.y + r.height / 2), method: 'container', rect: { x: r.x, y: r.y, width: r.width, height: r.height } };
            }
            var checkbox = document.querySelector('#challenge-running input[type="checkbox"], .challenge-platform input');
            if (checkbox) {
              var r = checkbox.getBoundingClientRect();
              return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2), method: 'checkbox', rect: { x: r.x, y: r.y, width: r.width, height: r.height } };
            }
            return null;
          })()`
        });
        const cbLocation = findResult?.result;
        const cbX = cbLocation?.x ?? 210;
        const cbY = cbLocation?.y ?? 336;
        const beforeScreenshot = await relayCall(sandbox, "/screenshot");
        await humanMouseMove(sandbox, cbX, cbY);
        await sandbox.exec(`DISPLAY=${DISPLAY} xdotool click 1`);
        await sleep(waitAfter);
        const afterScreenshot = await relayCall(sandbox, "/screenshot");
        const titleResult = await relayCall(sandbox, "/evaluate", {
          script: "document.title"
        });
        const pageTitle = titleResult?.result || "";
        const challengePassed = !!pageTitle && !pageTitle.includes("Just a moment") && !pageTitle.includes("Security Check") && !pageTitle.includes("Attention Required");
        return json({
          url: body.url,
          challengePassed,
          pageTitle,
          clickedAt: { x: cbX, y: cbY },
          clickMethod: cbLocation?.method ?? "fallback",
          beforeScreenshot: beforeScreenshot?.screenshot,
          afterScreenshot: afterScreenshot?.screenshot,
          screenshotFormat: "jpeg"
        });
      }
      if (path6 === "/api/proxy/open" && request.method === "POST") {
        const body = await request.json();
        if (!body.sshHost || !body.sshPort || !body.key) return err("sshHost, sshPort, key required");
        const port = Math.floor(Number(body.localPort) || 1080);
        if (!(port >= 1024 && port <= 65535)) return err("localPort must be 1024..65535");
        const host = String(body.sshHost).replace(/[^A-Za-z0-9_.:-]/g, "");
        const sshPort = Math.floor(Number(body.sshPort));
        const user = String(body.user || "root").replace(/[^A-Za-z0-9_.-]/g, "");
        if (!host || !(sshPort > 0 && sshPort < 65536) || !user) return err("bad ssh endpoint");
        const key = body.key.endsWith("\n") ? body.key : body.key + "\n";
        const keyFile = `${PROXY_DIR}/${port}.key`, pidFile = `${PROXY_DIR}/${port}.pid`, logFile = `${PROXY_DIR}/${port}.log`;
        const hasSsh = await sandbox.exec("command -v ssh || echo MISSING", { timeout: 5e3 });
        if (hasSsh.stdout.includes("MISSING")) return err("openssh-client is not in this container image (needs image >= 2.8.0)", 500);
        await sandbox.exec(
          `mkdir -p ${PROXY_DIR} && chmod 700 ${PROXY_DIR} && ( [ -f ${pidFile} ] && kill $(cat ${pidFile}) 2>/dev/null; rm -f ${pidFile} ${logFile}; true ) && umask 077 && python3 -c "import sys;sys.stdout.buffer.write(bytes.fromhex('${toHex(key)}'))" > ${keyFile} && chmod 600 ${keyFile}` + // 2026-10-22: a short-lived CA certificate for the ephemeral key (ssh loads <key>-cert.pub automatically)
          (body.cert ? ` && python3 -c "import sys;sys.stdout.buffer.write(bytes.fromhex('${toHex(String(body.cert).trim() + "\n")}'))" > ${keyFile}-cert.pub && chmod 600 ${keyFile}-cert.pub` : ""),
          { timeout: 8e3 }
        );
        await sandbox.exec(
          `setsid nohup ssh -N -D 127.0.0.1:${port} -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o BatchMode=yes -o ServerAliveInterval=30 -o ServerAliveCountMax=3 -o ExitOnForwardFailure=yes -o ConnectTimeout=20 -o LogLevel=ERROR -i ${keyFile} -p ${sshPort} ${user}@${host} > ${logFile} 2>&1 < /dev/null & echo $! > ${pidFile}`,
          { timeout: 5e3 }
        );
        let open = false;
        for (let i = 0; i < 25; i++) {
          await sleep(1e3);
          const probe = await sandbox.exec(
            `python3 -c "import socket,sys;s=socket.socket();s.settimeout(1);sys.exit(0 if s.connect_ex(('127.0.0.1',${port}))==0 else 1)" && echo OPEN || ( kill -0 $(cat ${pidFile} 2>/dev/null) 2>/dev/null && echo WAIT || echo DEAD )`,
            { timeout: 4e3 }
          );
          if (probe.stdout.includes("OPEN")) {
            open = true;
            break;
          }
          if (probe.stdout.includes("DEAD")) break;
        }
        await sandbox.exec(`rm -f ${keyFile} ${keyFile}-cert.pub`, { timeout: 3e3 });
        if (!open) {
          const log = await sandbox.exec(`tail -c 600 ${logFile} 2>/dev/null; kill $(cat ${pidFile} 2>/dev/null) 2>/dev/null; rm -f ${pidFile}; true`, { timeout: 4e3 });
          return json({ open: false, error: "tunnel did not open", log: (log.stdout || "").slice(0, 600) }, 502);
        }
        return json({ open: true, localPort: port, server: `socks5://127.0.0.1:${port}`, hostId: body.hostId ?? null });
      }
      if (path6 === "/api/proxy/close" && request.method === "POST") {
        const body = await request.json().catch(() => ({}));
        const port = body.localPort ? Math.floor(Number(body.localPort)) : 0;
        const target = port ? `${PROXY_DIR}/${port}.pid` : `${PROXY_DIR}/*.pid`;
        const r = await sandbox.exec(`n=0; for f in ${target}; do [ -f "$f" ] || continue; kill $(cat "$f") 2>/dev/null && n=$((n+1)); rm -f "$f"; done; rm -f ${PROXY_DIR}/*.key; echo closed=$n`, { timeout: 5e3 });
        return json({ closed: true, tunnels: Number((r.stdout.match(/closed=(\d+)/) || [])[1] || 0) });
      }
      if (path6 === "/api/proxy/status") {
        const r = await sandbox.exec(
          `for f in ${PROXY_DIR}/*.pid; do [ -f "$f" ] || continue; p=$(basename "$f" .pid); if kill -0 $(cat "$f") 2>/dev/null; then python3 -c "import socket,sys;s=socket.socket();s.settimeout(1);sys.exit(0 if s.connect_ex(('127.0.0.1',$p))==0 else 1)" && echo "$p open" || echo "$p dead-port"; else echo "$p dead"; fi; done; true`,
          { timeout: 6e3 }
        );
        const tunnels = (r.stdout || "").trim().split("\n").filter(Boolean).map((l) => {
          const [p, st] = l.split(" ");
          return { localPort: Number(p), state: st };
        });
        return json({ tunnels });
      }
      if (path6 === "/api/launch" && request.method === "POST") {
        const body = await request.json().catch(() => ({}));
        await ensureRelay(sandbox);
        const payload = {};
        if ("proxy" in body) payload.proxy = body.proxy ?? null;
        if (typeof body.incognito === "boolean") payload.incognito = body.incognito;
        const result = await relayCall(sandbox, "/launch", payload, 45e3);
        if (result?.error) return json({ error: result.error }, 500);
        return json({ success: true, url: result.url, title: result.title, proxy: result.proxy ?? null, incognito: !!result.incognito });
      }
      if (path6 === "/api/close" && request.method === "POST") {
        await relayCall(sandbox, "/close", {});
        await sandbox.exec("pkill -f Xvfb 2>/dev/null || true");
        await sandbox.exec(`for f in ${PROXY_DIR}/*.pid; do [ -f "$f" ] && kill $(cat "$f") 2>/dev/null; done; rm -rf ${PROXY_DIR}; true`, { timeout: 5e3 });
        return json({ closed: true });
      }
      if (path6 === "/api/destroy" && request.method === "POST") {
        try {
          await sandbox.destroy();
          return json({ destroyed: true });
        } catch (e) {
          return json({ destroyed: false, error: String(e?.message || e) }, 500);
        }
      }
      return json({
        name: "nexus-browser-sandbox",
        version: "2.0.0",
        architecture: "Playwright relay (CDP) + xdotool (OS-level input)",
        endpoints: [
          "POST /api/setup \u2014 Start Xvfb + Playwright relay (deps pre-baked)",
          "POST /api/browse \u2014 Navigate to URL via Playwright",
          "POST /api/evaluate \u2014 Evaluate JS via Playwright",
          "POST /api/cdp \u2014 Raw CDP command via Playwright",
          "POST /api/init_script \u2014 Register a pre-load script (context.add_init_script) + apply to the current page",
          "POST /api/set_cookies \u2014 Set cookies via Playwright context",
          "POST /api/extract_cookies \u2014 Get cookies via Playwright context",
          "POST /api/detect_challenge \u2014 Check for Turnstile/challenge page",
          "POST /api/click \u2014 OS-level mouse click (human-like via xdotool)",
          "POST /api/solve_turnstile \u2014 Full orchestrated Turnstile solve",
          "POST /api/wait_for_navigation \u2014 Wait for page state change",
          "POST /api/type \u2014 Type text via xdotool",
          "POST /api/press \u2014 Press key via xdotool",
          "POST /api/keydown, /api/keyup \u2014 hold / release a key (modifiers) via xdotool",
          "POST /api/scroll \u2014 Scroll via xdotool",
          "POST /api/exec \u2014 Run shell command",
          "POST /api/interpret \u2014 Execute code in persistent session (Python/Node/Bash)",
          "POST /api/interpret/reset \u2014 Reset an interpreter session",
          "GET  /api/interpret/sessions \u2014 List active interpreter sessions",
          "GET  /api/screenshot \u2014 Get screenshot as JPEG image",
          "GET  /api/screenshot/json \u2014 Get screenshot as base64 JSON",
          "GET  /api/status \u2014 Service status (Xvfb + relay)",
          "POST /api/close \u2014 Close browser + stop services"
        ]
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Error on ${request.method} ${path6}: ${message}`);
      return json({ error: message }, 500);
    }
  }
};
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function windowOffset(sandbox) {
  try {
    const r = await relayCall(sandbox, "/window_offset", {}, 8e3);
    const o = r?.offset || {};
    return { ox: Number(o.ox) || 0, oy: Number(o.oy) || 0, sx: Number(o.sx) || 0, sy: Number(o.sy) || 0 };
  } catch {
    return { ox: 0, oy: 0, sx: 0, sy: 0 };
  }
}
async function humanMouseMove(sandbox, targetX, targetY) {
  const startX = targetX + Math.round((Math.random() - 0.5) * 250);
  const startY = targetY + Math.round((Math.random() - 0.5) * 200);
  await sandbox.exec(`DISPLAY=${DISPLAY} xdotool mousemove ${startX} ${startY}`);
  await sleep(100 + Math.random() * 200);
  const steps = 6 + Math.floor(Math.random() * 5);
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const jitter = (1 - t) * 18;
    const mx = Math.round(startX + (targetX - startX) * t + (Math.random() - 0.5) * jitter);
    const my = Math.round(startY + (targetY - startY) * t + (Math.random() - 0.5) * jitter);
    await sandbox.exec(`DISPLAY=${DISPLAY} xdotool mousemove ${mx} ${my}`);
    await sleep(12 + Math.random() * 22);
  }
  await sandbox.exec(`DISPLAY=${DISPLAY} xdotool mousemove ${targetX} ${targetY}`);
  await sleep(60 + Math.random() * 100);
}

// src/local-store.ts
import fs3 from "node:fs";
import path3 from "node:path";
import { DatabaseSync as DatabaseSync2 } from "node:sqlite";
var COLS = ["recipe_id", "host", "kind", "fingerprint", "recipe_json", "successes", "failures", "score", "promoted", "source", "updated_at"];
function localStore(dataDir) {
  fs3.mkdirSync(dataDir, { recursive: true, mode: 448 });
  const db = new DatabaseSync2(path3.join(dataDir, "workflows.sqlite"));
  db.exec(`CREATE TABLE IF NOT EXISTS web_recipe (recipe_id TEXT PRIMARY KEY, host TEXT, kind TEXT, fingerprint TEXT, recipe_json TEXT,
    successes INTEGER DEFAULT 0, failures INTEGER DEFAULT 0, score REAL DEFAULT 0.5, promoted INTEGER DEFAULT 0, source TEXT,
    created_at INTEGER, updated_at INTEGER, last_success_at INTEGER DEFAULT 0, last_note TEXT DEFAULT '');
    CREATE TABLE IF NOT EXISTS decisions (id INTEGER PRIMARY KEY AUTOINCREMENT, at INTEGER, args TEXT);`);
  const laplace = (s, f) => (s + 1) / (s + f + 2);
  const reducers = {
    upsert_web_recipe([id, host, kind, fingerprint, recipe_json, source, promoted]) {
      const now = Date.now();
      const row = db.prepare("SELECT recipe_id FROM web_recipe WHERE recipe_id = ?").get(id);
      if (row) db.prepare("UPDATE web_recipe SET recipe_json = ?, fingerprint = ?, source = ?, updated_at = ?, promoted = CASE WHEN ? THEN 1 ELSE promoted END WHERE recipe_id = ?").run(String(recipe_json), String(fingerprint), String(source), now, promoted ? 1 : 0, id);
      else db.prepare("INSERT INTO web_recipe (recipe_id, host, kind, fingerprint, recipe_json, source, promoted, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?)").run(id, host, kind, String(fingerprint), String(recipe_json), String(source), promoted ? 1 : 0, now, now);
    },
    record_web_recipe_outcome([id, success, note]) {
      const r = db.prepare("SELECT successes, failures, promoted FROM web_recipe WHERE recipe_id = ?").get(id);
      if (!r) throw new Error(`no recipe ${id}`);
      const s = r.successes + (success ? 1 : 0), f = r.failures + (success ? 0 : 1), score = laplace(s, f);
      let promoted = r.promoted;
      if (s >= 2 && score >= 0.6) promoted = 1;
      if (s + f >= 3 && score < 0.4) promoted = 0;
      db.prepare("UPDATE web_recipe SET successes = ?, failures = ?, score = ?, promoted = ?, updated_at = ?, last_note = ?, last_success_at = CASE WHEN ? THEN ? ELSE last_success_at END WHERE recipe_id = ?").run(s, f, score, promoted, Date.now(), String(note ?? ""), success ? 1 : 0, Date.now(), id);
    },
    record_npc_decision(args) {
      db.prepare("INSERT INTO decisions (at, args) VALUES (?, ?)").run(Date.now(), JSON.stringify(args));
    }
  };
  return {
    /** Handle a /stdb/… request; returns [status, json body]. */
    handle(subPath, body) {
      if (subPath === "/sql") {
        const host = /FROM web_recipe WHERE host = '([^']*)'/i.exec(body)?.[1];
        if (host === void 0) return [400, { error: "the local store only answers the web_recipe query" }];
        const rows = db.prepare(`SELECT ${COLS.join(", ")} FROM web_recipe WHERE host = ?`).all(host).map((r) => COLS.map((c) => c === "promoted" ? !!r[c] : r[c]));
        return [200, [{ schema: { elements: COLS.map((c) => ({ name: { some: c } })) }, rows }]];
      }
      const m = /^\/call\/([a-z_]+)$/.exec(subPath);
      if (m && reducers[m[1]]) {
        let args;
        try {
          args = JSON.parse(body || "[]");
        } catch {
          return [400, { error: "bad JSON" }];
        }
        try {
          reducers[m[1]](Array.isArray(args) ? args : [args]);
          return [200, {}];
        } catch (e) {
          return [530, { error: String(e.message) }];
        }
      }
      return [404, { error: `the local store has no ${subPath}` }];
    }
  };
}

// src/sandbox-server.ts
var VIEWER = (q) => `<!doctype html><html><head><meta charset="utf-8"><title>Live browser</title>
<style>html,body{margin:0;height:100%;background:#111;color:#ddd;font:13px system-ui}#bar{padding:6px 10px}#screen{height:calc(100% - 30px)}</style></head>
<body><div id="bar">Live browser \u2014 you can watch and take over. <span id="st">connecting\u2026</span></div><div id="screen"></div>
<script type="module">
import RFB from 'https://cdn.jsdelivr.net/npm/@novnc/novnc@1.5.0/core/rfb.js';
const rfb = new RFB(document.getElementById('screen'), 'ws://' + location.host + '/live?${q}');
rfb.scaleViewport = true; rfb.viewOnly = false;
rfb.addEventListener('connect', () => st.textContent = 'connected');
rfb.addEventListener('disconnect', () => st.textContent = 'disconnected');
</script></body></html>`;
async function signedLive(url, token) {
  const s = url.searchParams.get("s") ?? "", exp = Number(url.searchParams.get("exp") ?? 0), sig = url.searchParams.get("sig") ?? "";
  if (!s || !sig || !exp) return null;
  return await verifyLive(token, s, exp, sig) ? s : null;
}
var EXEC_PATHS = /^\/api\/(exec|interpret)(\/|$)/;
function freePort() {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.once("error", reject);
    s.listen(0, "127.0.0.1", () => {
      const p = s.address().port;
      s.close(() => resolve(p));
    });
  });
}
async function startLocalSandbox(opts) {
  const store = localStore(opts.dataDir);
  sandboxConfig.dir = opts.dir;
  sandboxConfig.extensionsDir = path4.join(opts.toolsHome, "extensions");
  sandboxConfig.env = { ...opts.env ?? {} };
  [sandboxConfig.vncPort, sandboxConfig.wsPort] = [await freePort(), await freePort()];
  claimSandboxInstance();
  [sandboxConfig.relayPort, sandboxConfig.interpPort, sandboxConfig.cdpPort] = [await freePort(), await freePort(), await freePort()];
  await stopLocalSandboxProcesses();
  const token = crypto2.randomBytes(24).toString("hex");
  const env = { AUTH_TOKEN: token, Sandbox: {} };
  const allowExec = opts.allowExec ?? process.env.NEXUS_BROWSER_ALLOW_EXEC === "1";
  const toRequest = (req, body) => new Request(`http://127.0.0.1${req.url}`, {
    method: req.method,
    headers: req.headers,
    ...body && body.length && req.method !== "GET" && req.method !== "HEAD" ? { body } : {}
  });
  const server = http.createServer(async (req, res) => {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    try {
      const u = new URL(req.url ?? "/", "http://127.0.0.1");
      const path6 = u.pathname;
      if (path6 === "/viewer") {
        if (!await signedLive(u, token)) {
          res.writeHead(403);
          res.end("invalid or expired live link");
          return;
        }
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
        res.end(VIEWER(u.search.slice(1)));
        return;
      }
      if (path6.startsWith("/stdb/")) {
        if (req.headers.authorization !== `Bearer ${token}`) {
          res.writeHead(401);
          res.end('{"error":"Unauthorized"}');
          return;
        }
        const [status, json2] = store.handle(path6.slice(5), Buffer.concat(chunks).toString("utf8"));
        res.writeHead(status, { "Content-Type": "application/json" });
        res.end(JSON.stringify(json2));
        return;
      }
      if (EXEC_PATHS.test(path6) && !allowExec) {
        res.writeHead(403, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "run_command / run_code execute on this machine and are off by default. Set NEXUS_BROWSER_ALLOW_EXEC=1 (or allowExec: true) to enable them." }));
        return;
      }
      const r = await src_default.fetch(toRequest(req, Buffer.concat(chunks)), env, { waitUntil() {
      } });
      const headers = {};
      r.headers.forEach((v, k) => {
        headers[k] = v;
      });
      res.writeHead(r.status, headers);
      res.end(Buffer.from(await r.arrayBuffer()));
    } catch (e) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: String(e?.message ?? e).slice(0, 500) }));
    }
  });
  server.on("upgrade", async (req, socket, head) => {
    try {
      const u = new URL(req.url ?? "/", "http://127.0.0.1");
      if (u.pathname === "/live" && !req.headers.authorization) {
        const session = await signedLive(u, token);
        if (!session) {
          socket.end("HTTP/1.1 403 Forbidden\r\n\r\ninvalid or expired live link");
          return;
        }
        req.headers.authorization = `Bearer ${token}`;
        req.headers["x-sandbox-session"] = session;
      }
      const r = await src_default.fetch(toRequest(req), env, { waitUntil() {
      } });
      const port2 = Number(r.headers.get("x-local-ws-port"));
      if (r.status !== 426 || !port2) {
        socket.end(`HTTP/1.1 ${r.status} ${r.statusText}\r
\r
${await r.text()}`);
        return;
      }
      const upstream = net.connect(port2, "127.0.0.1", () => {
        const lines = [`${req.method} ${req.url} HTTP/1.1`, ...Object.entries(req.headers).flatMap(([k, v]) => (Array.isArray(v) ? v : [v]).map((x) => `${k}: ${x}`))];
        upstream.write(lines.join("\r\n") + "\r\n\r\n");
        if (head?.length) upstream.write(head);
        upstream.pipe(socket);
        socket.pipe(upstream);
      });
      upstream.on("error", () => socket.destroy());
      socket.on("error", () => upstream.destroy());
    } catch {
      socket.destroy();
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  return { url: `http://127.0.0.1:${port}`, token, close: async () => {
    await stopLocalSandboxProcesses();
    await new Promise((r) => server.close(() => r()));
  } };
}

// src/vault.ts
var BROWSER_TOOL_SCOPE = "nexus-browser";
var HELPER_KEYS = ["GOOGLE_API_KEY", "TYPESAFE_API_KEY", "INCEPTION_API_KEY"];
var REF = /«secret:([A-Za-z_][A-Za-z0-9_]*)»|\{\{\s*secret:([A-Za-z_][A-Za-z0-9_]*)\s*\}\}/g;
var core;
async function loadCore() {
  if (core !== void 0) return core;
  const spec = "@nexus-cortex/core";
  try {
    core = await import(spec);
  } catch {
    core = null;
  }
  return core;
}
async function openVault() {
  const c = await loadCore();
  if (!c) return null;
  try {
    return c.openVaultNonInteractive().vault;
  } catch {
    return null;
  }
}
async function resolveSecretRefs(text) {
  REF.lastIndex = 0;
  if (!REF.test(text)) {
    REF.lastIndex = 0;
    return text;
  }
  REF.lastIndex = 0;
  const allowed = await browserSecrets();
  let missing = false;
  const out = text.replace(REF, (_m, a, b) => {
    const v = allowed.get(a || b);
    if (v === void 0) {
      missing = true;
      return "";
    }
    return encodeURIComponent(v);
  });
  return missing ? null : out;
}
async function helperKeys(explicit = {}, env = process.env) {
  const out = {};
  const vault = await openVault();
  const pick = (k) => explicit[k] || env[k] || vault?.get(k) || void 0;
  for (const k of HELPER_KEYS) {
    const v = pick(k) || (k === "GOOGLE_API_KEY" ? pick("GEMINI_API_KEY") : void 0);
    if (v) out[k] = v;
  }
  return out;
}
async function browserSecrets() {
  const vault = await openVault();
  const out = /* @__PURE__ */ new Map();
  if (!vault) return out;
  for (const b of vault.bindings()) if (b.scope === "tool" && b.tool === BROWSER_TOOL_SCOPE) {
    const v = vault.get(b.secret);
    if (v) out.set(b.secret, v);
  }
  return out;
}
function substitute(value, allowed, refused) {
  if (typeof value === "string") return value.replace(REF, (m, a, b) => {
    const n = a || b;
    const v = allowed.get(n);
    if (v === void 0) {
      refused.add(n);
      return m;
    }
    return v;
  });
  if (Array.isArray(value)) return value.map((x) => substitute(x, allowed, refused));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, x]) => [k, substitute(x, allowed, refused)]));
  return value;
}
function wrapSetProxyForVault(server) {
  const tool = server?._registeredTools?.set_proxy;
  if (!tool || typeof tool.handler !== "function") return false;
  const inner = tool.handler;
  tool.handler = async (args, extra) => {
    const raw = JSON.stringify(args ?? {});
    if (!REF.test(raw)) {
      REF.lastIndex = 0;
      return inner(args, extra);
    }
    REF.lastIndex = 0;
    const allowed = await browserSecrets();
    const refused = /* @__PURE__ */ new Set();
    const resolved = substitute(args, allowed, refused);
    if (refused.size) {
      const names = [...refused].join(", ");
      return { isError: true, content: [{ type: "text", text: `Secret reference(s) not available to the browser: ${names}. The user must store the value in the nexus-cortex secrets vault and opt it in for this tool: \`cortex secrets set NAME\` then \`cortex secrets bind NAME NAME --tool ${BROWSER_TOOL_SCOPE}\`.` }] };
    }
    const result = await inner(resolved, extra);
    const c = await loadCore();
    const values = [...allowed].map(([name, value]) => ({ name, value }));
    if (!c || !values.length || !Array.isArray(result?.content)) return result;
    return { ...result, content: result.content.map((p) => p?.type === "text" && typeof p.text === "string" ? { ...p, text: c.maskSecrets(p.text, values) } : p) };
  };
  return true;
}

// src/local.ts
async function createLocalBrowserMCP(opts = {}) {
  const toolsHome = process.env.NEXUS_BROWSER_HOME ?? path5.join(os2.homedir(), ".nexus-cortex", "browser");
  const dataDir = opts.dataDir ?? process.env.NEXUS_BROWSER_DATA_DIR ?? toolsHome;
  const chromium = opts.executablePath || findChromium() || void 0;
  Object.assign(localLaunchOptions, { headless: opts.headless, executablePath: chromium, viewport: opts.viewport });
  let sandbox = null;
  let xvfbMissing = false;
  if (opts.sandbox ?? process.env.NEXUS_BROWSER_SANDBOX !== "0") {
    const extraPath2 = extraPath() || void 0;
    const sandboxDir = path5.join(path5.dirname(fileURLToPath(import.meta.url)), "sandbox");
    const linkDir = path5.join(toolsHome, "bin");
    if (chromium) {
      try {
        fs4.mkdirSync(linkDir, { recursive: true });
        const l = path5.join(linkDir, "chromium");
        try {
          fs4.unlinkSync(l);
        } catch {
        }
        fs4.symlinkSync(chromium, l);
      } catch {
      }
    }
    xvfbMissing = process.platform === "linux" && !onPath("Xvfb", extraPath2);
    if (xvfbMissing) process.stderr.write(`[nexus-browser] Xvfb not found \u2014 the sandbox backend (real Chrome, incognito, live view) cannot start. ${XVFB_HINT}
`);
    sandbox = await startLocalSandbox({
      dir: sandboxDir,
      dataDir,
      toolsHome,
      allowExec: opts.allowExec,
      env: {
        ...chromium ? { PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH: chromium } : {},
        // The container's helper commands (html2pdf, pdf2html) first, then any extra tool dirs, then the user's PATH.
        // The library's private Python venv (nexus-browser-doctor --install) comes before the system python3.
        PATH: [path5.join(sandboxDir, "bin"), fs4.existsSync(path5.join(toolsHome, "venv", "bin")) ? path5.join(toolsHome, "venv", "bin") : "", linkDir, extraPath2, process.env.PATH].filter(Boolean).join(path5.delimiter)
      }
    });
  }
  const id = `local-${process.pid}`;
  const ctx = { id: { toString: () => id, name: id }, storage: { sql: sqlStorage(path5.join(dataDir, "state.sqlite")) }, waitUntil: (p) => {
    p?.catch?.(() => {
    });
  } };
  const env = {
    BROWSER: { local: true },
    // the shim ignores the binding
    API_KEYS: fileKV(path5.join(dataDir, "kv.json")),
    MCP_DAILY_LIMIT_SECONDS: "100000000",
    // the hosted per-key quota has no meaning on the user's own machine
    ...sandbox ? {
      SANDBOX_URL: sandbox.url,
      AUTH_TOKEN: sandbox.token,
      PUBLIC_HOST: new URL(sandbox.url).host,
      PUBLIC_SCHEME: "ws",
      STDB_SENSE_URL: `${sandbox.url}/stdb`,
      STDB_TOKEN: sandbox.token
    } : {},
    // workflow store → local-store.ts
    // The user's own machine and proxies: external proxy rules are allowed unless NEXUS_BROWSER_PROXY=deny (the hosted default-deny
    // protects a metered shared pool that does not exist locally; no edge supplies a per-key policy here).
    PROXY_DEFAULT_ALLOWED: process.env.NEXUS_BROWSER_PROXY === "deny" ? "false" : "true",
    // A walled page escalates through the user's own proxy first, when one is set (mcp.ts escalateIfWalled).
    // «secret:NAME» references are resolved from the vault (opted-in secrets only); an unresolvable one leaves escalation off.
    ...await (async () => {
      const raw = process.env.NEXUS_BROWSER_PROXY_URL;
      if (!raw) return {};
      const v = await resolveSecretRefs(raw);
      return v ? { ESCALATION_PROXY_URL: v } : {};
    })(),
    // Helper keys (Gemma / Jev / Mercury for captcha decisions + vision): options > environment > the nexus-cortex secrets vault.
    ...await helperKeys(opts.env ?? {}),
    ...opts.env
  };
  const agent = new NexusBrowserMCP(ctx, env);
  await agent.init();
  wrapSetProxyForVault(agent.server);
  if (sandbox && xvfbMissing) wrapBrowseForXServerHint(agent.server);
  const desktop = process.env.NEXUS_DESKTOP ? null : registerDesktopTool(agent.server, toolsHome);
  return {
    /** The Worker's McpServer, with every tool registered — connect it to any MCP transport. */
    server: agent.server,
    agent,
    sandboxUrl: sandbox?.url ?? null,
    /** The `desktop` controller when NEXUS_BROWSER_DESKTOP is set (null otherwise). */
    desktop,
    async close() {
      try {
        await agent.browser?.close?.();
      } catch {
      }
      try {
        await agent.sandboxPage?.close?.();
      } catch {
      }
      await closeAll();
      await sandbox?.close();
    }
  };
}
var XVFB_HINT = "Run `cortex browser install` (or `nexus-browser-doctor --install`), install it with your package manager (Debian/Ubuntu: sudo apt-get install -y xvfb), or point NEXUS_BROWSER_EXTRA_PATH at the directory holding Xvfb.";
function onPath(bin, extra) {
  for (const d of [extra, process.env.PATH].filter(Boolean).join(path5.delimiter).split(path5.delimiter)) {
    if (!d) continue;
    try {
      fs4.accessSync(path5.join(d, bin), fs4.constants.X_OK);
      return true;
    } catch {
    }
  }
  return false;
}
function wrapBrowseForXServerHint(server) {
  const tool = server?._registeredTools?.browse;
  if (!tool || typeof tool.handler !== "function") return;
  const inner = tool.handler;
  tool.handler = async (args, extra) => {
    const r = await inner(args, extra);
    const parts = Array.isArray(r?.content) ? r.content : [];
    if (!parts.some((p) => typeof p?.text === "string" && /without having a XServer running/i.test(p.text))) return r;
    return { ...r, content: [...parts, { type: "text", text: `No X server: Xvfb is not installed or not on PATH. ${XVFB_HINT}` }] };
  };
}

export {
  createLocalBrowserMCP
};
//# sourceMappingURL=chunk-7UZCSDDT.js.map
