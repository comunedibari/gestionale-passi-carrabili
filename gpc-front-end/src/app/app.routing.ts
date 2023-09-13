import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from './shared/guards/auth.guard';
import { UserManagementComponent } from './gestione-utenti/user-management/user.management.component';
import { UserProfileComponent } from './gestione-utenti/user-profile/user-profile.component';

//Controller
import { LoginComponent } from './shared/login/login.component';
import { HomePageComponent } from './shared/home-page/home-page.component';
import { UnauthorizedAccessComponent } from './shared/unauthorized-access/unauthorized-access.component';
import { NotFoundComponent } from './shared/not-found/not-found.component';
// import { PrivacyComponent } from "./shared/privacy/privacy.component";
// import { CondizioniUsoComponent } from './shared/condizioni-uso/condizioni-uso.component';
import { InserisciPraticaComponent } from './passi-carrabili/inserisci-pratica/inserisci-pratica.component';
import { FascicoloCittadinoComponent } from './passi-carrabili/fascicolo-cittadino/fascicolo-cittadino.component';
import { PresaInCaricoComponent } from './passi-carrabili/presa-in-carico/presa-in-carico.component';
import { ValidazionePraticaComponent } from './passi-carrabili/validazione-pratica/validazione-pratica.component';
import { RichiestaPareriComponent } from './passi-carrabili/richiesta-pareri/richiesta-pareri.component';
import { PraticheApprovateComponent } from './passi-carrabili/pratiche-approvate/pratiche-approvate.component';
import { AttesaPagamentoComponent } from './passi-carrabili/attesa-pagamento/attesa-pagamento.component';
import { ConcessioniValideComponent } from './passi-carrabili/concessioni-valide/concessioni-valide.component';
import { RitiroRilascioComponent } from './passi-carrabili/ritiro-rilascio/ritiro-rilascio.component';
import { PraticheDaRigettareComponent } from './passi-carrabili/pratiche-da-rigettare/pratiche-da-rigettare.component';
import { PraticheArchiviateComponent } from './passi-carrabili/pratiche-archiviate/pratiche-archiviate.component';
import { PraticheRigettateComponent } from './passi-carrabili/pratiche-rigettate/pratiche-rigettate.component';
import { PraticheRevocateComponent } from './passi-carrabili/pratiche-revocate/pratiche-revocate.component';
import { StatisticheComponent } from './passi-carrabili/statistiche/statistiche.component';
import { RegolarizzazioneComponent } from './passi-carrabili/regolarizzazione/regolarizzazione.component';
import { StoricoPraticheComponent } from './passi-carrabili/storico-pratiche/storico-pratiche.component';
import { PraticheBozzaComponent } from './passi-carrabili/pratiche-bozza/pratiche-bozza.component';
import { AggiungiTagRfidComponent } from './passi-carrabili/aggiungi-tag-rfid/aggiungi-tag-rfid.component';
import { TemplatesComponent } from './shared/templates/templates.component';
import { BonificaPraticheComponent } from './passi-carrabili/bonifica-pratiche/bonifica-pratiche.component';
import { SegnalazioniComponent } from './passi-carrabili/segnalazioni/segnalazioni.component';
import { ConfigurationComponent } from './passi-carrabili/configuration/configuration.component';

