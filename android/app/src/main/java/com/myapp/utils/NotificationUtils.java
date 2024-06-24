package com.myapp.utils;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.ContextWrapper;

public class NotificationUtils  extends ContextWrapper {
    private static final String CHANNEL_GENERAL_ID = "general";
    private NotificationManager manager;

    public NotificationUtils(Context base) {
        super(base);

        if (isOreoOrLater()) {
            NotificationChannel channel = new NotificationChannel(CHANNEL_GENERAL_ID, "General Notifications", NotificationManager.IMPORTANCE_LOW);
            getManager().createNotificationChannel(channel);
        }
    }

    public Notification.Builder getNotification(PendingIntent intent, String title, String text, int iconId, boolean autoCancel) {
        Notification.Builder builder = isOreoOrLater()
                ? new Notification.Builder(this, CHANNEL_GENERAL_ID)
                : new Notification.Builder(this);

        return builder.setContentTitle(title)
                .setContentText(text)
                .setContentIntent(intent)
                .setSmallIcon(iconId)
                .setAutoCancel(autoCancel);
    }

    public void notify(int id, Notification.Builder builder) {
        getManager().notify(id, builder.build());
    }

    private NotificationManager getManager() {
        if (manager == null) {
            manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        }
        return manager;
    }

    private boolean isOreoOrLater() {
        return android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O;
    }
}
