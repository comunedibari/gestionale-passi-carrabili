package com.zebra.rfidreader.demo.bari_citta_connessa.adapter

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.LinearLayout
import android.widget.TextView
import androidx.lifecycle.Observer
import com.zebra.rfidreader.demo.R
import com.zebra.rfidreader.demo.bari_citta_connessa.data.AssetDetail
import com.zebra.rfidreader.demo.bari_citta_connessa.data.DataVerificaCartelloRequest
import com.zebra.rfidreader.demo.bari_citta_connessa.network.NetworkController

data class ValidTag(
    val id: String,
    var address: String = "",
    val reason: String = "",
    var valid: Boolean,
    var assetDetail: AssetDetail?
)

class TagAdapter(private val tags: MutableList<ValidTag> = mutableListOf(), private val listenerRed: (AssetDetail?, String?) -> Unit, private val listenerGreen: (String) -> Unit) : androidx.recyclerview.widget.RecyclerView.Adapter<ViewHolderTag>() {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolderTag {
        val view: View = LayoutInflater.from(parent.context).inflate(R.layout.card_tag_revelation, parent, false)
        return ViewHolderTag(view)
    }

    override fun getItemCount(): Int {
        return tags.size
    }

    fun getItems(): MutableList<ValidTag> {
        return tags
    }

    fun updateDataList(list: List<ValidTag>) {
        tags.clear()
        tags.addAll(list.toMutableList())
        notifyDataSetChanged()
    }

    override fun onBindViewHolder(holder: ViewHolderTag, position: Int) {
        val value = tags[position]
        holder.title.text = value.id
        if (value.address != "") {
            holder.address.visibility = View.VISIBLE
            holder.address.text = value.address
        } else {
            holder.address.visibility = View.GONE
        }
        holder.subtitle.text = value.reason
        holder.isValid.isActivated = value.valid
        holder.itemView.setOnClickListener {
            if (value.valid){
                listenerGreen.invoke(value.assetDetail?.id_doc ?: "")
                /*
                NetworkController.INSTANCE.controllers.setDataVerificaCartello(DataVerificaCartelloRequest( value.assetDetail?.id_doc ?: "")).observe(, Observer {
                    if ()
                }) */
            } else {
                listenerRed.invoke(value.assetDetail, value.reason)
            }
        }
    }

    fun removeItemAll() {
        tags.clear()
        notifyDataSetChanged()
    }

    fun addItem(item: ValidTag) {
        tags.add(item)
        notifyDataSetChanged()
    }
}

class ViewHolderTag(view: View) : androidx.recyclerview.widget.RecyclerView.ViewHolder(view) {
    var title: TextView = view.findViewById(R.id.text_title_tag)
    var subtitle: TextView = view.findViewById(R.id.text_subtitle_tag)
    var address: TextView = view.findViewById(R.id.address_tag)
    var isValid: LinearLayout = view.findViewById(R.id.bool_valid_tag)
}