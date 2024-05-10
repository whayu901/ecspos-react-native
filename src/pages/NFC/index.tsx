import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';

import {useNFC} from './hooks/useNFC';

const NFCScreen = () => {
  const {hasNfc, result, readTag, writeNFC} = useNFC();
  return (
    <View>
      {!hasNfc ? (
        <View
          style={{
            justifyContent: 'center',
            alignContent: 'center',
            alignItems: 'center',
          }}>
          <Text style={{color: 'black'}}>Handphone is not support NFC</Text>
        </View>
      ) : (
        <View style={styles.containerButton}>
          <View style={{marginBottom: 10}}>
            <Text style={{color: 'black'}}>Your Handphone support NFC</Text>

            {result && <Text style={{color: 'black'}}>{result}</Text>}
          </View>
          <TouchableOpacity style={styles.button} onPress={readTag}>
            <Text style={styles.buttonLabel}>Scan NFC</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={writeNFC}
            style={[styles.button, {marginTop: 20, backgroundColor: 'blue'}]}>
            <Text style={styles.buttonLabel}>Write NFC</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  containerButton: {
    marginHorizontal: 15,
    marginTop: 15,
  },
  button: {
    backgroundColor: 'red',
    color: 'white',
    padding: 10,
    borderRadius: 16,
  },
  buttonLabel: {
    color: 'white',
    textAlign: 'center',
  },
});

export default NFCScreen;
