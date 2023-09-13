package com.zebra.rfidreader.demo.bari_citta_connessa.adapter

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import com.zebra.rfidreader.demo.R
import com.zebra.rfidreader.demo.bari_citta_connessa.data.CivicoObj


class CivilarioAdapter(private var listAddress: ArrayList<CivicoObj>, val listener: (CivicoObj) -> Unit) : androidx.recyclerview.widget.RecyclerView.Adapter<CivilarioAdapter.ViewHolderItemAddress>() {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolderItemAddress {
        val view: View = LayoutInflater.from(parent.context).inflate(R.layout.card_address, parent, false)
        return ViewHolderItemAddress(view)
    }

    override fun getItemCount(): Int {
        return listAddress.size
    }

    fun updateDataset(newList: ArrayList<CivicoObj>) {
        listAddress = newList
        notifyDataSetChanged()
    }

    override fun onBindViewHolder(holder: ViewHolderItemAddress, position: Int) {
        val civicoObj: CivicoObj = listAddress[position]

        val esponente = if (civicoObj.esponente.isNullOrBlank()) "" else "/${civicoObj.esponente}"
        holder.title.text = civicoObj.nome_via + ", " + civicoObj.numero + esponente + " (" + civicoObj.municipio + ")"

        holder.title.setOnClickListener {
            listener.invoke(civicoObj)
        }

    }

    inner class ViewHolderItemAddress(view: View) : androidx.recyclerview.widget.RecyclerView.ViewHolder(view) {
        var title: TextView = view.findViewById(R.id.text_title_address)
    }
}