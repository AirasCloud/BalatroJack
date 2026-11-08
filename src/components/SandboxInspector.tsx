import React, { useState } from 'react';
import { CardEdition, CardEnhancement, HouseRules, Joker, TarotCard, TarotType } from '../game/types';
import { JOKERS_CATALOG, TAROT_CATALOG, createTarotInstance } from '../game/tarotData';
import { sound } from '../game/audio';
import { calculateHandTotal, createShoe, getCardBlackjackValue, isBlackjack } from '../game/deck';
import { getBasicStrategyRecommendation } from '../game/rules';

interface SandboxInspectorProps {
  rules: HouseRules;
  onUpdateRules: (rules: HouseRules) => void;
  onResetDeckWithPreset: (preset: 'standard' | 'tens' | 'aces' | 'foil' | 'chaos') => void;
  onSpawnTarot: (tarot: TarotCard) => void;
  onSpawnJoker: (joker: Joker) => void;
  onAddCash: (amount: number) => void;
  infiniteMoney: boolean;
  onToggleInfiniteMoney: () => void;
  onClose?: () => void;
}

export const SandboxInspector: React.FC<SandboxInspectorProps> = ({
  rules,
  onUpdateRules,
  onResetDeckWithPreset,
  onSpawnTarot,
  onSpawnJoker,
  onAddCash,
  infiniteMoney,
  onToggleInfiniteMoney,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'rules' | 'shoe' | 'items' | 'sim'>('rules');
  const [selectedTarotKey, setSelectedTarotKey] = useState<TarotType>('the_magician');
  const [selectedJokerKey, setSelectedJokerKey] = useState<string>('joker-basic');

  // Monte Carlo simulation state
  const [isSimulating, setIsSimulating] = useState(false);
  const [simResults, setSimResults] = useState<{
    handsCount: number;
    playerWins: number;
    dealerWins: number;
    pushes: number;
    blackjacks: number;
    playerWinPct: number;
    dealerWinPct: number;
    pushPct: number;
    houseEdgePct: number;
  } | null>(null);

  const tarotKeys = Object.keys(TAROT_CATALOG) as TarotType[];

  const handleSpawnTarot = () => {
    sound.playChip();
    const inst = createTarotInstance(selectedTarotKey);
    onSpawnTarot(inst);
  };

  const handleSpawnJoker = () => {
    sound.playChip();
    const found = JOKERS_CATALOG.find((j) => j.id === selectedJokerKey) || JOKERS_CATALOG[0];
    onSpawnJoker({ ...found, id: `${found.id}-${Math.random().toString(36).substring(2, 6)}` });
  };

  /**
   * Run 1,000-hand Monte Carlo Fast Simulation
   */
  const runMonteCarloSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const handsCount = 1000;
      let playerWins = 0;
      let dealerWins = 0;
      let pushes = 0;
      let blackjacks = 0;
      let netUnits = 0;

      // Simulated shoe
      let shoe = createShoe(rules.deckCount);

      for (let i = 0; i < handsCount; i++) {
        // Reshuffle shoe if low
        if (shoe.length < 20) {
          shoe = createShoe(rules.deckCount);
        }

        // Deal 2 cards to player, 2 to dealer (1 face down)
        const p1 = shoe.pop()!;
        const d1 = shoe.pop()!;
        const p2 = shoe.pop()!;
        const d2 = shoe.pop()!;

        const playerHand = [p1, p2];
        const dealerHand = [d1, d2];

        const pBJ = isBlackjack(playerHand);
        const dBJ = isBlackjack(dealerHand);

        if (pBJ && dBJ) {
          pushes++;
          continue;
        } else if (pBJ) {
          playerWins++;
          blackjacks++;
          netUnits += rules.blackjackPayout;
          continue;
        } else if (dBJ) {
          dealerWins++;
          netUnits -= 1;
          continue;
        }

        // Player plays basic strategy
        let isDoubled = false;
        while (true) {
          const { total } = calculateHandTotal(playerHand);
          if (total >= 21) break;

          const rec = getBasicStrategyRecommendation(
            playerHand,
            d1,
            playerHand.length === 2,
            false,
            rules.allowSurrender && playerHand.length === 2
          );

          if (rec.action === 'STAND') {
            break;
          } else if (rec.action === 'DOUBLE') {
            isDoubled = true;
            if (shoe.length > 0) playerHand.push(shoe.pop()!);
            break;
          } else if (rec.action === 'SURRENDER') {
            netUnits -= 0.5;
            dealerWins++;
            break;
          } else {
            // HIT
            if (shoe.length > 0) playerHand.push(shoe.pop()!);
          }
        }

        const pTotal = calculateHandTotal(playerHand);
        const betMult = isDoubled ? 2 : 1;

        if (pTotal.isBust) {
          dealerWins++;
          netUnits -= betMult;
          continue;
        }

        // Dealer plays (hits until 17 or soft 17 if H17 active)
        while (true) {
          const dTotal = calculateHandTotal(dealerHand);
          if (dTotal.isBust) break;
          if (dTotal.total < 17) {
            if (shoe.length > 0) dealerHand.push(shoe.pop()!);
          } else if (dTotal.total === 17 && dTotal.isSoft && rules.dealerHitsSoft17) {
            if (shoe.length > 0) dealerHand.push(shoe.pop()!);
          } else {
            break;
          }
        }

        const dFinal = calculateHandTotal(dealerHand);

        if (dFinal.isBust) {
          playerWins++;
          netUnits += betMult;
        } else if (pTotal.total > dFinal.total) {
          playerWins++;
          netUnits += betMult;
        } else if (pTotal.total < dFinal.total) {
          dealerWins++;
          netUnits -= betMult;
        } else {
          pushes++;
        }
      }

      const pWinPct = Math.round((playerWins / handsCount) * 1000) / 10;
      const dWinPct = Math.round((dealerWins / handsCount) * 1000) / 10;
      const pushPct = Math.round((pushes / handsCount) * 1000) / 10;
      const houseEdgePct = Math.round((-netUnits / handsCount) * 1000) / 10;

      setSimResults({
        handsCount,
        playerWins,
        dealerWins,
        pushes,
        blackjacks,
        playerWinPct: pWinPct,
        dealerWinPct: dWinPct,
        pushPct,
        houseEdgePct,
      });

      setIsSimulating(false);
      sound.playTallyDing(4);
    }, 150);
  };

  return (
    <div className="rounded-xl border-2 border-amber-500/70 bg-gradient-to-b from-slate-950 via-slate-900 to-black p-4 shadow-2xl backdrop-blur-md">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🔬</span>
          <div>
            <h3 className="font-balatro font-black text-sm text-amber-400 tracking-wide uppercase">
              Sandbox Laboratory
            </h3>
            <p className="text-[10px] text-slate-400">
              Customize shoe, house rules, spawn cards, and run Monte Carlo simulations
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-balatro text-slate-300"
          >
            ✕ Close
          </button>
        )}
      </div>

      {/* Navigation tabs */}
      <div className="flex items-center gap-1 bg-black/60 p-1 rounded-lg border border-white/10 mb-3">
        <button
          onClick={() => setActiveTab('rules')}
          className={`flex-1 py-1 text-xs font-balatro font-bold rounded transition-colors ${
            activeTab === 'rules' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
          }`}
        >
          House Rules
        </button>
        <button
          onClick={() => setActiveTab('shoe')}
          className={`flex-1 py-1 text-xs font-balatro font-bold rounded transition-colors ${
            activeTab === 'shoe' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
          }`}
        >
          Shoe Presets
        </button>
        <button
          onClick={() => setActiveTab('items')}
          className={`flex-1 py-1 text-xs font-balatro font-bold rounded transition-colors ${
            activeTab === 'items' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
          }`}
        >
          Spawn Items
        </button>
        <button
          onClick={() => setActiveTab('sim')}
          className={`flex-1 py-1 text-xs font-balatro font-bold rounded transition-colors ${
            activeTab === 'sim' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
          }`}
        >
          Monte Carlo Sim
        </button>
      </div>

      {/* TAB 1: HOUSE RULES */}
      {activeTab === 'rules' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-balatro">
            {/* Dealer Soft 17 */}
            <div className="p-2.5 rounded-lg bg-black/40 border border-white/10 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-200 block">Dealer Soft 17</span>
                <span className="text-[10px] text-slate-400">
                  {rules.dealerHitsSoft17 ? 'Hits Soft 17 (H17 - Casino Edge)' : 'Stands on all 17s (S17 - Player Friendly)'}
                </span>
              </div>
              <button
                onClick={() => onUpdateRules({ ...rules, dealerHitsSoft17: !rules.dealerHitsSoft17 })}
                className={`px-3 py-1 rounded font-bold text-xs ${
                  rules.dealerHitsSoft17 ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
                }`}
              >
                {rules.dealerHitsSoft17 ? 'H17 (Hits)' : 'S17 (Stands)'}
              </button>
            </div>

            {/* Blackjack Payout */}
            <div className="p-2.5 rounded-lg bg-black/40 border border-white/10 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-200 block">Blackjack Payout</span>
                <span className="text-[10px] text-slate-400">Natural 21 payout ratio</span>
              </div>
              <select
                value={rules.blackjackPayout}
                onChange={(e) => onUpdateRules({ ...rules, blackjackPayout: parseFloat(e.target.value) })}
                className="bg-slate-900 border border-white/20 text-amber-300 rounded px-2 py-1 text-xs font-bold"
              >
                <option value={1.5}>3:2 Standard (+150%)</option>
                <option value={2.0}>2:1 Double (+200%)</option>
                <option value={1.2}>6:5 Vegas Strip (+120%)</option>
              </select>
            </div>

            {/* Surrender */}
            <div className="p-2.5 rounded-lg bg-black/40 border border-white/10 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-200 block">Surrender Rule</span>
                <span className="text-[10px] text-slate-400">Surrender initial 2 cards for 50% bet return</span>
              </div>
              <button
                onClick={() => onUpdateRules({ ...rules, allowSurrender: !rules.allowSurrender })}
                className={`px-3 py-1 rounded font-bold text-xs ${
                  rules.allowSurrender ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {rules.allowSurrender ? 'Allowed' : 'Disabled'}
              </button>
            </div>

            {/* Deck Count */}
            <div className="p-2.5 rounded-lg bg-black/40 border border-white/10 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-200 block">Shoe Deck Count</span>
                <span className="text-[10px] text-slate-400">Number of 52-card decks in shoe</span>
              </div>
              <div className="flex gap-1">
                {[1, 2, 4, 6, 8].map((cnt) => (
                  <button
                    key={cnt}
                    onClick={() => onUpdateRules({ ...rules, deckCount: cnt })}
                    className={`px-2 py-0.5 rounded text-xs font-bold ${
                      rules.deckCount === cnt
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {cnt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SHOE PRESETS */}
      {activeTab === 'shoe' && (
        <div className="space-y-2">
          <p className="text-xs text-slate-300">
            Quickly test different deck distributions and enhance shoe composition:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-balatro">
            <button
              onClick={() => onResetDeckWithPreset('standard')}
              className="p-3 rounded-lg bg-slate-900 border border-white/10 hover:border-amber-400 text-left cursor-pointer transition-all hover:bg-slate-800"
            >
              <div className="font-bold text-amber-300">Standard Casino Shoe</div>
              <div className="text-[10px] text-slate-400">Pure 52-card standard decks (4 decks)</div>
            </button>

            <button
              onClick={() => onResetDeckWithPreset('tens')}
              className="p-3 rounded-lg bg-slate-900 border border-white/10 hover:border-amber-400 text-left cursor-pointer transition-all hover:bg-slate-800"
            >
              <div className="font-bold text-blue-400">10-Heavy Shoe (+20 Bonus Tens)</div>
              <div className="text-[10px] text-slate-400">Biased shoe favoring double downs and blackjacks</div>
            </button>

            <button
              onClick={() => onResetDeckWithPreset('aces')}
              className="p-3 rounded-lg bg-slate-900 border border-white/10 hover:border-amber-400 text-left cursor-pointer transition-all hover:bg-slate-800"
            >
              <div className="font-bold text-red-400">Ace Frenzy (+12 Holo Aces)</div>
              <div className="text-[10px] text-slate-400">Frequent soft totals, pairs of Aces & natural 21s</div>
            </button>

            <button
              onClick={() => onResetDeckWithPreset('chaos')}
              className="p-3 rounded-lg bg-slate-900 border border-white/10 hover:border-amber-400 text-left cursor-pointer transition-all hover:bg-slate-800"
            >
              <div className="font-bold text-purple-400">Pure Balatro Chaos (All Enhanced)</div>
              <div className="text-[10px] text-slate-400">Random Glass, Steel, Lucky, Mult, Foil & Holo cards</div>
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: SPAWN ITEMS */}
      {activeTab === 'items' && (
        <div className="space-y-3 text-xs font-balatro">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Spawn Tarot */}
            <div className="p-3 rounded-lg bg-black/40 border border-white/10 space-y-2">
              <span className="font-bold text-amber-300 block">Spawn Tarot Card</span>
              <div className="flex gap-2">
                <select
                  value={selectedTarotKey}
                  onChange={(e) => setSelectedTarotKey(e.target.value as TarotType)}
                  className="flex-1 bg-slate-900 border border-white/20 text-white rounded px-2 py-1 text-xs"
                >
                  {tarotKeys.map((k) => (
                    <option key={k} value={k}>
                      {TAROT_CATALOG[k].name} ({TAROT_CATALOG[k].romanNumeral})
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleSpawnTarot}
                  className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer"
                >
                  Spawn
                </button>
              </div>
              <p className="text-[10px] text-slate-400">
                {TAROT_CATALOG[selectedTarotKey].description}
              </p>
            </div>

            {/* Spawn Joker */}
            <div className="p-3 rounded-lg bg-black/40 border border-white/10 space-y-2">
              <span className="font-bold text-amber-300 block">Spawn Balatro Joker</span>
              <div className="flex gap-2">
                <select
                  value={selectedJokerKey}
                  onChange={(e) => setSelectedJokerKey(e.target.value)}
                  className="flex-1 bg-slate-900 border border-white/20 text-white rounded px-2 py-1 text-xs"
                >
                  {JOKERS_CATALOG.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.name} ({j.rarity})
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleSpawnJoker}
                  className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer"
                >
                  Spawn
                </button>
              </div>
              <p className="text-[10px] text-slate-400">
                {JOKERS_CATALOG.find((j) => j.id === selectedJokerKey)?.description}
              </p>
            </div>
          </div>

          {/* Cash & Sandbox toggles */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg bg-slate-900/60 border border-white/10">
            <div className="flex items-center gap-2">
              <button
                onClick={() => onAddCash(100)}
                className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
              >
                +$100 Cash
              </button>
              <button
                onClick={() => onAddCash(500)}
                className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
              >
                +$500 Cash
              </button>
            </div>

            <button
              onClick={onToggleInfiniteMoney}
              className={`px-3 py-1.5 rounded font-bold cursor-pointer transition-colors ${
                infiniteMoney ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {infiniteMoney ? '♾️ Infinite Bankroll: ON' : '♾️ Infinite Bankroll: OFF'}
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: MONTE CARLO SIMULATOR */}
      {activeTab === 'sim' && (
        <div className="space-y-3 font-balatro">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-sm text-amber-300">Fast 1,000-Hand Monte Carlo Engine</h4>
              <p className="text-[10px] text-slate-400">
                Simulates 1,000 hands of perfect basic strategy under current rules & shoe
              </p>
            </div>
            <button
              onClick={runMonteCarloSimulation}
              disabled={isSimulating}
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg cursor-pointer transition-transform active:scale-95 disabled:opacity-50"
            >
              {isSimulating ? 'Simulating...' : 'Run 1,000 Hands'}
            </button>
          </div>

          {simResults && (
            <div className="space-y-2 mt-2">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2 rounded bg-black/40 border border-emerald-500/30">
                  <span className="text-[10px] text-slate-400 block">Player Wins</span>
                  <span className="font-bold text-base text-emerald-400">
                    {simResults.playerWinPct}%
                  </span>
                  <span className="text-[9px] text-slate-500 block">({simResults.playerWins} hands)</span>
                </div>

                <div className="p-2 rounded bg-black/40 border border-rose-500/30">
                  <span className="text-[10px] text-slate-400 block">Dealer Wins</span>
                  <span className="font-bold text-base text-rose-400">
                    {simResults.dealerWinPct}%
                  </span>
                  <span className="text-[9px] text-slate-500 block">({simResults.dealerWins} hands)</span>
                </div>

                <div className="p-2 rounded bg-black/40 border border-white/10">
                  <span className="text-[10px] text-slate-400 block">Pushes</span>
                  <span className="font-bold text-base text-slate-300">
                    {simResults.pushPct}%
                  </span>
                  <span className="text-[9px] text-slate-500 block">({simResults.pushes} hands)</span>
                </div>

                <div className="p-2 rounded bg-black/40 border border-amber-500/30">
                  <span className="text-[10px] text-slate-400 block">House Edge</span>
                  <span
                    className={`font-bold text-base ${
                      simResults.houseEdgePct <= 0 ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {simResults.houseEdgePct > 0 ? `+${simResults.houseEdgePct}%` : `${simResults.houseEdgePct}%`}
                  </span>
                  <span className="text-[9px] text-slate-500 block">
                    {simResults.blackjacks} Natural BJs
                  </span>
                </div>
              </div>

              {/* Graphical distribution bar */}
              <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-800">
                <div
                  className="bg-emerald-500 h-full"
                  style={{ width: `${simResults.playerWinPct}%` }}
                  title={`Player: ${simResults.playerWinPct}%`}
                />
                <div
                  className="bg-slate-400 h-full"
                  style={{ width: `${simResults.pushPct}%` }}
                  title={`Push: ${simResults.pushPct}%`}
                />
                <div
                  className="bg-rose-500 h-full"
                  style={{ width: `${simResults.dealerWinPct}%` }}
                  title={`Dealer: ${simResults.dealerWinPct}%`}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
