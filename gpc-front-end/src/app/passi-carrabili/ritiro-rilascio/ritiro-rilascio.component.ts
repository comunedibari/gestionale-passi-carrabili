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
import { Group } from 'src/app/shared/enums/Group.enum';
import { EmailService } from 'src/app/shared/service/email.service';
// import { environment } from '../../../environments/environment';
// import { ProtocolloService } from 'src/app/shared/service/protocollo.service';
import { PassaggiStato } from 'src/app/shared/enums/PassaggiStato.enum';

@Component({
  selector: 'app-ritiro-rilascio',
  templateUrl: './ritiro-rilascio.component.html',
  styleUrls: ['./ritiro-rilascio.component.css']
})
export class RitiroRilascioComponent implements OnInit {

  constructor(
    private passiCarrabiliService: PassiCarrabiliService,
    // private protocolloService: ProtocolloService,
    private messageService: MessageService,
    public authService: AuthService,
    public dialogService: DialogService,
    private utilityService: UtilityService,
    public confirmationService: ConfirmationService,
    private emailService: EmailService,
  ) { }

  showSpinner: boolean = false;
  showRFIDDialog: boolean = false;
  dataSource: any[];
  pratica: any;
  rfid: string = '';

  // showProtocolloDialog: boolean = false;
  // numProtocollo: string = '';
  // isProtocollata: boolean = false;
  // actionRiprotocollazione: string = '';
  // base64DocInserimento: string = '';
  // objProtocollo: any = null;

