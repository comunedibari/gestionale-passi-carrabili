var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var verifyToken = require('../auth/VerifyToken');
var checkAuth = require('../auth/CheckAuth'); 
router.use(express.json({ limit: '20mb', extended: true }));
router.use(express.urlencoded({ limit: "20mb", extended: true }));
var passiCarrabiliService = require('../service/PassiCarrabiliService.js');

router.post('/inserimentoBozzaPratica', verifyToken,/* checkAuth,*/ function (req, res) {
  passiCarrabiliService.inserimentoBozzaPratica(req, res);
});

router.post('/inserimentoPratica', verifyToken,/* checkAuth,*/ function (req, res) {
  passiCarrabiliService.inserimentoPratica(req, res);
});

router.post('/aggiornaPratica', verifyToken,/* checkAuth,*/ function (req, res) {
  passiCarrabiliService.aggiornaPratica(req, res);
});

router.delete('/eliminaPratica/:id_doc', verifyToken, checkAuth, function (req, res) {
  passiCarrabiliService.eliminaPratica(req, res);
});

router.post('/praticheCittadino', verifyToken,/* checkAuth,*/ function (req, res) {
  passiCarrabiliService.praticheCittadino(req, res);
});

router.get('/storicoPratica/:idpratica', verifyToken,/* checkAuth,*/ function (req, res) {
  passiCarrabiliService.storicoPratica(req, res); 
});

router.get('/cercaPratica/:id', verifyToken,/* checkAuth,*/ function (req, res) {
  passiCarrabiliService.cercaPratica(req, res);
});

router.get('/cercaPraticaDaNumProtocollo/:numero_protocollo', verifyToken,/* checkAuth,*/ function (req, res) {
  passiCarrabiliService.cercaPraticaDaNumProtocollo(req, res);
});

router.get('/documentiPratica/:idpratica', verifyToken,/* checkAuth,*/ function (req, res) {
  passiCarrabiliService.documentiPratica(req, res); 
});

router.get('/getDocumento/:id_doc', verifyToken,/* checkAuth,*/ function (req, res) {
  passiCarrabiliService.getDocumento(req, res); 
});

router.post('/uploadDocument', verifyToken,/* checkAuth,*/ function (req, res) {
  passiCarrabiliService.uploadDocument(req, res);
});

router.post('/assegnaProtocolloDocumento', verifyToken, checkAuth, function (req, res) {
  passiCarrabiliService.assegnaProtocolloDocumento(req, res);
});

router.delete('/deleteDocument/:id', verifyToken, checkAuth, function (req, res) {
  passiCarrabiliService.deleteDocument(req, res);
});

router.get('/cercaPratichePerStatoPratica/:statoPratica/:municipio_id/:group_id', verifyToken, checkAuth, function (req, res) {
  passiCarrabiliService.cercaPratichePerStatoPratica(req, res);
});

router.get('/cercaIstruttoriMunicipio/:municipio_id', verifyToken, checkAuth, function (req, res) {
  passiCarrabiliService.cercaIstruttoriMunicipio(req, res);
});

router.post('/getNumeroProtocollo', function (req, res) {
  passiCarrabiliService.getNumeroProtocollo(req, res);
});

router.post('/archiviaPraticaOriginaria', verifyToken, checkAuth, function (req, res) {
  passiCarrabiliService.archiviaPraticaOriginaria(req, res);
});

router.post('/revocaPraticaOriginaria', verifyToken, checkAuth, function (req, res) {
  passiCarrabiliService.revocaPraticaOriginaria(req, res);
});

router.get('/cercaSegnalazioniRegolarizzazione/:municipio_id', function (req, res) {
  passiCarrabiliService.cercaSegnalazioniRegolarizzazione(req, res);
});

router.post('/inserimentoSegnalazioniRegolarizzazione', verifyToken, checkAuth, function (req, res) {
  passiCarrabiliService.inserimentoSegnalazioniRegolarizzazione(req, res);
});

router.get('/getRelazioneServizioRegolarizzazione/:id_doc', verifyToken, checkAuth, function (req, res) {
  passiCarrabiliService.getRelazioneServizioRegolarizzazione(req, res); 
});

