#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import json
import sys
from data.loader import load_mat_file

def main():
    """
    Test loading the mock .mat file using our loader module.
    """
    # Get the path to the mock data file
    script_dir = os.path.dirname(os.path.abspath(__file__))
    mock_file = os.path.join(script_dir, 'data', 'mock', 'vehicle_data.mat')
    
    if not os.path.exists(mock_file):
        print(f"Error: Mock file not found at {mock_file}")
        sys.exit(1)
    
    print(f"Loading mock file: {mock_file}")
    
    try:
        # Load the file using our loader
        result = load_mat_file(mock_file)
        
        # Print some basic information
        print(f"Successfully loaded file!")
        print(f"Number of signals: {len(result['signals'])}")
        print(f"Signals: {', '.join(result['signals'])}")
        print(f"Number of samples: {len(result['data']['time'])}")
        
        # Print the first few time points
        print("\nFirst 5 time points:")
        for i in range(min(5, len(result['data']['time']))):
            print(f"  {result['data']['time'][i]}")
        
        # Print some statistics for each signal
        print("\nSignal statistics:")
        for signal in result['signals']:
            if signal in result['data']:
                data = result['data'][signal]
                if len(data) > 0:
                    min_val = min(data)
                    max_val = max(data)
                    avg_val = sum(data) / len(data)
                    unit = result['metadata']['units'].get(signal, "")
                    print(f"  {signal}: min={min_val:.2f}, max={max_val:.2f}, avg={avg_val:.2f} {unit}")
        
        # Save the result to a JSON file for inspection
        output_json = os.path.join(script_dir, 'data', 'mock', 'vehicle_data.json')
        with open(output_json, 'w') as f:
            json.dump(result, f, indent=2)
        
        print(f"\nSaved JSON representation to: {output_json}")
        
    except Exception as e:
        print(f"Error loading file: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main() 