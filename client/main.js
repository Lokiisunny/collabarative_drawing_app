let socketManager;
let canvasManager;
let currentUsers = [];
let fps = 0;
let lastFrameTime = performance.now();

function init() {
  socketManager = new SocketManager();
  canvasManager = new CanvasManager(
    document.getElementById('drawingCanvas'),
    socketManager
  );
  
  setupSocketCallbacks();
  setupUI();
  setupFPS();
  socketManager.connect();
}

function setupSocketCallbacks() {
  socketManager.onRoomStateCallback = (data) => {
    if (data.canvasState) {
      canvasManager.loadCanvasState(data.canvasState);
    }
    if (data.users) {
      updateUsersList(data.users);
    }
  };
  
  socketManager.onUsersUpdatedCallback = (users) => {
    currentUsers = users;
    updateUsersList(users);
  };
  
  socketManager.onDrawStartCallback = (data) => {
    canvasManager.handleRemoteDrawStart(data);
  };
  
  socketManager.onDrawMoveCallback = (data) => {
    canvasManager.handleRemoteDrawMove(data);
  };
  
  socketManager.onDrawEndCallback = (data) => {
    canvasManager.handleRemoteDrawEnd(data);
  };
  
  socketManager.onUndoCallback = (operationId) => {
    canvasManager.handleUndo(operationId);
  };
  
  socketManager.onRedoCallback = (operationId) => {
    canvasManager.handleRedo(operationId);
  };
  
  socketManager.onClearCallback = () => {
    canvasManager.handleClear();
  };
  
  socketManager.onCursorMoveCallback = () => {
    updateCursors();
  };
}

function setupUI() {
  document.getElementById('joinBtn').addEventListener('click', () => {
    const userName = document.getElementById('userName').value || 'Anonymous';
    const roomId = document.getElementById('roomId').value || 'main';
    socketManager.joinRoom(roomId, userName);
    socketManager.updateStatus(`Joined room: ${roomId}`);
  });
  
  document.getElementById('brushBtn').addEventListener('click', () => {
    canvasManager.setTool('brush');
    document.getElementById('brushBtn').classList.add('active');
    document.getElementById('eraserBtn').classList.remove('active');
  });
  
  document.getElementById('eraserBtn').addEventListener('click', () => {
    canvasManager.setTool('eraser');
    document.getElementById('eraserBtn').classList.add('active');
    document.getElementById('brushBtn').classList.remove('active');
  });
  
  document.getElementById('colorPicker').addEventListener('change', (e) => {
    canvasManager.setColor(e.target.value);
  });
  
  document.querySelectorAll('.color-preset').forEach(preset => {
    preset.addEventListener('click', () => {
      const color = preset.getAttribute('data-color');
      canvasManager.setColor(color);
      document.getElementById('colorPicker').value = color;
    });
  });
  
  const brushSizeSlider = document.getElementById('brushSize');
  const brushSizeValue = document.getElementById('brushSizeValue');
  
  brushSizeSlider.addEventListener('input', (e) => {
    const size = parseInt(e.target.value);
    brushSizeValue.textContent = size;
    canvasManager.setLineWidth(size);
  });
  
  document.getElementById('undoBtn').addEventListener('click', () => {
    canvasManager.undo();
  });
  
  document.getElementById('redoBtn').addEventListener('click', () => {
    canvasManager.redo();
  });
  
  document.getElementById('clearBtn').addEventListener('click', () => {
    if (confirm('Are you sure you want to clear the canvas?')) {
      canvasManager.clear();
    }
  });
}

function updateUsersList(users) {
  const usersList = document.getElementById('usersList');
  usersList.innerHTML = '';
  
  users.forEach(user => {
    const userItem = document.createElement('div');
    userItem.className = 'user-item';
    userItem.innerHTML = `
      <div class="user-color" style="background: ${user.color}"></div>
      <div class="user-name">${user.name}</div>
    `;
    usersList.appendChild(userItem);
  });
}

function updateCursors() {
  const cursorsContainer = document.getElementById('cursors');
  cursorsContainer.innerHTML = '';
  
  const canvas = document.getElementById('drawingCanvas');
  const rect = canvas.getBoundingClientRect();
  const cursors = socketManager.getCursors();
  
  currentUsers.forEach(user => {
    const cursorData = cursors.get(user.id);
    if (cursorData) {
      const cursor = document.createElement('div');
      cursor.className = 'cursor';
      cursor.style.left = cursorData.x + 'px';
      cursor.style.top = cursorData.y + 'px';
      cursor.style.borderColor = user.color;
      cursor.style.color = user.color;
      cursor.title = user.name;
      cursorsContainer.appendChild(cursor);
    }
  });
}

function setupFPS() {
  function calculateFPS() {
    const now = performance.now();
    const delta = now - lastFrameTime;
    fps = Math.round(1000 / delta);
    lastFrameTime = now;
    
    const fpsCounter = document.getElementById('fpsCounter');
    if (fpsCounter) {
      fpsCounter.textContent = `FPS: ${fps}`;
    }
    
    requestAnimationFrame(calculateFPS);
  }
  
  requestAnimationFrame(calculateFPS);
}

window.addEventListener('DOMContentLoaded', init);

