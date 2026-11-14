// Built 2026-11-14T02:29:58.011Z from nexus-terminal/workers/nexus-browser/src/mcp.ts — do not edit; rebuild.
import { createRequire as __cr } from 'node:module'; const require = __cr(import.meta.url);

// src/locate.ts
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
var ENV_KEYS = ["NEXUS_BROWSER_CHROMIUM", "PUPPETEER_EXECUTABLE_PATH", "PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH"];
var KNOWN = [
  "/repl/tools/bin/chromium",
  // Replit
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/google-chrome",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"
];
var ON_PATH = ["chromium", "chromium-browser", "google-chrome-stable", "google-chrome", "chrome"];
function executable(p) {
  try {
    fs.accessSync(p, fs.constants.X_OK);
    return fs.statSync(p).isFile();
  } catch {
    return false;
  }
}
function playwrightCache() {
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH || path.join(os.homedir(), ".cache", "ms-playwright");
  try {
    return fs.readdirSync(root).filter((d) => /^chromium-\d+$/.test(d)).sort().reverse().flatMap((d) => [path.join(root, d, "chrome-linux", "chrome"), path.join(root, d, "chrome-linux64", "chrome")]);
  } catch {
    return [];
  }
}
var cached;
function resetChromiumCache() {
  cached = void 0;
}
function findChromium() {
  if (cached !== void 0) return cached;
  for (const k of ENV_KEYS) {
    const v = process.env[k];
    if (v && executable(v)) return cached = v;
  }
  const installed = installedChrome();
  if (installed && executable(installed)) return cached = installed;
  for (const p of [...KNOWN, ...playwrightCache()]) if (executable(p)) return cached = p;
  for (const dir of (process.env.PATH || "").split(path.delimiter)) {
    for (const n of ON_PATH) {
      const p = path.join(dir, n);
      if (executable(p)) return cached = p;
    }
  }
  return cached = null;
}
function installedChrome() {
  const home = process.env.NEXUS_BROWSER_HOME ?? path.join(os.homedir(), ".nexus-cortex", "browser");
  try {
    return JSON.parse(fs.readFileSync(path.join(home, "install.json"), "utf8")).chrome;
  } catch {
    return void 0;
  }
}

