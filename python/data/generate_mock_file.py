#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import sys
from create_mock_data import create_mock_data

def main():
    """
    Generate a mock .mat file and place it in a convenient location.
    """
    # Get the directory of this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Create a directory for mock data if it doesn't exist
    mock_dir = os.path.join(script_dir, 'mock')
    os.makedirs(mock_dir, exist_ok=True)
    
    # Generate the mock data file
    output_file = os.path.join(mock_dir, 'vehicle_data.mat')
    
    # Create mock data with default parameters (60 seconds, 100 Hz)
    create_mock_data(output_file)
    
    print(f"\nMock data file created at: {output_file}")
    print("You can now load this file in the MesAIc application.")

if __name__ == "__main__":
    main() 