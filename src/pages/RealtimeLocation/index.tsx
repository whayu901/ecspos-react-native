import React from 'react';
import {View, Text} from 'react-native';
import {useLatLongCommunity} from '../../hooks/useLocationRealtime';

export default function LocationBadge() {
  const [lat, lon] = useLatLongCommunity();

  return (
    // eslint-disable-next-line react-native/no-inline-styles
    <View style={{padding: 16}}>
      <Text>Latitude: {lat ?? '-'}</Text>
      <Text>Longitude: {lon ?? '-'}</Text>
    </View>
  );
}
