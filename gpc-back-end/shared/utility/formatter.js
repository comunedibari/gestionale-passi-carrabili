var { DateTime } = require("luxon");

function formatDateTime(dateParam, onlyDate) {
  let dt = !!dateParam ? DateTime.fromISO(new Date(dateParam).toISOString()) : DateTime.local();
  let dtFormat = onlyDate ? "yyyy-LL-dd" : "yyyy-LL-dd HH:mm:ss";
  return dt.toFormat(dtFormat);
};

function formatDateTimeForDocs(dateParam, onlyDate) {
  let dt = !!dateParam ? DateTime.fromISO(new Date(dateParam).toISOString()) : DateTime.local();
  let dtFormat = onlyDate ? "dd/LL/yyyy" : "dd/LL/yyyy HH:mm:ss";
  return dt.toFormat(dtFormat);
};
 
function formatDate(dateParam) {
  let dt = !!dateParam ? DateTime.fromISO(new Date(dateParam).toISOString()) : DateTime.local();
  return dt.toFormat("yyyy-LL-dd");
};

function getLocalYear(dateParam){
  let dt = !!dateParam ? DateTime.fromISO(new Date(dateParam).toISOString()) : DateTime.local();
  return dt.year;
}

function formattazioneDatePerDB(istanza) {
  if(istanza.anagrafica.data_nascita)
    istanza.anagrafica.data_nascita = formatDateTime(istanza.anagrafica.data_nascita, true);

  if(istanza.data_inserimento)
    istanza.data_inserimento = formatDateTime(istanza.data_inserimento, true); 

  if(istanza.data_scadenza_procedimento)
    istanza.data_scadenza_procedimento = formatDateTime(istanza.data_scadenza_procedimento, true); 

  if(istanza.data_scadenza_integrazione)
    istanza.data_scadenza_integrazione = formatDateTime(istanza.data_scadenza_integrazione, true);

  if(istanza.data_scadenza_diniego)
    istanza.data_scadenza_diniego = formatDateTime(istanza.data_scadenza_diniego, true);
    
  if(istanza.data_scadenza_pagamento)
    istanza.data_scadenza_pagamento = formatDateTime(istanza.data_scadenza_pagamento, true);

  if(istanza.dati_istanza.data_scadenza_concessione)
    istanza.dati_istanza.data_scadenza_concessione = formatDateTime(istanza.dati_istanza.data_scadenza_concessione, true);

  if(istanza.dati_istanza.link_pratica_origine) {
    istanza.dati_istanza.link_pratica_origine.data_scadenza_concessione = formatDateTime(istanza.dati_istanza.link_pratica_origine.data_scadenza_concessione, true);
    istanza.dati_istanza.link_pratica_origine.data_emissione = formatDateTime(istanza.dati_istanza.link_pratica_origine.data_emissione, true);
  }

  if(istanza.data_scadenza_restituzione)
    istanza.data_scadenza_restituzione = formatDateTime(istanza.data_scadenza_restituzione, true);

  if(istanza.data_scadenza_inizio_lavori)
    istanza.data_scadenza_inizio_lavori = formatDateTime(istanza.data_scadenza_inizio_lavori, true);

  if(istanza.data_scadenza_fine_lavori)
    istanza.data_scadenza_fine_lavori = formatDateTime(istanza.data_scadenza_fine_lavori, true);

  if(istanza.data_scadenza_notifica_decadenza)
    istanza.data_scadenza_notifica_decadenza = formatDateTime(istanza.data_scadenza_notifica_decadenza, true);

  if(istanza.determina && istanza.determina.data_emissione)
    istanza.determina.data_emissione = formatDateTime(istanza.determina.data_emissione, true);

  if(istanza.determina_rettifica && istanza.determina_rettifica.data_emissione)
    istanza.determina_rettifica.data_emissione = formatDateTime(istanza.determina_rettifica.data_emissione, true);

  if(istanza.marca_bollo_pratica)
    istanza.marca_bollo_pratica.data_operazione = formatDateTime(istanza.marca_bollo_pratica.data_operazione, true);
    
  if(istanza.marca_bollo_determina)
    istanza.marca_bollo_determina.data_operazione = formatDateTime(istanza.marca_bollo_determina.data_operazione, true);
}

function formattazioneDatePerDocs(istanza) {
  if(istanza.anagrafica.data_nascita)
    istanza.anagrafica.data_nascita = formatDateTimeForDocs(istanza.anagrafica.data_nascita, true);

  if(istanza.data_inserimento)
    istanza.data_inserimento = formatDateTimeForDocs(istanza.data_inserimento, true); 

  if(istanza.data_scadenza_procedimento)
    istanza.data_scadenza_procedimento = formatDateTimeForDocs(istanza.data_scadenza_procedimento, true); 

  if(istanza.data_scadenza_integrazione)
    istanza.data_scadenza_integrazione = formatDateTimeForDocs(istanza.data_scadenza_integrazione, true);

  if(istanza.data_scadenza_diniego)
    istanza.data_scadenza_diniego = formatDateTimeForDocs(istanza.data_scadenza_diniego, true);
    
  if(istanza.data_scadenza_pagamento)
    istanza.data_scadenza_pagamento = formatDateTimeForDocs(istanza.data_scadenza_pagamento, true);

  if(istanza.dati_istanza.data_scadenza_concessione)
    istanza.dati_istanza.data_scadenza_concessione = formatDateTimeForDocs(istanza.dati_istanza.data_scadenza_concessione, true);

  if(istanza.dati_istanza.link_pratica_origine) {
    istanza.dati_istanza.link_pratica_origine.data_scadenza_concessione = formatDateTimeForDocs(istanza.dati_istanza.link_pratica_origine.data_scadenza_concessione, true);
    istanza.dati_istanza.link_pratica_origine.data_emissione = formatDateTimeForDocs(istanza.dati_istanza.link_pratica_origine.data_emissione, true);
  }

  if(istanza.data_scadenza_restituzione)
    istanza.data_scadenza_restituzione = formatDateTimeForDocs(istanza.data_scadenza_restituzione, true);
  
  if(istanza.data_scadenza_inizio_lavori)
    istanza.data_scadenza_inizio_lavori = formatDateTimeForDocs(istanza.data_scadenza_inizio_lavori, true);

  if(istanza.data_scadenza_fine_lavori)
    istanza.data_scadenza_fine_lavori = formatDateTimeForDocs(istanza.data_scadenza_fine_lavori, true);

  if(istanza.data_scadenza_notifica_decadenza)
    istanza.data_scadenza_notifica_decadenza = formatDateTimeForDocs(istanza.data_scadenza_notifica_decadenza, true);

  if(istanza.determina && istanza.determina.data_emissione)
    istanza.determina.data_emissione = formatDateTimeForDocs(istanza.determina.data_emissione, true);

  if(istanza.determina_rettifica && istanza.determina_rettifica.data_emissione)
    istanza.determina_rettifica.data_emissione = formatDateTimeForDocs(istanza.determina_rettifica.data_emissione, true);

  if(istanza.marca_bollo_pratica)
    istanza.marca_bollo_pratica.data_operazione = formatDateTimeForDocs(istanza.marca_bollo_pratica.data_operazione, true);
    
  if(istanza.marca_bollo_determina)
    istanza.marca_bollo_determina.data_operazione = formatDateTimeForDocs(istanza.marca_bollo_determina.data_operazione, true);
}

module.exports = { formatDate, formatDateTime, getLocalYear, formatDateTimeForDocs, formattazioneDatePerDB, formattazioneDatePerDocs };