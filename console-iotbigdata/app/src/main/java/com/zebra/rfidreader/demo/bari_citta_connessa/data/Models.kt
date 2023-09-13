package com.zebra.rfidreader.demo.bari_citta_connessa.data

import com.google.android.gms.maps.model.LatLng
import com.google.gson.annotations.SerializedName
import com.google.maps.android.clustering.ClusterItem
import java.io.Serializable

data class Event<T>(val value: T, private var processed: Boolean = false) {
    fun complete() {
        this.processed = true
    }

    fun isPending(): Boolean {
        return !processed
    }

    fun isConsumed(): Boolean {
        return processed
    }
}

//Start Error generic
data class Error(
    @SerializedName("errorTitle") val errorTitle: String = "",
    @SerializedName("errorMessage") val errorMessage: String = "",
    @SerializedName("errorCode") val errorCode: String = ""
) : Serializable
//End Error generic
//End Tow Away Zone

//LOGIN REQUEST
data class LoginRequest(
    @SerializedName("username") val username: String = "",
    @SerializedName("password") val password: String = ""
) : Serializable

//LOGIN RESPONSE
data class LoginResponse(
    @SerializedName("auth") val auth: Boolean = false,
    @SerializedName("token") val token: String = "",
    @SerializedName("groups") val groups: String = "",
    @SerializedName("username") val username: String = "",
    @SerializedName("userlogged") val userlogged: UserLogged? = null
) : Serializable

data class UserLogged(
    @SerializedName("cognome") val cognome: String = "",
    @SerializedName("email") val email: String = "",
    @SerializedName("group_id") val group_id: Int = -1,
    @SerializedName("lastLogin") val lastLogin: String? = "",
    @SerializedName("nome") val nome: String? = "",
    @SerializedName("username") val username: String? = "",
    @SerializedName("sesso") val sesso: String? = "",
    @SerializedName("datadinascita") val datadinascita: String? = "",
    @SerializedName("luogodinascita") val luogodinascita: String? = "",
    @SerializedName("provinciadinascita") val provinciadinascita: String? = "",
    @SerializedName("codicefiscale") val codicefiscale: String? = "",
    @SerializedName("numtel") val numtel: String? = "",
    @SerializedName("enabled") val enabled: Boolean? = false
) : Serializable

//GETPOI RESPONSE
data class GetPoiResponse(
    @SerializedName("result") val result: List<AssetType> = mutableListOf(),
    @SerializedName("error") val error: Error? = null
) : Serializable

data class AssetType(

    val type: String? = "passicarrabili",
    @SerializedName("id_doc") val id_doc: String? = null,
    @SerializedName("dati_istanza") val dati_istanza: DatiIstanza? = null
) : Serializable, ClusterItem {
    override fun getSnippet(): String? {
        return dati_istanza?.indirizzoSegnaleIndicatore?.let {
            it.indirizzo
        }
    }

    override fun getTitle(): String? {
        return dati_istanza?.indirizzoSegnaleIndicatore?.let {
            it.indirizzo
        }
    }

    override fun getPosition(): LatLng? {
        return dati_istanza?.indirizzoSegnaleIndicatore?.location?.let { LatLng(it.lat ?: 0.0, it.lon ?: 0.0) }
    }
}

data class DatiIstanza(
    @SerializedName("indirizzo_segnale_indicatore") val indirizzoSegnaleIndicatore: IndirizzoSegnaleIndicatore? = null
) : Serializable

data class AssetItem(
    @SerializedName("asset") val asset: Asset? = null,
    @SerializedName("cittadino") val cittadino: Cittadino? = null
) : Serializable