router.get('/notificaRegolarizzazioneInviata/:id_doc', verifyToken, checkAuth, function (req, res) {
  passiCarrabiliService.notificaRegolarizzazioneInviata(req, res); 
});

router.get('/disattivaNotificaScadenziarioRegolarizzazione/:id_doc', verifyToken, checkAuth, function (req, res) {
  passiCarrabiliService.disattivaNotificaScadenziarioRegolarizzazione(req, res); 
});

router.get('/cercaNotificheScadenziario/:municipio_id/:group_id', function (req, res) {
  passiCarrabiliService.cercaNotificheScadenziario(req, res);
});

router.get('/startScadenziario', function (req, res) {
  passiCarrabiliService.startScadenziario(req, res);
});

router.get('/eliminaPraticaDaScadenziario/:id', verifyToken,/* checkAuth,*/ function (req, res) {
  passiCarrabiliService.eliminaPraticaDaScadenziario(req, res);
});

router.get('/pregressoPratiche', verifyToken, checkAuth, function (req, res) {
  passiCarrabiliService.pregressoPratiche(req, res); 
});

router.post('/setPraticaControllataPregresso', verifyToken, checkAuth, function (req, res) {
  passiCarrabiliService.setPraticaControllataPregresso(req, res); 
});

router.post('/ripristinaPraticaPregresso', verifyToken, checkAuth, function (req, res) {
  passiCarrabiliService.ripristinaPraticaPregresso(req, res); 
});

router.get('/getPraticheSenzaTagRFID/:municipio_id', verifyToken, checkAuth, function (req, res) {
  passiCarrabiliService.getPraticheSenzaTagRFID(req, res);
});

router.post('/praticheAvviabiliPostConcessione', verifyToken,/* checkAuth,*/ function (req, res) {
  passiCarrabiliService.praticheAvviabiliPostConcessione(req, res); 
});

router.get('/caricaDashboardKibana/:municipio_id', verifyToken, checkAuth, function (req, res) {
  passiCarrabiliService.caricaDashboardKibana(req, res);
});

router.get('/bonificaPratiche/:municipio_id', verifyToken, checkAuth,function (req, res) {
  passiCarrabiliService.bonificaPratiche(req, res);
});

router.get('/getSegnalazioni/:municipio_id', verifyToken, checkAuth, function (req, res) {
  passiCarrabiliService.getSegnalazioni(req, res);
});

router.get('/getSegnalazione/:id_doc', verifyToken, checkAuth, function (req, res) {
  passiCarrabiliService.getSegnalazione(req, res);
});

router.post('/aggiornaSegnalazione', verifyToken, checkAuth, function (req, res) {
  passiCarrabiliService.aggiornaSegnalazione(req, res);
});

router.post('/getPraticheInRevoca', verifyToken,/* checkAuth,*/ function (req, res) {
  passiCarrabiliService.getPraticheInRevoca(req, res); 
});

router.post('/getPraticheInAttesaPagamentoBollo', verifyToken,/* checkAuth,*/ function (req, res) {
  passiCarrabiliService.getPraticheInAttesaPagamentoBollo(req, res); 
});

router.get('/checkTagRFID/:tag_rfid', verifyToken, checkAuth, function (req, res) {
  passiCarrabiliService.checkTagRFID(req, res);
});

router.post('/validazionePratica', verifyToken,/* checkAuth,*/ function (req, res) {
  passiCarrabiliService.validazionePratica(req, res);
});

router.post('/checkAvvioProcessiPostConcessioneMultipli', verifyToken,/* checkAuth,*/ function (req, res) {
  passiCarrabiliService.checkAvvioProcessiPostConcessioneMultipli(req, res);
});

router.get('/countPratichePerStato/:municipio_id/:group_id', verifyToken/*, checkAuth*/, function (req, res) {
  passiCarrabiliService.countPratichePerStato(req, res);
});

router.get('/countPratichePerFunzionalita/:municipio_id', verifyToken/*, checkAuth*/, function (req, res) {
  passiCarrabiliService.countPratichePerFunzionalita(req, res);
});

module.exports = router;