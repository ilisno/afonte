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

// Generate more realistic static data (100 points)
const generateRealisticData = (numPoints: number) => {
  const data = [];
  let currentValue = 50; // Starting value
  const progressRate = 0.5; // Average increase per point
  const volatility = 5; // How much the value can fluctuate

  for (let i = 0; i < numPoints; i++) {
    // Add general progress
    currentValue += progressRate + (Math.random() - 0.5) * volatility;

    // Ensure value doesn't go below a certain point (e.g., 10)
    currentValue = Math.max(10, currentValue);

    data.push({
      name: `Point ${i + 1}`, // Simple naming for points
      perfs: Math.round(currentValue), // Use 'perfs' key and round to integer
    });
  }
  return data;
};

const data = generateRealisticData(100); // Generate 100 data points

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
    <div ref={chartRef} className={cn("w-full h-64 md:h-80", !isVisible && "opacity-0 transition-opacity duration-500")}> {/* Added opacity transition */}
      {/* Render the chart only when visible */}
      {isVisible && (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{
              top: 5,
              right: 10, // Reduced right margin
              left: 10, // Reduced left margin
              bottom: 5,
            }}
          >
            {/* Removed CartesianGrid for a cleaner look */}
            {/* <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" /> */}
            <XAxis dataKey="name" hide={true} /> {/* Hide X axis labels for simplicity */}
            <YAxis
               dataKey="perfs" // Use the new data key
               stroke="#555"
               // Removed: label={{ value: 'Tes perfs', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#555' } }} // Changed Y axis label
               tickLine={false} // Hide Y axis tick lines
               axisLine={false} // Hide Y axis line
            />
            <Tooltip />
            {/* Animated Line */}
            <Line
              type="monotone"
              dataKey="perfs" // Use the new data key
              stroke="hsl(var(--sbf-red))" // Use your custom red color
              strokeWidth={3} // Thicker line
              dot={false} // Hide dots for a smoother curve
              // dot={{ stroke: 'hsl(var(--sbf-red))', strokeWidth: 2, r: 4 }} // Styled dots
              // activeDot={{ r: 6 }} // Larger dot on hover
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