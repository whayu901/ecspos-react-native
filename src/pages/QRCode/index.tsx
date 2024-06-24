import React from 'react';
import {View, TouchableOpacity, Text, StyleSheet} from 'react-native';

import {useQRCode} from './hooks/useQRCode';
import {ModalListDevices} from './components';

const QRCode = () => {
  const {
    // printPaper,
    showModalList,
    setShowModalList,
    pairedDevices,
    boundAddress,
    onPressPairedDeviceBluetooth,
    DetailListManager,
    PrintManager,
  } = useQRCode();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.btnContainer}
        onPress={() => DetailListManager.showDetailList()}>
        <Text style={styles.labelBtn}>Print Test</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.btnContainer, {marginTop: 10, backgroundColor: 'red'}]}
        onPress={() => PrintManager.performPrint()}>
        <Text style={styles.labelBtn}>Print perform</Text>
      </TouchableOpacity>

      <ModalListDevices
        visible={showModalList}
        onClose={() => setShowModalList(false)}
        data={pairedDevices}
        boundAddress={boundAddress}
        onPress={(name, address) => onPressPairedDeviceBluetooth(name, address)}
      />
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
