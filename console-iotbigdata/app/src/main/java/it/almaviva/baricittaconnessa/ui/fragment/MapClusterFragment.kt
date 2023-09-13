package it.almaviva.baricittaconnessa.ui.fragment

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Point
import android.location.Location
import android.location.LocationManager
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.annotation.UiThread
import androidx.lifecycle.Observer
import androidx.lifecycle.ViewModelProviders
import com.google.android.gms.maps.CameraUpdateFactory
import com.google.android.gms.maps.GoogleMap
import com.google.android.gms.maps.OnMapReadyCallback
import com.google.android.gms.maps.SupportMapFragment
import com.google.android.gms.maps.model.BitmapDescriptorFactory
import com.google.android.gms.maps.model.LatLng
import com.google.android.gms.maps.model.Marker
import com.google.android.gms.maps.model.MarkerOptions
import com.google.android.material.snackbar.Snackbar
import com.google.maps.android.clustering.ClusterManager
import com.zebra.rfidreader.demo.R
import com.zebra.rfidreader.demo.bari_citta_connessa.data.*
import com.zebra.rfidreader.demo.bari_citta_connessa.interfaces.CallbackActivityMainToMapFragment
import com.zebra.rfidreader.demo.bari_citta_connessa.interfaces.CallbackMapFragmentToActivityMain
import com.zebra.rfidreader.demo.bari_citta_connessa.interfaces.ErrorOwner
import com.zebra.rfidreader.demo.bari_citta_connessa.interfaces.LoadingObserver
import com.zebra.rfidreader.demo.bari_citta_connessa.mapUtils.CustomClusterRenderer
import com.zebra.rfidreader.demo.bari_citta_connessa.network.NetworkController
import com.zebra.rfidreader.demo.bari_citta_connessa.network.NetworkResponse
import com.zebra.rfidreader.demo.bari_citta_connessa.ui.viewmodel.FilterViewModel
import com.zebra.rfidreader.demo.bari_citta_connessa.ui.viewmodel.UtilViewModel
import com.zebra.rfidreader.demo.bari_citta_connessa.ui.viewmodel.ViewModelFactory
import com.zebra.rfidreader.demo.zebra.common.Constants.*
import google_maps_library_kt.fragment.GoogleMapsFragment
import java.util.*
import com.zebra.rfidreader.demo.bari_citta_connessa.utils.DEBUG

class MapClusterFragment : GoogleMapsFragment(), OnMapReadyCallback, GoogleMap.OnCameraIdleListener, GoogleMap.OnMapClickListener, GoogleMap.OnMarkerClickListener, LoadingObserver, ErrorOwner, CallbackActivityMainToMapFragment {

    private val utilViewModel: UtilViewModel? by lazy { requireActivity().let { ViewModelProviders.of(it, ViewModelFactory).get(UtilViewModel::class.java) } }

    private lateinit var mapFragment: SupportMapFragment

    lateinit var map: GoogleMap
    private var myMarker: Marker? = null

    private var doAnimateCamera: Boolean = true
    private lateinit var oldPosMin: Location
    private lateinit var oldPosMax: Location
    private var oldRange: Float = 0.toFloat()

    private var mCurrentLocation: Location? = null
    private lateinit var mClusterManager: ClusterManager<AssetType>
    private var mCurrentContentSingleAssetPoi: AssetDetail? = null

    lateinit var filterViewModel : FilterViewModel
    //Interface listener
    private var listener: CallbackMapFragmentToActivityMain? = null

    private var treeMap: TreeMap<String, AssetType> = TreeMap()


    override fun onAttach(context: Context) {
        super.onAttach(context)
        listener = context as CallbackMapFragmentToActivityMain
    }

