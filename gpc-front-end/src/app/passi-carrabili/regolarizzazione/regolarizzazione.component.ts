import { Component, OnInit, ViewChild } from '@angular/core';
import { MessageService } from '../../shared/service/message.service';
import { Group } from '../../shared/enums/Group.enum';
import { TableEvent } from '../../shared/table-prime-ng/models/TableEvent';
import { UtilityService } from '../../shared/service/utility.service';
import { AuthService } from '../../shared/service/auth.service';
import { DialogService } from 'primeng/dynamicdialog';
import { ConfirmationService } from 'primeng/api';
import { PassiCarrabiliService } from 'src/app/shared/service/passi.carrabili.service';
import { AbstractControl, FormBuilder, Validators } from '@angular/forms';
import { map } from 'rxjs/operators';
import { EmailService } from 'src/app/shared/service/email.service';
import { environment } from '../../../environments/environment';
import { ProtocolloService } from 'src/app/shared/service/protocollo.service';
import { StatoPraticaPassiCarrabili } from '../../shared/enums/StatoPratica.enum';
import { PassaggiStato } from 'src/app/shared/enums/PassaggiStato.enum';

@Component({
  selector: 'app-regolarizzazione',
  templateUrl: './regolarizzazione.component.html',
  styleUrls: ['./regolarizzazione.component.css']
})
export class RegolarizzazioneComponent implements OnInit {

  constructor(
    private passiCarrabiliService: PassiCarrabiliService,
    private protocolloService: ProtocolloService,
    private fb: FormBuilder,
    private utilityService: UtilityService,
    private authService: AuthService,
    private emailService: EmailService,
    private messageService: MessageService,
    public dialogService: DialogService,
    public confirmationService: ConfirmationService
    ) { }

  objTakeEmails: any[] = [];
  showInserisciSegnalazioneDialog: boolean = false;
  nuova_segnalazione: any = {
    id_doc: null,
    nome: '',
    cognome: '',
    recapito_telefonico: '',
    email: '',
    indirizzo_segnale_indicatore: {
      indirizzo: '',
      location: {
        lat: null,
        lon: null
      },
      municipio_id: null,
      localita: ''
    },
    regolarizzazione_notificata: false,
    notifiche_attive: true,
    relazione_servizio: {
      blob: '',
      name: ''
    }
  };

  inserisciPraticaForm = this.fb.group({
    nome: ['', [Validators.required]],
    cognome: ['', [Validators.required]],
    indirizzo_segnale_indicatore: [null, [Validators.required, this.objectControl]],
    recapito_telefonico: ['', [Validators.minLength(9), Validators.maxLength(10)]],
    email: ['', [Validators.email, Validators.pattern('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,4}$')]],
    relazione_servizio: ['']
  });

  objectControl(control: AbstractControl): { [key: string]: boolean } | null {
    if (typeof control.value !== 'object') {
      return { 'objectControl': true };
    }
    return null;
  }

  isNotValid(key: string) {
    return this.inserisciPraticaForm.get(key)?.dirty
      && this.inserisciPraticaForm.get(key)?.touched
      && !this.inserisciPraticaForm.get(key)?.valid ? true : false;
  }

  @ViewChild("fp") fp: any;
  acceptedExtensions: string = '.pdf';
  showProtocolloDialog: boolean = false;
  numProtocollo: string = '';
  isProtocollata: boolean = false;
  actionRiprotocollazione: string = '';
  base64DocInserimento: string = '';
  objProtocollo: any = null;

  showSpinner: boolean = false;
  dataSource: any[];

  initSortColumn = 'last_modification.data_operazione';
  directionSortColumn = "-1"; //1=asc  0=rand   -1=desc 
  titleTable: string = 'Pratiche da regolarizzare';
  exportName = 'Pratiche da regolarizzare'; 
  globalFilters: any[] = [
    {value:'nome', label:'Nome'},
    {value:'cognome', label:'Cognome'},
    {value:'indirizzo_segnale_indicatore.indirizzo',label:'Indirizzo'},
  ];
  inserisciFeature: string = '';
  
