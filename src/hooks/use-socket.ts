'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface Player {
  id: string;
  name: string;
  socketId: string;
  position?: 'north' | 'east' | 'south' | 'west';
  isReady: boolean;
}

interface Room {
  id: string;
  name: string;
  players: Player[];
  hostId: string;
  gameStarted: boolean;
}

interface ChatMessage {
  text: string;
  senderId: string;
  senderName: string;
  roomId: string;
  timestamp: string;
}

export interface UseSocketProps {
  serverUrl?: string;
}

export function useSocket({ serverUrl = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000' }: UseSocketProps = {}) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Initialize socket connection
  useEffect(() => {
    try {
      socketRef.current = io(serverUrl, {
        transports: ['websocket', 'polling'],
        timeout: 5000,
      });

      const socket = socketRef.current;

      socket.on('connect', () => {
        console.log('Connected to server');
        setIsConnected(true);
        setError(null);
      });

      socket.on('disconnect', () => {
        console.log('Disconnected from server');
        setIsConnected(false);
      });

      // Room events
      socket.on('room-created', (data: { roomId: string; roomName: string }) => {
        console.log('Room created:', data);
      });

      socket.on('player-joined', (data: { player: Player }) => {
        if (currentRoom) {
          const updatedRoom = {
            ...currentRoom,
            players: [...currentRoom.players, data.player]
          };
          setCurrentRoom(updatedRoom);
        }
      });

      socket.on('player-left', (data: { playerId: string; playerName: string }) => {
        if (currentRoom) {
          const updatedRoom = {
            ...currentRoom,
            players: currentRoom.players.filter(p => p.id !== data.playerId)
          };
          setCurrentRoom(updatedRoom);
          
          // Add system message
          setChatMessages(prev => [...prev, {
            text: `${data.playerName} بازی را ترک کرد`,
            senderId: 'system',
            senderName: 'سیستم',
            roomId: currentRoom.id,
            timestamp: new Date().toISOString()
          }]);
        }
      });

      socket.on('player-ready-changed', (data: { playerId: string; isReady: boolean }) => {
        if (currentRoom) {
          const updatedRoom = {
            ...currentRoom,
            players: currentRoom.players.map(p => 
              p.id === data.playerId ? { ...p, isReady: data.isReady } : p
            )
          };
          setCurrentRoom(updatedRoom);
        }
      });

      socket.on('host-changed', (data: { newHostId: string }) => {
        if (currentRoom) {
          const updatedRoom = {
            ...currentRoom,
            hostId: data.newHostId
          };
          setCurrentRoom(updatedRoom);
        }
      });

      socket.on('game-started', (data: { players: Player[]; hokmSuit?: string }) => {
        if (currentRoom) {
          const updatedRoom = {
            ...currentRoom,
            gameStarted: true,
            players: data.players
          };
          setCurrentRoom(updatedRoom);
          
          // Add system message
          setChatMessages(prev => [...prev, {
            text: 'بازی شروع شد!',
            senderId: 'system',
            senderName: 'سیستم',
            roomId: currentRoom.id,
            timestamp: new Date().toISOString()
          }]);
        }
      });

      socket.on('hokm-set', (data: { suit: string }) => {
        // Add system message
        if (currentRoom) {
          const suitNames = {
            hearts: 'دل',
            diamonds: 'میش',
            clubs: 'گشنیز',
            spades: 'خاس'
          };
          
          setChatMessages(prev => [...prev, {
            text: `حکم: ${suitNames[data.suit as keyof typeof suitNames] || data.suit}`,
            senderId: 'system',
            senderName: 'سیستم',
            roomId: currentRoom.id,
            timestamp: new Date().toISOString()
          }]);
        }
      });

      socket.on('card-played', (data: { playerId: string; cardIndex: number }) => {
        // Handle card played event
        console.log('Card played:', data);
      });

      // Chat events
      socket.on('chat-message', (message: ChatMessage) => {
        setChatMessages(prev => [...prev, message]);
      });

      // Error handling
      socket.on('connect_error', (err) => {
        console.error('Connection error:', err);
        setError('Failed to connect to server');
        setIsConnected(false);
      });

    } catch (err) {
      console.error('Socket initialization error:', err);
      setError('Failed to initialize socket');
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [serverUrl]);

  // Room management
  const createRoom = useCallback(async (roomName: string, playerName: string) => {
    if (!socketRef.current) return null;

    return new Promise<{ success: boolean; roomId?: string; error?: string }>((resolve) => {
      socketRef.current!.emit('create-room', { roomName, playerName }, (response: any) => {
        if (response.success) {
          resolve({ success: true, roomId: response.roomId });
        } else {
          setError(response.error || 'Failed to create room');
          resolve({ success: false, error: response.error });
        }
      });
    });
  }, []);

  const joinRoom = useCallback(async (roomId: string, playerName: string) => {
    if (!socketRef.current) return null;

    return new Promise<{ success: boolean; error?: string }>((resolve) => {
      socketRef.current!.emit('join-room', { roomId, playerName }, (response: any) => {
        if (response.success) {
          resolve({ success: true });
        } else {
          setError(response.error || 'Failed to join room');
          resolve({ success: false, error: response.error });
        }
      });
    });
  }, []);

  const leaveRoom = useCallback((roomId: string) => {
    if (!socketRef.current) return;
    
    socketRef.current.emit('leave-room', { roomId });
    setCurrentRoom(null);
    setChatMessages([]);
  }, []);

  const setPlayerReady = useCallback((roomId: string, isReady: boolean) => {
    if (!socketRef.current) return;
    
    socketRef.current.emit('player-ready', { roomId, isReady });
  }, []);

  const setHokmSuit = useCallback((roomId: string, suit: string) => {
    if (!socketRef.current) return;
    
    socketRef.current.emit('set-hokm', { roomId, suit });
  }, []);

  const playCard = useCallback((roomId: string, cardIndex: number) => {
    if (!socketRef.current) return;
    
    socketRef.current.emit('play-card', {
      playerId: socketRef.current.id,
      cardIndex,
      roomId
    });
  }, []);

  const sendChatMessage = useCallback((roomId: string, text: string, senderName: string) => {
    if (!socketRef.current || !text.trim()) return;
    
    socketRef.current.emit('chat-message', {
      text: text.trim(),
      senderId: socketRef.current.id,
      senderName,
      roomId,
      timestamp: new Date().toISOString()
    });
  }, []);

  const getRooms = useCallback(async () => {
    if (!socketRef.current) return [];

    return new Promise<Room[]>((resolve) => {
      socketRef.current!.emit('get-rooms', (response: any) => {
        if (response.success) {
          setRooms(response.rooms);
          resolve(response.rooms);
        } else {
          setError(response.error || 'Failed to get rooms');
          resolve([]);
        }
      });
    });
  }, []);

  // Auto-refresh rooms list
  useEffect(() => {
    if (isConnected && !currentRoom) {
      const interval = setInterval(() => {
        getRooms();
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [isConnected, currentRoom, getRooms]);

  // Set current room when joining
  useEffect(() => {
    const handleRoomState = (data: { room: Room }) => {
      setCurrentRoom(data.room);
      setChatMessages([]);
    };

    if (socketRef.current) {
      socketRef.current.on('room-state', handleRoomState);
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.off('room-state', handleRoomState);
      }
    };
  }, []);

  return {
    isConnected,
    currentRoom,
    rooms,
    chatMessages,
    error,
    createRoom,
    joinRoom,
    leaveRoom,
    setPlayerReady,
    setHokmSuit,
    playCard,
    sendChatMessage,
    getRooms
  };
}