data class Asset(
    @SerializedName("matricola") var matricola: String? = "",
    @SerializedName("tipologia") var tipologia: String? = "",
    @SerializedName("location") var location: Location? = null,
    @SerializedName("formato") var formato: String? = "",
    @SerializedName("illuminazione") var illuminazione: String? = "",
    @SerializedName("colore") var colore: String? = "",
    @SerializedName("note") var note: String? = "",
    @SerializedName("indirizzo") var indirizzo: String? = "",
    @SerializedName("image") var image: String? = "",
    @SerializedName("id_tag") var id_tag: String? = "",
    @SerializedName("dataagg") var dataagg: String? = "",
    @SerializedName("isValid") var isValid: Boolean? = false,
    @SerializedName("dataoperazione") var dataoperazione: String? = "",
    @SerializedName("fabbricato") var fabbricato: Int? = -1,
    @SerializedName("idpratica") var idpratica: Double? = 0.0,
    @SerializedName("statopratica") var statopratica: Int? = -1,
    @SerializedName("numerocartello") var numerocartello: String? = "",
    @SerializedName("datacartello") var datacartello: String? = "",
    @SerializedName("type") var type: String? = null,
    @SerializedName("deviceLocation") var deviceLocation: Location? = null
) : Serializable, ClusterItem {
    override fun getSnippet(): String? {
        return indirizzo
    }

    override fun getTitle(): String? {
        return indirizzo
    }

    override fun getPosition(): LatLng? {
        return location?.let { LatLng(it.lat ?: 0.0, it.lon ?: 0.0) }
    }
}

data class Cittadino(
    @SerializedName("codicefiscale") val codicefiscale: String = "",
    @SerializedName("nome") val nome: String = "",
    @SerializedName("cognome") val cognome: String = "",
    @SerializedName("datadinascita") val datadinascita: String = "",
    @SerializedName("luogodinascita") val luogodinascita: String = "",
    @SerializedName("numtel") val numtel: String = "",
    @SerializedName("email") val email: String = ""
) : Serializable

data class Location(
    @SerializedName("lat") val lat: Double? = 0.0,
    @SerializedName("lon") val lon: Double? = 0.0
) : Serializable

data class RequestPoi(
    @SerializedName("lat") val lat: Double? = 0.0,
    @SerializedName("lon") val lon: Double? = 0.0,
    @SerializedName("distance") val distance: String = "",
    @SerializedName("isValid") val isValid: Boolean? = null
) : Serializable

data class GetReportingResponse(
    @SerializedName("result") val result: List<ReportingItem> = mutableListOf(),
    @SerializedName("error") val error: Error? = null
) : Serializable

data class GetCheckAssetRequest(
    @SerializedName("id_doc") val id_doc: String = "",
    @SerializedName("lat") val lat: Double? = 0.0,
    @SerializedName("lon") val lon: Double? = 0.0,
    @SerializedName("debug") val debug: Boolean? = false, //TODO mettere a true per demo e mettere a false per app di release
    @SerializedName("tag_rfid") val tag_rfid: String? = ""
) : Serializable

data class GetCheckAssetResponse(
    @SerializedName("result") val result: List<AssetDetail>? = null,
    @SerializedName("violation") val violation: Violation? = null,
    @SerializedName("error") val error: Error? = null,
    @SerializedName("segnalazioni") val segnalazioni: AssetReporting? = null
) : Serializable

data class RequestReporting(
    @SerializedName("result") val result: AssetDetail? = null,
    @SerializedName("segnalazioni") val segnalazioni: AssetReporting? = null,
    @SerializedName("last_modification") val last_modification: LastModificationObj? = null
) : Serializable

data class AssetDetail(
    @SerializedName("anagrafica") val anagrafica: AnagraficaObj? = null,
    @SerializedName("dati_istanza") val dati_istanza: DatiIstanzaObj? = null,
    @SerializedName("dichiarazioni_aggiuntive") val dichiarazioni_aggiuntive: DichiarazioniAggiuntiveObj? = null,
    @SerializedName("last_modification") val last_modification: LastModificationObj? = null,
    @SerializedName("stato_pratica") val stato_pratica: Int? = -1,
    @SerializedName("id_doc") val id_doc: String = "",
    @SerializedName("numero_protocollo") val numero_protocollo: String? = "",
    @SerializedName("numero_protocollo_comunicazione") val numero_protocollo_comunicazione: String? = "",
    @SerializedName("data_inserimento") val data_inserimento: String? = "",
    @SerializedName("integrazione_counter") val integrazione_counter: Int? = -1,
    @SerializedName("diniego") val diniego: Boolean = false,
    @SerializedName("proprietario_pratica") val proprietario_pratica: ProprietarioPraticaObj? = null,
    @SerializedName("parere_polizia") val parere_polizia: ParerePoliziaObj? = null,
    @SerializedName("parere_utd") val parere_utd: ParereUtdObj? = null,
    @SerializedName("determina") val determina: DeterminaObj? = null,
    @SerializedName("dovuto") val dovuto: DovutoObj? = null,
    @SerializedName("tag_rfid") val tag_rfid: String? = "Non presente",
    @SerializedName("tagMemoryBank") var tagMemoryBank: String? = "",
    @SerializedName("data_check_cartello") var data_check_cartello: String? = ""
) : Serializable

