/**
 * Type definitions for signal operations and AI integration
 */

/**
 * Represents a signal operation to be executed
 */
export interface SignalOperation {
  /** The operation to perform (add, subtract, filter, derivative, etc.) */
  operation: string;
  
  /** List of signal names to operate on */
  signals: string[];
  
  /** Optional parameters for the operation */
  parameters?: Record<string, any>;
  
  /** Name for the output signal */
  outputName: string;
}

/**
 * Result from the AI query engine
 */
export interface AIQueryResult {
  /** List of operations to perform */
  operations: SignalOperation[];
  
  /** Explanation of what the operations will do */
  explanation: string;
}

/**
 * Structure of a derived signal
 */
export interface DerivedSignal {
  /** The signal data (array of values) */
  data: number[];
  
  /** Metadata about the signal */
  metadata: {
    /** The operation that created this signal */
    operation: string;
    
    /** The input signals used to create this signal */
    inputs: string[];
    
    /** Parameters used in the operation */
    parameters?: Record<string, any>;
    
    /** Human-readable description of the signal */
    description: string;
    
    /** Optional x-axis label for visualization */
    x_label?: string;
    
    /** Optional y-axis label for visualization */
    y_label?: string;
    
    /** Optional frequency data for FFT results */
    frequency_data?: number[];
    
    /** Optional statistics for statistical operations */
    statistics?: {
      min: number;
      max: number;
      mean: number;
      median: number;
      std: number;
      rms: number;
      [key: string]: number;
    };
  };
}

/**
 * Available signal operation types
 */
export enum SignalOperationType {
  ADD = 'add',
  SUBTRACT = 'subtract',
  MULTIPLY = 'multiply',
  DIVIDE = 'divide',
  ABSOLUTE = 'abs',
  SCALE = 'scale',
  DERIVATIVE = 'derivative',
  FILTER = 'filter',
  FFT = 'fft',
  STATISTICS = 'stats'
}

/**
 * Filter types for signal filtering
 */
export enum FilterType {
  LOWPASS = 'lowpass',
  HIGHPASS = 'highpass',
  BANDPASS = 'bandpass',
  BANDSTOP = 'bandstop'
}

/**
 * Parameters for different operation types
 */
export interface AddParameters {
  signal1: string;
  signal2: string;
}

export interface SubtractParameters {
  signal1: string;
  signal2: string;
}

export interface MultiplyParameters {
  signal1: string;
  signal2: string;
}

export interface DivideParameters {
  signal1: string;
  signal2: string;
}

export interface AbsoluteParameters {
  signal: string;
}

export interface ScaleParameters {
  signal: string;
  factor: number;
}

export interface DerivativeParameters {
  signal: string;
  order: number;
}

export interface FilterParameters {
  signal: string;
  filter_type: FilterType;
  cutoff_freq: number;
  order?: number;
}

export interface FFTParameters {
  signal: string;
  sample_rate?: number;
}

export interface StatisticsParameters {
  signal: string;
} 