package com.zebra.rfidreader.demo.bari_citta_connessa.network

import com.zebra.rfidreader.demo.bari_citta_connessa.data.*

class Controllers(private val networkApi: NetworkApi) {

    fun login(username: String, password: String): RetrofitLiveData<LoginResponse> = RetrofitLiveData(networkApi.login(LoginRequest(username, password))) {
        NetworkController.INSTANCE.token = "Bearer ${it.token}"
        it
    }

    fun getPoi(lat: Double, lon: Double, distance: String, isValid: Boolean?): RetrofitLiveData<GetPoiResponse> = RetrofitLiveData(networkApi.getPoi(RequestPoi(lat, lon, distance, isValid)))

    fun getPoiAll(): RetrofitLiveData<GetPoiResponse> = getPoi(40.12, 12.12, "1000km", null)

    fun getCheckAsset(id_doc: String?, lat: Double, lon: Double, debug: Boolean, id_tag: String?, memoryBankTid: String?): RetrofitLiveData<GetCheckAssetResponse> = RetrofitLiveData(networkApi.getCheckAsset(GetCheckAssetRequest(id_doc = id_doc ?: "", lat = lat, lon = lon, debug = debug, tag_rfid = id_tag)))

    fun getReporting(): RetrofitLiveData<GetReportingResponse> = RetrofitLiveData(networkApi.getReporting())

    fun sendAddAsset(type: String, sendAddAssetRequest: SendContentAddAssetRequest): RetrofitLiveData<SendContentAddAssetResponse> = RetrofitLiveData(networkApi.sendAddAsset(type, sendAddAssetRequest))

    fun sendSignalation(request: RequestReporting): RetrofitLiveData<SendContentSignalationResponse> = RetrofitLiveData(networkApi.sendSignalation(request))

    fun checkAddress(checkAddressRequest: CheckAddressRequest): RetrofitLiveData<CivilarioObj> = RetrofitLiveData(networkApi.checkAddress(checkAddressRequest))

    fun searchPratiche(searchPraticheRequest: SearchPraticheRequest): RetrofitLiveData<SearchPraticheResponse> = RetrofitLiveData(networkApi.searchPraticheCittadino(searchPraticheRequest))

    fun setDataVerificaCartello(dataVerificaCartelloRequest: DataVerificaCartelloRequest): RetrofitLiveData<DataVerificaCartelloResponse> = RetrofitLiveData(networkApi.setDataVerificaCartello(dataVerificaCartelloRequest))

}