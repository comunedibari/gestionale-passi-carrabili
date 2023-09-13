import { Injectable } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import { AuthService } from './auth.service';
import { Group } from '../enums/Group.enum';
import {​​​​​​​​ environment }​​​​​​​​ from'../../../environments/environment';
import {​​​​​​​​ HttpClient, HttpHeaders }​​​​​​​​ from'@angular/common/http';
import {​​​​​​​​ map }​​​​​​​​ from'rxjs/operators';
import { TipologiaPratica } from '../enums/TipologiaPratica.enum';
import { StatoPraticaPassiCarrabili } from '../enums/StatoPratica.enum';
import { DateTime } from 'luxon';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { LastModification } from '../models/LastModification';
import { Fabbricato } from '../enums/Fabbricato.enum';
import { TitoloAutorizzativo } from '../enums/TitoloAutorizzativo.enum';

const CodiceFiscale = require('codice-fiscale-js');

@Injectable({
  providedIn: 'root'
})
export class UtilityService {

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private http: HttpClient,
    private fb: FormBuilder
  ) { }

  public n_integrazioni_massime: number = 2;

  goHome(){
    this.router.navigate(['/home']);  
  }

  getRequiredGroup(): string {
    let requiredGroup = '';

    let observable: Observable<any> =  
      this.route.children[0].children[0] 
        ? this.route.children[0].children[0].data
        : this.route.children[0].data;

    observable.subscribe(value => 
    { 
      requiredGroup = value.requiredGroup;
    });

    return requiredGroup;
  }

  camelCaseToSpace = string => {
    return !string ? '' : string.split('')
      .map(char => {
        if (char == char.toUpperCase()) return ` ${char}`;
        return `${char}`;
      })
      .join('');
  };

  capitalize = (s) => {
    if (typeof s !== 'string') return ''
    return s.charAt(0).toUpperCase() + s.slice(1)
  }

  excludeSpecialCharacters(value: string): boolean {
    var regex = /^[A-Za-z0-9 -_.]+$/;
    return regex.test(value);
  }  

  convertJsonToBase64(json) {
    let jsonStr = JSON.stringify(json);
    return btoa(unescape(encodeURIComponent(jsonStr)));
  }

  convertFileToBase64(file){
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  }

  configDynamicDialog(data: any, title: string): DynamicDialogConfig{
    let dialogConfig = new DynamicDialogConfig();
    dialogConfig.data = data;
    // dialogConfig.height = '95%';
    dialogConfig.width = '95%';
    dialogConfig.header = title || "";
    return dialogConfig;
  }

  configDynamicDialogFixed(data: any, title: string, width: number, height: number): DynamicDialogConfig{
    let dialogConfig = new DynamicDialogConfig();
    dialogConfig.data = data;
    dialogConfig.height = `${height}px`;
    dialogConfig.width = `${width}px`;
    dialogConfig.header = title || "";
    return dialogConfig;
  }

  configDynamicDialogFullScreen(data: any, title: string): DynamicDialogConfig{
    let dialogConfig = new DynamicDialogConfig();
    dialogConfig.data = data;
    dialogConfig.height = '95%';
    dialogConfig.width = '95%';
    dialogConfig.header = title || "";
    return dialogConfig;
  }

  getCodiceFiscale(utente): string {
    let cf: any = null;
 
    try {
      cf = new CodiceFiscale({
        name: utente.nome,
        surname: utente.cognome,
        gender: utente.sesso,
        day: utente.datadinascita.getDate(),
        month: utente.datadinascita.getMonth() + 1,
        year: utente.datadinascita.getFullYear(),
        birthplace: utente.luogodinascita,
        birthplaceProvincia: utente.provinciadinascita
      }); 
    } catch (error) {}

    return cf ? <string>cf.cf : "";
  }

  civico(indirizzo: String, municipio_id?: number) {
    let numero = '';  
    let esponente = '';
    let splitIndirizzo = indirizzo.split(',');
    indirizzo = splitIndirizzo[0].trim(); 
 
    if(splitIndirizzo.length > 1){
      numero = splitIndirizzo[1].replace(/\D/g,'');
      var splitNumero = splitIndirizzo[1].split('/');
      if(splitNumero.length > 1){
        esponente = splitNumero[1].trim();
      }
    }
 
    return this.http.post<any>(environment.apiServer + '/api/v1/civico/getDataSingoloMunicipio', 
    { indirizzo, numero, municipio_id, esponente }).pipe(map(data => data.result));
 
  }

  takeEmails(obj: any): Observable<any> {
    let requiredGroup = this.getRequiredGroup();
    let headers = { headers: new HttpHeaders({'requiredgroup': requiredGroup})};

    const url = environment.apiServer + '/api/utility/takeEmails';
    return this.http.post<any>(url, obj, headers);
  }

  getStartOfDay(date: string){
    let dt = DateTime.fromISO(new Date(date).toISOString());
    return dt.startOf('day').toISO();
  }

  getFormattedDate(date: string){
    let dt = DateTime.fromISO(new Date(date).toISOString());
    return dt.startOf('day').toFormat("yyyy-LL-dd");
  }

  getFormattedTodayDate(){
    let dt = DateTime.now();
    return dt.startOf('day').toFormat("dd/LL/yyyy");
  }

  getTimestamp(){
    let dt = DateTime.now();
    return dt.toMillis(); 
  }

  getDataScadenzaPratica(date: string = null, days? : number): Date {
    let dt = !!date ? DateTime.fromISO(new Date(date).toISOString()) : DateTime.local();
    return dt.plus({ days: (days != undefined || days != null ? days : 90) }).startOf('day').toISO();
  }

  getDataScadenzaConcessione(date: string, anni, mesi, giorni): Date {
    let dt = DateTime.fromISO(new Date(date).toISOString());
    return dt.plus({ years: anni, months: mesi, days: giorni }).startOf('day').toISO();
  }

  getGiorniConcessione(data_inizio, data_fine) {
    let dtInizio = DateTime.fromISO(new Date(data_inizio).toISOString()).startOf('day');
    let dtFine = DateTime.fromISO(new Date(data_fine).toISOString()).startOf('day');
    return dtFine.diff(dtInizio, 'days').values.days;
  }

  getAnniMesiGiorniConcessione(data_inizio, data_fine) {
    let dtInizio = DateTime.fromISO(new Date(data_inizio).toISOString()).startOf('day');
    let dtFine = DateTime.fromISO(new Date(data_fine).toISOString()).startOf('day');
    let diff = dtFine.diff(dtInizio, ["years", "months", "days"]);
    return { anni: diff.values.years, mesi: diff.values.months, giorni: diff.values.days };
  }

  getAnniMesiGiorniConcessioneOrigine(data_fine, giorni) {
    let dtFine = DateTime.fromISO(new Date(data_fine).toISOString()).startOf('day');
    let dtInizio = dtFine.minus({ days: giorni }).startOf('day');
    let diff = dtFine.diff(dtInizio, ["years", "months", "days"]);
    return { anni: diff.values.years, mesi: diff.values.months, giorni: diff.values.days };
  }

  getGiorniPassatiPerIntegrazione(data_operazione){
    let dataInizioIntegrazione = DateTime.fromISO(new Date(data_operazione).toISOString()).startOf('day');
    let dateNow = DateTime.local().startOf('day');
    return  dateNow.diff(dataInizioIntegrazione, 'days').values.days;
  }

  getDurataGiorniConcessione(dt_inizio, dt_fine){
    let data_inizio = DateTime.fromISO(new Date(dt_inizio).toISOString()).startOf('day');
    let data_fine = DateTime.fromISO(new Date(dt_fine).toISOString()).startOf('day');
    return  data_fine.diff(data_inizio, 'days').values.days + 1; // Il +1 serve a comprendere il giorno d'inizio
  }

  checkDataAvvioProcesso(data_scadenza, minus_days): boolean {
    let dt = DateTime.fromISO(new Date(data_scadenza).toISOString()).startOf('day');
    let dataLimite = dt.minus({days: minus_days});
    let dateNow = DateTime.local().startOf('day');
    let days = dateNow.diff(dataLimite, 'days').values.days;
    return days > 0 ? false : true;
  }

  checkAvvioDecadenza(data_scadenza_notifica_decadenza): boolean {
    let dataLimite = DateTime.fromISO(new Date(data_scadenza_notifica_decadenza).toISOString()).startOf('day');
    let dateNow = DateTime.local().startOf('day');
    let days = dateNow.diff(dataLimite, 'days').values.days;
    return days >= 0 ? true : false;
  }

  generaDetermina(pratica: any): Observable<any> {
    let requiredGroup = this.getRequiredGroup();
    let headers = new HttpHeaders({'requiredgroup': requiredGroup});

    return this.http.post(environment.apiServer + '/api/utility/generaDetermina', 
      pratica, { headers, responseType: 'blob'} );
  }

  getIdDeterminaByType(pratica) {
    let determinaType = '';

    if(pratica.stato_pratica == StatoPraticaPassiCarrabili['Pratica da rigettare'])
      determinaType = 'determina_rigetto';
    else {
      switch(pratica.dati_istanza.tipologia_processo) { 
        case TipologiaPratica['Concessione Temporanea']:
        case TipologiaPratica['Concessione Permanente']: { 
          determinaType = 'determina_concessione';
          break; 
        } 
        case TipologiaPratica.Rettifica: { 
          determinaType = 'determina_rettifica';
          break; 
        } 
        case TipologiaPratica.Rinnovo: { 
          determinaType = 'determina_rinnovo';
          break; 
        } 
        case TipologiaPratica.Rinuncia: { 
          determinaType = 'determina_rinuncia';
          break; 
        } 
        case TipologiaPratica['Trasferimento titolarità']: { 
          determinaType = 'determina_trasferimento_titolarita';
          break; 
        } 
        case TipologiaPratica.Regolarizzazione:
        case TipologiaPratica['Regolarizzazione furto/deterioramento']: { 
          determinaType = 'determina_regolarizzazione';
          break; 
        } 
        case TipologiaPratica.Revoca: { 
          determinaType = 'determina_revoca';
          break; 
        } 
        case TipologiaPratica.Decadenza: { 
          determinaType = 'determina_decadenza';
          break; 
        } 
        case TipologiaPratica.Proroga: { 
          determinaType = 'determina_proroga';
          break; 
        } 
      } 
    }
    
    return determinaType;
  }

  getDeterminaName(pratica){
    let determinaName = this.getIdDeterminaByType(pratica);
    return `${pratica.id_doc} - ${determinaName}.docx`;
  }

  generaRelazioneServizio(pratica: any): Observable<any> {
    let requiredGroup = this.getRequiredGroup();
    let headers = new HttpHeaders({'requiredgroup': requiredGroup});

    return this.http.post(environment.apiServer + '/api/utility/generaRelazioneServizio', 
      pratica, { headers, responseType: 'blob'} );
  }

  generaIstruttoriaUTD(pratica: any): Observable<any> {
    let requiredGroup = this.getRequiredGroup();
    let headers = new HttpHeaders({'requiredgroup': requiredGroup});

    return this.http.post(environment.apiServer + '/api/utility/generaIstruttoriaUTD', 
      pratica, { headers, responseType: 'blob'} );
  }

  generaIstruttoriaUrbanistica(pratica: any): Observable<any> {
    let requiredGroup = this.getRequiredGroup();
    let headers = new HttpHeaders({'requiredgroup': requiredGroup});

    return this.http.post(environment.apiServer + '/api/utility/generaIstruttoriaUrbanistica', 
      pratica, { headers, responseType: 'blob'} );
  }

  formattazioneDatePerFE(istanza) {
    if(istanza.anagrafica.data_nascita)
      istanza.anagrafica.data_nascita = new Date(istanza.anagrafica.data_nascita);
  
    if(istanza.data_inserimento)
      istanza.data_inserimento = new Date(istanza.data_inserimento); 
  
    if(istanza.data_scadenza_procedimento)
      istanza.data_scadenza_procedimento = new Date(istanza.data_scadenza_procedimento); 
  
    if(istanza.data_scadenza_integrazione)
      istanza.data_scadenza_integrazione = new Date(istanza.data_scadenza_integrazione);
  
    if(istanza.data_scadenza_diniego)
      istanza.data_scadenza_diniego = new Date(istanza.data_scadenza_diniego);
      
    if(istanza.data_scadenza_pagamento)
      istanza.data_scadenza_pagamento = new Date(istanza.data_scadenza_pagamento);
  
    if(istanza.dati_istanza.data_scadenza_concessione)
      istanza.dati_istanza.data_scadenza_concessione = new Date(istanza.dati_istanza.data_scadenza_concessione);

    if(istanza.dati_istanza.link_pratica_origine){
      istanza.dati_istanza.link_pratica_origine.data_scadenza_concessione = new Date(istanza.dati_istanza.link_pratica_origine.data_scadenza_concessione);
      istanza.dati_istanza.link_pratica_origine.data_emissione = new Date(istanza.dati_istanza.link_pratica_origine.data_emissione);
    }
      
    if(istanza.data_scadenza_restituzione)
      istanza.data_scadenza_restituzione = new Date(istanza.data_scadenza_restituzione);

    if(istanza.data_scadenza_inizio_lavori)
      istanza.data_scadenza_inizio_lavori = new Date(istanza.data_scadenza_inizio_lavori);
    
    if(istanza.data_scadenza_fine_lavori)
      istanza.data_scadenza_fine_lavori = new Date(istanza.data_scadenza_fine_lavori);
      
    if(istanza.data_scadenza_notifica_decadenza)
      istanza.data_scadenza_notifica_decadenza = new Date(istanza.data_scadenza_notifica_decadenza);
    
    if(istanza.determina && istanza.determina.data_emissione)
      istanza.determina.data_emissione = new Date(istanza.determina.data_emissione);

    if(istanza.determina_rettifica && istanza.determina_rettifica.data_emissione)
      istanza.determina_rettifica.data_emissione = new Date(istanza.determina_rettifica.data_emissione);

    if(istanza.marca_bollo_pratica)
      istanza.marca_bollo_pratica.data_operazione = new Date(istanza.marca_bollo_pratica.data_operazione);
      
    if(istanza.marca_bollo_determina)
      istanza.marca_bollo_determina.data_operazione = new Date(istanza.marca_bollo_determina.data_operazione);
  }

  checkAvvioProroga(pratica, preAvvio = false): boolean {
    let days = pratica.dati_istanza.durata_giorni_concessione;   

    if(preAvvio) {
      return days < 365 ? true : false;
    }
    else {
      days += pratica.dati_istanza.link_pratica_origine.durata_giorni_concessione;
      return days <= 365 ? true : false;
    }
  }

  checkDichiarazioniTrasferimentoTitolarita(pratica): boolean {
    let allTrue = true;
    //determino se mi trovo nel caso del flusso completo o semplificato
    Object.keys(pratica.dichiarazioni_modifiche_luoghi).forEach(key => {
      if(!pratica.dichiarazioni_modifiche_luoghi[key])
        allTrue = false;
    });
    return allTrue;
  }

  markAsDirtied(group: FormGroup) {
    group.markAllAsTouched();
    Object.keys(group.controls).map((field) => {
      var control = group.get(field);
      if (control instanceof FormControl && control.valid == false) {
        control.markAsDirty()
      } else if (control instanceof FormGroup) {
        this.markAsDirtied(control);
      }
    });
  }

  getTemplateDocumenti(): Observable<any> {
    let requiredGroup = this.getRequiredGroup();
    let headers = { headers: new HttpHeaders({'requiredgroup': requiredGroup})};

    const url = environment.apiServer + '/api/utility/getTemplateDocumenti';
    return this.http.get<any>(url, headers);
  }

  getTemplateDocumento(id): Observable<any> {
    let requiredGroup = this.getRequiredGroup();
    let headers = { headers: new HttpHeaders({'requiredgroup': requiredGroup})};

    const url = environment.apiServer + '/api/utility/getTemplateDocumento/' + id;
    return this.http.get<any>(url, headers);
  }

  uploadTemplateDocumento(template: any): Observable<any> {
    let requiredGroup = this.getRequiredGroup();
    let headers = { headers: new HttpHeaders({'requiredgroup': requiredGroup})};
    template.last_modification = new LastModification(this.authService);

    const url = environment.apiServer + '/api/utility/uploadTemplateDocumento';
    return this.http.post<any>(url, template, headers);
  }

  checkPraticaPregresso(istanza): boolean {
    if(istanza.is_pratica_pregresso) {
      let inserisciPraticaForm = this.fb.group({
        anagrafica: this.fb.group({
          nome: ['', [Validators.required]],
          cognome: ['', [Validators.required]],
          sesso: ['', [Validators.required]],
          data_nascita: ['', [Validators.required]],
          luogo_nascita: ['', [Validators.required]],
          luogo_residenza: ['', [Validators.required]],
          codice_fiscale: ['', [Validators.required]],
          recapito_telefonico: ['', [Validators.required]],
          email: ['', [Validators.required]],
          tipologia_persona: ['', [Validators.required]],
          ragione_sociale: [{ value: '', disabled: (istanza.anagrafica.tipologia_persona == 'F' ? true : false) }, [Validators.required]],
          codice_fiscale_piva: [{ value: '', disabled: (istanza.anagrafica.tipologia_persona == 'F' ? true : false) }, [Validators.required]],
          indirizzo_sede_legale: [{ value: '', disabled: (istanza.anagrafica.tipologia_persona == 'F' ? true : false) }, [Validators.required]]
        }),
        dati_istanza: this.fb.group({
          concessione: [null, [Validators.required]],
          durata_giorni_concessione: [0],
          anni: ['', [Validators.required]],
          mesi: ['', [Validators.required]],
          giorni: ['', [Validators.required]],
          indirizzo_segnale_indicatore: [null, [Validators.required]],
          motivazione_richiesta: ['', [Validators.required]],
          ruolo_richiedente: ['', [Validators.required]],
          utilizzo_locali: ['', [Validators.required]],
          specifica_utilizzo_locali: [{ value: '', disabled: (istanza.dati_istanza.utilizzo_locali != Fabbricato.Altro ? true : false) }, [Validators.required]]
        }),
        dichiarazioni_aggiuntive: this.fb.group({
          accettazione_suolo_pubblico: [false, [Validators.requiredTrue]],
          conoscenza_spese_carico: [false, [Validators.requiredTrue]],
          locale_area: [null, [Validators.required]],
          capienza_min_veicoli: [null, [Validators.required]],
          vincolo_parcheggio: [false],
          distanza_intersezione: [null, [Validators.required]],
          larghezza: [null, [Validators.required]],
          profondita: [null, [Validators.required]],
          titolo_autorizzativo: this.fb.group({
            tipologia: [''],
            specifica_tipologia: [{ value: '', disabled: (istanza.dichiarazioni_aggiuntive.titolo_autorizzativo.tipologia != TitoloAutorizzativo.Altro ? true : false) }, [Validators.required]],
            riferimento: [{ value: '', disabled: (istanza.dichiarazioni_aggiuntive.titolo_autorizzativo.tipologia == '' ? true : false) }, [Validators.required]]
          }),
          flag_esenzione: [false],
          motivazione_esenzione: [{ value: '', disabled: (!istanza.dichiarazioni_aggiuntive.flag_esenzione ? true : false) }, [Validators.required]]
        }),
      });
      
      inserisciPraticaForm.patchValue(istanza);
      
      return inserisciPraticaForm.valid ? true : false;
    }
    else
      return true;
  }

  getTipologiaProcessoLabel(pratica): string {
    let msg = '';
    switch(pratica.dati_istanza.tipologia_processo) { 
      case TipologiaPratica['Concessione Temporanea']: 
      case TipologiaPratica['Concessione Permanente']: { 
        msg = 'di concessione';
        break; 
      } 
      case TipologiaPratica.Rettifica: {
        msg = 'di rettifica'; 
        break; 
      }
      case TipologiaPratica.Rinuncia: {
        msg = 'di rinuncia'; 
        break; 
      }
      case TipologiaPratica.Rinnovo: {
        msg = 'di rinnovo'; 
        break; 
      }
      case TipologiaPratica.Proroga: {
        msg = 'di proroga'; 
        break; 
      }
      case TipologiaPratica['Trasferimento titolarità']: {
        msg = 'di trasferimento titolarità'; 
        break; 
      }
      case TipologiaPratica.Regolarizzazione:
      case TipologiaPratica['Regolarizzazione furto/deterioramento']: {
        msg = 'di regolarizzazione'; 
        break; 
      }
      case TipologiaPratica.Revoca: {
        msg = 'di revoca'; 
        break; 
      }
      case TipologiaPratica.Decadenza: {
        msg = 'di decadenza'; 
        break; 
      }
    }
    return msg;
  }

  getObjForPdfProtocollo(istanza: any, uploadedFiles: any[], infoStato: string = ''){
    let objPDF = Object.assign({}, istanza);
    objPDF.documenti_allegati = uploadedFiles.map(x => x.name ||x.id).join('; ') + ';';
    objPDF.data_documento = this.getFormattedTodayDate();

    if(istanza.stato_pratica == StatoPraticaPassiCarrabili.Regolarizzazione){
      delete objPDF.relazione_servizio;
      objPDF.dati_istanza = {
        tipologia_processo: StatoPraticaPassiCarrabili.Regolarizzazione,
        indirizzo_segnale_indicatore: istanza.indirizzo_segnale_indicatore
      };
      objPDF.anagrafica = {
        nome: istanza.nome,
        cognome: istanza.cognome
      };
      objPDF.tipologia_pratica = `pratica di regolarizzazione`;
    }
    else {
      if(!istanza.dati_istanza.tipologia_processo) {
        objPDF.dati_istanza.tipologia_processo = objPDF.dati_istanza.concessione;
      }
  
      objPDF.tipologia_pratica = `pratica ${this.getTipologiaProcessoLabel(istanza)}`;
    }

    objPDF.info_passaggio_stato = infoStato;

    return objPDF;
  }

  generaPdfPerProtocolloSync(pratica: any, filename: string): Promise<any> {
    return new Promise((resolve, reject) => {
      let requiredGroup = this.getRequiredGroup();
      let headers = new HttpHeaders({'requiredgroup': requiredGroup});

      this.http.post(environment.apiServer + '/api/utility/generaPdfPerProtocollo', 
        { pratica, filename }, { headers, responseType: 'blob'} ).subscribe(
          resp => {
            resolve(resp);
          },
          err => {
            reject(err);
          }
        );
    });
  }

  getSubjectEmail(istanza, messaggio): string {
    if(!istanza.anagrafica) //Caso di inserimento regolarizzazione
      return `Concessione di passo carrabile - ${istanza.nome + ' ' + istanza.cognome} - Protocollo: ${istanza.numero_protocollo ? istanza.numero_protocollo : 'N.D.'} - ${messaggio}`; 
    else
      return `Concessione di passo carrabile - ${istanza.anagrafica.tipologia_persona == 'G' ? istanza.anagrafica.ragione_sociale : istanza.anagrafica.nome + ' ' + istanza.anagrafica.cognome} - Protocollo: ${istanza.numero_protocollo ? istanza.numero_protocollo : 'N.D.'} - ${messaggio}`; 
  }

  getConfigurations(): Observable<any> {
    let requiredGroup = this.getRequiredGroup();
    let headers = { headers: new HttpHeaders({'requiredgroup': requiredGroup})};

    const url = environment.apiServer + '/api/utility/getConfigurations';
    return this.http.get<any>(url, headers);
  }

  getConfiguration(id): Observable<any> {
    let requiredGroup = this.getRequiredGroup();
    let headers = { headers: new HttpHeaders({'requiredgroup': requiredGroup})};

    const url = environment.apiServer + '/api/utility/getConfiguration/' + id;
    return this.http.get<any>(url, headers);
  }

  updateConfiguration(configuration: any): Observable<any> {
    let requiredGroup = this.getRequiredGroup();
    let headers = { headers: new HttpHeaders({'requiredgroup': requiredGroup})};

    return this.http.post<any>(environment.apiServer + '/api/utility/updateConfiguration', configuration , headers);
  }
}
