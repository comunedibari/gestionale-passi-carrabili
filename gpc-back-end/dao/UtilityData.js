var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var bodybuilder = require('bodybuilder');
var db = require('../db');
var config = require('../config');
var template = require("../shared/utility/template-documenti.js");
var groupEnum = require("../shared/enums/group.enum.js");
var fs = require('fs');
router.use(express.json({ limit: '20mb', extended: true }));
router.use(express.urlencoded({ limit: "20mb", extended: true }));

function takeEmails(req, res, query) {
  db.client.search({  
    index: config.mapping.utenti.index,
    type: config.mapping.utenti.type,
    "from" : 0, "size": 9999,
    body: {
      _source: { include: [ "email", "group_id", "enabled" ]}, 
      query: query.query
    }
  }).then(function (resp){
    var JSONresults = {}
    JSONresults.data = resp['hits']['hits'].map(function (i) {
      return i['_source'];
    });

    JSONresults.data = JSONresults.data.filter(x => x.enabled == true);
    JSONresults.notFound = resp.hits.total.value == 0;
    res.status(200).send(JSONresults);
  }).catch(function (err) {
    console.log('API: takeEmails');
    res.status(err.status).send({ err: err, message: "Errore di sistema" });
  });
}

function takeEmailsSync(query) {
  return new Promise(function(resolve, reject) {
    db.client.search({  
      index: config.mapping.utenti.index,
      type: config.mapping.utenti.type,
      "from" : 0, "size": 9999,
      body: {
        _source: "email",
        query: query.query
      }
    }).then(function (resp){
      var JSONresults = {}
      JSONresults.data = resp['hits']['hits'].map(function (i) {
        return i['_source'];
      });
  
      resolve(JSONresults.data);
    }).catch(function (err) {
      console.log('API: takeEmailsSync');
      reject(err);
    });
  });
}

function takeTemplateSync(fileName) {
  return new Promise(function(resolve, reject) {
    db.client.get({  
      index: config.mapping.templates.index,
      type: config.mapping.templates.type,
      id: fileName
    }).then(function (resp){
      resolve(resp._source);
    }).catch(function (err) {
      console.log('API: takeTemplateSync');
      reject(err); 
    });
  });
}

function checkTemplateDocumenti(req, res) {
  db.client.count({
    index: config.mapping.templates.index,
    type: config.mapping.templates.type   
  }).then(async function (resp) {
    let count = resp.count;
    if(count == 0) {
      console.log("Inizializzazione template documenti...");

      let mapResult = template.templateDocumentiSchema.map(function (template) {
        var filePath = `${global.__root}/assets/templates/${template.id}.docx`;
        template.blob += fs.readFileSync(filePath, {encoding: 'base64'});

        return db.client.index({
            index: config.mapping.templates.index,
            type: config.mapping.templates.type,
            id: template.id,
            body: template     
          }).then(function(resp) {     
            delete template.blob;
            return template;
          }).catch((err)=>{
              console.log(err);
          });
      });

      Promise.all(mapResult).then(function(result) {    
        console.log("Inizializzazione template documenti ultimata");
        var JSONresults = {};   
        //NOTA: ESCLUDE I DOCUMENTI RELATIVI ALLA PROTOCOLLAZIONE DALL'ELENCO DEI DOCUMENTI MODIFICABILI
        JSONresults.data = result.filter(el => el.id != "templateInserimentoPratica" && el.id != "templateProtocolloPratica");
        JSONresults.notFound = result.length == 0;
        res.status(200).send(JSONresults);
      });
    }
    else {
      getTemplateDocumenti(req, res);
    }
  }).catch((err) => {
    console.log('API: checkTemplateDocumenti');
    res.status(err.status).send({ err: err, message: "Errore di sistema" });
  });
}

