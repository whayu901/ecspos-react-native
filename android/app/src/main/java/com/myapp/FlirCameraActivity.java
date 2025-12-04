/*
 * Modified FlirCameraActivity with React Native Integration
 * - Returns captured image as Base64
 * - Returns min/max temperatures
 * - Returns temperature points for multi-point mode
 */
package com.myapp;

import static com.myapp.R.*;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.RectF;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Base64;
import android.util.Log;
import android.view.View;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;

import com.flir.thermalsdk.ErrorCode;
import com.flir.thermalsdk.androidsdk.ThermalSdkAndroid;
import com.flir.thermalsdk.androidsdk.live.connectivity.UsbPermissionHandler;
import com.flir.thermalsdk.live.CommunicationInterface;
import com.flir.thermalsdk.live.Identity;
import com.flir.thermalsdk.live.connectivity.ConnectionStatusListener;
import com.flir.thermalsdk.live.discovery.DiscoveredCamera;
import com.flir.thermalsdk.live.discovery.DiscoveryEventListener;
import com.flir.thermalsdk.log.ThermalLog;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * OPTIMIZED MainActivity with React Native Integration
 */
public class FlirCameraActivity extends AppCompatActivity {

    private static final String TAG = "FlirCameraActivity";
    private static final int UI_UPDATE_INTERVAL_MS = 33; // ~20 FPS UI cap

    // Camera handler
    private CameraHandler cameraHandler;
    private Identity connectedIdentity = null;

    // UI components
    private TextView connectionStatus;
    private TextView discoveryStatus;
    private TextView deviceInfo;
    private ImageView msxImage;
    private ImageView photoImage;

    // Frame management
    private volatile Bitmap lastMsxBitmap;
    private volatile Bitmap lastDcBitmap;
    private final AtomicBoolean isUpdatingUI = new AtomicBoolean(false);
    private long lastUiUpdateMs = 0;

    // Capture state
    private Bitmap capturedMsxBitmap;
    private CameraHandler.TempFrameSnapshot capturedTempSnapshot;
    private final AtomicBoolean isCapturing = new AtomicBoolean(false);

    // USB permission handler
    private final UsbPermissionHandler usbPermissionHandler = new UsbPermissionHandler();

    // UI Handler
    private final Handler uiHandler = new Handler(Looper.getMainLooper());
    private final Runnable updateUIRunnable = this::updateUIWithLatestFrame;

    private SelectionOverlay selectionOverlay;
    private MultiPointOverlay multiPointOverlay;

    // React Native result data
    private String capturedBase64Image = null;
    private double capturedMinTemp = 0.0;
    private double capturedMaxTemp = 0.0;
    private int captureMode = MODE_RECT;
    private ArrayList<MultiPointOverlay.PointData> capturedPoints = null;

    private static final int MODE_RECT = 1;
    private static final int MODE_POINT = 2;
    private static final int MODE_POINT_MULTI = 3;
    private int currentMode = MODE_RECT;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(layout.flir_camera);

        // Initialize Thermal SDK
        ThermalSdkAndroid.init(getApplicationContext(), ThermalLog.LogLevel.WARNING);

        cameraHandler = new CameraHandler();
        setupViews();

