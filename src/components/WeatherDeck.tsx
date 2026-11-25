import React, { useState } from 'react';
import { Volume2, Check } from 'lucide-react';
import { WeatherId, WeatherItem } from '../types/weather';
import { SkyWeatherSprite } from './SkyWeatherSprite';

interface WeatherDeckProps {
  items: WeatherItem[];
  activeWeatherId: WeatherId | null;
  masteredWords: WeatherId[];
  showChinese: boolean;
  onSelectWeather: (item: WeatherItem) => void;
  onPreviewAudio: (item: WeatherItem, e: React.MouseEvent) => void;
}

export const WeatherDeck: React.FC<WeatherDeckProps> = ({
  items,
  activeWeatherId,
  masteredWords,
  showChinese,
  onSelectWeather,
  onPreviewAudio,
}) => {
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  return (
    <section aria-label="Weather selection cards" className="space-y-3">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="font-display text-lg font-semibold text-slate-900">
          Choose a Weather to Drop Into the Park
        </h3>
        <span className="text-xs text-slate-500 font-mono-nums">
          {masteredWords.length}/5 practiced today
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {items.map((item) => {
          const isActive = activeWeatherId === item.id;
          const isMastered = masteredWords.includes(item.id);
          const hasImageError = Boolean(failedImages[item.id]);

          return (
            <div
              key={item.id}
              onClick={() => onSelectWeather(item)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectWeather(item);
                }
              }}
              role="button"
              tabIndex={0}
              aria-pressed={isActive}
              className={`group relative flex flex-col bg-white rounded-2xl border p-3 text-left transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                isActive
                  ? 'border-sky-500 ring-2 ring-sky-200 -translate-y-0.5 shadow-md'
                  : 'border-slate-200 hover:border-sky-300 hover:-translate-y-0.5 shadow-sm'
              }`}
            >
              {/* Illustration Slot */}
              <div
                className={`relative w-full aspect-square rounded-xl overflow-hidden border border-slate-100 flex items-center justify-center ${item.cardBgClass}`}
              >
                {!hasImageError ? (
                  <img
                    src={item.imagePath}
                    alt={`${item.phrase} illustration`}
                    referrerPolicy="no-referrer"
                    onError={() =>
                      setFailedImages((prev) => ({
                        ...prev,
                        [item.id]: true,
                      }))
                    }
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                ) : (
                  <SkyWeatherSprite weatherId={item.id} className="w-24 h-24" />
                )}

                <button
                  type="button"
                  aria-label={`Hear ${item.phrase}`}
                  onClick={(e) => onPreviewAudio(item, e)}
                  className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-white/90 hover:bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:text-sky-600 shadow-xs transition-colors cursor-pointer"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>

              {/* Vocabulary Labels */}
              <div className="mt-2.5 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-display text-base font-bold text-slate-900 leading-tight truncate">
                    {item.word}
                  </div>
                  <div className="text-sm font-medium text-sky-700 truncate">{item.phrase}</div>
                  {showChinese && (
                    <div className="text-xs text-slate-500 mt-0.5 truncate">{item.chinese}</div>
                  )}
                </div>

                {isMastered && (
                  <span
                    title="Practiced"
                    className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-700 shrink-0 pt-0.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
