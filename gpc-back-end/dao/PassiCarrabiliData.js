var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var db = require('../db');
var config = require('../config');
router.use(express.json({ limit: '20mb', extended: true }));
router.use(express.urlencoded({ limit: "20mb", extended: true }));
var statoPratica = require("../shared/enums/stato-pratica.enum.js");
var formatter = require("../shared/utility/formatter.js");
var bodybuilder = require('bodybuilder');
var utilityService = require("../service/UtilityService.js");
const request = require("request-promise");
var passaggiStatoEnum = require("../shared/enums/passaggi-stato.enum.js");

function inserimentoBozzaPratica(req, res, istanza, query) {

  if(!!query) {
    db.client.search({  
      index: config.mapping.passicarrabili.index,
      type: config.mapping.passicarrabili.type,
      "from" : 0, "size": 9999,
      body: query
    }).then(function (resp){

      if(resp.hits.total.value == 0) {
        generateIDAndCreatePractice(req, res, istanza, true);
      }
      else {
        res.status(409).send({ message: "Esiste già una pratica nel sistema per il civico selezionato" }); 
      }
    }).catch(function (err) {
      console.log('API: inserimentoBozzaPratica - cerca pratica');
      res.status(err.status).send({ err: err, message: "Errore di sistema" }); 
    });
  }
  else {
    generateIDAndCreatePractice(req, res, istanza, true);
  }
}

function generateIDAndCreatePractice(req, res, istanza, emailInviata){
  var prefix_id_doc = istanza.anagrafica.tipologia_persona == 'G' ? istanza.anagrafica.codice_fiscale_piva : istanza.anagrafica.codice_fiscale;
  
  db.client.search({  
    index: config.mapping.passicarrabili.index,
    type: config.mapping.passicarrabili.type,
    "from" : 0, "size": 9999,
    body: {
      _source: "id_doc",
      query: {    
        prefix: {
          "id_doc": prefix_id_doc.toLowerCase()
        }
      }
    } 
  }).then(function(resp) {  

    let countPratiche = 1;
    if(resp.hits.hits.length > 0){
      let usedID = resp.hits.hits.map(x => {
        let idSplitted = x._source.id_doc.split('_');
        return parseInt(idSplitted[1]);
      });

      let notFound = false;
      do{
        if(usedID.indexOf(countPratiche) > -1)
          countPratiche++;
        else 
          notFound = true;
      }while(notFound == false);
    }

    idPratica = prefix_id_doc + '_' + countPratiche;
    istanza.id_doc = idPratica;

    db.client.create({
      index: config.mapping.passicarrabili.index,
      type: config.mapping.passicarrabili.type,
      id: idPratica,
      body: istanza
    }).then(async (resp) => { 
      inserisciStoricoPratica(istanza);

      var responseEmail = {};
      if(!emailInviata) {
        responseEmail = await utilityService.takeEmailsAndSendEmailSync(istanza, null)
          .catch(err => {
              console.log('takeEmailsAndSendEmailSync: ' + JSON.stringify(err));
              responseEmail.message = err.message;
          });
      }

      let respMessage = istanza.stato_pratica == statoPratica.StatoPraticaPassiCarrabiliEnum.Bozza 
          ? "Pratica salvata in bozza. Per inserirla è necessario completarla dalla sezione Pratiche in bozza" 
          : "Istanza inserita nel sistema";
      res.status(200).send({ istanza: istanza, message: respMessage, responseEmail: responseEmail?.message });
    }).catch((err) => {
      console.log('API: generateIDAndCreatePractice - create');
      console.log('create: ' + JSON.stringify(err));
      res.status(err.status || 500).send({ err: err, message: "Errore di sistema" });
    });
      
  }).catch((err)=>{
    console.log('API: generateIDAndCreatePractice - search');
    console.log('search: ' + JSON.stringify(err));
    res.status(err.status || 500).send({ err: err, message: "Errore di sistema" });
  });
}

function inserimentoPratica(req, res, istanza, query, emailInviata) {

  checkRegolarizzazioni(istanza);
  
  if(!!query) {
    db.client.search({  
      index: config.mapping.passicarrabili.index,
      type: config.mapping.passicarrabili.type,
      "from" : 0, "size": 9999,
      body: query
    }).then(function (resp){

      if(resp.hits.total.value == 0) {
        generateIDAndCreatePractice(req, res, istanza, emailInviata);
      }
      else {
        res.status(409).send({ err: 409, message: "Esiste già una pratica nel sistema per il civico selezionato" }); 
      }
    }).catch(function (err) {
      console.log('API: inserimentoPratica - cerca pratica');
      res.status(err.status).send({ err: err, message: "Errore di sistema" }); 
    });
  }
  else if(!istanza.id_doc){
    generateIDAndCreatePractice(req, res, istanza, emailInviata);
  }
  else {
    aggiornaPratica(req, res, istanza, emailInviata, null, true);
  }
}

