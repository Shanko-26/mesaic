/**
 * Sample data generator for testing the application
 * This simulates data that might come from a .mat or .mf4 file
 */

import { FileData } from '../services/file';

export interface SampleDataOptions {
  duration?: number; // Duration in seconds
  sampleRate?: number; // Samples per second
  noiseLevel?: number; // Noise level (0-1)
}

/**
 * Generate a sine wave with optional noise
 * @param frequency Frequency in Hz
 * @param amplitude Amplitude
 * @param phase Phase in radians
 * @param duration Duration in seconds
 * @param sampleRate Samples per second
 * @param noiseLevel Noise level (0-1)
 * @returns Array of values
 */
function generateSineWave(
  frequency: number,
  amplitude: number,
  phase: number = 0,
  duration: number = 10,
  sampleRate: number = 100,
  noiseLevel: number = 0.1
): number[] {
  const numSamples = Math.floor(duration * sampleRate);
  const timeStep = 1 / sampleRate;
  
  return Array.from({ length: numSamples }, (_, i) => {
    const time = i * timeStep;
    const sineValue = amplitude * Math.sin(2 * Math.PI * frequency * time + phase);
    const noise = (Math.random() * 2 - 1) * noiseLevel * amplitude;
    return sineValue + noise;
  });
}

/**
 * Generate a ramp signal
 * @param startValue Start value
 * @param endValue End value
 * @param duration Duration in seconds
 * @param sampleRate Samples per second
 * @param noiseLevel Noise level (0-1)
 * @returns Array of values
 */
function generateRamp(
  startValue: number,
  endValue: number,
  duration: number = 10,
  sampleRate: number = 100,
  noiseLevel: number = 0.1
): number[] {
  const numSamples = Math.floor(duration * sampleRate);
  const step = (endValue - startValue) / (numSamples - 1);
  
  return Array.from({ length: numSamples }, (_, i) => {
    const value = startValue + i * step;
    const noise = (Math.random() * 2 - 1) * noiseLevel * Math.abs(endValue - startValue) / 10;
    return value + noise;
  });
}

/**
 * Generate a step signal
 * @param lowValue Low value
 * @param highValue High value
 * @param stepPoints Array of step points (0-1)
 * @param duration Duration in seconds
 * @param sampleRate Samples per second
 * @param noiseLevel Noise level (0-1)
 * @returns Array of values
 */
function generateStep(
  lowValue: number,
  highValue: number,
  stepPoints: number[] = [0.2, 0.5, 0.8],
  duration: number = 10,
  sampleRate: number = 100,
  noiseLevel: number = 0.1
): number[] {
  const numSamples = Math.floor(duration * sampleRate);
  const stepIndices = stepPoints.map(point => Math.floor(point * numSamples));
  
  return Array.from({ length: numSamples }, (_, i) => {
    // Determine if we're at a high or low value
    let isHigh = false;
    for (let j = 0; j < stepIndices.length; j++) {
      if (i >= stepIndices[j]) {
        isHigh = !isHigh;
      }
    }
    
    const value = isHigh ? highValue : lowValue;
    const noise = (Math.random() * 2 - 1) * noiseLevel * Math.abs(highValue - lowValue) / 10;
    return value + noise;
  });
}

/**
 * Generate random data
 * @param min Minimum value
 * @param max Maximum value
 * @param duration Duration in seconds
 * @param sampleRate Samples per second
 * @returns Array of values
 */
function generateRandom(
  min: number,
  max: number,
  duration: number = 10,
  sampleRate: number = 100
): number[] {
  const numSamples = Math.floor(duration * sampleRate);
  const range = max - min;
  
  return Array.from({ length: numSamples }, () => min + Math.random() * range);
}

/**
 * Generate a sample dataset for testing
 * @param options Options for generating the dataset
 * @returns Sample dataset
 */
