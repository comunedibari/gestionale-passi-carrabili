import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { UtilityService } from './utility.service';
import { FormatDatePipe } from '../pipe/format-date.pipe';
import { TipologiaPratica } from '../enums/TipologiaPratica.enum';
import { StatoPraticaPassiCarrabili } from '../enums/StatoPratica.enum';

@Injectable()
export class EmailService {

  constructor(
    private utilityService: UtilityService,
    private http: HttpClient,
    private datePipe: FormatDatePipe
  ) { }

  sendEmailAPI(to, cc, subject, messaggio, blob): Observable<any> {
    let obj = { 
      to: to,
      cc: cc,
      subject: subject,  
      messaggio: messaggio,
      blob: blob
    };
    
    let requiredGroup = this.utilityService.getRequiredGroup();
    let headers = { headers: new HttpHeaders({'requiredgroup': requiredGroup})}; 

    return this.http.post<any>(environment.apiServer + '/api/utility/sendEmail', obj, headers);
  }

  sendEmail(to, cc, subject, messaggio, blob = null) {
    //TO DO: implementare sistema di retry valido
    this.sendEmailAPI( to, cc, subject, messaggio, blob).subscribe( 
      resp => {
        console.log(resp.message);
      },
      err => {
        console.log(err.message);
        //setTimeout(() => { this.sendEmail(to, cc, subject, messaggio); }, 5000);
      }
    );
  }

  emailAvvioPraticaCittadino(pratica): string {
		let msg = 'Gentile Sig./Sig.ra ' + pratica.anagrafica.cognome + ',';
    msg += '<br/><br/>Con la presente email si comunica che la pratica ';
    msg += this.utilityService.getTipologiaProcessoLabel(pratica);
    msg += ' di passo carrabile da lei richiesta per l\'indirizzo: <b>' + pratica.dati_istanza.indirizzo_segnale_indicatore.indirizzo + '</b>'; 
		msg += ' in data: <b>' + this.datePipe.transform(pratica.data_inserimento, true) + '</b> è stata protocollata.'; 
    msg += '<br/><br/>Il numero di protocollo associato alla pratica è: <b>' + (pratica.numero_protocollo || 'N.D.') + '</b>.';
    msg += '<br/><br/>Le comunichiamo che riceverà il nominativo dell\'istruttore del Municipio incaricato delle verifiche quando la pratica sarà assegnata.';
    return msg;
  }

  emailAvvioPraticaOperatoreSportello(pratica): string {
    let msg = 'Agli uffici competenti,';
    msg += '<br/><br/>Con la presente email si comunica che la pratica ';
    msg += this.utilityService.getTipologiaProcessoLabel(pratica);
    msg += ' di passo carrabile richiesta dal cittadino identificato con il codice fiscale <b>' + pratica.anagrafica.codice_fiscale + '</b> ';
    msg += 'per l\'indirizzo: <b>' + pratica.dati_istanza.indirizzo_segnale_indicatore.indirizzo + '</b> è stata avviata.'; 
    msg += '<br/><br/>Il numero di protocollo associato alla pratica è <b>' + (pratica.numero_protocollo || 'N.D.') + '</b>.';
    return msg;
  }

  emailPresaInCaricoCittadino(pratica): string {
    let msg = 'Gentile Sig./Sig.ra ' + pratica.anagrafica.cognome + ',';
        msg += '<br/><br/>Con la presente email si comunica che la pratica  ';
        msg += this.utilityService.getTipologiaProcessoLabel(pratica);
        msg += ' di passo carrabile da lei richiesta per l\'indirizzo: <b>' + pratica.dati_istanza.indirizzo_segnale_indicatore.indirizzo + '</b>';
        msg += ' in data: <b>' + this.datePipe.transform(pratica.data_inserimento, true) + '</b>';
        msg += ' con numero di protocollo: <b>' + (pratica.numero_protocollo || 'N.D.') + '</b>';
        msg += ' è stata assegnata all\'istruttore del Municipio <b>' + pratica.proprietario_pratica.utente + '</b>.';
    return msg;
  }

  emailPresaInCaricoMunicipio(pratica): string {
    let msg = 'Agli uffici competenti,';
        msg += '<br/><br/>Con la presente email si comunica che la pratica ';
        msg += this.utilityService.getTipologiaProcessoLabel(pratica);
        msg += ' di passo carrabile richiesta dal cittadino identificato con il codice fiscale <b>' + pratica.anagrafica.codice_fiscale + '</b>';
        msg += ' è stata assegnata all\'istruttore del Municipio ' + pratica.proprietario_pratica.utente + '.';
        msg += '<br/><br/>Il numero di protocollo associato alla pratica è: <b>' + (pratica.numero_protocollo || 'N.D.') + '</b>.';
    return msg;
  }

  //RICHIESTA PARERI ATTORI COINVOLTI
  emailRichiestaPareriToAttori(pratica): string {
    let msg = 'Agli uffici competenti,';
        msg += '<br/><br/>Con la presente email si comunica che è richiesta la verifica per la richiesta ';
        msg += this.utilityService.getTipologiaProcessoLabel(pratica);
        msg += ' di Passo Carrabile in <b>' + pratica.dati_istanza.indirizzo_segnale_indicatore.indirizzo + '</b> ';
        msg += ' e della documentazione allegata dal cittadino identificato con il codice fiscale <b>' + pratica.anagrafica.codice_fiscale + '</b>. ';
        msg += '<br/><br/>Il numero di protocollo associato alla pratica è: <b>' + (pratica.numero_protocollo || 'N.D.') + '</b>.';
  return msg;
  }

  emailIntegrazioneDocumentiPraticaCittadino(pratica): string {
    let msg = 'Gentile Sig./Sig.ra ' + pratica.anagrafica.cognome + ',';
        msg += '<br/><br/>con la presente email si comunica che la pratica ';
        msg += this.utilityService.getTipologiaProcessoLabel(pratica);
        msg += ' di passo carrabile da lei richiesta per l\'indirizzo <b>' + pratica.dati_istanza.indirizzo_segnale_indicatore.indirizzo + '</b>';
        msg += ' identificata dal numero di protocollo <b>' + (pratica.numero_protocollo || 'N.D.') + '</b> necessita di un\'<b>integrazione</b> relativamente alla documentazione allegata.';
        msg += '<br/><br/>Di seguito le note dell\'operatore che spiegano quali documenti integrare per completare l\'istruttoria.';
        msg += '<br/><br/><b>Note</b>: ' + pratica.parere_municipio.note + '';
        msg += '<br/><br/>La pratica dovrà essere integrata entro il: <b>' + this.datePipe.transform(pratica.data_scadenza_integrazione, true) + '</b>.';
    return msg;
  }

  emailIntegrazioneDocumentiPraticaMunicipio(pratica): string {
    let msg = 'Agli uffici competenti,';
        msg += '<br/><br/>con la presente email si comunica l\'avvio della richiesta di <b>integrazione</b> della documentazione ';
        msg += ' al cittadino identificato con il codice fiscale <b>' + pratica.anagrafica.codice_fiscale + '</b> per la richiesta ';
        msg += this.utilityService.getTipologiaProcessoLabel(pratica);
        msg += ' relativamente all\'indirizzo: <b>' + pratica.dati_istanza.indirizzo_segnale_indicatore.indirizzo + '</b>.'; 
        msg += '<br/><br/>La pratica dovrà essere integrata entro il: <b>' + this.datePipe.transform(pratica.data_scadenza_integrazione, true) + '</b>.';
        msg += '<br/><br/>Il numero di protocollo associato alla pratica è: <b>' + (pratica.numero_protocollo || 'N.D.') + '</b>.';
    return msg;
  }