    override fun onDetach() {
        super.onDetach()
        listener = null
    }

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? {
        return inflater.inflate(R.layout.content_main, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        mapFragment = childFragmentManager.findFragmentById(R.id.map) as SupportMapFragment
        mapFragment.getMapAsync(this)
    }

    override fun onMapReady(googleMap: GoogleMap) {
        map = googleMap
        map.uiSettings.isRotateGesturesEnabled = false
        map.uiSettings.isCompassEnabled = false
        map.uiSettings.isMapToolbarEnabled = false
        //map.setPadding(0, 200, 30, 0)

        // Set a preference for minimum and maximum zoom.
//        map.setMinZoomPreference(13.0f)
//        map.setMaxZoomPreference(20.0f)

        setLocationToDefault()

        context?.let {
            mClusterManager = ClusterManager(it, map)
            mClusterManager.renderer = CustomClusterRenderer(it, map, mClusterManager)
        }

        map.setOnMarkerClickListener(this)
        map.setOnCameraIdleListener(this)
        map.setOnMapClickListener(this)

        listener?.onMoveStateVisibleShowBottomSheet(false)

        requireActivity().let { fa ->
            filterViewModel = ViewModelProviders.of(fa).get(FilterViewModel::class.java)

            filterViewModel.filters.observe(fa, Observer { filter ->
                if (filter != null) {
                    refreshMarkerOnMap(filter, true)
                }
            })
        }
    }

    override fun onCameraIdle() {
        requireActivity().let {
            filterViewModel.filters.postValue(filterViewModel.filters.value)
        }
    }

    override fun onMapClick(location: LatLng?) {
        listener?.onClickMapCloseBottomSheet()
        listener?.onMoveStateVisibleShowBottomSheet(false)
    }

    override fun onMarkerClick(marker: Marker?): Boolean {
        marker?.let {

            if(it.tag == null) {
                map.animateCamera(CameraUpdateFactory.newLatLngZoom(LatLng(it.position.latitude, it.position.longitude), map.cameraPosition.zoom + 1))

            } else {
                val asset = treeMap[it.tag]
                asset?.let { assetType ->
                    checkSinglePoi(id_doc = assetType.id_doc ?: "" , type = assetType.type ?: "passicarrabili")
                }
            }

        }
        return true
    }

    private fun setLocationToDefault() {
        map.moveCamera(CameraUpdateFactory.newLatLngZoom(LatLng(mCurrentLocation?.latitude ?:41.120686, mCurrentLocation?.longitude ?: 16.869553), 6f))
    }

    private fun refreshMarkerOnMap(filter: String, force: Boolean = false) {
        val nearLeft = map.projection.visibleRegion.nearLeft
        val farRight = map.projection.visibleRegion.farRight

        val posMin = Location("")
        posMin.latitude = nearLeft.latitude
        posMin.longitude = nearLeft.longitude

        val posMax = Location("")
        posMax.latitude = farRight.latitude
        posMax.longitude = farRight.longitude

        val range = posMin.distanceTo(posMax)
        val mediaLat = (posMax.latitude + posMin.latitude) / 2
        val mediaLon = (posMax.longitude + posMin.longitude) / 2

        if (force || (range > oldRange || posMin.distanceTo(oldPosMin) > range || posMax.distanceTo(oldPosMax) > range)) {

            requireActivity().let { fa ->
                /* not used -> only tow away zone
                if (itemNavAsset.typeAsset != ALL_FILTER_TYPE) {
                    NetworkController.INSTANCE.controllers.getSinglePoiAll(itemNavAsset.typeAssetFilter).observe(fa, Observer<NetworkResponse<GetSinglePoiResponse>> {
                        it?.value?.result?.apply {
                            //setMarkersOnMap(this)
                        }
                    })
                } else { */
                val isValid : Boolean? = when (filter){
                    ALL -> null
                    VALID -> true
                    NOT_VALID -> false
                    else -> null
                }
                    NetworkController.INSTANCE.controllers.getPoi(mediaLat, mediaLon, ((range/2) / 1000).toString() + "km", isValid).observe(fa, Observer<NetworkResponse<GetPoiResponse>> { networkResponse ->
                        networkResponse?.value?.result?.apply {
                            setMarkersOnMap(this, filter)
                        }
                    })
                /*}*/
            }

            oldPosMin = posMin
            oldPosMax = posMax
            if (!doAnimateCamera)
                oldRange = range
        }
    }

    private fun setMarkersOnMap(list: List<AssetType>, filter: String) {
        treeMap.clear()
        mClusterManager.clearItems()
        list.forEach { assetType ->
            assetType.let { assetItems ->
                treeMap[(assetItems.id_doc ?: "")] = assetItems
                mClusterManager.addItem(assetItems)
            }
        }
        mClusterManager.cluster()
    }

    override fun onOffsetBottomSheet(offset: Float) {
        val assetLocation: com.zebra.rfidreader.demo.bari_citta_connessa.data.Location? = mCurrentContentSingleAssetPoi?.dati_istanza?.indirizzo_segnale_indicatore?.location

        if (mCurrentContentSingleAssetPoi != null && assetLocation !=null && assetLocation.lat!=null && assetLocation.lon!=null ) {
            val mapPoint: Point = map.projection.toScreenLocation(LatLng(assetLocation.lat, assetLocation.lon))
            mapPoint.set(mapPoint.x, mapPoint.y + (200 * offset).toInt())
            map.animateCamera(CameraUpdateFactory.newLatLng(map.projection.fromScreenLocation(mapPoint)))
        }
    }

    @SuppressLint("MissingPermission")
    private fun checkSinglePoi(id_doc: String, type: String) {

        if (mCurrentLocation == null) {
            val locationManager = requireActivity().getSystemService(Context.LOCATION_SERVICE) as LocationManager
            val location = locationManager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER)
            if (location != null) {
                mCurrentLocation = location
            }
        }
        val idDoc = if (false) { //TODO mettere a true se si vuole forzare un tag specifico
            "80033300222_1"
        } else {
            id_doc
        }

        NetworkController.INSTANCE.controllers.getCheckAsset(id_doc = idDoc, lat = mCurrentLocation?.latitude ?: 0.0, lon = mCurrentLocation?.longitude ?: 0.0, debug = DEBUG, id_tag = "", memoryBankTid = null).observeOwner(this, Observer { checkAssetResponse ->
            checkAssetResponse?.value?.let { assetItem ->
                if (assetItem.result?.isNotEmpty() == true) {

                    val item = assetItem.result.find {
                        it.id_doc == idDoc
                    }

                    mCurrentContentSingleAssetPoi = item
                    listener?.onMoveStateVisibleShowBottomSheet(true)
                    listener?.onInfoSingleTowAwayZone(assetItem, idDoc)

                } else {
                    assetItem.violation?.let {
                        if (it.isValid != true) {
                            view?.rootView?.let { it1 -> Snackbar.make(it1, it.reason, Snackbar.LENGTH_LONG).show() }
                        }
                    }
                }
            }
        })
    }

