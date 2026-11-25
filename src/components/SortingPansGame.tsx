import React, { useCallback, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Volume2,
  AlertCircle,
  Users,
  ArrowRight,
} from 'lucide-react';
import { WeatherId, WeatherItem } from '../types/weather';
import { WEATHER_ITEMS } from '../data/weatherData';
import { SkyWeatherSprite } from './SkyWeatherSprite';
import { weatherAudio } from '../utils/audioEngine';

type SortingSection = 'section1' | 'section2';
type GroupCount = 1 | 2 | 3;
type RoundMultiplier = 1 | 2 | 3;

interface PanDefinition {
  id: string;
  weatherId: WeatherId;
  title: string;
  subtitle: string;
  chineseLabel: string;
  trayClass: string;
  rimClass: string;
  headerTextClass: string;
}

interface SortCardInstance {
  uid: string;
  item: WeatherItem;
}

interface SortingPansGameProps {
  showChinese: boolean;
  activeStudentName: string;
  onSpeakText: (text: string) => void;
  onAwardPoints: (points: number, weatherId: WeatherId) => void;
}

const SECTION_1_PANS: PanDefinition[] = [
  {
    id: 'pan-sunny',
    weatherId: 'sunny',
    title: 'Sunny',
    subtitle: 'sunny sun',
    chineseLabel: '晴天 · 太阳',
    trayClass: 'bg-amber-50/75 border-amber-300',
    rimClass: 'bg-amber-100/80 border-b border-amber-200',
    headerTextClass: 'text-amber-900',
  },
  {
    id: 'pan-snowy',
    weatherId: 'snowy',
    title: 'Snowy',
    subtitle: 'snowy cloud',
    chineseLabel: '雪天 · 雪云',
    trayClass: 'bg-cyan-50/75 border-cyan-300',
    rimClass: 'bg-cyan-100/80 border-b border-cyan-200',
    headerTextClass: 'text-cyan-900',
  },
];

const SECTION_2_PANS: PanDefinition[] = [
  {
    id: 'pan-windy',
    weatherId: 'windy',
    title: 'Windy',
    subtitle: 'windy cloud',
    chineseLabel: '风天 · 风云',
    trayClass: 'bg-teal-50/75 border-teal-300',
    rimClass: 'bg-teal-100/80 border-b border-teal-200',
    headerTextClass: 'text-teal-900',
  },
  {
    id: 'pan-cloudy',
    weatherId: 'cloudy',
    title: 'Cloudy',
    subtitle: 'cloudy sky',
    chineseLabel: '多云 · 云朵',
    trayClass: 'bg-slate-100/85 border-slate-300',
    rimClass: 'bg-slate-200/75 border-b border-slate-300',
    headerTextClass: 'text-slate-900',
  },
  {
    id: 'pan-rainy',
    weatherId: 'rainy',
    title: 'Rainy',
    subtitle: 'rainy cloud',
    chineseLabel: '雨天 · 雨云',
    trayClass: 'bg-sky-50/80 border-sky-300',
    rimClass: 'bg-sky-100/80 border-b border-sky-200',
    headerTextClass: 'text-sky-900',
  },
];

