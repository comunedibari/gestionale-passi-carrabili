package com.zebra.rfidreader.demo.zebra.inventory;

import android.app.SearchManager;
import android.content.Context;
import android.graphics.Color;
import android.os.Bundle;
import androidx.fragment.app.Fragment;
import androidx.core.view.MenuItemCompat;
import androidx.appcompat.widget.SearchView;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.Menu;
import android.view.MenuInflater;
import android.view.MenuItem;
import android.view.View;
import android.view.ViewGroup;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.ListView;
import android.widget.Spinner;
import android.widget.TextView;

import com.zebra.rfid.api3.RFIDResults;
import com.zebra.rfidreader.demo.R;
import com.zebra.rfidreader.demo.zebra.application.Application;
import com.zebra.rfidreader.demo.zebra.common.Constants;
import com.zebra.rfidreader.demo.zebra.common.ResponseHandlerInterfaces;
import com.zebra.rfidreader.demo.zebra.home.MainActivity;

import java.util.concurrent.TimeUnit;

/**
 * A simple {@link Fragment} subclass.
 * <p/>
 * Use the {@link InventoryFragment#newInstance} factory method to
 * create an instance of this fragment.
 * <p/>
 * Fragment to handle inventory operations and UI.
 */
public class InventoryFragment extends Fragment implements Spinner.OnItemSelectedListener, ResponseHandlerInterfaces.ResponseTagHandler, ResponseHandlerInterfaces.TriggerEventHandler, ResponseHandlerInterfaces.BatchModeEventHandler, ResponseHandlerInterfaces.ResponseStatusHandler {

    static TextView totalNoOfTags;
    static TextView uniqueTags;
    private static ListView listView;
    private static ModifiedInventoryAdapter adapter;
    private static ArrayAdapter<CharSequence> invAdapter;

    //ID to maintain the memory bank selected
    private String memoryBankID = "none";
    private static Button inventoryButton;

    private static Context context;

    private long prevTime = 0;
    private static TextView timeText;
    private static Spinner invSpinner;
    private static TextView batchModeInventoryList;

    private AdapterView.OnItemClickListener onItemClickListener = new AdapterView.OnItemClickListener() {
        @Override
        public void onItemClick(AdapterView<?> parent, View view,
                                int position, long id) {
            if (!Application.mIsInventoryRunning) {
                toggle(view, position);
                Application.accessControlTag = adapter.getItem(position).getTagID();
                Application.locateTag = adapter.getItem(position).getTagID();
            }
        }
    };

    public InventoryFragment() {
        // Required empty public constructor
    }

    /**
     * Use this factory method to create a new instance of
     * this fragment using the provided parameters.
     *
     * @return A new instance of fragment InventoryFragment.
     */
    public static InventoryFragment newInstance() {
        return new InventoryFragment();
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setHasOptionsMenu(true);
    }

