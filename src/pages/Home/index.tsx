/* eslint-disable react-native/no-inline-styles */
/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';

import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
  Linking,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const navigation: any = useNavigation();

  return (
    <SafeAreaView>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        <View style={{marginHorizontal: 15}}>
          <TouchableOpacity
            onPress={() => Linking.openSettings()}
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
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default App;
