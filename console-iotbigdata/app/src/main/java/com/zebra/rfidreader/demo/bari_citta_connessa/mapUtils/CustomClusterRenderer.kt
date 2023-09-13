package com.zebra.rfidreader.demo.bari_citta_connessa.mapUtils

import android.content.Context
import com.google.android.gms.maps.GoogleMap
import com.google.android.gms.maps.model.BitmapDescriptorFactory
import com.google.android.gms.maps.model.Marker
import com.google.android.gms.maps.model.MarkerOptions
import com.google.maps.android.clustering.Cluster
import com.google.maps.android.clustering.ClusterManager
import com.google.maps.android.clustering.view.DefaultClusterRenderer
import com.zebra.rfidreader.demo.R
import com.zebra.rfidreader.demo.bari_citta_connessa.data.Asset
import com.zebra.rfidreader.demo.bari_citta_connessa.data.AssetItem
import com.zebra.rfidreader.demo.bari_citta_connessa.data.AssetType
import com.zebra.rfidreader.demo.bari_citta_connessa.data.IndirizzoSegnaleIndicatore
import com.zebra.rfidreader.demo.bari_citta_connessa.utils.Utils

open class CustomClusterRenderer(mContext: Context, map: GoogleMap, clusterManager: ClusterManager<AssetType>) : DefaultClusterRenderer<AssetType>(mContext, map, clusterManager) {

    override fun onBeforeClusterItemRendered(item: AssetType?, markerOptions: MarkerOptions?) {
        val markerDescriptor = BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_ORANGE)
        markerOptions?.icon(markerDescriptor)?.snippet(item?.title)

        when (item?.type) {
            "passicarrabili" -> markerOptions?.icon(BitmapDescriptorFactory.fromResource(R.drawable.marker_carraio))
        }
        super.onBeforeClusterItemRendered(item, markerOptions)
    }

    override fun onClusterItemRendered(item: AssetType, marker: Marker) {
        marker.tag = item.id_doc
        super.onClusterItemRendered(item, marker)
    }

    override fun shouldRenderAsCluster(cluster: Cluster<AssetType>?): Boolean {
        cluster?.let{
            return it.size > 3 // if markers <=3 then not clustering
        }
        return true
    }
}