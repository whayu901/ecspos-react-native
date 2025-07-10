import React, {useState, useEffect} from 'react';
import {FullscreenEChartsChart} from '../../components/FullscreenScrollableChart';

export default function ChartScreen() {
  const [lineData, setLineData] = useState<number[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLineData(prev => {
        const next = [...prev, Math.random() * 100];
        // Keep only last 300 points for performance
        return next.slice(-300);
      });
    }, 1000); // every 1 second

    return () => clearInterval(interval);
  }, []);

  return (
    <FullscreenEChartsChart
      lines={[lineData]} // ✅ Pass as array of arrays, even if only one line!
      lineColors={['blue']}
      showThresholds={true}
      minThreshold={30}
      maxThreshold={70}
      height={200}
      label="Data X"
    />
  );
}
