# Collaborative Drawing Canvas

A real-time multi-user drawing application where multiple people can draw simultaneously on the same canvas with live synchronization.

## Features

- **Real-time Drawing**: See other users' drawings as they draw (not after they finish)
- **Multiple Tools**: Brush and eraser with customizable colors and stroke width
- **User Indicators**: Visual cursor positions showing where other users are drawing
- **Global Undo/Redo**: Undo and redo operations work across all users
- **User Management**: See who's online with assigned colors
- **Room System**: Multiple isolated canvases

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd collaborative-canvas
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

The server will start on `http://localhost:3000`

### Development Mode

For development with auto-reload:
```bash
npm run dev
```

## How to Test with Multiple Users

1. **Open multiple browser windows/tabs** or use different devices
2. Navigate to `http://localhost:3000` in each window
3. Enter a name and room ID (use the same room ID to collaborate)
4. Click "Join Room"
5. Start drawing - you should see other users' drawings in real-time
6. Test features:
   - Draw simultaneously with other users
   - Try different colors and brush sizes
   - Use undo/redo and see it sync across all users
   - Watch cursor positions of other users
   - Test eraser tool
   - Clear canvas and see it update for everyone

### Testing Tips

- Use different browsers (Chrome, Firefox, Safari) for better isolation
- Test on mobile devices by accessing the server's IP address
- Try drawing quickly to test real-time sync performance
- Test with 3-5 users simultaneously to verify conflict resolution

## Project Structure

```
collaborative-canvas/
├── client/
│   ├── index.html          # Main HTML file
│   ├── style.css           # Styling
│   ├── canvas.js           # Canvas drawing logic
│   ├── websocket.js        # WebSocket client
│   └── main.js             # App initialization
├── server/
│   ├── server.js           # Express + WebSocket server
│   ├── rooms.js            # Room management
│   └── drawing-state.js    # Canvas state management
├── package.json
├── README.md
└── ARCHITECTURE.md
```

## Known Limitations/Bugs

1. **Canvas Resize**: When browser window is resized, canvas redraws but may lose some stroke precision
2. **High Latency**: Under high network latency, drawing may appear slightly delayed
3. **No Persistence**: Drawings are not saved to database - lost on server restart
4. **Room Cleanup**: Empty rooms are cleaned up but may persist briefly in memory

## Technical Decisions

- **Socket.io**: Chosen over native WebSockets for easier room management and automatic reconnection
- **Operation-Based Undo**: Each drawing operation tracked for global undo/redo
- **Client-Side Rendering**: All drawing happens client-side for smooth performance

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Time Spent

- **Planning & Architecture**: 2 hours
- **Backend Implementation**: 4 hours
- **Frontend Implementation**: 5 hours
- **Testing & Debugging**: 2 hours
- **Documentation**: 1 hour
- **Total**: ~14 hours

## Future Improvements

- Add drawing persistence (database storage)
- Implement shape tools (rectangle, circle, line)
- Add text tool
- Image upload and drawing
- Performance optimizations for 100+ users
- User authentication
- Drawing history playback

## License

MIT

