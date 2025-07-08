/* eslint-disable react-native/no-inline-styles */
import React, {useEffect, useState} from 'react';
import {View, StyleSheet} from 'react-native';
import {
  LineChart as SVGLineChart,
  Grid,
  YAxis,
  XAxis,
} from 'react-native-svg-charts';
import * as shape from 'd3-shape';
import {
  PinchGestureHandler,
  GestureHandlerRootView,
  PinchGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

const screenHeight = 300;

const ChartWithLiveData = () => {
  const [line1, setLine1] = useState([10, 20, 15, 30, 25, 40]);
  const [line2, setLine2] = useState([20, 25, 18, 35, 28, 45]);

  const scale = useSharedValue(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setLine1(prev => [...prev, Math.floor(Math.random() * 50)]);
      setLine2(prev => [...prev, Math.floor(Math.random() * 50)]);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const pinchHandler =
    useAnimatedGestureHandler<PinchGestureHandlerGestureEvent>({
      onActive: event => {
        scale.value = event.scale; // ✅ Now `scale` is correctly typed
      },
      onEnd: () => {
        scale.value = withTiming(1);
      },
    });
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
  }));

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <View style={styles.container}>
        <YAxis
          data={[...line1, ...line2]}
          contentInset={{top: 20, bottom: 20}}
          svg={{fontSize: 10, fill: 'grey'}}
        />
        <PinchGestureHandler onGestureEvent={pinchHandler}>
          <Animated.View style={[{flex: 1}, animatedStyle]}>
            <SVGLineChart
              style={{height: screenHeight, flex: 1}}
              data={[line1, line2]}
              svg={{stroke: 'rgb(134, 65, 244)'}}
              contentInset={{top: 20, bottom: 20}}
              curve={shape.curveLinear}>
              <Grid />
            </SVGLineChart>
          </Animated.View>
        </PinchGestureHandler>
      </View>
      <XAxis
        style={{marginHorizontal: -10}}
        data={line1}
        formatLabel={(value, index) => index.toString()}
        contentInset={{left: 30, right: 30}}
        svg={{fontSize: 10, fill: 'grey'}}
      />
    </GestureHandlerRootView>
  );
};

export default ChartWithLiveData;

const styles = StyleSheet.create({
  container: {
    height: screenHeight,
    padding: 20,
    flexDirection: 'row',
  },
});
