var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var bodybuilder = require('bodybuilder');
router.use(express.json({ limit: '20mb', extended: true }));
router.use(express.urlencoded({ limit: "20mb", extended: true }));
var createDoc = require('docx-templates');
const libre = require('libreoffice-convert');
libre.convertAsync = require('util').promisify(libre.convert);

var utils = require("../shared/utility/utility.js");
var utilityData = require('../dao/UtilityData.js'); 
var config = require('../config');
var nodemailer = require('nodemailer');
var tipologiaPratica = require("../shared/enums/tipologia-pratica.enum.js");
var statoPratica = require("../shared/enums/stato-pratica.enum.js");
var formatter = require("../shared/utility/formatter.js");
var groupEnum = require("../shared/enums/group.enum.js");

function sendEmail(req, res) {
  try {
    let obj = req.body;

    var hostname = '';
    var username = '';
    var password = '';
    var from = '';

    if(!obj.blob) {
      hostname = config.smtp.host;
      username = config.smtp.auth.user;
      password = config.smtp.auth.pass;
      from = config.smtp.from;
    }
    else {
      hostname = config.smtp.host_pec;
      switch (parseInt(obj.blob.municipio_id)) {
        case 1:       
          username = config.smtp.pec.municipio_1.user_pec_m1;
          password = config.smtp.pec.municipio_1.pass_pec_m1;
          from = config.smtp.pec.municipio_1.from_pec_m1;
          break;
        case 2:
          username = config.smtp.pec.municipio_2.user_pec_m2;
          password = config.smtp.pec.municipio_2.pass_pec_m2;
          from = config.smtp.pec.municipio_2.from_pec_m2;
          break;
        case 3:
          username = config.smtp.pec.municipio_3.user_pec_m3;
          password = config.smtp.pec.municipio_3.pass_pec_m3;
          from = config.smtp.pec.municipio_3.from_pec_m3;
          break;
        case 4:
          username = config.smtp.pec.municipio_4.user_pec_m4;
          password = config.smtp.pec.municipio_4.pass_pec_m4;
          from = config.smtp.pec.municipio_4.from_pec_m4;
          break;
        case 5:
          username = config.smtp.pec.municipio_5.user_pec_m5;
          password = config.smtp.pec.municipio_5.pass_pec_m5;
          from = config.smtp.pec.municipio_5.from_pec_m5;
          break;
      }
    }

    var transporter = nodemailer.createTransport({
      host: hostname,
      port: config.smtp.port,
      secure : config.smtp.secure,
      auth: {
        user: username,
        pass: password
      },
      tls: {
        rejectUnauthorized: config.smtp.tlsUnauth,
        maxVersion: config.smtp.tlsMaxVersion,
        minVersion: config.smtp.tlsMinVersion
      }
    });

    var mailOptions = {
      from: from,
      to: obj.to,
      cc: obj.cc,
      subject: obj.subject,
      html: getContentEmail(obj.messaggio, obj.subject),
      attachments: [
        {
          filename: 'logo_comune_bari.png',
          path: global.__root +'/assets/images/logo_comune_bari.png',
          cid: 'logo_comune_bari'
         }
      ]
    };

    if(obj.blob && obj.blob.filename) {
      mailOptions.attachments.push({ filename: obj.blob.filename, path: obj.blob.path });
    }
    
    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        transporter.close();
        console.log(error);
        res.status(error.responseCode).send({ error: error, message: "Invio dell'email non riuscito" });
      } else {
        transporter.close();
        res.status(200).send({ message: "Email inviata correttamente" });
      }
    });
  } catch(error) {
    res.status(500).send({ err: error, message: "Errore di sistema durante l'invio della mail" });
  }
}

function getContentEmail(messaggio, subject){
  let content = 
      '<div style="border-style: solid; border-width: 1px;">'
    +    '<div style="background-color: #E20A16; height:50px; padding:5px 5px;">'
    // +      '<img style="float: left;" src="https://www.comune.bari.it/image/layout_set_logo?img_id=21701&t=1530879469139.0002" height="50" />'
    +      '<img style="float: left;" src="cid:logo_comune_bari" height="50" />'
    +      '<span style="line-height:50px; color: white; font-weight: 500; font-size: 1.2vw;">' + subject + '</span>'
    +    '</div> '
    +    '<div style="padding: 10px">'
    +      '<span>' + messaggio + '</span>'
    +      '<br/><br/><span>Si prega di non rispondere alla mail, perchè è stata generata automaticamente.<span>'
    +      '<br/><br/><span>Cordiali saluti,</span>'
    +      '<br/><span>Comune di Bari</span>'
    +    '</div>';
    + '</div>';
  return content;
}

