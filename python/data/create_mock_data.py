#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import numpy as np
from scipy.io import savemat
import argparse
import math

def create_mock_data(filename='mock_data.mat', duration=60, sample_rate=100):
    """
    Create a mock .mat file with realistic automotive measurement data.
    
    Args:
        filename (str): Output filename
        duration (float): Duration in seconds
        sample_rate (int): Samples per second
    """
    # Calculate number of samples
    num_samples = int(duration * sample_rate)
    
    # Create time axis
    time = np.linspace(0, duration, num_samples)
    
    # Create engine RPM data (with realistic idle and acceleration patterns)
    rpm_base = 800  # Idle RPM
    rpm = np.zeros(num_samples)
    
    # Add some realistic RPM patterns
    for i in range(num_samples):
        t = time[i]
        
        # Start at idle
        if t < 5:
            rpm[i] = rpm_base + np.random.normal(0, 20)
        
        # First acceleration
        elif t < 15:
            progress = (t - 5) / 10
            target_rpm = 3000
            rpm[i] = rpm_base + (target_rpm - rpm_base) * progress + np.random.normal(0, 30)
        
        # Maintain speed
        elif t < 20:
            rpm[i] = 3000 + np.random.normal(0, 50)
        
        # Second acceleration
        elif t < 30:
            progress = (t - 20) / 10
            target_rpm = 5000
            rpm[i] = 3000 + (target_rpm - 3000) * progress + np.random.normal(0, 70)
        
        # Maintain high speed
        elif t < 40:
            rpm[i] = 5000 + np.random.normal(0, 100)
        
        # Deceleration
        elif t < 50:
            progress = (t - 40) / 10
            target_rpm = rpm_base
            rpm[i] = 5000 - (5000 - target_rpm) * progress + np.random.normal(0, 50)
        
        # Back to idle
        else:
            rpm[i] = rpm_base + np.random.normal(0, 20)
    
    # Create vehicle speed data (km/h) based on RPM
    # Assuming a simple relationship between RPM and speed
    speed = np.zeros(num_samples)
    for i in range(num_samples):
        if rpm[i] <= rpm_base + 100:  # Idle or near idle
            speed[i] = 0
        else:
            # Simple formula: speed increases with RPM but plateaus at high RPM
            speed[i] = ((rpm[i] - rpm_base) / 100) * 1.5
            
        # Add some noise
        speed[i] += np.random.normal(0, 0.5)
        
        # Ensure non-negative
        speed[i] = max(0, speed[i])
    
    # Create engine temperature data (°C)
    # Engine starts cold and warms up
    temp_base = 20  # Ambient temperature
    temp_max = 90   # Operating temperature
    temp = np.zeros(num_samples)
    
    for i in range(num_samples):
        t = time[i]
        # Exponential warm-up curve
        temp[i] = temp_base + (temp_max - temp_base) * (1 - math.exp(-t / 15))
        
        # Add some noise
        temp[i] += np.random.normal(0, 0.3)
        
        # Add some correlation with RPM (higher RPM = slightly higher temp)
        rpm_factor = (rpm[i] - rpm_base) / 5000  # Normalized RPM factor
        temp[i] += rpm_factor * 5  # Up to 5 degrees higher at max RPM
    
    # Create throttle position data (%)
    throttle = np.zeros(num_samples)
    
    for i in range(num_samples):
        t = time[i]
        
        # Correlate throttle with RPM changes
        if i > 0:
            rpm_change = (rpm[i] - rpm[i-1]) / 100  # Normalized RPM change
            throttle[i] = max(0, min(100, throttle[i-1] + rpm_change * 20))
        
        # Override for specific scenarios
        if t < 5:
            throttle[i] = np.random.normal(5, 1)  # Idle
        elif t >= 5 and t < 15:
            progress = (t - 5) / 10
            throttle[i] = 5 + progress * 40 + np.random.normal(0, 2)  # First acceleration
        elif t >= 15 and t < 20:
            throttle[i] = np.random.normal(30, 3)  # Maintain speed
        elif t >= 20 and t < 30:
            progress = (t - 20) / 10
            throttle[i] = 30 + progress * 50 + np.random.normal(0, 3)  # Second acceleration
        elif t >= 30 and t < 40:
            throttle[i] = np.random.normal(70, 5)  # Maintain high speed
        elif t >= 40 and t < 50:
            progress = (t - 40) / 10
            throttle[i] = 70 - progress * 65 + np.random.normal(0, 2)  # Deceleration
        else:
            throttle[i] = np.random.normal(5, 1)  # Back to idle
        
        # Ensure within bounds
        throttle[i] = max(0, min(100, throttle[i]))
    
    # Create fuel consumption data (L/100km)
    fuel = np.zeros(num_samples)
    
    for i in range(num_samples):
        # Base consumption related to RPM and throttle
        rpm_factor = rpm[i] / 6000  # Normalized RPM
        throttle_factor = throttle[i] / 100  # Normalized throttle
        
        # Higher consumption at both very low and very high RPM
        rpm_efficiency = 1 - 0.5 * (1 - (1 - 2 * abs(rpm_factor - 0.5)) ** 2)
        
        # Calculate consumption (higher throttle and less efficient RPM = higher consumption)
        base_consumption = 5  # Base consumption at idle
        max_consumption = 20  # Maximum consumption
        
        fuel[i] = base_consumption + (max_consumption - base_consumption) * throttle_factor * rpm_efficiency
        
        # Add some noise
        fuel[i] += np.random.normal(0, 0.3)
        
        # Ensure non-negative
        fuel[i] = max(0, fuel[i])
    
    # Create battery voltage data (V)
    battery = np.zeros(num_samples)
    
    for i in range(num_samples):
        # Base voltage
        base_voltage = 12.6
        
        # Voltage drops slightly under load (high RPM)
        rpm_factor = (rpm[i] - rpm_base) / 5000  # Normalized RPM factor
        load_drop = rpm_factor * 0.4  # Up to 0.4V drop at max RPM
        
        # Alternator increases voltage at higher RPM
        alternator_boost = rpm_factor * 0.8  # Up to 0.8V boost at max RPM
        
        # Net effect (alternator wins at higher RPM)
        battery[i] = base_voltage - load_drop + alternator_boost
        
        # Add some noise
        battery[i] += np.random.normal(0, 0.05)
    
    # Create ambient temperature data (°C)
    # This would normally be fairly constant during a drive
    ambient_temp = np.ones(num_samples) * 20  # 20°C
    ambient_temp += np.random.normal(0, 0.2, num_samples)  # Small variations
    
    # Create oil pressure data (bar)
    oil_pressure = np.zeros(num_samples)
    
    for i in range(num_samples):
        # Oil pressure correlates with RPM
        rpm_factor = (rpm[i] - rpm_base) / 5000  # Normalized RPM factor
        
        # Base pressure at idle
        base_pressure = 1.0
        
        # Pressure increases with RPM
        oil_pressure[i] = base_pressure + rpm_factor * 4  # Up to 5 bar at max RPM
        
        # Add some noise
        oil_pressure[i] += np.random.normal(0, 0.1)
        
        # Ensure non-negative
        oil_pressure[i] = max(0, oil_pressure[i])
    
    # Assemble all data
    data = {
        'time': time,
        'engineRPM': rpm,
        'vehicleSpeed': speed,
        'engineTemp': temp,
        'throttlePosition': throttle,
        'fuelConsumption': fuel,
        'batteryVoltage': battery,
        'ambientTemp': ambient_temp,
        'oilPressure': oil_pressure
    }
    
    # Save to .mat file
    savemat(filename, data)
    
    print(f"Created mock data file: {filename}")
    print(f"Duration: {duration} seconds")
    print(f"Sample rate: {sample_rate} Hz")
    print(f"Total samples: {num_samples}")
    print(f"Signals: {', '.join(data.keys())}")
    
    return filename

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Create mock automotive measurement data')
    parser.add_argument('--filename', type=str, default='mock_data.mat', help='Output filename')
    parser.add_argument('--duration', type=float, default=60, help='Duration in seconds')
    parser.add_argument('--sample_rate', type=int, default=100, help='Samples per second')
    
    args = parser.parse_args()
    
    create_mock_data(args.filename, args.duration, args.sample_rate) 