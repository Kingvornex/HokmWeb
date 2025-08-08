import { Card, Suit, Position, GameState } from './hokm-game';

export class HokmAI {
  private difficulty: 'easy' | 'medium' | 'hard';

  constructor(difficulty: 'easy' | 'medium' | 'hard' = 'medium') {
    this.difficulty = difficulty;
  }

  public selectCard(gameState: GameState, playerPosition: Position): number {
    const player = gameState.players.find(p => p.position === playerPosition);
    if (!player || player.hand.length === 0) {
      return 0;
    }

    const trickCards = gameState.trick.cards;
    const hokmSuit = gameState.hokmSuit;

    // Get playable cards
    let playableCards = player.hand;
    if (trickCards.length > 0) {
      const leadSuit = trickCards[0].card.suit;
      const leadSuitCards = player.hand.filter(c => c.suit === leadSuit);
      playableCards = leadSuitCards.length > 0 ? leadSuitCards : player.hand;
    }

    switch (this.difficulty) {
      case 'easy':
        return this.selectEasyCard(playableCards, gameState, playerPosition);
      case 'medium':
        return this.selectMediumCard(playableCards, gameState, playerPosition);
      case 'hard':
        return this.selectHardCard(playableCards, gameState, playerPosition);
      default:
        return this.selectMediumCard(playableCards, gameState, playerPosition);
    }
  }

  private selectEasyCard(playableCards: Card[], gameState: GameState, playerPosition: Position): number {
    // Easy AI: Play random card
    const randomIndex = Math.floor(Math.random() * playableCards.length);
    return gameState.players.find(p => p.position === playerPosition)!.hand.indexOf(playableCards[randomIndex]);
  }

  private selectMediumCard(playableCards: Card[], gameState: GameState, playerPosition: Position): number {
    const player = gameState.players.find(p => p.position === playerPosition)!;
    const trickCards = gameState.trick.cards;
    const hokmSuit = gameState.hokmSuit;

    // If leading the trick
    if (trickCards.length === 0) {
      // Lead with a medium-high card, but not the highest
      const nonHokmCards = playableCards.filter(c => c.suit !== hokmSuit);
      const cardsToConsider = nonHokmCards.length > 0 ? nonHokmCards : playableCards;
      
      // Sort by rank (descending)
      const sortedCards = this.sortCardsByRank(cardsToConsider);
      
      // Choose a card from the middle range
      const middleIndex = Math.floor(sortedCards.length / 2);
      const selectedCard = sortedCards[Math.max(0, middleIndex - 1)];
      
      return player.hand.indexOf(selectedCard);
    }

    // If following
    const leadSuit = trickCards[0].card.suit;
    const currentWinner = this.getCurrentTrickWinner(trickCards, hokmSuit);
    
    // If we're currently winning, play low
    if (currentWinner.playerId === player.id) {
      const lowestCard = this.getLowestCard(playableCards);
      return player.hand.indexOf(lowestCard);
    }

    // Try to win the trick
    const winningCard = this.getWinningCard(playableCards, trickCards, hokmSuit);
    if (winningCard) {
      return player.hand.indexOf(winningCard);
    }

    // Can't win, play lowest card
    const lowestCard = this.getLowestCard(playableCards);
    return player.hand.indexOf(lowestCard);
  }

  private selectHardCard(playableCards: Card[], gameState: GameState, playerPosition: Position): number {
    const player = gameState.players.find(p => p.position === playerPosition)!;
    const trickCards = gameState.trick.cards;
    const hokmSuit = gameState.hokmSuit;
    const scores = gameState.scores;

    // Advanced strategy based on game state
    const isWinning = scores.red >= 6 || scores.black >= 6;
    const isLosing = scores.red <= 1 || scores.black <= 1;

    // If leading the trick
    if (trickCards.length === 0) {
      return this.selectLeadingCard(playableCards, gameState, playerPosition, isWinning, isLosing);
    }

    // If following
    return this.selectFollowingCard(playableCards, gameState, playerPosition, isWinning, isLosing);
  }

