import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateHandTotal, isBlackjack, canSplitHand } from './deck';
import { getBasicStrategyRecommendation, calculateBalatroScore, calculateLiveOdds } from './rules';
import { Card, Joker } from './types';

function makeCard(rank: Card['rank'], suit: Card['suit'] = 'spades', enhancement: Card['enhancement'] = 'none', edition: Card['edition'] = 'base'): Card {
  return {
    id: `test-${rank}-${suit}-${Math.random()}`,
    rank,
    suit,
    enhancement,
    edition,
    seal: 'none',
  };
}

test('calculateHandTotal correctly handles hard and soft hands', () => {
  // Hard hand: 10 + 6 = 16
  const hand1 = [makeCard('10'), makeCard('6')];
  const res1 = calculateHandTotal(hand1);
  assert.equal(res1.total, 16);
  assert.equal(res1.isSoft, false);
  assert.equal(res1.isBust, false);

  // Soft hand: Ace + 7 = 18 (Soft 18)
  const hand2 = [makeCard('A'), makeCard('7')];
  const res2 = calculateHandTotal(hand2);
  assert.equal(res2.total, 18);
  assert.equal(res2.isSoft, true);
  assert.equal(res2.isBust, false);

  // Multiple aces: Ace + Ace + 9 = 21 (11 + 1 + 9)
  const hand3 = [makeCard('A'), makeCard('A'), makeCard('9')];
  const res3 = calculateHandTotal(hand3);
  assert.equal(res3.total, 21);
  assert.equal(res3.isSoft, true);
  assert.equal(res3.isBust, false);

  // Bust: 10 + 6 + 7 = 23
  const hand4 = [makeCard('10'), makeCard('6'), makeCard('7')];
  const res4 = calculateHandTotal(hand4);
  assert.equal(res4.total, 23);
  assert.equal(res4.isBust, true);
});

test('isBlackjack identifies natural blackjack', () => {
  assert.equal(isBlackjack([makeCard('A'), makeCard('K')]), true);
  assert.equal(isBlackjack([makeCard('10'), makeCard('A')]), true);
  assert.equal(isBlackjack([makeCard('10'), makeCard('9')]), false);
  assert.equal(isBlackjack([makeCard('A'), makeCard('5'), makeCard('5')]), false); // 21 but 3 cards
});

test('canSplitHand detects pairs correctly', () => {
  assert.equal(canSplitHand([makeCard('8', 'spades'), makeCard('8', 'hearts')]), true);
  assert.equal(canSplitHand([makeCard('10'), makeCard('K')]), true); // 10-value cards match
  assert.equal(canSplitHand([makeCard('7'), makeCard('8')]), false);
});

test('Basic Strategy recommends mathematically correct actions', () => {
  // Always split Aces
  const splitAces = getBasicStrategyRecommendation(
    [makeCard('A'), makeCard('A')],
    makeCard('6')
  );
  assert.equal(splitAces.action, 'SPLIT');

  // Always split 8s
  const splitEights = getBasicStrategyRecommendation(
    [makeCard('8'), makeCard('8')],
    makeCard('10')
  );
  assert.equal(splitEights.action, 'SPLIT');

  // Never split 10s
  const standTens = getBasicStrategyRecommendation(
    [makeCard('10'), makeCard('10')],
    makeCard('5')
  );
  assert.equal(standTens.action, 'STAND');

  // Double 11 against dealer 6
  const doubleEleven = getBasicStrategyRecommendation(
    [makeCard('6'), makeCard('5')],
    makeCard('6')
  );
  assert.equal(doubleEleven.action, 'DOUBLE');

  // Stand on Hard 17
  const standSeventeen = getBasicStrategyRecommendation(
    [makeCard('10'), makeCard('7')],
    makeCard('10')
  );
  assert.equal(standSeventeen.action, 'STAND');

  // Stand on Hard 12 vs dealer 5
  const standTwelve = getBasicStrategyRecommendation(
    [makeCard('8'), makeCard('4')],
    makeCard('5')
  );
  assert.equal(standTwelve.action, 'STAND');

  // Hit on Hard 12 vs dealer 2
  const hitTwelve = getBasicStrategyRecommendation(
    [makeCard('8'), makeCard('4')],
    makeCard('2')
  );
  assert.equal(hitTwelve.action, 'HIT');
});

test('calculateBalatroScore accurately computes Chips x Mult with Jokers', () => {
  const hand = {
    id: 'h1',
    cards: [
      makeCard('10', 'spades', 'bonus', 'foil'), // +30 Chips (bonus), +50 Chips (foil)
      makeCard('A', 'spades', 'mult', 'holo'),    // +4 Mult (mult), +10 Mult (holo)
    ],
    bet: 50,
    isDoubled: false,
    isDone: true,
    result: 'blackjack' as const,
    payoutChips: 0,
    payoutCash: 0,
  };

  const jokers: Joker[] = [
    {
      id: 'joker-basic-1',
      name: 'Joker',
      rarity: 'common',
      description: '+4 Mult',
      multBonus: 4,
      conditionDescription: 'Flat +4',
    },
    {
      id: 'joker-wrathful-1',
      name: 'Wrathful Joker',
      rarity: 'common',
      description: '+4 Mult for spades',
      multBonus: 4,
      conditionDescription: 'Spades +4',
    },
  ];

  const score = calculateBalatroScore(hand, jokers, 100);

  // Base chips for Blackjack = 150
  // Bonus chips = 30 (bonus card) + 50 (foil card) = 80
  // Total chips = 230
  assert.equal(score.baseChips, 150);
  assert.equal(score.bonusChips, 80);
  assert.equal(score.totalChips, 230);

  // Base mult for Blackjack = 4
  // Card mult = 4 (mult card) + 10 (holo card) = 14
  // Joker mult = 4 (basic) + 8 (2 spades * 4) = 12
  // Total mult = 4 + 14 + 12 = 30
  assert.equal(score.baseMult, 4);
  assert.equal(score.totalMult, 30);

  // Final score = 230 * 30 = 6,900
  assert.equal(score.finalScore, 6900);
});

test('calculateLiveOdds computes bust chance and dealer outcomes', () => {
  const playerHand = [makeCard('10'), makeCard('6')]; // Hard 16
  const dealerUpcard = makeCard('6');
  // Shoe with 10 cards: five 10s (bust) and five 5s (safe)
  const mockShoe: Card[] = [
    makeCard('10'), makeCard('10'), makeCard('10'), makeCard('10'), makeCard('10'),
    makeCard('5'), makeCard('5'), makeCard('5'), makeCard('5'), makeCard('5'),
  ];

  const odds = calculateLiveOdds(playerHand, dealerUpcard, mockShoe);

  assert.equal(odds.playerValue, 16);
  assert.equal(odds.isSoft, false);
  assert.equal(odds.dealerUpcardValue, 6);
  assert.equal(odds.bustChanceIfHit, 50); // 5 out of 10 bust
  assert.equal(odds.optimalAction, 'STAND'); // Stand on 16 vs 6
});
