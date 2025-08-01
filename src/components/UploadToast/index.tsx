/* eslint-disable react-hooks/exhaustive-deps */
import React, {useEffect, useRef, useState} from 'react';
import {Animated, Text, View, TouchableOpacity} from 'react-native';
import styles from './styles';
import {useUploadContext} from '../../context/UploadContext'; // adjust path if needed

const {
  toastContainer,
  textRow,
  toastText,
  closeText,
  progressContainer,
  progressBar,
  percentText,
} = styles;

const UploadToast: React.FC = () => {
  const {
    backgroundStatus,
    backgroundProgress,
    backgroundUploadMessage,
    setBackgroundStatus,
  } = useUploadContext();

  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-100)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [localVisible, setLocalVisible] = useState(false);
  const shouldBeVisible = backgroundStatus !== 'idle';

  const animateShow = () => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateHide = () => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setLocalVisible(false);
      setBackgroundStatus('idle'); // Finalize status update in global context
    });
  };

  useEffect(() => {
    if (shouldBeVisible) {
      setLocalVisible(true);
      animateShow();

      if (backgroundStatus === 'success' && backgroundProgress >= 100) {
        timeoutRef.current = setTimeout(() => {
          animateHide();
        }, 5000);
      }
    } else {
      animateHide();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [
    shouldBeVisible,
    backgroundStatus,
    backgroundProgress,
    animateShow,
    animateHide,
  ]);

  const getBackgroundColor = () => {
    if (backgroundStatus === 'success' && backgroundProgress >= 100)
      return '#4CAF50';
    if (backgroundStatus === 'uploading') return '#2196F3';
    if (backgroundStatus === 'error') return '#F44336';
    return '#333';
  };

  const shouldShowClose =
    backgroundStatus === 'success' && backgroundProgress >= 100;

  if (!localVisible) return null;

  return (
    <Animated.View
      style={[
        toastContainer,
        {
          backgroundColor: getBackgroundColor(),
          transform: [{translateY}],
          opacity,
        },
      ]}>
      <View style={textRow}>
        <Text style={toastText}>{backgroundUploadMessage}</Text>
        {shouldShowClose && (
          <TouchableOpacity onPress={animateHide}>
            <Text style={closeText}>×</Text>
          </TouchableOpacity>
        )}
      </View>

      {(backgroundStatus === 'uploading' ||
        backgroundStatus === 'success' ||
        backgroundStatus === 'error') && (
        <>
          <View style={progressContainer}>
            <View style={[progressBar, {width: `${backgroundProgress}%`}]} />
          </View>
          {backgroundStatus === 'uploading' && (
            <Text style={percentText}>{Math.floor(backgroundProgress)}%</Text>
          )}
        </>
      )}
    </Animated.View>
  );
};

export default UploadToast;
