import { Component, OnInit } from '@angular/core';
import { StatoPraticaPassiCarrabili } from 'src/app/shared/enums/StatoPratica.enum';
import { TipologiaPratica } from 'src/app/shared/enums/TipologiaPratica.enum';
import { TableEvent } from 'src/app/shared/table-prime-ng/models/TableEvent';
import { PassiCarrabiliService } from 'src/app/shared/service/passi.carrabili.service';
import { MessageService } from 'src/app/shared/service/message.service';
import { AuthService } from 'src/app/shared/service/auth.service';
import { DialogService } from 'primeng/dynamicdialog';
import { DettaglioPraticaComponent } from '../dettaglio-pratica/dettaglio-pratica.component';
import { UtilityService } from 'src/app/shared/service/utility.service';
import { ConfirmationService } from 'primeng/api';
import { EmailService } from 'src/app/shared/service/email.service';
import { Group } from 'src/app/shared/enums/Group.enum';
// import { environment } from '../../../environments/environment';
// import { ProtocolloService } from 'src/app/shared/service/protocollo.service';
import { PassaggiStato } from 'src/app/shared/enums/PassaggiStato.enum';

@Component({
  selector: 'app-aggiungi-tag-rfid',
  templateUrl: './aggiungi-tag-rfid.component.html',
  styleUrls: ['./aggiungi-tag-rfid.component.css']
})
export class AggiungiTagRfidComponent implements OnInit {

  constructor(
    private passiCarrabiliService: PassiCarrabiliService,
    private messageService: MessageService,
    public authService: AuthService,
    public dialogService: DialogService,
    private utilityService: UtilityService,
    public confirmationService: ConfirmationService,
    private emailService: EmailService,
    // private protocolloService: ProtocolloService
  ) { }

  showSpinner: boolean = false;
  dataSource: any[];
  pratica: any;
  showRFIDDialog: boolean = false;
  rfid: string = '';
  // showProtocolloDialog: boolean = false;
  // numProtocollo: string = '';
  // isProtocollata: boolean = false;
  // actionRiprotocollazione: string = '';
  // base64DocInserimento: string = '';
  // objProtocollo: any = null;

