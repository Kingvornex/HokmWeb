import { create } from 'zustand';
import { Card, Suit, Position, GameState } from '@/lib/hokm-game';
import { Player as GamePlayer } from '@/components/game/game-board';

interface GameStore {
  // Game state
  gameState: GameState | null;
  gameMode: 'menu' | 'offline' | 'online' | 'lobby';
  isLoading: boolean;
  error: string | null;
  
  // Player info
  playerName: string;
  roomId: string;
  
  // UI state
  isHokmSelectionOpen: boolean;
  showGameRules: boolean;
  soundEnabled: boolean;
  
  // Game actions
  setGameState: (state: GameState | null) => void;
  setGameMode: (mode: 'menu' | 'offline' | 'online' | 'lobby') => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setPlayerName: (name: string) => void;
  setRoomId: (id: string) => void;
  setHokmSelectionOpen: (open: boolean) => void;
  setShowGameRules: (show: boolean) => void;
  setSoundEnabled: (enabled: boolean) => void;
  
  // Game actions
  playCard: (playerId: string, cardIndex: number) => void;
  setHokmSuit: (suit: Suit) => void;
  resetGame: () => void;
  
  // Derived state
  getCurrentPlayer: () => GamePlayer | null;
  getPlayableCards: (playerId: string) => Card[];
  getGameStatus: () => {
    phase: string;
    currentPlayer: string;
    hokmSuit?: string;
    trickCount: number;
    scores: { red: number; black: number };
    round: number;
  } | null;
  
  // Helpers
  clearError: () => void;
  reset: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state
  gameState: null,
  gameMode: 'menu',
  isLoading: false,
  error: null,
  playerName: '',
  roomId: '',
  isHokmSelectionOpen: false,
  showGameRules: false,
  soundEnabled: true,

  // Actions
  setGameState: (gameState) => set({ gameState }),
  setGameMode: (gameMode) => set({ gameMode }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setPlayerName: (playerName) => set({ playerName }),
  setRoomId: (roomId) => set({ roomId }),
  setHokmSelectionOpen: (isHokmSelectionOpen) => set({ isHokmSelectionOpen }),
  setShowGameRules: (showGameRules) => set({ showGameRules }),
  setSoundEnabled: (soundEnabled) => set({ soundEnabled }),

  // Game actions (these will be connected to the actual game logic)
  playCard: (playerId, cardIndex) => {
    const { gameState } = get();
    if (!gameState) return;

    try {
      // This would be connected to the actual HokmGame instance
      // For now, we'll just update the state optimistically
      console.log(`Playing card ${cardIndex} for player ${playerId}`);
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to play card' });
    }
  },

  setHokmSuit: (suit) => {
    const { gameState } = get();
    if (!gameState) return;

    try {
      // This would be connected to the actual HokmGame instance
      console.log(`Setting hokm suit to ${suit}`);
      set({ isHokmSelectionOpen: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to set hokm suit' });
    }
  },

  resetGame: () => {
    set({ 
      gameState: null, 
      error: null,
      isHokmSelectionOpen: false 
    });
  },

  // Derived state
  getCurrentPlayer: () => {
    const { gameState } = get();
    if (!gameState) return null;

    const currentPlayer = gameState.players.find(p => p.position === gameState.currentPlayer);
    if (!currentPlayer) return null;

    return {
      id: currentPlayer.id,
      name: currentPlayer.name,
      position: currentPlayer.position,
      isHuman: currentPlayer.isHuman,
      isConnected: true,
      handCount: currentPlayer.hand.length,
      team: currentPlayer.team
    };
  },

  getPlayableCards: (playerId) => {
    const { gameState } = get();
    if (!gameState) return [];

    const player = gameState.players.find(p => p.id === playerId);
    if (!player || player.position !== gameState.currentPlayer) return [];

    if (gameState.trick.cards.length === 0) {
      return player.hand; // Can play any card if leading
    }

    const leadSuit = gameState.trick.cards[0].card.suit;
    const leadSuitCards = player.hand.filter(c => c.suit === leadSuit);
    
    return leadSuitCards.length > 0 ? leadSuitCards : player.hand;
  },

  getGameStatus: () => {
    const { gameState } = get();
    if (!gameState) return null;

    return {
      phase: gameState.gamePhase,
      currentPlayer: gameState.currentPlayer,
      hokmSuit: gameState.hokmSuit,
      trickCount: gameState.trick.cards.length,
      scores: gameState.scores,
      round: gameState.round
    };
  },

  // Helpers
  clearError: () => set({ error: null }),
  
  reset: () => set({
    gameState: null,
    gameMode: 'menu',
    isLoading: false,
    error: null,
    playerName: '',
    roomId: '',
    isHokmSelectionOpen: false,
    showGameRules: false,
    soundEnabled: true,
  }),
}));

// Selector hooks for better performance
export const useGameState = () => useGameStore((state) => state.gameState);
export const useGameMode = () => useGameStore((state) => state.gameMode);
export const useIsLoading = () => useGameStore((state) => state.isLoading);
export const useGameError = () => useGameStore((state) => state.error);
export const usePlayerName = () => useGameStore((state) => state.playerName);
export const useRoomId = () => useGameStore((state) => state.roomId);
export const useHokmSelection = () => useGameStore((state) => state.isHokmSelectionOpen);
export const useSoundEnabled = () => useGameStore((state) => state.soundEnabled);

// Action hooks
export const useGameActions = () => useGameStore((state) => ({
  setGameState: state.setGameState,
  setGameMode: state.setGameMode,
  setLoading: state.setLoading,
  setError: state.setError,
  setPlayerName: state.setPlayerName,
  setRoomId: state.setRoomId,
  setHokmSelectionOpen: state.setHokmSelectionOpen,
  setShowGameRules: state.setShowGameRules,
  setSoundEnabled: state.setSoundEnabled,
  playCard: state.playCard,
  setHokmSuit: state.setHokmSuit,
  resetGame: state.resetGame,
  clearError: state.clearError,
  reset: state.reset,
}));