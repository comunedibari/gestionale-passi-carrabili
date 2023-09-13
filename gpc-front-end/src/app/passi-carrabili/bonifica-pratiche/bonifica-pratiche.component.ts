import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, Validators } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { map } from 'rxjs/operators';
import { Fabbricato } from 'src/app/shared/enums/Fabbricato.enum';
import { ProprietaImmobile } from 'src/app/shared/enums/ProprietaImmobile.enum';
import { TipologiaPratica } from 'src/app/shared/enums/TipologiaPratica.enum';
import { AuthService } from 'src/app/shared/service/auth.service';
import { PassiCarrabiliService } from 'src/app/shared/service/passi.carrabili.service';
import { UtilityService } from 'src/app/shared/service/utility.service';
import { TableEvent } from 'src/app/shared/table-prime-ng/models/TableEvent';
import { MessageService } from '../../shared/service/message.service';
import { TitoloAutorizzativo } from 'src/app/shared/enums/TitoloAutorizzativo.enum';
import { DettaglioPraticaComponent } from '../dettaglio-pratica/dettaglio-pratica.component';
import { DialogService } from 'primeng/dynamicdialog';
import { UploadFileComponent } from '../../shared/upload-file/upload-file.component';

@Component({
  selector: 'app-bonifica-pratiche',
  templateUrl: './bonifica-pratiche.component.html',
  styleUrls: ['./bonifica-pratiche.component.css']
})
export class BonificaPraticheComponent implements OnInit {

  showSpinner: boolean = false;
  dataSource: any[];
  showInserisciPraticaDialog: boolean = false;
  isPersonaGiuridica: boolean = false;
  dateNow = new Date();
  tagRFIDAlreadyInserted = false;
  originalTagRFID = '';
  readonly: boolean = false;

  inserisciPraticaForm = this.fb.group({
    anagrafica: this.fb.group({
      nome: [''],
      cognome: [''],
      sesso: [''],
      data_nascita: [''],
      luogo_nascita: [''],
      luogo_residenza: [''],
      codice_fiscale: ['', [Validators.required, this.validCodFiscaleOrPartivaIva]],
      recapito_telefonico: ['', [Validators.minLength(9), Validators.maxLength(10)]],
      email: ['', [Validators.email, Validators.pattern('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,4}$')]],
      tipologia_persona: ['F'],
      ragione_sociale: [{ value: '', disabled: true }],
      codice_fiscale_piva: [{ value: '', disabled: true }, [Validators.required, this.validCodFiscaleOrPartivaIva]],
      indirizzo_sede_legale: [{ value: '', disabled: true }]
    }),
    dati_istanza: this.fb.group({
      concessione: [null],
      durata_giorni_concessione: [0],
      anni: [null],
      mesi: [null],
      giorni: [null],
      indirizzo_segnale_indicatore: [null, [Validators.required, this.objectControl]],
      motivazione_richiesta: [''],
      ruolo_richiedente: [''],
      utilizzo_locali: [''],
      specifica_utilizzo_locali: [{ value: '', disabled: true }, [Validators.required]],
      data_scadenza_concessione: ['', [Validators.required]],
      tipologia_processo: [null]
    }),
    dichiarazioni_aggiuntive: this.fb.group({
      accettazione_suolo_pubblico: [false, [Validators.requiredTrue]],
      conoscenza_spese_carico: [false, [Validators.requiredTrue]],
      locale_area: [null, [Validators.min(0), Validators.max(10000)]],
      capienza_min_veicoli: [null, [this.intergerControl, Validators.min(0), Validators.max(1000)]],
      vincolo_parcheggio: [false],
      distanza_intersezione: [null, [Validators.min(0), Validators.max(1000)]],
      larghezza: [null, [Validators.min(0), Validators.max(1000)]],
      profondita: [null, [Validators.min(0), Validators.max(1000)]],
      titolo_autorizzativo: this.fb.group({
        tipologia: [''],
        specifica_tipologia: [{ value: '', disabled: true }, [Validators.required]],
        riferimento: [{ value: '', disabled: true }, [Validators.required]]
      }),
      flag_esenzione: [false],
      motivazione_esenzione: [{ value: '', disabled: true }, [Validators.required]],
      flag_esenzione_cup: [false],
      motivazione_esenzione_cup: [{ value: '', disabled: true }, [Validators.required]]
    }), 
    numero_protocollo: [''],
    determina: this.fb.group({
      id: ['', [Validators.required]],
      data_emissione: ['', [Validators.required]],
    }),
    tag_rfid: [''],
    data_inserimento: [''],
    stato_pratica: null,
    id_doc: ['']
  });
  
