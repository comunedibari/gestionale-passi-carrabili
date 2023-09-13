import { environment } from '../../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LastModification } from '../models/LastModification';
import { UtilityService } from './utility.service';
import { AuthService } from './auth.service';

@Injectable()
export class PassiCarrabiliService {

  constructor(
    private http: HttpClient, 
    public authService: AuthService,
    private utilityService: UtilityService
    ) {}

  inserimentoBozzaPratica(istanza: any): Observable<any> {
    let requiredGroup = this.utilityService.getRequiredGroup();
    let headers = { headers: new HttpHeaders({'requiredgroup': requiredGroup})};
    istanza.last_modification = new LastModification(this.authService);
    
    return this.http.post<any>(environment.apiServer + '/api/passicarrabili/inserimentoBozzaPratica', istanza, headers);
  }

  inserimentoPratica(istanza: any): Observable<any> {
    // let requiredGroup = this.utilityService.getRequiredGroup();
    // let headers = { headers: new HttpHeaders({'requiredgroup': requiredGroup})};
    istanza.last_modification = new LastModification(this.authService);
    let request = {istanza: istanza, emailInviata: true};
    
    return this.http.post<any>(environment.apiServer + '/api/passicarrabili/inserimentoPratica', request /*, headers*/);
  }

  aggiornaPratica(istanza: any, statoIntegrazione?: number, storicizza_pratica: boolean = true): Observable<any> {
    // let requiredGroup = this.utilityService.getRequiredGroup();
    // let headers = { headers: new HttpHeaders({'requiredgroup': requiredGroup})};
    istanza.last_modification = new LastModification(this.authService);
    let request = {istanza: istanza, emailInviata: true, statoIntegrazione: statoIntegrazione, storicizza_pratica: storicizza_pratica};

    return this.http.post<any>(environment.apiServer + '/api/passicarrabili/aggiornaPratica', request /*, headers*/);
  }

  eliminaPratica(id_doc: string): Observable<any> {
    let requiredGroup = this.utilityService.getRequiredGroup();
    let headers = { headers: new HttpHeaders({'requiredgroup': requiredGroup})};

    return this.http.delete<any>(environment.apiServer + '/api/passicarrabili/eliminaPratica/' + id_doc, headers);
  }

  praticheCittadino(objSearch: any): Observable<any> {
    let requiredGroup = this.utilityService.getRequiredGroup();
    let headers = { headers: new HttpHeaders({'requiredgroup': requiredGroup})};
    objSearch.municipio_id = this.authService.getMunicipio();
    return this.http.post<any>(environment.apiServer + '/api/passicarrabili/praticheCittadino', objSearch, headers);
  }

  storicoPratica(idpratica: any): Observable<any> {
    let requiredGroup = this.utilityService.getRequiredGroup();
    let headers = { headers: new HttpHeaders({'requiredgroup': requiredGroup})};

    const url = environment.apiServer + '/api/passicarrabili/storicoPratica/' + idpratica;
    return requiredGroup ? this.http.get<any>(url, headers) : this.http.get<any>(url);
  }

  cercaPratica(id: any): Observable<any> {
    let requiredGroup = this.utilityService.getRequiredGroup();
    let headers = { headers: new HttpHeaders({'requiredgroup': requiredGroup})};

    const url = environment.apiServer + '/api/passicarrabili/cercaPratica/' + id;
    return requiredGroup ? this.http.get<any>(url, headers) : this.http.get<any>(url);
  }

  cercaPraticaDaNumProtocollo(numero_protocollo: any): Observable<any> {
    let requiredGroup = this.utilityService.getRequiredGroup();
    let headers = { headers: new HttpHeaders({'requiredgroup': requiredGroup})};

    const url = environment.apiServer + '/api/passicarrabili/cercaPraticaDaNumProtocollo/' + numero_protocollo;
    return this.http.get<any>(url, headers);
  }

  documentiPratica(idpratica: any): Observable<any> {
    let requiredGroup = this.utilityService.getRequiredGroup();
    let headers = { headers: new HttpHeaders({'requiredgroup': requiredGroup})};

    const url = environment.apiServer + '/api/passicarrabili/documentiPratica/' + idpratica;
    return requiredGroup ? this.http.get<any>(url, headers) : this.http.get<any>(url);
  }

  documentiPraticaSync(idpratica: any) {
    return new Promise((resolve, reject) => {
      this.documentiPratica(idpratica).subscribe(
        resp => {
          resolve(resp.data);
        },
        err => {
          reject(err);
        }
      );
    });
  }

