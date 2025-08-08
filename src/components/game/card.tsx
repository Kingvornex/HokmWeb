'use client';

import { cn } from '@/lib/utils';

export interface CardProps {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  rank: 'A' | 'K' | 'Q' | 'J' | '10' | '9' | '8' | '7' | '6' | '5' | '4' | '3' | '2';
  isFaceUp?: boolean;
  isPlayable?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

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

const sizeClasses = {
  sm: 'w-8 h-12 text-xs',
  md: 'w-10 h-14 text-sm',
  lg: 'w-12 h-16 text-base'
};

export function Card({ 
  suit, 
  rank, 
  isFaceUp = true, 
  isPlayable = false, 
  isSelected = false, 
  onClick,
  className,
  size = 'md'
}: CardProps) {
  if (!isFaceUp) {
    return (
      <div 
        className={cn(
          'bg-gradient-to-br from-blue-900 to-blue-700 rounded-md shadow-md border-2 border-blue-600',
          sizeClasses[size],
          'flex items-center justify-center',
          isPlayable && 'cursor-pointer hover:transform hover:-translate-y-1 transition-transform',
          className
        )}
        onClick={isPlayable ? onClick : undefined}
      >
        <div className="w-full h-full bg-gradient-to-br from-blue-800 to-blue-600 rounded-sm border border-blue-500 flex items-center justify-center">
          <div className="text-blue-300 text-xs font-bold">حکم</div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        'bg-white rounded-md shadow-lg border border-gray-300',
        sizeClasses[size],
        'flex flex-col justify-between p-1',
        isPlayable && 'cursor-pointer hover:transform hover:-translate-y-2 transition-all hover:shadow-xl',
        isSelected && 'ring-2 ring-yellow-400 ring-offset-2 transform -translate-y-2',
        className
      )}
      onClick={isPlayable ? onClick : undefined}
    >
      {/* Top left corner */}
      <div className="flex flex-col items-start">
        <div className={cn('font-bold leading-none', suitColors[suit])}>
          {rank}
        </div>
        <div className={cn('text-xs leading-none', suitColors[suit])}>
          {suitSymbols[suit]}
        </div>
      </div>

      {/* Center symbol */}
      <div className={cn('text-2xl font-bold flex items-center justify-center flex-1', suitColors[suit])}>
        {suitSymbols[suit]}
      </div>

      {/* Bottom right corner (upside down) */}
      <div className="flex flex-col items-end rotate-180">
        <div className={cn('font-bold leading-none', suitColors[suit])}>
          {rank}
        </div>
        <div className={cn('text-xs leading-none', suitColors[suit])}>
          {suitSymbols[suit]}
        </div>
      </div>
    </div>
  );
}