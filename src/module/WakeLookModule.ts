// WakeLock.ts
import {NativeModules} from 'react-native';

const {WakeLock} = NativeModules;

export const acquireWakeLock = async (tag = 'RN::WakeLock') => {
  return WakeLock.acquire(tag);
};

export const releaseWakeLock = async () => {
  return WakeLock.release();
};
