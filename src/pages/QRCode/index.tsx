import React from 'react';
import {View, TouchableOpacity, Text, StyleSheet} from 'react-native';
import {useQRCode} from './hooks/useQRCode';

const QRCode = () => {
  const {printPaper} = useQRCode();

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.btnContainer} onPress={printPaper}>
        <Text style={styles.labelBtn}>Print Test</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 15,
    marginTop: '50%',
  },
  btnContainer: {
    backgroundColor: 'blue',
    color: 'white',
    borderRadius: 10,
    width: '100%',
    padding: 10,
  },
  labelBtn: {
    color: 'white',
    textAlign: 'center',
  },
});

export default QRCode;
