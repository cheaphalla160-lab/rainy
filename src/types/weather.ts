export type WeatherId = 'sunny' | 'rainy' | 'snowy' | 'windy' | 'cloudy';

export type GameMode = 'explore' | 'challenge';

export type GamePhase = 'IDLE' | 'DESCENDING' | 'READ_ALOUD' | 'CELEBRATE';

export type AppSection = 'play' | 'pans' | 'cards' | 'leaderboard' | 'guide';

export interface WeatherItem {
  id: WeatherId;
  word: string;
  phrase: string;
  phonetic: string;
  chinese: string;
  chineseAction: string;
  sentence: string;
  imagePath: string;
  accentHex: string;
  cardBgClass: string;
  cardBorderClass: string;
  skyTintClass: string;
  spokenAliases: string[];
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  avatar: string;
  score: number;
  wordsPracticed: number;
  bestStreak: number;
  masteredWords: WeatherId[];
  updatedAt: string;
}
