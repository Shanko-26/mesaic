import React, { useState } from 'react';

interface SessionProps {
  sessionId?: string;
  onJoinSession: (sessionId: string) => void;
  onCreateSession: () => void;
  isConnected: boolean;
  activeUsers?: string[];
}

const Session: React.FC<SessionProps> = ({
  sessionId,
  onJoinSession,
  onCreateSession,
  isConnected,
  activeUsers = []
}) => {
  const [newSessionId, setNewSessionId] = useState('');

  const handleJoinSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSessionId.trim()) {
      onJoinSession(newSessionId);
    }
  };

  return (
    <div className="bg-white p-4 rounded-md border border-slate-200">
      {!sessionId ? (
        <div>
          <form onSubmit={handleJoinSession} className="mb-4">
            <div className="mb-4">
              <label htmlFor="sessionId" className="block text-sm font-medium mb-2 text-slate-700">
                Session ID
              </label>
              <input
                type="text"
                id="sessionId"
                value={newSessionId}
                onChange={(e) => setNewSessionId(e.target.value)}
                placeholder="Enter session ID to join"
                className="w-full p-2 border border-slate-300 rounded-md bg-white text-slate-800"
              />
            </div>
            <div className="flex space-x-2">
              <button
                type="submit"
                disabled={!newSessionId.trim()}
                className={`px-4 py-2 rounded-md text-white ${
                  !newSessionId.trim()
                    ? 'bg-slate-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-500'
                }`}
              >
                Join Session
              </button>
              <button
                type="button"
                onClick={onCreateSession}
                className="px-4 py-2 rounded-md text-white bg-green-600 hover:bg-green-500"
              >
                Create New Session
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div>
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2 text-slate-700">Current Session</h4>
            <div className="p-3 bg-blue-50 rounded-md border border-blue-100">
              <p className="text-slate-800 font-mono">{sessionId}</p>
            </div>
          </div>
          
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2 text-slate-700">Status</h4>
            <div className="flex items-center">
              <div className={`h-3 w-3 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-slate-700">{isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
          </div>
          
          {activeUsers.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2 text-slate-700">Active Users</h4>
              <ul className="list-disc list-inside">
                {activeUsers.map((user, index) => (
                  <li key={index} className="text-sm text-slate-700">{user}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Session; 