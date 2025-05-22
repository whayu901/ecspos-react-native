/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-bitwise */
import {useCallback, useEffect, useRef, useState} from 'react';
import {
  Alert,
  BackHandler,
  PermissionsAndroid,
  ToastAndroid,
} from 'react-native';
import {
  BleError,
  BleManager,
  Characteristic,
  Device,
} from 'react-native-ble-plx';
import DeviceInfo from 'react-native-device-info';
import {PERMISSIONS} from 'react-native-permissions';
import {Buffer} from 'buffer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useFocusEffect, useIsFocused} from '@react-navigation/native';

type PermissionCallback = (result: boolean) => void;

const bleManager = new BleManager();

const SERVICE_ID = 'b7ef1193-dc2e-4362-93d3-df429eb3ad10';
const CMD_CHARAC_ID = '00ce7a72-ec08-473d-943e-81ec27fdc600';
const DATA_CHARAC_ID = '00ce7a72-ec08-473d-943e-81ec27fdc5f2';
const MAX_TIME = 1 * 60 * 1000; // 3 minutes in milliseconds

interface BluetoothLowEnergyApi {
  requestPermissions(callback: PermissionCallback): Promise<void>;
  scanForDevices(): void;
  allDevices: Device[];
  isScanningDevice: boolean;
  connectToDevice: (deviceId: Device) => Promise<void>;
  connectedDevice: Device | null;
  monitoredData: number;
  setMonitoredData: (value: number) => void;
}

