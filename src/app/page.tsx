'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GameBoard, Player as GamePlayer } from '@/components/game/game-board';
import { PlayerHand, createDeck, shuffleCards } from '@/components/game/player-hand';
import { Lobby } from '@/components/game/lobby';
import { useHokmGame } from '@/hooks/use-hokm-game';
import { useSocket } from '@/hooks/use-socket';
import { useGameStore, useGameActions, useGameState, useGameMode, usePlayerName, useRoomId } from '@/store/game-store';
import { Suit } from '@/lib/hokm-game';

export default function Home() {
  const { gameState, error, setHokmSuit, playCard, getPlayableCards, getCurrentPlayer, getGameStatus, resetGame } = useHokmGame();
  const { 
    isConnected, 
    currentRoom, 
    chatMessages, 
    setPlayerReady, 
    setHokmSuit: setSocketHokmSuit, 
    playCard: playSocketCard,
    sendChatMessage,
    leaveRoom 
  } = useSocket();
  
  const { gameMode, playerName, roomId, isHokmSelectionOpen } = useGameStore();
  const { 
    setGameMode, 
    setPlayerName, 
    setRoomId, 
    setHokmSelectionOpen, 
    setError, 
    clearError 
  } = useGameActions();

  const [showOnlineGame, setShowOnlineGame] = useState(false);

  const startOfflineGame = () => {
    setGameMode('offline');
    resetGame();
  };

  const startOnlineGame = () => {
    setGameMode('lobby');
  };

  const handleJoinRoom = (newRoomId: string, newName: string) => {
    setRoomId(newRoomId);
    setShowOnlineGame(true);
  };

  const handleBackToMenu = () => {
    setGameMode('menu');
    setShowOnlineGame(false);
    clearError();
    
    if (currentRoom) {
      leaveRoom(currentRoom.id);
    }
  };

  const handleCardPlay = (cardIndex: number) => {
    if (!gameState) return;
    
    if (gameMode === 'online' && currentRoom) {
      playSocketCard(currentRoom.id, cardIndex);
    } else {
      const humanPlayer = gameState.players.find(p => p.isHuman);
      if (humanPlayer) {
        playCard(humanPlayer.id, cardIndex);
      }
    }
  };

  const handleSetHokm = (suit: Suit) => {
    if (gameMode === 'online' && currentRoom) {
      setSocketHokmSuit(currentRoom.id, suit);
    } else {
      setHokmSuit(suit);
    }
    setHokmSelectionOpen(false);
  };

  const handleSendMessage = (message: string) => {
    if (currentRoom && playerName) {
      sendChatMessage(currentRoom.id, message, playerName);
    }
  };

  // Convert game state to UI player format
  const gamePlayers: GamePlayer[] = gameState ? gameState.players.map(player => ({
    id: player.id,
    name: player.name,
    position: player.position,
    isHuman: player.isHuman,
    isConnected: true,
    handCount: player.hand.length,
    team: player.team
  })) : [];

  // Convert socket room players to UI format
  const onlinePlayers: GamePlayer[] = currentRoom ? currentRoom.players.map(player => ({
    id: player.socketId,
    name: player.name,
    position: player.position,
    isHuman: player.socketId === (typeof window !== 'undefined' && window.io?.id ? window.io.id : ''),
    isConnected: true,
    handCount: 13, // Placeholder
    team: player.position === 'north' || player.position === 'south' ? 'black' : 'red'
  })) : [];

  // Get played cards for the game board
  const playedCards = gameState ? gameState.trick.cards.map(trickCard => ({
    playerId: trickCard.playerId,
    suit: trickCard.card.suit,
    rank: trickCard.card.rank
  })) : [];

  // Get human player hand
  const humanPlayerHand = gameState ? 
    gameState.players.find(p => p.isHuman)?.hand.map(card => ({ 
      ...card, 
      isFaceUp: true, 
      isPlayable: getCurrentPlayer()?.isHuman 
    })) || [] : [];

  // Render lobby
  if (gameMode === 'lobby') {
    return (
      <Lobby 
        onBack={handleBackToMenu}
        onJoinRoom={handleJoinRoom}
      />
    );
  }

  // Render offline game
  if (gameMode === 'offline' && gameState) {
    const gameStatus = getGameStatus();
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900 p-4">
        <div className="max-w-6xl mx-auto">
          {/* Error Display */}
          {error && (
            <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-lg">
              <p className="text-white text-center">{error}</p>
            </div>
          )}

          {/* Hokm Selection Modal */}
          {isHokmSelectionOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-xl font-bold mb-4 text-center">حکم را انتخاب کنید</h3>
                <p className="text-gray-600 mb-6 text-center">
                  لطفاً یک خال را به عنوان حکم انتخاب کنید
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    onClick={() => handleSetHokm('hearts')}
                    className="bg-red-500 hover:bg-red-600 text-white"
                  >
                    ♥ دل
                  </Button>
                  <Button 
                    onClick={() => handleSetHokm('diamonds')}
                    className="bg-red-500 hover:bg-red-600 text-white"
                  >
                    ♦ میش
                  </Button>
                  <Button 
                    onClick={() => handleSetHokm('clubs')}
                    className="bg-gray-800 hover:bg-gray-900 text-white"
                  >
                    ♣ گشنیز
                  </Button>
                  <Button 
                    onClick={() => handleSetHokm('spades')}
                    className="bg-gray-800 hover:bg-gray-900 text-white"
                  >
                    ♠ خاس
                  </Button>
                </div>
              </div>
            </div>
          )}

          <GameBoard
            players={gamePlayers}
            playedCards={playedCards}
            hokmSuit={gameState.hokmSuit}
            currentTurn={gameState.currentPlayer}
            scores={gameState.scores}
            onBack={handleBackToMenu}
          />
          
          {/* Player Hand Section */}
          <div className="mt-96">
            <PlayerHand
              cards={humanPlayerHand}
              onCardPlay={handleCardPlay}
              isCurrentTurn={getCurrentPlayer()?.isHuman || false}
            />
          </div>

          {/* Game Status */}
          <div className="fixed top-4 left-4 bg-white/10 backdrop-blur-sm rounded-lg p-3">
            <div className="text-white text-sm space-y-1">
              <p>دور: {gameStatus?.round}</p>
              <p>فاز: {gameStatus?.phase === 'bidding' ? 'انتخاب حکم' : 'در حال بازی'}</p>
              <p>نوبت: {gamePlayers.find(p => p.position === gameStatus?.currentPlayer)?.name}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render online game
  if (gameMode === 'online' && showOnlineGame && currentRoom) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 p-4">
        <div className="max-w-6xl mx-auto">
          {/* Error Display */}
          {error && (
            <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-lg">
              <p className="text-white text-center">{error}</p>
            </div>
          )}

          {/* Hokm Selection Modal */}
          {isHokmSelectionOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-xl font-bold mb-4 text-center">حکم را انتخاب کنید</h3>
                <p className="text-gray-600 mb-6 text-center">
                  لطفاً یک خال را به عنوان حکم انتخاب کنید
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    onClick={() => handleSetHokm('hearts')}
                    className="bg-red-500 hover:bg-red-600 text-white"
                  >
                    ♥ دل
                  </Button>
                  <Button 
                    onClick={() => handleSetHokm('diamonds')}
                    className="bg-red-500 hover:bg-red-600 text-white"
                  >
                    ♦ میش
                  </Button>
                  <Button 
                    onClick={() => handleSetHokm('clubs')}
                    className="bg-gray-800 hover:bg-gray-900 text-white"
                  >
                    ♣ گشنیز
                  </Button>
                  <Button 
                    onClick={() => handleSetHokm('spades')}
                    className="bg-gray-800 hover:bg-gray-900 text-white"
                  >
                    ♠ خاس
                  </Button>
                </div>
              </div>
            </div>
          )}

          <GameBoard
            players={onlinePlayers}
            playedCards={playedCards}
            hokmSuit={currentRoom.hokmSuit}
            currentTurn={onlinePlayers.find(p => p.isHuman)?.position}
            scores={{ red: 0, black: 0 }} // Placeholder
            onBack={handleBackToMenu}
          />
          
          {/* Player Hand Section */}
          <div className="mt-96">
            <PlayerHand
              cards={humanPlayerHand}
              onCardPlay={handleCardPlay}
              isCurrentTurn={true} // Placeholder
            />
          </div>

          {/* Chat Panel */}
          <div className="fixed bottom-4 right-4 bg-white/10 backdrop-blur-sm rounded-lg p-3 w-64 max-h-80">
            <p className="text-white text-sm font-semibold mb-2">گفتگو</p>
            <div className="bg-white/5 rounded p-2 h-40 overflow-y-auto text-xs text-white/70 mb-2">
              {chatMessages.map((msg, index) => (
                <div key={index} className="mb-1">
                  <span className="font-semibold">{msg.senderName}:</span> {msg.text}
                </div>
              ))}
            </div>
            <div className="flex gap-1">
              <Input 
                placeholder="پیام..." 
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 text-sm flex-1"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSendMessage((e.target as HTMLInputElement).value);
                    (e.target as HTMLInputElement).value = '';
                  }
                }}
              />
            </div>
          </div>

          {/* Game Status */}
          <div className="fixed top-4 left-4 bg-white/10 backdrop-blur-sm rounded-lg p-3">
            <div className="text-white text-sm space-y-1">
              <p>اتاق: {currentRoom.id}</p>
              <p>وضعیت: {currentRoom.gameStarted ? 'در حال بازی' : 'در انتظار'}</p>
              <p>بازیکنان: {currentRoom.players.length}/4</p>
            </div>
          </div>

          {/* Ready Button */}
          {!currentRoom.gameStarted && (
            <div className="fixed bottom-4 left-4">
              <Button 
                onClick={() => setPlayerReady(currentRoom.id, true)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                آماده هستم
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Main menu
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-purple-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-4">
            حکم
          </h1>
          <p className="text-xl text-purple-200 mb-8">
            بازی محبوب کارت ایرانی - آنلاین و آفلاین
          </p>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            برای اندروید و وب
          </Badge>
        </div>

        {/* Game Mode Selection */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Offline Mode */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">📱</span>
                بازی آفلاین
              </CardTitle>
              <CardDescription className="text-purple-200">
                با هوش مصنوعی بازی کنید - نیازی به اینترنت ندارید
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-green-400">✓</span>
                  <span>بازی با ۳ هوش مصنوعی هوشمند</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-green-400">✓</span>
                  <span>بدون نیاز به اتصال اینترنت</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-green-400">✓</span>
                  <span>قابلیت تمرین و یادگیری</span>
                </div>
              </div>
              <Button 
                onClick={startOfflineGame}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                size="lg"
              >
                شروع بازی آفلاین
              </Button>
            </CardContent>
          </Card>

          {/* Online Mode */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🌐</span>
                بازی آنلاین
              </CardTitle>
              <CardDescription className="text-purple-200">
                با دوستان خود از سراسر جهان بازی کنید
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-blue-400">✓</span>
                  <span>بازی با دوستان و بازیکنان واقعی</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-blue-400">✓</span>
                  <span>چت و گفتگوی زنده حین بازی</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-blue-400">✓</span>
                  <span>مسابقات و امتیازدهی</span>
                </div>
              </div>
              <Button 
                onClick={startOnlineGame}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
              >
                ورود به لابی
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Game Features */}
        <Card className="bg-white/5 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-center">ویژگی‌های بازی</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4 text-center">
              <div className="space-y-2">
                <div className="text-3xl mb-2">🎮</div>
                <h3 className="text-white font-semibold">گرافیک زیبا</h3>
                <p className="text-purple-200 text-sm">محیط بازی جذاب و کارت‌های با کیفیت</p>
              </div>
              <div className="space-y-2">
                <div className="text-3xl mb-2">🏆</div>
                <h3 className="text-white font-semibold">امتیازدهی</h3>
                <p className="text-purple-200 text-sm">ثبت امتیازات و رده‌بندی بازیکنان</p>
              </div>
              <div className="space-y-2">
                <div className="text-3xl mb-2">📱</div>
                <h3 className="text-white font-semibold">هماهنگ با موبایل</h3>
                <p className="text-purple-200 text-sm">بهینه شده برای تمام دستگاه‌ها</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}