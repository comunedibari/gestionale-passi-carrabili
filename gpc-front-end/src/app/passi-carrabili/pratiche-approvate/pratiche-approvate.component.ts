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
import { FormatDatePipe } from 'src/app/shared/pipe/format-date.pipe';
import { CreazioneDovutoComponent } from '../creazione-dovuto/creazione-dovuto.component';
import { environment } from '../../../environments/environment';
import { ProtocolloService } from 'src/app/shared/service/protocollo.service';
import { PassaggiStato } from 'src/app/shared/enums/PassaggiStato.enum';

@Component({
  selector: 'app-pratiche-approvate',
  templateUrl: './pratiche-approvate.component.html',
  styleUrls: ['./pratiche-approvate.component.css']
})
export class PraticheApprovateComponent implements OnInit {

  constructor(
    private passiCarrabiliService: PassiCarrabiliService,
    private protocolloService: ProtocolloService,
    private messageService: MessageService,
    public authService: AuthService,
    public dialogService: DialogService,
    private utilityService: UtilityService,
    public confirmationService: ConfirmationService,
    private emailService: EmailService,
    private datePipe: FormatDatePipe
  ) { }

  showSpinner: boolean = false;
  showUploadDeterminaDialog: boolean = false;
  identificativoDetermina: string = '';
  dataDetermina:string = '';
  dateNow = new Date();
  dataSource: any[];
  pratica: any;
  determina: any = {
    id: '',
    data_emissione: '',
    id_blob: ''
  };

  showProtocolloDialog: boolean = false;
  numProtocollo: string = '';
  isProtocollata: boolean = false;
  actionRiprotocollazione: string = '';
  uploadedFiles: any[] = [];
  objTakeEmails: any[] = [];
  base64DocInserimento: string = '';
  objProtocollo: any = null;

