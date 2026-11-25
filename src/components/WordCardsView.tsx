import React, { useState } from 'react';
import { Volume2, Play, ArrowRight } from 'lucide-react';
import { WeatherItem } from '../types/weather';
import { SkyWeatherSprite } from './SkyWeatherSprite';

interface WordCardsViewProps {
  items: WeatherItem[];
  showChinese: boolean;
  onSpeakText: (text: string) => void;
  onPlayAll: () => void;
  onPracticeInPark: (item: WeatherItem) => void;
}

export const WordCardsView: React.FC<WordCardsViewProps> = ({
  items,
  showChinese,
  onSpeakText,
  onPlayAll,
  onPracticeInPark,
}) => {
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            Weather Vocabulary Flashcards
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Introduce all five park weather words clearly on your smartboard before starting the
            game.
          </p>
        </div>
        <button
          type="button"
          onClick={onPlayAll}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Play className="w-4 h-4" />
          Read All 5 Words
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map((item) => (
          <article
            key={item.id}
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between gap-4"
          >
            <div>
              <div
                className={`w-full aspect-[4/3] rounded-xl overflow-hidden border border-slate-100 flex items-center justify-center ${item.cardBgClass}`}
              >
                {!failedImages[item.id] ? (
                  <img
                    src={item.imagePath}
                    alt={item.phrase}
                    referrerPolicy="no-referrer"
                    onError={() => setFailedImages((p) => ({ ...p, [item.id]: true }))}
                    className="w-full h-full object-contain p-2"
                  />
                ) : (
                  <SkyWeatherSprite weatherId={item.id} className="w-32 h-32" />
                )}
              </div>

              <div className="mt-4">
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className="font-display text-2xl font-bold text-slate-900">{item.word}</h2>
                  <span className="text-xs text-slate-500 font-mono-nums">{item.phonetic}</span>
                </div>
                <p className="font-display text-lg font-semibold text-sky-700 mt-0.5">
                  {item.phrase}
                </p>
                {showChinese && (
                  <p className="text-sm text-slate-500 mt-1">{item.chineseAction}</p>
                )}
                <p className="text-sm text-slate-700 mt-2 leading-relaxed">{item.sentence}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => onSpeakText(`${item.word}! ${item.phrase}! ${item.sentence}`)}
                className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors whitespace-nowrap cursor-pointer"
              >
                <Volume2 className="w-4 h-4 text-sky-600" />
                Listen
              </button>
              <button
                type="button"
                onClick={() => onPracticeInPark(item)}
                className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-colors whitespace-nowrap cursor-pointer"
              >
                Drop in Park
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};
