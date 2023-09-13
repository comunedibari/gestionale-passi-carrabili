package com.zebra.rfidreader.demo.bari_citta_connessa.ui.fragment

import android.location.Location
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.ImageView
import android.widget.LinearLayout
import androidx.annotation.UiThread
import androidx.constraintlayout.widget.ConstraintLayout
import androidx.fragment.app.DialogFragment
import androidx.fragment.app.FragmentManager
import androidx.fragment.app.viewModels
import androidx.lifecycle.Observer
import androidx.lifecycle.ViewModelProviders
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.google.android.material.snackbar.Snackbar
import com.zebra.rfidreader.demo.R
import com.zebra.rfidreader.demo.bari_citta_connessa.adapter.TagAdapter
import com.zebra.rfidreader.demo.bari_citta_connessa.adapter.ValidTag
import com.zebra.rfidreader.demo.bari_citta_connessa.customs.recycleDecoration.GeneralSpacingItemDecoration
import com.zebra.rfidreader.demo.bari_citta_connessa.data.DataVerificaCartelloRequest
import com.zebra.rfidreader.demo.bari_citta_connessa.data.GetCheckAssetResponse
import com.zebra.rfidreader.demo.bari_citta_connessa.interfaces.ErrorOwner
import com.zebra.rfidreader.demo.bari_citta_connessa.interfaces.LoadingObserver
import com.zebra.rfidreader.demo.bari_citta_connessa.network.NetworkController
import com.zebra.rfidreader.demo.bari_citta_connessa.ui.viewmodel.SearchViewModel
import com.zebra.rfidreader.demo.bari_citta_connessa.ui.viewmodel.UtilViewModel
import com.zebra.rfidreader.demo.bari_citta_connessa.utils.DEBUG
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

private const val ARG_PARAM_LAT_LON = "latLon"
private const val QRCODE = "QRCODE"

class QRCodeDialogFragment : DialogFragment(), LoadingObserver, ErrorOwner {

    private var utilViewModel: UtilViewModel? = null
    private val viewModel: SearchViewModel by viewModels()

    private lateinit var tagAdapter: TagAdapter
    private lateinit var location: Location
    private lateinit var qrCode: String

    companion object {
        val fragment = QRCodeDialogFragment()

        fun show(fm: FragmentManager, qrCode: String, location: Location) {
            val args = Bundle()
            args.putString(QRCODE, qrCode)
            args.putParcelable(ARG_PARAM_LAT_LON, location)
            fragment.arguments = args
            fragment.show(fm, "QR_DIALOG")
        }

    }


    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? {
        return inflater.inflate(R.layout.fragment_list_event_id_tag, container, true)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        val recyclerViewListTags: RecyclerView = view.findViewById(R.id.listView_tag)
        recyclerViewListTags.layoutManager = LinearLayoutManager(view.context, LinearLayoutManager.VERTICAL, false)
        recyclerViewListTags.addItemDecoration(GeneralSpacingItemDecoration(8, GeneralSpacingItemDecoration.VERTICAL))


        tagAdapter = TagAdapter(
            listenerRed = { assetDetail, reason ->
                fragmentManager?.let { fm ->
                    ReportingFragment.show(fm, location, assetDetail, reason)
                    dismiss()
                }
            },
            listenerGreen = { id_doc ->
                NetworkController.INSTANCE.controllers.setDataVerificaCartello(
                    DataVerificaCartelloRequest( id_doc)
                ).observe(viewLifecycleOwner, Observer { response ->
                    if (response.value != null) {
                        Snackbar.make(view.rootView, response.value.message ?: "", Snackbar.LENGTH_SHORT).show()
                    }
                })
            }
        )

        recyclerViewListTags.adapter = tagAdapter

        updateList()

        viewModel.checkAssetResponseLiveData.observe(viewLifecycleOwner, Observer {
            handleSearchResult(it, view)
        })

        val buttonCloseX = view.findViewById<ImageView>(R.id.close_rfid)
        val buttonCancel = view.findViewById<Button>(R.id.button_cancel_rfid)

        buttonCloseX.setOnClickListener {
            dismiss()
        }
        buttonCancel.setOnClickListener {
            dismiss()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        utilViewModel = ViewModelProviders.of(requireActivity()).get(UtilViewModel::class.java)
        setStyle(STYLE_NO_TITLE, 0)
        arguments?.let {
            qrCode = it.getString(QRCODE) ?: ""
            location = it.getParcelable(ARG_PARAM_LAT_LON) as Location
        }
    }

    override fun onResume() {
        dialog?.window?.setLayout(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.MATCH_PARENT)
        super.onResume()
    }

    private fun updateList() {
        CoroutineScope(Dispatchers.Main).launch {
            viewModel.checkAsset("", location.latitude, location.longitude, DEBUG, qrCode).observe(viewLifecycleOwner, Observer {
                it.value?.let { response ->
                    viewModel.checkAssetResponseLiveData.postValue(response)
                }
            })
        }
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
        println("Error: $message")
    }

    private fun handleSearchResult(it: GetCheckAssetResponse, view: View) {
        val recycler = view.findViewById<RecyclerView>(R.id.listView_tag)
        val emptyState = view.findViewById<ConstraintLayout>(R.id.empty_state_layout)
        if (it.result?.isNotEmpty() == true) {
            recycler.visibility = View.VISIBLE
            emptyState.visibility = View.GONE
            val elem = it.result[0]
            tagAdapter.updateDataList(
                listOf(
                    ValidTag(
                        elem.tag_rfid ?: elem.id_doc,
                        elem.dati_istanza?.indirizzo_segnale_indicatore?.indirizzo ?: "",
                        it.violation?.reason ?: "",
                        it.violation?.isValid == true,
                        elem
                    )
                )
            )
        } else {
            recycler.visibility = View.GONE
            emptyState.visibility = View.VISIBLE
            tagAdapter.updateDataList(listOf())
        }
    }
}
