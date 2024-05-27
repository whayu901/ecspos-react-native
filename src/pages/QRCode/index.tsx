import React from 'react';
import {View, TouchableOpacity, Text, StyleSheet} from 'react-native';
import {useQRCode} from './hooks/useQRCode';

const QRCode = () => {
  const {
    printPaper,
    pairedDevices,
    connectDevice,
    boundAddress,
    disconnectDevice,
  } = useQRCode();

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.btnContainer} onPress={printPaper}>
        <Text style={styles.labelBtn}>Print Test</Text>
      </TouchableOpacity>

      <View>
        {pairedDevices.map((device: any, index) => (
          <View key={index} style={styles.containerListPairedDevices}>
            <Text style={styles.nameText}>{device.name}</Text>
            <TouchableOpacity
              style={[
                styles.btnConnect,
                {
                  backgroundColor:
                    device.address === boundAddress ? 'red' : 'green',
                },
              ]}
              onPress={() =>
                device.address === boundAddress
                  ? disconnectDevice(device.address)
                  : connectDevice(device.name, device.address)
              }>
              <Text style={[styles.btnConnectText]}>
                {device.address === boundAddress ? 'Disconnect' : 'Connect'}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 15,
    marginTop: '20%',
  },
  btnContainer: {
    backgroundColor: 'blue',
    color: 'white',
    borderRadius: 10,
    width: '100%',
    padding: 10,
  },
  btnConnect: {
    backgroundColor: 'green',
    color: 'white',
    borderRadius: 10,
    width: '45%',
    padding: 10,
  },
  btnConnectText: {
    color: 'white',
    textAlign: 'center',
  },
  labelBtn: {
    color: 'white',
    textAlign: 'center',
  },
  nameText: {
    color: 'black',
  },

  containerListPairedDevices: {
    marginTop: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});

export default QRCode;
