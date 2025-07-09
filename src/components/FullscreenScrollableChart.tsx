/* eslint-disable react-native/no-inline-styles */
import React, {useEffect, useState} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Text,
} from 'react-native';
import Orientation from 'react-native-orientation-locker';
import {ScrollableLineChart} from './crosshairchart'; // Use your working version!

type FullscreenChartProps = {
  lines: number[][];
  lineColors?: string[];
  showThresholds?: boolean;
  minThreshold?: number;
  maxThreshold?: number;
  height?: number;
  pointWidth?: number;
};

export const FullscreenScrollableChart: React.FC<FullscreenChartProps> = ({
  lines,
  lineColors = ['blue', 'red'],
  showThresholds = false,
  minThreshold = 30,
  maxThreshold = 70,
  height = 300,
  pointWidth = 5,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (isFullscreen) {
      Orientation.lockToLandscape();
    } else {
      Orientation.lockToPortrait();
    }
    return () => {
      Orientation.unlockAllOrientations();
    };
  }, [isFullscreen]);

  return (
    <View style={{flex: 1}}>
      <TouchableOpacity
        onPress={() => setIsFullscreen(true)}
        style={styles.fullscreenButton}>
        <Text style={{color: 'white'}}>
          {isFullscreen ? 'Exit' : 'Fullscreen'}
        </Text>
      </TouchableOpacity>

      {!isFullscreen && (
        <ScrollableLineChart
          lines={lines}
          lineColors={lineColors}
          showThresholds={showThresholds}
          minThreshold={minThreshold}
          maxThreshold={maxThreshold}
          height={height}
          pointWidth={pointWidth}
        />
      )}

      <Modal
        visible={isFullscreen}
        animationType="fade"
        supportedOrientations={['landscape']}>
        <View style={styles.fullscreenContainer}>
          <TouchableOpacity
            onPress={() => setIsFullscreen(false)}
            style={styles.fullscreenExit}>
            <Text style={{color: 'white'}}>Exit</Text>
          </TouchableOpacity>
          <ScrollableLineChart
            lines={lines}
            lineColors={lineColors}
            showThresholds={showThresholds}
            minThreshold={minThreshold}
            maxThreshold={maxThreshold}
            height={Dimensions.get('window').height} // fill screen height
            pointWidth={pointWidth}
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  fullscreenButton: {
    backgroundColor: '#333',
    padding: 10,
    alignSelf: 'flex-end',
    margin: 10,
    borderRadius: 4,
  },
  fullscreenContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  fullscreenExit: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    backgroundColor: '#333',
    padding: 10,
    borderRadius: 4,
  },
});
