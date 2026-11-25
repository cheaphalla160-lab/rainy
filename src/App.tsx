import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Music, VolumeX, Languages, EyeOff, Eye, Gauge } from 'lucide-react';
import {
  AppSection,
  GameMode,
  GamePhase,
  LeaderboardEntry,
  WeatherId,
  WeatherItem,
} from './types/weather';
import { INITIAL_LEADERBOARD, WEATHER_ITEMS } from './data/weatherData';
import { speakEnglishPhrase, weatherAudio } from './utils/audioEngine';
import { ParkStage } from './components/ParkStage';
import { WeatherDeck } from './components/WeatherDeck';
import { LeaderboardPanel } from './components/LeaderboardPanel';
import { WordCardsView } from './components/WordCardsView';
import { TeacherGuideView } from './components/TeacherGuideView';
import { SortingPansGame } from './components/SortingPansGame';

const STORAGE_KEY = 'weather_park_leaderboard_v1';

function loadInitialLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_LEADERBOARD;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return INITIAL_LEADERBOARD;
  } catch {
    return INITIAL_LEADERBOARD;
  }
}

export default function App() {
  const [section, setSection] = useState<AppSection>('play');
  const [mode, setMode] = useState<GameMode>('explore');
  const [phase, setPhase] = useState<GamePhase>('IDLE');

  const [activeWeather, setActiveWeather] = useState<WeatherItem | null>(null);
  const [challengeTarget, setChallengeTarget] = useState<WeatherItem | null>(null);
  const [challengeFeedback, setChallengeFeedback] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const [lastEarnedPoints, setLastEarnedPoints] = useState<number | null>(null);

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(loadInitialLeaderboard);
  const [activeStudentId, setActiveStudentId] = useState<string>(
    () => loadInitialLeaderboard()[0]?.id || ''
  );

  // Classroom Audio & Teaching Preferences
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [musicStarted, setMusicStarted] = useState(false);
  const [musicVolume, setMusicVolume] = useState(35);
  const [speechRate, setSpeechRate] = useState<0.72 | 0.92>(0.92);
  const [showChinese, setShowChinese] = useState(true);
  const [audioOnlyChallenge, setAudioOnlyChallenge] = useState(false);

  const sequenceTimersRef = useRef<number[]>([]);

  const clearSequenceTimers = useCallback(() => {
    sequenceTimersRef.current.forEach((id) => window.clearTimeout(id));
    sequenceTimersRef.current = [];
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(leaderboard));
    } catch {
      // ignore storage quota errors
    }
  }, [leaderboard]);

  useEffect(() => {
    return () => {
      clearSequenceTimers();
      weatherAudio.stopMusic();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [clearSequenceTimers]);

  const ensureBackgroundMusic = useCallback(() => {
    if (musicEnabled && !musicStarted) {
      weatherAudio.setVolume(musicVolume / 100);
      weatherAudio.startMusic();
      setMusicStarted(true);
    }
  }, [musicEnabled, musicStarted, musicVolume]);

  const toggleMusic = () => {
    if (musicEnabled) {
      weatherAudio.stopMusic();
      setMusicEnabled(false);
      setMusicStarted(false);
    } else {
      setMusicEnabled(true);
      weatherAudio.setVolume(musicVolume / 100);
      weatherAudio.startMusic();
      setMusicStarted(true);
    }
  };

  const handleVolumeChange = (nextVol: number) => {
    setMusicVolume(nextVol);
    weatherAudio.setVolume(nextVol / 100);
  };

  const speakPhrase = useCallback(
    (text: string) => {
      ensureBackgroundMusic();
      speakEnglishPhrase(text, speechRate);
    },
    [ensureBackgroundMusic, speechRate]
  );

  const pickRandomChallenge = useCallback(
    (excludeId?: WeatherId) => {
      const pool = excludeId
        ? WEATHER_ITEMS.filter((item) => item.id !== excludeId)
        : WEATHER_ITEMS;
      const chosen = pool[Math.floor(Math.random() * pool.length)];
      setChallengeTarget(chosen);
      setChallengeFeedback(null);
      setActiveWeather(null);
      setPhase('IDLE');
      setLastEarnedPoints(null);
      speakPhrase(`${chosen.word}! ${chosen.phrase}!`);
    },
    [speakPhrase]
  );

  const handleModeChange = (nextMode: GameMode) => {
    ensureBackgroundMusic();
    setMode(nextMode);
    setChallengeFeedback(null);
    setLastEarnedPoints(null);

    if (nextMode === 'challenge') {
      pickRandomChallenge(activeWeather?.id);
    } else {
      setChallengeTarget(null);
    }
  };

  const triggerWeatherDescent = useCallback(
    (item: WeatherItem) => {
      ensureBackgroundMusic();
      setActiveWeather(item);
      setPhase('DESCENDING');
      setLastEarnedPoints(null);
      weatherAudio.playDescentSound(item.id);

      const t = window.setTimeout(() => {
        setPhase('READ_ALOUD');
        speakPhrase(`${item.word}! ${item.phrase}!`);
      }, 420);
      sequenceTimersRef.current.push(t);
    },
    [ensureBackgroundMusic, speakPhrase]
  );

  const handleSelectWeather = (item: WeatherItem) => {
    ensureBackgroundMusic();

    if (mode === 'challenge' && challengeTarget) {
      if (item.id !== challengeTarget.id) {
        weatherAudio.playTryAgain();
        setChallengeFeedback(`Not ${item.phrase}. Try listening again!`);
        setStreak(0);
        return;
      }
      setChallengeFeedback(null);
    }

    triggerWeatherDescent(item);
  };

  const handlePreviewAudio = (item: WeatherItem, e: React.MouseEvent) => {
    e.stopPropagation();
    speakPhrase(`${item.word}! ${item.phrase}!`);
  };

  const awardPointsToActiveStudent = useCallback(
    (points: number, weatherId: WeatherId, nextStreak = 1) => {
      setLeaderboard((prev) => {
        if (prev.length === 0) {
          const guest: LeaderboardEntry = {
            id: 'student-class',
            name: 'Class Star',
            avatar: '🦊',
            score: points,
            wordsPracticed: 1,
            bestStreak: nextStreak,
            masteredWords: [weatherId],
            updatedAt: new Date().toISOString(),
          };
          setActiveStudentId(guest.id);
          return [guest];
        }

        const targetId = activeStudentId || prev[0].id;
        return prev.map((entry) => {
          if (entry.id !== targetId) return entry;
          const mastered = entry.masteredWords.includes(weatherId)
            ? entry.masteredWords
            : [...entry.masteredWords, weatherId];
          return {
            ...entry,
            score: entry.score + points,
            wordsPracticed: entry.wordsPracticed + 1,
            bestStreak: Math.max(entry.bestStreak, nextStreak),
            masteredWords: mastered,
            updatedAt: new Date().toISOString(),
          };
        });
      });
    },
    [activeStudentId]
  );

  const handleCompleteReadAloud = (method: 'voice' | 'manual') => {
    if (!activeWeather) return;
    ensureBackgroundMusic();
    weatherAudio.playSuccessFanfare();

    const basePoints = method === 'voice' ? 20 : 15;
    const modeBonus = mode === 'challenge' ? 10 : 0;
    const nextStreak = streak + 1;
    const streakBonus = nextStreak >= 3 ? 5 : 0;
    const totalEarned = basePoints + modeBonus + streakBonus;

    setStreak(nextStreak);
    setLastEarnedPoints(totalEarned);
    setPhase('CELEBRATE');

    awardPointsToActiveStudent(totalEarned, activeWeather.id, nextStreak);
  };

  const handleAddStudent = (name: string, avatar: string) => {
    ensureBackgroundMusic();
    const existing = leaderboard.find(
      (entry) => entry.name.toLowerCase() === name.toLowerCase()
    );
    if (existing) {
      setActiveStudentId(existing.id);
      setStreak(0);
      return;
    }

    const newEntry: LeaderboardEntry = {
      id: `student-${Date.now()}`,
      name,
      avatar,
      score: 0,
      wordsPracticed: 0,
      bestStreak: 0,
      masteredWords: [],
      updatedAt: new Date().toISOString(),
    };

    setLeaderboard((prev) => [newEntry, ...prev]);
    setActiveStudentId(newEntry.id);
    setStreak(0);
  };

  const handleResetLeaderboard = () => {
    setLeaderboard([]);
    setActiveStudentId('');
    setStreak(0);
  };

  const handlePlayAllWords = () => {
    ensureBackgroundMusic();
    clearSequenceTimers();
    WEATHER_ITEMS.forEach((item, index) => {
      const id = window.setTimeout(() => {
        speakEnglishPhrase(`${item.word}! ${item.phrase}!`, speechRate);
      }, index * 2400);
      sequenceTimersRef.current.push(id);
    });
  };

  const handlePracticeFromCards = (item: WeatherItem) => {
    setSection('play');
    setMode('explore');
    setChallengeTarget(null);
    triggerWeatherDescent(item);
  };

  const activeStudent =
    leaderboard.find((e) => e.id === activeStudentId) || leaderboard[0] || null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-element Brand Wordmark */}
          <button
            type="button"
            onClick={() => setSection('play')}
            className="font-display text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
          >
            Weather Park
          </button>

          {/* Zone 2: Concise single-line navigation links */}
          <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-7">
            {(
              [
                { id: 'play', label: 'Play Park' },
                { id: 'pans', label: 'Sorting Pans' },
                { id: 'cards', label: 'Word Cards' },
                { id: 'leaderboard', label: 'Leaderboard' },
                { id: 'guide', label: 'Lesson Plan' },
              ] as Array<{ id: AppSection; label: string }>
            ).map((navItem) => {
              const active = section === navItem.id;
              return (
                <button
                  key={navItem.id}
                  type="button"
                  onClick={() => setSection(navItem.id)}
                  className={`py-1 text-sm font-medium transition-colors whitespace-nowrap shrink-0 border-b-2 cursor-pointer ${
                    active
                      ? 'text-sky-700 border-sky-600'
                      : 'text-slate-600 border-transparent hover:text-slate-900'
                  }`}
                >
                  {navItem.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Single Primary Action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => {
                setSection('play');
                handleModeChange('challenge');
              }}
              className="px-4 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Start Challenge
            </button>
          </div>
        </div>

        {/* Mobile Navigation Strip (visible below md) */}
        <div className="md:hidden border-t border-slate-100 px-4 py-2 flex items-center justify-between gap-2 overflow-x-auto">
          {(
            [
              { id: 'play', label: 'Play Park' },
              { id: 'pans', label: 'Sorting Pans' },
              { id: 'cards', label: 'Word Cards' },
              { id: 'leaderboard', label: 'Leaderboard' },
              { id: 'guide', label: 'Lesson Plan' },
            ] as Array<{ id: AppSection; label: string }>
          ).map((navItem) => (
            <button
              key={navItem.id}
              type="button"
              onClick={() => setSection(navItem.id)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 cursor-pointer ${
                section === navItem.id
                  ? 'bg-sky-50 text-sky-700'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {navItem.label}
            </button>
          ))}
        </div>
      </header>

      {/* Classroom Audio & Active Student Toolbar */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
          {/* Active Student Status (Unboxed metadata) */}
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <span className="text-slate-500">Current Player:</span>
            {activeStudent ? (
              <>
                <span className="font-semibold text-slate-900">
                  {activeStudent.avatar} {activeStudent.name}
                </span>
                <span className="text-slate-300" aria-hidden="true">
                  ·
                </span>
                <span className="font-mono-nums font-semibold text-sky-700">
                  {activeStudent.score} pts
                </span>
              </>
            ) : (
              <span className="font-medium text-slate-600">Class Explorer</span>
            )}
          </div>

          {/* Audio, Speech Speed & Hint Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={toggleMusic}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                musicEnabled
                  ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
              }`}
            >
              {musicEnabled ? (
                <Music className="w-3.5 h-3.5" />
              ) : (
                <VolumeX className="w-3.5 h-3.5" />
              )}
              {musicEnabled ? 'Park Music: On' : 'Park Music: Off'}
            </button>

            {musicEnabled && (
              <label className="hidden sm:inline-flex items-center gap-2 text-xs text-slate-600 px-2">
                <span className="whitespace-nowrap">Music Vol: {musicVolume}%</span>
                <input
                  type="range"
                  min={5}
                  max={100}
                  value={musicVolume}
                  onChange={(e) => handleVolumeChange(Number(e.target.value))}
                  aria-label="Background music volume"
                  className="w-20 accent-sky-600 cursor-pointer"
                />
              </label>
            )}

            <button
              type="button"
              onClick={() => setSpeechRate((r) => (r < 0.8 ? 0.92 : 0.72))}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Gauge className="w-3.5 h-3.5 text-sky-600" />
              Voice: {speechRate < 0.8 ? 'Slow' : 'Normal'}
            </button>

            <button
              type="button"
              onClick={() => setShowChinese((v) => !v)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                showChinese
                  ? 'bg-sky-50 text-sky-800 border-sky-200'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Languages className="w-3.5 h-3.5" />
              中文: {showChinese ? 'On' : 'Off'}
            </button>

            {mode === 'challenge' && (
              <button
                type="button"
                onClick={() => setAudioOnlyChallenge((v) => !v)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  audioOnlyChallenge
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {audioOnlyChallenge ? (
                  <EyeOff className="w-3.5 h-3.5" />
                ) : (
                  <Eye className="w-3.5 h-3.5" />
                )}
                Audio-Only Clue
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-[1320px] w-full mx-auto px-4 sm:px-6 py-6">
        {section === 'play' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 space-y-5">
              <ParkStage
                mode={mode}
                phase={phase}
                activeWeather={activeWeather}
                challengeTarget={challengeTarget}
                challengeFeedback={challengeFeedback}
                audioOnlyChallenge={audioOnlyChallenge}
                showChinese={showChinese}
                streak={streak}
                lastEarnedPoints={lastEarnedPoints}
                onModeChange={handleModeChange}
                onReplayAudio={speakPhrase}
                onNewChallenge={() => pickRandomChallenge(challengeTarget?.id)}
                onCompleteReadAloud={handleCompleteReadAloud}
              />

              <WeatherDeck
                items={WEATHER_ITEMS}
                activeWeatherId={activeWeather?.id || null}
                masteredWords={activeStudent?.masteredWords || []}
                showChinese={showChinese}
                onSelectWeather={handleSelectWeather}
                onPreviewAudio={handlePreviewAudio}
              />
            </div>

            <div className="lg:col-span-4">
              <LeaderboardPanel
                entries={leaderboard}
                activeStudentId={activeStudent?.id || ''}
                onSelectStudent={(id) => {
                  ensureBackgroundMusic();
                  setActiveStudentId(id);
                  setStreak(0);
                }}
                onAddStudent={handleAddStudent}
                onResetLeaderboard={handleResetLeaderboard}
              />
            </div>
          </div>
        )}

        {section === 'pans' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8">
              <SortingPansGame
                showChinese={showChinese}
                activeStudentName={activeStudent?.name || 'Class Explorer'}
                onSpeakText={speakPhrase}
                onAwardPoints={(pts, weatherId) => {
                  ensureBackgroundMusic();
                  awardPointsToActiveStudent(pts, weatherId);
                }}
              />
            </div>

            <div className="lg:col-span-4">
              <LeaderboardPanel
                entries={leaderboard}
                activeStudentId={activeStudent?.id || ''}
                onSelectStudent={(id) => {
                  ensureBackgroundMusic();
                  setActiveStudentId(id);
                  setStreak(0);
                }}
                onAddStudent={handleAddStudent}
                onResetLeaderboard={handleResetLeaderboard}
              />
            </div>
          </div>
        )}

        {section === 'cards' && (
          <WordCardsView
            items={WEATHER_ITEMS}
            showChinese={showChinese}
            onSpeakText={speakPhrase}
            onPlayAll={handlePlayAllWords}
            onPracticeInPark={handlePracticeFromCards}
          />
        )}

        {section === 'leaderboard' && (
          <LeaderboardPanel
            entries={leaderboard}
            activeStudentId={activeStudent?.id || ''}
            onSelectStudent={(id) => {
              ensureBackgroundMusic();
              setActiveStudentId(id);
              setStreak(0);
              setSection('play');
            }}
            onAddStudent={handleAddStudent}
            onResetLeaderboard={handleResetLeaderboard}
            fullPage
          />
        )}

        {section === 'guide' && (
          <TeacherGuideView
            onStartPlay={() => {
              ensureBackgroundMusic();
              setSection('play');
            }}
          />
        )}
      </main>
    </div>
  );
}
