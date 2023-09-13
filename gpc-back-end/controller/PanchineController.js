var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var verifyToken = require('../auth/VerifyToken');
var checkAuth = require('../auth/CheckAuth'); 
router.use(express.json({ limit: '20mb', extended: true }));
router.use(express.urlencoded({ limit: "20mb", extended: true }));
var panchineService = require('../service/PanchineService.js'); 

//-------------------- API SENZA CHECK SU RUOLO E TOKEN ----------------------------
router.get('/getModelliPanchina', function (req, res) {
    panchineService.getModelliPanchina(req, res);
});

router.post('/inserisciModelloPanchina', function (req, res) {
    panchineService.inserisciModelloPanchina(req, res);
});

router.get('/getStatiPanchina', function (req, res) {
    panchineService.getStatiPanchina(req, res);
});

router.get('/getContestiPanchina', function (req, res) {
    panchineService.getContestiPanchina(req, res);
});

router.get('/getPanchine', function (req, res) {
    panchineService.getPanchine(req, res);
});

router.get('/getPanchina/:id_tag', function (req, res) {
    panchineService.getPanchina(req, res);
});

router.post('/inserisciPanchina', function (req, res) {
    panchineService.inserisciPanchina(req, res);
});

router.post('/aggiornaPanchina', function (req, res) {
    panchineService.aggiornaPanchina(req, res);
});

router.get('/saveImagesFromLocalDir', function (req, res) {
    panchineService.saveImagesFromLocalDir(req, res);
});

//----------------------------------------------------------------------------------

router.delete('/eliminaPanchina/:id_tag', verifyToken, checkAuth, function (req, res) {
    panchineService.eliminaPanchina(req, res);
});

module.exports = router;