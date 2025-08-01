/* eslint-disable react-native/no-inline-styles */
import React, {useEffect, useState} from 'react';
import {Modal, View, Text, Button, BackHandler, Platform} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';

import Route from './src/routes';
import {RootServiceModule} from './src/module';
import {BleProvider} from './src/pages/BleScan/BleContext';

import UploadToast from './src/components/UploadToast';
import {UploadProvider} from './src/context/UploadContext';

// Register the foreground service

const App = () => {
  const [isJailbroken, setIsJailbroken] = useState(false);

  useEffect(() => {
    const runCheck = async () => {
      const rooted = await RootServiceModule.isRooting();
      const frida = await RootServiceModule.isFridaDetected();
      const isDeviceRooted = await RootServiceModule.isDeviceRooted();

      if (rooted || frida || isDeviceRooted) {
        setIsJailbroken(true);
      }
    };

    runCheck();
  }, []);

  const handleExit = () => {
    if (Platform.OS === 'android') {
      BackHandler.exitApp();
    } else {
      // iOS has no official API for force closing, can trigger a crash or freeze
      console.log('Closing app not supported on iOS');
    }
  };

  return (
    <BleProvider>
      <UploadProvider>
        <NavigationContainer>
          <UploadToast />
          <Route />
        </NavigationContainer>
        <Modal visible={isJailbroken} transparent={true} animationType="fade">
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'rgba(0,0,0,0.8)',
            }}>
            <View
              style={{
                backgroundColor: 'white',
                padding: 20,
                borderRadius: 10,
                width: '80%',
                alignItems: 'center',
              }}>
              <Text
                style={{fontSize: 18, marginBottom: 20, textAlign: 'center'}}>
                we detect you cheating. bitch
              </Text>
              <Button title="Exit App" onPress={handleExit} />
            </View>
          </View>
        </Modal>
      </UploadProvider>
    </BleProvider>
  );
};

export default App;