  columnSchema = [
    {
      field: "nome",
      header: "Nome",
      type:"text"
    },
    {
      field: "cognome",
      header: "Cognome",
      type:"text"
    },
    {
      field: "indirizzo_segnale_indicatore.indirizzo",
      header: "Indirizzo",
      type: "text",
      inactive: true
    },
    {
      field: "email",
      header: "Email",
      type:"text"
    },
    {
      field: "recapito_telefonico",
      header: "Telefono",
      type:"text"
    },
    {
      field: "data_scadenza_regolarizzazione",
      header: "Scadenza regolarizzazione",
      type: "date",
      pipe: "onlyDate"
    },
    {
      field: "numero_protocollo",
      header: "Num. Protocollo",
      type:"text"
    },
    {
      field: "last_modification.data_operazione",
      header: "Data inserimento",
      type: "date",
      pipe: "date"
    }
  ];

  actions = [
    {
      key: "downloadDocDialog",
      icon: "pi pi-download",
      tooltip: "DOWNLOAD RELAZIONE DI SERVIZIO",
      disabled: (el) => {
        return !el.relazione_servizio.name;
      }
    },
    {
      key: "sendNotificaRegolarizzazioneDialog",
      icon: "pi pi-send",
      tooltip: "COMUNICAZIONE REGOLARIZZAZIONE",
      hidden: (el) => {
        return this.authService.getGroup() != Group.DirettoreMunicipio 
          && this.authService.getGroup() != Group.IstruttoreMunicipio
          || !el.email;
      },
      disabled: (el) => {
        return el.regolarizzazione_notificata == true;
      }
    },
    {
      key: "checkNotificaRegolarizzazioneDialog",
      icon: "pi pi-check-circle",
      tooltip: "COMUNICAZIONE REGOLARIZZAZIONE INVIATA",
      hidden: (el) => {
        return this.authService.getGroup() != Group.DirettoreMunicipio 
          && this.authService.getGroup() != Group.IstruttoreMunicipio
          || el.email;
      },
      disabled: (el) => {
        return el.regolarizzazione_notificata == true;
      }
    },
    {
      key: "disattivaNotificheRegolarizzazioneDialog",
      icon: "pi pi-calendar-times",
      tooltip: "DISATTIVA NOTIFICHE",
      hidden: (el) => {
        return this.authService.getGroup() != Group.DirettoreMunicipio 
          && this.authService.getGroup() != Group.IstruttoreMunicipio;
      },
      disabled: (el) => {
        return el.notifiche_attive == false;
      }
    } 
  ];

  onTableEvent(tableEvent: TableEvent) {
    this[tableEvent.actionKey](tableEvent.data);
  }

  ngOnInit(): void {
    this.showSpinner = true;
    if(this.authService.getGroup() == Group.PoliziaLocale)
      this.inserisciFeature = 'inserisciSegnalazione';
    this.cercaSegnalazioniRegolarizzazione();
  }

  cercaSegnalazioniRegolarizzazione() {
    this.showSpinner = true;
    this.passiCarrabiliService.cercaSegnalazioniRegolarizzazione(this.authService.getMunicipio()).subscribe(
      data => {
        this.showSpinner = false;
        this.dataSource = data.data;
      },
      err => {
        this.showSpinner = false;
        this.messageService.showMessage('error','Ricerca pratiche', "Errore durante il ritrovamento delle pratiche"); 
      });
  }

  inserisciSegnalazione(){
    this.showInserisciSegnalazioneDialog = true;
  }

  closeInserisciSegnalazioneDialog(event?: any){
    this.showInserisciSegnalazioneDialog = false;
    this.reset();
  }

  async uploadFiles() {
    this.showSpinner = true;

    let file = this.fp.files[0];
    let extensionFile = file.name.substr(file.name.lastIndexOf('.') + 1);
    if(this.acceptedExtensions.indexOf(extensionFile) != -1) {
      this.nuova_segnalazione.relazione_servizio.blob = await this.utilityService.convertFileToBase64(file);
      this.nuova_segnalazione.relazione_servizio.name = file.name;   
      this.inserisciPraticaForm.get('relazione_servizio').patchValue(file.name);        
    }

    this.fp.clear();
    this.showSpinner = false;
  }

