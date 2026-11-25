import React from 'react';
import { WeatherId } from '../types/weather';

interface SkyWeatherSpriteProps {
  weatherId: WeatherId;
  className?: string;
}

export const SkyWeatherSprite: React.FC<SkyWeatherSpriteProps> = ({
  weatherId,
  className = 'w-36 h-36',
}) => {
  if (weatherId === 'sunny') {
    return (
      <svg viewBox="0 0 180 180" className={className} aria-label="Sunny sun">
        <g className="origin-center animate-sun-spin" style={{ transformOrigin: '90px 90px' }}>
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = i * 30;
            const isLong = i % 2 === 0;
            return (
              <rect
                key={angle}
                x={84}
                y={isLong ? 10 : 20}
                width={12}
                height={isLong ? 26 : 18}
                rx={6}
                fill={isLong ? '#FB923C' : '#FBBF24'}
                stroke="#78350F"
                strokeWidth="2.5"
                transform={`rotate(${angle} 90 90)`}
              />
            );
          })}
        </g>
        <circle cx="90" cy="90" r="44" fill="#FDE047" stroke="#78350F" strokeWidth="3.5" />
        <circle cx="72" cy="96" r="6" fill="#FDA4AF" opacity="0.85" />
        <circle cx="108" cy="96" r="6" fill="#FDA4AF" opacity="0.85" />
        <circle cx="76" cy="84" r="4" fill="#451A03" />
        <circle cx="104" cy="84" r="4" fill="#451A03" />
        <path
          d="M78 96 Q90 108 102 96"
          fill="none"
          stroke="#451A03"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (weatherId === 'rainy') {
    return (
      <svg viewBox="0 0 200 180" className={className} aria-label="Rainy cloud">
        <path
          d="M46 106 H154 A24 24 0 0 0 158 60 A34 34 0 0 0 94 42 A30 30 0 0 0 42 64 A22 22 0 0 0 46 106 Z"
          fill="#93C5FD"
          stroke="#1E3A8A"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        <circle cx="78" cy="83" r="5" fill="#FCA5A5" opacity="0.8" />
        <circle cx="122" cy="83" r="5" fill="#FCA5A5" opacity="0.8" />
        <circle cx="84" cy="72" r="4" fill="#1E293B" />
        <circle cx="116" cy="72" r="4" fill="#1E293B" />
        <path
          d="M90 83 Q100 92 110 83"
          fill="none"
          stroke="#1E293B"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {[
          { x: 64, y: 120 },
          { x: 92, y: 130 },
          { x: 120, y: 120 },
          { x: 142, y: 132 },
          { x: 76, y: 146 },
          { x: 108, y: 150 },
        ].map((drop, idx) => (
          <path
            key={idx}
            d={`M${drop.x} ${drop.y} C${drop.x - 6} ${drop.y + 10}, ${drop.x - 6} ${drop.y + 18}, ${drop.x} ${drop.y + 18} C${drop.x + 6} ${drop.y + 18}, ${drop.x + 6} ${drop.y + 10}, ${drop.x} ${drop.y} Z`}
            fill="#38BDF8"
            stroke="#0369A1"
            strokeWidth="2.2"
          />
        ))}
      </svg>
    );
  }

  if (weatherId === 'snowy') {
    return (
      <svg viewBox="0 0 200 180" className={className} aria-label="Snowy cloud">
        <path
          d="M46 104 H154 A24 24 0 0 0 158 58 A34 34 0 0 0 94 40 A30 30 0 0 0 42 62 A22 22 0 0 0 46 104 Z"
          fill="#E0F2FE"
          stroke="#334155"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        <circle cx="78" cy="82" r="5.5" fill="#FBCFE8" opacity="0.9" />
        <circle cx="122" cy="82" r="5.5" fill="#FBCFE8" opacity="0.9" />
        <circle cx="84" cy="70" r="4" fill="#1E293B" />
        <circle cx="116" cy="70" r="4" fill="#1E293B" />
        <path
          d="M90 81 Q100 90 110 81"
          fill="none"
          stroke="#1E293B"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {[
          { x: 64, y: 126 },
          { x: 100, y: 138 },
          { x: 134, y: 126 },
          { x: 80, y: 154 },
          { x: 120, y: 156 },
        ].map((flake, idx) => (
          <g key={idx} stroke="#38BDF8" strokeWidth="2.6" strokeLinecap="round">
            <line x1={flake.x - 8} y1={flake.y} x2={flake.x + 8} y2={flake.y} />
            <line x1={flake.x} y1={flake.y - 8} x2={flake.x} y2={flake.y + 8} />
            <line x1={flake.x - 5.5} y1={flake.y - 5.5} x2={flake.x + 5.5} y2={flake.y + 5.5} />
            <line x1={flake.x + 5.5} y1={flake.y - 5.5} x2={flake.x - 5.5} y2={flake.y + 5.5} />
          </g>
        ))}
      </svg>
    );
  }

  if (weatherId === 'windy') {
    return (
      <svg viewBox="0 0 210 170" className={className} aria-label="Windy cloud">
        <path
          d="M36 104 H126 A22 22 0 0 0 130 62 A30 30 0 0 0 76 46 A26 26 0 0 0 32 66 A20 20 0 0 0 36 104 Z"
          fill="#F8FAFC"
          stroke="#334155"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        <circle cx="64" cy="83" r="4.5" fill="#FDA4AF" opacity="0.85" />
        <circle cx="98" cy="83" r="4.5" fill="#FDA4AF" opacity="0.85" />
        <path d="M68 72 Q72 68 76 72" fill="none" stroke="#1E293B" strokeWidth="2.8" strokeLinecap="round" />
        <path d="M90 72 Q94 68 98 72" fill="none" stroke="#1E293B" strokeWidth="2.8" strokeLinecap="round" />
        <circle cx="104" cy="82" r="4" fill="#334155" />
        <path
          d="M114 76 Q152 68 172 56 A10 10 0 1 0 164 42"
          fill="none"
          stroke="#0EA5E9"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M116 86 Q160 88 184 82 A9 9 0 1 1 178 98"
          fill="none"
          stroke="#14B8A6"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M114 96 Q146 106 164 114"
          fill="none"
          stroke="#38BDF8"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <path d="M174 64 Q186 58 188 70 Q176 74 174 64 Z" fill="#4ADE80" stroke="#166534" strokeWidth="2" />
        <path d="M150 118 Q162 112 164 124 Q152 128 150 118 Z" fill="#4ADE80" stroke="#166534" strokeWidth="2" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 210 170" className={className} aria-label="Cloudy sky">
      <path
        d="M72 96 H172 A20 20 0 0 0 175 58 A28 28 0 0 0 122 44 A24 24 0 0 0 72 64 A18 18 0 0 0 72 96 Z"
        fill="#CBD5E1"
        stroke="#475569"
        strokeWidth="3.2"
        strokeLinejoin="round"
      />
      <path
        d="M36 122 H148 A24 24 0 0 0 152 76 A34 34 0 0 0 88 58 A30 30 0 0 0 32 80 A22 22 0 0 0 36 122 Z"
        fill="#FFFFFF"
        stroke="#334155"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <circle cx="72" cy="100" r="5" fill="#FBCFE8" opacity="0.85" />
      <circle cx="114" cy="100" r="5" fill="#FBCFE8" opacity="0.85" />
      <circle cx="78" cy="89" r="3.8" fill="#1E293B" />
      <circle cx="108" cy="89" r="3.8" fill="#1E293B" />
      <path
        d="M85 100 Q93 107 101 100"
        fill="none"
        stroke="#1E293B"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
};
