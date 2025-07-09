import React, {useState, useEffect} from 'react';
import {FullscreenScrollableChart} from '../../components/FullscreenScrollableChart';

export default function ChartScreen() {
  const [lineData, setLineData] = useState<number[]>([]);

  useEffect(() => {
    const bigData = Array.from({length: 3000}, () => Math.random() * 100);
    setLineData(bigData);
  }, []);

  return (
    <FullscreenScrollableChart
      lines={[lineData]} // ✅ Pass as array of arrays, even if only one line!
      lineColors={['blue']}
      showThresholds={true}
      minThreshold={30}
      maxThreshold={70}
      height={300}
    />
  );
}
