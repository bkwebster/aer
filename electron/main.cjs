const { app, BrowserWindow, BrowserView, ipcMain } = require("electron");
const path = require("path");
const isDev = require("electron-is-dev");
const electronServe = require("electron-serve");

const loadURL = electronServe({ directory: "out" });

let mainWindow;
const views = new Map(); // Store multiple browser views
let activeViewId = null;

// Define CSP for the main window
const mainCSP = isDev
  ? "default-src 'self' http://localhost:3000; script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:3000; style-src 'self' 'unsafe-inline' http://localhost:3000 'unsafe-eval' blob: *; connect-src 'self' http://localhost:3000 ws://localhost:3000; img-src 'self' data: https: http: blob:; font-src 'self' data: http://localhost:3000; frame-src 'self'"
  : "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' 'unsafe-eval' blob: *; img-src 'self' data: https: http: blob:; font-src 'self' data:; frame-src 'self'";

// Define CSP for browser views
const viewCSP =
  "default-src 'self' https: http: data: blob:; script-src 'self' https: http: 'unsafe-inline' 'unsafe-eval'; style-src 'self' https: http: 'unsafe-inline'; img-src 'self' https: http: data: blob:; font-src 'self' data: https: http:; frame-src 'self' https: http:;";

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.cjs"),
      sandbox: true,
      webSecurity: true,
    },
    titleBarStyle: "hiddenInset", // Makes it look more native on macOS
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:3000");
    mainWindow.webContents.session.webRequest.onHeadersReceived(
      (details, callback) => {
        callback({
          responseHeaders: {
            ...details.responseHeaders,
            "Content-Security-Policy": [mainCSP],
            "Access-Control-Allow-Origin": ["*"],
          },
        });
      }
    );
    mainWindow.webContents.openDevTools();
  } else {
    loadURL(mainWindow);
    mainWindow.webContents.session.webRequest.onHeadersReceived(
      (details, callback) => {
        callback({
          responseHeaders: {
            ...details.responseHeaders,
            "Content-Security-Policy": [mainCSP],
          },
        });
      }
    );
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function createBrowserView(id, url) {
  const view = new BrowserView({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
    },
  });

  view.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [viewCSP],
      },
    });
  });

  mainWindow.addBrowserView(view);
  view.setBounds(calculateViewBounds());
  view.setAutoResize({ width: true, height: true });
  view.webContents.loadURL(url);
  views.set(id, view);

  // Handle page title updates
  view.webContents.on("page-title-updated", (event, title) => {
    mainWindow.webContents.send("page-title-updated", { id, title });
  });

  // Handle page favicon updates
  view.webContents.on("page-favicon-updated", (event, favicons) => {
    if (favicons.length > 0) {
      mainWindow.webContents.send("page-favicon-updated", {
        id,
        favicon: favicons[0],
      });
    }
  });

  return view;
}

function calculateViewBounds() {
  const bounds = mainWindow.getBounds();
  return {
    x: 240, // Increased width for the sidebar
    y: 80, // Height of toolbar
    width: bounds.width - 240,
    height: bounds.height - 80,
  };
}

// IPC handlers
ipcMain.on("create-tab", (event, { id, url }) => {
  createBrowserView(id, url);
  setActiveTab(id);
});

ipcMain.on("switch-tab", (event, { id }) => {
  setActiveTab(id);
});

ipcMain.on("close-tab", (event, { id }) => {
  const view = views.get(id);
  if (view) {
    mainWindow.removeBrowserView(view);
    view.webContents.destroy();
    views.delete(id);
  }
});

ipcMain.on("navigate", (event, { id, url }) => {
  const view = views.get(id);
  if (view) {
    view.webContents.loadURL(url);
  }
});

ipcMain.on("toggle-devtools", (event, { id }) => {
  const view = views.get(id);
  if (view) {
    view.webContents.toggleDevTools();
  }
});

function setActiveTab(id) {
  const view = views.get(id);
  if (!view) return;

  // Hide all views
  for (const [viewId, browserView] of views) {
    if (viewId === id) {
      mainWindow.addBrowserView(browserView);
      browserView.setBounds(calculateViewBounds());
    } else {
      mainWindow.removeBrowserView(browserView);
    }
  }
  activeViewId = id;
}

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (mainWindow === null) createWindow();
});
