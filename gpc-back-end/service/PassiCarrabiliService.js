var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var bodybuilder = require('bodybuilder');
router.use(express.json({ limit: '20mb', extended: true }));
router.use(express.urlencoded({ limit: "20mb", extended: true }));
var passiCarrabiliData = require('../dao/PassiCarrabiliData.js'); 
var formatter = require("../shared/utility/formatter.js");
var utils = require("../shared/utility/utility.js");
var statoPratica = require("../shared/enums/stato-pratica.enum.js");
var tipologiaPratica = require("../shared/enums/tipologia-pratica.enum.js");
var groupEnum = require("../shared/enums/group.enum.js");
var passaggiStatoEnum = require("../shared/enums/passaggi-stato.enum.js");
var scadenziarioEnum = require("../shared/enums/scadenziario.enum.js");
var config = require('../config.js');
var async = require("async");

function inserimentoBozzaPratica(req, res) {
  var istanza = req.body;    
  let query = null;

  if(!istanza.dati_istanza.tipologia_processo) {  
    let querybuilder = bodybuilder();

    querybuilder.query('match_phrase', 'dati_istanza.indirizzo_segnale_indicatore.indirizzo', istanza.dati_istanza.indirizzo_segnale_indicatore.indirizzo);

    if(istanza.dati_istanza.indirizzo_segnale_indicatore.location.lat && istanza.dati_istanza.indirizzo_segnale_indicatore.location.lon) {
      querybuilder.filter('geo_distance', {
        "distance": "0.1m",
        "dati_istanza.indirizzo_segnale_indicatore.location": {
            "lat": istanza.dati_istanza.indirizzo_segnale_indicatore.location.lat,
            "lon": istanza.dati_istanza.indirizzo_segnale_indicatore.location.lon
        }
      });
    }

    querybuilder.notFilter('terms', 'stato_pratica', [statoPratica.StatoPraticaPassiCarrabiliEnum.Archiviata, statoPratica.StatoPraticaPassiCarrabiliEnum.Revocata, statoPratica.StatoPraticaPassiCarrabiliEnum.Rigettata]);
    query = querybuilder.build();

    istanza.dati_istanza.tipologia_processo = istanza.dati_istanza.concessione;
  }
  
  formatter.formattazioneDatePerDB(istanza);

  if(istanza.anagrafica.codice_fiscale)
    istanza.anagrafica.codice_fiscale = istanza.anagrafica.codice_fiscale.toUpperCase();

  if(istanza.anagrafica.codice_fiscale_piva)
    istanza.anagrafica.codice_fiscale_piva = istanza.anagrafica.codice_fiscale_piva.toUpperCase();

  if(istanza.anagrafica.nome)
    istanza.anagrafica.nome = utils.capitalize(istanza.anagrafica.nome);

  if(istanza.anagrafica.cognome)
    istanza.anagrafica.cognome = utils.capitalize(istanza.anagrafica.cognome);
    
  istanza.last_modification.data_operazione = formatter.formatDateTime();
  istanza.stato_pratica = statoPratica.StatoPraticaPassiCarrabiliEnum.Bozza;

  if(!istanza.info_passaggio_stato)
    istanza.info_passaggio_stato = passaggiStatoEnum.PassaggiStatoEnum.Bozza;

  passiCarrabiliData.inserimentoBozzaPratica(req, res, istanza, query)
}

async function inserimentoPratica(req, res) {
    var istanza = req.body.istanza;   
    var emailInviata = req.body.emailInviata; 
    var isPregresso = req.body.isPregresso;

    let query = null; 

    if(!istanza.dati_istanza.tipologia_processo) { 
      let querybuilder = bodybuilder();

      querybuilder.query('match_phrase', 'dati_istanza.indirizzo_segnale_indicatore.indirizzo', istanza.dati_istanza.indirizzo_segnale_indicatore.indirizzo);

      if(istanza.dati_istanza.indirizzo_segnale_indicatore.location.lat && istanza.dati_istanza.indirizzo_segnale_indicatore.location.lon) {
        querybuilder.filter('geo_distance', {
          "distance": "0.1m",
          "dati_istanza.indirizzo_segnale_indicatore.location": {
              "lat": istanza.dati_istanza.indirizzo_segnale_indicatore.location.lat,
              "lon": istanza.dati_istanza.indirizzo_segnale_indicatore.location.lon
          }
        });
      }

      querybuilder.notFilter('terms', 'stato_pratica', [statoPratica.StatoPraticaPassiCarrabiliEnum.Archiviata, statoPratica.StatoPraticaPassiCarrabiliEnum.Revocata, statoPratica.StatoPraticaPassiCarrabiliEnum.Rigettata]);
      query = querybuilder.build();

      istanza.dati_istanza.tipologia_processo = istanza.dati_istanza.concessione;
    }

    if(!istanza.id_doc) {
      if(istanza.anagrafica.codice_fiscale)
        istanza.anagrafica.codice_fiscale = istanza.anagrafica.codice_fiscale.toUpperCase();

      if(istanza.anagrafica.codice_fiscale_piva)
        istanza.anagrafica.codice_fiscale_piva = istanza.anagrafica.codice_fiscale_piva.toUpperCase();

      if(istanza.anagrafica.nome)
        istanza.anagrafica.nome = utils.capitalize(istanza.anagrafica.nome);

      if(istanza.anagrafica.cognome)
        istanza.anagrafica.cognome = utils.capitalize(istanza.anagrafica.cognome);
    }

    formatter.formattazioneDatePerDB(istanza); 
    istanza.data_inserimento = formatter.formatDateTime(istanza.data_inserimento ? istanza.data_inserimento : undefined, true);
    istanza.integrazione_counter = 0;
    istanza.diniego = false; 
    istanza.last_modification.data_operazione = formatter.formatDateTime();

    if(!isPregresso) {
      switch (istanza.dati_istanza.tipologia_processo) {
        case tipologiaPratica.TipologiaPraticaEnum.Proroga:
          if(!istanza.info_passaggio_stato)
            istanza.info_passaggio_stato = passaggiStatoEnum.PassaggiStatoEnum.ProrogaToVerificaFormale;

          istanza.data_scadenza_procedimento = utils.getDataScadenzaPratica(undefined, 30);
          istanza.stato_pratica = statoPratica.StatoPraticaPassiCarrabiliEnum['Verifica formale'];
          break;
        case tipologiaPratica.TipologiaPraticaEnum.Revoca:
        case tipologiaPratica.TipologiaPraticaEnum.Decadenza:
            if(!istanza.info_passaggio_stato)
              istanza.info_passaggio_stato = passaggiStatoEnum.PassaggiStatoEnum.BozzaToInserita;

            istanza.data_scadenza_procedimento = utils.getDataScadenzaPratica(undefined, 30);
            istanza.stato_pratica = statoPratica.StatoPraticaPassiCarrabiliEnum.Inserita;
            break;
        default:
          if(!istanza.info_passaggio_stato)
              istanza.info_passaggio_stato = passaggiStatoEnum.PassaggiStatoEnum.BozzaToInserita;

          istanza.data_scadenza_procedimento = utils.getDataScadenzaPratica();
          istanza.stato_pratica = statoPratica.StatoPraticaPassiCarrabiliEnum.Inserita;
          break;
      }
    }
    else {
      if(!istanza.info_passaggio_stato)
        istanza.info_passaggio_stato = passaggiStatoEnum.PassaggiStatoEnum.StoricoToConcessioneValida;
      
        istanza.stato_pratica = statoPratica.StatoPraticaPassiCarrabiliEnum['Concessione valida'];
    }

    passiCarrabiliData.inserimentoPratica(req, res, istanza, query, emailInviata);
}

