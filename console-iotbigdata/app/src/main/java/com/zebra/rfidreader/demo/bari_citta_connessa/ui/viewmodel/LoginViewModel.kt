package com.zebra.rfidreader.demo.bari_citta_connessa.ui.viewmodel

import androidx.lifecycle.LiveData
import androidx.lifecycle.MediatorLiveData
import androidx.lifecycle.MutableLiveData
import com.zebra.rfidreader.demo.bari_citta_connessa.data.LoginResponse
import com.zebra.rfidreader.demo.bari_citta_connessa.network.NetworkController
import com.zebra.rfidreader.demo.bari_citta_connessa.network.RetrofitLiveData
import com.zebra.rfidreader.demo.bari_citta_connessa.utils.ObservableViewModel

class LoginViewModel : ObservableViewModel() {

    val username: MutableLiveData<String> = MutableLiveData()
    val password: MutableLiveData<String> = MutableLiveData()

    private lateinit var loginResponse: RetrofitLiveData<LoginResponse>

    fun validForm(): LiveData<Boolean> {

        val result = MediatorLiveData<Boolean>()
        var isValidUserAgent = false
        var isValidPassword = false

        fun checkForm() {
            result.value = isValidUserAgent && isValidPassword
        }
        result.addSource(username) {
            isValidUserAgent = !it.isNullOrBlank()
            checkForm()
        }
        result.addSource(password) {
            isValidPassword = !it.isNullOrBlank()
            checkForm()
        }
        return result
    }

    fun login(username: String = this@LoginViewModel.username.value.toString(), password: String = this@LoginViewModel.password.value.toString()): RetrofitLiveData<LoginResponse> {
        return NetworkController.INSTANCE.controllers.login(username, password)
    }


}