function checkRegolarizzazioni(istanza) {

  let querybuilder = bodybuilder();
  querybuilder.filter('term', 'indirizzo_segnale_indicatore.location.lat', istanza.dati_istanza.indirizzo_segnale_indicatore.location.lat);
  querybuilder.filter('term', 'indirizzo_segnale_indicatore.location.lon', istanza.dati_istanza.indirizzo_segnale_indicatore.location.lon);
  query = querybuilder.build();

  db.client.search({  
    index: config.mapping.regolarizzazione.index,
    type: config.mapping.regolarizzazione.type,
    "from" : 0, "size": 9999,
    body: query
  }).then(function (resp){
    if(resp.hits.total.value != 0) { 
      let pratica = resp.hits.hits[0]._source;
      db.client.delete({
        index: config.mapping.regolarizzazione.index,
        type: config.mapping.regolarizzazione.type,
        id: pratica.id_doc,
      }).then((resp) => {     
      }).catch((err) => {
        console.log('API: checkRegolarizzazioni');
        console.log(err);
      });
    }
  }).catch(function (err) {
    console.log('API: checkRegolarizzazioni');
    console.log(err);
  });
}

function inserisciStoricoPratica(istanza){
  db.client.index({
    index: config.mapping.storico_passicarrabili.index,
    type: config.mapping.storico_passicarrabili.type,
    body: istanza
  }).then((resp) => {     
  }).catch((err) => {
    console.log('API: inserisciStoricoPratica');
  });
}

function storicoPratica(req, res, idpratica) {
  db.client.search({  
    index: config.mapping.storico_passicarrabili.index,
    type: config.mapping.storico_passicarrabili.type,
    "from" : 0, "size": 9999,
    body: {
      query: {
        match: { "id_doc": idpratica }
      },
    }
  }).then(function (resp){
    var JSONresults = {}
    JSONresults.data = resp['hits']['hits'].map(function (i) {
      return i['_source'];
    });

    JSONresults.notFound = resp.hits.total.value == 0;
    res.status(200).send(JSONresults);
  }).catch(function (err) {
    console.log('API: storicoPratica');
    res.status(err.status).send({ err: err, message: "Errore di sistema" });
  });
}

function praticheCittadino(req, res, query) {
  db.client.search({  
    index: config.mapping.passicarrabili.index,
    type: config.mapping.passicarrabili.type,
    "from" : 0, "size": 9999,
    body: query
  }).then(function (resp){
    var JSONresults = {}
    JSONresults.data = resp.hits.hits.map(function (i) {
      return i['_source'];
    });

    JSONresults.count = JSONresults.data.length;
    JSONresults.notFound = resp.hits.total.value == 0;
    res.status(200).send(JSONresults);
  }).catch(function (err) {
    console.log('API: praticheCittadino');
    res.status(err.status).send({ err: err, message: "Errore di sistema" });
  });
}     

function cercaPratica(req, res, id) {
  db.client.get({  
    index: config.mapping.passicarrabili.index,
    type: config.mapping.passicarrabili.type,
    id: id
  }).then(function (resp){
    res.status(200).send(resp._source);
  }).catch(function (err) {
    console.log('API: cercaPratica');
    res.status(err.status).send({ err: err, message: "Errore di sistema" }); 
  });
}  

function cercaPraticaDaNumProtocollo(req, res, numero_protocollo) {
  db.client.search({  
    index: config.mapping.passicarrabili.index,
    type: config.mapping.passicarrabili.type,
    "from" : 0, "size": 9999,
    body: {
      query: {
        match: { "numero_protocollo": numero_protocollo }
      },
    }
  }).then(function (resp){
    var JSONresults = {}
    JSONresults.data = resp['hits']['hits'].map(function (i) {
      return i['_source'];
    });

    JSONresults.notFound = resp.hits.total.value == 0;
    res.status(200).send(!JSONresults.notFound ? JSONresults.data[0] : null);
  }).catch(function (err) {
    console.log('API: storicoPratica');
    res.status(err.status).send({ err: err, message: "Errore di sistema" });
  });
}

function eliminaPratica(req, res, id) {

  db.client.delete({
      index: config.mapping.passicarrabili.index,
      type: config.mapping.passicarrabili.type,
      id: id
  }).then((resp) => {     

      db.client.deleteByQuery({  
        index: config.mapping.documenti_passicarrabili.index,
        type: config.mapping.documenti_passicarrabili.type,
        body: {
          query: {
            match_phrase: {
              "id_doc": id.toLocaleLowerCase()
            }
          }
        } 
      }).then((resp) => {}
      ).catch((err) => {
        console.log('API: eliminaPratica - errore cancellazione documenti pratica');
      });

      db.client.deleteByQuery({  
        index: config.mapping.storico_passicarrabili.index,
        type: config.mapping.storico_passicarrabili.type,
        body: {
          query: {
            match_phrase: {
              "id_doc": id.toLocaleLowerCase()
            }
          }
        } 
      }).then((resp) => {}
      ).catch((err) => {
        console.log('API: eliminaPratica - errore cancellazione storico');
      });
      
      res.status(200).send({ message: "La pratica è stata eliminata" });
  }).catch((err) => {
      console.log('API: eliminaPratica');
      res.status(err.status).send({ message: "Errore durante la cancellazione della pratica" });
  });
};