    override fun onLocationRetrieved(location: Location) {
        if (mCurrentLocation == null || mCurrentLocation?.longitude != location.longitude || mCurrentLocation?.latitude != location.latitude) {
            mCurrentLocation = location

            listener?.onLocationReal(location)

            retrieveAndDrawMyPositionOnMap()
            if (doAnimateCamera && mCurrentLocation != null) {
                doAnimateCamera = false
                retrieveCameraToMyPosition()
            }
        }
    }

    @Throws(SecurityException::class)
    fun retrieveCameraToMyPosition() {
        if (mCurrentLocation != null) {
            map.animateCamera(CameraUpdateFactory.newLatLngZoom(LatLng(mCurrentLocation?.latitude ?: 0.0, mCurrentLocation?.longitude ?: 0.0), 11f))
            listener?.onLocationReal(mCurrentLocation!!)
        } else {
            checkLocationManager()
        }
    }

    @Throws(SecurityException::class)
    private fun retrieveAndDrawMyPositionOnMap() {
        if (mCurrentLocation != null) {
            if (myMarker != null) {
                myMarker?.remove()
            }
            val markerOptions = MarkerOptions()

            mCurrentLocation?.let {
                markerOptions.position(LatLng(it.latitude, it.longitude))
                markerOptions.icon(BitmapDescriptorFactory.fromResource(R.drawable.ic_my_position))
                myMarker = map.addMarker(markerOptions)
            }
        }
    }

    fun zoom() {
        map.animateCamera(CameraUpdateFactory.zoomTo(map.cameraPosition.zoom+1))
    }


    //STATE CONNECTION - SERVER
    @UiThread
    override fun enableLoading() {
        utilViewModel?.loading?.postValue(true)
    }

    @UiThread
    override fun disableLoading() {
        utilViewModel?.loading?.postValue(false)
    }

    override fun onError(message: String) {
        println("Error: $message")
    }

    fun moveCameraToMarker(item: AssetDetail) {
        map.moveCamera(CameraUpdateFactory.newLatLngZoom(LatLng(item.dati_istanza?.indirizzo_segnale_indicatore?.location?.lat ?:41.120686, item.dati_istanza?.indirizzo_segnale_indicatore?.location?.lon ?: 16.869553), 18f))
    }
}