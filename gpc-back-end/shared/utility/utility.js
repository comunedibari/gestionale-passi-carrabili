var { DateTime } = require("luxon");
  
function getNumeroProtocolloPubblico() {
  var result = '';
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for ( var i = 0; i < 16; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};
 
function getDataScadenzaPratica(dateParam, days) {
  let dt = !!dateParam ? DateTime.fromISO(new Date(dateParam).toISOString()) : DateTime.local();
  return dt.plus({ days: (!!days ? days : 90) }).startOf('day').toFormat("yyyy-LL-dd");
};

function getNotificaAvvicinamentoScadenza(days) {
  let dt = DateTime.local().startOf('day');
  let dataLimite = dt.plus({days: days});
  return dataLimite.toFormat("yyyy-LL-dd");
};

function convertBase64ToBuffer(base64){
  return new Promise((resolve, reject) => {
    var buffer = Buffer.from(base64, 'base64');
    if(!buffer)
      reject({messaggio: "Errore durante la conversione del file"});
    else
      resolve(buffer);
  });
}

function capitalize(string) {
  return string.toLowerCase()
    .split(' ')
    .filter(e => e)
    .map(str => {
    return `${str.charAt(0).toUpperCase()}${str.slice(1)}`;
    })
    .join(' ');
}

module.exports = { getNumeroProtocolloPubblico, getDataScadenzaPratica, getNotificaAvvicinamentoScadenza, convertBase64ToBuffer, capitalize };