function documentiPratica(req, res, idpratica) {
  db.client.search({  
    index: config.mapping.documenti_passicarrabili.index,
    type: config.mapping.documenti_passicarrabili.type,
    "from" : 0, "size": 9999,
    body: {
      _source: { 
        exclude: [ "blob" ] 
      },
      query: {
        prefix: {
          "id_doc": idpratica.toLocaleLowerCase()
        }
      }
    }  
  }).then(function (resp){
    var JSONresults = {}
    JSONresults.data = resp['hits']['hits'].map(function (i) {
      return i['_source'];
    });

    JSONresults.notFound = resp.hits.total.value == 0;
    res.status(200).send(JSONresults);
  }).catch(function (err) {
    console.log('API: documentiPratica');
    res.status(err.status).send({ err: err, message: "Errore di sistema" });
  });
}

function getDocumento(req, res, id_doc) {
  db.client.get({  
    index: config.mapping.documenti_passicarrabili.index,
    type: config.mapping.documenti_passicarrabili.type,
    id: id_doc
  }).then(function (resp){
    res.status(200).send(resp._source);
  }).catch(function (err) {
    if(err.status != 404){
      console.log('API: getDocumento');
      res.status(err.status).send({ err: err, message: "Errore di sistema" }); 
    }
    else
      res.status(err.status).send({ err: err, message: "Documento non presente nel DB" });
  });
}

function uploadDocument(req, res, documento) {
  db.client.index({
    index: config.mapping.documenti_passicarrabili.index,
    type: config.mapping.documenti_passicarrabili.type,
    id: documento.id,
    body: documento
  }).then((resp) => {
    res.status(200).send({ message: "Documento inserito correttamente." });
  }).catch((err) => {
    console.log(`API: uploadDocument - Errore ${err.status}: ${err.message}`);

    let errMessage = "Errore durante l'inserimento del documento";
    if(err.status == 413)
      errMessage += " - dimensione massima file consentita 19mb";

    res.status(err.status).send({ err: err, message: errMessage });
  });
}

function assegnaProtocolloDocumento(req, res, documento) {
  var promise = null;

  if(documento.blob) {
    promise = db.client.index({
      index: config.mapping.documenti_passicarrabili.index,
      type: config.mapping.documenti_passicarrabili.type,
      id: documento.id,
      body: documento
    });
  }
  else {
    promise = db.client.update({
      index: config.mapping.documenti_passicarrabili.index,
      type: config.mapping.documenti_passicarrabili.type,
      id: documento.id,
      body: {
        doc: {
          numero_protocollo: documento.numero_protocollo
        }
      }
    });
  }

  promise.then((resp) => {
    res.status(200).send({ message: "Protocollo associato correttamente." });
  }).catch((err) => {
    console.log('API: assegnaProtocolloDocumento');
    res.status(err.status).send({ err: err, message: "Errore durante l'associazione del protocollo al documento" });
  });
}

function deleteDocument(req, res, id) {
  db.client.delete({
      index: config.mapping.documenti_passicarrabili.index,
      type: config.mapping.documenti_passicarrabili.type,
      id: id
  }).then((resp) => {
      res.status(200).send({ message: "Il documento è stato eliminato" });
  }).catch((err) => {
      console.log('API: deleteDocument');
      res.status(err.status).send({ message: "Errore durante la cancellazione del documento" });
  });
};

function aggiornaPratica(req, res, istanza, emailInviata, statoIntegrazione, storicizza_pratica) {
  db.client.index(
  {
    index: config.mapping.passicarrabili.index,
    type: config.mapping.passicarrabili.type,
    id: istanza.id_doc,
    body: istanza
  }).then(async (resp) => {

    if(storicizza_pratica)
      inserisciStoricoPratica(istanza);

      var responseEmail = {};
      if(!emailInviata) {
        responseEmail = await utilityService.takeEmailsAndSendEmailSync(istanza, statoIntegrazione)
          .catch(err => {
              responseEmail.message = err.message;
          });
      }

      res.status(200).send({ istanza: istanza, message: "La pratica è passata alla fase successiva", responseEmail: responseEmail ? responseEmail.message : "Errore durante l'invio della email al municipio" });
  }).catch((err) => {
      console.log('API: aggiornaPratica');
      res.status(err.status).send({ err: err, message: "Errore di sistema" });
  });
};

function cercaPratichePerStatoPratica(req, res, query) {
  db.client.search({  
    index: config.mapping.passicarrabili.index,
    type: config.mapping.passicarrabili.type,
    "from" : 0, "size": 9999,
    body: query
  }).then(function (resp){
    var JSONresults = {}
    JSONresults.data = resp['hits']['hits'].map(function (i) {
      return i['_source'];
    });

    JSONresults.notFound = resp.hits.total.value == 0;
    res.status(200).send(JSONresults);
  }).catch(function (err) {
    console.log('API: cercaPratichePerStatoPratica');
    res.status(err.status).send({ err: err, message: "Errore di sistema" });
  });
}

