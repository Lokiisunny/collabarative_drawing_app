const { v4: uuidv4 } = require('uuid');

class DrawingState {
  constructor() {
    this.strokes = new Map();
    this.operationHistory = [];
    this.redoStack = [];
    this.canvasState = null;
  }

  startStroke(userId, data) {
    const strokeId = uuidv4();
    const stroke = {
      id: strokeId,
      userId: userId,
      tool: data.tool || 'brush',
      color: data.color || '#000000',
      lineWidth: data.lineWidth || 5,
      points: [{ x: data.x, y: data.y }],
      timestamp: Date.now()
    };
    
    this.strokes.set(strokeId, stroke);
    return strokeId;
  }

  addPointToStroke(strokeId, x, y) {
    const stroke = this.strokes.get(strokeId);
    if (stroke) {
      stroke.points.push({ x, y });
    }
  }

  endStroke(strokeId) {
    const stroke = this.strokes.get(strokeId);
    if (!stroke) return null;

    const operation = {
      id: uuidv4(),
      type: 'draw',
      strokeId: strokeId,
      stroke: { ...stroke },
      userId: stroke.userId,
      timestamp: Date.now()
    };

    this.operationHistory.push(operation);
    this.redoStack = [];
    
    return stroke;
  }

  undoOperation(operationId) {
    const operationIndex = this.operationHistory.findIndex(op => op.id === operationId);
    if (operationIndex === -1) return false;

    const operation = this.operationHistory[operationIndex];
    
    if (operation.type === 'draw') {
      this.strokes.delete(operation.strokeId);
    } else if (operation.type === 'clear') {
      this.restoreCanvasState(operation.previousState);
    }

    this.operationHistory.splice(operationIndex, 1);
    this.redoStack.push(operation);
    
    return true;
  }

  redoOperation(operationId) {
    const operationIndex = this.redoStack.findIndex(op => op.id === operationId);
    if (operationIndex === -1) return false;

    const operation = this.redoStack[operationIndex];
    
    if (operation.type === 'draw') {
      this.strokes.set(operation.strokeId, operation.stroke);
    } else if (operation.type === 'clear') {
      this.saveCanvasState();
    }

    this.redoStack.splice(operationIndex, 1);
    this.operationHistory.push(operation);
    
    return true;
  }

  clearCanvas(userId) {
    this.saveCanvasState();
    
    const operation = {
      id: uuidv4(),
      type: 'clear',
      userId: userId,
      previousState: this.canvasState,
      timestamp: Date.now()
    };

    this.strokes.clear();
    this.operationHistory.push(operation);
    this.redoStack = [];
    
    return operation.id;
  }

  saveCanvasState() {
    this.canvasState = {
      strokes: Array.from(this.strokes.values())
    };
  }

  restoreCanvasState(state) {
    if (!state) return;
    
    this.strokes.clear();
    if (state.strokes) {
      state.strokes.forEach(stroke => {
        this.strokes.set(stroke.id, stroke);
      });
    }
  }

  getDrawingHistory() {
    return Array.from(this.strokes.values());
  }

  getCanvasState() {
    return {
      strokes: Array.from(this.strokes.values()),
      operationHistory: this.operationHistory,
      redoStack: this.redoStack
    };
  }
}

module.exports = DrawingState;

