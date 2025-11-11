const DrawingState = require('./drawing-state');
const { v4: uuidv4 } = require('uuid');

const USER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
  '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
  '#F8B739', '#E74C3C', '#3498DB', '#2ECC71'
];

class User {
  constructor(id, name, color) {
    this.id = id;
    this.name = name;
    this.color = color;
    this.joinedAt = Date.now();
  }
}

class Room {
  constructor(id) {
    this.id = id;
    this.users = new Map();
    this.drawingState = new DrawingState();
    this.createdAt = Date.now();
  }

  addUser(socketId, userName) {
    const colorIndex = this.users.size % USER_COLORS.length;
    const color = USER_COLORS[colorIndex];
    const user = new User(socketId, userName || `User ${this.users.size + 1}`, color);
    this.users.set(socketId, user);
    return user;
  }

  removeUser(socketId) {
    return this.users.delete(socketId);
  }

  getUser(socketId) {
    return this.users.get(socketId);
  }

  getUsers() {
    return Array.from(this.users.values());
  }

  startStroke(userId, data) {
    return this.drawingState.startStroke(userId, data);
  }

  addPointToStroke(strokeId, x, y) {
    this.drawingState.addPointToStroke(strokeId, x, y);
  }

  endStroke(strokeId) {
    return this.drawingState.endStroke(strokeId);
  }

  undoOperation(operationId) {
    return this.drawingState.undoOperation(operationId);
  }

  redoOperation(operationId) {
    return this.drawingState.redoOperation(operationId);
  }

  clearCanvas(userId) {
    return this.drawingState.clearCanvas(userId);
  }

  getDrawingHistory() {
    return this.drawingState.getDrawingHistory();
  }

  getCanvasState() {
    return this.drawingState.getCanvasState();
  }
}

class RoomManager {
  constructor() {
    this.rooms = new Map();
  }

  getOrCreateRoom(roomId) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Room(roomId));
    }
    return this.rooms.get(roomId);
  }

  getRoom(roomId) {
    return this.rooms.get(roomId);
  }

  removeUser(socketId) {
    for (const [roomId, room] of this.rooms.entries()) {
      if (room.users.has(socketId)) {
        room.removeUser(socketId);
        if (room.users.size === 0) {
          this.rooms.delete(roomId);
        }
        return room;
      }
    }
    return null;
  }
}

module.exports = RoomManager;

