import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface StatisticsDisplayProps {
  statistics: {
    min: number;
    max: number;
    mean: number;
    median: number;
    std: number;
    rms: number;
  };
  signalName: string;
}

/**
 * Component to display statistics for a signal
 */
export function StatisticsDisplay({ statistics, signalName }: StatisticsDisplayProps) {
  if (!statistics) {
    return null;
  }

  // Format numbers to 4 decimal places
  const formatNumber = (num: number) => {
    return num.toFixed(4);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Statistics for {signalName}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="font-medium">Minimum:</div>
          <div>{formatNumber(statistics.min)}</div>
          
          <div className="font-medium">Maximum:</div>
          <div>{formatNumber(statistics.max)}</div>
          
          <div className="font-medium">Mean:</div>
          <div>{formatNumber(statistics.mean)}</div>
          
          <div className="font-medium">Median:</div>
          <div>{formatNumber(statistics.median)}</div>
          
          <div className="font-medium">Standard Deviation:</div>
          <div>{formatNumber(statistics.std)}</div>
          
          <div className="font-medium">RMS:</div>
          <div>{formatNumber(statistics.rms)}</div>
        </div>
      </CardContent>
    </Card>
  );
} 