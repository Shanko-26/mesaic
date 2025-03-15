#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Signal processor module for handling signal operations.
"""

import numpy as np
from scipy import signal as scipy_signal  # Rename to avoid collision
from scipy.fft import fft, fftfreq
import traceback

class SignalProcessor:
    """
    Signal processor class for handling signal operations.
    
    This class provides methods for various signal processing operations:
    - Basic arithmetic operations (add, subtract, multiply, divide)
    - Signal transformations (absolute value, scaling)
    - Filtering operations (low-pass, high-pass, band-pass)
    - Derivative calculations (1st and 2nd order)
    - Frequency domain analysis (FFT)
    - Statistical analysis (min, max, mean, median, std, rms)
    """
    
    def __init__(self):
        """Initialize the signal processor with available operations."""
        self.operations = {
            'add': self.add_signals,
            'subtract': self.subtract_signals,
            'multiply': self.multiply_signals,
            'divide': self.divide_signals,
            'abs': self.absolute_value,
            'scale': self.scale_signal,
            'derivative': self.compute_derivative,
            'filter': self.filter_signal,
            'fft': self.apply_fft,
            'stats': self.compute_statistics
        }
    
    def execute_operation(self, operation_type, signals_data, **parameters):
        """
        Execute a signal operation.
        
        Args:
            operation_type (str): The type of operation to perform.
            signals_data (dict): Dictionary of signal data.
            **parameters: Parameters for the operation.
            
        Returns:
            dict: Result of the operation with data and metadata.
            
        Raises:
            ValueError: If the operation type is unknown.
        """
        if operation_type not in self.operations:
            raise ValueError(f"Unknown operation: {operation_type}")
        
        try:
            return self.operations[operation_type](signals_data, **parameters)
        except Exception as e:
            traceback.print_exc()
            raise ValueError(f"Error executing operation {operation_type}: {str(e)}")
    
    def add_signals(self, signals_data, signal1=None, signal2=None):
        """
        Add two signals.
        
        Args:
            signals_data (dict): Dictionary of signal data.
            signal1 (str): Name of the first signal.
            signal2 (str): Name of the second signal.
            
        Returns:
            dict: Result with data and metadata.
            
        Raises:
            ValueError: If signal names are not provided or not found.
        """
        if signal1 is None or signal2 is None:
            raise ValueError("Must specify two signals to add")
        
        if signal1 not in signals_data or signal2 not in signals_data:
            raise ValueError(f"Signal not found: {signal1 if signal1 not in signals_data else signal2}")
        
        # Get signal data
        data1 = signals_data[signal1]
        data2 = signals_data[signal2]
        
        # Make sure the signals have the same length
        min_length = min(len(data1), len(data2))
        data1 = data1[:min_length]
        data2 = data2[:min_length]
        
        # Add the signals
        result_data = np.add(data1, data2)
        
        return {
            'data': result_data.tolist(),
            'metadata': {
                'operation': 'add',
                'inputs': [signal1, signal2],
                'description': f"Sum of {signal1} and {signal2}"
            }
        }
    
    def subtract_signals(self, signals_data, signal1=None, signal2=None):
        """
        Subtract one signal from another.
        
        Args:
            signals_data (dict): Dictionary of signal data.
            signal1 (str): Name of the first signal.
            signal2 (str): Name of the second signal.
            
        Returns:
            dict: Result with data and metadata.
            
        Raises:
            ValueError: If signal names are not provided or not found.
        """
        if signal1 is None or signal2 is None:
            raise ValueError("Must specify two signals to subtract")
        
        if signal1 not in signals_data or signal2 not in signals_data:
            raise ValueError(f"Signal not found: {signal1 if signal1 not in signals_data else signal2}")
        
        # Get signal data
        data1 = signals_data[signal1]
        data2 = signals_data[signal2]
        
        # Make sure the signals have the same length
        min_length = min(len(data1), len(data2))
        data1 = data1[:min_length]
        data2 = data2[:min_length]
        
        # Subtract the signals
        result_data = np.subtract(data1, data2)
        
        return {
            'data': result_data.tolist(),
            'metadata': {
                'operation': 'subtract',
                'inputs': [signal1, signal2],
                'description': f"{signal1} minus {signal2}"
            }
        }
    
    def multiply_signals(self, signals_data, signal1=None, signal2=None):
        """
        Multiply two signals.
        
        Args:
            signals_data (dict): Dictionary of signal data.
            signal1 (str): Name of the first signal.
            signal2 (str): Name of the second signal.
            
        Returns:
            dict: Result with data and metadata.
            
        Raises:
            ValueError: If signal names are not provided or not found.
        """
        if signal1 is None or signal2 is None:
            raise ValueError("Must specify two signals to multiply")
        
        if signal1 not in signals_data or signal2 not in signals_data:
            raise ValueError(f"Signal not found: {signal1 if signal1 not in signals_data else signal2}")
        
        # Get signal data
        data1 = signals_data[signal1]
        data2 = signals_data[signal2]
        
        # Make sure the signals have the same length
        min_length = min(len(data1), len(data2))
        data1 = data1[:min_length]
        data2 = data2[:min_length]
        
        # Multiply the signals
        result_data = np.multiply(data1, data2)
        
        return {
            'data': result_data.tolist(),
            'metadata': {
                'operation': 'multiply',
                'inputs': [signal1, signal2],
                'description': f"Product of {signal1} and {signal2}"
            }
        }
    
    def divide_signals(self, signals_data, signal1=None, signal2=None):
        """
        Divide one signal by another.
        
        Args:
            signals_data (dict): Dictionary of signal data.
            signal1 (str): Name of the first signal (numerator).
            signal2 (str): Name of the second signal (denominator).
            
        Returns:
            dict: Result with data and metadata.
            
        Raises:
            ValueError: If signal names are not provided or not found.
        """
        if signal1 is None or signal2 is None:
            raise ValueError("Must specify two signals to divide")
        
        if signal1 not in signals_data or signal2 not in signals_data:
            raise ValueError(f"Signal not found: {signal1 if signal1 not in signals_data else signal2}")
        
        # Get signal data
        data1 = signals_data[signal1]
        data2 = signals_data[signal2]
        
        # Make sure the signals have the same length
        min_length = min(len(data1), len(data2))
        data1 = data1[:min_length]
        data2 = data2[:min_length]
        
        # Avoid division by zero
        data2 = np.where(np.abs(data2) < 1e-10, 1e-10, data2)
        
        # Divide the signals
        result_data = np.divide(data1, data2)
        
        return {
            'data': result_data.tolist(),
            'metadata': {
                'operation': 'divide',
                'inputs': [signal1, signal2],
                'description': f"{signal1} divided by {signal2}"
            }
        }
    
    def absolute_value(self, signals_data, signal=None):
        """
        Compute the absolute value of a signal.
        
        Args:
            signals_data (dict): Dictionary of signal data.
            signal (str): Name of the signal.
            
        Returns:
            dict: Result with data and metadata.
            
        Raises:
            ValueError: If signal name is not provided or not found.
        """
        if signal is None:
            raise ValueError("Must specify a signal")
        
        if signal not in signals_data:
            raise ValueError(f"Signal not found: {signal}")
        
        # Get signal data
        data = signals_data[signal]
        
        # Compute absolute value
        result_data = np.abs(data)
        
        return {
            'data': result_data.tolist(),
            'metadata': {
                'operation': 'abs',
                'inputs': [signal],
                'description': f"Absolute value of {signal}"
            }
        }
    
    def scale_signal(self, signals_data, signal=None, factor=1.0):
        """
        Scale a signal by a factor.
        
        Args:
            signals_data (dict): Dictionary of signal data.
            signal (str): Name of the signal.
            factor (float): Scaling factor.
            
        Returns:
            dict: Result with data and metadata.
            
        Raises:
            ValueError: If signal name is not provided or not found.
        """
        if signal is None:
            raise ValueError("Must specify a signal")
        
        if signal not in signals_data:
            raise ValueError(f"Signal not found: {signal}")
        
        # Get signal data
        data = signals_data[signal]
        
        # Scale the signal
        result_data = np.multiply(data, factor)
        
        return {
            'data': result_data.tolist(),
            'metadata': {
                'operation': 'scale',
                'inputs': [signal],
                'parameters': {'factor': factor},
                'description': f"{signal} scaled by factor {factor}"
            }
        }
    
    def compute_derivative(self, signals_data, signal=None, order=1):
        """
        Compute the derivative of a signal.
        
        Args:
            signals_data (dict): Dictionary of signal data.
            signal (str): Name of the signal.
            order (int): Order of the derivative (1 or 2).
            
        Returns:
            dict: Result with data and metadata.
            
        Raises:
            ValueError: If signal name is not provided or not found.
        """
        if signal is None:
            raise ValueError("Must specify a signal")
        
        if signal not in signals_data:
            raise ValueError(f"Signal not found: {signal}")
        
        # Get signal data
        data = signals_data[signal]
        
        # Compute derivative
        if order == 1:
            result_data = np.gradient(data)
        elif order == 2:
            result_data = np.gradient(np.gradient(data))
        else:
            raise ValueError(f"Unsupported derivative order: {order}")
        
        return {
            'data': result_data.tolist(),
            'metadata': {
                'operation': 'derivative',
                'inputs': [signal],
                'parameters': {'order': order},
                'description': f"{order}{'st' if order == 1 else 'nd'} order derivative of {signal}"
            }
        }
    
    def filter_signal(self, signals_data, signal=None, filter_type='lowpass', cutoff_freq=0.1, order=4):
        """
        Apply a filter to a signal.
        
        Args:
            signals_data (dict): Dictionary of signal data.
            signal (str): Name of the signal.
            filter_type (str): Type of filter ('lowpass', 'highpass', 'bandpass', 'bandstop').
            cutoff_freq (float or tuple): Cutoff frequency (normalized to Nyquist frequency).
                                         For bandpass and bandstop, provide a tuple (low, high).
            order (int): Filter order.
            
        Returns:
            dict: Result with data and metadata.
            
        Raises:
            ValueError: If signal name is not provided or not found.
        """
        if signal is None:
            raise ValueError("Must specify a signal to filter")
            
        if signal not in signals_data:
            raise ValueError(f"Signal not found: {signal}")
            
        data = np.array(signals_data[signal])
        
        # Validate filter type
        valid_filter_types = ['lowpass', 'highpass', 'bandpass', 'bandstop']
        if filter_type not in valid_filter_types:
            raise ValueError(f"Invalid filter type: {filter_type}. Must be one of {valid_filter_types}")
        
        # Validate cutoff frequency and convert to float if it's a string
        if isinstance(cutoff_freq, str):
            try:
                cutoff_freq = float(cutoff_freq)
            except ValueError:
                raise ValueError(f"Invalid cutoff frequency: {cutoff_freq}. Must be a number or a tuple of numbers.")
        
        if filter_type in ['bandpass', 'bandstop']:
            if not isinstance(cutoff_freq, (list, tuple)) or len(cutoff_freq) != 2:
                raise ValueError(f"For {filter_type} filter, cutoff_freq must be a tuple (low, high)")
            # Convert each element to float if they're strings
            if isinstance(cutoff_freq, (list, tuple)):
                cutoff_freq = [float(f) if isinstance(f, str) else f for f in cutoff_freq]
        
        # Design the filter
        nyquist = 0.5  # Assuming normalized frequency
        normal_cutoff = cutoff_freq / nyquist if isinstance(cutoff_freq, (int, float)) else [f / nyquist for f in cutoff_freq]
        
        # Use scipy_signal instead of signal to avoid name collision
        b, a = scipy_signal.butter(order, normal_cutoff, btype=filter_type, analog=False)
        
        # Apply the filter
        filtered_data = scipy_signal.filtfilt(b, a, data)
        
        return {
            'data': filtered_data.tolist(),
            'metadata': {
                'operation': 'filter',
                'inputs': [signal],
                'parameters': {
                    'filter_type': filter_type,
                    'cutoff_freq': cutoff_freq,
                    'order': order
                },
                'description': f"{filter_type.capitalize()} filtered {signal} with cutoff {cutoff_freq}"
            }
        }
    
    def apply_fft(self, signals_data, signal=None, sample_rate=1.0):
        """
        Apply Fast Fourier Transform to a signal.
        
        Args:
            signals_data (dict): Dictionary of signal data.
            signal (str): Name of the signal.
            sample_rate (float): Sampling rate of the signal.
            
        Returns:
            dict: Result with data and metadata.
            
        Raises:
            ValueError: If signal name is not provided or not found.
        """
        if signal is None:
            raise ValueError("Must specify a signal")
        
        if signal not in signals_data:
            raise ValueError(f"Signal not found: {signal}")
        
        # Get signal data
        data = signals_data[signal]
        
        # Compute FFT
        n = len(data)
        fft_result = fft(data)
        
        # Get frequencies
        freqs = fftfreq(n, 1/sample_rate)
        
        # Get magnitude (only positive frequencies)
        positive_freq_idx = freqs >= 0
        freqs = freqs[positive_freq_idx]
        magnitude = np.abs(fft_result[positive_freq_idx])
        
        return {
            'data': magnitude.tolist(),
            'metadata': {
                'operation': 'fft',
                'inputs': [signal],
                'parameters': {'sample_rate': sample_rate},
                'description': f"Frequency spectrum of {signal}",
                'x_label': 'Frequency (Hz)',
                'y_label': 'Magnitude',
                'frequency_data': freqs.tolist()
            }
        }
    
    def compute_statistics(self, signals_data, signal=None):
        """
        Compute statistics for a signal.
        
        Args:
            signals_data (dict): Dictionary of signal data.
            signal (str): Name of the signal.
            
        Returns:
            dict: Result with data and metadata.
            
        Raises:
            ValueError: If signal name is not provided or not found.
        """
        if signal is None:
            raise ValueError("Must specify a signal")
        
        if signal not in signals_data:
            raise ValueError(f"Signal not found: {signal}")
        
        # Get signal data
        data = signals_data[signal]
        
        # Compute statistics
        stats = {
            'min': float(np.min(data)),
            'max': float(np.max(data)),
            'mean': float(np.mean(data)),
            'median': float(np.median(data)),
            'std': float(np.std(data)),
            'rms': float(np.sqrt(np.mean(np.square(data))))
        }
        
        return {
            'data': data,  # Return original data
            'metadata': {
                'operation': 'stats',
                'inputs': [signal],
                'description': f"Statistics for {signal}",
                'statistics': stats
            }
        } 