function aggiornaPratica(req, res) {
  var istanza = req.body.istanza;   
  var emailInviata = req.body.emailInviata; 
  var statoIntegrazione = req.body.statoIntegrazione;
  var storicizza_pratica = req.body.storicizza_pratica;

  formatter.formattazioneDatePerDB(istanza);
  istanza.last_modification.data_operazione = formatter.formatDateTime();

  if(statoIntegrazione && !emailInviata) {
    switch (statoIntegrazione) {
      case statoPratica.StatoPraticaPassiCarrabiliEnum['Necessaria integrazione']:
        istanza.info_passaggio_stato = passaggiStatoEnum.PassaggiStatoEnum.NecessariaIntegrazioneToVerificaFormale;
        break;
      case statoPratica.StatoPraticaPassiCarrabiliEnum['Preavviso diniego']:
        istanza.info_passaggio_stato = passaggiStatoEnum.PassaggiStatoEnum.PreavvisoDiniegoToVerificaFormale;
        break;
      case statoPratica.StatoPraticaPassiCarrabiliEnum['Attesa di pagamento']:
        istanza.info_passaggio_stato = passaggiStatoEnum.PassaggiStatoEnum.AttesaDiPagamentoToAttesaDiPagamento;
        break;
      case statoPratica.StatoPraticaPassiCarrabiliEnum['Richiesta lavori']:
        istanza.info_passaggio_stato = passaggiStatoEnum.PassaggiStatoEnum.RichiestaLavoriToVerificaFormale;
        break;
      case statoPratica.StatoPraticaPassiCarrabiliEnum['Attesa fine lavori']:
        istanza.info_passaggio_stato = passaggiStatoEnum.PassaggiStatoEnum.AttesaFineLavoriToVerificaFormale;
        break;
    }
  }

  passiCarrabiliData.aggiornaPratica(req, res, istanza, emailInviata, statoIntegrazione, storicizza_pratica);
}

function eliminaPratica(req, res) {
  let id = req.params.id_doc;
  passiCarrabiliData.eliminaPratica(req, res, id)
}

function praticheCittadino(req, res) {
  var objSearch = req.body;

  let querybuilder = bodybuilder();
  
  if (objSearch.codice_fiscale)
    querybuilder.filter('bool', b => 
            b.orFilter('regexp', 'anagrafica.codice_fiscale', `.*${objSearch.codice_fiscale.toLocaleLowerCase()}.*`)
            .orFilter('regexp', 'anagrafica.codice_fiscale_piva', `.*${objSearch.codice_fiscale.toLocaleLowerCase()}.*`));
  
  if (objSearch.nome)
    querybuilder.filter('regexp', 'anagrafica.nome', `.*${objSearch.nome.toLocaleLowerCase()}.*`);
    // querybuilder.filter('match', 'anagrafica.nome', objSearch.nome.toLocaleLowerCase());
  
  if (objSearch.cognome)
    querybuilder.filter('regexp', 'anagrafica.cognome', `.*${objSearch.cognome.toLocaleLowerCase()}.*`);
    // querybuilder.filter('match', 'anagrafica.cognome', objSearch.cognome.toLocaleLowerCase());

  if (objSearch.numero_protocollo)
    // querybuilder.filter('regexp', 'numero_protocollo', `.*${objSearch.numero_protocollo.toLocaleLowerCase()}.*`);
    // querybuilder.filter('match_phrase', 'numero_protocollo', objSearch.numero_protocollo.toLocaleLowerCase());
    querybuilder.filter('bool', b => 
            b.orFilter('regexp', 'numero_protocollo', `.*${objSearch.numero_protocollo.toLocaleLowerCase()}.*`)
            .orFilter('regexp', 'numero_protocollo_comunicazione', `.*${objSearch.numero_protocollo.toLocaleLowerCase()}.*`));

  if (objSearch.id_determina) 
    querybuilder.filter('regexp', 'determina.id', `.*${objSearch.id_determina.toLocaleLowerCase()}.*`);
    // querybuilder.filter('match_phrase', 'determina.id', objSearch.id_determina.toLocaleLowerCase());
  
  if (objSearch.tag_rfid) 
    querybuilder.filter('regexp', 'tag_rfid', `.*${objSearch.tag_rfid.toLocaleLowerCase()}.*`);
    // querybuilder.filter('match_phrase', 'tag_rfid', objSearch.tag_rfid.toLocaleLowerCase());
  
  if (objSearch.ragione_sociale)
    querybuilder.filter('regexp', 'anagrafica.ragione_sociale', `.*${objSearch.ragione_sociale.toLocaleLowerCase()}.*`);
    // querybuilder.filter('match', 'anagrafica.ragione_sociale', objSearch.ragione_sociale.toLocaleLowerCase());

  if (objSearch.indirizzo)
    querybuilder.query('match_phrase', 'dati_istanza.indirizzo_segnale_indicatore.indirizzo', objSearch.indirizzo.toLocaleLowerCase());

  if (objSearch.indirizzo_segnale_indicatore)
    // querybuilder.query('match_phrase', 'dati_istanza.indirizzo_segnale_indicatore.indirizzo', objSearch.indirizzo_segnale_indicatore.indirizzo.toLocaleLowerCase());
    querybuilder.filter('bool', b => 
      b.orFilter('match_phrase', 'dati_istanza.indirizzo_segnale_indicatore.indirizzo', objSearch.indirizzo_segnale_indicatore.indirizzo.toLocaleLowerCase())
      .orFilter('geo_distance', {
        "distance": "0.1m",
        "dati_istanza.indirizzo_segnale_indicatore.location": {
            "lat": objSearch.indirizzo_segnale_indicatore.location.lat,
            "lon": objSearch.indirizzo_segnale_indicatore.location.lon
        }
      }));
  
  if (objSearch.stato_pratica || objSearch.stato_pratica == 0)
    querybuilder.filter('term', 'stato_pratica', objSearch.stato_pratica);

  if (objSearch.tipologia_processo)
    querybuilder.filter('term', 'dati_istanza.tipologia_processo', objSearch.tipologia_processo);

  if (objSearch.municipio_id)
    querybuilder.filter('term', 'dati_istanza.indirizzo_segnale_indicatore.municipio_id', objSearch.municipio_id);
  
  let query = querybuilder.build();

  passiCarrabiliData.praticheCittadino(req, res, query);
}

