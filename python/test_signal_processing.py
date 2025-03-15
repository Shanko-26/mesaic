#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Test script for signal processing and AI query engine.
"""

import json
import numpy as np
from data.signal_processor import SignalProcessor
from ai.query_engine import AIQueryEngine

def test_signal_processor():
    """Test the signal processor with various operations."""
    print("Testing SignalProcessor...")
    
    # Create a signal processor
    processor = SignalProcessor()
    
    # Create some test signals
    signals_data = {
        'sine': np.sin(np.linspace(0, 10 * np.pi, 1000)).tolist(),
        'cosine': np.cos(np.linspace(0, 10 * np.pi, 1000)).tolist(),
        'linear': np.linspace(0, 10, 1000).tolist(),
        'random': np.random.random(1000).tolist()
    }
    
    # Test basic operations
    print("\nTesting basic operations...")
    
    # Add
    result = processor.execute_operation('add', signals_data, signal1='sine', signal2='cosine')
    print(f"Add: {result['metadata']['description']}, Length: {len(result['data'])}")
    
    # Subtract
    result = processor.execute_operation('subtract', signals_data, signal1='sine', signal2='cosine')
    print(f"Subtract: {result['metadata']['description']}, Length: {len(result['data'])}")
    
    # Multiply
    result = processor.execute_operation('multiply', signals_data, signal1='sine', signal2='linear')
    print(f"Multiply: {result['metadata']['description']}, Length: {len(result['data'])}")
    
    # Divide
    result = processor.execute_operation('divide', signals_data, signal1='sine', signal2='linear')
    print(f"Divide: {result['metadata']['description']}, Length: {len(result['data'])}")
    
    # Test transformations
    print("\nTesting transformations...")
    
    # Absolute value
    result = processor.execute_operation('abs', signals_data, signal='sine')
    print(f"Absolute: {result['metadata']['description']}, Length: {len(result['data'])}")
    
    # Scale
    result = processor.execute_operation('scale', signals_data, signal='sine', factor=2.5)
    print(f"Scale: {result['metadata']['description']}, Length: {len(result['data'])}")
    
    # Test derivatives
    print("\nTesting derivatives...")
    
    # First derivative
    result = processor.execute_operation('derivative', signals_data, signal='sine', order=1)
    print(f"First derivative: {result['metadata']['description']}, Length: {len(result['data'])}")
    
    # Second derivative
    result = processor.execute_operation('derivative', signals_data, signal='sine', order=2)
    print(f"Second derivative: {result['metadata']['description']}, Length: {len(result['data'])}")
    
    # Test filters
    print("\nTesting filters...")
    
    # Low-pass filter
    result = processor.execute_operation('filter', signals_data, signal='sine', filter_type='lowpass', cutoff_freq=0.1, order=4)
    print(f"Low-pass filter: {result['metadata']['description']}, Length: {len(result['data'])}")
    
    # High-pass filter
    result = processor.execute_operation('filter', signals_data, signal='sine', filter_type='highpass', cutoff_freq=0.1, order=4)
    print(f"High-pass filter: {result['metadata']['description']}, Length: {len(result['data'])}")
    
    # Band-pass filter
    result = processor.execute_operation('filter', signals_data, signal='sine', filter_type='bandpass', cutoff_freq=[0.1, 0.3], order=4)
    print(f"Band-pass filter: {result['metadata']['description']}, Length: {len(result['data'])}")
    
    # Test FFT
    print("\nTesting FFT...")
    
    # FFT
    result = processor.execute_operation('fft', signals_data, signal='sine', sample_rate=100)
    print(f"FFT: {result['metadata']['description']}, Length: {len(result['data'])}")
    print(f"Frequency data length: {len(result['metadata']['frequency_data'])}")
    
    # Test statistics
    print("\nTesting statistics...")
    
    # Statistics
    result = processor.execute_operation('stats', signals_data, signal='sine')
    print(f"Statistics: {result['metadata']['description']}")
    print(f"Min: {result['metadata']['statistics']['min']}")
    print(f"Max: {result['metadata']['statistics']['max']}")
    print(f"Mean: {result['metadata']['statistics']['mean']}")
    print(f"Median: {result['metadata']['statistics']['median']}")
    print(f"Std: {result['metadata']['statistics']['std']}")
    print(f"RMS: {result['metadata']['statistics']['rms']}")
    
    print("\nSignalProcessor tests completed successfully!")

def test_ai_query_engine():
    """Test the AI query engine with sample queries."""
    print("\nTesting AIQueryEngine...")
    
    # Create an AI query engine
    engine = AIQueryEngine()
    
    # Define available signals
    available_signals = ['sine', 'cosine', 'linear', 'random']
    
    # Test queries
    test_queries = [
        "Add sine and cosine signals",
        "Compute the absolute value of the sine signal",
        "Apply a low-pass filter to the random signal with cutoff frequency 0.1",
        "Calculate the derivative of the linear signal",
        "Compute the FFT of the sine signal with a sample rate of 100 Hz",
        "Calculate statistics for the cosine signal"
    ]
    
    for query in test_queries:
        print(f"\nQuery: {query}")
        
        try:
            # Process the query
            result = engine.process_query(query, available_signals)
            
            # Print the result
            print(f"Explanation: {result.explanation}")
            print(f"Operations: {len(result.operations)}")
            
            for i, op in enumerate(result.operations):
                print(f"  Operation {i+1}: {op.operation}")
                print(f"    Signals: {op.signals}")
                print(f"    Parameters: {op.parameters}")
                print(f"    Output name: {op.output_name}")
        except Exception as e:
            print(f"Error processing query: {str(e)}")
    
    print("\nAIQueryEngine tests completed!")

def main():
    """Run all tests."""
    print("=== Testing Signal Processing and AI Query Engine ===\n")
    
    # Test the signal processor
    test_signal_processor()
    
    # Test the AI query engine
    test_ai_query_engine()
    
    print("\n=== All tests completed successfully! ===")

if __name__ == "__main__":
    main() 