package com.zebra.rfidreader.demo.bari_citta_connessa.network

import com.zebra.rfidreader.demo.bari_citta_connessa.data.*
import retrofit2.Call
import retrofit2.http.*

interface NetworkApi {

    //Original "prod"

    @POST("auth/login")
    fun login(@Body loginRequest: LoginRequest): Call<LoginResponse>

    @POST("v1/getPoi")
    fun getPoi(@Body requestPoi: RequestPoi, @Header("Authorization") token: String = NetworkController.INSTANCE.token): Call<GetPoiResponse>

    @GET("v1/getPoi")
    fun getPoiAll(@Header("Authorization") token: String = NetworkController.INSTANCE.token): Call<GetPoiResponse>

    @POST("v1/checkAsset")
    fun getCheckAsset(@Body checkAsset: GetCheckAssetRequest, @Header("Authorization") token: String = NetworkController.INSTANCE.token): Call<GetCheckAssetResponse>

    @GET("v1/segnalazioni")
    fun getReporting(@Header("Authorization") token: String = NetworkController.INSTANCE.token): Call<GetReportingResponse>

    @PUT("v1/segnalazioni")
    fun sendSignalation(@Body sendSignalationRequest: RequestReporting, @Header("Authorization") token: String = NetworkController.INSTANCE.token): Call<SendContentSignalationResponse>

    @PUT("v1/{type}")
    fun sendAddAsset(@Path("type") type: String, @Body sendAddAssetRequest: SendContentAddAssetRequest, @Header("Authorization") token: String = NetworkController.INSTANCE.token): Call<SendContentAddAssetResponse>

    @POST("v1/civico")
    fun checkAddress(@Body checkAddressRequest: CheckAddressRequest, @Header("Authorization") token: String = NetworkController.INSTANCE.token): Call<CivilarioObj>

    @POST("passicarrabili/praticheCittadino")
    fun searchPraticheCittadino(@Body searchPraticheRequest: SearchPraticheRequest, @Header("Authorization") token: String = NetworkController.INSTANCE.token): Call<SearchPraticheResponse>

    @POST("v1/setDataVerificaCartello")
    fun setDataVerificaCartello(@Body dataVerificaCartelloRequest: DataVerificaCartelloRequest, @Header("Authorization") token: String = NetworkController.INSTANCE.token): Call<DataVerificaCartelloResponse>
}