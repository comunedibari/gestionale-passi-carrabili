package com.zebra.rfidreader.demo.bari_citta_connessa.network

import androidx.annotation.Nullable
import java.io.IOException
import java.net.InetAddress
import java.net.Socket
import java.net.UnknownHostException
import java.security.*
import javax.net.ssl.*

class TLSSocketFactory: SSLSocketFactory() {

    private var delegate: SSLSocketFactory? = null
    private lateinit var trustManagers: Array<TrustManager>

    init {
        generateTrustManagers()
    }

    @Throws(KeyStoreException::class, NoSuchAlgorithmException::class, KeyManagementException::class)
    private fun generateTrustManagers() {
        val trustManagerFactory: TrustManagerFactory = TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm())
        trustManagerFactory.init(null as KeyStore?)
        val trustManagers: Array<TrustManager> = trustManagerFactory.trustManagers
        if (trustManagers.size != 1 || trustManagers[0] !is X509TrustManager) {
            throw IllegalStateException("Unexpected default trust managers:" + trustManagers.contentToString())
        }
        this.trustManagers = trustManagers

        val context: SSLContext = SSLContext.getInstance("TLS")
        context.init(null as Array<KeyManager>?, trustManagers, SecureRandom())
        delegate = context.socketFactory
    }


    override fun getDefaultCipherSuites(): Array<String?>? {
        return delegate!!.defaultCipherSuites
    }

    override fun getSupportedCipherSuites(): Array<String?>? {
        return delegate!!.supportedCipherSuites
    }

    @Throws(IOException::class)
    override fun createSocket(): Socket? {
        return enableTLSOnSocket(delegate?.createSocket())
    }

    @Throws(IOException::class)
    override fun createSocket(s: Socket?, host: String?, port: Int, autoClose: Boolean): Socket? {
        return enableTLSOnSocket(delegate?.createSocket(s, host, port, autoClose))
    }

    @Throws(IOException::class, UnknownHostException::class)
    override fun createSocket(host: String?, port: Int): Socket? {
        return enableTLSOnSocket(delegate?.createSocket(host, port))
    }

    @Throws(IOException::class, UnknownHostException::class)
    override fun createSocket(host: String?, port: Int, localHost: InetAddress?, localPort: Int): Socket? {
        return enableTLSOnSocket(delegate?.createSocket(host, port, localHost, localPort))
    }

    @Throws(IOException::class)
    override fun createSocket(host: InetAddress?, port: Int): Socket? {
        return enableTLSOnSocket(delegate?.createSocket(host, port))
    }

    @Throws(IOException::class)
    override fun createSocket(address: InetAddress?, port: Int, localAddress: InetAddress?, localPort: Int): Socket? {
        return enableTLSOnSocket(delegate!!.createSocket(address, port, localAddress, localPort))
    }

    private fun enableTLSOnSocket(socket: Socket?): Socket? {
        if (socket != null && (socket is SSLSocket)) {
            socket.enabledProtocols = arrayOf("TLSv1.1", "TLSv1.2")
        }
        return socket
    }

    @Nullable
    fun getTrustManager(): X509TrustManager? {
        return trustManagers[0] as X509TrustManager
    }
}