function updateValidityDocument(req, res, obj) {
  db.client.update({
    index: config.mapping.documenti_passicarrabili.index,
    type: config.mapping.documenti_passicarrabili.type,
    id: obj.id,
    body: {
      doc: {
        isValid: obj.isValid,
        dataoperazione: obj.dataoperazione
      }
    }
  }).then((resp) => {
    res.status(200).send({ message: obj.isValid ? "Documento valido." : "Documento non valido" });
  }).catch((err) => {
    console.log('API: updateValidityDocument');
    res.status(err.status).send({ err: err, message: "Errore durante l'aggiornamento dello stato del documento" });
  });
}

function resetValidityDocument(req, res, obj) {
  db.client.updateByQuery({
    index: config.mapping.documenti_passicarrabili.index,
    type: config.mapping.documenti_passicarrabili.type,
    body: {
      script: {
        inline: "ctx._source.isValid=false; ctx._source.dataoperazione='" + obj.dataoperazione + "';"
      },
      query: {
        bool: {
          filter: {
            bool: {
              must: [
                {
                  prefix: {
                    "id_doc": obj.id_pratica.toLocaleLowerCase() + '_'
                  }
                },
                {
                  terms: {
                    "id": ["visurastorica", "relopere", "tavole", "variazdestinazione", "scia"]
                  }
                }
              ]
            }
          }
        }
      }    
    } 
  }).then((resp) => {
    res.status(200).send({ message: "Reset validità documenti avvenuto con successo" });
  }).catch((err) => {
    console.log('API: resetValidityDocument');
    res.status(err.status).send({ err: err, message: "Errore durante il reset della validità dei documento" });
  });
}

function controlloPraticheScadute(req, res, query, currDate) {
  db.client.updateByQuery({
    index: config.mapping.passicarrabili.index,
    type: config.mapping.passicarrabili.type,
    body: {
      script: {
        inline: "ctx._source.lastModification.utenteloggato='System'; ctx._source.lastModification.dataoperazione='" + currDate + "'; ctx._source.asset.statopratica=" + statoPratica.StatoPraticaPassiCarrabiliEnum.Annullata + ";"
      },
      query: query.query
    } 
  }).then((resp) => {
    res.status(200).send({ message: "Le pratiche scadute sono state annullate" });
  }).catch((err) => {
    console.log('API: controlloPraticheScadute');
    res.status(err.status).send({ err: err, message: "Errore durante l'annullamento delle pratiche scadute" });
  });
}

function praticaCittadino(req, res, numProtocollo) {
  db.client.search({  
    index: config.mapping.passicarrabili.index,
    type: config.mapping.passicarrabili.type,
    "from" : 0, "size": 9999,
    body: {
      query: {
        match: { "asset.numero_protocollo": numProtocollo }
      },
    }
  }).then(function (resp){
    var JSONresults = {}
    JSONresults.data = resp['hits']['hits'].map(function (i) {
      return i['_source'];
    });

    JSONresults.notFound = resp.hits.total.value == 0;
    res.status(200).send(JSONresults);
  }).catch(function (err) {
    console.log('API: praticaCittadino');
    res.status(err.status).send({ err: err, message: "Errore di sistema" });
  });
}

function controlloPraticheTerminate(req, res, query, currDate) {
  db.client.updateByQuery({
    index: config.mapping.passicarrabili.index,
    type: config.mapping.passicarrabili.type,
    body: {
      script: {
        inline: "ctx._source.lastModification.utenteloggato='System'; ctx._source.lastModification.dataoperazione='" + currDate + "'; ctx._source.asset.statopratica=" + statoPratica.StatoPraticaPassiCarrabiliEnum["Concessione terminata"] + ";"
      },
      query: query.query
    } 
  }).then((resp) => {
    res.status(200).send({ message: "Le concessioni scadute sono state chiuse" });
  }).catch((err) => {
    console.log('API: controlloPraticheTerminate');
    res.status(err.status).send({ err: err, message: "Errore durante la chiusura della concessione" });
  });
}

function cercaIstruttoriMunicipio(req, res, query) {
  db.client.search({  
    index: config.mapping.utenti.index,
    type: config.mapping.utenti.type,
    "from" : 0, "size": 9999,
    body: query
  }).then(function (resp){
    var JSONresults = {}
    JSONresults.data = resp['hits']['hits'].map(function (i) {
      return i['_source'];
    });

    JSONresults.notFound = resp.hits.total.value == 0;
    res.status(200).send(JSONresults);
  }).catch(function (err) {
    console.log('API: cercaIstruttoriMunicipio');
    res.status(err.status).send({ err: err, message: "Errore di sistema" });
  });
}

