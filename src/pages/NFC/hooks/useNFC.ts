import {useEffect, useState} from 'react';
import {Alert, AppState} from 'react-native';
import NfcManager, {NfcEvents, Ndef, NfcTech} from 'react-native-nfc-manager';

// Example data for NFC value
const data = [
  {
    name: 'wahyu',
    age: 12,
  },
  {
    name: 'windi',
    age: 14,
  },
];

export const useNFC = () => {
  const [hasNfc, setHasNfc] = useState<any>(null);
  const [result, setResult] = useState('');
  const [loadingRead, setLoadingRead] = useState(false);
  const [loadingWrite, setLoadingWrite] = useState(false);
  const [nfcEventListener, setNfcEventListener] = useState<any>(null);
  const [isModalNFC, setModalNFC] = useState<boolean>(false);

  useEffect(() => {
    const checkIsSupported = async () => {
      const deviceIsSupported = await NfcManager.isEnabled();

      setHasNfc(deviceIsSupported);
      if (deviceIsSupported) {
        await NfcManager.start();
      }
    };

    const subscription: any = AppState.addEventListener(
      'change',
      nextAppState => {
        if (nextAppState === 'active') {
          checkIsSupported();
        }
      },
    );

    checkIsSupported();

    return () => {
      subscription.remove();
      NfcManager.cancelTechnologyRequest();
      if (nfcEventListener) {
        nfcEventListener.remove();
      }
    };
  }, [nfcEventListener]);

  const onDismissReadNFC = () => {
    setLoadingRead(false);
  };

  const readTag = () => {
    setLoadingRead(true);

    return new Promise(async (resolve, reject) => {
      try {
        await NfcManager.registerTagEvent();
        // setupNfcEventListener();
        if (nfcEventListener) {
          nfcEventListener.remove();
        }
        const eventListener = NfcManager.setEventListener(
          NfcEvents.DiscoverTag,
          (tag: any) => {
            if (tag) {
              const payload = tag.ndefMessage[0].payload;
              const payloadStr = Ndef.text.decodePayload(payload);
              const jsonData = JSON.parse(payloadStr);

              setLoadingRead(false);
              setResult(JSON.stringify(jsonData));
              resolve('success');

              setTimeout(() => {
                Alert.alert('Berhasil', 'Berhasil Scan NFC');
              }, 500);
            } else {
              onDismissReadNFC();
            }
          },
        );
        setNfcEventListener(eventListener);
      } catch (error) {
        console.warn(error);
        reject(error);
      }
    });
  };

  const writeNFC = async () => {
    setLoadingWrite(true);

    try {
      await NfcManager.requestTechnology(NfcTech.Ndef);

      const bytes = Ndef.encodeMessage([Ndef.textRecord(JSON.stringify(data))]);

      if (bytes) {
        await NfcManager.ndefHandler.writeNdefMessage(bytes);
        Alert.alert('Success Write NFC');
      }
    } catch (error) {
      console.warn(error);
    } finally {
      setLoadingWrite(false);
      NfcManager.cancelTechnologyRequest();
    }
  };

  return {
    hasNfc,
    result,
    loadingRead,
    loadingWrite,
    readTag,
    writeNFC,
    isModalNFC,
    setModalNFC,
    onDismissReadNFC,
  };
};
