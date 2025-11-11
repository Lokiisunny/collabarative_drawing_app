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

### Operation History

Each drawing operation is assigned a unique ID and stored in an operation history:

```javascript
{
  id: string,
  type: 'draw' | 'clear',
  strokeId: string (for draw),
  stroke: Stroke (for draw),
  userId: string,
  timestamp: number
}
```

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

### Conflict Resolution

- **Operation IDs**: Each operation has unique ID for precise tracking
- **Timestamp Ordering**: Operations ordered by timestamp
- **Last Write Wins**: For simultaneous operations, server timestamp determines order
- **State Reconciliation**: On join, new users receive complete canvas state

## Performance Decisions

### 1. Path Optimization

**Decision**: Collect points during drawing, render as complete paths

**Rationale**:
- Reduces number of draw operations
- Smoother rendering
- Lower memory overhead than storing every intermediate frame

**Implementation**:
```javascript
stroke.points.push({ x, y });
// Render line from previous point to current
```

### 2. Event Batching

**Decision**: Send individual draw-move events (not batched)

**Rationale**:
- Lower latency for real-time feel
- Simpler implementation
- Acceptable network overhead for drawing apps

**Trade-off**: Higher network traffic, but better UX

### 3. Client-Side Rendering

**Decision**: All rendering happens client-side

**Rationale**:
- Server only manages state, not rendering
- Reduces server load
- Better scalability

### 4. In-Memory State

**Decision**: State stored in memory (no database)

**Rationale**:
- Faster access
- Simpler implementation
- Suitable for assignment scope

**Limitation**: State lost on server restart

### 5. Canvas Redraw Strategy

**Decision**: Full canvas redraw on undo/clear

**Rationale**:
- Simpler than partial updates
- Ensures consistency
- Acceptable performance for typical use

**Optimization**: Could implement layer system for better performance

## Conflict Resolution

### Simultaneous Drawing

**Strategy**: Last-write-wins with operation ordering

- Each stroke has unique ID
- Points added in order received
- Canvas renders all strokes in order
- No explicit locking (users can draw over each other)

### Overlapping Strokes

**Handling**:
- Strokes rendered in order of creation
- Later strokes appear on top
- Natural drawing behavior (like real canvas)

### Undo Conflicts

**Scenario**: User A undoes User B's stroke

**Resolution**:
- Operation ID ensures correct stroke removed
- All clients receive undo event
- Canvas state remains consistent

### Network Latency

**Handling**:
- Optimistic local rendering (draw immediately)
- Server validates and broadcasts
- Remote strokes may arrive out of order (handled by stroke IDs)

### Race Conditions

**Prevention**:
- Unique operation IDs prevent conflicts
- Server maintains authoritative state
- Clients reconcile on room join

## Scalability Considerations

### Current Limitations

- In-memory state (not persistent)
- Single server instance
- No load balancing
- Room state grows unbounded

### Scaling to 1000 Users

**Required Changes**:

1. **Database Persistence**:
   - Store strokes in database (Redis/MongoDB)
   - Query recent strokes on room join
   - Periodic cleanup of old data

2. **Horizontal Scaling**:
   - Redis pub/sub for cross-server communication
   - Sticky sessions or shared state
   - Load balancer for WebSocket connections

3. **State Management**:
   - Limit operation history size
   - Archive old strokes
   - Implement pagination for room state

4. **Optimization**:
   - Batch draw events for high-frequency drawing
   - Throttle cursor updates
   - Implement canvas layers for performance
   - Use WebGL for rendering (if needed)

5. **Monitoring**:
   - Track connection count per room
   - Monitor message throughput
   - Alert on performance degradation

## Security Considerations

### Current State

- No authentication
- No input validation
- No rate limiting
- Room IDs are predictable

### Production Requirements

1. **Authentication**: User login/session management
2. **Authorization**: Room access control
3. **Input Validation**: Sanitize all user inputs
4. **Rate Limiting**: Prevent abuse
5. **CORS**: Proper origin restrictions
6. **HTTPS**: Encrypted connections

## Error Handling

### Client-Side

- Connection loss detection
- Automatic reconnection (Socket.io handles)
- Graceful degradation on errors
- User feedback for errors

### Server-Side

- Room validation
- User validation
- Operation validation
- Graceful error responses
- Logging for debugging

## Testing Strategy

### Unit Tests

- Drawing state operations
- Room management
- Operation history

### Integration Tests

- WebSocket message flow
- Multi-user scenarios
- Undo/redo synchronization

### Load Tests

- Multiple concurrent users
- High-frequency drawing
- Network latency simulation

