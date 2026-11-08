/**
 * Pure Game Rules, Scoring, Basic Strategy and Odds Analysis Engine
 */
import { calculateHandTotal, getCardBlackjackValue, isBlackjack } from './deck';
import {
  BasicStrategyAction,
  BlackjackHand,
  Card,
  HouseRules,
  Joker,
  OddsAnalysis,
} from './types';

export const DEFAULT_RULES: HouseRules = {
  dealerHitsSoft17: false, // Standard Las Vegas / Atlantic City Stand on 17
  blackjackPayout: 1.5,    // 3:2 standard
  allowDoubleAfterSplit: true,
  allowSurrender: true,
  deckCount: 4,
  penetration: 0.75,
};

/**
 * Standard Blackjack Basic Strategy Engine (Mathematically optimal plays)
 */
export function getBasicStrategyRecommendation(
  playerHand: Card[],
  dealerUpcard: Card,
  canDouble = true,
  canSplit = true,
  canSurrender = true
): { action: BasicStrategyAction; explanation: string } {
  const { total, isSoft } = calculateHandTotal(playerHand);
  const upVal = getCardBlackjackValue(dealerUpcard);
  const upName = dealerUpcard.rank === 'A' ? 'Ace' : String(upVal);

  // Check Pairs first
  if (playerHand.length === 2 && canSplit && getCardBlackjackValue(playerHand[0]) === getCardBlackjackValue(playerHand[1])) {
    const pairRank = playerHand[0].rank;

    // Aces and 8s: Always split
    if (pairRank === 'A') {
      return { action: 'SPLIT', explanation: `Always split Aces. Two separate hands starting with an 11 hold the highest expected value in blackjack.` };
    }
    if (pairRank === '8') {
      return { action: 'SPLIT', explanation: `Always split 8s. A total of 16 is the worst hand in blackjack; splitting turns it into two fresh hands starting with 8.` };
    }
    // 10s: Never split
    if (['10', 'J', 'Q', 'K'].includes(pairRank)) {
      return { action: 'STAND', explanation: `Never split 10s. A 20 is already an 88%+ winning hand; splitting risks destroying a dominant position.` };
    }
    // 9s
    if (pairRank === '9') {
      if ([7, 10, 11].includes(upVal)) {
        return { action: 'STAND', explanation: `Stand on 9-9 against dealer ${upName}. The dealer is likely to have 17-20, against which 18 has positive stand value.` };
      }
      return { action: 'SPLIT', explanation: `Split 9s against dealer ${upName}. Dealer shows a vulnerable upcard and you can press an advantage with two 9s.` };
    }
    // 7s
    if (pairRank === '7') {
      if (upVal <= 7) {
        return { action: 'SPLIT', explanation: `Split 7s against dealer ${upName} (2-7). Split when dealer is weak; otherwise hit.` };
      }
      return { action: 'HIT', explanation: `Hit 7-7 against dealer ${upName}. Hand total 14 needs improvement against strong dealer upcard.` };
    }
    // 6s
    if (pairRank === '6') {
      if (upVal >= 3 && upVal <= 6) {
        return { action: 'SPLIT', explanation: `Split 6s against dealer bust cards (3-6) to exploit dealer weakness.` };
      }
      return { action: 'HIT', explanation: `Hit 6-6 against dealer ${upName}. 12 is weak but splitting into 6s against strong cards is worse.` };
    }
    // 5s
    if (pairRank === '5') {
      if (canDouble && upVal <= 9) {
        return { action: 'DOUBLE', explanation: `Double 5-5 (Total 10) against dealer ${upName}. Treat 5-5 as a hard 10, not as a split.` };
      }
      return { action: 'HIT', explanation: `Hit 5-5 (Total 10). Never split 5s.` };
    }
    // 4s
    if (pairRank === '4') {
      if (canDouble && (upVal === 5 || upVal === 6)) {
        return { action: 'SPLIT', explanation: `Split 4s only against dealer 5 or 6 (with DAS active).` };
      }
      return { action: 'HIT', explanation: `Hit 4-4 (Total 8). 8 is a good foundation to draw to.` };
    }
    // 2s and 3s
    if (pairRank === '2' || pairRank === '3') {
      if (upVal >= 2 && upVal <= 7) {
        return { action: 'SPLIT', explanation: `Split 2s/3s against dealer ${upName} (2-7). Exploit dealer's moderate cards.` };
      }
      return { action: 'HIT', explanation: `Hit 2s/3s against dealer ${upName} (8-A).` };
    }
  }

  // Soft Hands (contains an Ace counted as 11)
  if (isSoft) {
    if (total >= 20) {
      return { action: 'STAND', explanation: `Soft ${total} is an elite hand. Never hit or risk a 20 or 21.` };
    }
    if (total === 19) {
      if (canDouble && upVal === 6) {
        return { action: 'DOUBLE', explanation: `Double Soft 19 (A,8) vs dealer 6 to maximize edge against dealer's highest bust card.` };
      }
      return { action: 'STAND', explanation: `Stand on Soft 19 (A,8). 19 is strong enough to win outright without taking extra variance.` };
    }
    if (total === 18) {
      if (canDouble && upVal >= 2 && upVal <= 6) {
        return { action: 'DOUBLE', explanation: `Double Soft 18 against dealer ${upName} (2-6). You have free insurance to take one card with positive EV.` };
      }
      if ([7, 8].includes(upVal)) {
        return { action: 'STAND', explanation: `Stand on Soft 18 vs dealer ${upName}. 18 pushes or beats dealer expected 17 or 18.` };
      }
      return { action: 'HIT', explanation: `Hit Soft 18 against dealer ${upName} (9, 10, A). Dealer will likely finish with 19 or 20; 18 will lose.` };
    }
    if (total === 17) {
      if (canDouble && upVal >= 3 && upVal <= 6) {
        return { action: 'DOUBLE', explanation: `Double Soft 17 against dealer ${upName}. Free card with high upside against weak dealer.` };
      }
      return { action: 'HIT', explanation: `Hit Soft 17. 17 is a weak finishing total; an Ace gives you a free shot to improve.` };
    }
    if (total === 15 || total === 16) {
      if (canDouble && upVal >= 4 && upVal <= 6) {
        return { action: 'DOUBLE', explanation: `Double Soft ${total} vs dealer ${upName} (4-6).` };
      }
      return { action: 'HIT', explanation: `Hit Soft ${total}. You cannot bust on the next card.` };
    }
    if (total === 13 || total === 14) {
      if (canDouble && (upVal === 5 || upVal === 6)) {
        return { action: 'DOUBLE', explanation: `Double Soft ${total} vs dealer 5-6.` };
      }
      return { action: 'HIT', explanation: `Hit Soft ${total}. Cannot bust on a hit; try to draw a 7, 8, or 9.` };
    }
  }

  // Hard Hands
  if (total >= 17) {
    return { action: 'STAND', explanation: `Stand on Hard ${total}. Hitting has a ${Math.round(((total - 11) / 13) * 100)}% chance of busting immediately.` };
  }
  if (total === 16) {
    if (canSurrender && [9, 10, 11].includes(upVal)) {
      return { action: 'SURRENDER', explanation: `Surrender Hard 16 vs dealer ${upName}. Expected loss is ~53%, saving 3% bankroll by surrendering.` };
    }
    if (upVal >= 2 && upVal <= 6) {
      return { action: 'STAND', explanation: `Stand on Hard 16 vs dealer ${upName}. Dealer has a ~${upVal === 5 || upVal === 6 ? '42' : '35'}% chance of busting; don't bust yourself.` };
    }
    return { action: 'HIT', explanation: `Hit Hard 16 vs dealer ${upName}. Hitting is risky (62% bust), but standing against a dealer 7+ has even worse EV.` };
  }
  if (total === 15) {
    if (canSurrender && upVal === 10) {
      return { action: 'SURRENDER', explanation: `Surrender Hard 15 vs dealer 10.` };
    }
    if (upVal >= 2 && upVal <= 6) {
      return { action: 'STAND', explanation: `Stand on Hard 15 vs dealer ${upName}. Let the dealer take the hit and risk busting.` };
    }
    return { action: 'HIT', explanation: `Hit Hard 15 vs dealer ${upName}. Standing against dealer 7+ loses ~75% of the time.` };
  }
  if (total === 13 || total === 14) {
    if (upVal >= 2 && upVal <= 6) {
      return { action: 'STAND', explanation: `Stand on Hard ${total} vs dealer ${upName}. Dealer is in 'bust territory' (2-6).` };
    }
    return { action: 'HIT', explanation: `Hit Hard ${total} vs dealer ${upName}. Must draw to compete against strong dealer upcard.` };
  }
  if (total === 12) {
    if (upVal >= 4 && upVal <= 6) {
      return { action: 'STAND', explanation: `Stand on Hard 12 vs dealer ${upName} (4-6). Dealer has ~40% bust rate; only 10, J, Q, K bust you (30.8%), but standing has higher EV.` };
    }
    return { action: 'HIT', explanation: `Hit Hard 12 vs dealer ${upName}. Dealer 2 or 3 is not weak enough to justify standing on 12.` };
  }
  if (total === 11) {
    if (canDouble && upVal <= 10) {
      return { action: 'DOUBLE', explanation: `Double Down on 11 vs dealer ${upName}. Hand of 11 has the highest probability of hitting 21 (approx 30.7%).` };
    }
    return { action: 'HIT', explanation: `Hit 11. Superb total, aim for a 10-value card.` };
  }
  if (total === 10) {
    if (canDouble && upVal <= 9) {
      return { action: 'DOUBLE', explanation: `Double Down on 10 vs dealer ${upName} (2-9). Double your bet with strong winning expectation.` };
    }
    return { action: 'HIT', explanation: `Hit 10 vs dealer ${upName}. Upcard is too strong to risk a double.` };
  }
  if (total === 9) {
    if (canDouble && upVal >= 3 && upVal <= 6) {
      return { action: 'DOUBLE', explanation: `Double Down on 9 vs dealer ${upName} (3-6). Catch dealer when they are most likely to bust.` };
    }
    return { action: 'HIT', explanation: `Hit 9. Draw another card to build a scoring total.` };
  }

  // 8 or less
  return { action: 'HIT', explanation: `Hit Hard ${total}. Total is too low to stand and you cannot bust.` };
}

