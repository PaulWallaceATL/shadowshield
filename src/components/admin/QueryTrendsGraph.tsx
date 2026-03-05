'use client';

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface DataPoint {
  name: string;
  value: number;
}

interface QueryTrendsGraphProps {
  data: DataPoint[];
}

export default function QueryTrendsGraph({ data }: QueryTrendsGraphProps) {
  // Reduce number of points to prevent overcrowding
  const maxPoints = 8;
  const skipPoints = Math.ceil(data.length / maxPoints);
  const filteredData = data.filter((_, index) => index % skipPoints === 0);

  // Calculate points for the SVG path
  const points = filteredData.map((point, index) => ({
    x: 40 + index * ((400) / (filteredData.length - 1)),
    y: 120 - (point.value * 80) / Math.max(...filteredData.map(d => d.value)),
    ...point
  }));

  const pathD = points.reduce(buildPath, "");
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [percentageChange, setPercentageChange] = useState<number | null>(null);

  const startHover = (index: number) => {
    setHoveredPoint(index);

    if (index > 0) {
      const currentValue = filteredData[index].value;
      const previousValue = filteredData[index - 1].value;
      const percentageChange = previousValue !== 0 
        ? ((currentValue - previousValue) / previousValue) * 100 
        : 0;
      setPercentageChange(percentageChange);
    } else {
      setPercentageChange(null);
    }
  };

  const endHover = () => {
    setHoveredPoint(null);
    setPercentageChange(null);
  };

  return (
    <div className="relative w-full h-[200px] overflow-hidden">
      <svg 
        width="100%" 
        height="100%" 
        viewBox="0 0 480 160" 
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#00a0cb" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#00a0cb" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Background grid lines */}
        {[40, 80, 120].map((y) => (
          <motion.line
            key={y}
            x1="40"
            y1={y}
            x2="440"
            y2={y}
            stroke="#334155"
            strokeWidth="1"
            strokeDasharray="5,5"
          />
        ))}

        {/* Area fill under the line */}
        <motion.path
          d={`${pathD} L 440,120 L 40,120 Z`}
          fill="url(#areaGradient)"
        />

        {/* Main graph line */}
        <motion.path
          d={pathD}
          fill="none"
          stroke="#00a0cb"
          strokeWidth="2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />

        {/* Points and labels */}
        <motion.g
          initial="hidden"
          animate="visible"
          variants={{
            visible: {
              transition: {
                delayChildren: 0.1,
                staggerChildren: 1.5 / points.length,
              },
            },
          }}
        >
          {points.map((point, index) => (
            <g key={index}>
              {/* Hit area */}
              <motion.rect
                x={point.x - 20}
                y={0}
                width={40}
                height={160}
                fill="transparent"
                onHoverStart={() => startHover(index)}
                onHoverEnd={endHover}
                style={{ cursor: "pointer" }}
              />
              {/* Dot */}
              <motion.circle
                cx={point.x}
                cy={point.y}
                r="4"
                fill="#1e293b"
                stroke="#00a0cb"
                strokeWidth="2"
                animate={
                  hoveredPoint === index
                    ? { scale: 1.5, strokeWidth: 3 }
                    : { scale: 1, strokeWidth: 2 }
                }
                variants={{
                  hidden: { scale: 0.5, opacity: 0 },
                  visible: { scale: 1, opacity: 1 },
                }}
              />
              {/* Date label */}
              <text
                x={point.x}
                y={145}
                textAnchor="middle"
                className="text-xs fill-gray-400"
              >
                {point.name}
              </text>
              {/* Value label */}
              {hoveredPoint === index && (
                <motion.g
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <rect
                    x={point.x - 20}
                    y={point.y - 25}
                    width="40"
                    height="20"
                    rx="4"
                    fill="#00a0cb"
                    fillOpacity="0.1"
                  />
                  <text
                    x={point.x}
                    y={point.y - 11}
                    textAnchor="middle"
                    className="text-sm fill-[#00a0cb]"
                  >
                    {point.value}
                  </text>
                </motion.g>
              )}
              {/* Percentage change tooltip */}
              {hoveredPoint === index && percentageChange !== null && (
                <motion.g
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                >
                  <rect
                    x={point.x - 30}
                    y={point.y - 45}
                    width="60"
                    height="20"
                    rx="10"
                    fill="#1e293b"
                    stroke="#334155"
                    strokeWidth="1"
                  />
                  <text
                    x={point.x}
                    y={point.y - 31}
                    textAnchor="middle"
                    className="text-xs"
                  >
                    <tspan
                      fill={percentageChange < 0 ? "#ef4444" : "#00a0cb"}
                      className="font-bold"
                    >
                      {percentageChange < 0 ? "↓" : "↑"}
                    </tspan>
                    <tspan
                      fill={percentageChange < 0 ? "#ef4444" : "#00a0cb"}
                      dx="2"
                    >
                      {Math.abs(percentageChange).toFixed(1)}%
                    </tspan>
                  </text>
                </motion.g>
              )}
            </g>
          ))}
        </motion.g>
      </svg>
    </div>
  );
}

function buildPath(path: string, point: { x: number; y: number }, i: number) {
  if (i === 0) return `M ${point.x},${point.y}`;
  return `${path} L ${point.x},${point.y}`;
} 