  emailReInvioPraticaMunicipio(pratica): string {
    let msg = 'Agli uffici competenti,';
        msg += '<br/><br/>con la presente email si comunica che il cittadino identificato con il codice fiscale ';
        msg += '<b>'+ pratica.anagrafica.codice_fiscale + '</b> ha allegato nuovamente i documenti alla pratica ';
        msg += this.utilityService.getTipologiaProcessoLabel(pratica) + ' per l\'indirizzo: <b>' + pratica.dati_istanza.indirizzo_segnale_indicatore.indirizzo + '</b>.';
        msg += '<br/><br/>Il numero di protocollo associato alla pratica è: <b>' + (pratica.numero_protocollo || 'N.D.') + '</b>.';
    return msg;
  }
  
  emailReInvioPraticaCittadino(pratica): string {
    let msg = 'Gentile Sig./Sig.ra ' + pratica.anagrafica.cognome + ',';
        msg += '<br/><br/>le notifichiamo che la pratica ';
        msg += this.utilityService.getTipologiaProcessoLabel(pratica);
        msg += ' da lei richiesta per l\'indirizzo: <b>' + pratica.dati_istanza.indirizzo_segnale_indicatore.indirizzo + '</b> ';
        msg += 'in data <b>' + this.datePipe.transform(pratica.data_inserimento, true) + '</b> è stata inoltrata nuovamente al Comune di Bari, dopo l\'integrazione della documentazione.';
    return msg;
  }

  emailEsprimiParereAttori(pratica): string {
    let msg = 'Agli uffici competenti,';
        msg += '<br/><br/>con la presente email si comunica che la verifica della pratica ';
        msg += this.utilityService.getTipologiaProcessoLabel(pratica);
        msg += ' del cittadino identificato con il codice fiscale <b>' + pratica.anagrafica.codice_fiscale + '</b>';
        msg += ' è stata effettuata.'; 
        if (pratica.parere_polizia && pratica.parere_polizia.note)
        {
          msg += '<br/><br/>Di seguito le note relative alla verifica effettuata dalla Polizia Locale:' ;
          msg += '<br/>- ' + pratica.parere_polizia.note;
        }
        if (pratica.parere_utd && pratica.parere_utd.note)
        {
          msg += '<br/><br/>Di seguito le note relative alla verifica effettuata dall\'UTD IVOOPP:';
          msg += '<br/>- ' + pratica.parere_utd.note;
        }
        if (pratica.parere_urbanistica && pratica.parere_urbanistica.note)
        {
          msg += '<br/><br/>Di seguito le note relative alla verifica effettuata dalla Ripartizione Urbanistica:' ;
          msg += '<br/>- ' + pratica.parere_urbanistica.note;
        }
        return msg;
  }

  emailPreavvisoDiniegoCittadino(pratica): string {
    let msg = 'Gentile Sig./Sig.ra ' + pratica.anagrafica.cognome + ',';
        msg += '<br/><br/>con la presente email si comunica che la pratica ';
        msg += this.utilityService.getTipologiaProcessoLabel(pratica);
        msg += ' di passo carrabile da lei richiesta per l\'indirizzo <b>' + pratica.dati_istanza.indirizzo_segnale_indicatore.indirizzo + '</b>';
        msg += ' è in fase di rigetto e questa email rappresenta il preavviso di diniego di tale richiesta.';
        msg += '<br/><br/>Di seguito le note dell\'operatore che ne spiegano la causa.';
        msg += '<br/><br/>Note: '+ pratica.parere_municipio.note + '';
        msg += '<br/><br/>Nel caso voglia contestare tale disposizione, le comunichiamo che ha <b>10 giorni</b> a disposizione,';
        msg += ' oltre tale termine la pratica sarà rigettata automaticamente e la richiesta sarà negata.';
    return msg;
  }

  emailPreavvisoDiniegoMunicipio(pratica): string {
    let msg = 'Agli uffici competenti,';
        msg += '<br/><br/>con la presente email si comunica che è stato inviato il <b>preavviso di diniego</b> alla richiesta ';
        msg += this.utilityService.getTipologiaProcessoLabel(pratica);
        msg += ' del cittadino identificato con il codice fiscale <b>' + pratica.anagrafica.codice_fiscale + '</b>.';
        msg += '<br/<br/>Il cittadino dovrà rispondere entro la data: <b>' + this.datePipe.transform(pratica.data_scadenza_diniego, true) + '</b>.';
        msg += '<br/><br/>Il numero di protocollo associato a questa operazione è: <b>' + (pratica.numero_protocollo_comunicazione || 'N.D.') + '</b>.';
        msg += '<br/><br/>Numero di protocollo associato alla pratica: <b>' + (pratica.numero_protocollo || 'N.D.') + '</b>.';
    return msg;
  }

  emailPraticaDaRigettare(pratica): string {
    let msg = 'Agli uffici competenti,';
        msg += '<br/><br/>con la presente email si comunica che la pratica ';
        msg += this.utilityService.getTipologiaProcessoLabel(pratica);
        msg += ' del cittadino identificato con il codice fiscale <b>' + pratica.anagrafica.codice_fiscale + '</b>';
        msg += ' è passata nello stato <b>"' + StatoPraticaPassiCarrabili[pratica.stato_pratica] + '"</b>.';
        msg += '<br/><br/>Numero di protocollo associato alla pratica: <b>' + (pratica.numero_protocollo || 'N.D.') + '</b>.';
    return msg;
  }

  emailNotificaPraticaApprovataCittadino(pratica): string {
    let msg = 'Gentile Sig./Sig.ra ' + pratica.anagrafica.cognome + ',';
        msg += '<br/><br/>con la presente email si comunica che la pratica ';
        msg += this.utilityService.getTipologiaProcessoLabel(pratica);
        msg += ' di passo carrabile da lei richiesta per l\'indirizzo <b>' + pratica.dati_istanza.indirizzo_segnale_indicatore.indirizzo + '</b>'; 
        msg += ' relativa al numero di protocollo <b>' + (pratica.numero_protocollo || 'N.D.') + '</b> è stata approvata.';
        msg += '<br/><br/>Successivamente, le sarà inviata la relativa determina esecutiva.';
        // msg += '<br/><br/>Le chiediamo gentilmente di proseguire con il pagamento dei tributi e successivamente di recarsi presso gli sportelli del municipio di appartenenza per il ritiro del segnale indicatore di passo carrabile.';
        // msg += '<br/><br/>Per conoscere indirizzo e orari di ricevimento del Municipio ' + pratica.dati_istanza.indirizzo_segnale_indicatore.municipio_id + ' ';
        // msg += 'è possibile consultare il seguente link: https://www.comune.bari.it/web/egov/-/passo-carrabile-rilascio-concessione-e-contrassegno .'; 
    return msg;
  }