function storicoPratica(req, res) {
    var idpratica = req.params.idpratica;
    passiCarrabiliData.storicoPratica(req, res, idpratica);
}

function cercaPratica(req, res) {
  var id = req.params.id;
  passiCarrabiliData.cercaPratica(req, res, id);
}

function cercaPraticaDaNumProtocollo(req, res) {
  var numero_protocollo = req.params.numero_protocollo;
  passiCarrabiliData.cercaPraticaDaNumProtocollo(req, res, numero_protocollo);
}

function documentiPratica(req, res) {
  var idpratica = req.params.idpratica;
  passiCarrabiliData.documentiPratica(req, res, idpratica);
}

function getDocumento(req, res) {
  var id_doc = req.params.id_doc;
  passiCarrabiliData.getDocumento(req, res, id_doc);
}

function uploadDocument(req, res) {
  var documento = req.body;
  documento.last_modification.data_operazione = formatter.formatDateTime();
  passiCarrabiliData.uploadDocument(req, res, documento)
}

function assegnaProtocolloDocumento(req, res) {
  var documento = req.body;
  passiCarrabiliData.assegnaProtocolloDocumento(req, res, documento)
}

function deleteDocument(req, res) {
  passiCarrabiliData.deleteDocument(req, res, req.params.id)
}

function cercaPratichePerStatoPratica(req, res) {
  let statoPratica = req.params.statoPratica.split(',');
  let municipio_id = req.params.municipio_id;
  let group_id = req.params.group_id;

  let querybuilder = bodybuilder().filter('terms', 'stato_pratica', statoPratica);

  if (municipio_id != 'null')
    querybuilder.filter('term', 'dati_istanza.indirizzo_segnale_indicatore.municipio_id', municipio_id);

  if (group_id != 'null') {
    switch (parseInt(group_id)) {
      case groupEnum.GroupEnum.PoliziaLocale:
        querybuilder.filter('exists', 'field', 'parere_polizia');
        querybuilder.notFilter('exists', 'field', 'parere_polizia.competenza')
        break;
      case groupEnum.GroupEnum.UfficioTecnicoDecentrato:
        querybuilder.filter('exists', 'field', 'parere_utd');
        querybuilder.notFilter('exists', 'field', 'parere_utd.competenza')
        break;
      case groupEnum.GroupEnum.RipartizioneUrbanistica:
        querybuilder.filter('exists', 'field', 'parere_urbanistica');
        querybuilder.notFilter('exists', 'field', 'parere_urbanistica.competenza')
        break;
    }
  }

  let query = querybuilder.build();

  passiCarrabiliData.cercaPratichePerStatoPratica(req, res, query);
}

function updateValidityDocument(req, res) {
  var obj = req.body;
  obj.dataoperazione = formatter.formatDateTime();
  passiCarrabiliData.updateValidityDocument(req, res, obj)
}

function resetValidityDocument(req, res) {
  var obj = req.body;
  obj.dataoperazione = formatter.formatDateTime();
  passiCarrabiliData.resetValidityDocument(req, res, obj)
}

function controlloPraticheScadute(req, res) {
  var currDate = formatter.formatDateTime();

  let querybuilder = bodybuilder();

  querybuilder.query('term', 'cittadino.codicefiscale', req.params.codicefiscale.toLowerCase());
  querybuilder.notFilter('term', 'asset.pratica_chiusa', true);
  querybuilder.notFilter('terms', 'asset.statopratica', [statoPratica.StatoPraticaPassiCarrabiliEnum.Conclusa, statoPratica.StatoPraticaPassiCarrabiliEnum.Annullata, statoPratica.StatoPraticaPassiCarrabiliEnum["Concessione terminata"]]);
  querybuilder.andQuery('bool', a => 
    a.orQuery('range', 'asset.data_scadenza_integrazione', { "lt": "now/d" })
      .orQuery('bool', b => 
        b.andQuery('range', 'asset.data_scadenza_pratica', { "lt": "now/d" })
          .andQuery('bool', c => 
            c.notQuery('exists', 'field', 'asset.data_scadenza_integrazione'))
          )         
  );

  let query = querybuilder.build();

  passiCarrabiliData.controlloPraticheScadute(req, res, query, currDate)
}

function praticaCittadino(req, res) {
  var numProtocollo = req.params.numProtocollo;
  passiCarrabiliData.praticaCittadino(req, res, numProtocollo);
}

function controlloPraticheTerminate(req, res) {
  var currDate = formatter.formatDateTime();

  let querybuilder = bodybuilder();
  querybuilder.query('term', 'cittadino.codicefiscale', req.params.codicefiscale.toLowerCase()); 
  querybuilder.notFilter('term', 'asset.pratica_chiusa', true);
  querybuilder.notFilter('terms', 'asset.statopratica', [statoPratica.StatoPraticaPassiCarrabiliEnum.Annullata, statoPratica.StatoPraticaPassiCarrabiliEnum["Concessione terminata"]]);
  querybuilder.andQuery("range", "asset.data_scadenza_concessione", { "lt": "now/d" });          
  let query = querybuilder.build();

  passiCarrabiliData.controlloPraticheTerminate(req, res, query, currDate)
}

function cercaIstruttoriMunicipio(req, res) {
  let municipio_id = req.params.municipio_id;

  let querybuilder = bodybuilder().filter('term', 'municipio_id', municipio_id);
  querybuilder.filter('term', 'group_id', groupEnum.GroupEnum.IstruttoreMunicipio);
  let query = querybuilder.build();

  passiCarrabiliData.cercaIstruttoriMunicipio(req, res, query);
}

function getNumeroProtocollo(req, res) {
  var data = req.body;  
  let numeroProtocollo = utils.getNumeroProtocolloPubblico();
  res.status(200).send({ numeroProtocollo: numeroProtocollo, anno: formatter.getLocalYear(), dataProtocollo: formatter.formatDateTime() });
}

