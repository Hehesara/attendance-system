import React, { useState } from 'react';

export default function AttendanceTrendChart({ trendData = [], threshold = 75 }) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  if (!trendData || trendData.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-slate-400 text-xs">
        No attendance data available to chart.
      </div>
    );
  }

  const width = 640;
  const height = 200;
  const paddingLeft = 40;
  const paddingRight = 30;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const getY = (val) => paddingTop + chartHeight - (val / 100) * chartHeight;
  const getX = (index) => {
    if (trendData.length === 1) return paddingLeft + chartWidth / 2;
    return paddingLeft + (index / (trendData.length - 1)) * chartWidth;
  };

  const points = trendData.map((d, i) => `${getX(i)},${getY(d.percentage)}`);
  const pathD = `M ${points.join(' L ')}`;
  const thresholdY = getY(threshold);

  return (
    <div className="relative w-full">
      {/* Legend */}
      <div className="flex items-center gap-4 mb-2 text-xs text-slate-600">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-indigo-600 inline-block"></span>
          <span>Attendance %</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 border-t border-dashed border-rose-500 inline-block"></span>
          <span>Target ({threshold}%)</span>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[480px]">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((tick) => {
            const y = getY(tick);
            return (
              <g key={tick}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="text-[10px] fill-slate-400 font-mono"
                >
                  {tick}%
                </text>
              </g>
            );
          })}

          {/* Threshold Line */}
          <line
            x1={paddingLeft}
            y1={thresholdY}
            x2={width - paddingRight}
            y2={thresholdY}
            stroke="#e11d48"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />

          {/* Main Curve */}
          <path
            d={pathD}
            fill="none"
            stroke="#4f46e5"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Points */}
          {trendData.map((d, i) => {
            const cx = getX(i);
            const cy = getY(d.percentage);
            const isHovered = hoveredPoint?.index === i;

            return (
              <g
                key={i}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredPoint({ ...d, x: cx, y: cy, index: i })}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 4.5 : 3}
                  fill="#4f46e5"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
                <text
                  x={cx}
                  y={height - paddingBottom + 16}
                  textAnchor="middle"
                  className="text-[9px] fill-slate-400"
                >
                  {d.date.slice(5)}
                </text>
              </g>
            );
          })}

          {/* Tooltip */}
          {hoveredPoint && (
            <g
              transform={`translate(${Math.min(
                Math.max(hoveredPoint.x - 50, 10),
                width - 110
              )}, ${Math.max(hoveredPoint.y - 45, 5)})`}
              className="pointer-events-none"
            >
              <rect
                width="100"
                height="38"
                rx="6"
                fill="#1e293b"
                opacity="0.9"
              />
              <text x="8" y="16" fill="#f8fafc" className="text-[10px] font-bold">
                {hoveredPoint.percentage}% Attendance
              </text>
              <text x="8" y="28" fill="#cbd5e1" className="text-[9px]">
                {hoveredPoint.date} • {hoveredPoint.status}
              </text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}
