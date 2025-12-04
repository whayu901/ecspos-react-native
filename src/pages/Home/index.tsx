/* eslint-disable react-native/no-inline-styles */
/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useCallback, useState} from 'react';

import {
  Button,
  // Button,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import Config from 'react-native-config';

import {useBleContext} from '../../pages/BleScan/BleContext';

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const navigation: any = useNavigation();
  const route: any = useRoute();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [data, setData] = useState('Initial Data');

  const {stopCollectTmpData, disconnectDevice, connectedDevice, setWidgetFrom} =
    useBleContext();

  // Handle data when coming back from Screen B
  useFocusEffect(
    useCallback(() => {
      if (route.params?.updatedData) {
        // setData(route.params.updatedData);
        console.log('my data', route.params?.updatedData);
      }
    }, [route.params?.updatedData]),
  );

  const handleStopAndDisconnect = async () => {
    setWidgetFrom('home');

    await stopCollectTmpData();
    if (connectedDevice) {
      await disconnectDevice(connectedDevice.id);
    }
  };

  return (
    <SafeAreaView>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        <Text>{Config.GOOGLE_MAPS_API_KEY}</Text>
        <View style={{marginHorizontal: 15}}>
          <TouchableOpacity
            onPress={() => navigation.navigate('UploadDataScreen')}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              borderBottomColor: 'grey',
              borderBottomWidth: 0.5,
              paddingBottom: 10,
              marginTop: 15,
            }}>
            <Text style={{color: 'black'}}>Upload Data</Text>
            <Text style={{color: 'black'}}>{'>'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('QRCode')}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              borderBottomColor: 'grey',
              borderBottomWidth: 0.5,
              paddingBottom: 10,
              marginTop: 15,
            }}>
            <Text style={{color: 'black'}}>Bluetooth Printer Feature</Text>
            <Text style={{color: 'black'}}>{'>'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('FlirCameraScreen')}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              borderBottomColor: 'grey',
              borderBottomWidth: 0.5,
              paddingBottom: 10,
              marginTop: 15,
            }}>
            <Text style={{color: 'black'}}>Flir Camera</Text>
            <Text style={{color: 'black'}}>{'>'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('NotificationScreen')}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              borderBottomColor: 'grey',
              borderBottomWidth: 0.5,
              paddingBottom: 10,
              marginTop: 15,
            }}>
            <Text style={{color: 'black'}}>Notificaiton Request</Text>
            <Text style={{color: 'black'}}>{'>'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('BleScreen')}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              borderBottomColor: 'grey',
              borderBottomWidth: 0.5,
              paddingBottom: 10,
              marginTop: 15,
            }}>
            <Text style={{color: 'black'}}>Bluetooth Low Energy</Text>
            <Text style={{color: 'black'}}>{'>'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('NFC')}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              borderBottomColor: 'grey',
              borderBottomWidth: 0.5,
              paddingBottom: 10,
              marginTop: 15,
            }}>
            <Text style={{color: 'black'}}>Check NFC</Text>
            <Text style={{color: 'black'}}>{'>'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('PermissionNearby', {
                onGoBack: (newData: any) => setData(newData), // Callback function
              })
            }
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              borderBottomColor: 'grey',
              borderBottomWidth: 0.5,
              paddingBottom: 10,
              marginTop: 15,
            }}>
            <Text style={{color: 'black'}}>Check Permission Nearby</Text>
            <Text style={{color: 'black'}}>{'>'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('ChartScreen')}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              borderBottomColor: 'grey',
              borderBottomWidth: 0.5,
              paddingBottom: 10,
              marginTop: 15,
            }}>
            <Text style={{color: 'black'}}>Chart</Text>
            <Text style={{color: 'black'}}>{'>'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('ChartRealtimeScreen')}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              borderBottomColor: 'grey',
              borderBottomWidth: 0.5,
              paddingBottom: 10,
              marginTop: 15,
            }}>
            <Text style={{color: 'black'}}>ChartRealtimeScreen</Text>
            <Text style={{color: 'black'}}>{'>'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('Camera')}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              borderBottomColor: 'grey',
              borderBottomWidth: 0.5,
              paddingBottom: 10,
              marginTop: 15,
            }}>
            <Text style={{color: 'black'}}>Check Camera</Text>
            <Text style={{color: 'black'}}>{'>'}</Text>
          </TouchableOpacity>
        </View>

        {connectedDevice && (
          <View style={{marginTop: 20, marginHorizontal: 20}}>
            <Button title="Logout" onPress={handleStopAndDisconnect} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

export default App;
