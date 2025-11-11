class CanvasManager {
  constructor(canvasElement, socketManager) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.socketManager = socketManager;
    this.isDrawing = false;
    this.currentStroke = null;
    this.currentTool = 'brush';
    this.currentColor = '#000000';
    this.currentLineWidth = 5;
    this.localStrokes = new Map();
    this.remoteStrokes = new Map();
    this.operationHistory = [];
    this.redoStack = [];
    this.lastOperationId = null;
    this.setupCanvas();
    this.setupEventListeners();
  }

  setupCanvas() {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    window.addEventListener('resize', () => {
      const rect = this.canvas.getBoundingClientRect();
      this.canvas.width = rect.width;
      this.canvas.height = rect.height;
      this.redrawCanvas();
    });
  }

  setupEventListeners() {
    this.canvas.addEventListener('mousedown', (e) => this.handleStart(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMove(e));
    this.canvas.addEventListener('mouseup', () => this.handleEnd());
    this.canvas.addEventListener('mouseleave', () => this.handleEnd());
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      this.handleStart(mouseEvent);
    });
    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      this.handleMove(mouseEvent);
    });
    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.handleEnd();
    });
  }

  getCoordinates(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  handleStart(e) {
    if (!this.socketManager.isConnected()) return;
    
    const coords = this.getCoordinates(e);
    this.isDrawing = true;
    
    const strokeId = this.generateId();
    this.currentStroke = {
      id: strokeId,
      tool: this.currentTool,
      color: this.currentTool === 'eraser' ? '#FFFFFF' : this.currentColor,
      lineWidth: this.currentLineWidth,
      points: [coords]
    };
    
    this.localStrokes.set(strokeId, { ...this.currentStroke });
    
    this.socketManager.sendDrawStart({
      x: coords.x,
      y: coords.y,
      color: this.currentColor,
      lineWidth: this.currentLineWidth,
      tool: this.currentTool
    });
    
    this.drawPoint(coords.x, coords.y, this.currentStroke);
  }

  handleMove(e) {
    if (!this.isDrawing) {
      const coords = this.getCoordinates(e);
      this.socketManager.sendCursorMove(coords.x, coords.y);
      return;
    }
    
    const coords = this.getCoordinates(e);
    this.currentStroke.points.push(coords);
    
    const stroke = this.localStrokes.get(this.currentStroke.id);
    if (stroke) {
      stroke.points.push(coords);
      this.drawLine(
        stroke.points[stroke.points.length - 2],
        stroke.points[stroke.points.length - 1],
        stroke
      );
    }
    
    this.socketManager.sendDrawMove({
      strokeId: this.currentStroke.id,
      x: coords.x,
      y: coords.y
    });
  }

  handleEnd() {
    if (!this.isDrawing) return;
    
    this.isDrawing = false;
    
    if (this.currentStroke && this.currentStroke.points.length > 0) {
      const operation = {
        id: this.generateId(),
        type: 'draw',
        strokeId: this.currentStroke.id,
        timestamp: Date.now()
      };
      
      this.operationHistory.push(operation);
      this.lastOperationId = operation.id;
      this.redoStack = [];
    }
    
    this.socketManager.sendDrawEnd({
      strokeId: this.currentStroke.id
    });
    
    this.currentStroke = null;
  }

  drawPoint(x, y, stroke) {
    this.ctx.beginPath();
    this.ctx.arc(x, y, stroke.lineWidth / 2, 0, Math.PI * 2);
    this.ctx.fillStyle = stroke.color;
    this.ctx.fill();
  }

  drawLine(from, to, stroke) {
    this.ctx.beginPath();
    this.ctx.moveTo(from.x, from.y);
    this.ctx.lineTo(to.x, to.y);
    this.ctx.strokeStyle = stroke.color;
    this.ctx.lineWidth = stroke.lineWidth;
    
    if (stroke.tool === 'eraser') {
      this.ctx.globalCompositeOperation = 'destination-out';
    } else {
      this.ctx.globalCompositeOperation = 'source-over';
    }
    
    this.ctx.stroke();
  }

  handleRemoteDrawStart(data) {
    const stroke = {
      id: data.strokeId,
      userId: data.userId,
      tool: data.tool || 'brush',
      color: data.tool === 'eraser' ? '#FFFFFF' : data.color,
      lineWidth: data.lineWidth || 5,
      points: [{ x: data.x, y: data.y }]
    };
    
    this.remoteStrokes.set(data.strokeId, stroke);
    this.drawPoint(data.x, data.y, stroke);
  }

  handleRemoteDrawMove(data) {
    const stroke = this.remoteStrokes.get(data.strokeId);
    if (!stroke) return;
    
    const lastPoint = stroke.points[stroke.points.length - 1];
    const newPoint = { x: data.x, y: data.y };
    stroke.points.push(newPoint);
    
    this.drawLine(lastPoint, newPoint, stroke);
  }

  handleRemoteDrawEnd(data) {
    if (data.stroke) {
      const stroke = this.remoteStrokes.get(data.strokeId);
      if (stroke) {
        this.localStrokes.set(data.strokeId, stroke);
      }
    }
  }

  handleUndo(operationId) {
    const operation = this.operationHistory.find(op => op.id === operationId);
    if (!operation) {
      const stroke = Array.from(this.localStrokes.values()).find(s => s.id === operationId);
      if (stroke) {
        this.localStrokes.delete(stroke.id);
        this.redrawCanvas();
      }
      return;
    }
    
    if (operation.type === 'draw') {
      this.localStrokes.delete(operation.strokeId);
      this.redrawCanvas();
    } else if (operation.type === 'clear') {
      this.redrawCanvas();
    }
  }

  handleRedo(operationId) {
    const operation = this.redoStack.find(op => op.id === operationId);
    if (operation && operation.type === 'draw') {
      const stroke = this.localStrokes.get(operation.strokeId);
      if (stroke) {
        this.redrawCanvas();
      }
    }
  }

  handleClear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.localStrokes.clear();
    this.remoteStrokes.clear();
    this.operationHistory = [];
    this.redoStack = [];
  }

  redrawCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    Array.from(this.localStrokes.values()).forEach(stroke => {
      this.drawStroke(stroke);
    });
    
    Array.from(this.remoteStrokes.values()).forEach(stroke => {
      this.drawStroke(stroke);
    });
  }

  drawStroke(stroke) {
    if (!stroke || stroke.points.length === 0) return;
    
    this.ctx.beginPath();
    this.ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    
    for (let i = 1; i < stroke.points.length; i++) {
      this.ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
    }
    
    this.ctx.strokeStyle = stroke.color;
    this.ctx.lineWidth = stroke.lineWidth;
    
    if (stroke.tool === 'eraser') {
      this.ctx.globalCompositeOperation = 'destination-out';
    } else {
      this.ctx.globalCompositeOperation = 'source-over';
    }
    
    this.ctx.stroke();
  }

  loadCanvasState(state) {
    if (!state || !state.strokes) return;
    
    this.handleClear();
    
    state.strokes.forEach(stroke => {
      this.localStrokes.set(stroke.id, stroke);
    });
    
    this.redrawCanvas();
  }

  setTool(tool) {
    this.currentTool = tool;
  }

  setColor(color) {
    this.currentColor = color;
  }

  setLineWidth(width) {
    this.currentLineWidth = width;
  }

  undo() {
    if (this.operationHistory.length === 0) return;
    
    const operation = this.operationHistory.pop();
    this.redoStack.push(operation);
    
    if (operation.type === 'draw') {
      this.localStrokes.delete(operation.strokeId);
      this.redrawCanvas();
    }
    
    if (operation.id) {
      this.socketManager.sendUndo(operation.id);
    }
  }

  redo() {
    if (this.redoStack.length === 0) return;
    
    const operation = this.redoStack.pop();
    this.operationHistory.push(operation);
    
    if (operation.type === 'draw') {
      const stroke = Array.from(this.localStrokes.values()).find(s => s.id === operation.strokeId);
      if (stroke) {
        this.redrawCanvas();
      }
    }
    
    if (operation.id) {
      this.socketManager.sendRedo(operation.id);
    }
  }

  clear() {
    this.handleClear();
    this.socketManager.sendClear();
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

