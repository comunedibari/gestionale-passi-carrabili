import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { TipologiaPratica } from 'src/app/shared/enums/TipologiaPratica.enum';
import { TableEvent } from '../../shared/table-prime-ng/models/TableEvent';
import { MessageService } from '../../shared/service/message.service';
import { PassiCarrabiliService } from '../../shared/service/passi.carrabili.service';
import { StatoPraticaPassiCarrabili } from 'src/app/shared/enums/StatoPratica.enum';
import { UploadFileComponent } from '../../shared/upload-file/upload-file.component';
import { UtilityService } from '../../shared/service/utility.service';
import { DialogService } from 'primeng/dynamicdialog';
import { Group } from '../../shared/enums/Group.enum';
import { EmailService } from '../../shared/service/email.service';
import { AuthService } from 'src/app/shared/service/auth.service';
import { DettaglioPraticaComponent } from '../dettaglio-pratica/dettaglio-pratica.component';
import { RettificaPraticaComponent } from '../rettifica-pratica/rettifica-pratica.component';
import { TrasferimentoTitolaritaComponent } from '../trasferimento-titolarita/trasferimento-titolarita.component';
import { environment } from '../../../environments/environment';
import { ProtocolloService } from 'src/app/shared/service/protocollo.service';
import { PassaggiStato } from 'src/app/shared/enums/PassaggiStato.enum';
import { map } from 'rxjs/operators';
import { ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-fascicolo-cittadino',
  templateUrl: './fascicolo-cittadino.component.html',
  styleUrls: ['./fascicolo-cittadino.component.css']
})
export class FascicoloCittadinoComponent implements OnInit {

  showProtocolloDialog: boolean = false;
  numProtocollo: string = '';
  isProtocollata: boolean = false;
  actionRiprotocollazione: string = '';
  pratica: any;
  showSpinner: boolean = false;
  dataSource: any[];
  uploadedFiles: any[] = [];
  base64DocInserimento: string = '';
  objProtocollo: any = null;
  dateNow = new Date();

  showNotificaRettificaDialog: boolean = false;
  noteNotificaRettifica: string = '';

  showDichiarazioniModificheStatoLuoghiDialog: boolean = false;
  condizioniTrasferimentoTitolaritaSchema: any[] = [
    {
      label: 'Non sono intercorse modifiche dello stato dei luoghi',
      value: 'no_modifiche_stato_luoghi'
    },
    {
      label: 'Non sono intercorse modifiche nella destinazione d\'uso',
      value: 'no_modifiche_destinazione_uso'
    },
    {
      label: 'Non è tecnicamente possibile procedere alla regolarizzazione del passo carrabile ai sensi dell\'art. 46 D.P.R.495/1992',
      value: 'no_regolarizzazione'
    }
  ];
  selectedCondizioniTrasferimentoTitolarita: any[] = [];

  showDataFineLavoriDialog: boolean = false;
  data_scadenza_fine_lavori: any = null;

  objTakeEmails: any[] = [];
  old_stato_pratica: any;

  statiPratica: any[] = [];
  tipologieProcesso: any[] = [];
  civilarioResults: any[] = [];

  constructor(
    private messageService: MessageService,
    private utilityService: UtilityService,
    public dialogService: DialogService,
    private passiCarrabiliService: PassiCarrabiliService,
    private protocolloService: ProtocolloService,
    private emailService: EmailService,
    public authService: AuthService,
    public confirmationService: ConfirmationService,
    private fb: FormBuilder
  ) { }

  //yearRange per p-calendar
  calculateYearRange(): string {
    let min = new Date().getFullYear() - 100;
    let max = new Date().getFullYear() + 1;
    return min.toString() + ":" + max.toString();
  }

  initSortColumn = 'last_modification.data_operazione';
  directionSortColumn = "-1"; //1=asc  0=rand   -1=desc 
  titleTable: string = 'Lista pratiche cittadino';
  exportName = 'Pratiche Cittadino';
  globalFilters: any[] = [{ value: 'dati_istanza.indirizzo_segnale_indicatore.indirizzo', label: 'Indirizzo' }]

  columnSchema = [
    {
      field: "anagrafica.codice_fiscale",
      header: "Cod. Fiscale/P. IVA",
      type: "text"
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
      field: "dati_istanza.indirizzo_segnale_indicatore.indirizzo",
      header: "Indirizzo",
      type: "text",
      inactive: true
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
      field: "numero_protocollo",
      header: "Num. Protocollo",
      type: "text"
    },
    {
      field: "last_modification.data_operazione",
      header: "Ultima modifica",
      type: "date",
      pipe: "date"
    },
  ];

