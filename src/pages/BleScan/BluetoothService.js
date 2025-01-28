/* eslint-disable no-bitwise */
import {BleManager} from 'react-native-ble-plx';
import {Buffer} from 'buffer';
import {Alert} from 'react-native';

const serviceId = 'b7ef1193-dc2e-4362-93d3-df429eb3ad10'; //service uuid
const cmdCharacId = '00ce7a72-ec08-473d-943e-81ec27fdc600'; //write uuid
const dataCharacId = '00ce7a72-ec08-473d-943e-81ec27fdc5f2';
// const serviceId = 'b7ef1193dc2e436293d3df429eb3ad10'; //service uuid
// const cmdCharacId = '00ce7a72ec08473d943e81ec27fdc600'; //write uuid
// const dataCharacId = '00ce7a72ec08473d943e81ec27fdc5f2';

// Helper functions
const intToBytes = value => [
  value & 0xff,
  (value >> 8) & 0xff,
  (value >> 16) & 0xff,
  (value >> 24) & 0xff,
];

const bytesToInt = bytes =>
  bytes[0] | (bytes[1] << 8) | (bytes[2] << 16) | (bytes[3] << 24);

const bytesToFloat = bytes => {
  const intValue = bytesToInt(bytes);
  const buffer = Buffer.alloc(4);
  buffer.writeInt32LE(intValue, 0);
  return buffer.readFloatLE(0);
};

class BluetoothService {
  constructor() {
    this.manager = new BleManager();
    this.connectedDevice = null;
    this.writeCharacteristic = null;
    this.readCharacteristic = null;
    this.isSubscribed = false;
    this.dataSubscription = null;
    this.resciveData = [];
    for (let i = 0; i < 242; i++) {
      this.resciveData.push(0);
    }
    this.statu = [0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80];
    this.waveDataT = {};
    this.percentage = 0;
    this.isScanning = false;
    this.isConnecting = false;
  }

  connectToDevice = async deviceId => {
    try {
      const connectedDevices = await this.manager.connectedDevices([serviceId]);
      const alreadyConnected = connectedDevices.some(
        device => device.id === deviceId,
      );

      if (alreadyConnected) {
        Alert.alert(
          'Device already connected',
          `Device ${deviceId} is already connected.`,
        );
        return;
      }

      const device = await this.manager.connectToDevice(deviceId);
      await device.discoverAllServicesAndCharacteristics();
      const services = await device.services();
      // console.log({services});

      const service = services.find(s => s.uuid === serviceId);
      const characteristics = await service.characteristics();

      const cmdCharacteristic = characteristics.find(
        c => c.uuid === cmdCharacId,
      );
      const dataCharacteristic = characteristics.find(
        c => c.uuid === dataCharacId,
      );

      // console.log({dataCharacteristic});
      // this.manager
      //   .readCharacteristicForDevice(deviceId, serviceId, dataCharacId)
      //   .then(data => {
      //     console.log('data');
      //   })
      //   .catch(err => {
      //     console.error(err);
      //   });

      device.monitorCharacteristicForService(
        serviceId,
        dataCharacId,
        (error, data) => {
          try {
            if (error) {
              Alert.alert('tidak berhasil');
              return;
            }
            console.log('my Data', data);
          } catch (e) {
            console.error(e);
          }

          // console.log('error char', error);
        },
      );

      // console.log('Connected to device:', device.id);

      // const services = await device.services();

      // const service = services.find(s => s.uuid === serviceId);

      // if (!service) {
      //   Alert.alert(
      //     'Service Not Found',
      //     'The specified service does not exist on this device.',
      //   );
      //   await this.disconnectFromDevice(deviceId);
      //   return;
      // }

      // this.writeCharacteristic = cmdCharacteristic;
      // this.readCharacteristic = characteristics;

      // if (cmdCharacteristic && dataCharacteristic) {
      //   console.log('Service and characteristics found!');
      //   // Perform some function with the characteristics
      //   this.performActionWithCharacteristic(
      //     cmdCharacteristic,
      //     dataCharacteristic,
      //   );
      // } else {
      //   Alert.alert(
      //     'Characteristics Not Found',
      //     'The required characteristics were not found on this device.',
      //   );
      // }
    } catch (error) {
      console.error('Error connecting to device:', error);
      Alert.alert(
        'Connection Error',
        error.message || 'Unable to connect to the device.',
      );
    }
  };

