/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import {
  Modal,
  View,
  FlatList,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

interface ModalListDevicesProps {
  visible: boolean;
  onClose: () => void;
  data: any[];
  boundAddress: string;
  onPress: (name: string, address: string) => void;
}

const ModalListDevices: React.FC<ModalListDevicesProps> = ({
  visible,
  onClose,
  data,
  boundAddress,
  onPress,
}) => {
  const renderItem = ({item}: {item: any}) => {
    return (
      <View style={styles.containerListPairedDevices}>
        <Text style={styles.nameText}>{item.name}</Text>
        <TouchableOpacity
          style={[
            styles.btnConnect,
            {
              backgroundColor: item.address === boundAddress ? 'red' : 'green',
            },
          ]}
          onPress={() => onPress(item.name, item.address)}>
          <Text style={[styles.btnConnectText]}>
            {item.address === boundAddress ? 'Disconnect' : 'Connect'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onDismiss={onClose}>
      <View
        style={{
          flex: 1,
          justifyContent: 'flex-end',
          backgroundColor: 'rgba(0,0,0,0.5)',
        }}>
        <View
          style={{
            backgroundColor: 'white',
            padding: 16,
            borderTopEndRadius: 20,
            borderTopStartRadius: 20,
          }}>
          <View style={{marginBottom: 20}}>
            <Text
              style={{
                color: 'black',
                fontWeight: 'bold',
                fontSize: 19,
                textAlign: 'center',
              }}>
              Pilih Device
            </Text>
          </View>

          <FlatList
            data={data}
            renderItem={renderItem}
            keyExtractor={(item, index) => index.toString()}
          />
          {/* // add button close  */}
          <TouchableOpacity style={styles.btnClose} onPress={onClose}>
            <Text
              style={{
                textAlign: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: 16,
              }}>
              Tutup
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  containerListPairedDevices: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
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
  nameText: {
    color: 'black',
  },
  btnClose: {
    backgroundColor: 'red',
    color: 'white',
    borderRadius: 10,
    width: '100%',
    padding: 10,
    marginTop: 10,
  },
});

export default ModalListDevices;
