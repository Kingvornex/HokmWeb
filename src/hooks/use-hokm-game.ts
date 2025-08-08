'use client';

import { useState, useCallback, useEffect } from 'react';
import { HokmGame, Card, Suit, Position, GameState } from '@/lib/hokm-game';
import { HokmAI } from '@/lib/hokm-ai';

export interface UseHokmGameProps {
  playerNames?: {
    north: string;
    east: string;
    south: string;
    west: string;
  };
  aiDifficulty?: 'easy' | 'medium' | 'hard';
}

export function useHokmGame({ 
  playerNames = {
    north: 'بازیکن شمال',
    east: 'بازیکن شرق', 
    south: 'شما',
    west: 'بازیکن غرب'
  },
  aiDifficulty = 'medium'
}: UseHokmGameProps = {}) {
  const [game, setGame] = useState<HokmGame | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ai] = useState(() => new HokmAI(aiDifficulty));

  // Initialize game
  const initializeGame = useCallback(() => {
    try {
      const newGame = new HokmGame(playerNames);
      setGame(newGame);
      setGameState(newGame.getState());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize game');
    }
  }, [playerNames]);

  // Set hokm suit
  const setHokmSuit = useCallback((suit: Suit) => {
    if (!game) return;
    
    try {
      game.setHokmSuit(suit);
      setGameState(game.getState());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set hokm suit');
    }
  }, [game]);

  // Play a card
  const playCard = useCallback((playerId: string, cardIndex: number) => {
    if (!game) return;
    
    try {
      game.playCard(playerId, cardIndex);
      setGameState(game.getState());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to play card');
    }
  }, [game]);

  // Get playable cards for current player
  const getPlayableCards = useCallback((playerId: string): Card[] => {
    if (!game) return [];
    return game.getPlayableCards(playerId);
  }, [game]);

  // Get current player info
  const getCurrentPlayer = useCallback(() => {
    if (!game) return null;
    return game.getCurrentPlayer();
  }, [game]);

  // Get game status
  const getGameStatus = useCallback(() => {
    if (!game) return null;
    return game.getGameStatus();
  }, [game]);

  // Reset game
  const resetGame = useCallback(() => {
    initializeGame();
  }, [initializeGame]);

  // Initialize game on mount
  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  // Auto-play for AI players with enhanced AI
  useEffect(() => {
    if (!gameState || gameState.gamePhase !== 'playing') return;

    const currentPlayer = gameState.players.find(p => p.position === gameState.currentPlayer);
    if (!currentPlayer || currentPlayer.isHuman) return;

    // Enhanced AI with variable thinking time based on difficulty
    const thinkingTime = aiDifficulty === 'easy' ? 500 : aiDifficulty === 'medium' ? 1000 : 1500;
    
    const timer = setTimeout(() => {
      try {
        const cardIndex = ai.selectCard(gameState, currentPlayer.position);
        
        if (cardIndex >= 0 && cardIndex < currentPlayer.hand.length) {
          playCard(currentPlayer.id, cardIndex);
        }
      } catch (err) {
        console.error('AI move failed:', err);
        // Fallback to random move
        const playableCards = getPlayableCards(currentPlayer.id);
        if (playableCards.length > 0) {
          const randomIndex = Math.floor(Math.random() * playableCards.length);
          const cardToPlay = playableCards[randomIndex];
          const cardIndexInHand = currentPlayer.hand.findIndex(
            card => card.suit === cardToPlay.suit && card.rank === cardToPlay.rank
          );
          
          if (cardIndexInHand !== -1) {
            playCard(currentPlayer.id, cardIndexInHand);
          }
        }
      }
    }, thinkingTime);

    return () => clearTimeout(timer);
  }, [gameState, ai, getPlayableCards, playCard, aiDifficulty]);

  return {
    gameState,
    error,
    initializeGame,
    setHokmSuit,
    playCard,
    getPlayableCards,
    getCurrentPlayer,
    getGameStatus,
    resetGame
  };
}