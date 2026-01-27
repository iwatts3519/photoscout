'use client';

import React from 'react';

interface SunPositionIndicatorProps {
  /** Sun azimuth in degrees (0 = North, 90 = East, 180 = South, 270 = West) */
  azimuthDegrees: number;
}

export const SunPositionIndicator = React.memo(function SunPositionIndicator({
  azimuthDegrees,
}: SunPositionIndicatorProps) {
  const size = 48;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = 20;
  const sunR = 4;
  const sunOrbitR = 15;

  // Convert azimuth to radians (0° = north = top of circle)
  const azimuthRad = (azimuthDegrees * Math.PI) / 180;
  const sunX = cx + sunOrbitR * Math.sin(azimuthRad);
  const sunY = cy - sunOrbitR * Math.cos(azimuthRad);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-label={`Sun position: ${Math.round(azimuthDegrees)}° from north`}
      role="img"
    >
      {/* Background */}
      <circle cx={cx} cy={cy} r={outerR + 2} fill="rgba(0,0,0,0.5)" />

      {/* Outer circle */}
      <circle
        cx={cx}
        cy={cy}
        r={outerR}
        fill="none"
        stroke="rgba(255,255,255,0.5)"
        strokeWidth={1}
      />

      {/* Crosshair lines */}
      <line
        x1={cx}
        y1={cy - outerR}
        x2={cx}
        y2={cy + outerR}
        stroke="rgba(255,255,255,0.25)"
        strokeWidth={0.5}
      />
      <line
        x1={cx - outerR}
        y1={cy}
        x2={cx + outerR}
        y2={cy}
        stroke="rgba(255,255,255,0.25)"
        strokeWidth={0.5}
      />

      {/* Cardinal direction labels */}
      <text
        x={cx}
        y={cy - outerR + 6}
        textAnchor="middle"
        fill="white"
        fontSize={6}
        fontWeight="bold"
      >
        N
      </text>
      <text
        x={cx}
        y={cy + outerR - 1}
        textAnchor="middle"
        fill="rgba(255,255,255,0.7)"
        fontSize={5}
      >
        S
      </text>
      <text
        x={cx + outerR - 3}
        y={cy + 2}
        textAnchor="middle"
        fill="rgba(255,255,255,0.7)"
        fontSize={5}
      >
        E
      </text>
      <text
        x={cx - outerR + 3}
        y={cy + 2}
        textAnchor="middle"
        fill="rgba(255,255,255,0.7)"
        fontSize={5}
      >
        W
      </text>

      {/* Sun dot */}
      <circle cx={sunX} cy={sunY} r={sunR} fill="#f59e0b" stroke="#fbbf24" strokeWidth={1} />
    </svg>
  );
});
