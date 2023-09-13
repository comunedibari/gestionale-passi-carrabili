var app = require("./app");
var api = require("./api");
var elastic = require("./elasticsearch");
var port = process.env.PORT || 80;
var portApi = process.env.PORT || 8080;
var portElastic = process.env.PORT || 5000;
var db = require('./db');
var bcrypt = require('bcryptjs');
var config = require('./config');
var utility = require('./shared/utility/formatter');
var groupEnum = require("./shared/enums/group.enum.js");

require('log-timestamp');

searchAdmin(function(hasAdmin) {

  console.time('Gestionale Passi Carrabili avviato in');
  console.info(`Avvio Gestionale Passi Carrabili...`);
  console.info(`
    # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # 
    #                _____         _____          ______                    #
    #               / ____|       |  __ \         /  ____|                   #
    #              | |  __        | |__) |       | |                        #
    #              | | |_ |       |  ___/        | |                        #
    #              | |__| |  _    | |       _    | |____   _                #
    #              |______| (_)   |_|      (_)   |______| (_)               #
    #                                                                       #
    #                     Gestionale Passi Carrabili                        #
    #                                                                       #
    # # # # # # # # # # #  Powered By Almaviva S.p.A. # # # # # # # # # # # #
  `);

  if(!hasAdmin){
    createAdmin();
  }

  if (app) {
    var serverApp = app.listen(port, function() {
      console.log("Express server listening on port " + port);
    });
  }
  var serverApi = api.listen(portApi, function() {
    console.log("Express server listening on port " + portApi);
  });

  var serverElastic = elastic.listen(portElastic, function() {
    console.log("Elastic server listening on port " + portElastic);
  });

  console.timeEnd('Gestionale Passi Carrabili avviato in');
})

function searchAdmin(callback) {
  db.client.get({
    index: config.mapping.utenti.index,
    type: config.mapping.utenti.type,
    id: "admin"
  }).then((resp) => {
    callback(true);
  }).catch((err) => {
    if(err.status != 404)
      console.log("Errore: " + err);
    else
      console.log("Info: prima inizializzazione app in corso...");
    callback(false);
  });
}

