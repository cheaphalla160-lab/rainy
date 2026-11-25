import React from 'react';
import { ArrowRight } from 'lucide-react';

interface TeacherGuideViewProps {
  onStartPlay: () => void;
}

const LESSON_STEPS = [
  {
    step: '01. Warm-Up in Word Cards (2 mins)',
    detail:
      'Open the Word Cards tab on your classroom screen. Tap "Read All 5 Words" so students hear sunny sun, rainy cloud, snowy cloud, windy cloud, and cloudy sky while connecting each sound to its picture.',
  },
  {
    step: '02. Call the Weather in the Park (3 mins)',
    detail:
      'Switch to Play Park in Free Pick & Read mode. Invite a student to choose one weather card. Watch the weather descend into the park sky above the playing children, then lead the class in reading the phrase aloud.',
  },
  {
    step: '03. Read Aloud & Score Points (3 mins)',
    detail:
      'Use "Speak (+20 pts)" with a microphone for individual pronunciation practice, or tap "I Read It! (+15 pts)" when the whole class reads aloud together in chorus.',
  },
  {
    step: '04. Listen & Match Leaderboard Race (5 mins)',
    detail:
      'Switch to Listen & Match mode and enable "Audio-Only Clue" in Classroom Controls if students are ready for a pure listening test. Track teams or individual students live on the Class Leaderboard.',
  },
];

export const TeacherGuideView: React.FC<TeacherGuideViewProps> = ({ onStartPlay }) => {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h1 className="font-display text-2xl font-bold text-slate-900">
          Elementary Classroom Lesson Flow
        </h1>
        <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
          Designed for a 10–15 minute interactive elementary English segment covering{' '}
          <strong className="text-slate-900">sunny, rainy, snowy, windy, cloudy</strong>.
        </p>

        <div className="mt-6 divide-y divide-slate-100">
          {LESSON_STEPS.map((item) => (
            <div key={item.step} className="py-4 first:pt-0 last:pb-0">
              <h2 className="font-display text-base font-bold text-slate-900">{item.step}</h2>
              <p className="text-sm text-slate-600 mt-1 leading-relaxed">{item.detail}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-5 border-t border-slate-200 flex items-center justify-between gap-4">
          <span className="text-xs text-slate-500">
            Scores save automatically on this device in browser storage.
          </span>
          <button
            type="button"
            onClick={onStartPlay}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Go to Park Game
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