  initSortColumn = 'last_modification.data_operazione';
  directionSortColumn = "1"; //1=asc  0=rand   -1=desc 
  titleTable: string = 'Segnali indicatori da rilasciare o restituire';
  exportName = 'Restituzione e rilascio'; 
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
      key: 'rilasciaCartello',
      icon: "pi pi-arrow-right",
      tooltip: 'RILASCIA CARTELLO',
      hidden: (el) => {
        return el.stato_pratica != StatoPraticaPassiCarrabili['Pronto al rilascio']
                || this.authService.getGroup() != Group.IstruttoreMunicipio;
      }
    },
    {
      key: 'ritiraCartello',
      icon: "pi pi-arrow-left",
      tooltip: 'RESTITUZIONE CARTELLO',
      hidden: (el) => {
        return el.stato_pratica != StatoPraticaPassiCarrabili['Pronto alla restituzione']
                || this.authService.getGroup() != Group.IstruttoreMunicipio;
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
    this.passiCarrabiliService.cercaPratichePerStatoPratica([StatoPraticaPassiCarrabili['Pronto al rilascio'], StatoPraticaPassiCarrabili['Pronto alla restituzione']], this.authService.getMunicipio()).subscribe(
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

  rilasciaCartello(element: any) {
    this.pratica = element;
    // this.resetProtocollo();
    this.showRFIDDialog = true;
  }

  ritiraCartello(element: any) {
    this.pratica = element;
    // this.resetProtocollo();
    this.confirmationService.confirm({
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Restituisci",
      rejectLabel: "Annulla",
      acceptButtonStyleClass: "btn-custom-style btn-dialog-validazione-pratica",
      rejectButtonStyleClass: "btn-custom-style btn-dialog-validazione-pratica",
      header: "Restituzione cartello",
      message:`Confermi la restituzione del segnale indicatore di passo carrabile?`,
      accept: () => {
        this.ritira();
      }
    });
  }

  async rilascia(){
    this.showSpinner = true;

    // if(!this.objProtocollo) { 
      this.pratica.stato_pratica = StatoPraticaPassiCarrabili['Concessione valida'];
      this.pratica.info_passaggio_stato = PassaggiStato.ProntoAlRilascioToConcessioneValida;
    //   this.objProtocollo = this.utilityService.getObjForPdfProtocollo(this.pratica, [], this.pratica.info_passaggio_stato);
    //   let data: any = await this.utilityService.generaPdfPerProtocolloSync(this.objProtocollo, "templateProtocolloPratica").catch(err => {
    //     this.actionRiprotocollazione = 'rilascia';
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
    //         this.actionRiprotocollazione = 'rilascia';
    //         this.messageService.showMessage('warn', 'Numero protocollo', 'Servizio di protocollo non disponibile. Riprovare più tardi.');
    //       });
    // }

    // this.numProtocollo = `${respProtocollo?.numeroProtocollo || '--'}|${respProtocollo?.anno || '--'}`;

    // if(this.numProtocollo && this.numProtocollo != '--|--')
      this.rilasciaPratica();
    // else {
    //   this.showSpinner = false;
    //   this.showProtocolloDialog = true;
    // }
  }

  async rilasciaPratica(){
    // this.pratica.numero_protocollo_comunicazione = this.numProtocollo;
    // this.isProtocollata = true;
    // this.showProtocolloDialog = false;
    this.pratica.numero_protocollo_comunicazione = null;
    
    var  uniqueTagRFID = true;

    if(this.rfid) {
      this.pratica.tag_rfid = this.rfid;
      uniqueTagRFID = <boolean>await this.passiCarrabiliService.checkUniqueTagRFIDSync(this.rfid).catch(err => {
        this.showSpinner = false;
        this.messageService.showMessage('error', 'Controllo tag rfid', 'Errore durante il controllo dell\'univocità del tag rfid');
      });
    }
      
    if(uniqueTagRFID) {
      //notifica al direttore e al cittadino
      let objTakeEmails = [];
      objTakeEmails.push({ group_id: Group.DirettoreMunicipio, municipio_id: this.pratica.dati_istanza.indirizzo_segnale_indicatore.municipio_id });

      this.utilityService.takeEmails(objTakeEmails).subscribe( 
        resp => {
          let emails = resp.data.map(x => x.email);
          let emailsMunicipio = emails.filter((item, index) => emails.indexOf(item) === index);

          this.passiCarrabiliService.aggiornaPratica(this.pratica).subscribe( 
            resp => {   
              let subject = this.utilityService.getSubjectEmail(resp.istanza, 'Comunicazione rilascio segnale indicatore');
              let cc = this.authService.getEmail();

              //invio mail cittadino  
              let messaggioCittadino = this.emailService.emailCartelloConsegnatoCittadino(resp.istanza); 
              this.emailService.sendEmail(resp.istanza.anagrafica.email, cc, subject, messaggioCittadino, { emailCittadino: true, municipio_id: this.authService.getMunicipio() });
              
              //invio mail Municipio
              if(emailsMunicipio && emailsMunicipio.length) {
                let messaggioMunicipio = this.emailService.emailCartelloConsegnatoMunicipio(resp.istanza);            
                this.emailService.sendEmail(emailsMunicipio.join(','), cc, subject, messaggioMunicipio);     
              }
              else {
                this.messageService.showMessage('warn', 'Rilascio segnale indicatore', 'Non sono presenti referenti del municipio relativo all\'indirizzo inserito',3000);
              }

              this.messageService.showMessage('success', 'Rilascio segnale indicatore', 'Il segnale indicatore di passo carrabile è stato consegnato correttamente');
              
              //chiusura della pratica originaria con passaggio di stato in pratica archiviata
              if(resp.istanza.dati_istanza.link_pratica_origine) {
                this.passiCarrabiliService.archiviaPraticaOriginaria(resp.istanza).subscribe(
                  resp => {
                    this.messageService.showMessage('success', 'Archiviazione pratica originaria', 'La pratica originaria è stata archiviata correttamente');
                  },
                  err => {
                    this.messageService.showMessage('error', 'Archiviazione pratica originaria' , err.error.message);
                  }
                );
              }
              
              this.dataSource = this.dataSource.filter(el => el.id_doc != resp.istanza.id_doc);
              this.dataSource = [...this.dataSource];
              this.showRFIDDialog = false;
              this.showSpinner = false;
              // this.showProtocolloDialog = true;
            },
            err => {
              this.messageService.showMessage('error', 'Rilascio segnale indicatore', err.error.message);
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

  async ritira(){
    this.showSpinner = true;

    // if(!this.objProtocollo) { 
      this.pratica.stato_pratica = StatoPraticaPassiCarrabili.Archiviata;
      this.pratica.info_passaggio_stato = PassaggiStato.ProntoAllaRestituzioneToArchiviata;
    //   this.objProtocollo = this.utilityService.getObjForPdfProtocollo(this.pratica, [], this.pratica.info_passaggio_stato);
    //   let data: any = await this.utilityService.generaPdfPerProtocolloSync(this.objProtocollo, "templateProtocolloPratica").catch(err => {
    //     this.actionRiprotocollazione = 'ritira';
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
    //         this.actionRiprotocollazione = 'ritira';
    //         this.messageService.showMessage('warn', 'Numero protocollo', 'Servizio di protocollo non disponibile. Riprovare più tardi.');
    //       });
    // }

    // this.numProtocollo = `${respProtocollo?.numeroProtocollo || '--'}|${respProtocollo?.anno || '--'}`;

    // if(this.numProtocollo && this.numProtocollo != '--|--')
      this.ritiraPratica();
    // else {
    //   this.showSpinner = false;
    //   this.showProtocolloDialog = true;
    // }
  }

  ritiraPratica(){
    // this.pratica.numero_protocollo_comunicazione = this.numProtocollo;
    // this.isProtocollata = true;
    // this.showProtocolloDialog = false;
    this.pratica.numero_protocollo_comunicazione = null;
    delete this.pratica.data_scadenza_restituzione;

    //notifica al direttore e al cittadino
    let objTakeEmails = [];
    objTakeEmails.push({ group_id: Group.DirettoreMunicipio, municipio_id: this.pratica.dati_istanza.indirizzo_segnale_indicatore.municipio_id });

    this.utilityService.takeEmails(objTakeEmails).subscribe( 
      resp => {
        let emails = resp.data.map(x => x.email);
        let emailsMunicipio = emails.filter((item, index) => emails.indexOf(item) === index);

        this.passiCarrabiliService.aggiornaPratica(this.pratica).subscribe( 
          resp => {   
            let subject = this.utilityService.getSubjectEmail(resp.istanza, 'Comunicazione restituzione segnale indicatore');
            let cc = this.authService.getEmail();

            //invio mail cittadino  
            let messaggioCittadino = this.emailService.emailCartelloRitiratoCittadino(resp.istanza); 
            this.emailService.sendEmail(resp.istanza.anagrafica.email, cc, subject, messaggioCittadino, { emailCittadino: true, municipio_id: this.authService.getMunicipio() });
            
            //invio mail Municipio
            if(emailsMunicipio && emailsMunicipio.length) {
              let messaggioMunicipio = this.emailService.emailCartelloRitiratoMunicipio(resp.istanza);            
              this.emailService.sendEmail(emailsMunicipio.join(','), cc, subject, messaggioMunicipio);     
            }
            else {
              this.messageService.showMessage('warn', 'Restituzione segnale indicatore', 'Non sono presenti referenti del municipio relativo all\'indirizzo inserito',3000);
            }

            this.messageService.showMessage('success', 'Restituzione segnale indicatore', 'Il segnale indicatore di passo carrabile è stato restituito');
            this.dataSource = this.dataSource.filter(el => el.id_doc != resp.istanza.id_doc);
            this.dataSource = [...this.dataSource];
            this.showRFIDDialog = false;
            this.showSpinner = false;
            // this.showProtocolloDialog = true;
          },
          err => {
            this.messageService.showMessage('error', 'Restituzione segnale indicatore', err.error.message);
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
