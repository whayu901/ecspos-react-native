import {useState} from 'react';
import {launchCamera} from 'react-native-image-picker';
import RNFS from 'react-native-fs';

const useCamera = () => {
  const [selectedImage, setSelectedImage] = useState('');

  const openImagePicker = async () => {
    const imageCacheFolder = `${RNFS.CachesDirectoryPath}/images`;

    // Make sure 'images/' folder exists
    const exists = await RNFS.exists(imageCacheFolder);
    if (!exists) {
      await RNFS.mkdir(imageCacheFolder);
    }

    const result = await launchCamera({
      mediaType: 'photo',
      cameraType: 'back',
      saveToPhotos: false,
      // Save to our cache images folder (important)
    });

    if (result.didCancel) {
      console.log('User cancelled camera');
      return;
    } else if (result.errorCode) {
      console.error('Camera Error: ', result.errorMessage);
      return;
    } else if (result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      console.log('Captured image URI:', asset.uri);
    }
  };

  return {
    openImagePicker,
    selectedImage,
  };
};

export default useCamera;
