package com.zebra.rfidreader.demo.bari_citta_connessa.ui.fragment


import android.location.Location
import android.os.Bundle
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.Toast
import androidx.annotation.UiThread
import androidx.constraintlayout.widget.ConstraintLayout
import androidx.fragment.app.DialogFragment
import androidx.fragment.app.FragmentManager
import androidx.lifecycle.Observer
import androidx.lifecycle.ViewModelProviders
import com.google.android.material.snackbar.Snackbar
import com.zebra.rfid.api3.*
import com.zebra.rfidreader.demo.R
import com.zebra.rfidreader.demo.bari_citta_connessa.adapter.TagAdapter
import com.zebra.rfidreader.demo.bari_citta_connessa.adapter.ValidTag
import com.zebra.rfidreader.demo.bari_citta_connessa.customs.recycleDecoration.GeneralSpacingItemDecoration
import com.zebra.rfidreader.demo.bari_citta_connessa.data.DataVerificaCartelloRequest
import com.zebra.rfidreader.demo.bari_citta_connessa.interfaces.ErrorOwner
import com.zebra.rfidreader.demo.bari_citta_connessa.interfaces.LoadingObserver
import com.zebra.rfidreader.demo.bari_citta_connessa.network.NetworkController
import com.zebra.rfidreader.demo.bari_citta_connessa.ui.viewmodel.UtilViewModel
import com.zebra.rfidreader.demo.bari_citta_connessa.ui.viewmodel.ViewModelFactory
import com.zebra.rfidreader.demo.bari_citta_connessa.utils.DEBUG
import com.zebra.rfidreader.demo.bari_citta_connessa.utils.formattedStringDate
import com.zebra.rfidreader.demo.zebra.application.Application
import com.zebra.rfidreader.demo.zebra.common.Constants
import com.zebra.rfidreader.demo.zebra.common.ResponseHandlerInterfaces
import com.zebra.rfidreader.demo.zebra.home.MainActivity
import com.zebra.rfidreader.demo.zebra.home.MainActivity.isBluetoothEnabled
import com.zebra.rfidreader.demo.zebra.inventory.InventoryListItem


private const val ARG_PARAM_LAT_LON = "latLon"

