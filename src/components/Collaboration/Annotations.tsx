import React, { useState } from 'react';

interface Annotation {
  id: string;
  text: string;
  timestamp: string;
  userId: string;
}

interface AnnotationsProps {
  annotations?: Annotation[];
  onAddAnnotation: (text: string) => void;
  onDeleteAnnotation: (id: string) => void;
  isConnected: boolean;
}

const Annotations: React.FC<AnnotationsProps> = ({
  annotations = [],
  onAddAnnotation,
  onDeleteAnnotation,
  isConnected
}) => {
  const [newAnnotation, setNewAnnotation] = useState('');

  const handleAddAnnotation = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAnnotation.trim() && isConnected) {
      onAddAnnotation(newAnnotation);
      setNewAnnotation('');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-md mt-4">
      <h3 className="text-lg font-semibold mb-4">Annotations</h3>
      
      <form onSubmit={handleAddAnnotation} className="mb-4">
        <div className="mb-2">
          <label htmlFor="annotation" className="block text-sm font-medium mb-2">
            Add Annotation
          </label>
          <textarea
            id="annotation"
            value={newAnnotation}
            onChange={(e) => setNewAnnotation(e.target.value)}
            placeholder="Add a note or comment..."
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            rows={3}
            disabled={!isConnected}
          />
        </div>
        <button
          type="submit"
          disabled={!newAnnotation.trim() || !isConnected}
          className={`px-4 py-2 rounded-md text-white ${
            !newAnnotation.trim() || !isConnected
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-primary-600 hover:bg-primary-500'
          }`}
        >
          Add
        </button>
      </form>
      
      {annotations.length > 0 ? (
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {annotations.map((annotation) => (
            <div key={annotation.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-800 dark:text-gray-200">{annotation.text}</p>
                  <div className="flex items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>User: {annotation.userId}</span>
                    <span className="mx-2">•</span>
                    <span>{new Date(annotation.timestamp).toLocaleString()}</span>
                  </div>
                </div>
                <button
                  onClick={() => onDeleteAnnotation(annotation.id)}
                  className="text-red-500 hover:text-red-700"
                  title="Delete annotation"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 dark:text-gray-400 text-center py-4">
          No annotations yet
        </p>
      )}
    </div>
  );
};

export default Annotations; 