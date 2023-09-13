package com.zebra.rfidreader.demo.zebra.reader_connection;

import android.app.Activity;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.AsyncTask;
import android.os.Build;
import android.os.Bundle;
import androidx.fragment.app.Fragment;
import androidx.appcompat.app.ActionBar;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;
import android.view.LayoutInflater;
import android.view.Menu;
import android.view.MenuInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.AdapterView;
import android.widget.ListView;
import android.widget.TextView;
import android.widget.Toast;

import com.zebra.rfid.api3.InvalidUsageException;
import com.zebra.rfid.api3.OperationFailureException;
import com.zebra.rfid.api3.RFIDResults;
import com.zebra.rfid.api3.ReaderDevice;
import com.zebra.rfidreader.demo.R;
import com.zebra.rfidreader.demo.zebra.application.Application;
import com.zebra.rfidreader.demo.zebra.common.Constants;
import com.zebra.rfidreader.demo.zebra.common.CustomProgressDialog;
import com.zebra.rfidreader.demo.zebra.common.Inventorytimer;
import com.zebra.rfidreader.demo.zebra.home.MainActivity;
import com.zebra.rfidreader.demo.zebra.settings.SettingsContent;
import com.zebra.rfidreader.demo.zebra.settings.SettingsDetailActivity;

import java.util.ArrayList;


public class ReadersListFragment extends Fragment {
    public static ArrayList<ReaderDevice> readersList = new ArrayList<>();
    private PasswordDialog passwordDialog;
    private DeviceConnectTask deviceConnectTask;
    private ReaderListAdapter readerListAdapter;
    private ListView pairedListView;
    private TextView tv_emptyView;
    private Toolbar toolbar;
    private View view;
    private CustomProgressDialog progressDialog;

