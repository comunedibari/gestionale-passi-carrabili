package com.zebra.rfidreader.demo.bari_citta_connessa.network

import android.util.Log
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.Observer
import com.zebra.rfidreader.demo.bari_citta_connessa.interfaces.ErrorOwner
import com.zebra.rfidreader.demo.bari_citta_connessa.interfaces.LoadingObserver
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

data class NetworkResponse<T>(val value: T?, val isSuccessful: Boolean, val status: Int, val message: String)


class RetrofitLiveData<T>(private val call: Call<T>, private val actionOnResponse: ((T) -> T)? = null) : MutableLiveData<NetworkResponse<T>>(), Callback<T> {

    override fun onActive() {
        enqueue()
    }

    fun enqueue() {
        if (!call.isCanceled && !call.isExecuted) call.enqueue(this)
    }


    private var loadingObserver: LoadingObserver? = null
    private var errorOwner: ErrorOwner? = null

    fun <O> observeOwner(owner: O, observer: Observer<NetworkResponse<T>>, shouldLoad: Boolean = true, onErrorAction: (() -> String)? = null) where O : LoadingObserver, O : LifecycleOwner, O : ErrorOwner {

        this.loadingObserver = owner
        this.errorOwner = owner
        if (count == 0 && shouldLoad)
            loadingObserver?.enableLoading()
        count++
        observe(owner, Observer {
            count--
            if (count == 0)
                loadingObserver?.disableLoading()
            if (it?.isSuccessful == false)
                if (onErrorAction != null)
                    errorOwner?.onError(onErrorAction())
                else
                    errorOwner?.onError(it.message)
            else
                observer.onChanged(it)
        })
    }

    override fun onFailure(call: Call<T>?, t: Throwable?) {
        Log.e("NETWORK_FAILURE", t?.localizedMessage?.toString() ?: "")
        count--
        loadingObserver?.disableLoading()
        errorOwner?.onError(t?.localizedMessage?.toString() ?: "")
    }

    override fun onResponse(call: Call<T>?, response: Response<T>?) {
        var body = response?.body()
        Log.e("NETWORK_RESPONSE", body.toString())
        if (body != null && actionOnResponse != null) {
            body = actionOnResponse.invoke(body)
        }

        value = NetworkResponse(
            body, response?.isSuccessful == true, response?.code()
                ?: 0, String(
                response?.errorBody()?.bytes()
                    ?: ByteArray(0)
            )
        )
    }

    fun cancel() = if (!call.isCanceled) call.cancel() else Unit

    companion object {
        var count = 0
    }

}