// FlirCameraModule.ts
import {NativeModules} from 'react-native';

export interface FlirCaptureResult {
  imageBase64: string;
  minTemp: number;
  maxTemp: number;
  captureMode: 'single_point' | 'multi_point' | 'rectangle';
  temperaturePoints?: {
    [key: string]: number; // e.g., "point1": 25.5, "point2": 26.3
  };
}

export interface FlirCameraModule {
  openFlirCamera(): Promise<FlirCaptureResult>;
}

const {FlirCameraModule} = NativeModules;

export default FlirCameraModule as FlirCameraModule;
