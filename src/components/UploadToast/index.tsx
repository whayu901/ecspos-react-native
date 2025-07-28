import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Animated, Text, View, TouchableOpacity} from 'react-native';
import styles from './styles';

const {
  toastContainer,
  textRow,
  toastText,
  closeText,
  progressContainer,
  progressBar,
  percentText,
} = styles;

interface UploadToastProps {
  backgroundStatus: 'idle' | 'uploading' | 'success' | 'error';
  progress: number;
  message: string;
}

const UploadToast: React.FC<UploadToastProps> = ({
  backgroundStatus,
  progress,
  message,
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-100)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [localVisible, setLocalVisible] = useState(false);

  const shouldBeVisible = backgroundStatus !== 'idle';

  const animateShow = useCallback(() => {
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
  }, [opacity, translateY]);

  const animateHide = useCallback(() => {
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
    });
  }, [opacity, translateY]);

  // control visibility from props only
  useEffect(() => {
    if (shouldBeVisible) {
      setLocalVisible(true);
      animateShow();

      // Auto-close if success and 100%
      if (backgroundStatus === 'success' && progress >= 100) {
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
  }, [shouldBeVisible, backgroundStatus, progress, animateShow, animateHide]);

  const getBackgroundColor = () => {
    if (backgroundStatus === 'success' && progress >= 100) {
      return '#4CAF50';
    }
    if (backgroundStatus === 'uploading') {
      return '#2196F3';
    }
    if (backgroundStatus === 'error') {
      return '#F44336';
    }
    return '#333';
  };

  const shouldShowClose = backgroundStatus === 'success' && progress >= 100;

  if (!localVisible) {
    return null;
  }

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
        <Text style={toastText}>{message}</Text>
        {shouldShowClose && (
          <TouchableOpacity onPress={animateHide}>
            <Text style={closeText}>×</Text>
          </TouchableOpacity>
        )}
      </View>

      {backgroundStatus === 'uploading' && (
        <>
          <View style={progressContainer}>
            <View style={[progressBar, {width: `${progress}%`}]} />
          </View>
          {backgroundStatus === 'uploading' && (
            <Text style={percentText}>{Math.floor(progress)}%</Text>
          )}
        </>
      )}
    </Animated.View>
  );
};

export default UploadToast;
