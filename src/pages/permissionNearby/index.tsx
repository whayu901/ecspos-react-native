/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import {usePermissionNearby} from './usePermissionNearby';

const PermissionNearby = () => {
  const {requestBluetoothPermission, onGoback} = usePermissionNearby();
  return (
    <View style={{marginTop: 20, alignSelf: 'center'}}>
      <TouchableOpacity
        onPress={requestBluetoothPermission}
        style={{
          borderWidth: 1,
          paddingHorizontal: 10,
          paddingVertical: 10,
          borderRadius: 10,
        }}>
        <Text style={{color: 'black'}}>Request Permission Nearby</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onGoback}
        style={{
          borderWidth: 1,
          paddingHorizontal: 10,
          paddingVertical: 10,
          borderRadius: 10,
          marginTop: 30,
        }}>
        <Text style={{color: 'black'}}>go Back</Text>
      </TouchableOpacity>
    </View>
  );
};

export default PermissionNearby;
