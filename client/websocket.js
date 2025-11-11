class SocketManager {
  constructor() {
    this.socket = null;
    this.roomId = 'main';
    this.userName = '';
    this.isConnected = false;
    this.cursors = new Map();
    this.onRoomStateCallback = null;
    this.onUsersUpdatedCallback = null;
    this.onDrawStartCallback = null;
    this.onDrawMoveCallback = null;
    this.onDrawEndCallback = null;
    this.onUndoCallback = null;
    this.onRedoCallback = null;
    this.onClearCallback = null;
    this.onCursorMoveCallback = null;
  }

  connect() {
    this.socket = io();
    
    this.socket.on('connect', () => {
      this.isConnected = true;
      this.updateStatus('Connected');
    });
    
    this.socket.on('disconnect', () => {
      this.isConnected = false;
      this.updateStatus('Disconnected');
    });
    
    this.socket.on('room-state', (data) => {
      if (this.onRoomStateCallback) {
        this.onRoomStateCallback(data);
      }
    });
    
    this.socket.on('user-joined', (data) => {
      this.updateStatus(`User ${data.userName} joined`);
    });
    
    this.socket.on('user-left', (data) => {
      this.cursors.delete(data.userId);
      if (this.onCursorMoveCallback) {
        this.onCursorMoveCallback();
      }
    });
    
    this.socket.on('users-updated', (users) => {
      if (this.onUsersUpdatedCallback) {
        this.onUsersUpdatedCallback(users);
      }
    });
    
    this.socket.on('draw-start', (data) => {
      if (this.onDrawStartCallback) {
        this.onDrawStartCallback(data);
      }
    });
    
    this.socket.on('draw-move', (data) => {
      if (this.onDrawMoveCallback) {
        this.onDrawMoveCallback(data);
      }
    });
    
    this.socket.on('draw-end', (data) => {
      if (this.onDrawEndCallback) {
        this.onDrawEndCallback(data);
      }
    });
    
    this.socket.on('cursor-move', (data) => {
      this.cursors.set(data.userId, {
        x: data.x,
        y: data.y
      });
      if (this.onCursorMoveCallback) {
        this.onCursorMoveCallback();
      }
    });
    
    this.socket.on('undo', (data) => {
      if (this.onUndoCallback) {
        this.onUndoCallback(data.operationId);
      }
    });
    
    this.socket.on('redo', (data) => {
      if (this.onRedoCallback) {
        this.onRedoCallback(data.operationId);
      }
    });
    
    this.socket.on('clear-canvas', (data) => {
      if (this.onClearCallback) {
        this.onClearCallback();
      }
    });
  }

  joinRoom(roomId, userName) {
    if (!this.socket) return;
    
    this.roomId = roomId || 'main';
    this.userName = userName || 'Anonymous';
    this.socket.emit('join-room', this.roomId, this.userName);
  }

  sendDrawStart(data) {
    if (!this.socket || !this.isConnected) return;
    this.socket.emit('draw-start', {
      roomId: this.roomId,
      ...data
    });
  }

  sendDrawMove(data) {
    if (!this.socket || !this.isConnected) return;
    this.socket.emit('draw-move', {
      roomId: this.roomId,
      ...data
    });
  }

  sendDrawEnd(data) {
    if (!this.socket || !this.isConnected) return;
    this.socket.emit('draw-end', {
      roomId: this.roomId,
      ...data
    });
  }

  sendCursorMove(x, y) {
    if (!this.socket || !this.isConnected) return;
    this.socket.emit('cursor-move', {
      roomId: this.roomId,
      x: x,
      y: y
    });
  }

  sendUndo(operationId) {
    if (!this.socket || !this.isConnected) return;
    this.socket.emit('undo', {
      roomId: this.roomId,
      operationId: operationId
    });
  }

  sendRedo(operationId) {
    if (!this.socket || !this.isConnected) return;
    this.socket.emit('redo', {
      roomId: this.roomId,
      operationId: operationId
    });
  }

  sendClear() {
    if (!this.socket || !this.isConnected) return;
    this.socket.emit('clear-canvas', {
      roomId: this.roomId
    });
  }

  getCursors() {
    return this.cursors;
  }

  isConnected() {
    return this.isConnected;
  }

  updateStatus(message) {
    const statusText = document.getElementById('statusText');
    if (statusText) {
      statusText.textContent = message;
    }
  }
}

