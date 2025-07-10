import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  View,
  Dimensions,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native';
import Orientation from 'react-native-orientation-locker';
import {WebView} from 'react-native-webview';
import Icon from 'react-native-vector-icons/Feather';

type Props = {
  lines: number[][];
  lineColors?: string[];
  height?: number;
  minThreshold?: number;
  maxThreshold?: number;
  showThresholds?: boolean;
};

export const FullscreenEChartsChart: React.FC<Props> = ({
  lines,
  lineColors = ['#5470C6', '#EE6666', '#91CC75'],
  height = 300,
  minThreshold = 30,
  maxThreshold = 70,
  showThresholds = true,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const webviewRef = useRef<WebView>(null);

  const buildOption = useCallback(
    (lines: any) => {
      const pointCount = lines[0]?.length || 0;
      const series = lines.map((line: any, idx: number) => ({
        name: `Line ${idx + 1}`,
        type: 'line',
        data: line,
        smooth: false,
        showSymbol: false,
        lineStyle: {color: lineColors[idx % lineColors.length], width: 2},
      }));

      if (showThresholds) {
        series.push(
          {
            name: 'Min Threshold',
            type: 'line',
            data: Array(pointCount).fill(minThreshold),
            lineStyle: {color: 'red', type: 'dashed' as any},
            showSymbol: false,
          },
          {
            name: 'Max Threshold',
            type: 'line',
            data: Array(pointCount).fill(maxThreshold),
            lineStyle: {color: 'green', type: 'dashed' as any},
            showSymbol: false,
          },
        );
      }

      return {
        tooltip: {trigger: 'axis', axisPointer: {type: 'cross'}},
        dataZoom: [
          {type: 'inside', start: 0, end: 100},
          {start: 0, end: 100},
        ],
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: Array.from({length: pointCount}, (_, i) => i),
        },
        yAxis: {type: 'value'},
        series,
      };
    },
    [lineColors, maxThreshold, minThreshold, showThresholds],
  );

  useEffect(() => {
    if (webviewRef.current) {
      const option = buildOption(lines);
      webviewRef.current.postMessage(JSON.stringify(option));
    }
  }, [buildOption, lines]);

  useEffect(() => {
    if (isFullscreen) {
      Orientation.unlockAllOrientations();
      Orientation.lockToLandscape();
    } else {
      Orientation.unlockAllOrientations();
      Orientation.lockToPortrait();
    }
    return () => {
      Orientation.unlockAllOrientations();
    };
  }, [isFullscreen]);

  const {height: windowHeight} = Dimensions.get('window');
  const chartHeight = isFullscreen ? windowHeight : height;
  const pointCount = lines[0]?.length || 0;

  const series = lines.map((line, idx) => ({
    name: `Line ${idx + 1}`,
    type: 'line',
    data: line,
    smooth: false,
    showSymbol: false,
    lineStyle: {color: lineColors[idx % lineColors.length], width: 2},
  }));

  if (showThresholds) {
    series.push(
      {
        name: 'Min Threshold',
        type: 'line',
        data: Array(pointCount).fill(minThreshold),
        lineStyle: {color: 'red', width: 10},
        showSymbol: false,
        smooth: false,
      },
      {
        name: 'Max Threshold',
        type: 'line',
        data: Array(pointCount).fill(maxThreshold),
        lineStyle: {color: 'green', width: 10},
        showSymbol: false,
        smooth: false,
      },
    );
  }

  const option = {
    tooltip: {trigger: 'axis', axisPointer: {type: 'cross'}},
    dataZoom: [
      {type: 'inside', start: 0, end: 100},
      {start: 0, end: 100},
    ],
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: Array.from({length: pointCount}, (_, i) => i),
    },
    yAxis: {type: 'value'},
    series,
  };

  const sendOptionToWebView = () => {
    if (webviewRef.current) {
      webviewRef.current.postMessage(JSON.stringify(option));
    }
  };

  const ChartView = (
    <WebView
      ref={webviewRef}
      originWhitelist={['*']}
      source={require('../../assets/echarts.html')}
      onLoadEnd={sendOptionToWebView}
      javaScriptEnabled
      // eslint-disable-next-line react-native/no-inline-styles
      style={{height: chartHeight, width: '100%'}}
    />
  );

  return (
    <View style={{flex: 1}}>
      {!isFullscreen && (
        <TouchableOpacity
          onPress={() => setIsFullscreen(true)}
          style={styles.fullscreenButton}>
          <Icon name="maximize" size={20} color="#fff" />
        </TouchableOpacity>
      )}

      {!isFullscreen && ChartView}

      <Modal
        visible={isFullscreen}
        animationType="fade"
        supportedOrientations={['landscape']}
        onRequestClose={() => setIsFullscreen(false)}>
        <View style={styles.fullscreenContainer}>
          <TouchableOpacity
            onPress={() => setIsFullscreen(false)}
            style={styles.fullscreenExit}>
            <Icon name="x" size={24} color="#fff" />
          </TouchableOpacity>
          {ChartView}
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
