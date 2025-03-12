const { ipcMain } = require('electron');
const fileService = require('./file-service');

// Register all IPC handlers
function registerIpcHandlers() {
  // File processing handler
  ipcMain.handle('process-measurement-file', async (event, filePath) => {
    try {
      const result = await fileService.processMeasurementFile(filePath);
      return { success: true, data: result };
    } catch (error) {
      console.error('Error processing measurement file:', error);
      return { success: false, error: error.message };
    }
  });

  // File stats handler
  ipcMain.handle('get-file-stats', async (event, filePath) => {
    try {
      const stats = fileService.getFileStats(filePath);
      if (!stats) {
        return { success: false, error: 'Failed to get file stats' };
      }
      return { success: true, stats };
    } catch (error) {
      console.error('Error getting file stats:', error);
      return { success: false, error: error.message };
    }
  });
}

module.exports = {
  registerIpcHandlers,
}; 