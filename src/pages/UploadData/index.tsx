import React from 'react';

import {Button} from 'react-native';
import {useUploadContext} from '../../context/UploadContext';

const UploadDataScreen = () => {
  const {
    setBackgroundStatus,
    setBackgroundProgress,
    setBackgroundUploadMessage,
  } = useUploadContext();

  const simulateUpload = () => {
    let p = 0;
    setBackgroundUploadMessage('Uploading...');
    setBackgroundStatus('uploading');

    const interval = setInterval(() => {
      p += 10;
      setBackgroundProgress(p);

      if (p >= 100) {
        console.log('hello world');
        clearInterval(interval);
        setBackgroundUploadMessage('Upload successful!');
        setBackgroundStatus('success');
      }
    }, 300);
  };

  return <Button title="Upload" onPress={simulateUpload} />;
};

export default UploadDataScreen;
