/**
 * API service for communicating with the Python server
 */
import { sampleData } from '../data/sampleData';

const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Check if the server is running
 * @returns {Promise<boolean>} True if the server is running
 */
export async function checkServerHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, { signal: AbortSignal.timeout(2000) });
    const data = await response.json();
    return data.status === 'ok';
  } catch (error) {
    console.error('Error checking server health:', error);
    return false;
  }
}

/**
 * Load a measurement file
 * @param {string} filePath - Path to the file
 * @returns {Promise<any>} File data
 */
export async function loadFile(filePath: string): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/load-file`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ filePath }),
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to load file');
    }
    
    return data.data;
  } catch (error) {
    console.error('Error loading file:', error);
    throw error;
  }
}

/**
 * Process a natural language query
 * @param {string} query - The query text
 * @param {string} filePath - Path to the file being analyzed
 * @param {any} context - Optional context about the current visualization state
 * @param {boolean} useOpenAI - Whether to use OpenAI for processing (if available)
 * @returns {Promise<any>} Query results
 */
export async function processQuery(
  query: string, 
  filePath: string, 
  context?: any, 
  useOpenAI: boolean = true
): Promise<any> {
  try {
    // Check if server is running
    const isServerRunning = await checkServerHealth();
    
    if (!isServerRunning) {
      console.warn('Server is not running, using mock AI response');
      return mockProcessQuery(query, filePath, context);
    }
    
    const response = await fetch(`${API_BASE_URL}/process-query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, filePath, context, use_openai: useOpenAI }),
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to process query');
    }
    
    // Log if OpenAI was used
    if (data.used_openai) {
      console.log('Query was processed using OpenAI');
    } else {
      console.log('Query was processed using built-in processor');
    }
    
    return data.data;
  } catch (error) {
    console.error('Error processing query:', error);
    // Fallback to mock response
    return mockProcessQuery(query, filePath, context);
  }
}

/**
 * Generate a mock response for a query
 * @param {string} query - The query text
 * @param {string} filePath - Path to the file being analyzed
 * @param {any} context - Optional context about the current visualization state
 * @returns {Promise<any>} Mock query results
 */
