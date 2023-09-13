package com.zebra.rfidreader.demo.zebra.home;

import android.Manifest;
import android.animation.ObjectAnimator;
import android.animation.PropertyValuesHolder;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.Dialog;
import android.bluetooth.BluetoothAdapter;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ActivityInfo;
import android.content.res.Configuration;
import android.graphics.Typeface;
import android.location.Location;
import android.os.AsyncTask;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.util.DisplayMetrics;
import android.util.Log;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.view.ViewGroup;
import android.widget.AutoCompleteTextView;
import android.widget.Button;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.ActionBarDrawerToggle;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;
import androidx.core.view.GravityCompat;
import androidx.drawerlayout.widget.DrawerLayout;
import androidx.fragment.app.Fragment;
import androidx.fragment.app.FragmentManager;
import androidx.lifecycle.ViewModelProviders;

import com.google.android.material.bottomsheet.BottomSheetBehavior;
import com.google.android.material.snackbar.Snackbar;
import com.google.zxing.client.android.Intents;
import com.google.zxing.common.StringUtils;
import com.google.zxing.integration.android.IntentIntegrator;
import com.journeyapps.barcodescanner.CaptureActivity;
import com.oguzdev.circularfloatingactionmenu.library.FloatingActionButton;
import com.oguzdev.circularfloatingactionmenu.library.FloatingActionMenu;
import com.oguzdev.circularfloatingactionmenu.library.SubActionButton;
import com.zebra.rfid.api3.ACCESS_OPERATION_CODE;
import com.zebra.rfid.api3.ACCESS_OPERATION_STATUS;
import com.zebra.rfid.api3.BATCH_MODE;
import com.zebra.rfid.api3.Events;
import com.zebra.rfid.api3.HANDHELD_TRIGGER_EVENT_TYPE;
import com.zebra.rfid.api3.InvalidUsageException;
import com.zebra.rfid.api3.LOCK_DATA_FIELD;
import com.zebra.rfid.api3.LOCK_PRIVILEGE;
import com.zebra.rfid.api3.MEMORY_BANK;
import com.zebra.rfid.api3.OperationFailureException;
import com.zebra.rfid.api3.RFIDResults;
import com.zebra.rfid.api3.ReaderDevice;
import com.zebra.rfid.api3.Readers;
import com.zebra.rfid.api3.RfidEventsListener;
import com.zebra.rfid.api3.RfidReadEvents;
import com.zebra.rfid.api3.RfidStatusEvents;
import com.zebra.rfid.api3.START_TRIGGER_TYPE;
import com.zebra.rfid.api3.STATUS_EVENT_TYPE;
import com.zebra.rfid.api3.STOP_TRIGGER_TYPE;
import com.zebra.rfid.api3.SetAttribute;
import com.zebra.rfid.api3.TAG_FIELD;
import com.zebra.rfid.api3.TagAccess;
import com.zebra.rfid.api3.TagData;
import com.zebra.rfidreader.demo.R;
import com.zebra.rfidreader.demo.bari_citta_connessa.customs.bottomSheet.CustomBottomSheetBehavior;
import com.zebra.rfidreader.demo.bari_citta_connessa.customs.bottomSheet.CustomBottomSheetPhoneBehavior;
import com.zebra.rfidreader.demo.bari_citta_connessa.data.AssetDetail;
import com.zebra.rfidreader.demo.bari_citta_connessa.data.GetCheckAssetResponse;
import com.zebra.rfidreader.demo.bari_citta_connessa.data.UserLogged;
import com.zebra.rfidreader.demo.bari_citta_connessa.data.Violation;
import com.zebra.rfidreader.demo.bari_citta_connessa.interfaces.CallbackActivityMainToMapFragment;
import com.zebra.rfidreader.demo.bari_citta_connessa.interfaces.CallbackMapFragmentToActivityMain;
import com.zebra.rfidreader.demo.bari_citta_connessa.interfaces.ErrorOwner;
import com.zebra.rfidreader.demo.bari_citta_connessa.interfaces.LoadingObserver;
import com.zebra.rfidreader.demo.bari_citta_connessa.network.Controllers;
import com.zebra.rfidreader.demo.bari_citta_connessa.network.NetworkController;
import com.zebra.rfidreader.demo.bari_citta_connessa.ui.activity.SearchConcessionsActivity;
import com.zebra.rfidreader.demo.bari_citta_connessa.ui.activity.UserActivity;
import com.zebra.rfidreader.demo.bari_citta_connessa.ui.fragment.HistoryFragment;
import com.zebra.rfidreader.demo.bari_citta_connessa.ui.fragment.ListEventIdTagFragment;
import com.zebra.rfidreader.demo.bari_citta_connessa.ui.fragment.QRCodeDialogFragment;
import com.zebra.rfidreader.demo.bari_citta_connessa.ui.fragment.ReportingFragment;
import com.zebra.rfidreader.demo.bari_citta_connessa.ui.viewmodel.FilterViewModel;
import com.zebra.rfidreader.demo.bari_citta_connessa.ui.viewmodel.UtilViewModel;
import com.zebra.rfidreader.demo.bari_citta_connessa.utils.Utils;
import com.zebra.rfidreader.demo.zebra.access_operations.AccessOperationsFragment;
import com.zebra.rfidreader.demo.zebra.access_operations.AccessOperationsLockFragment;
import com.zebra.rfidreader.demo.zebra.application.Application;
import com.zebra.rfidreader.demo.zebra.common.Constants;
import com.zebra.rfidreader.demo.zebra.common.CustomProgressDialog;
import com.zebra.rfidreader.demo.zebra.common.CustomToast;
import com.zebra.rfidreader.demo.zebra.common.Inventorytimer;
import com.zebra.rfidreader.demo.zebra.common.ResponseHandlerInterfaces;
import com.zebra.rfidreader.demo.zebra.common.ResponseHandlerInterfaces.BatteryNotificationHandler;
import com.zebra.rfidreader.demo.zebra.common.ResponseHandlerInterfaces.BluetoothDeviceFoundHandler;
import com.zebra.rfidreader.demo.zebra.data_export.DataExportTask;
import com.zebra.rfidreader.demo.zebra.inventory.InventoryFragment;
import com.zebra.rfidreader.demo.zebra.inventory.InventoryListItem;
import com.zebra.rfidreader.demo.zebra.locate_tag.RangeGraph;
import com.zebra.rfidreader.demo.zebra.notifications.NotificationsService;
import com.zebra.rfidreader.demo.zebra.rapidread.RapidReadFragment;
import com.zebra.rfidreader.demo.zebra.reader_connection.ReadersListFragment;
import com.zebra.rfidreader.demo.zebra.settings.SettingListFragment;
import com.zebra.rfidreader.demo.zebra.settings.SettingsContent;
import com.zebra.rfidreader.demo.zebra.settings.SettingsDetailActivity;

import org.jetbrains.annotations.NotNull;

import java.util.ArrayList;
import java.util.Timer;
import java.util.TimerTask;

import it.almaviva.baricittaconnessa.ui.fragment.MapClusterFragment;

import static com.zebra.rfidreader.demo.bari_citta_connessa.utils.BariCittaConnessaConstantsKt.TAG_CONTENT_FRAGMENT;
import static com.zebra.rfidreader.demo.bari_citta_connessa.utils.StringUtilsKt.capitalize;
import static com.zebra.rfidreader.demo.bari_citta_connessa.utils.StringUtilsKt.formattedStringDate;
import static com.zebra.rfidreader.demo.bari_citta_connessa.utils.UtilsKt.statoPraticaPassiCarrabili;
import static com.zebra.rfidreader.demo.zebra.common.Constants.ALL;
import static com.zebra.rfidreader.demo.zebra.common.Constants.NOT_VALID;
import static com.zebra.rfidreader.demo.zebra.common.Constants.VALID;


public class MainActivity extends AppCompatActivity implements Readers.RFIDReaderEventHandler, CallbackMapFragmentToActivityMain, LoadingObserver, ErrorOwner {
    //Messages for progress bar
    private static final String MSG_READ = "Reading Tags";
    private static final String MSG_WRITE = "Writing Data";
    private static final String MSG_LOCK = "Executing Lock Command";
    private static final String MSG_KILL = "Executing Kill Command";
    private static final Integer PERMISSIONS_MULTIPLE_REQUEST = 123;
    public static Timer t;
    public static boolean isAdded = false;
    public static boolean checkAssetValidity = false;
    private static ArrayList<BluetoothDeviceFoundHandler> bluetoothDeviceFoundHandlers = new ArrayList<>();
    private static ArrayList<BatteryNotificationHandler> batteryNotificationHandlers = new ArrayList<>();
    public boolean isInventoryAborted;
    protected boolean isLocationingAborted;
    protected int accessTagCount;
    //To indicate indeterminate progress
    protected CustomProgressDialog progressDialog;
    protected Menu menu;
    private CharSequence mTitle;
    private String[] mOptionTitles;
    private Boolean isTriggerRepeat;
    private boolean pc = false;
    private boolean rssi = false;
    private boolean phase = false;
    private boolean channelIndex = false;
    private boolean tagSeenCount = false;
    private boolean isDeviceDisconnected = false;
    private AsyncTask<Void, Void, Boolean> DisconnectTask;
    private UtilViewModel utilViewModel;
    private FilterViewModel filterViewModel;
    private GetCheckAssetResponse getCheckAssetResponse;

    // PARAMETRI DELLA BARICITTACONNESSAACTIVITY
    //UI
    private static final int QRCODEACTIVITYCODE = 567;
    private Context context = this;
    private BottomSheetBehavior behavior;
    private MapClusterFragment mapClusterFragment = new MapClusterFragment();
    private Toolbar toolbar;
    private FragmentManager fm;
    private IntentIntegrator qrScanIntegrator;

    private Button switchInfoAsset;
    private Button switchInfoCittadino;

    private static Location location;

    //Listener
    private CallbackActivityMainToMapFragment callback = null;

    // FINE PARAMETRI DELLA BARICITTACONNESSAACTIVITY

    public static boolean isBluetoothEnabled() {
        if (BluetoothAdapter.getDefaultAdapter() != null)
            return BluetoothAdapter.getDefaultAdapter().isEnabled();
        else return false;
    }

    public static void addBluetoothDeviceFoundHandler(BluetoothDeviceFoundHandler bluetoothDeviceFoundHandler) {
        bluetoothDeviceFoundHandlers.add(bluetoothDeviceFoundHandler);
    }

    public static void addBatteryNotificationHandler(BatteryNotificationHandler batteryNotificationHandler) {
        batteryNotificationHandlers.add(batteryNotificationHandler);
    }

    public static void startTimer() {
        if (t == null) {
            TimerTask task = new TimerTask() {
                @Override
                public void run() {
                    try {
                        if (Application.mConnectedReader != null)
                            Application.mConnectedReader.Config.getDeviceStatus(true, false, false);
                        else
                            stopTimer();
                    } catch (InvalidUsageException | OperationFailureException e) {
                        e.printStackTrace();
                    }
                }
            };
            t = new Timer();
            t.scheduleAtFixedRate(task, 0, 60000);
        }
    }

    public static void clearSettings() {
        Application.antennaPowerLevel = null;
        Application.antennaRfConfig = null;
        Application.singulationControl = null;
        Application.rfModeTable = null;
        Application.regulatory = null;
        Application.batchMode = -1;
        Application.tagStorageSettings = null;
        Application.reportUniquetags = null;
        Application.dynamicPowerSettings = null;
        Application.settings_startTrigger = null;
        Application.settings_stopTrigger = null;
        Application.beeperVolume = null;
        Application.preFilters = null;
        if (Application.versionInfo != null)
            Application.versionInfo.clear();
        Application.regionNotSet = false;
        Application.isBatchModeInventoryRunning = null;
        Application.BatteryData = null;
        Application.is_disconnection_requested = false;
        Application.mConnectedDevice = null;
    }

    public static void stopTimer() {
        if (t != null) {
            t.cancel();
            t.purge();
        }
        t = null;
    }

    public void setupScanner() {
        qrScanIntegrator = new IntentIntegrator(this);
        qrScanIntegrator.setOrientationLocked(false);
    }

