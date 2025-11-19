// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer, webUtils } from "electron";
import { readFileSync } from "fs";
import path from "path";

contextBridge.exposeInMainWorld("api", {
  onDirectorySelected: (cb) =>
    ipcRenderer.on("directory-selected", (_, path) => cb(path)),
  onClose: (cb) => ipcRenderer.on('close', () => cb()),
  readFile: (path, encoding) =>  readFileSync(path, {encoding}), // returns a Buffer
  getPathForFile: (file) => webUtils.getPathForFile(file),
  send: (channel, ...args) => ipcRenderer.send(channel, args),
  resolve: (...arg) => path.resolve(...arg)
});