    // The on-click listener for all devices in the ListViews
    private AdapterView.OnItemClickListener mDeviceClickListener = new AdapterView.OnItemClickListener() {

        public void onItemClick(AdapterView<?> av, View v, int pos, long arg3) {
            if (MainActivity.isBluetoothEnabled()) {
                // Get the device MAC address, which is the last 17 chars in the View
                ReaderDevice readerDevice = readerListAdapter.getItem(pos);
                if (Application.mConnectedReader == null) {

                    if (deviceConnectTask == null || deviceConnectTask.isCancelled()) {
                        Application.is_connection_requested = true;
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.HONEYCOMB) {
                            deviceConnectTask = new DeviceConnectTask(readerDevice, "Connessione con " + readerDevice.getName(), getReaderPassword(readerDevice.getName()));
                            deviceConnectTask.executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR);
                        } else {
                            deviceConnectTask = new DeviceConnectTask(readerDevice, "Connessione con " + readerDevice.getName(), getReaderPassword(readerDevice.getName()));
                            deviceConnectTask.execute();
                        }
                    }
                } else {
                    {
                        if (Application.mConnectedReader.isConnected()) {
                            Application.is_disconnection_requested = true;
                            try {
                                Application.mConnectedReader.disconnect();
                            } catch (InvalidUsageException | OperationFailureException e) {
                                e.printStackTrace();
                            }
                            //
                            bluetoothDeviceDisConnected(Application.mConnectedDevice);
                            if (Application.NOTIFY_READER_CONNECTION)
                                sendNotification(Constants.ACTION_READER_DISCONNECTED, "Disconnesso da " + Application.mConnectedReader.getHostName());
                            //
                            clearSettings();
                        }
                        if (!Application.mConnectedReader.getHostName().equalsIgnoreCase(readerDevice.getName())) {
                            Application.mConnectedReader = null;
                            if (deviceConnectTask == null || deviceConnectTask.isCancelled()) {
                                Application.is_connection_requested = true;
                                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.HONEYCOMB) {
                                    deviceConnectTask = new DeviceConnectTask(readerDevice, "Connessione con " + readerDevice.getName(), getReaderPassword(readerDevice.getName()));
                                    deviceConnectTask.executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR);
                                } else {
                                    deviceConnectTask = new DeviceConnectTask(readerDevice, "Connessione con " + readerDevice.getName(), getReaderPassword(readerDevice.getName()));
                                    deviceConnectTask.execute();
                                }
                            }
                        } else {
                            Application.mConnectedReader = null;
                        }
                    }
                }
                // Create the result Intent and include the MAC address
            } else
                Toast.makeText(getActivity(), getResources().getString(R.string.error_bluetooth_disabled), Toast.LENGTH_SHORT).show();
        }
    };

    public ReadersListFragment() {
        // Required empty public constructor
    }

    /**
     * Use this factory method to create a new instance of
     * this fragment using the provided parameters.
     *
     * @return A new instance of fragment ReadersListFragment.
     */
    public static ReadersListFragment newInstance() {
        return new ReadersListFragment();
    }

    private void clearSettings() {
        MainActivity.clearSettings();
        MainActivity.stopTimer();
        Inventorytimer.getInstance().stopTimer();
        Application.mIsInventoryRunning = false;
        if (Application.mIsInventoryRunning) {
            Application.isBatchModeInventoryRunning = false;
        }
        if (Application.isLocatingTag) {
            Application.isLocatingTag = false;
        }
        //update dpo icon in settings list
        SettingsContent.ITEMS.get(8).icon = R.drawable.title_dpo_disabled;
        Application.mConnectedDevice = null;
        Application.isAccessCriteriaRead = false;
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setHasOptionsMenu(true);
    }

    @Override
    public void onCreateOptionsMenu(Menu menu, MenuInflater inflater) {
        inflater.inflate(R.menu.menu_readers_list, menu);
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        // Inflate the layout for this fragment
        view = inflater.inflate(R.layout.fragment_readers_list, container, false);
        return view;
    }

    @Override
    public void onAttach(Activity activity) {
        super.onAttach(activity);
    }

    @Override
    public void onActivityCreated(Bundle savedInstanceState) {
        super.onActivityCreated(savedInstanceState);

        initializeViews();
        toolbar = view.findViewById(R.id.toolbar);
        if(getActivity() != null){
            ((SettingsDetailActivity) getActivity()).setSupportActionBar(toolbar);
            toolbar.setTitle(R.string.title_activity_readers_list);
            ((SettingsDetailActivity) getActivity()).getSupportActionBar().setDisplayHomeAsUpEnabled(true);
        }
        readersList.clear();
        loadPairedDevices();
        if (Application.mConnectedDevice != null) {
            int index = readersList.indexOf(Application.mConnectedDevice);
            if (index != -1) {
                readersList.remove(index);
                readersList.add(index, Application.mConnectedDevice);
            } else {
                Application.mConnectedDevice = null;
                Application.mConnectedReader = null;
            }
        }

        readerListAdapter = new ReaderListAdapter(getActivity(), R.layout.readers_list_item, readersList);

        if (readerListAdapter.getCount() == 0) {
            pairedListView.setEmptyView(tv_emptyView);
        } else
            pairedListView.setAdapter(readerListAdapter);

        pairedListView.setOnItemClickListener(mDeviceClickListener);
        pairedListView.setChoiceMode(ListView.CHOICE_MODE_SINGLE);

    }

    private void initializeViews() {
        pairedListView = getActivity().findViewById(R.id.bondedReadersList);
        tv_emptyView =  getActivity().findViewById(R.id.empty);
    }

    private void loadPairedDevices() {
        try {
            readersList.addAll(Application.readers.GetAvailableRFIDReaderList());
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    public void onDetach() {
        super.onDetach();
    }

    @Override
    public void onResume() {
        super.onResume();
        if (PasswordDialog.isDialogShowing) {
            if (passwordDialog == null || !passwordDialog.isShowing()) {
                showPasswordDialog(Application.mConnectedDevice);
            }
        }
        capabilitiesRecievedforDevice();
    }

    @Override
    public void onPause() {
        super.onPause();
        if (passwordDialog != null && passwordDialog.isShowing()) {
            PasswordDialog.isDialogShowing = true;
            passwordDialog.dismiss();
        }
    }

    public void bluetoothDeviceConnected(ReaderDevice device) {
//        if (deviceConnectTask != null)
//            deviceConnectTask.cancel(true);
        if (device != null) {
            Application.mConnectedDevice = device;
            Application.is_connection_requested = false;
            changeTextStyle(device);
        } else
            Constants.logAsMessage(Constants.TYPE_ERROR, "ReadersListFragment", "deviceName is null or empty");
    }

    public void bluetoothDeviceDisConnected(ReaderDevice device) {
        if (deviceConnectTask != null && !deviceConnectTask.isCancelled() && deviceConnectTask.getConnectingDevice().getName().equalsIgnoreCase(device.getName())) {
            if (progressDialog != null && progressDialog.isShowing())
                progressDialog.dismiss();
            if (deviceConnectTask != null)
                deviceConnectTask.cancel(true);
        }
        if (device != null) {
            changeTextStyle(device);
        } else
            Constants.logAsMessage(Constants.TYPE_ERROR, "ReadersListFragment", "deviceName is null or empty");
        MainActivity.clearSettings();
    }

    public void readerDisconnected(ReaderDevice device) {
        if (device != null) {
            if (Application.mConnectedReader != null && !Application.AUTO_RECONNECT_READERS) {
                try {
                    Application.mConnectedReader.disconnect();
                } catch (InvalidUsageException | OperationFailureException e) {
                    e.printStackTrace();
                }
                Application.mConnectedReader = null;
            }
            for (int idx = 0; idx < readersList.size(); idx++) {
                if (readersList.get(idx).getName().equalsIgnoreCase(device.getName()))
                    changeTextStyle(readersList.get(idx));
            }
        }
    }

    /**
     * method to update reader device in the readers list on device connection failed event
     *
     * @param device device to be updated
     */
    public void bluetoothDeviceConnFailed(ReaderDevice device) {
        if (progressDialog != null && progressDialog.isShowing())
            progressDialog.dismiss();
        if (deviceConnectTask != null)
            deviceConnectTask.cancel(true);
        if (device != null)
            changeTextStyle(device);
        else
            Constants.logAsMessage(Constants.TYPE_ERROR, "ReadersListFragment", "deviceName is null or empty");

        sendNotification(Constants.ACTION_READER_CONN_FAILED, "Impossibile connettere il dispositivo, verificare la connessione");

        Application.mConnectedReader = null;
        Application.mConnectedDevice = null;
    }

    private void changeTextStyle(ReaderDevice device) {
        int i = readerListAdapter.getPosition(device);
        if (i >= 0) {
            readerListAdapter.remove(device);
            readerListAdapter.insert(device,i);
            readerListAdapter.notifyDataSetChanged();
        }
    }

    public void RFIDReaderAppeared(ReaderDevice readerDevice) {
        if (readerListAdapter != null && readerDevice != null) {
            if (readerListAdapter.getCount() == 0) {
                tv_emptyView.setVisibility(View.GONE);
                pairedListView.setAdapter(readerListAdapter);
            }
            readersList.add(readerDevice);
            readerListAdapter.notifyDataSetChanged();
        }
    }

    public void RFIDReaderDisappeared(ReaderDevice readerDevice) {
        if (readerListAdapter != null && readerDevice != null) {
            readerListAdapter.remove(readerDevice);
            readersList.remove(readerDevice);
            if (readerListAdapter.getCount() == 0) {
                pairedListView.setEmptyView(tv_emptyView);
            }
            readerListAdapter.notifyDataSetChanged();
        }
    }

    /**
     * method to update serial and model of connected reader device
     */
    public void capabilitiesRecievedforDevice() {
        getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                if (readerListAdapter.getPosition(Application.mConnectedDevice) >= 0) {
                    ReaderDevice readerDevice = readerListAdapter.getItem(readerListAdapter.getPosition(Application.mConnectedDevice));
                    //readerDevice.setModel(Application.mConnectedDevice.getModel());
                    //readerDevice.setSerial(Application.mConnectedDevice.getSerial());
                    readerListAdapter.notifyDataSetChanged();
                }
            }
        });
    }

    /**
     * method to show connect password dialog
     *
     * @param connectingDevice
     */
    public void showPasswordDialog(ReaderDevice connectingDevice) {
        if (Application.isActivityVisible()) {
            passwordDialog = new PasswordDialog(getActivity(), connectingDevice);
            passwordDialog.show();
        } else
            PasswordDialog.isDialogShowing = true;
    }

    /**
     * method to cancel progress dialog
     */
    public void cancelProgressDialog() {
        if (progressDialog != null && progressDialog.isShowing())
            progressDialog.dismiss();
        if (deviceConnectTask != null)
            deviceConnectTask.cancel(true);
    }

    public void ConnectwithPassword(String password, ReaderDevice readerDevice) {
        try {
            Application.mConnectedReader.disconnect();
        } catch (InvalidUsageException | OperationFailureException e) {
            e.printStackTrace();
        }
        deviceConnectTask = new DeviceConnectTask(readerDevice, "Connecting with " + readerDevice.getName(), password);
        deviceConnectTask.executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR);
    }

    /**
     * method to get connect password for the reader
     *
     * @param address - device BT address
     * @return connect password of the reader
     */
    private String getReaderPassword(String address) {
        SharedPreferences sharedPreferences = getActivity().getSharedPreferences(Constants.READER_PASSWORDS, 0);
        return sharedPreferences.getString(address, null);
    }

    private void sendNotification(String action, String data) {
        if (getActivity().getTitle().toString().equalsIgnoreCase(getString(R.string.available_readers_title)))
            ((SettingsDetailActivity) getActivity()).sendNotification(action, data);
        else
            ((MainActivity) getActivity()).sendNotification(action, data);
    }

    /**
     * async task to go for BT connection with reader
     */
    private class DeviceConnectTask extends AsyncTask<Void, String, Boolean> {
        private final ReaderDevice connectingDevice;
        private String prgressMsg;
        private OperationFailureException ex;
        private String password;

        DeviceConnectTask(ReaderDevice connectingDevice, String prgressMsg, String Password) {
            this.connectingDevice = connectingDevice;
            this.prgressMsg = prgressMsg;
            password = Password;
        }

        @Override
        protected void onPreExecute() {
            super.onPreExecute();
            progressDialog = new CustomProgressDialog(getActivity(), prgressMsg);
            progressDialog.show();
        }

        @Override
        protected Boolean doInBackground(Void... a) {
            try {
                if (password != null)
                    connectingDevice.getRFIDReader().setPassword(password);
                connectingDevice.getRFIDReader().connect();
                if (password != null) {
                    SharedPreferences.Editor editor = getActivity().getSharedPreferences(Constants.READER_PASSWORDS, 0).edit();
                    editor.putString(connectingDevice.getName(), password);
                    editor.commit();
                }
            } catch (InvalidUsageException e) {
                e.printStackTrace();
            } catch (OperationFailureException e) {
                e.printStackTrace();
                ex = e;
            }
            if (connectingDevice.getRFIDReader().isConnected()) {
                Application.mConnectedReader = connectingDevice.getRFIDReader();
                try {
                    Application.mConnectedReader.Events.addEventsListener(Application.eventHandler);
                } catch (InvalidUsageException | OperationFailureException e) {
                    e.printStackTrace();
                }
                connectingDevice.getRFIDReader().Events.setBatchModeEvent(true);
                connectingDevice.getRFIDReader().Events.setReaderDisconnectEvent(true);
                connectingDevice.getRFIDReader().Events.setBatteryEvent(true);
                connectingDevice.getRFIDReader().Events.setInventoryStopEvent(true);
                connectingDevice.getRFIDReader().Events.setInventoryStartEvent(true);
                // if no exception in connect
                if (ex == null) {
                    try {
                        MainActivity.UpdateReaderConnection(false);
                    } catch (InvalidUsageException | OperationFailureException e) {
                        e.printStackTrace();
                    }
                } else {
                    MainActivity.clearSettings();
                }
                return true;
            } else {
                return false;
            }
        }

        @Override
        protected void onPostExecute(Boolean result) {
            super.onPostExecute(result);
            progressDialog.cancel();
            if (ex != null) {
                if (ex.getResults() == RFIDResults.RFID_CONNECTION_PASSWORD_ERROR) {
                    showPasswordDialog(connectingDevice);
                    bluetoothDeviceConnected(connectingDevice);
                } else if (ex.getResults() == RFIDResults.RFID_BATCHMODE_IN_PROGRESS) {
                    Application.isBatchModeInventoryRunning = true;
                    Application.mIsInventoryRunning = true;
                    bluetoothDeviceConnected(connectingDevice);
                    if (Application.NOTIFY_READER_CONNECTION)
                        sendNotification(Constants.ACTION_READER_CONNECTED, "Connected to " + connectingDevice.getName());
                } else if (ex.getResults() == RFIDResults.RFID_READER_REGION_NOT_CONFIGURED) {
                    bluetoothDeviceConnected(connectingDevice);
                    Application.regionNotSet = true;
                    sendNotification(Constants.ACTION_READER_STATUS_OBTAINED, getString(R.string.set_region_msg));
                    Intent detailsIntent = new Intent(getActivity(), SettingsDetailActivity.class);
                    detailsIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
                    detailsIntent.putExtra(Constants.SETTING_ITEM_ID, 7);
                    startActivity(detailsIntent);
                } else
                    bluetoothDeviceConnFailed(connectingDevice);
            } else {
                if (result) {
                    if (Application.NOTIFY_READER_CONNECTION)
                        sendNotification(Constants.ACTION_READER_CONNECTED, "Connected to " + connectingDevice.getName());
                    bluetoothDeviceConnected(connectingDevice);
                } else {
                    bluetoothDeviceConnFailed(connectingDevice);
                }
            }
            deviceConnectTask = null;
        }

        @Override
        protected void onCancelled() {
            deviceConnectTask = null;
            super.onCancelled();
        }

        public ReaderDevice getConnectingDevice() {
            return connectingDevice;
        }
    }
}
