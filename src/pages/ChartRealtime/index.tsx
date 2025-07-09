/* eslint-disable react-native/no-inline-styles */
import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import {YAxis, XAxis, LineChart as SVGLineChart} from 'react-native-svg-charts';
import {G, Line, Svg} from 'react-native-svg';
import * as scale from 'd3-scale';
import * as shape from 'd3-shape';

const screenWidth = Dimensions.get('window').width;
const chartHeight = 300;

const ChartWithPinchZoomPanResponder = () => {
  const [line1, setLine1] = useState([10, 20, 15, 30, 25, 40]);
  const [line2, setLine2] = useState([20, 25, 18, 35, 28, 45]);

  const minThreshold = 30;
  const maxThreshold = 70;

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const lastScale = useRef(1);
  const initialDistance = useRef(0);

  // ✅ Track scale properly
  useEffect(() => {
    const id = scaleAnim.addListener(({value}) => {
      lastScale.current = value;
    });
    return () => {
      scaleAnim.removeListener(id);
    };
  }, [scaleAnim]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLine1(prev => [...prev, Math.floor(Math.random() * 100)]);
      setLine2(prev => [...prev, Math.floor(Math.random() * 100)]);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: evt => evt.nativeEvent.touches.length === 2,
      onMoveShouldSetPanResponder: evt => evt.nativeEvent.touches.length === 2,
      onPanResponderGrant: evt => {
        if (evt.nativeEvent.touches.length === 2) {
          const touch1 = evt.nativeEvent.touches[0];
          const touch2 = evt.nativeEvent.touches[1];
          const dx = touch1.pageX - touch2.pageX;
          const dy = touch1.pageY - touch2.pageY;
          initialDistance.current = Math.sqrt(dx * dx + dy * dy);
        }
      },
      onPanResponderMove: evt => {
        if (evt.nativeEvent.touches.length === 2) {
          const touch1 = evt.nativeEvent.touches[0];
          const touch2 = evt.nativeEvent.touches[1];
          const dx = touch1.pageX - touch2.pageX;
          const dy = touch1.pageY - touch2.pageY;
          const currentDistance = Math.sqrt(dx * dx + dy * dy);
          const nextScale =
            (currentDistance / initialDistance.current) * lastScale.current;
          scaleAnim.setValue(nextScale);
        }
      },
      onPanResponderRelease: () => {
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
        }).start(() => {
          lastScale.current = 1;
        });
      },
    }),
  ).current;

  return (
    <View style={{flex: 1}}>
      <View style={styles.container}>
        <YAxis
          data={[...line1, ...line2, minThreshold, maxThreshold]}
          contentInset={{top: 20, bottom: 20}}
          svg={{fontSize: 10, fill: 'grey'}}
        />
        <Animated.View
          {...panResponder.panHandlers}
          style={{flex: 1, transform: [{scale: scaleAnim}]}}>
          <Svg style={{height: chartHeight, flex: 1}}>
            <G>
              <SVGLineChart
                style={StyleSheet.absoluteFill}
                data={[line1, line2]}
                svg={{stroke: 'rgb(134, 65, 244)'}}
                contentInset={{top: 20, bottom: 20}}
                curve={shape.curveLinear} // ✅ Straight lines
              />
              <ThresholdLine
                yValue={minThreshold}
                color="red"
                data={[...line1, ...line2]}
              />
              <ThresholdLine
                yValue={maxThreshold}
                color="green"
                data={[...line1, ...line2]}
              />
            </G>
          </Svg>
        </Animated.View>
      </View>
      <XAxis
        style={{marginHorizontal: -10}}
        data={line1}
        formatLabel={(value, index) => index.toString()}
        contentInset={{left: 30, right: 30}}
        svg={{fontSize: 10, fill: 'grey'}}
      />
    </View>
  );
};

const ThresholdLine = ({yValue, color, data}: any) => {
  const yScale = scale
    .scaleLinear()
    .domain([Math.min(...data), Math.max(...data)])
    .range([chartHeight - 20, 20]); // match contentInset

  return (
    <Line
      x1="0"
      x2={screenWidth}
      y1={yScale(yValue)}
      y2={yScale(yValue)}
      stroke={color}
      strokeWidth={2}
      strokeDasharray={[4, 4]}
    />
  );
};

export default ChartWithPinchZoomPanResponder;

const styles = StyleSheet.create({
  container: {
    height: chartHeight,
    padding: 20,
    flexDirection: 'row',
  },
});
