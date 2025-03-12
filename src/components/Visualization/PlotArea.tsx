'use client';

import { useEffect, useRef, useState } from 'react';
import { PlotData, createPlot, updatePlot } from '../../services/visualization';

interface PlotAreaProps {
  plotData?: PlotData;
  isLoading?: boolean;
}

export function PlotArea({ plotData, isLoading = false }: PlotAreaProps) {
  const plotContainerRef = useRef<HTMLDivElement>(null);
  const [plotInitialized, setPlotInitialized] = useState(false);
  
  useEffect(() => {
    // Initialize or update the plot when plotData changes
    if (plotData && plotContainerRef.current) {
      const containerId = 'plot-container';
      
      if (!plotInitialized) {
        // Initialize the plot
        createPlot(containerId, plotData)
          .then(() => {
            setPlotInitialized(true);
          })
          .catch((error: Error) => {
            console.error('Error creating plot:', error);
          });
      } else {
        // Update the plot
        updatePlot(containerId, plotData)
          .catch((error: Error) => {
            console.error('Error updating plot:', error);
          });
      }
    }
  }, [plotData, plotInitialized]);
  
  // Reset the plot initialization state when the component unmounts
  useEffect(() => {
    return () => {
      setPlotInitialized(false);
    };
  }, []);
  
  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 min-h-0">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            <span className="ml-3">Loading plot...</span>
          </div>
        ) : !plotData ? (
          <div className="w-full h-full flex items-center justify-center text-gray-500">
            <p>No data to display. Please load a file to visualize data.</p>
          </div>
        ) : (
          <div 
            id="plot-container" 
            ref={plotContainerRef} 
            className="w-full h-full"
          ></div>
        )}
      </div>
    </div>
  );
} 