/* eslint-disable react-native/no-inline-styles */
import React, {useEffect, useState} from 'react';
import {Dimensions, StyleSheet, View} from 'react-native';
import {LineChart} from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;
const chartHeight = 220;
const maxPoints = 10; // Only show last 10 data points

const ChartWithLiveData = () => {
  const [prevData] = useState([10, 20, 15, 30, 25, 40]); // static/historical
  const [liveData, setLiveData] = useState<any[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveData(prev => [...prev, Math.floor(Math.random() * 50)]);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const combinedData = [...prevData, ...liveData];
  const slicedData = combinedData.slice(-maxPoints);

  // calculate how many previous data points are in the slice
  const startIndex = combinedData.length - slicedData.length;
  const dividerIndex = Math.max(0, prevData.length - startIndex); // adjust based on slicing

  return (
    <View style={styles.chartContainer}>
      <LineChart
        data={{
          labels: slicedData.map((_, i) => i.toString()),
          datasets: [{data: slicedData}],
        }}
        width={screenWidth}
        height={chartHeight}
        yAxisSuffix=""
        chartConfig={{
          backgroundColor: '#fff',
          backgroundGradientFrom: '#fff',
          backgroundGradientTo: '#fff',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
        }}
        bezier
        style={{position: 'relative'}}
      />

      {/* DOTTED RED DIVIDER */}
      {slicedData.length > 0 && dividerIndex > 0 && (
        <View
          style={[
            styles.divider,
            {
              left: (dividerIndex / slicedData.length) * screenWidth,
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  chartContainer: {
    position: 'relative',
  },
  divider: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderLeftWidth: 2,
    borderLeftColor: 'red',
    borderStyle: 'dotted',
    zIndex: 10,
  },
});

export default ChartWithLiveData;
