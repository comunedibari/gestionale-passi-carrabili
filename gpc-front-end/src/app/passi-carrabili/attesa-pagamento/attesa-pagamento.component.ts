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
import { UploadFileComponent } from 'src/app/shared/upload-file/upload-file.component';
import { CreazioneDovutoComponent } from '../creazione-dovuto/creazione-dovuto.component';
import { PagamentiService } from 'src/app/shared/service/pagamenti.service';
import { environment } from '../../../environments/environment';
import { ProtocolloService } from 'src/app/shared/service/protocollo.service';
import { PassaggiStato } from 'src/app/shared/enums/PassaggiStato.enum';

@Component({
  selector: 'app-attesa-pagamento',
  templateUrl: './attesa-pagamento.component.html',
  styleUrls: ['./attesa-pagamento.component.css']
})
export class AttesaPagamentoComponent implements OnInit {

  constructor(
    private passiCarrabiliService: PassiCarrabiliService,
    private messageService: MessageService,
    public authService: AuthService,
    public dialogService: DialogService,
    private utilityService: UtilityService,
    public confirmationService: ConfirmationService,
    private emailService: EmailService,
    private pagamentiService: PagamentiService,
    private protocolloService: ProtocolloService
  ) { }

  showSpinner: boolean = false;
  dataSource: any[];
  uploadedFiles: any[] = [];
  pratica: any;
  showProtocolloDialog: boolean = false;
  numProtocollo: string = '';
  isProtocollata: boolean = false;
  actionRiprotocollazione: string = '';
  old_stato_pratica: null;
  base64DocInserimento: string = '';
  objProtocollo: any = null;

