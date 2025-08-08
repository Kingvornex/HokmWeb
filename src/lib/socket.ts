import { Server } from 'socket.io';
import { Card, Suit, Position } from './hokm-game';

interface Player {
  id: string;
  name: string;
  socketId: string;
  position?: Position;
  isReady: boolean;
}

interface Room {
  id: string;
  name: string;
  players: Player[];
  hostId: string;
  gameStarted: boolean;
  gameState?: any;
  hokmSuit?: Suit;
}

interface GameMove {
  playerId: string;
  cardIndex: number;
  roomId: string;
}

interface ChatMessage {
  text: string;
  senderId: string;
  senderName: string;
  roomId: string;
  timestamp: string;
}

const rooms: Map<string, Room> = new Map();
const players: Map<string, Player> = new Map();

export const setupSocket = (io: Server) => {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Create a new room
    socket.on('create-room', (data: { roomName: string; playerName: string }, callback) => {
      try {
        const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        const player: Player = {
          id: socket.id,
          name: data.playerName,
          socketId: socket.id,
          isReady: false
        };

        const room: Room = {
          id: roomId,
          name: data.roomName,
          players: [player],
          hostId: socket.id,
          gameStarted: false
        };

        rooms.set(roomId, room);
        players.set(socket.id, player);
        
        socket.join(roomId);
        
        console.log(`Room created: ${roomId} by ${data.playerName}`);
        
        callback({ success: true, roomId });
        
        socket.emit('room-created', { roomId, roomName: data.roomName });
        socket.emit('player-joined', { player: { ...player, position: undefined } });
      } catch (error) {
        console.error('Error creating room:', error);
        callback({ success: false, error: 'Failed to create room' });
      }
    });

    // Join an existing room
    socket.on('join-room', (data: { roomId: string; playerName: string }, callback) => {
      try {
        const room = rooms.get(data.roomId);
        
        if (!room) {
          callback({ success: false, error: 'Room not found' });
          return;
        }

        if (room.players.length >= 4) {
          callback({ success: false, error: 'Room is full' });
          return;
        }

        if (room.gameStarted) {
          callback({ success: false, error: 'Game already started' });
          return;
        }

        const player: Player = {
          id: socket.id,
          name: data.playerName,
          socketId: socket.id,
          isReady: false
        };

        room.players.push(player);
        players.set(socket.id, player);
        
        socket.join(data.roomId);
        
        console.log(`${data.playerName} joined room ${data.roomId}`);
        
        callback({ success: true });
        
        // Notify all players in the room
        io.to(data.roomId).emit('player-joined', { player: { ...player, position: undefined } });
        
        // Send current room state to the new player
        socket.emit('room-state', {
          room: {
            id: room.id,
            name: room.name,
            players: room.players.map(p => ({ ...p, position: undefined })),
            hostId: room.hostId,
            gameStarted: room.gameStarted
          }
        });
      } catch (error) {
        console.error('Error joining room:', error);
        callback({ success: false, error: 'Failed to join room' });
      }
    });

    // Leave room
    socket.on('leave-room', (data: { roomId: string }) => {
      try {
        const room = rooms.get(data.roomId);
        if (!room) return;

        const playerIndex = room.players.findIndex(p => p.socketId === socket.id);
        if (playerIndex !== -1) {
          const player = room.players[playerIndex];
          room.players.splice(playerIndex, 1);
          players.delete(socket.id);
          
          socket.leave(data.roomId);
          
          console.log(`${player.name} left room ${data.roomId}`);
          
          // Notify remaining players
          io.to(data.roomId).emit('player-left', { playerId: socket.id, playerName: player.name });
          
          // If room is empty, delete it
          if (room.players.length === 0) {
            rooms.delete(data.roomId);
            console.log(`Room ${data.roomId} deleted (empty)`);
          } else if (room.hostId === socket.id) {
            // Transfer host to another player
            room.hostId = room.players[0].socketId;
            io.to(data.roomId).emit('host-changed', { newHostId: room.hostId });
          }
        }
      } catch (error) {
        console.error('Error leaving room:', error);
      }
    });

    // Set player ready
    socket.on('player-ready', (data: { roomId: string; isReady: boolean }) => {
      try {
        const room = rooms.get(data.roomId);
        if (!room) return;

        const player = room.players.find(p => p.socketId === socket.id);
        if (player) {
          player.isReady = data.isReady;
          
          io.to(data.roomId).emit('player-ready-changed', { 
            playerId: socket.id, 
            isReady: data.isReady 
          });
          
          // Check if all players are ready and game can start
          if (room.players.length === 4 && room.players.every(p => p.isReady)) {
            startGame(data.roomId);
          }
        }
      } catch (error) {
        console.error('Error setting player ready:', error);
      }
    });

    // Start game
    const startGame = (roomId: string) => {
      try {
        const room = rooms.get(roomId);
        if (!room || room.gameStarted) return;

        // Assign positions to players
        const positions: Position[] = ['south', 'west', 'north', 'east'];
        room.players.forEach((player, index) => {
          player.position = positions[index];
        });

        room.gameStarted = true;
        
        console.log(`Game started in room ${roomId}`);
        
        io.to(roomId).emit('game-started', {
          players: room.players,
          hokmSuit: undefined
        });
      } catch (error) {
        console.error('Error starting game:', error);
      }
    };

    // Set hokm suit
    socket.on('set-hokm', (data: { roomId: string; suit: Suit }) => {
      try {
        const room = rooms.get(data.roomId);
        if (!room || !room.gameStarted) return;

        room.hokmSuit = data.suit;
        
        console.log(`Hokm set to ${data.suit} in room ${data.roomId}`);
        
        io.to(data.roomId).emit('hokm-set', { suit: data.suit });
      } catch (error) {
        console.error('Error setting hokm:', error);
      }
    });

    // Play card
    socket.on('play-card', (data: GameMove) => {
      try {
        const room = rooms.get(data.roomId);
        if (!room || !room.gameStarted) return;

        console.log(`Card played by ${socket.id} in room ${data.roomId}`);
        
        // Broadcast the move to all players in the room
        io.to(data.roomId).emit('card-played', {
          playerId: data.playerId,
          cardIndex: data.cardIndex
        });
      } catch (error) {
        console.error('Error playing card:', error);
      }
    });

    // Send chat message
    socket.on('chat-message', (data: ChatMessage) => {
      try {
        const room = rooms.get(data.roomId);
        if (!room) return;

        const message: ChatMessage = {
          ...data,
          timestamp: new Date().toISOString()
        };

        console.log(`Chat message in room ${data.roomId}: ${data.senderName}: ${data.text}`);
        
        // Broadcast to all players in the room
        io.to(data.roomId).emit('chat-message', message);
      } catch (error) {
        console.error('Error sending chat message:', error);
      }
    });

    // Get room list
    socket.on('get-rooms', (callback) => {
      try {
        const roomList = Array.from(rooms.values()).map(room => ({
          id: room.id,
          name: room.name,
          playerCount: room.players.length,
          gameStarted: room.gameStarted
        }));
        
        callback({ success: true, rooms: roomList });
      } catch (error) {
        console.error('Error getting rooms:', error);
        callback({ success: false, error: 'Failed to get rooms' });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      
      // Find and remove player from any rooms
      const player = players.get(socket.id);
      if (player) {
        // Find all rooms this player is in
        for (const [roomId, room] of rooms.entries()) {
          const playerIndex = room.players.findIndex(p => p.socketId === socket.id);
          if (playerIndex !== -1) {
            const leftPlayer = room.players[playerIndex];
            room.players.splice(playerIndex, 1);
            
            socket.leave(roomId);
            
            // Notify remaining players
            io.to(roomId).emit('player-left', { 
              playerId: socket.id, 
              playerName: leftPlayer.name 
            });
            
            // If room is empty, delete it
            if (room.players.length === 0) {
              rooms.delete(roomId);
              console.log(`Room ${roomId} deleted (empty)`);
            } else if (room.hostId === socket.id) {
              // Transfer host to another player
              room.hostId = room.players[0].socketId;
              io.to(roomId).emit('host-changed', { newHostId: room.hostId });
            }
          }
        }
        
        players.delete(socket.id);
      }
    });

    // Send welcome message
    socket.emit('message', {
      text: 'Welcome to Hokm Online!',
      senderId: 'system',
      timestamp: new Date().toISOString(),
    });
  });
};