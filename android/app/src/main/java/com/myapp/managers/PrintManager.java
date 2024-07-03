package com.myapp.managers;

import static androidx.core.app.ActivityCompat.startActivityForResult;

import android.app.ProgressDialog;
import android.bluetooth.BluetoothAdapter;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.res.AssetManager;
import android.graphics.Bitmap;
import android.os.Handler;
import android.os.Looper;
import android.os.Message;
import android.util.Log;
import android.widget.Toast;

import androidx.annotation.NonNull;

        import com.epson.lwprint.sdk.LWPrint;
import com.epson.lwprint.sdk.LWPrintCallback;
        import com.epson.lwprint.sdk.LWPrintDataProvider;
import com.epson.lwprint.sdk.LWPrintDiscoverPrinter;
import com.epson.lwprint.sdk.LWPrintParameterKey;

import com.epson.lwprint.sdk.LWPrintPrintingPhase;
        import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
        import com.myapp.model.ContentsData;
import com.myapp.utils.LWPrintContentsXmlParser;
import com.myapp.utils.LWPrintUtils;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Timer;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class PrintManager extends ReactContextBaseJavaModule {

    private ReactApplicationContext reactContext;
    private Handler handler; // Handler for main (UI) thread
    private static final int REQUEST_ENABLE_BT = 0;

    public PrintManager(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        lwPrint = new LWPrint(reactContext);
        lwPrint.setCallback(printListener = new PrinterCallback());

        // ProgressDialog
        this.handler = new Handler(Looper.getMainLooper());

        // Bluetooth
        checkAndEnableBluetooth();

        // Create ProgressDialog
        createProgressDialogForPrinting();


        // Initialize _printerInfo with default values or empty
//        initializePrinterInfo();
    }

    private  final String TAG = getClass().getSimpleName();
    private static final String SUFFIX = ".plist";

    @NonNull
    @Override
    public String getName() {
        return "PrintManager";
    }

    LWPrint lwPrint;
    PrinterCallback printListener;
//    PrintCallback printListener;

    private ArrayList<String> _formNames = null;

    private static final int NOTIFICATION_ID = 1;

    private boolean _processing = false;
    private ProgressDialog progressDialog;
    private ProgressDialog waitDialog;
    private int _jobNumber = 0;
    Timer timer;

    Map<String, String> _printerInfo = null;
    Map<String, Object> _printSettings = null;
    Map<String, Integer> _lwStatus = null;

    private Promise printPromise;

    private void checkAndEnableBluetooth() {
        try {
            BluetoothAdapter btAdapter = BluetoothAdapter.getDefaultAdapter();
            if (btAdapter == null) {
                Toast.makeText(reactContext,
                        "Bluetooth is not available.", Toast.LENGTH_SHORT).show();
            } else {
                if (!btAdapter.isEnabled()) {
                    Intent intent = new Intent(BluetoothAdapter.ACTION_REQUEST_ENABLE);
                    // Use reactContext.startActivityForResult() instead of startActivityForResult()
                    reactContext.startActivityForResult(intent, REQUEST_ENABLE_BT, null);
                }
            }
        } catch (Exception e) {
            Log.d(TAG, "Error checking or enabling Bluetooth", e);
        }
    }


    private void createProgressDialogForPrinting() {
        if (progressDialog == null) {
            handler.post(new Runnable() {
                             @Override
                             public void run() {
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
                             } });

        }
    }

    private void dismissProgressDialog() {
        if (waitDialog != null && waitDialog.isShowing()) {
            handler.post(new Runnable() {
                @Override
                public void run() {
                    progressDialog.dismiss();
                    progressDialog = null;
                    progressDialog.setProgress(0);
                }
            });
        }
    }

    // Method to show wait dialog on UI thread
    private void showWaitDialog() {
        if (waitDialog == null) {
            handler.post(new Runnable() {
                @Override
                public void run() {
                    waitDialog = new ProgressDialog(reactContext);
                    waitDialog.setMessage("Now processing...");
                    waitDialog.setProgressStyle(ProgressDialog.STYLE_SPINNER);
                    waitDialog.setCancelable(false);
                    waitDialog.show();
                }
            });
        }
    }

    // Method to dismiss wait dialog on UI thread
    private void dismissWaitDialog() {
        if (waitDialog != null && waitDialog.isShowing()) {
            handler.post(new Runnable() {
                @Override
                public void run() {
                    waitDialog.dismiss();
                    waitDialog = null;
                }
            });
        }
    }



    private void doCancel() {
        lwPrint.cancelPrint();
    }

    @ReactMethod
    public void updatePrinterInfoFromJson(String jsonStr) {

        try {
            JSONObject jsonObject = new JSONObject(jsonStr);


            // Iterate through keys in the JSON object and put them into _printerInfo
            Iterator<String> keys = jsonObject.keys();


            _printerInfo = new HashMap<String, String>();
            _printerInfo
                    .put(LWPrintDiscoverPrinter.PRINTER_INFO_NAME,
                            jsonObject.optString("name"));
            _printerInfo
                    .put(LWPrintDiscoverPrinter.PRINTER_INFO_PRODUCT,
                            jsonObject.optString("product"));
            _printerInfo
                    .put(LWPrintDiscoverPrinter.PRINTER_INFO_USBMDL,
                            jsonObject.optString("usbmdl"));
            _printerInfo
                    .put(LWPrintDiscoverPrinter.PRINTER_INFO_HOST,
                            jsonObject.optString("host"));
            _printerInfo
                    .put(LWPrintDiscoverPrinter.PRINTER_INFO_PORT,
                            jsonObject.optString("port"));
            _printerInfo
                    .put(LWPrintDiscoverPrinter.PRINTER_INFO_TYPE,
                            jsonObject.optString("type"));
            _printerInfo
                    .put(LWPrintDiscoverPrinter.PRINTER_INFO_DOMAIN,
                            jsonObject.optString("domain"));
            _printerInfo
                    .put(LWPrintDiscoverPrinter.PRINTER_INFO_SERIAL_NUMBER,
                            jsonObject.optString("Serial Number"));
            _printerInfo
                    .put(LWPrintDiscoverPrinter.PRINTER_INFO_DEVICE_CLASS,
                            jsonObject.optString("Device Class"));
            _printerInfo
                    .put(LWPrintDiscoverPrinter.PRINTER_INFO_DEVICE_STATUS,
                            jsonObject.optString("Device Status"));

        } catch (JSONException e) {
            e.printStackTrace();
        }
    }



    @ReactMethod
    public void performPrint(String jsonStringData, Promise promise) {

        try {
            if (_printerInfo == null) {
                Toast.makeText(getReactApplicationContext(), "Printer Tidak Ditemukan", Toast.LENGTH_SHORT).show();

                promise.reject("PRINTER_NOT_FOUND", "Printer not found");
            } else {
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

                    SampleDataProvider sampleDataProvider = new SampleDataProvider("Simple" + SUFFIX, jsonStringData, reactContext);
                    Map<String, Object> printParameter = getStringObjectMap(tapeWidth);

                    lwPrint.doPrint(sampleDataProvider, printParameter);

                    printListener.setPromise(promise);
                });

            }
        } catch (Exception e) {
            promise.reject("PRINT_OUT_ERROR", e);
        }
    }

    @NonNull
    private static Map<String, Object> getStringObjectMap(int tapeWidth) {
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
        return printParameter;
    }

    private void runProgressDialogForPrinting() {
        handler.post(new Runnable() {
            public void run() {
                createProgressDialogForPrinting();
            }
        });
    }

    class SampleDataProvider implements LWPrintDataProvider {

        private static final String DATA_DIR = "template";

        private static final String KEY_PREFFIX = "_CONTENTS";

        private String formName;

        List<Object> _formData = null;
        InputStream _formDataInputStream;

        List<ContentsData> _contentsData = null;

        public SampleDataProvider(String formName, String jsonStringData, ReactContext reactContext) {
            this.formName = formName;
            AssetManager as = reactContext.getResources().getAssets();

            // Contents data
            String contentsFileName = LWPrintUtils.getPreffix(formName)
                    + KEY_PREFFIX + "." +   LWPrintUtils.getSuffix(formName);;
            LWPrintContentsXmlParser xmlParser = new LWPrintContentsXmlParser();
            InputStream in = null;


            // Parse JSON Data

            try {
                JSONObject jsonObject = new JSONObject(jsonStringData);

                in = as.open(DATA_DIR + "/" + contentsFileName);
                _contentsData = xmlParser.parse(in, "UTF-8");

                for (ContentsData data : _contentsData) {
                    HashMap<String, String> elementMap = data.getElementMap();
                    if (elementMap.containsKey("ST-1")) {
                        elementMap.put("ST-1", jsonObject.optString("refId"));
                    }

                    if (elementMap.containsKey("ST-2")) {
                        elementMap.put("ST-2", jsonObject.optString("trial"));
                    }

                    if (elementMap.containsKey("ST-3")) {
                        elementMap.put("ST-3", jsonObject.optString("plot"));
                    }

                    if (elementMap.containsKey("ST-4")) {
                        elementMap.put("ST-4", jsonObject.optString("pokok"));
                    }

                    if (elementMap.containsKey("ST-5")) {
                        elementMap.put("ST-5", jsonObject.optString("sample"));
                    }

                    if (elementMap.containsKey("ST-6")) {
                        elementMap.put("ST-6", jsonObject.optString("typeFruit"));
                    }
                }
            } catch (Exception ignored) {
            } finally {
                if (in != null) {
                    try {
                        in.close();
                    } catch (IOException ignored) {
                    }
                    in = null;
                }
            }
        }

        @Override
        public void startOfPrint() {
            Log.d(TAG, "startOfPrint");
        }

        @Override
        public void endOfPrint() {
            Log.d(TAG, "endOfPrint");
        }

        @Override
        public void startPage() {
            Log.d(TAG, "startPage");
        }

        @Override
        public void endPage() {
            Log.d(TAG, "endPage");
        }

        @Override
        public int getNumberOfPages() {
            if (_contentsData == null) {
                Log.d(TAG, "getNumberOfPages: 0");
                return 0;
            } else {
                Log.d(TAG, "getNumberOfPages: "
                        + _contentsData.size());
                return _contentsData.size();
            }
        }

        @Override
        public InputStream getFormDataForPage(int i) {
            Log.d("Tag Input Stream", "getFormDataForPage: pageIndex="
            );

            if (_formDataInputStream != null) {
                try {
                    _formDataInputStream.close();
                } catch (IOException e) {
                    Log.e("Tag Input Stream", e.toString(), e);
                }
                _formDataInputStream = null;
            }

            ReactApplicationContext reactContext = (ReactApplicationContext) getReactApplicationContext();
            try {
                AssetManager as = reactContext.getResources().getAssets();
                _formDataInputStream = as.open(DATA_DIR + "/" + formName);
                Log.d("Tag Input Stream", "getFormDataForPage: " + formName + "=" + _formDataInputStream.available());
            } catch (IOException e) {
                Log.e("Tag Input Stream", e.toString(), e);
            }

            return _formDataInputStream;
        }

        @Override
        public String getStringContentData(String contentName, int pageIndex) {
            Log.d(TAG,
                    "getStringContentData: contentName=" + contentName
                            + ", pageIndex=" + pageIndex);
            String content = null;
            if (_contentsData != null) {
                int index = pageIndex - 1;
                ContentsData pageDictionary = _contentsData.get(index);
                content = pageDictionary.get(contentName);
            }
            return content;
        }

        @Override
        public Bitmap getBitmapContentData(String s, int i) {
            return null;
        }
    }

    class PrinterCallback implements LWPrintCallback {

        private Promise promise;

        public void setPromise(Promise promise) {
            this.promise = promise;
        }
        @Override
        public void onChangePrintOperationPhase(LWPrint lWPrint, int phase) {
            Log.i(TAG,
                    "onChangePrintOperationPhase: phase=" + phase);
            dismissWaitDialog();
            String jobPhase = "";
            switch (phase) {
                case LWPrintPrintingPhase.Prepare:
                    jobPhase = "PrintingPhasePrepare";
                    break;
                case LWPrintPrintingPhase.Processing:
                    jobPhase = "PrintingPhaseProcessing";
                    break;
                case LWPrintPrintingPhase.WaitingForPrint:
                    jobPhase = "PrintingPhaseWaitingForPrint";
                    break;
                case LWPrintPrintingPhase.Complete:
                    jobPhase = "PrintingPhaseComplete";
                    if (timer != null) {
                        timer.cancel();
                        timer = null;
                    }
                    if (progressDialog != null) {
                        progressDialog.setProgress(0);
                        progressDialog = null;
                    }
                    runProgressDialogForPrinting();


                    boolean isValid = performValidation();
                    if (isValid) {
                        promise.resolve("Print operation completed successfully.");
                    } else {
                        promise.reject("PRINT_VALIDATION_ERROR", "Print validation failed.");
                    }

                    _jobNumber++;
                    break;
                default:
                    if (progressDialog != null) {
                        progressDialog.setProgress(0);
                        progressDialog = null;
                    }
                    runProgressDialogForPrinting();

                    break;
            }
        }

        @Override
        public void onChangeTapeFeedOperationPhase(LWPrint lWPrint, int phase) {
            Log.i(TAG,
                    "onChangeTapeFeedOperationPhase: phase=" + phase);
            String jobPhase = "";
            switch (phase) {
                case LWPrintPrintingPhase.Prepare:
                    jobPhase = "PrintingPhasePrepare";
                    break;
                case LWPrintPrintingPhase.Processing:
                    jobPhase = "PrintingPhaseProcessing";
                    break;
                case LWPrintPrintingPhase.WaitingForPrint:
                    jobPhase = "PrintingPhaseWaitingForPrint";
                    break;
                case LWPrintPrintingPhase.Complete:
                    jobPhase = "PrintingPhaseComplete";
                    waitDialog.dismiss();


                    _processing = false;
                    break;
                default:
                    waitDialog.dismiss();

                    break;
            }
        }

        private boolean performValidation() {
            // Perform your validation logic here
            return true; // Example: Always return true for illustration
        }

        @Override
        public void onAbortPrintOperation(LWPrint lWPrint, int errorStatus,
                                          int deviceStatus) {
            Log.i(TAG,
                    "onAbortPrintOperation: errorStatus=" + errorStatus
                            + ", deviceStatus=" + deviceStatus);
//            waitDialog.dismiss();
//            printComplete(errorStatus, deviceStatus, false);

            if (timer != null) {
                timer.cancel();
                timer = null;
            }
//            if (progressDialog != null) {
//                progressDialog.setProgress(0);
//                progressDialog.dismiss();
//                progressDialog = null;
//            }
            runProgressDialogForPrinting();
            _processing = false;

            String message = "Error Status : " + errorStatus
                    + "\nDevice Status : " + Integer.toHexString(deviceStatus);
            Message msg = new Message();
            msg.obj = message;

        }

        @Override
        public void onSuspendPrintOperation(LWPrint lWPrint, int errorStatus,
                                            int deviceStatus) {
            Log.d(TAG,
                    "onSuspendPrintOperation: errorStatus=" + errorStatus
                            + ", deviceStatus=" + deviceStatus);
//            waitDialog.dismiss();
//            printComplete(errorStatus, deviceStatus, true);
//            if (progressDialog != null) {
//                progressDialog.setProgress(0);
//                progressDialog.dismiss();
//                progressDialog = null;
//            }
            runProgressDialogForPrinting();

            String message = "Error Status : " + errorStatus
                    + "\nDevice Status : " + Integer.toHexString(deviceStatus);
            Message msg = new Message();
            msg.obj = message;

        }

        @Override
        public void onAbortTapeFeedOperation(LWPrint lWPrint, int errorStatus,
                                             int deviceStatus) {
            Log.d(TAG,
                    "onAbortTapeFeedOperation: errorStatus=" + errorStatus
                            + ", deviceStatus=" + deviceStatus);


            if (timer != null) {
                timer.cancel();
                timer = null;
            }
//            waitDialog.dismiss();
            _processing = false;

            String message = "Error Status : " + errorStatus
                    + "\nDevice Status : " + Integer.toHexString(deviceStatus);
            Message msg = new Message();
            msg.obj = message;

        }

    }
    }


