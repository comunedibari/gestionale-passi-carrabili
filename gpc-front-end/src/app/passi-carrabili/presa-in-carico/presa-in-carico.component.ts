import { Component, OnInit, ViewChild } from '@angular/core';
import { ConfirmationService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { Group } from 'src/app/shared/enums/Group.enum';
import { StatoPraticaPassiCarrabili } from 'src/app/shared/enums/StatoPratica.enum';
import { TipologiaPratica } from 'src/app/shared/enums/TipologiaPratica.enum';
import { AuthService } from 'src/app/shared/service/auth.service';
import { EmailService } from 'src/app/shared/service/email.service';
import { MessageService } from 'src/app/shared/service/message.service';
import { PassiCarrabiliService } from 'src/app/shared/service/passi.carrabili.service';
import { UtilityService } from 'src/app/shared/service/utility.service';
import { TableEvent } from 'src/app/shared/table-prime-ng/models/TableEvent';
import { DettaglioPraticaComponent } from '../dettaglio-pratica/dettaglio-pratica.component';
import { environment } from '../../../environments/environment';
import { ProtocolloService } from 'src/app/shared/service/protocollo.service';
import { PassaggiStato } from 'src/app/shared/enums/PassaggiStato.enum';

@Component({
  selector: 'app-presa-in-carico',
  templateUrl: './presa-in-carico.component.html',
  styleUrls: ['./presa-in-carico.component.css']
})
export class PresaInCaricoComponent implements OnInit {

  constructor(
    private passiCarrabiliService: PassiCarrabiliService,
    private protocolloService: ProtocolloService,
    public authService: AuthService,
    private utilityService: UtilityService,
    private messageService: MessageService,
    public dialogService: DialogService,
    private emailService: EmailService,
    public confirmationService: ConfirmationService,
  ) { }

  pratica: any;
  showAssegnaDialog: boolean = false;
  showSpinner: boolean = false;
  istruttoriMunicipio: any[];
  selectedIstruttore: any;
  dataSource: any[];
  isAssegnaPratica: boolean = false;

  showProtocolloDialog: boolean = false;
  numProtocollo: string = '';
  isProtocollata: boolean = false;
  actionRiprotocollazione: string = '';

  showIntegrazioneDialog: boolean = false;
  noteIstruttoreMunicipio: string = '';
  base64DocInserimento: string = '';
  objProtocollo: any = null;

  get isRevoca():boolean {
    return this.pratica?.dati_istanza?.tipologia_processo == TipologiaPratica.Revoca ? true : false;
  }

  get isDecadenza():boolean {
    return this.pratica?.dati_istanza?.tipologia_processo == TipologiaPratica.Decadenza ? true : false;
  }

  getPageTitle(): string {
    return this.authService.getGroup() == Group.IstruttoreMunicipio || this.authService.getGroup() == Group.OperatoreSportello ? 'Presa in carico' : 'Assegnazione pratica';
  }

  initSortColumn = 'last_modification.data_operazione';
  directionSortColumn = "1"; //1=asc  0=rand   -1=desc 
  titleTable: string = this.authService.getGroup() == Group.IstruttoreMunicipio || this.authService.getGroup() == Group.OperatoreSportello ? 'Pratiche da prendere in carico' : 'Pratiche da assegnare';
  exportName = this.authService.getGroup() == Group.IstruttoreMunicipio || this.authService.getGroup() == Group.OperatoreSportello ? 'Pratiche da prendere in carico' : 'Pratiche da assegnare'; 
  globalFilters: any[] = [{value:'dati_istanza.indirizzo_segnale_indicatore.indirizzo',label:'Indirizzo'}]

  columnSchema = [
    {
      field: "anagrafica.codice_fiscale",
      header: "Cod. Fiscale/P. IVA",
      type: "text"
    },
    {
      field: "dati_istanza.indirizzo_segnale_indicatore.indirizzo",
      header: "Indirizzo",
      type: "text",
      inactive: true
    },
    {
      field: "numero_protocollo",
      header: "Num. Protocollo",
      type:"text"
    },
    {
      field: "dati_istanza.tipologia_processo",
      header: "Tip. Processo",
      type: "dropdown",
      show: (el) => {
        return TipologiaPratica[el];
      }
    },
    {
      field: "stato_pratica",
      header: "Stato",
      type: "dropdown",
      show: (el) => {
        return StatoPraticaPassiCarrabili[el];
      }
    },
    {
      field: "last_modification.data_operazione",
      header: "Data operazione",
      type: "date",
      pipe: "date"
    }
  ];

  actions = [
    {
      key: 'dettaglioPratica',
      icon: "pi pi-search",
      tooltip: 'DETTAGLIO',
    },
    {
      key: 'assegnaPraticaDialog',
      icon: "pi pi-tag",
      tooltip: 'ASSEGNA',
      hidden: (el) => {
        return this.authService.getGroup() != Group.DirettoreMunicipio;
      }
    },
    {
      key: 'prendiInCarico',
      icon: "pi pi-check",
      tooltip: 'PRENDI IN CARICO',
      hidden: (el) => {
        return this.authService.getGroup() != Group.IstruttoreMunicipio;
      }
    },
  ];

  onTableEvent(tableEvent: TableEvent) {
    this[tableEvent.actionKey](tableEvent.data);
  }

  ngOnInit(): void {
    this.cercaPratiche();
  }

  cercaPratiche(){
    this.showSpinner = true;
    this.passiCarrabiliService.cercaPratichePerStatoPratica(StatoPraticaPassiCarrabili.Inserita, this.authService.getMunicipio()).subscribe(
      data => {
        this.showSpinner = false;
        this.dataSource = data.data;
      },
      err => {
        this.showSpinner = false;
        this.messageService.showMessage('error','Ricerca pratiche', "Errore durante il ritrovamento delle pratiche"); 
      });
  }

  dettaglioPratica(element: any) {
    this.dialogService.open(DettaglioPraticaComponent,  this.utilityService.configDynamicDialogFullScreen(element, "Pratica cittadino"));
  }

  assegnaPraticaDialog(element: any) {
    this.pratica = element;
    this.resetProtocollo();
    this.passiCarrabiliService.cercaIstruttoriMunicipio(this.pratica.dati_istanza.indirizzo_segnale_indicatore.municipio_id).subscribe(
      data => {
        this.istruttoriMunicipio = data.data;
        this.showAssegnaDialog = true;
      },
      err => {
        this.messageService.showMessage('error','Ricerca istruttori', err.error.message);
      }
    );
  }

  prendiInCarico(element) {
    this.pratica = element;
    this.resetProtocollo();
    
    this.confirmationService.confirm({
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Conferma",
      rejectLabel: "Annulla",
      acceptButtonStyleClass: "btn-custom-style btn-dialog-confirm",
      rejectButtonStyleClass: "btn-custom-style btn-dialog-confirm",
      header: "Presa in carico",
      message:` Confermi di prendere in carico la pratica num. ${this.pratica.numero_protocollo}?`,
      accept: () => {
        if(this.isRevoca || this.isDecadenza)
          this.avviaRichiestaLavori(false);
        else
          this.submitPrendiInCarico(false);
      }
    });
  }

  async submitPrendiInCarico(isAssegnaPratica) {
    this.showSpinner = true;
    this.isAssegnaPratica = isAssegnaPratica;
    this.pratica.info_passaggio_stato = this.isRevoca ? PassaggiStato.InseritaToRichiestaLavori : PassaggiStato.InseritaToVerificaFormale;
    this.pratica.stato_pratica = this.isRevoca ? StatoPraticaPassiCarrabili['Richiesta lavori'] : StatoPraticaPassiCarrabili["Verifica formale"];        
    
    if(this.isRevoca || this.isDecadenza) {
      if(!this.objProtocollo) {   
        this.objProtocollo = this.utilityService.getObjForPdfProtocollo(this.pratica, [], this.pratica.info_passaggio_stato);
        let data: any = await this.utilityService.generaPdfPerProtocolloSync(this.objProtocollo, "templateProtocolloPratica").catch(err => {
          this.actionRiprotocollazione = 'submitPrendiInCarico';
          this.objProtocollo = null;
          this.messageService.showMessage('warn', 'Generazione template', 'Errore durante la generazione del documento principale per il protocollo. Riprovare più tardi.');
        });

        if(data) {
          this.base64DocInserimento = (await this.utilityService.convertFileToBase64(data)).toString();      
        }
      }

      var respProtocollo: any = null;
      if(this.base64DocInserimento) {
        let callProtocollo: Promise<any> = environment.production ? this.protocolloService.richiestaProtocolloUscitaNewSync(this.objProtocollo, [], true, this.base64DocInserimento, []) 
                                                                  : this.passiCarrabiliService.getNumeroProtocolloSync(null);
        respProtocollo = await callProtocollo.catch(err => {
            this.actionRiprotocollazione = 'submitPrendiInCarico';
            this.messageService.showMessage('warn', 'Numero protocollo', 'Servizio di protocollo non disponibile. Riprovare più tardi.');
          });
      }

      this.numProtocollo = `${respProtocollo?.numeroProtocollo || '--'}|${respProtocollo?.anno || '--'}`;

      if(this.numProtocollo && this.numProtocollo != '--|--')
        this.prendiInCaricoPratica();
      else {
        this.showSpinner = false;
        this.showProtocolloDialog = true;
      }
    }
    else {
      this.prendiInCaricoPratica();
    }
  }

  prendiInCaricoPratica(){
    if(this.isRevoca) {
      this.closeIntegrazioneDialog();
      this.pratica.data_scadenza_inizio_lavori = this.utilityService.getDataScadenzaPratica(undefined,5);
      this.pratica.inizio_lavori = false;
    }
    else if(this.isDecadenza) {
        this.closeIntegrazioneDialog();
        this.pratica.data_scadenza_notifica_decadenza = this.utilityService.getDataScadenzaPratica(undefined,20);
      }

    if(this.isRevoca || this.isDecadenza) {
      this.pratica.numero_protocollo_comunicazione = this.numProtocollo;
      this.isProtocollata = true;
      this.showProtocolloDialog = false;
    }
    else {
      this.pratica.numero_protocollo_comunicazione = null;
    }

    this.pratica.proprietario_pratica = {
      username: this.selectedIstruttore ? this.selectedIstruttore.username : this.authService.getUsername(),
      utente: this.selectedIstruttore ? `${this.selectedIstruttore.nome} ${this.selectedIstruttore.cognome}` : this.authService.getInfoUtente()
    }

    //notifica al direttore e al cittadino
    let emailsMunicipio = [];
    let objTakeEmails = [];

    if(this.isAssegnaPratica)
      objTakeEmails.push({ group_id: Group.IstruttoreMunicipio, municipio_id: this.pratica.dati_istanza.indirizzo_segnale_indicatore.municipio_id });
    else  
      objTakeEmails.push({ group_id: Group.DirettoreMunicipio, municipio_id: this.pratica.dati_istanza.indirizzo_segnale_indicatore.municipio_id });

    this.utilityService.takeEmails(objTakeEmails).subscribe( 
      resp => {
        let emails = resp.data.map(x => x.email);
        emailsMunicipio = emails.filter((item, index) => emails.indexOf(item) === index);

        this.passiCarrabiliService.aggiornaPratica(this.pratica).subscribe( 
          resp => {   
            let subject = '';
            let cc = this.authService.getEmail();

            let messaggioCittadino = '';
            let messaggioMunicipio = '';

            if(this.isRevoca) {
              subject = this.utilityService.getSubjectEmail(resp.istanza, 'Comunicazione di revoca concessione');
              messaggioCittadino = this.emailService.emailPresaInCaricoRevocaCittadino(resp.istanza);
              messaggioMunicipio = this.emailService.emailPresaInCaricoRevocaMunicipio(resp.istanza);  
            }
            else if(this.isDecadenza){
              subject = this.utilityService.getSubjectEmail(resp.istanza, 'Comunicazione di decadenza concessione');
              messaggioCittadino = this.emailService.emailPresaInCaricoDecadenzaCittadino(resp.istanza);
              messaggioMunicipio = this.emailService.emailPresaInCaricoDecadenzaMunicipio(resp.istanza); 
            }
            else {
              subject = this.utilityService.getSubjectEmail(resp.istanza, 'Comunicazione assegnazione pratica');
              messaggioCittadino = this.emailService.emailPresaInCaricoCittadino(resp.istanza);
              messaggioMunicipio = this.emailService.emailPresaInCaricoMunicipio(resp.istanza);  
            }

            //invio mail cittadino  
            this.emailService.sendEmail(resp.istanza.anagrafica.email, cc, subject, messaggioCittadino, { emailCittadino: true, municipio_id: this.authService.getMunicipio() });
            
            //invio mail Municipio
            if(emailsMunicipio && emailsMunicipio.length) {          
              this.emailService.sendEmail(emailsMunicipio.join(','), cc, subject, messaggioMunicipio);     
            }
            else {
              this.messageService.showMessage('warn', 'Presa in carico', 'Non sono presenti referenti del municipio relativo all\'indirizzo inserito',3000);
            }

            this.messageService.showMessage('success', 'Presa in carico', `La pratica è passata in stato: ${this.isRevoca ? 'Richiesta Lavori' : 'Verifica Formale'}`);
            this.dataSource = this.dataSource.filter(el => el.id_doc != resp.istanza.id_doc);
            this.dataSource = [...this.dataSource];
            this.showAssegnaDialog = false;
            this.showSpinner = false;
            if(this.isRevoca || this.isDecadenza)
              this.showProtocolloDialog = true;
          },
          err => {
            this.messageService.showMessage('error', 'Presa in carico', err.error.message);
            this.showAssegnaDialog = false;
            this.showSpinner = false;
            this.showProtocolloDialog = false;
          }
        );           
      },
      err => {
        this.messageService.showMessage('error', 'Invio email', err.error.message);
        this.showAssegnaDialog = false;
        this.showSpinner = false;
        this.showProtocolloDialog = false;
      }
    );
  }

  closeAssegnaDialog(event?){
      this.selectedIstruttore = null;
      this.showAssegnaDialog = false;
  }

  closeProtocolloDialog(event?) {
    this.showProtocolloDialog = false;
    this.numProtocollo = '';
    this.actionRiprotocollazione = '';
  }

  avviaRichiestaLavori(isAssegnaPratica){
    this.isAssegnaPratica = isAssegnaPratica;
    this.showIntegrazioneDialog = true;
  }

  invioRichiestaLavori() {
    if(this.isRevoca){
      this.pratica.parere_municipio = {
        lavori_richiesti: this.noteIstruttoreMunicipio
      };
    }
    else {
      this.pratica.parere_municipio = {
        note_decadenza: this.noteIstruttoreMunicipio
      };
    }
    
    this.submitPrendiInCarico(this.isAssegnaPratica);
  }

  closeIntegrazioneDialog(event?) {
    this.noteIstruttoreMunicipio = '';
    this.showIntegrazioneDialog = false;
  }

  resetProtocollo() {
    this.objProtocollo = null;
    this.isProtocollata = false;
    this.base64DocInserimento = '';
  }
}
