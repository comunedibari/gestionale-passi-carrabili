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
import { UploadFileComponent } from 'src/app/shared/upload-file/upload-file.component';
import { environment } from '../../../environments/environment';
import { ProtocolloService } from 'src/app/shared/service/protocollo.service';
import { PassaggiStato } from 'src/app/shared/enums/PassaggiStato.enum';
import { ModificaPraticaComponent } from '../modifica-pratica/modifica-pratica.component';

@Component({
  selector: 'app-pratiche-bozza',
  templateUrl: './pratiche-bozza.component.html',
  styleUrls: ['./pratiche-bozza.component.css']
})
export class PraticheBozzaComponent implements OnInit {

  constructor(
    private passiCarrabiliService: PassiCarrabiliService,
    private messageService: MessageService,
    public authService: AuthService,
    public dialogService: DialogService,
    private utilityService: UtilityService,
    public confirmationService: ConfirmationService,
    private emailService: EmailService,
    private protocolloService: ProtocolloService
  ) { }

  showSpinner: boolean = false;
  dataSource: any[];
  showProtocolloDialog: boolean = false;
  numProtocollo: string = '';
  isProtocollata: boolean = false;
  actionRiprotocollazione: string = '';
  pratica: any;
  uploadedFiles: any[] = [];
  base64DocInserimento: string = '';
  objProtocollo: any = null;

