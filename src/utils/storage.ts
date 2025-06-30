// storage.ts
import {MMKV} from 'react-native-mmkv';

export const storage = new MMKV();

const STORAGE_KEY = 'vibration_records';

export const saveSessionData = (records: any[]) => {
  try {
    const json = JSON.stringify(records);
    storage.set(STORAGE_KEY, json);
  } catch (e) {
    console.warn('Failed to save session data:', e);
  }
};

export const loadSessionData = (): any[] => {
  try {
    const json = storage.getString(STORAGE_KEY);
    return json ? JSON.parse(json) : [];
  } catch (e) {
    console.warn('Failed to load session data:', e);
    return [];
  }
};

export const clearSessionData = () => {
  storage.delete(STORAGE_KEY);
};

export const clearAllSessionData = () => {
  storage.clearAll();
};
