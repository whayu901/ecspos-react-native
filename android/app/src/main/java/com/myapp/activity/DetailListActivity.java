/*
 * SearchActivity.java
 *
 * Project: LW-Print SDK
 *
 * Contains: SearchActivity class
 *           ServiceCallback class
 *
 * Copyright (C) 2013-2019 SEIKO EPSON CORPORATION. All Rights Reserved.
 */
package com.myapp.activity;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.os.Looper;
import android.text.TextUtils;
import android.util.Log;
import android.view.View;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.ListView;

import com.epson.lwprint.sdk.LWPrintDiscoverPrinter;
import com.epson.lwprint.sdk.LWPrintDiscoverPrinterCallback;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.WritableMap;
import com.myapp.MainActivity;
import com.myapp.MainApplication;
import com.myapp.R;
import com.myapp.model.DeviceInfo;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class DetailListActivity extends Activity {

    private static final String SEP = System.lineSeparator();
    private String type = "_pdl-datastream._tcp.local.";

    ServiceCallback listener;
    LWPrintDiscoverPrinter lpPrintDiscoverPrinter;

    android.os.Handler handler = new android.os.Handler(Looper.getMainLooper());

    ListView listView;
    List<String> dataList = new ArrayList<String>();
    List<DeviceInfo> deviceList = new ArrayList<DeviceInfo>();
    ArrayAdapter<String> adapter;

    private ReactApplicationContext reactContext;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        this.reactContext = reactContext;


        setContentView(R.layout.activity_search);

        listView = (ListView) findViewById(R.id.search_list_view);

        adapter = new ArrayAdapter<String>(this,
                android.R.layout.simple_list_item_1, dataList);

        listView.setAdapter(adapter);

        listView.setOnItemClickListener(new AdapterView.OnItemClickListener() {
            @SuppressLint("UnsafeIntentLaunch")
            @Override
            public void onItemClick(AdapterView<?> parent, View view,
                                    int position, long id) {
                ListView lv = (ListView) parent;
                String item = (String) lv.getItemAtPosition(position);
                Intent intent = getIntent();

                intent.putExtra(LWPrintDiscoverPrinter.PRINTER_INFO_NAME,
                        deviceList.get(position).getName() != null ? deviceList.get(position).getName() : "");
                intent.putExtra(LWPrintDiscoverPrinter.PRINTER_INFO_PRODUCT,
                        deviceList.get(position).getProduct() != null ? deviceList.get(position).getProduct() : "");
                intent.putExtra(LWPrintDiscoverPrinter.PRINTER_INFO_USBMDL,
                        deviceList.get(position).getUsbmdl() != null ? deviceList.get(position).getUsbmdl() : "");
                intent.putExtra(LWPrintDiscoverPrinter.PRINTER_INFO_HOST,
                        deviceList.get(position).getHost() != null ? deviceList.get(position).getHost() : "");
                intent.putExtra(LWPrintDiscoverPrinter.PRINTER_INFO_PORT,
                        deviceList.get(position).getPort() != null ? deviceList.get(position).getPort() : "");
                intent.putExtra(LWPrintDiscoverPrinter.PRINTER_INFO_TYPE,
                        deviceList.get(position).getType() != null ? deviceList.get(position).getType() : "");
                intent.putExtra(LWPrintDiscoverPrinter.PRINTER_INFO_DOMAIN,
                        deviceList.get(position).getDomain() != null ? deviceList.get(position).getDomain() : "");
                intent.putExtra(LWPrintDiscoverPrinter.PRINTER_INFO_SERIAL_NUMBER,
                        deviceList.get(position).getMacaddress() != null ? deviceList.get(position).getMacaddress() : "");
                intent.putExtra(LWPrintDiscoverPrinter.PRINTER_INFO_DEVICE_CLASS,
                        deviceList.get(position).getDeviceClass() != null ? deviceList.get(position).getDeviceClass() : "");
                intent.putExtra(LWPrintDiscoverPrinter.PRINTER_INFO_DEVICE_STATUS,
                        deviceList.get(position).getDeviceStatus() != null ? deviceList.get(position).getDeviceStatus() : "");

                setResult(RESULT_OK, intent);

                emitEventToReactNative(intent);


                finish();
            }
        });




        // Create LWPrintDiscoverPrinter
        List<String> typeList = new ArrayList<String>();
        typeList.add(type);

        // Discover printer
        // (1) Search all connection
        lpPrintDiscoverPrinter = new LWPrintDiscoverPrinter(typeList);
        // (2) Search network connection
        //List<String> modelNames = new ArrayList<String>(Arrays.asList("(EPSON LW-1000P)"));
        //EnumSet<LWPrintDiscoverConnectionType> flag = EnumSet.of(LWPrintDiscoverConnectionType.ConnectionTypeNetwork);
        //lpPrintDiscoverPrinter = new LWPrintDiscoverPrinter(typeList, modelNames, flag);
        // (3) Search bluetooth connection
        //EnumSet<LWPrintDiscoverConnectionType> flag = EnumSet.of(LWPrintDiscoverConnectionType.ConnectionTypeBluetooth);
        //lpPrintDiscoverPrinter = new LWPrintDiscoverPrinter(null, null, flag);

        lpPrintDiscoverPrinter.setCallback(listener = new ServiceCallback());
        lpPrintDiscoverPrinter.startDiscover(this);
    }

    private void emitEventToReactNative(Intent intent) {
        ReactInstanceManager reactInstanceManager = getReactInstanceManager();
        if (reactInstanceManager != null) {
            ReactContext reactContext = reactInstanceManager.getCurrentReactContext();
            if (reactContext != null) {
                WritableMap params = Arguments.fromBundle(intent.getExtras());
                reactContext
                        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                        .emit("onIntentDataReceived", params);
            }
        }
    }

    private ReactInstanceManager getReactInstanceManager() {
        MainApplication mainApplication = (MainApplication) getApplication();
        return mainApplication.getReactNativeHost().getReactInstanceManager();
    }

    class ServiceCallback implements LWPrintDiscoverPrinterCallback {

        @Override
        public void onFindPrinter(LWPrintDiscoverPrinter discoverPrinter,
                                  Map<String, String> printer) {

            for (DeviceInfo info : deviceList) {
                if (info.getName().equals(printer.get(LWPrintDiscoverPrinter.PRINTER_INFO_NAME))
                        && info.getHost().equals(printer.get(LWPrintDiscoverPrinter.PRINTER_INFO_HOST))
                        && info.getMacaddress().equals(printer.get(LWPrintDiscoverPrinter.PRINTER_INFO_SERIAL_NUMBER))) {
                    return;
                }
            }

            String type = (String) printer.get(LWPrintDiscoverPrinter.PRINTER_INFO_TYPE);
            String status = (String) printer.get(LWPrintDiscoverPrinter.PRINTER_INFO_DEVICE_STATUS);

            DeviceInfo obj = new DeviceInfo();
            obj.setName((String) printer
                    .get(LWPrintDiscoverPrinter.PRINTER_INFO_NAME));
            obj.setProduct((String) printer
                    .get(LWPrintDiscoverPrinter.PRINTER_INFO_PRODUCT));
            obj.setUsbmdl((String) printer
                    .get(LWPrintDiscoverPrinter.PRINTER_INFO_USBMDL));
            obj.setHost((String) printer
                    .get(LWPrintDiscoverPrinter.PRINTER_INFO_HOST));
            obj.setPort((String) printer
                    .get(LWPrintDiscoverPrinter.PRINTER_INFO_PORT));
            obj.setType(type);
            obj.setDomain((String) printer
                    .get(LWPrintDiscoverPrinter.PRINTER_INFO_DOMAIN));
            obj.setMacaddress((String) printer
                    .get(LWPrintDiscoverPrinter.PRINTER_INFO_SERIAL_NUMBER));
            obj.setDeviceClass((String) printer
                    .get(LWPrintDiscoverPrinter.PRINTER_INFO_DEVICE_CLASS));
            obj.setDeviceStatus(status);

            deviceList.add(obj);

            if (TextUtils.isEmpty(obj.getMacaddress())) {
                // Wi-Fi
                notifyAdd((String) printer
                        .get(LWPrintDiscoverPrinter.PRINTER_INFO_NAME)
                        + SEP
                        + (String) printer
                        .get(LWPrintDiscoverPrinter.PRINTER_INFO_HOST)
                        + SEP
                        + (String) printer
                        .get(LWPrintDiscoverPrinter.PRINTER_INFO_TYPE));
            } else {
                if (TextUtils.isEmpty(status)) {
                    // Bluetooth
                    notifyAdd((String) printer
                            .get(LWPrintDiscoverPrinter.PRINTER_INFO_NAME)
                            + SEP
                            + (String) printer
                            .get(LWPrintDiscoverPrinter.PRINTER_INFO_SERIAL_NUMBER)
                            + SEP
                            + (String) printer
                            .get(LWPrintDiscoverPrinter.PRINTER_INFO_DEVICE_CLASS));
                } else {
                    // Wi-Fi Direct
                    int deviceStatus = -1;
                    try {
                        deviceStatus = Integer.parseInt(status);
                    } catch (NumberFormatException e) {
                    }
                    notifyAdd((String) printer
                            .get(LWPrintDiscoverPrinter.PRINTER_INFO_NAME)
                            + SEP
                            + (String) printer
                            .get(LWPrintDiscoverPrinter.PRINTER_INFO_SERIAL_NUMBER)
                            + SEP
                            + getDeviceStatusForWifiDirect(deviceStatus));
                }
            }
        }


        private String getDeviceStatusForWifiDirect(int deviceStatus) {
            switch (deviceStatus) {
                case 0:
                    return "Connected";
                case 1:
                    return "Invited";
                case 2:
                    return "Failed";
                case 3:
                    return "Available";
                case 4:
                    return "Unavailable";
                default:
                    return "Unknown";
            }
        }

        @Override
        public void onRemovePrinter(LWPrintDiscoverPrinter discoverPrinter,
                                    Map<String, String> printer) {

            String name = (String) printer
                    .get(LWPrintDiscoverPrinter.PRINTER_INFO_NAME);
            int index = -1;
            for (int i = 0; i < deviceList.size(); i++) {
                DeviceInfo info = deviceList.get(i);
                if (name.equals(info.getName())) {
                    index = i;
                    break;
                }
            }
            if (index >= 0) {
                notifyRemove(index);
                deviceList.remove(index);
            }
        }

    }

    private void notifyAdd(final String name) {
        handler.postDelayed(new Runnable() {
            public void run() {
                dataList.add(name);
                adapter.notifyDataSetChanged();
            }
        }, 1);
    }

    private void notifyUpdate(final int index, final String name) {
        handler.postDelayed(new Runnable() {
            public void run() {
                dataList.set(index, name);
                adapter.notifyDataSetChanged();
            }
        }, 1);
    }

    private void notifyRemove(final int index) {
        handler.postDelayed(new Runnable() {
            public void run() {
                dataList.remove(index);
                adapter.notifyDataSetChanged();
            }
        }, 1);
    }

    @Override
    public void onDestroy() {
        if (lpPrintDiscoverPrinter != null) {
            lpPrintDiscoverPrinter.stopDiscover();
            lpPrintDiscoverPrinter = null;
        }
        super.onDestroy();
    }

}
