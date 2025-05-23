import React, { useEffect, useRef, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/utils'; // Assuming cn utility is available

// Static data for the illustrative chart
const data = [
  { name: 'Semaine 1', force: 10 },
  { name: 'Semaine 2', force: 25 },
  { name: 'Semaine 3', force: 40 },
  { name: 'Semaine 4', force: 55 },
];

const StrengthProgressChart: React.FC = () => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // If the element is intersecting (visible) and we haven't set it to visible yet
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      {
        root: null, // Use the viewport as the root
        rootMargin: '0px',
        threshold: 0.1, // Trigger when 10% of the element is visible
      }
    );

    if (chartRef.current) {
      observer.observe(chartRef.current);
    }

    // Cleanup function
    return () => {
      if (chartRef.current) {
        observer.unobserve(chartRef.current);
      }
    };
  }, [isVisible]); // Re-run effect if isVisible changes (to stop observing once visible)


  return (
    <div ref={chartRef} className={cn("w-full h-64 md:h-80", !isVisible && "opacity-0")}> {/* Added opacity transition */}
      {/* Render the chart only when visible */}
      {isVisible && (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" /> {/* Lighter grid */}
            <XAxis dataKey="name" stroke="#555" /> {/* Darker axis labels */}
            <YAxis stroke="#555" label={{ value: 'Progression (Unités Arbitraires)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#555' } }} /> {/* Added Y axis label */}
            <Tooltip />
            {/* Animated Line */}
            <Line
              type="monotone"
              dataKey="force"
              stroke="hsl(var(--sbf-red))" // Use your custom red color
              strokeWidth={3} // Thicker line
              dot={{ stroke: 'hsl(var(--sbf-red))', strokeWidth: 2, r: 4 }} // Styled dots
              activeDot={{ r: 6 }} // Larger dot on hover
              animationDuration={1500} // Animation duration
              animationEasing="ease-out" // Animation easing
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default StrengthProgressChart;