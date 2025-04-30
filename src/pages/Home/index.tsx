/* eslint-disable react-native/no-inline-styles */
/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useCallback, useState} from 'react';

import {
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
function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const navigation: any = useNavigation();
  const route: any = useRoute();

  const [data, setData] = useState('Initial Data');

  // Handle data when coming back from Screen B
  useFocusEffect(
    useCallback(() => {
      if (route.params?.updatedData) {
        // setData(route.params.updatedData);
        console.log('my data', route.params?.updatedData);
      }
    }, [route.params?.updatedData]),
  );

  return (
    <SafeAreaView>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        <Text>{data}</Text>
        <View style={{marginHorizontal: 15}}>
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
      </ScrollView>
    </SafeAreaView>
  );
}

export default App;
