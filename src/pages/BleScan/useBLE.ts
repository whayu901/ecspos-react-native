/* eslint-disable no-bitwise */
import {useState} from 'react';
import {Alert, PermissionsAndroid, Platform} from 'react-native';
import {
  BleError,
  BleManager,
  Characteristic,
  Device,
} from 'react-native-ble-plx';

import base64 from 'react-native-base64';

// const HEART_RATE_UUID = '0000180d-0000-1000-8000-00805f9b34fb';
// const HEART_RATE_CHARACTERISTIC = '00002a37-0000-1000-8000-00805f9b34fb';

const serviceId = 'b7ef1193-dc2e-4362-93d3-df429eb3ad10'; //service uuid
const cmdCharacId = '00ce7a72-ec08-473d-943e-81ec27fdc600'; //write uuid
const dataCharacId = '00ce7a72-ec08-473d-943e-81ec27fdc5f2'; //notify uuid

interface BluetoothLowEnergyApi {
  requestPermissions(): Promise<boolean>;
  scanForPeripherals(): void;
  connectToDevice: (deviceId: Device) => Promise<void>;
  disconnectFromDevice: () => void;
  connectedDevice: Device | null;
  allDevices: Device[];
  heartRate: number;
}

function useBLE(): BluetoothLowEnergyApi {
  const bleManager = new BleManager();
  const [allDevices, setAllDevices] = useState<Device[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [heartRate, setHeartRate] = useState<number>(0);

  // const requestAndroid31Permissions = async () => {
  //   const bluetoothScanPermission = await PermissionsAndroid.request(
  //     PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
  //     {
  //       title: 'Location Permission',
  //       message: 'Bluetooth Low Energy requires Location',
  //       buttonPositive: 'OK',
  //     },
  //   );
  //   const bluetoothConnectPermission = await PermissionsAndroid.request(
  //     PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
  //     {
  //       title: 'Location Permission',
  //       message: 'Bluetooth Low Energy requires Location',
  //       buttonPositive: 'OK',
  //     },
  //   );
  //   const fineLocationPermission = await PermissionsAndroid.request(
  //     PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  //     {
  //       title: 'Location Permission',
  //       message: 'Bluetooth Low Energy requires Location',
  //       buttonPositive: 'OK',
  //     },
  //   );

  //   return (
  //     bluetoothScanPermission === 'granted' &&
  //     bluetoothConnectPermission === 'granted' &&
  //     fineLocationPermission === 'granted'
  //   );
  // };

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'Bluetooth Low Energy requires Location',
          buttonPositive: 'OK',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } else {
      return true;
    }
  };

  const isDuplicteDevice = (devices: Device[], nextDevice: Device) =>
    devices.findIndex(device => nextDevice.id === device.id) > -1;

  const scanForPeripherals = () =>
    bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.log(error);
      }
      if (device && device.name?.includes('CorSense')) {
        setAllDevices((prevState: Device[]) => {
          if (!isDuplicteDevice(prevState, device)) {
            return [...prevState, device];
          }
          return prevState;
        });
      }
    });

  const connectToDevice = async (device: any) => {
    console.log(device);

    try {
      const deviceConnection = await bleManager.connectToDevice(device);
      // setConnectedDevice(deviceConnection);
      console.log({deviceConnection});
      await deviceConnection.discoverAllServicesAndCharacteristics();
      // // bleManager.stopDeviceScan();
      // await enableNotifications(deviceConnection);
      await startStreamingData(deviceConnection);
      // const characteristic =
      //   await deviceConnection.readCharacteristicForService(
      //     serviceId,
      //     dataCharacId,
      //   );

      // console.log({characteristic});
    } catch (e) {
      console.log('FAILED TO CONNECT', e);
    }
  };

  const enableNotifications = async (device: Device) => {
    try {
      // Write to the CCCD to enable notifications
      const enableNotificationValue = '0x01'; // Hex for enabling notifications
      await device.writeCharacteristicWithResponseForService(
        serviceId,
        dataCharacId,
        enableNotificationValue,
      );

      console.log('Notifications enabled');
    } catch (error) {
      console.error('Failed to enable notifications:', error);
    }
  };

  const disconnectFromDevice = () => {
    if (connectedDevice) {
      bleManager.cancelDeviceConnection(connectedDevice.id);
      setConnectedDevice(null);
      setHeartRate(0);
    }
  };

  const onHeartRateUpdate = (
    error: BleError | null,
    characteristic: Characteristic | null,
  ) => {
    if (error) {
      console.log(error);
      return -1;
    } else if (!characteristic?.value) {
      console.log('No Data was recieved');
      return -1;
    }

    // Alert.alert('characteristic', characteristic);
    // console.log({characteristic});

    const rawData = base64.decode(characteristic.value);
    Alert.alert(rawData);
    console.log(rawData);
    // let innerHeartRate: number = -1;

    // const firstBitValue: number = Number(rawData) & 0x01;

    // if (firstBitValue === 0) {
    //   innerHeartRate = rawData[1].charCodeAt(0);
    // } else {
    //   innerHeartRate =
    //     Number(rawData[1].charCodeAt(0) << 8) +
    //     Number(rawData[2].charCodeAt(2));

    // }

    // setHeartRate(innerHeartRate);
  };

  const startStreamingData = async (device: Device) => {
    const isConnected = await device.isConnected();
    const services = await device.services();
    const service: any = services.find(s => s.uuid === serviceId);
    const characteristics = await service.characteristics();

    console.log('my characteristics', characteristics);

    console.log({isConnected});

    // const enableNotificationValue = '0100'; // Hex for enabling notifications
    bleManager.monitorCharacteristicForDevice(
      device.id,
      serviceId,
      dataCharacId,
      onHeartRateUpdate,
    );

    // console.log({datamu});

    // if (device) {
    //   device.monitorCharacteristicForService(
    //     serviceId,
    //     dataCharacId,
    //     onHeartRateUpdate,
    //   );
    // } else {
    //   console.log('No Device Connected');
    // }
  };

  return {
    scanForPeripherals,
    requestPermissions,
    connectToDevice,
    allDevices,
    connectedDevice,
    disconnectFromDevice,
    heartRate,
  };
}

export default useBLE;
