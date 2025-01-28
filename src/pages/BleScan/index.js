/* eslint-disable react-native/no-inline-styles */
import React, {useEffect, useState, useRef, useCallback} from 'react';
import {View, Text, Button, FlatList, TouchableOpacity} from 'react-native';
import BluetoothService from './BluetoothService'; // Adjust the import path as necessary

import useBLE from './useBLE';

const BluetoothManager = () => {
  const [devices, setDevices] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState('');
  const bluetoothServiceRef = useRef(new BluetoothService());

  const {connectToDevice} = useBLE();

  const discoveredDevices = new Map();

  // useEffect(() => {
  //   return () => {
  //     disconnectDevice();
  //   };
  // }, [disconnectDevice]);

  const startScan = async () => {
    setIsScanning(true);
    const bluetoothService = bluetoothServiceRef.current;

    try {
      bluetoothService.manager.startDeviceScan(null, null, (error, device) => {
        if (error) {
          setIsScanning(false);
          console.error('Error during scan:', error);
          return;
        }

        if (device && !discoveredDevices.has(device.id)) {
          // Add the device to the Map
          discoveredDevices.set(device.id, device);

          // Update state
          setDevices(Array.from(discoveredDevices.values()));
        }
      });

      console.log('Scanning started');
    } catch (error) {
      console.error('Error during scan:', error);
      setIsScanning(false);
    }
  };

  const stopScan = async () => {
    const bluetoothService = bluetoothServiceRef.current;

    try {
      await bluetoothService.manager.stopDeviceScan();
      console.log('Scanning stopped');
      setIsScanning(false);
    } catch (error) {
      console.error('Error stopping scan:', error);
    }
  };

  const connectToDevices = async deviceName => {
    const bluetoothService = bluetoothServiceRef.current;

    setSelectedDevice(deviceName);

    try {
      // await bluetoothService.connectToDevice(deviceName);
      await connectToDevice(deviceName);
      // console.log({device});

      // console.log(`Connected to device: ${device.name}`);
      // setConnectedDevice(device);
    } catch (error) {
      // console.error('Error connecting to device:', error);
    }
  };

  const disconnectDevice = useCallback(async () => {
    const bluetoothService = bluetoothServiceRef.current;

    try {
      await bluetoothService.disconnectFromDevice(selectedDevice);
    } catch (error) {
      console.error('Error disconnecting device:', error);
    }
  }, [selectedDevice]);

  const collectData = async () => {
    const bluetoothService = bluetoothServiceRef.current;

    try {
      await bluetoothService.collectVibData();
    } catch (error) {}
  };

  const collectDataTemp = async () => {
    const bluetoothService = bluetoothServiceRef.current;

    try {
      await bluetoothService.collectTmpData();
    } catch (error) {}
  };

  return (
    <View style={{padding: 20}}>
      <Text style={{fontSize: 20, marginBottom: 10}}>Bluetooth Manager</Text>

      {!isScanning && <Button title="Start Scanning" onPress={startScan} />}

      {isScanning && <Button title="Stop Scanning" onPress={stopScan} />}
      <View style={{marginTop: 20}}>
        <Button title="Disconnect" onPress={disconnectDevice} />
      </View>
      <View style={{marginTop: 20}}>
        <Button title="Collect Data" onPress={collectData} />
      </View>
      <View style={{marginTop: 20}}>
        <Button title="Collect Data Temp" onPress={collectDataTemp} />
      </View>

      {connectedDevice !== null && (
        <View style={{marginTop: 20}}>
          <Text>Connected to: {connectedDevice.name}</Text>
          <Button title="Disconnect" onPress={disconnectDevice} />
        </View>
      )}

      <Text style={{marginVertical: 10}}>Devices Found:</Text>
      <FlatList
        data={devices}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <TouchableOpacity onPress={() => connectToDevices(item.id)}>
            <Text style={{padding: 10}}>
              {item.name || 'Unnamed Device'} ({item.id})
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

export default BluetoothManager;
