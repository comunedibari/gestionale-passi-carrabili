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
import { UploadFileComponent } from '../../shared/upload-file/upload-file.component';
import { DialogService } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-storico-pratiche',
  templateUrl: './storico-pratiche.component.html',
  styleUrls: ['./storico-pratiche.component.css']
})
export class StoricoPraticheComponent implements OnInit {

  showSpinner: boolean = false;
  showInserisciPraticaDialog: boolean = false;
  dataSource: any[];
  selectedRows: any[] = [];
  dateNow = new Date();

  initSortColumn = 'indirizzo';
  directionSortColumn = "-1"; //1=asc  0=rand   -1=desc 
  titleTable: string = 'Lista storico pratiche';
  exportName = 'Storico pratiche';
  inserisciFeature: string = 'aggiungiPratica';
  globalFilters: any[] = [
    { value: 'denominazione', label: 'Denominazione' },
    { value: 'indirizzo', label: 'Indirizzo' }
  ]

  columnSchema = [
    {
      field: "codice_fiscale_partita_iva",
      header: "Cod. Fiscale/P. IVA",
      type: "text"
    },
    {
      field: "denominazione",
      header: "Denominazione",
      type: "text"
    },
    {
      field: "determina_data",
      header: "Determina",
      type: "text"
    },
    {
      field: "indirizzo",
      header: "Indirizzo",
      type: "text",
      inactive: true
    },
    {
      field: "email_telefono",
      header: "Email/telefono",
      type: "text"
    },
    {
      field: "n_cartello",
      header: "N. Cartello",
      type: "text"
    },
    {
      field: "sostituzione_cartello",
      header: "Sost. cartello",
      type: "text",
    },
    {
      field: "check",
      header: "Controllato",
      type: "dropdown",
      show: (el) => {
        return el == "true" ? 'Si' : 'No';
      }
    },
    {
      field: "lista",
      header: "Lista",
      type: "dropdown"
    }  
  ];

  actions = [];
  
  constructor(
    private fb: FormBuilder,
    private messageService: MessageService,
    private passiCarrabiliService: PassiCarrabiliService,
    private utilityService: UtilityService,
    public confirmationService: ConfirmationService,
    public authService: AuthService,
    private dialogService: DialogService
  ) { }

  ngOnInit(): void {
    this.cercaPratiche();
  }

  cercaPratiche(){
    this.showSpinner = true;
    this.passiCarrabiliService.pregressoPratiche().subscribe(
      data => {
        this.showSpinner = false;
        this.dataSource = data.data;
        this.selectedRows.length = 0;
        this.resetForm();
      },
      err => {
        this.showSpinner = false;
        this.messageService.showMessage('error', 'Storico pratiche', 'Errore durante il ritrovamento delle pratiche');
      }
    );
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
  }

  onTableEvent(tableEvent: TableEvent) {
    this[tableEvent.actionKey](tableEvent.data);
  }

  aggiungiPratica(selectedRows: any){
    if(!selectedRows || (selectedRows && selectedRows.length == 0)){
      this.messageService.showMessage('error', 'Storico pratiche', 'Selezionare le pratiche da considerare');
    }
    else {
      let checkedPratica = selectedRows.find(x => x.check == "true");
      if(!checkedPratica) {
        this.selectedRows = selectedRows;     
        this.showInserisciPraticaDialog = true;
      }
      else {
        this.messageService.showMessage('warn', 'Storico pratiche', 'Attenzione: sono state selezionate delle pratiche già controllate');
      }
    }
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
          if(this.inserisciPraticaForm.get('tag_rfid').value) {
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
              debugger;
              this.passiCarrabiliService.inserimentoPraticaPregresso(istanza).subscribe(
                async (respInsert) => {
                  //Aggiorna stato controllato pratiche considerate
                  for (var i = 0; i < this.selectedRows.length; i++) {
                    let pratica = this.dataSource.find(x => x.id == this.selectedRows[i].id);
                    pratica.id_doc = respInsert.istanza.id_doc;

                    let resp = await this.passiCarrabiliService.setPraticaControllataPregresso(pratica).catch( err => {
                        this.showSpinner = false;
                        this.messageService.showMessage('error', 'Storico pratiche', err.error.message);
                      });

                    if(resp)
                      pratica.check = true;
                  }

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
        this.messageService.showMessage(!checkPraticaBonificata ? 'success' : 'warn', 'Inserimento pratica', !checkPraticaBonificata ? 'La pratica è stata inserita nel sistema' : 'La pratica è stata inserita nel sistema. E\' necessario procedere con la bonifica dei dati per rendere la concessione valida.');
      }
    });
  }

  //Form Inserimento Pratica

  showProtocolloDialog: boolean = false;
  numProtocollo: string = '';
  actionConfirmNumProtocollo: string = '';
  actionRiprotocollazione: string = '';
  isPersonaGiuridica: boolean = false;

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
  })

  rangeIsNotValid(key: string, group: string) {
    return this.inserisciPraticaForm.controls[group].get(key)?.errors?.max
      || this.inserisciPraticaForm.controls[group].get(key)?.errors?.min ? true : false;
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

}
