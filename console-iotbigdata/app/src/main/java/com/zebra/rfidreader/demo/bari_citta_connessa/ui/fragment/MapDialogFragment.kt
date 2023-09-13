package com.zebra.rfidreader.demo.bari_citta_connessa.ui

import android.location.Location
import android.os.Bundle
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import com.google.android.gms.maps.CameraUpdateFactory
import com.google.android.gms.maps.GoogleMap
import com.google.android.gms.maps.OnMapReadyCallback
import com.google.android.gms.maps.SupportMapFragment
import com.google.android.gms.maps.model.BitmapDescriptorFactory
import com.google.android.gms.maps.model.LatLng
import com.google.android.gms.maps.model.Marker
import com.google.android.gms.maps.model.MarkerOptions
import com.zebra.rfidreader.demo.R
import com.zebra.rfidreader.demo.bari_citta_connessa.utils.Utils
import google_maps_library_kt.fragment.GoogleMapsFragment


class MapDialogFragment : GoogleMapsFragment(), OnMapReadyCallback/*, LoadingObserver, ErrorOwner, CallbackDialogSignalationToFragmentMap*/ {

    private lateinit var mapFragment: SupportMapFragment

    private var map: GoogleMap? = null
    private var myMarker: Marker? = null

    private var doAnimateCamera: Boolean = true
    private var mCurrentLocation: Location? = null

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? {
        val view = inflater.inflate(R.layout.content_main, container, false)

        mapFragment = childFragmentManager.findFragmentById(R.id.map) as SupportMapFragment
        mapFragment.getMapAsync(this)

        return view
    }

    override fun onMapReady(googleMap: GoogleMap) {
        map = googleMap
        map?.uiSettings?.isRotateGesturesEnabled = false
        map?.uiSettings?.isCompassEnabled = false
        map?.uiSettings?.isMapToolbarEnabled = false
        map?.uiSettings?.isScrollGesturesEnabled = false
        map?.uiSettings?.isTiltGesturesEnabled = false
        map?.uiSettings?.isZoomGesturesEnabled = false

        // Set a preference for minimum and maximum zoom.
        map?.setMinZoomPreference(6.0f)
        map?.setMaxZoomPreference(20.0f)

        retrieveCameraToMyPosition()
    }


    @Throws(SecurityException::class)
    fun retrieveCameraToMyPosition(coords: LatLng) {
        retrieveAndDrawMyPositionOnMap(coords)
    }


    @Throws(SecurityException::class)
    fun retrieveCameraToMyPosition() {
        Log.e("TAGDialog", "retrieveCameraToMyPosition")
        if (mCurrentLocation != null) {
            map?.animateCamera(CameraUpdateFactory.newLatLngZoom(LatLng(mCurrentLocation?.latitude ?: 0.0, mCurrentLocation?.longitude ?: 0.0), 18f))
        } else {
            checkLocationManager()
        }
    }

    @Throws(SecurityException::class)
    private fun retrieveAndDrawMyPositionOnMap() {
        mCurrentLocation?.let {
            myMarker?.let {mkr ->
                mkr.remove()
            }
            val markerOptions = MarkerOptions()
            markerOptions.position(LatLng(it.latitude, it.longitude))
            markerOptions.icon(BitmapDescriptorFactory.fromResource(R.drawable.ic_my_position))
            myMarker = map?.addMarker(markerOptions)
        }
    }

    @Throws(SecurityException::class)
    fun retrieveAndDrawMyPositionOnMap(coords: LatLng?) {
        coords?.let {it ->
            myMarker?.let {mkr ->
                mkr.remove()
            }
            val markerOptions = MarkerOptions()
            markerOptions.position(LatLng(it.latitude, it.longitude))
            markerOptions.icon(BitmapDescriptorFactory.fromResource(R.drawable.ic_my_position))
            myMarker = map?.addMarker(markerOptions)
            map?.animateCamera(CameraUpdateFactory.newLatLngZoom(LatLng(it.latitude, it.longitude), 18f))

        }
    }

    override fun onLocationRetrieved(location: Location) {
        if (mCurrentLocation == null || mCurrentLocation?.longitude != location.longitude || mCurrentLocation?.latitude != location.latitude) {
            mCurrentLocation = location
            retrieveAndDrawMyPositionOnMap()
            if (doAnimateCamera && mCurrentLocation != null) {
                doAnimateCamera = false
                retrieveCameraToMyPosition()
            }
        }
    }
}