function archiviaPraticaOriginaria(req, res, istanza) {
  db.client.get({  
    index: config.mapping.passicarrabili.index,
    type: config.mapping.passicarrabili.type,
    id: istanza.dati_istanza.link_pratica_origine.id_doc
  }).then(function (resp){

    let istanza_originaria = resp._source;

    istanza_originaria.stato_pratica = statoPratica.StatoPraticaPassiCarrabiliEnum.Archiviata;
    istanza_originaria.info_passaggio_stato = passaggiStatoEnum.PassaggiStatoEnum.ConcessioneValidaToArchiviata;
    istanza_originaria.numero_protocollo_comunicazione = '';
    istanza_originaria.last_modification = {
      username: istanza.last_modification.username,
      utente: istanza.last_modification.utente,
      data_operazione: formatter.formatDateTime()
    };
    
    //delete istanza_originaria.dati_istanza.data_scadenza_concessione;

    aggiornaPratica(req, res, istanza_originaria, true, null, true);
  }).catch(function (err) {
    console.log('API: archiviaPraticaOriginaria - GetPratica');
    res.status(err.status).send({ err: err, message: "Errore di sistema" }); 
  });
}  

function revocaPraticaOriginaria(req, res, istanza) {
  db.client.get({  
    index: config.mapping.passicarrabili.index,
    type: config.mapping.passicarrabili.type,
    id: istanza.dati_istanza.link_pratica_origine.id_doc
  }).then(function (resp){

    let istanza_originaria = resp._source;

    istanza_originaria.stato_pratica = statoPratica.StatoPraticaPassiCarrabiliEnum.Revocata;
    istanza_originaria.info_passaggio_stato = passaggiStatoEnum.PassaggiStatoEnum.ConcessioneValidaToRevocata;
    istanza_originaria.numero_protocollo_comunicazione = '';
    istanza_originaria.last_modification = {
      username: istanza.last_modification.username,
      utente: istanza.last_modification.utente,
      data_operazione: formatter.formatDateTime()
    };
    
    //delete istanza_originaria.dati_istanza.data_scadenza_concessione;

    aggiornaPratica(req, res, istanza_originaria, true, null, true);
  }).catch(function (err) {
    console.log('API: revocaPraticaOriginaria - GetPratica');
    res.status(err.status).send({ err: err, message: "Errore di sistema" }); 
  });
}  

function cercaSegnalazioniRegolarizzazione(req, res, query) {
  let query_to_run = !!query ? query.query : {"match_all": {}};
  db.client.search({  
    index: config.mapping.regolarizzazione.index,
    type: config.mapping.regolarizzazione.type,
    "from" : 0, "size": 9999,
    body: {
      _source: { 
        exclude: [ "relazione_servizio.blob" ] 
      },
      query: query_to_run
    }  
  }).then(function (resp){
    var JSONresults = {}
    JSONresults.data = resp['hits']['hits'].map(function (i) {
      return i['_source'];
    });

    JSONresults.notFound = resp.hits.total.value == 0;
    res.status(200).send(JSONresults);
  }).catch(function (err) {
    console.log('API: cercaSegnalazioniRegolarizzazione');
    res.status(err.status).send({ err: err, message: "Errore di sistema" }); 
  });
} 

function inserimentoSegnalazioniRegolarizzazione(req, res, istanza) {
  db.client.create({
    index: config.mapping.regolarizzazione.index,
    type: config.mapping.regolarizzazione.type,
    id: istanza.id_doc,
    body: istanza
  }).then((resp) => { 
    res.status(200).send({ istanza: istanza, message: "Segnalazione di regolarizzazione inserita" });
  }).catch((err) => {
    console.log('API: inserimentoSegnalazioniRegolarizzazione');
    res.status(err.status).send({ err: err, message: err.status == 409 ? "Segnalazione già effettuata" : "Errore di sistema" });
  });
}

function getRelazioneServizioRegolarizzazione(req, res, id_doc) {
  db.client.get({  
    index: config.mapping.regolarizzazione.index,
    type: config.mapping.regolarizzazione.type,
    id: id_doc
  }).then(function (resp){
    let file = resp._source.relazione_servizio;
    res.status(200).send(file);
  }).catch(function (err) {
    if(err.status != 404){
      console.log('API: getRelazioneServizioRegolarizzazione');
      res.status(err.status).send({ err: err, message: "Errore di sistema" }); 
    }
    else
      res.status(err.status).send({ err: err, message: "Documento non presente nel DB" });
  });
}

function notificaRegolarizzazioneInviata(req, res, id_doc, data_scadenza_regolarizzazione) {
  db.client.update({
    index: config.mapping.regolarizzazione.index,
    type: config.mapping.regolarizzazione.type,
    id: id_doc,
    body: {
      doc: {
        data_scadenza_regolarizzazione: data_scadenza_regolarizzazione,
        regolarizzazione_notificata: true
      }
    }
  }).then((resp) => {
    res.status(200).send({data_scadenza_regolarizzazione: data_scadenza_regolarizzazione, message: `Invio notifica di regolarizzazione avvenuto con successo` });
  }).catch((err) => {
    console.log('API: update notificaRegolarizzazioneInviata');
    res.status(err.status).send({ err: err, message: "Errore durante la registrazione della notifica di regolarizzazione" });
  });
}