  // emailNotificaRinunciaApprovataCittadino(pratica): string {
  //   let msg = 'Gentile Sig./Sig.ra ' + pratica.anagrafica.cognome + ',';
  //       msg += '<br/><br/>con la presente email si comunica che la pratica ';
  //       msg += this.utilityService.getTipologiaProcessoLabel(pratica);
  //       msg += ' di passo carrabile da lei richiesta per l\'indirizzo <b>' + pratica.dati_istanza.indirizzo_segnale_indicatore.indirizzo + '</b>';
  //       msg += ' relativa al numero di protocollo <b>' + (pratica.numero_protocollo || 'N.D.') + '</b> è stata approvata.';
  //       return msg;
  // }

  emailNotificaPraticaApprovataAttori(pratica): string {
    let msg = 'Agli uffici competenti,';
        msg += '<br/><br/>con la presente email si comunica che la pratica ';
        msg += this.utilityService.getTipologiaProcessoLabel(pratica);
        msg += ' del cittadino identificato con il codice fiscale <b>' + pratica.anagrafica.codice_fiscale + '</b>';
        msg += ' è stata approvata.';
        msg += '<br/><br/>Il numero di protocollo associato alla pratica è: <b>' + (pratica.numero_protocollo || 'N.D.') + '</b>.';
    return msg;
  }

  emailNotificaInserimentoDeterminaCittadino(pratica): string {
    let msg = 'Gentile Sig./Sig.ra ' + pratica.anagrafica.cognome + ',';
        msg += '<br/><br/>con la presente email le comunichiamo che alla pratica ';
        msg += this.utilityService.getTipologiaProcessoLabel(pratica);
        msg += ' da lei richiesta in data <b>' + this.datePipe.transform(pratica.data_inserimento, true) + '</b>';
        msg += ' per l\'indirizzo del passo carrabile <b>' + pratica.dati_istanza.indirizzo_segnale_indicatore.indirizzo + '</b> ';
        msg += ' è stata associata la determina visionabile sull\'Albo Pretorio.'; 
        msg += '<br/><br/>Le chiediamo gentilmente di proseguire con il pagamento dei tributi per completare la richiesta. Il pagamento dovrà essere effettuato entro il <b>' + this.datePipe.transform(pratica.data_scadenza_pagamento, true) + '</b>';     
        msg += '<br/><br/>Successivamente al pagamento, le chiediamo di recarsi presso gli sportelli del municipio di appartenenza per il ritiro del segnale indicatore di passo carrabile.';
        msg += '<br/><br/>Per conoscere indirizzo e orari di ricevimento del Municipio ' + pratica.dati_istanza.indirizzo_segnale_indicatore.municipio_id + ' ';
        msg += 'è possibile consultare il seguente link: https://www.comune.bari.it/web/egov/-/passo-carrabile-rilascio-concessione-e-contrassegno .'; 
        msg += '<br/><br/>Il numero di protocollo associato a questa operazione è: <b>' + (pratica.numero_protocollo_comunicazione || 'N.D.') + '</b>.';
        msg += '<br/><br/>Il numero di protocollo associato alla pratica è: <b>' + (pratica.numero_protocollo || 'N.D.') + '</b>.';
    return msg;
  }

  emailNotificaInserimentoDeterminaDecadenzaCittadino(pratica): string {
    let msg = 'Gentile Sig./Sig.ra ' + pratica.anagrafica.cognome + ',';
        msg += '<br/><br/>con la presente email le comunichiamo che alla pratica ';
        msg += this.utilityService.getTipologiaProcessoLabel(pratica);
        msg += ' inserita in data <b>' + this.datePipe.transform(pratica.data_inserimento, true) + '</b>';
        msg += ' per l\'indirizzo del passo carrabile <b>' + pratica.dati_istanza.indirizzo_segnale_indicatore.indirizzo + '</b>,';
        msg += ' a seguito della comunicazione avvenuta in data <b>' + this.datePipe.transform(pratica.data_scadenza_notifica_decadenza, true) + '</b>,';
        msg += ' è stata associata la determina visionabile sull\'Albo Pretorio.'; 
        msg += '<br/><br/>Le chiediamo gentilmente di recarsi al municipio di riferimento per la restituzione del segnale indicatore.';
        msg += '<br/><br/>Il numero di protocollo associato a questa operazione è: <b>' + (pratica.numero_protocollo_comunicazione || 'N.D.') + '</b>.';
        msg += '<br/><br/>Numero di protocollo associato alla pratica: <b>' + (pratica.numero_protocollo || 'N.D.') + '</b>.';
    return msg;
  }

  emailNotificaInserimentoDeterminaRinunciaCittadino(pratica): string {
    let msg = 'Gentile Sig./Sig.ra ' + pratica.anagrafica.cognome + ',';
        msg += '<br/><br/>con la presente email le comunichiamo che alla pratica ';
        msg += this.utilityService.getTipologiaProcessoLabel(pratica);
        msg += ' inserita in data <b>' + this.datePipe.transform(pratica.data_inserimento, true) + '</b>';
        msg += ' per l\'indirizzo del passo carrabile <b>' + pratica.dati_istanza.indirizzo_segnale_indicatore.indirizzo + '</b>,';
        msg += ' è stata associata la determina visionabile sull\'Albo Pretorio.'; 
        msg += '<br/><br/>Le chiediamo gentilmente di recarsi al municipio di riferimento per la restituzione del segnale indicatore.';
        msg += '<br/><br/>Il numero di protocollo associato a questa operazione è: <b>' + (pratica.numero_protocollo_comunicazione || 'N.D.') + '</b>.';
        msg += '<br/><br/>Numero di protocollo associato alla pratica: <b>' + (pratica.numero_protocollo || 'N.D.') + '</b>.';
    return msg;
  }

  emailNotificaInserimentoDeterminaAttori(pratica): string {
    let msg = 'Agli uffici competenti,';
        msg += '<br/><br/>con la presente email si comunica che alla pratica ';
        msg += this.utilityService.getTipologiaProcessoLabel(pratica);
        msg += ' del cittadino identificato con il codice fiscale <b>' + pratica.anagrafica.codice_fiscale + '</b>';
        msg += ' è stata associata la determina.';
        msg += '<br/><br/>L\'identificativo della determina è: <b>' + pratica.determina.id + '</b>.'; 
        msg += '<br/><br/>Il numero di protocollo associato a questa operazione è: <b>' + (pratica.numero_protocollo_comunicazione || 'N.D.') + '</b>.';
        msg += '<br/><br/>Numero di protocollo associato alla pratica: <b>' + (pratica.numero_protocollo || 'N.D.') + '</b>.';
    return msg;
  }

  emailNotificaRitiroCartelloCittadino(pratica): string {
    let msg = 'Gentile Sig./Sig.ra ' + pratica.anagrafica.cognome + ',';
        msg += '<br/><br/>con la presente email le comunichiamo che la pratica ';
        msg += this.utilityService.getTipologiaProcessoLabel(pratica);
        msg += ' di passo carrabile da lei richiesta per l\'indirizzo <b>' + pratica.dati_istanza.indirizzo_segnale_indicatore.indirizzo + '</b> ';
        msg += ' relativa al numero di protocollo <b>' + (pratica.numero_protocollo || 'N.D.') + '</b> è conclusa con successo.';
        msg += '<br/><br/>Le chiediamo gentilmente di recarsi presso gli sportelli del municipio di appartenenza per il ritiro del segnale indicatore di passo carrabile.';
        msg += '<br/><br/>Per conoscere indirizzo e orari di ricevimento del Municipio ' + pratica.dati_istanza.indirizzo_segnale_indicatore.municipio_id + ' ';
        msg += 'è possibile consultare il seguente link: https://www.comune.bari.it/web/egov/-/passo-carrabile-rilascio-concessione-e-contrassegno .'; 
    return msg;
  }

