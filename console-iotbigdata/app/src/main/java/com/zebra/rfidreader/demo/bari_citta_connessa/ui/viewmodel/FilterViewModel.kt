package com.zebra.rfidreader.demo.bari_citta_connessa.ui.viewmodel

import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel

class FilterViewModel : ViewModel() {
    var filters: MutableLiveData<String> = MutableLiveData()
}