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
import EventEmitter from 'react-native/Libraries/vendor/emitter/EventEmitter';
import {
  BleError,
  BleManager,
  Characteristic,
  Device,
} from 'react-native-ble-plx';
import BackgroundService from 'react-native-background-actions';
import DeviceInfo from 'react-native-device-info';
import {PERMISSIONS} from 'react-native-permissions';
import {Buffer} from 'buffer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee from '@notifee/react-native';

import {storage} from '../../utils/storage';
import {computeAmplitudeSpectrum} from '../../utils/SignalHelper';
import {acquireWakeLock, releaseWakeLock} from '../../module';
import useNotification from '../notification/hooks/useNotification';

type PermissionCallback = (result: boolean) => void;

const bleManager = new BleManager();

const SERVICE_ID = 'b7ef1193-dc2e-4362-93d3-df429eb3ad10';
const CMD_CHARAC_ID = '00ce7a72-ec08-473d-943e-81ec27fdc600';
const DATA_CHARAC_ID = '00ce7a72-ec08-473d-943e-81ec27fdc5f2';
const MAX_TIME = 30 * 1000; // 3 minutes in milliseconds

const RECEIVED_DATA_KEY = 'ble_received_data';

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
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [spectrumeData, setSpectrumeData] = useState([]);
  const [tempSpectrumeData, setTempSpectrumeData] = useState([]);
  const [isLoadingCollectData, setIsLoadingCollectData] = useState(false);

  const totalCountRef = useRef<number | null>(null);
  const writeCharRef = useRef<any | null>(null);
  const notifyCharRef = useRef<Characteristic | null>(null);
  const backgroundStartTimeRef = useRef<number | null>(null);
  const isManualDisconnectRef = useRef(false);

  const statu = [0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80];

  const [runningTime, setRunningTime] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [widgetFrom, setWidgetFrom] = useState<string>('home');

  const intervalRef = useRef<any>(null);
  const receivedDataRef = useRef<number[]>([]);

  const {startForegroundService} = useNotification();
  const eventEmitter: any = new EventEmitter();

  // useEffect(() => {
  //   const backHandler = BackHandler.addEventListener(
  //     'hardwareBackPress',
  //     () => {
  //       // stopTimer();
  //       return false;
  //     },
  //   );

  //   return () => {
  //     // stopTimer();
  //     backHandler.remove();
  //   };
  // }, []);

  useEffect(() => {
    if (widgetFrom !== 'bluetooth') return;

    const saved = storage.getString(RECEIVED_DATA_KEY);
    if (saved) {
      try {
        setReceivedData(JSON.parse(saved));
      } catch (e) {
        console.warn('Failed to parse stored receivedData:', e);
      }
    }
  }, []);

  useEffect(() => {
    const saved = storage.getBoolean('disableStop');
    if (saved !== undefined) {
      setIsDisableStopBtn(saved);
    }
  }, []);

  useEffect(() => {
    storage.set('disableStop', isDisableStopBtn);
  }, [isDisableStopBtn]);

  const reconnectToSavedDevice = async (device: Device) => {
    try {
      // Retrieve the saved device ID from AsyncStorage
      const savedDeviceRaw: any = await AsyncStorage.getItem(
        'my-connected-device-id',
      );

      const savedDeviceId = JSON.parse(savedDeviceRaw);

      if (device.id === savedDeviceId.id) {
        setIdDevice(device.id);

        if (savedDeviceId) {
          // Use the saved device ID to reconnect
          const deviceConnection = await bleManager.connectToDevice(device.id);

          setIsSubscribed(false);

          // Successfully connected, now discover services and characteristics

          setConnectedDevice(deviceConnection); // Store the connection state

          // Discover all services and characteristics
          await deviceConnection.discoverAllServicesAndCharacteristics();

          const characteristics =
            await deviceConnection.characteristicsForService(SERVICE_ID);

          characteristics.forEach((characteristicitem: any) => {
            if (characteristicitem.uuid === CMD_CHARAC_ID) {
              console.log('anjir lah', characteristicitem);
              setWriteCharacteristic(characteristicitem);
              writeCharRef.current = characteristicitem;
            }
            if (characteristicitem.uuid === DATA_CHARAC_ID) {
              setReadCharacteristic(characteristicitem);
            }
          });

          console.log('deviceConnection1', device);
          // Stop scanning if connected
          bleManager.stopDeviceScan();

          // Request MTU for device
          await bleManager.requestMTUForDevice(device?.id, 512);

          startStreamingData(device);
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

  // useFocusEffect(
  //   useCallback(() => {
  //     const checkConnection = async () => {
  //       if (!connectedDevice) {
  //         const savedRaw = await AsyncStorage.getItem('my-connected-device-id');
  //         const saved = JSON.parse(savedRaw || '{}');

  //         const isConnected = await bleManager.isDeviceConnected(saved?.id);
  //         if (!isConnected) {
  //           console.log('🔌 Not connected, scanning...');
  //           scanForDevices();
  //         } else {
  //           console.log('✅ Already connected, no rescan needed.');
  //         }
  //       }
  //     };

  //     checkConnection();
  //   }, [connectedDevice]),
  // );

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
        (device?.name?.includes('DT_ZB') ||
          device?.name?.includes('DT_') ||
          device?.name?.includes('SBI310_'))
      ) {
        reconnectToSavedDevice(device);

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

  useEffect(() => {
    if (widgetFrom !== 'bluetooth') {
      console.log('⏭️ Skipping restoreWriteChar, widgetFrom:', widgetFrom);
      return;
    }

    const restoreWriteChar = async () => {
      const saved = storage.getString('ble_write_char');
      if (!saved) return;

      try {
        const {deviceId, serviceUUID, uuid} = JSON.parse(saved);
        console.log({deviceId});

        const stillConnected = await bleManager.isDeviceConnected(deviceId);

        let device;

        if (stillConnected) {
          console.log('✅ Device already connected, skipping connectToDevice.');
          device = await bleManager.devices([deviceId]).then(devs => devs[0]);
        } else {
          console.log('🔌 Device not connected, reconnecting...');
          device = await bleManager.connectToDevice(deviceId, {
            autoConnect: true,
          });
          setConnectedDevice(device);
        }

        await device?.discoverAllServicesAndCharacteristics();
        const characteristics = await device?.characteristicsForService(
          serviceUUID,
        );
        const target = characteristics?.find(c => c.uuid === uuid);

        if (target) {
          writeCharRef.current = target;
          setWriteCharacteristic(target);

          // Safe monitor with isSubscribedRef if needed
          device.monitorCharacteristicForService(
            serviceUUID,
            uuid,
            onDetectData,
          );

          console.log('✅ Restored writeCharRef & monitor attached');
        }
      } catch (e) {
        console.warn('⚠️ Failed to restore writeCharRef', e);
      }
    };

    restoreWriteChar();
  }, []);

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

      await AsyncStorage.setItem(
        'my-connected-device-id',
        JSON.stringify(device),
      ); // Save device info

      setConnectedDevice(deviceConnection);
      await deviceConnection.discoverAllServicesAndCharacteristics();

      const characteristic = await deviceConnection.characteristicsForService(
        SERVICE_ID,
      );
      characteristic.forEach((characteristicitem: any) => {
        if (characteristicitem.uuid === CMD_CHARAC_ID) {
          setWriteCharacteristic(characteristicitem);
          writeCharRef.current = characteristicitem;

          storage.set(
            'ble_write_char',
            JSON.stringify({
              deviceId: characteristicitem.deviceID,
              serviceUUID: characteristicitem.serviceUUID,
              uuid: characteristicitem.uuid,
            }),
          );
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

      const device = connectedDevices.find((dev: any) => dev.id === deviceId);

      if (device) {
        setConnectedDevice(null);
        setIsSubscribed(false);

        isManualDisconnectRef.current = true;

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
      if (isManualDisconnectRef.current) {
        // This was a normal user disconnect
        ToastAndroid.show('Device disconnected by user', ToastAndroid.SHORT);
        isManualDisconnectRef.current = false; // reset it
      } else {
        // Treat as out-of-range disconnect
        Alert.alert(
          'Connection Lost',
          'Device is out of range! Stopping data collection.',
          [
            {
              text: 'OK',
              onPress: async () => {
                await stopCollectTmpData();
                if (connectedDevice) {
                  await disconnectDevice(connectedDevice.id);
                }
              },
            },
          ],
          {cancelable: false},
        );
      }
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

      console.log('my monito character', device);

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
    setIsLoadingCollectData(true);

    console.log('my ref:', writeCharRef.current);

    return new Promise(async (resolve, reject) => {
      if (!writeCharRef.current) {
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
      const buffer = Buffer.from(finalData).toString('base64');

      try {
        await writeCharRef?.current?.writeWithResponse(buffer);
        console.log('Finished writing data');
        setIsLoadingCollectData(false);
        resolve();
      } catch (error) {
        reject(new Error('Error writing data to characteristic: ' + error));
      }
    });
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

    console.log(val, ' ', JSON.stringify(data));

    return sendData(0x01, data);
  };

  const handleData = (data: any) => {
    // Add handling logic here as per your application needs

    let allVal = 0;
    data.forEach((item: any) => {
      allVal += item % 256;
    });
    if (allVal % 256 !== 0) {
      console.log('======Bluetooth data error, trying again:', allVal);
      return;
    }

    // console.log('my entire data:', data);

    switch (data[1]) {
      case 0x04: {
        const dp = data.slice(3);
        // Process received data
        const wave = _transWaveData(dp);

        if (wave) {
          if (totalCountRef.current === null) {
            totalCountRef.current = wave.count;
          }
          setWaveDataT((prev: any) => ({
            ...prev,
            [wave.index]: wave,
          }));
          // console.log({waveDataT});
          // console.log('my wave', wave);
          const waveHelper = waveDataT;
          waveHelper[wave.index] = wave;
          // waveHelper[wave.index] = wave;
          // console.log('my helper', waveHelper);
          // setWaveDataT(waveHelper);

          const percentages: any =
            (Object.keys(waveHelper).length * 100) / wave.count;
          setPercentage(percentages.toFixed(0));

          console.log('percetanges', percentages);
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

        const updatedData = [...resciveData];

        Object.keys(waveDataT).forEach(key => {
          const p = waveDataT[key];
          const index = Math.floor(p.index / 8);
          const bit = statu[p.index % 8];

          updatedData[index] = (updatedData[index] || 0) | bit;
        });

        // Update state
        setResciveData(updatedData);

        // Use the updatedData immediately
        sendData(0x05, updatedData);
        if (!totalCountRef.current) {
          console.log('nothing counting');
          return;
        }

        const total = Object.keys(waveDataT).length;
        const currentPercentage = (total * 100) / totalCountRef.current;

        if (currentPercentage < 100) {
          console.log("still haven't 100%");
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

    for (let key in waveDataT) {
      if (waveDataT.hasOwnProperty(key)) {
        const wave = waveDataT[key];
        TempDataT = TempDataT.concat(wave.data.slice(0, 224));
      }
    }

    // const targetLength = Math.floor(TempDataT.length / (1024 * 2)) * 1024 * 2;
    // const DataBytes = TempDataT.slice(0, targetLength);

    // console.log('my temp t', TempDataT.splice(0));
    const DataT = TempDataT.splice(
      0,
      Math.round(TempDataT.length / (1024 * 2)) * 1024 * 2,
    ); //round it to near number and mutiply with 1024x2

    // const DataT: number[] = [];
    // for (let i = 0; i < DataBytes.length; i += 2) {
    //   const low = DataBytes[i];
    //   const high = DataBytes[i + 1];
    //   if (low === undefined || high === undefined) {
    //     break;
    //   }

    //   const combined = (high << 8) | low;
    //   const signed = combined > 0x7fff ? combined - 0x10000 : combined;

    //   // Output in [high_byte, low_byte] format, like your example
    //   const byte1 = (signed >> 8) & 0xff;
    //   const byte2 = signed & 0xff;
    //   DataT.push(byte1, byte2);
    // }

    // console.log('myDataT', DataT);

    let sampLen = 0;
    let rate = 0;
    const firstWave = waveDataT[keys[0]];
    // console.log({firstWave});
    let dir = null;
    if (firstWave && firstWave.dir !== undefined) {
      dir = firstWave.dir;
    }

    // console.log({dir});

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

    // console.log({YData});

    waveData[targetDir] = YData;

    // console.log('++++++waveData:', waveData);
    // const newfftData = computeAmplitudeSpectrum(waveData);

    // console.log({newfftData});
    // this.waveDataT = {};
    // this.resciveData = [];

    setWaveDataT([]);
    setResciveData([]);
    for (let i = 0; i < 242; i++) {
      setResciveData((prevState: any) => [...prevState, 0]);
    }

    const waveDataFormatted = waveData[dir.toString()];
    const newfftData = computeAmplitudeSpectrum(waveDataFormatted);

    console.log(`my data fft ${dir}:`, newfftData);

    setSpectrumeData(prevState => {
      const newState: any = [...prevState];
      newState[dir] = newfftData; // Replace or insert at the correct index
      return newState;
    });

    setTempSpectrumeData(prev => {
      const slicedData = newfftData.slice(0, 10); // take only the first 100
      const newState: any = [...prev];
      newState[dir] = slicedData; // replace or insert at dir index
      return newState;
    });

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
      const rawData = dp.slice(18);

      // Convert every 2 bytes to unsigned 16-bit int (big-endian)
      const waveData: number[] = [];
      for (let i = 0; i < rawData.length - 1; i += 2) {
        const high = rawData[i]; // first byte is high
        const low = rawData[i + 1]; // second byte is low
        const value = (high << 8) | low;
        waveData.push(value);
      }

      // console.log('Processed wave data:', waveData);

      return {
        crc,
        crof,
        count,
        index,
        dir,
        rep,
        data: waveData,
      };
    } catch (error) {
      console.log('There was an error when trying to parse wave data', error);
      return null;
    }
  };

  const backgroundTaskTransferIndex = async (dp: any) => {
    _transIndexData(dp);
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
      // ✅ Safe push to ref
      // if (!receivedDataRef.current) {
      //   console.log('hello world');
      //   receivedDataRef.current = [];
      // }

      console.log(receivedDataRef.current);

      console.log('🟢 Before push:', receivedDataRef.current.length);

      receivedDataRef.current.push(data);

      console.log('✅ After push:', receivedDataRef.current.length);

      // ✅ Force state update to trigger re-render
      setReceivedData([...receivedDataRef.current]);

      // ✅ Persist to MMKV or AsyncStorage
      storage.set(RECEIVED_DATA_KEY, JSON.stringify(receivedDataRef.current));

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

    await releaseWakeLock();
    await stopBackgroundTask();
    await notifee.stopForegroundService();
    await notifee.cancelAllNotifications();

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    await collectData(4, 0, 0, 1000);

    ToastAndroid.show('Data Has been Saved', ToastAndroid.SHORT);
  };

  const pauseCollectTempData = async () => {
    setIsPaused(true);
    // if (intervalRef.current) {
    //   clearInterval(intervalRef.current);
    //   intervalRef.current = null;
    // }
    setIsRunning(false);
    await collectData(4, 0, 0, 1000);
  };

  const resumeCollectData = async () => {
    setIsPaused(false);
    setIsRunning(true);

    // intervalRef.current = setInterval(() => {
    //   setRunningTime(prev => prev + 1000);
    // }, 1000);
  };

  const collectVibrationData = async () => {
    await startForegroundService();

    setIsDisableStopBtn(false);
    setIsLoadingCollectData(true);
    await collectData(0, 3, 8, 3125);
    // await collectData(2, 0, 0, 3125);
    setMonitoredData(0);
    setReceivedData([]);
    // setWaveDataT([]);
    // setHasStarted(true);

    setRunningTime(0);
    setTempSpectrumeData([]);
    setSpectrumeData([]);
    setPercentage(0);

    intervalRef.current = setInterval(() => {
      setRunningTime(prev => prev + 1000);
    }, 1000);
  };

  const backgroundTask = async () => {
    console.log('[Background] BLE monitor protection running...');

    while (BackgroundService.isRunning()) {
      const now = Date.now();

      if (
        backgroundStartTimeRef.current &&
        now - backgroundStartTimeRef.current >= MAX_TIME
      ) {
        console.log('[Background] Max time reached. Stopping collection.');

        await stopCollectTmpData(); // Safe: your cleanup method
        if (connectedDevice) {
          await disconnectDevice(connectedDevice.id);
        }

        await BackgroundService.stop();
        break; // Exit loop
      }

      console.log('[Background] Heartbeat...');
      await sleep(30000);
    }
  };

  const sleep = (time: number) =>
    new Promise(resolve => setTimeout(resolve, time));

  const startBackgroundTask = async () => {
    backgroundStartTimeRef.current = Date.now();

    await BackgroundService.start(backgroundTask, {
      taskName: 'BLE Streaming',
      taskTitle: 'Collecting Vibration Data',
      taskDesc: 'Streaming in background',
      taskIcon: {
        name: 'ic_launcher',
        type: 'mipmap',
      },
    });
  };

  const stopBackgroundTask = async () => {
    await BackgroundService.stop();
    console.log('🛑 Stopped BLE streaming background');
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
    spectrumeData,
    tempSpectrumeData,
    isLoadingCollectData,
    percentage,
    receivedDataRef,
    setWidgetFrom,
    widgetFrom,
    onData(callback: (data: number[]) => void) {
      const sub = (d: number[]) => callback(d);
      eventEmitter.addListener('onData', sub);
      return () => eventEmitter.removeListener('onData', sub);
    },
  };
}
