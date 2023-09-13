import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { Fabbricato } from 'src/app/shared/enums/Fabbricato.enum';
import { ProprietaImmobile } from 'src/app/shared/enums/ProprietaImmobile.enum';
import { TipologiaPratica } from 'src/app/shared/enums/TipologiaPratica.enum';
import { MessageService } from '../../shared/service/message.service';
import { UtilityService } from '../../shared/service/utility.service';
import { map } from 'rxjs/operators';
import { DialogService } from 'primeng/dynamicdialog';
import { ConfirmationService } from 'primeng/api';
import { UploadFileComponent } from '../../shared/upload-file/upload-file.component';
import { PassiCarrabiliService } from '../../shared/service/passi.carrabili.service';
import { Group } from '../../shared/enums/Group.enum'; 
import { EmailService } from '../../shared/service/email.service';
import { AuthService } from 'src/app/shared/service/auth.service';
import { TitoloAutorizzativo } from 'src/app/shared/enums/TitoloAutorizzativo.enum';
import { environment } from '../../../environments/environment';
import { ProtocolloService } from 'src/app/shared/service/protocollo.service';
import { StatoPraticaPassiCarrabili } from '../../shared/enums/StatoPratica.enum';
import { PassaggiStato } from 'src/app/shared/enums/PassaggiStato.enum';

@Component({
  selector: 'app-inserisci-pratica',
  templateUrl: './inserisci-pratica.component.html',
  styleUrls: ['./inserisci-pratica.component.css']
})
export class InserisciPraticaComponent implements OnInit {

  constructor(
    private passiCarrabiliService: PassiCarrabiliService,
    private fb: FormBuilder,
    private messageService: MessageService,
    private utilityService: UtilityService,
    public dialogService: DialogService,
    public confirmationService: ConfirmationService,
    private emailService: EmailService,
    public authService: AuthService,
    private protocolloService: ProtocolloService
  ) { }

  showProtocolloDialog: boolean = false;
  numProtocollo: string = '';
  isProtocollata: boolean = false;
  insertResponse: any;
  loading: boolean = false;
  initialFormValues: any = {};
  actionRiprotocollazione: string = '';
  uploadedFiles: any[] = [];
  base64DocInserimento: string = '';
  objProtocollo: any = null;
  dateNow = new Date();

  //nominatim
  hidePositionOnMap: boolean = true;
  nominatim_option: any = {
    nome_via: '',
    numero: null,
    esponente: '',
    municipio: null,
    localita: '',
    lat: null,
    lon: null
  };
  showIndirizzoSegnaleIndicatoreDialog: boolean = false;
  
  inserisciPraticaForm = this.fb.group({
    anagrafica: this.fb.group({
      nome: ['', [Validators.required]],
      cognome: ['', [Validators.required]],
      sesso: ['', [Validators.required]],
      data_nascita: ['', [Validators.required]],
      luogo_nascita: ['', [Validators.required]],
      luogo_residenza: ['', [Validators.required]],
      codice_fiscale: ['', [Validators.required, this.validCodFiscaleOrPartivaIva]],
      recapito_telefonico: ['', [Validators.required, Validators.minLength(9), Validators.maxLength(10)]],
      email: ['', [Validators.required, Validators.email, Validators.pattern('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,4}$')]],
      tipologia_persona: ['F', [Validators.required]],
      ragione_sociale: [{ value: '', disabled: true }, [Validators.required]],
      codice_fiscale_piva: [{ value: '', disabled: true }, [Validators.required, this.validCodFiscaleOrPartivaIva]],
      indirizzo_sede_legale: [{ value: '', disabled: true }, [Validators.required]]
    }),
    dati_istanza: this.fb.group({
      concessione: [null, [Validators.required]],
      durata_giorni_concessione: [0],
      anni: [{ value: null, disabled: true }, [Validators.required, this.intergerControl, Validators.min(0), Validators.max(29)]],
      mesi: [{ value: null, disabled: true }, [Validators.required, this.intergerControl, Validators.min(0), Validators.max(11)]],
      giorni: [{ value: null, disabled: true }, [Validators.required, this.intergerControl, Validators.min(0), Validators.max(31)]],
      indirizzo_segnale_indicatore: [null, [Validators.required, this.objectControl]],
      motivazione_richiesta: ['', [Validators.required]],
      ruolo_richiedente: ['', [Validators.required]],
      utilizzo_locali: ['', [Validators.required]],
      specifica_utilizzo_locali: ["", [Validators.required]]
    }),
    dichiarazioni_aggiuntive: this.fb.group({
      accettazione_suolo_pubblico: [false, [Validators.requiredTrue]],
      conoscenza_spese_carico: [false, [Validators.requiredTrue]],
      locale_area: [null, [Validators.required, Validators.min(0), Validators.max(10000)/*, Validators.min(25)*/]],
      capienza_min_veicoli: [null, [Validators.required, Validators.min(0), Validators.max(1000), this.intergerControl]],
      vincolo_parcheggio: [false],
      distanza_intersezione: [null, [Validators.required, Validators.min(0), Validators.max(1000)/*, Validators.min(12)*/]],
      larghezza: [null, [Validators.required, Validators.min(0), Validators.max(1000)]],
      profondita: [null, [Validators.required, Validators.min(0), Validators.max(1000)]],
      titolo_autorizzativo: this.fb.group({
        tipologia: [''],
        specifica_tipologia: ['', [Validators.required]],
        riferimento: ['', [Validators.required]]
      }),
      flag_esenzione: [false],
      motivazione_esenzione: ['', [Validators.required]]
    }),
  })