  emailNotificaRitiroCartelloAttori(pratica): string {
    let msg = 'Agli uffici competenti,';
        msg += '<br/><br/>con la presente email si comunica che alla pratica del cittadino identificato con il codice fiscale <b>' + pratica.anagrafica.codice_fiscale + '</b>';
        msg += ' sono state associate le ricevute di pagamento. ';
        msg += '<br/><br/>Il cittadino, quindi, è stato informato della possibilità di <u>ritirare il segnale indicatore</u> presso lo sportello del municipio di appartenenza.';
        msg += '<br/><br/>Il numero di protocollo associato a questa operazione è: <b>' + (pratica.numero_protocollo_comunicazione || 'N.D.') + '</b>.';
        msg += '<br/><br/>Numero di protocollo associato alla pratica: <b>' + (pratica.numero_protocollo || 'N.D.') + '</b>.';
    return msg;
  }

  emailCartelloConsegnatoCittadino(pratica): string {
    let msg = 'Gentile Sig./Sig.ra ' + pratica.anagrafica.cognome + ',';
        msg += '<br/><br/>con la presente email le comunichiamo che la pratica da lei richiesta in data <b>' + this.datePipe.transform(pratica.data_inserimento, true) + '</b>';
        msg += ' per l\'indirizzo del passo carrabile <b>' + pratica.dati_istanza.indirizzo_segnale_indicatore.indirizzo + '</b>';
        msg += ' è <b>conclusa</b>.<br/><br/>Il segnale indicatore di passo carrabile è stato <u><b>rilasciato</b></u>.';
        msg += '<br/><br/>Numero di protocollo associato alla pratica: <b>' + (pratica.numero_protocollo || 'N.D.') + '</b>.';
    return msg;
  }

  emailCartelloConsegnatoMunicipio(pratica): string {
    let msg = 'Agli uffici competenti,';
        msg += '<br/><br/>con la presente email si comunica che la pratica del cittadino identificato con il codice fiscale <b>' + pratica.anagrafica.codice_fiscale + '</b>';
        msg += ' è conclusa.<br/><br/>Il segnale indicatore di passo carrabile identificato dal tag RFID n. <b>' + (pratica.tag_rfid || 'N.D.') + '</b> è stato <b>rilasciato</b>';
        msg += ' per l\'indirizzo <b>' + pratica.dati_istanza.indirizzo_segnale_indicatore.indirizzo + '</b>.';
        msg += '<br/><br/>Numero di protocollo associato alla pratica: <b>' + (pratica.numero_protocollo || 'N.D.') + '</b>.';
    return msg;
  }

  emailNotificaRigettoPraticaCittadino(pratica): string {
    let msg = 'Gentile Sig./Sig.ra ' + pratica.anagrafica.cognome + ',';
        msg += '<br/><br/>con la presente email le comunichiamo che la pratica ';
        msg += this.utilityService.getTipologiaProcessoLabel(pratica);
        msg += ' da lei richiesta in data <b>' + this.datePipe.transform(pratica.data_inserimento, true) + '</b>';
        msg += ' per l\'indirizzo del passo carrabile <b>' + pratica.dati_istanza.indirizzo_segnale_indicatore.indirizzo + '</b>';
        msg += ' è stata <u><b>rigettata</b></u>.';
        msg += '<br/><br/>Il numero di protocollo associato a questa operazione è: <b>' + (pratica.numero_protocollo_comunicazione || 'N.D.') + '</b>.';
        msg += '<br/><br/>Numero di protocollo associato alla pratica: <b>' + (pratica.numero_protocollo || 'N.D.') + '</b>.';
    return msg;
  }

  emailNotificaRigettoPraticaAttori(pratica): string {
    let msg = 'Agli uffici competenti,';
        msg += '<br/><br/>con la presente email si comunica che la pratica ';
        msg += this.utilityService.getTipologiaProcessoLabel(pratica);
        msg += ' del cittadino identificato con il codice fiscale <b>' + pratica.anagrafica.codice_fiscale + '</b>';
        msg += ' è stata <b>rigettata</b>.';
        msg += '<br/><br/>Il numero di protocollo associato alla pratica è: <b>' + (pratica.numero_protocollo || 'N.D.') + '</b>.';
    return msg;
  }

  emailRettificaPraticaCittadino(pratica): string {
    let msg = 'Gentile Sig./Sig.ra ' + pratica.anagrafica.cognome + ',';
        msg += '<br/><br/>con la presente email le comunichiamo che la pratica relativa al segnale indicatore ';
        msg += 'dell\'indirizzo <b>' + pratica.dati_istanza.indirizzo_segnale_indicatore.indirizzo + '</b> ';
        msg += 'ha subito una rettifica dovuta alla presenza di errori materiali.';
        // if(pratica.informazioni_rettifica?.note){
        //   msg += '<br/><br/>Di seguito le note dell\'operatore che ne spiegano la motivazione.';
        //   msg += '<br/><br/><b>Note</b>: ' + pratica.informazioni_rettifica.note + '.';
        // }       
        msg += '<br/><br/>Il numero di protocollo associato alla pratica è il seguente: <b>' + (pratica.numero_protocollo || 'N.D.') + '</b>.';
    return msg;
  }

  emailRettificaPraticaAttori(pratica): string {
    let msg = 'Agli uffici competenti,';
        msg += '<br/><br/>con la presente email si comunica che la pratica del cittadino identificato con il codice fiscale <b>' + pratica.anagrafica.codice_fiscale + '</b>';
        msg += ' per l\'indirizzo <b>' + pratica.dati_istanza.indirizzo_segnale_indicatore.indirizzo + '</b> ';
        msg += ' è stata rettificata.';
        msg += '<br/><br/>Il numero di protocollo associato alla pratica è: <b>' + (pratica.numero_protocollo || 'N.D.') + '</b>.';
        msg += '<br/><br/>Il numero di protocollo associato a questa operazione è: <b>' + (pratica.numero_protocollo_comunicazione || 'N.D.') + '</b>.';

    return msg;
  }

  emailNotificaRettificaPraticaIstruttore(pratica): string {
    let msg = 'Agli uffici competenti,';
        msg += '<br/><br/>con la presente email si comunica che la pratica del cittadino identificato con il codice fiscale <b>' + pratica.anagrafica.codice_fiscale + '</b>';
        msg += ' necessita una <b>rettifica</b>.';
        msg += '<br/><br/>Il numero di protocollo associato alla pratica è il seguente: <b>' + (pratica.numero_protocollo || 'N.D.') + '</b>.';
        if(pratica.informazioni_rettifica?.note){
          msg += '<br/><br/>Di seguito le note dell\'operatore che ne spiegano la motivazione.';
          msg += '<br/><br/><b>Note</b>: ' + pratica.informazioni_rettifica.note + '.';
        }       
    return msg;
  }

