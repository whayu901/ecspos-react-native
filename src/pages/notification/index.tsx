import React from 'react';
import {Button, View} from 'react-native';
import useNotification from './hooks/useNotification';

const Notification = () => {
  const {startForegroundService} = useNotification();

  return (
    <View>
      <Button title="Test Notification" onPress={startForegroundService} />
    </View>
  );
};

export default Notification;
