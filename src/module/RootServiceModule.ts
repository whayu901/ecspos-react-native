import {NativeModules} from 'react-native';

const {RootSecurity} = NativeModules;

const RootSecurityModule = {
  isRooting: async (): Promise<boolean> => RootSecurity.isRooting(),
  isDeveloperMode: async (): Promise<boolean> => RootSecurity.isDeveloperMode(),
  isFridaDetected: async (): Promise<boolean> => RootSecurity.isFridaDetected(),
};

export default RootSecurityModule;
