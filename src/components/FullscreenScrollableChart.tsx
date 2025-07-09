import React, {useMemo, useState, useEffect, useCallback} from 'react';
import {
  View,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native';
import Orientation from 'react-native-orientation-locker';
import {
  Canvas,
  Path,
  Skia,
  Line,
  Circle,
  Text as SkiaText,
  PaintStyle,
  vec,
  useFont,
} from '@shopify/react-native-skia';
import Icon from 'react-native-vector-icons/Feather';

type Props = {
  lines: number[][]; // ✅ multiple lines
  lineColors?: string[]; // ✅ colors for each line
  height?: number;
  pointWidth?: number;
  minThreshold?: number;
  maxThreshold?: number;
  showThresholds?: boolean;
};

export const FullscreenSkiaScrollableChartWithCrosshair: React.FC<Props> = ({
  lines,
  lineColors = ['blue', 'red', 'green'], // default colors
  height = 300,
  pointWidth = 2,
  minThreshold = 30,
  maxThreshold = 70,
  showThresholds = true,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const font = useFont(require('../../assets/fonts/Roboto-Regular.ttf'), 12);

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

  const pointCount = lines[0]?.length || 0; // assumes all lines same length
  const contentWidth = pointCount * pointWidth;

  const allData = lines.flat();
  const minY = Math.min(...allData, minThreshold, maxThreshold);
  const maxY = Math.max(...allData, minThreshold, maxThreshold);

  const yScale = useCallback(
    (yVal: number) =>
      chartHeight - ((yVal - minY) / (maxY - minY)) * chartHeight,
    [chartHeight, maxY, minY],
  );

  const paths = useMemo(() => {
    return lines.map(line => {
      const p = Skia.Path.Make();
      line.forEach((yVal, index) => {
        const x = index * pointWidth;
        const y = yScale(yVal);
        index === 0 ? p.moveTo(x, y) : p.lineTo(x, y);
      });
      return p;
    });
  }, [lines, pointWidth, yScale]);

  const paints = useMemo(() => {
    return lineColors.map(color => {
      const paint = Skia.Paint();
      paint.setColor(Skia.Color(color));
      paint.setStyle(PaintStyle.Stroke);
      paint.setStrokeWidth(2);
      return paint;
    });
  }, [lineColors]);

  const [cross, setCross] = useState<{
    x: number;
    y: number;
    value: number;
  } | null>(null);

  const handleTouch = useCallback(
    (touch: any) => {
      const t = touch.touches[0];
      if (!t) return;

      const x = t.x;
      const idx = Math.round((x / contentWidth) * (pointCount - 1));
      const clamped = Math.max(0, Math.min(idx, pointCount - 1));
      const val = lines[0][clamped]; // snap to first line
      setCross({
        x: clamped * pointWidth,
        y: yScale(val),
        value: val,
      });
    },
    [contentWidth, pointCount, lines, pointWidth, yScale],
  );

  const ChartView = (
    <ScrollView horizontal scrollEventThrottle={16}>
      <Canvas
        style={{width: contentWidth, height: chartHeight}}
        onTouchMove={handleTouch}>
        {paths.map((p, i) => (
          <Path key={`line-${i}`} path={p} paint={paints[i % paints.length]} />
        ))}

        {showThresholds && (
          <>
            <Line
              p1={{x: 0, y: yScale(minThreshold)}}
              p2={{x: contentWidth, y: yScale(minThreshold)}}
              color="red"
              strokeWidth={2}
            />
            <Line
              p1={{x: 0, y: yScale(maxThreshold)}}
              p2={{x: contentWidth, y: yScale(maxThreshold)}}
              color="green"
              strokeWidth={2}
            />
          </>
        )}

        {cross && font && (
          <>
            <Line
              p1={{x: cross.x, y: 0}}
              p2={{x: cross.x, y: chartHeight}}
              color="grey"
              strokeWidth={1}
            />
            <Circle cx={cross.x} cy={cross.y} r={4} color="black" />
            <SkiaText
              origin={vec(
                Math.max(5, Math.min(cross.x + 5, contentWidth - 50)),
                Math.max(15, cross.y - 10),
              )}
              text={cross.value.toFixed(2)}
              color="black"
              font={font}
            />
          </>
        )}
      </Canvas>
    </ScrollView>
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