function disattivaNotificaScadenziarioRegolarizzazione(req, res, id_doc) {
  db.client.update({
    index: config.mapping.regolarizzazione.index,
    type: config.mapping.regolarizzazione.type,
    id: id_doc,
    body: {
      doc: {
        notifiche_attive: false
      }
    }
  }).then((resp) => {
    res.status(200).send({ message: `Disattivazione notifiche scadenziario avvenuta con successo` });
  }).catch((err) => {
    console.log('API: update disattivaNotificaScadenziarioRegolarizzazione');
    res.status(err.status).send({ err: err, message: "Errore durante la disattivazione delle notifiche dello scadenziario" });
  });
}

const elementsPerPage = 1000;
async function getPregressoPratiche(scroll_id) {
  let options = {};
  if (!scroll_id)
    options = {
      method: "POST",
      url: `${config.host}/${config.mapping.pregresso_passicarrabili.index}/_search?size=${elementsPerPage}&scroll=2m`
    };
  else
    options = {
      method: "POST",
      url: `${config.host}/_search/scroll`,
      body: {
        scroll: "2m",
        scroll_id
      },
      json: true
    };
  try {
    const result = await request(options);
    let parsed;
    if (typeof result === "string") parsed = JSON.parse(result);
    else parsed = result;
    return { scroll_id: parsed._scroll_id, ...parsed.hits };
  } catch (err) {
    console.log(err);
    return {};
  }
}

async function pregressoPratiche(req, res) {
  let scroll_id;
  let emptyResult = false;

  var JSONresults = {
    data: [],
    notFound: null
  };

  while (!emptyResult) {
    var result = await getPregressoPratiche(scroll_id);
    if (!!result && !!result.hits && result.hits.length !== 0) {
      result.hits.forEach(function(el) {
        let source = el._source;
        source.id = el._id;
        JSONresults.data.push(source);
      });

      scroll_id = result.scroll_id;
    } else {
      emptyResult = true;
    }
  }

  JSONresults.notFound = JSONresults.data.length == 0;
  res.status(200).send(JSONresults);
}

function setPraticaControllataPregresso(req, res, istanza) {
  db.client.update({
    index: config.mapping.pregresso_passicarrabili.index,
    type: config.mapping.pregresso_passicarrabili.type,
    id: istanza.id,
    body: {
      doc: {
        check: "true",
        id_doc: istanza.id_doc
      }
    }
  }).then((resp) => {
    res.status(200).send({ message: "Aggiornamento controllo effettuato" });
  }).catch((err) => {
    console.log('API: setPraticaControllataPregresso');
    res.status(err.status).send({ err: err, message: "Errore durante l'aggiornamento dello stato della pratica" });
  });
}

function ripristinaPraticaPregresso(req, res, query) {
  db.client.updateByQuery({
    index: config.mapping.pregresso_passicarrabili.index,
    type: config.mapping.pregresso_passicarrabili.type,
    body: {
      script: {
        inline: "ctx._source.check='false'; ctx._source.id_doc='';"
      },
      query: query.query
    } 
  }).then((resp) => {
    res.status(200).send({ message: "Ripristino pratica storico effettuato" });
  }).catch((err) => {
    console.log('API: ripristinaPraticaPregresso');
    res.status(err.status).send({ err: err, message: "Errore durante l'aggiornamento dello stato della pratica" });
  });
}

/* ****************** SCADENZIARIO ****************** */

function cercaNotificheScadenziario(req, res, query) {
  db.client.search({  
    index: config.mapping.scadenziario.index,
    type: config.mapping.scadenziario.type,
    "from" : 0, "size": 9999,
    body: query
  }).then(function (resp){
    var JSONresults = {}
    JSONresults.data = resp['hits']['hits'].map(function (i) {
      return i['_source'];
    });

    JSONresults.notFound = resp.hits.total.value == 0;
    res.status(200).send(JSONresults);
  }).catch(function (err) {
    console.log('API: cercaNotificheScadenziario');
    res.status(err.status).send({ err: err, message: "Errore di sistema" });
  });
}

function resetScadenziario(query) {
  return new Promise((resolve, reject) => {
    db.client.deleteByQuery({  
      index: config.mapping.scadenziario.index,
      type: config.mapping.scadenziario.type,
      body: query
    }).then(function (resp){
      resolve(resp);
    }).catch(function (err) {
      console.log('API: resetScadenziario');
      reject(err);
    });
  });
}

function inserisciNotificaScadenziario(body) {
  return new Promise((resolve, reject) => {
    db.client.index({
      index: config.mapping.scadenziario.index,
      type: config.mapping.scadenziario.type,
      id: body.id_doc,
      body: body
    }).then((resp) => {
      resolve(resp);
    }).catch((err) => {
      console.log('API: inserisciNotificaScadenziario');
      reject(err);
    });
  });
}

