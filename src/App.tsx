/**
 * Balatro Blackjack Main Application
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BalatroBackground } from './components/BalatroBackground';
import { CrtOverlay } from './components/CrtOverlay';
import { MainMenu } from './components/MainMenu';
import { PlayingCard } from './components/PlayingCard';
import { TarotCardView } from './components/TarotCardView';
import { JokerCardView } from './components/JokerCardView';
import { OddsAdvisorPanel } from './components/OddsAdvisorPanel';
import { SandboxInspector } from './components/SandboxInspector';
import { ScoreTallyOverlay } from './components/ScoreTallyOverlay';
import { TutorialModal } from './components/TutorialModal';
import { VolumeControlModal } from './components/VolumeControlModal';
import { sound } from './game/audio';
import {
  canSplitHand,
  calculateHandTotal,
  createShoe,
  isBlackjack,
  getCardBlackjackValue,
} from './game/deck';
import {
  DEFAULT_RULES,
  calculateBalatroScore,
  calculateLiveOdds,
  getBasicStrategyRecommendation,
} from './game/rules';
import {
  BlackjackHand,
  Card,
  GameMode,
  HouseRules,
  Joker,
  OddsAnalysis,
  TarotCard,
  TarotType,
} from './game/types';
import {
  TAROT_CATALOG,
  createTarotInstance,
  getRandomJoker,
  getRandomTarot,
} from './game/tarotData';

export default function App() {
  // Screen and Mode
  const [screen, setScreen] = useState<'menu' | 'playing'>('menu');
  const [gameMode, setGameMode] = useState<GameMode>('fun');

  // Modals & Guided Walkthroughs
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('balatro_tutorial_seen') !== 'true';
    }
    return false;
  });
  const [showVolumeModal, setShowVolumeModal] = useState<boolean>(false);

  // Audio & Display
  const [soundMuted, setSoundMuted] = useState<boolean>(sound.getMuted());
  const [crtEnabled, setCrtEnabled] = useState<boolean>(true);

  // Bankroll & Rules
  const [cash, setCash] = useState<number>(100);
  const [infiniteMoney, setInfiniteMoney] = useState<boolean>(false);
  const [currentBet, setCurrentBet] = useState<number>(10);
  const [roundNumber, setRoundNumber] = useState<number>(1);
  const [rules, setRules] = useState<HouseRules>(DEFAULT_RULES);

  // Deck & Hands
  const [shoe, setShoe] = useState<Card[]>(() => createShoe(DEFAULT_RULES.deckCount));
  const [dealerCards, setDealerCards] = useState<Card[]>([]);
  const [playerHands, setPlayerHands] = useState<BlackjackHand[]>([]);
  const [activeHandIndex, setActiveHandIndex] = useState<number>(0);
  const [handPhase, setHandPhase] = useState<'betting' | 'playerTurn' | 'dealerTurn' | 'scored'>('betting');

  // Inventories (Tarot & Jokers)
  const [tarotInventory, setTarotInventory] = useState<TarotCard[]>([]);
  const [jokersInventory, setJokersInventory] = useState<Joker[]>([]);
  const [lastUsedTarot, setLastUsedTarot] = useState<TarotType | null>(null);

  // Selected card IDs for Tarot target selection
  const [selectedCardIds, setSelectedCardIds] = useState<Set<string>>(new Set());

  // Panels & Shop
  const [showSandboxInspector, setShowSandboxInspector] = useState<boolean>(false);
  const [showOddsAdvisor, setShowOddsAdvisor] = useState<boolean>(false);
  const [showShop, setShowShop] = useState<boolean>(false);
  const [tallyHand, setTallyHand] = useState<BlackjackHand | null>(null);

  // Infinite Classic Blackjack State & Stats
  const [classicStats, setClassicStats] = useState({
    handsPlayed: 0,
    wins: 0,
    losses: 0,
    pushes: 0,
    currentStreak: 0,
  });
  const [classicResultBanner, setClassicResultBanner] = useState<{
    type: 'win' | 'lose' | 'push' | 'blackjack' | 'surrender';
    title: string;
    detail: string;
    netCash: number;
  } | null>(null);

  // Floating notifications for shoe reshuffles & chip rebuys
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  }, []);

  const handleReloadChips = useCallback((amount = 500) => {
    sound.playChip();
    setCash((c) => c + amount);
    showToast(`🏦 Reloaded +$${amount} chips!`);
  }, [showToast]);

  const handleManualReshuffle = useCallback(() => {
    sound.playCardDeal();
    setShoe(createShoe(rules.deckCount || 4));
    showToast(`🔄 Shoe Reshuffled: ${rules.deckCount || 4} Fresh Decks (208 cards)`);
  }, [rules.deckCount, showToast]);

  // Check URL parameters for autostart
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') {
        handleStartGame('fun');
      }
    }
  }, []);

  // Update body dataset state for ultra mode compliance
  useEffect(() => {
    if (screen === 'menu') {
      document.body.dataset.state = 'title';
    } else {
      document.body.dataset.state = 'playing';
    }
  }, [screen]);

  // Handle keyboard shortcuts (Enter/Space to start or next hand, H/S/D/P for actions)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;

      if (e.code === 'Space' || e.code === 'Enter') {
        if (screen === 'menu') {
          e.preventDefault();
          handleStartGame('classic');
        } else if (tallyHand) {
          e.preventDefault();
          handleDismissTally();
        } else if (handPhase === 'betting' || (handPhase === 'scored' && gameMode === 'classic')) {
          e.preventDefault();
          handleDeal();
        }
      } else if (screen === 'playing' && handPhase === 'playerTurn') {
        if (e.key.toLowerCase() === 'h') {
          handleHit();
        } else if (e.key.toLowerCase() === 's') {
          handleStand();
        } else if (e.key.toLowerCase() === 'd') {
          handleDouble();
        } else if (e.key.toLowerCase() === 'p') {
          handleSplit();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const handleToggleSound = () => {
    const isMuted = sound.toggleMute();
    setSoundMuted(isMuted);
  };

  const handleToggleCrt = () => {
    setCrtEnabled((prev) => !prev);
  };

  const handleStartGame = (mode: GameMode) => {
    setGameMode(mode);
    setScreen('playing');
    document.body.dataset.state = 'playing';

    // Seed initial inventory based on mode
    if (mode === 'classic') {
      setTarotInventory([]);
      setJokersInventory([]);
      setShowOddsAdvisor(false);
      setShowSandboxInspector(false);
    } else if (mode === 'fun') {
      setTarotInventory([createTarotInstance('the_magician'), createTarotInstance('the_empress')]);
      setJokersInventory([getRandomJoker()]);
      setShowOddsAdvisor(false);
      setShowSandboxInspector(false);
    } else if (mode === 'sandbox') {
      setTarotInventory([createTarotInstance('the_wheel_of_fortune'), createTarotInstance('the_fool')]);
      setJokersInventory([getRandomJoker(), getRandomJoker()]);
      setShowSandboxInspector(true);
      setShowOddsAdvisor(false);
    } else if (mode === 'learning') {
      setTarotInventory([createTarotInstance('the_hierophant')]);
      setJokersInventory([]);
      setShowOddsAdvisor(true);
      setShowSandboxInspector(false);
    }
  };

  const handleResetShoeWithPreset = (preset: 'standard' | 'tens' | 'aces' | 'foil' | 'chaos') => {
    sound.playChip();
    let newShoe: Card[] = [];
    if (preset === 'standard') {
      newShoe = createShoe(rules.deckCount);
    } else if (preset === 'tens') {
      newShoe = createShoe(rules.deckCount, { richTens: true, defaultEnhancement: 'bonus' });
    } else if (preset === 'aces') {
      newShoe = createShoe(rules.deckCount, { richAces: true, defaultEdition: 'holo' });
    } else if (preset === 'foil') {
      newShoe = createShoe(rules.deckCount, { defaultEdition: 'foil' });
    } else if (preset === 'chaos') {
      newShoe = createShoe(rules.deckCount);
      const enhancements = ['bonus', 'mult', 'glass', 'steel', 'gold', 'lucky'] as const;
      const editions = ['foil', 'holo', 'polychrome'] as const;
      for (const c of newShoe) {
        if (Math.random() < 0.4) {
          c.enhancement = enhancements[Math.floor(Math.random() * enhancements.length)];
        }
        if (Math.random() < 0.3) {
          c.edition = editions[Math.floor(Math.random() * editions.length)];
        }
      }
    }
    setShoe(newShoe);
  };

  /**
   * DEAL INITIAL ROUND
   */
  const handleDeal = () => {
    if (handPhase !== 'betting' && handPhase !== 'scored') return;

    // Clear classic result banner
    setClassicResultBanner(null);

    // Auto-reload chips if insufficient so normal blackjack can be played infinitely!
    if (!infiniteMoney && cash < currentBet) {
      const reloadAmount = Math.max(500, currentBet * 10);
      setCash((c) => c + reloadAmount);
      sound.playChip();
      showToast(`🏦 Auto-Reload: +$${reloadAmount} free chips added!`);
    }

    // Deduct bet if not infinite
    if (!infiniteMoney) {
      setCash((c) => Math.max(0, c - currentBet));
    }

    sound.playCardDeal();

    // Ensure shoe has enough cards (at least 24 cards; otherwise automatically reshuffle)
    let currentShoe = [...shoe];
    if (currentShoe.length < 24) {
      currentShoe = createShoe(rules.deckCount || 4);
      showToast(`🔄 Shoe Reshuffled: ${rules.deckCount || 4} Fresh Decks (208 cards)`);
    }

    // Draw player card 1, dealer card 1, player card 2, dealer card 2 (hidden)
    const p1 = currentShoe.pop()!;
    const d1 = currentShoe.pop()!;
    const p2 = currentShoe.pop()!;
    const d2 = { ...currentShoe.pop()!, isHidden: true };

    const initialHand: BlackjackHand = {
      id: `hand-0-${Date.now()}`,
      cards: [p1, p2],
      bet: currentBet,
      isDoubled: false,
      isDone: false,
      result: 'pending',
      payoutChips: 0,
      payoutCash: 0,
    };

    setShoe(currentShoe);
    setDealerCards([d1, d2]);
    setPlayerHands([initialHand]);
    setActiveHandIndex(0);
    setSelectedCardIds(new Set());

    // Check for immediate natural blackjacks
    const playerBJ = isBlackjack([p1, p2]);
    const dealerBJ = isBlackjack([d1, d2]);

    if (playerBJ || dealerBJ) {
      // Reveal dealer card and resolve immediately
      d2.isHidden = false;
      setDealerCards([d1, d2]);
      setHandPhase('dealerTurn');

      setTimeout(() => {
        resolveRound([d1, d2], [initialHand], currentShoe);
      }, 700);
    } else {
      setHandPhase('playerTurn');
    }
  };

  /**
   * HIT ACTION
   */
  const handleHit = () => {
    if (handPhase !== 'playerTurn') return;
    const currentHand = playerHands[activeHandIndex];
    if (!currentHand || currentHand.isDone) return;

    sound.playCardDeal();
    const currentShoe = [...shoe];
    if (currentShoe.length === 0) return;

    const drawn = currentShoe.pop()!;
    const updatedCards = [...currentHand.cards, drawn];
    const { total, isBust } = calculateHandTotal(updatedCards);

    const updatedHand: BlackjackHand = {
      ...currentHand,
      cards: updatedCards,
      isDone: isBust || total === 21,
    };

    const newHands = [...playerHands];
    newHands[activeHandIndex] = updatedHand;
    setPlayerHands(newHands);
    setShoe(currentShoe);

    if (isBust || total === 21) {
      advanceOrFinishHands(newHands, activeHandIndex, currentShoe);
    }
  };

  /**
   * STAND ACTION
   */
  const handleStand = () => {
    if (handPhase !== 'playerTurn') return;
    const currentHand = playerHands[activeHandIndex];
    if (!currentHand || currentHand.isDone) return;

    sound.playChip();
    const updatedHand: BlackjackHand = {
      ...currentHand,
      isDone: true,
    };

    const newHands = [...playerHands];
    newHands[activeHandIndex] = updatedHand;
    setPlayerHands(newHands);

    advanceOrFinishHands(newHands, activeHandIndex, shoe);
  };

  /**
   * DOUBLE DOWN ACTION
   */
  const handleDouble = () => {
    if (handPhase !== 'playerTurn') return;
    const currentHand = playerHands[activeHandIndex];
    if (!currentHand || currentHand.cards.length !== 2 || currentHand.isDone) return;

    if (!infiniteMoney && cash < currentHand.bet) {
      sound.playGlassBreak();
      return;
    }

    if (!infiniteMoney) {
      setCash((c) => c - currentHand.bet);
    }

    sound.playCardDeal();
    const currentShoe = [...shoe];
    const drawn = currentShoe.pop()!;
    const updatedCards = [...currentHand.cards, drawn];

    const updatedHand: BlackjackHand = {
      ...currentHand,
      cards: updatedCards,
      bet: currentHand.bet * 2,
      isDoubled: true,
      isDone: true,
    };

    const newHands = [...playerHands];
    newHands[activeHandIndex] = updatedHand;
    setPlayerHands(newHands);
    setShoe(currentShoe);

    advanceOrFinishHands(newHands, activeHandIndex, currentShoe);
  };

  /**
   * SPLIT ACTION
   */
  const handleSplit = () => {
    if (handPhase !== 'playerTurn') return;
    const currentHand = playerHands[activeHandIndex];
    if (!currentHand || !canSplitHand(currentHand.cards) || playerHands.length >= 4) return;

    if (!infiniteMoney && cash < currentHand.bet) {
      sound.playGlassBreak();
      return;
    }

    if (!infiniteMoney) {
      setCash((c) => c - currentHand.bet);
    }

    sound.playCardDeal();
    const currentShoe = [...shoe];
    const card1 = currentHand.cards[0];
    const card2 = currentHand.cards[1];

    const newCard1 = currentShoe.pop()!;
    const newCard2 = currentShoe.pop()!;

    const hand1: BlackjackHand = {
      id: `hand-${Date.now()}-1`,
      cards: [card1, newCard1],
      bet: currentHand.bet,
      isDoubled: false,
      isDone: false,
      result: 'pending',
      payoutChips: 0,
      payoutCash: 0,
    };

    const hand2: BlackjackHand = {
      id: `hand-${Date.now()}-2`,
      cards: [card2, newCard2],
      bet: currentHand.bet,
      isDoubled: false,
      isDone: false,
      result: 'pending',
      payoutChips: 0,
      payoutCash: 0,
    };

    const newHands = [...playerHands];
    newHands.splice(activeHandIndex, 1, hand1, hand2);
    setPlayerHands(newHands);
    setShoe(currentShoe);
  };

  /**
   * SURRENDER ACTION
   */
  const handleSurrender = () => {
    if (handPhase !== 'playerTurn' || !rules.allowSurrender) return;
    const currentHand = playerHands[activeHandIndex];
    if (!currentHand || currentHand.cards.length !== 2) return;

    sound.playChip();
    const returned = Math.floor(currentHand.bet / 2);
    if (!infiniteMoney) {
      setCash((c) => c + returned);
    }

    const updatedHand: BlackjackHand = {
      ...currentHand,
      isDone: true,
      result: 'surrender',
      payoutCash: -returned,
    };

    const newHands = [...playerHands];
    newHands[activeHandIndex] = updatedHand;
    setPlayerHands(newHands);

    advanceOrFinishHands(newHands, activeHandIndex, shoe);
  };

  /**
   * Advance to next split hand, or proceed to dealer turn
   */
  const advanceOrFinishHands = (hands: BlackjackHand[], currentIndex: number, currentShoe: Card[]) => {
    const nextIndex = hands.findIndex((h, idx) => idx > currentIndex && !h.isDone);
    if (nextIndex !== -1) {
      setActiveHandIndex(nextIndex);
    } else {
      // All hands done, dealer draws!
      setHandPhase('dealerTurn');
      runDealerTurn(dealerCards, hands, currentShoe);
    }
  };

  /**
   * DEALER AI PLAY AND ROUND RESOLUTION
   */
  const runDealerTurn = (initialDealer: Card[], currentHands: BlackjackHand[], currentShoe: Card[]) => {
    // Reveal hole card
    const dCards: Card[] = initialDealer.map((c) => ({ ...c, isHidden: false }));
    setDealerCards(dCards);
    sound.playCardDeal();

    // If all player hands busted, dealer doesn't need to draw
    const allBusted = currentHands.every((h) => calculateHandTotal(h.cards).isBust);

    let shoeCopy = [...currentShoe];

    if (!allBusted) {
      while (true) {
        const { total, isSoft, isBust } = calculateHandTotal(dCards);
        if (isBust) break;

        if (total < 17) {
          if (shoeCopy.length === 0) break;
          dCards.push(shoeCopy.pop()!);
        } else if (total === 17 && isSoft && rules.dealerHitsSoft17) {
          if (shoeCopy.length === 0) break;
          dCards.push(shoeCopy.pop()!);
        } else {
          break;
        }
      }
    }

    setDealerCards([...dCards]);
    setShoe(shoeCopy);

    setTimeout(() => {
      resolveRound(dCards, currentHands, shoeCopy);
    }, 600);
  };

  /**
   * Resolve outcomes, calculate Balatro Scores (Chips x Mult), award cash
   */
  const resolveRound = (finalDealer: Card[], hands: BlackjackHand[], currentShoe: Card[]) => {
    const dScore = calculateHandTotal(finalDealer);
    const dBJ = isBlackjack(finalDealer);

    let totalWonMoney = 0;
    const evaluatedHands = hands.map((h) => {
      const pScore = calculateHandTotal(h.cards);
      const pBJ = isBlackjack(h.cards);

      let result: BlackjackHand['result'] = 'pending';
      let payoutCash = 0;

      if (h.result === 'surrender') {
        result = 'surrender';
        payoutCash = -Math.floor(h.bet / 2);
      } else if (pBJ && dBJ) {
        result = 'push';
        payoutCash = h.bet; // Bet returned
      } else if (pBJ) {
        result = 'blackjack';
        payoutCash = h.bet + Math.floor(h.bet * rules.blackjackPayout);
      } else if (pScore.isBust) {
        result = 'lose';
        payoutCash = 0;
      } else if (dBJ) {
        result = 'lose';
        payoutCash = 0;
      } else if (dScore.isBust) {
        result = 'win';
        payoutCash = h.bet * 2;
      } else if (pScore.total > dScore.total) {
        result = 'win';
        payoutCash = h.bet * 2;
      } else if (pScore.total < dScore.total) {
        result = 'lose';
        payoutCash = 0;
      } else {
        result = 'push';
        payoutCash = h.bet;
      }

      totalWonMoney += payoutCash;

      // Calculate Balatro Score Breakdown (Chips x Mult)
      const scoreBreakdown = calculateBalatroScore(h, jokersInventory, currentShoe.length);

      // Gold card bonus (+$3 if held at end of round)
      for (const card of h.cards) {
        if (card.enhancement === 'gold') {
          totalWonMoney += 3;
        }
      }

      return {
        ...h,
        result,
        payoutCash,
        payoutChips: scoreBreakdown.finalScore,
        scoreBreakdown,
      };
    });

    if (!infiniteMoney) {
      setCash((c) => c + totalWonMoney);
    }

    setPlayerHands(evaluatedHands);
    setHandPhase('scored');

    if (gameMode === 'classic') {
      // In Classic Normal Blackjack, show streamlined in-table outcome and track infinite session stats!
      const primaryHand = evaluatedHands[0];
      const res = primaryHand?.result || 'lose';
      const netCash = totalWonMoney - (primaryHand?.bet || currentBet);

      let title = 'ROUND COMPLETE';
      let detail = '';
      if (res === 'blackjack') {
        title = 'NATURAL BLACKJACK (21)!';
        detail = `3:2 Payout! Won +$${totalWonMoney}`;
        sound.playBlackjackFanfare();
      } else if (res === 'win') {
        title = 'PLAYER WINS!';
        detail = `Beat the dealer! Won +$${totalWonMoney}`;
        sound.playTallyDing(5);
      } else if (res === 'push') {
        title = 'PUSH (TIE)';
        detail = `Bet returned: $${primaryHand?.bet || currentBet}`;
        sound.playChip();
      } else if (res === 'surrender') {
        title = 'SURRENDER';
        detail = `Half bet returned: $${Math.floor((primaryHand?.bet || currentBet) / 2)}`;
      } else {
        title = 'DEALER WINS';
        detail = `Dealer beats your hand (-$${primaryHand?.bet || currentBet})`;
      }

      setClassicResultBanner({
        type: res,
        title,
        detail,
        netCash,
      });

      // Update infinite session stats
      setClassicStats((prev) => {
        const isWin = res === 'win' || res === 'blackjack';
        const isPush = res === 'push';
        let newStreak = prev.currentStreak;
        if (isWin) {
          newStreak = newStreak >= 0 ? newStreak + 1 : 1;
        } else if (!isPush) {
          newStreak = newStreak <= 0 ? newStreak - 1 : -1;
        }
        return {
          handsPlayed: prev.handsPlayed + 1,
          wins: prev.wins + (isWin ? 1 : 0),
          losses: prev.losses + (!isWin && !isPush ? 1 : 0),
          pushes: prev.pushes + (isPush ? 1 : 0),
          currentStreak: newStreak,
        };
      });
      setRoundNumber((r) => r + 1);
    } else {
      // Show roguelite score popup in Fun and Sandbox modes
      if (evaluatedHands.length > 0) {
        setTallyHand(evaluatedHands[0]);
      }
    }
  };

  const handleDismissTally = () => {
    setTallyHand(null);
    setHandPhase('betting');
    setRoundNumber((r) => r + 1);
    setSelectedCardIds(new Set());
  };

  /**
   * TAROT & INVENTORY ACTIONS
   */
  const handleToggleCardSelection = (cardId: string) => {
    setSelectedCardIds((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) {
        next.delete(cardId);
      } else {
        next.add(cardId);
      }
      return next;
    });
  };

  const handleUseTarot = (tarot: TarotCard) => {
    setLastUsedTarot(tarot.type);
    const selectedCardsList = Array.from(selectedCardIds);

    // Apply Tarot effects
    if (tarot.type === 'the_hermit') {
      const gain = Math.min(20, cash);
      setCash((c) => c + gain);
    } else if (tarot.type === 'the_temperance') {
      const sellValue = jokersInventory.length * 4;
      setCash((c) => c + sellValue);
    } else if (tarot.type === 'judgement') {
      if (jokersInventory.length < 5) {
        setJokersInventory((prev) => [...prev, getRandomJoker()]);
      }
    } else if (tarot.type === 'the_fool') {
      if (lastUsedTarot && lastUsedTarot !== 'the_fool') {
        setTarotInventory((prev) => [...prev, createTarotInstance(lastUsedTarot)]);
      }
    } else if (tarot.type === 'the_wheel_of_fortune') {
      // 1 in 4 chance to buff random card in active hand
      if (Math.random() < 0.25 && playerHands.length > 0) {
        const edList: Card['edition'][] = ['foil', 'holo', 'polychrome'];
        const chosenEd = edList[Math.floor(Math.random() * edList.length)];
        const targetHand = playerHands[activeHandIndex];
        if (targetHand && targetHand.cards.length > 0) {
          const randCard = targetHand.cards[Math.floor(Math.random() * targetHand.cards.length)];
          randCard.edition = chosenEd;
          setPlayerHands([...playerHands]);
        }
      }
    } else {
      // Modify targeted cards
      const targetHands = [...playerHands];
      for (const h of targetHands) {
        for (const card of h.cards) {
          if (selectedCardIds.has(card.id)) {
            if (tarot.type === 'the_magician') card.enhancement = 'lucky';
            else if (tarot.type === 'the_empress') card.enhancement = 'mult';
            else if (tarot.type === 'the_hierophant') card.enhancement = 'bonus';
            else if (tarot.type === 'the_lovers') card.enhancement = 'wild';
            else if (tarot.type === 'the_chariot') card.enhancement = 'steel';
            else if (tarot.type === 'justice') card.enhancement = 'glass';
            else if (tarot.type === 'the_devil') card.enhancement = 'gold';
            else if (tarot.type === 'the_sun') card.suit = 'hearts';
            else if (tarot.type === 'the_moon') card.suit = 'clubs';
            else if (tarot.type === 'the_star') card.suit = 'diamonds';
            else if (tarot.type === 'the_world') card.suit = 'spades';
            else if (tarot.type === 'strength') {
              const ranks: Card['rank'][] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
              const idx = ranks.indexOf(card.rank);
              if (idx < ranks.length - 1) card.rank = ranks[idx + 1];
            }
          }
        }
      }
      setPlayerHands(targetHands);
    }

    // Remove consumed Tarot
    setTarotInventory((prev) => prev.filter((t) => t.id !== tarot.id));
    setSelectedCardIds(new Set());
  };

  const handleBuyTarotPack = () => {
    if (!infiniteMoney && cash < 6) return;
    if (tarotInventory.length >= 3) return;

    if (!infiniteMoney) setCash((c) => c - 6);
    sound.playTarotConsume();
    setTarotInventory((prev) => [...prev, getRandomTarot()]);
  };

  const handleBuyJokerPack = () => {
    if (!infiniteMoney && cash < 10) return;
    if (jokersInventory.length >= 5) return;

    if (!infiniteMoney) setCash((c) => c - 10);
    sound.playChip();
    setJokersInventory((prev) => [...prev, getRandomJoker()]);
  };

  // Compute live odds for learning panel
  const activeHand = playerHands[activeHandIndex];
  const dealerUpcard = dealerCards.find((c) => !c.isHidden) || dealerCards[0];
  const oddsData: OddsAnalysis | null = useMemo(() => {
    if (!activeHand || !dealerUpcard || handPhase === 'betting') return null;
    return calculateLiveOdds(
      activeHand.cards,
      dealerUpcard,
      shoe,
      activeHand.cards.length === 2,
      canSplitHand(activeHand.cards) && playerHands.length < 4,
      rules.allowSurrender && activeHand.cards.length === 2
    );
  }, [activeHand, dealerUpcard, shoe, handPhase, rules, playerHands.length]);

  return (
    <div className="relative min-h-screen w-full bg-black text-slate-100 flex flex-col justify-between overflow-x-hidden select-none">
      {/* Background psychedelic canvas shader */}
      <BalatroBackground
        palette={gameMode === 'fun' ? 'classic' : gameMode === 'sandbox' ? 'crimson' : 'emerald'}
      />

      {/* CRT Scanline and Vignette Filter */}
      <CrtOverlay enabled={crtEnabled} />

      {/* Tally result overlay if round concluded */}
      {tallyHand && (
        <ScoreTallyOverlay hand={tallyHand} onNextHand={handleDismissTally} />
      )}

      {/* MAIN MENU */}
      {screen === 'menu' ? (
        <MainMenu
          onSelectMode={handleStartGame}
          soundMuted={soundMuted}
          onToggleSound={handleToggleSound}
          crtEnabled={crtEnabled}
          onToggleCrt={handleToggleCrt}
          onOpenTutorial={() => setShowTutorial(true)}
          onOpenVolume={() => setShowVolumeModal(true)}
        />
      ) : (
        /* ACTIVE GAME INTERFACE */
        <div className="relative z-10 flex flex-col min-h-screen justify-between p-2 md:p-4 max-w-7xl mx-auto w-full">
          {/* Top Bar HUD */}
          <header className="flex items-center justify-between gap-4 py-2 px-3 rounded-xl bg-slate-950/80 border border-white/10 shadow-xl backdrop-blur-md shrink-0">
            {/* Zone 1: Brand Wordmark */}
            <div className="flex items-center gap-2">
              <span className="font-balatro font-black text-lg md:text-xl text-amber-400 tracking-tight whitespace-nowrap">
                BALATRO<span className="text-white">JACK</span>
              </span>
              <span className={`text-[10px] font-balatro uppercase px-2 py-0.5 rounded border font-bold hidden sm:inline-block ${
                gameMode === 'classic'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              }`}>
                {gameMode === 'classic'
                  ? 'Normal Blackjack'
                  : gameMode === 'fun'
                  ? 'Sandbox Play'
                  : gameMode === 'sandbox'
                  ? 'Laboratory'
                  : 'Learning Mode'}
              </span>
            </div>

            {/* Zone 2: Navigation & Status Indicators */}
            <div className="flex items-center gap-3 text-xs font-balatro">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Cash:</span>
                <span className="font-black text-emerald-400 text-sm">
                  {infiniteMoney ? '♾️ Free Play' : `$${cash}`}
                </span>
                {gameMode === 'classic' && !infiniteMoney && (
                  <button
                    onClick={() => handleReloadChips(500)}
                    className="ml-1 px-1.5 py-0.5 rounded bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold cursor-pointer transition-colors shadow-sm"
                    title="Quick Reload +$500"
                  >
                    +500
                  </button>
                )}
              </div>
              <div className="hidden md:flex items-center gap-1.5">
                <span className="text-slate-400">Shoe:</span>
                <span className="font-bold text-slate-200">{shoe.length} cards</span>
                {gameMode === 'classic' && (
                  <button
                    onClick={handleManualReshuffle}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-white/20 text-slate-300 cursor-pointer"
                    title="Reshuffle 4-deck shoe (208 cards)"
                  >
                    🔄
                  </button>
                )}
              </div>
              {gameMode === 'classic' ? (
                <div className="hidden sm:flex items-center gap-1.5">
                  <span className="text-slate-400">Session:</span>
                  <span className="font-bold text-amber-300">
                    {classicStats.wins}W-{classicStats.losses}L{classicStats.pushes > 0 ? `-${classicStats.pushes}P` : ''}
                  </span>
                  {classicStats.currentStreak !== 0 && (
                    <span className={`text-[10px] font-black px-1.5 py-0.2 rounded ${
                      classicStats.currentStreak > 0 ? 'bg-emerald-600 text-white' : 'bg-rose-900 text-rose-300'
                    }`}>
                      {classicStats.currentStreak > 0 ? `🔥 +${classicStats.currentStreak}` : classicStats.currentStreak}
                    </span>
                  )}
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-1.5">
                  <span className="text-slate-400">Round:</span>
                  <span className="font-bold text-amber-300">#{roundNumber}</span>
                </div>
              )}
            </div>

            {/* Zone 3: Primary Action & Tools */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowOddsAdvisor((prev) => !prev)}
                className={`px-2.5 py-1 rounded text-xs font-balatro font-bold transition-all cursor-pointer ${
                  showOddsAdvisor || gameMode === 'learning'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-900 border border-white/10 hover:border-blue-400 text-blue-300'
                }`}
                title="Toggle Strategy & Odds Advisor"
              >
                🎓 Odds
              </button>
              {gameMode !== 'classic' && (
                <button
                  onClick={() => setShowSandboxInspector((prev) => !prev)}
                  className={`px-2.5 py-1 rounded text-xs font-balatro font-bold transition-all cursor-pointer ${
                    showSandboxInspector
                      ? 'bg-amber-400 text-slate-950 shadow-md'
                      : 'bg-slate-900 border border-white/10 hover:border-amber-400 text-amber-300'
                  }`}
                  title="Open Sandbox Inspector"
                >
                  🔬 Sandbox
                </button>
              )}
              <button
                onClick={() => setShowVolumeModal(true)}
                className="px-2.5 py-1 rounded bg-indigo-950/80 border border-indigo-500/40 hover:border-indigo-400 text-indigo-300 text-xs font-balatro font-bold flex items-center gap-1 cursor-pointer transition-colors"
                title="Audio, Jazz BGM & Volume Settings"
              >
                🎷 Jazz
              </button>
              <button
                onClick={() => setShowTutorial(true)}
                className="px-2 py-1 rounded bg-amber-500/20 border border-amber-500/30 hover:border-amber-400 text-amber-300 text-xs font-balatro font-bold cursor-pointer transition-colors hidden sm:block"
                title="View Tutorial"
              >
                📖 Tutorial
              </button>
              <button
                onClick={handleToggleSound}
                className="p-1.5 rounded bg-slate-900 border border-white/10 hover:border-white/30 text-slate-300 text-xs"
                title="Toggle Audio"
                aria-label="Toggle Audio"
              >
                {soundMuted ? '🔇' : '🔊'}
              </button>
              <button
                onClick={() => setScreen('menu')}
                className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-white/10 text-xs font-balatro text-slate-300 cursor-pointer"
              >
                Menu
              </button>
            </div>
          </header>

          {/* Sandbox Inspector Modal Dropdown */}
          {showSandboxInspector && (
            <div className="my-2 z-30">
              <SandboxInspector
                rules={rules}
                onUpdateRules={setRules}
                onResetDeckWithPreset={handleResetShoeWithPreset}
                onSpawnTarot={(t) => {
                  if (tarotInventory.length < 3) {
                    setTarotInventory((prev) => [...prev, t]);
                  }
                }}
                onSpawnJoker={(j) => {
                  if (jokersInventory.length < 5) {
                    setJokersInventory((prev) => [...prev, j]);
                  }
                }}
                onAddCash={(amt) => setCash((c) => c + amt)}
                infiniteMoney={infiniteMoney}
                onToggleInfiniteMoney={() => setInfiniteMoney((prev) => !prev)}
                onClose={() => setShowSandboxInspector(false)}
              />
            </div>
          )}

          {/* Top Slots: Active Jokers & Tarot Consumables Bar */}
          {gameMode === 'classic' ? (
            <div className="w-full my-1.5 py-2 px-3 rounded-xl bg-slate-950/80 border border-emerald-500/40 flex flex-wrap items-center justify-between text-xs font-balatro text-emerald-300 shadow-md gap-2">
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1.5 font-bold text-white">
                  <span>♠️</span> Classic Normal Blackjack
                </span>
                <span className="text-slate-500 hidden sm:inline">•</span>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <span className="text-slate-400">Infinite Bankroll:</span>
                  <button
                    onClick={() => handleReloadChips(100)}
                    className="px-2 py-0.5 rounded bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 font-bold text-[11px] cursor-pointer"
                    title="Add $100 chips"
                  >
                    +$100
                  </button>
                  <button
                    onClick={() => handleReloadChips(500)}
                    className="px-2 py-0.5 rounded bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 font-bold text-[11px] cursor-pointer"
                    title="Add $500 chips"
                  >
                    +$500
                  </button>
                  <button
                    onClick={() => handleReloadChips(1000)}
                    className="px-2 py-0.5 rounded bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 font-bold text-[11px] cursor-pointer"
                    title="Add $1,000 chips"
                  >
                    +$1,000
                  </button>
                  <button
                    onClick={() => setInfiniteMoney((prev) => !prev)}
                    className={`ml-1 px-2.5 py-0.5 rounded text-[11px] font-bold border transition-colors cursor-pointer ${
                      infiniteMoney
                        ? 'bg-amber-400 text-slate-950 border-amber-300 font-black shadow-sm'
                        : 'bg-slate-900 border-white/20 text-slate-400 hover:text-white'
                    }`}
                  >
                    {infiniteMoney ? '♾️ Free Play: ON' : '♾️ Free Play: OFF'}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleManualReshuffle}
                  className="text-[11px] px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-white/20 text-slate-300 hover:text-white cursor-pointer transition-colors"
                  title="Reshuffle 4-deck shoe (208 cards)"
                >
                  🔄 Reshuffle Shoe
                </button>
                <button
                  onClick={() => setShowOddsAdvisor((prev) => !prev)}
                  className="text-[11px] px-2.5 py-1 rounded bg-blue-950/80 hover:bg-blue-900 border border-blue-500/40 text-blue-300 hover:text-white cursor-pointer transition-colors"
                >
                  {showOddsAdvisor ? 'Hide Odds' : 'Show Odds 🎓'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3 py-2">
              {/* Jokers Area */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
                <div className="text-[10px] font-balatro uppercase text-slate-400 font-bold tracking-wider shrink-0 mr-1">
                  Jokers ({jokersInventory.length}/5)
                </div>
                {jokersInventory.map((joker) => (
                  <JokerCardView
                    key={joker.id}
                    joker={joker}
                    onSell={(j) => {
                      sound.playChip();
                      setCash((c) => c + 2);
                      setJokersInventory((prev) => prev.filter((item) => item.id !== j.id));
                    }}
                  />
                ))}
                {jokersInventory.length < 5 && (
                  <button
                    onClick={handleBuyJokerPack}
                    disabled={!infiniteMoney && cash < 10}
                    className="w-24 h-24 rounded-lg border-2 border-dashed border-white/20 hover:border-amber-400 bg-black/40 flex flex-col items-center justify-center p-2 text-center text-xs font-balatro text-slate-400 hover:text-amber-300 shrink-0 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span className="text-base mb-1">🃏</span>
                    <span>Buy Joker</span>
                    <span className="text-[10px] text-amber-400 font-bold">$10</span>
                  </button>
                )}
              </div>

              {/* Tarot Consumables Area */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
                <div className="text-[10px] font-balatro uppercase text-amber-400 font-bold tracking-wider shrink-0 mr-1">
                  Tarot ({tarotInventory.length}/3)
                </div>
                {tarotInventory.map((tarot) => (
                  <TarotCardView
                    key={tarot.id}
                    tarot={tarot}
                    canUse={true}
                    selectedCardCount={selectedCardIds.size}
                    onUse={handleUseTarot}
                    onSell={(t) => {
                      sound.playChip();
                      setCash((c) => c + 1);
                      setTarotInventory((prev) => prev.filter((item) => item.id !== t.id));
                    }}
                  />
                ))}
                {tarotInventory.length < 3 && (
                  <button
                    onClick={handleBuyTarotPack}
                    disabled={!infiniteMoney && cash < 6}
                    className="w-24 h-24 rounded-lg border-2 border-dashed border-amber-500/30 hover:border-amber-400 bg-black/40 flex flex-col items-center justify-center p-2 text-center text-xs font-balatro text-slate-400 hover:text-amber-300 shrink-0 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span className="text-base mb-1">🔮</span>
                    <span>Tarot Pack</span>
                    <span className="text-[10px] text-amber-400 font-bold">$6</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Main Table Layout (Split when Odds Advisor is active) */}
          <div className={`my-2 flex-1 flex flex-col ${showOddsAdvisor || gameMode === 'learning' ? 'lg:grid lg:grid-cols-12 lg:gap-4' : ''}`}>
            {/* Left Zone: Felt Table for Dealer & Player Hands */}
            <div className={`${showOddsAdvisor || gameMode === 'learning' ? 'lg:col-span-7 xl:col-span-8' : 'w-full'} flex flex-col justify-around rounded-2xl bg-black/40 border border-white/10 p-3 shadow-inner min-h-[360px]`}>
              {/* Dealer Hand Area */}
              <div className="flex flex-col items-center justify-center">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-balatro text-slate-400 uppercase tracking-widest font-bold">
                    Dealer Hand
                  </span>
                  {dealerCards.length > 0 && (
                    <span className="text-xs font-balatro font-bold px-2 py-0.5 rounded bg-black/60 border border-white/10 text-amber-300">
                      {dealerCards.some((c) => c.isHidden)
                        ? `Shows ${getCardBlackjackValue(dealerCards[0])}`
                        : calculateHandTotal(dealerCards).isBust
                        ? 'BUST (>21)'
                        : `Total: ${calculateHandTotal(dealerCards).total}`}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-center gap-2 min-h-36">
                  {dealerCards.length === 0 ? (
                    <div className="w-24 h-36 rounded-lg border-2 border-dashed border-white/10 flex items-center justify-center text-slate-600 text-xs font-balatro">
                      Empty
                    </div>
                  ) : (
                    dealerCards.map((card) => (
                      <PlayingCard
                        key={card.id}
                        card={card}
                        selectable={card.isHidden ? false : true}
                        selected={selectedCardIds.has(card.id)}
                        onClick={() => handleToggleCardSelection(card.id)}
                      />
                    ))
                  )}
                </div>
              </div>

              {/* Table Center Felt Divider */}
              <div className="w-full flex items-center justify-center my-2">
                <div className="h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent w-full" />
                <span className="px-3 text-[10px] font-balatro uppercase text-slate-500 font-bold tracking-widest whitespace-nowrap">
                  Balatro Table
                </span>
                <div className="h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent w-full" />
              </div>

              {/* Player Hands Area */}
              <div className="flex flex-col items-center justify-center">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-balatro text-slate-400 uppercase tracking-widest font-bold">
                    Player Hand {playerHands.length > 1 ? `(#${activeHandIndex + 1})` : ''}
                  </span>
                  {playerHands.length > 0 && activeHand && (
                    <span className="text-xs font-balatro font-bold px-2 py-0.5 rounded bg-black/60 border border-white/10 text-emerald-400">
                      {calculateHandTotal(activeHand.cards).isBust
                        ? 'BUST (>21)'
                        : isBlackjack(activeHand.cards)
                        ? 'NATURAL BLACKJACK (21)'
                        : `Total: ${calculateHandTotal(activeHand.cards).total} ${
                            calculateHandTotal(activeHand.cards).isSoft ? '(Soft)' : ''
                          }`}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-center gap-4 min-h-36">
                  {playerHands.length === 0 ? (
                    <div className="flex gap-2">
                      <div className="w-24 h-36 rounded-lg border-2 border-dashed border-white/10 flex items-center justify-center text-slate-600 text-xs font-balatro">
                        Waiting
                      </div>
                      <div className="w-24 h-36 rounded-lg border-2 border-dashed border-white/10 flex items-center justify-center text-slate-600 text-xs font-balatro">
                        for Bet
                      </div>
                    </div>
                  ) : (
                    playerHands.map((h, hIdx) => (
                      <div
                        key={h.id}
                        className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
                          hIdx === activeHandIndex
                            ? 'border-emerald-500/60 bg-emerald-950/20 shadow-lg'
                            : 'border-white/10 bg-black/40 opacity-70'
                        }`}
                      >
                        {h.cards.map((card) => (
                          <PlayingCard
                            key={card.id}
                            card={card}
                            selectable={true}
                            selected={selectedCardIds.has(card.id)}
                            onClick={() => handleToggleCardSelection(card.id)}
                          />
                        ))}
                      </div>
                    ))
                  )}
                </div>

                {/* Classic Mode In-Table Round Result Banner */}
                {gameMode === 'classic' && classicResultBanner && handPhase === 'scored' && (
                  <div className="mt-3 py-2 px-5 rounded-xl bg-slate-950/90 border-2 border-amber-400 shadow-2xl flex flex-col items-center justify-center text-center animate-fade-in">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">
                        {classicResultBanner.type === 'blackjack' ? '🌟' : classicResultBanner.type === 'win' ? '🎉' : classicResultBanner.type === 'push' ? '🤝' : '💀'}
                      </span>
                      <h3 className={`font-balatro font-black text-lg uppercase tracking-wider ${
                        classicResultBanner.type === 'blackjack'
                          ? 'text-amber-300'
                          : classicResultBanner.type === 'win'
                          ? 'text-emerald-400'
                          : classicResultBanner.type === 'push'
                          ? 'text-cyan-300'
                          : 'text-rose-400'
                      }`}>
                        {classicResultBanner.title}
                      </h3>
                      <span className="text-xs font-balatro font-bold text-slate-300 ml-2">
                        {classicResultBanner.detail}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Zone: Strategy & Odds Advisor (Docked when active) */}
            {(showOddsAdvisor || gameMode === 'learning') && (
              <div className="lg:col-span-5 xl:col-span-4 mt-3 lg:mt-0 flex flex-col justify-start">
                <OddsAdvisorPanel
                  odds={oddsData}
                  learningModeActive={gameMode === 'learning'}
                  shoeCards={shoe}
                />
              </div>
            )}
          </div>

          {/* Action Control Deck */}
          <footer className="p-3 rounded-2xl bg-slate-950/90 border border-white/10 shadow-2xl backdrop-blur-md shrink-0">
            {handPhase === 'betting' || (handPhase === 'scored' && gameMode === 'classic') ? (
              /* BETTING & RE-DEAL CONTROLS */
              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Bet Sizing Chips */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-balatro text-slate-400 font-bold uppercase mr-1">
                    Bet:
                  </span>
                  {[5, 10, 25, 50, 100].map((val) => (
                    <button
                      key={val}
                      onClick={() => {
                        sound.playChip();
                        setCurrentBet(val);
                      }}
                      className={`w-10 h-10 rounded-full font-balatro font-black text-xs flex items-center justify-center border shadow-md transition-transform active:scale-90 cursor-pointer ${
                        currentBet === val
                          ? 'bg-amber-400 text-slate-950 border-amber-300 scale-110 ring-2 ring-amber-300'
                          : 'bg-slate-900 border-white/20 text-slate-300 hover:border-amber-400'
                      }`}
                    >
                      ${val}
                    </button>
                  ))}
                  {gameMode === 'classic' && (
                    <div className="flex items-center gap-1.5 ml-1 border-l border-white/10 pl-2">
                      <button
                        onClick={() => handleReloadChips(500)}
                        className="py-1 px-2.5 rounded bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 font-balatro text-xs font-bold cursor-pointer transition-colors shadow-sm"
                        title="Free $500 chip reload"
                      >
                        +$500 Rebuy
                      </button>
                    </div>
                  )}
                </div>

                {/* Primary Deal / Next Hand Button */}
                <button
                  data-start="true"
                  onClick={handleDeal}
                  className="py-3 px-8 rounded-xl bg-gradient-to-r from-red-600 via-amber-500 to-red-600 hover:from-red-500 hover:to-red-500 text-slate-950 font-balatro font-black text-lg uppercase tracking-wider shadow-lg transition-transform active:scale-95 cursor-pointer"
                >
                  {handPhase === 'scored' && gameMode === 'classic'
                    ? `DEAL NEXT HAND ($${currentBet}) [Space]`
                    : `DEAL ($${currentBet})`}
                </button>
              </div>
            ) : (
              /* IN-PLAY ACTIONS (HIT, STAND, DOUBLE, SPLIT, SURRENDER) */
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={handleHit}
                  disabled={handPhase !== 'playerTurn'}
                  className="py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-balatro font-black text-sm uppercase tracking-wider shadow-lg transition-transform active:scale-95 cursor-pointer disabled:opacity-40"
                >
                  HIT [H]
                </button>

                <button
                  onClick={handleStand}
                  disabled={handPhase !== 'playerTurn'}
                  className="py-2.5 px-6 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-balatro font-black text-sm uppercase tracking-wider shadow-lg transition-transform active:scale-95 cursor-pointer disabled:opacity-40"
                >
                  STAND [S]
                </button>

                <button
                  onClick={handleDouble}
                  disabled={
                    handPhase !== 'playerTurn' ||
                    !activeHand ||
                    activeHand.cards.length !== 2 ||
                    (!infiniteMoney && cash < activeHand.bet)
                  }
                  className="py-2.5 px-6 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-balatro font-black text-sm uppercase tracking-wider shadow-lg transition-transform active:scale-95 cursor-pointer disabled:opacity-40"
                >
                  DOUBLE [D]
                </button>

                {canSplitHand(activeHand?.cards || []) && (
                  <button
                    onClick={handleSplit}
                    disabled={handPhase !== 'playerTurn' || (!infiniteMoney && cash < (activeHand?.bet || 0))}
                    className="py-2.5 px-6 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-balatro font-black text-sm uppercase tracking-wider shadow-lg transition-transform active:scale-95 cursor-pointer disabled:opacity-40"
                  >
                    SPLIT [P]
                  </button>
                )}

                {rules.allowSurrender && activeHand?.cards.length === 2 && (
                  <button
                    onClick={handleSurrender}
                    disabled={handPhase !== 'playerTurn'}
                    className="py-2.5 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10 font-balatro font-bold text-xs uppercase cursor-pointer disabled:opacity-40"
                  >
                    SURRENDER
                  </button>
                )}
              </div>
            )}
          </footer>
        </div>
      )}

      {/* Floating Toast Banner for Notifications */}
      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 py-2 px-5 rounded-full bg-slate-950/95 border-2 border-amber-400 text-amber-300 font-balatro font-black text-xs shadow-2xl animate-fade-in flex items-center gap-2">
          <span>🔔</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Interactive Guided Tutorial Modal */}
      <TutorialModal
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
      />

      {/* Audio, Jazz Music & Master Volume Control Modal */}
      <VolumeControlModal
        isOpen={showVolumeModal}
        onClose={() => setShowVolumeModal(false)}
      />
    </div>
  );
}
