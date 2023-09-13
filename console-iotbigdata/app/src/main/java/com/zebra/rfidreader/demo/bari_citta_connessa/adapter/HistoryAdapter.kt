package com.zebra.rfidreader.demo.bari_citta_connessa.adapter

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.zebra.rfidreader.demo.R
import com.zebra.rfidreader.demo.bari_citta_connessa.data.AssetReporting
import com.zebra.rfidreader.demo.bari_citta_connessa.data.LastModificationObj
import com.zebra.rfidreader.demo.bari_citta_connessa.data.ReportingItem
import com.zebra.rfidreader.demo.bari_citta_connessa.utils.formattedStringDate


class HistoryAdapter(private val listHistory: MutableList<ReportingItem>) : RecyclerView.Adapter<ViewHolderHistory>() {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolderHistory {
        val view: View = LayoutInflater.from(parent.context).inflate(R.layout.card_history, parent, false)
        return ViewHolderHistory(view)
    }

    override fun getItemCount(): Int {
        return listHistory.size
    }

    override fun onBindViewHolder(holder: ViewHolderHistory, position: Int) {
        val asset: AssetReporting = listHistory[position].segnalazioni
        val datiAgente: LastModificationObj = listHistory[position].last_modification

        holder.itemView.context

        if (asset.idTag.isBlank()){
            holder.title.text = "Passo Carrabile in ${asset.indirizzo?.indirizzo}"
        } else {
            holder.title.text = "Passo Carrabile ${asset.idTag} in ${asset.indirizzo?.indirizzo}"
        }
        holder.date.text = formattedStringDate(datiAgente.data_operazione ?: "", true)
        holder.agent.text = if (datiAgente.utente.isNullOrEmpty()) "-" else "${datiAgente.utente}"
        holder.report.text = "${asset.note}"
        holder.proprietario.text = if (asset.cognome.isEmpty()) "-" else {"${asset.nome} ${asset.cognome}"}
        holder.email.text = if (asset.email.isEmpty()) "-" else "${asset.email}"
        holder.phone.text = if (asset.telefono.isEmpty()) "-" else "${asset.telefono}"
    }

    fun addItem(item: ReportingItem) {
        val index = listHistory.size
        listHistory.add(index, item)
        notifyItemInserted(index)
    }


}

class ViewHolderHistory(view: View) : RecyclerView.ViewHolder(view) {
    var title: TextView = view.findViewById(R.id.title)
    var date: TextView = view.findViewById(R.id.date_value)
    var agent: TextView = view.findViewById(R.id.agent_value)
    var report: TextView = view.findViewById(R.id.report_value)
    var proprietario: TextView = view.findViewById(R.id.proprietario_value)
    var email: TextView = view.findViewById(R.id.email_value)
    var phone: TextView = view.findViewById(R.id.phone_value)
}