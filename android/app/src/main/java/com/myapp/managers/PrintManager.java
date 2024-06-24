package com.myapp.managers;

import static android.app.Activity.RESULT_OK;

import android.app.Activity;
import android.app.ProgressDialog;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.res.AssetManager;
import android.graphics.Bitmap;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.epson.lwprint.sdk.LWPrint;
import com.epson.lwprint.sdk.LWPrintDataProvider;
import com.epson.lwprint.sdk.LWPrintDiscoverPrinter;
import com.epson.lwprint.sdk.LWPrintParameterKey;

import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.myapp.model.ContentsData;
import com.myapp.utils.LWPrintContentsXmlParser;
import com.myapp.utils.LWPrintUtils;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Timer;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class PrintManager extends ReactContextBaseJavaModule {

    private ReactApplicationContext reactContext;

    public PrintManager(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        lwPrint = new LWPrint(reactContext);
//        this.reactContext.addActivityEventListener((ActivityEventListener) this);

    }

    private  final String TAG = getClass().getSimpleName();

    private static final String KEY_FORMDATA = "formdata";
    private static final String SUFFIX = ".plist";

    @NonNull
    @Override
    public String getName() {
        return "PrintManager";
    }

    LWPrint lwPrint;
//    PrintCallback printListener;

    private ArrayList<String> _formNames = null;

    private boolean _processing = false;
    private ProgressDialog progressDialog;
    private ProgressDialog waitDialog;
    private int _jobNumber = 0;
    Timer timer;

    Map<String, String> _printerInfo = null;
    Map<String, Object> _printSettings = null;
    Map<String, Integer> _lwStatus = null;

    private Promise printPromise;

//    android.os.Handler handler = new android.os.Handler();



    private void createProgressDialogForPrinting() {
        if (progressDialog == null) {
            progressDialog = new ProgressDialog(reactContext);
            progressDialog.setMessage("Now printing...");
            progressDialog.setProgressStyle(ProgressDialog.STYLE_HORIZONTAL);
            progressDialog.setCancelable(false);
            progressDialog.setMax(100);
            progressDialog.incrementProgressBy(0);
            progressDialog.setButton(DialogInterface.BUTTON_NEGATIVE, "Cancel",
                    new DialogInterface.OnClickListener() {
                        public void onClick(DialogInterface dialog, int which) {
//                            Logger.d(TAG, "Cancel onClick()");
                            progressDialog.setProgress(0);
                            dialog.cancel();
                        }
                    });
            progressDialog
                    .setOnCancelListener(new DialogInterface.OnCancelListener() {
                        public void onCancel(DialogInterface dialog) {
//                            Logger.d(TAG, "Cancel onCancel()");
                            doCancel();
                        }
                    });
        }
    }



    private void doCancel() {
        lwPrint.cancelPrint();
    }

    @ReactMethod
    public void performPrint() {
        if (_formNames == null) {
            return;
        }
        if (_formNames.size() <= _jobNumber) {
//            printComplete(LWPrintConnectionStatus.NoError, LWPrintStatusError.NoError, false);
            _processing = false;
            return;
        }

        if (_printerInfo == null) {
            return;
        }

//        handler.postDelayed(() -> {
//            if(progressDialog == null) {
//                progressDialog.show();
//            }
//        }, 1);

        Log.i("PrinterStatus", "Printer Status: " + _printerInfo);

        ExecutorService executor = Executors.newSingleThreadExecutor();
        executor.execute(() -> {
            lwPrint.setPrinterInformation(_printerInfo);

            if(_lwStatus == null) {
                _lwStatus = lwPrint.fetchPrinterStatus();
            }

            if (_lwStatus != null) {
                Log.i("PrinterStatus", "Printer Status: " + _lwStatus.toString());
            } else {
                Log.i("PrinterStatus", "Printer Status is null");
            }


            int deviceError = lwPrint.getDeviceErrorFromStatus(_lwStatus);
            int tapeWidth = lwPrint.getTapeWidthFromStatus(_lwStatus);

            SampleDataProvider sampleDataProvider = new SampleDataProvider("Simple" + SUFFIX);
            Map<String, Object> printParameter = new HashMap<String, Object>();

            printParameter.put(LWPrintParameterKey.Copies,
                    LWPrintUtils.DEFAULT_COPIES_SETTING);
            printParameter.put(LWPrintParameterKey.TapeCut,
                    LWPrintUtils.DEFAULT_TAPE_CUT_SETTING);
            printParameter.put(LWPrintParameterKey.HalfCut,
                    LWPrintUtils.DEFAULT_HALF_CUT_SETTING);
            printParameter.put(LWPrintParameterKey.PrintSpeed,
                    LWPrintUtils.DEFAULT_PRINT_SPEED_SETTING);
            printParameter.put(LWPrintParameterKey.Density,
                    LWPrintUtils.DEFAULT_DENSITY_SETTING);
            printParameter.put(LWPrintParameterKey.TapeWidth, tapeWidth);

            lwPrint.doPrint(sampleDataProvider, printParameter);

        });

        if (timer != null) {
            timer.cancel();
            timer = null;
        }
        timer = new Timer();
//        TimerTask task = (new TimerTask() {
//            @Override
//            public void run() {
//                handler.post(new Runnable() {
//                    @Override
//                    public void run() {
//                        float progress = lwPrint.getProgressOfPrint();
//                        if (progressDialog != null) {
//                            progressDialog.setProgress((int) (progress * 100));
//                        }
//                        int printingPage = lwPrint.getPageNumberOfPrinting();
////                        textPrintingPage.setText(String.valueOf(printingPage));
//                    }
//                });
//            }
//        });
//        timer.schedule(task, 1000, 1000);

    }

//    @Override
//    public void onActivityResult(int requestCode, int resultCode, Intent data) {
//        if (printPromise != null) {
//            if (resultCode == RESULT_OK && data != null) {
//                // Prepare data to send back to React Native
//                WritableMap resultMap = Arguments.createMap();
//                resultMap.putString(LWPrintDiscoverPrinter.PRINTER_INFO_NAME, data.getStringExtra(LWPrintDiscoverPrinter.PRINTER_INFO_NAME));
//                resultMap.putString(LWPrintDiscoverPrinter.PRINTER_INFO_PRODUCT, data.getStringExtra(LWPrintDiscoverPrinter.PRINTER_INFO_PRODUCT));
//                resultMap.putString(LWPrintDiscoverPrinter.PRINTER_INFO_USBMDL, data.getStringExtra(LWPrintDiscoverPrinter.PRINTER_INFO_USBMDL));
//                resultMap.putString(LWPrintDiscoverPrinter.PRINTER_INFO_HOST, data.getStringExtra(LWPrintDiscoverPrinter.PRINTER_INFO_HOST));
//                resultMap.putString(LWPrintDiscoverPrinter.PRINTER_INFO_PORT, data.getStringExtra(LWPrintDiscoverPrinter.PRINTER_INFO_PORT));
//                resultMap.putString(LWPrintDiscoverPrinter.PRINTER_INFO_TYPE, data.getStringExtra(LWPrintDiscoverPrinter.PRINTER_INFO_TYPE));
//                resultMap.putString(LWPrintDiscoverPrinter.PRINTER_INFO_DOMAIN, data.getStringExtra(LWPrintDiscoverPrinter.PRINTER_INFO_DOMAIN));
//                resultMap.putString(LWPrintDiscoverPrinter.PRINTER_INFO_SERIAL_NUMBER, data.getStringExtra(LWPrintDiscoverPrinter.PRINTER_INFO_SERIAL_NUMBER));
//                resultMap.putString(LWPrintDiscoverPrinter.PRINTER_INFO_DEVICE_CLASS, data.getStringExtra(LWPrintDiscoverPrinter.PRINTER_INFO_DEVICE_CLASS));
//                resultMap.putString(LWPrintDiscoverPrinter.PRINTER_INFO_DEVICE_STATUS, data.getStringExtra(LWPrintDiscoverPrinter.PRINTER_INFO_DEVICE_STATUS));
//
//                // Resolve the promise with the data
//                printPromise.resolve(resultMap);
//            } else {
//                // Handle failure or cancellation
//                printPromise.reject("PRINT_ACTIVITY_ERROR", "Printing activity canceled or failed");
//            }
//            printPromise = null; // Reset the promise
//
//        }
//    }


    class SampleDataProvider implements LWPrintDataProvider {

        private static final String DATA_DIR = "template";
        private static final String IMAGE_DIR = "Image";
        private static final String KEY_PREFFIX = "_CONTENTS";

        private String formName;

        List<Object> _formData = null;
        InputStream _formDataInputStream;

        List<ContentsData> _contentsData = null;

        public SampleDataProvider(String formName) {
            this.formName = formName;
            AssetManager as = reactContext.getResources().getAssets();

            // Contents data
            String contentsFileName = "Simple"
                    + KEY_PREFFIX + "." + "plist";
            LWPrintContentsXmlParser xmlParser = new LWPrintContentsXmlParser();
            InputStream in = null;
            try {
                in = as.open(DATA_DIR + "/" + contentsFileName);
                _contentsData = xmlParser.parse(in, "UTF-8");
            } catch (Exception e) {
//                Logger.e(TAG, e.toString(), e);
            } finally {
                if (in != null) {
                    try {
                        in.close();
                    } catch (IOException e) {
                    }
                    in = null;
                }
            }
        }

        @Override
        public void startOfPrint() {

        }

        @Override
        public void endOfPrint() {

        }

        @Override
        public void startPage() {

        }

        @Override
        public void endPage() {

        }

        @Override
        public int getNumberOfPages() {
            return 0;
        }

        @Override
        public InputStream getFormDataForPage(int i) {
            return null;
        }

        @Override
        public String getStringContentData(String s, int i) {
            return null;
        }

        @Override
        public Bitmap getBitmapContentData(String s, int i) {
            return null;
        }


//    public void printComplete(int connectionStatus, int status, boolean suspend) {
//        String msg = "";
//        if (connectionStatus == LWPrintConnectionStatus.NoError && status == LWPrintStatusError.NoError) {
//            msg = "Print Complete.";
//        } else {
//            if (suspend) {
//                msg = "Print Error Re-Print [" + Integer.toHexString(status)
//                        + "].";
//            } else {
//                msg = "Print Error [" + Integer.toHexString(status) + "].";
//            }
//        }
//
//        String title = "Notification Print";
//        int iconId = R.drawable.nortification;
//        Intent intent = new Intent(this, getClass());
//        PendingIntent pendingIntent = PendingIntent.getActivity(this, 0, intent, 0);
//        NotificationUtils notificationUtils = new NotificationUtils(this);
//        Notification.Builder builder = notificationUtils.getNotification(pendingIntent, title, msg, iconId, true);
//        notificationUtils.notify(NOTIFICATION_ID, builder);
//    }


    }
}
