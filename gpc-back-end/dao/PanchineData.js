var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var db = require('../db');
var config = require('../config');
router.use(express.json({ limit: '20mb', extended: true }));
router.use(express.urlencoded({ limit: "20mb", extended: true }));

function getModelliPanchina(req, res) {
    db.client.search({
        index: config.mapping.modelloPanchina.index,
        type: config.mapping.modelloPanchina.type,
        "from": 0, "size": 9999,
        body: {
            sort: [
                {"_id" : {"order" : "asc"}}
              ]
        }
    }).then(function (resp) {
        var JSONresults = {}
        JSONresults.data = resp['hits']['hits'].map(function (i) {
            return i['_source'];
        });

        JSONresults.notFound = resp.hits.total.value == 0;
        res.status(200).send(JSONresults);
    }).catch(function (err) {
        res.status(err.statusCode).send(err);
    });
}

function inserisciModelloPanchina(req, res, obj) {

    db.client.count({
        index: config.mapping.modelloPanchina.index,
        type: config.mapping.modelloPanchina.type,
        body: {}      
    }).then(function (resp) {
        let id = resp.count;
        db.client.create({
            index: config.mapping.modelloPanchina.index,
            type: config.mapping.modelloPanchina.type,
            id: id,
            body: {
                idModello: id,
                etichettaModello: obj.etichettaModello,
                descrizioneModello: obj.descrizioneModello
            }
        })
        .then(function (obj) {
            res.status(200).send(obj);
        }).catch((err) => {
            res.status(err.statusCode).send({ err: err, message: "Modello con id " + obj.idModello + " già esistente" });
        });

    }).catch((err) => {
        res.status(err.statusCode).send({ err: err });
    });
}

function getStatiPanchina(req, res) {
    db.client.search({
        index: config.mapping.statoPanchina.index,
        type: config.mapping.statoPanchina.type,
        "from": 0, "size": 9999,
        body: {
            sort: [
                {"_id" : {"order" : "asc"}}
              ]
        }
    }).then(function (resp) {
        var JSONresults = {}
        JSONresults.data = resp['hits']['hits'].map(function (i) {
            return i['_source'];
        });

        JSONresults.notFound = resp.hits.total.value == 0;
        res.status(200).send(JSONresults);
    }).catch(function (err) {
        res.status(err.statusCode).send(err);
    });
}

function getContestiPanchina(req, res) {
    db.client.search({
        index: config.mapping.contestoPanchina.index,
        type: config.mapping.contestoPanchina.type,
        "from": 0, "size": 9999,
        body: {
            sort: [
                {"_id" : {"order" : "asc"}}
              ]
        }
    }).then(function (resp) {
        var JSONresults = {}
        JSONresults.data = resp['hits']['hits'].map(function (i) {
            return i['_source'];
        });

        JSONresults.notFound = resp.hits.total.value == 0;
        res.status(200).send(JSONresults);
    }).catch(function (err) {
        res.status(err.statusCode).send(err);
    });
}

function getPanchine(req, res) {
    db.client.search({
        index: config.mapping.panchine.index,
        type: config.mapping.panchine.type,
        "from" : 0, "size": 9999,
        body: {
            _source: { 
                exclude: [ "asset.image" ] 
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
    console.log('API: getPanchine');
    res.status(err.status).send({ err: err, message: "Errore di sistema" }); 
    });
};

function getPanchina(req, res, id) {
    db.client.get({
        index: config.mapping.panchine.index,
        type: config.mapping.panchine.type,
        id: id
    }).then(function (resp){
        res.status(200).send(resp._source);
    }).catch(function (err) {
    console.log('API: getPanchina');
    res.status(err.status).send({ err: err, message: "Errore di sistema" }); 
    });
};

function inserisciPanchina(req, res, obj) {
      db.client.create({
        index: config.mapping.panchine.index,
        type: config.mapping.panchine.type,
        id: obj.asset.id_tag,
        body: obj
      }).then((resp) => {
      
        res.status(200).send({ message: "Inserimento panchina avvenuto correttamente." });
      }).catch((err) => {
        console.log('API: inserisciPanchina');
        let errorMessage = err.status == 409 ? 'ID Panchina già esistente' : 'Errore di sistema'; 
        res.status(err.status).send({ err: err, message: errorMessage });
      });
};

function aggiornaPanchina(req, res, asset) {
    db.client.update(
    {
        index: config.mapping.panchine.index,
        type: config.mapping.panchine.type,
        id: asset.id_tag,
        body: {
            doc: {
                asset
            }
        }
    }).then((resp) => {
        res.status(200).send({ message: "Aggiornamento dati avvenuto correttamente." });
    }).catch((err) => {
        console.log('API: aggiornaPanchina');
        res.status(err.status).send({ err: err, message: "Errore di sistema" });
    });
};

function eliminaPanchina(req, res, id) {

    db.client.delete({
        index: config.mapping.panchine.index,
        type: config.mapping.panchine.type,
        id: id
    }).then((resp) => {
        res.status(200).send({ message: "La panchina è stata eliminata" });
    }).catch((err) => {
        console.log('API: eliminaPanchina');
        res.status(err.status).send({ message: "Errore di sistema" });
    });
};

function saveImagesFromLocalDir(req, res, id, imageBase64) {
    db.client.update(
    {
        index: config.mapping.panchine.index,
        type: config.mapping.panchine.type,
        id: id,
        body: {
            doc: {
                asset: {
                    image: imageBase64
                }
            }
        }
    }).then((resp) => {
        console.log('Immagine salvata: ' + id);
    }).catch((err) => {
        console.log('Immagine non salvata: ' + id);
    });
};

module.exports = {
    getModelliPanchina,
    inserisciModelloPanchina,
    getStatiPanchina,
    getContestiPanchina,
    getPanchine,
    getPanchina,
    inserisciPanchina,
    aggiornaPanchina,
    eliminaPanchina,
    saveImagesFromLocalDir
};