export function generateSampleData(options: SampleDataOptions = {}) {
  const {
    duration = 60, // 1 minute of data
    sampleRate = 100, // 100 samples per second
    noiseLevel = 0.05 // 5% noise
  } = options;
  
  // Generate time axis
  const numSamples = Math.floor(duration * sampleRate);
  const timeAxis = Array.from({ length: numSamples }, (_, i) => i / sampleRate);
  
  // Generate engine RPM (sine wave with increasing frequency)
  const rpm = generateSineWave(0.1, 3000, 0, duration, sampleRate, noiseLevel);
  // Add a base RPM of 800
  const engineRPM = rpm.map(value => value + 800);
  
  // Generate vehicle speed (ramp with some oscillation)
  const baseSpeed = generateRamp(0, 120, duration, sampleRate, noiseLevel);
  const speedOscillation = generateSineWave(0.05, 5, Math.PI / 4, duration, sampleRate, noiseLevel);
  const vehicleSpeed = baseSpeed.map((value, i) => Math.max(0, value + speedOscillation[i]));
  
  // Generate throttle position (step function)
  const throttlePosition = generateStep(10, 80, [0.2, 0.4, 0.6, 0.8], duration, sampleRate, noiseLevel);
  
  // Generate engine temperature (slow ramp with plateau)
  const engineTemp = generateRamp(20, 90, duration, sampleRate, noiseLevel).map(value => 
    value > 85 ? 85 + Math.random() * 5 : value
  );
  
  // Generate fuel consumption (related to RPM and throttle)
  const fuelConsumption = engineRPM.map((rpm, i) => {
    const throttle = throttlePosition[i];
    // Simple model: fuel consumption increases with RPM and throttle
    const baseFuel = (rpm / 1000) * (throttle / 100) * 10;
    const noise = (Math.random() * 2 - 1) * noiseLevel * 2;
    return baseFuel + noise;
  });
  
  // Generate battery voltage (mostly constant with some dips)
  const batteryVoltage = Array.from({ length: numSamples }, (_, i) => {
    const baseVoltage = 12.6;
    // Add some dips when engine RPM changes rapidly
    const rpmChange = i > 0 ? Math.abs(engineRPM[i] - engineRPM[i - 1]) : 0;
    const dip = rpmChange > 100 ? (rpmChange / 1000) : 0;
    const noise = (Math.random() * 2 - 1) * 0.1;
    return baseVoltage - dip + noise;
  });
  
  // Generate random sensor data
  const ambientTemp = generateRamp(15, 25, duration, sampleRate, noiseLevel);
  const oilPressure = generateRamp(2, 5, duration, sampleRate, noiseLevel);
  
  return {
    metadata: {
      duration,
      sampleRate,
      numSamples,
      description: "Sample vehicle measurement data",
      date: new Date().toISOString(),
      units: {
        time: "s",
        engineRPM: "rpm",
        vehicleSpeed: "km/h",
        throttlePosition: "%",
        engineTemp: "°C",
        fuelConsumption: "L/100km",
        batteryVoltage: "V",
        ambientTemp: "°C",
        oilPressure: "bar"
      }
    },
    signals: [
      "time",
      "engineRPM",
      "vehicleSpeed",
      "throttlePosition",
      "engineTemp",
      "fuelConsumption",
      "batteryVoltage",
      "ambientTemp",
      "oilPressure"
    ],
    data: {
      time: timeAxis,
      engineRPM,
      vehicleSpeed,
      throttlePosition,
      engineTemp,
      fuelConsumption,
      batteryVoltage,
      ambientTemp,
      oilPressure
    }
  };
}

/**
 * Sample data for testing when no server is available
 */
export const sampleData: FileData = {
  signals: ['time', 'engineRPM', 'vehicleSpeed', 'engineTemp', 'throttlePosition', 'fuelConsumption', 'batteryVoltage', 'ambientTemp', 'oilPressure'],
  data: {
    time: Array.from({ length: 100 }, (_, i) => i * 0.5), // 0 to 49.5 seconds
    engineRPM: Array.from({ length: 100 }, (_, i) => {
      // Create a pattern with acceleration and deceleration
      const base = 800;
      const amplitude = 3700;
      return base + amplitude * Math.sin(i * 0.1) * Math.sin(i * 0.02);
    }),
    vehicleSpeed: Array.from({ length: 100 }, (_, i) => {
      // Speed follows RPM with a delay
      const base = 0;
      const amplitude = 120;
      return Math.max(0, base + amplitude * Math.sin((i - 5) * 0.1) * Math.sin((i - 5) * 0.02));
    }),
    engineTemp: Array.from({ length: 100 }, (_, i) => {
      // Temperature gradually increases
      return 80 + i * 0.2;
    }),
    throttlePosition: Array.from({ length: 100 }, (_, i) => {
      // Throttle position follows a pattern similar to RPM but with sharper changes
      return Math.max(0, Math.min(100, 50 + 50 * Math.sin(i * 0.15)));
    }),
    fuelConsumption: Array.from({ length: 100 }, (_, i) => {
      // Fuel consumption correlates with RPM and throttle
      const base = 2;
      const amplitude = 10;
      return base + amplitude * Math.abs(Math.sin(i * 0.1));
    }),
    batteryVoltage: Array.from({ length: 100 }, (_, i) => {
      // Battery voltage with small fluctuations
      return 12.5 + 0.5 * Math.sin(i * 0.3);
    }),
    ambientTemp: Array.from({ length: 100 }, (_, i) => {
      // Ambient temperature with slight variations
      return 25 + 3 * Math.sin(i * 0.05);
    }),
    oilPressure: Array.from({ length: 100 }, (_, i) => {
      // Oil pressure correlates with RPM
      const base = 30;
      const amplitude = 20;
      return base + amplitude * Math.abs(Math.sin(i * 0.1));
    })
  },
  metadata: {
    source: 'Sample Data',
    description: 'Generated sample data for testing',
    created: new Date().toISOString(),
    units: {
      engineRPM: 'RPM',
      vehicleSpeed: 'km/h',
      engineTemp: '°C',
      throttlePosition: '%',
      fuelConsumption: 'L/100km',
      batteryVoltage: 'V',
      ambientTemp: '°C',
      oilPressure: 'psi'
    }
  }
};

/**
 * Load sample file
 * @param {string} filePath - Path to the file (ignored, always returns sample data)
 * @returns {Promise<FileData>} Sample file data
 */
export async function loadSampleFile(filePath: string): Promise<FileData> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return sampleData;
} 