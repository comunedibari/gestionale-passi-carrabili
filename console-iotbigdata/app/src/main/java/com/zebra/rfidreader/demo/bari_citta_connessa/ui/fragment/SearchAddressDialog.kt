package com.zebra.rfidreader.demo.bari_citta_connessa.ui.fragment

import android.content.Context
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.LinearLayout
import androidx.annotation.UiThread
import androidx.databinding.DataBindingUtil
import androidx.fragment.app.DialogFragment
import androidx.fragment.app.FragmentManager
import androidx.lifecycle.Observer
import androidx.lifecycle.ViewModelProviders
import androidx.recyclerview.widget.LinearLayoutManager
import com.zebra.rfidreader.demo.R
import com.zebra.rfidreader.demo.bari_citta_connessa.adapter.CivilarioAdapter
import com.zebra.rfidreader.demo.bari_citta_connessa.interfaces.ErrorOwner
import com.zebra.rfidreader.demo.bari_citta_connessa.interfaces.LoadingObserver
import com.zebra.rfidreader.demo.bari_citta_connessa.ui.viewmodel.CivilarioViewModel
import com.zebra.rfidreader.demo.bari_citta_connessa.ui.viewmodel.DialogReportingViewModel
import com.zebra.rfidreader.demo.bari_citta_connessa.ui.viewmodel.UtilViewModel
import com.zebra.rfidreader.demo.bari_citta_connessa.ui.viewmodel.ViewModelFactory
import com.zebra.rfidreader.demo.bari_citta_connessa.utils.Event
import com.zebra.rfidreader.demo.databinding.SearchAddressDialogBinding

class SearchAddressDialog : DialogFragment(), LoadingObserver, ErrorOwner {

    private val utilViewModel: UtilViewModel? by lazy { activity?.let { ViewModelProviders.of(it, ViewModelFactory).get(UtilViewModel::class.java) } }
    private val civilarioViewModel: CivilarioViewModel? by lazy { activity?.let { ViewModelProviders.of(it, ViewModelFactory).get(CivilarioViewModel::class.java) } }
    private val viewModelReporting: DialogReportingViewModel by lazy { ViewModelProviders.of(this, ViewModelFactory).get(DialogReportingViewModel::class.java) }

    private lateinit var binding: SearchAddressDialogBinding

    companion object {
        val fragment = SearchAddressDialog()
        fun show(fm: FragmentManager) {
            fragment.show(fm, "SEARCH_ADDRESS_DIALOG")
        }

    }


    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? {
        binding = DataBindingUtil.inflate(inflater, R.layout.search_address_dialog, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        with(binding) {

            val civilarioAdapter = CivilarioAdapter(arrayListOf()) {
                civilarioViewModel?.objCivilario?.postValue(Event(it))
                dismiss()
            }
            searchAddressList.layoutManager = LinearLayoutManager(requireActivity())
            searchAddressList.adapter = civilarioAdapter


            findAddressButton.setOnClickListener {
                val im = requireActivity().getSystemService(Context.INPUT_METHOD_SERVICE) as android.view.inputmethod.InputMethodManager
                im.hideSoftInputFromWindow(getView()?.windowToken, 0)
                viewModelReporting.checkAddress(addressText.text.toString(), civicoText.text.toString(), esponenteText.text.toString()).observeOwner(this@SearchAddressDialog, Observer { coj ->
                    coj?.value?.let { obj ->
                        civilarioAdapter.updateDataset(obj.result)
                        if (obj.result.size != 0) {
                            searchAddressList.visibility = View.VISIBLE
                            emptyStateLayout.root.visibility = View.GONE
                        } else {
                            searchAddressList.visibility = View.GONE
                            emptyStateLayout.root.visibility = View.VISIBLE
                        }
                    }
                })
            }
        }

        binding.close.setOnClickListener {
            dismiss()
        }

    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setStyle(STYLE_NO_TITLE, 0)
    }

    override fun onResume() {
        dialog?.window?.setLayout(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.MATCH_PARENT)
        super.onResume()
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