    public static void UpdateReaderConnection(Boolean fullUpdate) throws InvalidUsageException, OperationFailureException {
        Application.mConnectedReader.Events.setBatchModeEvent(true);
        Application.mConnectedReader.Events.setReaderDisconnectEvent(true);
        Application.mConnectedReader.Events.setInventoryStartEvent(true);
        Application.mConnectedReader.Events.setInventoryStopEvent(true);
        Application.mConnectedReader.Events.setTagReadEvent(true);
        Application.mConnectedReader.Events.setHandheldEvent(true);
        Application.mConnectedReader.Events.setBatteryEvent(true);
        Application.mConnectedReader.Events.setPowerEvent(true);
        Application.mConnectedReader.Events.setOperationEndSummaryEvent(true);

        if (fullUpdate)
            Application.mConnectedReader.PostConnectReaderUpdate();

        Application.regulatory = Application.mConnectedReader.Config.getRegulatoryConfig();
        Application.regionNotSet = false;
        Application.rfModeTable = Application.mConnectedReader.ReaderCapabilities.RFModes.getRFModeTableInfo(0);
        Application.antennaRfConfig = Application.mConnectedReader.Config.Antennas.getAntennaRfConfig(1);
        Application.singulationControl = Application.mConnectedReader.Config.Antennas.getSingulationControl(1);
        Application.settings_startTrigger = Application.mConnectedReader.Config.getStartTrigger();
        Application.settings_stopTrigger = Application.mConnectedReader.Config.getStopTrigger();
        Application.tagStorageSettings = Application.mConnectedReader.Config.getTagStorageSettings();
        Application.dynamicPowerSettings = Application.mConnectedReader.Config.getDPOState();
        Application.beeperVolume = Application.mConnectedReader.Config.getBeeperVolume();
        Application.batchMode = Application.mConnectedReader.Config.getBatchModeConfig().getValue();
        Application.reportUniquetags = Application.mConnectedReader.Config.getUniqueTagReport();
        Application.mConnectedReader.Config.getDeviceVersionInfo(Application.versionInfo);
        SetAttribute setAttributeInfo = new SetAttribute();
        setAttributeInfo.setAttnum(1664);
        setAttributeInfo.setAtttype("B");
        setAttributeInfo.setAttvalue("0");
        Application.mConnectedReader.Config.setAttribute(setAttributeInfo);
        startTimer();
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        utilViewModel = ViewModelProviders.of(this).get(UtilViewModel.class);
        filterViewModel = ViewModelProviders.of(MainActivity.this).get(FilterViewModel.class);
        utilViewModel.setUserLogged((UserLogged) getIntent().getSerializableExtra("USERLOGGED"));
        setupScanner();

        DisplayMetrics displayMetrics = getResources().getDisplayMetrics();
        float dpWidth = displayMetrics.widthPixels / displayMetrics.density;
        utilViewModel.setIsPhone(dpWidth < 800);
        if (utilViewModel.isPhone()) {
            //setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE);
        } else {
            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE);
        }


        mOptionTitles = getResources().getStringArray(R.array.options_array);
        getWindow().setLayout(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT);

        Application.eventHandler = new EventHandler();
        Inventorytimer.getInstance().setActivity(this);
        initializeConnectionSettings();

        if (Application.readers == null) {
            Application.readers = new Readers();
        }
        Readers.attach(this);
        if (!isBluetoothEnabled()) {
            Intent enableIntent = new Intent(BluetoothAdapter.ACTION_REQUEST_ENABLE);
            startActivity(enableIntent);
        }

        // PARTE PER BARICITTACONNESSAACTIVITY

