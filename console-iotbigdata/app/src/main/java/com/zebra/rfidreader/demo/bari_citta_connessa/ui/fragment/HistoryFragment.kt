package com.zebra.rfidreader.demo.bari_citta_connessa.ui.fragment

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.LinearLayout
import androidx.annotation.UiThread
import androidx.fragment.app.DialogFragment
import androidx.fragment.app.FragmentManager
import androidx.lifecycle.Observer
import androidx.lifecycle.ViewModelProviders
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.zebra.rfidreader.demo.R
import com.zebra.rfidreader.demo.bari_citta_connessa.adapter.HistoryAdapter
import com.zebra.rfidreader.demo.bari_citta_connessa.interfaces.ErrorOwner
import com.zebra.rfidreader.demo.bari_citta_connessa.interfaces.LoadingObserver
import com.zebra.rfidreader.demo.bari_citta_connessa.network.NetworkController
import com.zebra.rfidreader.demo.bari_citta_connessa.ui.viewmodel.UtilViewModel

class HistoryFragment : DialogFragment(), LoadingObserver, ErrorOwner {

    private var utilViewModel: UtilViewModel? = null

    private var historyAdapter = HistoryAdapter(mutableListOf())

    companion object {
        fun show(fm: FragmentManager) {
            HistoryFragment().show(fm, "HISTORY_DIALOG")
        }
    }

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? {
        val view: View = inflater.inflate(R.layout.activity_dialog_history, container, false)

        historyAdapter = HistoryAdapter(mutableListOf())

        val recycleHistory: RecyclerView = view.findViewById(R.id.recycle_history)
        recycleHistory.layoutManager = LinearLayoutManager(activity, RecyclerView.VERTICAL, false)
        recycleHistory.adapter = historyAdapter

        val closeHistory: ImageView = view.findViewById(R.id.close_history)
        closeHistory.setOnClickListener {
            dismiss()
        }

        return view
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        updateReports()
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        utilViewModel = ViewModelProviders.of(requireActivity()).get(UtilViewModel::class.java)
        setStyle(STYLE_NO_TITLE, 0)
    }

    override fun onResume() {
        dialog?.window?.setLayout(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.MATCH_PARENT)
        super.onResume()
    }

    private fun updateReports() {
        NetworkController.INSTANCE.controllers.getReporting().observeOwner(this, Observer {
            it?.value?.result?.let { listResult ->
                for (item in listResult) {
                    historyAdapter.addItem(item)
                }
            }
        })
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
}
