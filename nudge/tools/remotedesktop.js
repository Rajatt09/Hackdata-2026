const path = require("path");
const http = require("http");
const express = require("express");
const { WebSocketServer } = require("ws");
const sharp = require("sharp");
const koffi = require("koffi");
const { spawn } = require("child_process");
const crypto = require("crypto");

const user32 = koffi.load("user32.dll");
const gdi32 = koffi.load("gdi32.dll");

const SetProcessDPIAware = user32.func("bool __stdcall SetProcessDPIAware()");
const GetDC = user32.func("void *__stdcall GetDC(void *hwnd)");
const ReleaseDC = user32.func("int __stdcall ReleaseDC(void *hwnd, void *hdc)");
const GetSystemMetrics = user32.func(
  "int __stdcall GetSystemMetrics(int nIndex)",
);
const CreateCompatibleDC = gdi32.func(
  "void *__stdcall CreateCompatibleDC(void *hdc)",
);
const CreateCompatibleBitmap = gdi32.func(
  "void *__stdcall CreateCompatibleBitmap(void *hdc, int cx, int cy)",
);
const SelectObject = gdi32.func(
  "void *__stdcall SelectObject(void *hdc, void *h)",
);
const BitBlt = gdi32.func(
  "bool __stdcall BitBlt(void *hdc, int x, int y, int cx, int cy, void *hdcSrc, int x1, int y1, uint32 rop)",
);
const DeleteDC = gdi32.func("bool __stdcall DeleteDC(void *hdc)");
const DeleteObject = gdi32.func("bool __stdcall DeleteObject(void *ho)");
const GetDIBits = gdi32.func(
  "int __stdcall GetDIBits(void *hdc, void *hbm, uint32 start, uint32 cLines, void *lpvBits, void *lpbmi, uint32 usage)",
);
const SetCursorPos = user32.func("bool __stdcall SetCursorPos(int x, int y)");
const mouse_event = user32.func(
  "void __stdcall mouse_event(uint32 dwFlags, uint32 dx, uint32 dy, uint32 dwData, uintptr dwExtraInfo)",
);
const keybd_event = user32.func(
  "void __stdcall keybd_event(uint8 bVk, uint8 bScan, uint32 dwFlags, uintptr dwExtraInfo)",
);

try {
  SetProcessDPIAware();
} catch (e) {}

const MOUSEEVENTF_LEFTDOWN = 0x0002;
const MOUSEEVENTF_LEFTUP = 0x0004;
const MOUSEEVENTF_RIGHTDOWN = 0x0008;
const MOUSEEVENTF_RIGHTUP = 0x0010;
const MOUSEEVENTF_MIDDLEDOWN = 0x0020;
const MOUSEEVENTF_MIDDLEUP = 0x0040;
const MOUSEEVENTF_WHEEL = 0x0800;
const KEYEVENTF_KEYUP = 0x0002;
const KEYEVENTF_EXTENDEDKEY = 0x0001;
const SM_CXSCREEN = 0;
const SM_CYSCREEN = 1;
const SRCCOPY = 0x00cc0020;

const BITMAPINFOHEADER = koffi.struct("BITMAPINFOHEADER", {
  biSize: "uint32",
  biWidth: "int32",
  biHeight: "int32",
  biPlanes: "uint16",
  biBitCount: "uint16",
  biCompression: "uint32",
  biSizeImage: "uint32",
  biXPelsPerMeter: "int32",
  biYPelsPerMeter: "int32",
  biClrUsed: "uint32",
  biClrImportant: "uint32",
});

let server = null;
let wss = null;
let captureInterval = null;
let tunnelProcess = null;
let publicUrl = null;
let sessionToken = null;
let activeClient = null;
let inactivityTimer = null;
const INACTIVITY_TIMEOUT = 5 * 60 * 1000;
const CAPTURE_FPS = 20;
const CAPTURE_INTERVAL = Math.floor(1000 / CAPTURE_FPS);
const PORT = 9090;
const JPEG_QUALITY = 55;
let screenWidth = 0;
let screenHeight = 0;