  initSortColumn = 'last_modification.data_operazione';
  directionSortColumn = "1"; //1=asc  0=rand   -1=desc 
  titleTable: string = 'Pratiche approvate';
  exportName = 'Pratiche approvate'; 
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
      key: 'downloadDetermina',
      icon: "pi pi-download",
      tooltip: 'DOWNLOAD TEMPLATE DETERMINA',
      hidden: (el) => {
        return this.authService.getGroup() != Group.IstruttoreMunicipio;
      }
    },
    {
      key: 'uploadDetermina',
      icon: "pi pi-upload",
      tooltip: 'UPLOAD DETERMINA',
      hidden: (el) => {
        return this.authService.getGroup() != Group.IstruttoreMunicipio;
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
    this.passiCarrabiliService.cercaPratichePerStatoPratica(StatoPraticaPassiCarrabili.Approvata, this.authService.getMunicipio()).subscribe(
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

  downloadDetermina(element: any) {
    this.utilityService.generaDetermina(element).subscribe( 
      data => {
        saveAs(data, this.utilityService.getDeterminaName(element));
      },
      err => {
        this.messageService.showMessage('error', 'Generazione determina', 'Errore durante la generazione della determina');
      }
    );
  }

  uploadDetermina(element) {
    this.pratica = element;
    this.resetProtocollo();
    if(this.pratica.dati_istanza.tipologia_processo == TipologiaPratica.Decadenza){
      if(this.utilityService.checkAvvioDecadenza(this.pratica.data_scadenza_notifica_decadenza))
        this.showUploadDeterminaDialog = true;
      else
        this.messageService.showMessage('warn', 'Approvazione decadenza', `L'intervallo dei 20 giorni dalla comunicazione della decadenza al cittadino non è concluso. Essa potrà diventare esecutiva dopo il ${this.datePipe.transform(this.pratica.data_scadenza_notifica_decadenza, true)}`);
    }
    else
      this.showUploadDeterminaDialog = true;
  }

  async confermaUploadDetermina() {
    this.showSpinner = true;
    this.uploadedFiles = [];
  
    var file = null;
    var estensioneFile = null;
    if(this.determina.id_blob) {
      this.uploadedFiles.push({ id: this.determina.id_blob });
      file = await this.passiCarrabiliService.getDocumentoSync(this.determina.id_blob);
      estensioneFile = file.name.substr(file.name.lastIndexOf('.') + 1).toLowerCase();
    }

    if(!this.objProtocollo) {   
      if(this.pratica.dati_istanza.tipologia_processo == TipologiaPratica.Rinuncia || this.pratica.dati_istanza.tipologia_processo == TipologiaPratica.Decadenza) {
        this.pratica.stato_pratica = StatoPraticaPassiCarrabili['Pronto alla restituzione'];    
        this.pratica.info_passaggio_stato = PassaggiStato.ApprovataToProntoAllaRestituzione;
      } 
      else if(this.pratica.dati_istanza.tipologia_processo == TipologiaPratica.Proroga){
        this.pratica.stato_pratica = StatoPraticaPassiCarrabili['Concessione valida']; 
        this.pratica.info_passaggio_stato = PassaggiStato.ApprovataToConcessioneValida;
      }   
      else {
        this.pratica.stato_pratica = StatoPraticaPassiCarrabili['Attesa di pagamento'];
        this.pratica.info_passaggio_stato = PassaggiStato.ApprovataToAttesaDiPagamento;
      }

      this.objProtocollo = this.utilityService.getObjForPdfProtocollo(this.pratica, this.uploadedFiles, this.pratica.info_passaggio_stato);
      
      if(this.uploadedFiles.length == 0) {
        let data: any = await this.utilityService.generaPdfPerProtocolloSync(this.objProtocollo, "templateProtocolloPratica").catch(err => {
          this.actionRiprotocollazione = 'confermaUploadDetermina';
          this.objProtocollo = null;
          this.messageService.showMessage('warn', 'Generazione template', 'Errore durante la generazione del documento principale per il protocollo. Riprovare più tardi.');
        });
  
        if(data) {
          this.base64DocInserimento = (await this.utilityService.convertFileToBase64(data)).toString();      
        }
      }
      else {
        this.base64DocInserimento = file.blob;
      } 
    }

    var respProtocollo: any = null;
    if(this.base64DocInserimento) {

      this.objTakeEmails = [];
      this.objTakeEmails.push({ group_id: Group.DirettoreMunicipio, municipio_id: this.pratica.dati_istanza.indirizzo_segnale_indicatore.municipio_id });
      
      if(this.pratica.dati_istanza.tipologia_processo == TipologiaPratica.Decadenza) {
        this.objTakeEmails.push({ group_id: Group.PoliziaLocale, municipio_id: null });
        this.objTakeEmails.push({ group_id: Group.PoliziaLocale, municipio_id: this.pratica.dati_istanza.indirizzo_segnale_indicatore.municipio_id });
      }
      else {
        if (this.pratica.parere_polizia && this.pratica.parere_polizia.competenza != false) {
          this.objTakeEmails.push({ group_id: Group.PoliziaLocale, municipio_id: null });
          this.objTakeEmails.push({ group_id: Group.PoliziaLocale, municipio_id: this.pratica.dati_istanza.indirizzo_segnale_indicatore.municipio_id });
        }
        if (this.pratica.parere_utd && this.pratica.parere_utd.competenza != false) {
          this.objTakeEmails.push({ group_id: Group.UfficioTecnicoDecentrato, municipio_id: null });
        }
        if (this.pratica.parere_urbanistica && this.pratica.parere_urbanistica.competenza != false) {
          this.objTakeEmails.push({ group_id: Group.RipartizioneUrbanistica, municipio_id: null });
        }

        this.objTakeEmails.push({ group_id: Group.RipartizioneTributi, municipio_id: null });
        this.objTakeEmails.push({ group_id: Group.RipartizioneRagioneria, municipio_id: null });
        this.objTakeEmails.push({ group_id: Group.Concessionario, municipio_id: null });
      }

      let callProtocollo: Promise<any> = environment.production ? this.protocolloService.richiestaProtocolloUscitaNewSync(this.objProtocollo, this.objTakeEmails, true, this.base64DocInserimento, [], estensioneFile) 
                                                                : this.passiCarrabiliService.getNumeroProtocolloSync(null);
      respProtocollo = await callProtocollo.catch(err => {
              this.actionRiprotocollazione = 'confermaUploadDetermina';
              this.messageService.showMessage('warn', 'Numero protocollo', 'Servizio di protocollo non disponibile. Riprovare più tardi.');
            });
    }

    this.numProtocollo = `${respProtocollo?.numeroProtocollo || '--'}|${respProtocollo?.anno || '--'}`;

    //associazione numero di protocollo ai documenti allegati
    if(this.uploadedFiles && this.uploadedFiles.length && this.numProtocollo != '--|--') {
      this.associaProtocolloADocumento();
    }

    if(this.numProtocollo && this.numProtocollo != '--|--')
      this.avanzamentoPratica();
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

  avanzamentoPratica() {
    this.determina.id = this.identificativoDetermina;
    this.determina.data_emissione = this.utilityService.getStartOfDay(this.dataDetermina);
    this.pratica.determina = this.determina;
    this.pratica.numero_protocollo_comunicazione = this.numProtocollo;
    this.isProtocollata = true;
    this.showProtocolloDialog = false;
    delete this.pratica.data_scadenza_procedimento;
    
    if(this.pratica.dati_istanza.tipologia_processo == TipologiaPratica.Rinuncia 
        || this.pratica.dati_istanza.tipologia_processo == TipologiaPratica.Decadenza) {
      this.pratica.data_scadenza_restituzione = this.utilityService.getDataScadenzaPratica(undefined, 30);
    }  
    else if(this.pratica.dati_istanza.tipologia_processo == TipologiaPratica.Proroga) {
      delete this.pratica.data_scadenza_procedimento;
    }
    else {
      this.pratica.data_scadenza_pagamento = this.utilityService.getDataScadenzaPratica(undefined, 30);
    }

    this.utilityService.takeEmails(this.objTakeEmails).subscribe(
      resp => {
        let emails = resp.data.filter(x => x.group_id != Group.Concessionario).map(x => x.email);
        let emailsAttori = emails.filter((item, index) => emails.indexOf(item) === index);
        let emailConcessionario = resp.data.find(x => x.group_id == Group.Concessionario)?.email;

        this.passiCarrabiliService.aggiornaPratica(this.pratica).subscribe(
          resp => {
            let cc = this.authService.getEmail();
            let subject = this.utilityService.getSubjectEmail(resp.istanza, 'Comunicazione inserimento determina');
            let messaggioCittadino = '';
            switch(this.pratica.dati_istanza.tipologia_processo) {              
              case TipologiaPratica.Rinuncia: { 
                messaggioCittadino = this.emailService.emailNotificaInserimentoDeterminaRinunciaCittadino(resp.istanza);
                break; 
              }  
              case TipologiaPratica.Decadenza: { 
                messaggioCittadino = this.emailService.emailNotificaInserimentoDeterminaDecadenzaCittadino(resp.istanza);
                break; 
              } 
              case TipologiaPratica.Proroga: { 
                messaggioCittadino = this.emailService.emailNotificaApprovazioneProrogaCittadino(resp.istanza);
                break; 
              } 
              default: {
                messaggioCittadino = this.emailService.emailNotificaInserimentoDeterminaCittadino(resp.istanza);
                break; 
              }
            }                     

            // this.emailService.sendEmail(resp.istanza.anagrafica.email, cc, subject, messaggioCittadino, { emailCittadino: true, municipio_id: this.authService.getMunicipio() });

            let messaggioAttori= '';
            if(emailsAttori && emailsAttori.length) {
              messaggioAttori = this.emailService.emailNotificaInserimentoDeterminaAttori(resp.istanza);                 
            }
            else {
              this.messageService.showMessage('warn', 'Inserimento determina pratica', 'Non sono presenti referenti del municipio relativo all\'indirizzo',3000);
            }

            this.emailService.sendEmail(emailsAttori.join(','), cc, subject, messaggioAttori);

            // if(emailConcessionario) {
              this.passiCarrabiliService.getDocumento(resp.istanza.determina.id_blob).subscribe(
                resp_doc => {
                  this.emailService.sendEmail(resp.istanza.anagrafica.email, cc, subject, messaggioCittadino, { filename: resp_doc.name, path: resp_doc.blob, municipio_id: this.authService.getMunicipio() });
                  
                  if(emailConcessionario)
                    this.emailService.sendEmail(emailConcessionario, cc, subject, messaggioAttori, { filename: resp_doc.name, path: resp_doc.blob, municipio_id: this.authService.getMunicipio() });
                },
                err => {
                  this.messageService.showMessage('error', 'Errore nel ritrovamento della determina per il concessionario' , err.error.message);
                }
              );
            // }
            
            this.messageService.showMessage('success', 'Inserimento determina pratica', 'Inserimento della determina avvenuto con successo');
            
            //chiusura della pratica originaria con passaggio di stato in pratica archiviata
            if(resp.istanza.dati_istanza.link_pratica_origine && 
                (resp.istanza.dati_istanza.tipologia_processo == TipologiaPratica.Rinuncia 
                  || resp.istanza.dati_istanza.tipologia_processo == TipologiaPratica.Decadenza
                  || resp.istanza.dati_istanza.tipologia_processo == TipologiaPratica.Proroga)) {
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
            this.closeUploadDeterminaDialog('ok');
            this.pratica = resp.istanza;
            this.showSpinner = false;
            this.showProtocolloDialog = true;
          },
          err => {
            this.messageService.showMessage('error', 'Errore inserimento determina pratica' , err.error.message);
            this.closeUploadDeterminaDialog('Annulla');
            this.showSpinner = false;
            this.showProtocolloDialog = false;
          }
        );
      },
      err => {
        this.messageService.showMessage('error', 'Invio email', err.error.message);
        this.closeUploadDeterminaDialog('Annulla');
        this.showSpinner = false;
        this.showProtocolloDialog = false;
      }
    );
  }

  startCreaDovuto() {
    if(environment.production  
      && this.pratica.dati_istanza.tipologia_processo != TipologiaPratica.Proroga
      && this.pratica.dati_istanza.tipologia_processo != TipologiaPratica.Rinuncia
      && this.pratica.dati_istanza.tipologia_processo != TipologiaPratica.Decadenza
      && this.pratica.dati_istanza.tipologia_processo != TipologiaPratica.Revoca
      )
      this.creaDovuto(this.pratica);
  }

  getIdDocUploaded(id_blob) {
    this.determina.id_blob = id_blob;
  }

  async closeUploadDeterminaDialog(event?) {
    this.showSpinner = true;
    if(event == 'Annulla' && this.determina.id_blob){
      await this.passiCarrabiliService.deleteDocumentSync(this.determina.id_blob).then(resp => {
        this.determina.id_blob = '';
        this.clearData();
      })
      .catch(err => {
          this.messageService.showMessage('error', 'Upload file', err.error.message ? err.error.message : err.statusText);
        });
    }
    else if(event == 'ok'){
      //non fare nulla
    }
    else  
      this.clearData();
  }

  clearData(){
    this.showUploadDeterminaDialog = false;
    this.identificativoDetermina = '';
    this.dataDetermina = '';
    setTimeout(() => { 
      this.cercaPratiche();
    }, 2000); 
  }

  closeProtocolloDialog(event?) {
    if(event == 'chiudi'){
    //   if( this.numProtocollo != '' && this.numProtocollo != '--|--')
    //     this.startCreaDovuto();
    //   else 
    //     this.clearData();

      this.showProtocolloDialog = false;
      this.numProtocollo = '';
      this.actionRiprotocollazione = '';
      this.clearData();
    }
  }

  //yearRange per p-calendar
  calculateYearDeterminaRange():string {
    let min = new Date().getFullYear()-2;
    let max = new Date().getFullYear()+2;
    return min.toString() + ":" + max.toString();
  }

  creaDovuto(element: any) {
    let dialogRef = this.dialogService.open(CreazioneDovutoComponent,  this.utilityService.configDynamicDialogFullScreen(element, "Creazione dovuto di tipo atteso"));

    dialogRef.onClose.subscribe((resp) => {
      if(resp){
        this.showSpinner = true;
        
        element.dovuto = {
          iud: resp.iud,
          iuv: resp.iuv,
          cauzione_infruttifera: resp.cauzione_infruttifera ? Number(resp.cauzione_infruttifera) : ( element.dovuto?.cauzione_infruttifera || null),
          costo_segnale_indicatore: resp.costo_segnale_indicatore ? Number(resp.costo_segnale_indicatore) : ( element.dovuto?.costo_segnale_indicatore || null),
        };  

        this.passiCarrabiliService.aggiornaPratica(element, null, false).subscribe(
          resp => {
            this.showSpinner = false;
            this.messageService.showMessage('success', 'Creazione dovuto', 'Il dovuto è stato creato correttamente'); 
          },
          err => {
            this.showSpinner = false;
            this.messageService.showMessage('error', 'Creazione dovuto' , 'Errore durante l\'associazione del dovuto alla pratica');
          }
        );
      }
    });
  }

  resetProtocollo() {
    this.objProtocollo = null;
    this.isProtocollata = false;
    this.base64DocInserimento = '';
  }
}
