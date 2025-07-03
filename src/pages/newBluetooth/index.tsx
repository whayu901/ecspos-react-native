import React, {useEffect} from 'react';
import {Button, View, Text} from 'react-native';

import useBLE from './hooks/useBle';

const NewBluetooth = () => {
  const {
    reconnectIfNeeded,
    startBackgroundTask,
    stopBackgroundTask,
    receivedData,
  } = useBLE();

  useEffect(() => {
    const checkAndReconnect = async () => {
      const deviceId = 'YOUR_DEVICE_ID';
      await reconnectIfNeeded(deviceId);
    };
    checkAndReconnect();
  }, [reconnectIfNeeded]);

  return (
    <View>
      <Button title="Start Collect" onPress={startBackgroundTask} />
      <Button title="Stop Collect" onPress={stopBackgroundTask} />

      <Text>Data: {JSON.stringify(receivedData)}</Text>
    </View>
  );
};

export default NewBluetooth;
