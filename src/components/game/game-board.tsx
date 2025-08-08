'use client';

import { Card } from './card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface Player {
  id: string;
  name: string;
  position: 'north' | 'east' | 'south' | 'west';
  isHuman?: boolean;
  isConnected?: boolean;
  handCount: number;
  team: 'red' | 'black';
}

export interface PlayedCard {
  playerId: string;
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  rank: 'A' | 'K' | 'Q' | 'J' | '10' | '9' | '8' | '7' | '6' | '5' | '4' | '3' | '2';
}

export interface GameBoardProps {
  players: Player[];
  playedCards: PlayedCard[];
  hokmSuit?: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  currentTurn?: string;
  scores: { red: number; black: number };
  onBack?: () => void;
}

export function GameBoard({ 
  players, 
  playedCards, 
  hokmSuit, 
  currentTurn, 
  scores, 
  onBack 
}: GameBoardProps) {
  const getPlayerByPosition = (position: Player['position']) => {
    return players.find(p => p.position === position);
  };

  const getPlayedCardByPosition = (position: Player['position']) => {
    const player = getPlayerByPosition(position);
    return playedCards.find(card => card.playerId === player?.id);
  };

  const suitNames = {
    hearts: 'دل',
    diamonds: 'میش',
    clubs: 'گشنیز',
    spades: 'خاس'
  };

  const suitSymbols = {
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
    spades: '♠'
  };

  const suitColors = {
    hearts: 'text-red-600',
    diamonds: 'text-red-600',
    clubs: 'text-black',
    spades: 'text-black'
  };

  return (
    <div className="relative w-full h-full min-h-[600px] bg-gradient-to-br from-green-800 to-green-900 rounded-2xl p-4 md:p-6">
      {/* Game Header */}
      <div className="flex justify-between items-center mb-4">
        <Button variant="outline" onClick={onBack} className="bg-white/10 text-white border-white/20 hover:bg-white/20">
          بازگشت
        </Button>
        <div className="text-center">
          <h1 className="text-xl md:text-2xl font-bold text-white">حکم</h1>
          {hokmSuit && (
            <Badge variant="secondary" className="mt-1">
              حکم: {suitNames[hokmSuit]} {suitSymbols[hokmSuit]}
            </Badge>
          )}
        </div>
        <div className="text-white text-sm md:text-base">
          <div className="flex gap-2">
            <span className="text-red-400">قرمز: {scores.red}</span>
            <span className="text-gray-400">-</span>
            <span className="text-gray-800">سیاه: {scores.black}</span>
          </div>
        </div>
      </div>

      {/* North Player */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-center">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 min-w-[120px]">
          <div className="flex items-center justify-center gap-2 mb-2">
            <p className="text-white font-semibold text-sm">
              {getPlayerByPosition('north')?.name || 'بازیکن شمال'}
            </p>
            {getPlayerByPosition('north')?.isConnected && (
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            )}
            {currentTurn === getPlayerByPosition('north')?.id && (
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
            )}
          </div>
          <div className="flex justify-center gap-1">
            {Array.from({ length: Math.min(getPlayerByPosition('north')?.handCount || 0, 5) }).map((_, i) => (
              <Card key={i} suit="spades" rank="A" isFaceUp={false} size="sm" />
            ))}
            {(getPlayerByPosition('north')?.handCount || 0) > 5 && (
              <div className="text-white text-xs flex items-center">+{(getPlayerByPosition('north')?.handCount || 0) - 5}</div>
            )}
          </div>
        </div>
      </div>

      {/* West Player */}
      <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 min-w-[100px]">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-white font-semibold text-sm">
              {getPlayerByPosition('west')?.name || 'بازیکن غرب'}
            </p>
            {getPlayerByPosition('west')?.isConnected && (
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            )}
            {currentTurn === getPlayerByPosition('west')?.id && (
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
            )}
          </div>
          <div className="flex flex-col gap-1">
            {Array.from({ length: Math.min(getPlayerByPosition('west')?.handCount || 0, 5) }).map((_, i) => (
              <Card key={i} suit="spades" rank="A" isFaceUp={false} size="sm" />
            ))}
            {(getPlayerByPosition('west')?.handCount || 0) > 5 && (
              <div className="text-white text-xs text-center">+{(getPlayerByPosition('west')?.handCount || 0) - 5}</div>
            )}
          </div>
        </div>
      </div>

      {/* East Player */}
      <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 min-w-[100px]">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-white font-semibold text-sm">
              {getPlayerByPosition('east')?.name || 'بازیکن شرق'}
            </p>
            {getPlayerByPosition('east')?.isConnected && (
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            )}
            {currentTurn === getPlayerByPosition('east')?.id && (
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
            )}
          </div>
          <div className="flex flex-col gap-1">
            {Array.from({ length: Math.min(getPlayerByPosition('east')?.handCount || 0, 5) }).map((_, i) => (
              <Card key={i} suit="spades" rank="A" isFaceUp={false} size="sm" />
            ))}
            {(getPlayerByPosition('east')?.handCount || 0) > 5 && (
              <div className="text-white text-xs text-center">+{(getPlayerByPosition('east')?.handCount || 0) - 5}</div>
            )}
          </div>
        </div>
      </div>

      {/* Center Playing Area */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="bg-green-700/50 rounded-xl p-6 md:p-8 shadow-inner backdrop-blur-sm">
          <div className="grid grid-cols-2 gap-4 md:gap-6">
            {/* North played card */}
            <div className="flex justify-center">
              {getPlayedCardByPosition('north') ? (
                <Card 
                  suit={getPlayedCardByPosition('north')!.suit} 
                  rank={getPlayedCardByPosition('north')!.rank} 
                  size="lg"
                />
              ) : (
                <div className="w-12 h-16 md:w-16 md:h-20 bg-white/10 rounded-lg border-2 border-dashed border-white/30 flex items-center justify-center">
                  <span className="text-white/50 text-xs">شمال</span>
                </div>
              )}
            </div>
            
            {/* East played card */}
            <div className="flex justify-center">
              {getPlayedCardByPosition('east') ? (
                <Card 
                  suit={getPlayedCardByPosition('east')!.suit} 
                  rank={getPlayedCardByPosition('east')!.rank} 
                  size="lg"
                />
              ) : (
                <div className="w-12 h-16 md:w-16 md:h-20 bg-white/10 rounded-lg border-2 border-dashed border-white/30 flex items-center justify-center">
                  <span className="text-white/50 text-xs">شرق</span>
                </div>
              )}
            </div>
            
            {/* West played card */}
            <div className="flex justify-center">
              {getPlayedCardByPosition('west') ? (
                <Card 
                  suit={getPlayedCardByPosition('west')!.suit} 
                  rank={getPlayedCardByPosition('west')!.rank} 
                  size="lg"
                />
              ) : (
                <div className="w-12 h-16 md:w-16 md:h-20 bg-white/10 rounded-lg border-2 border-dashed border-white/30 flex items-center justify-center">
                  <span className="text-white/50 text-xs">غرب</span>
                </div>
              )}
            </div>
            
            {/* South played card */}
            <div className="flex justify-center">
              {getPlayedCardByPosition('south') ? (
                <Card 
                  suit={getPlayedCardByPosition('south')!.suit} 
                  rank={getPlayedCardByPosition('south')!.rank} 
                  size="lg"
                />
              ) : (
                <div className="w-12 h-16 md:w-16 md:h-20 bg-white/10 rounded-lg border-2 border-dashed border-white/30 flex items-center justify-center">
                  <span className="text-white/50 text-xs">جنوب</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* South Player (Human) */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-full max-w-md">
        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-center justify-center gap-2 mb-3">
            <p className="text-white font-semibold">شما</p>
            {getPlayerByPosition('south')?.isConnected && (
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            )}
            {currentTurn === getPlayerByPosition('south')?.id && (
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
            )}
          </div>
          <div className="text-center text-white/70 text-sm mb-2">
            کارت‌های شما ({getPlayerByPosition('south')?.handCount || 0})
          </div>
        </div>
      </div>

      {/* Game Info Panel */}
      <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-sm rounded-lg p-3 min-w-[120px]">
        <div className="space-y-2 text-white text-sm">
          {hokmSuit && (
            <div className="flex items-center gap-2">
              <span>حکم:</span>
              <span className={cn('font-bold', suitColors[hokmSuit])}>
                {suitNames[hokmSuit]} {suitSymbols[hokmSuit]}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span>نوبت:</span>
            <span className="font-bold">
              {currentTurn ? players.find(p => p.id === currentTurn)?.name || '---' : '---'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span>دور:</span>
            <span className="font-bold">1</span>
          </div>
        </div>
      </div>
    </div>
  );
}