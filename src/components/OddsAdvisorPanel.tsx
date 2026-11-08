import React, { useState } from 'react';
import { Card, OddsAnalysis } from '../game/types';
import { sound } from '../game/audio';

interface OddsAdvisorPanelProps {
  odds: OddsAnalysis | null;
  learningModeActive: boolean;
  shoeCards: Card[];
}

export const OddsAdvisorPanel: React.FC<OddsAdvisorPanelProps> = ({
  odds,
  learningModeActive,
  shoeCards,
}) => {
  const [activeTab, setActiveTab] = useState<'odds' | 'lessons' | 'matrix' | 'counting'>('odds');
  const [selectedLessonId, setSelectedLessonId] = useState<string>('lesson-1');
  const [quizScenarioIdx, setQuizScenarioIdx] = useState<number>(0);
  const [quizAnswerFeedback, setQuizAnswerFeedback] = useState<string | null>(null);

  // Hi-Lo Drill State
  const [hideCountForQuiz, setHideCountForQuiz] = useState(false);
  const [userGuess, setUserGuess] = useState('');
  const [countFeedback, setCountFeedback] = useState<string | null>(null);

  // Calculate detailed remaining card breakdown from the live shoe
  const totalCardsInShoe = shoeCards.length || 1;
  const rankBuckets = [
    { rank: 'A', name: 'Ace (A)', valueDesc: '1 or 11', ranks: ['A'] },
    { rank: '2', name: 'Two (2)', valueDesc: '2', ranks: ['2'] },
    { rank: '3', name: 'Three (3)', valueDesc: '3', ranks: ['3'] },
    { rank: '4', name: 'Four (4)', valueDesc: '4', ranks: ['4'] },
    { rank: '5', name: 'Five (5)', valueDesc: '5', ranks: ['5'] },
    { rank: '6', name: 'Six (6)', valueDesc: '6', ranks: ['6'] },
    { rank: '7', name: 'Seven (7)', valueDesc: '7', ranks: ['7'] },
    { rank: '8', name: 'Eight (8)', valueDesc: '8', ranks: ['8'] },
    { rank: '9', name: 'Nine (9)', valueDesc: '9', ranks: ['9'] },
    { rank: '10', name: '10 / J / Q / K', valueDesc: '10 (Face Cards)', ranks: ['10', 'J', 'Q', 'K'] },
  ];

  const cardStats = rankBuckets.map((bucket) => {
    const count = shoeCards.filter((c) => bucket.ranks.includes(c.rank)).length;
    const prob = Math.round((count / totalCardsInShoe) * 1000) / 10;
    
    // Impact on player hand if odds available
    let impact: 'bust' | 'twentyone' | 'safe' = 'safe';
    if (odds) {
      const cardVal = bucket.rank === 'A' ? 1 : bucket.rank === '10' ? 10 : parseInt(bucket.rank, 10);
      if (!odds.isSoft) {
        if (odds.playerValue + cardVal > 21) {
          impact = 'bust';
        } else if (odds.playerValue + (bucket.rank === 'A' ? 11 : cardVal) === 21 || odds.playerValue + cardVal === 21) {
          impact = 'twentyone';
        }
      } else {
        if (odds.playerValue === 21) {
          impact = 'bust';
        }
      }
    }

    return {
      ...bucket,
      count,
      prob,
      impact,
    };
  });

  // Calculate 10-value card percentage
  const tensCount = shoeCards.filter((c) => ['10', 'J', 'Q', 'K'].includes(c.rank)).length;
  const tensProb = Math.round((tensCount / totalCardsInShoe) * 1000) / 10;
  const acesCount = shoeCards.filter((c) => c.rank === 'A').length;
  const acesProb = Math.round((acesCount / totalCardsInShoe) * 1000) / 10;

  // Interactive Clickable Lessons
  const lessons = [
    {
      id: 'lesson-1',
      title: '1. Card Values & Soft vs Hard Hands',
      category: 'Fundamentals',
      summary: 'Learn the difference between flexible Soft hands and rigid Hard hands.',
      content: (
        <div className="space-y-3 text-xs leading-relaxed text-slate-200">
          <p>
            In Blackjack, cards 2 through 10 carry their face value. Face cards (<strong>Jack, Queen, King</strong>) all count as <strong>10</strong>.
          </p>
          <div className="p-2.5 rounded-lg bg-black/50 border border-white/10 space-y-1.5">
            <span className="font-bold text-amber-300 block">The Dual Nature of the Ace:</span>
            <p className="text-[11px] text-slate-300">
              An <strong>Ace</strong> can count as either <strong>1</strong> or <strong>11</strong>.
            </p>
            <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside">
              <li><strong>Soft Hand:</strong> Any hand containing an Ace counted as 11 (e.g. Ace + 6 = Soft 17). <em>You cannot bust on the next hit</em>, because if you draw a 10, the Ace effortlessly reduces to 1 (making 17).</li>
              <li><strong>Hard Hand:</strong> A hand with no Ace, or where all Aces must count as 1 to avoid busting (e.g. 10 + 6 = Hard 16).</li>
            </ul>
          </div>
          <p className="text-[11px] text-slate-400">
            <strong>Key takeaway:</strong> Never be afraid to hit Soft 17 or Soft 18 against strong dealer cards (9, 10, A). You have free insurance!
          </p>
        </div>
      ),
    },
    {
      id: 'lesson-2',
      title: '2. The 5 Golden Rules of Basic Strategy',
      category: 'Strategy',
      summary: 'Mathematically proven rules that lower the house edge below 0.5%.',
      content: (
        <div className="space-y-2.5 text-xs leading-relaxed text-slate-200">
          <div className="p-2 rounded bg-black/40 border border-emerald-500/30">
            <strong className="text-emerald-400 block mb-0.5">Rule 1: Always Split Aces and 8s</strong>
            <p className="text-[11px] text-slate-300">
              Two Aces give you a soft 12. Splitting gives you two dominant starting hands of 11. A pair of 8s makes 16 (the worst total in blackjack); splitting gives you two starting hands of 8.
            </p>
          </div>
          <div className="p-2 rounded bg-black/40 border border-rose-500/30">
            <strong className="text-rose-400 block mb-0.5">Rule 2: Never Split 10s or 5s</strong>
            <p className="text-[11px] text-slate-300">
              A 20 is already an 88%+ winning hand; never break it up. A pair of 5s is a Hard 10—double down instead!
            </p>
          </div>
          <div className="p-2 rounded bg-black/40 border border-amber-500/30">
            <strong className="text-amber-300 block mb-0.5">Rule 3: Stand on Hard 12-16 vs Dealer 2-6</strong>
            <p className="text-[11px] text-slate-300">
              When the dealer shows 2 through 6, they are in 'Bust Territory' (~35% to 42% bust chance). Do not risk busting yourself!
            </p>
          </div>
          <div className="p-2 rounded bg-black/40 border border-cyan-500/30">
            <strong className="text-cyan-300 block mb-0.5">Rule 4: Double Down on 10 and 11</strong>
            <p className="text-[11px] text-slate-300">
              With 16 ten-value cards per deck, 10 and 11 have a massive probability of hitting 20 or 21. Double your bet to maximize expected value!
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'lesson-3',
      title: '3. Understanding Bust Odds & Dealer Weakness',
      category: 'Probability',
      summary: 'Why dealer upcards 5 and 6 are the weakest in the game.',
      content: (
        <div className="space-y-2.5 text-xs text-slate-200">
          <p>
            The dealer must play strictly by the rules: draw until reaching at least 17. The upcard reveals their vulnerability:
          </p>
          <div className="grid grid-cols-5 gap-1.5 text-center font-balatro pt-1">
            <div className="p-1.5 rounded bg-rose-950/60 border border-rose-500/30">
              <span className="text-[10px] text-slate-400 block">Upcard 5</span>
              <span className="text-sm font-bold text-rose-400">42.8%</span>
              <span className="text-[9px] text-slate-400">Bust Rate</span>
            </div>
            <div className="p-1.5 rounded bg-rose-950/60 border border-rose-500/30">
              <span className="text-[10px] text-slate-400 block">Upcard 6</span>
              <span className="text-sm font-bold text-rose-400">42.0%</span>
              <span className="text-[9px] text-slate-400">Bust Rate</span>
            </div>
            <div className="p-1.5 rounded bg-black/50 border border-white/10">
              <span className="text-[10px] text-slate-400 block">Upcard 7</span>
              <span className="text-sm font-bold text-amber-300">25.9%</span>
              <span className="text-[9px] text-slate-400">Bust Rate</span>
            </div>
            <div className="p-1.5 rounded bg-black/50 border border-white/10">
              <span className="text-[10px] text-slate-400 block">Upcard 10</span>
              <span className="text-sm font-bold text-slate-300">21.4%</span>
              <span className="text-[9px] text-slate-400">Bust Rate</span>
            </div>
            <div className="p-1.5 rounded bg-black/50 border border-white/10">
              <span className="text-[10px] text-slate-400 block">Upcard Ace</span>
              <span className="text-sm font-bold text-slate-300">11.6%</span>
              <span className="text-[9px] text-slate-400">Bust Rate</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-300">
            Notice how dealer bust rates drop from <strong>42.8%</strong> on a 5 down to only <strong>11.6%</strong> on an Ace!
          </p>
        </div>
      ),
    },
    {
      id: 'lesson-4',
      title: '4. Card Counting (Hi-Lo System) Masterclass',
      category: 'Card Counting',
      summary: 'How card counters track shoe composition to gain an authentic edge.',
      content: (
        <div className="space-y-2.5 text-xs text-slate-200">
          <p>
            The Hi-Lo system tracks the ratio of high cards to low cards remaining in the shoe:
          </p>
          <div className="grid grid-cols-3 gap-2 text-center font-balatro">
            <div className="p-2 rounded bg-emerald-950/50 border border-emerald-500/40">
              <span className="text-emerald-400 font-bold block text-sm">+1</span>
              <span className="text-slate-300 text-[10px]">Cards 2, 3, 4, 5, 6</span>
              <span className="text-[9px] text-slate-500 block">Helps dealer if drawn</span>
            </div>
            <div className="p-2 rounded bg-slate-900 border border-white/10">
              <span className="text-slate-400 font-bold block text-sm">0</span>
              <span className="text-slate-300 text-[10px]">Cards 7, 8, 9</span>
              <span className="text-[9px] text-slate-500 block">Neutral cards</span>
            </div>
            <div className="p-2 rounded bg-rose-950/50 border border-rose-500/40">
              <span className="text-rose-400 font-bold block text-sm">-1</span>
              <span className="text-slate-300 text-[10px]">10, J, Q, K, Ace</span>
              <span className="text-[9px] text-slate-500 block">Favors player</span>
            </div>
          </div>
          <div className="p-2.5 rounded bg-black/60 border border-white/10 space-y-1">
            <strong className="text-amber-300 block text-[11px]">The True Count Formula:</strong>
            <p className="text-[11px] font-mono text-cyan-300">
              True Count = Running Count ÷ Decks Remaining
            </p>
            <p className="text-[10px] text-slate-400">
              A True Count of <strong>+2 or higher</strong> means the remaining shoe is rich in Aces and 10s, increasing player Blackjacks, successful double downs, and dealer busts!
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'lesson-5',
      title: '5. Interactive Decision Practice Scenarios',
      category: 'Practice Quiz',
      summary: 'Test your instincts on high-leverage blackjack hands.',
      content: (
        <div className="space-y-3 text-xs text-slate-200">
          <p>
            What is the mathematically optimal move in this scenario?
          </p>
          {(() => {
            const scenarios = [
              {
                hand: 'Hard 16 (10 + 6)',
                dealer: 'Dealer shows 10',
                correct: 'SURRENDER',
                altCorrect: 'HIT',
                explanation: 'Surrender is optimal because you recover 50% of your bet, avoiding a ~77% losing outcome. If surrender is not allowed, you must HIT!',
              },
              {
                hand: 'Pair of 8s (8 + 8)',
                dealer: 'Dealer shows 10',
                correct: 'SPLIT',
                explanation: 'Always SPLIT 8s! 16 is a guaranteed money-loser; splitting gives you two starting hands of 8 with much higher expected value.',
              },
              {
                hand: 'Hard 11 (6 + 5)',
                dealer: 'Dealer shows 6',
                correct: 'DOUBLE',
                explanation: 'DOUBLE DOWN! You have an 11 against the dealer\'s worst bust card (42% bust chance). Maximize your bet!',
              },
              {
                hand: 'Pair of 10s (K + Q)',
                dealer: 'Dealer shows 5',
                correct: 'STAND',
                explanation: 'STAND! Never split 10s. You already hold a dominant 20; splitting risks turning a winning hand into two mediocre hands.',
              },
            ];

            const sc = scenarios[quizScenarioIdx % scenarios.length];

            const handleAnswer = (choice: string) => {
              if (choice === sc.correct || choice === sc.altCorrect) {
                sound.playTallyDing(4);
                setQuizAnswerFeedback(`✓ Correct! ${sc.explanation}`);
              } else {
                sound.playGlassBreak();
                setQuizAnswerFeedback(`✗ Incorrect. The correct play is ${sc.correct}. ${sc.explanation}`);
              }
            };

            return (
              <div className="p-3 rounded-lg bg-black/60 border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-balatro">
                  <span className="text-amber-400 font-bold">{sc.hand}</span>
                  <span className="text-slate-300">{sc.dealer}</span>
                </div>

                <div className="grid grid-cols-4 gap-2 font-balatro text-xs">
                  {['HIT', 'STAND', 'DOUBLE', 'SPLIT'].map((act) => (
                    <button
                      key={act}
                      onClick={() => handleAnswer(act)}
                      className="py-1.5 px-2 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold cursor-pointer transition-colors"
                    >
                      {act}
                    </button>
                  ))}
                </div>

                {quizAnswerFeedback && (
                  <p className="text-[11px] font-balatro p-2 rounded bg-slate-900 border border-white/10 text-amber-300">
                    {quizAnswerFeedback}
                  </p>
                )}

                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => {
                      setQuizScenarioIdx((i) => i + 1);
                      setQuizAnswerFeedback(null);
                    }}
                    className="text-[10px] font-balatro text-blue-400 hover:underline cursor-pointer"
                  >
                    Next Scenario →
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      ),
    },
  ];

  return (
    <div className="rounded-xl border-2 border-blue-500/60 bg-gradient-to-b from-slate-950/95 via-blue-950/40 to-slate-950/95 p-3.5 shadow-2xl backdrop-blur-md">
      {/* Top Header & Tab Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎓</span>
          <div>
            <h3 className="font-balatro font-black text-sm text-blue-300 tracking-wide uppercase">
              Blackjack Academy & Shoe Odds
            </h3>
            <p className="text-[10px] text-slate-400">
              Real-time deck counts, bust probabilities & clickable lessons
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 bg-black/60 p-0.5 rounded-lg border border-white/10">
          <button
            onClick={() => setActiveTab('odds')}
            className={`px-2 py-1 rounded text-[11px] font-balatro font-bold transition-colors cursor-pointer ${
              activeTab === 'odds' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Live Odds & Deck
          </button>
          <button
            onClick={() => setActiveTab('lessons')}
            className={`px-2 py-1 rounded text-[11px] font-balatro font-bold transition-colors cursor-pointer ${
              activeTab === 'lessons' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Click to Learn
          </button>
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-2 py-1 rounded text-[11px] font-balatro font-bold transition-colors cursor-pointer ${
              activeTab === 'matrix' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Strategy Matrix
          </button>
          <button
            onClick={() => setActiveTab('counting')}
            className={`px-2 py-1 rounded text-[11px] font-balatro font-bold transition-colors cursor-pointer ${
              activeTab === 'counting' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Hi-Lo Count
          </button>
        </div>
      </div>

      {/* TAB 1: LIVE ODDS & SHOE CARDS BREAKDOWN */}
      {activeTab === 'odds' && (
        <div className="space-y-3 font-balatro">
          {/* Main Probabilities Meters */}
          {odds ? (
            <div className="grid grid-cols-2 gap-2">
              {/* Bust on Hit */}
              <div className="p-2.5 rounded-lg bg-black/50 border border-white/10 text-center">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-0.5">
                  Bust Chance on Hit
                </span>
                <span
                  className={`font-black text-xl md:text-2xl ${
                    odds.bustChanceIfHit > 50
                      ? 'text-rose-400'
                      : odds.bustChanceIfHit > 25
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {odds.bustChanceIfHit}%
                </span>
                <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
                  <div
                    className={`h-full ${
                      odds.bustChanceIfHit > 50 ? 'bg-rose-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, odds.bustChanceIfHit)}%` }}
                  />
                </div>
              </div>

              {/* Exact 21 Chance */}
              <div className="p-2.5 rounded-lg bg-black/50 border border-white/10 text-center">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-0.5">
                  Hit Exactly 21
                </span>
                <span className="font-black text-xl md:text-2xl text-cyan-400">
                  {odds.twentyOneChanceIfHit}%
                </span>
                <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
                  <div
                    className="h-full bg-cyan-400"
                    style={{ width: `${Math.min(100, odds.twentyOneChanceIfHit * 3)}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="p-2.5 rounded-lg bg-black/40 border border-white/10 text-center text-xs text-slate-400">
              Deal a hand to view live bust probability and optimal action.
            </div>
          )}

          {/* Key Combos & Card Metrics */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 rounded bg-black/40 border border-white/10">
              <span className="text-[9px] text-slate-400 block">10-Value Cards</span>
              <span className="font-bold text-amber-300">{tensProb}%</span>
              <span className="text-[9px] text-slate-500 block">({tensCount} left)</span>
            </div>
            <div className="p-2 rounded bg-black/40 border border-white/10">
              <span className="text-[9px] text-slate-400 block">Aces in Shoe</span>
              <span className="font-bold text-emerald-400">{acesProb}%</span>
              <span className="text-[9px] text-slate-500 block">({acesCount} left)</span>
            </div>
            <div className="p-2 rounded bg-black/40 border border-white/10">
              <span className="text-[9px] text-slate-400 block">Shoe Total</span>
              <span className="font-bold text-slate-200">{totalCardsInShoe}</span>
              <span className="text-[9px] text-slate-500 block">Remaining</span>
            </div>
          </div>

          {/* Cards Left in the Deck Grid */}
          <div className="p-2.5 rounded-xl bg-black/60 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Cards Left in Deck & Point Values
              </span>
              <span className="text-[10px] text-slate-400">
                {totalCardsInShoe} total cards
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-xs">
              {cardStats.map((item) => {
                let badgeCol = 'border-white/10 bg-slate-900/60 text-slate-300';
                if (item.impact === 'bust') {
                  badgeCol = 'border-rose-500/40 bg-rose-950/40 text-rose-300';
                } else if (item.impact === 'twentyone') {
                  badgeCol = 'border-cyan-500/40 bg-cyan-950/40 text-cyan-300';
                }

                return (
                  <div
                    key={item.rank}
                    className={`p-1.5 rounded-lg border ${badgeCol} flex flex-col justify-between`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-sm">{item.rank}</span>
                      <span className="text-[10px] text-slate-400">val: {item.valueDesc}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[10px]">
                      <span className="font-bold text-white">{item.count} left</span>
                      <span className="text-amber-400">{item.prob}%</span>
                    </div>
                    {item.impact === 'bust' && (
                      <span className="text-[8px] font-bold text-rose-400 mt-0.5">💥 BUSTS</span>
                    )}
                    {item.impact === 'twentyone' && (
                      <span className="text-[8px] font-bold text-cyan-400 mt-0.5">🎯 MAKES 21</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CLICK TO LEARN ACADEMY */}
      {activeTab === 'lessons' && (
        <div className="space-y-3 font-balatro">
          <p className="text-xs text-slate-300">
            Click any topic below to master essential Blackjack mathematics and strategy:
          </p>

          {/* Clickable Topics Pill Bar */}
          <div className="flex flex-wrap gap-1.5">
            {lessons.map((lesson) => (
              <button
                key={lesson.id}
                onClick={() => setSelectedLessonId(lesson.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedLessonId === lesson.id
                    ? 'bg-amber-400 text-slate-950 shadow-md'
                    : 'bg-slate-900 border border-white/10 text-slate-300 hover:border-amber-400 hover:text-white'
                }`}
              >
                {lesson.title.split(' ')[1]} {lesson.title.split(' ').slice(2, 4).join(' ')}
              </button>
            ))}
          </div>

          {/* Active Lesson Display */}
          {(() => {
            const currentLesson = lessons.find((l) => l.id === selectedLessonId) || lessons[0];
            return (
              <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 space-y-2">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <h4 className="font-black text-sm text-amber-300 uppercase">
                    {currentLesson.title}
                  </h4>
                  <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-blue-900/40 text-blue-300 border border-blue-500/30">
                    {currentLesson.category}
                  </span>
                </div>
                {currentLesson.content}
              </div>
            );
          })()}
        </div>
      )}

      {/* TAB 3: BASIC STRATEGY MATRIX */}
      {activeTab === 'matrix' && (
        <div className="space-y-2 font-balatro">
          <div className="text-[11px] text-slate-300">
            Standard Basic Strategy Chart. Your active hand total vs dealer upcard is highlighted:
          </div>

          <div className="overflow-x-auto text-[10px]">
            <table className="w-full border-collapse border border-white/20 text-center">
              <thead>
                <tr className="bg-slate-900 text-slate-300">
                  <th className="p-1 border border-white/10">Your Hand</th>
                  {['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A'].map((c) => (
                    <th
                      key={c}
                      className={`p-1 border border-white/10 ${
                        odds?.dealerUpcardDisplay === c ? 'bg-amber-500 text-slate-950 font-black' : ''
                      }`}
                    >
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { hand: 'Hard 17+', play: 'S S S S S S S S S S' },
                  { hand: 'Hard 16', play: 'S S S S S H H Rh Rh Rh' },
                  { hand: 'Hard 15', play: 'S S S S S H H H Rh H' },
                  { hand: 'Hard 12', play: 'H H S S S H H H H H' },
                  { hand: 'Hard 11', play: 'D D D D D D D D D H' },
                  { hand: 'Hard 10', play: 'D D D D D D D D H H' },
                  { hand: 'Soft 18 (A,7)', play: 'S Ds Ds Ds Ds S S H H H' },
                  { hand: 'Soft 17 (A,6)', play: 'H D D D D H H H H H' },
                  { hand: 'Pair A,A', play: 'P P P P P P P P P P' },
                  { hand: 'Pair 8,8', play: 'P P P P P P P P P P' },
                  { hand: 'Pair 10,10', play: 'S S S S S S S S S S' },
                ].map((row) => {
                  const isCurrentRow =
                    odds &&
                    ((row.hand.includes(String(odds.playerValue)) && !odds.isSoft) ||
                      (row.hand.includes(`Soft ${odds.playerValue}`) && odds.isSoft));
                  const actions = row.play.split(' ');

                  return (
                    <tr
                      key={row.hand}
                      className={isCurrentRow ? 'bg-blue-900/60 font-bold text-amber-300' : 'hover:bg-slate-900/50'}
                    >
                      <td className="p-1 border border-white/10 text-left font-bold">{row.hand}</td>
                      {actions.map((act, idx) => (
                        <td
                          key={idx}
                          className={`p-1 border border-white/10 ${
                            act === 'S'
                              ? 'text-rose-400 font-bold'
                              : act === 'H'
                              ? 'text-emerald-400 font-bold'
                              : act.startsWith('D')
                              ? 'text-cyan-400 font-bold'
                              : act === 'P'
                              ? 'text-purple-400 font-bold'
                              : 'text-slate-400'
                          }`}
                        >
                          {act}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap gap-3 text-[10px] text-slate-400 mt-2">
            <span><strong className="text-emerald-400">H</strong> = Hit</span>
            <span><strong className="text-rose-400">S</strong> = Stand</span>
            <span><strong className="text-cyan-400">D</strong> = Double</span>
            <span><strong className="text-purple-400">P</strong> = Split</span>
            <span><strong className="text-slate-400">Rh</strong> = Surrender</span>
          </div>
        </div>
      )}

      {/* TAB 4: HI-LO COUNTING */}
      {activeTab === 'counting' && (
        <div className="space-y-3 font-balatro">
          <p className="text-xs text-slate-300">
            Card counting assesses shoe composition: 2-6 gives <span className="text-emerald-400 font-bold">+1</span>, 7-9 is <span className="text-slate-400 font-bold">0</span>, and 10-Ace gives <span className="text-rose-400 font-bold">-1</span>.
          </p>

          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-black/50 border border-white/10">
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-widest">
                Shoe Status
              </div>
              <div className="text-sm font-bold text-slate-200">
                {odds ? `${odds.decksRemaining} Decks Remaining` : `${Math.round(totalCardsInShoe / 52)} Decks`}
              </div>
            </div>

            {!hideCountForQuiz ? (
              <div className="flex gap-4">
                <div className="text-center">
                  <span className="text-[10px] text-slate-400 block">Running Count</span>
                  <span
                    className={`font-black text-xl ${
                      (odds?.runningCount ?? 0) > 0
                        ? 'text-emerald-400'
                        : (odds?.runningCount ?? 0) < 0
                        ? 'text-rose-400'
                        : 'text-slate-200'
                    }`}
                  >
                    {(odds?.runningCount ?? 0) > 0 ? `+${odds?.runningCount}` : odds?.runningCount ?? 0}
                  </span>
                </div>
                <div className="text-center">
                  <span className="text-[10px] text-slate-400 block">True Count</span>
                  <span
                    className={`font-black text-xl ${
                      (odds?.trueCount ?? 0) > 1 ? 'text-cyan-400' : 'text-slate-200'
                    }`}
                  >
                    {(odds?.trueCount ?? 0) > 0 ? `+${odds?.trueCount}` : odds?.trueCount ?? 0}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-amber-300 animate-pulse">
                [Count Hidden for Drill]
              </div>
            )}
          </div>

          {/* Drill Form */}
          <div className="p-3 rounded-lg bg-slate-900/60 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-300">Test Your Count Skill</span>
              <button
                onClick={() => {
                  setHideCountForQuiz(!hideCountForQuiz);
                  setCountFeedback(null);
                  setUserGuess('');
                }}
                className="text-[10px] px-2 py-0.5 rounded bg-blue-600/30 text-blue-300 border border-blue-400/40 hover:bg-blue-600/50 cursor-pointer"
              >
                {hideCountForQuiz ? 'Reveal Count' : 'Hide Count for Practice'}
              </button>
            </div>

            {hideCountForQuiz && (
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="number"
                  placeholder="Estimated Running Count"
                  value={userGuess}
                  onChange={(e) => setUserGuess(e.target.value)}
                  className="px-2 py-1 text-xs rounded bg-black border border-white/20 text-white w-48"
                />
                <button
                  onClick={() => {
                    const parsed = parseInt(userGuess, 10);
                    if (isNaN(parsed)) {
                      setCountFeedback('Please enter a valid number.');
                      return;
                    }
                    if (parsed === (odds?.runningCount ?? 0)) {
                      sound.playTallyDing(5);
                      setCountFeedback(`✓ Exactly right! The running count is ${odds?.runningCount}.`);
                    } else {
                      sound.playGlassBreak();
                      setCountFeedback(`✗ Not quite. The actual running count is ${odds?.runningCount} (you estimated ${parsed}).`);
                    }
                  }}
                  className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer"
                >
                  Verify
                </button>
              </div>
            )}

            {countFeedback && (
              <p className="text-xs mt-2 text-amber-300">
                {countFeedback}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