data class SearchPraticheRequest(
    @SerializedName("codice_fiscale") val codice_fiscale: String? = "",
    @SerializedName("nome") val nome: String? = "",
    @SerializedName("cognome") val cognome: String? = "",
    @SerializedName("numero_protocollo") val numero_protocollo: String? = "",
    @SerializedName("id_determina") val id_determina: String? = "",
    @SerializedName("tag_rfid") val tag_rfid: String? = "",
    @SerializedName("indirizzo") val indirizzo: String? = "",
    @SerializedName("ragione_sociale") val ragione_sociale: String? = "",
    @SerializedName("municipio_id") val municipio_id: String? = ""
) : Serializable

data class SearchPraticheResponse(
    @SerializedName("data") val data: List<AssetDetail>? = listOf()
) : Serializable

data class DataVerificaCartelloRequest(
    @SerializedName("id_doc") val id_doc: String? = ""
): Serializable

data class DataVerificaCartelloResponse(
    @SerializedName("message") val message: String? = "",
    @SerializedName("data") val data: AssetDetail? = null
): Serializable

data class DovutoObj(
    @SerializedName("iud") val iud: String? = null,
    @SerializedName("iuv") val iuv: String? = "",
    @SerializedName("cauzione_infruttifera") val cauzione_infruttifera: Int? = -1,
    @SerializedName("costo_segnale_indicatore") val costo_segnale_indicatore: Int? = -1
) : Serializable

data class AnagraficaObj(
    @SerializedName("nome") val nome: String? = null,
    @SerializedName("cognome") val cognome: String? = "",
    @SerializedName("sesso") val sesso: String? = null,
    @SerializedName("data_nascita") val data_nascita: String? = null,
    @SerializedName("luogo_nascita") val luogo_nascita: String? = null,
    @SerializedName("luogo_residenza") val luogo_residenza: String? = null,
    @SerializedName("codice_fiscale") val codice_fiscale: String? = "",
    @SerializedName("recapito_telefonico") val recapito_telefonico: String? = null,
    @SerializedName("email") val email: String? = null,
    @SerializedName("tipologia_persona") val tipologia_persona: String? = null,
    @SerializedName("ragione_sociale") val ragione_sociale: String? = null,
    @SerializedName("indirizzo_sede_legale") val indirizzo_sede_legale: String? = null,
    @SerializedName("codice_fiscale_piva") val codice_fiscale_piva: String? = null
) : Serializable

data class DatiIstanzaObj(
    @SerializedName("concessione") val concessione: String? = null,
    @SerializedName("durata_giorni_concessione") val durata_giorni_concessione: String? = null,
    @SerializedName("anni") val anni: String? = null,
    @SerializedName("mesi") val mesi: String? = null,
    @SerializedName("giorni") val giorni: String? = null,
    @SerializedName("indirizzo_segnale_indicatore") val indirizzo_segnale_indicatore: IndirizzoSegnaleIndicatore? = null,
    @SerializedName("motivazione_richiesta") val motivazione_richiesta: String? = null,
    @SerializedName("ruolo_richiedente") val ruolo_richiedente: Int? = -1,
    @SerializedName("utilizzo_locali") val utilizzo_locali: Int? = -1,
    @SerializedName("tipologia_processo") val tipologia_processo: Int? = -1,
    @SerializedName("data_scadenza_concessione") val data_scadenza_concessione: String? = null
) : Serializable

data class IndirizzoSegnaleIndicatore(
    @SerializedName("indirizzo") val indirizzo: String? = "",
    @SerializedName("location") val location: Location? = null,
    @SerializedName("municipio_id") val municipio_id: Int? = -1,
    @SerializedName("localita") val localita: String? = null
) : Serializable