function archiviaPraticaOriginaria(req, res) {
  var istanza = req.body; 
  passiCarrabiliData.archiviaPraticaOriginaria(req, res, istanza);
}

function revocaPraticaOriginaria(req, res) {
  var istanza = req.body; 
  passiCarrabiliData.revocaPraticaOriginaria(req, res, istanza);
}

function cercaSegnalazioniRegolarizzazione(req, res) {
  let municipio_id = req.params.municipio_id;

  let querybuilder = bodybuilder();
  if (municipio_id != 'null')
    querybuilder.query('term', 'indirizzo_segnale_indicatore.municipio_id', municipio_id);
  let query = querybuilder.build();

  passiCarrabiliData.cercaSegnalazioniRegolarizzazione(req, res, query);
}

function inserimentoSegnalazioniRegolarizzazione(req, res) {
  var istanza = req.body;    

  if(istanza.nome)
    istanza.nome = utils.capitalize(istanza.nome);

  if(istanza.cognome)
    istanza.cognome = utils.capitalize(istanza.cognome);

  istanza.last_modification.data_operazione = formatter.formatDateTime();
  passiCarrabiliData.inserimentoSegnalazioniRegolarizzazione(req, res, istanza)
}

function getRelazioneServizioRegolarizzazione(req, res) {
  var id_doc = req.params.id_doc;
  passiCarrabiliData.getRelazioneServizioRegolarizzazione(req, res, id_doc);
}

function notificaRegolarizzazioneInviata(req, res) {
  var id_doc = req.params.id_doc;
  let data_scadenza_regolarizzazione = utils.getDataScadenzaPratica(undefined, 30);
  passiCarrabiliData.notificaRegolarizzazioneInviata(req, res, id_doc, data_scadenza_regolarizzazione);
}

function disattivaNotificaScadenziarioRegolarizzazione(req, res) {
  var id_doc = req.params.id_doc;
  passiCarrabiliData.disattivaNotificaScadenziarioRegolarizzazione(req, res, id_doc);
}

function pregressoPratiche(req, res) {
  passiCarrabiliData.pregressoPratiche(req, res);
}

function setPraticaControllataPregresso(req, res) {
  var istanza = req.body; 
  passiCarrabiliData.setPraticaControllataPregresso(req, res, istanza);
}

function ripristinaPraticaPregresso(req, res) {
  var istanza = req.body; 

  let querybuilder = bodybuilder();
  querybuilder.query('match_phrase', 'id_doc', istanza.id_doc);        
  let query = querybuilder.build();

  passiCarrabiliData.ripristinaPraticaPregresso(req, res, query);
}

/* ****************** SCADENZIARIO ****************** */

function cercaNotificheScadenziario(req, res) {
  let municipio_id = req.params.municipio_id;
  let group_id = req.params.group_id;

  let querybuilder = bodybuilder();

  if (municipio_id != 'null')
    querybuilder.filter('term', 'municipio_id', municipio_id);

  switch (parseInt(group_id)) {
    case groupEnum.GroupEnum.PoliziaLocale:
      querybuilder.andQuery('term', 'risposta_pareri.polizia', false);
      querybuilder.andQuery('terms', 'stato_pratica', [statoPratica.StatoPraticaPassiCarrabiliEnum.Inserita, statoPratica.StatoPraticaPassiCarrabiliEnum['Richiesta pareri']]);
      break;
    case groupEnum.GroupEnum.UfficioTecnicoDecentrato:
      querybuilder.filter('term', 'stato_pratica', statoPratica.StatoPraticaPassiCarrabiliEnum['Richiesta pareri']);
      querybuilder.filter('term', 'risposta_pareri.utd', false);
      break;
    case groupEnum.GroupEnum.RipartizioneUrbanistica:
      querybuilder.filter('term', 'stato_pratica', statoPratica.StatoPraticaPassiCarrabiliEnum['Richiesta pareri']);
      querybuilder.filter('term', 'risposta_pareri.urbanistica', false);
      break;
  }

  let query = querybuilder.build();

  passiCarrabiliData.cercaNotificheScadenziario(req, res, query);
}

async function startScadenziario(req, res) {
  console.log(`Avvio esecuzione scadenziario - ${formatter.formatDateTime()}`);

  await resetScadenziario(req, res);

  //controllo scadenze

  await getConcessioniScaduteOInScadenza(req, res, scadenziarioEnum.ScadenziarioEnum['Concessione scaduta']);
  await getConcessioniScaduteOInScadenza(req, res, scadenziarioEnum.ScadenziarioEnum['Tempi procedimentali scaduti']);
  await getConcessioniScaduteOInScadenza(req, res, scadenziarioEnum.ScadenziarioEnum['Scadenza tempistiche integrazione']);
  await getConcessioniScaduteOInScadenza(req, res, scadenziarioEnum.ScadenziarioEnum['Scadenza tempistiche diniego']);
  await getConcessioniScaduteOInScadenza(req, res, scadenziarioEnum.ScadenziarioEnum['Scadenza tempistiche restituzione segnale indicatore']);
  await getConcessioniScaduteOInScadenza(req, res, scadenziarioEnum.ScadenziarioEnum['Scadenza tempistiche fine lavoli']);
  await getConcessioniScaduteOInScadenza(req, res, scadenziarioEnum.ScadenziarioEnum['Scadenza tempistiche inizio lavori']);
  await getConcessioniScaduteOInScadenza(req, res, scadenziarioEnum.ScadenziarioEnum['Scadenza tempistiche notifica decadenza']);
  await getConcessioniScaduteOInScadenza(req, res, scadenziarioEnum.ScadenziarioEnum['Scadenza tempistiche pagamento']);

  //notifiche avvicinamento scadenza

  await getConcessioniScaduteOInScadenza(req, res, scadenziarioEnum.ScadenziarioEnum['Concessione temporanea in scadenza']);
  await getConcessioniScaduteOInScadenza(req, res, scadenziarioEnum.ScadenziarioEnum['Concessione permanente in scadenza']);
  await getConcessioniScaduteOInScadenza(req, res, scadenziarioEnum.ScadenziarioEnum['Tempi procedimentali in scadenza']);

  //Regolarizzazione

  await getSegnalazioniRegolarizzazioneScadute(req, res, scadenziarioEnum.ScadenziarioEnum['Scadenza tempistiche regolarizzazione']);

  console.log(`Fine esecuzione scadenziario - ${formatter.formatDateTime()}`);
  res.status(200).send({message: 'Fine esecuzione scadenziario'});
}

async function resetScadenziario(req, res) {
  let querybuilder = bodybuilder();
  querybuilder.query('match_all', {});
  let query = querybuilder.build();
  await passiCarrabiliData.resetScadenziario(query)
      .then(resp => {})
      .catch(err => {
        res.status(err.status).send({ err: err, message: "Errore di sistema" });
        process.exit();
      });        
}

