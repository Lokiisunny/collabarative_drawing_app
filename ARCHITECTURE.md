# Architecture Documentation

## Data Flow Diagram

```
User Input (Mouse/Touch)
    ↓
Canvas Manager (canvas.js)
    ↓
WebSocket Manager (websocket.js)
    ↓
Socket.io Client
    ↓
    ↓ (Network)
    ↓
Socket.io Server (server.js)
    ↓
Room Manager (rooms.js)
    ↓
Drawing State (drawing-state.js)
    ↓
Broadcast to Other Clients
    ↓
WebSocket Manager (other clients)
    ↓
Canvas Manager (other clients)
    ↓
Canvas Rendering
```

### Detailed Flow

1. **User Draws**:
   - Mouse/touch events captured by `canvas.js`
   - Local stroke created and rendered immediately
   - Draw events sent via `websocket.js` to server

2. **Server Processing**:
   - `server.js` receives draw events
   - Routes to appropriate room via `rooms.js`
   - `drawing-state.js` manages stroke history
   - Event broadcasted to all other users in room

3. **Remote Rendering**:
   - Other clients receive draw events
   - `canvas.js` renders remote strokes
   - Cursor positions updated in real-time

## WebSocket Protocol

### Client → Server Messages

#### `join-room`
```javascript
{
  roomId: string,
  userName: string
}
```

#### `draw-start`
```javascript
{
  roomId: string,
  x: number,
  y: number,
  color: string,
  lineWidth: number,
  tool: string
}
```

#### `draw-move`
```javascript
{
  roomId: string,
  strokeId: string,
  x: number,
  y: number
}
```

#### `draw-end`
```javascript
{
  roomId: string,
  strokeId: string
}
```

#### `cursor-move`
```javascript
{
  roomId: string,
  x: number,
  y: number
}
```

#### `undo`
```javascript
{
  roomId: string,
  operationId: string
}
```

#### `redo`
```javascript
{
  roomId: string,
  operationId: string
}
```

#### `clear-canvas`
```javascript
{
  roomId: string
}
```

### Server → Client Messages

#### `room-state`
```javascript
{
  users: Array<User>,
  drawingHistory: Array<Stroke>,
  canvasState: CanvasState
}
```

#### `user-joined`
```javascript
{
  userId: string,
  userName: string,
  color: string
}
```

#### `user-left`
```javascript
{
  userId: string
}
```

#### `users-updated`
```javascript
Array<User>
```

#### `draw-start`
```javascript
{
  userId: string,
  strokeId: string,
  x: number,
  y: number,
  color: string,
  lineWidth: number,
  tool: string
}
```

#### `draw-move`
```javascript
{
  userId: string,
  strokeId: string,
  x: number,
  y: number
}
```

#### `draw-end`
```javascript
{
  userId: string,
  strokeId: string,
  stroke: Stroke
}
```

#### `cursor-move`
```javascript
{
  userId: string,
  x: number,
  y: number
}
```

#### `undo`
```javascript
{
  operationId: string,
  userId: string
}
```

#### `redo`
```javascript
{
  operationId: string,
  userId: string
}
```

#### `clear-canvas`
```javascript
{
  operationId: string,
  userId: string
}
```

## Undo/Redo Strategy



### Undo Process

1. **Local Undo**:
   - User clicks undo
   - Last operation removed from local history
   - Stroke removed from canvas
   - Operation ID sent to server

2. **Server Undo**:
   - Server receives undo request
   - Validates operation exists
   - Removes from server's operation history
   - Broadcasts undo to all clients

3. **Remote Undo**:
   - Other clients receive undo event
   - Remove corresponding stroke from canvas
   - Update local state

### Redo Process

1. **Redo Stack**:
   - Undone operations stored in redo stack
   - Redo restores from redo stack
   - Pushed back to operation history

2. **Synchronization**:
   - Redo operations also synced globally
   - All clients maintain consistent state

### Current Limitations

- In-memory state (not persistent)
- Single server instance
- No load balancing
- Room state grows unbounded


### Current State

- No authentication
- No input validation
- No rate limiting
- Room IDs are predictable