/**
 * Computes exact odds from remaining cards in the shoe
 */
export function calculateLiveOdds(
  playerHand: Card[],
  dealerUpcard: Card,
  shoe: Card[],
  canDouble = true,
  canSplit = true,
  canSurrender = true
): OddsAnalysis {
  const { total, isSoft } = calculateHandTotal(playerHand);
  const upVal = getCardBlackjackValue(dealerUpcard);
  const upName = dealerUpcard.rank === 'A' ? 'A' : String(upVal);

  const totalCardsInShoe = shoe.length || 1;
  const cardCounts: Record<string, number> = {};
  for (const card of shoe) {
    const valKey = card.rank === 'A' ? 'A' : ['K', 'Q', 'J', '10'].includes(card.rank) ? '10' : card.rank;
    cardCounts[valKey] = (cardCounts[valKey] || 0) + 1;
  }

  const cardDistributions: Record<string, { count: number; prob: number }> = {};
  const standardRanks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
  for (const r of standardRanks) {
    const count = cardCounts[r] || 0;
    cardDistributions[r] = {
      count,
      prob: Math.round((count / totalCardsInShoe) * 1000) / 10,
    };
  }

  // Calculate bust chance if player hits
  let bustCardCount = 0;
  let twentyOneCardCount = 0;

  for (const card of shoe) {
    const cardVal = getCardBlackjackValue(card);
    if (!isSoft) {
      if (total + (card.rank === 'A' ? 1 : cardVal) > 21) {
        bustCardCount++;
      }
      if (total + (card.rank === 'A' ? 11 : cardVal) === 21 || total + (card.rank === 'A' ? 1 : cardVal) === 21) {
        twentyOneCardCount++;
      }
    } else {
      // Soft total: ace already counted as 11, cannot bust on 1 hit unless total is already 21
      if (total === 21) {
        bustCardCount++;
      }
    }
  }

  const bustChanceIfHit = Math.round((bustCardCount / totalCardsInShoe) * 1000) / 10;
  const twentyOneChanceIfHit = Math.round((twentyOneCardCount / totalCardsInShoe) * 1000) / 10;

  // Approximate dealer outcomes based on standard shoe composition tables
  // Dealer bust probabilities by upcard:
  // 2: 35.3%, 3: 37.5%, 4: 40.2%, 5: 42.8%, 6: 42.0%, 7: 25.9%, 8: 23.8%, 9: 23.3%, 10: 21.4%, A: 11.6%
  const dealerBustMap: Record<number, number> = {
    2: 35.3, 3: 37.5, 4: 40.2, 5: 42.8, 6: 42.0,
    7: 25.9, 8: 23.8, 9: 23.3, 10: 21.4, 11: 11.6
  };
  const dealerBustProbability = dealerBustMap[upVal] || 28.0;

  // Outcome distribution approximation
  const remainingRate = 100 - dealerBustProbability;
  const dealerOutcomes = {
    bust: dealerBustProbability,
    seventeen: Math.round(remainingRate * 0.22 * 10) / 10,
    eighteen: Math.round(remainingRate * 0.23 * 10) / 10,
    nineteen: Math.round(remainingRate * 0.21 * 10) / 10,
    twenty: Math.round(remainingRate * 0.24 * 10) / 10,
    twentyOne: Math.round(remainingRate * 0.10 * 10) / 10,
    blackjack: upVal === 11 || upVal === 10 ? Math.round(remainingRate * 0.18 * 10) / 10 : 0,
  };

  // EV approximations
  const standEV = (dealerBustProbability / 100) - ((100 - dealerBustProbability) / 100) * (total < 17 ? 0.7 : 0.3);
  const hitEV = total >= 17 ? -0.4 : total === 11 ? 0.6 : 0.1;
  const doubleEV = total === 11 || total === 10 ? hitEV * 1.8 : hitEV * 0.5;

  const strategy = getBasicStrategyRecommendation(playerHand, dealerUpcard, canDouble, canSplit, canSurrender);

  // Hi-Lo Count
  let runningCount = 0;
  for (const card of shoe) {
    if (['2', '3', '4', '5', '6'].includes(card.rank)) runningCount -= 1; // Remaining in shoe: if in shoe, hasn't been dealt
    if (['10', 'J', 'Q', 'K', 'A'].includes(card.rank)) runningCount += 1;
  }
  const decksRemaining = Math.max(0.5, Math.round((shoe.length / 52) * 10) / 10);
  const trueCount = Math.round((runningCount / decksRemaining) * 10) / 10;

  return {
    playerValue: total,
    isSoft,
    canSplit,
    canDouble,
    dealerUpcardValue: upVal,
    dealerUpcardDisplay: upName,
    optimalAction: strategy.action,
    actionExplanation: strategy.explanation,
    bustChanceIfHit,
    twentyOneChanceIfHit,
    dealerBustProbability,
    dealerOutcomes,
    evBreakdown: {
      hit: Math.round(hitEV * 100) / 100,
      stand: Math.round(standEV * 100) / 100,
      double: Math.round(doubleEV * 100) / 100,
    },
    cardDistributions,
    runningCount,
    trueCount,
    decksRemaining,
  };
}