  emailCartelloRitiratoCittadino(pratica): string {
    let msg = 'Gentile Sig./Sig.ra ' + pratica.anagrafica.cognome + ',';
        msg += '<br/><br/>con la presente email le notifichiamo che il segnale indicatore relativo alla richiesta di passo carrabile associato ';
        msg +=  'al numero di protocollo <b>' + (pratica.numero_protocollo || 'N.D.') + '</b> è stato restituito.';
    return msg;
  }

  emailCartelloRitiratoMunicipio(pratica): string {
    let msg = 'Agli uffici competenti,';
        msg += '<br/><br/>con la presente email si comunica che il segnale indicatore di passo carrabile identificato dal tag RFID n. <b>' + (pratica.tag_rfid || pratica.dati_istanza.link_pratica_origine?.tag_rfid || 'N.D.') + '</b>';
        msg += ' relativo alla pratica del cittadino identificato con il codice fiscale <b>' + pratica.anagrafica.codice_fiscale + '</b> è stato <b>restituito</b>.';
        msg += '<br/><br/>Numero di protocollo associato alla pratica: <b>' + (pratica.numero_protocollo || 'N.D.') + '</b>.';
    return msg;
  }

  emailNotificaRipristinoLuoghiCittadino(pratica): string {
    let msg = 'Gentile ' + pratica.anagrafica.nome + ' ' + pratica.anagrafica.cognome + ',';
        msg += '<br/><br/>con la presente email le comunichiamo che, in seguito alla richiesta di rinuncia della concessione';
        msg += ' per l\'indirizzo del passo carrabile <b>' + pratica.dati_istanza.indirizzo_segnale_indicatore.indirizzo + '</b>,';
        msg += ' ha a disposizione 30 giorni per effettuare i lavori a regola d\'arte per il ripristino dei luoghi;';
        msg += ' oltre tale termine (<b>' + this.datePipe.transform(pratica.data_scadenza_diniego, true) + '</b>), sarà utilizzata la cauzione infruttifera per il suddetto ripristino dei luoghi.';
        msg += '<br/><br/>Di seguito le note dell\'operatore:<br/>- '+ pratica.parere_municipio.note + '';
        msg += '<br/><br/>Il numero di protocollo associato a questa operazione è: <b>' + (pratica.numero_protocollo_comunicazione || 'N.D.') + '</b>.';
        msg += '<br/><br/>Numero di protocollo associato alla pratica: <b>' + (pratica.numero_protocollo || 'N.D.') + '</b>.';
    return msg;
  }

  emailNotificaRipristinoLuoghiAttori(pratica): string {
    let msg = 'Agli uffici competenti,';
        msg += '<br/><br/>con la presente email si comunica che, in seguito alla richiesta di rinuncia della concessione';
        msg += ' del cittadino identificato con il codice fiscale <b>' + pratica.anagrafica.codice_fiscale + '</b>,';
        msg += ' per l\'indirizzo <b>' + pratica.dati_istanza.indirizzo_segnale_indicatore.indirizzo + ' ';
        msg += 'è stata comunicata la richiesta di ripristino dei luoghi.';
        msg += '<br/><br/>Il ripristino dei luoghi deve avvenire entro <b>' + this.datePipe.transform(pratica.data_scadenza_diniego, true) + '</b>.';
        msg += '<br/><br/>Il numero di protocollo associato a questa operazione è: <b>' + (pratica.numero_protocollo_comunicazione || 'N.D.') + '</b>.';
        msg += '<br/><br/>Numero di protocollo associato alla pratica: <b>' + (pratica.numero_protocollo || 'N.D.') + '</b>.';
    return msg;
  }

  emailNotificaUtilizzoCauzioneInfruttiferaCittadino(pratica): string {
    let msg = 'Gentile Sig./Sig.ra ' + pratica.anagrafica.cognome + ',';
        msg += '<br/><br/>con la presente email le comunichiamo che per il ripristino dei luoghi, in seguito alla richiesta di rinuncia della concessione';
        msg += ' per l\'indirizzo del passo carrabile <b>' + pratica.dati_istanza.indirizzo_segnale_indicatore.indirizzo + '</b>,';
        msg += ' sarà utilizzata la cauzione infruttifera depositata.';
        msg += '<br/><br/>Di seguito le note dell\'operatore:<br/>- '+ pratica.parere_municipio.note + '';
        msg += '<br/><br/>Il numero di protocollo associato a questa operazione è: <b>' + (pratica.numero_protocollo_comunicazione || 'N.D.') + '</b>.';
        msg += '<br/><br/>Numero di protocollo associato alla pratica: <b>' + (pratica.numero_protocollo || 'N.D.') + '</b>.';
    return msg;
  }

  emailNotificaUtilizzoCauzioneInfruttiferaAttori(pratica): string {
    let msg = 'Agli uffici competenti,';
        msg += '<br/><br/>con la presente email si comunica che per il ripristino dei luoghi';
        msg += ' per l\'indirizzo <b>' + pratica.dati_istanza.indirizzo_segnale_indicatore.indirizzo + '</b>, in seguito alla richiesta di rinuncia della concessione';
        msg += ' del cittadino identificato con il codice fiscale <b>' + pratica.anagrafica.codice_fiscale + '</b>, ';
        msg += ' sarà utilizzata la cauzione infruttifera depositata.';
        msg += '<br/><br/>Il numero di protocollo associato a questa operazione è: <b>' + (pratica.numero_protocollo_comunicazione || 'N.D.') + '</b>.';
        msg += '<br/><br/>Numero di protocollo associato alla pratica: <b>' + (pratica.numero_protocollo || 'N.D.') + '</b>.';
    return msg;
  }

  emailAvvioPraticaSenzaAssegnazioneCittadino(pratica): string {
    let msg = 'Gentile Sig./Sig.ra ' + pratica.anagrafica.cognome + ',';
        msg += '<br/><br/>con la presente email le notifichiamo che è stata avviata la pratica ';
        msg += this.utilityService.getTipologiaProcessoLabel(pratica);
        msg += ' da lei richiesta in data <b>' + this.datePipe.transform(pratica.data_inserimento, true) + '</b>';
        msg += ' per l\'indirizzo del passo carrabile <b>' + pratica.dati_istanza.indirizzo_segnale_indicatore.indirizzo + '</b>.'; 
        msg += '<br/><br/>L\'istruttore municipio che si occuperà della gestione della pratica è <b>' + pratica.proprietario_pratica.utente + '</b>.';
        msg += '<br/><br/>Numero di protocollo associato alla pratica: <b>' + (pratica.numero_protocollo || 'N.D.') + '</b>.';
    return msg;
  }

