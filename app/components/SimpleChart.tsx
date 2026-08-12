import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export interface ChartSeries {
  name: string;
  data: number[];
  color: string;
}

export default function SimpleChart({
  series = [],
  xAxisLabels = [],
  isLoading = false,
  error = null,
}: {
  series: ChartSeries[];
  xAxisLabels: string[];
  isLoading?: boolean;
  error?: string | null;
}) {
  const { t } = useTranslation();
  const [hoveredPoint, setHoveredPoint] = useState<{
    x: number;
    y: number;
    month: string;
    points: { name: string; value: number; color: string }[];
  } | null>(null);
  const [dimensions, setDimensions] = useState({ width: 500, height: 300 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibility, setVisibility] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const initialVisibility = series.reduce((acc, s) => {
      acc[s.name] = true;
      return acc;
    }, {} as Record<string, boolean>);
    setVisibility(initialVisibility);
  }, [series]);

  const toggleVisibility = (name: string) => {
    setVisibility(prev => {
      const newVisibility = { ...prev, [name]: !prev[name] };
      if (Object.values(newVisibility).every(v => !v)) {
        return prev;
      }
      return newVisibility;
    });
  };

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const width = Math.min(Math.max(containerWidth - 32, 300), 800);
        const height = Math.max(width * 0.6, 300);
        setDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  if (error) {
    return (
      <div className="bg-white p-4">
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <div className="text-red-500 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-gray-600 font-medium">Unable to load chart data</p>
          <p className="text-sm text-gray-500 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white p-4">
        <div className="flex flex-col items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mb-4"></div>
          <p className="text-gray-600">Loading chart data...</p>
        </div>
      </div>
    );
  }

  if (series.length === 0 || series.every(s => s.data.length === 0) || !xAxisLabels?.length) {
    return (
      <div className="bg-white p-4">
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <div className="text-gray-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-gray-600 font-medium">No data available</p>
          <p className="text-sm text-gray-500 mt-1">Chart will appear when data is available</p>
        </div>
      </div>
    );
  }

  const allData = series.flatMap(s => (visibility[s.name] ? s.data : []));
  const rawMaxValue = Math.max(...allData, 0);
  const maxValue = Math.max(rawMaxValue, 100);
  const { width: chartWidth, height: chartHeight } = dimensions;
  const paddingX = 50;
  const paddingY = 40;

  const getX = (index: number) => paddingX + ((chartWidth - paddingX * 2) / (xAxisLabels.length - 1 || 1)) * index;
  const getY = (value: number) => chartHeight - paddingY - (value / maxValue) * (chartHeight - paddingY * 2);

  const handleMouseEnter = (points: { name: string; value: number; color: string }[], index: number) => {
    const maxVal = Math.max(...points.map(p => p.value));
    setHoveredPoint({
      x: getX(index),
      y: getY(maxVal),
      points,
      month: xAxisLabels[index],
    });
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  return (
    <div ref={containerRef} className="bg-white p-4 w-full">
      <div className="flex justify-center space-x-6 mt-4">
        {series.map(s => (
          <div
            key={s.name}
            className={`flex items-center space-x-2 cursor-pointer transition-opacity ${!visibility[s.name] ? 'opacity-50' : ''}`}
            onClick={() => toggleVisibility(s.name)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleVisibility(s.name);
              }
            }}
            tabIndex={0}
            role="button"
            aria-label={t('chart.toggleSeries', { name: s.name })}
          >
            {/* <div className="size-4 rounded-sm" style={{ backgroundColor: s.color }}></div> */}
            <span className="text-base font-bold text-gray-900">{s.name}</span>
          </div>
        ))}
      </div>

      <div className="relative">
        <svg
          width={chartWidth}
          height={chartHeight}
          className="overflow-visible w-full h-auto"
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        >
          {[0, 25, 50, 75, 100].map(value => (
            <g key={value}>
              <line
                x1={paddingX}
                y1={getY(value)}
                x2={chartWidth - paddingX}
                y2={getY(value)}
                stroke="#dddddd"
                strokeWidth="1"
                strokeDasharray={value !== 0 ? "12 6" : "0"}
              />
              <text x={paddingX - 10} y={getY(value) + 4} fontSize="14" fill="#6b7280" textAnchor="end">
                {value}
              </text>
            </g>
          ))}

          {xAxisLabels.map((month, index) => (
            <text key={month} x={getX(index)} y={chartHeight - 10} fontSize="14" fill="#6b7280" textAnchor="middle">
              {month}
            </text>
          ))}

          {series.map(s =>
            visibility[s.name] && (
              <polyline
                key={`line-${s.name}`}
                fill="none"
                stroke={s.color}
                strokeWidth="2"
                points={s.data.map((value, index) => `${getX(index)},${getY(value)}`).join(' ')}
              />
            )
          )}

          {xAxisLabels.map((_, index) => {
            const pointsAtIndex = series
              .filter(s => visibility[s.name] && s.data[index] !== undefined)
              .map(s => ({ name: s.name, value: s.data[index], color: s.color }));

            const pointsByValue = pointsAtIndex.reduce((acc, point) => {
              acc[point.value] = acc[point.value] || [];
              acc[point.value].push(point);
              return acc;
            }, {} as Record<number, typeof pointsAtIndex>);

            return Object.entries(pointsByValue).map(([valueStr, points]) => {
              const value = Number(valueStr);
              return (
                <g key={`${index}-${value}`}>
                  {points.length === 1 ? (
                    <circle
                      cx={getX(index)}
                      cy={getY(value)}
                      r="4"
                      fill={points[0].color}
                      stroke="white"
                      strokeWidth="2"
                      className="cursor-pointer"
                      onMouseEnter={() => handleMouseEnter(points, index)}
                      onMouseLeave={handleMouseLeave}
                    />
                  ) : (
                    <>
                      {points.map(p => (
                        <circle key={p.name} cx={getX(index)} cy={getY(value)} r="4" fill={p.color} stroke="white" strokeWidth="2" />
                      ))}
                      <circle
                        cx={getX(index)}
                        cy={getY(value)}
                        r="8"
                        fill="transparent"
                        className="cursor-pointer"
                        onMouseEnter={() => handleMouseEnter(points, index)}
                        onMouseLeave={handleMouseLeave}
                      />
                    </>
                  )}
                  {points.map(p => (
                     p.value > 0 && <text key={p.name} x={getX(index)} y={getY(p.value) - 8} fontSize="12" fill={p.color} textAnchor="middle" className="pointer-events-none">{p.value}</text>
                  ))}
                </g>
              );
            });
          })}
        </svg>

        {hoveredPoint && (
          <div
            className="absolute z-10 bg-gray-900 text-white text-sm rounded-lg px-3 py-2 pointer-events-none shadow-lg min-w-[150px]"
            style={{
              left: hoveredPoint.x,
              top: hoveredPoint.y,
              transform: 'translateX(-50%) translateY(-120%)',
            }}
          >
            <div className="text-gray-300 font-semibold">{hoveredPoint.month}</div>
            {hoveredPoint.points.map(p => (
              <div key={p.name} className="flex items-center mt-1">
                <div className="size-2 rounded-full mr-2" style={{ backgroundColor: p.color }}></div>
                <span className="mr-auto">{p.name} </span>
                <span className="font-bold ml-2">{p.value}</span>
              </div>
            ))}
            <div
              className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full"
              style={{
                width: 0,
                height: 0,
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: '6px solid #111827',
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
} 