function cambioStatoPraticaDaScadenziario(pratica, stato_destinazione) {
  return new Promise((resolve, reject) => {
    pratica.stato_pratica = stato_destinazione;
    pratica.last_modification = {
      username: 'scadenziario',
      utente: 'Scadenziario',
      data_operazione: formatter.formatDateTime()
    };

    db.client.index(
      {
        index: config.mapping.passicarrabili.index,
        type: config.mapping.passicarrabili.type,
        id: pratica.id_doc,
        body: pratica
      }).then((resp) => {
          
          db.client.index({
            index: config.mapping.storico_passicarrabili.index,
            type: config.mapping.storico_passicarrabili.type,
            body: pratica
          }).then((resp) => {     
          }).catch((err) => {
            console.log('API: cambioStatoPraticaDaScadenziarioStorico');
          });

          resolve(pratica);
      }).catch((err) => {
          console.log('API: cambioStatoPraticaDaScadenziario');
          reject(err);
      });
  });
}  

function getConcessioniScaduteOInScadenza(query) {
  return new Promise((resolve, reject) => {
    db.client.search({  
      index: config.mapping.passicarrabili.index,
      type: config.mapping.passicarrabili.type,
      "from" : 0, "size": 9999,
      body: query
    }).then(function (resp){
      let data = resp['hits']['hits'].map(function (i) {
        return i['_source'];
      });

      resolve(data);
    }).catch(function (err) {
      console.log('API: getConcessioniScaduteOInScadenza');
      reject(err);
    });
  });
}

function getSegnalazioniRegolarizzazioneScadute(query) {
  return new Promise((resolve, reject) => {
    db.client.search({  
      index: config.mapping.regolarizzazione.index,
      type: config.mapping.regolarizzazione.type,
      "from" : 0, "size": 9999,
      body: {
        _source: { 
          exclude: [ "relazione_servizio.blob" ] 
        },
        query: query.query
      }
    }).then(function (resp){
      let data = resp['hits']['hits'].map(function (i) {
        return i['_source'];
      });

      resolve(data);
    }).catch(function (err) {
      console.log('API: getSegnalazioniRegolarizzazioneScadute');
      reject(err);
    });
  });
}

function eliminaPraticaDaScadenziario(req, res, id) {
  db.client.delete({
      index: config.mapping.scadenziario.index,
      type: config.mapping.scadenziario.type,
      id: id
  }).then((resp) => {
      res.status(200).send({ message: "La pratica è stata archiviata" });
  }).catch((err) => {
      console.log('API: eliminaPraticaDaScadenziario');
      res.status(err.status).send({ message: "Errore durante la cancellazione della notifica dallo scadenziario" });
  });
}

function getPraticheSenzaTagRFID(req, res, query) {
  db.client.search({  
    index: config.mapping.passicarrabili.index,
    type: config.mapping.passicarrabili.type,
    "from" : 0, "size": 9999,
    body: query
  }).then(function (resp){
    var JSONresults = {}
    JSONresults.data = resp['hits']['hits'].map(function (i) {
      return i['_source'];
    });

    JSONresults.notFound = resp.hits.total.value == 0;
    res.status(200).send(JSONresults);
  }).catch(function (err) {
    console.log('API: getPraticheSenzaTagRFID');
    res.status(err.status).send({ err: err, message: "Errore di sistema" });
  });
}

function praticheAvviabiliPostConcessione(req, res, query) {
  db.client.search({  
    index: config.mapping.passicarrabili.index,
    type: config.mapping.passicarrabili.type,
    "from" : 0, "size": 9999,
    body: query
  }).then(function (resp){
    var JSONresults = {}
    JSONresults.data = resp['hits']['hits'].map(function (i) {
      return i['_source'];
    });

    JSONresults.notFound = resp.hits.total.value == 0;
    res.status(200).send(JSONresults);
  }).catch(function (err) {
    console.log('API: praticheAvviabiliPostConcessione');
    res.status(err.status).send({ err: err, message: "Errore di sistema" });
  });
}

function bonificaPratiche(req, res, query) {
  db.client.search({  
    index: config.mapping.passicarrabili.index,
    type: config.mapping.passicarrabili.type,
    "from" : 0, "size": 9999,
    body: query
  }).then(function (resp){
    var JSONresults = {}
    JSONresults.data = resp['hits']['hits'].map(function (i) {
      return i['_source'];
    });

    JSONresults.notFound = resp.hits.total.value == 0;
    res.status(200).send(JSONresults);
  }).catch(function (err) {
    console.log('API: bonificaPratiche');
    res.status(err.status).send({ err: err, message: "Errore di sistema" });
  });
}

function getSegnalazioni(req, res, query) {
  db.client.search({  
    index: config.mapping.segnalazioni.index,
    type: config.mapping.segnalazioni.type,
    "from" : 0, "size": 9999,
    body: {
      _source: { 
        exclude: [ "segnalazioni.blob" ] 
      },
      query: query.query
    }
  }).then(function (resp){
    var JSONresults = {}
    JSONresults.data = resp['hits']['hits'].map(function (i) {
      let source = i['_source'];
      source.id_doc = i['_id']
      return source;
    });

    JSONresults.notFound = resp.hits.total.value == 0;
    res.status(200).send(JSONresults);
  }).catch(function (err) {
    console.log('API: getSegnalazioni');
    res.status(err.status).send({ err: err, message: "Errore di sistema" });
  });
}