const routes: Routes = [
  //passi carrabili
  { path: 'gestione_richieste', 
    data: { breadcrumb: 'Gestione richieste' }, 
    children: [
      { path:'', redirectTo: '/home',pathMatch: 'full'},
      { path: 'inserisci_richiesta', component: InserisciPraticaComponent, canActivate: [AuthGuard], data: { requiredGroup: 'auth.inserisciRichiesta', breadcrumb: 'Inserisci pratica' } },
      { path: 'pratiche_bozza', component: PraticheBozzaComponent, canActivate: [AuthGuard], data: { requiredGroup: 'auth.praticheBozza', breadcrumb: 'Pratiche in bozza' } },
      { path: 'concessioni_valide', component: ConcessioniValideComponent, canActivate: [AuthGuard], data: { requiredGroup: 'auth.concessioniValide', breadcrumb: 'Concessioni valide' } },
      { path: 'ricerca_pratiche', component: FascicoloCittadinoComponent, canActivate: [AuthGuard], data: { requiredGroup: 'auth.fascicolo', breadcrumb: 'Ricerca pratiche' } },
      { path: 'regolarizzazione', component: RegolarizzazioneComponent, canActivate: [AuthGuard], data: { requiredGroup: 'auth.regolarizzazione', breadcrumb: 'Regolarizzazione' } },
      { path: 'storico_pratiche', component: StoricoPraticheComponent, canActivate: [AuthGuard], data: { requiredGroup: 'auth.storicoPratiche', breadcrumb: 'Storico pratiche' } },
      { path: 'bonifica_pratiche', component: BonificaPraticheComponent, canActivate: [AuthGuard], data: { requiredGroup: 'auth.storicoPratiche', breadcrumb: 'Bonifica pratiche' } },
      { path: 'segnalazioni', component: SegnalazioniComponent, canActivate: [AuthGuard], data: { requiredGroup: 'auth.segnalazioni', breadcrumb: 'Segnalazioni' } },
    ]
  },
  { path: 'pratiche_da_lavorare', 
    data: { breadcrumb: 'Pratiche da lavorare' }, 
    children: [
      { path:'', redirectTo: '/home',pathMatch: 'full'},
      { path: 'presa_in_carico', component: PresaInCaricoComponent, canActivate: [AuthGuard], data: { requiredGroup: 'auth.presaInCarico', breadcrumb: 'Presa in carico' } },
      { path: 'validazione_pratiche', component: ValidazionePraticaComponent, canActivate: [AuthGuard], data: { requiredGroup: 'auth.validazionePratiche', breadcrumb: 'Validazione pratiche' } },
      { path: 'rielaborazione_pareri', component: RichiestaPareriComponent, canActivate: [AuthGuard], data: { requiredGroup: 'auth.rielaborazionePareri', breadcrumb: 'Rielaborazione pareri' } },
      { path: 'pratiche_approvate', component: PraticheApprovateComponent, canActivate: [AuthGuard], data: { requiredGroup: 'auth.praticheApprovate', breadcrumb: 'Pratiche approvate' } },
      { path: 'attesa_pagamento', component: AttesaPagamentoComponent, canActivate: [AuthGuard], data: { requiredGroup: 'auth.attesaPagamento', breadcrumb: 'Attesa di pagamento' } },
      { path: 'ritiro_rilascio', component: RitiroRilascioComponent, canActivate: [AuthGuard], data: { requiredGroup: 'auth.ritiroRilascio', breadcrumb: 'Restituzione e Rilascio' } },
      { path: 'pratiche_da_rigettare_revocare', component: PraticheDaRigettareComponent, canActivate: [AuthGuard], data: { requiredGroup: 'auth.praticheDaRigettare', breadcrumb: 'Rigetto e Revoca' } },
      { path: 'aggiungi_tag_rfid', component: AggiungiTagRfidComponent, canActivate: [AuthGuard], data: { requiredGroup: 'auth.aggiungiTagRfid', breadcrumb: 'Aggiungi Tag RFID' } },
    ]
  },
  { path: 'pratiche_concluse', 
    data: { breadcrumb: 'Pratiche concluse' }, 
    children: [
      { path:'', redirectTo: '/home',pathMatch: 'full'},
      { path: 'pratiche_archiviate', component: PraticheArchiviateComponent, canActivate: [AuthGuard], data: { requiredGroup: 'auth.praticheArchiviate', breadcrumb: 'Pratiche archiviate' } },
      { path: 'pratiche_rigettate', component: PraticheRigettateComponent, canActivate: [AuthGuard], data: { requiredGroup: 'auth.praticheRigettate', breadcrumb: 'Pratiche rigettate' } },
      { path: 'pratiche_revocate', component: PraticheRevocateComponent, canActivate: [AuthGuard], data: { requiredGroup: 'auth.praticheRevocate', breadcrumb: 'Pratiche revocate' } },
    ]
  },
  //sistema
  { path: 'sistema', 
    data: { breadcrumb: 'Sistema' }, 
    children: [
      { path:'', redirectTo: '/home',pathMatch: 'full'},
      { path: 'statistiche', component: StatisticheComponent, canActivate: [AuthGuard], data: { requiredGroup: 'auth.statistiche', breadcrumb: 'Statistiche' } },
      { path: 'template-documenti', component: TemplatesComponent, canActivate: [AuthGuard], data: { requiredGroup: 'auth.templates', breadcrumb: 'Template documenti' } },
      { path: 'configuration', component: ConfigurationComponent, canActivate: [AuthGuard], data: { requiredGroup: 'auth.gestioneUtenti', breadcrumb: 'Configurazione parametri' } },
      { path: 'usermanagement', component: UserManagementComponent, canActivate: [AuthGuard], data: { requiredGroup: 'auth.gestioneUtenti', breadcrumb: 'Gestione utenti' } },
      { path: 'user', component: UserProfileComponent, canActivate: [AuthGuard], data: { requiredGroup: 'auth.ilMioProfilo', breadcrumb: 'Profilo utente' } }
    ]
  },
  //shared
  { path: "home", component: HomePageComponent, data: { breadcrumb: 'Home Page' }, canActivate: [AuthGuard] },
  // { path: "privacy", component: PrivacyComponent, data: { breadcrumb: 'Privacy' } },
  // { path: "condizioniuso", component: CondizioniUsoComponent, data: { breadcrumb: 'Condizioni d\'uso' } },
  { path: 'login', component: LoginComponent },
  { path : '', component : LoginComponent},
  { path: 'unauthorized-error', component: UnauthorizedAccessComponent, data: { breadcrumb: 'Non Autorizzato' } },
  { path : '**', component : NotFoundComponent, data: { breadcrumb: 'Non trovata' }}
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' })
  ],
  exports: [
    RouterModule
  ],
  declarations: []
})
export class AppRouting { }