function buildSectionDeck(section: SortingSection, multiplier: RoundMultiplier): SortCardInstance[] {
  const targetIds: WeatherId[] =
    section === 'section1' ? ['sunny', 'snowy'] : ['windy', 'cloudy', 'rainy'];
  const baseItems = WEATHER_ITEMS.filter((item) => targetIds.includes(item.id));

  const instances: SortCardInstance[] = [];
  for (let rep = 0; rep < multiplier; rep++) {
    baseItems.forEach((item, idx) => {
      instances.push({
        uid: `${section}-${item.id}-${rep}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
        item,
      });
    });
  }

  for (let i = instances.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [instances[i], instances[j]] = [instances[j], instances[i]];
  }
  return instances;
}

export const SortingPansGame: React.FC<SortingPansGameProps> = ({
  showChinese,
  activeStudentName,
  onSpeakText,
  onAwardPoints,
}) => {
  const [activeSection, setActiveSection] = useState<SortingSection>('section1');
  const [multiplier, setMultiplier] = useState<RoundMultiplier>(2);
  const [groupCount, setGroupCount] = useState<GroupCount>(1);

  const [trayCards, setTrayCards] = useState<SortCardInstance[]>(() =>
    buildSectionDeck('section1', 2)
  );
  const [sortedByPan, setSortedByPan] = useState<Record<string, SortCardInstance[]>>({});
  const [selectedCardUid, setSelectedCardUid] = useState<string | null>(null);
  const [draggedCardUid, setDraggedCardUid] = useState<string | null>(null);
  const [hoveredPanId, setHoveredPanId] = useState<string | null>(null);

  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [groupScores, setGroupScores] = useState<number[]>([0, 0, 0]);
  const [mistakes, setMistakes] = useState(0);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const activePans = useMemo(
    () => (activeSection === 'section1' ? SECTION_1_PANS : SECTION_2_PANS),
    [activeSection]
  );

  const resetRound = useCallback(
    (nextSection: SortingSection = activeSection, nextMultiplier: RoundMultiplier = multiplier) => {
      setActiveSection(nextSection);
      setMultiplier(nextMultiplier);
      setTrayCards(buildSectionDeck(nextSection, nextMultiplier));
      setSortedByPan({});
      setSelectedCardUid(null);
      setDraggedCardUid(null);
      setHoveredPanId(null);
      setCurrentGroupIndex(0);
      setGroupScores([0, 0, 0]);
      setMistakes(0);
      setFeedback(null);
    },
    [activeSection, multiplier]
  );

  const handleGroupCountChange = (count: GroupCount) => {
    setGroupCount(count);
    setCurrentGroupIndex(0);
    setGroupScores([0, 0, 0]);
  };

  const tryPlaceCardInPan = (cardUid: string, targetPan: PanDefinition) => {
    const card = trayCards.find((c) => c.uid === cardUid);
    if (!card) return;

    const isCorrect = targetPan.weatherId === card.item.id;

    if (isCorrect) {
      weatherAudio.playSuccessFanfare();
      onSpeakText(`${card.item.word}! ${card.item.phrase}!`);

      setTrayCards((prev) => prev.filter((c) => c.uid !== cardUid));
      setSortedByPan((prev) => ({
        ...prev,
        [targetPan.id]: [...(prev[targetPan.id] || []), card],
      }));
      setSelectedCardUid(null);
      setDraggedCardUid(null);
      setHoveredPanId(null);

      const earned = 15;
      onAwardPoints(earned, card.item.id);

      if (groupCount > 1) {
        setGroupScores((prev) =>
          prev.map((score, idx) => (idx === currentGroupIndex ? score + earned : score))
        );
        const teamLabel = `Group ${currentGroupIndex + 1}`;
        setFeedback({
          type: 'success',
          message: `${teamLabel} placed ${card.item.phrase} in the ${targetPan.title} pan! +${earned} pts`,
        });
        setCurrentGroupIndex((prev) => (prev + 1) % groupCount);
      } else {
        setFeedback({
          type: 'success',
          message: `Great! ${card.item.phrase} goes in the ${targetPan.title} pan (+${earned} pts)`,
        });
      }
    } else {
      weatherAudio.playTryAgain();
      setMistakes((m) => m + 1);
      setDraggedCardUid(null);
      setHoveredPanId(null);
      setFeedback({
        type: 'error',
        message: `Oops! ${card.item.phrase} does not belong in the ${targetPan.title} pan. Try again!`,
      });
    }
  };

  const totalSorted = useMemo(
    () => Object.values(sortedByPan).reduce((sum, list) => sum + list.length, 0),
    [sortedByPan]
  );
  const totalCards = trayCards.length + totalSorted;
  const isRoundComplete = trayCards.length === 0 && totalSorted > 0;
  const selectedCard = trayCards.find((c) => c.uid === selectedCardUid) || null;

  const cardsPerTypeLabel = (mult: RoundMultiplier) => {
    const count = (activeSection === 'section1' ? 2 : 3) * mult;
    return `${count} Cards`;
  };

  return (
    <div className="space-y-5">
      {/* Game Header & Section Switcher */}
      <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900">
              Weather Sorting Pans
            </h1>
            <p className="text-sm text-slate-600 mt-0.5">
              {activeSection === 'section1'
                ? 'Section 1 (2 Pans): Divide sunny & snowy cards into the right pan.'
                : 'Section 2 (3 Pans): Divide windy, cloudy & rainy cards into the right pan.'}
              {showChinese && (
                <span className="ml-1.5 text-slate-500">
                  {activeSection === 'section1'
                    ? '（第一关：把晴天和雪天卡片分进 2 个盘子）'
                    : '（第二关：把风天、多云和雨天卡片分进 3 个盘子）'}
                </span>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Section 1 (2 Pans) vs Section 2 (3 Pans) */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => resetRound('section1', multiplier)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeSection === 'section1'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Section 1: Sunny & Snowy (2 Pans)
              </button>
              <button
                type="button"
                onClick={() => resetRound('section2', multiplier)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeSection === 'section2'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Section 2: Windy, Cloudy & Rainy (3 Pans)
              </button>
            </div>

            {/* Card Count Multiplier */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
              {([1, 2, 3] as RoundMultiplier[]).map((mult) => (
                <button
                  key={mult}
                  type="button"
                  onClick={() => resetRound(activeSection, mult)}
                  className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    multiplier === mult
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {cardsPerTypeLabel(mult)}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => resetRound(activeSection, multiplier)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Shuffle
            </button>
          </div>
        </div>

        {/* Classroom Group Turn Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <Users className="w-4 h-4 text-sky-600" />
              Class Teams:
            </span>
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              {([1, 2, 3] as GroupCount[]).map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => handleGroupCountChange(count)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    groupCount === count
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {count === 1 ? `Solo (${activeStudentName})` : `${count} Groups`}
                </button>
              ))}
            </div>
          </div>

          {groupCount > 1 ? (
            <div className="flex flex-wrap items-center gap-3 text-xs font-mono-nums">
              {Array.from({ length: groupCount }).map((_, idx) => {
                const isTurn = idx === currentGroupIndex && !isRoundComplete;
                return (
                  <span
                    key={idx}
                    className={`px-2.5 py-1 rounded-lg border ${
                      isTurn
                        ? 'bg-sky-50 border-sky-300 text-sky-800 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    {isTurn ? 'Turn: ' : ''}Group {idx + 1} · {groupScores[idx]} pts
                  </span>
                );
              })}
            </div>
          ) : (
            <div className="text-xs text-slate-500 font-mono-nums">
              Sorted {totalSorted}/{totalCards} · Mistakes {mistakes}
            </div>
          )}
        </div>
      </section>

      {/* Feedback Banner */}
      <AnimatePresence mode="wait">
        {feedback && (
          <motion.div
            key={feedback.message}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Weather Card Tray */}
      <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h2 className="font-display text-base font-bold text-slate-900">
            {isRoundComplete ? 'All Cards Sorted!' : 'Weather Cards to Sort'}
          </h2>
          {selectedCard && !isRoundComplete && (
            <span className="text-xs font-semibold text-sky-700">
              Selected: {selectedCard.item.phrase} — now tap the {selectedCard.item.word} pan below!
            </span>
          )}
        </div>

        {isRoundComplete ? (
          <div className="py-6 px-4 bg-emerald-50/70 border border-emerald-200 rounded-xl text-center space-y-3">
            <div className="inline-flex items-center gap-2 text-emerald-800 font-display text-xl font-bold">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              Well Done! All {totalSorted} Cards Are in the Right Pans!
            </div>
            <p className="text-sm text-slate-600 font-mono-nums">
              {totalSorted} cards sorted · {mistakes} wrong tries
              {groupCount > 1 &&
                ` · ${Array.from({ length: groupCount })
                  .map((_, i) => `Group ${i + 1}: ${groupScores[i]} pts`)
                  .join(' / ')}`}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => resetRound(activeSection, multiplier)}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors whitespace-nowrap cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Play Again
              </button>
              {activeSection === 'section1' ? (
                <button
                  type="button"
                  onClick={() => resetRound('section2', multiplier)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-colors whitespace-nowrap cursor-pointer"
                >
                  Next: Section 2 (3 Pans)
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => resetRound('section1', multiplier)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors whitespace-nowrap cursor-pointer"
                >
                  Back to Section 1 (2 Pans)
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {trayCards.map((card) => {
              const isSelected = selectedCardUid === card.uid;
              const isDragging = draggedCardUid === card.uid;
              const imgFailed = Boolean(failedImages[card.item.id]);

              return (
                <div
                  key={card.uid}
                  draggable
                  onDragStart={(e) => {
                    setDraggedCardUid(card.uid);
                    setSelectedCardUid(card.uid);
                    e.dataTransfer.setData('text/plain', card.uid);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  onDragEnd={() => {
                    setDraggedCardUid(null);
                    setHoveredPanId(null);
                  }}
                  onClick={() => {
                    setSelectedCardUid((prev) => (prev === card.uid ? null : card.uid));
                    onSpeakText(`${card.item.word}! ${card.item.phrase}!`);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedCardUid((prev) => (prev === card.uid ? null : card.uid));
                      onSpeakText(`${card.item.word}! ${card.item.phrase}!`);
                    }
                  }}
                  aria-pressed={isSelected}
                  className={`relative flex flex-col bg-white rounded-xl border p-2.5 transition-all cursor-grab active:cursor-grabbing select-none ${
                    isSelected
                      ? 'border-sky-500 ring-2 ring-sky-200 -translate-y-0.5 shadow-md'
                      : 'border-slate-200 hover:border-sky-300 shadow-xs'
                  } ${isDragging ? 'opacity-50' : 'opacity-100'}`}
                >
                  <div
                    className={`relative w-full aspect-square rounded-lg overflow-hidden border border-slate-100 flex items-center justify-center ${card.item.cardBgClass}`}
                  >
                    {!imgFailed ? (
                      <img
                        src={card.item.imagePath}
                        alt={card.item.phrase}
                        draggable={false}
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setFailedImages((prev) => ({ ...prev, [card.item.id]: true }))
                        }
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <SkyWeatherSprite weatherId={card.item.id} className="w-20 h-20" />
                    )}

                    <button
                      type="button"
                      aria-label={`Hear ${card.item.phrase}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSpeakText(`${card.item.word}! ${card.item.phrase}!`);
                      }}
                      className="absolute top-1.5 right-1.5 w-7 h-7 rounded-lg bg-white/90 hover:bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:text-sky-600 cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="mt-2 text-center">
                    <div className="font-display text-sm font-bold text-slate-900 leading-tight">
                      {card.item.word}
                    </div>
                    <div className="text-xs font-medium text-sky-700">{card.item.phrase}</div>
                    {showChinese && (
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        {card.item.chinese}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Sorting Pans Zone (2 Pans for Sunny & Snowy; 3 Pans for Windy, Cloudy & Rainy) */}
      <section
        aria-label="Sorting Pans"
        className={`grid gap-5 ${
          activeSection === 'section1' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3'
        }`}
      >
        {activePans.map((pan, idx) => {
          const cardsInPan = sortedByPan[pan.id] || [];
          const isDropHovered = hoveredPanId === pan.id;
          const canTapToPlace = Boolean(selectedCardUid);

          return (
            <div
              key={pan.id}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (hoveredPanId !== pan.id) {
                  setHoveredPanId(pan.id);
                }
              }}
              onDragLeave={() => {
                if (hoveredPanId === pan.id) {
                  setHoveredPanId(null);
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                const droppedUid = e.dataTransfer.getData('text/plain') || draggedCardUid;
                if (droppedUid) {
                  tryPlaceCardInPan(droppedUid, pan);
                }
              }}
              onClick={() => {
                if (selectedCardUid) {
                  tryPlaceCardInPan(selectedCardUid, pan);
                }
              }}
              role={canTapToPlace ? 'button' : undefined}
              tabIndex={canTapToPlace ? 0 : undefined}
              onKeyDown={(e) => {
                if (canTapToPlace && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  tryPlaceCardInPan(selectedCardUid!, pan);
                }
              }}
              className={`relative rounded-3xl border-2 overflow-hidden transition-all min-h-[250px] flex flex-col ${
                pan.trayClass
              } ${
                isDropHovered
                  ? 'ring-4 ring-sky-300 scale-[1.01] border-sky-500'
                  : canTapToPlace
                    ? 'hover:ring-2 hover:ring-sky-300 cursor-pointer'
                    : ''
              }`}
            >
              {/* Pan Rim / Label Header */}
              <div className={`px-5 py-3.5 ${pan.rimClass}`}>
                <div className="flex items-baseline justify-between gap-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-mono-nums font-bold text-slate-500">
                      PAN {idx + 1}
                    </span>
                    <h3 className={`font-display text-xl font-bold ${pan.headerTextClass}`}>
                      {pan.title}
                    </h3>
                  </div>
                  <span className="text-xs font-mono-nums font-semibold text-slate-600">
                    {cardsInPan.length} placed
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  {pan.subtitle}
                  {showChinese && <span className="ml-1.5 text-slate-500">· {pan.chineseLabel}</span>}
                </p>
              </div>

              {/* Pan Interior Basket */}
              <div className="flex-1 p-4 flex flex-col justify-between">
                {cardsInPan.length === 0 ? (
                  <div className="flex-1 border-2 border-dashed border-slate-300/80 rounded-2xl flex items-center justify-center p-4 text-center">
                    <span className="text-sm font-medium text-slate-500">
                      {canTapToPlace
                        ? `Tap here to place "${selectedCard?.item.phrase}"`
                        : `Put ${pan.title} cards here`}
                    </span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2.5">
                    {cardsInPan.map((placed) => (
                      <motion.div
                        key={placed.uid}
                        initial={{ scale: 0.85, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white border border-emerald-200 rounded-xl p-2 flex flex-col items-center text-center shadow-xs"
                      >
                        <SkyWeatherSprite weatherId={placed.item.id} className="w-14 h-14" />
                        <span className="font-display text-xs font-bold text-slate-900 mt-1">
                          {placed.item.phrase}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                )}

                {canTapToPlace && cardsInPan.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-dashed border-slate-300/70 text-center text-xs font-semibold text-sky-700">
                    Tap pan to place &ldquo;{selectedCard?.item.phrase}&rdquo; here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
};
