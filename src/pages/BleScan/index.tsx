/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-native/no-inline-styles */
import React, {useCallback, useEffect, useMemo} from 'react';
import {
  View,
  Text,
  Button,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {LineChart} from 'react-native-chart-kit';

import styles from './styles';
// import useBle from './useBLE';
import {Device} from 'react-native-ble-plx';
import {useBleContext} from './BleContext';
import {FullscreenEChartsChart} from '../../components/FullscreenScrollableChart';

const HomeScreen = () => {
  const {
    requestPermissions,
    scanForDevices,

    allDevices,
    isScanningDevice,
    connectToDevice,
    connectedDevice,
    monitoredData,

    collectVibrationData,
    stopCollectTmpData,
    isDisableStopBtn,
    // receivedData,
    disconnectDevice,

    collectValue,
    resumeCollectData,
    pauseCollectTempData,
    isPaused,
    // startTimer,
    // resumeTimer,
    // stopTimer,
    formatTime,
    runningTime,
    // pauseTimer,
    MAX_TIME,
    setWidgetFrom,
    spectrumeData,

    tempSpectrumeData,
    isLoadingCollectData,
    percentage,
    // receivedDataRef,
  } = useBleContext();

  // const {receivedDataRef} = useBleContext();

  useEffect(() => {
    setWidgetFrom('bluetooth');
    return () => setWidgetFrom('home'); // When you navigate away!
  }, [setWidgetFrom]);

  const onScanDevices = async () => {
    requestPermissions((isGranted: boolean) => {
      if (isGranted) {
        scanForDevices();
      }
    });
  };

  const getLabelIndex = useCallback((index: number) => {
    switch (index) {
      case 0:
        return 'X';
      case 1:
        return 'Y';
      case 2:
        return 'Z';
      default:
        return '';
    }
  }, []);

  return (
    <ScrollView style={styles.container}>
      {isScanningDevice && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size={'small'} />
        </View>
      )}
      {allDevices?.map((device: Device) => (
        <View style={styles.deviceItemContainer}>
          <View style={styles.deviceItem}>
            <Text>{device?.name}</Text>
          </View>
          <View style={styles.connectButtonContainer}>
            <Button
              title={
                connectedDevice?.id === device.id ? 'Disconnected' : 'Connect'
              }
              onPress={() =>
                connectedDevice?.id === device.id
                  ? disconnectDevice(device.id)
                  : connectToDevice(device)
              }
            />
          </View>
        </View>
      ))}
      {!!connectedDevice && (
        <View style={styles.connectedDeviceContainer}>
          <Text style={styles.title}>Connected Device</Text>
          <Text
            style={styles.data}>{`Device Name: ${connectedDevice?.name}`}</Text>
          <Text style={styles.data}>{`Device ID: ${connectedDevice?.id}`}</Text>
          <Text>{`Data: ${monitoredData}`}</Text>

          <TouchableOpacity onPress={() => connectToDevice(connectedDevice)}>
            <Text>Hello world</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={{marginBottom: 15}}>
        <Text style={{paddingVertical: 10}}>Realtime Value:</Text>
        <Text>{collectValue}</Text>
      </View>

      {runningTime > 0 && (
        <Text style={{fontSize: 32, marginBottom: 20}}>
          {formatTime(runningTime)}
        </Text>
      )}

      {/* {receivedDataRef.current.length !== 0 && (
          <LineChart
            width={WIDTH}
            height={500}
            withInnerLines={false}
            data={{
              labels: receivedDataRef.current.map((_, index) => `${index + 1}`), // Dynamic labels per second
              datasets: [
                {
                  data: receivedDataRef.current,
                  color: () => 'blue',
                  strokeWidth: 2,
                },
              ],
            }}
            chartConfig={{
              backgroundColor: '#e26a00',
              backgroundGradientFrom: '#fb8c00',
              backgroundGradientTo: '#ffa726',
              decimalPlaces: 1,
              color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '6',
                strokeWidth: '2',
                stroke: '#ffa726',
              },

              // Format y-axis labels to show temperature in °C
              formatYLabel: value => `${value}°C`,
            }}
            bezier
            yAxisLabel=""
            yAxisSuffix="°C"
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
          />
        )} */}
      {isLoadingCollectData ? (
        <View>
          <Text>{`Sedang mengambil data ${percentage}`}</Text>
        </View>
      ) : tempSpectrumeData.length === 3 ? (
        // <LineChart
        //   width={WIDTH}
        //   height={500}
        //   withHorizontalLabels={false}
        //   withInnerLines={false}
        //   data={{
        //     labels: tempSpectrumeData.map((_, i) => `${i + 1}`), // Dynamic labels per second
        //     datasets: tempSpectrumeData.map((data, index) => ({
        //       data,
        //       color: () => ['blue', 'green', 'red'][index], // Color per line
        //       strokeWidth: 2,
        //     })),
        //   }}
        //   chartConfig={{
        //     backgroundColor: '#e26a00',
        //     backgroundGradientFrom: '#fb8c00',
        //     backgroundGradientTo: '#ffa726',
        //     decimalPlaces: 1,
        //     color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
        //     labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
        //     style: {
        //       borderRadius: 16,
        //     },
        //     propsForDots: {
        //       r: '6',
        //       strokeWidth: '2',
        //       stroke: '#ffa726',
        //     },

        //     // Format y-axis labels to show temperature in °C
        //     formatYLabel: value => `${value}°C`,
        //   }}
        //   bezier
        //   yAxisLabel=""
        //   yAxisSuffix="°C"
        //   style={{
        //     marginVertical: 8,
        //     borderRadius: 16,
        //   }}
        // />

        <View>
          {spectrumeData.map((data, index) => (
            <View>
              <FullscreenEChartsChart
                key={index}
                lines={[data]}
                lineColors={['blue']}
                showThresholds={true}
                minThreshold={30}
                maxThreshold={70}
                height={200}
                label={getLabelIndex(index)}
              />
            </View>
          ))}
        </View>
      ) : (
        <View />
      )}

      <View style={styles.buttonContainer}>
        <Button
          title="Scan Devices"
          onPress={onScanDevices}
          disabled={!isDisableStopBtn || connectedDevice !== null}
        />

        {!isDisableStopBtn && (
          <View style={{flexDirection: 'row', marginTop: 10}}>
            <View style={{width: '100%'}}>
              <Button
                disabled={runningTime < MAX_TIME}
                title={isPaused ? 'Resume' : 'Pause'}
                onPress={isPaused ? resumeCollectData : pauseCollectTempData}
                color={isPaused ? 'green' : 'red'}
              />
            </View>
            {/* <View style={{width: '48%'}}>
              <Button
                title="Pause"
                onPress={pauseCollectTempData}
                color={'red'}
              />
            </View> */}
          </View>
        )}

        <View style={{height: 10}} />

        {/* {!!connectedDevice && ( */}
        <>
          <Button
            title="Collect Vibration Data"
            onPress={collectVibrationData}
            disabled={!isDisableStopBtn}
            color={'blue'}
          />
          <View style={styles.containerBtnStopCollecting}>
            <Button
              title="Stop Collect Data"
              onPress={stopCollectTmpData}
              // disabled={
              //   isDisableStopBtn || isPaused || tempSpectrumeData.length < 3
              // }
              color={'red'}
            />
          </View>
        </>
        {/* )} */}
      </View>
    </ScrollView>
  );
};

export default HomeScreen;