  actions = [
    {
      key: 'dettaglioPratica',
      icon: "pi pi-search",
      tooltip: 'DETTAGLIO',
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
                || el.dati_istanza.tipologia_processo == TipologiaPratica.Decadenza;
      }
    },
    {
      key: 'inoltraPratica',
      icon: "pi pi-send",
      tooltip: 'INVIA',
      hidden: (el) => {
        return el.stato_pratica != StatoPraticaPassiCarrabili.Bozza 
                || el.dati_istanza.tipologia_processo != TipologiaPratica.Decadenza
                || (this.authService.getGroup() != Group.IstruttoreMunicipio
                    && this.authService.getGroup() != Group.DirettoreMunicipio
                    && this.authService.getGroup() != Group.PoliziaLocale
                    );
      }
    },
    {
      key: 'inoltraPraticaSenzaDocumenti',
      icon: "pi pi-send",
      tooltip: 'INVIA',
      hidden: (el) => {
        return el.stato_pratica != StatoPraticaPassiCarrabili.Bozza 
                || el.dati_istanza.tipologia_processo != TipologiaPratica.Revoca
                || (this.authService.getGroup() != Group.IstruttoreMunicipio
                    && this.authService.getGroup() != Group.DirettoreMunicipio
                    && this.authService.getGroup() != Group.PoliziaLocale
                    );
      }
    },
    {
      key: 'integraPratica',
      icon: "pi pi-paperclip",
      tooltip: 'INTEGRA',
      hidden: (el) => {
        return (el.stato_pratica != StatoPraticaPassiCarrabili['Necessaria integrazione'] 
                  && el.stato_pratica != StatoPraticaPassiCarrabili['Preavviso diniego']) 
                || (this.authService.getGroup() != Group.OperatoreSportello
                    && this.authService.getGroup() != Group.IstruttoreMunicipio);
      }
    },
    {
      key: 'allegaRicevute',
      icon: "pi pi-credit-card",
      tooltip: 'ALLEGA RICEVUTE',
      hidden: (el) => {
        return el.stato_pratica != StatoPraticaPassiCarrabili['Attesa di pagamento'] 
                || (this.authService.getGroup() != Group.OperatoreSportello
                    && this.authService.getGroup() != Group.IstruttoreMunicipio);
      }
    },
    {
      key: 'rettificaPratica',
      icon: "pi pi-pencil",
      tooltip: 'AVVIA RETTIFICA',
      hidden: (el) => {
        return (el.stato_pratica != StatoPraticaPassiCarrabili['Attesa di pagamento'] 
                  && el.stato_pratica != StatoPraticaPassiCarrabili['Necessaria integrazione']
                  && el.stato_pratica != StatoPraticaPassiCarrabili['Pronto al rilascio'] 
                  && el.stato_pratica != StatoPraticaPassiCarrabili['Concessione valida'])  
                || this.authService.getGroup() != Group.IstruttoreMunicipio;
      }
    },
    {
      key: 'notificaRettificaPratica',
      icon: "pi pi-pencil",
      tooltip: 'AVVIA RETTIFICA',
      hidden: (el) => {
        return (el.stato_pratica != StatoPraticaPassiCarrabili['Attesa di pagamento'] 
                  && el.stato_pratica != StatoPraticaPassiCarrabili['Necessaria integrazione']
                  && el.stato_pratica != StatoPraticaPassiCarrabili['Pronto al rilascio'] 
                  && el.stato_pratica != StatoPraticaPassiCarrabili['Concessione valida'])  
                || (this.authService.getGroup() != Group.DirettoreMunicipio 
                    && this.authService.getGroup() != Group.PoliziaLocale
                    && this.authService.getGroup() != Group.UfficioTecnicoDecentrato
                    && this.authService.getGroup() != Group.RipartizioneUrbanistica
                    && this.authService.getGroup() != Group.RipartizioneTributi
                    && this.authService.getGroup() != Group.RipartizioneRagioneria);
      }
    },
    {
      key: 'trasferimentoTitolarita',
      icon: "pi pi-id-card",
      tooltip: 'AVVIA TRASFERIMENTO',
      hidden: (el) => {
        return el.stato_pratica != StatoPraticaPassiCarrabili['Concessione valida']  
                || (this.authService.getGroup() != Group.OperatoreSportello
                    && this.authService.getGroup() != Group.IstruttoreMunicipio);
      }
    },
    {
      key: 'richiestaLavori',
      icon: "pi pi-briefcase",
      tooltip: 'AVVIO LAVORI RICHIESTI',
      hidden: (el) => {
        return el.stato_pratica != StatoPraticaPassiCarrabili['Richiesta lavori']  
                || (this.authService.getGroup() != Group.OperatoreSportello
                    && this.authService.getGroup() != Group.IstruttoreMunicipio);
      }
    },
    {
      key: 'fineLavori',
      icon: "pi pi-briefcase",
      tooltip: 'COMUNICAZIONE FINE LAVORI',
      hidden: (el) => {
        return el.stato_pratica != StatoPraticaPassiCarrabili['Attesa fine lavori']
                || (this.authService.getGroup() != Group.OperatoreSportello
                    && this.authService.getGroup() != Group.IstruttoreMunicipio);
      }
    },
    {
      key: 'eliminaPratica',
      icon: "pi pi-trash",
      tooltip: 'ELIMINA',
      hidden: (el) => {
        return this.authService.getGroup() != Group.Admin
      }
    }
  ];

  fascicoloForm = this.fb.group({
    nome: [''],
    cognome: [''],
    codice_fiscale: [''],
    numero_protocollo: [''],
    id_determina: [''],
    tag_rfid: [''],
    ragione_sociale: [''],
    stato_pratica: [null],
    tipologia_processo: [null],
    indirizzo_segnale_indicatore: [null]
  })

  get formGroupEmpy() {
    return !this.fascicoloForm.get('nome').value
      && !this.fascicoloForm.get('cognome').value
      && !this.fascicoloForm.get('codice_fiscale').value
      && !this.fascicoloForm.get('numero_protocollo').value
      && !this.fascicoloForm.get('id_determina').value
      && !this.fascicoloForm.get('tag_rfid').value
      && !this.fascicoloForm.get('ragione_sociale').value
      && (!this.fascicoloForm.get('stato_pratica').value && this.fascicoloForm.get('stato_pratica').value != 0)
      && !this.fascicoloForm.get('tipologia_processo').value
      && !this.fascicoloForm.get('indirizzo_segnale_indicatore').value
      ? true : false;
  }

  checkSelectedIndirizzo(){
    if(this.fascicoloForm.get('indirizzo_segnale_indicatore').value && typeof this.fascicoloForm.get('indirizzo_segnale_indicatore').value == 'string'){
      this.fascicoloForm.get('indirizzo_segnale_indicatore').patchValue(null);
    }
  }

  ngOnInit(): void {
    this.statiPratica = [{ label: StatoPraticaPassiCarrabili[0], value: 0 }];
    this.tipologieProcesso = [];
    
    let indexesStatiPratica: any[] = this.getIdOfEnums(StatoPraticaPassiCarrabili);
    let indexesTipologieProcesso: any[] = this.getIdOfEnums(TipologiaPratica);

    indexesStatiPratica.forEach(x => {
      let id = parseInt(x);
      this.statiPratica.push({ label: StatoPraticaPassiCarrabili[id], value: id });
    });

    indexesTipologieProcesso.forEach(x => {
      let id = parseInt(x);
      this.tipologieProcesso.push({ label: TipologiaPratica[id], value: id });
    });
  }

  getIdOfEnums(Enum) {
    return Object.keys(Enum).filter(x => {
      let el = parseInt(x, 10);
      if(!isNaN(el))
        return el;
      }
    );
  }

  clearFilter(tipologia){
    this.fascicoloForm.get(tipologia).patchValue(null);
  }

  searchCivilario(event) {
    return this.utilityService.civico(event.query, this.authService.getMunicipio())
      .pipe(map(response => response))
      .toPromise()
      .then(data => {
        if(data?.length) {
          this.civilarioResults = data.map(
            dato => {
              return {
                indirizzo: this.addressListFormatter(dato),
                location: { lat: dato.lat, lon: dato.lon },
                municipio_id: dato.municipio ? parseInt(dato.municipio.replace(/\D/g, '')) : null,
                localita: dato.localita
              }
            });
        }      
        else {
          this.civilarioResults = [];
          if(data == undefined)
            this.messageService.showMessage('error', 'Ricerca indirizzo', 'Errore di sistema durante la ricerca dell\'indirizzo. Riprovare più tardi');
          else
            this.messageService.showMessage('warn', 'Ricerca indirizzo', 'Indirizzo non presente nel municipio di appartenenza. Rivolgersi alla toponomastica per il censimento');
        }          
      });
  }

  addressListFormatter(data: any) {
    return data ? (data.nome_via || '--') + ', ' + (data.numero || '--') + (data.esponente ? `/${data.esponente}` : '') + ' (' + data.municipio + ')' + (data.localita ? ` - ${data.localita}` : '') : '';
  }

  cercaPratiche() {
    this.showSpinner = true;
    this.passiCarrabiliService.praticheCittadino(this.fascicoloForm.value).subscribe(
      data => {
        this.showSpinner = false;
        this.dataSource = data.data;
      },
      err => {
        this.dataSource = [];
        this.showSpinner = false;    
        this.messageService.showMessage('error', 'Ricerca pratiche', 'Errore durante il ritrovamento delle pratiche');
      }
    );
  }

  onTableEvent(tableEvent: TableEvent) {
    this[tableEvent.actionKey](tableEvent.data);
  }

  dettaglioPratica(element: any) {
    this.dialogService.open(DettaglioPraticaComponent, this.utilityService.configDynamicDialogFullScreen(element, "Pratica cittadino"));
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
      this.objTakeEmails = [
        { group_id: Group.DirettoreMunicipio, municipio_id: this.pratica.dati_istanza.indirizzo_segnale_indicatore.municipio_id },
        { group_id: Group.IstruttoreMunicipio, municipio_id: this.pratica.dati_istanza.indirizzo_segnale_indicatore.municipio_id }
      ];

      let callProtocollo: Promise<any> = environment.production ? 
                                ( this.pratica.dati_istanza.tipologia_processo == TipologiaPratica.Revoca 
                                  || this.pratica.dati_istanza.tipologia_processo == TipologiaPratica.Decadenza
                                    ? this.protocolloService.richiestaProtocolloUscitaNewSync(this.objProtocollo, this.objTakeEmails, false, this.base64DocInserimento, convertedUploadedFiles) 
                                    : this.protocolloService.richiestaProtocolloEntrataNewSync(this.objProtocollo, this.base64DocInserimento, convertedUploadedFiles)
                                )
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

  inserimentoPratica(element: any) {
    //aggiunta campo numero_protocollo e inserimento pratica
    element.numero_protocollo = this.numProtocollo;
    element.numero_protocollo_comunicazione = this.numProtocollo;
    this.isProtocollata = true;
    this.showProtocolloDialog = false;

    let emailsMunicipio = [];

    this.utilityService.takeEmails(this.objTakeEmails).subscribe(
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
              this.messageService.showMessage('warn', 'Inserisci pratica', 'Non sono presenti referenti del municipio relativo all\'indirizzo inserito');
            }

            this.messageService.showMessage('success', 'Inserisci pratica', 'La pratica è stata inoltrata al municipio di appartenenza');

            // this.dataSource = this.dataSource.filter(el => el.id_doc != resp.istanza.id_doc);
            // this.dataSource.push(resp.istanza);
            // this.dataSource = [...this.dataSource];
            // this.showSpinner = false;         
            setTimeout(() => { 
              this.cercaPratiche();
              this.showProtocolloDialog = true;
            }, 1000);          
          },
          err => {
            this.messageService.showMessage('error', 'Inserisci pratica', err.error.message);
            this.showSpinner = false;
            this.showProtocolloDialog = false;
          }
        );
      },
      err => {
        this.messageService.showMessage('error', 'Invio email', err.error.message);
        this.showSpinner = false;
        this.showProtocolloDialog = false;
      }
    );
  }

  closeProtocolloDialog(event?) {
    this.showProtocolloDialog = false;
    this.numProtocollo = '';
    this.actionRiprotocollazione = '';
  }

  integraPratica(istanza: any) {
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
        this.integrazionePraticaGetProtocollo(istanza);
      }
    });
  }

  async integrazionePraticaGetProtocollo(istanza){
    this.showSpinner = true;
    this.old_stato_pratica = istanza.stato_pratica;

    if(!this.objProtocollo) {
      istanza.stato_pratica = StatoPraticaPassiCarrabili['Verifica formale'];
      istanza.info_passaggio_stato = this.old_stato_pratica == StatoPraticaPassiCarrabili['Necessaria integrazione'] ? PassaggiStato.NecessariaIntegrazioneToVerificaFormale : PassaggiStato.PreavvisoDiniegoToVerificaFormale;
      this.objProtocollo = this.utilityService.getObjForPdfProtocollo(istanza, this.uploadedFiles, istanza.info_passaggio_stato);
      let data = await this.utilityService.generaPdfPerProtocolloSync(this.objProtocollo, "templateProtocolloPratica").catch(err => {
        this.actionRiprotocollazione = 'integrazionePraticaGetProtocollo';
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
          this.actionRiprotocollazione = 'integrazionePraticaGetProtocollo';
          this.messageService.showMessage('warn', 'Numero protocollo', 'Servizio di protocollo non disponibile. Riprovare più tardi.');
        });
    }

    this.numProtocollo = `${respProtocollo?.numeroProtocollo || '--'}|${respProtocollo?.anno || '--'}`;
    //associazione numero di protocollo ai documenti allegati
    if(this.uploadedFiles && this.uploadedFiles.length && this.numProtocollo != '--|--') {
      this.associaProtocolloADocumento();
    }

    if(this.numProtocollo && this.numProtocollo != '--|--')
      this.integrazionePratica(this.pratica);
    else {
      this.showSpinner = false;
      this.showProtocolloDialog = true;
    }
  }

  integrazionePratica(istanza) {
    //preparazione aggiornamento dati istanza
    istanza.numero_protocollo_comunicazione = this.numProtocollo;
    this.isProtocollata = true;
    this.showProtocolloDialog = false;
 
    //controllo diniego - necessaria integrazione
    switch (this.old_stato_pratica) {
      case StatoPraticaPassiCarrabili['Necessaria integrazione']:
        delete istanza.data_scadenza_integrazione;
        break;

      case StatoPraticaPassiCarrabili['Preavviso diniego']:
        delete istanza.data_scadenza_diniego;
        break;
    }
    
    if(istanza.dati_istanza.tipologia_processo == TipologiaPratica.Revoca)
      delete istanza.parere_municipio.note;
    else
      delete istanza.parere_municipio;

    let giorniTrascorsiPerIntegrazione = this.utilityService.getGiorniPassatiPerIntegrazione(istanza.last_modification.data_operazione);
    istanza.data_scadenza_procedimento = this.utilityService.getDataScadenzaPratica(istanza.data_scadenza_procedimento, giorniTrascorsiPerIntegrazione);

    let emailsMunicipio = [];
    let objTakeEmails = [
      { group_id: Group.DirettoreMunicipio, municipio_id: istanza.dati_istanza.indirizzo_segnale_indicatore.municipio_id }
    ];

    if(this.authService.getGroup() != Group.IstruttoreMunicipio)
			objTakeEmails.push({ group_id: Group.IstruttoreMunicipio, municipio_id: istanza.dati_istanza.indirizzo_segnale_indicatore.municipio_id });

    this.utilityService.takeEmails(objTakeEmails).subscribe(
      resp => {
        let emails = resp.data.map(x => x.email);
        emailsMunicipio = emails.filter((item, index) => emails.indexOf(item) === index);

        this.passiCarrabiliService.aggiornaPratica(istanza, this.old_stato_pratica).subscribe(
          resp => {
            let subject = this.utilityService.getSubjectEmail(resp.istanza, 'Comunicazione integrazione pratica');
            let cc = this.authService.getEmail();

            //invio mail cittadino  
            let messaggioCittadino = this.emailService.emailReInvioPraticaCittadino(resp.istanza);
            this.emailService.sendEmail(resp.istanza.anagrafica.email, cc, subject, messaggioCittadino, { emailCittadino: true, municipio_id: this.authService.getMunicipio() });

            //invio mail Municipio
            if (emailsMunicipio && emailsMunicipio.length) {
              let messaggioMunicipio = this.emailService.emailReInvioPraticaMunicipio(resp.istanza);
              this.emailService.sendEmail(emailsMunicipio.join(','), cc, subject, messaggioMunicipio);
            }
            else {
              this.messageService.showMessage('warn', 'Integrazione richiesta', 'Non sono presenti referenti del municipio relativo all\'indirizzo inserito');
            }

            this.messageService.showMessage('success', 'Integrazione richiesta', 'La pratica è stata inoltrata al municipio di appartenenza');

            // this.dataSource = this.dataSource.filter(el => el.id_doc != resp.istanza.id_doc);
            // this.dataSource.push(resp.istanza);
            // this.dataSource = [...this.dataSource];
            // this.showSpinner = false;
            setTimeout(() => { 
              this.cercaPratiche();
              this.showProtocolloDialog = true;
            }, 1000);             
          },
          err => {
            this.messageService.showMessage('error', 'Integrazione richiesta', err.error.message);
            this.showSpinner = false;
            this.showProtocolloDialog = false;
          }
        );
      },
      err => {
        this.messageService.showMessage('error', 'Invio email', err.error.message);
        this.showSpinner = false;
        this.showProtocolloDialog = false;
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

            // this.dataSource = this.dataSource.filter(el => el.id_doc != resp.istanza.id_doc);
            // this.dataSource.push(resp.istanza);
            // this.dataSource = [...this.dataSource];
            // this.showSpinner = false;
            setTimeout(() => { 
              this.cercaPratiche();
              this.showProtocolloDialog = true;
            }, 1000);             
          },
          err => {
            this.messageService.showMessage('error', 'Ricevute allegate', err.error.message);
            this.showSpinner = false;
            this.showProtocolloDialog = false;
          }
        );
      },
      err => {
        this.messageService.showMessage('error', 'Invio email', err.error.message);
        this.showSpinner = false;
        this.showProtocolloDialog = false;
      }
    );
  }

  rettificaPratica(element) {
    if(this.utilityService.checkPraticaPregresso(element)) {
      this.resetProtocollo();
      let dialogRef = this.dialogService.open(RettificaPraticaComponent, this.utilityService.configDynamicDialogFullScreen(element, "Rettifica pratica"));

      dialogRef.onClose.subscribe((istanza) => {
        if (istanza) {
          // this.dataSource = this.dataSource.filter(el => el.id_doc != istanza.id_doc);
          // this.dataSource.push(istanza);
          // this.dataSource = [...this.dataSource];
          setTimeout(() => { 
            this.cercaPratiche();
          }, 1000);  
        }
      });
    }
    else {
      this.messageService.showMessage('warn', 'Rettifica concessione', 'Non è possibile avviare la rettifica della concessione in quanto bisogna prima bonificare la pratica proveniente dallo storico');
    }
  }

  notificaRettificaPratica(element) {
    this.pratica = element;
    this.resetProtocollo();
    this.showNotificaRettificaDialog = true;
  }

  async invioNotificaRettifica(){
    this.showSpinner = true;
    
    if(!this.objProtocollo) { 
      this.pratica.info_passaggio_stato = PassaggiStato.NotificaRettificaPratica;
      this.objProtocollo = this.utilityService.getObjForPdfProtocollo(this.pratica, [], this.pratica.info_passaggio_stato);
      let data: any = await this.utilityService.generaPdfPerProtocolloSync(this.objProtocollo, "templateProtocolloPratica").catch(err => {
        this.actionRiprotocollazione = 'invioNotificaRettifica';
        this.objProtocollo = null;
        this.messageService.showMessage('warn', 'Generazione template', 'Errore durante la generazione del documento principale per il protocollo. Riprovare più tardi.');
      });

      if(data) {
        this.base64DocInserimento = (await this.utilityService.convertFileToBase64(data)).toString();      
      }
    }

    var respProtocollo: any = null;
    if(this.base64DocInserimento) {

      this.objTakeEmails = [
        { group_id: Group.IstruttoreMunicipio, municipio_id: this.pratica.dati_istanza.indirizzo_segnale_indicatore.municipio_id }
      ];

      if(this.authService.getGroup() != Group.DirettoreMunicipio)
        this.objTakeEmails.push({ group_id: Group.DirettoreMunicipio, municipio_id: this.pratica.dati_istanza.indirizzo_segnale_indicatore.municipio_id });
        
      let callProtocollo: Promise<any> = environment.production ? this.protocolloService.richiestaProtocolloUscitaNewSync(this.objProtocollo, this.objTakeEmails, false, this.base64DocInserimento, []) 
                                                                : this.passiCarrabiliService.getNumeroProtocolloSync(null);

      respProtocollo = await callProtocollo.catch(err => {
          this.actionRiprotocollazione = 'invioNotificaRettifica';
          this.messageService.showMessage('warn', 'Numero protocollo', 'Servizio di protocollo non disponibile. Riprovare più tardi.');
        });
    }

    this.numProtocollo = `${respProtocollo?.numeroProtocollo || '--'}|${respProtocollo?.anno || '--'}`;

    if(this.numProtocollo && this.numProtocollo != '--|--')
      this.invioNotificaRettificaPratica(this.pratica);
    else {
      this.showSpinner = false;
      this.showProtocolloDialog = true;
    }
  }

  invioNotificaRettificaPratica(element){
    this.pratica.numero_protocollo_comunicazione = this.numProtocollo;
    this.isProtocollata = true;
    this.showProtocolloDialog = false;

    this.pratica.informazioni_rettifica = {
      note: this.noteNotificaRettifica
    };

    this.utilityService.takeEmails(this.objTakeEmails).subscribe( 
      resp => {
        let emails = resp.data.map(x => x.email);
        let emailMunicipio = emails.filter((item, index) => emails.indexOf(item) === index);

        this.passiCarrabiliService.aggiornaPratica(this.pratica).subscribe( 
          resp => {   
            let subject = this.utilityService.getSubjectEmail(resp.istanza, 'Comunicazione di necessaria rettifica pratica');
            let cc = this.authService.getEmail();
            
            if(emailMunicipio && emailMunicipio.length) {
              let messaggioMunicipio = this.emailService.emailNotificaRettificaPraticaIstruttore(resp.istanza);            
              this.emailService.sendEmail(emailMunicipio.join(','), cc, subject, messaggioMunicipio);     
            }
            else {
              this.messageService.showMessage('warn', 'Comunicazione rettifica pratica', 'Non sono presenti referenti del municipio relativo all\'indirizzo inserito',3000);
            }

            // this.dataSource = this.dataSource.filter(el => el.id_doc != resp.istanza.id_doc);
            // this.dataSource.push(resp.istanza);
            // this.dataSource = [...this.dataSource];
            // this.showSpinner = false;
            setTimeout(() => { 
              this.cercaPratiche();
              this.showNotificaRettificaDialog = false;
              this.messageService.showMessage('success', 'Comunicazione rettifica pratica', 'Comunicazione di rettifica pratica inviata');          
              this.showProtocolloDialog = true;
            }, 1000);        
          },
          err => {
            this.messageService.showMessage('error', 'Comunicazione rettifica pratica', err.error.message);
            this.showProtocolloDialog = false;
            this.showSpinner = false;
            this.showNotificaRettificaDialog = false;
          }
        );           
      },
      err => {
        this.messageService.showMessage('error', 'Invio email', err.error.message);
        this.showProtocolloDialog = false;
        this.showSpinner = false;
        this.showNotificaRettificaDialog = false;
      }
    );
  }

  closeNotificaRettificaDialog(){
    this.showNotificaRettificaDialog = false;
    this.noteNotificaRettifica = '';
  }

  async trasferimentoTitolarita(element) {
    this.pratica = element;
    
    if(this.utilityService.checkPraticaPregresso(this.pratica)) {
      this.resetProtocollo();
      if(this.utilityService.checkDataAvvioProcesso(this.pratica.dati_istanza.data_scadenza_concessione, 90)) {    
        var resp = await this.passiCarrabiliService.checkAvvioProcessiPostConcessioneMultipli(element).catch(err => {
          this.showSpinner = false;
          this.messageService.showMessage('warn', 'Avvio processo post concessione', err.error.message || err.message);
        });
        
        if(resp) 
          this.showDichiarazioniModificheStatoLuoghiDialog = true;
      }
      else {
        this.messageService.showMessage('warn', 'Trasferimento titolarità', 'Non è più possibile avviare un trasferimento di titolarità in quanto mancano meno di 90 giorni dalla data di scadenza della concessione');
      }
    }
    else {
      this.messageService.showMessage('warn', 'Trasferimento titolarità', 'Non è possibile avviare il trasferimento di titolarità della concessione in quanto bisogna prima bonificare la pratica proveniente dallo storico');
    }
  }

  closeDichiarazioniModificheStatoLuoghiDialog(){
    this.showDichiarazioniModificheStatoLuoghiDialog = false;
    this.selectedCondizioniTrasferimentoTitolarita = [];
  }

  avviaTrasferimentoTitolarita(element){
    let dichiarazioni_modifiche_luoghi = {
      no_modifiche_stato_luoghi: this.selectedCondizioniTrasferimentoTitolarita.indexOf('no_modifiche_stato_luoghi') > -1,
      no_modifiche_destinazione_uso: this.selectedCondizioniTrasferimentoTitolarita.indexOf('no_modifiche_destinazione_uso') > -1,
      no_regolarizzazione: this.selectedCondizioniTrasferimentoTitolarita.indexOf('no_regolarizzazione') > -1
    }
    element.dichiarazioni_modifiche_luoghi = dichiarazioni_modifiche_luoghi;

    this.closeDichiarazioniModificheStatoLuoghiDialog();
    let dialogRef = this.dialogService.open(TrasferimentoTitolaritaComponent, this.utilityService.configDynamicDialogFullScreen(element, "Trasferimento Titolarità"));

    dialogRef.onClose.subscribe((istanza) => {
      if (istanza) {
        // this.dataSource = this.dataSource.filter(el => el.id_doc != istanza.id_doc);
        // this.dataSource.push(istanza);
        // this.dataSource = [...this.dataSource];
        setTimeout(() => { 
          this.cercaPratiche();
        }, 1000);  
      }
    });

  }

  richiestaLavori(istanza: any) {
    this.pratica = istanza;
    this.resetProtocollo();
    this.showDataFineLavoriDialog = true;
  }

  uploadDocumentazioneRichiestaLavori(istanza){
    istanza.data_scadenza_fine_lavori = this.data_scadenza_fine_lavori;
    this.showDataFineLavoriDialog = false;

    let data = {
      pratica: istanza,
      mode: 'multiple'
    }

    this.uploadedFiles = [];
    this.resetProtocollo();
    let dialogRef = this.dialogService.open(UploadFileComponent, this.utilityService.configDynamicDialogFullScreen(data, "Allega documentazione inizio lavori"));

    dialogRef.onClose.subscribe((uploadedFiles) => {
      if (uploadedFiles) {
        this.uploadedFiles = uploadedFiles.filter(doc => !doc.numero_protocollo || doc.numero_protocollo == '--|--');
        this.avviaLavoriRichiestiGetProtocollo(istanza);
      }
    });
  }

  async avviaLavoriRichiestiGetProtocollo(istanza){
    this.showSpinner = true;
    this.old_stato_pratica = istanza.stato_pratica;

    if(!this.objProtocollo) {
      istanza.stato_pratica = StatoPraticaPassiCarrabili['Verifica formale'];
      istanza.info_passaggio_stato = PassaggiStato.RichiestaLavoriToVerificaFormale;
      this.objProtocollo = this.utilityService.getObjForPdfProtocollo(istanza, this.uploadedFiles, istanza.info_passaggio_stato);
      let data: any = await this.utilityService.generaPdfPerProtocolloSync(this.objProtocollo, "templateProtocolloPratica").catch(err => {
        this.actionRiprotocollazione = 'avviaLavoriRichiestiGetProtocollo';
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
          this.actionRiprotocollazione = 'avviaLavoriRichiestiGetProtocollo';
          this.messageService.showMessage('warn', 'Numero protocollo', 'Servizio di protocollo non disponibile. Riprovare più tardi.');
        });
    }

    this.numProtocollo = `${respProtocollo?.numeroProtocollo || '--'}|${respProtocollo?.anno || '--'}`;

    //associazione numero di protocollo ai documenti allegati
    if(this.uploadedFiles && this.uploadedFiles.length && this.numProtocollo != '--|--') {
      this.associaProtocolloADocumento();
    }

    if(this.numProtocollo && this.numProtocollo != '--|--')
      this.avviaLavoriRichiesti(this.pratica);
    else {
      this.showSpinner = false;
      this.showProtocolloDialog = true;
    }
  }

  avviaLavoriRichiesti(istanza) {
    istanza.numero_protocollo_comunicazione = this.numProtocollo;
    this.isProtocollata = true;
    this.showProtocolloDialog = false;

    delete istanza.data_scadenza_inizio_lavori;

    let emailsMunicipio = [];
    let objTakeEmails = [
      { group_id: Group.DirettoreMunicipio, municipio_id: istanza.dati_istanza.indirizzo_segnale_indicatore.municipio_id }
    ];

    if(this.authService.getGroup() != Group.IstruttoreMunicipio)
			objTakeEmails.push({ group_id: Group.IstruttoreMunicipio, municipio_id: istanza.dati_istanza.indirizzo_segnale_indicatore.municipio_id });

    this.utilityService.takeEmails(objTakeEmails).subscribe(
      resp => {
        let emails = resp.data.map(x => x.email);
        emailsMunicipio = emails.filter((item, index) => emails.indexOf(item) === index);

        this.passiCarrabiliService.aggiornaPratica(istanza, this.old_stato_pratica).subscribe(
          resp => {
            let subject = this.utilityService.getSubjectEmail(resp.istanza, 'Comunicazione avvio inizio lavori');
            let cc = this.authService.getEmail();

            //invio mail cittadino  
            let messaggioCittadino = this.emailService.emailDichiarazioneInizioLavoriCittadino(resp.istanza);
            this.emailService.sendEmail(resp.istanza.anagrafica.email, cc, subject, messaggioCittadino, { emailCittadino: true, municipio_id: this.authService.getMunicipio() });

            //invio mail Municipio
            if (emailsMunicipio && emailsMunicipio.length) {
              let messaggioMunicipio = this.emailService.emailDichiarazioneInizioLavoriMunicipio(resp.istanza);
              this.emailService.sendEmail(emailsMunicipio.join(','), cc, subject, messaggioMunicipio);
            }
            else {
              this.messageService.showMessage('warn', 'Dichiarazione inizio lavori', 'Non sono presenti referenti del municipio relativo all\'indirizzo inserito');
            }

            this.messageService.showMessage('success', 'Dichiarazione inizio lavori', 'La pratica è stata inoltrata al municipio di appartenenza');

            // this.dataSource = this.dataSource.filter(el => el.id_doc != resp.istanza.id_doc);
            // this.dataSource.push(resp.istanza);
            // this.dataSource = [...this.dataSource];
            // this.showSpinner = false;
            setTimeout(() => { 
              this.cercaPratiche();
              this.showProtocolloDialog = true;
            }, 1000);       
          },
          err => {
            this.messageService.showMessage('error', 'Dichiarazione inizio lavori', err.error.message);
            this.showSpinner = false;
            this.showProtocolloDialog = false;
          }
        );
      },
      err => {
        this.messageService.showMessage('error', 'Invio email', err.error.message);
        this.showSpinner = false;
        this.showProtocolloDialog = false;
      }
    );
  }

  closeDataFineLavoriDialog() {
    this.showDataFineLavoriDialog = false;
    this.data_scadenza_fine_lavori = null;
  }

  fineLavori(istanza: any){
    let data = {
      pratica: istanza,
      mode: 'multiple'
    }

    this.uploadedFiles = [];
    this.resetProtocollo();
    let dialogRef = this.dialogService.open(UploadFileComponent, this.utilityService.configDynamicDialogFullScreen(data, "Allega documentazione fine lavori"));

    dialogRef.onClose.subscribe((uploadedFiles) => {
      if (uploadedFiles) {
        this.uploadedFiles = uploadedFiles.filter(doc => !doc.numero_protocollo || doc.numero_protocollo == '--|--');
        this.dichiarazioneFineLavoriGetProtocollo(istanza);
      }
    });
  }

  async dichiarazioneFineLavoriGetProtocollo(istanza){
    this.showSpinner = true;
    this.old_stato_pratica = istanza.stato_pratica;

    if(!this.objProtocollo) {
      istanza.stato_pratica = StatoPraticaPassiCarrabili['Verifica formale'];
      istanza.info_passaggio_stato = PassaggiStato.AttesaFineLavoriToVerificaFormale;
      this.objProtocollo = this.utilityService.getObjForPdfProtocollo(istanza, this.uploadedFiles, istanza.info_passaggio_stato);
      let data: any = await this.utilityService.generaPdfPerProtocolloSync(this.objProtocollo, "templateProtocolloPratica").catch(err => {
        this.actionRiprotocollazione = 'dichiarazioneFineLavoriGetProtocollo';
        this.objProtocollo = null;
        this.messageService.showMessage('error', 'Generazione template', 'Errore durante la generazione del template. Verrà protocollato il json della pratica.');
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
          this.actionRiprotocollazione = 'dichiarazioneFineLavoriGetProtocollo';
          this.messageService.showMessage('warn', 'Numero protocollo', 'Servizio di protocollo non disponibile. Riprovare più tardi.');
        });
    }

    this.numProtocollo = `${respProtocollo?.numeroProtocollo || '--'}|${respProtocollo?.anno || '--'}`;

    //associazione numero di protocollo ai documenti allegati
    if(this.uploadedFiles && this.uploadedFiles.length && this.numProtocollo != '--|--') {
      this.associaProtocolloADocumento();
    }

    if(this.numProtocollo && this.numProtocollo != '--|--')
      this.dichiarazioneFineLavori(this.pratica);
    else {
      this.showSpinner = false;
      this.showProtocolloDialog = true;
    }
  }

  dichiarazioneFineLavori(istanza) {
    istanza.numero_protocollo_comunicazione = this.numProtocollo;
    this.isProtocollata = true;
    this.showProtocolloDialog = false;

    delete istanza.data_scadenza_fine_lavori;

    let emailsMunicipio = [];
    let objTakeEmails = [
      { group_id: Group.DirettoreMunicipio, municipio_id: istanza.dati_istanza.indirizzo_segnale_indicatore.municipio_id }
    ];

    if(this.authService.getGroup() != Group.IstruttoreMunicipio)
			objTakeEmails.push({ group_id: Group.IstruttoreMunicipio, municipio_id: istanza.dati_istanza.indirizzo_segnale_indicatore.municipio_id });

    this.utilityService.takeEmails(objTakeEmails).subscribe(
      resp => {
        let emails = resp.data.map(x => x.email);
        emailsMunicipio = emails.filter((item, index) => emails.indexOf(item) === index);

        this.passiCarrabiliService.aggiornaPratica(istanza, this.old_stato_pratica).subscribe(
          resp => {
            let subject = this.utilityService.getSubjectEmail(resp.istanza, 'Comunicazione fine lavori');
            let cc = this.authService.getEmail();

            //invio mail cittadino  
            let messaggioCittadino = this.emailService.emailDichiarazioneFineLavoriCittadino(resp.istanza);
            this.emailService.sendEmail(resp.istanza.anagrafica.email, cc, subject, messaggioCittadino, { emailCittadino: true, municipio_id: this.authService.getMunicipio() });

            //invio mail Municipio
            if (emailsMunicipio && emailsMunicipio.length) {
              let messaggioMunicipio = this.emailService.emailDichiarazioneFineLavoriMunicipio(resp.istanza);
              this.emailService.sendEmail(emailsMunicipio.join(','), cc, subject, messaggioMunicipio);
            }
            else {
              this.messageService.showMessage('warn', 'Dichiarazione fine lavori', 'Non sono presenti referenti del municipio relativo all\'indirizzo inserito');
            }

            this.messageService.showMessage('success', 'Dichiarazione fine lavori', 'La pratica è stata inoltrata al municipio di appartenenza');

            // this.dataSource = this.dataSource.filter(el => el.id_doc != resp.istanza.id_doc);
            // this.dataSource.push(resp.istanza);
            // this.dataSource = [...this.dataSource];
            // this.showSpinner = false;
            setTimeout(() => { 
              this.cercaPratiche();
              this.showProtocolloDialog = true;
            }, 1000);           
          },
          err => {
            this.messageService.showMessage('error', 'Dichiarazione fine lavori', err.error.message);
            this.showSpinner = false;
            this.showProtocolloDialog = false;
          }
        );
      },
      err => {
        this.messageService.showMessage('error', 'Invio email', err.error.message);
        this.showSpinner = false;
        this.showProtocolloDialog = false;
      }
    );
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

  resetProtocollo() {
    this.objProtocollo = null;
    this.isProtocollata = false;
    this.base64DocInserimento = '';
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

}