function getTemplateDocumenti(req, res) {
  db.client.search({
    index: config.mapping.templates.index,
    type: config.mapping.templates.type,
    "from" : 0, "size": 9999,
    body: {
      _source: { 
          exclude: [ "blob" ] 
      },
      query: { //NOTA: ESCLUDE I DOCUMENTI RELATIVI ALLA PROTOCOLLAZIONE DALL'ELENCO DEI DOCUMENTI MODIFICABILI
        bool: {
          must_not: [
            {
              match: {
                id: "templateInserimentoPratica"
              }
            },
            {
              match: {
                id: "templateProtocolloPratica"
              }
            }
          ]
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
      console.log('API: getTemplateDocumenti');
      res.status(err.status).send({ err: err, message: "Errore di sistema" }); 
  });
}

function getTemplateDocumento(req, res, id) {
  db.client.get({  
    index: config.mapping.templates.index,
    type: config.mapping.templates.type,
    id: id
  }).then(function (resp){
    res.status(200).send(resp._source);
  }).catch(function (err) {
    console.log('API: getTemplateDocumento');
    res.status(err.status).send({ err: err, message: "Errore di sistema" }); 
  });
}

function uploadTemplateDocumento(req, res, template) {
  db.client.index({
    index: config.mapping.templates.index,
    type: config.mapping.templates.type,
    id: template.id,
    body: template
  }).then((resp) => {
    res.status(200).send({ template: template, message: "Template documento aggiornato." });
  }).catch((err) => {
    console.log(`API: uploadTemplateDocumento`);
    res.status(err.status).send({ err: err, message: "Errore di sistema" });
  });
}

function getRagioneSocialeDestinatariSync(req, res, query) {
  return new Promise(function(resolve, reject) {
    db.client.search({  
      index: config.mapping.utenti.index,
      type: config.mapping.utenti.type,
      "from" : 0, "size": 9999,
      body: {
        _source: { include: [ "ragioneSociale", "codicefiscale", "group_id", "enabled", "uoid", "denominazione" ]}, 
        query: query.query
      }
    }).then(function (resp){
      var JSONresults = {}
      JSONresults.data = resp['hits']['hits'].map(function (i) {
        return i['_source'];
      });

      JSONresults.data = JSONresults.data.filter(x => x.enabled == true);
      
      resolve(JSONresults.data);
    }).catch(function (err) {
      console.log('API: getRagioneSocialeDestinatariSync');
      reject(err);
    });
  });
}

function getUOID(req, res, id) {
  db.client.get({  
    index: config.mapping.configurations.index,
    type: config.mapping.configurations.type,
    id: 'uo_protocollo'
  }).then(function (resp){
    let value = resp._source[id];
    res.status(200).send(value);
  }).catch(function (err) {
    console.log('API: getUOID');
    res.status(err.status).send({ err: err, message: "Errore di sistema" }); 
  });
}

function getConfigurations(req, res) {
  db.client.search({  
    index: config.mapping.configurations.index,
    type: config.mapping.configurations.type,
    "from" : 0, "size": 9999,
  }).then(function (resp){
    var JSONresults = {}
    JSONresults.data = resp['hits']['hits'].map(function (i) {
      return i['_source'];
    });

    JSONresults.notFound = resp.hits.total.value == 0;
    res.status(200).send(JSONresults);
  }).catch(function (err) {
    console.log('API: getConfigurations');
    res.status(err.status).send({ err: err, message: "Errore di sistema" }); 
  });
} 

function getConfiguration(req, res, id) {
  db.client.get({  
    index: config.mapping.configurations.index,
    type: config.mapping.configurations.type,
    id: id
  }).then(function (resp){
    res.status(200).send(resp._source);
  }).catch(function (err) {
    console.log('API: getConfiguration');
    res.status(err.status).send({ err: err, message: "Errore di sistema" }); 
  });
} 

function updateConfiguration(req, res, configuration) {
  db.client.index({
    index: config.mapping.configurations.index,
    type: config.mapping.configurations.type,
    id: configuration.id,
    body: configuration
  }).then((resp) => {

    if(configuration.id == 'uo_protocollo') {
      let keys = Object.keys(configuration);
      keys = keys.filter(el => el != 'id');

      let mapResult = keys.map(function (key) {
        let valuesToUpdate = configuration[key];
        let querybuilder = bodybuilder();

        switch (key) {
          case "municipio_1":          
            querybuilder.query('term', 'municipio_id', 1);   
            querybuilder.andQuery('bool', a => 
              a.orQuery('term', 'group_id', groupEnum.GroupEnum.OperatoreSportello)
              .orQuery('term', 'group_id', groupEnum.GroupEnum.IstruttoreMunicipio)
              .orQuery('term', 'group_id', groupEnum.GroupEnum.DirettoreMunicipio)                 
            );
            break;
          case "municipio_2":
            querybuilder.query('term', 'municipio_id', 2);
            querybuilder.andQuery('bool', a => 
              a.orQuery('term', 'group_id', groupEnum.GroupEnum.OperatoreSportello)
              .orQuery('term', 'group_id', groupEnum.GroupEnum.IstruttoreMunicipio)
              .orQuery('term', 'group_id', groupEnum.GroupEnum.DirettoreMunicipio)                 
            );
            break;
          case "municipio_3":
            querybuilder.query('term', 'municipio_id', 3);   
            querybuilder.andQuery('bool', a => 
              a.orQuery('term', 'group_id', groupEnum.GroupEnum.OperatoreSportello)
              .orQuery('term', 'group_id', groupEnum.GroupEnum.IstruttoreMunicipio)
              .orQuery('term', 'group_id', groupEnum.GroupEnum.DirettoreMunicipio)                 
            );  
            break;
          case "municipio_4":
            querybuilder.query('term', 'municipio_id', 4);   
            querybuilder.andQuery('bool', a => 
              a.orQuery('term', 'group_id', groupEnum.GroupEnum.OperatoreSportello)
              .orQuery('term', 'group_id', groupEnum.GroupEnum.IstruttoreMunicipio)
              .orQuery('term', 'group_id', groupEnum.GroupEnum.DirettoreMunicipio)                 
            ); 
            break;
          case "municipio_5":
            querybuilder.query('term', 'municipio_id', 5);  
            querybuilder.andQuery('bool', a => 
              a.orQuery('term', 'group_id', groupEnum.GroupEnum.OperatoreSportello)
              .orQuery('term', 'group_id', groupEnum.GroupEnum.IstruttoreMunicipio)
              .orQuery('term', 'group_id', groupEnum.GroupEnum.DirettoreMunicipio)                 
            );  
            break;
          case "polizia_locale":
            querybuilder.query('term', 'group_id', groupEnum.GroupEnum.PoliziaLocale);    
            break;
          case "utd":
            querybuilder.query('term', 'group_id', groupEnum.GroupEnum.UfficioTecnicoDecentrato);   
            break;
          case "ragioneria":
            querybuilder.query('term', 'group_id', groupEnum.GroupEnum.RipartizioneRagioneria); 
            break;
          case "urbanistica":
            querybuilder.query('term', 'group_id', groupEnum.GroupEnum.RipartizioneUrbanistica); 
            break;
          case "tributi":
            querybuilder.query('term', 'group_id', groupEnum.GroupEnum.RipartizioneTributi); 
            break;
        }

        let query = querybuilder.build();

        return db.client.updateByQuery({
          index: config.mapping.utenti.index,
          type: config.mapping.utenti.type,
          body: {
            script: {
              inline: "ctx._source.uoid='" + valuesToUpdate.uoid + "'; ctx._source.denominazione='" + valuesToUpdate.denominazione + "';"
            },
            query: query.query
          } 
        }).then((resp) =>{
          return resp
        }).catch((err) => {
          console.log(err);
        });
      });

      Promise.all(mapResult).then(function(result) {    
        res.status(200).send({ message: "Configurazione aggiornata correttamente." });
      }).catch((err) => {
        console.log(`API: updateConfiguration - Errore ${err.status}: ${err.message}`);
        res.status(err.status).send({ err: err, message: "Errore durante l'aggiornamento della configurazione" });
      });
    }
    else
      res.status(200).send({ message: "Configurazione aggiornata correttamente." });
  }).catch((err) => {
    console.log(`API: updateConfiguration - Errore ${err.status}: ${err.message}`);
    res.status(err.status).send({ err: err, message: "Errore durante l'aggiornamento della configurazione" });
  });
}

module.exports = {
    takeEmails,
    takeEmailsSync,
    takeTemplateSync,
    getTemplateDocumenti,
    getTemplateDocumento,
    uploadTemplateDocumento,
    checkTemplateDocumenti,
    getRagioneSocialeDestinatariSync,
    getUOID,
    getConfigurations,
    getConfiguration,
    updateConfiguration
};