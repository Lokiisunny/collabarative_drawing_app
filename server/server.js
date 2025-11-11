const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const RoomManager = require('./rooms');

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const roomManager = new RoomManager();

app.use(express.static(path.join(__dirname, '../client')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('join-room', (roomId, userName) => {
    const room = roomManager.getOrCreateRoom(roomId);
    const user = room.addUser(socket.id, userName);
    
    socket.join(roomId);
    
    socket.emit('room-state', {
      users: room.getUsers(),
      drawingHistory: room.getDrawingHistory(),
      canvasState: room.getCanvasState()
    });

    socket.to(roomId).emit('user-joined', {
      userId: socket.id,
      userName: user.name,
      color: user.color
    });

    io.to(roomId).emit('users-updated', room.getUsers());
  });

  socket.on('draw-start', (data) => {
    const room = roomManager.getRoom(data.roomId);
    if (!room) return;

    const strokeId = room.startStroke(socket.id, data);
    socket.to(data.roomId).emit('draw-start', {
      ...data,
      userId: socket.id,
      strokeId
    });
  });

  socket.on('draw-move', (data) => {
    const room = roomManager.getRoom(data.roomId);
    if (!room) return;

    room.addPointToStroke(data.strokeId, data.x, data.y);
    socket.to(data.roomId).emit('draw-move', {
      ...data,
      userId: socket.id
    });
  });

  socket.on('draw-end', (data) => {
    const room = roomManager.getRoom(data.roomId);
    if (!room) return;

    const stroke = room.endStroke(data.strokeId);
    if (stroke) {
      socket.to(data.roomId).emit('draw-end', {
        ...data,
        userId: socket.id,
        stroke
      });
    }
  });

  socket.on('cursor-move', (data) => {
    socket.to(data.roomId).emit('cursor-move', {
      userId: socket.id,
      x: data.x,
      y: data.y
    });
  });

  socket.on('undo', (data) => {
    const room = roomManager.getRoom(data.roomId);
    if (!room) return;

    const undone = room.undoOperation(data.operationId);
    if (undone) {
      io.to(data.roomId).emit('undo', {
        operationId: data.operationId,
        userId: socket.id
      });
    }
  });

  socket.on('redo', (data) => {
    const room = roomManager.getRoom(data.roomId);
    if (!room) return;

    const redone = room.redoOperation(data.operationId);
    if (redone) {
      io.to(data.roomId).emit('redo', {
        operationId: data.operationId,
        userId: socket.id
      });
    }
  });

  socket.on('clear-canvas', (data) => {
    const room = roomManager.getRoom(data.roomId);
    if (!room) return;

    const operationId = room.clearCanvas(socket.id);
    io.to(data.roomId).emit('clear-canvas', {
      operationId,
      userId: socket.id
    });
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    const room = roomManager.removeUser(socket.id);
    if (room) {
      io.to(room.id).emit('user-left', {
        userId: socket.id
      });
      io.to(room.id).emit('users-updated', room.getUsers());
    }
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

