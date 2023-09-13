var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var verifyToken = require('../auth/VerifyToken');
var checkAuth = require('../auth/CheckAuth'); 
router.use(express.json({ limit: '20mb', extended: true }));
router.use(express.urlencoded({ limit: "20mb", extended: true }));
var utilityService = require('../service/UtilityService.js'); 

router.post('/sendEmail', verifyToken, checkAuth, function (req ,res) {
    utilityService.sendEmail(req, res);
});

router.post('/takeEmails', verifyToken, checkAuth, function (req, res) {
    utilityService.takeEmails(req, res); 
});

router.post('/generaDetermina', verifyToken, checkAuth, function (req ,res) {
    utilityService.generaDetermina(req, res);
});

router.post('/generaRelazioneServizio', verifyToken, checkAuth, function (req ,res) {
    utilityService.generaRelazioneServizio(req, res);
});

router.post('/generaIstruttoriaUTD', verifyToken, checkAuth, function (req ,res) {
    utilityService.generaIstruttoriaUTD(req, res);
});

router.post('/generaIstruttoriaUrbanistica', verifyToken, checkAuth, function (req ,res) {
    utilityService.generaIstruttoriaUrbanistica(req, res);
});

router.get('/getTemplateDocumenti', verifyToken, checkAuth, function (req, res) {
    utilityService.getTemplateDocumenti(req, res); 
});

router.get('/getTemplateDocumento/:id', verifyToken, checkAuth, function (req, res) {
    utilityService.getTemplateDocumento(req, res); 
});

router.post('/uploadTemplateDocumento', verifyToken, checkAuth, function (req, res) {
    utilityService.uploadTemplateDocumento(req, res);
});

router.post('/getRagioneSocialeDestinatariSync', /*verifyToken, checkAuth,*/ function (req, res) {
    utilityService.getRagioneSocialeDestinatariSync(req, res); 
});

router.post('/generaPdfPerProtocollo', verifyToken, checkAuth, function (req ,res) {
    utilityService.generaPdfPerProtocollo(req, res);
});

router.get('/getUOID/:id', /*verifyToken, checkAuth,*/ function (req, res) {
    utilityService.getUOID(req, res);
});

router.get('/getConfigurations', verifyToken, checkAuth, function (req, res) {
    utilityService.getConfigurations(req, res);
});

router.get('/getConfiguration/:id', verifyToken, checkAuth, function (req, res) {
    utilityService.getConfiguration(req, res);
});

router.post('/updateConfiguration', verifyToken, checkAuth, function (req, res) {
    utilityService.updateConfiguration(req, res);
});

module.exports = router;