async function inserisciNotificaScadenziario(pratica, type) {
  //preparazione notifica
  let body = {};

  if(type == scadenziarioEnum.ScadenziarioEnum['Scadenza tempistiche regolarizzazione']) {
    body = {
      id_doc: pratica.id_doc,
      municipio_id: pratica.indirizzo_segnale_indicatore.municipio_id,
      codice_fiscale: '',
      numero_protocollo: pratica.numero_protocollo,
      indirizzo: pratica.indirizzo_segnale_indicatore.indirizzo,	
      stato_pratica: statoPratica.StatoPraticaPassiCarrabiliEnum.Inserita,
      proprietario_pratica: pratica.last_modification.utente,
      risposta_pareri: {
        polizia: false,
        utd: true,
        urbanistica: true
      },		
      info: type,
      data_operazione: formatter.formatDateTime()
    };
  }
  else {
    let polizia = pratica.parere_polizia ? 
                  (pratica.parere_polizia.competenza != null && pratica.parere_polizia.competenza != undefined ? true : false) 
                  : true;
    let utd = pratica.parere_utd 
                ? (pratica.parere_utd.competenza != null && pratica.parere_utd.competenza != undefined ? true : false) 
                : true;
    let urbanistica = pratica.parere_urbanistica 
                        ? (pratica.parere_urbanistica.competenza != null && pratica.parere_urbanistica.competenza != undefined ? true : false) 
                        : true;

    body = {
      id_doc: pratica.id_doc,
      municipio_id: pratica.dati_istanza.indirizzo_segnale_indicatore.municipio_id,
      codice_fiscale: pratica.anagrafica.codice_fiscale,
      numero_protocollo: pratica.numero_protocollo,
      indirizzo: pratica.dati_istanza.indirizzo_segnale_indicatore.indirizzo,	
      stato_pratica: pratica.stato_pratica,
      proprietario_pratica: pratica?.proprietario_pratica?.utente,
      risposta_pareri: {
        polizia: polizia,
        utd: utd,
        urbanistica: urbanistica
      },		
      // info: scadenziarioEnum.ScadenziarioEnum[type],
      info: type,
      data_operazione: formatter.formatDateTime()
    };
  }

  await passiCarrabiliData.inserisciNotificaScadenziario(body)
      .then(resp => {})
      .catch(err => {
        res.status(err.status).send({ err: err, message: "Errore di sistema" });
        process.exit();
      });        
}

async function archiviaPratica(pratica) {
  await passiCarrabiliData.cambioStatoPraticaDaScadenziario(pratica, statoPratica.StatoPraticaPassiCarrabiliEnum.Archiviata)
      .then(resp => {})
      .catch(err => {
        res.status(err.status).send({ err: err, message: "Errore di sistema" });
        process.exit();
      });        
}

async function rigettaPratica(pratica) {
  await passiCarrabiliData.cambioStatoPraticaDaScadenziario(pratica, statoPratica.StatoPraticaPassiCarrabiliEnum['Pratica da rigettare'])
      .then(resp => {})
      .catch(err => {
        res.status(err.status).send({ err: err, message: "Errore di sistema" });
        process.exit();
      });        
}

async function revocaPratica(pratica) {
  await passiCarrabiliData.cambioStatoPraticaDaScadenziario(pratica, statoPratica.StatoPraticaPassiCarrabiliEnum['Pratica da revocare'])
      .then(resp => {})
      .catch(err => {
        res.status(err.status).send({ err: err, message: "Errore di sistema" });
        process.exit();
      });        
}

async function getConcessioniScaduteOInScadenza(req, res, type) {
  let querybuilder = bodybuilder();
  querybuilder.notQuery('terms', 'stato_pratica', [statoPratica.StatoPraticaPassiCarrabiliEnum.Archiviata, statoPratica.StatoPraticaPassiCarrabiliEnum.Revocata, statoPratica.StatoPraticaPassiCarrabiliEnum.Rigettata]);
  
  let dataLimite = '';

  switch (type) {
    case scadenziarioEnum.ScadenziarioEnum['Concessione scaduta']:
      querybuilder.andQuery("range", "dati_istanza.data_scadenza_concessione", { "lt": "now/d" });    
      break;
    case scadenziarioEnum.ScadenziarioEnum['Tempi procedimentali scaduti']:
        querybuilder.andQuery('bool', a =>    
          a.andQuery('range', 'data_scadenza_procedimento', { "lt": "now/d" })
          .andQuery('bool', b => 
            b.notQuery('exists', 'field', 'data_scadenza_integrazione')
            .notQuery('exists', 'field', 'data_scadenza_diniego'))
          );
      break;
    case scadenziarioEnum.ScadenziarioEnum['Scadenza tempistiche integrazione']:
      querybuilder.andQuery("range", "data_scadenza_integrazione", { "lt": "now/d" });    
      break;
    case scadenziarioEnum.ScadenziarioEnum['Scadenza tempistiche diniego']:
      querybuilder.andQuery("range", "data_scadenza_diniego", { "lt": "now/d" });  
      break;
    case scadenziarioEnum.ScadenziarioEnum['Scadenza tempistiche restituzione segnale indicatore']:
      querybuilder.andQuery("range", "data_scadenza_restituzione", { "lt": "now/d" });  
      break;
    case scadenziarioEnum.ScadenziarioEnum['Scadenza tempistiche fine lavoli']:
      querybuilder.andQuery("range", "data_scadenza_fine_lavori", { "lt": "now/d" });  
      break;
    case scadenziarioEnum.ScadenziarioEnum['Scadenza tempistiche inizio lavori']:
      querybuilder.andQuery("range", "data_scadenza_inizio_lavori", { "lt": "now/d" });  
      break;
    case scadenziarioEnum.ScadenziarioEnum['Scadenza tempistiche notifica decadenza']:
      querybuilder.andQuery("range", "data_scadenza_notifica_decadenza", { "lt": "now/d" });  
      break;
    case scadenziarioEnum.ScadenziarioEnum['Scadenza tempistiche pagamento']:
      querybuilder.andQuery("range", "data_scadenza_pagamento", { "lt": "now/d" });  
      break;
    case scadenziarioEnum.ScadenziarioEnum['Concessione temporanea in scadenza']:
      dataLimite = utils.getNotificaAvvicinamentoScadenza(20);
      querybuilder.andQuery("range", "dati_istanza.data_scadenza_concessione", { "lt": dataLimite });  
      querybuilder.andQuery("term", "dati_istanza.concessione", tipologiaPratica.TipologiaPraticaEnum['Concessione Temporanea']);
      break;
    case scadenziarioEnum.ScadenziarioEnum['Concessione permanente in scadenza']:
      dataLimite = utils.getNotificaAvvicinamentoScadenza(120);
      querybuilder.andQuery("range", "dati_istanza.data_scadenza_concessione", { "lt": dataLimite });  
      querybuilder.andQuery("term", "dati_istanza.concessione", tipologiaPratica.TipologiaPraticaEnum['Concessione Permanente']);
      break;
    case scadenziarioEnum.ScadenziarioEnum['Tempi procedimentali in scadenza']:
      dataLimite = utils.getNotificaAvvicinamentoScadenza(15);
      querybuilder.andQuery('bool', a =>    
          a.andQuery('range', 'data_scadenza_procedimento', { "lt": dataLimite })
          .andQuery('bool', b => 
            b.notQuery('exists', 'field', 'data_scadenza_integrazione')
            .notQuery('exists', 'field', 'data_scadenza_diniego'))
          );
      break;
  }

  let query = querybuilder.build();

  await passiCarrabiliData.getConcessioniScaduteOInScadenza(query)
    .then(async (data) => {
      for(pratica of data) {
        switch (type) {
          case scadenziarioEnum.ScadenziarioEnum['Concessione scaduta']:
          // case scadenziarioEnum.ScadenziarioEnum['Scadenza tempistiche integrazione']:
              await archiviaPratica(pratica);
            break;
          case scadenziarioEnum.ScadenziarioEnum['Scadenza tempistiche diniego']:
            await rigettaPratica(pratica);
            break;
          case scadenziarioEnum.ScadenziarioEnum['Scadenza tempistiche inizio lavori']:
            await revocaPratica(pratica);
            break;
        }
        await inserisciNotificaScadenziario(pratica, type);
      }
    })
    .catch(err => {
      res.status(err.status).send({ err: err, message: "Errore di sistema" });
      process.exit();
    });        
}