  emailAvvioPraticaSenzaAssegnazioneAttori(pratica): string {
    let msg = 'Agli uffici competenti,';
        msg += '<br/><br/>con la presente email si comunica che è stata avviata la pratica ';
        msg += this.utilityService.getTipologiaProcessoLabel(pratica);
        msg += ' richiesta dal cittadino identificato con il codice fiscale <b>' + pratica.anagrafica.codice_fiscale + '</b> ';
        msg += ' in data <b>' + this.datePipe.transform(pratica.data_inserimento, true) + '</b> per l\'indirizzo: <b>' + pratica.dati_istanza.indirizzo_segnale_indicatore.indirizzo + '</b>.'; 
        msg += '<br/><br/>L\'istruttore municipio di riferimento per la pratica è <b>' + pratica.proprietario_pratica.utente + '</b>.';
        msg += '<br/><br/>Numero di protocollo associato alla pratica: <b>' + (pratica.numero_protocollo || 'N.D.') + '</b>.';
    return msg;
  }

  emailNotificaApprovazioneProrogaCittadino(pratica): string {
    let msg = 'Gentile Sig./Sig.ra ' + pratica.anagrafica.cognome + ',';
        msg += '<br/><br/>con la presente email le comunichiamo che la pratica ';
        msg += this.utilityService.getTipologiaProcessoLabel(pratica);
        msg += ' da lei richiesta in data <b>' + this.datePipe.transform(pratica.data_inserimento, true) + '</b>';
        msg += ' per l\'indirizzo del passo carrabile <b>' + pratica.dati_istanza.indirizzo_segnale_indicatore.indirizzo + '</b>';
        msg += ' è stata <b>approvata</b>.';
        msg += '<br/><br/>Il numero di protocollo associato a questa operazione è: <b>' + (pratica.numero_protocollo_comunicazione || 'N.D.') + '</b>.';
        msg += '<br/><br/>Numero di protocollo associato alla pratica: <b>' + (pratica.numero_protocollo || 'N.D.') + '</b>.';
    return msg;
  }

  emailNotificaApprovazioneProrogaAttori(pratica): string {
    let msg = 'Agli uffici competenti,';
        msg += '<br/><br/>con la presente email si comunica che la pratica ';
        msg += this.utilityService.getTipologiaProcessoLabel(pratica);
        msg += ' del cittadino identificato con il codice fiscale <b>' + pratica.anagrafica.codice_fiscale + '</b>';
        msg += ' per l\'indirizzo <b>' + pratica.dati_istanza.indirizzo_segnale_indicatore.indirizzo + '</b> è stata <b>approvata</b>.';
        msg += '<br/><br/>Numero di protocollo associato alla pratica: <b>' + (pratica.numero_protocollo || 'N.D.') + '</b>.';
    return msg;
  }

  emailAvvioPraticaRevoca(pratica): string {
    let msg = 'Agli uffici competenti,';
    msg += '<br/><br/>con la presente email si comunica che è stata avviata la pratica ';
    msg += this.utilityService.getTipologiaProcessoLabel(pratica);
    msg += ' relativa al cittadino identificato con il codice fiscale <b>' + pratica.anagrafica.codice_fiscale + '</b> ';
    msg += ' in data <b>' + this.datePipe.transform(pratica.data_inserimento, true) + '</b> per l\'indirizzo: <b>' + pratica.dati_istanza.indirizzo_segnale_indicatore.indirizzo + '</b>.'; 
    msg += '<br/><br/>Numero di protocollo associato alla pratica: <b>' + (pratica.numero_protocollo || 'N.D.') + '</b>.';
    return msg;
  }

  emailPresaInCaricoRevocaCittadino(pratica): string {
    let msg = 'Gentile Sig./Sig.ra ' + pratica.anagrafica.cognome + ',';
        msg += '<br/><br/>con la presente email le notifichiamo che è stata avviata una pratica ';
        msg += this.utilityService.getTipologiaProcessoLabel(pratica);
        msg += ' in data <b>' + this.datePipe.transform(pratica.data_inserimento, true) + '</b>';
        msg += ' per l\'indirizzo del passo carrabile <b>' + pratica.dati_istanza.indirizzo_segnale_indicatore.indirizzo + '</b>.';
        msg += '<br/><br/>Di seguito le note dell\'operatore che spiegano i lavori da apportare per evitare la revoca:<br/> ' + pratica.parere_municipio.lavori_richiesti + '';
        msg += '<br/><br/>I lavori dovranno essere avviati entro il <b>' + this.datePipe.transform(pratica.data_scadenza_inizio_lavori, true) + '</b>.';
        msg += '<br/><br/>L\'istruttore municipio che si occuperà della gestione della pratica è <b>' + pratica.proprietario_pratica.utente + '</b>.';
        msg += '<br/><br/>Il numero di protocollo associato a questa operazione è: <b>' + (pratica.numero_protocollo_comunicazione || 'N.D.') + '</b>.'; 
        msg += '<br/><br/>Numero di protocollo associato alla pratica: <b>' + (pratica.numero_protocollo || 'N.D.') + '</b>.';
    return msg;
  }

  emailPresaInCaricoRevocaMunicipio(pratica): string {
    let msg = 'Agli uffici competenti,';
        msg += '<br/><br/>con la presente email si comunica che la pratica ';
        msg += this.utilityService.getTipologiaProcessoLabel(pratica);
        msg += ' relativa al cittadino identificato con il codice fiscale <b>' + pratica.anagrafica.codice_fiscale + '</b>';
        msg += ' è stata assegnata.';
        msg += '<br/><br/>L\'istruttore municipio di riferimento per la pratica è <b>' + pratica.proprietario_pratica.utente + '</b>.';
        msg += '<br/><br/>Il numero di protocollo associato a questa operazione è: <b>' + (pratica.numero_protocollo_comunicazione || 'N.D.') + '</b>.'; 
        msg += '<br/><br/>Numero di protocollo associato alla pratica: <b>' + (pratica.numero_protocollo || 'N.D.') + '</b>.';
    return msg;
  }

  emailDichiarazioneInizioLavoriCittadino(pratica): string {
    let msg = 'Gentile Sig./Sig.ra ' + pratica.anagrafica.cognome + ',';
        msg += '<br/><br/>con la presente email le notifichiamo che la pratica ';
        msg += this.utilityService.getTipologiaProcessoLabel(pratica);
        msg += ' avviata in data <b>' + this.datePipe.transform(pratica.data_inserimento, true) + '</b>';
        msg += ' per l\'indirizzo del passo carrabile <b>' + pratica.dati_istanza.indirizzo_segnale_indicatore.indirizzo + '</b>';
        msg += ' è stata inoltrata al Comune di Bari dopo la dichiarazione di inizio lavori.';
        msg += '<br/><br/>La data dichiarata di fine lavori è <b>' + this.datePipe.transform(pratica.data_scadenza_fine_lavori, true) + '</b>.';
        msg += '<br/><br/>Il numero di protocollo associato a questa operazione è: <b>' + (pratica.numero_protocollo_comunicazione || 'N.D.') + '</b>.';
        msg += '<br/><br/>Numero di protocollo associato alla pratica: <b>' + (pratica.numero_protocollo || 'N.D.') + '</b>.';
    return msg;
  }

