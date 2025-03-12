/**
 * Socket service for real-time collaboration
 */
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3001';

let socket: Socket | null = null;
let sessionId: string | null = null;

/**
 * Initialize the socket connection
 * @returns {Socket} The socket instance
 */
export function initSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL);
    
    socket.on('connect', () => {
      console.log('Socket connected');
    });
    
    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });
    
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }
  
  return socket;
}

/**
 * Join a collaboration session
 * @param {string} id - The session ID
 * @param {Function} onSessionData - Callback for session data
 * @param {Function} onUserJoined - Callback for user joined event
 * @param {Function} onUserLeft - Callback for user left event
 * @param {Function} onAnnotationAdded - Callback for annotation added event
 * @param {Function} onAnnotationUpdated - Callback for annotation updated event
 * @param {Function} onAnnotationDeleted - Callback for annotation deleted event
 */
export function joinSession(
  id: string,
  onSessionData: (data: any) => void,
  onUserJoined: (userId: string) => void,
  onUserLeft: (userId: string) => void,
  onAnnotationAdded: (annotation: any) => void,
  onAnnotationUpdated: (annotation: any) => void,
  onAnnotationDeleted: (annotationId: string) => void
): void {
  if (!socket) {
    socket = initSocket();
  }
  
  sessionId = id;
  
  // Register event handlers
  socket.on('session-data', onSessionData);
  socket.on('user-joined', onUserJoined);
  socket.on('user-left', onUserLeft);
  socket.on('annotation-added', onAnnotationAdded);
  socket.on('annotation-updated', onAnnotationUpdated);
  socket.on('annotation-deleted', onAnnotationDeleted);
  
  // Join the session
  socket.emit('join-session', id);
}

/**
 * Leave the current session
 */
export function leaveSession(): void {
  if (socket && sessionId) {
    // Unregister event handlers
    socket.off('session-data');
    socket.off('user-joined');
    socket.off('user-left');
    socket.off('annotation-added');
    socket.off('annotation-updated');
    socket.off('annotation-deleted');
    
    // Leave the session
    socket.emit('leave-session', sessionId);
    sessionId = null;
  }
}

/**
 * Add an annotation to the current session
 * @param {any} annotation - The annotation to add
 */
export function addAnnotation(annotation: any): void {
  if (socket && sessionId) {
    socket.emit('add-annotation', sessionId, annotation);
  }
}

/**
 * Update an annotation in the current session
 * @param {string} annotationId - The ID of the annotation to update
 * @param {any} updates - The updates to apply
 */
export function updateAnnotation(annotationId: string, updates: any): void {
  if (socket && sessionId) {
    socket.emit('update-annotation', sessionId, annotationId, updates);
  }
}

/**
 * Delete an annotation from the current session
 * @param {string} annotationId - The ID of the annotation to delete
 */
export function deleteAnnotation(annotationId: string): void {
  if (socket && sessionId) {
    socket.emit('delete-annotation', sessionId, annotationId);
  }
}

/**
 * Disconnect the socket
 */
export function disconnect(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
    sessionId = null;
  }
} 