import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import {PrimeNGModule} from './shared/modules/primeng.module';
import { AppRouting } from './app.routing';
import {HTTP_INTERCEPTORS, HttpClientModule} from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';

//Servizi
import { UtilityService } from './shared/service/utility.service';
import { AuthService } from './shared/service/auth.service';
import { TokenStorage } from './shared/service/token.storage.service';
import { Interceptor } from './shared/service/interceptor.service';
import { UserService } from './shared/service/user.service';
import { TranslationsService } from './shared/service/translations.service';
import { MessageService } from './shared/service/message.service';
import {PassiCarrabiliService} from './shared/service/passi.carrabili.service';
import { EmailService } from './shared/service/email.service';

//Guards
import { AuthGuard } from './shared/guards/auth.guard';

// Componenti
import { AppComponent } from './app.component';
import { HeaderComponent } from './shared/header/header.component';
import { FooterComponent } from './shared/footer/footer.component';
import { MenuComponent } from './shared/menu/menu.component';
import { LoginComponent } from './shared/login/login.component';
import { HomePageComponent } from './shared/home-page/home-page.component';
import { UnauthorizedAccessComponent } from './shared/unauthorized-access/unauthorized-access.component';
import { NotFoundComponent } from './shared/not-found/not-found.component';
import { PrivacyComponent } from './shared/privacy/privacy.component';
import { CondizioniUsoComponent } from './shared/condizioni-uso/condizioni-uso.component';
import { SpinnerDialogComponent } from './shared/spinner-dialog/spinner-dialog.component';
import { TablePrimeNGComponent } from './shared/table-prime-ng/table-prime-ng.component';
import { FormatDatePipe }  from './shared/pipe/format-date.pipe';
import { HashPasswordPipe } from './shared/pipe/hash-password.pipe';
import { UserManagementComponent } from './gestione-utenti/user-management/user.management.component';
import { UserProfileComponent } from './gestione-utenti/user-profile/user-profile.component';
import { SafeHtmlPipe } from './shared/pipe/safe-html.pipe';
import { EmptyValuePipe } from './shared/pipe/empty-value.pipe';
import { InserisciPraticaComponent } from './passi-carrabili/inserisci-pratica/inserisci-pratica.component';
import { UploadFileComponent } from './shared/upload-file/upload-file.component';
import { FascicoloCittadinoComponent } from './passi-carrabili/fascicolo-cittadino/fascicolo-cittadino.component';
import { DettaglioPraticaComponent } from './passi-carrabili/dettaglio-pratica/dettaglio-pratica.component';
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
import { RettificaPraticaComponent } from './passi-carrabili/rettifica-pratica/rettifica-pratica.component';
import { RinunciaConcessioneComponent } from './passi-carrabili/rinuncia-concessione/rinuncia-concessione.component';
import { RinnovaConcessioneComponent } from './passi-carrabili/rinnova-concessione/rinnova-concessione.component';
import { ProrogaConcessioneComponent } from './passi-carrabili/proroga-concessione/proroga-concessione.component';
import { TrasferimentoTitolaritaComponent } from './passi-carrabili/trasferimento-titolarita/trasferimento-titolarita.component';
import { FurtoDeterioramentoComponent } from './passi-carrabili/furto-deterioramento/furto-deterioramento.component';
import { RevocaConcessioneComponent } from './passi-carrabili/revoca-concessione/revoca-concessione.component';
import { DecadenzaConcessioneComponent } from './passi-carrabili/decadenza-concessione/decadenza-concessione.component';
import { MappaComponent } from './shared/mappa/mappa.component';
import { ScadenziarioComponent } from './passi-carrabili/scadenziario/scadenziario.component';
import { StatisticheComponent } from './passi-carrabili/statistiche/statistiche.component';
import { RegolarizzazioneComponent } from './passi-carrabili/regolarizzazione/regolarizzazione.component';
import { CreazioneDovutoComponent } from './passi-carrabili/creazione-dovuto/creazione-dovuto.component';
import { StoricoPraticheComponent } from './passi-carrabili/storico-pratiche/storico-pratiche.component';
import { PraticheBozzaComponent } from './passi-carrabili/pratiche-bozza/pratiche-bozza.component';
import { AggiungiTagRfidComponent } from './passi-carrabili/aggiungi-tag-rfid/aggiungi-tag-rfid.component';
import { TemplatesComponent } from './shared/templates/templates.component';
import { BonificaPraticheComponent } from './passi-carrabili/bonifica-pratiche/bonifica-pratiche.component';
import { SegnalazioniComponent } from './passi-carrabili/segnalazioni/segnalazioni.component';
import { HelpComponent } from './shared/help/help.component';
import { ConfigurationComponent } from './passi-carrabili/configuration/configuration.component';
import { ModificaPraticaComponent } from './passi-carrabili/modifica-pratica/modifica-pratica.component';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    FooterComponent,
    MenuComponent,
    LoginComponent,
    HomePageComponent,
    UnauthorizedAccessComponent,
    NotFoundComponent,
    PrivacyComponent,
    CondizioniUsoComponent,
    SpinnerDialogComponent,
    TablePrimeNGComponent,
    FormatDatePipe,
    HashPasswordPipe,
    UserManagementComponent,
    UserProfileComponent,
    SafeHtmlPipe,
    EmptyValuePipe,
    InserisciPraticaComponent,
    UploadFileComponent,
    FascicoloCittadinoComponent,
    DettaglioPraticaComponent,
    PresaInCaricoComponent,
    ValidazionePraticaComponent,
    RichiestaPareriComponent,
    PraticheApprovateComponent,
    AttesaPagamentoComponent,
    ConcessioniValideComponent,
    RitiroRilascioComponent,
    PraticheDaRigettareComponent,
    PraticheArchiviateComponent,
    PraticheRigettateComponent,
    PraticheRevocateComponent,
    RettificaPraticaComponent,
    RinunciaConcessioneComponent,
    RinnovaConcessioneComponent,
    ProrogaConcessioneComponent,
    TrasferimentoTitolaritaComponent,
    FurtoDeterioramentoComponent,
    RevocaConcessioneComponent,
    DecadenzaConcessioneComponent,
    MappaComponent,
    ScadenziarioComponent,
    StatisticheComponent,
    RegolarizzazioneComponent,
    CreazioneDovutoComponent,
    StoricoPraticheComponent,
    PraticheBozzaComponent,
    AggiungiTagRfidComponent,
    TemplatesComponent,
    BonificaPraticheComponent,
    SegnalazioniComponent,
    HelpComponent,
    ConfigurationComponent,
    ModificaPraticaComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRouting,
    PrimeNGModule,
    HttpClientModule,
    ReactiveFormsModule
  ],
  providers: [
    AuthGuard,
    UserService,
    UtilityService,
    PassiCarrabiliService,
    AuthService,
    TokenStorage,
    TranslationsService,
    MessageService,
    EmailService,
    FormatDatePipe,
    {provide: HTTP_INTERCEPTORS,
      useClass: Interceptor,
      multi : true},
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
