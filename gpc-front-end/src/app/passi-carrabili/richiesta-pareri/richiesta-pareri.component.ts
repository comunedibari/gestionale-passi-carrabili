import { Component, OnInit } from '@angular/core';
import { DialogService } from 'primeng/dynamicdialog';
import { StatoPraticaPassiCarrabili } from 'src/app/shared/enums/StatoPratica.enum';
import { TipologiaPratica } from 'src/app/shared/enums/TipologiaPratica.enum';
import { AuthService } from 'src/app/shared/service/auth.service';
import { MessageService } from 'src/app/shared/service/message.service';
import { PassiCarrabiliService } from 'src/app/shared/service/passi.carrabili.service';
import { UtilityService } from 'src/app/shared/service/utility.service';
import { TableEvent } from 'src/app/shared/table-prime-ng/models/TableEvent';
import { DettaglioPraticaComponent } from '../dettaglio-pratica/dettaglio-pratica.component';
import { Group } from 'src/app/shared/enums/Group.enum';
import { ConfirmationService } from 'primeng/api';
import { EmailService } from 'src/app/shared/service/email.service';
import { AbstractControl, FormControl, FormGroup, Validators } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { ProtocolloService } from 'src/app/shared/service/protocollo.service';
import { PassaggiStato } from 'src/app/shared/enums/PassaggiStato.enum';

@Component({
  selector: 'app-richiesta-pareri',
  templateUrl: './richiesta-pareri.component.html',
  styleUrls: ['./richiesta-pareri.component.css']
})
export class RichiestaPareriComponent implements OnInit {

  constructor(
    private passiCarrabiliService: PassiCarrabiliService,
    private protocolloService: ProtocolloService,
    private messageService: MessageService,
    public dialogService: DialogService,
    private utilityService: UtilityService,
    public authService: AuthService,
    public confirmationService: ConfirmationService,
    private emailService: EmailService
  ) { }

  showSpinner: boolean = false;
  showEsprimiParereDialog: boolean = false;
  showRichiediParereDialog: boolean = false;
  showRielaboraParereDialog: boolean = false;
  indexRielabora: number = 0;
  selectedAttori: any[] = [];
  noteIstruttoreMunicipio: string = '';
  pratica: any;
  dataSource: any[];
  // isEsente: boolean = false;

  showProtocolloDialog: boolean = false;
  numProtocollo: string = '';
  isProtocollata: boolean = false;
  actionRiprotocollazione: string = '';
  uploadedFiles: any[] = [];
  objTakeEmails: any[] = [];
  fieldUserType: string = '';
  base64DocInserimento: string = '';
  objProtocollo: any = null;

  doc_richiesta_integrazione_diniego: any = {
    // id: '',
    // data_emissione: '',
    id_blob: ''
  };

  initSortColumn = 'last_modification.data_operazione';
  directionSortColumn = "1"; //1=asc  0=rand   -1=desc 
  titleTable: string = `Pratiche ${this.getPageTitle().toLowerCase()}`;
  exportName = `Pratiche ${this.getPageTitle().toLowerCase()}`;
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
    // {
    //   field: "stato_pratica",
    //   header: "Stato",
    //   type: "dropdown",
    //   show: (el) => {
    //     return StatoPraticaPassiCarrabili[el];
    //   }
    // },
    {
      field: "parere_polizia",
      header: "Parere Polizia",
      type: "dropdown",
      show: (el) => {
        return el == undefined ? 'Non richiesto' : (el.competenza != null ? this.parere.find(x => x.value === el.parere)?.label : 'In Attesa');
      }
    },
    {
      field: "parere_utd",
      header: "Parere UTD",
      type: "dropdown",
      show: (el) => {
        return el == undefined ? 'Non richiesto' : (el.competenza != null ? this.parere.find(x => x.value === el.parere)?.label : 'In Attesa');
      }
    },
    {
      field: "parere_urbanistica",
      header: "Parere Urbanistica",
      type: "dropdown",
      show: (el) => {
        return el == undefined ? 'Non richiesto' : (el.competenza != null ? this.parere.find(x => x.value === el.parere)?.label : 'In Attesa');
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
      key: 'esprimiParereDialog',
      icon: "pi pi-comment",
      tooltip: 'ESPRIMI PARERE',
      hidden: (el) => {
        return this.authService.getGroup() != Group.PoliziaLocale 
                && this.authService.getGroup() != Group.RipartizioneUrbanistica 
                && this.authService.getGroup() != Group.UfficioTecnicoDecentrato;
      }
    },
    {
      key: 'richiediParereDialog',
      icon: "pi pi-comments",
      tooltip: 'RICHIEDI PARERE',
      hidden: (el) => {
        return this.authService.getGroup() != Group.IstruttoreMunicipio;
      }
    },
    {
      key: 'rielaboraParereDialog',
      icon: "pi pi-sign-in",
      tooltip: 'RIELABORA PARERE',
      hidden: (el) => {
        return this.authService.getGroup() != Group.IstruttoreMunicipio;
      }
    }
  ];

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

