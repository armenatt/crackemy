// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer, webUtils } from "electron";
import { readFileSync } from "fs";

contextBridge.exposeInMainWorld("api", {
  onDirectorySelected: (cb) =>
    ipcRenderer.on("directory-selected", (_, path) => cb(path)),
  readFile: (path, encoding) =>  readFileSync(path, {encoding}), // returns a Buffer
  getPathForFile: (file) => webUtils.getPathForFile(file),
  send: (channel, ...args) => ipcRenderer.send(channel, args),
});
