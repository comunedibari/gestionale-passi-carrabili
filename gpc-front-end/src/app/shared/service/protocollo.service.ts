import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { UtilityService } from './utility.service';
import { StatoPraticaPassiCarrabili } from 'src/app/shared/enums/StatoPratica.enum';
import { Group } from '../enums/Group.enum';


@Injectable({
  providedIn: 'root'
})
export class ProtocolloService {

  constructor(
    private http: HttpClient,
    public authService: AuthService,
    private utilityService: UtilityService
  ) { }

  codiceAmministrazione: string = "c_a662";

  getProtocolloSync(numero_protocollo: any, anno: any) {
    return new Promise((resolve, reject) => {
      let url = `${environment.apiProtocollo}/middleware/v1/protocollo/numero/${numero_protocollo}/anno/${anno}`;
      this.http.get<any>(url).subscribe(
        resp => {
          resolve(resp.return);
        },
        err => {
          reject(err);
        }
      );
    });
  }

  richiestaProtocolloEntrataSync(istanza: any, pdfBase64: string = ''): Promise<any> {
    return new Promise((resolve, reject) => {

      let reqObj: any = this.getDataRequestEntrata(istanza);
      let tipologiaPratica = istanza.tipologia_pratica ? istanza.tipologia_pratica.charAt(0).toUpperCase() + istanza.tipologia_pratica.slice(1) : 'N.D.';
      let nomeFile = `${tipologiaPratica} ${reqObj.mittente.personaGiuridica ? reqObj.mittente.personaGiuridica.ragioneSociale : (reqObj.mittente.personaFisica.nome + ' ' + reqObj.mittente.personaFisica.cognome)} ${this.utilityService.getTimestamp()}.${pdfBase64 ? 'pdf' : 'json'}`;

      let body = {
        protocolloRequest: {
          mittente: reqObj.mittente,
          documento: {
              nomeFile: nomeFile,
              contenuto: pdfBase64 ? pdfBase64.replace('data:application/pdf;base64,', '') : this.utilityService.convertJsonToBase64(istanza)
          },
          areaOrganizzativaOmogenea: this.codiceAmministrazione,
          amministrazione: this.codiceAmministrazione,
          oggetto: `${reqObj.oggetto}`,
          idUtente: this.authService.getUOID()
        }
      };

      let url = `${environment.apiProtocollo}/middleware/v1/protocollo/richiesta/entrata`;
      this.http.post<any>(url, body).subscribe(
        resp => {
          resolve(resp.return);
        },
        err => {
          reject(err);
        }
      );
    });
  }

  richiestaProtocolloEntrataNewSync(istanza: any, base64: string = '', allegati: any[]): Promise<any> {
    return new Promise((resolve, reject) => {

      base64 = base64.substring(base64.indexOf(',')+1, base64.length);

      const formData  = new FormData();
      formData.append("istanza", JSON.stringify(istanza));
      formData.append("base64", base64);
      formData.append("uoid", this.authService.getUOID());
      if(allegati && allegati.length > 0)
        allegati.map(file => formData.append("allegati", file));

      let url = `${environment.apiProtocollo}/middleware/v1/protocollo/richiesta/entrata_new`;
      this.http.post<any>(url, formData).subscribe(
        resp => {
          resolve(resp.return);
        },
        err => {
          reject(err);
        }
      );
    });
  }

  richiestaProtocolloUscitaSync(istanza: any, destinatari: any[], comunicazione_cittadino: boolean = false, pdfBase64: string = ''): Promise<any> {
    return new Promise(async (resolve, reject) => {

      let reqObj: any = await this.getDataRequestUscita(istanza, destinatari, comunicazione_cittadino).catch(err => { 
            console.log(err); 
            reject(err);
          });

      let tipologiaPratica = istanza.tipologia_pratica ? istanza.tipologia_pratica.charAt(0).toUpperCase() + istanza.tipologia_pratica.slice(1) : 'N.D.';
      let nomeFile = !istanza.anagrafica ? `${tipologiaPratica} ${istanza.nome} ${istanza.cognome} ${this.utilityService.getTimestamp()}.${pdfBase64 ? 'pdf' : 'json'}`
                                         : `${tipologiaPratica} ${istanza.anagrafica.tipologia_persona == 'G' ? istanza.anagrafica.ragione_sociale : (istanza.anagrafica.nome + ' ' + istanza.anagrafica.cognome)} ${this.utilityService.getTimestamp()}.${pdfBase64 ? 'pdf' : 'json'}`
      
      let body = {
        protocolloUscitaRequest: {
          destinatari: reqObj.destinatari,
          documento: {
              nomeFile: nomeFile,
              contenuto: pdfBase64 ? pdfBase64.replace('data:application/pdf;base64,', '') : this.utilityService.convertJsonToBase64(istanza)
          },
          areaOrganizzativaOmogenea: this.codiceAmministrazione,
          amministrazione: this.codiceAmministrazione,
          oggetto: `${reqObj.oggetto}`,
          idUtente: this.authService.getUOID()
        }
      };

      let url = `${environment.apiProtocollo}/middleware/v1/protocollo/richiesta/uscita`;
      this.http.post<any>(url, body).subscribe(
        resp => {
          resolve(resp.return);
        },
        err => {
          reject(err);
        }
      );
    });
  }

