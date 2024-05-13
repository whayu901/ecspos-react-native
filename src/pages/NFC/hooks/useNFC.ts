import {useEffect, useState} from 'react';
import {Alert} from 'react-native';
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

  useEffect(() => {
    const checkIsSupported = async () => {
      const deviceIsSupported = await NfcManager.isSupported();

      setHasNfc(deviceIsSupported);
      if (deviceIsSupported) {
        await NfcManager.start();
      }
    };

    checkIsSupported();

    return () => {
      NfcManager.cancelTechnologyRequest();
      if (nfcEventListener) {
        nfcEventListener.remove();
      }
    };
  }, [nfcEventListener]);

  const setupNfcEventListener = () => {
    if (nfcEventListener) {
      nfcEventListener.remove();
    }
    const eventListener = NfcManager.setEventListener(
      NfcEvents.DiscoverTag,
      (tag: any) => {
        const payload = tag.ndefMessage[0].payload;
        const payloadStr = Ndef.text.decodePayload(payload);
        const jsonData = JSON.parse(payloadStr);

        setLoadingRead(false);
        setResult(JSON.stringify(jsonData));
      },
    );
    setNfcEventListener(eventListener);
  };

  const readTag = async () => {
    setLoadingRead(true);
    try {
      await NfcManager.registerTagEvent();
      setupNfcEventListener();
    } catch (error) {
      console.warn(error);
    }
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
  };
};
