package com.zebra.rfidreader.demo.bari_citta_connessa.network

import android.util.Log
import com.google.gson.GsonBuilder
import com.zebra.rfidreader.demo.BuildConfig
import com.zebra.rfidreader.demo.bari_citta_connessa.utils.BASE_URL
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.Response
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.security.KeyManagementException
import java.security.KeyStoreException
import java.security.NoSuchAlgorithmException
import java.util.concurrent.TimeUnit
import javax.net.ssl.HostnameVerifier
import javax.net.ssl.HttpsURLConnection

class NetworkController private constructor() {

    companion object {
        val INSTANCE: NetworkController by lazy { NetworkController() }
    }

    var token: String = ""

    val controllers: Controllers

    init {
        val gson = GsonBuilder().setLenient().create()

        val loggingInterceptor = HttpLoggingInterceptor()
        if (BuildConfig.DEBUG) {
            loggingInterceptor.level = HttpLoggingInterceptor.Level.BODY
        } else {
            loggingInterceptor.level = HttpLoggingInterceptor.Level.NONE
        }

        val client = if (BASE_URL.contains("https")) {
            getOkHttpsClient()
                .addInterceptor { chain ->
                    val check = checkResponse(chain)
                    if (check != null) {
                        check
                    } else {
                        val request = chain.request().newBuilder().build()
                        chain.proceed(request)
                    }
                }
                .addInterceptor(loggingInterceptor)
                .build()
        } else {
            getOkHttpClient()
                .addInterceptor { chain ->
                    val check = checkResponse(chain)
                    if (check != null) {
                        check
                    } else {
                        val request = chain.request().newBuilder().build()
                        chain.proceed(request)
                    }
                }
                .addInterceptor(loggingInterceptor)
                .build()
        }

        val retrofit = Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(client)
            .addConverterFactory(GsonConverterFactory.create(gson))
            .build()
        Log.e("URL", retrofit.baseUrl().toString())
        controllers = Controllers(retrofit.create(NetworkApi::class.java))
    }


    private fun getOkHttpClient(): OkHttpClient.Builder {
        val okHttpClient = OkHttpClient.Builder()

        okHttpClient.connectTimeout((15 * 1000).toLong(), TimeUnit.MILLISECONDS)
        okHttpClient.readTimeout((15 * 1000).toLong(), TimeUnit.MILLISECONDS)
        okHttpClient.writeTimeout((15 * 1000).toLong(), TimeUnit.MILLISECONDS)

        return okHttpClient
    }

    private fun getOkHttpsClient(): OkHttpClient.Builder {

        val okHttpClient = getOkHttpClient()
        val hostnameVerifier = HostnameVerifier { _, session ->
            HttpsURLConnection.getDefaultHostnameVerifier().run {
                if (!BuildConfig.DEBUG) {
                    verify(BASE_URL, session)
                } else {
                    true
                }
            }
        }
        okHttpClient.hostnameVerifier(hostnameVerifier)

        try {
            val tlsSocketFactory = TLSSocketFactory()
            tlsSocketFactory.getTrustManager()?.let { trustManager ->
                okHttpClient.sslSocketFactory(tlsSocketFactory, trustManager)
            }
        } catch (e: KeyManagementException) {
            e.printStackTrace()
        } catch (e: NoSuchAlgorithmException) {
            e.printStackTrace()
        } catch (e: KeyStoreException) {
            e.printStackTrace()
        }
        return okHttpClient
    }

    private fun checkResponse(chain: Interceptor.Chain?): Response? {
        try {
            val originalRequest = chain?.request()
            var initialResponse: Response? = null
            originalRequest?.let {
                initialResponse = chain.proceed(it)
            }

            return when (initialResponse?.code()) {
                403, 401, 404 -> {
                    chain?.let { chainCall ->
                        val newRequest = originalRequest?.newBuilder()
                            ?.build()

                        newRequest?.let { request ->
                            chainCall.proceed(request)
                        }
                    }
                }
                else -> initialResponse
            }
        } catch (e: java.lang.Exception) {
            return null
        }
    }
}