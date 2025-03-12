import React from 'react';

interface ControlsProps {
  signals?: string[];
  selectedSignals?: string[];
  onSignalToggle?: (signal: string) => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onReset?: () => void;
}

const Controls: React.FC<ControlsProps> = ({
  signals = [],
  selectedSignals = [],
  onSignalToggle,
  onZoomIn,
  onZoomOut,
  onReset
}) => {
  return (
    <div className="bg-white p-4 rounded-md border border-slate-200">
      {/* Zoom Controls */}
      <div className="mb-4">
        <h4 className="text-sm font-medium mb-2 text-slate-700">Zoom Controls</h4>
        <div className="flex space-x-2">
          <button
            onClick={onZoomIn}
            className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            title="Zoom In"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
            </svg>
          </button>
          <button
            onClick={onZoomOut}
            className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            title="Zoom Out"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
            </svg>
          </button>
          <button
            onClick={onReset}
            className="px-3 py-1 bg-slate-600 text-white rounded-md hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
            title="Reset View"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Signal Selection */}
      {signals.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2 text-slate-700">Signals</h4>
          <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-md p-2 bg-white">
            {signals.map((signal) => (
              <div key={signal} className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id={`signal-${signal}`}
                  checked={selectedSignals.includes(signal)}
                  onChange={() => onSignalToggle?.(signal)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                />
                <label
                  htmlFor={`signal-${signal}`}
                  className="ml-2 block text-sm text-slate-700"
                >
                  {signal}
                </label>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Controls; 