    @Override
    public void onCreateOptionsMenu(Menu menu, MenuInflater inflater) {
        inflater.inflate(R.menu.menu_inventory, menu);
        // Associate searchable configuration with the SearchView
        SearchManager searchManager = (SearchManager) context.getSystemService(Context.SEARCH_SERVICE);
        MenuItem searchItem = menu.findItem(R.id.action_search);
        SearchView searchView = (SearchView) MenuItemCompat.getActionView(searchItem);
        searchView.setSearchableInfo(searchManager.getSearchableInfo(((MainActivity) context).getComponentName()));
        searchView.setOnQueryTextListener(new SearchView.OnQueryTextListener() {
            @Override
            public boolean onQueryTextSubmit(String s) {
                return false;
            }

            @Override
            public boolean onQueryTextChange(final String s) {

                ((MainActivity) context).runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        adapter.getFilter().filter(s);
                    }
                });
                return false;
            }
        });
    }

    public ModifiedInventoryAdapter getAdapter() {
        return adapter;
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        // Inflate the layout for this fragment
        return inflater.inflate(R.layout.fragment_inventory, container, false);
    }

    @Override
    public void onAttach(Context context) {
        super.onAttach(context);
        InventoryFragment.context = getActivity();
    }

    @Override
    public void onDetach() {
        super.onDetach();
    }

    @Override
    public void onActivityCreated(Bundle savedInstanceState) {
        super.onActivityCreated(savedInstanceState);
        totalNoOfTags = ((MainActivity) context).findViewById(R.id.inventoryCountText);
        uniqueTags = ((MainActivity) context).findViewById(R.id.inventoryUniqueText);

        if (totalNoOfTags != null)
            totalNoOfTags.setText(String.valueOf(Application.TOTAL_TAGS));

        if (uniqueTags != null)
            uniqueTags.setText(String.valueOf(Application.UNIQUE_TAGS));

        invSpinner = ((MainActivity) context).findViewById(R.id.inventoryOptions);
        invAdapter = ArrayAdapter.createFromResource(context, R.array.inv_menu_items, R.layout.spinner_small_font);
        invAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        invSpinner.setAdapter(invAdapter);
        if (Application.memoryBankId != -1)
            invSpinner.setSelection(Application.memoryBankId);
        invSpinner.setOnItemSelectedListener(this);
        if (Application.mIsInventoryRunning) {
            invSpinner.setEnabled(false);
        }

        inventoryButton = ((MainActivity) context).findViewById(R.id.inventoryButton);
        if (inventoryButton != null) {
            if (Application.mIsInventoryRunning)
                inventoryButton.setText(getString(R.string.stop_title));
        }

        //Set the font size in constants
        Constants.INVENTORY_LIST_FONT_SIZE = (int) getResources().getDimension(R.dimen.inventory_list_font_size);

        batchModeInventoryList = ((MainActivity) context).findViewById(R.id.batchModeInventoryList);

        listView = ((MainActivity) context).findViewById(R.id.inventoryList);
        adapter = new ModifiedInventoryAdapter(context, R.layout.inventory_list_item);

        //enables filtering for the contents of the given ListView
        listView.setTextFilterEnabled(true);
        if (Application.isBatchModeInventoryRunning != null && Application.isBatchModeInventoryRunning) {
            listView.setEmptyView(batchModeInventoryList);
            batchModeInventoryList.setVisibility(View.VISIBLE);
        } else {
            listView.setAdapter(adapter);
            batchModeInventoryList.setVisibility(View.GONE);
        }
        listView.setOnItemClickListener(onItemClickListener);
    }


    private void toggle(View view, final int position) {
        InventoryListItem listItem = adapter.getItem(position);

        if (!listItem.isVisible()) {
            listItem.setVisible(true);
            view.setBackgroundColor(0x66444444);
        } else {
            listItem.setVisible(false);
            view.setBackgroundColor(Color.WHITE);
        }
        //if(!Application.mIsInventoryRunning)
        adapter.notifyDataSetChanged();
    }

    @Override
    public void onItemSelected(AdapterView<?> adapterView, View view, int i, long l) {
        memoryBankID = adapterView.getSelectedItem().toString();
        Application.memoryBankId = invAdapter.getPosition(memoryBankID);
        memoryBankID = memoryBankID.toLowerCase();
    }

    @Override
    public void onNothingSelected(AdapterView<?> adapterView) {

    }

    /**
     * Method to access the memory bank set
     *
     * @return - Memory bank set
     */
    public String getMemoryBankID() {
        return memoryBankID;
    }

    /**
     * method to reset the tag info
     */
    public void resetTagsInfo() {
        if (Application.inventoryList != null && Application.inventoryList.size() > 0)
            Application.inventoryList.clear();
        if (totalNoOfTags != null)
            totalNoOfTags.setText(String.valueOf(Application.TOTAL_TAGS));
        if (uniqueTags != null)
            uniqueTags.setText(String.valueOf(Application.UNIQUE_TAGS));
        if (timeText != null) {
            String min = String.format("%d", TimeUnit.MILLISECONDS.toMinutes(Application.mRRStartedTime));
            String sec = String.format("%d", TimeUnit.MILLISECONDS.toSeconds(Application.mRRStartedTime) -
                    TimeUnit.MINUTES.toSeconds(TimeUnit.MILLISECONDS.toMinutes(Application.mRRStartedTime)));
            if (min.length() == 1) {
                min = "0" + min;
            }
            if (sec.length() == 1) {
                sec = "0" + sec;
            }
            timeText.setText(min + ":" + sec);
        }
        if (listView.getAdapter() != null) {
            ((ModifiedInventoryAdapter) listView.getAdapter()).clear();
            ((ModifiedInventoryAdapter) listView.getAdapter()).notifyDataSetChanged();
        }
    }

    @Override
    public void handleTagResponse(InventoryListItem inventoryListItem, boolean isAddedToList) {
        if (listView.getAdapter() == null) {
            listView.setAdapter(adapter);
            batchModeInventoryList.setVisibility(View.GONE);
        }

        totalNoOfTags.setText(String.valueOf(Application.TOTAL_TAGS));
        if (uniqueTags != null)
            uniqueTags.setText(String.valueOf(Application.UNIQUE_TAGS));
        if (isAddedToList) {
            Log.e(">>>>>>>>> TAG READ ", inventoryListItem.getText());
            adapter.add(inventoryListItem);
        }
        adapter.notifyDataSetChanged();
    }

    //  @Override
    public void handleStatusResponse(final RFIDResults results) {
        ((MainActivity) context).runOnUiThread(new Runnable() {
            @Override
            public void run() {
                if (results.equals(RFIDResults.RFID_BATCHMODE_IN_PROGRESS)) {
                    if (listView != null && batchModeInventoryList != null) {
                        listView.setEmptyView(batchModeInventoryList);
                        batchModeInventoryList.setText(R.string.batch_mode_inventory_title);
                        batchModeInventoryList.setVisibility(View.VISIBLE);
                    }
                } else if (!results.equals(RFIDResults.RFID_API_SUCCESS)) {
                    //String command = statusData.command.trim();
                    //if (command.equalsIgnoreCase("in") || command.equalsIgnoreCase("inventory") || command.equalsIgnoreCase("read") || command.equalsIgnoreCase("rd"))
                    {
                        Application.isBatchModeInventoryRunning = false;
                        Application.mIsInventoryRunning = false;
                        Button inventoryButton = ((MainActivity) context).findViewById(R.id.inventoryButton);
                        if (inventoryButton != null) {
                            inventoryButton.setText(getResources().getString(R.string.start_title));
                        }
                        if (invSpinner != null)
                            invSpinner.setEnabled(true);
                    }
                }
            }
        });
    }
    //   @Override
    public void triggerPressEventRecieved() {
         if (!Application.mIsInventoryRunning)
            ((MainActivity) context).runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    ((MainActivity) context).inventoryStartOrStop(inventoryButton);
                }
            });
    }

    //   @Override
    public void triggerReleaseEventRecieved() {
        if (Application.mIsInventoryRunning)
            ((MainActivity) context).runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    ((MainActivity) context).inventoryStartOrStop(inventoryButton);
                }
            });
    }

    @Override
    public void batchModeEventReceived() {
        if(context != null && isAdded()) {
            if (inventoryButton != null) {
                inventoryButton.setText(getString(R.string.stop_title));
            }
            if (invSpinner != null) {
                invSpinner.setSelection(0);
                invSpinner.setEnabled(false);
            }
            if (listView != null) {
                adapter.clear();
                adapter.notifyDataSetChanged();
                listView.setEmptyView(batchModeInventoryList);
                batchModeInventoryList.setText(R.string.batch_mode_inventory_title);
                batchModeInventoryList.setVisibility(View.VISIBLE);
            }
        }
    }
}
