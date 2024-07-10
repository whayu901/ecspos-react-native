import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Modal,
} from 'react-native';

import {useNFC} from './hooks/useNFC';

const NFCScreen = () => {
  const {
    loadingRead,
    loadingWrite,
    hasNfc,
    result,
    readTag,
    writeNFC,
    isModalNFC,
    setModalNFC,
    onDismissReadNFC,
  } = useNFC();

  const onReadTag = () => {
    setModalNFC(true);
    readTag()
      .then(() => setModalNFC(false))
      .catch(() => setModalNFC(false));
  };
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
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              onReadTag();
            }}
            disabled={loadingRead}>
            <Text style={styles.buttonLabel}>Scan NFC</Text>
          </TouchableOpacity>
          {loadingRead && <ActivityIndicator size="large" color="#0000ff" />}
          <TouchableOpacity
            onPress={writeNFC}
            disabled={loadingWrite}
            style={[styles.button, {marginTop: 20, backgroundColor: 'blue'}]}>
            <Text style={styles.buttonLabel}>Write NFC</Text>
          </TouchableOpacity>
          {loadingWrite && <ActivityIndicator size="large" color="green" />}
        </View>
      )}

      <Modal visible={isModalNFC} animationType="slide" transparent>
        <View style={styles.containerModal}>
          <View style={styles.content}>
            <Text style={{color: 'black'}}>Hello world</Text>

            <TouchableOpacity
              onPress={() => {
                setModalNFC(false);
                onDismissReadNFC();
              }}
              style={styles.btnCloseModal}>
              <Text style={{color: 'white', textAlign: 'center', fontSize: 18}}>
                Tutup
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  containerButton: {
    marginHorizontal: 15,
    marginTop: 15,
  },
  containerModal: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  btnCloseModal: {
    backgroundColor: 'red',
    padding: 14,
    borderRadius: 10,
    marginVertical: 10,
  },
  content: {
    backgroundColor: 'white',
    padding: 15,
    borderTopEndRadius: 20,
    borderTopStartRadius: 20,
    justifyContent: 'center',
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