class ListEventIdTagFragment : DialogFragment(), ResponseHandlerInterfaces.ResponseTagHandler, ResponseHandlerInterfaces.TriggerEventHandler,
    ResponseHandlerInterfaces.BatchModeEventHandler, ResponseHandlerInterfaces.ResponseStatusHandler, LoadingObserver, ErrorOwner {

    private val utilViewModel: UtilViewModel? by lazy { activity?.let { ViewModelProviders.of(it, ViewModelFactory).get(UtilViewModel::class.java) } }

    private lateinit var tagAdapter: TagAdapter

    private lateinit var location: Location

    companion object {
        private val TAG = ListEventIdTagFragment::class.qualifiedName
        val fragment = ListEventIdTagFragment()


        fun show(fm: FragmentManager, location: Location) {
            val args = Bundle()
            args.putParcelable(ARG_PARAM_LAT_LON, location)
            fragment.arguments = args
            fragment.show(fm, "REVELATION_TAG_DIALOG")
        }

        fun isAdded() = fragment.isAdded

    }


    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setStyle(STYLE_NO_TITLE, 0)
        arguments?.let {
            location = it.getParcelable(ARG_PARAM_LAT_LON) as Location
        }
    }

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? {
        return inflater.inflate(R.layout.fragment_list_event_id_tag, container, true)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        val recyclerViewListTags: androidx.recyclerview.widget.RecyclerView = view.findViewById(R.id.listView_tag)
        recyclerViewListTags.layoutManager =
            androidx.recyclerview.widget.LinearLayoutManager(view.context, androidx.recyclerview.widget.LinearLayoutManager.VERTICAL, false)
        recyclerViewListTags.addItemDecoration(GeneralSpacingItemDecoration(8, GeneralSpacingItemDecoration.VERTICAL))


        tagAdapter = TagAdapter(
            listenerRed = { assetDetail, reason ->
                fragmentManager?.let { fm ->
                    ReportingFragment.show(fm, location, assetDetail, reason)
                    invertoryStop()
                    dismiss()
                }
            },
            listenerGreen = { id_doc ->
                NetworkController.INSTANCE.controllers.setDataVerificaCartello(DataVerificaCartelloRequest(id_doc))
                    .observe(viewLifecycleOwner, Observer { response ->
                        if (response.value != null) {
                            Snackbar.make(view.rootView, response.value.message ?: "", Snackbar.LENGTH_LONG).show()
                        }
                    })
            }
        )

        recyclerViewListTags.adapter = tagAdapter

        val buttonCloseX = view.findViewById<ImageView>(R.id.close_rfid)
        val buttonCancel = view.findViewById<Button>(R.id.button_cancel_rfid)

        buttonCloseX.setOnClickListener {
            invertoryStop()
            dismiss()
        }
        buttonCancel.setOnClickListener {
            invertoryStop()
            dismiss()
        }

    }

    override fun onResume() {
        dialog?.window?.setLayout(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.MATCH_PARENT)
        super.onResume()
    }


    //Zebra main event
    private var memoryBankID = "none"


    private fun getMemoryBankID(): String = memoryBankID


    private fun invertoryStop() {
        if (isBluetoothEnabled()) {
            if (Application.mConnectedReader != null && Application.mConnectedReader.isConnected) {

                if (Application.mIsInventoryRunning) {
                    (context as? MainActivity)?.isInventoryAborted = true
                    try {
                        Application.mConnectedReader.Actions.Inventory.stop()
                        if (Application.settings_startTrigger != null && (Application.settings_startTrigger.triggerType === START_TRIGGER_TYPE.START_TRIGGER_TYPE_HANDHELD || Application.settings_startTrigger.triggerType === START_TRIGGER_TYPE.START_TRIGGER_TYPE_PERIODIC) || Application.isBatchModeInventoryRunning != null && Application.isBatchModeInventoryRunning)
                            (context as? MainActivity)?.operationHasAborted()
                    } catch (e: InvalidUsageException) {
                        e.printStackTrace()
                    } catch (e: OperationFailureException) {
                        e.printStackTrace()
                    }
                }

            } else {
                Toast.makeText(context!!, resources.getString(R.string.error_disconnected), Toast.LENGTH_SHORT).show()
            }
        } else {
            Toast.makeText(context!!, resources.getString(R.string.error_bluetooth_disabled), Toast.LENGTH_SHORT).show()
        }

    }

    private fun invertoryStart() {
        Log.e("ACTIVITY", requireActivity().toString())
        requireActivity().runOnUiThread {
            if (isBluetoothEnabled()) {
                tagAdapter.removeItemAll()
                if (Application.mConnectedReader != null && Application.mConnectedReader.isConnected) {
                    if (!Application.mIsInventoryRunning) {
                        (context as? MainActivity)?.clearInventoryData()
                        (context as? MainActivity)?.isInventoryAborted = false
                        Application.mIsInventoryRunning = true
                        (context as? MainActivity)?.getTagReportingfields()
                        if (getMemoryBankID().equals("none", ignoreCase = true)) {
                            (context as? MainActivity)?.inventoryWithMemoryBank("TID")
                        } else {
                            if (Application.reportUniquetags != null && Application.reportUniquetags.value == 1) {
                                Application.mConnectedReader.Actions.purgeTags()
                            }
                            if (Application.inventoryMode == 0) {
                                try {
                                    Application.mConnectedReader.Actions.Inventory.perform()
                                } catch (e: InvalidUsageException) {
                                    e.printStackTrace()
                                } catch (e: OperationFailureException) {
                                    e.printStackTrace()
                                    run {
                                        ResponseHandlerInterfaces.ResponseStatusHandler {
                                            handleStatusResponse(it)
                                            Log.e("SEND", Constants.ACTION_READER_STATUS_OBTAINED)
                                            (context as? MainActivity)?.sendNotification(Constants.ACTION_READER_STATUS_OBTAINED, e.vendorMessage)
                                        }
                                    }
                                }
                                if (Application.batchMode != -1) {
                                    if (Application.batchMode == BATCH_MODE.ENABLE.value)
                                        Application.isBatchModeInventoryRunning = true
                                }
                            }
                        }

                    }

                } else {
                    context?.let { con ->
                        Toast.makeText(con, resources.getString(R.string.error_disconnected), Toast.LENGTH_SHORT).show()
                    }
                }
            } else {
                context?.let { con ->
                    Toast.makeText(con, resources.getString(R.string.error_bluetooth_disabled), Toast.LENGTH_SHORT).show()
                }
            }
        }
    }


    //Event Zebra
    override fun handleTagResponse(inventoryListItem: InventoryListItem?, isAddedToList: Boolean) {
        if (isAddedToList) {
            inventoryListItem?.let { item ->
                location.let { latlng ->
                    NetworkController.INSTANCE.controllers.getCheckAsset(
                        id_tag = item.tagID,
                        lat = latlng.latitude,
                        lon = latlng.longitude,
                        debug = DEBUG,
                        id_doc = "",
                        memoryBankTid = item.memoryBank
                    ).observeOwner(this, Observer { checkAssetResponse ->
                        checkAssetResponse?.value?.let { assetItem ->
                            val reason = assetItem.violation?.reason ?: context?.getString(R.string.generic_error) ?: "ERROR"
                            if (assetItem.result?.isNotEmpty() == true) {

                                val asset = assetItem.result.find {
                                    it.tag_rfid == item.tagID
                                }
                                asset?.tagMemoryBank = item.memoryBank
                                // CONTROLLO EPC == TID
                                when {
                                    (asset?.tag_rfid != asset?.tagMemoryBank /*&& asset?.tag_rfid != "2017110712397A031A9005A9"*/) -> {
                                        //TODO controllo su tag specifico per DEMO
                                        tagAdapter.addItem(
                                            ValidTag(
                                                item.tagID,
                                                assetItem.result[0].dati_istanza?.indirizzo_segnale_indicatore?.indirizzo ?: "",
                                                "TAG non emesso dal Comune di Bari",
                                                false,
                                                asset
                                            )
                                        )
                                        view?.findViewById<ConstraintLayout>(R.id.empty_state_layout)?.visibility =
                                            if (tagAdapter.getItems().size == 0) View.VISIBLE else View.GONE
                                    }
                                    asset?.tag_rfid != null -> {
                                        tagAdapter.addItem(
                                            ValidTag(
                                                asset.tag_rfid,
                                                assetItem.result[0].dati_istanza?.indirizzo_segnale_indicatore?.indirizzo ?: "",
                                                if (assetItem.violation?.isValid == true) "Ultima rilevazione: " + formattedStringDate(
                                                    assetItem.result.getOrNull(0)?.data_check_cartello ?: "", true
                                                ) else reason,
                                                assetItem.violation?.isValid == true,
                                                asset
                                            )
                                        )
                                        view?.findViewById<ConstraintLayout>(R.id.empty_state_layout)?.visibility =
                                            if (tagAdapter.getItems().size == 0) View.VISIBLE else View.GONE
                                    }
                                    else -> {
                                        tagAdapter.addItem(
                                            ValidTag(
                                                item.tagID,
                                                assetItem.result[0].dati_istanza?.indirizzo_segnale_indicatore?.indirizzo ?: "",
                                                if (assetItem.violation?.isValid == true) "Ultima rilevazione: " + formattedStringDate(
                                                    assetItem.result.getOrNull(0)?.data_check_cartello ?: "", true
                                                ) else reason,
                                                assetItem.violation?.isValid == true,
                                                asset
                                            )
                                        )
                                        view?.findViewById<ConstraintLayout>(R.id.empty_state_layout)?.visibility =
                                            if (tagAdapter.getItems().size == 0) View.VISIBLE else View.GONE
                                    }
                                }

                            } else {
                                assetItem.violation?.let {
                                    tagAdapter.addItem(ValidTag(item.tagID, "", reason, it.isValid == true, null))
                                    view?.findViewById<ConstraintLayout>(R.id.empty_state_layout)?.visibility =
                                        if (tagAdapter.getItems().size == 0) View.VISIBLE else View.GONE
                                }
                            }
                        }
                    })
                }
            }
        }
    }

    override fun handleStatusResponse(results: RFIDResults?) {

    }

    override fun triggerPressEventRecieved() {
        Log.e("NEL TRIGGER ISADDED -  ", isAdded.toString())
        requireActivity().run {
            invertoryStart()
        }
    }

    override fun triggerReleaseEventRecieved() {
        requireActivity().run {
            invertoryStop()
        }
    }

    override fun batchModeEventReceived() {
    }

    @UiThread
    override fun enableLoading() {
        utilViewModel?.loading?.postValue(true)
    }

    @UiThread
    override fun disableLoading() {
        utilViewModel?.loading?.postValue(false)
    }

    override fun onError(message: String) {
        Log.d(TAG, "onError: $message")
    }
}