  private selectLeadingCard(
    playableCards: Card[], 
    gameState: GameState, 
    playerPosition: Position,
    isWinning: boolean,
    isLosing: boolean
  ): number {
    const player = gameState.players.find(p => p.position === playerPosition)!;
    const hokmSuit = gameState.hokmSuit;
    
    // Count cards in each suit
    const suitCounts = this.countSuits(player.hand);
    
    // If we're winning significantly, play conservatively
    if (isWinning) {
      // Lead with a safe card from our longest suit
      const longestSuit = this.getLongestSuit(suitCounts, hokmSuit);
      const suitCards = playableCards.filter(c => c.suit === longestSuit);
      const sortedCards = this.sortCardsByRank(suitCards);
      const selectedCard = sortedCards[Math.floor(sortedCards.length / 2)]; // Middle card
      return player.hand.indexOf(selectedCard);
    }

    // If we're losing significantly, take risks
    if (isLosing) {
      // Try to lead with high cards to win tricks
      const highCards = playableCards.filter(c => this.isHighCard(c));
      if (highCards.length > 0) {
        const highestCard = this.getHighestCard(highCards);
        return player.hand.indexOf(highestCard);
      }
    }

    // Normal play: lead with medium-high card from non-hokm suit
    const nonHokmCards = playableCards.filter(c => c.suit !== hokmSuit);
    if (nonHokmCards.length > 0) {
      const sortedCards = this.sortCardsByRank(nonHokmCards);
      const selectedCard = sortedCards[Math.min(2, sortedCards.length - 1)]; // 3rd highest or highest
      return player.hand.indexOf(selectedCard);
    }

    // Only have hokm cards
    const sortedCards = this.sortCardsByRank(playableCards);
    const selectedCard = sortedCards[Math.floor(sortedCards.length / 2)];
    return player.hand.indexOf(selectedCard);
  }

  private selectFollowingCard(
    playableCards: Card[], 
    gameState: GameState, 
    playerPosition: Position,
    isWinning: boolean,
    isLosing: boolean
  ): number {
    const player = gameState.players.find(p => p.position === playerPosition)!;
    const trickCards = gameState.trick.cards;
    const hokmSuit = gameState.hokmSuit;
    
    const currentWinner = this.getCurrentTrickWinner(trickCards, hokmSuit);
    const isPartnerWinning = this.arePartners(playerPosition, currentWinner.playerId, gameState);
    
    // If partner is winning, play low
    if (isPartnerWinning) {
      const lowestCard = this.getLowestCard(playableCards);
      return player.hand.indexOf(lowestCard);
    }

    // If we're winning, play low to conserve high cards
    if (currentWinner.playerId === player.id) {
      const lowestCard = this.getLowestCard(playableCards);
      return player.hand.indexOf(lowestCard);
    }

    // Try to win if it's important
    const shouldTryToWin = this.shouldTryToWinTrick(gameState, playerPosition, isWinning, isLosing);
    
    if (shouldTryToWin) {
      const winningCard = this.getWinningCard(playableCards, trickCards, hokmSuit);
      if (winningCard) {
        return player.hand.indexOf(winningCard);
      }
    }

    // Can't or shouldn't win, play lowest card
    const lowestCard = this.getLowestCard(playableCards);
    return player.hand.indexOf(lowestCard);
  }

  // Helper methods
  private sortCardsByRank(cards: Card[]): Card[] {
    const rankOrder: { [key: string]: number } = { 
      'A': 14, 'K': 13, 'Q': 12, 'J': 11, '10': 10, '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2 
    };
    
    return [...cards].sort((a, b) => rankOrder[b.rank] - rankOrder[a.rank]);
  }

  private getHighestCard(cards: Card[]): Card {
    return this.sortCardsByRank(cards)[0];
  }

