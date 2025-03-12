const http = require('http');
const { Server } = require('socket.io');

// Create HTTP server
const server = http.createServer();

// Create Socket.IO server with CORS enabled
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Store active sessions
const sessions = {};

// Handle socket connections
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Join a session
  socket.on('join-session', (sessionId) => {
    console.log(`Client ${socket.id} joining session ${sessionId}`);
    
    // Create session if it doesn't exist
    if (!sessions[sessionId]) {
      sessions[sessionId] = {
        users: [],
        annotations: []
      };
    }
    
    // Add user to session
    sessions[sessionId].users.push(socket.id);
    
    // Join the room
    socket.join(sessionId);
    
    // Send current session data to the client
    socket.emit('session-data', sessions[sessionId]);
    
    // Notify other users in the session
    socket.to(sessionId).emit('user-joined', socket.id);
  });
  
  // Add annotation
  socket.on('add-annotation', (sessionId, annotation) => {
    console.log(`Client ${socket.id} adding annotation to session ${sessionId}`);
    
    if (sessions[sessionId]) {
      // Add annotation to session
      const newAnnotation = {
        id: Date.now().toString(),
        userId: socket.id,
        ...annotation,
        timestamp: new Date().toISOString()
      };
      
      sessions[sessionId].annotations.push(newAnnotation);
      
      // Broadcast to all clients in the session
      io.to(sessionId).emit('annotation-added', newAnnotation);
    }
  });
  
  // Update annotation
  socket.on('update-annotation', (sessionId, annotationId, updates) => {
    console.log(`Client ${socket.id} updating annotation ${annotationId} in session ${sessionId}`);
    
    if (sessions[sessionId]) {
      const annotationIndex = sessions[sessionId].annotations.findIndex(a => a.id === annotationId);
      
      if (annotationIndex !== -1) {
        // Update annotation
        sessions[sessionId].annotations[annotationIndex] = {
          ...sessions[sessionId].annotations[annotationIndex],
          ...updates,
          updatedAt: new Date().toISOString()
        };
        
        // Broadcast to all clients in the session
        io.to(sessionId).emit('annotation-updated', sessions[sessionId].annotations[annotationIndex]);
      }
    }
  });
  
  // Delete annotation
  socket.on('delete-annotation', (sessionId, annotationId) => {
    console.log(`Client ${socket.id} deleting annotation ${annotationId} in session ${sessionId}`);
    
    if (sessions[sessionId]) {
      const annotationIndex = sessions[sessionId].annotations.findIndex(a => a.id === annotationId);
      
      if (annotationIndex !== -1) {
        // Remove annotation
        const deletedAnnotation = sessions[sessionId].annotations.splice(annotationIndex, 1)[0];
        
        // Broadcast to all clients in the session
        io.to(sessionId).emit('annotation-deleted', deletedAnnotation.id);
      }
    }
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    // Remove user from all sessions
    Object.keys(sessions).forEach(sessionId => {
      const userIndex = sessions[sessionId].users.indexOf(socket.id);
      
      if (userIndex !== -1) {
        // Remove user from session
        sessions[sessionId].users.splice(userIndex, 1);
        
        // Notify other users in the session
        socket.to(sessionId).emit('user-left', socket.id);
        
        // Clean up empty sessions
        if (sessions[sessionId].users.length === 0) {
          delete sessions[sessionId];
          console.log(`Session ${sessionId} removed (no users)`);
        }
      }
    });
  });
});

// Start the server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Collaboration server running on port ${PORT}`);
}); 