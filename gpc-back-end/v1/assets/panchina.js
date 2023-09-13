var express = require("express");
var router = express.Router();
var db = require("../../db");
var config = require("../../config");
var utils = require("../../shared/utility/formatter.js");

router.get("/panchine", function(req, res) {

  db.client.search(
    {
      index: config.mapping.panchine.index,
      type: config.mapping.panchine.type,
      from: 0,
      size: 9999,
      body: {
          _source: { 
            exclude: [ "asset.image" ] 
        }
      }
    },
    function(error, resp, status) {
      var JSONresults = {};
      if (!error) {
        JSONresults.result = resp["hits"]["hits"].map(function(i) {
          asset = i["_source"];
          asset.asset.type = i["_index"];
          return asset;
        });
        JSONresults.error = {};
        res.status(200).send(JSONresults);
      } else {
        JSONresults.result = {};
        JSONresults.error = error;
        res.status(500).send(JSONresults);
      }
    }
  );
});

router.post("/panchine", function(req, res) {
  const obj = req.body;

  db.client.search(
    {
      index: config.mapping.panchine.index,
      type: config.mapping.panchine.type,
      body: {
        query: {
          bool: {
            must: [{ term: { "asset.id_tag.keyword": obj.id_tag } }]
          }
        }
      }
    },
    function(error, resp, status) {
      var JSONresults = {};
      if (!error) {
        JSONresults.result = resp["hits"]["hits"].map(function(i) {
          asset = i["_source"];
          asset.asset.type = i["_index"];
          return asset;
        });
        JSONresults.error = {};
        res.status(200).send(JSONresults);
      } else {
        JSONresults.result = {};
        JSONresults.error = error;
        res.status(500).send(JSONresults);
      }
    }
  );
});

router.put("/panchine", function(req, res) {
  const obj = req.body;

  obj.asset.datainserimento = utils.formatDate();
  obj.asset.tipologiaFornitura = '';
  obj.asset.impresaInstallatrice = '';
  obj.asset.contrattoFornitura = '';

  db.client.index(
    {
      index: config.mapping.panchine.index,
      type: config.mapping.panchine.type,
      id: obj.asset.id_tag,
      body: obj
    },
    function(error, resp, status) {
      var JSONresults = {};

      JSONresults.result = "ok";
      JSONresults.error = error;

      if (!error) {
        res.status(200).send(JSONresults);
      } else {
        JSONresults.result = {};
        res.status(500).send(JSONresults);
      }
    }
  );
});

module.exports = router;