function getScreenDimensions() {
  screenWidth = GetSystemMetrics(SM_CXSCREEN);
  screenHeight = GetSystemMetrics(SM_CYSCREEN);
  return { width: screenWidth, height: screenHeight };
}

function captureScreen() {
  const { width, height } = getScreenDimensions();
  const hdcScreen = GetDC(null);
  const hdcMem = CreateCompatibleDC(hdcScreen);
  const hBitmap = CreateCompatibleBitmap(hdcScreen, width, height);
  const hOld = SelectObject(hdcMem, hBitmap);
  BitBlt(hdcMem, 0, 0, width, height, hdcScreen, 0, 0, SRCCOPY);

  const bmiSize = koffi.sizeof(BITMAPINFOHEADER);
  const bmi = Buffer.alloc(bmiSize + 12);
  bmi.writeUInt32LE(bmiSize, 0);
  bmi.writeInt32LE(width, 4);
  bmi.writeInt32LE(-height, 8);
  bmi.writeUInt16LE(1, 12);
  bmi.writeUInt16LE(32, 14);
  bmi.writeUInt32LE(0, 16);

  const pixelDataSize = width * height * 4;
  const pixelBuffer = Buffer.alloc(pixelDataSize);
  GetDIBits(hdcMem, hBitmap, 0, height, pixelBuffer, bmi, 0);

  SelectObject(hdcMem, hOld);
  DeleteObject(hBitmap);
  DeleteDC(hdcMem);
  ReleaseDC(null, hdcScreen);

  return { buffer: pixelBuffer, width, height };
}

async function captureAndEncode() {
  try {
    const { buffer, width, height } = captureScreen();
    const jpegBuffer = await sharp(buffer, {
      raw: { width, height, channels: 4 },
    })
      .removeAlpha()
      .recomb([
        [0, 0, 1],
        [0, 1, 0],
        [1, 0, 0],
      ])
      .jpeg({ quality: JPEG_QUALITY, chromaSubsampling: "4:2:0" })
      .toBuffer();
    return jpegBuffer;
  } catch (err) {
    return null;
  }
}

function injectMouseMove(x, y) {
  SetCursorPos(Math.round(x), Math.round(y));
}

function injectMouseClick(x, y, button = "left") {
  SetCursorPos(Math.round(x), Math.round(y));
  if (button === "left") {
    mouse_event(MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0);
    mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, 0);
  } else if (button === "right") {
    mouse_event(MOUSEEVENTF_RIGHTDOWN, 0, 0, 0, 0);
    mouse_event(MOUSEEVENTF_RIGHTUP, 0, 0, 0, 0);
  } else if (button === "middle") {
    mouse_event(MOUSEEVENTF_MIDDLEDOWN, 0, 0, 0, 0);
    mouse_event(MOUSEEVENTF_MIDDLEUP, 0, 0, 0, 0);
  }
}

function injectMouseDown(x, y, button = "left") {
  SetCursorPos(Math.round(x), Math.round(y));
  if (button === "left") mouse_event(MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0);
  else if (button === "right") mouse_event(MOUSEEVENTF_RIGHTDOWN, 0, 0, 0, 0);
}

function injectMouseUp(x, y, button = "left") {
  SetCursorPos(Math.round(x), Math.round(y));
  if (button === "left") mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, 0);
  else if (button === "right") mouse_event(MOUSEEVENTF_RIGHTUP, 0, 0, 0, 0);
}

function injectScroll(deltaY) {
  mouse_event(MOUSEEVENTF_WHEEL, 0, 0, deltaY * 120, 0);
}