        showSDKversion(ThermalSdkAndroid.getVersion());
        showSDKCommitHash(ThermalSdkAndroid.getCommitHash());
    }

    @Override
    protected void onStop() {
        super.onStop();
        Log.d(TAG, "onStop() - Disconnecting camera");
        disconnect();
        uiHandler.removeCallbacks(updateUIRunnable);
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        recycleBitmaps();
    }

    @Override
    public void onBackPressed() {
        // Return cancelled result when back button is pressed
        setResult(Activity.RESULT_CANCELED);
        super.onBackPressed();
    }

    // ==================== Button Click Handlers ====================

    public void startDiscovery(View view) {
        startDiscovery();
    }

    public void stopDiscovery(View view) {
        stopDiscovery();
    }

    public void connectFlirOne(View view) {
        connect(cameraHandler.getFlirOne());
    }

    public void connectSimulatorOne(View view) {
        connect(cameraHandler.getCppEmulator());
    }

    public void connectSimulatorTwo(View view) {
        connect(cameraHandler.getFlirOneEmulator());
    }

    public void disconnect(View view) {
        disconnect();
    }

    public void performNuc(View view) {
        cameraHandler.performNuc();
    }

    /**
     * OPTIMIZED frame capture with thermal data snapshot
     */
    public void captureFrame(View view) {
        if (lastMsxBitmap == null) {
            showMessage.show("No frame available yet");
            return;
        }

        if (!isCapturing.compareAndSet(false, true)) {
            showMessage.show("Capture already in progress...");
            return;
        }

        showMessage.show("Capturing thermal data...");

        new Thread(() -> {
            try {
                // 1. Copy the displayed MSX bitmap
                Bitmap msxCopy = copyBitmap(lastMsxBitmap);

                // 2. Build temperature snapshot
                CameraHandler.TempFrameSnapshot tempSnap = cameraHandler.buildTempSnapshotSync();

                // 3. Get min/max temperatures
                double minC = cameraHandler.getLastMinTempC();
                double maxC = cameraHandler.getLastMaxTempC();

                // Store for dialog
                capturedMsxBitmap = msxCopy;
                capturedTempSnapshot = tempSnap;
                capturedMinTemp = minC;
                capturedMaxTemp = maxC;

                // 4. Show preview dialog
                runOnUiThread(() -> {
                    if (tempSnap != null) {
                        showCapturePopupWithRoi(msxCopy, minC, maxC, tempSnap);
                    } else {
                        showMessage.show("Capture failed - thermal data unavailable");
                    }
                });

            } catch (Exception e) {
                Log.e(TAG, "Capture error", e);
                runOnUiThread(() -> showMessage.show("Capture failed: " + e.getMessage()));
            } finally {
                isCapturing.set(false);
            }
        }).start();
    }

    // ==================== Camera Connection ====================

    private void connect(Identity identity) {
        cameraHandler.stopDiscovery(discoveryStatusListener);

        if (connectedIdentity != null) {
            showMessage.show("Already connected to a camera");
            return;
        }

        if (identity == null) {
            showMessage.show("No camera available to connect");
            return;
        }

        connectedIdentity = identity;
        updateConnectionText(identity, "CONNECTING");

        if (UsbPermissionHandler.isFlirOne(identity)) {
            usbPermissionHandler.requestFlirOnePermisson(identity, this, permissionListener);
        } else {
            doConnect(identity);
        }
    }

    private void doConnect(Identity identity) {
        new Thread(() -> {
            try {
                cameraHandler.connect(identity, connectionStatusListener);

                runOnUiThread(() -> {
                    updateConnectionText(identity, "CONNECTED");
                    deviceInfo.setText(cameraHandler.getDeviceInfo());
                });

                cameraHandler.startStream(streamDataListener);

            } catch (IOException e) {
                Log.e(TAG, "Connection failed", e);
                runOnUiThread(() -> {
                    updateConnectionText(identity, "DISCONNECTED");
                    showMessage.show("Connection failed: " + e.getMessage());
                });
            }
        }).start();
    }

    private void disconnect() {
        if (connectedIdentity == null) return;

        updateConnectionText(connectedIdentity, "DISCONNECTING");
        connectedIdentity = null;

        new Thread(() -> {
            cameraHandler.disconnect();
            runOnUiThread(() -> {
                updateConnectionText(null, "DISCONNECTED");
                recycleBitmaps();
            });
        }).start();
    }

    // ==================== Camera Discovery ====================

    private void startDiscovery() {
        cameraHandler.startDiscovery(cameraDiscoveryListener, discoveryStatusListener);
    }

    private void stopDiscovery() {
        cameraHandler.stopDiscovery(discoveryStatusListener);
    }

    // ==================== Stream Data Handling ====================

    private final CameraHandler.StreamDataListener streamDataListener = new CameraHandler.StreamDataListener() {
        private int skipCounter = 0;

        @Override
        public void images(Bitmap msxBitmap, Bitmap dcBitmap) {
            skipCounter++;
            if (skipCounter % 2 != 0) {
                return;
            }

            lastMsxBitmap = msxBitmap;
            lastDcBitmap = dcBitmap;

            long now = System.currentTimeMillis();
            if (now - lastUiUpdateMs >= UI_UPDATE_INTERVAL_MS) {
                lastUiUpdateMs = now;
                uiHandler.removeCallbacks(updateUIRunnable);
                uiHandler.post(updateUIRunnable);
            }
        }
    };

    /**
     * Capture a view (including overlays) as a bitmap
     */
    private Bitmap captureViewAsBitmap(View view, TextView statsText) {
        try {
            view.measure(
                    View.MeasureSpec.makeMeasureSpec(view.getWidth(), View.MeasureSpec.EXACTLY),
                    View.MeasureSpec.makeMeasureSpec(view.getHeight(), View.MeasureSpec.EXACTLY)
            );
            view.layout(view.getLeft(), view.getTop(), view.getRight(), view.getBottom());

            Bitmap bitmap = Bitmap.createBitmap(
                    view.getWidth(),
                    view.getHeight(),
                    Bitmap.Config.ARGB_8888
            );

            Canvas canvas = new Canvas(bitmap);
            view.draw(canvas);

            if (statsText != null && statsText.getText() != null) {
                String tempText = statsText.getText().toString();

                Paint textPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
                textPaint.setColor(0xFFFFFFFF);
                textPaint.setTextSize(40f);
                textPaint.setShadowLayer(6f, 0f, 0f, 0xFF000000);
                textPaint.setTypeface(android.graphics.Typeface.DEFAULT_BOLD);

                Paint bgPaint = new Paint();
                bgPaint.setColor(0xAA000000);
                bgPaint.setStyle(Paint.Style.FILL);

                android.graphics.Rect textBounds = new android.graphics.Rect();
                textPaint.getTextBounds(tempText, 0, tempText.length(), textBounds);

                float padding = 20f;
                float textX = padding;
                float textY = padding + textBounds.height();

                canvas.drawRect(
                        textX - padding/2,
                        textY - textBounds.height() - padding/2,
                        textX + textBounds.width() + padding/2,
                        textY + padding/2,
                        bgPaint
                );

                canvas.drawText(tempText, textX, textY, textPaint);
            }

            return bitmap;

        } catch (Exception e) {
            Log.e(TAG, "View capture failed", e);
            return null;
        }
    }

    /**
     * Convert bitmap to Base64 string
     */
    /**
     * Convert bitmap to Base64 string (optimized)
     */
    private String bitmapToBase64(Bitmap bitmap) {
        ByteArrayOutputStream byteArrayOutputStream = null;
        try {
            byteArrayOutputStream = new ByteArrayOutputStream(bitmap.getWidth() * bitmap.getHeight() / 2);

            // Compress to JPEG with 85% quality (good balance of size/quality)
            boolean success = bitmap.compress(Bitmap.CompressFormat.JPEG, 85, byteArrayOutputStream);

            if (!success) {
                Log.e(TAG, "Bitmap compression failed");
                return null;
            }

            byte[] byteArray = byteArrayOutputStream.toByteArray();
            Log.d(TAG, "Compressed bitmap size: " + byteArray.length + " bytes");

            return Base64.encodeToString(byteArray, Base64.NO_WRAP);

        } catch (OutOfMemoryError e) {
            Log.e(TAG, "Out of memory during Base64 encoding", e);
            return null;
        } catch (Exception e) {
            Log.e(TAG, "Failed to convert bitmap to base64", e);
            return null;
        } finally {
            if (byteArrayOutputStream != null) {
                try {
                    byteArrayOutputStream.close();
                } catch (IOException e) {
                    Log.e(TAG, "Failed to close stream", e);
                }
            }
        }
    }

    /**
     * Update UI with latest frame
     */
    private void updateUIWithLatestFrame() {
        if (!isUpdatingUI.compareAndSet(false, true)) {
            return;
        }

        try {
            Bitmap msx = lastMsxBitmap;
            Bitmap dc = lastDcBitmap;

            if (msx != null) {
                msxImage.setImageBitmap(msx);
            }

            if (dc != null) {
                photoImage.setImageBitmap(dc);
            }
        } finally {
            isUpdatingUI.set(false);
        }
    }

    // ==================== Capture Preview Dialog ====================

    private void showCapturePopupWithRoi(@NonNull Bitmap bitmap, double minC, double maxC,
                                         @NonNull CameraHandler.TempFrameSnapshot snap) {

        View dialogView = getLayoutInflater().inflate(R.layout.dialog_captured_preview, null);
        ImageView imageView = dialogView.findViewById(R.id.capturedImageView);
        TextView statsText = dialogView.findViewById(R.id.tempStatsText);
        Button closeBtn = dialogView.findViewById(R.id.closeDialogBtn);
        FrameLayout container = dialogView.findViewById(R.id.previewContainer);
        Spinner modeSpinner = dialogView.findViewById(R.id.modeSpinner);
        LinearLayout countRow = dialogView.findViewById(R.id.countRow);
        Spinner countSpinner = dialogView.findViewById(R.id.countSpinner);
        Button saveBtn = dialogView.findViewById(R.id.saveDialogBtn);

        imageView.setScaleType(ImageView.ScaleType.FIT_CENTER);
        imageView.setImageBitmap(bitmap);

        statsText.setText(String.format(java.util.Locale.US,
                "High: %.1f°C   Low: %.1f°C", maxC, minC));

        selectionOverlay = new SelectionOverlay(this);
        container.addView(selectionOverlay, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT));

        ArrayAdapter<CharSequence> countAdapter = ArrayAdapter.createFromResource(
                this, R.array.point_counts, android.R.layout.simple_spinner_dropdown_item);
        countSpinner.setAdapter(countAdapter);
        countSpinner.setSelection(0);

        ArrayAdapter<CharSequence> adapter = ArrayAdapter.createFromResource(
                this, R.array.modes_array, android.R.layout.simple_spinner_dropdown_item);
        modeSpinner.setAdapter(adapter);
        modeSpinner.setSelection(2);

        modeSpinner.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(AdapterView<?> parent, View view, int pos, long id) {
                if (pos == 0) {
                    enableSinglePoint(container, statsText, imageView, bitmap, snap);
                } else if (pos == 1) {
                    countRow.setVisibility(View.VISIBLE);
                    int maxPoints = Integer.parseInt((String) countSpinner.getSelectedItem());
                    enableMultiPoint(container, statsText, imageView, bitmap, snap, maxPoints);
                } else {
                    enableRectangleMode(container, statsText, imageView, bitmap, snap);
                }
            }

            @Override public void onNothingSelected(AdapterView<?> parent) {}
        });

        countSpinner.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override public void onItemSelected(AdapterView<?> parent, View view, int i, long id) {
                if (currentMode == MODE_POINT_MULTI) {
                    int maxPoints = Integer.parseInt((String) countSpinner.getSelectedItem());
                    if (multiPointOverlay != null) {
                        multiPointOverlay.setMaxPoints(maxPoints);
                        enableMultiPoint(container, statsText, imageView, bitmap, snap, maxPoints);
                    }
                }
            }
            @Override public void onNothingSelected(AdapterView<?> parent) {}
        });

        imageView.post(() -> {
            RectF imgRect = getDisplayedImageRect(imageView);
            float w = imgRect.width() * 0.4f;
            float h = imgRect.height() * 0.4f;
            float left = imgRect.centerX() - w / 2f;
            float top = imgRect.centerY() - h / 2f;
            selectionOverlay.setBounds(new RectF(left, top, left + w, top + h));
            updateRoiStats(statsText, selectionOverlay.getBounds(), imageView, bitmap, snap);
        });

        AlertDialog dialog = new AlertDialog.Builder(this)
                .setView(dialogView)
                .setCancelable(true)
                .create();

        if (dialog.getWindow() != null) {
            dialog.getWindow().setLayout(
                    android.view.ViewGroup.LayoutParams.MATCH_PARENT,
                    android.view.ViewGroup.LayoutParams.MATCH_PARENT
            );
            dialog.getWindow().setBackgroundDrawableResource(android.R.color.transparent);
        }

        closeBtn.setOnClickListener(v -> dialog.dismiss());

        // Modified save button to return to React Native
        saveBtn.setOnClickListener(v -> {
            saveBtn.setEnabled(false);
            saveBtn.setText("Processing...");

            // Calculate temperatures FIRST on UI thread (fast!)
            double actualMinTemp = minC;
            double actualMaxTemp = maxC;
            ArrayList<MultiPointOverlay.PointData> points = null;

            if (currentMode == MODE_RECT && selectionOverlay != null) {
                // Rectangle mode: Get min/max from ROI
                RectF bounds = selectionOverlay.getBounds();
                double[] temps = calculateRoiMinMax(bounds, imageView, bitmap, snap);
                if (temps != null) {
                    actualMinTemp = temps[0];
                    actualMaxTemp = temps[1];
                }
            } else if (currentMode == MODE_POINT && selectionOverlay != null) {
                // Single point mode: Get temperature at point
                RectF bounds = selectionOverlay.getBounds();
                double temp = getPointTemp(imageView, bitmap, snap,
                        bounds.centerX(), bounds.centerY());
                if (Double.isFinite(temp)) {
                    actualMinTemp = temp;
                    actualMaxTemp = temp;
                }
            } else if (currentMode == MODE_POINT_MULTI && multiPointOverlay != null) {
                // Multi-point mode: Get min/max from all points
                points = multiPointOverlay.getPoints();
                if (points != null && !points.isEmpty()) {
                    double minPoint = Double.POSITIVE_INFINITY;
                    double maxPoint = Double.NEGATIVE_INFINITY;
                    for (MultiPointOverlay.PointData p : points) {
                        if (Double.isFinite(p.temp)) {
                            if (p.temp < minPoint) minPoint = p.temp;
                            if (p.temp > maxPoint) maxPoint = p.temp;
                        }
                    }
                    if (Double.isFinite(minPoint) && Double.isFinite(maxPoint)) {
                        actualMinTemp = minPoint;
                        actualMaxTemp = maxPoint;
                    }
                }
            }

            // Store final values for background thread
            final double finalMinTemp = actualMinTemp;
            final double finalMaxTemp = actualMaxTemp;
            final ArrayList<MultiPointOverlay.PointData> finalPoints = points;

            Log.d(TAG, "Starting capture with temperatures - Min: " + finalMinTemp + ", Max: " + finalMaxTemp);

            // NOW do the slow work (bitmap capture & Base64) on background thread
            new Thread(() -> {
                try {
                    Bitmap capturedWithOverlay = captureViewAsBitmap(container, statsText);

                    if (capturedWithOverlay != null) {
                        // Convert to Base64 (slow operation)
                        String base64 = bitmapToBase64(capturedWithOverlay);

                        if (base64 != null) {
                            Log.d(TAG, "Base64 encoding complete, length: " + base64.length());

                            runOnUiThread(() -> {
                                // Prepare result intent
                                Intent resultIntent = new Intent();
                                resultIntent.putExtra("imageBase64", base64);
                                resultIntent.putExtra("minTemp", finalMinTemp);
                                resultIntent.putExtra("maxTemp", finalMaxTemp);

                                String modeString = currentMode == MODE_POINT ? "single_point" :
                                        currentMode == MODE_POINT_MULTI ? "multi_point" : "rectangle";
                                resultIntent.putExtra("captureMode", modeString);

                                // Add point temperatures for multi-point mode
                                if (currentMode == MODE_POINT_MULTI && finalPoints != null && !finalPoints.isEmpty()) {
                                    resultIntent.putExtra("pointCount", finalPoints.size());
                                    for (int i = 0; i < finalPoints.size(); i++) {
                                        MultiPointOverlay.PointData p = finalPoints.get(i);
                                        resultIntent.putExtra("point" + (i + 1) + "Temp", p.temp);
                                    }
                                }

                                Log.d(TAG, "Setting result with data");

                                // Set result FIRST
                                setResult(Activity.RESULT_OK, resultIntent);

                                // Close dialog
                                dialog.dismiss();

                                // Finish activity
                                Log.d(TAG, "Finishing activity");
                                finish();
                            });
                        } else {
                            runOnUiThread(() -> {
                                showMessage.show("Failed to encode image");
                                saveBtn.setEnabled(true);
                                saveBtn.setText("Save Image");
                            });
                        }
                    } else {
                        runOnUiThread(() -> {
                            showMessage.show("Capture failed");
                            saveBtn.setEnabled(true);
                            saveBtn.setText("Save Image");
                        });
                    }
                } catch (Exception e) {
                    Log.e(TAG, "Save error", e);
                    runOnUiThread(() -> {
                        showMessage.show("Save failed: " + e.getMessage());
                        saveBtn.setEnabled(true);
                        saveBtn.setText("Save Image");
                    });
                }
            }).start();
        });

        dialog.show();
    }

    // ==================== ROI and Temperature Calculations ====================

    /**
     * Calculate min/max temperatures for a given ROI
     * @return double[] {minTemp, maxTemp} or null if calculation fails
     */
    private double[] calculateRoiMinMax(RectF roiView, ImageView iv, Bitmap bmp,
                                        CameraHandler.TempFrameSnapshot snap) {
        try {
            if (bmp == null || snap == null || snap.tempC == null) {
                return null;
            }

            RectF imgRect = getDisplayedImageRect(iv);
            if (imgRect.width() <= 1f || imgRect.height() <= 1f) {
                return null;
            }

            float bx0 = Math.max(0, (Math.max(roiView.left, imgRect.left) - imgRect.left) * (bmp.getWidth() / imgRect.width()));
            float by0 = Math.max(0, (Math.max(roiView.top, imgRect.top) - imgRect.top) * (bmp.getHeight() / imgRect.height()));
            float bx1 = Math.min(bmp.getWidth(), (Math.min(roiView.right, imgRect.right) - imgRect.left) * (bmp.getWidth() / imgRect.width()));
            float by1 = Math.min(bmp.getHeight(), (Math.min(roiView.bottom, imgRect.bottom) - imgRect.top) * (bmp.getHeight() / imgRect.height()));

            float tx0f = bx0 * ((float) snap.w / bmp.getWidth());
            float ty0f = by0 * ((float) snap.h / bmp.getHeight());
            float tx1f = bx1 * ((float) snap.w / bmp.getWidth());
            float ty1f = by1 * ((float) snap.h / bmp.getHeight());

            int tx0 = clamp((int) Math.floor(tx0f), 0, snap.w - 1);
            int ty0 = clamp((int) Math.floor(ty0f), 0, snap.h - 1);
            int tx1 = clamp((int) Math.ceil(tx1f), 1, snap.w);
            int ty1 = clamp((int) Math.ceil(ty1f), 1, snap.h);

            if (tx1 - tx0 < 1) { tx0 = clamp(tx0 - 1, 0, snap.w - 1); tx1 = clamp(tx0 + 2, 1, snap.w); }
            if (ty1 - ty0 < 1) { ty0 = clamp(ty0 - 1, 0, snap.h - 1); ty1 = clamp(ty0 + 2, 1, snap.h); }

            float[] t = snap.tempC;
            double minC = Double.POSITIVE_INFINITY;
            double maxC = Double.NEGATIVE_INFINITY;

            for (int y = ty0; y < ty1; y++) {
                int row = y * snap.w;
                for (int x = tx0; x < tx1; x++) {
                    float v = t[row + x];
                    if (Float.isFinite(v)) {
                        if (v < minC) minC = v;
                        if (v > maxC) maxC = v;
                    }
                }
            }

            if (Double.isFinite(minC) && Double.isFinite(maxC)) {
                return new double[]{minC, maxC};
            }

            return null;
        } catch (Exception e) {
            Log.e(TAG, "ROI calculation error", e);
            return null;
        }
    }

    // ==================== ROI and Temperature Calculations (UI Update) ====================

    private void updateRoiStats(TextView statsText, RectF roiView, ImageView iv,
                                Bitmap bmp, CameraHandler.TempFrameSnapshot snap) {
        try {
            if (bmp == null || snap == null || snap.tempC == null) {
                statsText.setText("High: --°C   Low: --°C");
                return;
            }

            RectF imgRect = getDisplayedImageRect(iv);
            if (imgRect.width() <= 1f || imgRect.height() <= 1f) {
                statsText.setText("High: --°C   Low: --°C");
                return;
            }

            float bx0 = Math.max(0, (Math.max(roiView.left, imgRect.left) - imgRect.left) * (bmp.getWidth() / imgRect.width()));
            float by0 = Math.max(0, (Math.max(roiView.top, imgRect.top) - imgRect.top) * (bmp.getHeight() / imgRect.height()));
            float bx1 = Math.min(bmp.getWidth(), (Math.min(roiView.right, imgRect.right) - imgRect.left) * (bmp.getWidth() / imgRect.width()));
            float by1 = Math.min(bmp.getHeight(), (Math.min(roiView.bottom, imgRect.bottom) - imgRect.top) * (bmp.getHeight() / imgRect.height()));

            float tx0f = bx0 * ((float) snap.w / bmp.getWidth());
            float ty0f = by0 * ((float) snap.h / bmp.getHeight());
            float tx1f = bx1 * ((float) snap.w / bmp.getWidth());
            float ty1f = by1 * ((float) snap.h / bmp.getHeight());

            int tx0 = clamp((int) Math.floor(tx0f), 0, snap.w - 1);
            int ty0 = clamp((int) Math.floor(ty0f), 0, snap.h - 1);
            int tx1 = clamp((int) Math.ceil(tx1f), 1, snap.w);
            int ty1 = clamp((int) Math.ceil(ty1f), 1, snap.h);

            if (tx1 - tx0 < 1) { tx0 = clamp(tx0 - 1, 0, snap.w - 1); tx1 = clamp(tx0 + 2, 1, snap.w); }
            if (ty1 - ty0 < 1) { ty0 = clamp(ty0 - 1, 0, snap.h - 1); ty1 = clamp(ty0 + 2, 1, snap.h); }

            float[] t = snap.tempC;
            double minC = Double.POSITIVE_INFINITY;
            double maxC = Double.NEGATIVE_INFINITY;

            for (int y = ty0; y < ty1; y++) {
                int row = y * snap.w;
                for (int x = tx0; x < tx1; x++) {
                    float v = t[row + x];
                    if (Float.isFinite(v)) {
                        if (v < minC) minC = v;
                        if (v > maxC) maxC = v;
                    }
                }
            }

            if (Double.isFinite(minC) && Double.isFinite(maxC)) {
                statsText.setText(String.format(java.util.Locale.US, "High: %.1f°C   Low: %.1f°C", maxC, minC));
            } else {
                statsText.setText("High: --°C   Low: --°C");
            }

        } catch (Exception e) {
            Log.e(TAG, "ROI stats calculation error", e);
            statsText.setText("High: --°C   Low: --°C");
        }
    }

    private void clearOverlaysKeepImage(FrameLayout container) {
        for (int i = container.getChildCount() - 1; i >= 0; i--) {
            View v = container.getChildAt(i);
            if (v.getId() != R.id.capturedImageView) {
                container.removeViewAt(i);
            }
        }
    }

    private void enableSinglePoint(FrameLayout container, TextView statsText,
                                   ImageView iv, Bitmap bmp,
                                   CameraHandler.TempFrameSnapshot snap) {
        currentMode = MODE_POINT;
        clearOverlaysKeepImage(container);

        if (selectionOverlay == null) {
            selectionOverlay = new SelectionOverlay(this);
        }
        if (selectionOverlay.getParent() == null) {
            container.addView(selectionOverlay, new FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.MATCH_PARENT,
                    FrameLayout.LayoutParams.MATCH_PARENT));
        }

        selectionOverlay.setMode(SelectionOverlay.MODE_POINT);
        selectionOverlay.setOnBoundsChangedListener(null);

        iv.post(() -> {
            RectF img = getDisplayedImageRect(iv);
            if (img.width() <= 1f || img.height() <= 1f) return;

            float cx = img.centerX();
            float cy = img.centerY();
            float half = 10f;

            selectionOverlay.setBounds(new RectF(cx - half, cy - half, cx + half, cy + half));
            updatePointTempFromSnapshot(statsText, cx, cy, iv, bmp, snap);
        });

        selectionOverlay.setOnPointChangedListener((cx, cy) -> {
            RectF imgBounds = getDisplayedImageRect(iv);

            float clampedX = Math.max(imgBounds.left, Math.min(cx, imgBounds.right));
            float clampedY = Math.max(imgBounds.top, Math.min(cy, imgBounds.bottom));

            if (clampedX != cx || clampedY != cy) {
                float half = 10f;
                selectionOverlay.setBounds(new RectF(
                        clampedX - half, clampedY - half,
                        clampedX + half, clampedY + half));
            }

            updatePointTempFromSnapshot(statsText, clampedX, clampedY, iv, bmp, snap);
        });

        selectionOverlay.setClickable(true);
        selectionOverlay.bringToFront();
        container.invalidate();
    }

    private void updatePointTempFromSnapshot(TextView statsText, float cx, float cy,
                                             ImageView iv, Bitmap bmp,
                                             CameraHandler.TempFrameSnapshot snap) {
        try {
            if (bmp == null || snap == null || snap.tempC == null) {
                statsText.setText("Temp: --°C");
                return;
            }

            RectF imgRect = getDisplayedImageRect(iv);
            if (imgRect.width() <= 1f || imgRect.height() <= 1f) {
                statsText.setText("Temp: --°C");
                return;
            }

            float px = Math.max(imgRect.left, Math.min(cx, imgRect.right));
            float py = Math.max(imgRect.top, Math.min(cy, imgRect.bottom));

            float bx = (px - imgRect.left) * ((float) bmp.getWidth() / imgRect.width());
            float by = (py - imgRect.top) * ((float) bmp.getHeight() / imgRect.height());

            float txf = bx * ((float) snap.w / bmp.getWidth());
            float tyf = by * ((float) snap.h / bmp.getHeight());

            int thermalX = clamp(Math.round(txf), 0, snap.w - 1);
            int thermalY = clamp(Math.round(tyf), 0, snap.h - 1);

            float temp = snap.tempC[thermalY * snap.w + thermalX];

            if (Float.isFinite(temp)) {
                statsText.setText(String.format(java.util.Locale.US, "Temp: %.1f°C", temp));
            } else {
                statsText.setText("Temp: --°C");
            }

        } catch (Exception e) {
            Log.e(TAG, "updatePointTempFromSnapshot failed: " + e.getMessage(), e);
            statsText.setText("Temp: --°C");
        }
    }

    private void enableMultiPoint(FrameLayout container, TextView statsText,
                                  ImageView iv, Bitmap bmp,
                                  CameraHandler.TempFrameSnapshot snap,
                                  int maxPoints) {
        currentMode = MODE_POINT_MULTI;
        clearOverlaysKeepImage(container);

        if (selectionOverlay != null && selectionOverlay.getParent() == container) {
            container.removeView(selectionOverlay);
        }

        if (multiPointOverlay == null) {
            multiPointOverlay = new MultiPointOverlay(this);
            container.addView(multiPointOverlay, new FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.MATCH_PARENT,
                    FrameLayout.LayoutParams.MATCH_PARENT));
        } else if (multiPointOverlay.getParent() != container) {
            container.addView(multiPointOverlay);
        }

        multiPointOverlay.setMaxPoints(maxPoints);
        multiPointOverlay.bringToFront();

        multiPointOverlay.setOnPointsChangedListener(points -> {
            RectF imgBounds = getDisplayedImageRect(iv);

            for (MultiPointOverlay.PointData p : points) {
                p.x = Math.max(imgBounds.left, Math.min(p.x, imgBounds.right));
                p.y = Math.max(imgBounds.top, Math.min(p.y, imgBounds.bottom));
            }

            multiPointOverlay.invalidate();
            updateMultiPointTempsFromSnapshot(statsText, points, iv, bmp, snap);
        });

        iv.post(() -> {
            RectF img = getDisplayedImageRect(iv);
            if (img.width() <= 0 || img.height() <= 0) return;

            multiPointOverlay.clearPoints();

            float cx = img.centerX();
            float cy = img.centerY();
            float spanX = img.width() * 0.25f;
            float spanY = img.height() * 0.25f;

            switch (maxPoints) {
                case 1:
                    multiPointOverlay.addPoint(cx, cy);
                    break;
                case 3:
                    multiPointOverlay.addPoint(cx, cy);
                    multiPointOverlay.addPoint(cx - spanX, cy);
                    multiPointOverlay.addPoint(cx + spanX, cy);
                    break;
                case 5:
                    multiPointOverlay.addPoint(cx, cy);
                    multiPointOverlay.addPoint(cx - spanX, cy);
                    multiPointOverlay.addPoint(cx + spanX, cy);
                    multiPointOverlay.addPoint(cx, cy - spanY);
                    multiPointOverlay.addPoint(cx, cy + spanY);
                    break;
                case 10:
                    multiPointOverlay.addPoint(cx, cy);
                    multiPointOverlay.addPoint(cx - spanX, cy);
                    multiPointOverlay.addPoint(cx + spanX, cy);
                    multiPointOverlay.addPoint(cx, cy - spanY);
                    multiPointOverlay.addPoint(cx, cy + spanY);
                    multiPointOverlay.addPoint(cx - spanX*0.7f, cy - spanY*0.7f);
                    multiPointOverlay.addPoint(cx + spanX*0.7f, cy + spanY*0.7f);
                    multiPointOverlay.addPoint(cx - spanX*0.7f, cy + spanY*0.7f);
                    multiPointOverlay.addPoint(cx + spanX*0.7f, cy - spanY*0.7f);
                    multiPointOverlay.addPoint(cx, cy - spanY*0.5f);
                    break;
                default:
                    multiPointOverlay.addPoint(cx, cy);
                    for (int i = 1; i < maxPoints; i++) {
                        float angle = (float)(2 * Math.PI * i / maxPoints);
                        float x = cx + spanX * (float)Math.cos(angle);
                        float y = cy + spanY * (float)Math.sin(angle);
                        multiPointOverlay.addPoint(x, y);
                    }
                    break;
            }
        });
    }

    private void updateMultiPointTempsFromSnapshot(TextView statsText,
                                                   ArrayList<MultiPointOverlay.PointData> pts,
                                                   ImageView iv, Bitmap bmp,
                                                   CameraHandler.TempFrameSnapshot snap) {
        StringBuilder sb = new StringBuilder();

        for (MultiPointOverlay.PointData p : pts) {
            double t = getPointTemp(iv, bmp, snap, p.x, p.y);
            p.temp = t;

            if (Double.isFinite(t)) {
                sb.append(String.format(java.util.Locale.US, "Point %d: %.1f°C\n", p.index, t));
            } else {
                sb.append(String.format(java.util.Locale.US, "Point %d: --°C\n", p.index));
            }
        }

        statsText.setText(sb.toString().trim());
    }

    private void enableRectangleMode(FrameLayout container, TextView statsText,
                                     ImageView iv, Bitmap bmp,
                                     CameraHandler.TempFrameSnapshot snap) {
        currentMode = MODE_RECT;
        clearOverlaysKeepImage(container);

        if (multiPointOverlay != null && multiPointOverlay.getParent() == container) {
            container.removeView(multiPointOverlay);
        }

        if (selectionOverlay == null) {
            selectionOverlay = new SelectionOverlay(this);
        }
        if (selectionOverlay.getParent() == null) {
            container.addView(selectionOverlay, new FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.MATCH_PARENT,
                    FrameLayout.LayoutParams.MATCH_PARENT));
        }

        selectionOverlay.setMode(SelectionOverlay.MODE_RECT);
        selectionOverlay.setOnPointChangedListener(null);

        selectionOverlay.setOnBoundsChangedListener(bounds -> {
            RectF imgBounds = getDisplayedImageRect(iv);
            RectF constrainedBounds = new RectF(bounds);

            constrainedBounds.left = Math.max(imgBounds.left, Math.min(constrainedBounds.left, imgBounds.right));
            constrainedBounds.top = Math.max(imgBounds.top, Math.min(constrainedBounds.top, imgBounds.bottom));
            constrainedBounds.right = Math.max(imgBounds.left, Math.min(constrainedBounds.right, imgBounds.right));
            constrainedBounds.bottom = Math.max(imgBounds.top, Math.min(constrainedBounds.bottom, imgBounds.bottom));

            float width = constrainedBounds.width();
            float height = constrainedBounds.height();

            if (constrainedBounds.left < imgBounds.left) {
                constrainedBounds.left = imgBounds.left;
                constrainedBounds.right = imgBounds.left + width;
            }
            if (constrainedBounds.right > imgBounds.right) {
                constrainedBounds.right = imgBounds.right;
                constrainedBounds.left = imgBounds.right - width;
            }
            if (constrainedBounds.top < imgBounds.top) {
                constrainedBounds.top = imgBounds.top;
                constrainedBounds.bottom = imgBounds.top + height;
            }
            if (constrainedBounds.bottom > imgBounds.bottom) {
                constrainedBounds.bottom = imgBounds.bottom;
                constrainedBounds.top = imgBounds.bottom - height;
            }

            constrainedBounds.left = Math.max(imgBounds.left, constrainedBounds.left);
            constrainedBounds.top = Math.max(imgBounds.top, constrainedBounds.top);
            constrainedBounds.right = Math.min(imgBounds.right, constrainedBounds.right);
            constrainedBounds.bottom = Math.min(imgBounds.bottom, constrainedBounds.bottom);

            if (!constrainedBounds.equals(bounds)) {
                selectionOverlay.setBounds(constrainedBounds);
            }

            updateRoiStats(statsText, constrainedBounds, iv, bmp, snap);
        });

        selectionOverlay.bringToFront();

        iv.post(() -> {
            RectF imgRect = getDisplayedImageRect(iv);
            if (imgRect.width() <= 1f || imgRect.height() <= 1f) return;

            float w = Math.min(imgRect.width() * 0.4f, imgRect.width() - 40);
            float h = Math.min(imgRect.height() * 0.4f, imgRect.height() - 40);
            float left = imgRect.centerX() - w / 2f;
            float top = imgRect.centerY() - h / 2f;

            left = Math.max(imgRect.left, Math.min(left, imgRect.right - w));
            top = Math.max(imgRect.top, Math.min(top, imgRect.bottom - h));

            selectionOverlay.setBounds(new RectF(left, top, left + w, top + h));
            updateRoiStats(statsText, selectionOverlay.getBounds(), iv, bmp, snap);
        });
    }

    private double getPointTemp(ImageView iv, Bitmap bmp,
                                CameraHandler.TempFrameSnapshot snap,
                                float cx, float cy) {
        try {
            if (bmp == null || snap == null || snap.tempC == null) {
                return Double.NaN;
            }

            RectF imgRect = getDisplayedImageRect(iv);

            float px = Math.max(imgRect.left, Math.min(cx, imgRect.right));
            float py = Math.max(imgRect.top, Math.min(cy, imgRect.bottom));

            float bx = (px - imgRect.left) * ((float) bmp.getWidth() / imgRect.width());
            float by = (py - imgRect.top) * ((float) bmp.getHeight() / imgRect.height());

            float txf = bx * ((float) snap.w / bmp.getWidth());
            float tyf = by * ((float) snap.h / bmp.getHeight());

            int thermalX = clamp(Math.round(txf), 0, snap.w - 1);
            int thermalY = clamp(Math.round(tyf), 0, snap.h - 1);

            return snap.tempC[thermalY * snap.w + thermalX];

        } catch (Exception e) {
            return Double.NaN;
        }
    }

    // ==================== Helper Methods ====================

    private int clamp(int v, int lo, int hi) {
        return Math.max(lo, Math.min(hi, v));
    }

    private RectF getDisplayedImageRect(ImageView iv) {
        RectF out = new RectF();
        if (iv.getDrawable() == null) return out;

        android.graphics.Matrix m = iv.getImageMatrix();
        android.graphics.RectF dRect = new android.graphics.RectF(0, 0,
                iv.getDrawable().getIntrinsicWidth(),
                iv.getDrawable().getIntrinsicHeight());
        m.mapRect(out, dRect);

        out.offset(iv.getPaddingLeft(), iv.getPaddingTop());

        float vw = iv.getWidth();
        float vh = iv.getHeight();
        float dx = (vw - out.width()) / 2f;
        float dy = (vh - out.height()) / 2f;
        out.offset(dx, dy);

        return out;
    }

    private Bitmap copyBitmap(Bitmap source) {
        if (source == null) return null;
        Bitmap.Config config = source.getConfig() != null ?
                source.getConfig() : Bitmap.Config.ARGB_8888;
        return source.copy(config, false);
    }

    private void recycleBitmaps() {
        lastMsxBitmap = null;
        lastDcBitmap = null;

        if (capturedMsxBitmap != null && !capturedMsxBitmap.isRecycled()) {
            capturedMsxBitmap.recycle();
            capturedMsxBitmap = null;
        }
    }

    // ==================== Listeners & Callbacks ====================

    private final UsbPermissionHandler.UsbPermissionListener permissionListener =
            new UsbPermissionHandler.UsbPermissionListener() {
                @Override
                public void permissionGranted(@NonNull Identity identity) {
                    doConnect(identity);
                }

                @Override
                public void permissionDenied(@NonNull Identity identity) {
                    showMessage.show("USB permission denied");
                }

                @Override
                public void error(ErrorType errorType, Identity identity) {
                    if (errorType == ErrorType.DEVICE_UNAVAILABLE_WHEN_ASKED_PERMISSION) {
                        usbPermissionHandler.requestFlirOnePermisson(
                                connectedIdentity, FlirCameraActivity.this, permissionListener);
                    } else {
                        showMessage.show("USB permission error: " + errorType);
                    }
                }
            };

    private final ConnectionStatusListener connectionStatusListener = errorCode -> {
        Log.d(TAG, "Camera disconnected: " + errorCode);
        runOnUiThread(() -> {
            updateConnectionText(connectedIdentity, "DISCONNECTED");
            connectedIdentity = null;
        });
    };

    private final CameraHandler.DiscoveryStatus discoveryStatusListener =
            new CameraHandler.DiscoveryStatus() {
                @Override
                public void started() {
                    discoveryStatus.setText(getString(R.string.connection_status_text, "discovering"));
                }

                @Override
                public void stopped() {
                    discoveryStatus.setText(getString(R.string.connection_status_text, "not discovering"));
                }
            };

    private final DiscoveryEventListener cameraDiscoveryListener = new DiscoveryEventListener() {
        @Override
        public void onCameraFound(DiscoveredCamera discoveredCamera) {
            Log.d(TAG, "Camera found: " + discoveredCamera.getIdentity());
            runOnUiThread(() -> cameraHandler.add(discoveredCamera.getIdentity()));
        }

        @Override
        public void onDiscoveryError(CommunicationInterface commInterface, ErrorCode errorCode) {
            Log.e(TAG, "Discovery error: " + commInterface + " - " + errorCode);
            runOnUiThread(() -> {
                stopDiscovery();
                showMessage.show("Discovery error: " + errorCode);
            });
        }
    };

    private final ShowMessage showMessage = message ->
            Toast.makeText(FlirCameraActivity.this, message, Toast.LENGTH_SHORT).show();

    private void updateConnectionText(Identity identity, String status) {
        String deviceId = identity != null ? identity.deviceId : "";
        connectionStatus.setText(getString(R.string.connection_status_text,
                deviceId + " " + status));
    }

    private void showSDKversion(String version) {
        TextView sdkVersionTextView = findViewById(R.id.sdk_version);
        String sdkVersionText = getString(R.string.sdk_version_text, version);
        sdkVersionTextView.setText(sdkVersionText);
    }

    private void showSDKCommitHash(String commitHash) {
        TextView sdkVersionTextView = findViewById(R.id.sdk_commit_hash);
        String truncated = commitHash.length() > 10 ?
                commitHash.substring(0, 10) : commitHash;
        String sdkVersionText = getString(R.string.sdk_commit_hash_text, truncated);
        sdkVersionTextView.setText(sdkVersionText);
    }

    private void setupViews() {
        connectionStatus = findViewById(R.id.connection_status_text);
        discoveryStatus = findViewById(R.id.discovery_status);
        deviceInfo = findViewById(R.id.device_info_text);
        msxImage = findViewById(R.id.msx_image);
        photoImage = findViewById(R.id.photo_image);
    }

    public interface ShowMessage {
        void show(String message);
    }
}