package com.zebra.rfidreader.demo.bari_citta_connessa.interfaces

import android.location.Location
import com.zebra.rfidreader.demo.bari_citta_connessa.data.*

interface CallbackMapFragmentToActivityMain {

    fun onMoveStateVisibleShowBottomSheet(stateView: Boolean)
    fun onInfoSingleTowAwayZone(getCheckAssetResponse: GetCheckAssetResponse, id_doc: String)
    fun onClickMapCloseBottomSheet()

    fun onLocationReal(location: Location)


}