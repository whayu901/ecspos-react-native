/* eslint-disable react-native/no-inline-styles */
import React, {useState, useEffect} from 'react';
import {View, ScrollView, Dimensions, Text} from 'react-native';
import {LineChart} from 'react-native-chart-kit';

const ThresholdChartWithStatus = () => {
  const [dataPoints, setDataPoints] = useState<number[]>([]);

  // Sensor Data Simulation (Dynamic)
  useEffect(() => {
    const interval = setInterval(() => {
      setDataPoints(prev => {
        const newData = [...prev, Math.floor(Math.random() * 150)];
        return newData.slice(-50); // Keep only last 50 data points
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Dynamic width for the chart
  const screenWidth = Dimensions.get('window').width;
  const dynamicWidth = Math.max(screenWidth, dataPoints.length * 50);

  // Calculate Min, Max, Avg values
  const minValue = Math.min(...dataPoints);
  const maxValue = Math.max(...dataPoints);
  const avgValue =
    dataPoints.length > 0
      ? dataPoints.reduce((a, b) => a + b, 0) / dataPoints.length
      : 0;

  // Threshold settings
  const minThreshold1 = 50; // Critical (Yellow)
  const minThreshold2 = 80; // Warning (Red)
  const maxThreshold1 = 105; // Warning (Red)
  const maxThreshold2 = 120; // Critical (Yellow)
  const avgThreshold = 100; // Warning (Red)

  // Determine status based on thresholds
  const getStatus = () => {
    if (minValue < minThreshold1) {
      return {text: 'Critical', color: 'yellow'};
    }
    if (minValue < minThreshold2) {
      return {text: 'Warning', color: 'red'};
    }
    if (maxValue > maxThreshold2) {
      return {text: 'Critical', color: 'yellow'};
    }
    if (maxValue > maxThreshold1) {
      return {text: 'Warning', color: 'red'};
    }
    if (avgValue > avgThreshold) {
      return {text: 'Warning', color: 'red'};
    }
    return {text: 'Normal', color: 'green'};
  };

  const status = getStatus();

  return (
    <View style={{flex: 1, padding: 10, backgroundColor: '#121212'}}>
      <ScrollView horizontal>
        {dataPoints.length !== 0 && (
          <View style={{width: dynamicWidth}}>
            <LineChart
              data={{
                labels: dataPoints.map((_, index) => index.toString()),
                datasets: [
                  {
                    data: dataPoints,
                    color: (opacity = 1) => `rgba(54, 162, 235, ${opacity})`,
                  }, // Main Data
                  {
                    data: new Array(dataPoints.length).fill(minThreshold1),
                    color: () => 'yellow',
                    strokeWidth: 2,
                    withDots: false,
                  },
                  {
                    data: new Array(dataPoints.length).fill(minThreshold2),
                    color: () => 'red',
                    strokeWidth: 2,
                    withDots: false,
                  },
                  {
                    data: new Array(dataPoints.length).fill(maxThreshold1),
                    color: () => 'red',
                    strokeWidth: 2,
                    withDots: false,
                  },
                  {
                    data: new Array(dataPoints.length).fill(maxThreshold2),
                    color: () => 'yellow',
                    strokeWidth: 2,
                    withDots: false,
                  },
                  {
                    data: new Array(dataPoints.length).fill(avgThreshold),
                    color: () => 'red',
                    strokeWidth: 2,
                    withDots: false,
                  },
                ],
              }}
              width={dynamicWidth}
              height={300}
              yAxisSuffix=""
              chartConfig={{
                backgroundColor: '#e26a00',
                backgroundGradientFrom: '#fb8c00',
                backgroundGradientTo: '#ffa726',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                style: {borderRadius: 16},
                propsForDots: {r: '4', strokeWidth: '', stroke: '#ffa726'},
              }}
              style={{marginVertical: 8, borderRadius: 16}}
            />
          </View>
        )}
      </ScrollView>

      {/* Status Display */}
      <View
        style={{
          marginTop: 20,
          padding: 10,
          borderRadius: 8,
        }}>
        <Text style={{fontSize: 16, color: 'white', textAlign: 'center'}}>
          Min: {minValue} | Max: {maxValue} | Avg: {avgValue.toFixed(2)}
        </Text>
        <Text
          style={{
            fontSize: 18,
            fontWeight: 'bold',
            color: status.color,
            textAlign: 'center',
          }}>
          Status: {status.text}
        </Text>
      </View>
    </View>
  );
};

export default ThresholdChartWithStatus;
