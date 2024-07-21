import {PermissionsAndroid} from 'react-native';

export const usePermissionNearby = () => {
  const requestBluetoothPermission = async () => {
    try {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN, // Required from API 31 (Android 12) onwards
      ]);

      if (
        granted['android.permission.ACCESS_FINE_LOCATION'] ===
          PermissionsAndroid.RESULTS.GRANTED &&
        granted['android.permission.BLUETOOTH_SCAN'] ===
          PermissionsAndroid.RESULTS.GRANTED
      ) {
        console.log('Bluetooth permissions granted');
        // You can now initiate Bluetooth scanning
      } else {
        console.log('Bluetooth permissions denied');
      }
    } catch (err) {
      console.warn(err);
    }
  };

  return {
    requestBluetoothPermission,
  };
};
