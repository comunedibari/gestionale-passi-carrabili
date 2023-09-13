package com.zebra.rfidreader.demo.zebra.settings;

import android.app.Dialog;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.os.AsyncTask;
import android.os.Bundle;
import android.os.Handler;
import androidx.fragment.app.Fragment;
import androidx.appcompat.app.AppCompatActivity;

import android.util.DisplayMetrics;
import android.view.MenuItem;
import android.view.View;
import android.widget.Toast;

import com.zebra.rfid.api3.InvalidUsageException;
import com.zebra.rfid.api3.OperationFailureException;
import com.zebra.rfid.api3.ReaderDevice;
import com.zebra.rfid.api3.Readers;
import com.zebra.rfidreader.demo.R;
import com.zebra.rfidreader.demo.zebra.application.Application;
import com.zebra.rfidreader.demo.zebra.common.Constants;
import com.zebra.rfidreader.demo.zebra.common.CustomProgressDialog;
import com.zebra.rfidreader.demo.zebra.common.CustomToast;
import com.zebra.rfidreader.demo.zebra.common.ResponseHandlerInterfaces;
import com.zebra.rfidreader.demo.zebra.home.MainActivity;
import com.zebra.rfidreader.demo.zebra.notifications.NotificationsService;
import com.zebra.rfidreader.demo.zebra.reader_connection.PasswordDialog;
import com.zebra.rfidreader.demo.zebra.reader_connection.ReadersListFragment;

import static com.zebra.rfidreader.demo.bari_citta_connessa.utils.BariCittaConnessaConstantsKt.TAG_CONTENT_FRAGMENT;

/**
 * Class to handle the UI for setting details like antenna config, singulation etc..
 * Hosts a fragment for UI.
 */
public class SettingsDetailActivity extends AppCompatActivity implements ResponseHandlerInterfaces.BluetoothDeviceFoundHandler, Readers.RFIDReaderEventHandler, ResponseHandlerInterfaces.BatteryNotificationHandler {

    protected CustomProgressDialog progressDialog;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        DisplayMetrics displayMetrics = getResources().getDisplayMetrics();
        float dpWidth = displayMetrics.widthPixels / displayMetrics.density;
        if (dpWidth < 800){
            //setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE);
        } else {
            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE);
        }
        
        setContentView(R.layout.activity_settings_detail);

        // Enabling Up / Back navigation