  richiestaProtocolloUscitaNewSync(istanza: any, destinatari: any[], comunicazione_cittadino: boolean = false, base64: string = '', allegati: any[], estensioneBase64?: string): Promise<any> {
    return new Promise(async (resolve, reject) => {

      base64 = base64.substring(base64.indexOf(',')+1, base64.length);

      const formData  = new FormData();
      formData.append("istanza", JSON.stringify(istanza));
      formData.append("destinatari", JSON.stringify(destinatari));
      formData.append("comunicazioneCittadino", `${comunicazione_cittadino}`);
      formData.append("base64", base64);
      formData.append("estensioneBase64", '.' + (estensioneBase64 ? estensioneBase64 : 'pdf'));
      formData.append("uoid", this.authService.getUOID());
      if(allegati && allegati.length > 0)
        allegati.map(file => formData.append("allegati", file));

      let url = `${environment.apiProtocollo}/middleware/v1/protocollo/richiesta/uscita_new`;
      this.http.post<any>(url, formData).subscribe(
        resp => {
          resolve(resp.return);
        },
        err => {
          reject(err);
        }
      );
    });
  }

  getDataRequestEntrata(istanza: any) {

    let obj: any = {};

    if(istanza.anagrafica.tipologia_persona == 'G') {  
      obj = {
        mittente: {
          personaGiuridica: {
            ragioneSociale: istanza.anagrafica.ragione_sociale,
            partitaIVA: istanza.anagrafica.codice_fiscale_piva
          }
        },
        oggetto: `Concessione di Passo Carrabile - ${istanza.tipologia_pratica} - ${istanza.dati_istanza.indirizzo_segnale_indicatore.indirizzo} - ${istanza.anagrafica.ragione_sociale}` // - Stato pratica: ${StatoPraticaPassiCarrabili[istanza.stato_pratica]}`
      }; 
    }
    else {
      obj = {      
        mittente: {
          personaFisica: {
            nome: istanza.anagrafica.nome,
            cognome: istanza.anagrafica.cognome,
            codiceFiscale: istanza.anagrafica.codice_fiscale
          }
        },
        oggetto: `Concessione di Passo Carrabile - ${istanza.tipologia_pratica} - ${istanza.dati_istanza.indirizzo_segnale_indicatore.indirizzo} - ${istanza.anagrafica.nome} ${istanza.anagrafica.cognome}` // - Stato pratica: ${StatoPraticaPassiCarrabili[istanza.stato_pratica]}`
      }; 
    }

    return obj;
  }

  getDataRequestUscita(istanza: any, destinatari: any[], comunicazione_cittadino: boolean) {
    return new Promise(async (resolve, reject) => {
      let obj: any = {
        destinatari: [],
        oggetto: ''
      };

      if(!istanza.anagrafica) { //Caso di inserimento regolarizzazione
        obj.oggetto = `Concessione di Passo Carrabile - Regolarizzazione - ${istanza.indirizzo_segnale_indicatore.indirizzo} - ${istanza.nome} ${istanza.cognome}`;
            
        if(comunicazione_cittadino){
          obj.destinatari.push({
            nome: istanza.nome,
            cognome: istanza.cognome,
            codiceFiscale: ''
          });
        }
      }
      else {
        if(istanza.anagrafica.tipologia_persona == 'G') {      
          obj.oggetto = `Concessione di Passo Carrabile - ${istanza.tipologia_pratica} - ${istanza.dati_istanza.indirizzo_segnale_indicatore.indirizzo} - ${istanza.anagrafica.ragione_sociale}`;

          if(comunicazione_cittadino){
            obj.destinatari.push({
              ragioneSociale: istanza.anagrafica.ragione_sociale,
              piva: istanza.anagrafica.codice_fiscale_piva
            });
          }
        }
        else {
          obj.oggetto = `Concessione di Passo Carrabile - ${istanza.tipologia_pratica} - ${istanza.dati_istanza.indirizzo_segnale_indicatore.indirizzo} - ${istanza.anagrafica.nome} ${istanza.anagrafica.cognome}`;
            
          if(comunicazione_cittadino){
            obj.destinatari.push({
              nome: istanza.anagrafica.nome,
              cognome: istanza.anagrafica.cognome,
              codiceFiscale: istanza.anagrafica.codice_fiscale
            });
          }
        }
      }

      if(destinatari && destinatari.length) {
        let resp: any = await this.getRagioneSocialeDestinatariSync(destinatari)
            .catch(err => { 
              console.log(err); 
              reject(err);
            });

        //rimozione comunicazioni interne al municipio
        if(obj.destinatari > 0 || destinatari.length > 1)
          resp = resp.filter(el => el.uoid != this.authService.getUOID());

        let concessionario = resp.find(x => x.group_id == Group.Concessionario);
        if(concessionario){
          obj.destinatari.push({
            ragioneSociale: concessionario.ragioneSociale,
            piva: concessionario.codicefiscale
          });
        }

        let denominazioneDestinatari = resp.filter(x => x.group_id != Group.Concessionario).map(x => x.denominazione);
        denominazioneDestinatari = denominazioneDestinatari.filter((item, index) => denominazioneDestinatari.indexOf(item) === index);   

        denominazioneDestinatari.forEach(denominazione => {
          obj.destinatari.push({
            ragioneSociale: denominazione,
            piva: ''
          });
        });
      }

      resolve(obj);
    });
  }

  getRagioneSocialeDestinatariSync(array: any) {
    return new Promise((resolve, reject) => {
      this.http.post<any>(environment.apiServer + '/api/utility/getRagioneSocialeDestinatariSync', array).subscribe(
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
