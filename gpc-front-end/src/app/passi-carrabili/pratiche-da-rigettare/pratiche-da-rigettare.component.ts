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
import { environment } from '../../../environments/environment';
import { ProtocolloService } from 'src/app/shared/service/protocollo.service';
import { PassaggiStato } from 'src/app/shared/enums/PassaggiStato.enum';

@Component({
  selector: 'app-pratiche-da-rigettare',
  templateUrl: './pratiche-da-rigettare.component.html',
  styleUrls: ['./pratiche-da-rigettare.component.css']
})
export class PraticheDaRigettareComponent implements OnInit {

  constructor(
    private passiCarrabiliService: PassiCarrabiliService,
    private protocolloService: ProtocolloService,
    private messageService: MessageService,
    public authService: AuthService,
    public dialogService: DialogService,
    private utilityService: UtilityService,
    public confirmationService: ConfirmationService,
    private emailService: EmailService,
  ) { }

  showSpinner: boolean = false;
  showUploadDeterminaDialog: boolean = false;
  showApprovaPraticaDialog: boolean = false;
  identificativoDetermina: string = '';
  dataDetermina:string = '';
  dateNow = new Date();
  noteIstruttoreMunicipio: string = '';
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
  titleTable: string = 'Pratiche da rigettare o revocare';
  exportName = 'Pratiche da rigettare o revocare'; 
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
        return this.authService.getGroup() != Group.IstruttoreMunicipio || el.dati_istanza.tipologia_processo == TipologiaPratica.Rinuncia;
      }
    },
    {
      key: 'uploadDetermina',
      icon: "pi pi-upload",
      tooltip: 'UPLOAD DETERMINA',
      hidden: (el) => {
        return this.authService.getGroup() != Group.IstruttoreMunicipio || el.dati_istanza.tipologia_processo == TipologiaPratica.Rinuncia;
      }
    },
    {
      key: 'approvaRinuncia',
      icon: "pi pi-exclamation-triangle",
      tooltip: 'RIPRISTINO LUOGHI CON CAUZIONE INFRUTTIFERA',
      hidden: (el) => {
        return this.authService.getGroup() != Group.IstruttoreMunicipio || el.dati_istanza.tipologia_processo != TipologiaPratica.Rinuncia;
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
    this.passiCarrabiliService.cercaPratichePerStatoPratica([StatoPraticaPassiCarrabili['Pratica da rigettare'],StatoPraticaPassiCarrabili['Pratica da revocare']], this.authService.getMunicipio()).subscribe(
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
    this.showUploadDeterminaDialog = true;
  }

  async confermaUploadDetermina() {
    this.uploadedFiles = [];

    var file = null;
    var estensioneFile = null;
    if(this.determina.id_blob) {
      this.uploadedFiles.push({ id: this.determina.id_blob });
      file = await this.passiCarrabiliService.getDocumentoSync(this.determina.id_blob);
      estensioneFile = file.name.substr(file.name.lastIndexOf('.') + 1).toLowerCase();
    }

    if(!this.objProtocollo) {   
      if(this.pratica.stato_pratica == StatoPraticaPassiCarrabili['Pratica da rigettare']) {
        this.pratica.stato_pratica = StatoPraticaPassiCarrabili.Rigettata;
        this.pratica.info_passaggio_stato = PassaggiStato.PraticaDaRigettareToRigettata;
      }    
      else {
        this.pratica.stato_pratica = StatoPraticaPassiCarrabili['Pronto alla restituzione'];
        this.pratica.info_passaggio_stato = PassaggiStato.PraticaDaRevocareToProntoAllaRestituzione;
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

      let callProtocollo: Promise<any> = environment.production ? this.protocolloService.richiestaProtocolloUscitaNewSync(this.objProtocollo, this.objTakeEmails, true, this.base64DocInserimento, [], estensioneFile) 
                                                                : this.passiCarrabiliService.getNumeroProtocolloSync(null);
      this.showSpinner = true;
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

  avanzamentoPratica(){
    this.pratica.numero_protocollo_comunicazione = this.numProtocollo;
    this.isProtocollata = true;
    this.showProtocolloDialog = false;
    this.determina.id = this.identificativoDetermina;
    this.determina.data_emissione = this.utilityService.getStartOfDay(this.dataDetermina);
    this.pratica.determina = this.determina; 
    delete this.pratica.data_scadenza_procedimento;

    if(this.pratica.stato_pratica == StatoPraticaPassiCarrabili['Pronto alla restituzione'])
      this.pratica.data_scadenza_restituzione = this.utilityService.getDataScadenzaPratica(undefined, 30);

    this.utilityService.takeEmails(this.objTakeEmails).subscribe(
      resp => {
        let emails = resp.data.map(x => x.email);
        let emailsAttori = emails.filter((item, index) => emails.indexOf(item) === index);

        this.passiCarrabiliService.aggiornaPratica(this.pratica).subscribe(
          resp => {
            let cc = this.authService.getEmail();
            let subject = '';
            let headerMsg = '';
            let messaggioCittadino = '';
            let messaggioAttori= '';

            if(resp.istanza.stato_pratica == StatoPraticaPassiCarrabili.Rigettata){
              subject = this.utilityService.getSubjectEmail(resp.istanza, 'Comunicazione rigetto pratica');
              headerMsg = 'Rigetto pratica';
              messaggioCittadino = this.emailService.emailNotificaRigettoPraticaCittadino(resp.istanza);
              messaggioAttori = this.emailService.emailNotificaRigettoPraticaAttori(resp.istanza);
            }
            else {
              subject = this.utilityService.getSubjectEmail(resp.istanza, 'Comunicazione restituzione segnale indicatore');
              headerMsg = 'Revoca pratica';
              messaggioCittadino = this.emailService.emailNotificaRevocaPraticaCittadino(resp.istanza);
              messaggioAttori = this.emailService.emailNotificaRevocaPraticaAttori(resp.istanza);
            }

            if(resp.istanza.determina.id_blob){
              this.passiCarrabiliService.getDocumento(resp.istanza.determina.id_blob).subscribe(
                resp_doc => {
                  this.emailService.sendEmail(resp.istanza.anagrafica.email, cc, subject, messaggioCittadino, { filename: resp_doc.name, path: resp_doc.blob, municipio_id: this.authService.getMunicipio() });
                },
                err => {
                  this.messageService.showMessage('error', 'Errore nel ritrovamento della determina per il concessionario' , err.error.message);
                }
              );
            }
            else
              this.emailService.sendEmail(resp.istanza.anagrafica.email, cc, subject, messaggioCittadino, { emailCittadino: true, municipio_id: this.authService.getMunicipio() });
            
            if(emailsAttori && emailsAttori.length) {           
              this.emailService.sendEmail(emailsAttori.join(','), cc, subject, messaggioAttori);                
            }
            else {
              this.messageService.showMessage('warn', headerMsg, 'Non sono presenti referenti del municipio relativo all\'indirizzo inserito',3000);
            }
            
            this.messageService.showMessage('success', headerMsg, `La pratica è ${resp.istanza.stato_pratica == StatoPraticaPassiCarrabili.Rigettata ? 'stata rigettata correttamente' : 'passata nello stato "Pronto alla restituzione"'}`);
            
            //revoca della concessione della pratica originaria con passaggio di stato in pratica revocata
            if(resp.istanza.stato_pratica == StatoPraticaPassiCarrabili['Pronto alla restituzione'] && resp.istanza.dati_istanza.link_pratica_origine){            
              this.passiCarrabiliService.revocaPraticaOriginaria(resp.istanza).subscribe(
                resp => {
                  this.messageService.showMessage('success', 'Revoca pratica originaria', 'La pratica originaria è stata revocata correttamente');
                },
                err => {
                  this.messageService.showMessage('error', 'Revoca pratica originaria' , err.error.message);
                }
              );             
            }

            this.dataSource = this.dataSource.filter(el => el.id_doc != resp.istanza.id_doc);
            this.dataSource = [...this.dataSource];
            this.showUploadDeterminaDialog = false;
            this.showSpinner = false;
            this.showProtocolloDialog = true;
          },
          err => {
            this.messageService.showMessage('error', 'Errore inserimento determina pratica' , err.error.message);
            this.showUploadDeterminaDialog = false;
            this.showSpinner = false;
            this.showProtocolloDialog = false;
          }
        );
      },
      err => {
        this.messageService.showMessage('error', 'Invio email', err.error.message);
        this.showUploadDeterminaDialog = false;
        this.showSpinner = false;
        this.showProtocolloDialog = false;
      }
    );
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
    this.showProtocolloDialog = false;
    this.numProtocollo = '';
    this.actionRiprotocollazione = '';
  }

  approvaRinuncia(element){
    this.pratica = element;
    this.resetProtocollo();
    this.showApprovaPraticaDialog = true;
  }

  async confermaApprova(){
    this.showSpinner = true;

    if(!this.objProtocollo) { 
      this.pratica.stato_pratica = StatoPraticaPassiCarrabili.Approvata;
      this.pratica.info_passaggio_stato = PassaggiStato.PraticaDaRigettareToApprovata;
      this.objProtocollo = this.utilityService.getObjForPdfProtocollo(this.pratica, [], this.pratica.info_passaggio_stato);
      let data: any = await this.utilityService.generaPdfPerProtocolloSync(this.objProtocollo, "templateProtocolloPratica").catch(err => {
        this.actionRiprotocollazione = 'confermaApprova';
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
              this.actionRiprotocollazione = 'confermaApprova';
              this.messageService.showMessage('warn', 'Numero protocollo', 'Servizio di protocollo non disponibile. Riprovare più tardi.');
            });
    }

    this.numProtocollo = `${respProtocollo?.numeroProtocollo || '--'}|${respProtocollo?.anno || '--'}`;

    if(this.numProtocollo && this.numProtocollo != '--|--')
      this.confermaApprovaPratica();
    else {
      this.showSpinner = false;
      this.showProtocolloDialog = true;
    }
  }

  confermaApprovaPratica(){
    this.pratica.numero_protocollo_comunicazione = this.numProtocollo;
    this.isProtocollata = true;
    this.showProtocolloDialog = false;

    this.pratica.parere_municipio = {
      note: this.noteIstruttoreMunicipio
    };

    let objTakeEmails = [
      { group_id: Group.DirettoreMunicipio, municipio_id: this.pratica.dati_istanza.indirizzo_segnale_indicatore.municipio_id }
    ];

    this.utilityService.takeEmails(objTakeEmails).subscribe(
      resp => {
        let emails = resp.data.map(x => x.email);
        let emailsAttori = emails.filter((item, index) => emails.indexOf(item) === index);

        this.passiCarrabiliService.aggiornaPratica(this.pratica).subscribe(
          resp => {
            let cc = this.authService.getEmail();
            let subject = this.utilityService.getSubjectEmail(resp.istanza, 'Comunicazione utilizzo cauzione infruttifera');

            let messaggioCittadino= this.emailService.emailNotificaUtilizzoCauzioneInfruttiferaCittadino(resp.istanza);
            this.emailService.sendEmail(resp.istanza.anagrafica.email, cc, subject, messaggioCittadino, { emailCittadino: true, municipio_id: this.authService.getMunicipio() });

            let messaggioAttori= '';
            if(emailsAttori && emailsAttori.length) {
              messaggioAttori = this.emailService.emailNotificaUtilizzoCauzioneInfruttiferaAttori(resp.istanza);                 
            }
            else {
              this.messageService.showMessage('warn', 'Appovazione pratica', 'Non sono presenti referenti del municipio relativo all\'indirizzo inserito',3000);
            }

            this.emailService.sendEmail(emailsAttori.join(','), cc, subject, messaggioAttori);
            
            this.messageService.showMessage('success', 'Appovazione pratica', 'Approvazione della pratica avvenuta con successo');
            
            this.dataSource = this.dataSource.filter(el => el.id_doc != resp.istanza.id_doc);
            this.dataSource = [...this.dataSource];
            this.showApprovaPraticaDialog = false;
            this.showSpinner = false;
            this.showProtocolloDialog = true;
          },
          err => {
            this.messageService.showMessage('error', 'Errore inserimento determina pratica' , err.error.message);
            this.showApprovaPraticaDialog = false;
            this.showSpinner = false;
            this.showProtocolloDialog = false;
          }
        );
      },
      err => {
        this.messageService.showMessage('error', 'Invio email', err.error.message);
        this.showApprovaPraticaDialog = false;
        this.showSpinner = false;
        this.showProtocolloDialog = false;
      }
    );
  }

  closeApprovaPraticaDialog(){
    this.showApprovaPraticaDialog = false;
    this.noteIstruttoreMunicipio = '';
  }

  //yearRange per p-calendar
  calculateYearDeterminaRange():string {
    let min = new Date().getFullYear()-2;
    let max = new Date().getFullYear()+2;
    return min.toString() + ":" + max.toString();
  }

  resetProtocollo() {
    this.objProtocollo = null;
    this.isProtocollata = false;
    this.base64DocInserimento = '';
  }

}
