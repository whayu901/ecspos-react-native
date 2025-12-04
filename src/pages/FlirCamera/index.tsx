// FlirCameraScreen.tsx
import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import FlirCameraModule, {
  FlirCaptureResult,
} from '../../module/FlirCameraModule';

const FlirCameraScreen = () => {
  const [captureResult, setCaptureResult] = useState<FlirCaptureResult | null>(
    null,
  );
  const [loading, setLoading] = useState(false);

  const openFlirCamera = async () => {
    try {
      setLoading(true);
      const result = await FlirCameraModule.openFlirCamera();

      console.log('FLIR Capture Result:', {
        minTemp: result.minTemp,
        maxTemp: result.maxTemp,
        captureMode: result.captureMode,
        imageSize: result.imageBase64.length,
        temperaturePoints: result.temperaturePoints,
      });

      setCaptureResult(result);

      Alert.alert(
        'Capture Success',
        `Min: ${result.minTemp.toFixed(1)}°C\nMax: ${result.maxTemp.toFixed(
          1,
        )}°C\nMode: ${result.captureMode}`,
      );
    } catch (error: any) {
      console.error('FLIR Camera Error:', error);

      if (error.code === 'CANCELLED') {
        Alert.alert('Cancelled', 'Camera capture was cancelled');
      } else {
        Alert.alert('Error', error.message || 'Failed to open FLIR camera');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderTemperaturePoints = () => {
    if (!captureResult?.temperaturePoints) return null;

    const points = Object.entries(captureResult.temperaturePoints).map(
      ([key, temp]) => ({
        name: key.replace('point', 'Point '),
        temp,
      }),
    );

    return (
      <View style={styles.pointsContainer}>
        <Text style={styles.sectionTitle}>Temperature Points:</Text>
        {points.map((point, index) => (
          <Text key={index} style={styles.pointText}>
            {point.name}: {point.temp.toFixed(1)}°C
          </Text>
        ))}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>FLIR Thermal Camera</Text>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={openFlirCamera}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Open FLIR Camera</Text>
          )}
        </TouchableOpacity>

        {captureResult && (
          <View style={styles.resultContainer}>
            <Text style={styles.sectionTitle}>Captured Image:</Text>

            <Image
              source={{
                uri: `data:image/jpeg;base64,${captureResult.imageBase64}`,
              }}
              style={styles.image}
              resizeMode="contain"
            />

            <View style={styles.tempContainer}>
              <View style={styles.tempBox}>
                <Text style={styles.tempLabel}>Min Temp</Text>
                <Text style={styles.tempValue}>
                  {captureResult.minTemp.toFixed(1)}°C
                </Text>
              </View>

              <View style={styles.tempBox}>
                <Text style={styles.tempLabel}>Max Temp</Text>
                <Text style={styles.tempValue}>
                  {captureResult.maxTemp.toFixed(1)}°C
                </Text>
              </View>
            </View>

            <View style={styles.modeContainer}>
              <Text style={styles.modeLabel}>Capture Mode:</Text>
              <Text style={styles.modeValue}>{captureResult.captureMode}</Text>
            </View>

            {renderTemperaturePoints()}

            <TouchableOpacity
              style={[styles.button, styles.clearButton]}
              onPress={() => setCaptureResult(null)}>
              <Text style={styles.buttonText}>Clear Result</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: '#999',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  clearButton: {
    backgroundColor: '#FF3B30',
    marginTop: 15,
  },
  resultContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  image: {
    width: '100%',
    height: 300,
    backgroundColor: '#000',
    borderRadius: 10,
    marginBottom: 15,
  },
  tempContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  tempBox: {
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 10,
    flex: 1,
    marginHorizontal: 5,
  },
  tempLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  tempValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  modeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  modeLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 10,
  },
  modeValue: {
    fontSize: 16,
    color: '#666',
    textTransform: 'capitalize',
  },
  pointsContainer: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  pointText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
});

export default FlirCameraScreen;
