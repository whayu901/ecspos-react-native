package com.myapp.module;

import android.app.Activity;
import android.content.Intent;
import android.util.Base64;
import android.util.Log;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.myapp.FlirCameraActivity;

import java.io.ByteArrayOutputStream;

public class FlirCameraModule extends ReactContextBaseJavaModule implements ActivityEventListener {

    private static final String TAG = "FlirCameraModule";
    private static final int FLIR_CAMERA_REQUEST = 1001;
    private Promise mPromise;

    public FlirCameraModule(ReactApplicationContext reactContext) {
        super(reactContext);
        reactContext.addActivityEventListener(this);
    }

    @NonNull
    @Override
    public String getName() {
        return "FlirCameraModule";
    }

    @ReactMethod
    public void openFlirCamera(Promise promise) {
        Activity currentActivity = getCurrentActivity();

        if (currentActivity == null) {
            promise.reject("ACTIVITY_NOT_FOUND", "Current activity not found");
            return;
        }

        if (mPromise != null) {
            promise.reject("ALREADY_OPENING", "Camera is already being opened");
            return;
        }

        try {
            mPromise = promise;
            Intent intent = new Intent(currentActivity, FlirCameraActivity.class);
            currentActivity.startActivityForResult(intent, FLIR_CAMERA_REQUEST);
        } catch (Exception e) {
            mPromise = null;
            promise.reject("ERROR", "Failed to open camera: " + e.getMessage());
        }
    }

    @Override
    public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {
        if (requestCode != FLIR_CAMERA_REQUEST) {
            return;
        }

        if (mPromise == null) {
            return;
        }

        if (resultCode == Activity.RESULT_CANCELED) {
            mPromise.reject("CANCELLED", "User cancelled camera");
            mPromise = null;
            return;
        }

        if (resultCode == Activity.RESULT_OK && data != null) {
            try {
                String base64Image = data.getStringExtra("imageBase64");
                double minTemp = data.getDoubleExtra("minTemp", 0.0);
                double maxTemp = data.getDoubleExtra("maxTemp", 0.0);
                String captureMode = data.getStringExtra("captureMode");

                WritableMap result = Arguments.createMap();
                result.putString("imageBase64", base64Image);
                result.putDouble("minTemp", minTemp);
                result.putDouble("maxTemp", maxTemp);
                result.putString("captureMode", captureMode);

                // If multi-point mode, add temperature points
                if (data.hasExtra("pointCount")) {
                    int pointCount = data.getIntExtra("pointCount", 0);
                    WritableMap points = Arguments.createMap();

                    for (int i = 1; i <= pointCount; i++) {
                        double temp = data.getDoubleExtra("point" + i + "Temp", 0.0);
                        points.putDouble("point" + i, temp);
                    }

                    result.putMap("temperaturePoints", points);
                }

                mPromise.resolve(result);
            } catch (Exception e) {
                Log.e(TAG, "Error processing result", e);
                mPromise.reject("PROCESSING_ERROR", "Failed to process camera result: " + e.getMessage());
            }
        } else {
            mPromise.reject("NO_DATA", "No data received from camera");
        }

        mPromise = null;
    }

    @Override
    public void onNewIntent(Intent intent) {
        // Not needed for this implementation
    }
}