/* eslint-disable react-hooks/rules-of-hooks */
import {useCallback, useEffect, useMemo, useState} from 'react';
import {
  DeviceEventEmitter,
  PermissionsAndroid,
  Alert,
  NativeModules,
  NativeEventEmitter,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  BluetoothEscposPrinter,
  BluetoothManager,
} from 'react-native-bluetooth-escpos-printer';
import {useDecrypt, useEncrypt} from '../../../utils/CryptoEncryptDecrypt';

export const useQRCode = () => {
  const [pairedDevices, setPairedDevices] = useState([]);
  const [foundDs, setFoundDs] = useState([]);

  const {DetailListManager, PrintManager, DeviceEventManagerModule} =
    NativeModules;

  const eventEmitter = useMemo(
    () => new NativeEventEmitter(DeviceEventManagerModule),
    [DeviceEventManagerModule],
  );

  const [bleOpend, setBleOpend] = useState(false);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [boundAddress, setBoundAddress] = useState('');
  const [loadingConeect, setLoadingConnect] = useState(false);
  const [showModalList, setShowModalList] = useState(false);

  const [isLoadingPrint, setIsLoadingPrint] = useState(false);

  useEffect(() => {
    const subscription = eventEmitter.addListener(
      'onIntentDataReceived',
      async params => {
        // Handle received intent data
        console.log('Received intent data:', params);

        // Example: Save data to AsyncStorage

        try {
          await AsyncStorage.setItem('printerInfo', JSON.stringify(params));

          PrintManager.updatePrinterInfoFromJson(JSON.stringify(params));
          console.log('Printer info saved to AsyncStorage');
        } catch (error) {
          console.error('Error saving printer info:', error);
        }
      },
    );

    return () => {
      subscription.remove();
    };
  }, [PrintManager, eventEmitter]);

  useEffect(() => {
    // DeviceEventEmitter.addListener(
    //   BluetoothManager.EVENT_DEVICE_ALREADY_PAIRED,
    //   rsp => {
    //     deviceAlreadPaired(rsp);
    //   },
    // );

    // const gettingData = async () => {
    //   try {
    //     const value = await AsyncStorage.getItem('printerAddress');
    //     console.log({value});
    //     if (value !== null) {
    //       setBoundAddress(value);
    //       await BluetoothManager.connect(value);
    //     }
    //   } catch (e) {
    //     console.log(e);
    //   }
    // };

    // gettingData();

    // if (pairedDevices.length < 1) {
    scan();
    // }
  }, [scan]);

  const onPressPairedDeviceBluetooth = useCallback(
    (nameDevice, adress) => {
      if (boundAddress === '') {
        connectDevice(nameDevice, adress);
      } else {
        disconnectDevice(adress);
      }
    },
    [boundAddress, connectDevice, disconnectDevice],
  );

  const connectDevice = useCallback(async (name, boundAddress) => {
    setLoadingConnect(true);
    BluetoothManager.connect(boundAddress).then(
      async () => {
        setLoadingConnect(false);
        Alert.alert('Success', 'Connect success');
        setName(name);
        setBoundAddress(boundAddress);
        await AsyncStorage.setItem('printerAddress', boundAddress);
      },
      e => {
        setLoadingConnect(false);
        console.log(e);
      },
    );
  }, []);

  const disconnectDevice = useCallback(async adressBluetooth => {
    BluetoothManager.unpaire(adressBluetooth).then(() => {
      setName('');
      setBoundAddress('');
      Alert.alert('Success', 'Disconnect success');
    });
  }, []);

  const deviceAlreadPaired = useCallback(
    rsp => {
      let ds = null;
      if (typeof rsp.devices === 'object') {
        ds = rsp.devices;
      } else {
        try {
          ds = JSON.parse(rsp.devices);
        } catch (e) {}
      }
      if (ds?.length) {
        let pared = pairedDevices;
        if (pared.length < 1) {
          pared = pared.concat(ds || []);
        }
        console.log({pared});
        setPairedDevices(pared);
      }
    },

    [pairedDevices],
  );

  const scan = useCallback(() => {
    try {
      async function blueTooth() {
        const permissions = {
          title: 'HSD bluetooth meminta izin untuk mengakses bluetooth',
          message:
            'HSD bluetooth memerlukan akses ke bluetooth untuk proses koneksi ke bluetooth printer',
          buttonNeutral: 'Lain Waktu',
          buttonNegative: 'Tidak',
          buttonPositive: 'Boleh',
        };

        const bluetoothConnectGranted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          permissions,
        );
        if (bluetoothConnectGranted === PermissionsAndroid.RESULTS.GRANTED) {
          const bluetoothScanGranted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            permissions,
          );
          if (bluetoothScanGranted === PermissionsAndroid.RESULTS.GRANTED) {
            scanDevices();
          }
        } else {
          // ignore akses ditolak
        }
      }
      blueTooth();
    } catch (err) {
      console.warn(err);
    }
  }, [scanDevices]);

  const scanDevices = useCallback(() => {
    setLoading(true);
    BluetoothManager.scanDevices().then(
      s => {
        let found = s.found;
        try {
          found = JSON.parse(found); //@FIX_it: the parse action too weired..
        } catch (e) {
          //ignore
        }
        let fds = foundDs;
        if (found?.length) {
          fds = found;
        }
        setFoundDs(fds);
        setLoading(false);
      },
      er => {
        setLoading(false);
        // ignore
      },
    );
  }, [foundDs]);

  const handleEncryptDecrypt = exampleDataPrint => {
    const encryptedData = useEncrypt(exampleDataPrint);
    console.log('Encrypted:', encryptedData);

    const decryptedData = useDecrypt(encryptedData);
    console.log('Decrypted:', decryptedData);
  };

  const printPerform = async () => {
    setIsLoadingPrint(true);

    const exampleDataPrint = {
      estate: 'KSB',
      trial: 'SB03_066KSB14',
      trialCode: 'B0066',
      trialId: 82,
      palmId: '96955',
      palm: 'Pokok 1',
      block: 'A14a',
      plot: '1-2460',
      sampleNo: '1',
      palmNo: '1',
      timeStamp: '2024-07-15 21:00:53',
      qrCode: 'T4zA5BTT3qt',
    };

    handleEncryptDecrypt(exampleDataPrint);

    // PrintManager.performPrint(JSON.stringify(exampleDataPrint))
    //   .then(() => {
    //     setIsLoadingPrint(false);

    //     Alert.alert('Sukses', 'Berhasil Melakukan Print');
    //   })
    //   .catch(() => {
    //     setIsLoadingPrint(false);
    //   });
  };

  const printPaper = async () => {
    const isBluetoothEnabled = await BluetoothManager.isBluetoothEnabled();

    if (!isBluetoothEnabled) {
      Alert.alert('Bluetooth is not enabled');
    } else if (boundAddress === '') {
      setShowModalList(true);
    } else {
      try {
        // Align content left for the landscape effect

        await BluetoothEscposPrinter.setBlob(0);
        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        );

        // Define the column widths
        const columnWidths = [15, 15];

        await BluetoothEscposPrinter.printQRCode(
          'SAMPLE QR/NFC',
          250,
          BluetoothEscposPrinter.ERROR_CORRECTION.L,
        );

        // Print header and QR code in a two-column format

        await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ['Paterno', ''],
          {},
        );
        await BluetoothEscposPrinter.printText('\r\n', {});

        // Print sample details in a two-column format
        await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ['Sample Name:', 'Tandan ke-3'],
          {},
        );
        await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ['Trial:', 'Nomor Trial'],
          {},
        );
        await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ['Blok:', 'Nomor Blok'],
          {},
        );
        await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ['Plot:', 'Nomor Plot'],
          {},
        );
        await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ['Palm:', 'Nomor Palm'],
          {},
        );

        // Adding some final blank lines
        await BluetoothEscposPrinter.printText('\r\n\r\n\r\n', {});
      } catch (e) {
        console.error('Printing error:', e.message || 'Unknown error');
      }
    }
  };

  return {
    printPaper,
    pairedDevices,
    connectDevice,
    disconnectDevice,
    onPressPairedDeviceBluetooth,
    DetailListManager,
    PrintManager,
    printPerform,

    boundAddress,
    showModalList,
    setShowModalList,

    isLoadingPrint,
  };
};
