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

@Component({
  selector: 'app-validazione-pratica',
  templateUrl: './validazione-pratica.component.html',
  styleUrls: ['./validazione-pratica.component.css']
})
export class ValidazionePraticaComponent implements OnInit {

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
  showPareriDialog: boolean = false;
  showIntegrazioneDialog: boolean = false;
  showValidaPraticaSemplificataDialog: boolean = false;
  showEsenzioneCUPDialog: boolean = false;
  dataSource: any[];
  selectedAttoriPareri: any[] = [];
  pratica: any;
  noteIstruttoreMunicipio: string = '';
  isDiniego: boolean = false;
  isEsente: boolean = false;
  isDichiarazioneBolloEditable: boolean = false;
  motivo_esenzione_cup: string = '';

  doc_richiesta_integrazione_diniego: any = {
    // id: '',
    // data_emissione: '',
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
  titleTable: string = 'Pratiche da validare';
  exportName = 'Pratiche da validare'; 
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
      key: 'esenzioneCUP',
      icon: "pi pi-wallet",
      tooltip: 'ESENZIONE CUP',
      hidden: (el) => {
        return el.dichiarazioni_aggiuntive.flag_esenzione_cup == true 
          || this.authService.getGroup() != Group.IstruttoreMunicipio
          || el.dati_istanza.tipologia_processo == TipologiaPratica.Proroga
          || el.dati_istanza.tipologia_processo == TipologiaPratica['Regolarizzazione furto/deterioramento']
          || el.dati_istanza.tipologia_processo == TipologiaPratica.Decadenza
          || el.dati_istanza.tipologia_processo == TipologiaPratica.Revoca
          || el.dati_istanza.tipologia_processo == TipologiaPratica.Rinuncia
      }
    },
    {
      key: 'validaPraticaDialog',
      icon: "pi pi-check-circle",
      tooltip: 'VALIDA',
      hidden: (el) => {
        let allTrue = null;
        if(el.dati_istanza.tipologia_processo == TipologiaPratica['Trasferimento titolarità']){
          allTrue = this.utilityService.checkDichiarazioniTrasferimentoTitolarita(el);
        }

        return this.authService.getGroup() != Group.IstruttoreMunicipio
            || el.dati_istanza.tipologia_processo == TipologiaPratica.Proroga
            || el.dati_istanza.tipologia_processo == TipologiaPratica['Regolarizzazione furto/deterioramento']
            || el.dati_istanza.tipologia_processo == TipologiaPratica.Decadenza
            || (el.dati_istanza.tipologia_processo == TipologiaPratica['Trasferimento titolarità'] && allTrue == true);
      }
    },
    {
      key: 'validaPraticaSemplificataDialog',
      icon: "pi pi-check-circle",
      tooltip: 'VALIDA',
      hidden: (el) => {
        let allTrue = null;
        if(el.dati_istanza.tipologia_processo == TipologiaPratica['Trasferimento titolarità']){
          allTrue = this.utilityService.checkDichiarazioniTrasferimentoTitolarita(el);
        }

        return this.authService.getGroup() != Group.IstruttoreMunicipio 
            || 
            ( el.dati_istanza.tipologia_processo != TipologiaPratica.Proroga
              && el.dati_istanza.tipologia_processo != TipologiaPratica['Regolarizzazione furto/deterioramento']
              && el.dati_istanza.tipologia_processo != TipologiaPratica.Decadenza
              && ( (el.dati_istanza.tipologia_processo == TipologiaPratica['Trasferimento titolarità'] && allTrue == false) 
                || el.dati_istanza.tipologia_processo != TipologiaPratica['Trasferimento titolarità'] )
              );
      }
    },
  ];

  onTableEvent(tableEvent: TableEvent) {
    this[tableEvent.actionKey](tableEvent.data);
  }

  get isFaseIntegrazioneMassimaRaggiunta(): boolean {
    return this.pratica?.integrazione_counter == this.utilityService.n_integrazioni_massime && this.pratica?.diniego == false;
  }

  get isFaseDiniego(): boolean {
    return this.pratica?.diniego == true;
  }

  get isRinuncia(): boolean {
    return this.pratica?.dati_istanza?.tipologia_processo == TipologiaPratica.Rinuncia ? true : false;
  }

  get isRevoca(): boolean {
    return this.pratica?.dati_istanza?.tipologia_processo == TipologiaPratica.Revoca ? true : false;
  }

  get isDecadenza(): boolean {
    return this.pratica?.dati_istanza?.tipologia_processo == TipologiaPratica.Decadenza ? true : false;
  }

  get isLavoriDaIniziare(): boolean {
    return this.pratica?.inizio_lavori == false ? true : false;
  }

  get isFlagEsenzioneModificato(): boolean {
    return this.pratica?.dichiarazioni_aggiuntive?.flag_esenzione_modificato ? true : false;
  }

  get tipologiaProcessoLabel(): string {
    let msg = '';
    switch(this.pratica?.dati_istanza.tipologia_processo) {      
      case TipologiaPratica.Proroga: {
        msg = 'di proroga'; 
        break; 
      }
      case TipologiaPratica['Trasferimento titolarità']: {
        msg = 'di trasferimento titolarità'; 
        break; 
      }
      case TipologiaPratica['Regolarizzazione furto/deterioramento']: {
        msg = 'di regolarizzazione per furto'; 
        break; 
      }
    }
    return msg;
  }

  attoriPareriSchema: any[] = [
    {
      label: this.utilityService.camelCaseToSpace(Group[Group.PoliziaLocale]),
      value: Group.PoliziaLocale
    },
    {
      label: this.utilityService.camelCaseToSpace(Group[Group.UfficioTecnicoDecentrato]),
      value: Group.UfficioTecnicoDecentrato
    },
    {
      label: this.utilityService.camelCaseToSpace(Group[Group.RipartizioneUrbanistica]),
      value: Group.RipartizioneUrbanistica
    }
  ];

  ngOnInit(): void {
    this.cercaPratiche();
  }

  cercaPratiche(){
    this.showSpinner = true;
    this.passiCarrabiliService.cercaPratichePerStatoPratica(StatoPraticaPassiCarrabili['Verifica formale'], this.authService.getMunicipio()).subscribe(
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

  esenzioneCUP(element: any){
    this.pratica = element;
    this.motivo_esenzione_cup = '';
    this.showEsenzioneCUPDialog = true;
  }

  confermaEsenzioneCUP(){
    this.confirmationService.confirm({
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Conferma",
      rejectLabel: "Annulla",
      acceptButtonStyleClass: "btn-custom-style btn-dialog-confirm",
      rejectButtonStyleClass: "btn-custom-style btn-dialog-confirm",
      header: "Esenzione CUP",
      message: "Confermi di voler dichiare l'esenzione del pagamento dal CUP?",
      accept: () => {       
        this.showSpinner = true;
        this.pratica.info_passaggio_stato = PassaggiStato.EsenzioneCUP;
        this.pratica.numero_protocollo_comunicazione = null;
        this.pratica.dichiarazioni_aggiuntive.flag_esenzione_cup = true
        this.pratica.dichiarazioni_aggiuntive.motivazione_esenzione_cup = this.motivo_esenzione_cup;

        this.passiCarrabiliService.aggiornaPratica(this.pratica).subscribe( 
          resp => {   
            this.closeEsenzioneCUPDialog();           
            this.dataSource = this.dataSource.filter(el => el.id_doc != resp.istanza.id_doc);
            this.dataSource.push(resp.istanza);
            this.dataSource = [...this.dataSource];
            this.showSpinner = false;
            this.messageService.showMessage('success', 'Esenzione CUP', 'Dichiarazione esenzione CUP avvenuta con successo');
          },
          err => {
            this.messageService.showMessage('error', 'Esenzione CUP', err.error.message);
            this.showSpinner = false;
          }
        );
      }
    });
  }

  validaPraticaDialog(element: any) {
    this.resetProtocollo();

    let message = this.isRevoca && this.isLavoriDaIniziare ? `Confermi di attendere la fine dei lavori/necessaria integrazione per la pratica num. ${element.numero_protocollo}?` 
                    : `Confermi di richiedere parere/necessaria integrazione per la pratica num. ${element.numero_protocollo}?`

    this.pratica = element;
    this.isEsente = this.pratica.dichiarazioni_aggiuntive.flag_esenzione;
    let arrayTipologieProcessoMarcaDaBollo = [TipologiaPratica['Concessione Temporanea'], TipologiaPratica['Concessione Permanente'], TipologiaPratica.Rinnovo, TipologiaPratica['Trasferimento titolarità']];
    this.isDichiarazioneBolloEditable = this.pratica?.dichiarazioni_aggiuntive?.flag_esenzione && arrayTipologieProcessoMarcaDaBollo.indexOf(this.pratica.dati_istanza.tipologia_processo) > -1;
    this.confirmationService.confirm({
      icon: "pi pi-exclamation-triangle",
      acceptLabel: this.isRevoca && this.isLavoriDaIniziare ? "Attendi fine lavori" : "Richiesta pareri",
      rejectLabel: "Integrazione",
      acceptButtonStyleClass: "btn-custom-style btn-dialog-validazione-pratica",
      rejectButtonStyleClass: "btn-custom-style btn-dialog-validazione-pratica",
      header: "Validazione pratica",
      message: message,
      accept: () => {        
        if(this.isRinuncia){
          this.selectedAttoriPareri.push(Group.UfficioTecnicoDecentrato);
          
          if(element.integrazione_counter > 0 && element.parere_polizia)
            delete element.parere_polizia;

          this.inviaRichiestaPareri(element);
        }
        else if(this.isRevoca){
          if(this.isLavoriDaIniziare) {
            this.inviaRichiestaFineLavori(element);
          }
          else {
            this.selectedAttoriPareri.push(Group.PoliziaLocale);         
            this.inviaRichiestaPareri(element);
          }
        }
        else
          this.richiediParereDialog();
      },
      reject: (event) => {
        if(event == 1) //event=1 -> reject; event=2 -> cancel 
          this.showIntegrazioneDialog = true;
      }
    });
  }

  richiediParereDialog() {
    if (this.pratica.parere_polizia && this.pratica.parere_polizia.parere == false) {
      this.selectedAttoriPareri.push(Group.PoliziaLocale);
    }
    if (this.pratica.parere_utd && this.pratica.parere_utd.parere == false) {
      this.selectedAttoriPareri.push(Group.UfficioTecnicoDecentrato);
    }
    if (this.pratica.parere_urbanistica && this.pratica.parere_urbanistica.parere == false) {
      this.selectedAttoriPareri.push(Group.RipartizioneUrbanistica);
    }
    this.selectedAttoriPareri = [...this.selectedAttoriPareri];
    this.showPareriDialog = true;
  }

  async inviaRichiestaPareri(element: any) {
    this.showSpinner = true;
    this.pratica = element;
    this.definizioneDestinatari(this.pratica);

    if(!this.objProtocollo) { 
      this.pratica.stato_pratica = StatoPraticaPassiCarrabili['Richiesta pareri'];
      //TO DO aggiungere a chi è stata mandata la richiesta pareri? 
      this.pratica.info_passaggio_stato = PassaggiStato.VerificaFormaleToRichiestaPareri;
      this.objProtocollo = this.utilityService.getObjForPdfProtocollo(this.pratica, [], this.pratica.info_passaggio_stato);
      let data: any = await this.utilityService.generaPdfPerProtocolloSync(this.objProtocollo, "templateProtocolloPratica").catch(err => {
        this.actionRiprotocollazione = 'inviaRichiestaPareri';
        this.objProtocollo = null;
        this.messageService.showMessage('warn', 'Generazione template', 'Errore durante la generazione del documento principale per il protocollo. Riprovare più tardi.');
      });

      if(data) {
        this.base64DocInserimento = (await this.utilityService.convertFileToBase64(data)).toString();      
      }
    }

    var respProtocollo: any = null;
    if(this.base64DocInserimento) {
      let callProtocollo: Promise<any> = environment.production ? this.protocolloService.richiestaProtocolloUscitaNewSync(this.objProtocollo, this.objTakeEmails, false, this.base64DocInserimento, []) 
                                                                : this.passiCarrabiliService.getNumeroProtocolloSync(null);

      respProtocollo = await callProtocollo.catch(err => {
            this.actionRiprotocollazione = 'inviaRichiestaPareri';
            this.messageService.showMessage('warn', 'Numero protocollo', 'Servizio di protocollo non disponibile. Riprovare più tardi.');
          });
    }

    this.numProtocollo = `${respProtocollo?.numeroProtocollo || '--'}|${respProtocollo?.anno || '--'}`;

    if(this.numProtocollo && this.numProtocollo != '--|--')
      this.inviaRichiestaPareriPratica(this.pratica);
    else {
      this.showSpinner = false;
      this.showProtocolloDialog = true;
    }
  }

  definizioneDestinatari(element){
    if(this.selectedAttoriPareri.indexOf(Group.PoliziaLocale) != -1) {
      element.parere_polizia = {
        competenza: null,
        parere: null,
        note: '',
        id_blob: null
      }
    }
    if(this.selectedAttoriPareri.indexOf(Group.UfficioTecnicoDecentrato) != -1) {
      element.parere_utd = {
        competenza: null,
        parere: null,
        note: '',
        id_blob: null
      }
    }
    if(this.selectedAttoriPareri.indexOf(Group.RipartizioneUrbanistica) != -1) {
      element.parere_urbanistica = {
        competenza: null,
        parere: null,
        note: '',
        id_blob: null
      }
    }

    this.objTakeEmails = [];

    //riempio objTakeEmails con gli attori coinvolti nella richiesta pareri
    this.selectedAttoriPareri.forEach(el => {
      this.objTakeEmails.push({
        group_id: el,
        municipio_id: null
      });

      if(el == Group.PoliziaLocale) {
        this.objTakeEmails.push({
          group_id: el,
          municipio_id: element.dati_istanza.indirizzo_segnale_indicatore.municipio_id
        });
      } 
    })

    this.objTakeEmails.push({ group_id: Group.DirettoreMunicipio, municipio_id: element.dati_istanza.indirizzo_segnale_indicatore.municipio_id });
  }

  inviaRichiestaPareriPratica(element){
    element.numero_protocollo_comunicazione = this.numProtocollo;
    if(this.numProtocollo && this.numProtocollo != '--|--')
      this.isProtocollata = true;

    this.showProtocolloDialog = false;
    
    //notifica agli attori
    let emailsAttori = [];

    this.utilityService.takeEmails(this.objTakeEmails).subscribe( 
      resp => {
        let emails = resp.data.map(x => x.email);
        emailsAttori = emails.filter((item, index) => emails.indexOf(item) === index);

        this.passiCarrabiliService.aggiornaPratica(element).subscribe( 
          resp => {   
            let subject = this.utilityService.getSubjectEmail(resp.istanza, 'Comunicazione richiesta pareri');
            let cc = this.authService.getEmail();
            
            //invio mail Municipio e Attori coinvolti
            if(emailsAttori && emailsAttori.length) {
              let messaggioAttori = this.emailService.emailRichiestaPareriToAttori(resp.istanza);            
              this.emailService.sendEmail(emailsAttori.join(','), cc, subject, messaggioAttori);     
            }
            else {
              this.messageService.showMessage('warn', 'Richiesta pareri', 'Non sono presenti nel sistema le email degli attori coinvolti',3000);
            }

            this.messageService.showMessage('success', 'Richiesta pareri', 'La pratica è passata in stato: Richiesta pareri');

            if(this.isRinuncia)
              this.selectedAttoriPareri = [];

            this.dataSource = this.dataSource.filter(el => el.id_doc != resp.istanza.id_doc);
            this.dataSource = [...this.dataSource];
            this.showPareriDialog = false;
            this.showSpinner = false;
            if(this.isProtocollata)
              setTimeout(() => {
                this.showProtocolloDialog = true;
              }, 100);
              
          },
          err => {
            this.messageService.showMessage('error', 'Richiesta pareri', err.error.message);
            this.showPareriDialog = false;
            this.showSpinner = false;
            if(this.isProtocollata)
              setTimeout(() => {
                this.showProtocolloDialog = true;
              }, 100);
          }
        );           
      },
      err => {
        this.messageService.showMessage('error', 'Invio email', err.error.message);
        this.showPareriDialog = false;
        this.showSpinner = false;
        if(this.isProtocollata)
          setTimeout(() => {
            this.showProtocolloDialog = true;
          }, 100);
      }
    );
  }

  avvioRichiestaIntegrazione(isDiniego) {
    this.closeValidaPraticaSemplificataDialog();
    this.isDiniego = isDiniego;
    this.showIntegrazioneDialog = true;
  }

  invioRichiestaIntegrazione() {
    this.objTakeEmails = [];
    this.objTakeEmails.push({ group_id: Group.DirettoreMunicipio, municipio_id: this.pratica.dati_istanza.indirizzo_segnale_indicatore.municipio_id });

    if(this.pratica.parere_municipio) {
      this.pratica.parere_municipio.note = this.noteIstruttoreMunicipio
    }
    else {
      this.pratica.parere_municipio = {
        note: this.noteIstruttoreMunicipio
      };
    }

    if(this.pratica.dichiarazioni_aggiuntive.flag_esenzione && !this.isEsente) {
      this.pratica.dichiarazioni_aggiuntive.flag_esenzione = this.isEsente;
      this.pratica.dichiarazioni_aggiuntive.motivazione_esenzione = '';
    }

    if(this.pratica.integrazione_counter == this.utilityService.n_integrazioni_massime) {
      if (this.pratica.diniego == true) {
        this.pratica.stato_pratica = StatoPraticaPassiCarrabili['Pratica da rigettare']; 
        this.pratica.info_passaggio_stato = PassaggiStato.VerificaFormaleToPraticaDaRigettare;
      }
      else if(this.isRevoca) {
        this.pratica.stato_pratica = StatoPraticaPassiCarrabili['Pratica da revocare']; 
        this.pratica.info_passaggio_stato = PassaggiStato.VerificaFormaleToPraticaDaRevocare;
      }
      else {
        this.pratica.stato_pratica = StatoPraticaPassiCarrabili['Preavviso diniego'];
        this.pratica.info_passaggio_stato = PassaggiStato.VerificaFormaleToPreavvisoDiniego;
        this.pratica.data_scadenza_diniego = this.utilityService.getDataScadenzaPratica(undefined, this.isRinuncia ? 30 : 10);
        this.pratica.diniego = true;

        if (this.pratica.parere_polizia && this.pratica.parere_polizia.competenza == true) {
          this.objTakeEmails.push({ group_id: Group.PoliziaLocale, municipio_id: null });
          this.objTakeEmails.push({ group_id: Group.PoliziaLocale, municipio_id: this.pratica.dati_istanza.indirizzo_segnale_indicatore.municipio_id });
        }
        if (this.pratica.parere_utd && this.pratica.parere_utd.competenza == true) {
          this.objTakeEmails.push({ group_id: Group.UfficioTecnicoDecentrato, municipio_id: null });
        }
        if (this.pratica.parere_urbanistica && this.pratica.parere_urbanistica.competenza == true) {
          this.objTakeEmails.push({ group_id: Group.RipartizioneUrbanistica, municipio_id: null });
        }
      }    
    }
    else {
      if (this.pratica.diniego == true) {
        this.pratica.stato_pratica = StatoPraticaPassiCarrabili['Pratica da rigettare']; 
        this.pratica.info_passaggio_stato = PassaggiStato.VerificaFormaleToPraticaDaRigettare;
      }
      else {
        this.pratica.stato_pratica = StatoPraticaPassiCarrabili['Necessaria integrazione'];
        this.pratica.info_passaggio_stato = PassaggiStato.VerificaFormaleToNecessariaIntegrazione;
        this.pratica.data_scadenza_integrazione = this.isRevoca ? this.utilityService.getDataScadenzaPratica(undefined, 5) : this.utilityService.getDataScadenzaPratica(undefined, 45);
        this.pratica.integrazione_counter += 1;

        if (this.pratica.parere_polizia && this.pratica.parere_polizia.parere == false) {
          this.objTakeEmails.push({ group_id: Group.PoliziaLocale, municipio_id: null });
          this.objTakeEmails.push({ group_id: Group.PoliziaLocale, municipio_id: this.pratica.dati_istanza.indirizzo_segnale_indicatore.municipio_id });
        }
        if (this.pratica.parere_utd && this.pratica.parere_utd.parere == false) {
          this.objTakeEmails.push({ group_id: Group.UfficioTecnicoDecentrato, municipio_id: null });
        }
        if (this.pratica.parere_urbanistica && this.pratica.parere_urbanistica.parere == false) {
          this.objTakeEmails.push({ group_id: Group.RipartizioneUrbanistica, municipio_id: null });
        }
      }
    }

    if (this.pratica.stato_pratica != StatoPraticaPassiCarrabili['Pratica da rigettare']) {
      this.invioRichiestaIntegrazionePraticaGetProtocollo(this.pratica);
    } 
    else 
      this.invioRichiestaIntegrazionePratica(this.pratica);   
  }

  async invioRichiestaIntegrazionePraticaGetProtocollo(istanza){
    this.showSpinner = true;
    this.uploadedFiles = [];
    let comunicazione_cittadino = this.pratica.stato_pratica == StatoPraticaPassiCarrabili['Pratica da rigettare'] || this.pratica.stato_pratica == StatoPraticaPassiCarrabili['Pratica da revocare'] ? false : true;
    
    var file = null;
    var estensioneFile = null;
    if(this.doc_richiesta_integrazione_diniego.id_blob) {
      this.uploadedFiles.push({ id: this.doc_richiesta_integrazione_diniego.id_blob });
      file = await this.passiCarrabiliService.getDocumentoSync(this.doc_richiesta_integrazione_diniego.id_blob);
      estensioneFile = file.name.substr(file.name.lastIndexOf('.') + 1).toLowerCase();
    }

    if(!this.objProtocollo) { 
      this.objProtocollo = this.utilityService.getObjForPdfProtocollo(this.pratica, [], this.pratica.info_passaggio_stato);
      if(this.uploadedFiles.length == 0) {
        let data: any = await this.utilityService.generaPdfPerProtocolloSync(this.objProtocollo, "templateProtocolloPratica").catch(err => {
          this.actionRiprotocollazione = 'invioRichiestaIntegrazionePraticaGetProtocollo';
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
      let callProtocollo: Promise<any> = environment.production ? this.protocolloService.richiestaProtocolloUscitaNewSync(this.objProtocollo, this.objTakeEmails, comunicazione_cittadino, this.base64DocInserimento, [], estensioneFile) 
                                                                : this.passiCarrabiliService.getNumeroProtocolloSync(null);
      
      respProtocollo = await callProtocollo.catch(err => {
            this.actionRiprotocollazione = 'invioRichiestaIntegrazionePraticaGetProtocollo';
            this.messageService.showMessage('warn', 'Numero protocollo', 'Servizio di protocollo non disponibile. Riprovare più tardi.');
          });
    }

    this.numProtocollo = `${respProtocollo?.numeroProtocollo || '--'}|${respProtocollo?.anno || '--'}`;

    //associazione numero di protocollo ai documenti allegati
    if(this.uploadedFiles && this.uploadedFiles.length && this.numProtocollo != '--|--') {
      this.associaProtocolloADocumento();
    }

    if(this.numProtocollo && this.numProtocollo != '--|--')
      this.invioRichiestaIntegrazionePratica(this.pratica, file);
    else {
      this.showSpinner = false;
      this.showProtocolloDialog = true;
    }
  }

  async invioRichiestaDiniego() {
    this.objTakeEmails = [];
    this.objTakeEmails.push({ group_id: Group.DirettoreMunicipio, municipio_id: this.pratica.dati_istanza.indirizzo_segnale_indicatore.municipio_id });

    this.pratica.parere_municipio = {
      note: this.noteIstruttoreMunicipio
    };

    if (this.pratica.diniego == true) {
      this.pratica.stato_pratica = StatoPraticaPassiCarrabili['Pratica da rigettare']; 
      this.pratica.info_passaggio_stato = PassaggiStato.VerificaFormaleToPraticaDaRigettare;
    }
    else {
      this.pratica.stato_pratica = StatoPraticaPassiCarrabili['Preavviso diniego'];
      this.pratica.info_passaggio_stato = PassaggiStato.VerificaFormaleToPreavvisoDiniego;
      this.pratica.data_scadenza_diniego = this.utilityService.getDataScadenzaPratica(undefined, 10);
      this.pratica.diniego = true;

      if (this.pratica.parere_polizia && this.pratica.parere_polizia.competenza == true) {
        this.objTakeEmails.push({ group_id: Group.PoliziaLocale, municipio_id: null });
        this.objTakeEmails.push({ group_id: Group.PoliziaLocale, municipio_id: this.pratica.dati_istanza.indirizzo_segnale_indicatore.municipio_id });
      }
      if (this.pratica.parere_utd && this.pratica.parere_utd.competenza == true) {
        this.objTakeEmails.push({ group_id: Group.UfficioTecnicoDecentrato, municipio_id: null });
      }
      if (this.pratica.parere_urbanistica && this.pratica.parere_urbanistica.competenza == true) {
        this.objTakeEmails.push({ group_id: Group.RipartizioneUrbanistica, municipio_id: null });
      }
    }    
    
    if (this.pratica.stato_pratica != StatoPraticaPassiCarrabili['Pratica da rigettare']) {
      this.invioRichiestaIntegrazionePraticaGetProtocollo(this.pratica);
    } 
    else 
      this.invioRichiestaIntegrazionePratica(this.pratica);   
  }

  invioRichiestaIntegrazionePratica(element, file?){
    this.pratica.numero_protocollo_comunicazione = this.numProtocollo || '';
    if(this.numProtocollo && this.numProtocollo != '--|--')
      this.isProtocollata = true;
    this.showProtocolloDialog = false;

    this.utilityService.takeEmails(this.objTakeEmails).subscribe( 
      resp => {
        let emails = resp.data.map(x => x.email);
        let emailsAttori = emails.filter((item, index) => emails.indexOf(item) === index);

        this.passiCarrabiliService.aggiornaPratica(this.pratica).subscribe( 
          resp => {
            let cc = this.authService.getEmail();
            let subject = '';
            let messaggioCittadino= '';
            let messaggioAttori= '';
            switch(resp.istanza.stato_pratica) { 
              case StatoPraticaPassiCarrabili['Preavviso diniego']:  
                subject = this.utilityService.getSubjectEmail(resp.istanza, 'Comunicazione preavviso diniego pratica');
                messaggioCittadino = this.isRinuncia ? this.emailService.emailNotificaRipristinoLuoghiCittadino(resp.istanza) : this.emailService.emailPreavvisoDiniegoCittadino(resp.istanza);
                if(emailsAttori && emailsAttori.length) {
                  messaggioAttori = this.isRinuncia ? this.emailService.emailNotificaRipristinoLuoghiAttori(resp.istanza) : this.emailService.emailPreavvisoDiniegoMunicipio(resp.istanza);            
                }
                else {
                  this.messageService.showMessage('warn', 'Preavviso diniego', 'Non sono presenti referenti del municipio relativo all\'indirizzo inserito',3000);
                }
                break; 
               
              case StatoPraticaPassiCarrabili['Necessaria integrazione']:  
                subject = this.utilityService.getSubjectEmail(resp.istanza, 'Comunicazione necessaria integrazione pratica');
                messaggioCittadino = this.emailService.emailIntegrazioneDocumentiPraticaCittadino(resp.istanza); 
                if(emailsAttori && emailsAttori.length) {
                  messaggioAttori = this.emailService.emailIntegrazioneDocumentiPraticaMunicipio(resp.istanza);            
                }
                else {
                  this.messageService.showMessage('warn', 'Richiesta integrazione', 'Non sono presenti referenti del municipio relativo all\'indirizzo inserito',3000);
                }
                break; 

              case StatoPraticaPassiCarrabili['Pratica da rigettare']: 
              case StatoPraticaPassiCarrabili['Pratica da revocare']: 
                subject = this.utilityService.getSubjectEmail(resp.istanza, (this.isRevoca ? 'Comunicazione pratica da revocare' :  'Comunicazione pratica da rigettare'));
                if(emailsAttori && emailsAttori.length) {
                  messaggioAttori = this.emailService.emailPraticaDaRigettare(resp.istanza);           
                }
                else {
                  this.messageService.showMessage('warn', StatoPraticaPassiCarrabili[resp.istanza.stato_pratica], 'Non sono presenti referenti del municipio relativo all\'indirizzo inserito',3000);
                }
                break;   
            }
            
            if(messaggioCittadino){
              let objPec = file ? { filename: file.name, path: file.blob, municipio_id: this.authService.getMunicipio() } : { emailCittadino: true, municipio_id: this.authService.getMunicipio() };
              this.emailService.sendEmail(resp.istanza.anagrafica.email, cc, subject, messaggioCittadino, objPec);
            }   

            if(messaggioAttori)
              this.emailService.sendEmail(emailsAttori.join(','), cc, subject, messaggioAttori);
            
            if(resp.istanza.stato_pratica != StatoPraticaPassiCarrabili['Pratica da rigettare'] && resp.istanza.stato_pratica != StatoPraticaPassiCarrabili['Pratica da revocare']) {
              if (resp.istanza.integrazione_counter > 0 && resp.istanza.diniego == false) {
                this.messageService.showMessage('success', 'Richiesta integrazione', 'La pratica è passata in stato: Necessaria integrazione');
              }
              else {
                this.messageService.showMessage('success', 'Diniego concessione', 'E\' stato comunicato il preavviso di diniego al cittadino');
              }
            }
            else {
              this.messageService.showMessage('success', 'Rigetto concessione', 'La pratica è passata in stato: ' + StatoPraticaPassiCarrabili[resp.istanza.stato_pratica]);
            }
            
            this.dataSource = this.dataSource.filter(el => el.id_doc != resp.istanza.id_doc);
            this.dataSource = [...this.dataSource];
            this.showIntegrazioneDialog = false;
            this.showSpinner = false;
            if(this.isProtocollata && resp.istanza.stato_pratica != StatoPraticaPassiCarrabili['Pratica da rigettare'])
              setTimeout(() => {
                this.showProtocolloDialog = true;
              }, 100);
          },
          err => {
            this.messageService.showMessage('error', 'Errore richiesta integrazione', err.error.message);
            this.showIntegrazioneDialog = false;
            this.showSpinner = false;
            if(this.isProtocollata)
              setTimeout(() => {
                this.showProtocolloDialog = true;
              }, 100);
          }
        );           
      },
      err => {
        this.messageService.showMessage('error', 'Invio email', err.error.message);
        this.showIntegrazioneDialog = false;
        this.showSpinner = false;
        if(this.isProtocollata)
          setTimeout(() => {
            this.showProtocolloDialog = true;
          }, 100);
      }
    );
  }

  closePareriDialog(event?){
    this.selectedAttoriPareri = [];
    this.showPareriDialog = false;
  } 

  async closeIntegrazioneDialog(event?) {
    this.showSpinner = true;
    if(event == 'Annulla' && this.doc_richiesta_integrazione_diniego.id_blob){
      await this.passiCarrabiliService.deleteDocumentSync(this.doc_richiesta_integrazione_diniego.id_blob).then(resp => {
        this.doc_richiesta_integrazione_diniego.id_blob = '';
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
    this.noteIstruttoreMunicipio = '';
    this.showIntegrazioneDialog = false;
    setTimeout(() => { 
      this.cercaPratiche();
    }, 2000);
  }

  closeProtocolloDialog(event?) {
    this.showProtocolloDialog = false;
    this.numProtocollo = '';
    this.actionRiprotocollazione = '';
  }

  validaPraticaSemplificataDialog(element: any) {
    this.resetProtocollo();
    this.pratica = element;
    this.isEsente = this.pratica.dichiarazioni_aggiuntive.flag_esenzione;
    let arrayTipologieProcessoMarcaDaBollo = [TipologiaPratica['Concessione Temporanea'], TipologiaPratica['Concessione Permanente'], TipologiaPratica.Rinnovo, TipologiaPratica['Trasferimento titolarità']];
    this.isDichiarazioneBolloEditable = this.pratica?.dichiarazioni_aggiuntive?.flag_esenzione && arrayTipologieProcessoMarcaDaBollo.indexOf(this.pratica.dati_istanza.tipologia_processo) > -1;
    this.showValidaPraticaSemplificataDialog = true;
  }

  preparaApprovazionePratica() {
    // switch(this.pratica.dati_istanza.tipologia_processo) { 
    //   case TipologiaPratica.Proroga: {
    //     this.pratica.stato_pratica = StatoPraticaPassiCarrabili['Concessione valida']; 
    //     this.pratica.info_passaggio_stato = PassaggiStato.VerificaFormaleToConcessioneValida;
    //     break; 
    //   }
    //   case TipologiaPratica['Trasferimento titolarità']:
    //   case TipologiaPratica['Regolarizzazione furto/deterioramento']:
    //   case TipologiaPratica.Decadenza: {
        this.pratica.stato_pratica = StatoPraticaPassiCarrabili.Approvata;  
        this.pratica.info_passaggio_stato = PassaggiStato.VerificaFormaleToApprovata;
    //     break; 
    //   }
    // }

    this.objTakeEmails = [{ group_id: Group.DirettoreMunicipio, municipio_id: this.pratica.dati_istanza.indirizzo_segnale_indicatore.municipio_id }];

    if (this.pratica.parere_polizia && this.pratica.parere_polizia.competenza == true) {
      this.objTakeEmails.push({ group_id: Group.PoliziaLocale, municipio_id: null });
      this.objTakeEmails.push({ group_id: Group.PoliziaLocale, municipio_id: this.pratica.dati_istanza.indirizzo_segnale_indicatore.municipio_id });
    }
    if (this.pratica.parere_utd && this.pratica.parere_utd.competenza == true) {
      this.objTakeEmails.push({ group_id: Group.UfficioTecnicoDecentrato, municipio_id: null });
    }
    if (this.pratica.parere_urbanistica && this.pratica.parere_urbanistica.competenza == true) {
      this.objTakeEmails.push({ group_id: Group.RipartizioneUrbanistica, municipio_id: null });
    }
  }

  async approvaSemplificata(istanza?: any) {
    this.preparaApprovazionePratica();
    this.showSpinner = true;

    let comunicazione_cittadino = this.pratica.dati_istanza.tipologia_processo == TipologiaPratica.Decadenza ? false : true;
    
    if(!this.objProtocollo) { 
      this.objProtocollo = this.utilityService.getObjForPdfProtocollo(this.pratica, [], this.pratica.info_passaggio_stato);
      let data: any = await this.utilityService.generaPdfPerProtocolloSync(this.objProtocollo, "templateProtocolloPratica").catch(err => {
        this.actionRiprotocollazione = 'approvaSemplificata';
        this.objProtocollo = null;
        this.messageService.showMessage('warn', 'Generazione template', 'Errore durante la generazione del documento principale per il protocollo. Riprovare più tardi.');
      });

      if(data) {
        this.base64DocInserimento = (await this.utilityService.convertFileToBase64(data)).toString();      
      }
    }
    
    var respProtocollo: any = null;
    if(this.base64DocInserimento) {
      let callProtocollo: Promise<any> = environment.production ? this.protocolloService.richiestaProtocolloUscitaNewSync(this.objProtocollo, this.objTakeEmails, comunicazione_cittadino, this.base64DocInserimento, []) 
                                                                : this.passiCarrabiliService.getNumeroProtocolloSync(null);

      respProtocollo = await callProtocollo.catch(err => {
            this.actionRiprotocollazione = 'approvaSemplificata';
            this.messageService.showMessage('warn', 'Numero protocollo', 'Servizio di protocollo non disponibile. Riprovare più tardi.');
          });
    }

    this.numProtocollo = `${respProtocollo?.numeroProtocollo || '--'}|${respProtocollo?.anno || '--'}`;

    if(this.numProtocollo && this.numProtocollo != '--|--')
      this.approvaPraticaSemplificata(this.pratica);
    else {
      this.showSpinner = false;
      this.showProtocolloDialog = true;
    }
  }

  approvaPraticaSemplificata(element){
    element.numero_protocollo_comunicazione = this.numProtocollo;
    if(this.numProtocollo && this.numProtocollo != '--|--')
      this.isProtocollata = true;
    
    this.showProtocolloDialog = false;
    
    this.preparaApprovazionePratica();
     
    if(element.dati_istanza.tipologia_processo == TipologiaPratica.Proroga) {  
      // delete element.data_scadenza_procedimento;

      if(isNaN(element.dati_istanza.anni) || isNaN(element.dati_istanza.mesi) || isNaN(element.dati_istanza.giorni)){
        element.dati_istanza.data_scadenza_concessione = this.utilityService.getDataScadenzaPratica(element.dati_istanza.link_pratica_origine?.data_scadenza_concessione || undefined, element.dati_istanza.durata_giorni_concessione);
        let durataAnniMesiGiorni = this.utilityService.getAnniMesiGiorniConcessione(element.dati_istanza.link_pratica_origine?.data_scadenza_concessione, element.dati_istanza.data_scadenza_concessione);
        element.dati_istanza.anni = durataAnniMesiGiorni.anni;
        element.dati_istanza.mesi = durataAnniMesiGiorni.mesi;
        element.dati_istanza.giorni = durataAnniMesiGiorni.giorni;
      
        if(isNaN(element.dati_istanza.link_pratica_origine.anni) || isNaN(element.dati_istanza.link_pratica_origine.mesi) || isNaN(element.dati_istanza.link_pratica_origine.giorni)){
          let durataAnniMesiGiorniOrigine = this.utilityService.getAnniMesiGiorniConcessioneOrigine(element.dati_istanza.link_pratica_origine.data_scadenza_concessione, element.dati_istanza.link_pratica_origine.durata_giorni_concessione);
          element.dati_istanza.link_pratica_origine.anni = durataAnniMesiGiorniOrigine.anni;
          element.dati_istanza.link_pratica_origine.mesi = durataAnniMesiGiorniOrigine.mesi;
          element.dati_istanza.link_pratica_origine.giorni = durataAnniMesiGiorniOrigine.giorni;
        }
      }
      else  
        element.dati_istanza.data_scadenza_concessione = this.utilityService.getDataScadenzaConcessione(element.dati_istanza.link_pratica_origine?.data_scadenza_concessione, element.dati_istanza.anni, element.dati_istanza.mesi, element.dati_istanza.giorni);
                    
      let durataAnniMesiGiorni = this.utilityService.getAnniMesiGiorniConcessione(element.dati_istanza.link_pratica_origine?.data_emissione, element.dati_istanza.data_scadenza_concessione);
      element.dati_istanza.anni = durataAnniMesiGiorni.anni;
      element.dati_istanza.mesi = durataAnniMesiGiorni.mesi;
      element.dati_istanza.giorni = durataAnniMesiGiorni.giorni;

      element.dati_istanza.durata_giorni_concessione = this.utilityService.getGiorniConcessione(element.dati_istanza.link_pratica_origine?.data_emissione, element.dati_istanza.data_scadenza_concessione);       
    }

    this.utilityService.takeEmails(this.objTakeEmails).subscribe( 
      resp => {
        let emails = resp.data.map(x => x.email);
        let emailsAttori = emails.filter((item, index) => emails.indexOf(item) === index);

        this.passiCarrabiliService.aggiornaPratica(element).subscribe( 
          resp => {   
            let cc = this.authService.getEmail();

            let subject = '';
            let messaggioCittadino = '';
            let messaggioAttori = '';

            switch(resp.istanza.dati_istanza.tipologia_processo) { 
              case TipologiaPratica.Proroga: {
                subject = this.utilityService.getSubjectEmail(resp.istanza, 'Comunicazione approvazione proroga');
                messaggioCittadino = this.emailService.emailNotificaPraticaApprovataCittadino(resp.istanza); 
                messaggioAttori = this.emailService.emailNotificaApprovazioneProrogaAttori(resp.istanza); 
                break; 
              }
              case TipologiaPratica['Trasferimento titolarità']:
              case TipologiaPratica['Regolarizzazione furto/deterioramento']:
              case TipologiaPratica.Decadenza: {
                subject = this.utilityService.getSubjectEmail(resp.istanza, 'Comunicazione approvazione pratica');
                if(!this.isDecadenza)
                  messaggioCittadino = this.emailService.emailNotificaPraticaApprovataCittadino(resp.istanza); 

                messaggioAttori = this.emailService.emailNotificaPraticaApprovataAttori(resp.istanza); 
                break; 
              }
            }

            //invio mail al cittadino
            if(messaggioCittadino)
              this.emailService.sendEmail(resp.istanza.anagrafica.email, cc, subject, messaggioCittadino, { emailCittadino: true, municipio_id: this.authService.getMunicipio() });
              
            //invio mail Municipio e Attori coinvolti
            if(emailsAttori && emailsAttori.length) {       
              this.emailService.sendEmail(emailsAttori.join(','), cc, subject, messaggioAttori);     
            }
            else {
              this.messageService.showMessage('warn', 'Approvazione pratica', 'Non sono presenti nel sistema le email degli attori coinvolti',3000);
            }

            this.messageService.showMessage('success', 'Approvazione pratica', `La pratica è passata in stato: ${StatoPraticaPassiCarrabili[resp.istanza.stato_pratica]}`);

            //chiusura della pratica originaria con passaggio di stato in pratica archiviata
            // if(resp.istanza.dati_istanza.tipologia_processo == TipologiaPratica.Proroga && resp.istanza.dati_istanza.link_pratica_origine) {
            //   this.passiCarrabiliService.archiviaPraticaOriginaria(resp.istanza).subscribe(
            //     resp => {
            //       this.messageService.showMessage('success', 'Archiviazione pratica originaria', 'La pratica originaria è stata archiviata correttamente');
            //     },
            //     err => {
            //       this.messageService.showMessage('error', 'Archiviazione pratica originaria' , err.error.message);
            //     }
            //   );
            // }

            this.dataSource = this.dataSource.filter(el => el.id_doc != resp.istanza.id_doc);
            this.dataSource = [...this.dataSource];
            this.closeValidaPraticaSemplificataDialog();
            this.showSpinner = false;
            if(this.isProtocollata)
              setTimeout(() => {
                this.showProtocolloDialog = true;
              }, 100);  
          },
          err => {
            this.messageService.showMessage('error', 'Approvazione pratica', err.error.message);
            this.closeValidaPraticaSemplificataDialog();
            this.showSpinner = false;
            if(this.isProtocollata)
              setTimeout(() => {
                this.showProtocolloDialog = true;
              }, 100);
          }
        );           
      },
      err => {
        this.messageService.showMessage('error', 'Invio email', err.error.message);
        this.closeValidaPraticaSemplificataDialog();
        this.showSpinner = false;
        if(this.isProtocollata)
          setTimeout(() => {
            this.showProtocolloDialog = true;
          }, 100);
      }
    );
  }

  closeValidaPraticaSemplificataDialog() {
    this.showValidaPraticaSemplificataDialog = false;
  }

  closeEsenzioneCUPDialog() {
    this.showEsenzioneCUPDialog = false;
    this.motivo_esenzione_cup = '';
  }

  async inviaRichiestaFineLavori(element: any) {
    this.showSpinner = true;
    this.pratica = element;

    if(!this.objProtocollo) { 
      this.pratica.stato_pratica = StatoPraticaPassiCarrabili['Attesa fine lavori'];
      this.pratica.info_passaggio_stato = PassaggiStato.VerificaFormaleToAttesaFineLavori;
      this.objProtocollo = this.utilityService.getObjForPdfProtocollo(this.pratica, [], this.pratica.info_passaggio_stato);
      let data: any = await this.utilityService.generaPdfPerProtocolloSync(this.objProtocollo, "templateProtocolloPratica").catch(err => {
        this.actionRiprotocollazione = 'inviaRichiestaFineLavori';
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
            this.actionRiprotocollazione = 'inviaRichiestaFineLavori';
            this.messageService.showMessage('warn', 'Numero protocollo', 'Servizio di protocollo non disponibile. Riprovare più tardi.');
          });
    }

    this.numProtocollo = `${respProtocollo?.numeroProtocollo || '--'}|${respProtocollo?.anno || '--'}`;

    if(this.numProtocollo && this.numProtocollo != '--|--')
      this.inviaRichiestaFineLavoriPratica(this.pratica);
    else {
      this.showSpinner = false;
      this.showProtocolloDialog = true;
    }
  }

  inviaRichiestaFineLavoriPratica(element){
    element.numero_protocollo_comunicazione = this.numProtocollo;
    element.inizio_lavori = true;
    if(this.numProtocollo && this.numProtocollo != '--|--')
      this.isProtocollata = true;

    this.showProtocolloDialog = false;
    
    let objTakeEmails = [
      { group_id: Group.DirettoreMunicipio, municipio_id: element.dati_istanza.indirizzo_segnale_indicatore.municipio_id }
    ];

    this.utilityService.takeEmails(objTakeEmails).subscribe( 
      resp => {
        let emails = resp.data.map(x => x.email);
        let emailsMunicipio = emails.filter((item, index) => emails.indexOf(item) === index);

        this.passiCarrabiliService.aggiornaPratica(element).subscribe( 
          resp => {   
            let subject = this.utilityService.getSubjectEmail(resp.istanza, 'Comunicazione richiesta di fine lavori');
            let cc = this.authService.getEmail();
            
            let messaggioCittadino = this.emailService.emailNotificaRichiestaFineLavoriCittadino(resp.istanza);
            this.emailService.sendEmail(resp.istanza.anagrafica.email, cc, subject, messaggioCittadino, { emailCittadino: true, municipio_id: this.authService.getMunicipio() });

            //invio mail Municipio e Attori coinvolti
            if(emailsMunicipio && emailsMunicipio.length) {
              let messaggioAttori = this.emailService.emailNotificaRichiestaFineLavoriMunicipio(resp.istanza);            
              this.emailService.sendEmail(emailsMunicipio.join(','), cc, subject, messaggioAttori);     
            }
            else {
              this.messageService.showMessage('warn', 'Richiesta fine lavori', 'Non sono presenti nel sistema le email degli attori coinvolti',3000);
            }

            this.messageService.showMessage('success', 'Richiesta fine lavori', 'La pratica è passata in stato: Attesa fine lavori');

            if(this.isRinuncia)
              this.selectedAttoriPareri = [];

            this.dataSource = this.dataSource.filter(el => el.id_doc != resp.istanza.id_doc);
            this.dataSource = [...this.dataSource];
            this.showPareriDialog = false;
            this.showSpinner = false;
            if(this.isProtocollata)
              setTimeout(() => {
                this.showProtocolloDialog = true;
              }, 100);
          },
          err => {
            this.messageService.showMessage('error', 'Richiesta fine lavori', err.error.message);
            this.showPareriDialog = false;
            this.showSpinner = false;
            if(this.isProtocollata)
              setTimeout(() => {
                this.showProtocolloDialog = true;
              }, 100);
          }
        );           
      },
      err => {
        this.messageService.showMessage('error', 'Invio email', err.error.message);
        this.showPareriDialog = false;
        this.showSpinner = false;
        if(this.isProtocollata)
          setTimeout(() => {
            this.showProtocolloDialog = true;
          }, 100);
      }
    );
  }

  integrazioneDocumentiDecadenza() {
    this.showValidaPraticaSemplificataDialog = false;

    let data = {
      pratica: this.pratica,
      mode: 'multiple'
    }

    this.uploadedFiles = [];
    let dialogRef = this.dialogService.open(UploadFileComponent, this.utilityService.configDynamicDialogFullScreen(data, "Allega documenti alla pratica"));
    
    dialogRef.onClose.subscribe(async (uploadedFiles) => {
      if (uploadedFiles) {
        this.uploadedFiles = uploadedFiles.filter(doc => !doc.numero_protocollo || doc.numero_protocollo == '--|--');
        this.integrazionePraticaDecadenzaGetProtocollo(this.pratica);
      }
    });
  }

  async integrazionePraticaDecadenzaGetProtocollo(istanza){
    this.showSpinner = true;
    this.pratica = istanza;

    let objTakeEmails = [
      { group_id: Group.DirettoreMunicipio, municipio_id: this.pratica.dati_istanza.indirizzo_segnale_indicatore.municipio_id }
    ];

    this.pratica.info_passaggio_stato = PassaggiStato.VerificaFormaleToVerificaFormaleDecadenza;

    if(!this.objProtocollo) { 
      this.objProtocollo = this.utilityService.getObjForPdfProtocollo(this.pratica, this.uploadedFiles, this.pratica.info_passaggio_stato);
      let data: any = await this.utilityService.generaPdfPerProtocolloSync(this.objProtocollo, "templateProtocolloPratica").catch(err => {
        this.actionRiprotocollazione = 'integrazionePraticaDecadenzaGetProtocollo';
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

      let callProtocollo: Promise<any> = environment.production ? this.protocolloService.richiestaProtocolloUscitaNewSync(this.objProtocollo, objTakeEmails, false, this.base64DocInserimento, convertedUploadedFiles) 
                                                                : this.passiCarrabiliService.getNumeroProtocolloSync(null);

      respProtocollo = await callProtocollo.catch(err => {
          this.actionRiprotocollazione = 'integrazionePraticaDecadenzaGetProtocollo';
          this.messageService.showMessage('warn', 'Numero protocollo', 'Servizio di protocollo non disponibile. Riprovare più tardi.');
        });
    }

    this.numProtocollo = `${respProtocollo?.numeroProtocollo || '--'}|${respProtocollo?.anno || '--'}`;

    //associazione numero di protocollo ai documenti allegati
    if(this.uploadedFiles && this.uploadedFiles.length && this.numProtocollo != '--|--') {
      this.associaProtocolloADocumento();
    }

    if(this.numProtocollo && this.numProtocollo != '--|--')
      this.integrazionePraticaDecadenza(this.pratica);
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

  integrazionePraticaDecadenza(istanza){
    this.showSpinner = false;
    this.showProtocolloDialog = true;
  }

  variazioneDichiarazioneEsenzione(event?){
    this.pratica.dichiarazioni_aggiuntive.flag_esenzione_modificato = true;

    if(event == 'pareri') {
      this.pratica.dichiarazioni_aggiuntive.flag_esenzione = this.isEsente;
      this.pratica.dichiarazioni_aggiuntive.motivazione_esenzione = this.isEsente ? 'Esenzione confermata da municipio' : '';
    }
  }

  resetProtocollo() {
    this.objProtocollo = null;
    this.isProtocollata = false;
    this.base64DocInserimento = '';
  }

  checkFileInCheckout: boolean = false;

  getIdDocIntegrazioneUploaded(id_blob) {
    this.doc_richiesta_integrazione_diniego.id_blob = id_blob;
    this.checkFileInCheckout = false;
  }

  fileInCheckout(status_checkout) {
    this.checkFileInCheckout = status_checkout;
  }
}
