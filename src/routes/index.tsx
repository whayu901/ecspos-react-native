import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import NFCPage from '../pages/NFC';
import HomePage from '../pages/Home';
import QRCodePage from '../pages/QRCode';
import PermissionNearby from '../pages/permissionNearby';
import Camera from '../pages/Camera';

const RoutePages = () => {
  const Stack = createNativeStackNavigator();

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="HomePage">
        <Stack.Screen name="HomePage" component={HomePage} />
        <Stack.Screen name="NFC" component={NFCPage} />
        <Stack.Screen name="QRCode" component={QRCodePage} />
        <Stack.Screen name="PermissionNearby" component={PermissionNearby} />
        <Stack.Screen name="Camera" component={Camera} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RoutePages;
