package com.myapp.managers;

import android.content.Context;
import android.os.Build;
import android.provider.Settings;
import android.util.Log;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.scottyab.rootbeer.RootBeer;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.InputStreamReader;
import java.util.Locale;

public class RootSecurityModule extends ReactContextBaseJavaModule {
    private final ReactApplicationContext reactContext;

    public RootSecurityModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return "RootSecurity";
    }

    @ReactMethod
    public void isRooting(Promise promise) {
        try {
            RootBeer rootBeer = new RootBeer(reactContext);
            promise.resolve(rootBeer.isRooted());
        } catch (Exception e) {
            promise.reject("ROOT_CHECK_FAILED", e);
        }
    }

    @ReactMethod
    public void isDeviceRooted(Promise promise) {
        try {
            boolean isRooted =
                    checkSuBinary() ||
                            checkTestKeys() ||
                            detectInitMagisk() ||
                            detectMagiskByMounts() ||
                            detectMagiskProps() ||
                            detectMagiskProcess();

            promise.resolve(isRooted);
        } catch (Exception e) {
            promise.reject("ERROR", e);
        }
    }

    private boolean detectMagiskByMounts() {
        try {
            BufferedReader reader = new BufferedReader(new FileReader("/proc/mounts"));
            String line;
            while ((line = reader.readLine()) != null) {
                if (line.contains("magisk")) return true;
            }
            reader.close();
        } catch (Exception e) {
            return false;
        }
        return false;
    }

    private boolean detectMagiskProps() {
        try {
            Process process = Runtime.getRuntime().exec("getprop");
            BufferedReader in = new BufferedReader(new InputStreamReader(process.getInputStream()));
            String line;
            while ((line = in.readLine()) != null) {
                if (line.contains("magisk") || line.contains("zygisk")) return true;
            }
            in.close();
        } catch (Exception e) {
            return false;
        }
        return false;
    }

    private boolean detectInitMagisk() {
        return new File("/init.magisk.rc").exists();
    }

    private boolean detectMagiskProcess() {
        try {
            Process process = Runtime.getRuntime().exec("ps");
            BufferedReader in = new BufferedReader(new InputStreamReader(process.getInputStream()));
            String line;
            while ((line = in.readLine()) != null) {
                if (line.contains("magisk") || line.contains("zygisk")) return true;
            }
            in.close();
        } catch (Exception e) {
            return false;
        }
        return false;
    }


    private boolean checkSuBinary() {
        String[] paths = {
                "/system/bin/su", "/system/xbin/su", "/sbin/su",
                "/system/sd/xbin/su", "/system/bin/failsafe/su",
                "/data/local/su", "/data/local/bin/su", "/data/local/xbin/su"
        };
        for (String path : paths) {
            if (new File(path).exists()) return true;
        }
        return false;
    }

    private boolean checkTestKeys() {
        return Build.TAGS != null && Build.TAGS.contains("test-keys");
    }

    private boolean checkDangerousProps() {
        String[] dangerousProps = {
                "/system/app/Superuser.apk",
                "/system/app/Magisk.apk",
                "/system/xbin/daemonsu",
                "/system/etc/init.d/99SuperSUDaemon"
        };
        for (String prop : dangerousProps) {
            if (new File(prop).exists()) return true;
        }
        return false;
    }

    private boolean checkMagisk() {
        String[] magiskPaths = {
                "/sbin/magisk", "/init.magisk.rc", "/data/adb/magisk", "/data/adb/modules"
        };
        for (String path : magiskPaths) {
            if (new File(path).exists()) return true;
        }
        return false;
    }

    @ReactMethod
    public void isDeveloperMode(Promise promise) {
        int devMode = Settings.Secure.getInt(
                reactContext.getContentResolver(),
                Settings.Secure.DEVELOPMENT_SETTINGS_ENABLED,
                0
        );
        promise.resolve(devMode == 1);
    }

    @ReactMethod
    public void isFridaDetected(Promise promise) {
        try {
            // 1. Check for suspicious process names
            Process process = Runtime.getRuntime().exec("ps");
            BufferedReader in = new BufferedReader(new InputStreamReader(process.getInputStream()));
            String line;
            while ((line = in.readLine()) != null) {
                line = line.toLowerCase(Locale.ROOT);
                if (line.contains("frida") || line.contains("gadget") || line.contains("gum-js-loop")) {
                    promise.resolve(true);
                    return;
                }
            }

            // 2. Check for known Frida libraries loaded in memory
            String mapsPath = "/proc/" + android.os.Process.myPid() + "/maps";
            process = Runtime.getRuntime().exec("cat " + mapsPath);
            in = new BufferedReader(new InputStreamReader(process.getInputStream()));
            while ((line = in.readLine()) != null) {
                line = line.toLowerCase(Locale.ROOT);
                if (line.contains("frida") || line.contains("gadget") || line.contains("gum-js-loop")) {
                    promise.resolve(true);
                    return;
                }
            }

            // If nothing suspicious found
            promise.resolve(false);
        } catch (Exception e) {
            Log.e("FridaDetection", "Error checking for Frida", e);
            promise.reject("FRIDA_CHECK_FAILED", e);
        }
    }

}
