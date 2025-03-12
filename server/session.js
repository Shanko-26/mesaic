/**
 * Session management for the collaboration server
 */

// In-memory session store
const sessions = {};

/**
 * Create a new session or return an existing one
 * @param {string} sessionId - The session ID
 * @returns {Object} The session object
 */
function getOrCreateSession(sessionId) {
  if (!sessions[sessionId]) {
    sessions[sessionId] = {
      id: sessionId,
      users: [],
      annotations: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }
  
  return sessions[sessionId];
}

/**
 * Add a user to a session
 * @param {string} sessionId - The session ID
 * @param {string} userId - The user ID
 * @returns {Object} The updated session object
 */
function addUserToSession(sessionId, userId) {
  const session = getOrCreateSession(sessionId);
  
  if (!session.users.includes(userId)) {
    session.users.push(userId);
    session.updatedAt = new Date().toISOString();
  }
  
  return session;
}

/**
 * Remove a user from a session
 * @param {string} sessionId - The session ID
 * @param {string} userId - The user ID
 * @returns {Object|null} The updated session object or null if the session was removed
 */
function removeUserFromSession(sessionId, userId) {
  if (!sessions[sessionId]) {
    return null;
  }
  
  const userIndex = sessions[sessionId].users.indexOf(userId);
  
  if (userIndex !== -1) {
    sessions[sessionId].users.splice(userIndex, 1);
    sessions[sessionId].updatedAt = new Date().toISOString();
    
    // Clean up empty sessions
    if (sessions[sessionId].users.length === 0) {
      const removedSession = { ...sessions[sessionId] };
      delete sessions[sessionId];
      return null;
    }
  }
  
  return sessions[sessionId];
}

/**
 * Add an annotation to a session
 * @param {string} sessionId - The session ID
 * @param {Object} annotation - The annotation object
 * @returns {Object} The created annotation
 */
function addAnnotation(sessionId, annotation) {
  const session = getOrCreateSession(sessionId);
  
  const newAnnotation = {
    id: Date.now().toString(),
    ...annotation,
    timestamp: new Date().toISOString()
  };
  
  session.annotations.push(newAnnotation);
  session.updatedAt = new Date().toISOString();
  
  return newAnnotation;
}

/**
 * Update an annotation in a session
 * @param {string} sessionId - The session ID
 * @param {string} annotationId - The annotation ID
 * @param {Object} updates - The updates to apply
 * @returns {Object|null} The updated annotation or null if not found
 */
function updateAnnotation(sessionId, annotationId, updates) {
  if (!sessions[sessionId]) {
    return null;
  }
  
  const annotationIndex = sessions[sessionId].annotations.findIndex(a => a.id === annotationId);
  
  if (annotationIndex === -1) {
    return null;
  }
  
  sessions[sessionId].annotations[annotationIndex] = {
    ...sessions[sessionId].annotations[annotationIndex],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  sessions[sessionId].updatedAt = new Date().toISOString();
  
  return sessions[sessionId].annotations[annotationIndex];
}

/**
 * Delete an annotation from a session
 * @param {string} sessionId - The session ID
 * @param {string} annotationId - The annotation ID
 * @returns {Object|null} The deleted annotation or null if not found
 */
function deleteAnnotation(sessionId, annotationId) {
  if (!sessions[sessionId]) {
    return null;
  }
  
  const annotationIndex = sessions[sessionId].annotations.findIndex(a => a.id === annotationId);
  
  if (annotationIndex === -1) {
    return null;
  }
  
  const deletedAnnotation = sessions[sessionId].annotations.splice(annotationIndex, 1)[0];
  sessions[sessionId].updatedAt = new Date().toISOString();
  
  return deletedAnnotation;
}

/**
 * Get all sessions
 * @returns {Object} All sessions
 */
function getAllSessions() {
  return { ...sessions };
}

module.exports = {
  getOrCreateSession,
  addUserToSession,
  removeUserFromSession,
  addAnnotation,
  updateAnnotation,
  deleteAnnotation,
  getAllSessions
}; 