//        android.support.v7.app.ActionBar actionBar = getSupportActionBar();
//        if (actionBar != null)
//            actionBar.setDisplayHomeAsUpEnabled(true);

        //startFragment(getIntent());

        getSupportFragmentManager().beginTransaction().add(R.id.settings_content_frame, ReadersListFragment.newInstance(), TAG_CONTENT_FRAGMENT).commit();

        MainActivity.addBluetoothDeviceFoundHandler(this);
        MainActivity.addBatteryNotificationHandler(this);

        if (Application.readers == null) {
            Application.readers = new Readers();
        }

        // attach to reader list handler
        Application.readers.attach(this);
    }


    @Override
    public void onResume() {
        super.onResume();
        Application.activityResumed();
    }

    /**
     * call back of activity,which will call before activity went to paused
     */
    @Override
    public void onPause() {
        super.onPause();
        Application.activityPaused();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        // deattach to reader list handler
        Application.readers.deattach(this);
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        if (item.getItemId() == android.R.id.home) {
            onBackPressed();
            return true;
        } else {
            return super.onOptionsItemSelected(item);
        }
    }

    @Override
    public void onBackPressed() {
        super.onBackPressed();
    }

    /**
     * Method to be called from Fragments of this activity after handling the response from the reader(success / failure)
     */
    public void callBackPressed() {
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                SettingsDetailActivity.super.onBackPressed();
            }
        });
    }

    /**
     * method to stop progress dialog on timeout
     *
     * @param time    timeout of the progress dialog
     * @param d       id of progress dialog
     * @param command command that has been sent to the reader
     */
    public void timerDelayRemoveDialog(long time, final Dialog d, final String command, final boolean isPressBack) {
        new Handler().postDelayed(new Runnable() {
            public void run() {
                if (d != null && d.isShowing()) {
                    sendNotification(Constants.ACTION_READER_STATUS_OBTAINED, command + " timeout");
                    d.dismiss();
                    if (Application.isActivityVisible() && isPressBack)
                        callBackPressed();
                }
            }
        }, time);
    }

    /**
     * Method called when save config button is clicked
     *
     * @param v - View to be addressed
     */
    public void saveConfigClicked(View v) {
        if (MainActivity.isBluetoothEnabled()) {
            if (Application.mConnectedReader != null && Application.mConnectedReader.isConnected()) {
                progressDialog = new CustomProgressDialog(this, getString(R.string.save_config_progress_title));
                progressDialog.show();
                timerDelayRemoveDialog(Constants.SAVE_CONFIG_RESPONSE_TIMEOUT, progressDialog, getString(R.string.status_failure_message), false);

                // TODO PERICOLOSO PER LEAK DI MEMORIA!!
                final AsyncTask<Void, Void, Boolean> execute = new AsyncTask<Void, Void, Boolean>() {
                    private OperationFailureException operationFailureException;

                    @Override
                    protected Boolean doInBackground(Void... voids) {
                        boolean bResult = false;
                        try {
                            Application.mConnectedReader.Config.saveConfig();
                            bResult = true;
                        } catch (InvalidUsageException e) {
                            e.printStackTrace();
                        } catch (OperationFailureException e) {
                            e.printStackTrace();
                            operationFailureException = e;
                        }
                        return bResult;
                    }

                    @Override
                    protected void onPostExecute(Boolean result) {
                        super.onPostExecute(result);
                        progressDialog.dismiss();
                        if (!result) {
                            Toast.makeText(getApplicationContext(), operationFailureException.getVendorMessage(), Toast.LENGTH_SHORT).show();
                        } else
                            Toast.makeText(getApplicationContext(), getResources().getString(R.string.status_success_message), Toast.LENGTH_SHORT).show();
                    }
                };
                execute.execute();
            } else
                Toast.makeText(getApplicationContext(), getResources().getString(R.string.error_disconnected), Toast.LENGTH_SHORT).show();

        } else
            Toast.makeText(getApplicationContext(), getResources().getString(R.string.error_bluetooth_disabled), Toast.LENGTH_SHORT).show();
    }

    @Override
    public void bluetoothDeviceConnected(ReaderDevice device) {
        Fragment fragment = getSupportFragmentManager().findFragmentByTag(TAG_CONTENT_FRAGMENT);

        if (fragment instanceof ReadersListFragment) {
            ((ReadersListFragment) fragment).bluetoothDeviceConnected(device);
        }
    }

    @Override
    public void bluetoothDeviceDisConnected(ReaderDevice device) {
        PasswordDialog.isDialogShowing = false;
        Fragment fragment = getSupportFragmentManager().findFragmentByTag(TAG_CONTENT_FRAGMENT);

        if (fragment instanceof ReadersListFragment) {
            ((ReadersListFragment) fragment).bluetoothDeviceDisConnected(device);
            ((ReadersListFragment) fragment).readerDisconnected(device);
        }
    }

    @Override
    public void bluetoothDeviceConnFailed(ReaderDevice device) {

    }

    public void setRegion() {

    }

    public void sendNotification(String action, String data) {
        if (Application.isActivityVisible()) {
            if (action.equalsIgnoreCase(Constants.ACTION_READER_BATTERY_CRITICAL) || action.equalsIgnoreCase(Constants.ACTION_READER_BATTERY_LOW)) {
                new CustomToast(this, R.layout.toast_layout, data).show();
            } else {
                Toast.makeText(getApplicationContext(), data, Toast.LENGTH_SHORT).show();
            }
        } else {
            Intent i = new Intent(this, NotificationsService.class);
            i.putExtra(Constants.INTENT_ACTION, action);
            i.putExtra(Constants.INTENT_DATA, data);
            startService(i);
        }
    }

    /**
     * method to send connect command request to reader
     * after connect button clicked on connect password dialog
     *
     * @param password     - reader password
     * @param readerDevice
     */
    public void connectClicked(String password, ReaderDevice readerDevice) {
        Fragment fragment = getSupportFragmentManager().findFragmentByTag(TAG_CONTENT_FRAGMENT);
        if (fragment instanceof ReadersListFragment) {
            ((ReadersListFragment) fragment).ConnectwithPassword(password, readerDevice);
        }
    }

    /**
     * method which will exe cute after cancel button clicked on connect pwd dialog
     *
     * @param readerDevice
     */
    public void cancelClicked(ReaderDevice readerDevice) {
        Fragment fragment = getSupportFragmentManager().findFragmentByTag(TAG_CONTENT_FRAGMENT);
        if (fragment instanceof ReadersListFragment) {
            ((ReadersListFragment) fragment).readerDisconnected(readerDevice);
        }
    }

    @Override
    public void RFIDReaderAppeared(ReaderDevice device) {
        Fragment fragment = getSupportFragmentManager().findFragmentByTag(TAG_CONTENT_FRAGMENT);
        if (fragment instanceof ReadersListFragment) {
            ((ReadersListFragment) fragment).RFIDReaderAppeared(device);
        }
        if (Application.NOTIFY_READER_AVAILABLE) {
            if (!device.getName().equalsIgnoreCase("null"))
                sendNotification(Constants.ACTION_READER_AVAILABLE, device.getName() + " is available.");
        }
    }

    @Override
    public void RFIDReaderDisappeared(ReaderDevice device) {
        Fragment fragment = getSupportFragmentManager().findFragmentByTag(TAG_CONTENT_FRAGMENT);
        if (fragment instanceof ReadersListFragment) {
            ((ReadersListFragment) fragment).RFIDReaderDisappeared(device);
        }
        if (Application.NOTIFY_READER_AVAILABLE)
            sendNotification(Constants.ACTION_READER_AVAILABLE, device.getName() + " is unavailable.");
    }

    @Override
    public void deviceStatusReceived(int level, boolean charging, String cause) {
        Fragment fragment = getSupportFragmentManager().findFragmentByTag(TAG_CONTENT_FRAGMENT);
        if (fragment instanceof BatteryFragment) {
            ((BatteryFragment) fragment).deviceStatusReceived(level, charging, cause);
        }
    }
}