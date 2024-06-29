package com.myapp.managers;

//import static androidx.appcompat.graphics.drawable.DrawableContainerCompat.Api21Impl.getResources;

import android.app.ProgressDialog;
import android.content.DialogInterface;
        import android.content.res.AssetManager;
import android.graphics.Bitmap;
import android.os.Looper;
import android.os.Message;
import android.util.Log;
import android.widget.Toast;

import androidx.annotation.NonNull;

        import com.epson.lwprint.sdk.LWPrint;
import com.epson.lwprint.sdk.LWPrintCallback;
        import com.epson.lwprint.sdk.LWPrintDataProvider;
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
        lwPrint.setCallback(printListener = new PrinterCallback());
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

    android.os.Handler handler = new android.os.Handler(Looper.getMainLooper());



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

        if (_printerInfo == null) {
            Toast.makeText(getReactApplicationContext(), "Printer not found", Toast.LENGTH_SHORT).show();
        } else {


//        if (_formNames == null) {
//            return;
//        }
//        if (_formNames.size() <= _jobNumber) {
////            printComplete(LWPrintConnectionStatus.NoError, LWPrintStatusError.NoError, false);
//            _processing = false;
//            return;
//        }
//
//        if (_printerInfo == null) {
//            return;
//        }

//        handler.postDelayed(() -> {
//            if(progressDialog == null) {
//                progressDialog.show();
//            }
//        }, 1);


            ExecutorService executor = Executors.newSingleThreadExecutor();
            executor.execute(() -> {
                
                lwPrint.setPrinterInformation(_printerInfo);  
//            Log.i("PrinterStatus", "Printer Status: " + _printerInfo);
//            lwPrint.setPrinterInformation(_printerInfo);

//            if(_lwStatus == null) {
//                _lwStatus = lwPrint.fetchPrinterStatus();
//            }

                if (_lwStatus != null) {
                    Log.i("PrinterStatus", "Printer Status: " + _lwStatus.toString());
                } else {
                    Log.i("PrinterStatus", "Printer Status is null");
                }


                int deviceError = lwPrint.getDeviceErrorFromStatus(_lwStatus);
                int tapeWidth = lwPrint.getTapeWidthFromStatus(_lwStatus);

                SampleDataProvider sampleDataProvider = new SampleDataProvider("Simple" + SUFFIX, reactContext);
                Map<String, Object> printParameter = getStringObjectMap(tapeWidth);

                lwPrint.doPrint(sampleDataProvider, printParameter);

            });

        }

        if (timer != null) {
            timer.cancel();
            timer = null;
        }
        timer = new Timer();

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

        private ReactApplicationContext reactContext;
        private static final String IMAGE_DIR = "Image";
        private static final String KEY_PREFFIX = "_CONTENTS";

        private String formName;

        List<Object> _formData = null;
        InputStream _formDataInputStream;

        List<ContentsData> _contentsData = null;

        public SampleDataProvider(String formName, ReactContext reactContext) {
            this.formName = formName;
            AssetManager as = reactContext.getResources().getAssets();

            // Contents data
            String contentsFileName = formName
                    + KEY_PREFFIX + "." + "plist";
            LWPrintContentsXmlParser xmlParser = new LWPrintContentsXmlParser();
            InputStream in = null;
            try {
                in = as.open(DATA_DIR + "/" + contentsFileName);
                _contentsData = xmlParser.parse(in, "UTF-8");
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
        public String getStringContentData(String s, int i) {
            return null;
        }

        @Override
        public Bitmap getBitmapContentData(String s, int i) {
            return null;
        }
    }

    class PrinterCallback implements LWPrintCallback {
        @Override
        public void onChangePrintOperationPhase(LWPrint lWPrint, int phase) {
            Log.i(TAG,
                    "onChangePrintOperationPhase: phase=" + phase);
            waitDialog.dismiss();
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
                        progressDialog.dismiss();
                        progressDialog = null;
                    }
                    runProgressDialogForPrinting();


                    _jobNumber++;
                    performPrint();
                    break;
                default:
                    if (progressDialog != null) {
                        progressDialog.setProgress(0);
                        progressDialog.dismiss();
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

        @Override
        public void onAbortPrintOperation(LWPrint lWPrint, int errorStatus,
                                          int deviceStatus) {
            Log.i(TAG,
                    "onAbortPrintOperation: errorStatus=" + errorStatus
                            + ", deviceStatus=" + deviceStatus);
            waitDialog.dismiss();
//            printComplete(errorStatus, deviceStatus, false);

            if (timer != null) {
                timer.cancel();
                timer = null;
            }
            if (progressDialog != null) {
                progressDialog.setProgress(0);
                progressDialog.dismiss();
                progressDialog = null;
            }
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
            waitDialog.dismiss();
//            printComplete(errorStatus, deviceStatus, true);
            if (progressDialog != null) {
                progressDialog.setProgress(0);
                progressDialog.dismiss();
                progressDialog = null;
            }
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
            waitDialog.dismiss();
            _processing = false;

            String message = "Error Status : " + errorStatus
                    + "\nDevice Status : " + Integer.toHexString(deviceStatus);
            Message msg = new Message();
            msg.obj = message;

        }

    }
    }


