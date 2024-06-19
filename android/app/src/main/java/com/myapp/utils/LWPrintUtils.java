package com.myapp.utils;

import android.content.Context;
import android.content.SharedPreferences;

import com.epson.lwprint.sdk.LWPrintPrintSpeed;
import com.epson.lwprint.sdk.LWPrintTapeCut;

import java.util.ArrayList;

public class LWPrintUtils {
    public static final String PREFERENCE_FILE_NAME = "lwprintsample";
    public static final boolean SAVE_VALUES_MODE = false;

    public static final int DEFAULT_COPIES_SETTING = 1;
    public static final int DEFAULT_TAPE_CUT_SETTING = LWPrintTapeCut.EachLabel;
    public static final boolean DEFAULT_HALF_CUT_SETTING = true;
    public static final int DEFAULT_PRINT_SPEED_SETTING = LWPrintPrintSpeed.HighSpeed;
    public static final int DEFAULT_DENSITY_SETTING = 0;

    public static ArrayList<String> loadValues(String arrayName, Context context) {
        SharedPreferences pref = context.getSharedPreferences(
                PREFERENCE_FILE_NAME, Context.MODE_PRIVATE);
        int size = pref.getInt(arrayName + "_size", 0);
        ArrayList<String> formNames = new ArrayList<String>();
        for (int i = 0; i < size; i++) {
            formNames.add(pref.getString(arrayName + "_" + i, null));
        }
        return formNames;
    }

    public static boolean saveValues(ArrayList<String> formNames,
                                     String arrayName, Context context) {
        SharedPreferences pref = context.getSharedPreferences(
                PREFERENCE_FILE_NAME, Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = pref.edit();
        editor.putInt(arrayName + "_size", formNames.size());
        for (int i = 0; i < formNames.size(); i++) {
            editor.putString(arrayName + "_" + i, formNames.get(i));
        }
        return editor.commit();
    }

    public static String getSuffix(String fileName) {
        if (fileName == null)
            return null;
        int point = fileName.lastIndexOf(".");
        if (point != -1) {
            return fileName.substring(point + 1);
        }
        return fileName;
    }

    public static String getPreffix(String fileName) {
        if (fileName == null)
            return null;
        int point = fileName.lastIndexOf(".");
        if (point != -1) {
            return fileName.substring(0, point);
        }
        return fileName;
    }
}