  get divHeight(): string {
    if(this.isFaseDiniego)
      return this.isFaseIntegrazioneMassimaRaggiunta || this.isFaseDiniego ? '216px' : '162px';
    else  
      return this.isFaseIntegrazioneMassimaRaggiunta ? '397px' : '343px';
  }

  //selectButton Competenza Attori Coinvolti
  competenza: any[] = [
    { label: "Competenza", value: true },
    { label: "Non Competenza", value: false }
  ];
 //selectButton Pareri Attori Coinvolti
  parere: any[] = [
    { label: "Positivo", value: true, disabled: false },
    { label: "Negativo", value: false, disabled: false },
    { label: "Non di Competenza", value: null, disabled : true }
  ];

  //selectButton Rielabora Pareri
  rielaboraOptions: any[] = [
    { label: "Approva" , value: 'approva'},
    { label: "Chiedi integrazione" , value: 'integrazione'},
    { label: "Rigetta" , value: 'rigetta'}
  ]

  attoriPareriSchema: any[] = [
    {
      label: this.utilityService.camelCaseToSpace(Group[Group.PoliziaLocale]),
      value: Group.PoliziaLocale,
      disabled: false
    },
    {
      label: this.utilityService.camelCaseToSpace(Group[Group.UfficioTecnicoDecentrato]),
      value: Group.UfficioTecnicoDecentrato,
      disabled: false
    },
    {
      label: this.utilityService.camelCaseToSpace(Group[Group.RipartizioneUrbanistica]),
      value: Group.RipartizioneUrbanistica,
      disabled: false
    }
  ];

  //formGroup
  esprimiParereForm = new FormGroup({
    'competenza': new FormControl(null, [Validators.required]),
    'nota': new FormControl(null),
    'parere': new FormControl(undefined, [this.validParere]),
    'id_blob': new FormControl(null)
  }, { validators: [this.controlloBlob, this.controlloNote] });
  
  validParere(control: AbstractControl): { [key: string]: boolean } | null {
    if (control.value === undefined) {
      return { 'validParere': true };
    }
    return null;
  }

  controlloParere() {
    let competenzaValue = this.esprimiParereForm.get('competenza').value;

    //trovo l'elemento nell'array parere con il valore null
    let parereND = this.parere.find(x => x.value == null);
    parereND.disabled = competenzaValue ? true : false;

    //resetto il campo parere
    this.esprimiParereForm.get('parere').reset();
    this.esprimiParereForm.get('parere').patchValue(undefined);
  }

  controlloBlob(control: AbstractControl): { [key: string]: boolean } | null {
    if (control.get('competenza').value == true && control.get('id_blob').value == null) {
      return {'controlloBlobRequired': true};
    }
    return null;
  }

  controlloNote(control: AbstractControl): { [key: string]: boolean } | null {
    if (control.get('competenza').value == false && !control.get('nota').value) {
      return {'controlloNoteRequired': true};
    }
    return null;
  }

  onTableEvent(tableEvent: TableEvent) {
    this[tableEvent.actionKey](tableEvent.data);
  }

  getPageTitle(): string {
    return this.authService.getGroup() == Group.IstruttoreMunicipio || this.authService.getGroup() == Group.DirettoreMunicipio ? 'Rielaborazione pareri' : 'Esprimi parere';
  }

  ngOnInit(): void {
    this.resetEsprimiParereForm();
    this.cercaPratiche();
  }

