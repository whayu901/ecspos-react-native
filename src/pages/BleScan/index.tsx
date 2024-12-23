import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  Button,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import {BleManager, Device} from 'react-native-ble-plx';

const BLEVibrationApp = () => {
  const [manager] = useState(new BleManager());
  const [devices, setDevices] = useState<Device[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [resultDevice, setResultDevice] = useState<Device>();
  const [servicesAndCharacteristics, setServicesAndCharacteristics] = useState<
    any[]
  >([]);
  const [vibrationData, setVibrationData] = useState<string>('No data yet');

  useEffect(() => {
    return () => {
      manager.destroy();
    };
  }, [manager]);

  const scanDevices = () => {
    setDevices([]); // Clear the device list
    manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.error('Scan error:', error);
        return;
      }

      if (device?.name && !devices.find(d => d.id === device.id)) {
        setDevices(prevDevices => [...prevDevices, device]);
      }
    });

    // Stop scanning after 10 seconds
    setTimeout(() => {
      manager.stopDeviceScan();
    }, 10000);
  };

  const connectToDevice = async (device: Device) => {
    try {
      manager.stopDeviceScan(); // Ensure scanning is stopped
      const connected = await device.connect();
      setConnectedDevice(connected);

      setResultDevice(device);

      await connected.discoverAllServicesAndCharacteristics();
      await discoverServicesAndCharacteristics(connected);
    } catch (error) {
      console.error('Connection error:', error);
      Alert.alert('Connection Error', 'Failed to connect to the device.');
    }
  };

  const discoverServicesAndCharacteristics = async (device: Device) => {
    try {
      const services = await device.services();
      const results: any[] = [];
      let vibrationServiceUUID: string | null = null;
      let vibrationCharacteristicUUID: string | null = null;

      for (const service of services) {
        const characteristics: any = await device.characteristicsForService(
          service.uuid,
        );

        // Check if this service contains the vibration characteristic
        for (const char of characteristics) {
          if (char.properties.includes('Notify')) {
            vibrationServiceUUID = service.uuid;
            vibrationCharacteristicUUID = char.uuid;
          }
        }

        results.push({
          serviceUUID: service.uuid,
          characteristics: characteristics.map((char: any) => ({
            uuid: char.uuid,
            properties: char.properties,
          })),
        });
      }

      setServicesAndCharacteristics(results);

      if (vibrationServiceUUID && vibrationCharacteristicUUID) {
        monitorVibration(
          device,
          vibrationServiceUUID,
          vibrationCharacteristicUUID,
        );
      } else {
        Alert.alert(
          'Vibration Data',
          'No vibration characteristic found on this device.',
        );
      }
    } catch (error) {
      console.error('Discovery error:', error);
    }
  };

  const monitorVibration = async (
    device: Device,
    serviceUUID: string,
    characteristicUUID: string,
  ) => {
    try {
      await device.monitorCharacteristicForService(
        serviceUUID,
        characteristicUUID,
        (error, characteristic) => {
          if (error) {
            console.error('Monitoring error:', error);
            return;
          }

          if (characteristic?.value) {
            const decodedValue = Buffer.from(
              characteristic.value,
              'base64',
            ).toString('utf-8');
            setVibrationData(decodedValue);
          }
        },
      );
    } catch (error) {
      console.error('Monitor error:', error);
    }
  };

  const renderDevice = ({item}: {item: Device}) => (
    <View style={styles.deviceContainer}>
      <Text style={styles.deviceText}>{item?.name || 'Unknown Device'}</Text>
      <TouchableOpacity
        style={styles.connectButton}
        onPress={() => connectToDevice(item)}>
        <Text style={styles.buttonText}>Connect</Text>
      </TouchableOpacity>
    </View>
  );

  const renderService = ({item}: {item: any}) => (
    <View style={styles.serviceContainer}>
      <Text style={styles.serviceText}>Service UUID: {item.serviceUUID}</Text>
      {item.characteristics.map((char: any, index: number) => (
        <View key={index} style={styles.characteristicContainer}>
          <Text style={styles.characteristicText}>
            Characteristic UUID: {char.uuid}
          </Text>
          <Text style={styles.characteristicText}>
            Properties: {JSON.stringify(char.properties)}
          </Text>
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <Button title="Scan Devices" onPress={scanDevices} />
      <FlatList
        data={devices}
        keyExtractor={item => item.id}
        renderItem={renderDevice}
        contentContainerStyle={styles.list}
      />
      {connectedDevice && (
        <View>
          <Text style={styles.heading}>
            Connected to {connectedDevice.name || 'Unknown Device'}
          </Text>
          <FlatList
            data={servicesAndCharacteristics}
            keyExtractor={item => item.serviceUUID}
            renderItem={renderService}
            contentContainerStyle={styles.list}
          />
          <Text style={styles.vibrationHeading}>Vibration Data:</Text>
          <Text style={styles.vibrationData}>{vibrationData}</Text>
          <Text>{JSON.stringify(resultDevice)}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, padding: 16, backgroundColor: '#fff'},
  list: {marginTop: 16},
  deviceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  deviceText: {fontSize: 16, color: 'red'},
  connectButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  buttonText: {color: '#fff', fontWeight: 'bold'},
  heading: {fontSize: 18, fontWeight: 'bold', marginVertical: 10},
  serviceContainer: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  serviceText: {fontSize: 16, fontWeight: 'bold'},
  characteristicContainer: {marginLeft: 10, marginTop: 5},
  characteristicText: {fontSize: 14},
  vibrationHeading: {fontSize: 18, fontWeight: 'bold', marginTop: 20},
  vibrationData: {fontSize: 16, color: 'blue', marginTop: 10},
});

export default BLEVibrationApp;
