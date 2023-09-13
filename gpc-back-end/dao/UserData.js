var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var db = require('../db');
var config = require('../config');
var bcrypt = require('bcryptjs');
router.use(express.json({ limit: '20mb', extended: true }));
router.use(express.urlencoded({ limit: "20mb", extended: true }));
var group = require("../shared/enums/group.enum.js");

function getUsers(req, res, query) {

  db.client.search({
    index: config.mapping.utenti.index,
    type: config.mapping.utenti.type,
    "from": 0, "size": 9999,
    body: query
  }).then(function (resp) {
    var JSONresults = {}
    JSONresults.data = resp['hits']['hits'].map(function (i) {
      return i['_source'];
    });

    JSONresults.notFound = resp.hits.total.value == 0;
    res.status(200).send(JSONresults);
  }).catch(function (err) {
    console.log('API: getUsers');
    res.status(err.status).send({ err: err, message: "Errore di sistema" });
  });
}

function getUsersConcessionario(req, res, query) {
  db.client.search({
    index: config.mapping.utenti.index,
    type: config.mapping.utenti.type,
    "from": 0, "size": 9999,
    body: query
  }).then(function (resp) {
    var JSONresults = {}
    JSONresults.data = resp['hits']['hits'].map(function (i) {
      return i['_source'];
    });

    JSONresults.notFound = resp.hits.total.value == 0;
    res.status(200).send(JSONresults);
  }).catch(function (err) {
    console.log('API: getUsersConcessionario');
    res.status(err.status).send({ err: err, message: "Errore di sistema" });
  });
}

function disableUsersConcessionario(req, res, query) {
  var newUsername = req.params.username;
  db.client.get({
    index: config.mapping.utenti.index,
    type: config.mapping.utenti.type,
    id: newUsername
  }).then((resp) => {
    res.status(409).send({ resp: resp._source, message: "Username già in uso nel sistema" });
  }).catch((err) => {
    db.client.updateByQuery({
      index: config.mapping.utenti.index,
      type: config.mapping.utenti.type,
      body: {
        script: {
          inline: "ctx._source.enabled=false;"
        },
        query: query.query
      } 
    }).then((resp) => {
      res.status(200).send({ message: "L'utente concessionario è stato disabilitato" });
    }).catch((err) => {
      console.log('API: disableUsersConcessionario');
      res.status(err.status).send({ message: "Errore durante la disabilitazione dell'utente concessionario" });
    });
  });
}

function getUser(req, res) {

  db.client.get({
    index: config.mapping.utenti.index,
    type: config.mapping.utenti.type,
    id: req.params.username
  }).then((resp) => {
    res.status(200).send(resp._source);
  }).catch((err) => {
    console.log('API: getUser');
    res.status(err.status).send({ err: err, message: "Utente non trovato" });
  });
}

function inserisciUtente(req, res, newuser, query) {

  db.client.search({
    index: config.mapping.utenti.index,
    type: config.mapping.utenti.type,
    body: query
  }).then((response) => {
    if(response.hits.hits.length > 0)
      res.status(409).send({ message: "Codice fiscale già censito nel sistema" });
    else {
      db.client.create({
        index: config.mapping.utenti.index,
        type: config.mapping.utenti.type,
        id: newuser.username,
        body: newuser
      }).then((resp) => {
        res.status(200).send({ obj: newuser, message: "Utente inserito correttamente" });
      }).catch((err) => {
        console.log('API: inserisciUtente');
        res.status(err.status).send({ err: err, message: err.status == 409 ? "Username già in uso nel sistema" : "Errore durante l'inserimento dell'utente" });
      });
    }
  }).catch((err) => {
    console.log('API: inserisciUtente');
    res.status(err.status).send({ err: err, message: "Errore durante l'inserimento dell'utente" });
  });
}

function modificaDatiUtente(req, res, user) {
  db.client.update({
    index: config.mapping.utenti.index,
    type: config.mapping.utenti.type,
    id: user.username,
    body: {
      doc: {
        nome: user.nome,
        cognome: user.cognome,
        sesso: user.sesso,
        datadinascita: user.datadinascita,
        luogodinascita: user.luogodinascita,
        codicefiscale: user.codicefiscale,
        email: user.email,
        numtel: user.numtel,
        group_id: user.group_id,
        enabled: user.enabled,
        provinciadinascita: user.provinciadinascita,
        municipio_id: user.municipio_id,
        indirizzo: user.indirizzo,
        uoid: user.uoid,
        denominazione: user.denominazione,
        ragioneSociale: user.ragioneSociale,
        deleted: user.deleted
      }
    }
  }).then((resp) => {
    res.status(200).send({ message: "Dati dell'utente aggiornati correttamente" });
  }).catch((err) => {
    console.log('API: modificaDatiUtente');
    res.status(err.status).send({ message: "Errore durante l'aggiornamento dei dati" });
  });
}

function cambiaPasswordUtente(req, res, user, hash, oldPassword) {

  db.client.get({
    index: config.mapping.utenti.index,
    type: config.mapping.utenti.type,
    id: user.username
  }).then((docUser) => {
    if (bcrypt.compareSync(oldPassword, docUser._source.password)) {
      db.client.update({
        index: config.mapping.utenti.index,
        type: config.mapping.utenti.type,
        id: user.username,
        body: {
          doc: {
            password: hash
          }
        }
      }).then((resp) => {
        res.status(200).send({ message: "Password aggiornata correttamente" });
      }).catch((err) => {
        res.status(err.status).send({ message: "Errore durante l'aggiornamento della password" });
      });
    } else {
      res.status(200).send({ err: 'error', message: "La vecchia password inserita è errata" });
    }
  }).catch((err) => {
    res.status(err.status).send({ err: err, message: "Utente non trovato" });
  });
}

function deleteUser(req, res, user) {
  db.client.update({
    index: config.mapping.utenti.index,
    type: config.mapping.utenti.type,
    id: user.username,
    body: {
      doc: {
        enabled: false,
        deleted: true
      }
    }
  }).then((resp) => {
    res.status(200).send({ message: "L'utente è stato cancellato" });
  }).catch((err) => {
    console.log('API: deleteUser');
    res.status(err.status).send({ message: "Errore durante la cancellazione dell'utente" });
  });
}

function cercaCittadino(req, res, query) {
  db.client.search({
    index: config.mapping.utenti.index,
    type: config.mapping.utenti.type,
    body: query
  }).then(function (resp){
    var JSONresults = {}
    JSONresults.data = resp['hits']['hits'].map(function (i) {
      return i['_source'];  
    });
  
    JSONresults.notFound = resp.hits.total.value == 0;
    res.status(200).send(JSONresults);
  }).catch(function (err) {
    console.log('API: cercaCittadino');
    res.status(err.status).send({ err: err, message: "Errore di sistema" });
  });
}

module.exports = {
  getUsers,
  inserisciUtente,
  modificaDatiUtente,
  cambiaPasswordUtente,
  getUser,
  deleteUser,
  cercaCittadino,
  getUsersConcessionario,
  disableUsersConcessionario
};