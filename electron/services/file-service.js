const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Function to check if a file exists
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    console.error('Error checking if file exists:', error);
    return false;
  }
}

// Function to get file stats
function getFileStats(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      isDirectory: stats.isDirectory(),
    };
  } catch (error) {
    console.error('Error getting file stats:', error);
    return null;
  }
}

// Function to call Python script for processing .mat or .mf4 files
function processMeasurementFile(filePath, options = {}) {
  return new Promise((resolve, reject) => {
    const pythonPath = options.pythonPath || 'python';
    const scriptPath = path.join(__dirname, '../../python/data/loader.py');
    
    // Ensure the Python script exists
    if (!fileExists(scriptPath)) {
      reject(new Error(`Python script not found: ${scriptPath}`));
      return;
    }
    
    const process = spawn(pythonPath, [scriptPath, filePath]);
    
    let dataString = '';
    let errorString = '';
    
    process.stdout.on('data', (data) => {
      dataString += data.toString();
    });
    
    process.stderr.on('data', (data) => {
      errorString += data.toString();
    });
    
    process.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Python process exited with code ${code}: ${errorString}`));
      } else {
        try {
          const result = JSON.parse(dataString);
          resolve(result);
        } catch (error) {
          reject(new Error(`Failed to parse Python output: ${error.message}`));
        }
      }
    });
  });
}

module.exports = {
  fileExists,
  getFileStats,
  processMeasurementFile,
}; 