import React, {createContext, useContext} from 'react';
import useBle from './useBLE'; // ✅ Your path
import {Device} from 'react-native-ble-plx';

export interface BleContextType {
  receivedData: number[];
  receivedDataRef: React.MutableRefObject<number[]>;
  setReceivedData: React.Dispatch<React.SetStateAction<number[]>>;
  // Add anything else your context exposes:
  connectToDevice?: (device: Device) => Promise<void>;
  _transIndexData?: (dp: any) => void;
  // etc.
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
