var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var verifyToken = require('../auth/VerifyToken');
var checkAuth = require('../auth/CheckAuth'); 
router.use(express.json({ limit: '20mb', extended: true }));
router.use(express.urlencoded({ limit: "20mb", extended: true }));
var userService = require("../service/UserService.js");
 

router.get('/getUsers', verifyToken, checkAuth, function (req, res) {
  userService.getUsers(req, res);
});

router.get('/getUsersConcessionario', verifyToken, checkAuth, function (req, res) {
  userService.getUsersConcessionario(req, res);
});

router.get('/disableUsersConcessionario/:username', verifyToken, checkAuth, function (req, res) {
  userService.disableUsersConcessionario(req, res);
});

router.post('/inserisciUtente', verifyToken, checkAuth, function (req, res) {
  userService.inserisciUtente(req, res);
});

router.post('/modificaDatiUtente', verifyToken, checkAuth, function (req, res) {
  userService.modificaDatiUtente(req, res);
});

router.post('/cambiaPasswordUtente', verifyToken, checkAuth, function (req, res) {
  userService.cambiaPasswordUtente(req, res);
});

router.get('/getUser/:username', verifyToken, checkAuth, function (req, res) {
  userService.getUser(req, res);
});

router.post('/deleteUser', verifyToken, checkAuth, function (req, res) {
  userService.deleteUser(req, res);
});

router.post('/cercaCittadino', verifyToken, checkAuth, function (req, res) {
  userService.cercaCittadino(req, res);
});

module.exports = router;