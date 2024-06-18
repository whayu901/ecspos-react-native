package com.myapp.managers;

import android.content.Intent;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.myapp.activity.DetailListActivity;

import java.util.Objects;

public class DetailListManager extends ReactContextBaseJavaModule {

    private ReactApplicationContext reactContext;

    public DetailListManager(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @NonNull
    @Override
    public String getName() {
        return "DetailListManager";
    }

    @ReactMethod
    public void showDetailList() {
        // Show detail list
        Intent intent = null;

        intent  = new Intent(getCurrentActivity(), DetailListActivity.class);
        getCurrentActivity().startActivity(intent);

    }
}