function createAdmin() {
  var hash = bcrypt.hashSync("admin");
  var lastLogin = utility.formatDateTime();

  //creazione utente admin di sistema
  db.client.index({
    index: config.mapping.utenti.index,
    type: config.mapping.utenti.type,
    id: 'admin',
    body: { 
      "cognome" : "Admin",
      "email" : "info.comune.ba@gmail.com",
      "group_id" : groupEnum.GroupEnum.Admin,
      "lastLogin" : lastLogin,
      "nome" : "Admin",
      "password": hash,
      "username" : "admin",
      "sesso" : 'M',
      "datadinascita" : '2019-01-01',
      "luogodinascita" : 'Bari',
      "provinciadinascita" : 'BA',
      "codicefiscale" : 'DMNDMN19A01A662F',
      "numtel" : '1111111111',
      "enabled": true
    }
  }).then(function (err, resp, status) {}); 

  //creazione profilo utente admin di sistema
  db.client.index({
    index: config.mapping.gruppi.index,
    type: config.mapping.gruppi.type,
    id: groupEnum.GroupEnum.Admin,
    body: {
      "id": groupEnum.GroupEnum.Admin,
      "auth.inserisciRichiesta": true,
      "auth.praticheBozza": true,
      "auth.concessioniValide": true,
      "auth.fascicolo": true,
      "auth.presaInCarico": true,
      "auth.validazionePratiche": true,
      "auth.rielaborazionePareri": true,
      "auth.praticheApprovate": true,
      "auth.attesaPagamento": true,
      "auth.ritiroRilascio": true,
      "auth.praticheDaRigettare": true,
      "auth.praticheArchiviate": true,
      "auth.praticheRigettate": true,
      "auth.praticheRevocate": true,
      "auth.regolarizzazione": true,
      "auth.storicoPratiche": true,
      "auth.segnalazioni": true,
      "auth.aggiungiTagRfid": true,
      "auth.gestioneAsset": true,
      "auth.gestioneFeature": true,
      "auth.statisticheAsset": true,
      "auth.statistiche": true,
      "auth.auditLog": true,
      "auth.gestioneUtenti": true,
      "auth.templates": true,
      "auth.ilMioProfilo": true
    }
  }).then(function (err, resp, status) {});

  //creazione profilazione utenze GPC
  db.client.index({
    index: config.mapping.gruppi.index,
    type: config.mapping.gruppi.type,
    id: groupEnum.GroupEnum.OperatoreSportello,
    body: {
      "id": groupEnum.GroupEnum.OperatoreSportello,
      "auth.inserisciRichiesta": true,
      "auth.praticheBozza": true,
      "auth.concessioniValide": true,
      "auth.fascicolo": true,
      "auth.presaInCarico": false,
      "auth.validazionePratiche": false,
      "auth.rielaborazionePareri": false,
      "auth.praticheApprovate": false,
      "auth.attesaPagamento": true,
      "auth.ritiroRilascio": false,
      "auth.praticheDaRigettare": false,
      "auth.praticheArchiviate": false,
      "auth.praticheRigettate": false,
      "auth.praticheRevocate": false,
      "auth.regolarizzazione": false,
      "auth.storicoPratiche": true,
      "auth.segnalazioni": true,
      "auth.aggiungiTagRfid": true,
      "auth.gestioneAsset": false,
      "auth.gestioneFeature": false,
      "auth.statisticheAsset": false,
      "auth.statistiche": false,
      "auth.auditLog": false,
      "auth.gestioneUtenti": false,
      "auth.templates": false,
      "auth.ilMioProfilo": true
    }
  }).then(function (err, resp, status) {});

  db.client.index({
    index: config.mapping.gruppi.index,
    type: config.mapping.gruppi.type,
    id: groupEnum.GroupEnum.DirettoreMunicipio,
    body: {
      "id": groupEnum.GroupEnum.DirettoreMunicipio,
      "auth.inserisciRichiesta": false,
      "auth.praticheBozza": false,
      "auth.concessioniValide": true,
      "auth.fascicolo": true,
      "auth.presaInCarico": true,
      "auth.validazionePratiche": true,
      "auth.rielaborazionePareri": true,
      "auth.praticheApprovate": true,
      "auth.attesaPagamento": true,
      "auth.ritiroRilascio": true,
      "auth.praticheDaRigettare": true,
      "auth.praticheArchiviate": true,
      "auth.praticheRigettate": true,
      "auth.praticheRevocate": true,
      "auth.regolarizzazione": true,
      "auth.storicoPratiche": false,
      "auth.segnalazioni": true,
      "auth.aggiungiTagRfid": false,
      "auth.gestioneAsset": false,
      "auth.gestioneFeature": false,
      "auth.statisticheAsset": false,
      "auth.statistiche": true,
      "auth.auditLog": false,
      "auth.gestioneUtenti": false,
      "auth.templates": false,
      "auth.ilMioProfilo": true
    }
  }).then(function (err, resp, status) {});

  db.client.index({
    index: config.mapping.gruppi.index,
    type: config.mapping.gruppi.type,
    id: groupEnum.GroupEnum.IstruttoreMunicipio,
    body: {
      "id": groupEnum.GroupEnum.IstruttoreMunicipio,
      "auth.inserisciRichiesta": true,
      "auth.praticheBozza": true,
      "auth.concessioniValide": true,
      "auth.fascicolo": true,
      "auth.presaInCarico": true,
      "auth.validazionePratiche": true,
      "auth.rielaborazionePareri": true,
      "auth.praticheApprovate": true,
      "auth.attesaPagamento": true,
      "auth.ritiroRilascio": true,
      "auth.praticheDaRigettare": true,
      "auth.praticheArchiviate": true,
      "auth.praticheRigettate": true,
      "auth.praticheRevocate": true,
      "auth.regolarizzazione": true,
      "auth.storicoPratiche": true,
      "auth.segnalazioni": true,
      "auth.aggiungiTagRfid": true,
      "auth.gestioneAsset": false,
      "auth.gestioneFeature": false,
      "auth.statisticheAsset": false,
      "auth.statistiche": true,
      "auth.auditLog": false,
      "auth.gestioneUtenti": false,
      "auth.templates": false,
      "auth.ilMioProfilo": true
    }
  }).then(function (err, resp, status) {});

  db.client.index({
    index: config.mapping.gruppi.index,
    type: config.mapping.gruppi.type,
    id: groupEnum.GroupEnum.PoliziaLocale,
    body: {
      "id": groupEnum.GroupEnum.PoliziaLocale,
      "auth.inserisciRichiesta": false,
      "auth.praticheBozza": false,
      "auth.concessioniValide": true,
      "auth.fascicolo": true,
      "auth.presaInCarico": false,
      "auth.validazionePratiche": false,
      "auth.rielaborazionePareri": true,
      "auth.praticheApprovate": false,
      "auth.attesaPagamento": false,
      "auth.ritiroRilascio": false,
      "auth.praticheDaRigettare": false,
      "auth.praticheArchiviate": true,
      "auth.praticheRigettate": true,
      "auth.praticheRevocate": true,
      "auth.regolarizzazione": true,
      "auth.storicoPratiche": false,
      "auth.segnalazioni": true,
      "auth.aggiungiTagRfid": false,
      "auth.gestioneAsset": false,
      "auth.gestioneFeature": false,
      "auth.statisticheAsset": false,
      "auth.statistiche": false,
      "auth.auditLog": false,
      "auth.gestioneUtenti": false,
      "auth.templates": false,
      "auth.ilMioProfilo": true
    }
  }).then(function (err, resp, status) {});

  db.client.index({
    index: config.mapping.gruppi.index,
    type: config.mapping.gruppi.type,
    id: groupEnum.GroupEnum.UfficioTecnicoDecentrato,
    body: {
      "id": groupEnum.GroupEnum.UfficioTecnicoDecentrato,
      "auth.inserisciRichiesta": false,
      "auth.praticheBozza": false,
      "auth.concessioniValide": true,
      "auth.fascicolo": true,
      "auth.presaInCarico": false,
      "auth.validazionePratiche": false,
      "auth.rielaborazionePareri": true,
      "auth.praticheApprovate": false,
      "auth.attesaPagamento": false,
      "auth.ritiroRilascio": false,
      "auth.praticheDaRigettare": false,
      "auth.praticheArchiviate": true,
      "auth.praticheRigettate": true,
      "auth.praticheRevocate": true,
      "auth.regolarizzazione": false,
      "auth.storicoPratiche": false,
      "auth.segnalazioni": false,
      "auth.aggiungiTagRfid": false,
      "auth.gestioneAsset": false,
      "auth.gestioneFeature": false,
      "auth.statisticheAsset": false,
      "auth.statistiche": false,
      "auth.auditLog": false,
      "auth.gestioneUtenti": false,
      "auth.templates": false,
      "auth.ilMioProfilo": true
    }
  }).then(function (err, resp, status) {});

  db.client.index({
    index: config.mapping.gruppi.index,
    type: config.mapping.gruppi.type,
    id: groupEnum.GroupEnum.RipartizioneUrbanistica,
    body: {
      "id": groupEnum.GroupEnum.RipartizioneUrbanistica,
      "auth.inserisciRichiesta": false,
      "auth.praticheBozza": false,
      "auth.concessioniValide": true,
      "auth.fascicolo": true,
      "auth.presaInCarico": false,
      "auth.validazionePratiche": false,
      "auth.rielaborazionePareri": true,
      "auth.praticheApprovate": false,
      "auth.attesaPagamento": false,
      "auth.ritiroRilascio": false,
      "auth.praticheDaRigettare": false,
      "auth.praticheArchiviate": true,
      "auth.praticheRigettate": true,
      "auth.praticheRevocate": true,
      "auth.regolarizzazione": false,
      "auth.storicoPratiche": false,
      "auth.segnalazioni": false,
      "auth.aggiungiTagRfid": false,
      "auth.gestioneAsset": false,
      "auth.gestioneFeature": false,
      "auth.statisticheAsset": false,
      "auth.statistiche": false,
      "auth.auditLog": false,
      "auth.gestioneUtenti": false,
      "auth.templates": false,
      "auth.ilMioProfilo": true
    }
  }).then(function (err, resp, status) {});

  db.client.index({
    index: config.mapping.gruppi.index,
    type: config.mapping.gruppi.type,
    id: groupEnum.GroupEnum.AmministratorePassiCarrabili,
    body: {
      "id": groupEnum.GroupEnum.AmministratorePassiCarrabili,
      "auth.inserisciRichiesta": false,
      "auth.praticheBozza": false,
      "auth.concessioniValide": false,
      "auth.fascicolo": false,
      "auth.presaInCarico": false,
      "auth.validazionePratiche": false,
      "auth.rielaborazionePareri": false,
      "auth.praticheApprovate": false,
      "auth.attesaPagamento": false,
      "auth.ritiroRilascio": false,
      "auth.praticheDaRigettare": false,
      "auth.praticheArchiviate": false,
      "auth.praticheRigettate": false,
      "auth.praticheRevocate": false,
      "auth.regolarizzazione": false,
      "auth.storicoPratiche": false,
      "auth.segnalazioni": false,
      "auth.aggiungiTagRfid": false,
      "auth.gestioneAsset": false,
      "auth.gestioneFeature": false,
      "auth.statisticheAsset": false,
      "auth.statistiche": true,
      "auth.auditLog": false,
      "auth.gestioneUtenti": true,
      "auth.templates": true,
      "auth.ilMioProfilo": true                   
    }
  }).then(function (err, resp, status) {});

  db.client.index({
    index: config.mapping.gruppi.index,
    type: config.mapping.gruppi.type,
    id: groupEnum.GroupEnum.RipartizioneTributi,
    body: {
      "id": groupEnum.GroupEnum.RipartizioneTributi,
      "auth.inserisciRichiesta": false,
      "auth.praticheBozza": false,
      "auth.concessioniValide": true,
      "auth.fascicolo": true,
      "auth.presaInCarico": false,
      "auth.validazionePratiche": false,
      "auth.rielaborazionePareri": false,
      "auth.praticheApprovate": false,
      "auth.attesaPagamento": false,
      "auth.ritiroRilascio": false,
      "auth.praticheDaRigettare": false,
      "auth.praticheArchiviate": false,
      "auth.praticheRigettate": false,
      "auth.praticheRevocate": false,
      "auth.regolarizzazione": false,
      "auth.storicoPratiche": false,
      "auth.segnalazioni": false,
      "auth.aggiungiTagRfid": false,
      "auth.gestioneAsset": false,
      "auth.gestioneFeature": false,
      "auth.statisticheAsset": false,
      "auth.statistiche": false,
      "auth.auditLog": false,
      "auth.gestioneUtenti": false,
      "auth.templates": false,
      "auth.ilMioProfilo": true                   
    }
  }).then(function (err, resp, status) {});

  db.client.index({
    index: config.mapping.gruppi.index,
    type: config.mapping.gruppi.type,
    id: groupEnum.GroupEnum.RipartizioneRagioneria,
    body: {
      "id": groupEnum.GroupEnum.RipartizioneRagioneria,
      "auth.inserisciRichiesta": false,
      "auth.praticheBozza": false,
      "auth.concessioniValide": true,
      "auth.fascicolo": true,
      "auth.presaInCarico": false,
      "auth.validazionePratiche": false,
      "auth.rielaborazionePareri": false,
      "auth.praticheApprovate": false,
      "auth.attesaPagamento": false,
      "auth.ritiroRilascio": false,
      "auth.praticheDaRigettare": false,
      "auth.praticheArchiviate": false,
      "auth.praticheRigettate": false,
      "auth.praticheRevocate": false,
      "auth.regolarizzazione": false,
      "auth.storicoPratiche": false,
      "auth.segnalazioni": false,
      "auth.aggiungiTagRfid": false,
      "auth.gestioneAsset": false,
      "auth.gestioneFeature": false,
      "auth.statisticheAsset": false,
      "auth.statistiche": false,
      "auth.auditLog": false,
      "auth.gestioneUtenti": false,
      "auth.templates": false,
      "auth.ilMioProfilo": true                   
    }
  }).then(function (err, resp, status) {});

  db.client.index({
    index: config.mapping.gruppi.index,
    type: config.mapping.gruppi.type,
    id: groupEnum.GroupEnum.Concessionario,
    body: {
      "id": groupEnum.GroupEnum.Concessionario,
      "auth.inserisciRichiesta": false,
      "auth.praticheBozza": false,
      "auth.concessioniValide": true,
      "auth.fascicolo": true,
      "auth.presaInCarico": false,
      "auth.validazionePratiche": false,
      "auth.rielaborazionePareri": false,
      "auth.praticheApprovate": false,
      "auth.attesaPagamento": false,
      "auth.ritiroRilascio": false,
      "auth.praticheDaRigettare": false,
      "auth.praticheArchiviate": false,
      "auth.praticheRigettate": false,
      "auth.praticheRevocate": false,
      "auth.regolarizzazione": false,
      "auth.storicoPratiche": false,
      "auth.segnalazioni": false,
      "auth.aggiungiTagRfid": false,
      "auth.gestioneAsset": false,
      "auth.gestioneFeature": false,
      "auth.statisticheAsset": false,
      "auth.statistiche": false,
      "auth.auditLog": false,
      "auth.gestioneUtenti": false,
      "auth.templates": false,
      "auth.ilMioProfilo": true                   
    }
  }).then(function (err, resp, status) {});

  db.client.index({
    index: config.mapping.gruppi.index,
    type: config.mapping.gruppi.type,
    id: groupEnum.GroupEnum.PoliziaLocaleControlliSulTerritorio,
    body: {
      "id": groupEnum.GroupEnum.PoliziaLocaleControlliSulTerritorio,
      "auth.inserisciRichiesta": false,
      "auth.praticheBozza": false,
      "auth.concessioniValide": true,
      "auth.fascicolo": true,
      "auth.presaInCarico": false,
      "auth.validazionePratiche": false,
      "auth.rielaborazionePareri": false,
      "auth.praticheApprovate": false,
      "auth.attesaPagamento": false,
      "auth.ritiroRilascio": false,
      "auth.praticheDaRigettare": false,
      "auth.praticheArchiviate": true,
      "auth.praticheRigettate": true,
      "auth.praticheRevocate": true,
      "auth.regolarizzazione": false,
      "auth.storicoPratiche": false,
      "auth.segnalazioni": true,
      "auth.aggiungiTagRfid": false,
      "auth.gestioneAsset": false,
      "auth.gestioneFeature": false,
      "auth.statisticheAsset": false,
      "auth.statistiche": false,
      "auth.auditLog": false,
      "auth.gestioneUtenti": false,
      "auth.templates": false,
      "auth.ilMioProfilo": true                   
    }
  }).then(function (err, resp, status) {});

  db.client.index({
    index: config.mapping.configurations.index,
    type: config.mapping.configurations.type,
    id: "hub_pagamenti",
    body: {
      "id": "hub_pagamenti",
      "codCapitolo_cauzione_infruttifera": "12194",
      "codCapitolo_costo_segnale_indicatore": "12194",
      "datiSpecificiRiscossione": "9/0115105AP/",
      "cauzione_infruttifera": 77.47,
      "costo_segnale_indicatore": 9.87,
      "codUfficio_municipio_1": 12,
      "codUfficio_municipio_2": 13,
      "codUfficio_municipio_3": 14,
      "codUfficio_municipio_4": 15,
      "codUfficio_municipio_5": 16
    }
  }).then(function (err, resp, status) {});

  db.client.index({
    index: config.mapping.configurations.index,
    type: config.mapping.configurations.type,
    id: "uo_protocollo",
    body: {
      "id": "uo_protocollo",
      "municipio_1": {
        "uoid": "3668",
        "denominazione": "Ufficio di Ricezione (Municipio 1)",
		    "group_id": [groupEnum.GroupEnum.DirettoreMunicipio, groupEnum.GroupEnum.IstruttoreMunicipio, groupEnum.GroupEnum.OperatoreSportello],
        "municipio_id": 1
      }, 
      "municipio_2": {
        "uoid": "3669",
        "denominazione": "Ufficio di Ricezione (Municipio 2)",
		    "group_id": [groupEnum.GroupEnum.DirettoreMunicipio, groupEnum.GroupEnum.IstruttoreMunicipio, groupEnum.GroupEnum.OperatoreSportello],
        "municipio_id": 2
      },  
      "municipio_3": {
        "uoid": "3670",
        "denominazione": "Ufficio di Ricezione (Municipio 3)",
		    "group_id": [groupEnum.GroupEnum.DirettoreMunicipio, groupEnum.GroupEnum.IstruttoreMunicipio, groupEnum.GroupEnum.OperatoreSportello],
        "municipio_id": 3
      },
      "municipio_4": {
        "uoid": "3671",
        "denominazione": "Ufficio di Ricezione (Municipio 4)",
		    "group_id": [groupEnum.GroupEnum.DirettoreMunicipio, groupEnum.GroupEnum.IstruttoreMunicipio, groupEnum.GroupEnum.OperatoreSportello],
        "municipio_id": 4
      },
      "municipio_5": {
        "uoid": "3672",
        "denominazione": "Ufficio di Ricezione (Municipio 5)",
		    "group_id": [groupEnum.GroupEnum.DirettoreMunicipio, groupEnum.GroupEnum.IstruttoreMunicipio, groupEnum.GroupEnum.OperatoreSportello],
        "municipio_id": 5
      },
      "polizia_locale": {
        "uoid": "3673",
        "denominazione": "Ufficio di Ricezione (Rip. Corpo di Polizia Municipale e Protezione Civile)",
		    "group_id": [groupEnum.GroupEnum.PoliziaLocale],
        "municipio_id": null																
      },
      "utd": {
        "uoid": "3675",
        "denominazione": "POS Uffici Tecnici Decentrati",
		    "group_id": [groupEnum.GroupEnum.UfficioTecnicoDecentrato],
        "municipio_id": null	
      },
      "ragioneria": {
        "uoid": "3674",
        "denominazione": "Ufficio di Ricezione (Rip. Ragioneria Generale)",
		    "group_id": [groupEnum.GroupEnum.RipartizioneRagioneria],
        "municipio_id": null			
      },
      "urbanistica": {
        "uoid": "3901",
        "denominazione": "Ufficio di Ricezione (Rip. Urbanistica ed Edilizia Privata)",
		    "group_id": [groupEnum.GroupEnum.RipartizioneUrbanistica],
        "municipio_id": null		
      },
      "tributi": {
        "uoid": "3950",
        "denominazione": "Ufficio di Ricezione (Rip. Tributi)",
		    "group_id": [groupEnum.GroupEnum.RipartizioneTributi],
        "municipio_id": null																		
      }
    }
  }).then(function (err, resp, status) {});
}

