var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var verifyToken = require('./VerifyToken');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var config = require('../config');
var db = require('../db');
var config = require('../config');
var utils = require("../shared/utility/formatter.js");
router.use(express.json({ limit: '20mb', extended: true }));
router.use(express.urlencoded({ extended: false }));
var nodemailer = require('nodemailer');

router.post('/login', function (req, res) {
  let user = req.body;

  db.client.get({
    index: config.mapping.utenti.index,
    type: config.mapping.utenti.type,
    id: user.username
  }).then(function (docUser) {

      let userlogged = docUser._source;
      if (bcrypt.compareSync(user.password, userlogged.password)) {
        if(userlogged.enabled) { 
          var token = jwt.sign({
            username: userlogged.username, group_id: userlogged.group_id
          }, config.secret, {
            expiresIn: 86400 // expires in 24 hours
          });
          
          db.client.get({
            index: config.mapping.gruppi.index,
            type: config.mapping.gruppi.type,
            id: userlogged.group_id
          }).then(function (resp) { 

            let groups = JSON.stringify(resp._source);
            
            res.status(200).send({
              auth: true,
              token: token,
              groups: groups,
              username: userlogged.username,
              userlogged: userlogged
            });

          }).catch((err) => {

            groups = {
              "id": userlogged.group_id,
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
              "auth.statistiche": false,
              "auth.auditLog": false,
              "auth.gestioneUtenti": false,
              "auth.templates": false,
              "auth.ilMioProfilo": true
            }

            db.client.index({
              index: config.mapping.gruppi.index,
              type: config.mapping.gruppi.type,
              id: userlogged.group_id,
              body: groups
            }).then((resp) =>{   
              console.log('Nuovo gruppo [' + userlogged.group_id + '] creato');          
            }).catch((err) => {
              console.log('Errore durante l\'inserimento del nuovo gruppo');
            });

            res.status(200).send({
              auth: true,
              token: token,
              groups: JSON.stringify(groups),
              username: userlogged.username,
              userlogged: userlogged
            });

          });

        } else {
          res.status(404).send({
            auth: false,
            token: null,
            message: 'L\'utente non è attivo o è stato cancellato'      
          });
        }
        
      } else {
        res.status(404).send({
          auth: false,
          token: null,
          message: 'Username o Password Errata'      
        });
      }
  }).catch((err) => {
    res.status(err.status).send({ 
      auth: false,
      token: null,
      message: "Username o Password Errata" 
    });
  });
});

router.post("/logout", verifyToken, function(req, res) {
  let dateNow = utils.formatDateTime();
  let username = req.body.username;

  db.client.update({
      index: config.mapping.utenti.index,
      type: config.mapping.utenti.type,
      id: username,
      body: {
        doc:{            
          lastLogin: dateNow,          
        }
      }
    }).then((resp) =>{
      res.status(200).send({ 
        auth: false,
        token: null,
        message: "Logout utente registrato." 
      });
    }).catch((err) => {
      res.status(err.status).send({ 
        message: "Errore durante salvataggio del logout." 
      });
    });
});

router.post('/recuperoPassword', function (req, res) {
  let username = req.body.username;
  
  db.client.get({  
    index: config.mapping.utenti.index,
    type: config.mapping.utenti.type,
    id: username
  }).then(function (resp){ 

    var password = Math.random().toString(36).slice(2);
    var hash = bcrypt.hashSync(password);

    db.client.update({  
      index: config.mapping.utenti.index,
      type: config.mapping.utenti.type,
      id: username,
      body: {
        doc: {
          password: hash
        }     
      }
    }).then(function (resp2){ 

      var transporter = nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure : config.smtp.secure,
        auth: {
          user: config.smtp.auth.user,
          pass: config.smtp.auth.pass
        },
        tls: {
          rejectUnauthorized: config.smtp.tlsUnauth,
          maxVersion: config.smtp.tlsMaxVersion,
          minVersion: config.smtp.tlsMinVersion
        }
      });
  
      var mailOptions = {
        from: config.smtp.from,
        to: resp._source.email,
        subject: 'Bari Smart City - Recupero password',
        html: getContentEmail(username, password),
        attachments: [
          {
            filename: 'logo_comune_bari.png',
            path: global.__root +'/assets/images/logo_comune_bari.png',
            cid: 'logo_comune_bari'
           }
        ]
      };

      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
          transporter.close();
          res.status(404).send({message: "Errore durante la modifica della password"});
        } else {
          console.log('Email sent: ' + info.response);
          transporter.close();
          res.status(200).send({message: "Nuova password inviata all\'indirizzo mail associato all\'account"});
        }
      });     
    }).catch(function (err) {
      console.log('API: recuperoPassword - modificaPassword');
      res.status(err.status).send({ err: err, message: "Errore durante la modifica della password" }); 
    });

  }).catch(function (err) {
    console.log('API: recuperaPassword - get user');
    res.status(err.status).send({ err: err, message: "Username errato" }); 
  });
});

function getContentEmail(username, password){
  let content = 
      '<div style="border-style: solid; border-width: 1px;">'
    +   '<div style="background-color: #E20A16; height:50px; padding:5px 5px;">'
    // +     '<img style="float: left;" src="https://www.comune.bari.it/image/layout_set_logo?img_id=21701&t=1530879469139.0002" height="50" />'
    +     '<img style="float: left;" src="cid:logo_comune_bari" height="50" />'
    +     '<span style="line-height:50px; color: white; font-weight: 500; font-size: 1.2vw;">Bari Smart City - Recupero password</span>'
    +   '</div> '
    +   '<div style="padding: 10px">'
    +     '<span>Salve,</span>'	
    +     '<br/><br/><span>la nuova password associata all\'utente <strong>' + username + '</strong> è la seguente:</span>'
    +     '<br/><br/><span>Password: <strong>' + password + '</strong></span>'
    +     '<br/><br/><span>Si prega di modificare la password al primo accesso.<span>'
    +     '<br/><br/><span>Cordiali saluti</span>'
    +   '</div>';
    + '</div>';
  return content;
}

router.post('/getToken', function (req, res) {
  let body = req.body;

  if (bcrypt.compareSync(body.password, bcrypt.hashSync(config.linksCredentials.password))) {
    var token = jwt.sign({
      username: body.username, password: body.password
    }, config.secret, {
      expiresIn: 86400 // expires in 24 hours
    });
    
    res.status(200).send({
      auth: true,
      token: token,
      username: body.username,
      message: 'Connessione avvenuta con successo'
    }); 
  } else {
    res.status(404).send({
      auth: false,
      token: null,
      message: 'Username o Password Errata'      
    });
  }
});

module.exports = router;