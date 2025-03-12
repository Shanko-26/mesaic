#!/usr/bin/env python
# -*- coding: utf-8 -*-

import sys
import os
import json
import traceback
import numpy as np
from scipy.io import loadmat
import pandas as pd

def convert_to_serializable(obj):
    """
    Convert numpy arrays and other non-serializable objects to Python native types.
    
    Args:
        obj: The object to convert
        
    Returns:
        A serializable version of the object
    """
    if isinstance(obj, np.ndarray):
        if obj.ndim == 0:
            return obj.item()
        return obj.tolist()
    elif isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, dict):
        return {k: convert_to_serializable(v) for k, v in obj.items() if not k.startswith('__')}
    elif isinstance(obj, list):
        return [convert_to_serializable(item) for item in obj]
    else:
        return obj

def load_mat_file(file_path):
    """
    Load a MATLAB .mat file and return its contents.
    
    Args:
        file_path (str): Path to the .mat file
        
    Returns:
        dict: Dictionary containing the file's data
    """
    try:
        # Load the .mat file
        mat_data = loadmat(file_path)
        
        # Filter out metadata and system variables
        filtered_data = {k: v for k, v in mat_data.items() if not k.startswith('__')}
        
        # Extract time axis if available
        time_axis = None
        for key in filtered_data:
            if key.lower() in ['time', 't', 'timestamp', 'timestamps']:
                time_axis = filtered_data[key]
                # Remove this key from filtered data to avoid duplication
                if key != 'time':  # Keep 'time' if that's the actual key
                    del filtered_data[key]
                break
        
        # If no time axis found, create one based on the length of the first signal
        if time_axis is None and filtered_data:
            first_signal = next(iter(filtered_data.values()))
            if isinstance(first_signal, np.ndarray):
                time_axis = np.arange(first_signal.shape[0])
        
        # Prepare the data structure
        signals = []
        data = {}
        
        # Add time axis
        if time_axis is not None:
            # Ensure time axis is 1D
            if time_axis.ndim > 1:
                time_axis = time_axis.flatten()
            data['time'] = convert_to_serializable(time_axis)
            signals.append('time')
        
        # Add all other signals
        for key, value in filtered_data.items():
            if isinstance(value, np.ndarray):
                # Ensure the array is 1D
                if value.ndim > 1:
                    value = value.flatten()
                # Only include arrays as signals
                data[key] = convert_to_serializable(value)
                signals.append(key)
        
        # Create metadata
        metadata = {
            "file_type": "mat",
            "file_path": file_path,
            "file_size": os.path.getsize(file_path),
            "num_signals": len(signals),
            "units": {}  # Units are typically not stored in .mat files
        }
        
        # Try to infer units from signal names
        for signal in signals:
            if 'rpm' in signal.lower():
                metadata["units"][signal] = "rpm"
            elif 'speed' in signal.lower():
                metadata["units"][signal] = "km/h"
            elif 'temp' in signal.lower():
                metadata["units"][signal] = "°C"
            elif 'pressure' in signal.lower() or signal.lower().endswith('pressure'):
                metadata["units"][signal] = "bar"
            elif 'voltage' in signal.lower():
                metadata["units"][signal] = "V"
            elif 'current' in signal.lower():
                metadata["units"][signal] = "A"
            elif 'time' in signal.lower():
                metadata["units"][signal] = "s"
            elif 'throttle' in signal.lower() or 'position' in signal.lower():
                metadata["units"][signal] = "%"
            elif 'fuel' in signal.lower() or 'consumption' in signal.lower():
                metadata["units"][signal] = "L/100km"
            else:
                metadata["units"][signal] = ""
        
        # Add sample rate and duration if time axis exists
        if 'time' in data and len(data['time']) > 1:
            time_values = data['time']
            duration = time_values[-1] - time_values[0]
            sample_rate = len(time_values) / duration if duration > 0 else 0
            metadata["duration"] = duration
            metadata["sample_rate"] = sample_rate
        
        print(f"Loaded MAT file with {len(signals)} signals and {len(data['time']) if 'time' in data else 0} samples")
        
        return {
            "metadata": metadata,
            "signals": signals,
            "data": data
        }
    except Exception as e:
        print(f"Error loading MAT file: {str(e)}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        raise Exception(f"Error loading MAT file: {str(e)}")

def load_mf4_file(file_path):
    """
    Load an MDF4 .mf4 file and return its contents.
    
    Args:
        file_path (str): Path to the .mf4 file
        
    Returns:
        dict: Dictionary containing the file's data
    """
    try:
        # This requires the asammdf package
        try:
            from asammdf import MDF
        except ImportError:
            raise ImportError("The asammdf package is required to load MF4 files. Please install it with 'pip install asammdf'.")
        
        # Load the MF4 file
        mdf = MDF(file_path)
        
        # Get all channels
        channels = mdf.channels_db
        
        # Prepare the data structure
        signals = []
        data = {}
        metadata = {
            "file_type": "mf4",
            "file_path": file_path,
            "file_size": os.path.getsize(file_path),
            "units": {}
        }
        
        # Process each channel
        for channel_name in channels:
            # Skip empty channel names
            if not channel_name:
                continue
                
            # Get the channel
            channel = mdf.get(channel_name)
            
            # Skip channels with no samples
            if channel.samples.size == 0:
                continue
            
            # Add to signals list
            signals.append(channel_name)
            
            # Add data
            data[channel_name] = convert_to_serializable(channel.samples)
            
            # Add metadata
            if channel.unit:
                metadata["units"][channel_name] = channel.unit
            else:
                metadata["units"][channel_name] = ""
        
        # Add time axis if not already present
        if 'time' not in data and signals:
            # Use the timestamps from the first channel
            first_channel = mdf.get(signals[0])
            data['time'] = convert_to_serializable(first_channel.timestamps)
            signals.insert(0, 'time')
            metadata["units"]['time'] = 's'
        
        return {
            "metadata": metadata,
            "signals": signals,
            "data": data
        }
    except Exception as e:
        print(f"Error loading MF4 file: {str(e)}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        raise Exception(f"Error loading MF4 file: {str(e)}")

def main():
    """
    Main function to process command line arguments and load the appropriate file.
    """
    try:
        if len(sys.argv) < 2:
            raise Exception("No file path provided")
        
        file_path = sys.argv[1]
        
        if not os.path.exists(file_path):
            raise Exception(f"File not found: {file_path}")
        
        file_extension = os.path.splitext(file_path)[1].lower()
        
        if file_extension == '.mat':
            result = load_mat_file(file_path)
        elif file_extension == '.mf4':
            result = load_mf4_file(file_path)
        else:
            raise Exception(f"Unsupported file type: {file_extension}")
        
        # Output the result as JSON
        print(json.dumps(result))
        
    except Exception as e:
        error_info = {
            "error": str(e),
            "traceback": traceback.format_exc()
        }
        print(json.dumps(error_info))
        sys.exit(1)

if __name__ == "__main__":
    main() 