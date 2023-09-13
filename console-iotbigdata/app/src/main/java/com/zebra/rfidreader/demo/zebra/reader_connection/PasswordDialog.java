package com.zebra.rfidreader.demo.zebra.reader_connection;

import android.app.Activity;
import android.app.Dialog;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.widget.Button;
import android.widget.EditText;

import com.zebra.rfid.api3.ReaderDevice;
import com.zebra.rfidreader.demo.R;
import com.zebra.rfidreader.demo.zebra.home.MainActivity;
import com.zebra.rfidreader.demo.zebra.settings.SettingsDetailActivity;

/**
 * Connect password dialog to enter reader password to connect with reader
 */
public class PasswordDialog extends Dialog implements View.OnClickListener {
    public static boolean isDialogShowing;
    private final Activity activity;
    private EditText password;
    private ReaderDevice readerDevice;

    /**
     * Constructor of the class
     *
     * @param activity         activity context
     * @param connectingDevice
     */
    public PasswordDialog(Activity activity, ReaderDevice connectingDevice) {
        super(activity);
        this.activity = activity;
        setCancelable(false);
        readerDevice = connectingDevice;
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        setContentView(R.layout.dialog_password);
        Button connect = findViewById(R.id.btn_connect);
        Button cancel = findViewById(R.id.btn_cancel);
        password = findViewById(R.id.connect_password);
        connect.setOnClickListener(this);
        cancel.setOnClickListener(this);

    }


    @Override
    public void onClick(View view) {
        switch (view.getId()) {
            case R.id.btn_connect:
                if (!password.getText().toString().isEmpty()) {
                    if (activity.getTitle().toString().equalsIgnoreCase(activity.getString(R.string.available_readers_title)))
                        ((SettingsDetailActivity) activity).connectClicked(password.getText().toString(), readerDevice);
                    else
                        ((MainActivity) activity).connectClicked(password.getText().toString(), readerDevice);
                    dismiss();
                    isDialogShowing = false;
                }
                break;
            case R.id.btn_cancel:
                if (activity.getTitle().toString().equalsIgnoreCase(activity.getString(R.string.available_readers_title)))
                    ((SettingsDetailActivity) activity).cancelClicked(readerDevice);
                else
                    ((MainActivity) activity).cancelClicked(readerDevice);
                dismiss();
                isDialogShowing = false;
                break;
            default:
                break;
        }
    }
}