export default function useBle() {
  const [allDevices, setAllDevices] = useState<Device[]>([]);
  const [isScanningDevice, setIsScanningDevice] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [monitoredData, setMonitoredData] = useState(0);
  const [writeCharacteristic, setWriteCharacteristic] = useState<any>(null);
  const [readCharacteristic, setReadCharacteristic] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isDisableStopBtn, setIsDisableStopBtn] = useState(true);
  const [receivedData, setReceivedData] = useState<number[]>([]);
  const [isBack, setIsBack] = useState(false);
  const [collectValue, setCollectValue] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const [idDevice, setIdDevice] = useState<any>('');
  const [waveDataT, setWaveDataT] = useState<any>({});
  const [resciveData, setResciveData] = useState<any>([]);
  const [percentage, setPercentage] = useState(0);

  const statu = [0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80];

  const [runningTime, setRunningTime] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const intervalRef = useRef<any>(null);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        stopTimer();
        return false;
      },
    );

    return () => {
      stopTimer();
      backHandler.remove();
    };
  }, []);

  const isFocused = useIsFocused();
  const reconnectToSavedDevice = async () => {
    try {
      // Retrieve the saved device ID from AsyncStorage
      const savedDeviceId = await AsyncStorage.getItem(
        'my-connected-device-id',
      );

      setIdDevice(savedDeviceId);

      console.log({savedDeviceId});

      if (savedDeviceId) {
        // Use the saved device ID to reconnect
        const deviceConnection = await bleManager.connectToDevice(
          savedDeviceId,
        );

        setIsSubscribed(false);
        if (deviceConnection) {
          // Successfully connected, now discover services and characteristics

          setConnectedDevice(deviceConnection); // Store the connection state

          // Discover all services and characteristics
          await deviceConnection.discoverAllServicesAndCharacteristics();

          const characteristics =
            await deviceConnection.characteristicsForService(SERVICE_ID);

          characteristics.forEach((characteristicitem: any) => {
            if (characteristicitem.uuid === CMD_CHARAC_ID) {
              setWriteCharacteristic(characteristicitem);
            }
            if (characteristicitem.uuid === DATA_CHARAC_ID) {
              setReadCharacteristic(characteristicitem);
            }
          });

          // Stop scanning if connected
          bleManager.stopDeviceScan();

          // Request MTU for device
          await bleManager.requestMTUForDevice(savedDeviceId, 512);

          startStreamingData(deviceConnection);
        }
      }
    } catch (error) {
      console.error('Error retrieving saved device:', error);
    }
  };

  // useEffect(() => {
  //   scanForDevices();

  //   return () => {
  //     disconnectDevice(connectedDevice?.id);
  //     // stopCollectTmpData();
  //   };
  // }, [connectedDevice?.id]);

  const stopCOllectDataAndDisconnected = useCallback(async () => {
    if (idDevice) {
      // await collectData(4, 0, 0, 1000);

      disconnectDevice(idDevice);
      console.log('my connected Device', idDevice);
    }
  }, [idDevice]);

  useFocusEffect(
    useCallback(() => {
      if (connectedDevice == null) {
        scanForDevices();
      }

      return () => {
        stopCOllectDataAndDisconnected();
      };
    }, [idDevice]),
  );

  const requestPermissions = async (callback: PermissionCallback) => {
    const apiLevel = await DeviceInfo.getApiLevel();

    if (apiLevel < 31) {
      const grantedStatus = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'Bluetooth Low Energy Needs Location Permission',
          buttonNegative: 'Cancel',
          buttonPositive: 'Ok',
          buttonNeutral: 'Maybe Later',
        },
      );
      callback(grantedStatus === PermissionsAndroid.RESULTS.GRANTED);
    } else {
      const result = await PermissionsAndroid.requestMultiple([
        PERMISSIONS.ANDROID.BLUETOOTH_SCAN,
        PERMISSIONS.ANDROID.BLUETOOTH_CONNECT,
        PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
      ]);

      const isAllPermissionsGranted =
        result['android.permission.BLUETOOTH_SCAN'] ===
          PermissionsAndroid.RESULTS.GRANTED &&
        result['android.permission.BLUETOOTH_CONNECT'] ===
          PermissionsAndroid.RESULTS.GRANTED &&
        result['android.permission.ACCESS_FINE_LOCATION'] ===
          PermissionsAndroid.RESULTS.GRANTED;

      callback(isAllPermissionsGranted);
    }
  };

  const isDuplicateDevice = (devices: Device[], nextDevice: Device) =>
    devices.findIndex(device => device?.id === nextDevice?.id) > -1;

  const scanForDevices = () => {
    bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        setIsScanningDevice(false);
        Alert.alert('Error Scanning Devices', String(error?.message));
      }
      if (
        device &&
        (device?.name?.includes('DT_ZB') || device?.name?.includes('DT_'))
      ) {
        reconnectToSavedDevice();

        setAllDevices(prevState => {
          if (!isDuplicateDevice(prevState, device)) {
            return [...prevState, device];
          }
          return prevState;
        });
        setIsScanningDevice(false);
        bleManager.stopDeviceScan();
      }
    });
  };

  const connectToDevice = async (device: Device) => {
    try {
      if (!device?.id) {
        throw new Error('Device ID is missing');
      }

      // Check if connectToDevice is available
      if (typeof bleManager.connectToDevice !== 'function') {
        throw new Error('bleManager.connectToDevice is not a function');
      }

      const deviceConnection = await bleManager.connectToDevice(device?.id);

      await AsyncStorage.setItem('my-connected-device-id', String(device?.id)); // Save device info

      setConnectedDevice(deviceConnection);
      await deviceConnection.discoverAllServicesAndCharacteristics();

      const characteristic = await deviceConnection.characteristicsForService(
        SERVICE_ID,
      );
      characteristic.forEach((characteristicitem: any) => {
        if (characteristicitem.uuid === CMD_CHARAC_ID) {
          setWriteCharacteristic(characteristicitem);
        }
        if (characteristicitem.uuid === DATA_CHARAC_ID) {
          setReadCharacteristic(characteristicitem);
        }
      });
      bleManager.stopDeviceScan();

      await bleManager.requestMTUForDevice(device?.id, 512); // Set MTU

      startStreamingData(device);
    } catch (error) {
      console.error('Error connecting to device:', error);
      Alert.alert('Error Connecting Device', JSON.stringify(error));
    }
  };

  const disconnectDevice = async (deviceId: any) => {
    try {
      const connectedDevices = await bleManager.connectedDevices([SERVICE_ID]);

      console.log(JSON.stringify(connectedDevices));

      const device = connectedDevices.find((dev: any) => dev.id === deviceId);

      if (device) {
        setConnectedDevice(null);
        setIsSubscribed(false);

        await bleManager.cancelDeviceConnection(deviceId);
        // await AsyncStorage.removeItem('my-connected-device-id');

        console.log('Device disconnected successfully');
      } else {
        console.log('Device is not connected');
      }
    } catch (error) {
      console.error('Error disconnecting device:', error);
    }
  };

  const onDetectData = (
    error: BleError | null,
    characteristic: Characteristic | any,
  ) => {
    if (error) {
      ToastAndroid.show(
        'Connection with device is Disconnected',
        ToastAndroid.SHORT,
      );
      return;
    } else if (!characteristic) {
      ToastAndroid.show('No Characteristic Found', ToastAndroid.SHORT);
      return;
    }

    setMonitoredData((prevState: number) => prevState + 1);

    const vibrationData = Buffer.from(characteristic.value, 'base64');

    handleData(vibrationData);
  };

  const startStreamingData = async (device: Device) => {
    if (device && !isSubscribed) {
      setIsSubscribed(true);

      if (device?.monitorCharacteristicForService) {
        device.monitorCharacteristicForService(
          SERVICE_ID,
          DATA_CHARAC_ID,
          onDetectData,
        );
      } else {
        console.error('monitorCharacteristicForService is not available');
      }
    } else {
      ToastAndroid.show('No Device Connected', ToastAndroid.SHORT);
    }
  };

  const intToBytes = (value: number) => {
    return [
      value & 0xff,
      (value >> 8) & 0xff,
      (value >> 16) & 0xff,
      (value >> 24) & 0xff,
    ];
  };

  // / Helper function to convert a byte array to an integer
  function bytesToInt(bytes: any) {
    return bytes[0] | (bytes[1] << 8) | (bytes[2] << 16) | (bytes[3] << 24);
  }

  // Helper function to convert a byte array to a float
  function bytesToFloat(bytes: any) {
    // console.log(bytes)
    const intValue = bytesToInt(bytes);

    const buffer = Buffer.alloc(4);
    buffer.writeInt32LE(intValue, 0);
    return buffer.readFloatLE(0);
  }

  const sendData = (cmd: number, data: number[]): Promise<void> => {
    return new Promise(async (resolve, reject) => {
      if (!writeCharacteristic) {
        reject(new Error('No write characteristic available.'));
        return;
      }
      console.log('Begin writing data');

      const nowSendData = [0xaa, cmd, data.length + 4, ...data];
      let cs = 0;

      nowSendData.forEach(p => {
        cs = (cs + p) % 256;
      });

      cs = 256 - cs;

      const finalData = [...nowSendData, cs];
      // console.log('finalData: ', JSON.stringify(finalData));
      const buffer = Buffer.from(finalData).toString('base64');
      // console.log('buffer: ', buffer);

      writeCharacteristic
        ?.writeWithResponse(buffer)
        .then(() => {
          console.log('Finished writing data');
          resolve();
        })
        .catch((err: any) =>
          reject(new Error('Error writing data to characteristic: ' + err)),
        );
    });

    // const mtuSize = 20; // Adjust based on your device's MTU
    // const chunkedData = [];
    // for (let i = 0; i < finalData.length; i += mtuSize) {
    //   chunkedData.push(finalData.slice(i, i + mtuSize));
    // }

    // for (const chunk of chunkedData) {
    //   const buffer = Buffer.from(chunk);
    //   try {
    //     await writeCharacteristic.writeWithResponse(
    //       buffer.toString('base64'),
    //     );
    //     console.log('Chunk written successfully:', chunk);
    //   } catch (err) {
    //     console.error('Error writing chunk:', chunk, err);
    //     break;
    //   }
    // }
    // });
  };

  const collectData = (
    val: number,
    samp: number,
    nowLength: number,
    nowFreq: number,
  ) => {
    console.log('Begin collecting data');
    const data: number[] = [];
    const now = new Date();
    const formatted = now.toISOString().slice(0, 19).replace(/[-T:]/g, ''); // YYYYMMDDHHMMSS
    // const formatted = '20250124090206';

    // console.log(now);

    const startCollect = {
      systemTime: {
        Y: formatted.substring(0, 2),
        y: formatted.substring(2, 4),
        M: formatted.substring(4, 6),
        d: formatted.substring(6, 8),
        H: formatted.substring(8, 10),
        m: formatted.substring(10, 12),
        s: formatted.substring(12),
      },
      isIntvSample: 0,
      mdefLen: {
        x: nowLength,
        z: nowLength,
        y: nowLength,
      },
      mdefFreq: {
        x: nowFreq,
        z: nowFreq,
        y: nowFreq,
      },
      meaIntv: 1,
      lwLength: 128,
      lwFreq: 1000,
      lwIntv: 1,
      isSampleInd: val,
      indLength: 1,
      indFreq: 500,
      indIntv: 1,
      sampleDir: samp,
    };

    data.push(parseInt(startCollect.systemTime.Y, 10));
    data.push(parseInt(startCollect.systemTime.y, 10));
    data.push(parseInt(startCollect.systemTime.M, 10));
    data.push(parseInt(startCollect.systemTime.d, 10));
    data.push(parseInt(startCollect.systemTime.H, 10));
    data.push(parseInt(startCollect.systemTime.m, 10));
    data.push(parseInt(startCollect.systemTime.s, 10));
    data.push(startCollect.isIntvSample);
    // console.log('1: ', JSON.stringify(data));

    // Append length data for each axis
    data.push(...intToBytes(startCollect.mdefLen.x));
    data.push(...intToBytes(startCollect.mdefLen.z));
    data.push(...intToBytes(startCollect.mdefLen.y));
    // console.log('2: ', JSON.stringify(data));

    // Append frequency data for each axis
    data.push(...intToBytes(startCollect.mdefFreq.x));
    data.push(...intToBytes(startCollect.mdefFreq.z));
    data.push(...intToBytes(startCollect.mdefFreq.y));
    // console.log('3: ', JSON.stringify(data));

    // Append measurement interval, long waveform length and frequency
    data.push(...intToBytes(startCollect.meaIntv));
    data.push(...intToBytes(startCollect.lwLength));
    data.push(...intToBytes(startCollect.lwFreq));
    data.push(...intToBytes(startCollect.lwIntv));
    // console.log('4: ', JSON.stringify(data));

    // Append sample indication, sample length and frequency
    data.push(startCollect.isSampleInd);
    data.push(...intToBytes(startCollect.indLength));
    data.push(...intToBytes(startCollect.indFreq));
    data.push(...intToBytes(startCollect.indIntv));
    data.push(startCollect.sampleDir);
    // console.log('5: ', JSON.stringify(data));

    // console.log(val, ' ', JSON.stringify(data));

    return sendData(0x01, data);
  };

  const handleData = (data: any) => {
    console.log('Data received:', data[1]);
    // Add handling logic here as per your application needs

    let allVal = 0;
    data.forEach((item: any) => {
      allVal += item % 256;
    });
    if (allVal % 256 !== 0) {
      console.log('======Bluetooth data error, trying again:', allVal);
      return;
    }

    console.log('my data', data[1]);

    console.log('my entire data:', data);

    switch (data[1]) {
      case 0x04: {
        const dp = data.slice(3);
        // Process received data
        const wave = _transWaveData(dp);
        console.log('0x04', JSON.stringify(dp));

        if (wave) {
          waveDataT[wave.index] = wave;
          const percentages =
            (Object.keys(waveDataT).length * 100) / wave.count;
          setPercentage(percentages);
          console.log(percentages);
        }
        break;
      }
      case 0x06: {
        const dp = data.slice(3, data[2]);
        // Process received data
        _transIndexData(dp);
        // console.log('0x06', JSON.stringify(dp));
        break;
      }
      case 0x05: {
        if (!waveDataT) {
          return;
        }

        Object.keys(waveDataT).forEach(key => {
          const p = waveDataT[key];
          resciveData[Math.floor(p.index / 8)] =
            resciveData[Math.floor(p.index / 8)] | statu[p.index % 8];
        });

        sendData(0x05, resciveData);
        if (percentage < 100) {
          return;
        }
        _processWaveData();
        break;
      }
      default:
        // Handle unknown command
        console.warn(`Unknown command received: ${data[1]}`);
    }
  };

  const _processWaveData = () => {
    const waveData: any = {};
    let TempDataT: any = [];
    const keys = Object.keys(waveDataT).sort((a: any, b: any) => a - b);
    // for (let i = 0; i < keys.length; i++) {
    //     const key = keys[i];
    //     const wave = this.waveDataT[key];
    //     DataT = DataT.concat(wave.data.slice(0, 224));
    // }

    console.log({waveDataT});

    for (let key in waveDataT) {
      if (waveDataT.hasOwnProperty(key)) {
        const wave = waveDataT[key];
        TempDataT = TempDataT.concat(wave.data.slice(0, 224));
      }
    }
    const DataT = TempDataT.splice(
      0,
      Math.round(TempDataT.length / (1024 * 2)) * 1024 * 2,
    ); //round it to near number and mutiply with 1024x2

    let sampLen = 0;
    let rate = 0;
    const firstWave = waveDataT[keys[0]];
    let dir = null;
    if (firstWave && firstWave.dir !== undefined) {
      dir = firstWave.dir;
    }

    switch (dir) {
      case 0:
        sampLen = 8 * 1024;
        rate = 3125 * 2.56;
        break;
      case 2:
        sampLen = 8 * 1024;
        rate = 3125 * 2.56;
        break;
      case 1:
        sampLen = 8 * 1024;
        rate = 3125 * 2.56;
        break;
    }

    // DataT = DataT.slice(0, sampLen * 2);
    const len = DataT.length / 2;
    const YDataT = [];
    const crof = firstWave.crof;

    let sum = 0;
    for (let i = 0; i < len; i++) {
      const dataTemp = [DataT[i * 2 + 1], DataT[i * 2]];
      let int16Data = new Int16Array(new Uint8Array(dataTemp).buffer)[0];
      const dt = int16Data * crof;
      sum += dt;
      YDataT.push(dt);
    }

    const ave = sum / (len - 1);
    const YData = YDataT.map(p => p - ave);
    let targetDir = 0;
    if (firstWave && firstWave.dir !== undefined) {
      targetDir = firstWave.dir;
    }

    waveData[targetDir] = YData;

    console.log('++++++waveData:' + Object.keys(waveData).length);
    // this.waveDataT = {};
    // this.resciveData = [];

    setWaveDataT([]);
    setResciveData([]);
    for (let i = 0; i < 242; i++) {
      setResciveData((prevState: any) => [...prevState, 0]);
    }
    console.log(Object.keys(waveData));

    return waveData;
  };

  const _transWaveData = (dp: any) => {
    if (dp.length < 18) {
      console.log('Data received is too short to process.');
      return null;
    }

    try {
      const crc = bytesToInt(dp.slice(0, 4));
      const crof = bytesToFloat(dp.slice(4, 8));
      const count = bytesToInt(dp.slice(8, 12));
      const index = bytesToInt(dp.slice(12, 16));
      const dir = dp[16];
      const rep = dp[17];
      const data = dp.slice(18);

      return {crc, crof, count, index, dir, rep, data};
    } catch (error) {
      console.log('There was an error when trying to parse wave data', error);
      return null;
    }
  };

  const _transIndexData = (dp: any) => {
    if (dp.length < 35) {
      console.log('The index data received is too short to process.');
      return null;
    }
    try {
      const Y = dp[0];
      const y = dp[1];
      const M = dp[2];
      const d = dp[3];
      const H = dp[4];
      const m = dp[5];
      const s = dp[6];

      // console.log(JSON.stringify(dp.slice(7, 11)))
      const highAccRms = bytesToFloat(dp.slice(7, 11));
      const lowAccRms = bytesToFloat(dp.slice(11, 15));
      const velRms = bytesToFloat(dp.slice(15, 19));
      // console.log(dp.slice(19, 23))
      const tem = bytesToFloat(dp.slice(19, 23));
      const U = bytesToFloat(dp.slice(23, 27));
      const I = bytesToFloat(dp.slice(27, 31));
      const R = bytesToFloat(dp.slice(31, 35));

      // setReceivedData(prevReceivedData => [...prevReceivedData, tem]);

      const data = Math.round(((tem === 0 ? velRms : tem) * 100) / 100);

      setReceivedData(prevReceivedData => [...prevReceivedData, data]);

      setCollectValue(String(data));

      console.log('======highAccRms', highAccRms);
      console.log('======lowAccRms', lowAccRms);
      console.log('======velRms', velRms);
      console.log('======tem', tem);

      return {
        Y,
        y,
        M,
        d,
        H,
        m,
        s,
        highAccRms,
        lowAccRms,
        velRms,
        tem,
        U,
        I,
        R,
      };
    } catch (error) {
      console.log('There was an error when trying to parse index data', error);
      return null;
    }
  };

  const stopCollectTmpData = async () => {
    setIsDisableStopBtn(true);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    await collectData(4, 0, 0, 1000);
  };

  const pauseCollectTempData = async () => {
    setIsPaused(true);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
    await collectData(4, 0, 0, 1000);
  };

  const resumeCollectData = async () => {
    setIsPaused(false);
    setIsRunning(true);

    intervalRef.current = setInterval(() => {
      setRunningTime(prev => prev + 1000);
    }, 1000);
  };

  const collectVibrationData = async () => {
    console.log('hello world');
    setIsDisableStopBtn(false);
    // await collectData(0, 3, 8, 12500);
    await collectData(2, 0, 0, 3125);
    setMonitoredData(0);
    setReceivedData([]);
    // setHasStarted(true);

    setRunningTime(0);

    intervalRef.current = setInterval(() => {
      setRunningTime(prev => prev + 1000);
    }, 1000);
  };

  const startTimer = async () => {
    await collectVibrationData();
  };

  const resumeTimer = () => {
    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      setRunningTime(prev => prev + 1000);
    }, 1000);

    resumeCollectData();
  };

  const pauseTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
    pauseCollectTempData();
  };

  const stopTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
    setHasStarted(false);
    setRunningTime(0);
    stopCollectTmpData();
  };

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  return {
    requestPermissions,
    scanForDevices,

    allDevices,
    isScanningDevice,
    connectToDevice,
    connectedDevice,
    monitoredData,
    setMonitoredData,
    collectVibrationData,
    stopCollectTmpData,
    isDisableStopBtn,
    receivedData,
    disconnectDevice,
    isBack,
    setIsBack,
    collectValue,
    resumeCollectData,
    pauseCollectTempData,
    isPaused,
    startTimer,
    resumeTimer,
    stopTimer,
    formatTime,
    runningTime,
    pauseTimer,
    MAX_TIME,
  };
}