const VK_MAP = {
  Enter: 0x0d,
  Backspace: 0x08,
  Tab: 0x09,
  Escape: 0x1b,
  Space: 0x20,
  Delete: 0x2e,
  Insert: 0x2d,
  Home: 0x24,
  End: 0x23,
  PageUp: 0x21,
  PageDown: 0x22,
  ArrowUp: 0x26,
  ArrowDown: 0x28,
  ArrowLeft: 0x25,
  ArrowRight: 0x27,
  Control: 0x11,
  Shift: 0x10,
  Alt: 0x12,
  F1: 0x70,
  F2: 0x71,
  F3: 0x72,
  F4: 0x73,
  F5: 0x74,
  F6: 0x75,
  F7: 0x76,
  F8: 0x77,
  F9: 0x78,
  F10: 0x79,
  F11: 0x7a,
  F12: 0x7b,
  CapsLock: 0x14,
  NumLock: 0x90,
  ScrollLock: 0x91,
  PrintScreen: 0x2c,
  Pause: 0x13,
  Meta: 0x5b,
};

const EXTENDED_KEYS = new Set([
  0x2d, 0x2e, 0x24, 0x23, 0x21, 0x22, 0x26, 0x28, 0x25, 0x27, 0x5b,
]);

function injectKeyDown(key) {
  const vk = getVirtualKeyCode(key);
  if (vk === null) return;
  const flags = EXTENDED_KEYS.has(vk) ? KEYEVENTF_EXTENDEDKEY : 0;
  keybd_event(vk, 0, flags, 0);
}

function injectKeyUp(key) {
  const vk = getVirtualKeyCode(key);
  if (vk === null) return;
  const flags =
    KEYEVENTF_KEYUP | (EXTENDED_KEYS.has(vk) ? KEYEVENTF_EXTENDEDKEY : 0);
  keybd_event(vk, 0, flags, 0);
}

function injectKeyPress(key) {
  injectKeyDown(key);
  injectKeyUp(key);
}

function getVirtualKeyCode(key) {
  if (VK_MAP[key] !== undefined) return VK_MAP[key];
  if (key.length === 1) {
    const upper = key.toUpperCase();
    const code = upper.charCodeAt(0);
    if ((code >= 0x30 && code <= 0x39) || (code >= 0x41 && code <= 0x5a)) {
      return code;
    }
    return null;
  }
  return null;
}

function resetInactivityTimer() {
  if (inactivityTimer) clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(() => {
    stopRemoteDesktop();
  }, INACTIVITY_TIMEOUT);
}

function startTunnel(port) {
  return new Promise((resolve, reject) => {
    const cloudflaredPath = path.join(__dirname, "..", "cloudflared.exe");
    tunnelProcess = spawn(
      cloudflaredPath,
      ["tunnel", "--url", `http://localhost:${port}`, "--no-autoupdate"],
      {
        stdio: ["ignore", "pipe", "pipe"],
      },
    );

    let resolved = false;
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        reject(new Error("Tunnel startup timed out after 30s"));
      }
    }, 30000);

    const handleOutput = (data) => {
      const text = data.toString();
      const match = text.match(/https:\/\/[a-zA-Z0-9\-]+\.trycloudflare\.com/);
      if (match && !resolved) {
        resolved = true;
        clearTimeout(timeout);
        publicUrl = match[0];
        resolve(publicUrl);
      }
    };

    tunnelProcess.stdout.on("data", handleOutput);
    tunnelProcess.stderr.on("data", handleOutput);

    tunnelProcess.on("error", (err) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        reject(err);
      }
    });

    tunnelProcess.on("close", (code) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        reject(new Error(`cloudflared exited with code ${code}`));
      }
      tunnelProcess = null;
    });
  });
}

function startCapture() {
  if (captureInterval) return;
  let capturing = false;
  captureInterval = setInterval(async () => {
    if (capturing || !activeClient || activeClient.readyState !== 1) return;
    if (activeClient.bufferedAmount > 128 * 1024) return;
    capturing = true;
    try {
      const jpegBuffer = await captureAndEncode();
      if (jpegBuffer && activeClient && activeClient.readyState === 1) {
        activeClient.send(jpegBuffer);
      }
    } catch (err) {}
    capturing = false;
  }, CAPTURE_INTERVAL);
}

