import * as React from 'react';
import {useCallback, useRef, useState} from 'react';
import type {AlertButton} from 'react-native';
import {Alert, Linking, StyleSheet, View, Pressable, Text} from 'react-native';
import type {Code} from 'react-native-vision-camera';
import {useCameraDevice, useCodeScanner} from 'react-native-vision-camera';
import {Camera} from 'react-native-vision-camera';
import {useIsFocused} from '@react-navigation/core';
import {useNavigation} from '@react-navigation/native';

const showCodeAlert = (value: string, onDismissed: () => void): void => {
  const buttons: AlertButton[] = [
    {
      text: 'Close',
      style: 'cancel',
      onPress: onDismissed,
    },
  ];
  if (value.startsWith('http')) {
    buttons.push({
      text: 'Open URL',
      onPress: () => {
        Linking.openURL(value);
        onDismissed();
      },
    });
  }
  Alert.alert('Scanned Code', value, buttons);
};

export default function CodeScannerPage(): React.ReactElement {
  // 1. Use a simple default back camera
  const device = useCameraDevice('back');

  const navigation: any = useNavigation();

  // 2. Only activate Camera when the app is focused and this screen is currently opened
  const isFocused = useIsFocused();

  const isActive = isFocused;

  // 3. (Optional) enable a torch setting
  const [torch, setTorch] = useState(false);

  // 4. On code scanned, we show an aler to the user
  const isShowingAlert = useRef(false);
  const onCodeScanned = useCallback((codes: Code[]) => {
    console.log(`Scanned ${codes.length} codes:`, codes);
    const value = codes[0]?.value;
    if (value == null) {
      return;
    }
    if (isShowingAlert.current) {
      return;
    }
    showCodeAlert(value, () => {
      isShowingAlert.current = false;
    });
    isShowingAlert.current = true;
  }, []);

  // 5. Initialize the Code Scanner to scan QR codes and Barcodes
  const codeScanner = useCodeScanner({
    codeTypes: ['qr', 'ean-13'],
    onCodeScanned: onCodeScanned,
  });

  return (
    <View style={styles.container}>
      {device != null && (
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={isActive}
          codeScanner={codeScanner}
          torch={torch ? 'on' : 'off'}
          enableZoomGesture={true}
        />
      )}

      <View style={styles.rightButtonRow}>
        <Pressable style={styles.button} onPress={() => setTorch(!torch)}>
          <Text>Lampu</Text>
        </Pressable>
      </View>

      {/* Back Button */}
      <Pressable style={styles.backButton} onPress={navigation.goBack}>
        <Text>Kembali</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  button: {
    backgroundColor: 'rgba(140, 140, 140, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightButtonRow: {
    position: 'absolute',
  },
  backButton: {
    position: 'absolute',
  },
});