  getDocumento(id_doc: any): Observable<any> {
    let requiredGroup = this.utilityService.getRequiredGroup();
    let headers = { headers: new HttpHeaders({'requiredgroup': requiredGroup})};

    const url = environment.apiServer + '/api/passicarrabili/getDocumento/' + id_doc;
    return this.http.get<any>(url, headers);
  }

  getDocumentoSync(id_doc: any) {
    return new Promise((resolve, reject) => {
      let requiredGroup = this.utilityService.getRequiredGroup();
      let headers = { headers: new HttpHeaders({'requiredgroup': requiredGroup})};

      const url = environment.apiServer + '/api/passicarrabili/getDocumento/' + id_doc;
      this.http.get<any>(url, headers).subscribe(
        resp => {
          resolve(resp);
        },
        err => {
          reject(err);
        }
      );
    });
  }

  uploadDocumentSync(doc: any) {
    return new Promise((resolve, reject) => {
      let requiredGroup = this.utilityService.getRequiredGroup();
      let headers = { headers: new HttpHeaders({'requiredgroup': requiredGroup})};
      doc.last_modification = new LastModification(this.authService);

      this.http.post<any>(environment.apiServer + '/api/passicarrabili/uploadDocument', doc, headers).subscribe(
        resp => {
          resolve(resp);
        },
        err => {
          reject(err);
        }
      );
    });
  }

  assegnaProtocolloDocumentoSync(doc: any) {
    return new Promise((resolve, reject) => {
      let requiredGroup = this.utilityService.getRequiredGroup();
      let headers = { headers: new HttpHeaders({'requiredgroup': requiredGroup})};

      this.http.post<any>(environment.apiServer + '/api/passicarrabili/assegnaProtocolloDocumento', doc, headers).subscribe(
        resp => {
          resolve(resp);
        },
        err => {
          reject(err);
        }
      );
    });
  }

  deleteDocumentSync(id: string) {
    return new Promise((resolve, reject) => {
      let requiredGroup = this.utilityService.getRequiredGroup();
      let headers = { headers: new HttpHeaders({'requiredgroup': requiredGroup})};

      this.http.delete<any>(environment.apiServer + '/api/passicarrabili/deleteDocument/' + id, headers).subscribe(
        resp => {
          resolve(resp);
        },
        err => {
          reject(err);
        }
      );
    });
  }

  cercaPratichePerStatoPratica(statoPratica: any, municipio_id: any, group_id?: any): Observable<any> {
    let requiredGroup = this.utilityService.getRequiredGroup();
    let headers = { headers: new HttpHeaders({'requiredgroup': requiredGroup})};

    var url = `${environment.apiServer}/api/passicarrabili/cercaPratichePerStatoPratica/${statoPratica}/${municipio_id || 'null'}/${group_id || 'null'}`;
    return this.http.get<any>(url, headers);
  }

  cercaIstruttoriMunicipio(municipio_id): Observable<any> {
    let requiredGroup = this.utilityService.getRequiredGroup();
    let headers = { headers: new HttpHeaders({'requiredgroup': requiredGroup})};

    const url = environment.apiServer + '/api/passicarrabili/cercaIstruttoriMunicipio/' + municipio_id;
    return this.http.get<any>(url, headers);
  }

  getNumeroProtocolloSync(blob: any): Promise<any> {
    return new Promise((resolve, reject) => {
      let requiredGroup = this.utilityService.getRequiredGroup();
      let headers = { headers: new HttpHeaders({'requiredgroup': requiredGroup})};
      let data = {
        blob: blob
      };

      this.http.post<any>(environment.apiServer + '/api/passicarrabili/getNumeroProtocollo', data, headers).subscribe(
        resp => {
          resolve(resp);
        },
        err => {
          reject(err);
        }
      );
    });
  }

  archiviaPraticaOriginaria(istanza: any): Observable<any> {
    let requiredGroup = this.utilityService.getRequiredGroup();
    let headers = { headers: new HttpHeaders({'requiredgroup': requiredGroup})};
    istanza.last_modification = new LastModification(this.authService);

    return this.http.post<any>(environment.apiServer + '/api/passicarrabili/archiviaPraticaOriginaria', istanza, headers);
  }

  revocaPraticaOriginaria(istanza: any): Observable<any> {
    let requiredGroup = this.utilityService.getRequiredGroup();
    let headers = { headers: new HttpHeaders({'requiredgroup': requiredGroup})};
    istanza.last_modification = new LastModification(this.authService);

    return this.http.post<any>(environment.apiServer + '/api/passicarrabili/revocaPraticaOriginaria', istanza, headers);
  }

  cercaNotificheScadenziario(municipio_id: any, group_id: any): Observable<any> {
    var url = `${environment.apiServer}/api/passicarrabili/cercaNotificheScadenziario/${municipio_id || 'null'}/${group_id}`;
    return this.http.get<any>(url);
  }