  initSortColumn = 'last_modification.data_operazione';
  directionSortColumn = "1"; //1=asc  0=rand   -1=desc 
  titleTable: string = 'Pratiche in attesa di pagamento';
  exportName = 'Pratiche in attesa di pagamento'; 
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
    // {
    //   key: 'creaDovuto',
    //   icon: "pi pi-euro",
    //   tooltip: 'CREA DOVUTO',
    //   hidden: (el) => {
    //     return el.stato_pratica != StatoPraticaPassiCarrabili['Attesa di pagamento']
    //       || (el.dovuto?.iuv && el.dovuto?.iud);
    //   }
    // },
    // {
    //   key: 'downloadAtteso',
    //   icon: "pi pi-download",
    //   tooltip: 'DOWNLOAD AVVISO',
    //   hidden: (el) => {
    //     return el.stato_pratica != StatoPraticaPassiCarrabili['Attesa di pagamento'] 
    //           || !el.dovuto?.iud
    //           || (this.authService.getGroup() != Group.OperatoreSportello
    //               && this.authService.getGroup() != Group.IstruttoreMunicipio);
    //   }
    // },
    // {
    //   key: 'downloadRicevute',
    //   icon: "pi pi-wallet",
    //   tooltip: 'DOWNLOAD RICEVUTA',
    //   hidden: (el) => {
    //     return el.stato_pratica != StatoPraticaPassiCarrabili['Attesa di pagamento'] 
    //           || !el.dovuto?.iuv
    //           || (this.authService.getGroup() != Group.OperatoreSportello
    //               && this.authService.getGroup() != Group.IstruttoreMunicipio);
    //   }
    // },
    {
      key: 'allegaRicevute',
      icon: "pi pi-credit-card",
      tooltip: 'ALLEGA RICEVUTE',
      hidden: (el) => {
        return el.stato_pratica != StatoPraticaPassiCarrabili['Attesa di pagamento'] 
                || (this.authService.getGroup() != Group.OperatoreSportello
                    && this.authService.getGroup() != Group.IstruttoreMunicipio);
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

    // let statiPratiche = [
    //   StatoPraticaPassiCarrabili['Attesa di pagamento'], 
    //   StatoPraticaPassiCarrabili['Richiesta lavori'], 
    //   StatoPraticaPassiCarrabili['Attesa fine lavori'], 
    //   StatoPraticaPassiCarrabili['Necessaria integrazione'], 
    //   StatoPraticaPassiCarrabili['Preavviso diniego']
    // ];

    this.passiCarrabiliService.cercaPratichePerStatoPratica(StatoPraticaPassiCarrabili['Attesa di pagamento'], this.authService.getMunicipio()).subscribe(
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

  downloadAtteso(istanza: any) {  
    this.pratica = istanza;
    this.showSpinner = true;
    this.pagamentiService.login().subscribe(
      resp_login => {
        let xauth = resp_login.headers.get('X-Auth');
        this.pagamentiService.getDovuto(xauth, 'pdf', istanza.dovuto.iud).subscribe(
          async (file) => {
            this.showSpinner = false;             
            let tipologiaDocumento = { id: 'atteso_pagamento', label: 'Avviso di pagamento', description: 'Avviso di pagamento', disabled: false, opzionale: true };
            await this.uploadAutomaticoDocumento(file, `${istanza.dovuto.iud}.pdf`, tipologiaDocumento);
            // saveAs(file, `${istanza.dovuto.iud}.pdf`);
          },
          err => {
            this.showSpinner = false;
            if(err.status == 404)
              this.messageService.showMessage('warn', 'Download avviso' , 'Nessun avviso di pagamento trovato'); 
            else
              this.messageService.showMessage('error', 'Download avviso' , 'Errore durante il download dell\'avviso di pagamento');     
          }
        );
      },
      err => {
        this.showSpinner = false;
        this.messageService.showMessage('error', 'Download avviso' , 'Errore durante il download dell\'avviso di pagamento');      
      }
    ); 
  }

  downloadRicevute(istanza: any) {  
    this.pratica = istanza;
    this.showSpinner = true;
    this.pagamentiService.login().subscribe(
      resp_login => {
        let xauth = resp_login.headers.get('X-Auth');
        this.pagamentiService.getPagamento(xauth, 'pdf', istanza.dovuto.iuv).subscribe(
          async (file) => {
            this.showSpinner = false;             
            let tipologiaDocumento = { id: 'ricevuta_tributi', label: 'Ricevuta tributi', description: 'Ricevuta di pagamento dei tributi', disabled: false, opzionale: false };
            await this.uploadAutomaticoDocumento(file, `${istanza.dovuto.iuv}.pdf`, tipologiaDocumento);         
            // saveAs(file, `${istanza.dovuto.iuv}.pdf`);
          },
          err => {
            this.showSpinner = false;
            if(err.status == 404)
              this.messageService.showMessage('warn', 'Download ricevuta' , 'Nessun pagamento trovato'); 
            else
              this.messageService.showMessage('error', 'Download ricevuta' , 'Errore durante il download della ricevuta di pagamento');     
          }
        );
      },
      err => {
        this.showSpinner = false;
        this.messageService.showMessage('error', 'Download ricevuta' , 'Errore durante il download della ricevuta di pagamento');      
      }
    ); 
  }

  allegaRicevute(istanza: any) {
    let data = {
      pratica: istanza,
      mode: 'multiple'
    }

    this.uploadedFiles = [];
    this.resetProtocollo();
    let dialogRef = this.dialogService.open(UploadFileComponent, this.utilityService.configDynamicDialogFullScreen(data, "Allega ricevuta di pagamento dei tributi"));

    dialogRef.onClose.subscribe((uploadedFiles) => {
      if (uploadedFiles) {
        this.uploadedFiles = uploadedFiles.filter(doc => !doc.numero_protocollo || doc.numero_protocollo == '--|--');
        this.allegamentoRicevutePagamentoAllaPraticaGetProtocollo(istanza);
      }
    });
  }

  async allegamentoRicevutePagamentoAllaPraticaGetProtocollo(istanza){
    this.showSpinner = true;
    this.pratica = istanza;

    if(!this.objProtocollo) { 
      this.old_stato_pratica = this.pratica.stato_pratica;
      this.pratica.stato_pratica = StatoPraticaPassiCarrabili['Pronto al rilascio']; 
      this.pratica.info_passaggio_stato = PassaggiStato.AttesaDiPagamentoToProntoAlRilascio;
      this.objProtocollo = this.utilityService.getObjForPdfProtocollo(this.pratica, this.uploadedFiles, this.pratica.info_passaggio_stato);
      let data: any = await this.utilityService.generaPdfPerProtocolloSync(this.objProtocollo, "templateProtocolloPratica").catch(err => {
        this.actionRiprotocollazione = 'allegamentoRicevutePagamentoAllaPraticaGetProtocollo';
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

      let callProtocollo: Promise<any> = environment.production ? this.protocolloService.richiestaProtocolloUscitaNewSync(this.objProtocollo, [], true, this.base64DocInserimento, convertedUploadedFiles) 
                                                                : this.passiCarrabiliService.getNumeroProtocolloSync(null);

      respProtocollo = await callProtocollo.catch(err => {
          this.actionRiprotocollazione = 'allegamentoRicevutePagamentoAllaPraticaGetProtocollo';
          this.messageService.showMessage('warn', 'Numero protocollo', 'Servizio di protocollo non disponibile. Riprovare più tardi.');
        });
    }

    this.numProtocollo = `${respProtocollo?.numeroProtocollo || '--'}|${respProtocollo?.anno || '--'}`;

    //associazione numero di protocollo ai documenti allegati
    if(this.uploadedFiles && this.uploadedFiles.length && this.numProtocollo != '--|--') {
      this.associaProtocolloADocumento();
    }

    if(this.numProtocollo && this.numProtocollo != '--|--')
      this.allegamentoRicevutePagamentoAllaPratica(this.pratica);
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

  allegamentoRicevutePagamentoAllaPratica(istanza){
    //preparazione aggiornamento dati istanza
    istanza.numero_protocollo_comunicazione = this.numProtocollo; 
    this.isProtocollata = true;
    this.showProtocolloDialog = false;
    delete istanza.data_scadenza_pagamento;

    if(istanza.dati_istanza.tipologia_processo == TipologiaPratica['Trasferimento titolarità'] 
        || istanza.dati_istanza.tipologia_processo == TipologiaPratica['Regolarizzazione furto/deterioramento']) {
      istanza.dati_istanza.data_scadenza_concessione = istanza.dati_istanza.link_pratica_origine.data_scadenza_concessione;
    }
    else {
      if(isNaN(istanza.dati_istanza.anni) || isNaN(istanza.dati_istanza.mesi) || isNaN(istanza.dati_istanza.giorni)){    
        if(istanza.dati_istanza.link_pratica_origine) {
          //processo post concessione
          istanza.dati_istanza.data_scadenza_concessione = this.utilityService.getDataScadenzaPratica(istanza.dati_istanza.link_pratica_origine?.data_scadenza_concessione || undefined, istanza.dati_istanza.durata_giorni_concessione);
          let durataAnniMesiGiorni = this.utilityService.getAnniMesiGiorniConcessione(istanza.dati_istanza.link_pratica_origine?.data_scadenza_concessione, istanza.dati_istanza.data_scadenza_concessione);
          istanza.dati_istanza.anni = durataAnniMesiGiorni.anni;
          istanza.dati_istanza.mesi = durataAnniMesiGiorni.mesi;
          istanza.dati_istanza.giorni = durataAnniMesiGiorni.giorni;

          if(isNaN(istanza.dati_istanza.link_pratica_origine.anni) || isNaN(istanza.dati_istanza.link_pratica_origine.mesi) || isNaN(istanza.dati_istanza.link_pratica_origine.giorni)){
            let durataAnniMesiGiorniOrigine = this.utilityService.getAnniMesiGiorniConcessioneOrigine(istanza.dati_istanza.link_pratica_origine.data_scadenza_concessione, istanza.dati_istanza.link_pratica_origine.durata_giorni_concessione);
            istanza.dati_istanza.link_pratica_origine.anni = durataAnniMesiGiorniOrigine.anni;
            istanza.dati_istanza.link_pratica_origine.mesi = durataAnniMesiGiorniOrigine.mesi;
            istanza.dati_istanza.link_pratica_origine.giorni = durataAnniMesiGiorniOrigine.giorni;
          }         
        }
        else {
          //prima concessione
          istanza.dati_istanza.data_scadenza_concessione = this.utilityService.getDataScadenzaPratica(istanza.determina?.data_emissione || undefined, istanza.dati_istanza.durata_giorni_concessione);
          let durataAnniMesiGiorni = this.utilityService.getAnniMesiGiorniConcessione(istanza.determina?.data_emissione, istanza.dati_istanza.data_scadenza_concessione);
          istanza.dati_istanza.anni = durataAnniMesiGiorni.anni;
          istanza.dati_istanza.mesi = durataAnniMesiGiorni.mesi;
          istanza.dati_istanza.giorni = durataAnniMesiGiorni.giorni;
        }
      }
      else {
        if(istanza.dati_istanza.link_pratica_origine) {
          //processo post concessione
          istanza.dati_istanza.data_scadenza_concessione = this.utilityService.getDataScadenzaConcessione(istanza.dati_istanza.link_pratica_origine?.data_scadenza_concessione, istanza.dati_istanza.anni, istanza.dati_istanza.mesi, istanza.dati_istanza.giorni);
        }
        else {
          //prima concessione
          istanza.dati_istanza.data_scadenza_concessione = this.utilityService.getDataScadenzaConcessione(istanza.determina?.data_emissione, istanza.dati_istanza.anni, istanza.dati_istanza.mesi, istanza.dati_istanza.giorni);
          istanza.dati_istanza.durata_giorni_concessione = this.utilityService.getGiorniConcessione(istanza.determina?.data_emissione, istanza.dati_istanza.data_scadenza_concessione);
        }
      }
    }

    let objTakeEmails = [
      { group_id: Group.DirettoreMunicipio, municipio_id: istanza.dati_istanza.indirizzo_segnale_indicatore.municipio_id }
    ];

    if(this.authService.getGroup() != Group.IstruttoreMunicipio)
      objTakeEmails.push({ group_id: Group.IstruttoreMunicipio, municipio_id: istanza.dati_istanza.indirizzo_segnale_indicatore.municipio_id });

    this.utilityService.takeEmails(objTakeEmails).subscribe(
      resp => {
        let emails = resp.data.map(x => x.email);
        let emailsMunicipio = emails.filter((item, index) => emails.indexOf(item) === index);

        this.passiCarrabiliService.aggiornaPratica(istanza, this.old_stato_pratica).subscribe(
          resp => {
            let subject = this.utilityService.getSubjectEmail(resp.istanza, 'Comunicazione ritiro cartello');
            let cc = this.authService.getEmail();

            //invio mail cittadino  
            let messaggioCittadino = this.emailService.emailNotificaRitiroCartelloCittadino(resp.istanza);
            this.emailService.sendEmail(resp.istanza.anagrafica.email, cc, subject, messaggioCittadino, { emailCittadino: true, municipio_id: this.authService.getMunicipio() });

            //invio mail Municipio
            if (emailsMunicipio && emailsMunicipio.length) {
              let messaggioMunicipio = this.emailService.emailNotificaRitiroCartelloAttori(resp.istanza);
              this.emailService.sendEmail(emailsMunicipio.join(','), cc, subject, messaggioMunicipio);
            }
            else {
              this.messageService.showMessage('warn', 'Ricevute allegate', 'Non sono presenti referenti del municipio relativo all\'indirizzo inserito');
            }

            this.messageService.showMessage('success', 'Ricevute allegate', 'La pratica è conclusa con esito positivo: il segnale indicatore può essere rilasciato');

            this.dataSource = this.dataSource.filter(el => el.id_doc != resp.istanza.id_doc);
            this.dataSource = [...this.dataSource];
            this.showSpinner = false;
            this.showProtocolloDialog = true;
          },
          err => {
            this.messageService.showMessage('error', 'Ricevute allegate', err.error.message);
            this.showSpinner = false;
            this.showProtocolloDialog = true;
          }
        );
      },
      err => {
        this.messageService.showMessage('error', 'Invio email', err.error.message);
        this.showSpinner = false;
        this.showProtocolloDialog = true;
      }
    );
  }

  closeProtocolloDialog(event?) {
    this.showProtocolloDialog = false;
    this.numProtocollo = '';
    this.actionRiprotocollazione = '';
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
            this.dataSource = this.dataSource.filter(el => el.id_doc != resp.istanza.id_doc);
            this.dataSource.push(resp.istanza);
            this.dataSource = [...this.dataSource];
          },
          err => {
            this.showSpinner = false;
            this.messageService.showMessage('error', 'Creazione dovuto' , 'Errore durante l\'associazione del dovuto alla pratica');
          }
        );
      }
    });
  }

  async uploadAutomaticoDocumento(file:any, fileName:any, tipologiaDocumento: any) {
    let revision = 1;
    let base64 = await this.utilityService.convertFileToBase64(file);
    let id = `${this.pratica.id_doc}_${tipologiaDocumento.id}_${revision}`;
    
    let documento = {
      id: id,
      name: fileName,
      mimeType: file.type,
      blob: base64,
      tipologia_documento: tipologiaDocumento,
      rev: revision,      
      id_doc: this.pratica.id_doc,
      numero_protocollo: ''
    };

    await this.passiCarrabiliService.uploadDocumentSync(documento).then(resp => {
      this.messageService.showMessage('success', 'Upload file', tipologiaDocumento.id == 'atteso_pagamento' ? 'L\'avviso di pagamento è stato caricato nell\'area documentale' : 'La ricevta dei tributi è stata caricata nell\'area documentale');
    }).catch(err => {
      this.messageService.showMessage('error', 'Upload file', err.error.message ? err.error.message : err.statusText);
    });     
  }

  resetProtocollo() {
    this.objProtocollo = null;
    this.isProtocollata = false;
    this.base64DocInserimento = '';
  }
}
