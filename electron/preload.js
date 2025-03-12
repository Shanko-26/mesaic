const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  fileSystem: {
    openFileDialog: (fileTypes) => ipcRenderer.invoke('open-file-dialog', fileTypes),
    readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  },
}); 