  initSortColumn = 'last_modification.data_operazione';
  directionSortColumn = "1"; //1=asc  0=rand   -1=desc 
  titleTable: string = 'Pratiche in bozza';
  exportName = 'Pratiche in bozza'; 
  globalFilters: any[] = [
    {value:'dati_istanza.indirizzo_segnale_indicatore.indirizzo',label:'Indirizzo'},
    {value:'anagrafica.codice_fiscale',label:'Cod. Fiscale/P. IVA'}
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
      key: 'modificaPratica',
      icon: "pi pi-pencil",
      tooltip: 'MODIFICA',
      hidden: (el) => {
        return el.stato_pratica != StatoPraticaPassiCarrabili.Bozza 
                || (this.authService.getGroup() != Group.OperatoreSportello
                    && this.authService.getGroup() != Group.IstruttoreMunicipio)
      }
    },
    {
      key: 'inoltraPratica',
      icon: "pi pi-send",
      tooltip: 'INVIA',
      hidden: (el) => {
        return el.stato_pratica != StatoPraticaPassiCarrabili.Bozza 
                || (this.authService.getGroup() != Group.OperatoreSportello
                    && this.authService.getGroup() != Group.IstruttoreMunicipio)
                || el.dati_istanza.tipologia_processo == TipologiaPratica.Revoca
                // || el.dati_istanza.tipologia_processo == TipologiaPratica.Decadenza;
      }
    },
    // {
    //   key: 'inoltraPratica',
    //   icon: "pi pi-send",
    //   tooltip: 'INVIA',
    //   hidden: (el) => {
    //     return el.stato_pratica != StatoPraticaPassiCarrabili.Bozza 
    //             || el.dati_istanza.tipologia_processo != TipologiaPratica.Decadenza
    //             || (this.authService.getGroup() != Group.IstruttoreMunicipio
    //                 && this.authService.getGroup() != Group.DirettoreMunicipio
    //                 && this.authService.getGroup() != Group.PoliziaLocale
    //                 );
    //   }
    // },
    {
      key: 'inoltraPraticaSenzaDocumenti',
      icon: "pi pi-send",
      tooltip: 'INVIA',
      hidden: (el) => {
        return el.stato_pratica != StatoPraticaPassiCarrabili.Bozza 
                || el.dati_istanza.tipologia_processo != TipologiaPratica.Revoca
                || (this.authService.getGroup() != Group.OperatoreSportello
                    && this.authService.getGroup() != Group.IstruttoreMunicipio
                    // && this.authService.getGroup() != Group.DirettoreMunicipio
                    // && this.authService.getGroup() != Group.PoliziaLocale
                    );
      }
    },
    {
      key: 'eliminaPratica',
      icon: "pi pi-trash",
      tooltip: 'ELIMINA',
      hidden: (el) => {
        return el.stato_pratica != StatoPraticaPassiCarrabili.Bozza 
                || (this.authService.getGroup() != Group.OperatoreSportello
                    && this.authService.getGroup() != Group.IstruttoreMunicipio)
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
    this.passiCarrabiliService.cercaPratichePerStatoPratica(StatoPraticaPassiCarrabili.Bozza, this.authService.getMunicipio()).subscribe(
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

  inoltraPratica(istanza: any) {
    let data = {
      pratica: istanza,
      mode: 'multiple'
    }

    this.uploadedFiles = [];
    this.resetProtocollo();
    let dialogRef = this.dialogService.open(UploadFileComponent, this.utilityService.configDynamicDialogFullScreen(data, "Allega documenti alla pratica"));

    dialogRef.onClose.subscribe((uploadedFiles) => {
      if (uploadedFiles) {
        this.uploadedFiles = uploadedFiles.filter(doc => !doc.numero_protocollo || doc.numero_protocollo == '--|--');
        this.inoltraPraticaSenzaDocumenti(istanza);
      }
    });
  }

  async inoltraPraticaSenzaDocumenti(istanza) {
    this.showSpinner = true;
    
    if(!this.objProtocollo) {   
      istanza.stato_pratica = StatoPraticaPassiCarrabili.Inserita;
      istanza.info_passaggio_stato = PassaggiStato.BozzaToInserita;
      this.objProtocollo = this.utilityService.getObjForPdfProtocollo(istanza, this.uploadedFiles, istanza.info_passaggio_stato);
      let data: any = await this.utilityService.generaPdfPerProtocolloSync(this.objProtocollo, "templateInserimentoPratica").catch(err => {
        this.actionRiprotocollazione = 'inoltraPraticaSenzaDocumenti';
        this.objProtocollo = null;
        this.messageService.showMessage('warn', 'Generazione template', 'Errore durante la generazione del documento principale per il protocollo. Riprovare più tardi.');
      });

      if(data) {
        this.base64DocInserimento = (await this.utilityService.convertFileToBase64(data)).toString();      
      }
    }

    var respProtocollo: any = null;
    if(this.base64DocInserimento) {
      var convertedUploadedFiles = [];
      for (let i = 0; i < this.uploadedFiles.length; i++) {
        var doc = this.uploadedFiles[i];
        await this.passiCarrabiliService.getDocumentoSync(doc.id).then(async (resp: any) => {
          var base64 = await fetch(resp.blob);
          var blob = await base64.blob();
          convertedUploadedFiles.push(blob);
        }).catch( err => {
            this.messageService.showMessage('error','Caricamento File', err.error.message);
        });     
      }
    
      this.pratica = istanza;
      let callProtocollo: Promise<any> = environment.production ? this.protocolloService.richiestaProtocolloEntrataNewSync(this.objProtocollo, this.base64DocInserimento, convertedUploadedFiles) 
                                                                : this.passiCarrabiliService.getNumeroProtocolloSync(null);

      respProtocollo = await callProtocollo.catch(err => {
          this.actionRiprotocollazione = 'inoltraPraticaSenzaDocumenti';
          this.messageService.showMessage('warn', 'Numero protocollo', 'Servizio di protocollo non disponibile. Riprovare più tardi.');
        });
    }

    this.numProtocollo = `${respProtocollo?.numeroProtocollo || '--'}|${respProtocollo?.anno || '--'}`;

    //associazione numero di protocollo ai documenti allegati
    if(this.uploadedFiles && this.uploadedFiles.length && this.numProtocollo != '--|--') {
      this.associaProtocolloADocumento();
    }

    if(this.numProtocollo && this.numProtocollo != '--|--')
      this.inserimentoPratica(this.pratica);
    else {
      this.showSpinner = false;
      this.showProtocolloDialog = true;
    }
  }

  associaProtocolloADocumento(){
    this.uploadedFiles.forEach(async (doc) => {
      if(!doc.numero_protocollo || doc.numero_protocollo == '--|--'){
        doc.numero_protocollo = this.numProtocollo;
        await this.passiCarrabiliService.assegnaProtocolloDocumentoSync(doc)
          .catch(err => {
            this.messageService.showMessage('warn', 'Associazione numero protocollo', err.error.message);
          });
      }
    });
  }

  inserimentoPratica(element: any) {
    //aggiunta campo numero_protocollo e inserimento pratica
    element.numero_protocollo = this.numProtocollo;
    element.numero_protocollo_comunicazione = this.numProtocollo;
    this.isProtocollata = true;
    this.showProtocolloDialog = false;

    let emailsMunicipio = [];
    let objTakeEmails = [
      { group_id: Group.DirettoreMunicipio, municipio_id: element.dati_istanza.indirizzo_segnale_indicatore.municipio_id },
      { group_id: Group.IstruttoreMunicipio, municipio_id: element.dati_istanza.indirizzo_segnale_indicatore.municipio_id }
    ];

    this.utilityService.takeEmails(objTakeEmails).subscribe(
      resp => {
        let emails = resp.data.map(x => x.email);
        emailsMunicipio = emails.filter((item, index) => emails.indexOf(item) === index);

        this.passiCarrabiliService.inserimentoPratica(element).subscribe(
          resp => {
            let subject = this.utilityService.getSubjectEmail(resp.istanza, 'Comunicazione inserimento richiesta');
            let cc = this.authService.getEmail();

            let messaggioCittadino = '';
            let messaggioMunicipio = '';          

            switch (resp.istanza.dati_istanza.tipologia_processo) {
              case TipologiaPratica.Proroga:
                messaggioCittadino = this.emailService.emailAvvioPraticaSenzaAssegnazioneCittadino(resp.istanza);
                messaggioMunicipio = this.emailService.emailAvvioPraticaSenzaAssegnazioneAttori(resp.istanza);
                break;    
              case TipologiaPratica.Revoca:
              case TipologiaPratica.Decadenza:
                messaggioMunicipio = this.emailService.emailAvvioPraticaRevoca(resp.istanza); 
                break;
              default: 
                messaggioCittadino = this.emailService.emailAvvioPraticaCittadino(resp.istanza);
                messaggioMunicipio = this.emailService.emailAvvioPraticaOperatoreSportello(resp.istanza);
                break;
            }
            
            //invio mail cittadino
            if(messaggioCittadino)
              this.emailService.sendEmail(resp.istanza.anagrafica.email, cc, subject, messaggioCittadino, { emailCittadino: true, municipio_id: this.authService.getMunicipio() });

            //invio mail Municipio
            if (emailsMunicipio && emailsMunicipio.length) {
              this.emailService.sendEmail(emailsMunicipio.join(','), cc, subject, messaggioMunicipio);
            }
            else {
              this.messageService.showMessage('warn', 'Inserimento richiesta', 'Non sono presenti referenti del municipio relativo all\'indirizzo inserito');
            }

            this.showSpinner = false;
            this.messageService.showMessage('success', 'Inserimento richiesta', 'La pratica è stata inoltrata al municipio di appartenenza');

            this.dataSource = this.dataSource.filter(el => el.id_doc != resp.istanza.id_doc);
            this.dataSource = [...this.dataSource];
            this.showProtocolloDialog = true;
          },
          err => {
            this.showSpinner = false;
            this.messageService.showMessage('error', 'Inserimento richiesta', err.error.message);
            this.showProtocolloDialog = true;
          }
        );
      },
      err => {
        this.showSpinner = false;
        this.messageService.showMessage('error', 'Invio email', err.error.message);
        this.showProtocolloDialog = true;
      }
    );
  }

  closeProtocolloDialog(event?) {
    this.showProtocolloDialog = false;
    this.numProtocollo = '';
    this.actionRiprotocollazione = '';
  }

  eliminaPratica(element: any) {
    this.confirmationService.confirm({
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Conferma",
      rejectLabel: "Annulla",
      acceptButtonStyleClass: "btn-custom-style btn-dialog-confirm",
      rejectButtonStyleClass: "btn-custom-style btn-dialog-confirm",
      header: "Eliminazione pratica",
      message: "Confermi di voler eliminare la pratica selezionata?",
      accept: () => {
        this.showSpinner = true;
        this.passiCarrabiliService.eliminaPratica(element.id_doc).subscribe(
          resp => {      
            this.dataSource = this.dataSource.filter(el => el.id_doc != element.id_doc);
            this.dataSource = [...this.dataSource];  
            this.showSpinner = false;
            this.messageService.showMessage('success', 'Eliminazione pratica', 'La pratica è stata eliminata'); 
          },
          err => {
            this.showSpinner = false;
            this.messageService.showMessage('error','Eliminazione pratica', err.error.message); 
          }
        );
      }
    });
  }

  resetProtocollo() {
    this.objProtocollo = null;
    this.isProtocollata = false;
    this.base64DocInserimento = '';
    this.cercaPratiche();
  }

  modificaPratica(element) {
    let dialogRef = this.dialogService.open(ModificaPraticaComponent, this.utilityService.configDynamicDialogFullScreen(element, "Modifica pratica"));

    dialogRef.onClose.subscribe((istanza) => {
      if (istanza) {
        this.dataSource = this.dataSource.filter(el => el.id_doc != istanza.id_doc);
        this.dataSource.push(istanza);
        this.dataSource = [...this.dataSource];
      }
    });
  }
}
