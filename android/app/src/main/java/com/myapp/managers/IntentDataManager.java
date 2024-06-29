package com.myapp.managers;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;

import android.os.Bundle;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import javax.annotation.Nonnull;

public class IntentDataManager extends ReactContextBaseJavaModule {
    private static final String MODULE_NAME = "IntentDataModule";

    public IntentDataManager(@Nonnull ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Nonnull
    @Override
    public String getName() {
        return MODULE_NAME;
    }

    @ReactMethod
    public void sendIntentData(Bundle extras) {
        WritableMap params = Arguments.createMap();
        if (extras != null) {
            for (String key : extras.keySet()) {
                Object value = extras.get(key);
                if (value instanceof String) {
                    params.putString(key, (String) value);
                } else if (value instanceof Integer) {
                    params.putInt(key, (Integer) value);
                } else if (value instanceof Boolean) {
                    params.putBoolean(key, (Boolean) value);
                } // Add more type checks as needed
            }
            // Emitting an event with the structured object to React Native
            getReactApplicationContext()
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit("onIntentDataReceived", params);
        }
    }
}
