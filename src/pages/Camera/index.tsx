import React from 'react';
import {Image, Text, TouchableOpacity, View} from 'react-native';
import useCamera from './hooks/useCamera';

const CameraPage = () => {
  const {openImagePicker, selectedImage} = useCamera();

  return (
    <View>
      <Text>hello wolrd</Text>

      <TouchableOpacity style={{marginTop: 20}} onPress={openImagePicker}>
        <Text>Take Image</Text>
      </TouchableOpacity>

      {selectedImage && (
        <Image
          source={{uri: selectedImage}}
          style={{flex: 1}}
          resizeMode="contain"
        />
      )}
    </View>
  );
};

export default CameraPage;