function eliminaPraticaDaScadenziario(req, res) {
  var id = req.params.id;
  passiCarrabiliData.eliminaPraticaDaScadenziario(req, res, id);
}

async function getSegnalazioniRegolarizzazioneScadute(req, res, type) {
  let querybuilder = bodybuilder();
  querybuilder.andQuery('term', 'regolarizzazione_notificata', true);
  querybuilder.andQuery('term', 'notifiche_attive', true);
  querybuilder.andQuery("range", "data_scadenza_regolarizzazione", { "lt": "now/d" }); 
  let query = querybuilder.build();

  await passiCarrabiliData.getSegnalazioniRegolarizzazioneScadute(query)
    .then(async (data) => {
      for(pratica of data) {
        await inserisciNotificaScadenziario(pratica, type);
      }
    })
    .catch(err => {
      res.status(err.status).send({ err: err, message: "Errore di sistema" });
      process.exit();
    });        
}

function getPraticheSenzaTagRFID(req, res) {
  let municipio_id = req.params.municipio_id;

  let querybuilder = bodybuilder();

  querybuilder.query('term', 'stato_pratica', statoPratica.StatoPraticaPassiCarrabiliEnum['Concessione valida']);
  querybuilder.notQuery('term', 'dati_istanza.tipologia_processo', tipologiaPratica.TipologiaPraticaEnum.Proroga);
  querybuilder.notQuery('exists', 'field', 'tag_rfid');

  if (municipio_id != 'null')
    querybuilder.filter('term', 'dati_istanza.indirizzo_segnale_indicatore.municipio_id', municipio_id);

  let query = querybuilder.build();

  passiCarrabiliData.getPraticheSenzaTagRFID(req, res, query);
}

function praticheAvviabiliPostConcessione(req, res) {
  var objSearch = req.body;
  
  let querybuilder = bodybuilder().query('term', 'stato_pratica', statoPratica.StatoPraticaPassiCarrabiliEnum['Concessione valida']);

  querybuilder.notQuery('exists', 'field', 'is_pratica_pregresso');

  if (objSearch.tipologia_processo != tipologiaPratica.TipologiaPraticaEnum['Trasferimento titolarità'])
    querybuilder.andQuery('match', 'anagrafica.codice_fiscale', objSearch.codice_fiscale.toLocaleLowerCase());
  
  if (objSearch.codice_fiscale_piva)
    querybuilder.andQuery('match', 'anagrafica.codice_fiscale_piva', objSearch.codice_fiscale_piva.toLocaleLowerCase());

  if (objSearch.numero_protocollo)
    querybuilder.andQuery('match', 'numero_protocollo', objSearch.numero_protocollo.toLocaleLowerCase());

  if (objSearch.id_determina) 
    querybuilder.andQuery('match', 'determina.id', objSearch.id_determina.toLocaleLowerCase());
  
  if (objSearch.tag_rfid) 
    querybuilder.andQuery('match', 'tag_rfid', objSearch.tag_rfid.toLocaleLowerCase());

  switch (objSearch.tipologia_processo) {
    case tipologiaPratica.TipologiaPraticaEnum.Rinuncia :
      dataLimite = utils.getNotificaAvvicinamentoScadenza(90);
      querybuilder.andQuery("range", "dati_istanza.data_scadenza_concessione", { "lt": dataLimite });
      break;
    case tipologiaPratica.TipologiaPraticaEnum.Rinnovo :
      dataLimite = utils.getNotificaAvvicinamentoScadenza(90);
      querybuilder.andQuery("range", "dati_istanza.data_scadenza_concessione", { "lt": dataLimite });  
      querybuilder.andQuery("term", "dati_istanza.concessione", tipologiaPratica.TipologiaPraticaEnum['Concessione Permanente']);
      break;
    case tipologiaPratica.TipologiaPraticaEnum.Proroga :
      dataLimite = utils.getNotificaAvvicinamentoScadenza(15);
      querybuilder.andQuery("range", "dati_istanza.data_scadenza_concessione", { "lt": dataLimite });  
      querybuilder.andQuery("term", "dati_istanza.concessione", tipologiaPratica.TipologiaPraticaEnum['Concessione Temporanea']);
      querybuilder.andQuery("range", "dati_istanza.durata_giorni_concessione", { "lt": 365 });
      break;
    case tipologiaPratica.TipologiaPraticaEnum['Regolarizzazione furto/deterioramento'] :
      dataLimite = utils.getNotificaAvvicinamentoScadenza(90);
      querybuilder.andQuery("range", "dati_istanza.data_scadenza_concessione", { "lt": dataLimite });  
      break;
    case tipologiaPratica.TipologiaPraticaEnum['Trasferimento titolarità'] :
      dataLimite = utils.getNotificaAvvicinamentoScadenza(90);
      querybuilder.andQuery("range", "dati_istanza.data_scadenza_concessione", { "lt": dataLimite });  
      break;
  }
  
  let query = querybuilder.build();
  
  passiCarrabiliData.praticheAvviabiliPostConcessione(req, res, query);
}

