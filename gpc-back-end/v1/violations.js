var express = require("express");
var router = express.Router();
var db = require("../db");
var config = require("../config");
var verifyToken = require('../auth/VerifyToken');
var bodybuilder = require("bodybuilder");
var formatter = require("../shared/utility/formatter.js");
var statoPratica = require("../shared/enums/stato-pratica.enum.js");

router.get("/segnalazioni", verifyToken, function(req, res) {
  db.client.search(
    {
      index: config.mapping.segnalazioni.index,
      type: config.mapping.segnalazioni.type,
      from: 0,
      size: 9999,
      body: {
        _source: { 
          exclude: [ "segnalazioni.blob" ] 
        },
        sort: [
            {"last_modification.data_operazione" : {"order" : "asc"}} //desc - segnalazioni.dataInserimento
          ]
      }
    }).then(function (resp) {
      let result =  resp['hits']['hits'].map(function (i) {
          return i['_source'];
      });

      res.status(200).send({ result: result });
    }).catch(function (err) {
      res.status(err.statusCode).send({ error: err });
    });
  });

router.put("/segnalazioni", verifyToken, function(req, res) {
  var obj = req.body;

  obj.last_modification = {
    username: obj.last_modification?.username || 'N.D.',
    utente: obj.last_modification?.utente || 'N.D.',
    data_operazione: formatter.formatDateTime()
  };

  obj.stato_segnalazione = 1;

  db.client.index(
    {
      index: config.mapping.segnalazioni.index,
      type: config.mapping.segnalazioni.type,
      body: obj
    }).then(function (resp) {
      res.status(200).send({ result: 'Segnalazione inserita correttamente' });
    }).catch(function (err) {
      res.status(err.statusCode).send({ error: err });
    });
  });

router.post("/checkAsset", verifyToken, function(req, res) {
  const obj = req.body;

  var body = bodybuilder();

  // body.rawOption("_source", [
  //   "id_doc", 
  //   "dati_istanza.indirizzo_segnale_indicatore.indirizzo", 
  //   "dati_istanza.indirizzo_segnale_indicatore.location",
  //   "stato_pratica"
  // ]);

  if(obj.id_doc)
    body.filter("match", "id_doc", obj.id_doc);

  if (obj.tag_rfid) 
    body.filter('match_phrase', 'tag_rfid', obj.tag_rfid.toLocaleLowerCase());

  if(obj.debug != true) {
    body.filter("geo_distance", {
      distance: "50m",
      "dati_istanza.indirizzo_segnale_indicatore.location": {
        lat: obj.lat,
        lon: obj.lon
      }
    });
  }

  db.client.search(
    {
      index: config.mapping.passicarrabili.index,
      type: config.mapping.passicarrabili.type,
      from: 0,
      size: 9999,
      body: body.build()
    }
  ).then(async function (resp) {
    var JSONresults = {};
    JSONresults.result =  resp['hits']['hits'].map(function (i) {
        return i['_source'];
    });

    if(JSONresults.result.length == 0) {
      let resGetPratica = await getPratica(obj.id_doc, obj.tag_rfid)
      JSONresults.result = resGetPratica.result;
      JSONresults.violation = { 
        isValid: false, 
        reason: resGetPratica.result.length == 0 ? "Pratica non presente nel sistema" : "Le coordinate del cartello di passo carrabile non coincidono con quelle della richiesta di concessione" 
      };
    } else {
      //Condizioni aggiuntive per segnalare eventuali violazioni
      let pratica = JSONresults.result[0];

      if(pratica.stato_pratica != statoPratica.StatoPraticaPassiCarrabiliEnum["Concessione valida"])
        JSONresults.violation = { 
          isValid: false, 
          reason: "La concessione non è valida" 
        };
      else {
        JSONresults.violation = { isValid: true };
      }
    }
    
    res.status(200).send(JSONresults);
  }).catch(function (err) {
      res.status(err.statusCode).send({ error: err });
  });
});

function getPratica(id_doc, tag_rfid) {
  return new Promise(async function(resolve, reject) {
    let querybuilder = bodybuilder();

    if(id_doc)
      querybuilder.filter("term", "id_doc", id_doc);
  
    if (tag_rfid) 
      querybuilder.filter('match_phrase', 'tag_rfid', tag_rfid.toLocaleLowerCase());
    
    db.client.search(
      {
        index: config.mapping.passicarrabili.index,
        type: config.mapping.passicarrabili.type,
        from: 0,
        size: 9999,
        body: querybuilder.build()
      }
    ).then(async function (resp) {
      var JSONresults = {};
      JSONresults.result =  resp['hits']['hits'].map(function (i) {
          return i['_source'];
      });
  
      resolve(JSONresults);
    }).catch(function (err) {
      reject({ err: err, message: "Errore nel ritrovamento della pratica"});
    });
  });
}

router.post("/setDataVerificaCartello", verifyToken, function(req, res) {
  const id_doc = req.body.id_doc;

  db.client.get({
      index: config.mapping.passicarrabili.index,
      type: config.mapping.passicarrabili.type,
      id: id_doc
  }).then(function (resp){
    var pratica = resp._source;
    pratica.data_check_cartello = formatter.formatDateTime();

    db.client.update({
      index: config.mapping.passicarrabili.index,
      type: config.mapping.passicarrabili.type,
      id: id_doc,
      body: {
        doc:{            
          data_check_cartello: pratica.data_check_cartello          
        }
      }
    }).then((resp) =>{
      res.status(200).send({ message: "Data di controllo cartello impostata", data: pratica });
    }).catch((err) => {
      console.log('API: setDataVerificaCartello - update pratica');
      res.status(err.status).send({ err: err, message: "Errore di sistema" });
    });  
  }).catch(function (err) {
    console.log('API: setDataVerificaCartello - get pratica');
    res.status(err.status).send({ err: err, message: "Errore di sistema" }); 
  });

});

module.exports = router;
