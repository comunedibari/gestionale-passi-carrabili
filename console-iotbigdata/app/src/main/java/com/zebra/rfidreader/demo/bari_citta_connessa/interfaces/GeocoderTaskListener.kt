package com.zebra.rfidreader.demo.bari_citta_connessa.interfaces

import android.location.Address
import java.util.ArrayList

interface GeocoderTaskListener {

    fun onGeocoderTask(addresses: ArrayList<Address>)
}