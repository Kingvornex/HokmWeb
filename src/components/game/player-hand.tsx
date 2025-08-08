'use client';

import { useState } from 'react';
import { Card, CardProps } from './card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface PlayerHandProps {
  cards: CardProps[];
  onCardPlay?: (cardIndex: number) => void;
  isCurrentTurn?: boolean;
  maxCards?: number;
}

export function PlayerHand({ cards, onCardPlay, isCurrentTurn = false, maxCards = 13 }: PlayerHandProps) {
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);

  const handleCardClick = (index: number) => {
    if (!isCurrentTurn) return;
    
    if (selectedCardIndex === index) {
      // If the same card is clicked again, play it
      if (onCardPlay) {
        onCardPlay(index);
      }
      setSelectedCardIndex(null);
    } else {
      // Select the card
      setSelectedCardIndex(index);
    }
  };

  const handlePlaySelectedCard = () => {
    if (selectedCardIndex !== null && onCardPlay) {
      onCardPlay(selectedCardIndex);
      setSelectedCardIndex(null);
    }
  };

  // Group cards for better display on mobile
  const getCardGroups = () => {
    const groups = [];
    const cardsPerRow = maxCards <= 7 ? 7 : 5; // Fewer cards per row on mobile
    
    for (let i = 0; i < cards.length; i += cardsPerRow) {
      groups.push(cards.slice(i, i + cardsPerRow));
    }
    
    return groups;
  };

  const cardGroups = getCardGroups();

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Selected Card Actions */}
      {selectedCardIndex !== null && isCurrentTurn && (
        <div className="flex justify-center mb-4 gap-2">
          <Button 
            onClick={handlePlaySelectedCard}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            بازی کردن کارت
          </Button>
          <Button 
            variant="outline"
            onClick={() => setSelectedCardIndex(null)}
            className="bg-white/10 text-white border-white/20 hover:bg-white/20"
          >
            لغو
          </Button>
        </div>
      )}

      {/* Cards Display */}
      <div className="space-y-2">
        {cardGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="flex justify-center gap-1 md:gap-2">
            {group.map((card, index) => {
              const actualIndex = groupIndex * (maxCards <= 7 ? 7 : 5) + index;
              const isSelected = selectedCardIndex === actualIndex;
              
              return (
                <div key={actualIndex} className="flex-shrink-0">
                  <Card
                    {...card}
                    isPlayable={isCurrentTurn}
                    isSelected={isSelected}
                    onClick={() => handleCardClick(actualIndex)}
                    size="md"
                    className={cn(
                      'transition-all duration-200',
                      isSelected && 'transform -translate-y-4',
                      isCurrentTurn && 'hover:transform hover:-translate-y-2'
                    )}
                  />
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Turn Indicator */}
      <div className="text-center mt-4">
        {isCurrentTurn ? (
          <div className="inline-flex items-center gap-2 bg-green-600/20 text-green-300 px-4 py-2 rounded-full">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">نوبت شماست</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 bg-gray-600/20 text-gray-300 px-4 py-2 rounded-full">
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            <span className="text-sm font-medium">منتظر نوبت دیگران</span>
          </div>
        )}
      </div>

      {/* Cards Count */}
      <div className="text-center mt-2">
        <span className="text-white/70 text-sm">
          {cards.length} کارت در دست شما
        </span>
      </div>
    </div>
  );
}

// Helper function to generate a full deck of cards
export function createDeck(): CardProps[] {
  const suits: CardProps['suit'][] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks: CardProps['rank'][] = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'];
  
  const deck: CardProps[] = [];
  
  suits.forEach(suit => {
    ranks.forEach(rank => {
      deck.push({ suit, rank });
    });
  });
  
  return deck;
}

// Helper function to shuffle cards
export function shuffleCards<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}