        setContentView(R.layout.activity_bari_main);
        toolbar = findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);
        toolbar.setTitle(R.string.app_name_main);
        switchInfoAsset = findViewById(R.id.buttonCittadino);
        switchInfoCittadino = findViewById(R.id.buttonAsset);

        fm = getSupportFragmentManager();

        utilViewModel.getLoadingState().observe(this, e -> {
            if (e.isPending()) {
                e.complete();
                if ((Boolean) e.getValue()) {
                    findViewById(R.id.loading).setVisibility(View.VISIBLE);
                } else {
                    findViewById(R.id.loading).setVisibility(View.GONE);
                }
            }
        });

        /* mappa */
        fm.beginTransaction().add(R.id.content_frame, mapClusterFragment, "TAG_CONTENT_FRAGMENT").commit();
        registerClientFragment(mapClusterFragment);
        //*******************************************************************/

        (findViewById(R.id.fab)).setOnClickListener(v -> ((MapClusterFragment) (getSupportFragmentManager().findFragmentByTag(TAG_CONTENT_FRAGMENT))).retrieveCameraToMyPosition());

        switchInfoAsset.setOnClickListener(v -> {
            findViewById(R.id.info_passo1_layout).setVisibility(View.GONE);
            findViewById(R.id.info_passo2_layout).setVisibility(View.VISIBLE);
        });
        switchInfoCittadino.setOnClickListener(v -> {
            findViewById(R.id.info_passo2_layout).setVisibility(View.GONE);
            findViewById(R.id.info_passo1_layout).setVisibility(View.VISIBLE);
        });

        behavior = BottomSheetBehavior.from(findViewById(R.id.bottom_sheet));
        behavior.setPeekHeight(Utils.Companion.dpToPx(65));

        ImageView portraitFab1 = null;
        ImageView portraitFab2 = null;
        ImageView portraitFab3 = null;

        if (utilViewModel.isPhone()) {

            final ImageView fabIconNew = new ImageView(this);
            fabIconNew.setImageDrawable(getResources().getDrawable(R.drawable.ic_plus));
            FloatingActionButton.LayoutParams params = new FloatingActionButton.LayoutParams(150, 150);
            params.setMargins(0, 0, 90, 260);
            final FloatingActionButton rightLowerButton = new FloatingActionButton.Builder(this)
                    .setContentView(fabIconNew)
                    .setBackgroundDrawable(R.drawable.circle_red)
                    .setLayoutParams(params)
                    .build();

            FrameLayout.LayoutParams paramsSub = new FrameLayout.LayoutParams(150, 150);
            SubActionButton.Builder rLSubBuilder = new SubActionButton.Builder(this)
                    .setBackgroundDrawable(getResources().getDrawable(R.drawable.circle_white))
                    .setLayoutParams(paramsSub);
            portraitFab1 = new ImageView(this);
            portraitFab2 = new ImageView(this);
            portraitFab3 = new ImageView(this);

            portraitFab2.setImageDrawable(getResources().getDrawable(R.mipmap.icon_camera));
            portraitFab3.setImageDrawable(getResources().getDrawable(R.mipmap.icon_reclaim));

            final FloatingActionMenu rightLowerMenu = new FloatingActionMenu.Builder(this)
                    .addSubActionView(rLSubBuilder.setContentView(portraitFab1).build())
                    .addSubActionView(rLSubBuilder.setContentView(portraitFab2).build())
                    .addSubActionView(rLSubBuilder.setContentView(portraitFab3).build())
                    .attachTo(rightLowerButton)
                    .build();

            ((DrawerLayout) findViewById(R.id.drawer_layout)).addDrawerListener(new DrawerLayout.DrawerListener() {
                @Override
                public void onDrawerSlide(@NonNull View drawerView, float slideOffset) {
                    // nothing
                }

                @Override
                public void onDrawerOpened(@NonNull View drawerView) {
                    rightLowerMenu.close(true);
                    rightLowerButton.setVisibility(View.GONE);
                }

                @Override
                public void onDrawerClosed(@NonNull View drawerView) {
                    rightLowerButton.setVisibility(View.VISIBLE);
                }

                @Override
                public void onDrawerStateChanged(int newState) {
                    // nothing
                }
            });

            // Listen menu open and close events to animate the button content view
            rightLowerMenu.setStateChangeListener(new FloatingActionMenu.MenuStateChangeListener() {
                @Override
                public void onMenuOpened(FloatingActionMenu menu) {
                    // Rotate the icon of rightLowerButton 45 degrees clockwise
                    fabIconNew.setRotation(0);
                    PropertyValuesHolder pvhR = PropertyValuesHolder.ofFloat(View.ROTATION, 45);
                    ObjectAnimator animation = ObjectAnimator.ofPropertyValuesHolder(fabIconNew, pvhR);
                    animation.start();
                }

                @Override
                public void onMenuClosed(FloatingActionMenu menu) {
                    // Rotate the icon of rightLowerButton 45 degrees counter-clockwise
                    fabIconNew.setRotation(45);
                    PropertyValuesHolder pvhR = PropertyValuesHolder.ofFloat(View.ROTATION, 0);
                    ObjectAnimator animation = ObjectAnimator.ofPropertyValuesHolder(fabIconNew, pvhR);
                    animation.start();
                }
            });

        } else {
            behavior.setBottomSheetCallback(new BottomSheetBehavior.BottomSheetCallback() {

                public void onStateChanged(View bottomSheet, int newState) {
                    if (newState == BottomSheetBehavior.STATE_EXPANDED) {

                    } else if (newState == BottomSheetBehavior.STATE_COLLAPSED) {
                        findViewById(R.id.info_botton_sheet).setVisibility(View.VISIBLE);
                    }
                }


                public void onSlide(View bottomSheet, float slideOffset) {

                    findViewById(R.id.fab3).animate().scaleX(1 - slideOffset).setDuration(0).start();
                    findViewById(R.id.fab3).animate().scaleY(1 - slideOffset).setDuration(0).start();
                    findViewById(R.id.constr).animate().translationX((slideOffset) * 300).setDuration(0).start();

                    callback.onOffsetBottomSheet(slideOffset);
                }


            });
        }

        View fab2;
        View fab3;
        if (utilViewModel.isPhone()) {
            fab2 = portraitFab2;
            fab3 = portraitFab3;
        } else {
            fab2 = findViewById(R.id.fab2);
            fab3 = findViewById(R.id.fab3);
        }

        //Dialog reporting
        fab2.setOnClickListener(v -> {
            if (location == null) {
                Toast.makeText(context, "Posizione non ancora disponibile, si prega di riprovare", Toast.LENGTH_LONG).show();
            } else {
                ReportingFragment.Companion.show(getSupportFragmentManager(), location, null, null);
            }

        });

        //Dialog history
        fab3.setOnClickListener(v -> HistoryFragment.Companion.show(getSupportFragmentManager()));


        final DrawerLayout drawer = findViewById(R.id.drawer_layout);
        ActionBarDrawerToggle toggle = new ActionBarDrawerToggle(this, drawer, toolbar, R.string.navigation_drawer_open, R.string.navigation_drawer_close);
        drawer.addDrawerListener(toggle);
        toggle.syncState();


        final Controllers controllers = NetworkController.Companion.getINSTANCE().getControllers();
        controllers.getPoiAll().observe(this, getPoiResponseNetworkResponse -> {
            if (getPoiResponseNetworkResponse != null && getPoiResponseNetworkResponse.isSuccessful()) {

                //List<AssetType> assetType = getPoiResponseNetworkResponse.getValue().getResult();
                filterViewModel.getFilters().setValue(ALL);
                if (drawer.isDrawerOpen(GravityCompat.START)) {
                    drawer.closeDrawer(GravityCompat.START);
                }
                onMoveStateVisibleShowBottomSheet(false);
                onClickMapCloseBottomSheet();
            }
        });

        TextView allButton = findViewById(R.id.all_poi_button);
        TextView validButton = findViewById(R.id.valid_poi_button);
        TextView invalidButton = findViewById(R.id.invalid_poi_button);

        allButton.setOnClickListener(view -> {
            filterViewModel.getFilters().postValue(ALL);
            if (drawer.isDrawerOpen(GravityCompat.START)) {
                drawer.closeDrawer(GravityCompat.START);
            }
        });

        validButton.setOnClickListener(view -> {
            filterViewModel.getFilters().postValue(VALID);
            if (drawer.isDrawerOpen(GravityCompat.START)) {
                drawer.closeDrawer(GravityCompat.START);
            }
        });

        invalidButton.setOnClickListener(view -> {
            filterViewModel.getFilters().postValue(NOT_VALID);
            if (drawer.isDrawerOpen(GravityCompat.START)) {
                drawer.closeDrawer(GravityCompat.START);
            }
        });

        filterViewModel.getFilters().observe(this, s -> {
            if (s != null) {
                switch (s) {
                    case ALL: {
                        allButton.setTypeface(null, Typeface.BOLD);
                        allButton.setTextColor(getResources().getColor(R.color.colorBlack));
                        validButton.setTypeface(null, Typeface.NORMAL);
                        validButton.setTextColor(getResources().getColor(R.color.colorGreyPress));
                        invalidButton.setTypeface(null, Typeface.NORMAL);
                        invalidButton.setTextColor(getResources().getColor(R.color.colorGreyPress));
                        break;
                    }
                    case VALID: {
                        allButton.setTypeface(null, Typeface.NORMAL);
                        allButton.setTextColor(getResources().getColor(R.color.colorGreyPress));
                        validButton.setTypeface(null, Typeface.BOLD);
                        validButton.setTextColor(getResources().getColor(R.color.colorBlack));
                        invalidButton.setTypeface(null, Typeface.NORMAL);
                        invalidButton.setTextColor(getResources().getColor(R.color.colorGreyPress));
                        break;
                    }
                    case NOT_VALID: {
                        allButton.setTypeface(null, Typeface.NORMAL);
                        allButton.setTextColor(getResources().getColor(R.color.colorGreyPress));
                        validButton.setTypeface(null, Typeface.NORMAL);
                        validButton.setTextColor(getResources().getColor(R.color.colorGreyPress));
                        invalidButton.setTypeface(null, Typeface.BOLD);
                        invalidButton.setTextColor(getResources().getColor(R.color.colorBlack));
                        break;
                    }
                }
            }
        });


        utilViewModel.getMessage().observe(this, s -> {
            if (s != null) {
                Snackbar snackbar = Snackbar.make(findViewById(android.R.id.content), s, Snackbar.LENGTH_LONG);
                snackbar.show();
            }
        });

        utilViewModel.getShowPermissionSnackBar().observe(this, s -> {
            if (s != null) {
                Snackbar snackbar = Snackbar.make(findViewById(android.R.id.content), s, Snackbar.LENGTH_INDEFINITE).setAction("ATTIVA", new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                            requestPermissions(new String[]{Manifest.permission.WRITE_EXTERNAL_STORAGE, Manifest.permission.READ_EXTERNAL_STORAGE, Manifest.permission.CAMERA}, PERMISSIONS_MULTIPLE_REQUEST);
                        }
                    }
                });
                snackbar.show();
            }
        });

        // FINE PARTE PER BARICITTACONNESSAACTIVITY

    }

    private void initializeConnectionSettings() {
        SharedPreferences settings = getSharedPreferences(Constants.APP_SETTINGS_STATUS, 0);
        Application.AUTO_DETECT_READERS = settings.getBoolean(Constants.AUTO_DETECT_READERS, true);
        Application.AUTO_RECONNECT_READERS = settings.getBoolean(Constants.AUTO_RECONNECT_READERS, false);
        Application.NOTIFY_READER_AVAILABLE = settings.getBoolean(Constants.NOTIFY_READER_AVAILABLE, false);
        Application.NOTIFY_READER_CONNECTION = settings.getBoolean(Constants.NOTIFY_READER_CONNECTION, false);
        Application.NOTIFY_BATTERY_STATUS = settings.getBoolean(Constants.NOTIFY_BATTERY_STATUS, true);
        Application.EXPORT_DATA = settings.getBoolean(Constants.EXPORT_DATA, false);
    }

    @Override
    protected void onDestroy() {
        callback = null; //BARICITTACONNESSAMAIN
        //
        if (DisconnectTask != null)
            DisconnectTask.cancel(true);
        try {
            if (Application.mConnectedReader != null) {
                Application.mConnectedReader.Events.removeEventsListener(Application.eventHandler);
                Application.mConnectedReader.disconnect();
            }
        } catch (InvalidUsageException e) {
            e.printStackTrace();
        } catch (OperationFailureException e) {
            e.printStackTrace();
        }
        Application.mConnectedReader = null;

        //stop Timer
        Inventorytimer.getInstance().stopTimer();
        stopTimer();

        //update dpo icon in settings list
        SettingsContent.ITEMS.get(8).icon = R.drawable.title_dpo_disabled;
        clearSettings();
        Application.mConnectedDevice = null;
        Application.mConnectedReader = null;
        ReadersListFragment.readersList.clear();
        Readers.deattach(this);
        Application.reset();
        super.onDestroy();
    }

    @Override
    public boolean onPrepareOptionsMenu(Menu menu) {
        return super.onPrepareOptionsMenu(menu);
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {

        // Handle action buttons
        switch (item.getItemId()) {
            case R.id.action_settings:
                startActivity(new Intent(this, SettingsDetailActivity.class));
                return true;

            case R.id.action_search:
                startActivityForResult(new Intent(this, SearchConcessionsActivity.class), 555);
                return true;

            case R.id.action_qrcode_scan: {
                Intent intent = new Intent(this, CaptureActivity.class);
                startActivityForResult(intent, QRCODEACTIVITYCODE);
                return true;
            }

            case R.id.action_user: {
                Intent intent = new Intent(this, UserActivity.class);
                intent.putExtra("USERLOGGED", utilViewModel.getUserLogged());
                startActivity(intent);
                return true;
            }

            default:
                return super.onOptionsItemSelected(item);

        }
    }

    private void registerClientFragment(Fragment fragment) {
        if (TAG_CONTENT_FRAGMENT.equals(fragment.getTag())) {
            this.callback = (CallbackActivityMainToMapFragment) fragment;
        }
    }

    public void onMoveStateVisibleShowBottomSheet(boolean stateView) {
        if (behavior instanceof CustomBottomSheetBehavior) {
            ((CustomBottomSheetBehavior<View>) behavior).setAllowUserDragging(stateView);
        } else if (behavior instanceof CustomBottomSheetPhoneBehavior) {
            ((CustomBottomSheetPhoneBehavior<View>) behavior).setAllowUserDragging(stateView);
        }
    }

    public void onInfoSingleTowAwayZone(GetCheckAssetResponse assetDetailResponse, String id_doc) {
        getCheckAssetResponse = assetDetailResponse;

        AssetDetail assetDetail = null;

        for (int i = 0; i < getCheckAssetResponse.getResult().size(); i++) {
            if (getCheckAssetResponse.getResult().get(i).getId_doc().equals(id_doc)) {
                assetDetail = getCheckAssetResponse.getResult().get(i);
            }
        }
        if (assetDetail != null) {
            checkValidity(getCheckAssetResponse.getViolation(), assetDetail);

            if (behavior.getState() == BottomSheetBehavior.STATE_COLLAPSED) {
                behavior.setState((BottomSheetBehavior.STATE_EXPANDED));
            }
            if (behavior.getState() == BottomSheetBehavior.STATE_EXPANDED) {
                behavior.setState((BottomSheetBehavior.STATE_COLLAPSED));

                Timer time = new Timer();
                time.schedule(new TimerTask() {
                    @Override
                    public void run() {
                        behavior.setState((BottomSheetBehavior.STATE_EXPANDED));
                    }
                }, 500);

            }

            ((TextView) findViewById(R.id.info_botton_sheet)).setText("TAG: " + assetDetail.getTag_rfid());

            /* indirizzo segnale indicatore */
            if (assetDetail.getDati_istanza() != null &&
                    assetDetail.getDati_istanza().getIndirizzo_segnale_indicatore() != null &&
                    assetDetail.getDati_istanza().getIndirizzo_segnale_indicatore().getIndirizzo() != null &&
                    !assetDetail.getDati_istanza().getIndirizzo_segnale_indicatore().getIndirizzo().isEmpty()) {
                ((TextView) findViewById(R.id.text_indirizzo_segnale_indicatore)).setText(assetDetail.getDati_istanza().getIndirizzo_segnale_indicatore().getIndirizzo());
            }
            /* stato pratica */
            if (assetDetail.getStato_pratica() != null) {
                String string = statoPraticaPassiCarrabili(assetDetail.getStato_pratica());
                if (getCheckAssetResponse.getViolation() != null && Boolean.FALSE.equals(getCheckAssetResponse.getViolation().isValid())) {
                    string = string + " (Fuori area rilevazione)";
                }
                ((TextView) findViewById(R.id.text_stato_pratica)).setText(string);
            }
            /* numero determina */
            if (assetDetail.getDetermina() != null && assetDetail.getDetermina().getId() != null && !assetDetail.getDetermina().getId().isEmpty()) {
                ((TextView) findViewById(R.id.text_numero_determina)).setText(assetDetail.getDetermina().getId());
            }
            /* data emissione determina */
            if (assetDetail.getDetermina() != null &&
                    assetDetail.getDetermina().getData_emissione() != null &&
                    !assetDetail.getDetermina().getData_emissione().isEmpty()) {
                ((TextView) findViewById(R.id.text_data_emissione_determina)).setText(formattedStringDate(assetDetail.getDetermina().getData_emissione(), false));
            }
            /* numero protocollo */
            if (assetDetail.getNumero_protocollo() != null && !assetDetail.getNumero_protocollo().isEmpty()) {
                ((TextView) findViewById(R.id.text_numero_protocollo)).setText(assetDetail.getNumero_protocollo());
            }
            /* data scadenza concessione */
            if (assetDetail.getDati_istanza() != null &&
                    assetDetail.getDati_istanza().getData_scadenza_concessione() != null &&
                    !assetDetail.getDati_istanza().getData_scadenza_concessione().isEmpty()) {
                ((TextView) findViewById(R.id.text_data_scadenza_concessione)).setText(formattedStringDate(assetDetail.getDati_istanza().getData_scadenza_concessione(), false));
            }
            /* numero protocollo comunicazione */
            if (assetDetail.getNumero_protocollo_comunicazione() != null && !assetDetail.getNumero_protocollo_comunicazione().isEmpty()) {
                ((TextView) findViewById(R.id.text_numero_protocollo_comunicazione)).setText(assetDetail.getNumero_protocollo_comunicazione());
            }

            if (assetDetail.getAnagrafica() != null) {

                if (assetDetail.getAnagrafica().getCodice_fiscale() != null && !assetDetail.getAnagrafica().getCodice_fiscale().isEmpty()) {
                    ((TextView) findViewById(R.id.text_codicefiscale_info_pass)).setText(assetDetail.getAnagrafica().getCodice_fiscale());
                }
                if (assetDetail.getAnagrafica().getNome() != null && !assetDetail.getAnagrafica().getNome().isEmpty()) {
                    ((TextView) findViewById(R.id.text_nome_info_pass)).setText(capitalize(assetDetail.getAnagrafica().getNome()));
                }
                if (assetDetail.getAnagrafica().getCognome() != null && !assetDetail.getAnagrafica().getCognome().isEmpty()) {
                    ((TextView) findViewById(R.id.text_cognome_info_pass)).setText(capitalize(assetDetail.getAnagrafica().getCognome()));
                }
                if (assetDetail.getAnagrafica().getData_nascita() != null && !assetDetail.getAnagrafica().getData_nascita().isEmpty()) {
                    ((TextView) findViewById(R.id.text_datanascita_info_pass)).setText(formattedStringDate(assetDetail.getAnagrafica().getData_nascita(), false));
                }
                if (assetDetail.getAnagrafica().getLuogo_nascita() != null && !assetDetail.getAnagrafica().getLuogo_nascita().isEmpty()) {
                    ((TextView) findViewById(R.id.text_luogonascita_info_pass)).setText(assetDetail.getAnagrafica().getLuogo_nascita());
                }
                if (assetDetail.getAnagrafica().getRecapito_telefonico() != null && !assetDetail.getAnagrafica().getRecapito_telefonico().isEmpty()) {
                    ((TextView) findViewById(R.id.text_numtel_info_pass)).setText(assetDetail.getAnagrafica().getRecapito_telefonico());
                }
                if (assetDetail.getAnagrafica().getEmail() != null && !assetDetail.getAnagrafica().getEmail().isEmpty()) {
                    ((TextView) findViewById(R.id.text_email_info_pass)).setText(assetDetail.getAnagrafica().getEmail());
                }
                if (assetDetail.getAnagrafica().getRagione_sociale() != null && !assetDetail.getAnagrafica().getRagione_sociale().isEmpty()) {
                    ((TextView) findViewById(R.id.text_ragione_sociale_info_pass)).setText(assetDetail.getAnagrafica().getRagione_sociale());
                }
                if (assetDetail.getAnagrafica().getCodice_fiscale_piva() != null && !assetDetail.getAnagrafica().getCodice_fiscale_piva().isEmpty()) {
                    ((TextView) findViewById(R.id.text_partita_iva_info_pass)).setText(assetDetail.getAnagrafica().getCodice_fiscale_piva());
                }
            }
            findViewById(R.id.info_passo1_layout).setVisibility(View.VISIBLE);
            findViewById(R.id.info_passo2_layout).setVisibility(View.GONE);
        }
    }

    public void onClickMapCloseBottomSheet() {
        ((TextView) findViewById(R.id.info_botton_sheet)).setText("Selezionare un POI");
        (findViewById(R.id.bottom_sheet_bar)).setBackgroundColor(getResources().getColor(R.color.colorWhite));
        (findViewById(R.id.icon_validity_poi)).setVisibility(View.GONE);
        if (behavior.getState() == BottomSheetBehavior.STATE_EXPANDED) {
            behavior.setState((BottomSheetBehavior.STATE_COLLAPSED));

        }
    }

    @Override
    public void onResume() {
        super.onResume();
        Application.activityResumed();
    }

    @Override
    public void onPause() {
        super.onPause();
        Application.activityPaused();
    }

    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);

        Fragment fragment = getSupportFragmentManager().findFragmentByTag(TAG_CONTENT_FRAGMENT);
        if (fragment instanceof InventoryFragment && newConfig.hardKeyboardHidden == Configuration.HARDKEYBOARDHIDDEN_NO) {
            findViewById(R.id.inventoryDataLayout).setVisibility(View.INVISIBLE);
            findViewById(R.id.inventoryButton).setVisibility(View.INVISIBLE);
        } else if (fragment instanceof InventoryFragment && newConfig.hardKeyboardHidden == Configuration.HARDKEYBOARDHIDDEN_YES) {
            findViewById(R.id.inventoryDataLayout).setVisibility(View.VISIBLE);
            findViewById(R.id.inventoryButton).setVisibility(View.VISIBLE);
        }
    }

    @Override
    public void onBackPressed() {
        DrawerLayout drawer = findViewById(R.id.drawer_layout);
        if (drawer.isDrawerOpen(GravityCompat.START)) {
            drawer.closeDrawer(GravityCompat.START);
        } else {
            super.onBackPressed();
        }
    }

    public void inventoryStartOrStop(View v) {
        Button button = (Button) v;
        if (isBluetoothEnabled()) {
            if (Application.mConnectedReader != null && Application.mConnectedReader.isConnected()) {
                Fragment fragment = getSupportFragmentManager().findFragmentByTag(TAG_CONTENT_FRAGMENT);
                if (!Application.mIsInventoryRunning) {
                    clearInventoryData();
                    button.setText("STOP");
                    //Here we send the inventory command to start reading the tags
                    if (fragment instanceof InventoryFragment) {
                        Spinner memoryBankSpinner = findViewById(R.id.inventoryOptions);
                        memoryBankSpinner.setSelection(Application.memoryBankId);
                        memoryBankSpinner.setEnabled(false);
                        ((InventoryFragment) fragment).resetTagsInfo();
                    }
                    //set flag value
                    isInventoryAborted = false;
                    Application.mIsInventoryRunning = true;
                    getTagReportingfields();

                    if (fragment instanceof InventoryFragment && !((InventoryFragment) fragment).getMemoryBankID().equalsIgnoreCase("none")) {
                        //If memory bank is selected, call read command with appropriate memory bank
                        inventoryWithMemoryBank(((InventoryFragment) fragment).getMemoryBankID());
                    } else {
                        if (fragment instanceof RapidReadFragment) {
                            Application.memoryBankId = -1;
                            ((RapidReadFragment) fragment).resetTagsInfo();
                        }
                        // unique read is enabled
                        if (Application.reportUniquetags != null && Application.reportUniquetags.getValue() == 1) {
                            Application.mConnectedReader.Actions.purgeTags();
                        }
                        //Perform inventory
                        if (Application.inventoryMode == 0) {
                            try {
                                Application.mConnectedReader.Actions.Inventory.perform();
                            } catch (InvalidUsageException e) {
                                e.printStackTrace();
                            } catch (final OperationFailureException e) {
                                e.printStackTrace();
                                {
                                    runOnUiThread(new Runnable() {
                                        @Override
                                        public void run() {
                                            Fragment fragment = getSupportFragmentManager().findFragmentByTag(TAG_CONTENT_FRAGMENT);
                                            if (fragment instanceof ResponseHandlerInterfaces.ResponseStatusHandler)
                                                ((ResponseHandlerInterfaces.ResponseStatusHandler) fragment).handleStatusResponse(e.getResults());
                                            sendNotification(Constants.ACTION_READER_STATUS_OBTAINED, e.getVendorMessage());
                                        }
                                    });
                                }
                            }
                            if (Application.batchMode != -1) {
                                if (Application.batchMode == BATCH_MODE.ENABLE.getValue())
                                    Application.isBatchModeInventoryRunning = true;
                            }
                        }
                    }
                } else if (Application.mIsInventoryRunning) {
                    if (fragment instanceof InventoryFragment) {
                        (findViewById(R.id.inventoryOptions)).setEnabled(true);
                    }
                    button.setText("START");
                    isInventoryAborted = true;
                    //Here we send the abort command to stop the inventory
                    try {
                        Application.mConnectedReader.Actions.Inventory.stop();
                        if (((Application.settings_startTrigger != null && (Application.settings_startTrigger.getTriggerType() == START_TRIGGER_TYPE.START_TRIGGER_TYPE_HANDHELD || Application.settings_startTrigger.getTriggerType() == START_TRIGGER_TYPE.START_TRIGGER_TYPE_PERIODIC)))
                                || (Application.isBatchModeInventoryRunning != null && Application.isBatchModeInventoryRunning))
                            operationHasAborted();
                    } catch (InvalidUsageException | OperationFailureException e) {
                        e.printStackTrace();
                    }
                }
            } else
                Toast.makeText(getApplicationContext(), getResources().getString(R.string.error_disconnected), Toast.LENGTH_SHORT).show();
        } else
            Toast.makeText(getApplicationContext(), getResources().getString(R.string.error_bluetooth_disabled), Toast.LENGTH_SHORT).show();
    }

    public void getTagReportingfields() {
        pc = false;
        phase = false;
        channelIndex = false;
        rssi = false;
        if (Application.tagStorageSettings != null) {
            TAG_FIELD[] tag_field = Application.tagStorageSettings.getTagFields();
            for (TAG_FIELD aTag_field : tag_field) {
                if (aTag_field == TAG_FIELD.PEAK_RSSI)
                    rssi = true;
                if (aTag_field == TAG_FIELD.PHASE_INFO)
                    phase = true;
                if (aTag_field == TAG_FIELD.PC)
                    pc = true;
                if (aTag_field == TAG_FIELD.CHANNEL_INDEX)
                    channelIndex = true;
                if (aTag_field == TAG_FIELD.TAG_SEEN_COUNT)
                    tagSeenCount = true;
            }
        }
    }

    public void inventoryWithMemoryBank(String memoryBankID) {
        if (isBluetoothEnabled()) {
            if (Application.mConnectedReader != null && Application.mConnectedReader.isConnected()) {
                TagAccess tagAccess = new TagAccess();
                TagAccess.ReadAccessParams readAccessParams = tagAccess.new ReadAccessParams();
                //Set the param values
                readAccessParams.setCount(0);
                readAccessParams.setOffset(0);

                if ("RESERVED".equalsIgnoreCase(memoryBankID))
                    readAccessParams.setMemoryBank(MEMORY_BANK.MEMORY_BANK_RESERVED);
                if ("EPC".equalsIgnoreCase(memoryBankID))
                    readAccessParams.setMemoryBank(MEMORY_BANK.MEMORY_BANK_EPC);
                if ("TID".equalsIgnoreCase(memoryBankID)) {
                    readAccessParams.setMemoryBank(MEMORY_BANK.MEMORY_BANK_TID);
                }
                if ("USER".equalsIgnoreCase(memoryBankID))
                    readAccessParams.setMemoryBank(MEMORY_BANK.MEMORY_BANK_USER);
                try {
                    //Read command with readAccessParams and accessFilter as null to read all the tags
                    Application.mConnectedReader.Actions.TagAccess.readEvent(readAccessParams, null, null);
                } catch (InvalidUsageException e) {
                    e.printStackTrace();
                } catch (OperationFailureException e) {
                    e.printStackTrace();
                    Fragment fragment = getSupportFragmentManager().findFragmentByTag(TAG_CONTENT_FRAGMENT);
                    if (fragment instanceof ResponseHandlerInterfaces.ResponseStatusHandler)
                        ((ResponseHandlerInterfaces.ResponseStatusHandler) fragment).handleStatusResponse(e.getResults());
                    Toast.makeText(getApplicationContext(), e.getVendorMessage(), Toast.LENGTH_SHORT).show();
                }

            } else
                Toast.makeText(getApplicationContext(), getResources().getString(R.string.error_disconnected), Toast.LENGTH_SHORT).show();
        } else
            Toast.makeText(getApplicationContext(), getResources().getString(R.string.error_bluetooth_disabled), Toast.LENGTH_SHORT).show();
    }

    public void accessOperationsReadClicked(View v) {
        if (isBluetoothEnabled()) {
            if (Application.mConnectedReader != null && Application.mConnectedReader.isConnected()) {
                if (Application.mConnectedReader.isCapabilitiesReceived()) {
                    AutoCompleteTextView tagIDField = findViewById(R.id.accessRWTagID);
                    if (tagIDField != null && tagIDField.getText() != null) {
                        final String tagId = tagIDField.getText().toString();
                        if (!tagId.isEmpty()) {
                            Application.accessControlTag = tagId;
                            EditText offsetText = findViewById(R.id.accessRWOffsetValue);
                            EditText lengthText = findViewById(R.id.accessRWLengthValue);
                            if (!offsetText.getText().toString().isEmpty()) {
                                if (!lengthText.getText().toString().isEmpty()) {
                                    progressDialog = new CustomProgressDialog(this, MSG_READ);
                                    progressDialog.show();
                                    final Fragment fragment = getSupportFragmentManager().findFragmentByTag(TAG_CONTENT_FRAGMENT);

                                    TextView accessRWData = findViewById(R.id.accessRWData);
                                    if (accessRWData != null) {
                                        accessRWData.setText("");
                                    }
                                    timerDelayRemoveDialog(Constants.RESPONSE_TIMEOUT, progressDialog, "Read");
                                    //Stop the read after a tag is read to avoid performing a continuous read operation
                                    //((AccessOperationsFragment) fragment).setStartStopTriggers();
                                    Application.isAccessCriteriaRead = true;

                                    TagAccess tagAccess = new TagAccess();
                                    final TagAccess.ReadAccessParams readAccessParams = tagAccess.new ReadAccessParams();
                                    try {
                                        readAccessParams.setAccessPassword(Long.decode("0X" + ((EditText) findViewById(R.id.accessRWPassword)).getText().toString()));
                                    } catch (NumberFormatException nfe) {
                                        nfe.printStackTrace();
                                        Toast.makeText(this, "Password field is empty or invalid !", Toast.LENGTH_SHORT).show();
                                    }
                                    readAccessParams.setCount(Integer.parseInt(lengthText.getText().toString()));

                                    if ("RESV".equalsIgnoreCase(((Spinner) findViewById(R.id.accessRWMemoryBank)).getSelectedItem().toString()))
                                        readAccessParams.setMemoryBank(MEMORY_BANK.MEMORY_BANK_RESERVED);
                                    if ("EPC".equalsIgnoreCase(((Spinner) findViewById(R.id.accessRWMemoryBank)).getSelectedItem().toString()))
                                        readAccessParams.setMemoryBank(MEMORY_BANK.MEMORY_BANK_EPC);
                                    if ("TID".equalsIgnoreCase(((Spinner) findViewById(R.id.accessRWMemoryBank)).getSelectedItem().toString()))
                                        readAccessParams.setMemoryBank(MEMORY_BANK.MEMORY_BANK_TID);
                                    if ("USER".equalsIgnoreCase(((Spinner) findViewById(R.id.accessRWMemoryBank)).getSelectedItem().toString()))
                                        readAccessParams.setMemoryBank(MEMORY_BANK.MEMORY_BANK_USER);

                                    readAccessParams.setOffset(Integer.parseInt(offsetText.getText().toString()));

                                    new AsyncTask<Void, Void, Boolean>() {
                                        private InvalidUsageException invalidUsageException;
                                        private OperationFailureException operationFailureException;

                                        @Override
                                        protected Boolean doInBackground(Void... voids) {
                                            try {
                                                final TagData tagData = Application.mConnectedReader.Actions.TagAccess.readWait(tagId, readAccessParams, null);
                                                if (Application.isAccessCriteriaRead && !Application.mIsInventoryRunning) {
                                                    if (fragment instanceof AccessOperationsFragment)
                                                        ((AccessOperationsFragment) fragment).handleTagResponse(tagData);
                                                }
                                            } catch (InvalidUsageException e) {
                                                invalidUsageException = e;
                                                e.printStackTrace();
                                            } catch (OperationFailureException e) {
                                                operationFailureException = e;
                                                e.printStackTrace();
                                            }
                                            return true;
                                        }

                                        @Override
                                        protected void onPostExecute(Boolean result) {
                                            if (invalidUsageException != null) {
                                                progressDialog.dismiss();
                                                sendNotification(Constants.ACTION_READER_STATUS_OBTAINED, invalidUsageException.getInfo());
                                            } else if (operationFailureException != null) {
                                                progressDialog.dismiss();
                                                sendNotification(Constants.ACTION_READER_STATUS_OBTAINED, operationFailureException.getVendorMessage());
                                            }
                                        }
                                    }.execute();
                                } else
                                    Toast.makeText(getApplicationContext(), getString(R.string.empty_length), Toast.LENGTH_SHORT).show();
                            } else
                                Toast.makeText(getApplicationContext(), getString(R.string.empty_offset), Toast.LENGTH_SHORT).show();
                        } else
                            Toast.makeText(getApplicationContext(), Constants.TAG_EMPTY, Toast.LENGTH_SHORT).show();
                    }
                } else
                    Toast.makeText(getApplicationContext(), getResources().getString(R.string.error_reader_not_updated), Toast.LENGTH_SHORT).show();
            } else
                Toast.makeText(getApplicationContext(), getResources().getString(R.string.error_disconnected), Toast.LENGTH_SHORT).show();
        } else
            Toast.makeText(getApplicationContext(), getResources().getString(R.string.error_bluetooth_disabled), Toast.LENGTH_SHORT).show();
    }

    public void accessOperationsWriteClicked(View v) {
        if (isBluetoothEnabled()) {
            if (Application.mConnectedReader != null && Application.mConnectedReader.isConnected()) {
                if (Application.mConnectedReader.isCapabilitiesReceived()) {
                    AutoCompleteTextView tagIDField = findViewById(R.id.accessRWTagID);
                    if (tagIDField != null && tagIDField.getText() != null) {
                        final String tagId = tagIDField.getText().toString();
                        if (!tagId.isEmpty()) {
                            Application.accessControlTag = tagId;
                            EditText offsetText = findViewById(R.id.accessRWOffsetValue);
                            if (!offsetText.getText().toString().isEmpty()) {
                                progressDialog = new CustomProgressDialog(this, MSG_WRITE);
                                progressDialog.show();
                                Fragment fragment = getSupportFragmentManager().findFragmentByTag(TAG_CONTENT_FRAGMENT);
                                timerDelayRemoveDialog(Constants.RESPONSE_TIMEOUT, progressDialog, "Write");
                                Application.isAccessCriteriaRead = true;

                                //((AccessOperationsFragment) fragment).setStartStopTriggers();

                                TagAccess tagAccess = new TagAccess();
                                final TagAccess.WriteAccessParams writeAccessParams = tagAccess.new WriteAccessParams();
                                try {
                                    writeAccessParams.setAccessPassword(Long.decode("0X" + ((EditText) findViewById(R.id.accessRWPassword)).getText().toString()));
                                } catch (NumberFormatException nfe) {
                                    nfe.printStackTrace();
                                    Toast.makeText(this, "Password field is empty or invalid !", Toast.LENGTH_SHORT).show();
                                }
                                writeAccessParams.setWriteDataLength(((TextView) findViewById(R.id.accessRWData)).getText().toString().length() / 4);

                                if ("RESV".equalsIgnoreCase(((Spinner) findViewById(R.id.accessRWMemoryBank)).getSelectedItem().toString()))
                                    writeAccessParams.setMemoryBank(MEMORY_BANK.MEMORY_BANK_RESERVED);
                                if ("EPC".equalsIgnoreCase(((Spinner) findViewById(R.id.accessRWMemoryBank)).getSelectedItem().toString()))
                                    writeAccessParams.setMemoryBank(MEMORY_BANK.MEMORY_BANK_EPC);
                                if ("TID".equalsIgnoreCase(((Spinner) findViewById(R.id.accessRWMemoryBank)).getSelectedItem().toString()))
                                    writeAccessParams.setMemoryBank(MEMORY_BANK.MEMORY_BANK_TID);
                                if ("USER".equalsIgnoreCase(((Spinner) findViewById(R.id.accessRWMemoryBank)).getSelectedItem().toString()))
                                    writeAccessParams.setMemoryBank(MEMORY_BANK.MEMORY_BANK_USER);

                                writeAccessParams.setOffset(Integer.parseInt(((EditText) findViewById(R.id.accessRWOffsetValue)).getText().toString()));
                                writeAccessParams.setWriteData(((TextView) findViewById(R.id.accessRWData)).getText().toString());

                                new AsyncTask<Void, Void, Boolean>() {
                                    private InvalidUsageException invalidUsageException;
                                    private OperationFailureException operationFailureException;
                                    private Boolean bResult = false;

                                    @Override
                                    protected Boolean doInBackground(Void... voids) {
                                        try {
                                            Application.mConnectedReader.Actions.TagAccess.writeWait(tagId, writeAccessParams, null, null);
                                            bResult = true;
                                        } catch (InvalidUsageException e) {
                                            invalidUsageException = e;
                                            e.printStackTrace();
                                        } catch (OperationFailureException e) {
                                            operationFailureException = e;
                                            e.printStackTrace();
                                        }
                                        return bResult;
                                    }

                                    @Override
                                    protected void onPostExecute(Boolean result) {
                                        if (!result) {
                                            if (invalidUsageException != null) {
                                                progressDialog.dismiss();
                                                sendNotification(Constants.ACTION_READER_STATUS_OBTAINED, invalidUsageException.getInfo());
                                            } else if (operationFailureException != null) {
                                                progressDialog.dismiss();
                                                sendNotification(Constants.ACTION_READER_STATUS_OBTAINED, operationFailureException.getVendorMessage());
                                            }
                                        } else
                                            Toast.makeText(getApplicationContext(), getString(R.string.msg_write_succeed), Toast.LENGTH_SHORT).show();
                                    }
                                }.execute();
                            } else
                                Toast.makeText(getApplicationContext(), getString(R.string.empty_offset), Toast.LENGTH_SHORT).show();
                        } else
                            Toast.makeText(getApplicationContext(), Constants.TAG_EMPTY, Toast.LENGTH_SHORT).show();
                    }
                } else
                    Toast.makeText(getApplicationContext(), getResources().getString(R.string.error_reader_not_updated), Toast.LENGTH_SHORT).show();
            } else
                Toast.makeText(getApplicationContext(), getResources().getString(R.string.error_disconnected), Toast.LENGTH_SHORT).show();
        } else
            Toast.makeText(getApplicationContext(), getResources().getString(R.string.error_bluetooth_disabled), Toast.LENGTH_SHORT).show();
    }

    public void accessOperationLockClicked(View v) {
        if (isBluetoothEnabled()) {
            if (Application.mConnectedReader != null && Application.mConnectedReader.isConnected()) {
                if (Application.mConnectedReader.isCapabilitiesReceived()) {
                    AutoCompleteTextView tagIDField = findViewById(R.id.accessLockTagID);
                    if (tagIDField != null && tagIDField.getText() != null) {
                        final String tagId = tagIDField.getText().toString();
                        if (!tagId.isEmpty()) {
                            Application.accessControlTag = tagId;
                            progressDialog = new CustomProgressDialog(this, MSG_LOCK);
                            progressDialog.show();
                            Fragment fragment = getSupportFragmentManager().findFragmentByTag(TAG_CONTENT_FRAGMENT);
                            timerDelayRemoveDialog(Constants.RESPONSE_TIMEOUT, progressDialog, "Lock");
                            Application.isAccessCriteriaRead = true;

                            ((AccessOperationsFragment) fragment).setStartStopTriggers();

                            //Set the param values
                            TagAccess tagAccess = new TagAccess();
                            final TagAccess.LockAccessParams lockAccessParams = tagAccess.new LockAccessParams();
                            if (fragment instanceof AccessOperationsFragment) {
                                Fragment innerFragment = ((AccessOperationsFragment) fragment).getCurrentlyViewingFragment();
                                if (innerFragment instanceof AccessOperationsLockFragment) {
                                    AccessOperationsLockFragment lockFragment = ((AccessOperationsLockFragment) innerFragment);
                                    String lockMemoryBank = lockFragment.getLockMemoryBank();
                                    if (lockMemoryBank != null && !lockMemoryBank.isEmpty()) {
                                        if (lockMemoryBank.equalsIgnoreCase("epc")) {

                                            if (lockFragment.getLockAccessPermission().equals(LOCK_PRIVILEGE.LOCK_PRIVILEGE_READ_WRITE))
                                                lockAccessParams.setLockPrivilege(LOCK_DATA_FIELD.LOCK_EPC_MEMORY, LOCK_PRIVILEGE.LOCK_PRIVILEGE_READ_WRITE);
                                            else if (lockFragment.getLockAccessPermission().equals(LOCK_PRIVILEGE.LOCK_PRIVILEGE_PERMA_LOCK))
                                                lockAccessParams.setLockPrivilege(LOCK_DATA_FIELD.LOCK_EPC_MEMORY, LOCK_PRIVILEGE.LOCK_PRIVILEGE_PERMA_LOCK);
                                            else if (lockFragment.getLockAccessPermission().equals(LOCK_PRIVILEGE.LOCK_PRIVILEGE_PERMA_UNLOCK))
                                                lockAccessParams.setLockPrivilege(LOCK_DATA_FIELD.LOCK_EPC_MEMORY, LOCK_PRIVILEGE.LOCK_PRIVILEGE_PERMA_UNLOCK);
                                            else if (lockFragment.getLockAccessPermission().equals(LOCK_PRIVILEGE.LOCK_PRIVILEGE_UNLOCK))
                                                lockAccessParams.setLockPrivilege(LOCK_DATA_FIELD.LOCK_EPC_MEMORY, LOCK_PRIVILEGE.LOCK_PRIVILEGE_UNLOCK);

                                        } else if (lockMemoryBank.equalsIgnoreCase("tid")) {

                                            if (lockFragment.getLockAccessPermission().equals(LOCK_PRIVILEGE.LOCK_PRIVILEGE_READ_WRITE))
                                                lockAccessParams.setLockPrivilege(LOCK_DATA_FIELD.LOCK_TID_MEMORY, LOCK_PRIVILEGE.LOCK_PRIVILEGE_READ_WRITE);
                                            else if (lockFragment.getLockAccessPermission().equals(LOCK_PRIVILEGE.LOCK_PRIVILEGE_PERMA_LOCK))
                                                lockAccessParams.setLockPrivilege(LOCK_DATA_FIELD.LOCK_TID_MEMORY, LOCK_PRIVILEGE.LOCK_PRIVILEGE_PERMA_LOCK);
                                            else if (lockFragment.getLockAccessPermission().equals(LOCK_PRIVILEGE.LOCK_PRIVILEGE_PERMA_UNLOCK))
                                                lockAccessParams.setLockPrivilege(LOCK_DATA_FIELD.LOCK_TID_MEMORY, LOCK_PRIVILEGE.LOCK_PRIVILEGE_PERMA_UNLOCK);
                                            else if (lockFragment.getLockAccessPermission().equals(LOCK_PRIVILEGE.LOCK_PRIVILEGE_UNLOCK))
                                                lockAccessParams.setLockPrivilege(LOCK_DATA_FIELD.LOCK_TID_MEMORY, LOCK_PRIVILEGE.LOCK_PRIVILEGE_UNLOCK);

                                        } else if (lockMemoryBank.equalsIgnoreCase("user")) {

                                            if (lockFragment.getLockAccessPermission().equals(LOCK_PRIVILEGE.LOCK_PRIVILEGE_READ_WRITE))
                                                lockAccessParams.setLockPrivilege(LOCK_DATA_FIELD.LOCK_USER_MEMORY, LOCK_PRIVILEGE.LOCK_PRIVILEGE_READ_WRITE);
                                            else if (lockFragment.getLockAccessPermission().equals(LOCK_PRIVILEGE.LOCK_PRIVILEGE_PERMA_LOCK))
                                                lockAccessParams.setLockPrivilege(LOCK_DATA_FIELD.LOCK_USER_MEMORY, LOCK_PRIVILEGE.LOCK_PRIVILEGE_PERMA_LOCK);
                                            else if (lockFragment.getLockAccessPermission().equals(LOCK_PRIVILEGE.LOCK_PRIVILEGE_PERMA_UNLOCK))
                                                lockAccessParams.setLockPrivilege(LOCK_DATA_FIELD.LOCK_USER_MEMORY, LOCK_PRIVILEGE.LOCK_PRIVILEGE_PERMA_UNLOCK);
                                            else if (lockFragment.getLockAccessPermission().equals(LOCK_PRIVILEGE.LOCK_PRIVILEGE_UNLOCK))
                                                lockAccessParams.setLockPrivilege(LOCK_DATA_FIELD.LOCK_USER_MEMORY, LOCK_PRIVILEGE.LOCK_PRIVILEGE_UNLOCK);

                                        } else if (lockMemoryBank.equalsIgnoreCase("access pwd")) {

                                            if (lockFragment.getLockAccessPermission().equals(LOCK_PRIVILEGE.LOCK_PRIVILEGE_READ_WRITE))
                                                lockAccessParams.setLockPrivilege(LOCK_DATA_FIELD.LOCK_ACCESS_PASSWORD, LOCK_PRIVILEGE.LOCK_PRIVILEGE_READ_WRITE);
                                            else if (lockFragment.getLockAccessPermission().equals(LOCK_PRIVILEGE.LOCK_PRIVILEGE_PERMA_LOCK))
                                                lockAccessParams.setLockPrivilege(LOCK_DATA_FIELD.LOCK_ACCESS_PASSWORD, LOCK_PRIVILEGE.LOCK_PRIVILEGE_PERMA_LOCK);
                                            else if (lockFragment.getLockAccessPermission().equals(LOCK_PRIVILEGE.LOCK_PRIVILEGE_PERMA_UNLOCK))
                                                lockAccessParams.setLockPrivilege(LOCK_DATA_FIELD.LOCK_ACCESS_PASSWORD, LOCK_PRIVILEGE.LOCK_PRIVILEGE_PERMA_UNLOCK);
                                            else if (lockFragment.getLockAccessPermission().equals(LOCK_PRIVILEGE.LOCK_PRIVILEGE_UNLOCK))
                                                lockAccessParams.setLockPrivilege(LOCK_DATA_FIELD.LOCK_ACCESS_PASSWORD, LOCK_PRIVILEGE.LOCK_PRIVILEGE_UNLOCK);

                                        } else if (lockMemoryBank.equalsIgnoreCase("kill pwd")) {
                                            if (lockFragment.getLockAccessPermission().equals(LOCK_PRIVILEGE.LOCK_PRIVILEGE_READ_WRITE))
                                                lockAccessParams.setLockPrivilege(LOCK_DATA_FIELD.LOCK_KILL_PASSWORD, LOCK_PRIVILEGE.LOCK_PRIVILEGE_READ_WRITE);
                                            else if (lockFragment.getLockAccessPermission().equals(LOCK_PRIVILEGE.LOCK_PRIVILEGE_PERMA_LOCK))
                                                lockAccessParams.setLockPrivilege(LOCK_DATA_FIELD.LOCK_KILL_PASSWORD, LOCK_PRIVILEGE.LOCK_PRIVILEGE_PERMA_LOCK);
                                            else if (lockFragment.getLockAccessPermission().equals(LOCK_PRIVILEGE.LOCK_PRIVILEGE_PERMA_UNLOCK))
                                                lockAccessParams.setLockPrivilege(LOCK_DATA_FIELD.LOCK_KILL_PASSWORD, LOCK_PRIVILEGE.LOCK_PRIVILEGE_PERMA_UNLOCK);
                                            else if (lockFragment.getLockAccessPermission().equals(LOCK_PRIVILEGE.LOCK_PRIVILEGE_UNLOCK))
                                                lockAccessParams.setLockPrivilege(LOCK_DATA_FIELD.LOCK_KILL_PASSWORD, LOCK_PRIVILEGE.LOCK_PRIVILEGE_UNLOCK);
                                        }
                                    }
                                }
                            }
                            try {
                                lockAccessParams.setAccessPassword(Long.decode("0X" + ((EditText) findViewById(R.id.accessLockPassword)).getText().toString()));
                            } catch (NumberFormatException nfe) {
                                nfe.printStackTrace();
                                Toast.makeText(this, "Password field is empty or invalid !", Toast.LENGTH_SHORT).show();
                            }
                            new AsyncTask<Void, Void, Boolean>() {
                                private InvalidUsageException invalidUsageException;
                                private OperationFailureException operationFailureException;
                                private Boolean bResult = false;

                                @Override
                                protected Boolean doInBackground(Void... voids) {
                                    try {
                                        Application.mConnectedReader.Actions.TagAccess.lockWait(tagId, lockAccessParams, null);
                                        bResult = true;
                                    } catch (InvalidUsageException e) {
                                        invalidUsageException = e;
                                        e.printStackTrace();
                                    } catch (OperationFailureException e) {
                                        operationFailureException = e;
                                        e.printStackTrace();
                                    }
                                    return bResult;
                                }

                                @Override
                                protected void onPostExecute(Boolean result) {
                                    if (!result) {
                                        if (invalidUsageException != null) {
                                            progressDialog.dismiss();
                                            sendNotification(Constants.ACTION_READER_STATUS_OBTAINED, invalidUsageException.getInfo());
                                        } else if (operationFailureException != null) {
                                            progressDialog.dismiss();
                                            sendNotification(Constants.ACTION_READER_STATUS_OBTAINED, operationFailureException.getVendorMessage());
                                        }
                                    } else
                                        Toast.makeText(getApplicationContext(), getString(R.string.msg_lock_succeed), Toast.LENGTH_SHORT).show();
                                }
                            }.execute();
                        } else
                            Toast.makeText(getApplicationContext(), Constants.TAG_EMPTY, Toast.LENGTH_SHORT).show();
                    }
                } else
                    Toast.makeText(getApplicationContext(), getResources().getString(R.string.error_reader_not_updated), Toast.LENGTH_SHORT).show();
            } else
                Toast.makeText(getApplicationContext(), getResources().getString(R.string.error_disconnected), Toast.LENGTH_SHORT).show();
        } else
            Toast.makeText(getApplicationContext(), getResources().getString(R.string.error_bluetooth_disabled), Toast.LENGTH_SHORT).show();
    }

    public void accessOperationsKillClicked(View v) {
        if (isBluetoothEnabled()) {
            if (Application.mConnectedReader != null && Application.mConnectedReader.isConnected()) {
                if (Application.mConnectedReader.isCapabilitiesReceived()) {
                    AutoCompleteTextView tagIDField = findViewById(R.id.accessKillTagID);
                    if (tagIDField != null && tagIDField.getText() != null) {
                        final String tagId = tagIDField.getText().toString();
                        if (!tagId.isEmpty()) {
                            Application.accessControlTag = tagId;
                            progressDialog = new CustomProgressDialog(this, MSG_KILL);
                            progressDialog.show();
                            Fragment fragment = getSupportFragmentManager().findFragmentByTag(TAG_CONTENT_FRAGMENT);
                            timerDelayRemoveDialog(Constants.RESPONSE_TIMEOUT, progressDialog, "Kill");
                            Application.isAccessCriteriaRead = true;

                            //((AccessOperationsFragment) fragment).setStartStopTriggers();
                            //Set the param values
                            TagAccess tagAccess = new TagAccess();
                            final TagAccess.KillAccessParams killAccessParams = tagAccess.new KillAccessParams();
                            try {
                                killAccessParams.setKillPassword(Long.decode("0X" + ((EditText) findViewById(R.id.accessKillPassword)).getText().toString()));
                            } catch (NumberFormatException nfe) {
                                nfe.printStackTrace();
                                Toast.makeText(this, "Password field is empty or invalid !", Toast.LENGTH_SHORT).show();
                            }
                            new AsyncTask<Void, Void, Boolean>() {
                                private InvalidUsageException invalidUsageException;
                                private OperationFailureException operationFailureException;
                                private Boolean bResult = false;

                                @Override
                                protected Boolean doInBackground(Void... voids) {
                                    try {
                                        Application.mConnectedReader.Actions.TagAccess.killWait(tagId, killAccessParams, null);
                                        bResult = true;
                                    } catch (InvalidUsageException e) {
                                        invalidUsageException = e;
                                        e.printStackTrace();
                                    } catch (OperationFailureException e) {
                                        operationFailureException = e;
                                        e.printStackTrace();
                                    }
                                    return bResult;
                                }

                                @Override
                                protected void onPostExecute(Boolean result) {
                                    if (!result) {
                                        if (invalidUsageException != null) {
                                            progressDialog.dismiss();
                                            sendNotification(Constants.ACTION_READER_STATUS_OBTAINED, invalidUsageException.getInfo());
                                        } else if (operationFailureException != null) {
                                            progressDialog.dismiss();
                                            sendNotification(Constants.ACTION_READER_STATUS_OBTAINED, operationFailureException.getVendorMessage());
                                        }
                                    } else
                                        Toast.makeText(getApplicationContext(), getString(R.string.msg_kill_succeed), Toast.LENGTH_SHORT).show();
                                }
                            }.execute();
                        } else
                            Toast.makeText(getApplicationContext(), Constants.TAG_EMPTY, Toast.LENGTH_SHORT).show();
                    }
                } else
                    Toast.makeText(getApplicationContext(), getResources().getString(R.string.error_reader_not_updated), Toast.LENGTH_SHORT).show();
            } else
                Toast.makeText(getApplicationContext(), getResources().getString(R.string.error_disconnected), Toast.LENGTH_SHORT).show();
        } else
            Toast.makeText(getApplicationContext(), getResources().getString(R.string.error_bluetooth_disabled), Toast.LENGTH_SHORT).show();
    }

    public void locationingButtonClicked(View v) {
        if (isBluetoothEnabled()) {
            if (Application.mConnectedReader != null && Application.mConnectedReader.isConnected()) {
                if (!Application.isLocatingTag) {
                    //clear previous proximity details
                    Application.TagProximityPercent = 0;
                    Application.locateTag = ((AutoCompleteTextView) findViewById(R.id.lt_et_epc)).getText().toString();
                    if (!Application.locateTag.isEmpty()) {
                        findViewById(R.id.lt_et_epc).setFocusable(false);
                        ((Button) v).setText(getResources().getString(R.string.stop_title));

                        RangeGraph locationBar = findViewById(R.id.locationBar);
                        locationBar.setValue(0);
                        locationBar.invalidate();
                        locationBar.requestLayout();
                        Application.isLocatingTag = true;
                        new AsyncTask<Void, Void, Boolean>() {
                            private InvalidUsageException invalidUsageException;
                            private OperationFailureException operationFailureException;

                            @Override
                            protected Boolean doInBackground(Void... voids) {
                                try {
                                    Application.mConnectedReader.Actions.TagLocationing.Perform(Application.locateTag, null, null);
//                                    Application.isLocatingTag = true;
                                } catch (InvalidUsageException e) {
                                    e.printStackTrace();
                                    invalidUsageException = e;
                                } catch (OperationFailureException e) {
                                    e.printStackTrace();
                                    operationFailureException = e;
                                }
                                return null;
                            }

                            @Override
                            protected void onPostExecute(Boolean result) {
                                if (invalidUsageException != null) {
                                    sendNotification(Constants.ACTION_READER_STATUS_OBTAINED, invalidUsageException.getInfo());
                                } else if (operationFailureException != null) {
                                    Fragment fragment = getSupportFragmentManager().findFragmentByTag(TAG_CONTENT_FRAGMENT);
                                    if (fragment instanceof ResponseHandlerInterfaces.ResponseStatusHandler)
                                        ((ResponseHandlerInterfaces.ResponseStatusHandler) fragment).handleStatusResponse(operationFailureException.getResults());
                                    sendNotification(Constants.ACTION_READER_STATUS_OBTAINED, operationFailureException.getVendorMessage());
                                }
                            }
                        }.execute();
                    } else {
                        Toast.makeText(getApplicationContext(), Constants.TAG_EMPTY, Toast.LENGTH_SHORT).show();
                    }

                } else {
                    new AsyncTask<Void, Void, Boolean>() {
                        private InvalidUsageException invalidUsageException;
                        private OperationFailureException operationFailureException;

                        @Override
                        protected Boolean doInBackground(Void... voids) {
                            try {
                                Application.mConnectedReader.Actions.TagLocationing.Stop();
                                if (((Application.settings_startTrigger != null && (Application.settings_startTrigger.getTriggerType() == START_TRIGGER_TYPE.START_TRIGGER_TYPE_HANDHELD || Application.settings_startTrigger.getTriggerType() == START_TRIGGER_TYPE.START_TRIGGER_TYPE_PERIODIC)))
                                        || (Application.isBatchModeInventoryRunning != null && Application.isBatchModeInventoryRunning))
                                    operationHasAborted();
                            } catch (InvalidUsageException e) {
                                invalidUsageException = e;
                                e.printStackTrace();
                            } catch (OperationFailureException e) {
                                operationFailureException = e;
                                e.printStackTrace();
                            }
                            return null;
                        }

                        @Override
                        protected void onPostExecute(Boolean result) {
                            if (invalidUsageException != null) {
                                progressDialog.dismiss();
                                sendNotification(Constants.ACTION_READER_STATUS_OBTAINED, invalidUsageException.getInfo());
                            } else if (operationFailureException != null) {
                                progressDialog.dismiss();
                                sendNotification(Constants.ACTION_READER_STATUS_OBTAINED, operationFailureException.getVendorMessage());
                            }
                        }
                    }.execute();
                    ((Button) v).setText(getResources().getString(R.string.start_title));
                    isLocationingAborted = true;
                    (findViewById(R.id.lt_et_epc)).setFocusableInTouchMode(true);
                    (findViewById(R.id.lt_et_epc)).setFocusable(true);
                }
            } else
                Toast.makeText(getApplicationContext(), getResources().getString(R.string.error_disconnected), Toast.LENGTH_SHORT).show();
        } else
            Toast.makeText(getApplicationContext(), getResources().getString(R.string.error_bluetooth_disabled), Toast.LENGTH_SHORT).show();
    }

    public void timerDelayRemoveDialog(long time, final Dialog d, final String command) {
        new Handler().postDelayed(new Runnable() {
            public void run() {
                if (d != null && d.isShowing()) {
                    d.dismiss();
                    if (Application.isAccessCriteriaRead) {
                        if (accessTagCount == 0)
                            sendNotification(Constants.ACTION_READER_STATUS_OBTAINED, getString(R.string.err_access_op_failed));
                        Application.isAccessCriteriaRead = false;
                    } else {
                        sendNotification(Constants.ACTION_READER_STATUS_OBTAINED, command + " timeout");
                        if (Application.isActivityVisible())
                            callBackPressed();
                    }
                }
            }
        }, time);
    }

    public void sendNotification(String action, String data) {
        if (Application.isActivityVisible()) {
            if (action.equalsIgnoreCase(Constants.ACTION_READER_BATTERY_CRITICAL) || action.equalsIgnoreCase(Constants.ACTION_READER_BATTERY_LOW)) {
                new CustomToast(MainActivity.this, R.layout.toast_layout, data).show();
            } else {
                Toast.makeText(getApplicationContext(), data, Toast.LENGTH_SHORT).show();
            }
        } else {
            Intent i = new Intent(MainActivity.this, NotificationsService.class);
            i.putExtra(Constants.INTENT_ACTION, action);
            i.putExtra(Constants.INTENT_DATA, data);
            startService(i);
        }
    }

    public void callBackPressed() {
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                MainActivity.super.onBackPressed();
            }
        });
    }

    public void operationHasAborted() {
        //retrieve get tags if inventory in batch mode got aborted
        //final Fragment fragment = getSupportFragmentManager().findFragmentByTag(TAG_CONTENT_FRAGMENT);
        if (Application.isBatchModeInventoryRunning != null && Application.isBatchModeInventoryRunning) {
            if (isInventoryAborted) {
                Application.isBatchModeInventoryRunning = false;
                isInventoryAborted = true;
                Application.isGettingTags = true;
                if (Application.settings_startTrigger == null) {
                    new AsyncTask<Void, Void, Boolean>() {
                        @Override
                        protected Boolean doInBackground(Void... voids) {
                            try {
                                if (Application.mConnectedReader.isCapabilitiesReceived())
                                    UpdateReaderConnection(false);
                                else
                                    UpdateReaderConnection(true);
                                // update fields before getting tags
                                getTagReportingfields();
                                //
                                Application.mConnectedReader.Actions.getBatchedTags();
                            } catch (InvalidUsageException e) {
                                e.printStackTrace();
                            } catch (OperationFailureException e) {
                                e.printStackTrace();
                            }
                            return null;
                        }
                    }.execute();
                } else
                    Application.mConnectedReader.Actions.getBatchedTags();
            }
        }

        if (Application.mIsInventoryRunning) {
            if (isInventoryAborted) {
                Application.mIsInventoryRunning = false;
                isInventoryAborted = false;
                isTriggerRepeat = null;
                if (Inventorytimer.getInstance().isTimerRunning())
                    Inventorytimer.getInstance().stopTimer();
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        if (Application.EXPORT_DATA)
                            if (Application.tagsReadInventory != null && !Application.tagsReadInventory.isEmpty()) {
                                new DataExportTask(getApplicationContext(), Application.tagsReadInventory, Application.mConnectedReader.getHostName(), Application.TOTAL_TAGS, Application.UNIQUE_TAGS, Application.mRRStartedTime).execute();
                            }
                    }
                });
            }
        } else if (Application.isLocatingTag) {
            if (isLocationingAborted) {
                Application.isLocatingTag = false;
                isLocationingAborted = false;
            }
        }
    }

    public void setActionBarBatteryStatus(final int level) {

        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                if (menu != null && menu.findItem(R.id.action_dpo) != null) {
                    if (Application.dynamicPowerSettings != null && Application.dynamicPowerSettings.getValue() == 1) {
                        menu.findItem(R.id.action_dpo).setIcon(R.drawable.action_battery_dpo_level);
                    } else {
                        menu.findItem(R.id.action_dpo).setIcon(R.drawable.action_battery_level);
                    }
                    menu.findItem(R.id.action_dpo).getIcon().setLevel(level);
                }
            }
        });
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        getMenuInflater().inflate(R.menu.menu_main, menu); // AGGIUNTO PER BARICITTACONNESSAACTIVITY
        return true;
    }

    public void clearInventoryData() {
        Application.TOTAL_TAGS = 0;
        Application.mRRStartedTime = 0;
        Application.UNIQUE_TAGS = 0;
        Application.TAG_READ_RATE = 0;
        if (Application.tagIDs != null)
            Application.tagIDs.clear();
        if (Application.tagsReadInventory.size() > 0)
            Application.tagsReadInventory.clear();
        if (Application.tagsReadInventory.size() > 0)
            Application.tagsReadInventory.clear();
        if (Application.inventoryList != null && Application.inventoryList.size() > 0)
            Application.inventoryList.clear();
    }

    private void readerReconnected(ReaderDevice readerDevice) {
        // store app reader
        Application.mConnectedDevice = readerDevice;
        Application.mConnectedReader = readerDevice.getRFIDReader();
        //
        if (Application.isBatchModeInventoryRunning != null && Application.isBatchModeInventoryRunning) {
            clearInventoryData();
            Application.mIsInventoryRunning = true;
            Application.memoryBankId = 0;
            startTimer();
            Fragment fragment = getSupportFragmentManager().findFragmentByTag(TAG_CONTENT_FRAGMENT);
            if (fragment instanceof ResponseHandlerInterfaces.BatchModeEventHandler)
                ((ResponseHandlerInterfaces.BatchModeEventHandler) fragment).batchModeEventReceived();
        } else
            try {
                UpdateReaderConnection(false);
            } catch (InvalidUsageException e) {
                e.printStackTrace();
            } catch (OperationFailureException e) {
                e.printStackTrace();
            }
        // connect call
        bluetoothDeviceConnected(readerDevice);
    }

    private void readerDisconnected(ReaderDevice readerDevice) {
        stopTimer();
        if (Application.NOTIFY_READER_CONNECTION)
            sendNotification(Constants.ACTION_READER_DISCONNECTED, "Disconnected from " + readerDevice.getName());
        clearSettings();
        setActionBarBatteryStatus(0);
        bluetoothDeviceDisConnected(readerDevice);
        Application.mConnectedDevice = null;
        Application.mConnectedReader = null;
        Application.is_disconnection_requested = false;
    }

    public void inventoryAborted() {
        Inventorytimer.getInstance().stopTimer();
        Application.mIsInventoryRunning = false;
    }

    public void bluetoothDeviceConnected(ReaderDevice device) {
        Fragment fragment = getSupportFragmentManager().findFragmentByTag(TAG_CONTENT_FRAGMENT);
        if (fragment instanceof ReadersListFragment) {
            ((ReadersListFragment) fragment).bluetoothDeviceConnected(device);
        } else if (fragment instanceof SettingListFragment) {
            ((SettingListFragment) fragment).settingsListUpdated();
        }
        if (bluetoothDeviceFoundHandlers != null && bluetoothDeviceFoundHandlers.size() > 0) {
            for (BluetoothDeviceFoundHandler bluetoothDeviceFoundHandler : bluetoothDeviceFoundHandlers)
                bluetoothDeviceFoundHandler.bluetoothDeviceConnected(device);
        }
        if (Application.NOTIFY_READER_CONNECTION)
            sendNotification(Constants.ACTION_READER_CONNECTED, "Connected to " + device.getName());
    }

    public void bluetoothDeviceDisConnected(ReaderDevice device) {
        if (progressDialog != null && progressDialog.isShowing())
            progressDialog.dismiss();

        if (Application.mIsInventoryRunning) {
            inventoryAborted();
            if (Application.isBatchModeInventoryRunning != null && !Application.isBatchModeInventoryRunning)
                if (Application.EXPORT_DATA)
                    if (Application.tagsReadInventory != null && !Application.tagsReadInventory.isEmpty())
                        new DataExportTask(getApplicationContext(), Application.tagsReadInventory, device.getName(), Application.TOTAL_TAGS, Application.UNIQUE_TAGS, Application.mRRStartedTime).execute();
            Application.isBatchModeInventoryRunning = false;
        }
        if (Application.isLocatingTag) {
            Application.isLocatingTag = false;
        }
        //update dpo icon in settings list
        SettingsContent.ITEMS.get(8).icon = R.drawable.title_dpo_disabled;

        Application.isAccessCriteriaRead = false;
        accessTagCount = 0;

        if (bluetoothDeviceFoundHandlers != null && bluetoothDeviceFoundHandlers.size() > 0) {
            for (BluetoothDeviceFoundHandler bluetoothDeviceFoundHandler : bluetoothDeviceFoundHandlers)
                bluetoothDeviceFoundHandler.bluetoothDeviceDisConnected(device);
        }

        if (Application.mConnectedReader != null && !Application.AUTO_RECONNECT_READERS) {
            try {
                Application.mConnectedReader.disconnect();
            } catch (InvalidUsageException | OperationFailureException e) {
                e.printStackTrace();
            }
            Application.mConnectedReader = null;
        }
    }

    @Override
    public void RFIDReaderAppeared(ReaderDevice device) {
        Fragment fragment = getSupportFragmentManager().findFragmentByTag(TAG_CONTENT_FRAGMENT);
        if (fragment instanceof ReadersListFragment)
            ((ReadersListFragment) fragment).RFIDReaderAppeared(device);
        if (Application.NOTIFY_READER_AVAILABLE) {
            if (!device.getName().equalsIgnoreCase("null"))
                sendNotification(Constants.ACTION_READER_AVAILABLE, device.getName() + " is available.");
        }
    }

    @Override
    public void RFIDReaderDisappeared(ReaderDevice device) {
        Application.mReaderDisappeared = device;
        Fragment fragment = getSupportFragmentManager().findFragmentByTag(TAG_CONTENT_FRAGMENT);
        if (fragment instanceof ReadersListFragment)
            ((ReadersListFragment) fragment).RFIDReaderDisappeared(device);
        if (Application.NOTIFY_READER_AVAILABLE)
            sendNotification(Constants.ACTION_READER_AVAILABLE, device.getName() + " is unavailable.");
    }

    private boolean getRepeatTriggers() {
        return (Application.settings_startTrigger != null && (Application.settings_startTrigger.getTriggerType() == START_TRIGGER_TYPE.START_TRIGGER_TYPE_HANDHELD || Application.settings_startTrigger.getTriggerType() == START_TRIGGER_TYPE.START_TRIGGER_TYPE_PERIODIC))
                || (isTriggerRepeat != null && isTriggerRepeat);
    }

    @SuppressLint("LongLogTag")
    private void notificationFromGenericReaderNew(RfidStatusEvents rfidStatusEvents) {

        final Fragment fragment = getSupportFragmentManager().findFragmentByTag(TAG_CONTENT_FRAGMENT);

        if (rfidStatusEvents.StatusEventData.getStatusEventType() == STATUS_EVENT_TYPE.DISCONNECTION_EVENT) {

            if (Application.mConnectedReader != null) {
                DisconnectTask = new UpdateDisconnectedStatusTask(Application.mConnectedReader.getHostName()).execute();
            }
            Application.mConnectedReader = null;

        } else if (rfidStatusEvents.StatusEventData.getStatusEventType() == STATUS_EVENT_TYPE.INVENTORY_START_EVENT) {

            if (!Application.isAccessCriteriaRead && !Application.isLocatingTag) {
                if (!getRepeatTriggers() && Inventorytimer.getInstance().isTimerRunning()) {
                    Application.mIsInventoryRunning = true;
                    Inventorytimer.getInstance().startTimer();
                }
            }

        } else if (rfidStatusEvents.StatusEventData.getStatusEventType() == STATUS_EVENT_TYPE.INVENTORY_STOP_EVENT) {

            accessTagCount = 0;
            Application.isAccessCriteriaRead = false;

            if (Application.mIsInventoryRunning) {

                Inventorytimer.getInstance().stopTimer();

            } else if (Application.isGettingTags) {

                Application.isGettingTags = false;
                Application.mConnectedReader.Actions.purgeTags();

                if (Application.EXPORT_DATA) {
                    if (Application.tagsReadInventory != null && !Application.tagsReadInventory.isEmpty()) {
                        runOnUiThread(new Runnable() {
                            @Override
                            public void run() {
                                new DataExportTask(getApplicationContext(), Application.tagsReadInventory, Application.mConnectedDevice.getName(), Application.TOTAL_TAGS, Application.UNIQUE_TAGS, Application.mRRStartedTime).execute();
                            }
                        });
                    }
                }

                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        if (fragment instanceof ReadersListFragment) {
                            //((ReadersListFragment) fragment).cancelProgressDialog();
                            if (Application.mConnectedReader != null && Application.mConnectedReader.ReaderCapabilities.getModelName() != null) {
                                ((ReadersListFragment) fragment).capabilitiesRecievedforDevice();
                            }
                        }
                    }
                });
            }

            if (!getRepeatTriggers()) {
                if (Application.mIsInventoryRunning)
                    isInventoryAborted = true;
                else if (Application.isLocatingTag)
                    isLocationingAborted = true;
                operationHasAborted();
            }


        } else if (rfidStatusEvents.StatusEventData.getStatusEventType() == STATUS_EVENT_TYPE.OPERATION_END_SUMMARY_EVENT) {
        } else if (rfidStatusEvents.StatusEventData.getStatusEventType() == STATUS_EVENT_TYPE.HANDHELD_TRIGGER_EVENT) {
            boolean triggerPressed = false;

            if (rfidStatusEvents.StatusEventData.HandheldTriggerEventData.getHandheldEvent() == HANDHELD_TRIGGER_EVENT_TYPE.HANDHELD_TRIGGER_PRESSED) {
                triggerPressed = true;

                //if (!ListEventIdTagFragment.Companion.isAdded()) {

                if (getSupportFragmentManager().getFragments().size() <= 2) {
                    Log.e("PRIMA SHOW", "" + ListEventIdTagFragment.Companion.isAdded());
                    ListEventIdTagFragment.Companion.show(getSupportFragmentManager(), location);
                    Log.e("DOPO SHOW", "" + ListEventIdTagFragment.Companion.isAdded());
                    if (Application.settings_startTrigger.getTriggerType().toString().equalsIgnoreCase(START_TRIGGER_TYPE.START_TRIGGER_TYPE_IMMEDIATE.toString()) || isTriggerRepeat != null && !isTriggerRepeat) {
                        Log.e("DENTRO TRIGGER - DOPO SHOW", "" + ListEventIdTagFragment.Companion.isAdded());
                        (ListEventIdTagFragment.Companion.getFragment()).triggerPressEventRecieved();
                    }
                } else {
                    Fragment fragmentDialog = getSupportFragmentManager().getFragments().get(2);
                    Log.e("QUANDO E' APERTO", "" + fragmentDialog.isAdded());
                    if (fragmentDialog instanceof ListEventIdTagFragment) {
                        ((ListEventIdTagFragment) fragmentDialog).triggerPressEventRecieved();
                    }
                }
            }
            if (ListEventIdTagFragment.Companion.isAdded()) {
                if (!triggerPressed && (Application.settings_stopTrigger.getTriggerType().toString().equalsIgnoreCase(STOP_TRIGGER_TYPE.STOP_TRIGGER_TYPE_IMMEDIATE.toString()) || (isTriggerRepeat != null && !isTriggerRepeat))) {
                    (ListEventIdTagFragment.Companion.getFragment()).triggerReleaseEventRecieved();
                }
            }


        } else if (rfidStatusEvents.StatusEventData.getStatusEventType() == STATUS_EVENT_TYPE.BATTERY_EVENT) {

            final Events.BatteryData batteryData = rfidStatusEvents.StatusEventData.BatteryData;
            Application.BatteryData = batteryData;
            setActionBarBatteryStatus(batteryData.getLevel());

            if (batteryNotificationHandlers != null && batteryNotificationHandlers.size() > 0) {
                for (BatteryNotificationHandler batteryNotificationHandler : batteryNotificationHandlers)
                    batteryNotificationHandler.deviceStatusReceived(batteryData.getLevel(), batteryData.getCharging(), batteryData.getCause());
            }
            if (Application.NOTIFY_BATTERY_STATUS && batteryData.getCause() != null) {
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        if (batteryData.getCause().trim().equalsIgnoreCase(Constants.MESSAGE_BATTERY_CRITICAL))
                            sendNotification(Constants.ACTION_READER_BATTERY_CRITICAL, getString(R.string.battery_status__critical_message));
                        else if (batteryData.getCause().trim().equalsIgnoreCase(Constants.MESSAGE_BATTERY_LOW))
                            sendNotification(Constants.ACTION_READER_BATTERY_CRITICAL, getString(R.string.battery_status_low_message));
                    }
                });
            }

        } else if (rfidStatusEvents.StatusEventData.getStatusEventType() == STATUS_EVENT_TYPE.BATCH_MODE_EVENT) {
            Application.isBatchModeInventoryRunning = true;
            startTimer();
            clearInventoryData();
            Application.mIsInventoryRunning = true;
            Application.memoryBankId = 0;
            isTriggerRepeat = rfidStatusEvents.StatusEventData.BatchModeEventData.get_RepeatTrigger();

            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    if (fragment instanceof ResponseHandlerInterfaces.BatchModeEventHandler)
                        ((ResponseHandlerInterfaces.BatchModeEventHandler) fragment).batchModeEventReceived();
                    if (fragment instanceof ReadersListFragment) {
                        //((ReadersListFragment) fragment).cancelProgressDialog();
                        if (Application.mConnectedReader != null && Application.mConnectedReader.ReaderCapabilities.getModelName() == null) {
                            ((ReadersListFragment) fragment).capabilitiesRecievedforDevice();
                        }
                    }
                }
            });
        }

    }

    public void connectClicked(String password, ReaderDevice readerDevice) {
        Fragment fragment = getSupportFragmentManager().findFragmentByTag(TAG_CONTENT_FRAGMENT);
        if (fragment instanceof ReadersListFragment) {
            ((ReadersListFragment) fragment).ConnectwithPassword(password, readerDevice);
        }
    }

    public void cancelClicked(ReaderDevice readerDevice) {
        Fragment fragment = getSupportFragmentManager().findFragmentByTag(TAG_CONTENT_FRAGMENT);
        if (fragment instanceof ReadersListFragment) {
            ((ReadersListFragment) fragment).readerDisconnected(readerDevice);
        }
    }

    @Override
    public void onLocationReal(@NotNull Location location) {
        this.location = new Location(location);
    }

    @Override
    public void onError(@NotNull String message) {

    }

    @Override
    public void enableLoading() {
        utilViewModel.getLoading().postValue(true);
    }

    @Override
    public void disableLoading() {
        utilViewModel.getLoading().postValue(false);
    }

    public class EventHandler implements RfidEventsListener {

        @Override
        public void eventReadNotify(RfidReadEvents e) {
            final TagData[] myTags = Application.mConnectedReader.Actions.getReadTags(100);
            if (myTags != null) {

                final Fragment fragment = ListEventIdTagFragment.Companion.getFragment();

                for (int index = 0; index < myTags.length; index++) {
                    if (myTags[index].getOpCode() == ACCESS_OPERATION_CODE.ACCESS_OPERATION_READ &&
                            myTags[index].getOpStatus() == ACCESS_OPERATION_STATUS.ACCESS_SUCCESS) {
                        if (myTags[index].getMemoryBankData().length() > 0) {
                            System.out.println(" Mem Bank Data " + myTags[index].getMemoryBankData());
                        }
                    }
                    if (myTags[index].isContainsLocationInfo()) {
                        final int tag = index;
                        Application.TagProximityPercent = myTags[tag].LocationInfo.getRelativeDistance();
                    }
                    if (Application.isAccessCriteriaRead && !Application.mIsInventoryRunning) {
                        accessTagCount++;
                    } else {
                        if (myTags[index] != null /* && (myTags[index].getOpStatus() == null || myTags[index].getOpStatus() == ACCESS_OPERATION_STATUS.ACCESS_SUCCESS) */) {
                            new ResponseHandlerTask(myTags[index], fragment).execute();
                        }
                    }
                }
            }
        }

        @Override
        public void eventStatusNotify(RfidStatusEvents rfidStatusEvents) {
            System.out.println("EventStatusNotify: " + rfidStatusEvents.StatusEventData.getStatusEventType());
            notificationFromGenericReaderNew(rfidStatusEvents);
        }
    }

    public class ResponseHandlerTask extends AsyncTask<Void, Void, Boolean> {
        private TagData tagData;
        private InventoryListItem inventoryItem;
        private InventoryListItem oldObject;
        private Fragment fragment;
        private String memoryBank;
        private String memoryBankData;

        ResponseHandlerTask(TagData tagData, Fragment fragment) {
            this.tagData = tagData;
            this.fragment = fragment;
        }

        @Override
        protected Boolean doInBackground(Void... voids) {
            boolean added = false;
            try {
                //TODO punto dove legge il codice del TAG
                if (Application.inventoryList.containsKey(tagData.getTagID())) {
                    inventoryItem = new InventoryListItem(tagData.getTagID(), 1, null, null, null, null, null, null);
                    int index = Application.inventoryList.get(tagData.getTagID());
                    if (index >= 0) {
                        //Tag is already present. Update the fields and increment the count
                        if (tagData.getOpCode() != null)
                            if (tagData.getOpCode().toString().equalsIgnoreCase("ACCESS_OPERATION_READ")) {
                                memoryBank = tagData.getMemoryBank().toString();
                                memoryBankData = tagData.getMemoryBankData();
                            }
                        oldObject = Application.tagsReadInventory.get(index);
                        int tagSeenCount = 0;
                        if (Integer.toString(tagData.getTagSeenCount()) != null)
                            tagSeenCount = tagData.getTagSeenCount();
                        if (tagSeenCount != 0) {
                            Application.TOTAL_TAGS += tagSeenCount;
                            oldObject.incrementCountWithTagSeenCount(tagSeenCount);
                        } else {
                            Application.TOTAL_TAGS++;
                            oldObject.incrementCount();
                        }
                        if (oldObject.getMemoryBankData() != null && !oldObject.getMemoryBankData().equalsIgnoreCase(memoryBankData))
                            oldObject.setMemoryBankData(memoryBankData);
                        if (pc)
                            oldObject.setPC(Integer.toHexString(tagData.getPC()));
                        if (phase)
                            oldObject.setPhase(Integer.toString(tagData.getPhase()));
                        if (channelIndex)
                            oldObject.setChannelIndex(Integer.toString(tagData.getChannelIndex()));
                        if (rssi)
                            oldObject.setRSSI(Integer.toString(tagData.getPeakRSSI()));
                    }
                } else {
                    //Tag is encountered for the first time. Add it.
                    if (Application.inventoryMode == 0 || (Application.inventoryMode == 1 && Application.UNIQUE_TAGS <= Constants.UNIQUE_TAG_LIMIT)) {
                        int tagSeenCount = 0;
                        if (Integer.toString(tagData.getTagSeenCount()) != null)
                            tagSeenCount = tagData.getTagSeenCount();
                        if (tagSeenCount != 0) {
                            Application.TOTAL_TAGS += tagSeenCount;
                            inventoryItem = new InventoryListItem(tagData.getTagID(), tagSeenCount, null, tagData.getMemoryBankData(), null, null, null, null);
                        } else {
                            Application.TOTAL_TAGS++;
                            inventoryItem = new InventoryListItem(tagData.getTagID(), 1, null, tagData.getMemoryBankData(), null, null, null, null);
                        }
                        added = Application.tagsReadInventory.add(inventoryItem);
                        if (added) {
                            Application.inventoryList.put(tagData.getTagID(), Application.UNIQUE_TAGS);
                            if (tagData.getOpCode() != null)

                                if (tagData.getOpCode().toString().equalsIgnoreCase("ACCESS_OPERATION_READ")) {
                                    memoryBank = tagData.getMemoryBank().toString();
                                    memoryBankData = tagData.getMemoryBankData();

                                }
                            oldObject = Application.tagsReadInventory.get(Application.UNIQUE_TAGS);
                            oldObject.setMemoryBankData(memoryBankData);
                            oldObject.setMemoryBank(memoryBank);
                            if (pc)
                                oldObject.setPC(Integer.toHexString(tagData.getPC()));
                            if (phase)
                                oldObject.setPhase(Integer.toString(tagData.getPhase()));
                            if (channelIndex)
                                oldObject.setChannelIndex(Integer.toString(tagData.getChannelIndex()));
                            if (rssi)
                                oldObject.setRSSI(Integer.toString(tagData.getPeakRSSI()));
                            Application.UNIQUE_TAGS++;
                        }
                    }
                }
            } catch (Exception e) {
                oldObject = null;
                added = false;
            }
            inventoryItem = null;
            memoryBank = null;
            memoryBankData = null;
            return added;
        }

        @Override
        protected void onPostExecute(Boolean result) {
            cancel(true);


            if (oldObject != null && fragment instanceof ResponseHandlerInterfaces.ResponseTagHandler)
                ((ResponseHandlerInterfaces.ResponseTagHandler) fragment).handleTagResponse(oldObject, result);
            oldObject = null;


        }
    }

    protected class UpdateDisconnectedStatusTask extends AsyncTask<Void, Void, Boolean> {
        private final String device;
        // store current reader state
        private final ReaderDevice readerDevice;
        long disconnectedTime;

        UpdateDisconnectedStatusTask(String device) {
            this.device = device;
            disconnectedTime = System.currentTimeMillis();
            // store current reader state
            readerDevice = Application.mConnectedDevice;
            //
            Application.mReaderDisappeared = null;
        }

        @Override
        protected void onPreExecute() {
            super.onPreExecute();
            runOnUiThread(() -> {
                if (readerDevice != null && readerDevice.getName().equalsIgnoreCase(device))
                    readerDisconnected(readerDevice);
                else
                    readerDisconnected(new ReaderDevice(device, null));
            });
        }

        @Override
        protected Boolean doInBackground(Void... voids) {
            //Check if the connected device is one we had comm with
            if (!Application.is_disconnection_requested && Application.AUTO_RECONNECT_READERS && readerDevice != null && device != null && device.equalsIgnoreCase(readerDevice.getName())) {
                if (isBluetoothEnabled()) {
                    boolean bConnected = false;
                    int retryCount = 0;
                    while (!bConnected && retryCount < 10) {
                        if (isCancelled() || isDeviceDisconnected)
                            break;
                        try {
                            Thread.sleep(1000);
                            retryCount++;
                            // check manual connection is initiated
                            if (Application.is_connection_requested || isCancelled())
                                break;
                            readerDevice.getRFIDReader().reconnect();
                            bConnected = true;
                            // break temporary pairing connection if reader is unpaired
                            if (Application.mReaderDisappeared != null && Application.mReaderDisappeared.getName().equalsIgnoreCase(readerDevice.getName())) {
                                readerDevice.getRFIDReader().disconnect();
                                bConnected = false;
                                break;
                            }
                        } catch (InvalidUsageException ignored) {
                        } catch (OperationFailureException e) {
                            if (e.getResults() == RFIDResults.RFID_BATCHMODE_IN_PROGRESS) {
                                Application.isBatchModeInventoryRunning = true;
                                bConnected = true;
                            }
                            if (e.getResults() == RFIDResults.RFID_READER_REGION_NOT_CONFIGURED) {
                                try {
                                    readerDevice.getRFIDReader().disconnect();
                                    bConnected = false;
                                    break;
                                } catch (InvalidUsageException | OperationFailureException e1) {
                                    e1.printStackTrace();
                                }
                            }
                        } catch (InterruptedException e) {
                            e.printStackTrace();
                        }
                    }
                    return bConnected;
                }
            }
            return false;
        }

        @Override
        protected void onPostExecute(Boolean result) {
            if (!isCancelled()) {
                if (result)
                    readerReconnected(readerDevice);
                else if (!Application.is_connection_requested) {
                    sendNotification(Constants.ACTION_READER_CONN_FAILED, "Impossibile connettere il dispositivo, verificare la connessione");
                    try {
                        readerDevice.getRFIDReader().disconnect();
                    } catch (InvalidUsageException | OperationFailureException e) {
                        e.printStackTrace();
                    }
                }
            }
        }

    }

    private void checkValidity(Violation violation, AssetDetail assetDetail) {
        if (assetDetail.getDati_istanza().getIndirizzo_segnale_indicatore().getLocation() == null) {
            mapClusterFragment.zoom();
        } else {
            (findViewById(R.id.icon_validity_poi)).setVisibility(View.VISIBLE);

            if (assetDetail.getStato_pratica() != null && assetDetail.getStato_pratica() == 10) {
                if (violation != null && violation.isValid() != null && violation.isValid()) {
                    (findViewById(R.id.bottom_sheet_bar)).setBackgroundColor(getResources().getColor(R.color.colorGreen));
                    ((ImageView) (findViewById(R.id.icon_validity_poi))).setImageResource(R.drawable.ic_valid);
                } else if (violation == null) {
                    (findViewById(R.id.bottom_sheet_bar)).setBackgroundColor(getResources().getColor(R.color.colorPrimary));
                    ((ImageView) (findViewById(R.id.icon_validity_poi))).setImageResource(R.drawable.ic_valid_not);
                } else {
                    (findViewById(R.id.bottom_sheet_bar)).setBackgroundColor(getResources().getColor(R.color.colorYellow));
                    ((ImageView) (findViewById(R.id.icon_validity_poi))).setImageResource(R.drawable.ic_valid_not_location);
                }
            } else {
                (findViewById(R.id.bottom_sheet_bar)).setBackgroundColor(getResources().getColor(R.color.colorPrimary));
                ((ImageView) (findViewById(R.id.icon_validity_poi))).setImageResource(R.drawable.ic_valid_not);
            }


        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, @Nullable Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == 555) {
            if (resultCode == Activity.RESULT_OK) {
                if (data != null) {
                    if (data.hasExtra("ITEM")) {
                        mapClusterFragment.moveCameraToMarker((AssetDetail) data.getExtras().get("ITEM"));
                    }
                }
            }
        }

        if (requestCode == QRCODEACTIVITYCODE) {
            if (resultCode == 0) {
                if (data == null || data.getExtras() == null) {
                    //nothing, back
                } else if (data.getExtras().keySet().contains("MISSING_CAMERA_PERMISSION")) {
                    Toast.makeText(this, getString(R.string.no_permission_camera), Toast.LENGTH_LONG).show();
                } else {
                    //nothing
                }
            } else {
                String code = null;
                if (data != null) {
                    code = data.getStringExtra(Intents.Scan.RESULT);
                }
                if (code != null) {
                    QRCodeDialogFragment.Companion.show(getSupportFragmentManager(), code, location);
                } else {
                    Toast.makeText(this, getString(R.string.scan_error), Toast.LENGTH_LONG).show();
                }
            }
        }

    }
}
