/**
 * File service for handling file operations
 */
import { checkServerHealth, loadFile } from './api';
import { loadSampleFile, sampleData } from '../data/sampleData';

export interface FileInfo {
  name: string;
  path: string;
  size: number;
  lastModified: Date;
}

export interface FileData {
  signals: string[];
  data: Record<string, number[]>;
  metadata?: Record<string, any>;
}

let currentFile: FileInfo | null = null;
let fileData: FileData | null = null;
let recentFiles: FileInfo[] = [];

// Try to load recent files from localStorage
try {
  const savedRecentFiles = localStorage.getItem('recentFiles');
  if (savedRecentFiles) {
    const parsed = JSON.parse(savedRecentFiles);
    recentFiles = parsed.map((file: any) => ({
      ...file,
      lastModified: new Date(file.lastModified)
    }));
  }
} catch (error) {
  console.error('Failed to load recent files from localStorage:', error);
}

/**
 * Get the current file
 * @returns {FileInfo | null} The current file info or null if no file is loaded
 */
export function getCurrentFile(): FileInfo | null {
  return currentFile;
}

/**
 * Get the current file data
 * @returns {FileData | null} The current file data or null if no file is loaded
 */
export function getFileData(): FileData | null {
  return fileData;
}

/**
 * Get recent files
 * @returns {FileInfo[]} List of recent files
 */
export function getRecentFiles(): FileInfo[] {
  return recentFiles;
}

/**
 * Load a file from the server
 * @param {string} filePath - Path to the file
 * @returns {Promise<FileData>} The loaded file data
 */
export async function loadFileFromServer(filePath: string): Promise<FileData> {
  try {
    // Check if server is running
    const isServerRunning = await checkServerHealth();
    
    let data;
    if (isServerRunning) {
      // Load file from server
      data = await loadFile(filePath);
    } else {
      console.warn('Server is not running, using sample data instead');
      // Use sample data if server is not running
      data = await loadSampleFile(filePath);
    }
    
    // Create file info
    const pathParts = filePath.split(/[/\\]/);
    const fileName = pathParts[pathParts.length - 1];
    
    const fileInfo: FileInfo = {
      name: fileName || 'sample_data.mat',
      path: filePath || 'sample_data.mat',
      size: 0, // Size is unknown from server
      lastModified: new Date()
    };
    
    // Update current file and file data
    currentFile = fileInfo;
    fileData = data;
    
    // Add to recent files
    addToRecentFiles(fileInfo);
    
    return data;
  } catch (error) {
    console.error('Error loading file from server:', error);
    
    // Fallback to sample data
    console.warn('Falling back to sample data');
    
    const fileInfo: FileInfo = {
      name: 'sample_data.mat',
      path: 'sample_data.mat',
      size: 0,
      lastModified: new Date()
    };
    
    // Update current file and file data
    currentFile = fileInfo;
    fileData = sampleData;
    
    // Add to recent files
    addToRecentFiles(fileInfo);
    
    return sampleData;
  }
}

/**
 * Add a file to recent files
 * @param {FileInfo} fileInfo - The file info to add
 */
function addToRecentFiles(fileInfo: FileInfo): void {
  // Remove if already exists
  recentFiles = recentFiles.filter(file => file.path !== fileInfo.path);
  
  // Add to beginning of array
  recentFiles.unshift(fileInfo);
  
  // Limit to 10 recent files
  if (recentFiles.length > 10) {
    recentFiles = recentFiles.slice(0, 10);
  }
  
  // Save to localStorage
  try {
    localStorage.setItem('recentFiles', JSON.stringify(recentFiles));
  } catch (error) {
    console.error('Failed to save recent files to localStorage:', error);
  }
}

/**
 * Clear recent files
 */
export function clearRecentFiles(): void {
  recentFiles = [];
  
  // Clear from localStorage
  try {
    localStorage.removeItem('recentFiles');
  } catch (error) {
    console.error('Failed to clear recent files from localStorage:', error);
  }
}

/**
 * Parse file data to extract signals and values
 * @param {any} rawData - Raw file data
 * @returns {FileData} Parsed file data
 */
export function parseFileData(rawData: any): FileData {
  // This is a placeholder implementation
  // The actual implementation would depend on the format of the data from the server
  
  if (!rawData || typeof rawData !== 'object') {
    throw new Error('Invalid file data');
  }
  
  const signals = Object.keys(rawData.data || {});
  
  return {
    signals,
    data: rawData.data || {},
    metadata: rawData.metadata || {}
  };
} 