  getIndirizzoFromCoordinates(lat, lon): Observable<any> {
    let url = 'https://nominatim.openstreetmap.org/reverse?format=json&lat=' + lat + '&lon=' + lon;  
    return this.http.get<any>(url);
  }

  cercaSegnalazioniRegolarizzazione(municipio_id: any): Observable<any> {
    let requiredGroup = this.utilityService.getRequiredGroup();
    let headers = { headers: new HttpHeaders({'requiredgroup': requiredGroup})};

    var url = `${environment.apiServer}/api/passicarrabili/cercaSegnalazioniRegolarizzazione/${municipio_id || 'null'}`;
    return this.http.get<any>(url, headers);
  }

  inserimentoSegnalazioniRegolarizzazione(istanza: any): Observable<any> {
    let requiredGroup = this.utilityService.getRequiredGroup();
    let headers = { headers: new HttpHeaders({'requiredgroup': requiredGroup})};
    istanza.last_modification = new LastModification(this.authService);
    
    return this.http.post<any>(environment.apiServer + '/api/passicarrabili/inserimentoSegnalazioniRegolarizzazione', istanza, headers);
  }

  getRelazioneServizioRegolarizzazione(id_doc: any): Observable<any> {
    let requiredGroup = this.utilityService.getRequiredGroup();
    let headers = { headers: new HttpHeaders({'requiredgroup': requiredGroup})};

    const url = environment.apiServer + '/api/passicarrabili/getRelazioneServizioRegolarizzazione/' + id_doc;
    return this.http.get<any>(url, headers);
  }

  notificaRegolarizzazioneInviata(id_doc: any): Observable<any> {
    let requiredGroup = this.utilityService.getRequiredGroup();
    let headers = { headers: new HttpHeaders({'requiredgroup': requiredGroup})};

    const url = environment.apiServer + '/api/passicarrabili/notificaRegolarizzazioneInviata/' + id_doc;
    return this.http.get<any>(url, headers);
  }

  disattivaNotificaScadenziarioRegolarizzazione(id_doc: any): Observable<any> {
    let requiredGroup = this.utilityService.getRequiredGroup();
    let headers = { headers: new HttpHeaders({'requiredgroup': requiredGroup})};

    const url = environment.apiServer + '/api/passicarrabili/disattivaNotificaScadenziarioRegolarizzazione/' + id_doc;
    return this.http.get<any>(url, headers);
  }

  eliminaPraticaDaScadenziario(id: any): Observable<any> {
    const url = environment.apiServer + '/api/passicarrabili/eliminaPraticaDaScadenziario/' + id;
    return this.http.get<any>(url);
  }

  pregressoPratiche(): Observable<any> {
    let requiredGroup = this.utilityService.getRequiredGroup();
    let headers = { headers: new HttpHeaders({'requiredgroup': requiredGroup})};

    const url = environment.apiServer + '/api/passicarrabili/pregressoPratiche';
    return this.http.get<any>(url, headers);
  }

  inserimentoPraticaPregresso(istanza: any): Observable<any> {
    // let requiredGroup = this.utilityService.getRequiredGroup();
    // let headers = { headers: new HttpHeaders({'requiredgroup': requiredGroup})};
    istanza.last_modification = new LastModification(this.authService);
    let request = {istanza: istanza, emailInviata: true, isPregresso: true};
    
    return this.http.post<any>(environment.apiServer + '/api/passicarrabili/inserimentoPratica', request /*, headers*/);
  }

  setPraticaControllataPregresso(istanza) {
    return new Promise((resolve, reject) => {
      let requiredGroup = this.utilityService.getRequiredGroup();
      let headers = { headers: new HttpHeaders({'requiredgroup': requiredGroup})};

      const url = environment.apiServer + '/api/passicarrabili/setPraticaControllataPregresso';
      this.http.post<any>(url, istanza, headers).subscribe(
        resp => {
          resolve(resp);
        },
        err => {
          reject(err);
        }
      );
    });
  }

  ripristinaPraticaPregresso(istanza) {
    return new Promise((resolve, reject) => {
      let requiredGroup = this.utilityService.getRequiredGroup();
      let headers = { headers: new HttpHeaders({'requiredgroup': requiredGroup})};

      const url = environment.apiServer + '/api/passicarrabili/ripristinaPraticaPregresso';
      this.http.post<any>(url, istanza, headers).subscribe(
        resp => {
          resolve(resp);
        },
        err => {
          reject(err);
        }
      );
    });
  }