  isNotValid(key: string, group: string) {
    return this.inserisciPraticaForm.controls[group].get(key)?.dirty
      && this.inserisciPraticaForm.controls[group].get(key)?.touched
      && !this.inserisciPraticaForm.controls[group].get(key)?.valid ? true : false;
  }

  rangeIsNotValid(key: string, group: string) {
    return this.inserisciPraticaForm.controls[group].get(key)?.errors?.max
      || this.inserisciPraticaForm.controls[group].get(key)?.errors?.min ? true : false;
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

  enabledGiorniConcessione() {
    this.inserisciPraticaForm.get('dati_istanza.anni').enable();
    this.inserisciPraticaForm.get('dati_istanza.mesi').enable();
    this.inserisciPraticaForm.get('dati_istanza.giorni').enable();
  }

  controlloDurataConcessione() {
    if(this.inserisciPraticaForm.get('dati_istanza.anni').touched 
      && this.inserisciPraticaForm.get('dati_istanza.mesi').touched
      && this.inserisciPraticaForm.get('dati_istanza.giorni').touched)
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
    this.initialFormValues = this.inserisciPraticaForm.value;
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
  civilarioResults: any[] = [];
  addInserisciIndirizzoManualmente: boolean = false;
  showInserisciIndirizzoManualmenteDialog: boolean = false;

  searchCivilario(event) {
    this.addInserisciIndirizzoManualmente = false;
    this.commitPoi();
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
          this.messageService.showMessage('warn', 'Ricerca indirizzo', 'Indirizzo non presente nel municipio di appartenenza. Rivolgersi alla toponomastica per il censimento'); // o inserirlo manualmente
          //TO DO: Da riattivare per permettere di inserire manualmente un indirizzo
          // this.addInserisciIndirizzoManualmente = true;
        }
            
      });
  }

  addressListFormatter(data: any) {
    return data ? (data.nome_via || '--') + ', ' + (data.numero || '--') + (data.esponente ? `/${data.esponente}` : '') + ' (' + data.municipio + ')' + (data.localita ? ` - ${data.localita}` : '') : '';
  }

  confermaDatiDialog() {
    if(this.inserisciPraticaForm.valid) {
      this.confirmationService.confirm({
        icon: "pi pi-exclamation-triangle",
        acceptLabel: "Conferma",
        rejectLabel: "Annulla",
        acceptButtonStyleClass: "btn-custom-style btn-dialog-confirm",
        rejectButtonStyleClass: "btn-custom-style btn-dialog-confirm",
        header: "Inserisci pratica",
        message: "Confermi i dati inseriti prima di continuare con l'upload dei documenti?",
        accept: () => {
          this.inserisciPratica();
        }
      });
    }
    else {
      this.utilityService.markAsDirtied(this.inserisciPraticaForm);
      this.messageService.showMessage('error', 'Inserimento pratica', 'Si prega di inserire tutte le informazioni obbligatorie prima di proseguire');
    }  
  }

  inserisciPratica(){
    this.loading = true;

    this.passiCarrabiliService.inserimentoBozzaPratica(this.inserisciPraticaForm.value).subscribe(
      resp => {
        this.loading = false;
        this.uploadDialog(resp);
      },
      err => {
        this.loading = false;
        this.messageService.showMessage('error', 'Inserimento richiesta', err.error.message || err.message);
      }
    );
  }

  uploadDialog(respInsert: any) {

    let data = {
      pratica: respInsert.istanza,
      mode: 'multiple'
    }

    this.uploadedFiles = [];
    this.resetProtocollo();
    let dialogRef = this.dialogService.open(UploadFileComponent, this.utilityService.configDynamicDialogFullScreen(data, "Allega documenti alla pratica"));

    dialogRef.onClose.subscribe((uploadedFiles) => {
      if(uploadedFiles){
        this.uploadedFiles = uploadedFiles.filter(doc => !doc.numero_protocollo || doc.numero_protocollo == '--|--');
        this.inserimentoPraticaGetProtocollo(respInsert);
      }    
      else
        this.messageService.showMessage('warn', 'Inserimento richiesta', respInsert.message);
      
      // this.inserisciPraticaForm.reset(this.initialFormValues);  
      // this.resetProtocollo();
      // this.isPersonaGiuridica = false; 
    });
  }

  async inserimentoPraticaGetProtocollo(respInsert){
    this.loading = true;

    if(!this.objProtocollo) {
      respInsert.istanza.stato_pratica = StatoPraticaPassiCarrabili.Inserita;
      respInsert.istanza.info_passaggio_stato = PassaggiStato.BozzaToInserita;
      this.objProtocollo = this.utilityService.getObjForPdfProtocollo(respInsert.istanza, this.uploadedFiles, respInsert.istanza.info_passaggio_stato);
      let data: any = await this.utilityService.generaPdfPerProtocolloSync(this.objProtocollo, "templateInserimentoPratica").catch(err => {
        this.actionRiprotocollazione = 'inserimentoPraticaGetProtocollo';
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

      this.insertResponse = respInsert;   
      let callProtocollo: Promise<any> = environment.production ? this.protocolloService.richiestaProtocolloEntrataNewSync(this.objProtocollo, this.base64DocInserimento, convertedUploadedFiles) 
                                                                : this.passiCarrabiliService.getNumeroProtocolloSync(null);
      respProtocollo = await callProtocollo.catch(err => {
          this.actionRiprotocollazione = 'inserimentoPraticaGetProtocollo';
          this.messageService.showMessage('warn', 'Numero protocollo', 'Servizio di protocollo non disponibile. Riprovare più tardi.');
        });
    }

    this.numProtocollo = `${respProtocollo?.numeroProtocollo || '--'}|${respProtocollo?.anno || '--'}`;

    //associazione numero di protocollo ai documenti allegati
    if(this.uploadedFiles && this.uploadedFiles.length && this.numProtocollo != '--|--') {
      this.associaProtocolloADocumento();
    }

    if(this.numProtocollo && this.numProtocollo != '--|--')
      this.inserimentoPratica(this.insertResponse.istanza);
    else {
      this.loading = false;
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

  inserimentoPratica(element: any) {
    //aggiunta campo numero_protocollo e inserimento pratica
    element.numero_protocollo = this.numProtocollo;
    element.numero_protocollo_comunicazione = this.numProtocollo;
    this.isProtocollata = true;
    this.showProtocolloDialog = false;

    let emailsMunicipio = [];
    let objTakeEmails = [
      { group_id: Group.DirettoreMunicipio, municipio_id: element.dati_istanza.indirizzo_segnale_indicatore.municipio_id },
      { group_id: Group.IstruttoreMunicipio, municipio_id: element.dati_istanza.indirizzo_segnale_indicatore.municipio_id }
    ];

    this.utilityService.takeEmails(objTakeEmails).subscribe( 
      resp => {
        let emails = resp.data.map(x => x.email);
        emailsMunicipio = emails.filter((item, index) => emails.indexOf(item) === index);

        this.passiCarrabiliService.inserimentoPratica(element).subscribe( 
          resp => {   
            let subject = this.utilityService.getSubjectEmail(resp.istanza, 'Comunicazione inserimento richiesta');
            let cc = this.authService.getEmail();

            //invio mail cittadino  
            let messaggioCittadino = this.emailService.emailAvvioPraticaCittadino(resp.istanza); 
            this.emailService.sendEmail(resp.istanza.anagrafica.email, cc, subject, messaggioCittadino, { emailCittadino: true, municipio_id: this.authService.getMunicipio() });
            
            //invio mail Municipio
            if(emailsMunicipio && emailsMunicipio.length) {
              let messaggioMunicipio = this.emailService.emailAvvioPraticaOperatoreSportello(resp.istanza);            
              this.emailService.sendEmail(emailsMunicipio.join(','), cc, subject, messaggioMunicipio);     
            }
            else {
              this.messageService.showMessage('warn', 'Inserimento richiesta', 'Non sono presenti referenti del municipio relativo all\'indirizzo inserito',3000);
            }

            this.inserisciPraticaForm.reset(this.initialFormValues);  
            this.isPersonaGiuridica = false; 
            this.loading = false;
            this.messageService.showMessage('success', 'Inserimento richiesta', 'La pratica è stata inoltrata al municipio di appartenenza');
            this.showProtocolloDialog = true;
          },
          err => {           
            this.messageService.showMessage('error', 'Inserimento richiesta', err.error.message);
            this.loading = false;
            this.showProtocolloDialog = false;
          }
        );           
      },
      err => {
        this.messageService.showMessage('error', 'Invio email', err.error.message);
        this.loading = false;
        this.showProtocolloDialog = false;
      }
    );
  }

  closeProtocolloDialog(event?) {
    this.showProtocolloDialog = false;
    this.numProtocollo = '';
    this.actionRiprotocollazione = '';
    if (!this.insertResponse.istanza.numero_protocollo) {  
      this.inserisciPraticaForm.reset(this.initialFormValues);       
      this.isPersonaGiuridica = false; 
      this.resetProtocollo();
      this.messageService.showMessage('warn', 'Inserimento richiesta', this.insertResponse.message);
    }
  }

  get thereAreCoordinates(): boolean {
    return this.inserisciPraticaForm.get('dati_istanza.indirizzo_segnale_indicatore').value 
            && this.inserisciPraticaForm.get('dati_istanza.indirizzo_segnale_indicatore').value instanceof Object
            && this.inserisciPraticaForm.get('dati_istanza.indirizzo_segnale_indicatore').value.location.lat
            && this.inserisciPraticaForm.get('dati_istanza.indirizzo_segnale_indicatore').value.location.lon
            ? true : false;
  }

  get geoJsonFeature(): any {
    return this.thereAreCoordinates ? { 0: this.inserisciPraticaForm.value } : null;
  }

  commitPoi(){
    this.hidePositionOnMap = true;
  }

  getCoordinates(el){   
    if(!el){
      this.inserisciPraticaForm.get('dati_istanza.indirizzo_segnale_indicatore').reset();
      this.nominatim_option = {
        nome_via: '',
        numero: null,
        esponente: '',
        municipio: null,
        localita: '',
        lat: null,
        lon: null
      };
    }
    else {
      this.passiCarrabiliService.getIndirizzoFromCoordinates(el.lat, el.lng).subscribe(
        result => {
          this.nominatim_option = {
            nome_via: result.address.road ? result.address.road.toUpperCase() : '',
            numero: result.address.house_number?.replace(/\D/g,'') || null,
            esponente: result.address.house_number?.replace(/[^a-zA-Z']/g, '')?.toUpperCase() || '',
            municipio: null,
            localita: result.address.town || result.address.county ? (result.address.town || result.address.county).toUpperCase() : '',
            lat: el.lat,
            lon: el.lng
          }

          if(result.address.suburb && result.address.suburb.startsWith('Municipio')){
            this.nominatim_option.municipio = Number(result.address.suburb.replace(/\D/g,''));
          }     
          else {
            this.messageService.showMessage('warn', 'Attenzione', 'Municipio di riferimento non trovato');        
          } 

          this.showIndirizzoSegnaleIndicatoreDialog = true;
        },
        err => {
          console.log(err);
        }
      );
    }
  }

  aggiornaIndirizzoSegnaleIndicatore(){
    this.closeIndirizzoSegnaleIndicatoreDialog();
    this.nominatim_option.nome_via = this.nominatim_option.nome_via.toUpperCase();
    this.nominatim_option.esponente = this.nominatim_option.esponente.toUpperCase();
    this.nominatim_option.localita = this.nominatim_option.localita.toUpperCase();
    this.nominatim_option.municipio = `MUNICIPIO N.${this.nominatim_option.municipio}`;
    
    this.setIndirizzoSegnaleIndicatore();
  }

  setIndirizzoSegnaleIndicatore(){
    let indirizzo_segnale_indicatore = {
      indirizzo: this.addressListFormatter(this.nominatim_option),
      location: { lat: this.nominatim_option.lat, lon: this.nominatim_option.lon },
      municipio_id: Number(this.nominatim_option.municipio.replace(/\D/g,'')),
      localita: this.nominatim_option.localita
    }

    this.inserisciPraticaForm.get('dati_istanza.indirizzo_segnale_indicatore').patchValue(indirizzo_segnale_indicatore);
  }

  closeIndirizzoSegnaleIndicatoreDialog() {
    this.showIndirizzoSegnaleIndicatoreDialog = false;
  }

  inserisciIndirizzoManualmente(){
    this.showInserisciIndirizzoManualmenteDialog = true;
  }

  confermaInserimentoIndirizzoManualmente(){
    this.nominatim_option.nome_via = this.nominatim_option.nome_via.toUpperCase();
    this.nominatim_option.esponente = this.nominatim_option.esponente.toUpperCase();
    this.nominatim_option.localita = this.nominatim_option.localita.toUpperCase();
    this.nominatim_option.municipio = `MUNICIPIO N.${this.nominatim_option.municipio}`;

    this.setIndirizzoSegnaleIndicatore();
    this.closeInserisciIndirizzoManualmenteDialog();
  }

  closeInserisciIndirizzoManualmenteDialog(event?) {
    this.showInserisciIndirizzoManualmenteDialog = false;
    this.addInserisciIndirizzoManualmente = false; 

    this.nominatim_option = {
      nome_via: '',
      numero: null,
      esponente: '',
      municipio: null,
      localita: '',
      lat: null,
      lon: null
    };
  }

  isPersonaGiuridica: boolean = false;

  tipologiaPersonaChange(event) {
    this.inserisciPraticaForm.get('anagrafica.tipologia_persona').patchValue(event.checked ? 'G' : 'F');

    if(event.checked) {
      this.inserisciPraticaForm.get('anagrafica.ragione_sociale').enable();
      this.inserisciPraticaForm.get('anagrafica.codice_fiscale_piva').enable();
      this.inserisciPraticaForm.get('anagrafica.indirizzo_sede_legale').enable();
      // this.inserisciPraticaForm.get('anagrafica.codice_fiscale').setValidators(this.validCodFiscaleOrPartivaIva);
      // this.inserisciPraticaForm.get('anagrafica.codice_fiscale').updateValueAndValidity();
    }
    else {
      this.inserisciPraticaForm.get('anagrafica.ragione_sociale').disable();
      this.inserisciPraticaForm.get('anagrafica.codice_fiscale_piva').disable();
      this.inserisciPraticaForm.get('anagrafica.indirizzo_sede_legale').disable();
      // this.inserisciPraticaForm.get('anagrafica.codice_fiscale').setValidators([Validators.required, this.validCodFiscaleOrPartivaIva]);
      // this.inserisciPraticaForm.get('anagrafica.codice_fiscale').updateValueAndValidity();
    }
  }

  resetProtocollo() {
    this.objProtocollo = null;
    this.isProtocollata = false;
    this.base64DocInserimento = '';
  }
}