  cercaPratiche() {
    this.showSpinner = true;
    this.passiCarrabiliService.cercaPratichePerStatoPratica(StatoPraticaPassiCarrabili['Richiesta pareri'], this.authService.getMunicipio(), this.authService.getGroup()).subscribe(
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

  setFieldUserType(){
    switch(this.authService.getGroup()) { 
      case Group.PoliziaLocale: { 
        this.fieldUserType = 'parere_polizia';
        break; 
      } 
      case Group.UfficioTecnicoDecentrato: { 
        this.fieldUserType = 'parere_utd';
        break; 
      } 
      case Group.RipartizioneUrbanistica: { 
        this.fieldUserType = 'parere_urbanistica';
        break; 
      } 
    }
  }

  //Esprimi Parere
  esprimiParereDialog(element: any) {
    this.pratica = element;
    this.resetProtocollo();
    this.setFieldUserType();

    if(this.pratica[this.fieldUserType].note){
      this.esprimiParereForm.get('nota').patchValue(this.pratica[this.fieldUserType].note);
    }

    if(this.isRinuncia || this.isRevoca)
      this.esprimiParereForm.get('competenza').patchValue(true);
    
    this.showEsprimiParereDialog = true;
  }

  downloadRelazioneParere() {
    let observable: any;
    let fileName: string = '';

    switch(this.authService.getGroup()) { 
      case Group.PoliziaLocale: { 
        observable = this.utilityService.generaRelazioneServizio(this.pratica);
        fileName = `${this.pratica.id_doc} - Relazione di Servizio.docx`;
        break; 
      } 
      case Group.UfficioTecnicoDecentrato: { 
        observable = this.utilityService.generaIstruttoriaUTD(this.pratica);
        fileName = `${this.pratica.id_doc} - Istruttoria UTD.docx`;
        break; 
      } 
      case Group.RipartizioneUrbanistica: { 
        observable = this.utilityService.generaIstruttoriaUrbanistica(this.pratica);
        fileName = `${this.pratica.id_doc}- Istruttoria Urbanistica.docx`;
        break; 
      } 
    }

    observable.subscribe( 
      data => {
        saveAs(data, fileName);
      },
      err => {
        this.messageService.showMessage('error', 'Generazione template', 'Errore durante la generazione del template');
      }
    );
  }

  setInfoPassaggioStato() {
    switch(this.authService.getGroup()) { 
      case Group.PoliziaLocale: { 
        this.pratica.info_passaggio_stato = PassaggiStato.RichiestaPareriEsprimiParerePolizia;
        break; 
      } 
      case Group.UfficioTecnicoDecentrato: { 
        this.pratica.info_passaggio_stato = PassaggiStato.RichiestaPareriEsprimiParereUTD;
        break; 
      } 
      case Group.RipartizioneUrbanistica: { 
        this.pratica.info_passaggio_stato = PassaggiStato.RichiestaPareriEsprimiParereUrbanistica;
        break; 
      } 
    } 
  }
  
  async esprimiParere() {
    this.showSpinner = true;
    this.uploadedFiles = [];

    var file = null;
    var estensioneFile = null;
    if(this.esprimiParereForm.get('id_blob').value) {
      this.uploadedFiles.push({ id: this.esprimiParereForm.get('id_blob').value });
      file = await this.passiCarrabiliService.getDocumentoSync(this.esprimiParereForm.get('id_blob').value);
      estensioneFile = file.name.substr(file.name.lastIndexOf('.') + 1).toLowerCase();
    }
      
    if(!this.objProtocollo) {
      this.setInfoPassaggioStato();
      this.objProtocollo = this.utilityService.getObjForPdfProtocollo(this.pratica, this.uploadedFiles, this.pratica.info_passaggio_stato);
      
      if(this.uploadedFiles.length == 0) {
        let data: any = await this.utilityService.generaPdfPerProtocolloSync(this.objProtocollo, "templateProtocolloPratica").catch(err => {
          this.actionRiprotocollazione = 'esprimiParere';
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

      this.objTakeEmails = [
        { group_id: Group.IstruttoreMunicipio, municipio_id: this.pratica.dati_istanza.indirizzo_segnale_indicatore.municipio_id },
        { group_id: Group.DirettoreMunicipio, municipio_id: this.pratica.dati_istanza.indirizzo_segnale_indicatore.municipio_id }
      ];

      let callProtocollo: Promise<any> = environment.production ? this.protocolloService.richiestaProtocolloUscitaNewSync(this.objProtocollo, this.objTakeEmails, false, this.base64DocInserimento, [], estensioneFile) 
                                                                : this.passiCarrabiliService.getNumeroProtocolloSync(null);
      respProtocollo = await callProtocollo.catch(err => {
            this.actionRiprotocollazione = 'esprimiParere';
            this.messageService.showMessage('warn', 'Numero protocollo', 'Servizio di protocollo non disponibile. Riprovare più tardi.');
          });
      }

    this.numProtocollo = `${respProtocollo?.numeroProtocollo || '--'}|${respProtocollo?.anno || '--'}`;

    //associazione numero di protocollo ai documenti allegati
    if(this.uploadedFiles && this.uploadedFiles.length && this.numProtocollo != '--|--') {
      this.associaProtocolloADocumento();
    }

    if(this.numProtocollo && this.numProtocollo != '--|--')
      this.esprimiParerePratica();
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

  aggiungiNoteAdIstanza(){
    this.pratica[this.fieldUserType] = {
      // competenza: this.esprimiParereForm.get('competenza').value,
      note: this.esprimiParereForm.get('nota').value,
      // parere: this.esprimiParereForm.get('parere').value,
      // id_blob: this.esprimiParereForm.get('id_blob').value
    }

    // this.pratica.numero_protocollo_comunicazione = null;

    // this.passiCarrabiliService.aggiornaPratica(this.pratica, null, false).subscribe( 
    //   resp => {
    //     this.dataSource = this.dataSource.filter(el => el.id_doc != resp.istanza.id_doc);
    //     this.dataSource.push(resp.istanza);
    //     this.dataSource = [...this.dataSource];
    //   },
    //   err => {
    //     this.messageService.showMessage('error', 'Salvataggio note', err.error.message);
    //   }
    // );   
  }

  esprimiParerePratica(){
    this.pratica.numero_protocollo_comunicazione = this.numProtocollo;
    this.isProtocollata = true;
    this.showProtocolloDialog = false;

    this.pratica[this.fieldUserType] = {
      competenza: this.esprimiParereForm.get('competenza').value,
      note: this.esprimiParereForm.get('nota').value || '--',
      parere: this.esprimiParereForm.get('parere').value,
      id_blob: this.esprimiParereForm.get('id_blob').value
    }

    //notifica agli attori
    let emailsAttori = [];

    this.utilityService.takeEmails(this.objTakeEmails).subscribe( 
      resp => {
        let emails = resp.data.map(x => x.email);
        emailsAttori = emails.filter((item, index) => emails.indexOf(item) === index);

        this.passiCarrabiliService.aggiornaPratica(this.pratica).subscribe( 
          resp => {   
            let subject = this.utilityService.getSubjectEmail(resp.istanza, 'Comunicazione esprimi parere');
            let cc = this.authService.getEmail();
            
            //invio mail Municipio e Attori coinvolti
            if(emailsAttori && emailsAttori.length) {
              let messaggioMunicipio = this.emailService.emailEsprimiParereAttori(resp.istanza);            
              this.emailService.sendEmail(emailsAttori.join(','), cc, subject, messaggioMunicipio);     
            }
            else {
              this.messageService.showMessage('warn', 'Esprimi parere', 'Non sono presenti nel sistema le email degli attori coinvolti',3000);
            }

            this.messageService.showMessage('success', 'Esprimi parere', 'Il parere è stato inviato con successo');
            this.dataSource = this.dataSource.filter(el => el.id_doc != resp.istanza.id_doc);
            this.dataSource = [...this.dataSource];
            this.showEsprimiParereDialog = false;
            this.showSpinner = false;
            this.showProtocolloDialog = true;
          },
          err => {
            this.messageService.showMessage('error', 'Richiesta pareri', err.error.message);
            this.showEsprimiParereDialog = false;
            this.showSpinner = false;
            this.showProtocolloDialog = true;
          }
        );           
      },
      err => {
        this.messageService.showMessage('error', 'Invio email', err.error.message);
        this.showEsprimiParereDialog = false;
        this.showSpinner = false;
        this.showProtocolloDialog = true;
      }
    );
  }

  getIdDocUploaded(id_blob) {

    if (id_blob === undefined) {
      this.esprimiParereForm.get('id_blob').patchValue(null);
    }

    else {
      switch(this.authService.getGroup()) { 
        case Group.PoliziaLocale: { 
           this.esprimiParereForm.get('id_blob').patchValue(id_blob);
           break; 
        } 
        case Group.UfficioTecnicoDecentrato: { 
          this.esprimiParereForm.get('id_blob').patchValue(id_blob);
           break; 
        } 
        case Group.RipartizioneUrbanistica: { 
          this.esprimiParereForm.get('id_blob').patchValue(id_blob);
           break; 
        } 
      } 
    }
  }

  async closeEsprimiPareriDialog(event?) {
    this.showSpinner = true;
    if(event == 'Annulla' && this.esprimiParereForm.get('id_blob').value){
      await this.passiCarrabiliService.deleteDocumentSync(this.esprimiParereForm.get('id_blob').value).then(resp => {
        this.esprimiParereForm.get('id_blob').patchValue(null); 
        this.clearDataEsprimiPareri();
      })
      .catch(err => {
          this.messageService.showMessage('error', 'Upload file', err.error.message ? err.error.message : err.statusText);
        });
    }
    else 
      this.clearDataEsprimiPareri();
  }

  clearDataEsprimiPareri(){
    this.showEsprimiParereDialog = false;
    this.resetEsprimiParereForm();
    this.parere.forEach(el => {
      if(el.value == null)
        el.disabled = true;
    });
    setTimeout(() => { 
      this.cercaPratiche();
    }, 2000); 
  }

  resetEsprimiParereForm(){
    this.esprimiParereForm.reset();
    this.esprimiParereForm.get('parere').patchValue(undefined);
  }

  //Richiedi Pareri
  disabledUlterioriPareri(): boolean {
    let isDisabled = true;
    this.selectedAttori.forEach(x => {
      let el = this.attoriPareriSchema.find(el => el.value == x);
      if (el.disabled == false) 
        isDisabled = false;
    })
    return isDisabled;
  }

  richiediParereDialog(element: any) {
    this.pratica = element;
    this.resetProtocollo();
    this.inserisciAttoriCoinvolti(this.pratica);
    this.showRichiediParereDialog = true;
  }

  inserisciAttoriCoinvolti(pratica) {
    if (pratica.parere_polizia) {
      this.attoriPareriSchema.find(el => el.value == Group.PoliziaLocale).disabled = true;
      this.selectedAttori.push(Group.PoliziaLocale);
    }

    if(this.isRevoca){
      this.attoriPareriSchema.find(el => el.value == Group.UfficioTecnicoDecentrato).disabled = true;
    }
    else { 
      if (pratica.parere_utd) {
        this.attoriPareriSchema.find(el => el.value == Group.UfficioTecnicoDecentrato).disabled = true;
        this.selectedAttori.push(Group.UfficioTecnicoDecentrato);
      }
    }

    if(this.isRinuncia || this.isRevoca){
      this.attoriPareriSchema.find(el => el.value == Group.RipartizioneUrbanistica).disabled = true;
    }
    else {  
      if (pratica.parere_urbanistica) {
        this.attoriPareriSchema.find(el => el.value == Group.RipartizioneUrbanistica).disabled = true;
        this.selectedAttori.push(Group.RipartizioneUrbanistica);
      }
    }
    
    this.selectedAttori = [...this.selectedAttori];
  }

  async inviaRichiestaPareri() {
    this.showSpinner = true;
    this.definizioneDestinatari();

    if(!this.objProtocollo) { 
      this.pratica.info_passaggio_stato = PassaggiStato.RichiestaPareriToRichiestaPareri;
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
      this.nuovoInvioRichiestaPareriPratica();
    else {
      this.showSpinner = false;
      this.showProtocolloDialog = true;
    }
  }

  definizioneDestinatari(){
    let newPareri = this.attoriPareriSchema.filter(el => el.disabled == false).map(el => el.value);
    newPareri = this.selectedAttori.filter(el => newPareri.indexOf(el) > -1);

    if(newPareri.indexOf(Group.PoliziaLocale) != -1) {
      this.pratica.parere_polizia = {
        competenza: null,
        parere: null,
        note: '',
        id_blob: null
      }
    }
    if(newPareri.indexOf(Group.UfficioTecnicoDecentrato) != -1) {
      this.pratica.parere_utd = {
        competenza: null,
        parere: null,
        note: '',
        id_blob: null
      }
    }
    if(newPareri.indexOf(Group.RipartizioneUrbanistica) != -1) {
      this.pratica.parere_urbanistica = {
        competenza: null,
        parere: null,
        note: '',
        id_blob: null
      }
    }

    this.objTakeEmails = [];

    //riempio objTakeEmails con gli attori coinvolti nella richiesta pareri
    newPareri.forEach(el => {
      this.objTakeEmails.push({
        group_id: el,
        municipio_id: null
      });

      if(el == Group.PoliziaLocale) {
        this.objTakeEmails.push({
          group_id: el,
          municipio_id: this.pratica.dati_istanza.indirizzo_segnale_indicatore.municipio_id
        });
      } 
    });

    this.objTakeEmails.push({ group_id: Group.DirettoreMunicipio, municipio_id: this.pratica.dati_istanza.indirizzo_segnale_indicatore.municipio_id });
  }

  nuovoInvioRichiestaPareriPratica() {
    this.pratica.numero_protocollo_comunicazione = this.numProtocollo;
    this.isProtocollata = true;
    this.showProtocolloDialog = false;

    let emailsAttori = [];

    this.utilityService.takeEmails(this.objTakeEmails).subscribe( 
      resp => {
        let emails = resp.data.map(x => x.email);
        emailsAttori = emails.filter((item, index) => emails.indexOf(item) === index);

        this.passiCarrabiliService.aggiornaPratica(this.pratica).subscribe( 
          resp => {   
            let subject = this.utilityService.getSubjectEmail(resp.istanza, 'Comunicazione richiesta pareri');
            let cc = this.authService.getEmail();
            
            //invio mail Municipio e Attori coinvolti
            if(emailsAttori && emailsAttori.length) {
              let messaggioMunicipio = this.emailService.emailRichiestaPareriToAttori(resp.istanza);            
              this.emailService.sendEmail(emailsAttori.join(','), cc, subject, messaggioMunicipio);     
            }
            else {
              this.messageService.showMessage('warn', 'Richiesta pareri', 'Non sono presenti nel sistema le email degli attori coinvolti',3000);
            }

            this.messageService.showMessage('success', 'Richiesta pareri', 'Sono state inoltrate le nuove richieste di parere');          
            this.dataSource = this.dataSource.filter(el => el.id_doc != resp.istanza.id_doc);
            this.dataSource.push(resp.istanza);
            this.dataSource = [...this.dataSource];
            this.showRichiediParereDialog = false;
            this.showSpinner = false;
            this.showProtocolloDialog = true;
          },
          err => {
            this.messageService.showMessage('error', 'Richiesta pareri', err.error.message);
            this.showRichiediParereDialog = false;
            this.showSpinner = false;
            this.showProtocolloDialog = true;
          }
        );           
      },
      err => {
        this.messageService.showMessage('error', 'Invio email', err.error.message);
        this.showRichiediParereDialog = false;
        this.showSpinner = false;
        this.showProtocolloDialog = true;
      }
    );
  }

  closeRichiediPareriDialog() {
    this.showRichiediParereDialog = false;
    this.selectedAttori = [];
    this.attoriPareriSchema.forEach(el => {
      el.disabled = false;
    });
  }

  //Rielabora Pareri
  rielaboraParereDialog(element: any) {
    this.pratica = element;
    this.resetProtocollo();
    // this.isEsente = this.pratica.dichiarazioni_aggiuntive.flag_esenzione;
    this.showRielaboraParereDialog = true;
  }

  inviaRielaboraParere(scelta) {
    this.objTakeEmails = [];
    this.objTakeEmails.push({ group_id: Group.DirettoreMunicipio, municipio_id: this.pratica.dati_istanza.indirizzo_segnale_indicatore.municipio_id });
    
    switch(scelta) {
      //0 = approvata / 1 = integrazione / 2 = rigetta
      case 0: 
        if(this.isRevoca){
          this.pratica.stato_pratica = StatoPraticaPassiCarrabili.Archiviata;
          this.pratica.info_passaggio_stato = PassaggiStato.RichiestaPareriToArchiviata;
          delete this.pratica.data_scadenza_procedimento;

          this.objTakeEmails.push({ group_id: Group.PoliziaLocale, municipio_id: null });
          this.objTakeEmails.push({ group_id: Group.PoliziaLocale, municipio_id: this.pratica.dati_istanza.indirizzo_segnale_indicatore.municipio_id });

          this.avanzamentoPraticaGetProtocollo();
        }
        else {
          this.pratica.stato_pratica = StatoPraticaPassiCarrabili.Approvata;
          this.pratica.info_passaggio_stato = PassaggiStato.RichiestaPareriToApprovata;
          this.avanzamentoPratica();
        }
        break;
      
      case 1:
        if(this.pratica.parere_municipio) {
          this.pratica.parere_municipio.note = this.noteIstruttoreMunicipio
        }
        else {
          this.pratica.parere_municipio = {
            note: this.noteIstruttoreMunicipio
          };
        }

        // if(this.pratica.dichiarazioni_aggiuntive.flag_esenzione && !this.isEsente) {
        //   this.pratica.dichiarazioni_aggiuntive.flag_esenzione = this.isEsente;
        //   this.pratica.dichiarazioni_aggiuntive.motivazione_esenzione = '';
        // }

        if (this.pratica.integrazione_counter == this.utilityService.n_integrazioni_massime) {
          if (this.pratica.diniego == true) {
            this.pratica.stato_pratica = StatoPraticaPassiCarrabili['Pratica da rigettare'];
            this.pratica.info_passaggio_stato = PassaggiStato.RichiestaPareriToPraticaDaRigettare;
            this.avanzamentoPratica();
          }
          else if(this.isRevoca) {
            this.pratica.stato_pratica = StatoPraticaPassiCarrabili['Pratica da revocare']; 
            this.pratica.info_passaggio_stato = PassaggiStato.RichiestaPareriToPraticaDaRevocare;
            this.avanzamentoPratica();
          }
          else {
            this.pratica.stato_pratica = StatoPraticaPassiCarrabili['Preavviso diniego'];
            this.pratica.info_passaggio_stato = PassaggiStato.RichiestaPareriToPreavvisoDiniego;
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
            this.pratica.info_passaggio_stato = PassaggiStato.RichiestaPareriToPraticaDaRigettare;
            this.avanzamentoPratica();
          }
          else {
            this.pratica.stato_pratica = StatoPraticaPassiCarrabili['Necessaria integrazione'];
            this.pratica.info_passaggio_stato = PassaggiStato.RichiestaPareriToNecessariaIntegrazione;
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
        
        if(this.pratica.stato_pratica != StatoPraticaPassiCarrabili['Pratica da rigettare']){
          this.avanzamentoPraticaGetProtocollo();
        }
        break;
      
      case 2:
        if(this.pratica.parere_municipio) {
          this.pratica.parere_municipio.note = this.noteIstruttoreMunicipio
        }
        else {
          this.pratica.parere_municipio = {
            note: this.noteIstruttoreMunicipio
          };
        }

        if (this.pratica.diniego == false && !this.isRinuncia && !this.isRevoca) {
          this.pratica.stato_pratica = StatoPraticaPassiCarrabili['Preavviso diniego'];
          this.pratica.info_passaggio_stato = PassaggiStato.RichiestaPareriToPreavvisoDiniego;
          this.pratica.data_scadenza_diniego = this.utilityService.getDataScadenzaPratica(undefined,10);
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

          this.avanzamentoPraticaGetProtocollo();
        }
        else if(this.isRevoca) {
          this.pratica.stato_pratica = StatoPraticaPassiCarrabili['Pratica da revocare']; 
          this.pratica.info_passaggio_stato = PassaggiStato.RichiestaPareriToPraticaDaRevocare;
          this.avanzamentoPratica();
        }
        else {
          this.pratica.stato_pratica = StatoPraticaPassiCarrabili['Pratica da rigettare'];
          this.pratica.info_passaggio_stato = PassaggiStato.RichiestaPareriToPraticaDaRigettare;
          this.avanzamentoPratica();
        }
        break;
    }
  }

  async avanzamentoPraticaGetProtocollo(){
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
          this.actionRiprotocollazione = 'avanzamentoPraticaGetProtocollo';
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
      this.showSpinner = true;
      respProtocollo = await callProtocollo.catch(err => {
            this.actionRiprotocollazione = 'avanzamentoPraticaGetProtocollo';
            this.messageService.showMessage('warn', 'Numero protocollo', 'Servizio di protocollo non disponibile. Riprovare più tardi.');
          });
    }

    this.numProtocollo = `${respProtocollo?.numeroProtocollo || '--'}|${respProtocollo?.anno || '--'}`;

    //associazione numero di protocollo ai documenti allegati
    if(this.uploadedFiles && this.uploadedFiles.length && this.numProtocollo != '--|--') {
      this.associaProtocolloADocumento();
    }

    if(this.numProtocollo && this.numProtocollo != '--|--')
      this.avanzamentoPratica(file);
    else {
      this.showSpinner = false;
      this.showProtocolloDialog = true;
    }
  }

  avanzamentoPratica(file?) {
    this.pratica.numero_protocollo_comunicazione = this.numProtocollo;
    if(this.numProtocollo && this.numProtocollo != '--|--')
      this.isProtocollata = true;

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
              case StatoPraticaPassiCarrabili.Approvata: 
                subject = this.utilityService.getSubjectEmail(resp.istanza, 'Comunicazione approvazione pratica');
                messaggioCittadino = this.emailService.emailNotificaPraticaApprovataCittadino(resp.istanza); 
                if(emailsAttori && emailsAttori.length) {
                  messaggioAttori = this.emailService.emailNotificaPraticaApprovataAttori(resp.istanza);                 
                }
                else {
                  this.messageService.showMessage('warn', 'Approvazione pratica', 'Non sono presenti referenti del municipio relativo all\'indirizzo inserito',3000);
                }
                break;

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

              case StatoPraticaPassiCarrabili.Archiviata: 
                subject = this.utilityService.getSubjectEmail(resp.istanza, 'Comunicazione annullamento revoca della concessione');
                messaggioCittadino = this.emailService.emailNotificaPraticaRevocaAnnullataCittadino(resp.istanza); 
                if(emailsAttori && emailsAttori.length) {
                  messaggioAttori = this.emailService.emailNotificaPraticaRevocaAnnullataAttori(resp.istanza);                 
                }
                else {
                  this.messageService.showMessage('warn', 'Annullamento revoca concessione', 'Non sono presenti referenti del municipio relativo all\'indirizzo inserito',3000);
                }
                break;
            }//end switch

            if(messaggioCittadino) {
              let objPec = file ? { filename: file.name, path: file.blob, municipio_id: this.authService.getMunicipio() } : { emailCittadino: true, municipio_id: this.authService.getMunicipio() };
              this.emailService.sendEmail(resp.istanza.anagrafica.email, cc, subject, messaggioCittadino, objPec);
            }            

            if(messaggioAttori) 
              this.emailService.sendEmail(emailsAttori.join(','), cc, subject, messaggioAttori);
            
            if (resp.istanza.stato_pratica == StatoPraticaPassiCarrabili.Approvata){
              this.messageService.showMessage('success', 'Approvazione pratica', 'Approvazione della pratica avvenuta con successo');
            }
            else if (resp.istanza.stato_pratica == StatoPraticaPassiCarrabili.Archiviata){
              this.messageService.showMessage('success', 'Annullamento revoca concessione', 'La pratica di revoca è stata annullata con successo');
            }
            else {
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
            }
            
            this.dataSource = this.dataSource.filter(el => el.id_doc != resp.istanza.id_doc);
            this.dataSource = [...this.dataSource];
            this.showRielaboraParereDialog = false;
            this.showSpinner = false;
            if(this.isProtocollata)
              setTimeout(() => {
                this.showProtocolloDialog = true;
              }, 100);
          },
          err => {
            this.messageService.showMessage('error', 'Errore integrazione pratica' , err.error.message);
            this.showRielaboraParereDialog = false;
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
        this.showRielaboraParereDialog = false;
        this.showSpinner = false;
        if(this.isProtocollata)
          setTimeout(() => {
            this.showProtocolloDialog = true;
          }, 100);
      }
    );
  }

  async closeRielaboraParereDialog(event?) {
    this.showSpinner = true;
    if(event == 'Annulla' && this.doc_richiesta_integrazione_diniego.id_blob){
      await this.passiCarrabiliService.deleteDocumentSync(this.doc_richiesta_integrazione_diniego.id_blob).then(resp => {
        this.doc_richiesta_integrazione_diniego.id_blob = '';
        this.clearDataRielaboraParere();
      })
      .catch(err => {
          this.messageService.showMessage('error', 'Upload file', err.error.message ? err.error.message : err.statusText);
        });
    }
    else
      this.clearDataRielaboraParere();
  }

  clearDataRielaboraParere(){
    this.showRielaboraParereDialog = false;
    this.indexRielabora = 0;
    this.noteIstruttoreMunicipio = '';
    this.selectedAttori = [];
    setTimeout(() => { 
      this.cercaPratiche();
    }, 2000);
  }

  generaDetermina() {
    this.utilityService.generaDetermina(this.pratica).subscribe( 
      data => {
        saveAs(data, this.utilityService.getDeterminaName(this.pratica));
      },
      err => {
        this.messageService.showMessage('error', 'Generazione determina', 'Errore durante la generazione della determina');
      }
    );
  }

  closeProtocolloDialog(event?) {
    this.showProtocolloDialog = false;
    this.numProtocollo = '';
    this.actionRiprotocollazione = '';
  }

  // annullamentoEsenzione(){
  //   this.messageService.showMessage('success', 'Esenzione pagamento', 'Annullamento esenzione marca da bollo');
  // }

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