function caricaDashboardKibana(req, res) {
  var municipio_id = req.params.municipio_id;
  var linkDashboardKibana = '';

  switch (parseInt(municipio_id)) {
    case 1:
      linkDashboardKibana = config.linkDashboardKibana_M1;
      break;
    case 2:
      linkDashboardKibana = config.linkDashboardKibana_M2;
      break;
    case 3:
      linkDashboardKibana = config.linkDashboardKibana_M3;
      break;
    case 4:
      linkDashboardKibana = config.linkDashboardKibana_M4;
      break;
    case 5:
      linkDashboardKibana = config.linkDashboardKibana_M5;
      break;
    default: 
      linkDashboardKibana = config.linkDashboardKibana; 
      break; 
  }

  res.status(200).send({ data: linkDashboardKibana });
}

function bonificaPratiche(req, res) {
  let municipio_id = req.params.municipio_id;

  let querybuilder = bodybuilder().query('exists', 'field', 'is_pratica_pregresso');
  querybuilder.andQuery('term', 'stato_pratica', statoPratica.StatoPraticaPassiCarrabiliEnum['Concessione valida']);

  if (municipio_id != 'null')
    querybuilder.filter('term', 'dati_istanza.indirizzo_segnale_indicatore.municipio_id', municipio_id);

  let query = querybuilder.build();

  passiCarrabiliData.bonificaPratiche(req, res, query);
}

function getSegnalazioni(req, res) {
  let municipio_id = req.params.municipio_id;

  let querybuilder = bodybuilder();

  if (municipio_id != 'null') {
    querybuilder.query('term', 'segnalazioni.indirizzo_segnale_indicatore.municipio_id', municipio_id);
  }
  else {
    querybuilder.query('match_all', {});
  }

  let query = querybuilder.build();

  passiCarrabiliData.getSegnalazioni(req, res, query);
}

function getSegnalazione(req, res) {
  let id_doc = req.params.id_doc;
  passiCarrabiliData.getSegnalazione(req, res, id_doc);
}

function aggiornaSegnalazione(req, res) {
  var segnalazione = req.body;   
  // segnalazione.last_modification.data_operazione = formatter.formatDateTime();
  if(segnalazione.segnalazioni.info_chiusura_segnalazione) {
    segnalazione.segnalazioni.info_chiusura_segnalazione.data_operazione = formatter.formatDateTime();
  }
  segnalazione.segnalazioni.dataInserimento = formatter.formatDateTime(segnalazione.segnalazioni.dataInserimento, false);
  passiCarrabiliData.aggiornaSegnalazione(req, res, segnalazione);
}

function getPraticheInAttesaPagamentoBollo(req, res) {
  var objSearch = req.body;
  
  let querybuilder = bodybuilder().query('term', 'stato_pratica', statoPratica.StatoPraticaPassiCarrabiliEnum['Attesa di pagamento']);
  querybuilder.andQuery('term', 'dichiarazioni_aggiuntive.flag_esenzione', false);
  querybuilder.notQuery('exists', 'field', 'marca_bollo_determina');

  if (objSearch.codice_fiscale)
    querybuilder.andQuery('match', 'anagrafica.codice_fiscale', objSearch.codice_fiscale.toLocaleLowerCase());
  
  if (objSearch.codice_fiscale_piva)
    querybuilder.andQuery('match', 'anagrafica.codice_fiscale_piva', objSearch.codice_fiscale_piva.toLocaleLowerCase());

  if (objSearch.id_determina) 
    querybuilder.andQuery('match', 'determina.id', objSearch.id_determina.toLocaleLowerCase());
  
  let query = querybuilder.build();
  
  passiCarrabiliData.getPraticheInAttesaPagamentoBollo(req, res, query);
}

function getPraticheInRevoca(req, res) {
  var objSearch = req.body;
  
  let querybuilder = bodybuilder().query('term', 'stato_pratica', objSearch.stato_pratica);
  querybuilder.andQuery('term', 'dati_istanza.tipologia_processo', tipologiaPratica.TipologiaPraticaEnum.Revoca);

  if (objSearch.codice_fiscale)
    querybuilder.andQuery('match', 'anagrafica.codice_fiscale', objSearch.codice_fiscale.toLocaleLowerCase());
  
  if (objSearch.codice_fiscale_piva)
    querybuilder.andQuery('match', 'anagrafica.codice_fiscale_piva', objSearch.codice_fiscale_piva.toLocaleLowerCase());
  
  let query = querybuilder.build();
  
  passiCarrabiliData.getPraticheInRevoca(req, res, query);
}

function checkTagRFID(req, res) {
  let querybuilder = bodybuilder();
  querybuilder.query('match_phrase', 'tag_rfid', req.params.tag_rfid.toLocaleLowerCase());
  let query = querybuilder.build();
  
  passiCarrabiliData.checkTagRFID(req, res, query);
}

function validazionePratica(req, res) {
  var istanza = req.body.istanza;  
  var dimensione_totale_allegati_protocollo_kb = req.body.dimensione_totale_allegati_protocollo_kb;

  if(config.flag_controllo_allegati 
      && dimensione_totale_allegati_protocollo_kb 
      && parseFloat(dimensione_totale_allegati_protocollo_kb) > parseFloat(config.dimensione_totale_allegati_protocollo_kb)) {
    console.log('API: validazionePratica - dimensione allegati');
    res.status(413).send({ err: "Payload Too Large", message: `Dimensione allegati maggiore a quella consentita [MAX: ${config.dimensione_totale_allegati_protocollo_kb}kb]` }); 
  }
  else {
    if(!istanza.dati_istanza.tipologia_processo) { 
      var querybuilder = bodybuilder();  
      querybuilder.query('match_phrase', 'dati_istanza.indirizzo_segnale_indicatore.indirizzo', istanza.dati_istanza.indirizzo_segnale_indicatore.indirizzo);

      if(istanza.dati_istanza.indirizzo_segnale_indicatore.location.lat && istanza.dati_istanza.indirizzo_segnale_indicatore.location.lon) {
        querybuilder.filter('geo_distance', {
          "distance": "0.1m",
          "dati_istanza.indirizzo_segnale_indicatore.location": {
              "lat": istanza.dati_istanza.indirizzo_segnale_indicatore.location.lat,
              "lon": istanza.dati_istanza.indirizzo_segnale_indicatore.location.lon
          }
        });
      }

      querybuilder.notFilter('terms', 'stato_pratica', [statoPratica.StatoPraticaPassiCarrabiliEnum.Archiviata, statoPratica.StatoPraticaPassiCarrabiliEnum.Revocata, statoPratica.StatoPraticaPassiCarrabiliEnum.Rigettata]);
      var query = querybuilder.build();
  
      passiCarrabiliData.validazionePratica(req, res, query);
    }
    else 
      res.status(200).send({ message: "Validazione avvenuta con successo" });
  }
}

