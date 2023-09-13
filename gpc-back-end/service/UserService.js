var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var bcrypt = require('bcryptjs');
router.use(express.json({ limit: '20mb', extended: true }));
router.use(express.urlencoded({ limit: "20mb", extended: true }));
var bodybuilder = require('bodybuilder');
var userData = require('../dao/UserData.js'); 
var utils = require("../shared/utility/formatter.js");
var group = require("../shared/enums/group.enum.js");

function getUsers(req, res) {
  let querybuilder = bodybuilder().notFilter('term', 'deleted', true);
  let query = querybuilder.build();
  userData.getUsers(req, res, query);
}

function getUsersConcessionario(req, res) {
  let querybuilder = bodybuilder().query('term', 'group_id', group.GroupEnum.Concessionario);
  querybuilder.andQuery('term', 'enabled', true);
  let query = querybuilder.build();
  userData.getUsersConcessionario(req, res, query);
}

function disableUsersConcessionario(req, res) {
  let querybuilder = bodybuilder().query('term', 'group_id', group.GroupEnum.Concessionario);
  querybuilder.andQuery('term', 'enabled', true);
  let query = querybuilder.build();
  userData.disableUsersConcessionario(req, res, query);
}

function inserisciUtente(req, res) {
  var newuser = req.body.newuser;
  newuser.password = bcrypt.hashSync(newuser.password);
  newuser.datadinascita = newuser.datadinascita ? utils.formatDateTime(newuser.datadinascita, true) : undefined;
  newuser.lastLogin = utils.formatDateTime();
  newuser.enabled = true;
  newuser.deleted = false;

  let querybuilder = bodybuilder().query('match', 'codicefiscale', newuser.codicefiscale.toLowerCase());
  querybuilder.notQuery('term', 'deleted', true);
  let query = querybuilder.build();

  userData.inserisciUtente(req, res, newuser, query);
}

function modificaDatiUtente(req, res) {
  var user = req.body;
  user.datadinascita = user.datadinascita ? utils.formatDateTime(user.datadinascita, true) : undefined;
  user.group_id = parseInt(user.group_id, 10);
  userData.modificaDatiUtente(req, res, user);
}

function cambiaPasswordUtente(req, res) {
  var user = req.body.user;
  var oldPassword = req.body.oldPassword;
  var hash = bcrypt.hashSync(user.password);
  userData.cambiaPasswordUtente(req, res, user, hash, oldPassword);
}

function getUser(req, res) {
  userData.getUser(req, res);
}

function deleteUser(req, res) {
  var user = req.body;
  userData.deleteUser(req, res, user);
}

function cercaCittadino(req, res) {
  let querybuilder = bodybuilder().filter('term', 'codicefiscale', req.body.codFiscale.toLowerCase());
  querybuilder.filter('term', 'group_id', group.GroupEnum['Cittadino']);
  let query = querybuilder.build();

  userData.cercaCittadino(req, res, query);
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