  inserisciSegnalazioneRegolarizzazione(){
    let obj = this.inserisciPraticaForm.value;

    this.nuova_segnalazione.id_doc = `${obj.indirizzo_segnale_indicatore.location.lat}_${obj.indirizzo_segnale_indicatore.location.lon}`;
    this.nuova_segnalazione.nome = obj.nome;
    this.nuova_segnalazione.cognome = obj.cognome;
    this.nuova_segnalazione.recapito_telefonico = obj.recapito_telefonico;
    this.nuova_segnalazione.email = obj.email;
    this.nuova_segnalazione.indirizzo_segnale_indicatore = obj.indirizzo_segnale_indicatore;

    this.resetProtocollo();
    this.submitInserimentoSegnalazioneRegolarizzazioneGetProtocollo();
  }

  async submitInserimentoSegnalazioneRegolarizzazioneGetProtocollo(){
    this.showSpinner = true;

    if(!this.objProtocollo) {
      this.nuova_segnalazione.stato_pratica = StatoPraticaPassiCarrabili.Regolarizzazione;
      this.nuova_segnalazione.info_passaggio_stato = PassaggiStato.Regolarizzazione;
      this.objProtocollo = this.utilityService.getObjForPdfProtocollo(this.nuova_segnalazione, [], this.nuova_segnalazione.info_passaggio_stato);

      if(this.nuova_segnalazione?.relazione_servizio?.blob){
        this.base64DocInserimento = this.nuova_segnalazione.relazione_servizio.blob.replace('data:application/pdf;base64,','');
      }
      else { 
        let data: any = await this.utilityService.generaPdfPerProtocolloSync(this.objProtocollo, "templateProtocolloPratica").catch(err => {
          this.actionRiprotocollazione = 'submitInserimentoSegnalazioneRegolarizzazioneGetProtocollo';
          this.objProtocollo = null;
          this.messageService.showMessage('warn', 'Generazione template', 'Errore durante la generazione del documento principale per il protocollo. Riprovare più tardi.');
        });

        if(data) {
          this.base64DocInserimento = (await this.utilityService.convertFileToBase64(data)).toString();      
        }
      }
    }

    var respProtocollo: any = null;
    if(this.base64DocInserimento) {

      this.objTakeEmails = [];
      if(this.authService.getGroup() == Group.PoliziaLocale){
        this.objTakeEmails = [
          { group_id: Group.DirettoreMunicipio, municipio_id: this.nuova_segnalazione.indirizzo_segnale_indicatore.municipio_id },
          { group_id: Group.IstruttoreMunicipio, municipio_id: this.nuova_segnalazione.indirizzo_segnale_indicatore.municipio_id }
        ];
      }
      else if(this.authService.getGroup() == Group.DirettoreMunicipio) {
        this.objTakeEmails = [
          { group_id: Group.IstruttoreMunicipio, municipio_id: this.nuova_segnalazione.indirizzo_segnale_indicatore.municipio_id }
        ];
      }
      else {
        this.objTakeEmails = [
          { group_id: Group.DirettoreMunicipio, municipio_id: this.nuova_segnalazione.indirizzo_segnale_indicatore.municipio_id }
        ];
      }

      let callProtocollo: Promise<any> = environment.production ? this.protocolloService.richiestaProtocolloUscitaNewSync(this.objProtocollo, this.objTakeEmails, false, this.base64DocInserimento, []) 
                                : this.passiCarrabiliService.getNumeroProtocolloSync(null);

      respProtocollo = await callProtocollo.catch(err => {
          this.actionRiprotocollazione = 'submitInserimentoSegnalazioneRegolarizzazioneGetProtocollo';
          this.messageService.showMessage('warn', 'Numero protocollo', 'Servizio di protocollo non disponibile. Riprovare più tardi.');
        });
    }

    this.numProtocollo = `${respProtocollo?.numeroProtocollo || '--'}|${respProtocollo?.anno || '--'}`;

    if(this.numProtocollo && this.numProtocollo != '--|--')
      this.submitInserimentoSegnalazioneRegolarizzazione();
    else {
      this.showSpinner = false;
      this.showProtocolloDialog = true;
    }
  }

