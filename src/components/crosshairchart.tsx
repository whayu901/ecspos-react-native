import React, {useState, useMemo} from 'react';
import {View, StyleSheet, ScrollView, Pressable} from 'react-native';
import {YAxis} from 'react-native-svg-charts';
import {
  Svg,
  G,
  Path,
  Line as SvgLine,
  Circle,
  Text as SvgText,
} from 'react-native-svg';
import * as scale from 'd3-scale';
import * as shape from 'd3-shape';

type Props = {
  lines: number[][];
  lineColors?: string[];
  showThresholds?: boolean;
  minThreshold?: number;
  maxThreshold?: number;
  height?: number;
  pointWidth?: number;
};

export const ScrollableLineChart: React.FC<Props> = ({
  lines,
  lineColors = ['blue', 'red', 'green'],
  showThresholds = false,
  minThreshold = 30,
  maxThreshold = 70,
  height = 300,
  pointWidth = 5,
}) => {
  const allData = useMemo(() => lines.flat(), [lines]);
  const [crossX, setCrossX] = useState<number | null>(null);
  const [crossY, setCrossY] = useState<number | null>(null);
  const [value, setValue] = useState<number | null>(null);

  const contentWidth = lines[0].length * pointWidth;

  const yScale = scale
    .scaleLinear()
    .domain([
      Math.min(...allData, minThreshold, maxThreshold),
      Math.max(...allData, minThreshold, maxThreshold),
    ])
    .range([height - 20, 20]);

  const xScale = scale
    .scaleLinear()
    .domain([0, lines[0].length - 1])
    .range([0, contentWidth]);

  const paths = useMemo(
    () =>
      lines.map(
        dataset =>
          shape
            .line<number>()
            .x((_, i) => xScale(i))
            .y(d => yScale(d))
            .curve(shape.curveLinear)(dataset) || '',
      ),
    [lines, xScale, yScale],
  );

  const handlePress = (event: any) => {
    const locationX = event.nativeEvent.locationX;
    const index = Math.round(
      (locationX / contentWidth) * (lines[0].length - 1),
    );
    const clamped = Math.max(0, Math.min(index, lines[0].length - 1));
    const yVal = lines[0][clamped];
    const y = yScale(yVal);
    const x = xScale(clamped);
    setCrossX(x);
    setCrossY(y);
    setValue(yVal);
  };

  return (
    <View style={{flex: 1}}>
      <View style={[styles.container, {height}]}>
        <YAxis
          data={[...allData, minThreshold, maxThreshold]}
          contentInset={{top: 20, bottom: 20}}
          svg={{fontSize: 10, fill: 'grey'}}
        />
        <ScrollView horizontal style={{flex: 1}} scrollEventThrottle={16}>
          <Pressable
            onPressIn={handlePress}
            style={{width: contentWidth, height}}>
            <Svg style={{height, width: contentWidth}}>
              <G>
                {paths.map((d, idx) => (
                  <Path
                    key={`line-${idx}`}
                    d={d}
                    stroke={lineColors[idx] || 'black'}
                    strokeWidth={2}
                    fill="none"
                  />
                ))}

                {showThresholds && (
                  <>
                    <SvgLine
                      x1="0"
                      x2={contentWidth}
                      y1={yScale(minThreshold)}
                      y2={yScale(minThreshold)}
                      stroke="red"
                      strokeWidth={2}
                      strokeDasharray={[4, 4]}
                    />
                    <SvgLine
                      x1="0"
                      x2={contentWidth}
                      y1={yScale(maxThreshold)}
                      y2={yScale(maxThreshold)}
                      stroke="green"
                      strokeWidth={2}
                      strokeDasharray={[4, 4]}
                    />
                  </>
                )}

                {crossX !== null && crossY !== null && value !== null && (
                  <>
                    <SvgLine
                      x1={crossX}
                      x2={crossX}
                      y1="0"
                      y2={height}
                      stroke="grey"
                      strokeWidth={1}
                    />
                    <Circle cx={crossX} cy={crossY} r={4} fill="black" />
                    <SvgText
                      x={Math.max(5, Math.min(crossX + 5, contentWidth - 50))}
                      y={Math.max(15, crossY - 10)}
                      fontSize="12"
                      fill="black">
                      {String(value.toFixed(2))}
                    </SvgText>
                  </>
                )}
              </G>
            </Svg>
          </Pressable>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flexDirection: 'row',
  },
});
