/**
 * Deck & Shoe Management for Balatro Blackjack
 */
import { Card, CardEdition, CardEnhancement, CardSeal, Rank, Suit } from './types';

export const SUITS: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
export const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export function createStandardDeck(idPrefix = 'c'): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        id: `${idPrefix}-${suit}-${rank}-${Math.random().toString(36).substring(2, 7)}`,
        suit,
        rank,
        enhancement: 'none',
        edition: 'base',
        seal: 'none',
      });
    }
  }
  return deck;
}

export function createShoe(deckCount = 4, customModifiers?: {
  defaultEnhancement?: CardEnhancement;
  defaultEdition?: CardEdition;
  richTens?: boolean;
  richAces?: boolean;
}): Card[] {
  const shoe: Card[] = [];
  for (let d = 0; d < deckCount; d++) {
    const singleDeck = createStandardDeck(`d${d}`);
    for (const card of singleDeck) {
      if (customModifiers?.defaultEnhancement) {
        card.enhancement = customModifiers.defaultEnhancement;
      }
      if (customModifiers?.defaultEdition) {
        card.edition = customModifiers.defaultEdition;
      }
      shoe.push(card);
    }
  }

  // Extra rich modes for laboratory
  if (customModifiers?.richTens) {
    for (let i = 0; i < 20; i++) {
      shoe.push({
        id: `bonus-10-${i}`,
        suit: SUITS[i % 4],
        rank: '10',
        enhancement: 'bonus',
        edition: 'foil',
        seal: 'none',
      });
    }
  }
  if (customModifiers?.richAces) {
    for (let i = 0; i < 12; i++) {
      shoe.push({
        id: `bonus-ace-${i}`,
        suit: SUITS[i % 4],
        rank: 'A',
        enhancement: 'mult',
        edition: 'holo',
        seal: 'none',
      });
    }
  }

  return shuffleCards(shoe);
}

export function shuffleCards(cards: Card[]): Card[] {
  const copy = [...cards];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function getCardBlackjackValue(card: Card): number {
  if (card.rank === 'A') return 11;
  if (['K', 'Q', 'J', '10'].includes(card.rank)) return 10;
  return parseInt(card.rank, 10);
}

export function calculateHandTotal(cards: Card[]): { total: number; isSoft: boolean; isBust: boolean } {
  let total = 0;
  let aces = 0;

  for (const card of cards) {
    if (card.isHidden || card.isBroken) continue;
    if (card.rank === 'A') {
      aces++;
      total += 11;
    } else if (['K', 'Q', 'J', '10'].includes(card.rank)) {
      total += 10;
    } else {
      total += parseInt(card.rank, 10);
    }
  }

  // Adjust for soft aces
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }

  const isSoft = aces > 0 && total <= 21;
  const isBust = total > 21;

  return { total, isSoft, isBust };
}

export function isBlackjack(cards: Card[]): boolean {
  if (cards.length !== 2) return false;
  const hasAce = cards.some(c => c.rank === 'A');
  const hasTen = cards.some(c => ['10', 'J', 'Q', 'K'].includes(c.rank));
  return hasAce && hasTen;
}

export function canSplitHand(cards: Card[]): boolean {
  if (cards.length !== 2) return false;
  const val1 = getCardBlackjackValue(cards[0]);
  const val2 = getCardBlackjackValue(cards[1]);
  return val1 === val2;
}

export function getHiLoCountDelta(card: Card): number {
  if (['2', '3', '4', '5', '6'].includes(card.rank)) {
    return +1;
  }
  if (['7', '8', '9'].includes(card.rank)) {
    return 0;
  }
  // 10, J, Q, K, A
  return -1;
}
