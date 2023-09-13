var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var bodybuilder = require('bodybuilder');
router.use(express.json({ limit: '20mb', extended: true }));
router.use(express.urlencoded({ limit: "20mb", extended: true }));
var panchineData = require('../dao/PanchineData.js'); 
var utils = require("../shared/utility/formatter.js");

function getModelliPanchina(req, res) {
    panchineData.getModelliPanchina(req, res);
}

function inserisciModelloPanchina(req, res) {
    var obj = req.body;
    panchineData.inserisciModelloPanchina(req, res, obj)
}

function getStatiPanchina(req, res) {
    panchineData.getStatiPanchina(req, res);
}

function getContestiPanchina(req, res) {
    panchineData.getContestiPanchina(req, res);
}

function getPanchine(req, res) {
    panchineData.getPanchine(req, res);
};

function getPanchina(req, res) {
    let id = req.params.id_tag;
    panchineData.getPanchina(req, res, id);
};

function inserisciPanchina(req, res) {
    var obj = req.body;
    obj.asset.datainserimento = utils.formatDate();
    obj.asset.tipologiaFornitura = '';
    obj.asset.impresaInstallatrice = '';
    obj.asset.contrattoFornitura = '';
    panchineData.inserisciPanchina(req, res, obj);
};

function aggiornaPanchina(req, res) {
    var asset = req.body.asset;
    panchineData.aggiornaPanchina(req, res, asset);
};

function eliminaPanchina(req, res) {
    let id = req.params.id_tag;
    panchineData.eliminaPanchina(req, res, id);
};

function saveImagesFromLocalDir(req, res) {
    
    const fs = require('fs');
    const image2base64 = require('image-to-base64');

    var panchineFolder = '../cdba-gestione-passi-carrabili/gpc-back-end/assets/foto_panchine';

    fs.readdir(panchineFolder, function (err, files) {
         files.forEach(function (file) {

            let splitted = file.split('.');
            let id = splitted[0];

            image2base64(panchineFolder + '/' + file).then( fileBase64 => {
                    panchineData.saveImagesFromLocalDir(req, res, id, fileBase64);
                }
            )
            .catch(
                (error) => {
                    console.log(error);
                }
            ) 
        });

    });   
}

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