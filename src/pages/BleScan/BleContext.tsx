import React, {createContext, useContext} from 'react';
import useBle from './useBLE'; // ✅ Your path
import {Device} from 'react-native-ble-plx';

export interface BleContextType {
  receivedData: number[];
  receivedDataRef: React.MutableRefObject<number[]>;
  setReceivedData: React.Dispatch<React.SetStateAction<number[]>>;
  // Add anything else your context exposes:
  connectToDevice: (device: any) => Promise<void>;
  _transIndexData?: (dp: any) => void;
  requestPermissions: (value: any) => void;
  scanForDevices: () => void;
  allDevices: Device[];
  isScanningDevice: boolean;
  spectrumeData: any[];
  tempSpectrumeData: any[];
  isLoadingCollectData: any;
  percentage: any;

  connectedDevice: Device | null;
  disconnectDevice: (deviceId: string) => Promise<void>;

  // Monitoring
  monitoredData: number;

  // Data collection
  collectVibrationData: () => Promise<void>;
  stopCollectTmpData: () => Promise<void>;
  resumeCollectData: () => Promise<void>;
  pauseCollectTempData: () => Promise<void>;
  isPaused: boolean;

  // State flags
  isDisableStopBtn: boolean;
  collectValue: string;

  // Shared data

  // Timer utilities
  formatTime: (milliseconds: number) => string;
  runningTime: number;
  MAX_TIME: number;
  widgetFrom: string;
  setWidgetFrom: React.Dispatch<React.SetStateAction<string>>;
}

export const BleContext = createContext<BleContextType | null>(null);

export const BleProvider = ({children}: any) => {
  const ble: any = useBle(); // ✅ Same single instance for your whole app
  return <BleContext.Provider value={ble}>{children}</BleContext.Provider>;
};

export const useBleContext = () => {
  const context = useContext(BleContext);
  if (!context) {
    throw new Error('useBleContext must be inside a BleProvider');
  }
  return context;
};