function mockProcessQuery(query: string, filePath: string, context?: any): Promise<any> {
  // Simulate network delay
  return new Promise((resolve) => {
    setTimeout(() => {
      const lowerQuery = query.toLowerCase();
      
      // If we have context, log it for debugging
      if (context) {
        console.log('Mock processing query with context:', context);
      }
      
      // Generate different responses based on the query
      let answer = '';
      let metadata: any = {};
      
      // Check for time-specific queries
      const timeRegex = /at\s+(\d+)(\.\d+)?(?:\s*)(ms|s|seconds|milliseconds)?/i;
      const timeMatch = lowerQuery.match(timeRegex);
      
      if (timeMatch) {
        // Handle time-specific query
        const timeValue = parseFloat(timeMatch[1] + (timeMatch[2] || ''));
        const timeUnit = (timeMatch[3] || 'ms').toLowerCase();
        
        // Convert to milliseconds for internal processing
        let timeMs = timeValue;
        if (timeUnit === 's' || timeUnit === 'seconds') {
          timeMs = timeValue * 1000;
        }
        
        // Find the closest time index
        const timeArray = sampleData.data.time.map(t => t * 1000); // Convert to ms
        const closestTimeIndex = findClosestTimeIndex(timeArray, timeMs);
        
        // Extract signal from query
        let targetSignal: keyof typeof sampleData.data | '' = '';
        if (lowerQuery.includes('engine temp') || lowerQuery.includes('enginetemp')) {
          targetSignal = 'engineTemp';
        } else if (lowerQuery.includes('rpm') || lowerQuery.includes('engine rpm')) {
          targetSignal = 'engineRPM';
        } else if (lowerQuery.includes('speed') || lowerQuery.includes('vehicle speed')) {
          targetSignal = 'vehicleSpeed';
        } else if (lowerQuery.includes('throttle')) {
          targetSignal = 'throttlePosition';
        } else if (lowerQuery.includes('fuel')) {
          targetSignal = 'fuelConsumption';
        } else if (lowerQuery.includes('battery')) {
          targetSignal = 'batteryVoltage';
        } else if (lowerQuery.includes('ambient')) {
          targetSignal = 'ambientTemp';
        } else if (lowerQuery.includes('oil')) {
          targetSignal = 'oilPressure';
        }
        
        if (targetSignal && closestTimeIndex !== -1) {
          const value = sampleData.data[targetSignal][closestTimeIndex];
          const unit = sampleData.metadata.units[targetSignal as keyof typeof sampleData.metadata.units] || '';
          const actualTime = sampleData.data.time[closestTimeIndex];
          
          answer = `At time ${actualTime.toFixed(2)}s (closest to your requested time), the ${targetSignal} is ${value.toFixed(2)} ${unit}.`;
          metadata = {
            confidence: 0.95,
            processingTime: 0.5,
            value: value,
            time: actualTime,
            requestedTime: timeMs / 1000 // Convert back to seconds
          };
          
          resolve({
            answer,
            metadata
          });
          return;
        }
      }
      
      // Handle other query types
      if (lowerQuery.includes('maximum') || lowerQuery.includes('max')) {
        if (lowerQuery.includes('rpm')) {
          const maxRPM = Math.max(...sampleData.data.engineRPM);
          answer = `The maximum RPM recorded is ${maxRPM.toFixed(2)} RPM.`;
          metadata = {
            confidence: 0.95,
            processingTime: 0.5,
            value: maxRPM
          };
        } else if (lowerQuery.includes('speed')) {
          const maxSpeed = Math.max(...sampleData.data.vehicleSpeed);
          answer = `The maximum vehicle speed recorded is ${maxSpeed.toFixed(2)} km/h.`;
          metadata = {
            confidence: 0.95,
            processingTime: 0.5,
            value: maxSpeed
          };
        } else {
          answer = `I'm not sure which signal you're asking about. Please specify a signal like RPM, speed, temperature, etc.`;
          metadata = {
            confidence: 0.5,
            processingTime: 0.5
          };
        }
      } else if (lowerQuery.includes('minimum') || lowerQuery.includes('min')) {
        if (lowerQuery.includes('rpm')) {
          const minRPM = Math.min(...sampleData.data.engineRPM);
          answer = `The minimum RPM recorded is ${minRPM.toFixed(2)} RPM.`;
          metadata = {
            confidence: 0.95,
            processingTime: 0.5,
            value: minRPM
          };
        } else if (lowerQuery.includes('speed')) {
          const minSpeed = Math.min(...sampleData.data.vehicleSpeed);
          answer = `The minimum vehicle speed recorded is ${minSpeed.toFixed(2)} km/h.`;
          metadata = {
            confidence: 0.95,
            processingTime: 0.5,
            value: minSpeed
          };
        } else {
          answer = `I'm not sure which signal you're asking about. Please specify a signal like RPM, speed, temperature, etc.`;
          metadata = {
            confidence: 0.5,
            processingTime: 0.5
          };
        }
      } else if (lowerQuery.includes('average') || lowerQuery.includes('mean')) {
        if (lowerQuery.includes('rpm')) {
          const avgRPM = sampleData.data.engineRPM.reduce((sum, val) => sum + val, 0) / sampleData.data.engineRPM.length;
          answer = `The average RPM recorded is ${avgRPM.toFixed(2)} RPM.`;
          metadata = {
            confidence: 0.95,
            processingTime: 0.5,
            value: avgRPM
          };
        } else if (lowerQuery.includes('speed')) {
          const avgSpeed = sampleData.data.vehicleSpeed.reduce((sum, val) => sum + val, 0) / sampleData.data.vehicleSpeed.length;
          answer = `The average vehicle speed recorded is ${avgSpeed.toFixed(2)} km/h.`;
          metadata = {
            confidence: 0.95,
            processingTime: 0.5,
            value: avgSpeed
          };
        } else {
          answer = `I'm not sure which signal you're asking about. Please specify a signal like RPM, speed, temperature, etc.`;
          metadata = {
            confidence: 0.5,
            processingTime: 0.5
          };
        }
      } else if (lowerQuery.includes('correlation') || lowerQuery.includes('relationship')) {
        if ((lowerQuery.includes('rpm') && lowerQuery.includes('speed')) || 
            (lowerQuery.includes('speed') && lowerQuery.includes('rpm'))) {
          answer = `There is a positive correlation between engine RPM and vehicle speed. As RPM increases, vehicle speed tends to increase as well, which is expected in a vehicle.`;
          metadata = {
            confidence: 0.9,
            processingTime: 0.8,
            correlation: 0.85
          };
        } else if ((lowerQuery.includes('rpm') && lowerQuery.includes('fuel')) || 
                  (lowerQuery.includes('fuel') && lowerQuery.includes('rpm'))) {
          answer = `There is a strong positive correlation between engine RPM and fuel consumption. Higher RPM generally leads to higher fuel consumption.`;
          metadata = {
            confidence: 0.9,
            processingTime: 0.8,
            correlation: 0.92
          };
        } else {
          answer = `I'm not sure which signals you're asking about. Please specify two signals to analyze their relationship.`;
          metadata = {
            confidence: 0.5,
            processingTime: 0.5
          };
        }
      } else if (lowerQuery.includes('anomaly') || lowerQuery.includes('unusual')) {
        answer = `I detected a few potential anomalies in the data:
1. There's a sudden drop in battery voltage around the 25-second mark, which could indicate an electrical issue.
2. The engine temperature rises unusually quickly between 10-20 seconds, which might suggest a cooling system problem.
3. There are several throttle position spikes that don't correlate with changes in RPM or speed, possibly indicating a throttle sensor issue.`;
        metadata = {
          confidence: 0.85,
          processingTime: 1.2,
          anomalies: [
            { time: 25, signal: 'batteryVoltage', severity: 'medium' },
            { time: 15, signal: 'engineTemp', severity: 'high' },
            { time: [5, 22, 38], signal: 'throttlePosition', severity: 'low' }
          ]
        };
      } else if (lowerQuery.includes('summary') || lowerQuery.includes('overview')) {
        answer = `This dataset contains 60 seconds of vehicle measurement data with 9 signals:
- Engine RPM varies between 800-3800 RPM with an average of about 2300 RPM
- Vehicle speed ranges from 0-120 km/h with several acceleration and deceleration phases
- Throttle position shows multiple step changes between 10-80%
- Engine temperature gradually rises from 20°C to 85°C and stabilizes
- Fuel consumption correlates strongly with RPM and throttle position
- Battery voltage remains around 12.6V with occasional dips during rapid RPM changes
- Ambient temperature slowly increases from 15°C to 25°C
- Oil pressure maintains between 2-5 bar`;
        metadata = {
          confidence: 0.95,
          processingTime: 1.5,
          signalStats: {
            engineRPM: { min: 800, max: 3800, avg: 2300 },
            vehicleSpeed: { min: 0, max: 120, avg: 60 },
            throttlePosition: { min: 10, max: 80, avg: 45 }
          }
        };
      } else {
        answer = `I'm not sure how to answer that question about the data. Try asking about maximum, minimum, or average values, correlations between signals, anomalies, or a general summary of the data.`;
        metadata = {
          confidence: 0.3,
          processingTime: 0.3
        };
      }
      
      resolve({
        answer,
        metadata
      });
    }, 1500); // Simulate processing time
  });
}

/**
 * Find the closest time index in an array
 * @param {number[]} timeArray - Array of time values
 * @param {number} targetTime - Target time to find
 * @returns {number} Index of the closest time value, or -1 if array is empty
 */
function findClosestTimeIndex(timeArray: number[], targetTime: number): number {
  if (!timeArray.length) return -1;
  
  let closestIndex = 0;
  let closestDiff = Math.abs(timeArray[0] - targetTime);
  
  for (let i = 1; i < timeArray.length; i++) {
    const diff = Math.abs(timeArray[i] - targetTime);
    if (diff < closestDiff) {
      closestDiff = diff;
      closestIndex = i;
    }
  }
  
  return closestIndex;
} 