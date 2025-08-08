export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | 'K' | 'Q' | 'J' | '10' | '9' | '8' | '7' | '6' | '5' | '4' | '3' | '2';
export type Position = 'north' | 'east' | 'south' | 'west';
export type Team = 'red' | 'black';

export interface Card {
  suit: Suit;
  rank: Rank;
}

export interface Player {
  id: string;
  name: string;
  position: Position;
  isHuman: boolean;
  team: Team;
  hand: Card[];
  tricks: number;
}

export interface GameState {
  players: Player[];
  currentPlayer: Position;
  hokmSuit?: Suit;
  trick: {
    cards: { playerId: string; card: Card }[];
    leader: Position;
  };
  scores: { red: number; black: number };
  round: number;
  gamePhase: 'bidding' | 'playing' | 'finished';
  deck: Card[];
}

export interface GameAction {
  type: 'PLAY_CARD' | 'SET_HOKM' | 'START_NEW_TRICK' | 'END_ROUND';
  payload?: any;
}

export class HokmGame {
  private state: GameState;

  constructor(playerNames: { north: string; east: string; south: string; west: string }) {
    this.state = this.initializeGame(playerNames);
  }

  private initializeGame(playerNames: { north: string; east: string; south: string; west: string }): GameState {
    const deck = this.createDeck();
    const shuffledDeck = this.shuffleDeck(deck);

    const players: Player[] = [
      {
        id: 'north',
        name: playerNames.north,
        position: 'north',
        isHuman: false,
        team: 'red',
        hand: [],
        tricks: 0
      },
      {
        id: 'east',
        name: playerNames.east,
        position: 'east',
        isHuman: false,
        team: 'black',
        hand: [],
        tricks: 0
      },
      {
        id: 'south',
        name: playerNames.south,
        position: 'south',
        isHuman: true,
        team: 'black',
        hand: [],
        tricks: 0
      },
      {
        id: 'west',
        name: playerNames.west,
        position: 'west',
        isHuman: false,
        team: 'red',
        hand: [],
        tricks: 0
      }
    ];

    // Deal 13 cards to each player
    for (let i = 0; i < 52; i++) {
      players[i % 4].hand.push(shuffledDeck[i]);
    }

    // Sort hands
    players.forEach(player => {
      player.hand = this.sortHand(player.hand);
    });

    return {
      players,
      currentPlayer: 'south', // Human player starts
      hokmSuit: undefined,
      trick: {
        cards: [],
        leader: 'south'
      },
      scores: { red: 0, black: 0 },
      round: 1,
      gamePhase: 'bidding',
      deck: shuffledDeck
    };
  }

  private createDeck(): Card[] {
    const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
    const ranks: Rank[] = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'];
    
    const deck: Card[] = [];
    suits.forEach(suit => {
      ranks.forEach(rank => {
        deck.push({ suit, rank });
      });
    });
    
    return deck;
  }