  emailDichiarazioneInizioLavoriMunicipio(pratica): string {
    let msg = 'Agli uffici competenti,';
        msg += '<br/><br/>con la presente email si comunica che il cittadino identificato con il codice fiscale <b>' + pratica.anagrafica.codice_fiscale + '</b>';
        msg += ' per l\'indirizzo del passo carrabile <b>' + pratica.dati_istanza.indirizzo_segnale_indicatore.indirizzo + '</b>';
        msg += ' ha allegato la documentazione relativa all\' inizio del lavori.'
        msg += '<br/><br/>La data dichiarata di fine lavori è <b>' + this.datePipe.transform(pratica.data_scadenza_fine_lavori, true) + '</b>.';
        msg += '<br/><br/>Il numero di protocollo associato a questa operazione è: <b>' + (pratica.numero_protocollo_comunicazione || 'N.D.') + '</b>.';
        msg += '<br/><br/>Numero di protocollo associato alla pratica: <b>' + (pratica.numero_protocollo || 'N.D.') + '</b>.';
    return msg;
  }

  emailNotificaRichiestaFineLavoriCittadino(pratica): string {
    let msg = 'Gentile ' + pratica.anagrafica.nome + ' ' + pratica.anagrafica.cognome + ',';
        msg += '<br/><br/>con la presente email le notifichiamo che i documenti e la data di fine lavori da lei dichiarati per la pratica ';
        msg += this.utilityService.getTipologiaProcessoLabel(pratica);
        msg += ' avviata in data <b>' + this.datePipe.transform(pratica.data_inserimento, true) + '</b>';
        msg += ' per l\'indirizzo del passo carrabile <b>' + pratica.dati_istanza.indirizzo_segnale_indicatore.indirizzo + '</b>';
        msg += ' sono stati approvati.';
        msg += '<br/><br/>I lavori dovranno essere terminati entro il <b>' + this.datePipe.transform(pratica.data_scadenza_fine_lavori, true) + '</b>.';
        msg += '<br/><br/>Il numero di protocollo associato a questa operazione è: <b>' + (pratica.numero_protocollo_comunicazione || 'N.D.') + '</b>.';
        msg += '<br/><br/>Numero di protocollo associato alla pratica: <b>' + (pratica.numero_protocollo || 'N.D.') + '</b>.';
    return msg;
  }

  emailNotificaRichiestaFineLavoriMunicipio(pratica): string {
    let msg = 'Agli uffici competenti,';
        msg += '<br/><br/>con la presente email si comunica che il cittadino identificato con il codice fiscale <b>' + pratica.anagrafica.codice_fiscale + '</b>';
        msg += ' per l\'indirizzo del passo carrabile <b>' + pratica.dati_istanza.indirizzo_segnale_indicatore.indirizzo + '</b>';
        msg += ' ha correttamente allegato la documentazione relativa all\' inizio del lavori.'
        msg += '<br/><br/>I lavori dovranno essere terminati entro il <b>' + this.datePipe.transform(pratica.data_scadenza_fine_lavori, true) + '</b>.';
        msg += '<br/><br/>Il numero di protocollo associato a questa operazione è: <b>' + (pratica.numero_protocollo_comunicazione || 'N.D.') + '</b>.';
        msg += '<br/><br/>Numero di protocollo associato alla pratica: <b>' + (pratica.numero_protocollo || 'N.D.') + '</b>.';
    return msg;
  }

  emailNotificaRevocaPraticaCittadino(pratica): string {
    let msg = 'Gentile Sig./Sig.ra ' + pratica.anagrafica.cognome + ',';
        msg += '<br/><br/>con la presente email le comunichiamo che la concessione';
        msg += ' per l\'indirizzo del passo carrabile <b>' + pratica.dati_istanza.indirizzo_segnale_indicatore.indirizzo + '</b>';
        msg += ' è stata <b>revocata</b>.';
        msg += '<br/><br/>Il segnale indicatore dovrà essere riconsegnato entro il <b>' + this.datePipe.transform(pratica.data_scadenza_restituzione, true) + '</b>.';
        msg += '<br/><br/>Il numero di protocollo associato a questa operazione è: <b>' + (pratica.numero_protocollo_comunicazione || 'N.D.') + '</b>.';
        msg += '<br/><br/>Numero di protocollo associato alla pratica: <b>' + (pratica.numero_protocollo || 'N.D.') + '</b>.';
    return msg;
  }

  emailNotificaRevocaPraticaAttori(pratica): string {
    let msg = 'Agli uffici competenti,';
        msg += '<br/><br/>con la presente email si comunica che la concessione ';
        msg += ' del cittadino identificato con il codice fiscale <b>' + pratica.anagrafica.codice_fiscale + '</b>';
        msg += ' per l\'indirizzo del passo carrabile <b>' + pratica.dati_istanza.indirizzo_segnale_indicatore.indirizzo + '</b>';
        msg += ' è stata <b>revocata</b>.';
        msg += '<br/><br/>Il segnale indicatore dovrà essere riconsegnato entro il <b>' + this.datePipe.transform(pratica.data_scadenza_restituzione, true) + '</b>.';
        msg += '<br/><br/>Il numero di protocollo associato a questa operazione è: <b>' + (pratica.numero_protocollo_comunicazione || 'N.D.') + '</b>.';
        msg += '<br/><br/>Numero di protocollo associato alla pratica: <b>' + (pratica.numero_protocollo || 'N.D.') + '</b>.';
    return msg;
  }

  emailDichiarazioneFineLavoriCittadino(pratica): string {
    let msg = 'Gentile ' + pratica.anagrafica.nome + ' ' + pratica.anagrafica.cognome + ',';
        msg += '<br/><br/>con la presente email le notifichiamo che la pratica ';
        msg += this.utilityService.getTipologiaProcessoLabel(pratica);
        msg += ' avviata in data <b>' + this.datePipe.transform(pratica.data_inserimento, true) + '</b>';
        msg += ' per l\'indirizzo del passo carrabile <b>' + pratica.dati_istanza.indirizzo_segnale_indicatore.indirizzo + '</b>';
        msg += ' è stata inoltrata al Comune di Bari dopo la dichiarazione di fine lavori.';
        msg += '<br/><br/>Il numero di protocollo associato a questa operazione è: <b>' + (pratica.numero_protocollo_comunicazione || 'N.D.') + '</b>.';
        msg += '<br/><br/>Numero di protocollo associato alla pratica: <b>' + (pratica.numero_protocollo || 'N.D.') + '</b>.';
    return msg;
  }

  emailDichiarazioneFineLavoriMunicipio(pratica): string {
    let msg = 'Agli uffici competenti,';
        msg += '<br/><br/>con la presente email si comunica che il cittadino identificato con il codice fiscale <b>' + pratica.anagrafica.codice_fiscale + '</b>';
        msg += ' per l\'indirizzo del passo carrabile <b>' + pratica.dati_istanza.indirizzo_segnale_indicatore.indirizzo + '</b>';
        msg += ' ha allegato la documentazione relativa alla fine dei lavori.'
        msg += '<br/><br/>Il numero di protocollo associato a questa operazione è: <b>' + (pratica.numero_protocollo_comunicazione || 'N.D.') + '</b>.';
        msg += '<br/><br/>Numero di protocollo associato alla pratica: <b>' + (pratica.numero_protocollo || 'N.D.') + '</b>.';
    return msg;
  }

