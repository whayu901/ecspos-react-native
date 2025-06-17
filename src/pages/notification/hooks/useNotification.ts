import notifee, {AndroidImportance, EventType} from '@notifee/react-native';

const useNotification = () => {
  const startForegroundService = async () => {
    await notifee.requestPermission();

    notifee.registerForegroundService(() => {
      return new Promise(() => {
        // Example task subscriber
        notifee.onForegroundEvent(async ({type, detail}: any) => {
          if (
            type === EventType.ACTION_PRESS &&
            detail.pressAction.id === 'stop'
          ) {
            await notifee.stopForegroundService();
          }
        });
      });
    });

    await notifee.createChannel({
      id: 'ble-service',
      name: 'BLE Service',
      importance: AndroidImportance.HIGH,
    });

    await notifee.displayNotification({
      title: 'Collecting Vibration Data',
      body: 'Bluetooth data is being collected in the background.',
      android: {
        channelId: 'ble-service',

        ongoing: true,

        progress: {
          indeterminate: true, // ✅ this enables a spinning loading bar
        },
      },
    });
  };

  return {
    startForegroundService,
  };
};

export default useNotification;