  submitInserimentoSegnalazioneRegolarizzazione(){
    this.nuova_segnalazione.numero_protocollo = this.numProtocollo;
    this.isProtocollata = true;
    this.showProtocolloDialog = false;

    let emailsMunicipio = [];
    this.utilityService.takeEmails(this.objTakeEmails).subscribe(
      resp => {
        let emails = resp.data.map(x => x.email);
        emailsMunicipio = emails.filter((item, index) => emails.indexOf(item) === index);

        this.passiCarrabiliService.inserimentoSegnalazioniRegolarizzazione(this.nuova_segnalazione).subscribe(response => {  
          delete response.istanza.relazione_servizio.blob;

          let subject = this.utilityService.getSubjectEmail(response.istanza, 'Comunicazione inserimento segnalazione regolarizzazione');
          let cc = this.authService.getEmail();
          let messaggioMunicipio = this.emailService.emailAvvioPraticaRegolarizzazione(response.istanza);   

          if (emailsMunicipio && emailsMunicipio.length) {
            this.emailService.sendEmail(emailsMunicipio.join(','), cc, subject, messaggioMunicipio);
          }
          else {
            this.messageService.showMessage('warn', 'Inserisci segnalazione', 'Non sono presenti referenti del municipio relativo all\'indirizzo inserito');
          }
          
          this.dataSource.push(response.istanza);
          this.dataSource = [...this.dataSource];  

          this.messageService.showMessage('success','Segnalazione regolarizzazione',response.message);
          this.showSpinner = false;
          this.showProtocolloDialog = true;
          // this.closeInserisciSegnalazioneDialog();
        },
        err => {
          this.messageService.showMessage('error','Segnalazione regolarizzazione', err.error.message);
          this.showSpinner = false;
          this.showProtocolloDialog = false;
        });

      },
      err => {
        this.messageService.showMessage('error', 'Invio email', err.error.message);
        this.showSpinner = false;
        this.showProtocolloDialog = false;
      }
    );
  }

  reset(){
    this.inserisciPraticaForm.reset();
    this.nuova_segnalazione = {
      id_doc: null,
      nome: '',
      cognome: '',
      recapito_telefonico: '',
      email: '',
      indirizzo_segnale_indicatore: {
        indirizzo: '',
        location: {
          lat: null,
          lon: null
        },
        municipio_id: null,
        localita: ''
      },
      regolarizzazione_notificata: false,
      notifiche_attive: true,
      relazione_servizio: {
        blob: '',
        name: ''
      }
    };
  }

  downloadDocDialog(element){
    this.passiCarrabiliService.getRelazioneServizioRegolarizzazione(element.id_doc).subscribe(file => {
      saveAs(file.blob, file.name);
    },
    err => {
      this.messageService.showMessage('error', 'Download file', err.error.message);
    });
  }

  sendNotificaRegolarizzazioneDialog(element){
    this.confirmationService.confirm({
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Conferma",
      rejectLabel: "Annulla",
      acceptButtonStyleClass: "btn-custom-style btn-dialog-confirm",
      rejectButtonStyleClass: "btn-custom-style btn-dialog-confirm",
      header: "Comunica regolarizzazione",
      message: `Confermi di voler inviare la comunicazione di regolarizzazione al cittadino?`,
      accept: () => {
        this.passiCarrabiliService.notificaRegolarizzazioneInviata(element.id_doc).subscribe(response => {
          element.data_scadenza_regolarizzazione = response.data_scadenza_regolarizzazione;
          element.regolarizzazione_notificata = true;

          let subject = this.utilityService.getSubjectEmail(element, 'Comunicazione di necessaria regolarizzazione');
          let cc = this.authService.getEmail();
          let messaggioCittadino = this.emailService.emailAvvioPraticaRegolarizzazioneCittadino(element);   
          this.emailService.sendEmail(element.email, cc, subject, messaggioCittadino, { emailCittadino: true, municipio_id: this.authService.getMunicipio() });

          this.dataSource = this.dataSource.filter(el => el.id_doc != element.id_doc);
          this.dataSource.push(element);
          this.dataSource = [...this.dataSource];
          this.messageService.showMessage('success','Comunicazione regolarizzazione',response.message);
        },
        err => {
          this.messageService.showMessage('error', 'Comunicazione regolarizzazione', err.error.message);
        });
      }
    });
  }