  emailNotificaPraticaRevocaAnnullataCittadino(pratica): string {
    let msg = 'Gentile Sig./Sig.ra ' + pratica.anagrafica.cognome + ',';
        msg += '<br/><br/>con la presente email le comunichiamo che la pratica ';
        msg += this.utilityService.getTipologiaProcessoLabel(pratica);
        msg += ' per l\'indirizzo del passo carrabile <b>' + pratica.dati_istanza.indirizzo_segnale_indicatore.indirizzo + '</b>';
        msg += ' è stata <b>annullata</b>.';
        msg += '<br/><br/>Numero di protocollo associato alla pratica: <b>' + (pratica.numero_protocollo || 'N.D.') + '</b>.';
    return msg;
  }

  emailNotificaPraticaRevocaAnnullataAttori(pratica): string {
    let msg = 'Agli uffici competenti,';
        msg += '<br/><br/>con la presente email si comunica che la pratica ';
        msg += this.utilityService.getTipologiaProcessoLabel(pratica);
        msg += ' del cittadino identificato con il codice fiscale <b>' + pratica.anagrafica.codice_fiscale + '</b>';
        msg += ' per l\'indirizzo del passo carrabile <b>' + pratica.dati_istanza.indirizzo_segnale_indicatore.indirizzo + '</b>';
        msg += ' è stata <b>annullata</b>. Essa verrà archiviata.';
        msg += '<br/><br/>Numero di protocollo associato alla pratica: <b>' + (pratica.numero_protocollo || 'N.D.') + '</b>.';
    return msg;
  }

  emailPresaInCaricoDecadenzaCittadino(pratica): string {
    let msg = 'Gentile Sig./Sig.ra ' + pratica.anagrafica.cognome + ',';
    msg += '<br/><br/>con la presente email le notifichiamo che è stata avviata';
    msg += ' in <b>data ' + this.datePipe.transform(pratica.data_inserimento, true) + '</b>';
    msg += ' una pratica di ' + this.utilityService.getTipologiaProcessoLabel(pratica);
    msg += ' per il <b>passo carrabile sito in ' + pratica.dati_istanza.indirizzo_segnale_indicatore.indirizzo + '</b>.';
    msg += '<br/><br/>Di seguito le note dell\'operatore che spiegano i motivi della decadenza della concessione:<br/>- ' + pratica.parere_municipio.note_decadenza + '';
    msg += '<br/><br/>La decadenza sarà esecutiva dal <b>' + this.datePipe.transform(pratica.data_scadenza_notifica_decadenza, true) + '</b>.';
    msg += '<br/><br/>L\'istruttore municipio '+ pratica.dati_istanza.indirizzo_segnale_indicatore.municipio_id + ' che si occuperà della gestione della pratica è <b>' + pratica.proprietario_pratica.utente + '</b>.';
    msg += '<br/><br/>Numero di protocollo associato alla pratica: <b>' + (pratica.numero_protocollo || 'N.D.') + '</b>.';
    return msg;
  }

  emailPresaInCaricoDecadenzaMunicipio(pratica): string {
    let msg = 'Agli uffici competenti,';
        msg += '<br/><br/>con la presente email si comunica che la pratica ';
        msg += this.utilityService.getTipologiaProcessoLabel(pratica);
        msg += ' relativa al cittadino identificato con il codice fiscale <b>' + pratica.anagrafica.codice_fiscale + '</b>';
        msg += ' è stata assegnata.';
        msg += '<br/><br/>La decadenza sarà esecutiva dal <b>' + this.datePipe.transform(pratica.data_scadenza_notifica_decadenza, true) + '</b>.';
        msg += '<br/><br/>L\'istruttore municipio di riferimento per la pratica è <b>' + pratica.proprietario_pratica.utente + '</b>.';
        msg += '<br/><br/>Il numero di protocollo associato a questa operazione è: <b>' + (pratica.numero_protocollo_comunicazione || 'N.D.') + '</b>.'; 
        msg += '<br/><br/>Numero di protocollo associato alla pratica: <b>' + (pratica.numero_protocollo || 'N.D.') + '</b>.';
    return msg;
  }

  emailAvvioPraticaRegolarizzazione(pratica): string {
    let msg = 'Agli uffici competenti,';
    msg += '<br/><br/>con la presente email si comunica che è necessario avviare la regolarizzazione del segnale indicatore di passo carrabile';
    msg += ' sito all\'indirizzo <b>' + pratica.indirizzo_segnale_indicatore.indirizzo + '</b>.';
    msg += ' appartenente al cittadino <b>' + pratica.nome + ' ' + pratica.cognome + '</b>.';
    msg += '<br/><br/>Data inserimento richiesta: <b>' + this.datePipe.transform(pratica.last_modification.data_operazione, true) + '</b>.'; 
    msg += '<br/><br/>Numero di protocollo associato alla pratica: <b>' + (pratica.numero_protocollo || 'N.D.') + '</b>.';
    return msg;
  }

  emailAvvioPraticaRegolarizzazioneCittadino(pratica): string {
    let msg = 'Gentile Sig./Sig.ra ' + pratica.cognome + ',';
    msg += '<br/><br/>con la presente email le comunichiamo che è necessario avviare la regolarizzazione del segnale indicatore di passo carrabile';
    msg += ' sito all\'indirizzo <b>' + pratica.indirizzo_segnale_indicatore.indirizzo + '</b>.';
    msg += '<br/><br/>Si prega di avviare una richiesta di nuova concessione, allegando nella documentazione, tra i documenti opzionali, la ricevuta di pagamento del Canone Unico Patrimoniale (ex TOSAP), se pagato.';
    msg += '<br/><br/>La regolarizzazione dovrà essere effettuata entro il: <b>' + this.datePipe.transform(pratica.data_scadenza_regolarizzazione, true) + '</b>.';
    msg += '<br/><br/>Data inserimento richiesta: <b>' + this.datePipe.transform(pratica.last_modification.data_operazione, true) + '</b>.'; 
    msg += '<br/><br/>Numero di protocollo associato alla pratica: <b>' + (pratica.numero_protocollo || 'N.D.') + '</b>.';
    return msg;
  }

  emailAssociazioneTagRFIDCittadino(pratica): string {
    let msg = 'Gentile Sig./Sig.ra ' + pratica.anagrafica.cognome + ',';
    msg += '<br/><br/>con la presente email le comunichiamo che alla pratica da lei richiesta in data <b>' + this.datePipe.transform(pratica.data_inserimento, true) + '</b>';
    msg += ' per l\'indirizzo del passo carrabile <b>' + pratica.dati_istanza.indirizzo_segnale_indicatore.indirizzo + '</b>';
    msg += ' è stato associato il tag RFID.';
    msg += '<br/><br/>Numero di protocollo associato alla pratica: <b>' + (pratica.numero_protocollo || 'N.D.') + '</b>';
    return msg;
  }

  emailAssociazioneTagRFIDMunicipio(pratica): string {
    let msg = 'Agli uffici competenti,';
    msg += '<br/><br/>con la presente email si comunica che al segnale indicatore di passo carrabile';
    msg += ' relativo alla pratica del cittadino identificato con il codice fiscale <b>' + pratica.anagrafica.codice_fiscale + '</b>';
    msg += ' è stato associato il tag RFID n. <b>' + (pratica.tag_rfid || pratica.dati_istanza.link_pratica_origine?.tag_rfid || 'N.D.') + '</b>.';
    msg += '<br/><br/>Numero di protocollo associato alla pratica: <b>' + (pratica.numero_protocollo || 'N.D.') + '</b>';
    return msg;
  }
}