  disconnectFromDevice = async deviceId => {
    try {
      const device = await this.manager.devices([deviceId]);
      if (device) {
        await this.manager.cancelDeviceConnection(deviceId);
        console.log('Disconnected from device:', deviceId);
        Alert.alert('Disconnected', `Disconnected from device ${deviceId}`);
      } else {
        Alert.alert(
          'Device Not Found',
          'No connected device found with this ID.',
        );
      }
    } catch (error) {
      console.error('Error disconnecting from device:', error);
      Alert.alert(
        'Disconnection Error',
        error.message || 'Unable to disconnect from the device.',
      );
    }
  };

  performActionWithCharacteristic = async (
    cmdCharacteristic,
    dataCharacteristic,
  ) => {
    // console.log('Write Characteristic:', cmdCharacteristic.uuid);
    // console.log('Read Characteristic:', dataCharacteristic.uuid);
    // console.log('Read Characteristic data:', dataCharacteristic);

    if (!dataCharacteristic.isNotifiable) {
      console.error('This characteristic is not notifiable.');
      return;
    } else {
      console.log('is notifibale');
    }

    // Start monitoring the data characteristic
    console.log('Monitoring characteristic:', dataCharacteristic.value);

    // dataCharacteristic.monitor((error, data) => {
    //   console.log({data});
    // });

    // const base64Value = dataCharacteristic?.value;
    // if (base64Value) {
    //   const data = Buffer.from(base64Value, 'base64');
    //   console.log('Data received:', Array.from(data));
    //   this.handleData(Array.from(data)); // Custom data handling
    // } else {
    //   console.log('No data received.');
    // }
  };

  startScan() {
    if (this.isScanning) {
      return Promise.reject(new Error('Already scanning.'));
    }

    this.isScanning = true;
    return new Promise((resolve, reject) => {
      this.manager.startDeviceScan(null, null, (error, device) => {
        if (error) {
          this.isScanning = false;
          reject(error);
          return;
        }
        console.log(`Found device: ${device.name || 'unknown'} (${device.id})`);
      });

      setTimeout(() => {
        this.manager.stopDeviceScan();
        this.isScanning = false;
        resolve('Scanning stopped');
      }, 10000); // Stop scanning after 10 seconds
    });
  }

  connect(deviceName) {
    if (this.isConnecting) {
      return Promise.reject(new Error('Already connecting to a device.'));
    }
    this.isConnecting = true;

    return new Promise((resolve, reject) => {
      this.manager.startDeviceScan(null, null, async (error, device) => {
        if (error) {
          this.isConnecting = false;
          reject(error);
          return;
        }

        if (device.name === deviceName) {
          this.manager.stopDeviceScan();

          try {
            // Check if the device is already connected
            const connectedDevices = await this.manager.connectedDevices([
              serviceId,
            ]);

            console.log({connectedDevices});
            const alreadyConnected = connectedDevices.find(
              d => d.id === device.id,
            );

            if (alreadyConnected) {
              console.log('Device is already connected. Reusing connection.');
              this.connectedDevice = alreadyConnected;
            } else {
              const connectedDevice = await device.connect();
              this.connectedDevice = connectedDevice;

              await connectedDevice.discoverAllServicesAndCharacteristics();
            }

            // Discover services and characteristics
            const services = await this.connectedDevice.services();

            console.log({services});
            const service = services.find(s => s.uuid === serviceId);

            if (!service) {
              throw new Error('Desired service not found.');
            }

            const characteristics = await service.characteristics();

            for (const char of characteristics) {
              console.log(char.uuid);
              if (char.uuid === cmdCharacId) {
                console.log('Command characteristic found!');
                this.writeCharacteristic = char;
              }
              if (char.uuid === dataCharacId) {
                console.log('Data characteristic found!');
                this.readCharacteristic = char;

                try {
                  await this.subscribeToData();

                  console.log('subscribe data');
                } catch (subscribeError) {
                  this.isConnecting = false;
                  reject(subscribeError);
                  return;
                }
              }
            }

            if (!this.writeCharacteristic || !this.readCharacteristic) {
              throw new Error('Write or read characteristics not found');
            }

            this.isConnecting = false;
            resolve(this.connectedDevice);
          } catch (err) {
            this.isConnecting = false;
            reject(err);
          }
        }
      });

      if (!this.isScanning) {
        this.startScan().catch(err => {
          this.isConnecting = false;
          reject(err);
        });
      }
    });
  }

