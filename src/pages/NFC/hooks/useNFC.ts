import {useEffect, useState} from 'react';
import {Alert} from 'react-native';
import NfcManager, {NfcEvents, Ndef, NfcTech} from 'react-native-nfc-manager';

export const useNFC = () => {
  const [hasNfc, setHasNfc] = useState<any>(null);
  const [result, setResult] = useState('');

  useEffect(() => {
    const checkIsSupported = async () => {
      const deviceIsSupported = await NfcManager.isSupported();
      console.log({deviceIsSupported});

      setHasNfc(deviceIsSupported);
      if (deviceIsSupported) {
        await NfcManager.start();
      }
    };

    checkIsSupported();
  }, []);

  useEffect(() => {
    NfcManager.setEventListener(NfcEvents.DiscoverTag, (tag: any) => {
      console.log(
        'tag found',
        Ndef.uri.decodePayload(tag.ndefMessage[0].payload),
      );

      setResult(Ndef.uri.decodePayload(tag.ndefMessage[0].payload));
    });

    return () => {
      NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
    };
  }, []);

  const readTag = async () => {
    await NfcManager.registerTagEvent();
  };

  const writeNFC = async () => {
    let resultNfc = false;

    try {
      await NfcManager.requestTechnology(NfcTech.Ndef);

      const bytes = Ndef.encodeMessage([Ndef.uriRecord('https://google.com/')]);

      if (bytes) {
        await NfcManager.ndefHandler.writeNdefMessage(bytes);
        resultNfc = true;

        Alert.alert('Success Write NFC');
      }
    } catch (ex) {
      console.warn(ex);
    } finally {
      NfcManager.cancelTechnologyRequest();
    }

    return resultNfc;
  };

  return {
    hasNfc,
    result,

    readTag,
    writeNFC,
  };
};