  initSortColumn = 'last_modification.data_operazione';
  directionSortColumn = "-1"; //1=asc  0=rand   -1=desc 
  titleTable: string = 'Lista storico pratiche';
  exportName = 'Storico pratiche';
  inserisciFeature: string = 'aggiungiPratica';
  globalFilters: any[] = [
    {value:'dati_istanza.indirizzo_segnale_indicatore.indirizzo',label:'Indirizzo'},
    {value:'proprietario_pratica.utente',label:'Istruttore'}
  ];

  columnSchema = [
    {
      field: "anagrafica.codice_fiscale",
      header: "Firmatario",
      type: "text"
    },
    {
      field: "anagrafica.codice_fiscale_piva",
      header: "Destinatario",
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
      key: 'bonificaPratica',
      icon: "pi pi-pencil",
      tooltip: 'BONIFICA'
    },
    {
      key: 'uploadDialog',
      icon: "pi pi-upload",
      tooltip: 'ALLEGA DOCUMENTI'
    },
    {
      key: 'eliminaPratica',
      icon: "pi pi-trash",
      tooltip: 'ELIMINA'
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
    this.passiCarrabiliService.bonificaPratiche(this.authService.getMunicipio()).subscribe(
      data => {
        this.showSpinner = false;
        this.dataSource = data.data;
      },
      err => {
        this.showSpinner = false;
        this.messageService.showMessage('error', 'Storico pratiche', 'Errore durante il ritrovamento delle pratiche');
      }
    );
  }

  dettaglioPratica(element: any) {
    this.dialogService.open(DettaglioPraticaComponent,  this.utilityService.configDynamicDialogFullScreen(element, "Pratica cittadino"));
  }

  rangeIsNotValid(key: string, group: string) {
    return this.inserisciPraticaForm.controls[group].get(key)?.errors?.max
      || this.inserisciPraticaForm.controls[group].get(key)?.errors?.min ? true : false;
  }

  bonificaPratica(element: any) {
    this.resetForm();
    this.utilityService.formattazioneDatePerFE(element);
    this.inserisciPraticaForm.patchValue(element);
    this.tagRFIDAlreadyInserted = element.tag_rfid ? true : false;
    this.originalTagRFID = element.tag_rfid ? element.tag_rfid : '';
    this.isPersonaGiuridica = element.anagrafica.tipologia_persona == 'G' ? true : false;
    this.tipologiaPersonaChange({ checked: this.isPersonaGiuridica });
    this.changeTitoloAutorizzativo();
    this.changeEsenzione();
    this.changeEsenzioneCUP();
    this.readonly = true;
    this.showInserisciPraticaDialog = true;
  }

  resetForm() {
    this.inserisciPraticaForm.reset();
    this.isPersonaGiuridica = false; 
    this.inserisciPraticaForm.get('anagrafica.tipologia_persona').patchValue('F');
    this.inserisciPraticaForm.get('dichiarazioni_aggiuntive.accettazione_suolo_pubblico').patchValue(true);
    this.inserisciPraticaForm.get('dichiarazioni_aggiuntive.conoscenza_spese_carico').patchValue(true);
    this.tipologiaPersonaChange({checked: false});
    this.changeTitoloAutorizzativo();
    this.changeEsenzione();
    this.readonly = false;
  }

  aggiungiPratica(){
    this.resetForm();
    this.showInserisciPraticaDialog = true;
  }

  closeInserisciPraticaDialog(){
    this.showInserisciPraticaDialog = false;
    this.showSpinner = false;

    setTimeout(() => { 
      // Ricarica le pratiche
      this.cercaPratiche();
    }, 100);     
  }

  inserisciPratica() {
    if(this.inserisciPraticaForm.valid) {
      this.confirmationService.confirm({
        icon: "pi pi-exclamation-triangle",
        acceptLabel: "Conferma",
        rejectLabel: "Annulla",
        acceptButtonStyleClass: "btn-custom-style btn-dialog-confirm",
        rejectButtonStyleClass: "btn-custom-style btn-dialog-confirm",
        header: "Inserimento pratica",
        message: "Confermi i dati inseriti?",
        accept: async () => {
          this.showSpinner = true;
          var uniqueTagRFID = true;

          if((!this.tagRFIDAlreadyInserted && this.inserisciPraticaForm.get('tag_rfid').value) || (this.tagRFIDAlreadyInserted && this.inserisciPraticaForm.get('tag_rfid').value != this.originalTagRFID)) {
            uniqueTagRFID = <boolean>await this.passiCarrabiliService.checkUniqueTagRFIDSync(this.inserisciPraticaForm.get('tag_rfid').value).catch(err => {
              this.showSpinner = false;
              this.messageService.showMessage('error', 'Controllo tag rfid', 'Errore durante il controllo dell\'univocità del tag rfid');
            });
          }
          
          if(uniqueTagRFID) {
            let dt_inizio = this.inserisciPraticaForm.get('determina.data_emissione').value;
            let dt_fine = this.inserisciPraticaForm.get('dati_istanza.data_scadenza_concessione').value;
  
            let durata_giorni_concessione = this.utilityService.getDurataGiorniConcessione(dt_inizio, dt_fine);
            let durataAnniMesiGiorni = this.utilityService.getAnniMesiGiorniConcessione(dt_inizio, dt_fine);

            this.inserisciPraticaForm.get('dati_istanza.durata_giorni_concessione').patchValue(durata_giorni_concessione);
            this.inserisciPraticaForm.get('dati_istanza.anni').patchValue(durataAnniMesiGiorni.anni);
            this.inserisciPraticaForm.get('dati_istanza.mesi').patchValue(durataAnniMesiGiorni.mesi);
            this.inserisciPraticaForm.get('dati_istanza.giorni').patchValue(durataAnniMesiGiorni.giorni);
            this.inserisciPraticaForm.get('dati_istanza.concessione').patchValue(durata_giorni_concessione <= 365 ? TipologiaPratica['Concessione Temporanea'] : TipologiaPratica['Concessione Permanente']);
            
            if(this.inserisciPraticaForm.get('dati_istanza.tipologia_processo').value)
              this.inserisciPraticaForm.get('dati_istanza.tipologia_processo').patchValue(durata_giorni_concessione <= 365 ? TipologiaPratica['Concessione Temporanea'] : TipologiaPratica['Concessione Permanente']);
          
              if(durata_giorni_concessione < 1){
                this.showSpinner = false;
                this.messageService.showMessage('warn', 'Inserimento pratica', 'Attenzione: la data di fine concessione non può essere precedente alla data di emissione della determina');
              } else if(this.inserisciPraticaForm.get('dati_istanza.anni').value > 29 
                  || (this.inserisciPraticaForm.get('dati_istanza.anni').value == 29 && 
                      (this.inserisciPraticaForm.get('dati_istanza.mesi').value != 0 || this.inserisciPraticaForm.get('dati_istanza.giorni').value != 0 ))){
              this.showSpinner = false;
              this.messageService.showMessage('warn', 'Inserimento pratica', 'Attenzione: durata concessione massima superata (Max: 29 anni)');
            }
            else {
              let istanza = this.inserisciPraticaForm.value;

              istanza.proprietario_pratica = {
                username: this.authService.getUsername(),
                utente: this.authService.getInfoUtente()
              };

              istanza.is_pratica_pregresso = true;
              istanza.is_pratica_storico = true;

              if(this.utilityService.checkPraticaPregresso(istanza)) //Pratica già bonificata
                delete istanza.is_pratica_pregresso;

              this.passiCarrabiliService.inserimentoPraticaPregresso(istanza).subscribe(
                respInsert => {
                  this.showSpinner = false;
                  this.uploadDialog(respInsert.istanza, true);
                },
                err => {
                  this.showSpinner = false;
                  this.messageService.showMessage('error', 'Inserimento pratica', err.error.message || err.message);
                }
              );
            }
          }
          else {
            this.showSpinner = false;
            this.messageService.showMessage('warn', 'Controllo tag rfid', 'Attenzione: il tag rfid inserito è già presente a sistema.');
          }
        }
      });
    }
    else {
      this.utilityService.markAsDirtied(this.inserisciPraticaForm);
      this.messageService.showMessage('error', 'Inserimento pratica', 'Si prega di inserire tutte le informazioni obbligatorie prima di proseguire');
    }
  }

  uploadDialog(istanza: any, fromBonifica: boolean = false) {
    var checkPraticaBonificata = istanza.is_pratica_pregresso;
    let data = {
      pratica: istanza,
      mode: 'multiple',
      isPregresso: true
    }

    let dialogRef = this.dialogService.open(UploadFileComponent, this.utilityService.configDynamicDialogFullScreen(data, "Allega documenti alla pratica"));

    dialogRef.onClose.subscribe((uploadedFiles) => {
      if(fromBonifica){
        this.closeInserisciPraticaDialog();
        this.messageService.showMessage(!checkPraticaBonificata ? 'success' : 'warn', 'Bonifica pratica', !checkPraticaBonificata ? 'La pratica è stata bonificata' : 'Dati pratica aggiornati. E\' necessario completare i dati della pratica per la bonifica.');
      }
    });
  }

  tipologiaPersonaChange(event) {
    this.inserisciPraticaForm.get('anagrafica.tipologia_persona').patchValue(event.checked ? 'G' : 'F');

    if(event.checked) {
      this.inserisciPraticaForm.get('anagrafica.ragione_sociale').enable();
      this.inserisciPraticaForm.get('anagrafica.codice_fiscale_piva').enable();
      this.inserisciPraticaForm.get('anagrafica.indirizzo_sede_legale').enable();
      this.inserisciPraticaForm.get('anagrafica.codice_fiscale').setValidators(this.validCodFiscaleOrPartivaIva);
      this.inserisciPraticaForm.get('anagrafica.codice_fiscale').updateValueAndValidity();
    }
    else {
      this.inserisciPraticaForm.get('anagrafica.ragione_sociale').disable();
      this.inserisciPraticaForm.get('anagrafica.codice_fiscale_piva').disable();
      this.inserisciPraticaForm.get('anagrafica.indirizzo_sede_legale').disable();
      this.inserisciPraticaForm.get('anagrafica.codice_fiscale').setValidators([Validators.required, this.validCodFiscaleOrPartivaIva]);
      this.inserisciPraticaForm.get('anagrafica.codice_fiscale').updateValueAndValidity();
    }
  }

  isNotValid(key: string, group: string) {
    return this.inserisciPraticaForm.controls[group].get(key)?.dirty
      && this.inserisciPraticaForm.controls[group].get(key)?.touched
      && !this.inserisciPraticaForm.controls[group].get(key)?.valid ? true : false;
  }

  intergerControl(control: AbstractControl): { [key: string]: boolean } | null {
    if (control.value && !Number.isInteger(control.value)) {
      return { 'intergerControl': true };
    }
    return null;
  }

  objectControl(control: AbstractControl): { [key: string]: boolean } | null {
    if (typeof control.value !== 'object') {
      return { 'objectControl': true };
    }
    return null;
  }

  validCodFiscaleOrPartivaIva(control: AbstractControl): { [key: string]: boolean } | null {
    if(control.value) {
      var regexCf = /^[a-zA-Z]{6}[0-9]{2}[abcdehlmprstABCDEHLMPRST]{1}[0-9]{2}([a-zA-Z]{1}[a-zA-Z0-9]{3})[a-zA-Z]{1}$/;
      let testCf = regexCf.test(control.value);

      var regexIva = /^[0-9]{11}$/;
      let testIva = regexIva.test(control.value);

      if (!testCf && !testIva) {
        return { 'codiceFiscaleControl': true };
      }
    }
    
    return null;
  }

  setSpecificaAltro() {
    if (this.inserisciPraticaForm.get('dati_istanza.utilizzo_locali').value != Fabbricato.Altro) {
      this.inserisciPraticaForm.get('dati_istanza.specifica_utilizzo_locali').patchValue('');
      this.inserisciPraticaForm.get('dati_istanza.specifica_utilizzo_locali').disable();
    }
    else {
      this.inserisciPraticaForm.get('dati_istanza.specifica_utilizzo_locali').enable();
    }
  }

  previusTitoloAutorizzativo: string = '';

  changeTitoloAutorizzativo() {
    if (!this.inserisciPraticaForm.get('dichiarazioni_aggiuntive.titolo_autorizzativo.tipologia').value 
          || this.previusTitoloAutorizzativo == this.inserisciPraticaForm.get('dichiarazioni_aggiuntive.titolo_autorizzativo.tipologia').value) {
      this.previusTitoloAutorizzativo = '';
      this.inserisciPraticaForm.get('dichiarazioni_aggiuntive.titolo_autorizzativo.tipologia').patchValue('');
      this.inserisciPraticaForm.get('dichiarazioni_aggiuntive.titolo_autorizzativo.specifica_tipologia').reset();
      this.inserisciPraticaForm.get('dichiarazioni_aggiuntive.titolo_autorizzativo.riferimento').reset();

      this.inserisciPraticaForm.get('dichiarazioni_aggiuntive.titolo_autorizzativo.specifica_tipologia').disable();    
      this.inserisciPraticaForm.get('dichiarazioni_aggiuntive.titolo_autorizzativo.riferimento').disable();
    }
    else {
      this.previusTitoloAutorizzativo = this.inserisciPraticaForm.get('dichiarazioni_aggiuntive.titolo_autorizzativo.tipologia').value;

      this.inserisciPraticaForm.get('dichiarazioni_aggiuntive.titolo_autorizzativo.riferimento').enable();

      if (this.inserisciPraticaForm.get('dichiarazioni_aggiuntive.titolo_autorizzativo.tipologia').value != TitoloAutorizzativo.Altro) {
        this.inserisciPraticaForm.get('dichiarazioni_aggiuntive.titolo_autorizzativo.specifica_tipologia').reset();
        this.inserisciPraticaForm.get('dichiarazioni_aggiuntive.titolo_autorizzativo.specifica_tipologia').disable();
      }
      else {
        this.inserisciPraticaForm.get('dichiarazioni_aggiuntive.titolo_autorizzativo.specifica_tipologia').enable();
      }
    }
  }

  changeEsenzione() {
    if (!this.inserisciPraticaForm.get('dichiarazioni_aggiuntive.flag_esenzione').value) {
      this.inserisciPraticaForm.get('dichiarazioni_aggiuntive.motivazione_esenzione').reset();
      this.inserisciPraticaForm.get('dichiarazioni_aggiuntive.motivazione_esenzione').disable();    
    }
    else {
      this.inserisciPraticaForm.get('dichiarazioni_aggiuntive.motivazione_esenzione').enable();
    }
  }

  changeEsenzioneCUP() {
    if (!this.inserisciPraticaForm.get('dichiarazioni_aggiuntive.flag_esenzione_cup').value) {
      this.inserisciPraticaForm.get('dichiarazioni_aggiuntive.motivazione_esenzione_cup').reset();
      this.inserisciPraticaForm.get('dichiarazioni_aggiuntive.motivazione_esenzione_cup').disable();    
    }
    else {
      this.inserisciPraticaForm.get('dichiarazioni_aggiuntive.motivazione_esenzione_cup').enable();
    }
  }

  isTipologiaPraticaAltro(value): boolean {
    return value == Fabbricato.Altro;
  }

  isTitoloAutorizzativoAltro(value): boolean {
    return value == TitoloAutorizzativo.Altro;
  }

  isTitoloAutorizzativoSelected(value): boolean {
    return value ? true : false;
  }

  isEsente(value): boolean {
    return value ? true : false;
  }

  ruoloRichiedenteSchema = [
    {
      label: ProprietaImmobile[ProprietaImmobile['Proprietario immobile']],
      value: ProprietaImmobile['Proprietario immobile'],
      descrizione: "Proprietario singolo immobile"
    },
    {
      label: ProprietaImmobile[ProprietaImmobile['Legale rappresentante']],
      value: ProprietaImmobile['Legale rappresentante'],
      descrizione: "Legale rappresentante azienda"
    },
    {
      label: ProprietaImmobile[ProprietaImmobile['Amministratore immobile']],
      value: ProprietaImmobile['Amministratore immobile'],
      descrizione: "Amministratore del condominio immobile"
    },
    {
      label: ProprietaImmobile[ProprietaImmobile['Locatario immobile']],
      value: ProprietaImmobile['Locatario immobile'],
      descrizione: ProprietaImmobile[ProprietaImmobile['Locatario immobile']]
    },
    {
      label: ProprietaImmobile[ProprietaImmobile['Comproprietario immobile']],
      value: ProprietaImmobile['Comproprietario immobile'],
      descrizione: ProprietaImmobile[ProprietaImmobile['Comproprietario immobile']]
    }
  ];

  utilizzoLocaliSchema = [
    {
      label: Fabbricato[Fabbricato.Autofficina],
      value: Fabbricato.Autofficina,
      descrizione: "Autofficina e similari (autocarrozzeria, elettrauto, officine per moto, ecc.)"
    },
    {
      label: Fabbricato[Fabbricato['Carico/Scarico Merci']],
      value: Fabbricato['Carico/Scarico Merci'],
      descrizione: "Operazioni di carico e scarico valori per gli istituti di credito e/o commercianti di gioielli"
    },
    {
      label: Fabbricato[Fabbricato['Ricovero attrezzature agricole']],
      value: Fabbricato['Ricovero attrezzature agricole'],
      descrizione: "Ricovero di macchinari ed attrezzature agricole"
    },
    {
      label: Fabbricato[Fabbricato['Vendita autoveicoli']],
      value: Fabbricato['Vendita autoveicoli'],
      descrizione: "Esercizio vendita autoveicoli"
    },
    {
      label: Fabbricato[Fabbricato['Uffici postali']],
      value: Fabbricato['Uffici postali'],
      descrizione: Fabbricato[Fabbricato['Uffici postali']]
    },
    {
      label: Fabbricato[Fabbricato['Uffici polizia']],
      value: Fabbricato['Uffici polizia'],
      descrizione: "Uffici di polizia di Stato, caserme Carabinieri e caserme in genere"
    },
    {
      label: Fabbricato[Fabbricato['Autorimessa privata']],
      value: Fabbricato['Autorimessa privata'],
      descrizione: Fabbricato[Fabbricato['Autorimessa privata']]
    },
    {
      label: Fabbricato[Fabbricato['Parcheggio privato']],
      value: Fabbricato['Parcheggio privato'],
      descrizione: Fabbricato[Fabbricato['Parcheggio privato']]
    },
    {
      label: Fabbricato[Fabbricato.Altro],
      value: Fabbricato.Altro,
      descrizione: "Altro uso, specificare"
    }
  ];

  titoloAutorizzativoSchema = [
    {
      label: TitoloAutorizzativo[TitoloAutorizzativo['Licenza di costruire']],
      value: TitoloAutorizzativo['Licenza di costruire'],
      descrizione: TitoloAutorizzativo[TitoloAutorizzativo['Licenza di costruire']]
    },
    {
      label: TitoloAutorizzativo[TitoloAutorizzativo['Permesso di costruire']],
      value: TitoloAutorizzativo['Permesso di costruire'],
      descrizione: TitoloAutorizzativo[TitoloAutorizzativo['Permesso di costruire']]
    },
    {
      label: TitoloAutorizzativo[TitoloAutorizzativo['Concessione edilizia']],
      value: TitoloAutorizzativo['Concessione edilizia'],
      descrizione: TitoloAutorizzativo[TitoloAutorizzativo['Concessione edilizia']]
    },
    {
      label: TitoloAutorizzativo[TitoloAutorizzativo.SCIA],
      value: TitoloAutorizzativo.SCIA,
      descrizione: TitoloAutorizzativo[TitoloAutorizzativo.SCIA]
    },
    {
      label: TitoloAutorizzativo[TitoloAutorizzativo.Altro],
      value: TitoloAutorizzativo.Altro,
      descrizione: "Altro uso, specificare"
    }
  ];

  //selectButton primeNG
  sessoUsers: any[] = [
    { label: "Maschio", value: "M" },
    { label: "Femmina", value: "F" }
  ]

  //yearRange per p-calendar
  calculateYearRange(): string {
    let min = new Date().getFullYear() - 100;
    let max = new Date().getFullYear() + 1;
    return min.toString() + ":" + max.toString();
  }

  calculateYearRangeFineConcessione(): string {
    let min = new Date().getFullYear() - 5;
    let max = new Date().getFullYear() + 30;
    return min.toString() + ":" + max.toString();
  }

  //Autocomplete civico
  civilarioResults: any[] = [];

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
          this.messageService.showMessage('warn', 'Ricerca indirizzo', 'Indirizzo non presente nel municipio di appartenenza. Rivolgersi alla toponomastica per il censimento');
        }
            
      });
  }

  addressListFormatter(data: any) {
    return data ? (data.nome_via || '--') + ', ' + (data.numero || '--') + (data.esponente ? `/${data.esponente}` : '') + ' (' + data.municipio + ')' + (data.localita ? ` - ${data.localita}` : '') : '';
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
      accept: async () => {
        this.showSpinner = true;

        var resp_ripristino: any = await this.passiCarrabiliService.ripristinaPraticaPregresso(element).catch( err => {
          this.showSpinner = false;
          this.messageService.showMessage('error', 'Storico pratiche', err.error.message);
        });

        if(resp_ripristino) {
          this.passiCarrabiliService.eliminaPratica(element.id_doc).subscribe(
            resp => {      
              this.dataSource = this.dataSource.filter(el => el.id_doc != element.id_doc);
              this.dataSource = [...this.dataSource];  
              this.showSpinner = false;
              this.messageService.showMessage('success', 'Storico pratiche', resp_ripristino.message); 
            },
            err => {
              this.showSpinner = false;
              this.messageService.showMessage('error','Storico pratiche', err.error.message); 
            }
          );
        } 
      }
    });
  }

}
