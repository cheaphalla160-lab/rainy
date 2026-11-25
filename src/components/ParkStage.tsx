import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircle2,
  Mic,
  MicOff,
  Sparkles,
  Volume2,
  HelpCircle,
  RefreshCw,
} from 'lucide-react';
import { GameMode, GamePhase, WeatherItem } from '../types/weather';
import { PARK_BACKDROP_IMAGE } from '../data/weatherData';
import { SkyWeatherSprite } from './SkyWeatherSprite';

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionEventLike {
  results: {
    length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

interface ParkStageProps {
  mode: GameMode;
  phase: GamePhase;
  activeWeather: WeatherItem | null;
  challengeTarget: WeatherItem | null;
  challengeFeedback: string | null;
  audioOnlyChallenge: boolean;
  showChinese: boolean;
  streak: number;
  lastEarnedPoints: number | null;
  onModeChange: (mode: GameMode) => void;
  onReplayAudio: (text: string) => void;
  onNewChallenge: () => void;
  onCompleteReadAloud: (method: 'voice' | 'manual', heardText?: string) => void;
}

const RAIN_DROPS = [
  { left: '10%', delay: '0s' },
  { left: '20%', delay: '0.35s' },
  { left: '32%', delay: '0.15s' },
  { left: '44%', delay: '0.55s' },
  { left: '56%', delay: '0.22s' },
  { left: '68%', delay: '0.68s' },
  { left: '79%', delay: '0.1s' },
  { left: '89%', delay: '0.42s' },
];

const SNOW_FLAKES = [
  { left: '12%', delay: '0s', size: 16 },
  { left: '25%', delay: '0.8s', size: 20 },
  { left: '39%', delay: '1.6s', size: 14 },
  { left: '53%', delay: '0.4s', size: 18 },
  { left: '67%', delay: '1.2s', size: 15 },
  { left: '81%', delay: '2.1s', size: 20 },
  { left: '91%', delay: '0.9s', size: 14 },
];

export const ParkStage: React.FC<ParkStageProps> = ({
  mode,
  phase,
  activeWeather,
  challengeTarget,
  challengeFeedback,
  audioOnlyChallenge,
  showChinese,
  streak,
  lastEarnedPoints,
  onModeChange,
  onReplayAudio,
  onNewChallenge,
  onCompleteReadAloud,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [heardTranscript, setHeardTranscript] = useState<string | null>(null);
  const [micNote, setMicNote] = useState<string | null>(null);
  const [backdropFailed, setBackdropFailed] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    setHeardTranscript(null);
    setMicNote(null);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore stop errors
      }
      setIsListening(false);
    }
  }, [activeWeather?.id, phase]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const handleVoiceReadAloud = () => {
    if (!activeWeather) return;

    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      setIsListening(false);
      return;
    }

    const win = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const RecognitionCtor = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!RecognitionCtor) {
      setMicNote('Voice check unavailable in this browser. Tap "I Read It!" to score.');
      return;
    }

    try {
      const recognition = new RecognitionCtor();
      recognition.lang = 'en-US';
      recognition.interimResults = true;
      recognition.maxAlternatives = 5;
      recognitionRef.current = recognition;
      setMicNote(null);
      setHeardTranscript(null);
      setIsListening(true);

      let matched = false;

      recognition.onresult = (event) => {
        if (matched) return;
        const transcripts: string[] = [];
        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          for (let j = 0; j < result.length; j++) {
            transcripts.push(result[j].transcript.toLowerCase().trim());
          }
        }
        const combined = transcripts.join(' ');
        if (transcripts[0]) {
          setHeardTranscript(transcripts[0]);
        }

        const isMatch = activeWeather.spokenAliases.some((alias) =>
          combined.includes(alias.toLowerCase())
        );

        if (isMatch) {
          matched = true;
          setIsListening(false);
          try {
            recognition.stop();
          } catch {
            // ignore
          }
          onCompleteReadAloud('voice', transcripts[0]);
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
        if (!matched) {
          setMicNote('Could not access microphone. Tap "I Read It!" after reading aloud.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
      setMicNote('Could not start microphone. Tap "I Read It!" after reading aloud.');
    }
  };

  return (
    <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Stage Mode & Challenge Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-slate-200 bg-slate-50/70">
        <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg">
          <button
            type="button"
            onClick={() => onModeChange('explore')}
            className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              mode === 'explore'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Free Pick & Read
          </button>
          <button
            type="button"
            onClick={() => onModeChange('challenge')}
            className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              mode === 'challenge'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Listen & Match
          </button>
        </div>

        <div className="flex items-center gap-3 text-sm text-slate-600">
          {streak > 0 && (
            <span className="font-semibold text-amber-700 font-mono-nums">
              Streak {streak}
            </span>
          )}
          {mode === 'challenge' && challengeTarget && (
            <button
              type="button"
              onClick={onNewChallenge}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Next Question
            </button>
          )}
        </div>
      </div>

      {/* Challenge Prompt Strip (Listen & Match mode) */}
      {mode === 'challenge' && challengeTarget && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-sky-50 border-b border-sky-200">
          <div className="flex items-center gap-2.5">
            <HelpCircle className="w-5 h-5 text-sky-600 shrink-0" />
            <div className="text-sm font-medium text-slate-800">
              {audioOnlyChallenge ? (
                <span>Listen carefully and pick the matching weather card below!</span>
              ) : (
                <span>
                  Find and click:{' '}
                  <strong className="font-display text-base text-sky-800">
                    {challengeTarget.phrase}
                  </strong>
                  {showChinese && (
                    <span className="ml-2 text-slate-500">({challengeTarget.chinese})</span>
                  )}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {challengeFeedback && (
              <span className="text-sm font-semibold text-amber-700">{challengeFeedback}</span>
            )}
            <button
              type="button"
              onClick={() => onReplayAudio(`${challengeTarget.word}! ${challengeTarget.phrase}!`)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Volume2 className="w-4 h-4" />
              Hear Clue
            </button>
          </div>
        </div>
      )}

      {/* Illustrated Park Canvas */}
      <div className="relative w-full aspect-[16/9] min-h-[300px] max-h-[460px] overflow-hidden bg-sky-100 select-none">
        {!backdropFailed ? (
          <img
            src={PARK_BACKDROP_IMAGE}
            alt="Children happily playing in a sunny green park"
            referrerPolicy="no-referrer"
            onError={() => setBackdropFailed(true)}
            className="w-full h-full object-cover object-bottom"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-sky-200 via-sky-100 to-emerald-200 flex items-end justify-center pb-8">
            <span className="text-slate-700 font-display text-lg font-semibold">
              Park Scene Ready
            </span>
          </div>
        )}

        {/* Dynamic Atmospheric Sky Overlay */}
        {activeWeather && (
          <div
            className={`absolute inset-0 pointer-events-none bg-gradient-to-b transition-opacity duration-500 ${activeWeather.skyTintClass}`}
          />
        )}

        {/* Weather Particles Layer */}
        {activeWeather?.id === 'sunny' && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-96 h-48 bg-amber-300/25 blur-2xl rounded-full" />
          </div>
        )}

        {activeWeather?.id === 'rainy' && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {RAIN_DROPS.map((drop, idx) => (
              <div
                key={idx}
                className="absolute top-10 w-0.5 h-6 bg-sky-400/80 rounded-full animate-rain-drop"
                style={{ left: drop.left, animationDelay: drop.delay }}
              />
            ))}
          </div>
        )}

        {activeWeather?.id === 'snowy' && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {SNOW_FLAKES.map((flake, idx) => (
              <div
                key={idx}
                className="absolute top-6 text-white drop-shadow animate-snow-drift"
                style={{
                  left: flake.left,
                  animationDelay: flake.delay,
                  fontSize: `${flake.size}px`,
                }}
              >
                ❄
              </div>
            ))}
          </div>
        )}

        {activeWeather?.id === 'windy' && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <svg
              viewBox="0 0 220 40"
              className="absolute top-16 left-0 w-56 h-12 animate-wind-sweep opacity-75"
            >
              <path
                d="M8 22 Q70 8 130 22 T205 18"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </svg>
            <svg
              viewBox="0 0 220 40"
              className="absolute top-28 left-8 w-48 h-10 animate-wind-sweep opacity-70"
              style={{ animationDelay: '0.8s' }}
            >
              <path
                d="M10 20 Q60 32 120 18 T195 22"
                fill="none"
                stroke="#E0F2FE"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute top-24 left-10 text-xl animate-leaf-blow">🍃</div>
            <div
              className="absolute top-36 left-4 text-lg animate-leaf-blow"
              style={{ animationDelay: '1.2s' }}
            >
              🍃
            </div>
          </div>
        )}

        {/* Descending Weather Character in the Open Sky */}
        <div className="absolute inset-x-0 top-0 h-[48%] flex items-center justify-center pointer-events-none">
          <AnimatePresence mode="wait">
            {activeWeather ? (
              <motion.div
                key={`${activeWeather.id}-${phase === 'IDLE' ? 'idle' : 'drop'}`}
                initial={{ y: -150, scale: 0.72, opacity: 0 }}
                animate={{ y: 6, scale: 1, opacity: 1 }}
                exit={{ y: -120, opacity: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 170,
                  damping: 15,
                  mass: 0.85,
                }}
                className="flex flex-col items-center"
              >
                <div className="animate-gentle-hover drop-shadow-md">
                  <SkyWeatherSprite
                    weatherId={activeWeather.id}
                    className="w-32 h-32 sm:w-40 sm:h-40"
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white/90 backdrop-blur-sm border border-slate-200 px-5 py-3 rounded-xl shadow-sm text-center max-w-md mx-4"
              >
                <p className="font-display text-base sm:text-lg font-semibold text-slate-900">
                  {mode === 'explore'
                    ? 'Pick a weather card below to bring it down to the park!'
                    : 'Listen to the clue and choose the matching weather card!'}
                </p>
                {showChinese && (
                  <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                    {mode === 'explore'
                      ? '点击下方天气卡片，让它从天而降并一起跟读单词'
                      : '仔细听英语提示，选出对应的天气卡片'}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Celebration Sparkles Overlay (Top-Right Sky Corner, non-obstructive) */}
        <AnimatePresence>
          {phase === 'CELEBRATE' && lastEarnedPoints !== null && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute top-4 right-4 bg-emerald-600 text-white px-4 py-2 rounded-xl shadow-md flex items-center gap-2 pointer-events-none"
            >
              <Sparkles className="w-4 h-4" />
              <span className="font-display font-bold text-sm sm:text-base font-mono-nums">
                Great Reading! +{lastEarnedPoints} pts
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Connected Read-Aloud Dock ("跟着读") — Never blocks the park illustration */}
      <div className="p-4 sm:p-5 border-t border-slate-200 bg-white">
        {activeWeather ? (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                  {activeWeather.word}
                </h2>
                <span className="text-slate-300" aria-hidden="true">
                  ·
                </span>
                <span className="font-display text-xl sm:text-2xl font-semibold text-sky-700">
                  {activeWeather.phrase}
                </span>
                <span className="text-sm text-slate-500 font-mono-nums">
                  {activeWeather.phonetic}
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-1">
                {activeWeather.sentence}
                {showChinese && (
                  <span className="ml-2 text-slate-500">· {activeWeather.chinese}</span>
                )}
              </p>
              {heardTranscript && (
                <p className="text-xs text-emerald-700 font-medium mt-1">
                  Heard: &ldquo;{heardTranscript}&rdquo;
                </p>
              )}
              {micNote && <p className="text-xs text-amber-700 mt-1">{micNote}</p>}
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => onReplayAudio(`${activeWeather.word}! ${activeWeather.phrase}!`)}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Volume2 className="w-4 h-4 text-sky-600" />
                Listen Again
              </button>

              {phase !== 'CELEBRATE' ? (
                <>
                  <button
                    type="button"
                    onClick={handleVoiceReadAloud}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      isListening
                        ? 'bg-rose-600 text-white hover:bg-rose-700'
                        : 'bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100'
                    }`}
                  >
                    {isListening ? (
                      <>
                        <MicOff className="w-4 h-4" />
                        Listening... Say &ldquo;{activeWeather.phrase}&rdquo;
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4" />
                        Speak (+20 pts)
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => onCompleteReadAloud('manual')}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    I Read It! (+15 pts)
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (mode === 'challenge') {
                      onNewChallenge();
                    } else {
                      onReplayAudio(activeWeather.sentence);
                    }
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  {mode === 'challenge' ? 'Next Weather Round' : 'Hear Full Sentence'}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold text-slate-900">
                Ready for Weather Practice
              </h2>
              <p className="text-sm text-slate-600">
                Choose one of the 5 weather cards below: sunny sun, rainy cloud, snowy cloud, windy
                cloud, or cloudy sky.
              </p>
            </div>
            {mode === 'challenge' && challengeTarget && (
              <button
                type="button"
                onClick={() =>
                  onReplayAudio(`${challengeTarget.word}! ${challengeTarget.phrase}!`)
                }
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Volume2 className="w-4 h-4" />
                Play Target Word
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
