/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useMemo } from 'react';

interface ProbabilityGraphProps {
  odds: number;
  encounters: number;
}

const calculateCumulativeProbability = (odds: number, encounters: number): number => {
  if (encounters <= 0 || odds <= 0) return 0;
  const probabilityOfNoShiny = Math.pow(1 - (1 / odds), encounters);
  const probabilityOfShiny = 1 - probabilityOfNoShiny;
  return probabilityOfShiny * 100;
};

const ProbabilityGraph = ({ odds, encounters }: ProbabilityGraphProps) => {
  const width = 300;
  const height = 150;
  const padding = { top: 10, right: 15, bottom: 25, left: 35 };

  const contentWidth = width - padding.left - padding.right;
  const contentHeight = height - padding.top - padding.bottom;

  const maxEncounters = Math.max(odds * 3, encounters * 1.2);

  const xScale = (v: number) => padding.left + (v / maxEncounters) * contentWidth;
  const yScale = (v: number) => padding.top + contentHeight - (v / 100) * contentHeight;

  const pathData = useMemo(() => {
    const points: [number, number][] = [];
    const step = maxEncounters / 100;
    for (let i = 0; i <= maxEncounters; i += step) {
      const prob = calculateCumulativeProbability(odds, i);
      points.push([xScale(i), yScale(prob)]);
    }
    const prob = calculateCumulativeProbability(odds, maxEncounters);
    points.push([xScale(maxEncounters), yScale(prob)]);
    
    return points.map((p, i) => (i === 0 ? 'M' : 'L') + `${p[0]},${p[1]}`).join(' ');
  }, [odds, maxEncounters]);

  const markerX = xScale(Math.min(encounters, maxEncounters));
  const markerY = yScale(calculateCumulativeProbability(odds, encounters));

  const yAxisTicks = [0, 25, 50, 75, 100];
  const xAxisTicks = [
    { value: odds, label: '1x Odds' },
    { value: odds * 2, label: '2x Odds' },
    { value: odds * 3, label: '3x Odds' },
  ];

  return (
    <div className="probability-graph-container">
      <svg className="graph-svg" viewBox={`0 0 ${width} ${height}`}>
        {/* Grid lines */}
        {yAxisTicks.map(tick => (
          <line
            key={`grid-y-${tick}`}
            className="graph-gridline"
            x1={padding.left}
            y1={yScale(tick)}
            x2={width - padding.right}
            y2={yScale(tick)}
          />
        ))}
        {xAxisTicks.map(tick => (
          tick.value < maxEncounters && <line
            key={`grid-x-${tick.value}`}
            className="graph-gridline"
            x1={xScale(tick.value)}
            y1={padding.top}
            x2={xScale(tick.value)}
            y2={height - padding.bottom}
          />
        ))}

        {/* Axes */}
        <line className="graph-axis" x1={padding.left} y1={padding.top} x2={padding.left} y2={height - padding.bottom} />
        <line className="graph-axis" x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} />

        {/* Axis Labels */}
        {yAxisTicks.map(tick => (
          <text key={`label-y-${tick}`} className="graph-label" x={padding.left - 8} y={yScale(tick)} textAnchor="end" dominantBaseline="middle">
            {tick}%
          </text>
        ))}
         {xAxisTicks.map(tick => (
           tick.value < maxEncounters && <text key={`label-x-${tick.value}`} className="graph-label" x={xScale(tick.value)} y={height - padding.bottom + 15} textAnchor="middle">
            {tick.label}
          </text>
        ))}

        {/* Curve */}
        <path className="graph-curve" d={pathData} />

        {/* Marker */}
        {encounters > 0 && (
          <circle className="graph-marker" cx={markerX} cy={markerY} r="4" />
        )}
      </svg>
    </div>
  );
};

export default ProbabilityGraph;