/**
 * Balatro-style Scoring Engine (Chips x Mult)
 */
export function calculateBalatroScore(
  hand: BlackjackHand,
  jokers: Joker[],
  shoeLength: number
): {
  baseChips: number;
  bonusChips: number;
  baseMult: number;
  bonusMult: number;
  xMult: number;
  totalChips: number;
  totalMult: number;
  finalScore: number;
  luckyTriggered: boolean;
  glassShattered: boolean;
} {
  const { total, isBust } = calculateHandTotal(hand.cards);
  const isNatBJ = isBlackjack(hand.cards);

  let baseChips = 0;
  let baseMult = 1;

  if (isBust) {
    baseChips = 10;
    baseMult = 0;
  } else if (isNatBJ) {
    baseChips = 150;
    baseMult = 4;
  } else if (total === 21) {
    baseChips = 100;
    baseMult = 3;
  } else if (total === 20) {
    baseChips = 80;
    baseMult = 2;
  } else if (total === 19) {
    baseChips = 70;
    baseMult = 2;
  } else if (total >= 17) {
    baseChips = 60;
    baseMult = 2;
  } else {
    baseChips = 40;
    baseMult = 1;
  }

  let bonusChips = 0;
  let bonusMult = 0;
  let xMult = 1.0;
  let luckyTriggered = false;
  let glassShattered = false;

  // Process Card Enhancements and Editions
  for (const card of hand.cards) {
    if (card.isBroken) continue;

    // Enhancement
    if (card.enhancement === 'bonus') {
      bonusChips += 30;
    } else if (card.enhancement === 'mult') {
      bonusMult += 4;
    } else if (card.enhancement === 'glass') {
      xMult *= 2.0;
      if (Math.random() < 0.25) {
        glassShattered = true;
        card.isBroken = true;
      }
    } else if (card.enhancement === 'steel') {
      xMult *= 1.5;
    } else if (card.enhancement === 'lucky') {
      if (Math.random() < 0.20) {
        bonusMult += 20;
        luckyTriggered = true;
      }
    }

    // Edition
    if (card.edition === 'foil') {
      bonusChips += 50;
    } else if (card.edition === 'holo') {
      bonusMult += 10;
    } else if (card.edition === 'polychrome') {
      xMult *= 1.5;
    }
  }

  // Process Jokers
  const isPair = hand.cards.length >= 2 && hand.cards[0].rank === hand.cards[1].rank;
  const fibonacciRanks = ['2', '3', '5', '8', 'A'];

  for (const joker of jokers) {
    if (joker.id.startsWith('joker-basic')) {
      bonusMult += 4;
    } else if (joker.id.startsWith('joker-jolly') && isPair) {
      bonusMult += 8;
    } else if (joker.id.startsWith('joker-banner')) {
      const depthBonus = Math.floor(shoeLength / 10) * 20;
      bonusChips += depthBonus;
    } else if (joker.id.startsWith('joker-fibonacci')) {
      for (const card of hand.cards) {
        if (fibonacciRanks.includes(card.rank)) {
          bonusMult += 8;
        }
      }
    } else if (joker.id.startsWith('joker-baron')) {
      for (const card of hand.cards) {
        if (card.rank === 'K') {
          xMult *= 1.5;
        }
      }
    } else if (joker.id.startsWith('joker-blackboard')) {
      const allDark = hand.cards.every(c => c.suit === 'spades' || c.suit === 'clubs');
      if (allDark) {
        xMult *= 3.0;
      }
    } else if (joker.id.startsWith('joker-greedy')) {
      for (const c of hand.cards) if (c.suit === 'diamonds') bonusMult += 4;
    } else if (joker.id.startsWith('joker-lusty')) {
      for (const c of hand.cards) if (c.suit === 'hearts') bonusMult += 4;
    } else if (joker.id.startsWith('joker-wrathful')) {
      for (const c of hand.cards) if (c.suit === 'spades') bonusMult += 4;
    } else if (joker.id.startsWith('joker-gluttonous')) {
      for (const c of hand.cards) if (c.suit === 'clubs') bonusMult += 4;
    }
  }

  const totalChips = baseChips + bonusChips;
  const totalMult = Math.round((baseMult + bonusMult) * xMult * 10) / 10;
  const finalScore = Math.round(totalChips * totalMult);

  return {
    baseChips,
    bonusChips,
    baseMult,
    bonusMult,
    xMult,
    totalChips,
    totalMult,
    finalScore,
    luckyTriggered,
    glassShattered,
  };
}
