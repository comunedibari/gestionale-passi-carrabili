import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { AuthService } from 'src/app/shared/service/auth.service';
import { PassiCarrabiliService } from 'src/app/shared/service/passi.carrabili.service';
import { DialogService } from 'primeng/dynamicdialog';
import { TableEvent } from 'src/app/shared/table-prime-ng/models/TableEvent';
import { MessageService } from '../../shared/service/message.service';
import { Group } from 'src/app/shared/enums/Group.enum';
import { StatoSegnalazione } from 'src/app/shared/enums/StatoSegnalazione.enum';
import { DettaglioPraticaComponent } from '../dettaglio-pratica/dettaglio-pratica.component';
import { UtilityService } from 'src/app/shared/service/utility.service';

@Component({
  selector: 'app-segnalazioni',
  templateUrl: './segnalazioni.component.html',
  styleUrls: ['./segnalazioni.component.css']
})
export class SegnalazioniComponent implements OnInit {

  showSpinner: boolean = false;
  dataSource: any[];
  segnalazione: any = null;
  dettaglioSegnalazione: any = null;
  hidePositionOnMap: boolean = true;

  showDettaglioSegnalazioneDialog: boolean = false;
  dettaglioPraticaForm: any;
  isDettaglioSegnalazione: boolean = false;
  acceptedImageExtensions: string = '.jpeg,.jpg,.png';
  showImageProgressBar: boolean = false;
  note_conclusive: string = '';
  showChiudiSegnalazioneDialog: boolean = false;

  initSortColumn = 'segnalazioni.dataInserimento';
  directionSortColumn = "-1"; //1=asc  0=rand   -1=desc 
  titleTable: string = 'Lista segnalazioni';
  exportName = 'Segnalazioni';
  globalFilters: any[] = [
    {value:'segnalazioni.indirizzo_segnale_indicatore.indirizzo',label:'Indirizzo'}
  ];

  columnSchema = [
    {
      field: "segnalazioni.nome",
      header: "Nome",
      type: "text"
    },
    {
      field: "segnalazioni.cognome",
      header: "Cognome",
      type: "text"
    },
    {
      field: "segnalazioni.ragione_sociale",
      header: "Ragione sociale",
      type: "text"
    },
    {
      field: "segnalazioni.indirizzo_segnale_indicatore.indirizzo",
      header: "Indirizzo",
      type: "text",
      inactive: true
    },
    {
      field: "segnalazioni.idTag",
      header: "Tag RFID",
      type:"text"
    },
    {
      field: "stato_segnalazione",
      header: "Stato",
      type: "dropdown",
      show: (el) => {
        return StatoSegnalazione[el];
      }
    },
    {
      field: "segnalazioni.dataInserimento",
      header: "Data inserimento",
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
      key: 'prendiInCarico',
      icon: "pi pi-sign-in",
      tooltip: 'PRENDI IN CARICO',
      hidden: (el) => {
        return (this.authService.getGroup() != Group.OperatoreSportello 
          && this.authService.getGroup() != Group.IstruttoreMunicipio
          && this.authService.getGroup() != Group.PoliziaLocale)
          || el.stato_segnalazione != StatoSegnalazione.Inserita;
      }
    },
    {
      key: 'chiudiSegnalazione',
      icon: "pi pi-check",
      tooltip: 'CHIUDI SEGNALAZIONE',
      hidden: (el) => {
        return (this.authService.getGroup() != Group.OperatoreSportello 
          && this.authService.getGroup() != Group.IstruttoreMunicipio
          && this.authService.getGroup() != Group.PoliziaLocale)
          || el.stato_segnalazione != StatoSegnalazione['In lavorazione'];
      }
    }
  ];

