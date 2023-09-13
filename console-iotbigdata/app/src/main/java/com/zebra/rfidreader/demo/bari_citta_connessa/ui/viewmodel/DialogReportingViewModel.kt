package com.zebra.rfidreader.demo.bari_citta_connessa.ui.viewmodel

import com.zebra.rfidreader.demo.bari_citta_connessa.data.*
import com.zebra.rfidreader.demo.bari_citta_connessa.network.NetworkController
import com.zebra.rfidreader.demo.bari_citta_connessa.network.RetrofitLiveData
import com.zebra.rfidreader.demo.bari_citta_connessa.utils.ObservableViewModel


class DialogReportingViewModel : ObservableViewModel() {

    private lateinit var sendDataSignalationResponse: RetrofitLiveData<SendContentSignalationResponse>

    var tempIndirizzoCivilario: IndirizzoSegnaleIndicatore? = null

    fun sendDataSignalation(assetReporting: AssetReporting, assetDetail: AssetDetail?, userLogged: UserLogged?): RetrofitLiveData<SendContentSignalationResponse> {
        sendDataSignalationResponse = NetworkController.INSTANCE.controllers.sendSignalation(
            RequestReporting(
                assetDetail,
                assetReporting,
                LastModificationObj(
                    username = userLogged?.username ?: "",
                    utente = userLogged?.nome+" "+userLogged?.cognome
                )
            )
        )
        return sendDataSignalationResponse
    }

    fun checkAddress(indirizzo: String, numero: String, esponente: String): RetrofitLiveData<CivilarioObj> {
        val checkAddressRequest = CheckAddressRequest(indirizzo, numero, esponente)
        return NetworkController.INSTANCE.controllers.checkAddress(checkAddressRequest)
    }
}