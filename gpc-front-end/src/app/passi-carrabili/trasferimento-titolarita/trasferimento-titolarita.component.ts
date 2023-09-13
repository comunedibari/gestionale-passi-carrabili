import { Component, OnInit, Inject, OnDestroy, Renderer2 } from '@angular/core';
import { FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { UtilityService } from '../../shared/service/utility.service';
import { PassiCarrabiliService } from '../../shared/service/passi.carrabili.service';
import { MessageService } from '../../shared/service/message.service';
import { ConfirmationService } from 'primeng/api';
import { DialogService, DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { AuthService } from 'src/app/shared/service/auth.service';
import { Group } from '../../shared/enums/Group.enum'; 
import { TipologiaPratica } from 'src/app/shared/enums/TipologiaPratica.enum';
import { Fabbricato } from 'src/app/shared/enums/Fabbricato.enum';
import { ProprietaImmobile } from 'src/app/shared/enums/ProprietaImmobile.enum';
import { EmailService } from '../../shared/service/email.service';
import { map } from 'rxjs/operators';
import { UploadFileComponent } from 'src/app/shared/upload-file/upload-file.component';
import { TitoloAutorizzativo } from 'src/app/shared/enums/TitoloAutorizzativo.enum';
import { environment } from '../../../environments/environment';
import { ProtocolloService } from 'src/app/shared/service/protocollo.service';
import { StatoPraticaPassiCarrabili } from '../../shared/enums/StatoPratica.enum';
import { PassaggiStato } from 'src/app/shared/enums/PassaggiStato.enum';

@Component({
  selector: 'app-trasferimento-titolarita',
  templateUrl: './trasferimento-titolarita.component.html',
  styleUrls: ['./trasferimento-titolarita.component.css']
})
export class TrasferimentoTitolaritaComponent implements OnInit, OnDestroy {

  constructor(
    private passiCarrabiliService: PassiCarrabiliService,
    private protocolloService: ProtocolloService,
    private fb: FormBuilder,
    private messageService: MessageService,
    private utilityService: UtilityService,
    public dialogService: DialogService,
    public confirmationService: ConfirmationService,
    private emailService: EmailService,
    public authService: AuthService,
    private renderer: Renderer2,
    private dialogRef: DynamicDialogRef,
    @Inject(DynamicDialogConfig) data: any) {
      this.renderer.addClass(document.body, 'modal-open');

      this.pratica = JSON.parse(JSON.stringify(data.data));
      this.utilityService.formattazioneDatePerFE(this.pratica);
      
      this.readonly = this.utilityService.checkDichiarazioniTrasferimentoTitolarita(this.pratica);
      data.header += this.readonly ? ' - Flusso semplificato' : ' - Flusso completo';
  }

  ngOnDestroy() {
    this.renderer.removeClass(document.body, 'modal-open');
  }

  pratica: any = {};
  showProtocolloDialog: boolean = false;
  numProtocollo: string = '';
  isProtocollata: boolean = false;
  loading: boolean = false;
  insertResponse: any;
  readonly: boolean = true;
  actionRiprotocollazione: string = '';
	uploadedFiles: any[] = [];
  base64DocInserimento: string = '';
  objProtocollo: any = null;
  dateNow = new Date();

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
      indirizzo_sede_legale: [this.pratica.anagrafica?.indirizzo_sede_legale, [Validators.required]],
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
      // if(!this.inserisciPraticaForm.get('dichiarazioni_aggiuntive.motivazione_esenzione').value) {
      //   this.inserisciPraticaForm.get('dichiarazioni_aggiuntive.motivazione_esenzione').patchValue('');
      //   this.inserisciPraticaForm.get('dichiarazioni_aggiuntive.motivazione_esenzione').markAsDirty();
      //   this.inserisciPraticaForm.get('dichiarazioni_aggiuntive.motivazione_esenzione').markAsTouched();
      // }    
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
    this.inserisciPraticaForm.patchValue(this.pratica);

    //reset campi con dati relativi specificamente al vecchio proprietario
    this.inserisciPraticaForm.get('anagrafica').reset();
    this.inserisciPraticaForm.get('anagrafica.tipologia_persona').patchValue('F');
    this.tipologiaPersonaChange({checked: false});
    this.inserisciPraticaForm.get('dati_istanza.motivazione_richiesta').reset();
    this.inserisciPraticaForm.get('dati_istanza.ruolo_richiedente').reset();
    this.inserisciPraticaForm.get('dichiarazioni_aggiuntive.accettazione_suolo_pubblico').reset();
    this.inserisciPraticaForm.get('dichiarazioni_aggiuntive.conoscenza_spese_carico').reset();
    this.inserisciPraticaForm.get('dichiarazioni_aggiuntive.flag_esenzione').reset();

    if(!this.readonly){
      this.inserisciPraticaForm.get('dati_istanza.utilizzo_locali').reset();
      this.inserisciPraticaForm.get('dati_istanza.specifica_utilizzo_locali').reset();
      this.inserisciPraticaForm.get('dichiarazioni_aggiuntive.titolo_autorizzativo').reset();
    }
    
    this.setSpecificaAltro();
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

  confermaDatiDialog() {
    if(this.inserisciPraticaForm.valid) {
      this.confirmationService.confirm({
        icon: "pi pi-exclamation-triangle",
        acceptLabel: "Conferma",
        rejectLabel: "Annulla",
        acceptButtonStyleClass: "btn-custom-style btn-dialog-confirm",
        rejectButtonStyleClass: "btn-custom-style btn-dialog-confirm",
        header: "Trasferimento Titolarità",
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
    let pratica = Object.assign({}, this.inserisciPraticaForm.value);
    pratica.dati_istanza.tipologia_processo = TipologiaPratica['Trasferimento titolarità']; 
    pratica.dichiarazioni_modifiche_luoghi = this.pratica.dichiarazioni_modifiche_luoghi;

    if(this.readonly) {
      if (this.pratica.parere_polizia) {
        pratica.parere_polizia = this.pratica.parere_polizia;
      }
      if (this.pratica.parere_utd) {
        pratica.parere_utd = this.pratica.parere_utd;
      }
      if (this.pratica.parere_urbanistica) {
        pratica.parere_urbanistica = this.pratica.parere_urbanistica;
      }
    }   

    pratica.dati_istanza.link_pratica_origine = {
      id_doc: this.pratica.id_doc,
      numero_protocollo: this.pratica.numero_protocollo,
      durata_giorni_concessione: this.pratica.dati_istanza.durata_giorni_concessione,
      anni: this.pratica.dati_istanza?.anni,
      mesi: this.pratica.dati_istanza?.mesi,
      giorni: this.pratica.dati_istanza?.giorni,
      data_scadenza_concessione: this.pratica.dati_istanza.data_scadenza_concessione,
      id_determina: this.pratica.determina?.id || this.pratica.dati_istanza.link_pratica_origine?.id_determina,
      data_emissione: this.pratica.determina?.data_emissione || this.pratica.dati_istanza.link_pratica_origine?.data_emissione,
      tag_rfid: this.pratica.tag_rfid || this.pratica.dati_istanza.link_pratica_origine?.tag_rfid
    };   

    this.passiCarrabiliService.inserimentoBozzaPratica(pratica).subscribe(
      resp => {
        this.loading = false;
        this.uploadDialog(resp);
      },
      err => {
        this.loading = false;
        this.messageService.showMessage('error', 'Inserisci pratica', err.error.message || err.message);
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
      else {
        this.messageService.showMessage('warn', 'Inserimento richiesta', respInsert.message);
        this.closeDialog();
      }      
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
    element.numero_protocollo = this.numProtocollo;
    element.numero_protocollo_comunicazione = this.numProtocollo;
    this.isProtocollata = true;
    this.showProtocolloDialog = false;

    let emailsMunicipio = [];
    let objTakeEmails = [
      { group_id: Group.DirettoreMunicipio, municipio_id: element.dati_istanza.indirizzo_segnale_indicatore.municipio_id }
    ];
    
    if(this.authService.getGroup() != Group.IstruttoreMunicipio)
      objTakeEmails.push({ group_id: Group.IstruttoreMunicipio, municipio_id: element.dati_istanza.indirizzo_segnale_indicatore.municipio_id });

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
              this.messageService.showMessage('warn', 'Inserisci pratica', 'Non sono presenti referenti del municipio relativo all\'indirizzo inserito',3000);
            }

            this.messageService.showMessage('success', 'Inserisci pratica', 'La pratica è stata inoltrata al municipio di appartenenza');
            this.loading = false;
            this.showProtocolloDialog = true;
            // this.closeDialog();
          },
          err => {
            this.messageService.showMessage('error', 'Inserisci pratica', err.error.message);
            this.loading = false;
            this.showProtocolloDialog = false;
            this.closeDialog();
          }
        );           
      },
      err => {
        this.messageService.showMessage('error', 'Invio email', err.error.message);
        this.loading = false;
        this.showProtocolloDialog = false;
        this.closeDialog();
      }
    );
  }

  closeDialog(event?) {
    this.dialogRef.close(event);
  }

  closeProtocolloDialog(event?) {
    this.showProtocolloDialog = false;
    this.numProtocollo = '';
    this.actionRiprotocollazione = '';
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
