import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import NFCPage from '../pages/NFC';
import HomePage from '../pages/Home';
import QRCodePage from '../pages/QRCode';
import PermissionNearby from '../pages/permissionNearby';
// import Camera from '../pages/Camera';
import BleScreen from '../pages/BleScan';
import ChartScreen from '../pages/Chart';
import RealtimeLocationScreen from '../pages/RealtimeLocation';

// import NewBluettoth from '../pages/newBluetooth';

const RoutePages = () => {
  const Stack = createNativeStackNavigator();

  return (
    <Stack.Navigator initialRouteName="HomePage">
      <Stack.Screen name="HomePage" component={HomePage} />
      <Stack.Screen name="NFC" component={NFCPage} />
      <Stack.Screen name="QRCode" component={QRCodePage} />
      <Stack.Screen name="PermissionNearby" component={PermissionNearby} />

      <Stack.Screen name="BleScreen" component={BleScreen} />

      <Stack.Screen name="ChartScreen" component={ChartScreen} />

      <Stack.Screen
        name="RealtimeLocationScreen"
        component={RealtimeLocationScreen}
      />
    </Stack.Navigator>
  );
};

export default RoutePages;
