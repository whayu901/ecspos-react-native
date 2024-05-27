import {useCallback, useEffect, useState} from 'react';
import {DeviceEventEmitter, PermissionsAndroid, Alert} from 'react-native';
import {
  BluetoothEscposPrinter,
  BluetoothManager,
} from 'react-native-bluetooth-escpos-printer';

export const useQRCode = () => {
  const [pairedDevices, setPairedDevices] = useState([]);
  const [foundDs, setFoundDs] = useState([]);

  const [bleOpend, setBleOpend] = useState(false);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [boundAddress, setBoundAddress] = useState('');
  const [loadingConeect, setLoadingConnect] = useState(false);

  useEffect(() => {
    DeviceEventEmitter.addListener(
      BluetoothManager.EVENT_DEVICE_ALREADY_PAIRED,
      rsp => {
        deviceAlreadPaired(rsp);
      },
    );

    if (pairedDevices.length < 1) {
      scan();
    }
  }, [deviceAlreadPaired, pairedDevices.length, scan]);

  const connectDevice = useCallback((name, boundAddress) => {
    setLoadingConnect(true);
    BluetoothManager.connect(boundAddress).then(
      () => {
        setLoadingConnect(false);
        Alert.alert('Success', 'Connect success');
        setName(name);
        setBoundAddress(boundAddress);
      },
      e => {
        setLoadingConnect(false);
        console.log(e);
      },
    );
  }, []);

  const disconnectDevice = useCallback(adressBluetooth => {
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
            console.log('hello');
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

  const printPaper = async () => {
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
        150,
        BluetoothEscposPrinter.ERROR_CORRECTION.L,
      );

      // Print header and QR code in a two-column format

      await BluetoothEscposPrinter.printColumn(
        columnWidths,
        [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
        ['Paterno', ''],
        {
          fonttype: 1,
        },
      );
      await BluetoothEscposPrinter.printText('\r\n\r\n', {});

      // Print sample details in a two-column format
      await BluetoothEscposPrinter.printColumn(
        columnWidths,
        [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
        ['Sample Name:', 'Tandan ke-3'],
        {},
      );
      await BluetoothEscposPrinter.printColumn(
        columnWidths,
        [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
        ['Trial:', 'Nomor Trial'],
        {},
      );
      await BluetoothEscposPrinter.printColumn(
        columnWidths,
        [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
        ['Blok:', 'Nomor Blok'],
        {},
      );
      await BluetoothEscposPrinter.printColumn(
        columnWidths,
        [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
        ['Plot:', 'Nomor Plot'],
        {},
      );
      await BluetoothEscposPrinter.printColumn(
        columnWidths,
        [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
        ['Palm:', 'Nomor Palm'],
        {},
      );

      // Adding some final blank lines
      await BluetoothEscposPrinter.printText('\r\n\r\n\r\n', {});
    } catch (e) {
      console.error('Printing error:', e.message || 'Unknown error');
    }
  };

  return {
    printPaper,
    pairedDevices,
    connectDevice,
    disconnectDevice,

    boundAddress,
  };
};
