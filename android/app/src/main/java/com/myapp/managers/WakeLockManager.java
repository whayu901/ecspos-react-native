package com.myapp.managers;

import android.content.Context;
import android.os.Build;
import android.os.PowerManager;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class WakeLockManager extends ReactContextBaseJavaModule {

    private static final String MODULE_NAME = "WakeLock";
    private PowerManager.WakeLock wakeLock;

    public WakeLockManager(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @NonNull
    @Override
    public String getName() {
        return MODULE_NAME;
    }


    @ReactMethod
    public void acquire(String tag, Promise promise) {
        try {
            if (wakeLock != null && wakeLock.isHeld()) {
                promise.resolve("WakeLock already held");
                return;
            }

            PowerManager pm = null;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                pm = (PowerManager) getReactApplicationContext().getSystemService(Context.POWER_SERVICE);
            }
            assert pm != null;
            wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, tag != null ? tag : "RN::WakeLock");
            wakeLock.acquire(10 * 60 * 1000L /* 10 minutes timeout */);
            promise.resolve("WakeLock acquired");
        } catch (Exception e) {
            promise.reject("WAKE_LOCK_ERROR", e);
        }
    }

    @ReactMethod
    public void release(Promise promise) {
        try {
            if (wakeLock != null && wakeLock.isHeld()) {
                wakeLock.release();
                wakeLock = null;
                promise.resolve("WakeLock released");
            } else {
                promise.resolve("WakeLock not held");
            }
        } catch (Exception e) {
            promise.reject("WAKE_LOCK_RELEASE_ERROR", e);
        }
    }
}