  onTableEvent(tableEvent: TableEvent) {
    this[tableEvent.actionKey](tableEvent.data);
  }

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService,
    private passiCarrabiliService: PassiCarrabiliService,
    private utilityService: UtilityService,
    public confirmationService: ConfirmationService,
    public authService: AuthService,
    public dialogService: DialogService,
  ) { }

  ngOnInit(): void {
    this.cercaPratiche();
  }

  cercaPratiche(){
    this.showSpinner = true;
    this.passiCarrabiliService.getSegnalazioni(this.authService.getMunicipio()).subscribe(
      data => {
        this.showSpinner = false;
        this.dataSource = data.data;
      },
      err => {
        this.showSpinner = false;
        this.messageService.showMessage('error', 'Segnalazioni', 'Errore durante il ritrovamento delle pratiche');
      }
    );
  }

  get currElement(){
    return { 0: this.segnalazione };
  }

  get isSegnalazioneConclusa() {
    return this.dettaglioSegnalazione && this.dettaglioSegnalazione.stato_segnalazione == StatoSegnalazione.Conclusa ? true : false;
  }

  dettaglioPratica(element: any) {
    this.showSpinner = true;
    this.passiCarrabiliService.getSegnalazione(element.id_doc).subscribe(
      data => {
        this.dettaglioSegnalazione = data.segnalazione;
      
        this.dettaglioPraticaForm = this.fb.group({
          nome: [this.dettaglioSegnalazione.segnalazioni.nome],
          cognome: [this.dettaglioSegnalazione.segnalazioni.cognome],
          ragione_sociale: [this.dettaglioSegnalazione.segnalazioni.ragione_sociale],
          indirizzo_segnale_indicatore: [this.dettaglioSegnalazione.segnalazioni.indirizzo_segnale_indicatore.indirizzo],
          recapito_telefonico: [this.dettaglioSegnalazione.segnalazioni.telefono],
          email: [this.dettaglioSegnalazione.segnalazioni.email],
          data_inserimento: [new Date(this.dettaglioSegnalazione.segnalazioni.dataInserimento)],
          tag_rfid: [this.dettaglioSegnalazione.segnalazioni.idTag],
          note: [this.dettaglioSegnalazione.segnalazioni.note],
          utente: [this.dettaglioSegnalazione.last_modification.utente],
          blob: [this.dettaglioSegnalazione.segnalazioni.blob],
          note_conclusive: [this.dettaglioSegnalazione.segnalazioni.note_conclusive],
          data_chiusura: [this.dettaglioSegnalazione.segnalazioni.info_chiusura_segnalazione?.data_operazione ? new Date(this.dettaglioSegnalazione.segnalazioni.info_chiusura_segnalazione.data_operazione) : null],
          utente_chiusura: [this.dettaglioSegnalazione.segnalazioni.info_chiusura_segnalazione?.utente],
        });
    
        this.segnalazione = {
          anagrafica: {
            nome: this.dettaglioSegnalazione.segnalazioni.nome,
            cognome: this.dettaglioSegnalazione.segnalazioni.cognome,
            ragione_sociale: this.dettaglioSegnalazione.segnalazioni.ragione_sociale,
          },
          dati_istanza: {
            indirizzo_segnale_indicatore: this.dettaglioSegnalazione.segnalazioni.indirizzo_segnale_indicatore
          },
          id_doc : this.dettaglioSegnalazione?.result?.id_doc || 'N.D.'
        };
    
        this.isDettaglioSegnalazione = this.dettaglioSegnalazione?.result?.id_doc ? true : false;
    
        this.showSpinner = false;
        this.showDettaglioSegnalazioneDialog = true;       
      },
      err => {
        this.showSpinner = false;
        this.messageService.showMessage('error', 'Segnalazioni', 'Errore durante il ritrovamento della segnalazione');
      }
    );
  }


  prendiInCarico(element: any){
    this.confirmationService.confirm({
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Conferma",
      rejectLabel: "Annulla",
      acceptButtonStyleClass: "btn-custom-style btn-dialog-confirm",
      rejectButtonStyleClass: "btn-custom-style btn-dialog-confirm",
      header: "Presa in carico",
      message: "Confermi di voler prendere in carico la segnalazione?",
      accept: () => {       
        this.showSpinner = true;
        this.dettaglioSegnalazione = element;

        this.passiCarrabiliService.getSegnalazione(this.dettaglioSegnalazione.id_doc).subscribe(
          data => {
            this.dettaglioSegnalazione.segnalazioni.blob = data.segnalazione.segnalazioni.blob;
          
            this.dettaglioSegnalazione.stato_segnalazione = StatoSegnalazione['In lavorazione'];
            this.passiCarrabiliService.aggiornaSegnalazione(this.dettaglioSegnalazione).subscribe(
              data => {
                setTimeout(() => {
                  this.cercaPratiche();
                }, 1000);
                this.messageService.showMessage('success', 'Presa in carico', 'La segnalazione è stata presa in carico');
              },
              err => {
                this.showSpinner = false;
                this.messageService.showMessage('error', 'Segnalazioni', 'Errore durante il ritrovamento della segnalazione');
              }
            );
          },
          err => {
            this.showSpinner = false;
            this.messageService.showMessage('error', 'Segnalazioni', 'Errore durante il ritrovamento della segnalazione');
          }
        );
      }
    });
  }

  chiudiSegnalazione(element: any){
    this.note_conclusive = '';
    this.dettaglioSegnalazione = element;
    this.showChiudiSegnalazioneDialog = true;
  }

  confermaChiudiSegnalazione(element: any) {
    this.confirmationService.confirm({
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Conferma",
      rejectLabel: "Annulla",
      acceptButtonStyleClass: "btn-custom-style btn-dialog-confirm",
      rejectButtonStyleClass: "btn-custom-style btn-dialog-confirm",
      header: "Chiudi segnalazione",
      message: "Confermi di aver concluso di gestire la segnalazione?",
      accept: () => {
        this.showSpinner = true;
        this.dettaglioSegnalazione = element;
        this.dettaglioSegnalazione.segnalazioni.note_conclusive = this.note_conclusive;
        this.dettaglioSegnalazione.segnalazioni.info_chiusura_segnalazione = {
          username: this.authService.getUsername(),
          utente: this.authService.getInfoUtente(),
          data_operazione: null
        };

        this.passiCarrabiliService.getSegnalazione(this.dettaglioSegnalazione.id_doc).subscribe(
          data => {
            this.dettaglioSegnalazione.segnalazioni.blob = data.segnalazione.segnalazioni.blob;
          
            this.dettaglioSegnalazione.stato_segnalazione = StatoSegnalazione.Conclusa;
            this.passiCarrabiliService.aggiornaSegnalazione( this.dettaglioSegnalazione).subscribe(
              data => {
                this.showChiudiSegnalazioneDialog = false;           
                setTimeout(() => {
                  this.cercaPratiche();
                }, 1000);
                this.messageService.showMessage('success', 'Chiudi segnalazione', 'La segnalazione è stata conclusa');
              },
              err => {
                this.showChiudiSegnalazioneDialog = false;
                this.showSpinner = false;
                this.messageService.showMessage('error', 'Segnalazioni', 'Errore durante il ritrovamento della segnalazione');
              }
            );
          },
          err => {
            this.showChiudiSegnalazioneDialog = false;
            this.showSpinner = false;
            this.messageService.showMessage('error', 'Segnalazioni', 'Errore durante il ritrovamento della segnalazione');
          }
        );
      }
    });
  }

  closeDettaglioSegnalazioneDialog(){
    this.showDettaglioSegnalazioneDialog = false;
    this.dettaglioPraticaForm.reset();
    this.hidePositionOnMap = true;
    this.segnalazione = null;
  }

  closeChiudiSegnalazioneDialog(){
    this.showChiudiSegnalazioneDialog = false;
    this.note_conclusive = '';
  }

  dettaglioFeature(element){
    this.showSpinner = true;
    this.passiCarrabiliService.cercaPratica(element.id).subscribe( pratica => {                  
      this.showSpinner = false;
      this.dialogService.open(DettaglioPraticaComponent,  this.utilityService.configDynamicDialogFullScreen(pratica, "Pratica cittadino"));
    },
    err => {
      this.showSpinner = false;
      this.messageService.showMessage('error','Dettaglio pratica', 'Errore durante il recupero della pratica'); 
    });
  }

  async uploadImageFile(event) {
    this.showImageProgressBar = true; 
    let files = event.target.files;
    if (files.length > 0) {
      let extensionFile = files[0].name.substr(files[0].name.lastIndexOf('.') + 1);
    
      if(this.acceptedImageExtensions.indexOf(extensionFile) == -1){     
        this.dettaglioPraticaForm.get('blob').patchValue('');
        this.showImageProgressBar = false; 
        this.messageService.showMessage('error', 'Segnalazione', 'Formato file non consentito');
      }
      else {
        let base64: string = <string>(await this.utilityService.convertFileToBase64(files[0]));
        base64 = base64.startsWith('data:image/jpeg') ? base64.replace('data:image/jpeg;base64,', '')
                                                    : base64.replace('data:image/png;base64,', '');

        this.dettaglioSegnalazione.segnalazioni.blob = base64;
        this.passiCarrabiliService.aggiornaSegnalazione(this.dettaglioSegnalazione).subscribe(
          data => {
            this.dettaglioPraticaForm.get('blob').patchValue(base64);
            this.showImageProgressBar = false; 
            this.messageService.showMessage('success', 'Segnalazione', 'Immagine salvata correttamente');
          },
          err => {
            this.showSpinner = false;
            this.messageService.showMessage('error', 'Segnalazione', 'Errore durante il salvataggio della foto');
          }
        );     
      }
    }
  }

}
