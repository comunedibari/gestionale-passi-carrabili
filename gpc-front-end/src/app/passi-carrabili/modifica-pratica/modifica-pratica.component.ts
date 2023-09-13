import { Component, OnInit, Inject, Renderer2 } from '@angular/core';
import { FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { UtilityService } from '../../shared/service/utility.service';
import { PassiCarrabiliService } from '../../shared/service/passi.carrabili.service';
import { MessageService } from '../../shared/service/message.service';
import { ConfirmationService } from 'primeng/api';
import { DialogService, DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { AuthService } from 'src/app/shared/service/auth.service';
import { TipologiaPratica } from 'src/app/shared/enums/TipologiaPratica.enum';
import { Fabbricato } from 'src/app/shared/enums/Fabbricato.enum';
import { ProprietaImmobile } from 'src/app/shared/enums/ProprietaImmobile.enum';
import { map } from 'rxjs/operators';
import { TitoloAutorizzativo } from 'src/app/shared/enums/TitoloAutorizzativo.enum';

@Component({
  selector: 'app-modifica-pratica',
  templateUrl: './modifica-pratica.component.html',
  styleUrls: ['./modifica-pratica.component.css']
})
export class ModificaPraticaComponent implements OnInit {

  constructor(
    private passiCarrabiliService: PassiCarrabiliService,
    private fb: FormBuilder,
    private renderer: Renderer2,
    private messageService: MessageService,
    private utilityService: UtilityService,
    public dialogService: DialogService,
    public confirmationService: ConfirmationService,
    public authService: AuthService,
    private dialogRef: DynamicDialogRef,
    @Inject(DynamicDialogConfig) data: any) {
      this.renderer.addClass(document.body, 'modal-open');
      this.pratica = JSON.parse(JSON.stringify(data.data));
      this.bkpPratica = JSON.parse(JSON.stringify(data.data));
      this.utilityService.formattazioneDatePerFE(this.pratica);  
  }

  ngOnDestroy() {
    this.renderer.removeClass(document.body, 'modal-open');
  }

  pratica: any = {};
  bkpPratica: any = {};
  readonly: boolean = true;
  loading: boolean = false;
  dateNow = new Date();

  get isPersonaGiuridica(): boolean {
    return this.inserisciPraticaForm.get('anagrafica.tipologia_persona').value == 'G' ? true : false;
  }

  inserisciPraticaForm = this.fb.group({
    anagrafica: this.fb.group({
      nome: [this.pratica.anagrafica?.nome, [Validators.required]],
      cognome: [this.pratica.anagrafica?.cognome, [Validators.required]],
      sesso: [this.pratica.anagrafica?.sesso, [Validators.required]],
      data_nascita: [this.pratica.anagrafica?.data_nascita, [Validators.required]],
      luogo_nascita: [this.pratica.anagrafica?.luogo_nascita, [Validators.required]],
      luogo_residenza: [this.pratica.anagrafica?.luogo_residenza, [Validators.required]],
      codice_fiscale: [this.pratica.anagrafica?.codice_fiscale, [Validators.required, this.validCodFiscaleOrPartivaIva]],
      recapito_telefonico: [this.pratica.anagrafica?.recapito_telefonico, [Validators.required, Validators.minLength(9), Validators.maxLength(10)]],
      email: [this.pratica.anagrafica?.email, [Validators.required, Validators.email, Validators.pattern('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,4}$')]],
      tipologia_persona: [this.pratica.anagrafica?.tipologia_persona, [Validators.required]],
      ragione_sociale: [this.pratica.anagrafica?.ragione_sociale, [Validators.required]],
      codice_fiscale_piva: [this.pratica.anagrafica?.codice_fiscale_piva, [Validators.required, this.validCodFiscaleOrPartivaIva]],
      indirizzo_sede_legale: [this.pratica.anagrafica?.indirizzo_sede_legale, [Validators.required]]
    }),
    dati_istanza: this.fb.group({
      concessione: [this.pratica.dati_istanza?.concessione, [Validators.required]],
      durata_giorni_concessione: [this.pratica.dati_istanza?.durata_giorni_concessione],
      anni: [this.pratica.dati_istanza?.anni, [Validators.required, this.intergerControl, Validators.min(0), Validators.max(29)]],
      mesi: [this.pratica.dati_istanza?.mesi, [Validators.required, this.intergerControl, Validators.min(0), Validators.max(11)]],
      giorni: [this.pratica.dati_istanza?.giorni, [Validators.required, this.intergerControl, Validators.min(0), Validators.max(31)]],
      indirizzo_segnale_indicatore: [this.pratica.dati_istanza?.indirizzo_segnale_indicatore, [Validators.required, this.objectControl]],
      motivazione_richiesta: [this.pratica.dati_istanza?.motivazione_richiesta, [Validators.required]],
      ruolo_richiedente: [this.pratica.dati_istanza?.ruolo_richiedente, [Validators.required]],
      utilizzo_locali: [this.pratica.dati_istanza?.utilizzo_locali, [Validators.required]],
      specifica_utilizzo_locali: [this.pratica.dati_istanza?.specifica_utilizzo_locali, [Validators.required]]
    }),
    dichiarazioni_aggiuntive: this.fb.group({
      accettazione_suolo_pubblico: [this.pratica.dichiarazioni_aggiuntive?.accettazione_suolo_pubblico, [Validators.requiredTrue]],
      conoscenza_spese_carico: [this.pratica.dichiarazioni_aggiuntive?.conoscenza_spese_carico, [Validators.requiredTrue]],
      locale_area: [this.pratica.dichiarazioni_aggiuntive?.locale_area, [Validators.required, Validators.min(0), Validators.max(10000)/*, Validators.min(25)*/]],
      capienza_min_veicoli: [this.pratica.dichiarazioni_aggiuntive?.capienza_min_veicoli, [Validators.required, Validators.min(0), Validators.max(1000), this.intergerControl]],
      vincolo_parcheggio: [this.pratica.dichiarazioni_aggiuntive?.vincolo_parcheggio],
      distanza_intersezione: [this.pratica.dichiarazioni_aggiuntive?.distanza_intersezione, [Validators.required, Validators.min(0), Validators.max(1000)/*, Validators.min(12)*/]],
      larghezza: [this.pratica.dichiarazioni_aggiuntive?.larghezza, [Validators.required, Validators.min(0), Validators.max(1000)]],
      profondita: [this.pratica.dichiarazioni_aggiuntive?.profondita, [Validators.required, Validators.min(0), Validators.max(1000)]],
      titolo_autorizzativo: this.fb.group({
        tipologia: [this.pratica.dichiarazioni_aggiuntive?.titolo_autorizzativo?.tipologia],
        specifica_tipologia: [this.pratica.dichiarazioni_aggiuntive?.titolo_autorizzativo?.specifica_tipologia, [Validators.required]],
        riferimento: [this.pratica.dichiarazioni_aggiuntive?.titolo_autorizzativo?.riferimento, [Validators.required]]
      }),
      flag_esenzione: [this.pratica.dichiarazioni_aggiuntive?.flag_esenzione],
      motivazione_esenzione: [this.pratica.dichiarazioni_aggiuntive?.motivazione_esenzione, [Validators.required]]
    }),
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
    if (!Number.isInteger(control.value)) {
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
    var regexCf = /^[a-zA-Z]{6}[0-9]{2}[abcdehlmprstABCDEHLMPRST]{1}[0-9]{2}([a-zA-Z]{1}[a-zA-Z0-9]{3})[a-zA-Z]{1}$/;
    let testCf = regexCf.test(control.value);

    var regexIva = /^[0-9]{11}$/;
    let testIva = regexIva.test(control.value);

    if (!testCf && !testIva) {
      return { 'codiceFiscaleControl': true };
    }

    return null;
  }

  controlloDurataConcessione() {
    if(this.inserisciPraticaForm.get('dati_istanza.anni').touched 
      || this.inserisciPraticaForm.get('dati_istanza.mesi').touched
      || this.inserisciPraticaForm.get('dati_istanza.giorni').touched)
      {
        let error = false;
        let errMessage = '';

        if(this.inserisciPraticaForm.get('dati_istanza.anni').value == null
                || this.inserisciPraticaForm.get('dati_istanza.mesi').value == null
                || this.inserisciPraticaForm.get('dati_istanza.giorni').value == null) {
            error = true;
            errMessage = 'Completare l\'inserimento della durata della concessione';
        }
        else if(this.inserisciPraticaForm.get('dati_istanza.anni').value == 0
          && this.inserisciPraticaForm.get('dati_istanza.mesi').value == 0
          && this.inserisciPraticaForm.get('dati_istanza.giorni').value == 0){
            error = true;
            errMessage = 'Inserire la durata della concessione';
          }
        else {
          switch(this.inserisciPraticaForm.get('dati_istanza.concessione').value) {
            case TipologiaPratica['Concessione Temporanea']:
              if((this.inserisciPraticaForm.get('dati_istanza.anni').value == 1 
                  && this.inserisciPraticaForm.get('dati_istanza.mesi').value == 0
                  && this.inserisciPraticaForm.get('dati_istanza.giorni').value == 0)
                  || this.inserisciPraticaForm.get('dati_istanza.anni').value == 0) {
                    // console.log("Concessione temporanea OK!");
                  }
              else {
                error = true;
                errMessage = 'Una concessione temporanea può durare minimo un giorno e massimo un anno';
              }
              break;
            case TipologiaPratica['Concessione Permanente']:   
              if((this.inserisciPraticaForm.get('dati_istanza.anni').value == 1 
                  && (this.inserisciPraticaForm.get('dati_istanza.mesi').value > 0
                        || this.inserisciPraticaForm.get('dati_istanza.giorni').value > 0)
                      )
                  || (this.inserisciPraticaForm.get('dati_istanza.anni').value > 1 && this.inserisciPraticaForm.get('dati_istanza.anni').value < 29)
                  || (this.inserisciPraticaForm.get('dati_istanza.anni').value == 29 
                      && this.inserisciPraticaForm.get('dati_istanza.mesi').value == 0
                      && this.inserisciPraticaForm.get('dati_istanza.giorni').value == 0)) {
                    // console.log("Concessione permanente OK!");
                  }
              else {
                error = true;
                errMessage = 'Una concessione permanente dura più di un anno e massimo 29 anni';              
              }
              break;
          }
        }   

        if(error) {
          this.messageService.showMessage('error', 'Durata concessione', errMessage);
          this.inserisciPraticaForm.get('dati_istanza.anni').setErrors({ 'invalid': true });
          this.inserisciPraticaForm.get('dati_istanza.mesi').setErrors({ 'invalid': true });
          this.inserisciPraticaForm.get('dati_istanza.giorni').setErrors({ 'invalid': true });
        }
        else {
          this.inserisciPraticaForm.get('dati_istanza.anni').updateValueAndValidity();
          this.inserisciPraticaForm.get('dati_istanza.mesi').updateValueAndValidity();
          this.inserisciPraticaForm.get('dati_istanza.giorni').updateValueAndValidity();
        }
      }
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
      if(!this.inserisciPraticaForm.get('dichiarazioni_aggiuntive.motivazione_esenzione').value) {
        this.inserisciPraticaForm.get('dichiarazioni_aggiuntive.motivazione_esenzione').patchValue('');
        this.inserisciPraticaForm.get('dichiarazioni_aggiuntive.motivazione_esenzione').markAsDirty();
        this.inserisciPraticaForm.get('dichiarazioni_aggiuntive.motivazione_esenzione').markAsTouched();
      }    
    }
  }

  checkTipologiaPersona() {
    if(this.isPersonaGiuridica) {
      this.inserisciPraticaForm.get('anagrafica.ragione_sociale').enable();
      this.inserisciPraticaForm.get('anagrafica.codice_fiscale_piva').enable();
      this.inserisciPraticaForm.get('anagrafica.indirizzo_sede_legale').enable();
    }
    else {
      this.inserisciPraticaForm.get('anagrafica.ragione_sociale').disable();
      this.inserisciPraticaForm.get('anagrafica.codice_fiscale_piva').disable();
      this.inserisciPraticaForm.get('anagrafica.indirizzo_sede_legale').disable();
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

  tipologiaPraticaSchema = [
    {
      label: TipologiaPratica[TipologiaPratica['Concessione Temporanea']].replace('Concessione ', ''),
      value: TipologiaPratica['Concessione Temporanea']
    },
    {
      label: TipologiaPratica[TipologiaPratica['Concessione Permanente']].replace('Concessione ', ''),
      value: TipologiaPratica['Concessione Permanente']
    }
  ];

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

  ngOnInit(): void {
    //TO DO: da cancellare appena va a regime
    // if(isNaN(this.pratica.dati_istanza.anni) || isNaN(this.pratica.dati_istanza.mesi) || isNaN(this.pratica.dati_istanza.giorni)){    
    //   this.pratica.anagrafica.tipologia_persona = 'F';
    //   let durataAnniMesiGiorni = this.utilityService.getAnniMesiGiorniConcessioneOrigine(this.pratica.dati_istanza.data_scadenza_concessione, this.pratica.dati_istanza.durata_giorni_concessione);
    //   this.pratica.dati_istanza.anni = durataAnniMesiGiorni.anni;
    //   this.pratica.dati_istanza.mesi = durataAnniMesiGiorni.mesi;
    //   this.pratica.dati_istanza.giorni = durataAnniMesiGiorni.giorni;
    // }

    this.inserisciPraticaForm.patchValue(this.pratica);
    this.setSpecificaAltro();
    this.checkTipologiaPersona();
    this.changeTitoloAutorizzativo();
    this.changeEsenzione();
  }

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

  //Autocomplete civico
  civilarioResults: any[];

  searchCivilario(event) {
    return this.utilityService.civico(event.query, this.authService.getMunicipio())
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

  confermaDatiDialog() {
    this.confirmationService.confirm({
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Conferma",
      rejectLabel: "Annulla",
      acceptButtonStyleClass: "btn-custom-style btn-dialog-confirm",
      rejectButtonStyleClass: "btn-custom-style btn-dialog-confirm",
      header: "Modifica pratica",
      message: "Confermi le modifiche apportate alla pratica?",
      accept: () => {      
        this.loading = true;
        Object.assign(this.pratica, this.inserisciPraticaForm.value);
        
        this.pratica.dati_istanza.tipologia_processo = this.bkpPratica.dati_istanza.tipologia_processo;
        if(this.bkpPratica.dati_istanza.data_scadenza_concessione)
          this.pratica.dati_istanza.data_scadenza_concessione = this.bkpPratica.dati_istanza.data_scadenza_concessione;
        if(this.bkpPratica.dati_istanza.link_pratica_origine)
          this.pratica.dati_istanza.link_pratica_origine = this.bkpPratica.dati_istanza.link_pratica_origine;

        this.passiCarrabiliService.aggiornaPratica(this.pratica).subscribe( 
          resp => {   
            this.loading = false;
            this.pratica = resp.istanza;
            this.messageService.showMessage('success', 'Modifica pratica', 'La pratica è stata modificata');     
            this.closeDialog(this.pratica);
          },
          err => {
            this.loading = false;
            this.messageService.showMessage('error', 'Modifica pratica', err.error.message);
            this.closeDialog(this.pratica);
          }
        ); 

      }
    });
  }

  closeDialog(event?) {
    this.dialogRef.close(event);
  }

}