  private getLowestCard(cards: Card[]): Card {
    const sorted = this.sortCardsByRank(cards);
    return sorted[sorted.length - 1];
  }

  private getCurrentTrickWinner(trickCards: { playerId: string; card: Card }[], hokmSuit?: Suit) {
    if (trickCards.length === 0) return { playerId: '', card: { suit: 'hearts', rank: '2' } };
    
    let winner = trickCards[0];
    const rankOrder: { [key: string]: number } = { 
      'A': 14, 'K': 13, 'Q': 12, 'J': 11, '10': 10, '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2 
    };

    for (let i = 1; i < trickCards.length; i++) {
      const current = trickCards[i];
      
      if (hokmSuit && current.card.suit === hokmSuit && winner.card.suit !== hokmSuit) {
        winner = current;
      } else if (hokmSuit && current.card.suit === hokmSuit && winner.card.suit === hokmSuit) {
        if (rankOrder[current.card.rank] > rankOrder[winner.card.rank]) {
          winner = current;
        }
      } else if (current.card.suit === winner.card.suit) {
        if (rankOrder[current.card.rank] > rankOrder[winner.card.rank]) {
          winner = current;
        }
      }
    }

    return winner;
  }

  private getWinningCard(playableCards: Card[], trickCards: { playerId: string; card: Card }[], hokmSuit?: Suit): Card | null {
    const currentWinner = this.getCurrentTrickWinner(trickCards, hokmSuit);
    const rankOrder: { [key: string]: number } = { 
      'A': 14, 'K': 13, 'Q': 12, 'J': 11, '10': 10, '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2 
    };

    for (const card of playableCards) {
      if (hokmSuit && card.suit === hokmSuit && currentWinner.card.suit !== hokmSuit) {
        return card;
      } else if (hokmSuit && card.suit === hokmSuit && currentWinner.card.suit === hokmSuit) {
        if (rankOrder[card.rank] > rankOrder[currentWinner.card.rank]) {
          return card;
        }
      } else if (card.suit === currentWinner.card.suit) {
        if (rankOrder[card.rank] > rankOrder[currentWinner.card.rank]) {
          return card;
        }
      }
    }

    return null;
  }

  private countSuits(hand: Card[]): { [key in Suit]?: number } {
    const counts: { [key in Suit]?: number } = {};
    hand.forEach(card => {
      counts[card.suit] = (counts[card.suit] || 0) + 1;
    });
    return counts;
  }

  private getLongestSuit(suitCounts: { [key in Suit]?: number }, hokmSuit?: Suit): Suit {
    let maxCount = 0;
    let longestSuit: Suit = 'hearts';
    
    Object.entries(suitCounts).forEach(([suit, count]) => {
      if (count && count > maxCount && suit !== hokmSuit) {
        maxCount = count;
        longestSuit = suit as Suit;
      }
    });
    
    return longestSuit;
  }

  private isHighCard(card: Card): boolean {
    const highRanks: Rank[] = ['A', 'K', 'Q', 'J'];
    return highRanks.includes(card.rank);
  }

  private arePartners(position1: Position, playerId2: string, gameState: GameState): boolean {
    const player2 = gameState.players.find(p => p.id === playerId2);
    if (!player2) return false;
    
    const player1 = gameState.players.find(p => p.position === position1);
    if (!player1) return false;
    
    return player1.team === player2.team;
  }

  private shouldTryToWinTrick(gameState: GameState, playerPosition: Position, isWinning: boolean, isLosing: boolean): boolean {
    // Always try to win if we're losing significantly
    if (isLosing) return true;
    
    // Be more conservative if we're winning
    if (isWinning) return false;
    
    // Check how many high cards are left
    const player = gameState.players.find(p => p.position === playerPosition)!;
    const highCards = player.hand.filter(c => this.isHighCard(c));
    
    // If we have many high cards, we can afford to win this trick
    return highCards.length >= 3;
  }
}