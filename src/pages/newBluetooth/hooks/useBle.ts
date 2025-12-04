import {useState, useEffect, useRef} from 'react';
import {
  BleManager,
  Device,
  Characteristic,
  BleError,
} from 'react-native-ble-plx';
import {Buffer} from 'buffer';
// import {MMKV} from 'react-native-mmkv';
import BackgroundService from 'react-native-background-actions';

// const storage = new MMKV();
// const RECEIVED_DATA_KEY = 'ble_received_data';

const bleManager = new BleManager(); // ✅ Singleton BLE manager

// ✅ Helper sleep
const sleep = (time: number) =>
  new Promise(resolve => setTimeout(resolve, time));

// ✅ Your bytesToFloat function
const bytesToFloat = (bytes: Uint8Array | number[]) => {
  const buffer = new ArrayBuffer(4);
  const view = new DataView(buffer);
  bytes.forEach((b, i) => view.setUint8(i, b));
  return view.getFloat32(0, true);
};

export default function useBLE() {
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [receivedData, setReceivedData] = useState<number[]>([]);

  const writeCharRef = useRef<Characteristic | null>(null);
  const notifyCharRef = useRef<Characteristic | null>(null);
  const receivedDataRef = useRef<number[]>([]); // ✅ Safe always-up-to-date copy

  // ✅ Hydrate state when hook mounts
  useEffect(() => {
    const stored = '';
    if (stored) {
      const parsed = JSON.parse(stored);
      receivedDataRef.current = parsed;
      setReceivedData(parsed);
    }
  }, []);

  // ✅ Connect to your device + discover + cache characteristics
  const connectToDevice = async (deviceId: string) => {
    console.log('🔗 Connecting to device:', deviceId);
    const device = await bleManager.connectToDevice(deviceId, {
      autoConnect: true,
    });
    await device.discoverAllServicesAndCharacteristics();

    // Example UUIDs — replace with your actual ones
    const services = await device.services();
    for (const service of services) {
      const characteristics = await service.characteristics();
      for (const char of characteristics) {
        if (char.isWritableWithResponse) {
          writeCharRef.current = char;
          console.log('✅ Found writeChar:', char.uuid);
        }
        if (char.isNotifiable) {
          notifyCharRef.current = char;
          await char.monitor(onDetectData);
          console.log('✅ Subscribed notifyChar:', char.uuid);
        }
      }
    }

    setConnectedDevice(device);
    console.log('✅ Connected and ready.');
    return device;
  };

  // ✅ BLE notification handler
  const onDetectData = (
    error: BleError | null,
    characteristic: Characteristic | null,
  ) => {
    if (error) {
      console.log('❌ Monitor error:', error);
      return;
    }
    if (!characteristic?.value) {
      console.log('⚠️ No data received');
      return;
    }

    const raw = Buffer.from(characteristic.value, 'base64');
    _transIndexData(raw);
  };

  // ✅ Your index data processor — safe with ref & MMKV
  const _transIndexData = (dp: any) => {
    if (dp.length < 35) {
      console.log('Too short to process.');
      return null;
    }
    try {
      // const highAccRms = bytesToFloat(dp.slice(7, 11));
      // const lowAccRms = bytesToFloat(dp.slice(11, 15));
      const velRms = bytesToFloat(dp.slice(15, 19));
      const tem = bytesToFloat(dp.slice(19, 23));

      const data = Math.round(((tem === 0 ? velRms : tem) * 100) / 100);

      receivedDataRef.current.push(data);
      setReceivedData([...receivedDataRef.current]);
      // storage.set(RECEIVED_DATA_KEY, JSON.stringify(receivedDataRef.current));

      console.log(`✅ Data updated: ${data}`);
    } catch (e) {
      console.log('⚠️ Failed parsing index data:', e);
    }
  };

  // ✅ Background task for periodic commands
  const backgroundTask = async () => {
    console.log('[Background] Task started');

    while (BackgroundService.isRunning()) {
      if (writeCharRef.current) {
        // Example collect command
        const cmd = [0xaa, 0x02, 0x00, 0x00, 0x0c, 0x35]; // Replace with your logic!
        const buffer = Buffer.from(cmd);
        const base64 = buffer.toString('base64');
        await writeCharRef.current.writeWithResponse(base64);
        console.log('[Background] Collect command sent');
      }
      await sleep(1000); // Adjust interval as needed
    }
  };

  const startBackgroundTask = async () => {
    console.log('✅ Starting BLE background task...');
    await BackgroundService.start(backgroundTask, {
      taskName: 'BLE Collection',
      taskTitle: 'Collecting Vibration Data',
      taskDesc: 'Running in background',
      taskIcon: {
        name: 'ic_launcher',
        type: 'mipmap',
      },
    });
  };

  const stopBackgroundTask = async () => {
    await BackgroundService.stop();
    console.log('🛑 Stopped BLE background task');
  };

  // ✅ Reconnect if needed when screen mounts
  const reconnectIfNeeded = async (deviceId: string) => {
    const connected = await bleManager.isDeviceConnected(deviceId);
    if (!connected) {
      console.log('🔌 Not connected — reconnecting...');
      const device = await connectToDevice(deviceId);
      console.log('✅ Reconnected');
      return device;
    } else {
      console.log('✅ Still connected');
      return connectedDevice;
    }
  };

  return {
    connectToDevice,
    reconnectIfNeeded,
    startBackgroundTask,
    stopBackgroundTask,
    receivedData,
  };
}