  private shuffleDeck(deck: Card[]): Card[] {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private sortHand(hand: Card[]): Card[] {
    const suitOrder: { [key in Suit]: number } = { spades: 0, hearts: 1, diamonds: 2, clubs: 3 };
    const rankOrder: { [key in Rank]: number } = { 
      'A': 14, 'K': 13, 'Q': 12, 'J': 11, '10': 10, '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2 
    };

    return hand.sort((a, b) => {
      if (suitOrder[a.suit] !== suitOrder[b.suit]) {
        return suitOrder[a.suit] - suitOrder[b.suit];
      }
      return rankOrder[b.rank] - rankOrder[a.rank];
    });
  }

  public getState(): GameState {
    return { ...this.state };
  }

  public setHokmSuit(suit: Suit): void {
    if (this.state.gamePhase !== 'bidding') {
      throw new Error('Cannot set hokm suit during playing phase');
    }
    
    this.state.hokmSuit = suit;
    this.state.gamePhase = 'playing';
    this.state.currentPlayer = this.state.trick.leader;
  }

  public playCard(playerId: string, cardIndex: number): void {
    if (this.state.gamePhase !== 'playing') {
      throw new Error('Game is not in playing phase');
    }

    const player = this.state.players.find(p => p.id === playerId);
    if (!player) {
      throw new Error('Player not found');
    }

    if (player.position !== this.state.currentPlayer) {
      throw new Error('Not player\'s turn');
    }

    if (cardIndex < 0 || cardIndex >= player.hand.length) {
      throw new Error('Invalid card index');
    }

    const card = player.hand[cardIndex];

    // Validate play
    if (!this.isValidPlay(player, card)) {
      throw new Error('Invalid card play');
    }

    // Remove card from player's hand
    player.hand.splice(cardIndex, 1);

    // Add card to trick
    this.state.trick.cards.push({ playerId, card });

    // Move to next player
    this.state.currentPlayer = this.getNextPlayer(this.state.currentPlayer);

    // Check if trick is complete
    if (this.state.trick.cards.length === 4) {
      this.completeTrick();
    }
  }

  private isValidPlay(player: Player, card: Card): boolean {
    const trickCards = this.state.trick.cards;
    
    // First card of the trick - any card can be played
    if (trickCards.length === 0) {
      return true;
    }

    // Get the lead suit
    const leadSuit = trickCards[0].card.suit;
    
    // Check if player has cards of the lead suit
    const hasLeadSuit = player.hand.some(c => c.suit === leadSuit);
    
    // If player has lead suit, must play it
    if (hasLeadSuit) {
      return card.suit === leadSuit;
    }

    // If player doesn't have lead suit, can play any card
    return true;
  }

  private getNextPlayer(position: Position): Position {
    const order: Position[] = ['south', 'west', 'north', 'east'];
    const currentIndex = order.indexOf(position);
    return order[(currentIndex + 1) % 4];
  }

  private completeTrick(): void {
    const winner = this.determineTrickWinner();
    const winnerPlayer = this.state.players.find(p => p.id === winner.playerId);
    
    if (winnerPlayer) {
      winnerPlayer.tricks++;
      
      // Update team scores
      if (winnerPlayer.team === 'red') {
        this.state.scores.red++;
      } else {
        this.state.scores.black++;
      }
    }

    // Start new trick
    this.state.trick = {
      cards: [],
      leader: winnerPlayer?.position || 'south'
    };
    
    this.state.currentPlayer = this.state.trick.leader;

    // Check if round is complete
    if (this.state.players.every(p => p.hand.length === 0)) {
      this.endRound();
    }
  }

  private determineTrickWinner(): { playerId: string; card: Card } {
    const trickCards = this.state.trick.cards;
    const leadSuit = trickCards[0].card.suit;
    const hokmSuit = this.state.hokmSuit;

    let winner = trickCards[0];
    const rankOrder: { [key in Rank]: number } = { 
      'A': 14, 'K': 13, 'Q': 12, 'J': 11, '10': 10, '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2 
    };

    for (let i = 1; i < trickCards.length; i++) {
      const current = trickCards[i];
      
      // Hokm suit always wins
      if (current.card.suit === hokmSuit && winner.card.suit !== hokmSuit) {
        winner = current;
      } else if (current.card.suit === hokmSuit && winner.card.suit === hokmSuit) {
        // Both are hokm, compare ranks
        if (rankOrder[current.card.rank] > rankOrder[winner.card.rank]) {
          winner = current;
        }
      } else if (current.card.suit === leadSuit && winner.card.suit !== hokmSuit) {
        // Neither is hokm, but current follows suit and winner doesn't
        if (winner.card.suit !== leadSuit) {
          winner = current;
        } else {
          // Both follow suit, compare ranks
          if (rankOrder[current.card.rank] > rankOrder[winner.card.rank]) {
            winner = current;
          }
        }
      }
    }

    return winner;
  }

  private endRound(): void {
    this.state.round++;
    
    // Check if game is finished (first to 7 wins)
    if (this.state.scores.red >= 7 || this.state.scores.black >= 7) {
      this.state.gamePhase = 'finished';
    } else {
      // Start new round
      this.startNewRound();
    }
  }

  private startNewRound(): void {
    // Reset for new round
    this.state.players.forEach(player => {
      player.hand = [];
      player.tricks = 0;
    });

    const deck = this.createDeck();
    const shuffledDeck = this.shuffleDeck(deck);

    // Deal new hands
    for (let i = 0; i < 52; i++) {
      this.state.players[i % 4].hand.push(shuffledDeck[i]);
    }

    // Sort hands
    this.state.players.forEach(player => {
      player.hand = this.sortHand(player.hand);
    });

    this.state.deck = shuffledDeck;
    this.state.hokmSuit = undefined;
    this.state.gamePhase = 'bidding';
    this.state.trick = {
      cards: [],
      leader: this.getNextPlayer(this.state.trick.leader) // Rotate leader
    };
    this.state.currentPlayer = this.state.trick.leader;
  }

  public getPlayableCards(playerId: string): Card[] {
    const player = this.state.players.find(p => p.id === playerId);
    if (!player || player.position !== this.state.currentPlayer) {
      return [];
    }

    if (this.state.trick.cards.length === 0) {
      return player.hand; // Can play any card if leading
    }

    const leadSuit = this.state.trick.cards[0].card.suit;
    const leadSuitCards = player.hand.filter(c => c.suit === leadSuit);
    
    return leadSuitCards.length > 0 ? leadSuitCards : player.hand;
  }

  public getCurrentPlayer(): Player | undefined {
    return this.state.players.find(p => p.position === this.state.currentPlayer);
  }

  public getGameStatus(): {
    phase: string;
    currentPlayer: string;
    hokmSuit?: string;
    trickCount: number;
    scores: { red: number; black: number };
    round: number;
  } {
    return {
      phase: this.state.gamePhase,
      currentPlayer: this.state.currentPlayer,
      hokmSuit: this.state.hokmSuit,
      trickCount: this.state.trick.cards.length,
      scores: this.state.scores,
      round: this.state.round
    };
  }
}