  initSortColumn = 'last_modification.data_operazione';
  directionSortColumn = "1"; //1=asc  0=rand   -1=desc 
  titleTable: string = 'Pratiche senza Tag RIFD';
  exportName = 'Pratiche senza Tag RIFD'; 
  globalFilters: any[] = [
    {value:'dati_istanza.indirizzo_segnale_indicatore.indirizzo',label:'Indirizzo'},
    {value:'proprietario_pratica.utente',label:'Istruttore'}
  ];

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
      field: "proprietario_pratica.utente",
      header: "Istruttore",
      type: "text",
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
      key: 'aggiungiTagRfid',
      icon: "pi pi-plus",
      tooltip: 'AGGIUNGI TAG RFID',
      hidden: (el) => {
        return this.authService.getGroup() != Group.OperatoreSportello && this.authService.getGroup() != Group.IstruttoreMunicipio;
      }
    }
  ];

  onTableEvent(tableEvent: TableEvent) {
    this[tableEvent.actionKey](tableEvent.data);
  }

  ngOnInit(): void {
    this.cercaPratiche();
  }

  cercaPratiche(){
    this.showSpinner = true;
    this.passiCarrabiliService.getPraticheSenzaTagRFID(this.authService.getMunicipio()).subscribe(
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

  aggiungiTagRfid(element: any) {
    this.pratica = element;
    // this.resetProtocollo();
    this.showRFIDDialog = true;
  }

  async aggiungi(){
    this.showSpinner = true;

    // if(!this.objProtocollo) {
      this.pratica.info_passaggio_stato = PassaggiStato.AggiuntaTagRFID;
    //   this.objProtocollo = this.utilityService.getObjForPdfProtocollo(this.pratica, [], this.pratica.info_passaggio_stato);
    //   let data: any = await this.utilityService.generaPdfPerProtocolloSync(this.objProtocollo, "templateProtocolloPratica").catch(err => {
    //     this.actionRiprotocollazione = 'aggiungi';
    //     this.objProtocollo = null;
    //     this.messageService.showMessage('warn', 'Generazione template', 'Errore durante la generazione del documento principale per il protocollo. Riprovare più tardi.');
    //   });

    //   if(data) {
    //     this.base64DocInserimento = (await this.utilityService.convertFileToBase64(data)).toString();      
    //   }
    // }

    // var respProtocollo: any = null;
    // if(this.base64DocInserimento) {
    //   let callProtocollo: Promise<any> = environment.production ? this.protocolloService.richiestaProtocolloUscitaNewSync(this.objProtocollo, [], true, this.base64DocInserimento, []) 
    //                                                             : this.passiCarrabiliService.getNumeroProtocolloSync(null);

    //   respProtocollo = await callProtocollo.catch(err => {
    //         this.actionRiprotocollazione = 'aggiungi';
    //         this.messageService.showMessage('warn', 'Numero protocollo', 'Servizio di protocollo non disponibile. Riprovare più tardi.');
    //       });
    // }

    // this.numProtocollo = `${respProtocollo?.numeroProtocollo || '--'}|${respProtocollo?.anno || '--'}`;

    // if(this.numProtocollo && this.numProtocollo != '--|--')
      this.aggiungiTag();
    // else {
    //   this.showSpinner = false;
    //   this.showProtocolloDialog = true;
    // }
  }

  async aggiungiTag(){
    // this.pratica.numero_protocollo_comunicazione = this.numProtocollo;
    // this.isProtocollata = true;
    // this.showProtocolloDialog = false;
    this.pratica.numero_protocollo_comunicazione = null;
    
    this.pratica.tag_rfid = this.rfid;
    
    let uniqueTagRFID = await this.passiCarrabiliService.checkUniqueTagRFIDSync(this.rfid).catch(err => {
      this.showSpinner = false;
      this.messageService.showMessage('error', 'Controllo tag rfid', 'Errore durante il controllo dell\'univocità del tag rfid');
    });

    if(uniqueTagRFID) {
      let objTakeEmails = [];
      objTakeEmails.push({ group_id: Group.DirettoreMunicipio, municipio_id: this.pratica.dati_istanza.indirizzo_segnale_indicatore.municipio_id });

      this.utilityService.takeEmails(objTakeEmails).subscribe( 
        resp => {
          let emails = resp.data.map(x => x.email);
          let emailsMunicipio = emails.filter((item, index) => emails.indexOf(item) === index);

          this.passiCarrabiliService.aggiornaPratica(this.pratica).subscribe( 
            resp => {   
              let subject = this.utilityService.getSubjectEmail(resp.istanza, 'Comunicazione associazione tag rfid al segnale indicatore');
              let cc = this.authService.getEmail();

              //invio mail cittadino  
              let messaggioCittadino = this.emailService.emailAssociazioneTagRFIDCittadino(resp.istanza); 
              this.emailService.sendEmail(resp.istanza.anagrafica.email, cc, subject, messaggioCittadino, { emailCittadino: true, municipio_id: this.authService.getMunicipio() });
              
              //invio mail Municipio
              if(emailsMunicipio && emailsMunicipio.length) {
                let messaggioMunicipio = this.emailService.emailAssociazioneTagRFIDMunicipio(resp.istanza);            
                this.emailService.sendEmail(emailsMunicipio.join(','), cc, subject, messaggioMunicipio);     
              }
              else {
                this.messageService.showMessage('warn', 'Associazione Tag RFID', 'Non sono presenti referenti del municipio relativo all\'indirizzo inserito',3000);
              }

              this.messageService.showMessage('success', 'Associazione Tag RFID', 'Associazione Tag RFID al segnale indicatore avvenuta');           
              
              this.dataSource = this.dataSource.filter(el => el.id_doc != resp.istanza.id_doc);
              this.dataSource = [...this.dataSource];
              this.showRFIDDialog = false;
              this.showSpinner = false;
              // this.showProtocolloDialog = true;
            },
            err => {
              this.messageService.showMessage('error', 'Associazione Tag RFID', err.error.message);
              this.showRFIDDialog = false;
              this.showSpinner = false;
              // this.showProtocolloDialog = false;
            }
          );           
        },
        err => {
          this.messageService.showMessage('error', 'Invio email', err.error.message);
          this.showRFIDDialog = false;
          this.showSpinner = false;
          // this.showProtocolloDialog = false;
        }
      );
    }
    else {
      this.showSpinner = false;
      this.messageService.showMessage('warn', 'Controllo tag rfid', 'Attenzione: il tag rfid inserito è già presente a sistema.');
    }
  }

  closeRFIDDialog(){
    this.showRFIDDialog = false;
    this.rfid = '';
  }

  // closeProtocolloDialog(event?) {
  //   this.showProtocolloDialog = false;
  //   this.numProtocollo = '';
  //   this.actionRiprotocollazione = '';
  // }

  // resetProtocollo() {
  //   this.objProtocollo = null;
  //   this.isProtocollata = false;
  //   this.base64DocInserimento = '';
  // }
}
