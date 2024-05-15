import {useCallback, useEffect, useState} from 'react';
import {DeviceEventEmitter, PermissionsAndroid} from 'react-native';
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

  useEffect(() => {
    BluetoothManager.connect('86:67:7A:B3:7F:B5');
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
        // const pairedDevices = s.paired;
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
      // Adding some initial blank lines
      await BluetoothEscposPrinter.printText('\r\n\r\n', {});

      // Align content left for the landscape effect
      await BluetoothEscposPrinter.printerAlign(
        BluetoothEscposPrinter.ALIGN.LEFT,
      );

      // Define the column widths
      const columnWidths = [24, 24];

      // Print header and QR code in a two-column format
      await BluetoothEscposPrinter.printColumn(
        columnWidths,
        [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
        [
          'Paterno\r\nSAMPLE\r\nQR/NFC\r\n',
          '\x1b' +
            '\x21' +
            '\x10' +
            (await BluetoothEscposPrinter.printQRCode(
              'SAMPLE QR/NFC',
              150,
              BluetoothEscposPrinter.ERROR_CORRECTION.L,
            )) +
            '\x1b' +
            '\x21' +
            '\x00',
        ],
        {},
      );

      // Print sample details in a two-column format
      await BluetoothEscposPrinter.printColumn(
        columnWidths,
        [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.LEFT],
        ['Sample Name:', 'Tandan ke-3'],
        {},
      );
      await BluetoothEscposPrinter.printColumn(
        columnWidths,
        [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.LEFT],
        ['Trial:', 'Nomor Trial'],
        {},
      );
      await BluetoothEscposPrinter.printColumn(
        columnWidths,
        [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.LEFT],
        ['Blok:', 'Nomor Blok'],
        {},
      );
      await BluetoothEscposPrinter.printColumn(
        columnWidths,
        [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.LEFT],
        ['Plot:', 'Nomor Plot'],
        {},
      );
      await BluetoothEscposPrinter.printColumn(
        columnWidths,
        [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.LEFT],
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
  };
};