function checkAvvioProcessiPostConcessioneMultipli(req, res) {
  var istanza = req.body.istanza; 

  var querybuilder = bodybuilder();
  querybuilder.query('match', 'dati_istanza.link_pratica_origine.id_doc', istanza.id_doc.toLowerCase());

  var stateToExclude = [
    statoPratica.StatoPraticaPassiCarrabiliEnum.Archiviata, 
    statoPratica.StatoPraticaPassiCarrabiliEnum.Revocata, 
    statoPratica.StatoPraticaPassiCarrabiliEnum.Rigettata,
    statoPratica.StatoPraticaPassiCarrabiliEnum['Concessione valida'],
    // statoPratica.StatoPraticaPassiCarrabiliEnum.Bozza
  ];

  querybuilder.notFilter('terms', 'stato_pratica', stateToExclude);
  var query = querybuilder.build();
  
  passiCarrabiliData.checkAvvioProcessiPostConcessioneMultipli(req, res, query);
}

function countPratichePerStato(req, res) {
  let municipio_id = req.params.municipio_id;
  let group_id = req.params.group_id;

  let stati_pratica = Object.keys(statoPratica.StatoPraticaPassiCarrabiliEnum).filter(x => {
      let el = parseInt(x, 10);
      if(!isNaN(el))
        return el;
    }
  );

  stati_pratica = stati_pratica.map(x => parseInt(x));
  stati_pratica = [0, ...stati_pratica];

  var functions = [];
  for(var i=0;i<stati_pratica.length;i++) {

    let querybuilder = bodybuilder().query('term', 'stato_pratica', stati_pratica[i]);

    if (municipio_id != 'null')
      querybuilder.filter('term', 'dati_istanza.indirizzo_segnale_indicatore.municipio_id', municipio_id);

    if (stati_pratica[i] == statoPratica.StatoPraticaPassiCarrabiliEnum['Richiesta pareri'] && group_id != 'null') {
      switch (parseInt(group_id)) {
        case groupEnum.GroupEnum.PoliziaLocale:
          querybuilder.filter('exists', 'field', 'parere_polizia');
          querybuilder.notFilter('exists', 'field', 'parere_polizia.competenza')
          break;
        case groupEnum.GroupEnum.UfficioTecnicoDecentrato:
          querybuilder.filter('exists', 'field', 'parere_utd');
          querybuilder.notFilter('exists', 'field', 'parere_utd.competenza')
          break;
        case groupEnum.GroupEnum.RipartizioneUrbanistica:
          querybuilder.filter('exists', 'field', 'parere_urbanistica');
          querybuilder.notFilter('exists', 'field', 'parere_urbanistica.competenza')
          break;
      }
    }

    let query = querybuilder.build();

    functions.push(async.apply(countIndex, stati_pratica[i], query));
  }

  async.parallel(functions, function(err, response){    
    res.json(response);
  });
}

function countIndex(stato_pratica, query, callback){
  passiCarrabiliData.countPratichePerStato(stato_pratica, query, callback);
}

function countPratichePerFunzionalita(req, res) {
  let municipio_id = req.params.municipio_id;
  let funzionalità = ['bonifica_pratica', 'aggiungi_tag_rfid'];

  var functions = [];
  for(var i=0;i<funzionalità.length;i++) {
  
    let querybuilder = bodybuilder();
    switch (funzionalità[i]) {
      case 'bonifica_pratica':
        querybuilder.query('exists', 'field', 'is_pratica_pregresso');
        querybuilder.andQuery('term', 'stato_pratica', statoPratica.StatoPraticaPassiCarrabiliEnum['Concessione valida']);
        break;
      case 'aggiungi_tag_rfid':
        querybuilder.query('term', 'stato_pratica', statoPratica.StatoPraticaPassiCarrabiliEnum['Concessione valida']);
        querybuilder.notQuery('term', 'dati_istanza.tipologia_processo', tipologiaPratica.TipologiaPraticaEnum.Proroga);
        querybuilder.notQuery('exists', 'field', 'tag_rfid');
        break;
    }

    if (municipio_id != 'null')
        querybuilder.filter('term', 'dati_istanza.indirizzo_segnale_indicatore.municipio_id', municipio_id);

    let query = querybuilder.build();
    functions.push(async.apply(countIndex, funzionalità[i], query));
  }

  async.parallel(functions, function(err, response){    
    res.json(response);
  });
}

module.exports = {
  inserimentoBozzaPratica,
  inserimentoPratica,
  storicoPratica,
  praticheCittadino,
  cercaPratica,
  eliminaPratica,
  documentiPratica,
  uploadDocument,
  assegnaProtocolloDocumento,
  deleteDocument,
  aggiornaPratica,
  cercaPratichePerStatoPratica,
  updateValidityDocument,
  resetValidityDocument,
  getDocumento,
  controlloPraticheScadute,
  praticaCittadino,
  controlloPraticheTerminate,
  cercaIstruttoriMunicipio,
  getNumeroProtocollo,
  archiviaPraticaOriginaria,
  revocaPraticaOriginaria,
  cercaPraticaDaNumProtocollo,
  cercaSegnalazioniRegolarizzazione,
  inserimentoSegnalazioniRegolarizzazione,
  getRelazioneServizioRegolarizzazione,
  notificaRegolarizzazioneInviata,
  disattivaNotificaScadenziarioRegolarizzazione,
  pregressoPratiche,
  setPraticaControllataPregresso,
  ripristinaPraticaPregresso,
  getPraticheSenzaTagRFID,
  praticheAvviabiliPostConcessione,
  caricaDashboardKibana,
  bonificaPratiche,
  getSegnalazioni,
  getSegnalazione,
  aggiornaSegnalazione,
  getPraticheInAttesaPagamentoBollo,
  getPraticheInRevoca,
  checkTagRFID,
  validazionePratica,
  checkAvvioProcessiPostConcessioneMultipli,
  countPratichePerStato,
  countPratichePerFunzionalita,
  /* ****************** SCADENZIARIO ****************** */
  cercaNotificheScadenziario,
  startScadenziario,
  eliminaPraticaDaScadenziario
};