  getPraticheSenzaTagRFID(municipio_id: any): Observable<any> {
    let requiredGroup = this.utilityService.getRequiredGroup();
    let headers = { headers: new HttpHeaders({'requiredgroup': requiredGroup})};

    var url = `${environment.apiServer}/api/passicarrabili/getPraticheSenzaTagRFID/${municipio_id || 'null'}`;
    return this.http.get<any>(url, headers);
  }

  caricaDashboardKibana(municipio_id: any): Observable<any> {
    let requiredGroup = this.utilityService.getRequiredGroup();
    let headers = { headers: new HttpHeaders({'requiredgroup': requiredGroup})};

    var url = `${environment.apiServer}/api/passicarrabili/caricaDashboardKibana/${municipio_id || 'null'}`;
    return this.http.get<any>(url, headers);
  }

  bonificaPratiche(municipio_id: any): Observable<any> {
    let requiredGroup = this.utilityService.getRequiredGroup();
    let headers = { headers: new HttpHeaders({'requiredgroup': requiredGroup})};

    var url = `${environment.apiServer}/api/passicarrabili/bonificaPratiche/${municipio_id || 'null'}`;
    return this.http.get<any>(url, headers);
  }

  getSegnalazioni(municipio_id: any): Observable<any> {
    let requiredGroup = this.utilityService.getRequiredGroup();
    let headers = { headers: new HttpHeaders({'requiredgroup': requiredGroup})};

    var url = `${environment.apiServer}/api/passicarrabili/getSegnalazioni/${municipio_id || 'null'}`;
    return this.http.get<any>(url, headers); 
  }

  getSegnalazione(id_doc: any): Observable<any> {
    let requiredGroup = this.utilityService.getRequiredGroup();
    let headers = { headers: new HttpHeaders({'requiredgroup': requiredGroup})};

    var url = `${environment.apiServer}/api/passicarrabili/getSegnalazione/${id_doc}`;
    return this.http.get<any>(url, headers); 
  }

  aggiornaSegnalazione(segnalazione: any): Observable<any> {
    let requiredGroup = this.utilityService.getRequiredGroup();
    let headers = { headers: new HttpHeaders({'requiredgroup': requiredGroup})};
    // segnalazione.last_modification = new LastModification(this.authService);

    return this.http.post<any>(environment.apiServer + '/api/passicarrabili/aggiornaSegnalazione', segnalazione , headers);
  }

  checkUniqueTagRFIDSync(tag_rfid) {
    return new Promise((resolve, reject) => {
      let requiredGroup = this.utilityService.getRequiredGroup();
      let headers = { headers: new HttpHeaders({'requiredgroup': requiredGroup})};

      var url = `${environment.apiServer}/api/passicarrabili/checkTagRFID/${tag_rfid}`;
      this.http.get<any>(url, headers).subscribe(
        resp => {
          resolve(resp.notFound);
        },
        err => {
          reject(err);
        }
      );
    });
  }

  validazionePratica(istanza: any, dimensione_totale_allegati_protocollo_kb?: any): Observable<any> {
    let requiredGroup = this.utilityService.getRequiredGroup();
    let headers = { headers: new HttpHeaders({'requiredgroup': requiredGroup})};
    let request = {istanza: istanza, dimensione_totale_allegati_protocollo_kb: dimensione_totale_allegati_protocollo_kb};

    return this.http.post<any>(environment.apiServer + '/api/passicarrabili/validazionePratica', request , headers);
  }

  checkAvvioProcessiPostConcessioneMultipli(istanza: any): Promise<any> {
    return new Promise((resolve, reject) => {
      let requiredGroup = this.utilityService.getRequiredGroup();
      let headers = { headers: new HttpHeaders({'requiredgroup': requiredGroup})};
      let request = { istanza: istanza };

      var url = `${environment.apiServer}/api/passicarrabili/checkAvvioProcessiPostConcessioneMultipli`;
      this.http.post<any>(url, request, headers).subscribe(
        resp => {
          resolve(resp);
        },
        err => {
          reject(err);
        }
      );
    });
  }

  countPratichePerStato(municipio_id, group_id): Promise<any> {
    return new Promise((resolve, reject) => {
      var url = `${environment.apiServer}/api/passicarrabili/countPratichePerStato/${municipio_id || 'null'}/${group_id || 'null'}`;
      this.http.get<any>(url).subscribe(
        resp => {
          resolve(resp);
        },
        err => {
          reject(err);
        }
      );
    });
  }

  countPratichePerFunzionalita(municipio_id): Promise<any> {
    return new Promise((resolve, reject) => {
      var url = `${environment.apiServer}/api/passicarrabili/countPratichePerFunzionalita/${municipio_id || 'null'}`;
      this.http.get<any>(url).subscribe(
        resp => {
          resolve(resp);
        },
        err => {
          reject(err);
        }
      );
    });
  }

}