function getSegnalazione(req, res, id_doc) {
  db.client.get({  
    index: config.mapping.segnalazioni.index,
    type: config.mapping.segnalazioni.type,
    id: id_doc
  }).then(function (resp){
    let source = resp._source;
    source.id_doc = resp._id;
    res.status(200).send({segnalazione: resp._source});
  }).catch(function (err) {
    console.log('API: getSegnalazione');
    res.status(err.status).send({ err: err, message: "Errore di sistema" }); 
  });
} 

function aggiornaSegnalazione(req, res, segnalazione) {
  db.client.index(
  {
    index: config.mapping.segnalazioni.index,
    type: config.mapping.segnalazioni.type,
    id: segnalazione.id_doc,
    body: segnalazione
  }).then( (resp) => {
      res.status(200).send({ segnalazione: segnalazione, message: "La segnalazione è passata alla fase successiva" });
  }).catch((err) => {
      console.log('API: aggiornaSegnalazione');
      res.status(err.status).send({ err: err, message: "Errore di sistema" });
  });
};

function getPraticheInAttesaPagamentoBollo(req, res, query) {
  db.client.search({  
    index: config.mapping.passicarrabili.index,
    type: config.mapping.passicarrabili.type,
    "from" : 0, "size": 9999,
    body: query
  }).then(function (resp){
    var JSONresults = {}
    JSONresults.data = resp['hits']['hits'].map(function (i) {
      return i['_source'];
    });

    JSONresults.notFound = resp.hits.total.value == 0;
    res.status(200).send(JSONresults);
  }).catch(function (err) {
    console.log('API: getPraticheInAttesaPagamentoBollo');
    res.status(err.status).send({ err: err, message: "Errore di sistema" });
  });
}

function getPraticheInRevoca(req, res, query) {
  db.client.search({  
    index: config.mapping.passicarrabili.index,
    type: config.mapping.passicarrabili.type,
    "from" : 0, "size": 9999,
    body: query
  }).then(function (resp){
    var JSONresults = {}
    JSONresults.data = resp['hits']['hits'].map(function (i) {
      return i['_source'];
    });

    JSONresults.notFound = resp.hits.total.value == 0;
    res.status(200).send(JSONresults);
  }).catch(function (err) {
    console.log('API: getPraticheInRevoca');
    res.status(err.status).send({ err: err, message: "Errore di sistema" });
  });
}

function checkTagRFID(req, res, query) {
  db.client.search({  
    index: config.mapping.passicarrabili.index,
    type: config.mapping.passicarrabili.type,
    "from" : 0, "size": 9999,
    body: {
      _source: { 
        include: [ "tag_rfid", "id_doc" ] 
      },
      query: query.query
    } 
  }).then(function (resp){
    var JSONresults = {}
    JSONresults.data = resp['hits']['hits'].map(function (i) {
      return i['_source'];
    });

    JSONresults.notFound = resp.hits.total.value == 0;
    res.status(200).send(JSONresults);
  }).catch(function (err) {
    console.log('API: checkTagRFID');
    res.status(err.status).send({ err: err, message: "Errore di sistema" });
  });
}

function validazionePratica(req, res, query) {
    db.client.search({  
      index: config.mapping.passicarrabili.index,
      type: config.mapping.passicarrabili.type,
      "from" : 0, "size": 9999,
      body: query
    }).then(function (resp){
      if(resp.hits.total.value == 0) {
        res.status(200).send({ message: "Validazione avvenuta con successo" });
      }
      else {
        res.status(409).send({ message: "Esiste già una pratica nel sistema per il civico selezionato" }); 
      }
    }).catch(function (err) {
      console.log('API: validazionePratica');
      res.status(err.status).send({ err: err, message: "Errore di sistema" }); 
    });
}

function checkAvvioProcessiPostConcessioneMultipli(req, res, query) {
  db.client.search({  
    index: config.mapping.passicarrabili.index,
    type: config.mapping.passicarrabili.type,
    "from" : 0, "size": 9999,
    body: query
  }).then(function (resp){
    if(resp.hits.total.value == 0) {
      res.status(200).send({ message: "Processo post concessione avviabile" });
    }
    else {
      res.status(409).send({ message: "Esiste già un processo post concessione avviato per la pratica selezionata" }); 
    }
  }).catch(function (err) {
    console.log('API: checkAvvioProcessiPostConcessioneMultipli');
    res.status(err.status).send({ err: err, message: "Errore di sistema" }); 
  });
}

function countPratichePerStato(stato_pratica, query, callback) {
  db.client.count({
      index: config.mapping.passicarrabili.index,
      type: config.mapping.passicarrabili.type,
      body: query
  },function(err,resp,status) {
      callback( err, { stato_pratica: stato_pratica, count: resp.count });
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
  /* ****************** SCADENZIARIO ****************** */
  cercaNotificheScadenziario,
  resetScadenziario,
  inserisciNotificaScadenziario,
  getConcessioniScaduteOInScadenza,
  cambioStatoPraticaDaScadenziario,
  getSegnalazioniRegolarizzazioneScadute,
  eliminaPraticaDaScadenziario
};