function takeEmails(req, res) {
  let obj = req.body;
  let querybuilder = bodybuilder();

  obj.forEach(el => {      
    if(el.municipio_id != null){
      querybuilder.orQuery("bool", "must", 
            [{
              "term": {
                "group_id": el.group_id
              }
            },
            {
              "term": {
                "municipio_id": el.municipio_id
              }
            }]);
    } else if(el.group_id == groupEnum.GroupEnum.PoliziaLocale) {
      querybuilder.orQuery('bool', b =>
         b.andQuery('term', 'group_id', el.group_id)
         .notQuery('exists', 'field', 'municipio_id'));
    }
    else {
      querybuilder.orQuery("term", "group_id", el.group_id);
    }
  });

  let query = querybuilder.build();

  utilityData.takeEmails(req, res, query);
}

async function generaDetermina(req, res) {
  var pratica = req.body;

  let tipologiaEsenzione = '';

  if(pratica?.dichiarazioni_aggiuntive?.flag_esenzione == true && !pratica?.dichiarazioni_aggiuntive?.flag_esenzione_cup)
    tipologiaEsenzione = 'EsenteBollo';
  else if(!pratica?.dichiarazioni_aggiuntive?.flag_esenzione && pratica?.dichiarazioni_aggiuntive?.flag_esenzione_cup == true)
    tipologiaEsenzione = 'EsenteCUP';
  else if(pratica?.dichiarazioni_aggiuntive?.flag_esenzione == true && pratica?.dichiarazioni_aggiuntive?.flag_esenzione_cup == true)
    tipologiaEsenzione = 'EsenteBolloCUP';

  let fileName = '';

  if(pratica.stato_pratica == statoPratica.StatoPraticaPassiCarrabiliEnum['Pratica da rigettare'])
    fileName = 'templateDeterminaRigetto';
  else {
    switch (pratica.dati_istanza.tipologia_processo) {
      case tipologiaPratica.TipologiaPraticaEnum['Concessione Temporanea']:
        fileName = 'templateDeterminaConcessioneTemporanea';
        break;
      case tipologiaPratica.TipologiaPraticaEnum['Concessione Permanente']:
        fileName = 'templateDeterminaConcessionePermanente';
        break;
      case tipologiaPratica.TipologiaPraticaEnum.Rinuncia:
        fileName = 'templateDeterminaRinuncia';
        break;
      case tipologiaPratica.TipologiaPraticaEnum.Rinnovo:
        fileName = 'templateDeterminaRinnovo';
        break;
      case tipologiaPratica.TipologiaPraticaEnum['Trasferimento titolarità']:
        fileName = 'templateDeterminaTrasferimentoTitolarita';
        break;
      case tipologiaPratica.TipologiaPraticaEnum.Rettifica:
        fileName = 'templateDeterminaRettifica';
        break;
      case tipologiaPratica.TipologiaPraticaEnum.Regolarizzazione:
      case tipologiaPratica.TipologiaPraticaEnum['Regolarizzazione furto/deterioramento']:
        fileName = 'templateDeterminaRegolarizzazioneFurto';
        break;
      case tipologiaPratica.TipologiaPraticaEnum.Revoca:
        fileName = 'templateDeterminaRevoca';
        break;
      case tipologiaPratica.TipologiaPraticaEnum.Decadenza:
        fileName = 'templateDeterminaDecadenza';
        break;
      case tipologiaPratica.TipologiaPraticaEnum.Proroga:
        fileName = 'templateDeterminaProroga';
        break;
    }
  }

  var template = await utilityData.takeTemplateSync(fileName + tipologiaEsenzione).catch((err) => {
    console.log('API: takeTemplateSync');
    res.status(err.status).send({ err: err, message: "Errore di sistema" });
  });

  if(template){
    template.blob = template.blob.replace('data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,', '');
    var bufferFile = await utils.convertBase64ToBuffer(template.blob);

    formatter.formattazioneDatePerDocs(pratica);
    var determinaObject = { pratica };
    createDoc({
      template: bufferFile,
      output: 'buffer',
      data: determinaObject
    }).then(docBuffer=>{
      res.setHeader('Content-disposition', `attachment; filename="${fileName}_${pratica.id_doc}.docx"`);
      res.contentType('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.send(docBuffer);
    }).catch((err) => {
      console.log('API: generaDetermina');
      res.status(err.status).send({ err: err, message: "Errore di sistema" });
    });
  }
}

async function generaRelazioneServizio(req, res) {
  var pratica = req.body;

  var filename = "templateRelazioneServizio";
  var template = await utilityData.takeTemplateSync(filename).catch((err) => {
    console.log('API: takeTemplateSync');
    res.status(err.status).send({ err: err, message: "Errore di sistema" });
  });

  if(template){
    template.blob = template.blob.replace('data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,', '');
    var bufferFile = await utils.convertBase64ToBuffer(template.blob);

    var relazioneServizioObject = { pratica };
    createDoc({
      template: bufferFile,
      output: 'buffer',
      data: relazioneServizioObject
    }).then(docBuffer=>{
      res.setHeader('Content-disposition', `attachment; filename="${filename}_${pratica.id_doc}.docx"`);
      res.contentType('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.send(docBuffer);
    }).catch((err) => {
      console.log('API: generaRelazioneServizio');
      res.status(err.status).send({ err: err, message: "Errore di sistema" });
    });
  }
}

async function generaIstruttoriaUTD(req, res) {
  var pratica = req.body;

  var filename = "templateIstruttoriaUTD";
  var template = await utilityData.takeTemplateSync(filename).catch((err) => {
    console.log('API: takeTemplateSync');
    res.status(err.status).send({ err: err, message: "Errore di sistema" });
  });

  if(template){
    template.blob = template.blob.replace('data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,', '');
    var bufferFile = await utils.convertBase64ToBuffer(template.blob);

    var istruttoriaUTDObject = { pratica };
    createDoc({
      template: bufferFile,
      output: 'buffer',
      data: istruttoriaUTDObject
    }).then(docBuffer=>{
      res.setHeader('Content-disposition', `attachment; filename="${filename}_${pratica.id_doc}.docx"`);
      res.contentType('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.send(docBuffer);
    }).catch((err) => {
      console.log('API: generaIstruttoriaUTD');
      res.status(err.status).send({ err: err, message: "Errore di sistema" });
    });
  }
}

async function generaIstruttoriaUrbanistica(req, res) {
  var pratica = req.body;

  var filename = "templateIstruttoriaUrbanistica";
  var template = await utilityData.takeTemplateSync(filename).catch((err) => {
    console.log('API: takeTemplateSync');
    res.status(err.status).send({ err: err, message: "Errore di sistema" });
  });

  if(template){
    template.blob = template.blob.replace('data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,', '');
    var bufferFile = await utils.convertBase64ToBuffer(template.blob);

    var istruttoriaUrbanisticaObject = { pratica };
    createDoc({
      template: bufferFile,
      output: 'buffer',
      data: istruttoriaUrbanisticaObject
    }).then(docBuffer=>{
      res.setHeader('Content-disposition', `attachment; filename="${filename}_${pratica.id_doc}.docx"`);
      res.contentType('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.send(docBuffer);
    }).catch((err) => {
      console.log('API: generaIstruttoriaUrbanistica');
      res.status(err.status).send({ err: err, message: "Errore di sistema" });
    });
  }
}

async function generaPdfPerProtocollo(req, res) {
  var pratica = req.body.pratica;
  var filename = req.body.filename;

  var template = await utilityData.takeTemplateSync(filename).catch((err) => {
    console.log('API: takeTemplateSync');
    res.status(err.status).send({ err: err, message: "Errore di sistema" });
  });

  if(template){
    template.blob = template.blob.replace('data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,', '');
    var bufferFile = await utils.convertBase64ToBuffer(template.blob);

    var templateInserimentoPraticaObject = { pratica };
    createDoc({
      template: bufferFile,
      output: 'buffer',
      data: templateInserimentoPraticaObject
    }).then(async (docBuffer)=>{
      let pdfBuf = await libre.convertAsync(docBuffer, '.pdf', undefined);
      res.setHeader('Content-disposition', `attachment; filename="${filename}_${pratica.id_doc}.pdf"`);
      res.contentType('application/pdf');
      res.send(pdfBuf);
    }).catch((err) => {
      console.log('API: generaPdfPerProtocollo');
      res.status(err.status).send({ err: err, message: "Errore di sistema" });
    });
  }
}

/* ------------------------ INVIO MAIL PER SERVIZI CITTADINO LATO EGOV ------------------------ */

function takeEmailsAndSendEmailSync(istanza, statoIntegrazione) {
  return new Promise(async function(resolve, reject) {
    // GET email destinatari
    let objTakeEmails = [
      { group_id: groupEnum.GroupEnum.DirettoreMunicipio, municipio_id: istanza.dati_istanza.indirizzo_segnale_indicatore.municipio_id },
      { group_id: groupEnum.GroupEnum.IstruttoreMunicipio, municipio_id: istanza.dati_istanza.indirizzo_segnale_indicatore.municipio_id }
    ];

    let querybuilder = bodybuilder();
    objTakeEmails.forEach(el => {      
      querybuilder.orQuery("bool", "must", 
            [{
              "term": {
                "group_id": el.group_id
              }
            },
            {
              "term": {
                "municipio_id": el.municipio_id
              }
            }]);
    });
    let query = querybuilder.build();
    let emails = await utilityData.takeEmailsSync(query);

    // Rimozione duplicati
    let emailsMunicipio = [];
    emails.forEach(el => {
      if(emailsMunicipio.indexOf(el.email) == -1)
        emailsMunicipio.push(el.email);
    });

    //Creazione mail
    let objEmail = getObjEmail(istanza, emailsMunicipio, statoIntegrazione);

    if(objEmail.messaggio) {
      // Invio email
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
        to: objEmail.to,
        // cc: objEmail.cc,
        subject: objEmail.subject,
        html: getContentEmail(objEmail.messaggio, objEmail.subject),
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
          transporter.close();
          console.log(error);
          reject({ error: error, message: "Invio dell'email non riuscito"});
        } else {
          transporter.close();
          resolve({ message: "Email inviata correttamente"});
        }
      });
    }
    else 
      resolve({ message: "Tipologia processo non gestita lato EGOV"});
  });
}

function getObjEmail(istanza, emailsMunicipio, statoIntegrazione) {
  let objEmail = { 
      to: emailsMunicipio.join(','),
      // cc: istanza.anagrafica.email,
      subject: "",  
      messaggio: ""
    };

  if(!statoIntegrazione) {
    switch (istanza.dati_istanza.tipologia_processo) {
      case tipologiaPratica.TipologiaPraticaEnum['Concessione Permanente']:
      case tipologiaPratica.TipologiaPraticaEnum['Concessione Temporanea']:
      case tipologiaPratica.TipologiaPraticaEnum.Rinnovo:
      case tipologiaPratica.TipologiaPraticaEnum.Rinuncia:
      case tipologiaPratica.TipologiaPraticaEnum['Trasferimento titolarità']:
      case tipologiaPratica.TipologiaPraticaEnum['Regolarizzazione furto/deterioramento']:
        objEmail.subject = getSubjectEmail(istanza, 'Comunicazione inserimento richiesta');
        objEmail.messaggio = emailAvvioPraticaOperatoreSportello(istanza);
        break;
      case tipologiaPratica.TipologiaPraticaEnum.Proroga:
        objEmail.subject = getSubjectEmail(istanza, 'Comunicazione inserimento richiesta');
        objEmail.messaggio = emailAvvioPraticaSenzaAssegnazioneAttori(istanza);
        break;
    }
  } else {
    switch (statoIntegrazione) {
      case statoPratica.StatoPraticaPassiCarrabiliEnum['Necessaria integrazione']:
      case statoPratica.StatoPraticaPassiCarrabiliEnum['Preavviso diniego']:
        objEmail.subject = getSubjectEmail(istanza, 'Comunicazione integrazione pratica');
        objEmail.messaggio = emailReInvioPraticaMunicipio(istanza);
        break;
      case statoPratica.StatoPraticaPassiCarrabiliEnum['Attesa di pagamento']:
        objEmail.subject = getSubjectEmail(istanza, 'Comunicazione pagamento marca da bollo');
        objEmail.messaggio = emailNotificaPagamentoMarcaDaBollo(istanza);
        break;
      case statoPratica.StatoPraticaPassiCarrabiliEnum['Richiesta lavori']:
        objEmail.subject = getSubjectEmail(istanza, 'Comunicazione avvio inizio lavori');
        objEmail.messaggio = emailDichiarazioneInizioLavoriMunicipio(istanza);
        break;
      case statoPratica.StatoPraticaPassiCarrabiliEnum['Attesa fine lavori']:
        objEmail.subject = getSubjectEmail(istanza, 'Comunicazione fine lavori');
        objEmail.messaggio = emailDichiarazioneFineLavoriMunicipio(istanza);
        break;
    }
  }
  
  return objEmail;
}

function getSubjectEmail(istanza, messaggio) {
  return `Concessione di passo carrabile - ${istanza.anagrafica.tipologia_persona == 'G' ? istanza.anagrafica.ragione_sociale : istanza.anagrafica.nome + ' ' + istanza.anagrafica.cognome} - Protocollo: ${istanza.numero_protocollo} - ${messaggio}`; 
}

function getTipologiaProcessoLabel(pratica) {
  let msg = '';
  switch(pratica.dati_istanza.tipologia_processo) { 
    case tipologiaPratica.TipologiaPraticaEnum['Concessione Temporanea']: 
    case tipologiaPratica.TipologiaPraticaEnum['Concessione Permanente']: { 
      msg = 'di concessione';
      break; 
    } 
    case tipologiaPratica.TipologiaPraticaEnum.Rinuncia: {
      msg = 'di rinuncia'; 
      break; 
    }
    case tipologiaPratica.TipologiaPraticaEnum.Rinnovo: {
      msg = 'di rinnovo'; 
      break; 
    }
    case tipologiaPratica.TipologiaPraticaEnum.Proroga: {
      msg = 'di proroga'; 
      break; 
    }
    case tipologiaPratica.TipologiaPraticaEnum['Trasferimento titolarità']: {
      msg = 'di trasferimento titolarità'; 
      break; 
    }
    case tipologiaPratica.TipologiaPraticaEnum['Regolarizzazione furto/deterioramento']: {
      msg = 'di regolarizzazione'; 
      break; 
    }
  }
  return msg;
}

function emailAvvioPraticaOperatoreSportello(pratica) {
  let msg = 'Agli uffici competenti,';
  msg += '<br/><br/>con la presente email si comunica che è stata avviata la pratica ';
  msg += getTipologiaProcessoLabel(pratica);
  msg += ' richiesta dal cittadino identificato con il codice fiscale <b>' + pratica.anagrafica.codice_fiscale + '</b> ';
  msg += ' in data <b>' + formatter.formatDateTimeForDocs(pratica.data_inserimento, true) + '</b> per l\'indirizzo: <b>' + pratica.dati_istanza.indirizzo_segnale_indicatore.indirizzo + '</b>.'; 
  msg += '<br/><br/>Numero di protocollo associato alla pratica: <b>' + (pratica.numero_protocollo || 'N.D.') + '</b>.';
  return msg;
}

function emailAvvioPraticaSenzaAssegnazioneAttori(pratica) {
  let msg = 'Agli uffici competenti,';
      msg += '<br/><br/>con la presente email si comunica che è stata avviata la pratica ';
      msg += getTipologiaProcessoLabel(pratica);
      msg += ' richiesta dal cittadino identificato con il codice fiscale <b>' + pratica.anagrafica.codice_fiscale + '</b> ';
      msg += ' in data <b>' + formatter.formatDateTimeForDocs(pratica.data_inserimento, true) + '</b> per l\'indirizzo: <b>' + pratica.dati_istanza.indirizzo_segnale_indicatore.indirizzo + '</b>.'; 
      msg += '<br/><br/>L\'istruttore municipio di riferimento per la pratica è <b>' + pratica.proprietario_pratica.utente + '</b>.';
      msg += '<br/><br/>Numero di protocollo associato alla pratica: <b>' + (pratica.numero_protocollo || 'N.D.') + '</b>.';
  return msg;
}

function emailReInvioPraticaMunicipio(pratica) {
  let msg = 'Agli uffici competenti,';
      msg += '<br/><br/>con la presente email si comunica che il cittadino identificato con il codice fiscale ';
      msg += '<b>'+ pratica.anagrafica.codice_fiscale + '</b> ha allegato nuovamente i documenti alla pratica ';
      msg += getTipologiaProcessoLabel(pratica) + '.';
      msg += '<br/><br/>Il numero di protocollo associato a questa operazione è: <b>' + (pratica.numero_protocollo_comunicazione || 'N.D.') + '</b>.';
      msg += '<br/><br/>Numero di protocollo associato alla pratica: <b>' + (pratica.numero_protocollo || 'N.D.') + '</b>.';
  return msg;
}

function emailNotificaPagamentoMarcaDaBollo(pratica) {
  let msg = 'Agli uffici competenti,';
      msg += '<br/><br/>con la presente email si comunica che alla pratica del cittadino identificato con il codice fiscale <b>' + pratica.anagrafica.codice_fiscale + '</b>';
      msg += ' è stato associato il pagamento della marca da bollo. ';
      msg += '<br/><br/>Numero di protocollo associato alla pratica: <b>' + (pratica.numero_protocollo || 'N.D.') + '</b>.';
  return msg;
}

function emailDichiarazioneInizioLavoriMunicipio(pratica) {
  let msg = 'Agli uffici competenti,';
      msg += '<br/><br/>con la presente email si comunica che il cittadino identificato con il codice fiscale <b>' + pratica.anagrafica.codice_fiscale + '</b>';
      msg += ' per l\'indirizzo del passo carrabile <b>' + pratica.dati_istanza.indirizzo_segnale_indicatore.indirizzo + '</b>';
      msg += ' ha allegato la documentazione relativa all\' inizio del lavori.'
      msg += '<br/><br/>La data dichiarata di fine lavori è <b>' + formatter.formatDateTimeForDocs(pratica.data_scadenza_fine_lavori, true) + '</b>.';
      msg += '<br/><br/>Il numero di protocollo associato a questa operazione è: <b>' + (pratica.numero_protocollo_comunicazione || 'N.D.') + '</b>.';
      msg += '<br/><br/>Numero di protocollo associato alla pratica: <b>' + (pratica.numero_protocollo || 'N.D.') + '</b>.';
  return msg;
}

function emailDichiarazioneFineLavoriMunicipio(pratica) {
  let msg = 'Agli uffici competenti,';
      msg += '<br/><br/>con la presente email si comunica che il cittadino identificato con il codice fiscale <b>' + pratica.anagrafica.codice_fiscale + '</b>';
      msg += ' per l\'indirizzo del passo carrabile <b>' + pratica.dati_istanza.indirizzo_segnale_indicatore.indirizzo + '</b>';
      msg += ' ha allegato la documentazione relativa alla fine dei lavori.'
      msg += '<br/><br/>Il numero di protocollo associato a questa operazione è: <b>' + (pratica.numero_protocollo_comunicazione || 'N.D.') + '</b>.';
      msg += '<br/><br/>Numero di protocollo associato alla pratica: <b>' + (pratica.numero_protocollo || 'N.D.') + '</b>.';
  return msg;
}

function getTemplateDocumenti(req, res) {
  utilityData.checkTemplateDocumenti(req, res);
}

function getTemplateDocumento(req, res) {
  let id = req.params.id;
  utilityData.getTemplateDocumento(req, res, id);
}

function uploadTemplateDocumento(req, res) {
  var template = req.body; 
  template.last_modification.data_operazione = formatter.formatDateTime();
  utilityData.uploadTemplateDocumento(req, res, template);
}

async function getRagioneSocialeDestinatariSync(req, res) {
  let obj = req.body;
  let querybuilder = bodybuilder();

  obj.forEach(el => {      
    if(el.municipio_id != null){
      querybuilder.orQuery("bool", "must", 
            [{
              "term": {
                "group_id": el.group_id
              }
            },
            {
              "term": {
                "municipio_id": el.municipio_id
              }
            }]);
    } else if(el.group_id == groupEnum.GroupEnum.PoliziaLocale) {
      querybuilder.orQuery('bool', b =>
         b.andQuery('term', 'group_id', el.group_id)
         .notQuery('exists', 'field', 'municipio_id'));
    }
    else {
      querybuilder.orQuery("term", "group_id", el.group_id);
    }
  });

  let query = querybuilder.build();

  let resp = await utilityData.getRagioneSocialeDestinatariSync(req, res, query)
              .catch(err => { 
                res.status(err.status).send({ err: err, message: "Errore di sistema" });
              });
  res.status(200).send(resp);
}

function getUOID(req, res) {
  let id = req.params.id;
  utilityData.getUOID(req, res, id);
}

function getConfigurations(req, res) {
  utilityData.getConfigurations(req, res);
}

function getConfiguration(req, res) {
  let id = req.params.id;
  utilityData.getConfiguration(req, res, id);
}

function updateConfiguration(req, res) {
  var configuration = req.body;   
  utilityData.updateConfiguration(req, res, configuration);
}

module.exports = {
    sendEmail,
    takeEmails,
    generaDetermina,
    generaRelazioneServizio,
    generaIstruttoriaUTD,
    generaIstruttoriaUrbanistica,
    generaPdfPerProtocollo,
    takeEmailsAndSendEmailSync,
    getTemplateDocumenti,
    getTemplateDocumento,
    uploadTemplateDocumento,
    getRagioneSocialeDestinatariSync,
    getUOID,
    getConfigurations,
    getConfiguration,
    updateConfiguration
};