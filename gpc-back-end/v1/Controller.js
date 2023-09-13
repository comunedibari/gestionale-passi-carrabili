var express = require("express");
var router = express.Router();
var bodyParser = require("body-parser");
var db = require("../db");
var bcrypt = require("bcryptjs");
var async = require("async");
var config = require("./../config");
var bodybuilder = require("bodybuilder");
var segnalazioni = require("./violations");
var esb = require("./esb");
var verifyToken = require('../auth/VerifyToken');
router.use(express.json({ limit: '20mb', extended: true }));
router.use(express.urlencoded({ limit: "20mb", extended: true }));
var statoPratica = require("../shared/enums/stato-pratica.enum.js");

var panchina = require("./assets/panchina");
var panchineInternalController = require("../controller/PanchineController");

router.use("/civico" ,require("./civico"));
router.use(segnalazioni);
router.use("/esb", esb);

router.use(panchina); //DA RIMUOVERE NON APPENA ARMANDO ADEGUA LE API
router.use(panchineInternalController);

router.get("/getPoi", verifyToken, function(req, res) {

  const obj = {
    lat: 41.12,
    lon: 16.85,
    distance: "100km",
    isValid: true
  };

  db.client.search(
    {
      index: config.mapping.passicarrabili.index,
      type: config.mapping.passicarrabili.type,
      from: 0,
      size: 9999,
      body: {
        _source: ["id_doc", "dati_istanza.indirizzo_segnale_indicatore.indirizzo", "dati_istanza.indirizzo_segnale_indicatore.location"],
        query: {
          bool: {
            filter: {
              geo_distance: {
                distance: obj.distance,
                "dati_istanza.indirizzo_segnale_indicatore.location": {
                  lat: obj.lat,
                  lon: obj.lon
                }
              }
            }
          }
        }
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

router.post("/getPoi", verifyToken, function(req, res) {
  const obj = req.body;

  db.client.search(
    {
      index: config.mapping.passicarrabili.index,
      type: config.mapping.passicarrabili.type,
      from: 0,
      size: 9999,
      body: {
        _source: ["id_doc", "dati_istanza.indirizzo_segnale_indicatore.indirizzo", "dati_istanza.indirizzo_segnale_indicatore.location","stato_pratica"],
        query: {
          bool: {
            filter: {
              geo_distance: {
                distance: obj.distance,
                "dati_istanza.indirizzo_segnale_indicatore.location": {
                  lat: obj.lat,
                  lon: obj.lon
                }
              }
            }
          }
        }
      }
    }).then(function (resp) {
      let result =  resp['hits']['hits'].map(function (i) {
          return i['_source'];
      });

      if(obj.isValid != null){
        if(obj.isValid == true)
          result = result.filter(x => x.stato_pratica == statoPratica.StatoPraticaPassiCarrabiliEnum["Concessione valida"]);
        else
          result = result.filter(x => x.stato_pratica != statoPratica.StatoPraticaPassiCarrabiliEnum["Concessione valida"]);
      }      

      res.status(200).send({ result: result });
    }).catch(function (err) {
        res.status(err.statusCode).send({ error: err });
    });
  });

module.exports = router;