function stopCapture() {
  if (captureInterval) {
    clearInterval(captureInterval);
    captureInterval = null;
  }
}

function handleInputMessage(msg) {
  try {
    const data = JSON.parse(msg);
    resetInactivityTimer();
    switch (data.type) {
      case "mousemove":
        injectMouseMove(data.x, data.y);
        break;
      case "mousedown":
        injectMouseDown(data.x, data.y, data.button || "left");
        break;
      case "mouseup":
        injectMouseUp(data.x, data.y, data.button || "left");
        break;
      case "click":
        injectMouseClick(data.x, data.y, data.button || "left");
        break;
      case "dblclick": {
        injectMouseClick(data.x, data.y, "left");
        setTimeout(() => injectMouseClick(data.x, data.y, "left"), 80);
        break;
      }
      case "scroll":
        injectScroll(data.deltaY);
        break;
      case "keydown":
        injectKeyDown(data.key);
        break;
      case "keyup":
        injectKeyUp(data.key);
        break;
      case "keypress":
        injectKeyPress(data.key);
        break;
      case "ping":
        break;
    }
  } catch (err) {}
}

async function startRemoteDesktop() {
  if (server) {
    return {
      success: true,
      url: publicUrl,
      message: "Remote desktop is already running.",
    };
  }
  try {
    sessionToken = crypto.randomBytes(16).toString("hex");
    getScreenDimensions();
    const app = express();

    app.get("/", (req, res) => {
      res.sendFile(path.join(__dirname, "..", "web", "index.html"));
    });

    app.get("/info", (req, res) => {
      res.json({
        width: screenWidth,
        height: screenHeight,
        token: sessionToken,
      });
    });

    server = http.createServer(app);
    wss = new WebSocketServer({ server, path: "/ws" });

    wss.on("connection", (ws, req) => {
      if (activeClient && activeClient.readyState === 1) {
        ws.close(1008, "Another client is already connected");
        return;
      }
      activeClient = ws;
      resetInactivityTimer();
      startCapture();
      ws.send(
        JSON.stringify({
          type: "info",
          width: screenWidth,
          height: screenHeight,
        }),
      );

      ws.on("message", (msg) => {
        handleInputMessage(msg.toString());
      });

      ws.on("close", () => {
        if (activeClient === ws) {
          activeClient = null;
          stopCapture();
        }
      });

      ws.on("error", () => {
        if (activeClient === ws) {
          activeClient = null;
          stopCapture();
        }
      });
    });

    await new Promise((resolve, reject) => {
      server.listen(PORT, "0.0.0.0", () => {
        resolve();
      });
      server.on("error", reject);
    });

    const url = await startTunnel(PORT);
    resetInactivityTimer();
    return {
      success: true,
      url: url,
      message: `Remote desktop is live! Open this link on your phone: ${url}`,
    };
  } catch (err) {
    await stopRemoteDesktop();
    return {
      success: false,
      message: `Failed to start remote desktop: ${err.message}`,
    };
  }
}

async function stopRemoteDesktop() {
  stopCapture();
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
    inactivityTimer = null;
  }
  if (activeClient) {
    try {
      activeClient.close();
    } catch (e) {}
    activeClient = null;
  }
  if (wss) {
    wss.clients.forEach((c) => {
      try {
        c.close();
      } catch (e) {}
    });
    wss.close();
    wss = null;
  }
  if (server) {
    await new Promise((resolve) => {
      server.close(() => resolve());
      setTimeout(resolve, 2000);
    });
    server = null;
  }
  if (tunnelProcess) {
    tunnelProcess.kill("SIGTERM");
    setTimeout(() => {
      if (tunnelProcess) {
        try {
          tunnelProcess.kill("SIGKILL");
        } catch (e) {}
        tunnelProcess = null;
      }
    }, 3000);
    tunnelProcess = null;
  }
  publicUrl = null;
  sessionToken = null;
  return { success: true, message: "Remote desktop stopped." };
}

module.exports = { startRemoteDesktop, stopRemoteDesktop };