  checkNotificaRegolarizzazioneDialog(element){
    this.confirmationService.confirm({
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Conferma",
      rejectLabel: "Annulla",
      acceptButtonStyleClass: "btn-custom-style btn-dialog-confirm",
      rejectButtonStyleClass: "btn-custom-style btn-dialog-confirm",
      header: "Comunicazione regolarizzazione inviata",
      message: `Confermi di aver inviato la comunicazione di regolarizzazione al cittadino?`,
      accept: () => {
        this.passiCarrabiliService.notificaRegolarizzazioneInviata(element.id_doc).subscribe(response => {
          element.data_scadenza_regolarizzazione = response.data_scadenza_regolarizzazione;
          element.regolarizzazione_notificata = true;
          this.dataSource = this.dataSource.filter(el => el.id_doc != element.id_doc);
          this.dataSource.push(element);
          this.dataSource = [...this.dataSource];
          this.messageService.showMessage('success','Comunicazione regolarizzazione',response.message);
        },
        err => {
          this.messageService.showMessage('error', 'Comunicazione regolarizzazione', err.error.message);
        });
      }
    });
  }

  disattivaNotificheRegolarizzazioneDialog(element){
    this.confirmationService.confirm({
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Conferma",
      rejectLabel: "Annulla",
      acceptButtonStyleClass: "btn-custom-style btn-dialog-confirm",
      rejectButtonStyleClass: "btn-custom-style btn-dialog-confirm",
      header: "Disattiva notifiche",
      message: `Confermi di voler disattivare le notifiche dello scadenziario per la pratica corrente?`,
      accept: () => {
        this.passiCarrabiliService.disattivaNotificaScadenziarioRegolarizzazione(element.id_doc).subscribe(response => {
          element.notifiche_attive = false;
          this.dataSource = this.dataSource.filter(el => el.id_doc != element.id_doc);
          this.dataSource.push(element);
          this.dataSource = [...this.dataSource];
          this.messageService.showMessage('success','Disattiva notifica',response.message);
        },
        err => {
          this.messageService.showMessage('error', 'Disattiva notifica', err.error.message);
        });
      }
    });
  }

  //Autocomplete civico
  civilarioResults: any[];

  searchCivilario(event) {
    return this.utilityService.civico(event.query)
      .pipe(map(response => response))
      .toPromise()
      .then(data => {
        this.civilarioResults = data.map(
          dato => {
            return {
              indirizzo: this.addressListFormatter(dato),
              location: { lat: dato.lat, lon: dato.lon },
              municipio_id: dato.municipio ? parseInt(dato.municipio.replace(/\D/g, '')) : null,
              localita: dato.localita
            }
          });
      });
  }

  addressListFormatter(data: any) {
    return data ? (data.nome_via || '--') + ', ' + (data.numero || '--') + (data.esponente ? `/${data.esponente}` : '') + ' (' + data.municipio + ')' + (data.localita ? ` - ${data.localita}` : '') : '';
  }

  closeProtocolloDialog(event?) {
    this.showProtocolloDialog = false;
    this.numProtocollo = '';
    this.actionRiprotocollazione = '';
  }

  resetProtocollo() {
    this.objProtocollo = null;
    this.isProtocollata = false;
    this.base64DocInserimento = '';
  }
}