data class DichiarazioniAggiuntiveObj(
    @SerializedName("accettazione_suolo_pubblico") val accettazione_suolo_pubblico: Boolean? = null,
    @SerializedName("conoscenza_spese_carico") val conoscenza_spese_carico: Boolean? = null,
    @SerializedName("locale_area") val locale_area: Int? = null,
    @SerializedName("capienza_min_veicoli") val capienza_min_veicoli: Int? = -1,
    @SerializedName("vincolo_parcheggio") val vincolo_parcheggio: Boolean? = null,
    @SerializedName("distanza_intersezione") val distanza_intersezione: Int? = -1,
    @SerializedName("larghezza") val larghezza: Int? = -1,
    @SerializedName("profondita") val profondita: Int? = -1,
    @SerializedName("titolo_autorizzativo") val titolo_autorizzativo: TitoloAutorizzativo? = TitoloAutorizzativo()
) : Serializable

data class TitoloAutorizzativo(
    @SerializedName("tipologia") val tipologia: String? = ""
) : Serializable

data class LastModificationObj(
    @SerializedName("username") val username: String? = "",
    @SerializedName("utente") val utente: String? = "",
    @SerializedName("data_operazione") val data_operazione: String? = ""
) : Serializable

data class ProprietarioPraticaObj(
    @SerializedName("username") val username: String? = "",
    @SerializedName("utente") val utente: String? = ""
) : Serializable

data class ParerePoliziaObj(
    @SerializedName("competenza") val competenza: Boolean? = null,
    @SerializedName("parere") val parere: Boolean? = null,
    @SerializedName("note") val note: String? = "",
    @SerializedName("id_blob") val id_blob: String? = ""
) : Serializable

data class ParereUtdObj(
    @SerializedName("competenza") val competenza: Boolean? = null,
    @SerializedName("parere") val parere: Boolean? = null,
    @SerializedName("note") val note: String? = "",
    @SerializedName("id_blob") val id_blob: String? = ""
) : Serializable

data class DeterminaObj(
    @SerializedName("id") val id: String? = "",
    @SerializedName("data_emissione") val data_emissione: String? = "",
    @SerializedName("id_blob") val id_blob: String? = ""
) : Serializable

data class Violation(
    @SerializedName("isValid") val isValid: Boolean? = false,
    @SerializedName("reason") val reason: String = ""
) : Serializable

data class ReportingItem(
    @SerializedName("segnalazioni") val segnalazioni: AssetReporting,
    @SerializedName("last_modification") val last_modification: LastModificationObj
) : Serializable

data class AssetReporting(
    @SerializedName("cognome") val cognome: String = "",
    @SerializedName("dataInserimento") val dataInserimento: String? = "",
    @SerializedName("email") val email: String = "",
    @SerializedName("idTag") val idTag: String = "",
    @SerializedName("indirizzo_segnale_indicatore") val indirizzo: IndirizzoSegnaleIndicatore? = null,
    @SerializedName("mobileLocation") val mobileLocation: Location? = null,
    @SerializedName("nome") val nome: String = "",
    @SerializedName("note") val note: String = "",
    @SerializedName("telefono") val telefono: String = "",
    @SerializedName("blob") val blob: String? = null,
    @SerializedName("ragione_sociale") val ragioneSociale: String? = null
) : Serializable

data class SendContentSignalationResponse(
    @SerializedName("result") val result: String = ""
)

//MODEL PER PUT DELL ADD ASSET
data class SendContentAddAssetRequest(
    @SerializedName("asset") val asset: Asset? = null
) : Serializable

data class SendContentAddAssetResponse(
    @SerializedName("result") val result: String = ""
) : Serializable

data class CivilarioObj(
    @SerializedName("result") val result: ArrayList<CivicoObj>
) : Serializable

data class CivicoObj(
    @SerializedName("id") val id: Int = -1,
    @SerializedName("numero") val numero: Int? = 1,
    @SerializedName("cod_via") val cod_via: String = "",
    @SerializedName("nome_via") val nome_via: String? = "",
    @SerializedName("esponente") val esponente: String? = "",
    @SerializedName("municipio") val municipio: String? = "",
    @SerializedName("localita") val localita: String = "",
    @SerializedName("x") val x: Double = 0.0,
    @SerializedName("y") val y: Double = 0.0,
    @SerializedName("lat") val lat: Double = 0.0,
    @SerializedName("lon") val lon: Double = 0.0
) : Serializable

data class CheckAddressRequest(
    @SerializedName("indirizzo") val indirizzo: String = "",
    @SerializedName("numero") val numero: String = "",
    @SerializedName("esponente") val esponente: String = ""
) : Serializable