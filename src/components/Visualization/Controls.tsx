import React from 'react';

interface ControlsProps {
  signals?: string[];
  selectedSignals?: string[];
  onSignalToggle?: (signal: string) => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onReset?: () => void;
  // Cursor controls
  isPrimaryCursorVisible?: boolean;
  isDiffCursorVisible?: boolean;
  onTogglePrimaryCursor?: () => void;
  onToggleDiffCursor?: () => void;
  onResetCursors?: () => void;
}

const Controls: React.FC<ControlsProps> = ({
  signals = [],
  selectedSignals = [],
  onSignalToggle,
  onZoomIn,
  onZoomOut,
  onReset,
  // Cursor controls
  isPrimaryCursorVisible = false,
  isDiffCursorVisible = false,
  onTogglePrimaryCursor,
  onToggleDiffCursor,
  onResetCursors
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
      
      {/* Cursor Controls */}
      <div className="mb-4">
        <h4 className="text-sm font-medium mb-2 text-slate-700">Cursor Controls</h4>
        <div className="flex flex-col space-y-2">
          <div className="flex items-center">
            <button
              onClick={() => {
                console.log('Primary cursor toggle button clicked');
                onTogglePrimaryCursor?.();
              }}
              className={`w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                isPrimaryCursorVisible 
                  ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500' 
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300 focus:ring-slate-500'
              }`}
              title={isPrimaryCursorVisible ? "Hide Primary Cursor" : "Show Primary Cursor"}
            >
              <div className="flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span className="text-sm font-medium">Primary Cursor {isPrimaryCursorVisible ? '(ON)' : '(OFF)'}</span>
              </div>
            </button>
          </div>
          
          <div className="flex items-center">
            <button
              onClick={() => {
                console.log('Diff cursor toggle button clicked');
                onToggleDiffCursor?.();
              }}
              className={`w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                isDiffCursorVisible 
                  ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500' 
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300 focus:ring-slate-500'
              }`}
              title={isDiffCursorVisible ? "Hide Diff Cursor" : "Show Diff Cursor"}
            >
              <div className="flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="text-sm font-medium">Diff Cursor {isDiffCursorVisible ? '(ON)' : '(OFF)'}</span>
              </div>
            </button>
          </div>
          
          <div className="flex items-center">
            <button
              onClick={() => {
                console.log('Reset cursors button clicked');
                onResetCursors?.();
              }}
              className="w-full px-3 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
              title="Reset Cursors"
            >
              <div className="flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="text-sm font-medium">Reset Cursors</span>
              </div>
            </button>
          </div>
          
          <div className="mt-2 p-2 bg-blue-50 border border-blue-100 rounded-md">
            <p className="text-xs text-blue-800 font-medium mb-1">How to use cursors:</p>
            <ul className="text-xs text-blue-700 list-disc pl-4">
              <li>Click on plot to position primary cursor</li>
              <li>Hold Shift + Click for diff cursor</li>
              <li>Toggle visibility with buttons above</li>
            </ul>
            <p className="text-xs text-blue-600 mt-1">Current state: Primary {isPrimaryCursorVisible ? 'ON' : 'OFF'}, Diff {isDiffCursorVisible ? 'ON' : 'OFF'}</p>
          </div>
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