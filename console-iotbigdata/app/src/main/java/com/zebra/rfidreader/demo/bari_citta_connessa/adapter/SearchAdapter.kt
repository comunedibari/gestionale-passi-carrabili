package com.zebra.rfidreader.demo.bari_citta_connessa.adapter

import android.annotation.SuppressLint
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.RecyclerView
import com.zebra.rfidreader.demo.R
import com.zebra.rfidreader.demo.bari_citta_connessa.data.AssetDetail
import com.zebra.rfidreader.demo.bari_citta_connessa.utils.capitalize
import com.zebra.rfidreader.demo.bari_citta_connessa.utils.formattedStringDate
import com.zebra.rfidreader.demo.bari_citta_connessa.utils.statoPraticaPassiCarrabili
import com.zebra.rfidreader.demo.databinding.SearchResultStateLayoutBinding
import java.util.ArrayList

class SearchAdapter(private val onItemClickListener: ((view: View, item: AssetDetail) -> Unit)? = null) : RecyclerView.Adapter<SearchAdapter.SearchResultViewHolder>() {

    private var dataList = ArrayList<AssetDetail>()

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): SearchAdapter.SearchResultViewHolder {
        val binding = SearchResultStateLayoutBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return SearchResultViewHolder(binding)
    }

    override fun onBindViewHolder(holder: SearchResultViewHolder, position: Int) {
        val item = dataList[position]
        holder.bind(onItemClickListener, item)
    }

    override fun getItemCount(): Int {
        return dataList.size
    }

    fun updateDataList(list: List<AssetDetail>, isVisible: Boolean) {
        dataList.clear()
        dataList.addAll(list.toMutableList())
        if (isVisible) {
            dataList.add(0, AssetDetail())
        }
        notifyDataSetChanged()
    }

    inner class SearchResultViewHolder(val binding: SearchResultStateLayoutBinding) : RecyclerView.ViewHolder(binding.root) {
        @SuppressLint("SetTextI18n")
        fun bind(onItemClickListener: ((view: View, item: AssetDetail) -> Unit)? = null, item: AssetDetail) {
            with(binding) {
                textTitleHistory.text = item.dati_istanza?.indirizzo_segnale_indicatore?.indirizzo
                textSubtitleAgent.text = capitalize(item.anagrafica?.cognome + " " + item.anagrafica?.nome)
                textFiscalCode.text = item.anagrafica?.codice_fiscale
                textResidence.text = capitalize( item.anagrafica?.luogo_residenza ?: "-")
                textTelephoneNumber.text = item.anagrafica?.recapito_telefonico
                textEmissDate.text = formattedStringDate(item.determina?.data_emissione ?: "", false)
                textExpire.text = formattedStringDate(item.dati_istanza?.data_scadenza_concessione ?: "", false)
                textSubtitleHistory.text = statoPraticaPassiCarrabili(item.stato_pratica ?: 0)
                textIdDoc.text = item.determina?.id
                textProtocolNumber.text = item.numero_protocollo
                valueRagioneSociale?.text = item.anagrafica?.ragione_sociale ?: "-"
                valuePartitaIva?.text = item.anagrafica?.codice_fiscale_piva ?: "-"

                if (item.stato_pratica == 10) {
                    boolValidHistory.setBackgroundColor(ContextCompat.getColor(itemView.context, R.color.colorGreen))
                } else {
                    boolValidHistory.setBackgroundColor(ContextCompat.getColor(itemView.context, R.color.colorAccent))
                }

                stateCard.setOnClickListener {
                    onItemClickListener?.let {
                        it(itemView, item)
                    }
                }
            }
        }
    }
}