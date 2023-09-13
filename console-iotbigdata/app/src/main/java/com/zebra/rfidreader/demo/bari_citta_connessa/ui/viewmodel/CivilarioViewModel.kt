package com.zebra.rfidreader.demo.bari_citta_connessa.ui.viewmodel

import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import com.zebra.rfidreader.demo.bari_citta_connessa.data.CivicoObj
import com.zebra.rfidreader.demo.bari_citta_connessa.utils.Event

class CivilarioViewModel : ViewModel() {
    var objCivilario = MutableLiveData<Event<CivicoObj>>()
}