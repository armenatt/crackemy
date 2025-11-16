import { app, BrowserWindow, dialog, ipcMain, Menu } from "electron";
import path from "node:path";
import started from "electron-squirrel-startup";
import { Config } from "./Config";
import Store from "electron-store";
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
const isMac = process.platform === "darwin";
if (started) {
  app.quit();
}

const store = new Store();

let mainWindow;
const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.resolve(__dirname, '/assets/crackemy.ico'),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: true,
      
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

const template = [
  {
    label: app.name,
    submenu: [
      {
        role: "about",
      },
    ],
  },
  {
    label: "File",
    submenu: [
      {
        label: "Open folder",
        click: async () => {
          const result = await dialog.showOpenDialog({
            properties: ["openDirectory"],
          });
          if (!result.canceled && !!result.filePaths.length) {
            new Config(result.filePaths[0]);
            const recent = store.get("recent");
            if (!recent.includes(result.filePaths[0])) {
              recent.push(result.filePaths[0]);
              store.set("recent", recent);
            }
            mainWindow.webContents.send(
              "directory-selected",
              result.filePaths[0]
            );
          }
        },
      },

      {
        label: "Recently open courses",
        role: "fileMenu",
        submenu:
          Array.isArray(store.get("recent")) && store.get("recent").length > 0
            ? store.get("recent").map((path) => ({
                label: path,
                click: () => {
                  mainWindow.webContents.send("directory-selected", path);
                },
              }))
            : undefined,
      },
      // isMac ? { role: "close" } : { role: "quit" },
    ],
  },
];

ipcMain.on("directory-dropped", (event, arg) => {
  new Config(arg[0]);
  mainWindow.webContents.send("directory-selected", arg[0]);
});

ipcMain.on('save-config', (event, arg) => {
  Config.saveConfigJson(JSON.parse(arg[0]), arg[1])
})

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);
