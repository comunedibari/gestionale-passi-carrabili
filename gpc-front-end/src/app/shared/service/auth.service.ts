import { Router } from '@angular/router';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { TokenStorage } from './token.storage.service';
import { environment } from '../../../environments/environment';


@Injectable()
export class AuthService {

  constructor(
    private http: HttpClient, 
    private token: TokenStorage, 
    private router: Router
  ) { }

  login(username: string, password: string): Observable<any> {
    return this.http.post<any>(environment.apiServer + '/api/auth/login', { username: username, password: password });
  }

  updateLastLogin(): Observable<any> {
    let username = this.getUsername();
    return this.http.post<any>(environment.apiServer + "/api/auth/logout", { username: username });
  }

  signOut() {
    this.resetTokenAndStorage();
    this.router.navigate(['/login']);
  }

  resetTokenAndStorage(){
    this.token.removeToken();
    sessionStorage.clear();
  }

  public saveToken(token: string) {
    this.token.saveToken(token);
  }

  public saveGroups(groups: string) {
    window.sessionStorage.setItem('PACGroups', groups);
  }

  public saveMunicipio(municipio_id: string) {
    window.sessionStorage.setItem('MunicipioID', municipio_id);
  }

  public saveUsername(username: string) {
    window.sessionStorage.setItem('Username', username);
  }
  
  public saveCodFiscale(codicefiscale: string) {
    window.sessionStorage.setItem('CodiceFiscale', codicefiscale);
  }

  public saveUtente(nome: string, cognome: string) {
    window.sessionStorage.setItem('Nome', nome);
    window.sessionStorage.setItem('Cognome', cognome);
  }

  public saveRagioneSociale(ragioneSociale: string) {
    window.sessionStorage.setItem('RagioneSociale', ragioneSociale);
  }

  public saveLastLogin(lastLogin: string) {
    window.sessionStorage.setItem('LastLogin', lastLogin);
  }

  public saveEmail(email: string) {
    window.sessionStorage.setItem('Email', email);
  }

  public saveUOID(id: string) {
    window.sessionStorage.setItem('UOID', id);
  }

  public checkGroups(groupName: string) {
    if (sessionStorage.getItem('PACGroups')) {
      return JSON.parse(sessionStorage.getItem('PACGroups'))[groupName] === true;
    } else {
      return false;
    }
  }

  public getToken(): string {
    return this.token.getToken();
  }

  public getGroup(): any {
    if (sessionStorage.getItem('PACGroups') != "undefined") {
      return JSON.parse(sessionStorage.getItem('PACGroups'))['id'];
    } else {
      this.signOut();
    }
  }

  public getMunicipio(): any {
    if (sessionStorage.getItem('MunicipioID')) {
      let municipio_id = sessionStorage.getItem('MunicipioID') == 'undefined' ? null : sessionStorage.getItem('MunicipioID');      
      return JSON.parse(municipio_id);
    } else {
      this.signOut();
    }
  }

  public getUsername(): string {
    if (sessionStorage.getItem('Username') != "undefined") {
      return JSON.parse(sessionStorage.getItem('Username'));
    } else {
      this.signOut();
    }
  }

  public getCodFiscale(): string {
    if (sessionStorage.getItem('CodiceFiscale') != "undefined") {
      return JSON.parse(sessionStorage.getItem('CodiceFiscale'));
    } else {
      this.signOut();
    }
  }

  public getNomeUtente(): string {
    if (sessionStorage.getItem('Nome') != "undefined") {
      return JSON.parse(sessionStorage.getItem('Nome'));
    }
  }

  public getCognomeUtente(): string {
    if (sessionStorage.getItem('Cognome') != "undefined") {
      return JSON.parse(sessionStorage.getItem('Cognome'));
    }
  }

  public getRagioneSociale(): string {
    if (sessionStorage.getItem('RagioneSociale') != "undefined") {
      return JSON.parse(sessionStorage.getItem('RagioneSociale'));
    }
  }

  public getInfoUtente() {
    let ragione_sociale = sessionStorage.getItem('RagioneSociale') ? sessionStorage.getItem('RagioneSociale').replace(/"/g,'').replace('undefined', '') : '';
    let nome = sessionStorage.getItem('Nome') ? sessionStorage.getItem('Nome').replace(/"/g,'').replace('undefined', '') : '';
    let cognome = sessionStorage.getItem('Cognome') ? sessionStorage.getItem('Cognome').replace(/"/g,'').replace('undefined', '') : '';

    if (ragione_sociale && !nome && !cognome) {
      return ragione_sociale;
    }
    else if (nome && cognome) {
      return `${nome} ${cognome}`;
    } else {
      this.signOut();
    }
  }

  public getLastLogin(): any {
    if (sessionStorage.getItem('LastLogin') != "undefined") {
      return JSON.parse(sessionStorage.getItem('LastLogin'));
    } else {
      this.signOut();
    }  
  }

  public getEmail(): any {
    if (sessionStorage.getItem('Email') != "undefined") {
      return JSON.parse(sessionStorage.getItem('Email'));
    } else {
      this.signOut();
    }  
  }

  public getUOID(): any {
    return JSON.parse(sessionStorage.getItem('UOID'));
  }

  checkAuth(): boolean {
    if (this.token.getToken()) {
      return true;
    } else {
      return false;
    }
  }

  recuperoPassword(username: string): Observable<any> {
    let credentials = { username: username };
    return this.http.post<any>(environment.apiServer + '/api/auth/recuperoPassword', credentials);
  }

  isActiveLinksSistema(): boolean {
    return this.checkGroups('auth.statistiche') 
           || this.checkGroups('auth.templates')
           || this.checkGroups('auth.gestioneUtenti')
           || this.checkGroups('auth.ilMioProfilo');
  }

  isActiveLinkGestioneRichieste(): boolean {
    return this.checkGroups('auth.inserisciRichiesta') 
           || this.checkGroups('auth.pratiche_bozza')
           || this.checkGroups('auth.concessioniValide')
           || this.checkGroups('auth.fascicolo')
           || this.checkGroups('auth.regolarizzazione')
           || this.checkGroups('auth.storicoPratiche')
           || this.checkGroups('auth.segnalazioni');
  }

  isActiveLinkPraticheDaLavorare(): boolean {
    return this.checkGroups('auth.presaInCarico') 
           || this.checkGroups('auth.validazionePratiche')
           || this.checkGroups('auth.rielaborazionePareri')
           || this.checkGroups('auth.praticheApprovate') 
           || this.checkGroups('auth.attesaPagamento')
           || this.checkGroups('auth.ritiroRilascio')
           || this.checkGroups('auth.praticheDaRigettare')
           || this.checkGroups('auth.aggiungiTagRfid');
  }

  isActiveLinkPraticheConcluse(): boolean {
    return this.checkGroups('auth.praticheArchiviate') 
           || this.checkGroups('auth.praticheRigettate')
           || this.checkGroups('auth.praticheRevocate');
  }
}
