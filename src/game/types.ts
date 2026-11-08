/**
 * Balatro Blackjack Types and Interfaces
 */

export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export type CardEnhancement = 
  | 'none'
  | 'bonus'   // +30 Chips
  | 'mult'    // +4 Mult
  | 'wild'    // Counts as any suit
  | 'glass'   // x2 Mult, 1 in 4 chance to shatter
  | 'steel'   // x1.5 Mult
  | 'gold'    // +$3 when held at end of round
  | 'lucky';  // 1/5 chance for +20 Mult, 1/15 for +$20

export type CardEdition = 
  | 'base'
  | 'foil'        // +50 Chips
  | 'holo'        // +10 Mult
  | 'polychrome'  // x1.5 Mult
  | 'negative';   // Extra slot

export type CardSeal = 'none' | 'red' | 'blue' | 'gold' | 'purple';

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
  enhancement: CardEnhancement;
  edition: CardEdition;
  seal: CardSeal;
  isHidden?: boolean;
  isBroken?: boolean;
  selected?: boolean;
}

export type HandResult = 'pending' | 'win' | 'lose' | 'push' | 'blackjack' | 'surrender';

export interface BlackjackHand {
  id: string;
  cards: Card[];
  bet: number;
  isDoubled: boolean;
  isDone: boolean;
  result: HandResult;
  payoutChips: number;
  payoutCash: number;
  scoreBreakdown?: {
    baseChips: number;
    bonusChips: number;
    baseMult: number;
    bonusMult: number;
    xMult: number;
    totalChips: number;
    totalMult: number;
    finalScore: number;
    luckyTriggered?: boolean;
    glassShattered?: boolean;
  };
}

export type TarotType = 
  | 'the_fool'
  | 'the_magician'
  | 'the_empress'
  | 'the_hierophant'
  | 'the_lovers'
  | 'the_chariot'
  | 'justice'
  | 'the_hermit'
  | 'the_wheel_of_fortune'
  | 'strength'
  | 'the_hanged_man'
  | 'death'
  | 'the_temperance'
  | 'the_devil'
  | 'the_tower'
  | 'the_star'
  | 'the_moon'
  | 'the_sun'
  | 'judgement'
  | 'the_world';

export interface TarotCard {
  id: string;
  type: TarotType;
  name: string;
  romanNumeral: string;
  description: string;
  maxTargets: number; // 0 for instant, 1 or 2 for selecting cards
  cost: number;
  badgeColor: string;
}

export interface Joker {
  id: string;
  name: string;
  rarity: 'common' | 'uncommon' | 'rare';
  description: string;
  chipsBonus?: number;
  multBonus?: number;
  xMultBonus?: number;
  conditionDescription: string;
}

export type GameMode = 'fun' | 'sandbox' | 'learning' | 'classic';

export interface HouseRules {
  dealerHitsSoft17: boolean;
  blackjackPayout: number; // 1.5 for 3:2, 2.0 for 2:1, 1.2 for 6:5
  allowDoubleAfterSplit: boolean;
  allowSurrender: boolean;
  deckCount: number; // 1 to 8
  penetration: number; // 0.5 to 0.85
}

export type BasicStrategyAction = 'HIT' | 'STAND' | 'DOUBLE' | 'SPLIT' | 'SURRENDER';

export interface OddsAnalysis {
  playerValue: number;
  isSoft: boolean;
  canSplit: boolean;
  canDouble: boolean;
  dealerUpcardValue: number;
  dealerUpcardDisplay: string;
  optimalAction: BasicStrategyAction;
  actionExplanation: string;
  bustChanceIfHit: number; // 0 to 100
  twentyOneChanceIfHit: number; // 0 to 100
  dealerBustProbability: number; // 0 to 100
  dealerOutcomes: {
    bust: number;
    seventeen: number;
    eighteen: number;
    nineteen: number;
    twenty: number;
    twentyOne: number;
    blackjack: number;
  };
  evBreakdown: {
    hit: number;
    stand: number;
    double: number;
  };
  cardDistributions: Record<string, { count: number; prob: number }>;
  runningCount: number;
  trueCount: number;
  decksRemaining: number;
}
