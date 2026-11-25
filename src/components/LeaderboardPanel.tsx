import React, { useState } from 'react';
import { Trophy, Medal, UserPlus, RotateCcw } from 'lucide-react';
import { LeaderboardEntry } from '../types/weather';
import { STUDENT_AVATARS } from '../data/weatherData';

interface LeaderboardPanelProps {
  entries: LeaderboardEntry[];
  activeStudentId: string;
  onSelectStudent: (id: string) => void;
  onAddStudent: (name: string, avatar: string) => void;
  onResetLeaderboard: () => void;
  fullPage?: boolean;
}

export const LeaderboardPanel: React.FC<LeaderboardPanelProps> = ({
  entries,
  activeStudentId,
  onSelectStudent,
  onAddStudent,
  onResetLeaderboard,
  fullPage = false,
}) => {
  const [newName, setNewName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(STUDENT_AVATARS[0]);
  const [confirmReset, setConfirmReset] = useState(false);

  const sortedEntries = [...entries].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.wordsPracticed - a.wordsPracticed;
  });

  const handleSubmitStudent = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;
    onAddStudent(trimmed, selectedAvatar);
    setNewName('');
  };

  return (
    <aside
      aria-label="Class Score Leaderboard"
      className={`bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col ${
        fullPage ? 'max-w-3xl mx-auto' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <Trophy className="w-5 h-5 text-amber-500 shrink-0" />
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900 leading-tight">
              Class Leaderboard
            </h2>
            <p className="text-xs text-slate-500">分数排行榜 · Tap a student to play</p>
          </div>
        </div>

        {!confirmReset ? (
          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        ) : (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                onResetLeaderboard();
                setConfirmReset(false);
              }}
              className="px-2.5 py-1 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-md cursor-pointer"
            >
              Confirm
            </button>
            <button
              type="button"
              onClick={() => setConfirmReset(false)}
              className="px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Add / Switch Student Form */}
      <form onSubmit={handleSubmitStudent} className="p-4 border-b border-slate-100 bg-slate-50/70 space-y-2.5">
        <label htmlFor="student-name-input" className="block text-xs font-semibold text-slate-700">
          Add Student or Team Name
        </label>
        <div className="flex items-center gap-2">
          <input
            id="student-name-input"
            type="text"
            maxLength={18}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Lucas or Team Sun"
            className="flex-1 min-w-0 px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
          />
          <button
            type="submit"
            disabled={!newName.trim()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Join
          </button>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pt-0.5">
          {STUDENT_AVATARS.map((avatar) => (
            <button
              key={avatar}
              type="button"
              onClick={() => setSelectedAvatar(avatar)}
              aria-label={`Select avatar ${avatar}`}
              className={`w-8 h-8 rounded-lg text-base flex items-center justify-center transition-colors shrink-0 cursor-pointer ${
                selectedAvatar === avatar
                  ? 'bg-sky-100 border border-sky-400'
                  : 'bg-white border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {avatar}
            </button>
          ))}
        </div>
      </form>

      {/* Ranked Students List */}
      <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
        {sortedEntries.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-500">
            No scores yet. Add a student name above and read a weather word aloud to score!
          </div>
        ) : (
          sortedEntries.map((entry, idx) => {
            const rank = idx + 1;
            const isSelected = entry.id === activeStudentId;

            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => onSelectStudent(entry.id)}
                className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors cursor-pointer ${
                  isSelected ? 'bg-sky-50/90' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Explicit Rank Marker (Non-hue-only) */}
                  <div className="w-9 shrink-0 flex items-center gap-1 font-mono-nums text-xs font-bold">
                    {rank === 1 ? (
                      <span className="inline-flex items-center gap-1 text-amber-600">
                        <Medal className="w-4 h-4" />
                        1st
                      </span>
                    ) : rank === 2 ? (
                      <span className="inline-flex items-center gap-1 text-slate-500">
                        <Medal className="w-4 h-4" />
                        2nd
                      </span>
                    ) : rank === 3 ? (
                      <span className="inline-flex items-center gap-1 text-amber-800">
                        <Medal className="w-4 h-4" />
                        3rd
                      </span>
                    ) : (
                      <span className="text-slate-400 pl-1">#{rank}</span>
                    )}
                  </div>

                  <span className="text-xl shrink-0" aria-hidden="true">
                    {entry.avatar}
                  </span>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900 truncate">
                        {entry.name}
                      </span>
                      {isSelected && (
                        <span className="text-xs font-semibold text-sky-700">· Playing</span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 font-mono-nums">
                      {entry.masteredWords.length}/5 words · {entry.wordsPracticed} reads
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-mono-nums text-base font-bold text-slate-900">
                    {entry.score}
                  </div>
                  <div className="text-xs text-slate-500">pts</div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
};