  async retryConnection(device, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        const connectedDevice = await device.connect();
        return connectedDevice;
      } catch (error) {
        if (i === retries - 1) {
          throw error;
        } // Throw error if retries are exhausted
        console.warn(`Retrying connection (${i + 1}/${retries})...`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait before retrying
      }
    }
  }

  _collecData(val, samp, nowLength, nowFreq) {
    const data = [];
    // Get current time
    const now = new Date();
    // Format time
    const formatted = now.toISOString().slice(0, 19).replace(/[-T:]/g, ''); // YYYYMMDDHHMMSS

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

    // Append length data for each axis
    data.push(...intToBytes(startCollect.mdefLen.x));
    data.push(...intToBytes(startCollect.mdefLen.z));
    data.push(...intToBytes(startCollect.mdefLen.y));

    // Append frequency data for each axis
    data.push(...intToBytes(startCollect.mdefFreq.x));
    data.push(...intToBytes(startCollect.mdefFreq.z));
    data.push(...intToBytes(startCollect.mdefFreq.y));

    // Append measurement interval, long waveform length and frequency
    data.push(...intToBytes(startCollect.meaIntv));
    data.push(...intToBytes(startCollect.lwLength));
    data.push(...intToBytes(startCollect.lwFreq));
    data.push(...intToBytes(startCollect.lwIntv));

    // Append sample indication, sample length and frequency
    data.push(startCollect.isSampleInd);
    data.push(...intToBytes(startCollect.indLength));
    data.push(...intToBytes(startCollect.indFreq));
    data.push(...intToBytes(startCollect.indIntv));
    data.push(startCollect.sampleDir);

    console.log(val, ' ', JSON.stringify(data));
    // }
    return this.sendData(0x01, data);
  }

  async disconnect(deviceName) {
    try {
      // Retrieve all connected devices for the service UUID
      const connectedDevices = await this.manager.connectedDevices([serviceId]);

      // Find the device with the specified name
      const device = connectedDevices.find(d => d.name === deviceName);

      if (!device) {
        throw new Error(`Device with name "${deviceName}" is not connected.`);
      }

      // Disconnect the specific device
      await device.cancelConnection();
      console.log(`Disconnected from device: ${deviceName}`);
    } catch (error) {
      console.error(`Error disconnecting from device: ${error.message}`);
      throw error;
    }
  }

  subscribeToData() {
    if (!this.readCharacteristic || this.isSubscribed) {
      return Promise.reject(new Error('Cannot subscribe to data.'));
    }

    return this.readCharacteristic.monitor((error, characteristic) => {
      if (error) {
        console.error('Subscription error:', error);
        return;
      }

      const data = characteristic?.value
        ? Buffer.from(characteristic.value, 'base64')
        : [];
      const dataArray = Array.from(data);
      this.handleData(dataArray);
    });
  }

  unsubscribeFromData() {
    if (this.readCharacteristic && this.isSubscribed) {
      this.readCharacteristic.unsubscribe();
      this.isSubscribed = false;
      this.readCharacteristic.removeAllListeners('data');
    }
  }

  sendData(cmd, data) {
    const nowSendData = [0xaa, cmd, data.length + 4, ...data];
    let cs = nowSendData.reduce((sum, p) => (sum + p) % 256, 0);
    cs = 256 - cs;

    const finalData = [...nowSendData, cs];
    const buffer = Buffer.from(finalData);

    console.log({data});

    return this.writeCharacteristic.writeWithResponse(
      buffer.toString('base64'),
    );
  }

  handleData(data) {
    console.log('Data received:', data[1]);
    // Add handling logic here as per your application needs

    let allVal = 0;
    data.forEach(item => {
      allVal += item % 256;
    });
    if (allVal % 256 !== 0) {
      console.log('======Bluetooth data error, trying again:', allVal);
      return;
    }

    switch (data[1]) {
      case 0x04: {
        const dp = data.slice(3);
        // Process received data
        const wave = this._transWaveData(dp);
        //console.log("0x04",JSON.stringify(dp));

        if (wave) {
          this.waveDataT[wave.index] = wave;
          this.percentage =
            (Object.keys(this.waveDataT).length * 100) / wave.count;
          //console.log(this.percentage)
        }
        break;
      }
      case 0x06: {
        const dp = data.slice(3, data[2]);
        // Process received data
        this._transIndexData(dp);
        // console.log("0x06",JSON.stringify(dp));
        break;
      }
      case 0x05: {
        if (!this.waveDataT) {
          return;
        }
        Object.keys(this.waveDataT).forEach(key => {
          const p = this.waveDataT[key];
          this.resciveData[Math.floor(p.index / 8)] =
            this.resciveData[Math.floor(p.index / 8)] | this.statu[p.index % 8];
        });

        console.log('wahyu');

        this.sendData(0x05, this.resciveData);
        if (this.percentage < 100) {
          return;
        }
        this._processWaveData();
        break;
      }
      default:
        // Handle unknown command
        console.warn(`Unknown command received: ${data[1]}`);
    }
  }

  collectVibData() {
    this.percentage = 0;
    this.waveDataT = {};
    this.resciveData = [];
    for (let i = 0; i < 242; i++) {
      this.resciveData.push(0);
    }

    return this._collecData(0, 1, 8, 3125);
  }

  collectIndexData() {
    return this._collecData(2, 0, 0, 3125);
  }

  collectTmpData() {
    return this._collecData(1, 0, 0, 1000);
  }

  stopCollectTmpData() {
    return this._collecData(4, 0, 0, 1000);
  }

  _processWaveData() {
    const waveData = {};
    let DataT = [];
    const keys = Object.keys(this.waveDataT).sort((a, b) => a - b);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const wave = this.waveDataT[key];
      DataT = DataT.concat(wave.data.slice(0, 224));
    }

    let sampLen = 0;
    let rate = 0;
    const firstWave = this.waveDataT[keys[0]];
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

    DataT = DataT.slice(0, sampLen * 2);
    const len = DataT.length / 2;
    const YDataT = [];
    const crof = firstWave.crof;
    let sum = 0;
    for (let i = 0; i < len; i++) {
      const dataTemp = [DataT[i * 2 + 1], DataT[i * 2]];
      const int16Data = (dataTemp[0] << 8) | dataTemp[1];
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
    this.waveDataT = {};
    this.resciveData = [];
    for (let i = 0; i < 242; i++) {
      this.resciveData.push(0);
    }
    console.log(JSON.stringify(waveData));
    return waveData;
  }

  _transWaveData(dp) {
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
  }

  _transIndexData(dp) {
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

      console.log('======highAccRms', highAccRms);
      console.log('======lowAccRms', lowAccRms);
      console.log('======velRms', velRms);
      console.log('======tem', tem);

      // console.log(            Y, y, M, d, H, m, s,
      //     highAccRms,
      //     lowAccRms,
      //     velRms,
      //     tem,
      //     U,
      //     I,
      // R)
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
  }
}

export default BluetoothService;
