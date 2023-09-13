package com.zebra.rfidreader.demo.bari_citta_connessa.ui.viewmodel

import androidx.lifecycle.*
import com.zebra.rfidreader.demo.bari_citta_connessa.data.*
import com.zebra.rfidreader.demo.bari_citta_connessa.network.NetworkController
import com.zebra.rfidreader.demo.bari_citta_connessa.network.RetrofitLiveData
import kotlinx.coroutines.*

class SearchViewModel : ViewModel() {
    val searchResult: MutableLiveData<SearchResult> = MutableLiveData()
    val checkAssetResponseLiveData: MutableLiveData<GetCheckAssetResponse> = MutableLiveData()

    fun search(searchPraticheRequest: SearchPraticheRequest): RetrofitLiveData<SearchPraticheResponse> {
        return NetworkController.INSTANCE.controllers.searchPratiche(searchPraticheRequest)
    }

    fun checkAddress(indirizzo: String, numero: String, esponente: String): RetrofitLiveData<CivilarioObj> {
        val checkAddressRequest = CheckAddressRequest(indirizzo, numero, esponente)
        return NetworkController.INSTANCE.controllers.checkAddress(checkAddressRequest)
    }

    fun checkAsset(idDoc: String?, lat: Double, lon: Double, debug: Boolean, idTag: String?): RetrofitLiveData<GetCheckAssetResponse> {
        return NetworkController.INSTANCE.controllers.getCheckAsset(idDoc, lat, lon, debug, idTag, null)
    }

    override fun onCleared() {
        super.onCleared()
        viewModelScope.cancel()
    }
}