// src/install.ts
import { execFileSync, spawnSync } from "node:child_process";
import fs2 from "node:fs";
import os2 from "node:os";
import path2 from "node:path";
var toolsHome = () => process.env.NEXUS_BROWSER_HOME ?? path2.join(os2.homedir(), ".nexus-cortex", "browser");
var statePath = () => path2.join(toolsHome(), "install.json");
var defaultExtras = () => ({ pdf: process.platform === "linux", sandbox: process.platform === "linux" });
function readInstallState() {
  try {
    return JSON.parse(fs2.readFileSync(statePath(), "utf8"));
  } catch {
    return null;
  }
}
function writeInstallState(s) {
  fs2.mkdirSync(toolsHome(), { recursive: true });
  fs2.writeFileSync(statePath(), JSON.stringify(s, null, 2) + "\n");
}
var extraPath = () => [process.env.NEXUS_BROWSER_EXTRA_PATH, readInstallState()?.extraPath].filter(Boolean).join(path2.delimiter);
function which(bin) {
  for (const d of [extraPath(), process.env.PATH ?? ""].join(path2.delimiter).split(path2.delimiter)) {
    if (!d) continue;
    const p = path2.join(d, bin);
    try {
      fs2.accessSync(p, fs2.constants.X_OK);
      if (fs2.statSync(p).isFile()) return p;
    } catch {
    }
  }
  return null;
}
var EXTENSIONS = [
  { name: "ubol", label: "uBlock Origin Lite", url: "https://github.com/uBlockOrigin/uBOL-home/releases/download/2026.308.1810/uBOLite_2026.308.1810.chromium.zip" },
  { name: "consent-o-matic", label: "Consent-O-Matic", url: "https://github.com/cavi-au/Consent-O-Matic/releases/download/v1.1.5/consent-o-matic-v1.1.5-unpacked-release-chromium.zip" }
];
var PIP_ALL = ["patchright", "websockify", "pymupdf", "pdfplumber", "beautifulsoup4"];
var SANDBOX_PIP = ["patchright", "websockify"];
var PDF_PIP = ["pymupdf", "pdfplumber", "beautifulsoup4"];
var PIP_SPEC = { pymupdf: "pymupdf<2" };
var PIP = process.platform === "linux" ? PIP_ALL : PIP_ALL.filter((p) => p !== "patchright" && p !== "websockify");
var PIP_IMPORT = { patchright: "patchright", websockify: "websockify", pymupdf: "fitz", pdfplumber: "pdfplumber", beautifulsoup4: "bs4" };
var venvDir = () => path2.join(toolsHome(), "venv");
var venvPy = () => path2.join(venvDir(), process.platform === "win32" ? "Scripts/python.exe" : "bin/python");
var linux = process.platform === "linux";
var python3 = () => fs2.existsSync(venvPy()) ? venvPy() : which("python3");
var pyHas = (mod) => {
  const py = python3();
  return !!py && spawnSync(py, ["-c", `import ${mod}`], { stdio: "ignore" }).status === 0;
};
function resolveExtras(e) {
  const base = { ...defaultExtras(), ...readInstallState()?.extras ?? {} };
  const r = { pdf: e?.pdf ?? base.pdf, sandbox: e?.sandbox ?? base.sandbox };
  if (process.platform !== "linux") r.sandbox = false;
  return r;
}
var wantedPip = (x) => [...x.sandbox ? SANDBOX_PIP : [], ...x.pdf ? PDF_PIP : []];
function checkAll() {
  const rows = [];
  const add = (area, item, ok, fix, optional = false) => rows.push({ area, item, ok, fix, optional });
  const nodeMajor = Number(process.versions.node.split(".")[0]);
  add("core", `Node ${process.versions.node}`, nodeMajor >= 20, "install Node 20 or newer");
  const chrome = findChromium();
  add("core", `Chrome/Chromium${chrome ? ` (${chrome})` : ""}`, !!chrome, "cortex browser install (downloads Chrome for Testing) or install Chrome / Chromium");
  add(process.platform === "linux" ? "sandbox" : "pdf skills", "python3", !!which("python3"), "cortex browser install", process.platform !== "linux");
  for (const p of PIP) add(p === "patchright" || p === "websockify" ? "sandbox" : "pdf skills", `python: ${p}`, pyHas(PIP_IMPORT[p]), "cortex browser install", p !== "patchright" && p !== "websockify");
  if (linux) {
    add("sandbox", "Xvfb (virtual display on :99)", !!which("Xvfb"), "cortex browser install");
    add("sandbox", "xdotool (OS-level input)", !!which("xdotool"), "cortex browser install");
    add("live view", "x11vnc", !!which("x11vnc"), "cortex browser install", true);
  } else {
    add("sandbox", `OS-level input on ${process.platform}`, false, "the sandbox backend is Linux-only for now; the default backend works everywhere", true);
  }
  add("pdf skills", "pdf2htmlEX", !!which("pdf2htmlEX"), "optional \u2014 https://github.com/pdf2htmlEX/pdf2htmlEX/releases", true);
  for (const e of EXTENSIONS) add("extensions", e.label, fs2.existsSync(path2.join(toolsHome(), "extensions", e.name, "manifest.json")), "cortex browser install", true);
  return rows;
}
var readiness = (rows = checkAll()) => ({
  core: rows.filter((r) => r.area === "core").every((r) => r.ok),
  // 0.8.7 (macbook 11-13): off Linux there are no REQUIRED sandbox rows, so `every` was vacuously true and macOS reported
  // "sandbox backend: READY" under the "Linux-only" row. The sandbox backend exists only on Linux.
  sandbox: process.platform === "linux" && rows.filter((r) => r.area === "sandbox" && !r.optional).every((r) => r.ok)
});
function installPlan(rows = checkAll(), extras) {
  const steps = [];
  let mb = 0;
  const x = resolveExtras(extras);
  const missing = (item) => rows.some((r) => !r.ok && item.test(r.item));
  if (missing(/^Chrome/)) {
    steps.push("Download Chrome for Testing into " + path2.join(toolsHome(), "chrome"));
    mb += 350;
  }
  const sys = systemNeeds(x);
  if (sys.length) steps.push(`Install system tools: ${sys.join(", ")} (package manager with root / passwordless sudo / sudo at this terminal, else Nix)`);
  if (sys.length) mb += 60;
  const pyMissing = wantedPip(x).filter((p) => !pyHas(PIP_IMPORT[p]));
  if (pyMissing.length) {
    steps.push(`Add Python packages ${pyMissing.join(", ")} in ${venvDir()} (it uses the packages your python3 already has; only what is missing is downloaded)`);
    mb += (pyMissing.includes("patchright") ? 190 : 0) + (pyMissing.some((p) => PDF_PIP.includes(p)) ? 60 : 0);
  }
  if (rows.some((r) => !r.ok && r.area === "extensions")) {
    steps.push("Download the uBlock Origin Lite and Consent-O-Matic extensions");
    mb += 5;
  }
  return { steps, approxMB: mb };
}
function systemNeeds(x = resolveExtras()) {
  if (!linux) return [];
  const need = [];
  if (wantedPip(x).length && !which("python3")) need.push("python3");
  if (x.sandbox) {
    if (!which("Xvfb")) need.push("Xvfb");
    if (!which("xdotool")) need.push("xdotool");
    if (!which("x11vnc")) need.push("x11vnc");
  }
  return need;
}
var PM = {
  apt: {
    probe: "apt-get",
    pkgs: { python3: ["python3", "python3-venv"], Xvfb: ["xvfb"], xdotool: ["xdotool"], x11vnc: ["x11vnc"] },
    cmd: (p) => [["apt-get", "update", "-qq"], ["apt-get", "install", "-y", "-qq", "--no-install-recommends", ...p]]
  },
  apk: { probe: "apk", pkgs: { python3: ["python3"], Xvfb: ["xvfb"], xdotool: ["xdotool"], x11vnc: ["x11vnc"] }, cmd: (p) => [["apk", "add", "--no-cache", ...p]] },
  dnf: { probe: "dnf", pkgs: { python3: ["python3"], Xvfb: ["xorg-x11-server-Xvfb"], xdotool: ["xdotool"], x11vnc: ["x11vnc"] }, cmd: (p) => [["dnf", "install", "-y", "-q", ...p]] },
  pacman: { probe: "pacman", pkgs: { python3: ["python"], Xvfb: ["xorg-server-xvfb"], xdotool: ["xdotool"], x11vnc: ["x11vnc"] }, cmd: (p) => [["pacman", "-S", "--noconfirm", "--needed", ...p]] }
};
var NIX_ATTR = { python3: "python3", Xvfb: "xorg.xvfb", xdotool: "xdotool", x11vnc: "x11vnc" };
async function installAll(opts) {
  const log = opts.log ?? ((l) => process.stderr.write(l + "\n"));
  const done = [];
  const manual = [];
  const prev = readInstallState();
  const state = { version: 1, at: (/* @__PURE__ */ new Date()).toISOString(), ...prev?.chrome ? { chrome: prev.chrome } : {}, ...prev?.extraPath ? { extraPath: prev.extraPath } : {}, ready: { core: false, sandbox: false } };
  const x = resolveExtras(opts.extras);
  state.extras = x;
  fs2.mkdirSync(toolsHome(), { recursive: true });
  if (!findChromium() && !(state.chrome && fs2.existsSync(state.chrome))) {
    log("Downloading Chrome for Testing (stable)\u2026");
    try {
      const spec = "@puppeteer/browsers";
      const b = await import(spec);
      const platform = b.detectBrowserPlatform();
      if (!platform) throw new Error(`no Chrome for Testing build for ${process.platform}/${process.arch}`);
      const buildId = await b.resolveBuildId(b.Browser.CHROME, platform, "stable");
      const got = await b.install({ browser: b.Browser.CHROME, buildId, cacheDir: path2.join(toolsHome(), "chrome"), platform });
      state.chrome = got.executablePath;
      done.push(`Chrome for Testing ${buildId}`);
    } catch (e) {
      manual.push(`Chrome: ${String(e.message).slice(0, 160)} \u2014 install Google Chrome or Chromium`);
    }
  }
  const need = systemNeeds(x);
  if (need.length) {
    const root = typeof process.getuid === "function" && process.getuid() === 0;
    const hasSudo = !!which("sudo");
    const sudoN = hasSudo && spawnSync("sudo", ["-n", "true"], { stdio: "ignore" }).status === 0;
    const pm = Object.values(PM).find((m) => !!which(m.probe));
    const prefix = root ? [] : sudoN ? ["sudo", "-n"] : opts.interactive && hasSudo ? ["sudo"] : null;
    let installed = false;
    if (pm && prefix) {
      log(`Installing ${need.join(", ")} with ${pm.probe}${prefix.length ? ` (${prefix.join(" ")})` : ""}\u2026`);
      const pkgs = need.flatMap((t) => pm.pkgs[t]);
      installed = pm.cmd(pkgs).every(([bin, ...args]) => spawnSync(
        prefix[0] ?? bin,
        prefix.length ? [...prefix.slice(1), bin, ...args] : args,
        { stdio: opts.interactive ? "inherit" : ["ignore", "ignore", "pipe"], env: { ...process.env, DEBIAN_FRONTEND: "noninteractive" } }
      ).status === 0);
      if (installed) done.push(`${need.join(", ")} via ${pm.probe}`);
    }
    if (!installed && which("nix-build")) {
      log(`Installing ${need.join(", ")} from Nix\u2026`);
      const dirs = [];
      for (const t of need) {
        const link = path2.join(toolsHome(), "nix", t);
        fs2.mkdirSync(path2.dirname(link), { recursive: true });
        const r = spawnSync("nix-build", ["<nixpkgs>", "-A", NIX_ATTR[t], "--out-link", link], { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" });
        if (r.status === 0 && fs2.existsSync(path2.join(link, "bin"))) dirs.push(path2.join(link, "bin"));
        else manual.push(`${t}: nix-build ${NIX_ATTR[t]} failed`);
      }
      if (dirs.length) {
        state.extraPath = [.../* @__PURE__ */ new Set([...state.extraPath ? state.extraPath.split(path2.delimiter) : [], ...dirs])].join(path2.delimiter);
        writeInstallState(state);
        done.push(`${need.filter((t) => dirs.some((d) => d.includes(`${path2.sep}nix${path2.sep}${t}${path2.sep}`))).join(", ")} via Nix`);
      }
      installed = dirs.length === need.length;
    }
    if (!installed) {
      const still = systemNeeds(x);
      if (still.length) {
        const cmd = pm ? `sudo ${pm.cmd(still.flatMap((t) => pm.pkgs[t])).map((c) => c.join(" ")).join(" && sudo ")}` : `install ${still.join(", ")} with your package manager`;
        manual.push(`system tools ${still.join(", ")}: ${cmd}`);
      }
    }
  }
  const py = which("python3");
  const want = wantedPip(x);
  if (py && want.length && want.some((p) => !pyHas(PIP_IMPORT[p]))) {
    if (!fs2.existsSync(venvPy())) {
      log(`Creating the Python environment ${venvDir()} (it also sees your python3's packages)\u2026`);
      const ok = spawnSync(py, ["-m", "venv", "--system-site-packages", venvDir()], { stdio: opts.interactive ? "inherit" : "ignore" }).status === 0;
      if (!ok) manual.push("python venv: install python3-venv (Debian/Ubuntu) and re-run");
    }
    const missing = want.filter((p) => !pyHas(PIP_IMPORT[p]));
    if (missing.length && fs2.existsSync(venvPy())) {
      log(`Installing Python packages: ${missing.join(" ")}\u2026`);
      const env = { ...process.env, PIP_CONFIG_FILE: os2.devnull, PIP_USER: "0" };
      const r = spawnSync(venvPy(), ["-m", "pip", "install", "-q", ...missing.map((p) => PIP_SPEC[p] ?? p)], { stdio: opts.interactive ? "inherit" : ["ignore", "ignore", "pipe"], env });
      if (r.status === 0) done.push(`python: ${missing.join(", ")}`);
      else manual.push(`python packages ${missing.join(", ")}: install failed`);
    }
  }
  const extDir = path2.join(toolsHome(), "extensions");
  fs2.mkdirSync(extDir, { recursive: true });
  for (const e of EXTENSIONS) {
    if (fs2.existsSync(path2.join(extDir, e.name, "manifest.json"))) continue;
    const zip = path2.join(os2.tmpdir(), `nexus-browser-${e.name}-${process.pid}.zip`);
    try {
      execFileSync("curl", ["-fsSL", "-o", zip, e.url], { stdio: "ignore" });
      const unzip = which("unzip");
      if (unzip) execFileSync(unzip, ["-q", "-o", zip, "-d", path2.join(extDir, e.name)], { stdio: "ignore" });
      else {
        const pyx = python3();
        if (!pyx) throw new Error("unzip or python3 is needed to unpack it");
        execFileSync(pyx, ["-c", `import zipfile; zipfile.ZipFile(${JSON.stringify(zip)}).extractall(${JSON.stringify(path2.join(extDir, e.name))})`]);
      }
      done.push(e.label);
    } catch (err) {
      manual.push(`${e.label}: ${String(err.message).slice(0, 120)}`);
    }
    fs2.rmSync(zip, { force: true });
  }
  writeInstallState(state);
  resetChromiumCache();
  const rows = checkAll();
  state.ready = readiness(rows);
  state.manual = manual;
  state.at = (/* @__PURE__ */ new Date()).toISOString();
  writeInstallState(state);
  return { ready: state.ready, done, manual, state };
}

export {
  findChromium,
  toolsHome,
  readInstallState,
  extraPath,
  checkAll,
  readiness,
  installPlan,
  installAll
};
//# sourceMappingURL=chunk-SF6E3HBU.js.map
