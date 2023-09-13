package com.zebra.rfidreader.demo.bari_citta_connessa.ui.viewmodel

import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.Transformations
import androidx.lifecycle.ViewModel
import com.zebra.rfidreader.demo.bari_citta_connessa.data.Event
import com.zebra.rfidreader.demo.bari_citta_connessa.data.UserLogged

class UtilViewModel : ViewModel() {
    var message: MutableLiveData<String> = MutableLiveData()
    var showPermissionSnackBar: MutableLiveData<String> = MutableLiveData()

    var phone = false

    var userLogged : UserLogged? = null

    fun isPhone() : Boolean {
        return phone
    }

    fun setIsPhone(bool: Boolean) {
        phone = bool
    }

    val loading: MutableLiveData<Boolean> = MutableLiveData()
    var loadingState = Transformations.map(loading) {
        Event(it)
    }
}