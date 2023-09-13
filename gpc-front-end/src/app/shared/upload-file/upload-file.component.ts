import { Component, OnInit, Input, OnChanges, ViewChild, Inject, Output, EventEmitter, OnDestroy, Renderer2 } from '@angular/core';
import { UtilityService } from '../service/utility.service';
import { PassiCarrabiliService } from '../service/passi.carrabili.service';
import { MessageService } from '../service/message.service';
import { saveAs } from 'file-saver';
import { ConfirmationService } from 'primeng/api';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { TipologiaPratica } from '../enums/TipologiaPratica.enum';
import { StatoPraticaPassiCarrabili } from '../enums/StatoPratica.enum';
import { AuthService } from '../service/auth.service';
import { Group } from '../enums/Group.enum';

@Component({
  selector: 'app-upload-file',
  templateUrl: './upload-file.component.html',
  styleUrls: ['./upload-file.component.css']
})
export class UploadFileComponent implements OnInit, OnChanges, OnDestroy {

  constructor(
    private messageService: MessageService,
    private utilityService: UtilityService,
    private passiCarrabiliService: PassiCarrabiliService,
    public confirmationService: ConfirmationService,
    public authService: AuthService,
    private renderer: Renderer2,
    private dialogRef: DynamicDialogRef,
    @Inject(DynamicDialogConfig) data: any) {
      this.pratica = data.data?.pratica || this.pratica;
      this.mode = data.data?.mode || this.mode;
      this.readonly = data.data?.readonly || this.readonly;
      this.isPregresso = data.data?.isPregresso || this.isPregresso;
  }

  ngOnDestroy() {
    if(!this.readonly && this.isMultipleFile)
      this.renderer.removeClass(document.body, 'modal-open');
  }

  @Input() pratica: any;
  @Input() mode: string; //single or multiple
  @Input() readonly: boolean = false;
  @Input() isPregresso: boolean = false;
  @Output() idDocUploaded: EventEmitter<any> = new EventEmitter<any>();
  @Output() fileInCheckout: EventEmitter<any> = new EventEmitter<any>();

  @ViewChild("fp") fp: any;

  loading: boolean = false;
  acceptedExtensions: string = '.pdf,.doc,.docx,.jpg,.png'; //,.p7m,.zip,.rar,.7z
  uploadedFiles: any[] = [];
  checkIntegrazioneFiles: boolean = false;
  tipologiaDocumentoSelezionato: any = {};

  documenti: any[] = [];
  tooltipDocs: string = '';

  get isSingleFile(): boolean {
    return this.mode == 'single' ? true : false;
  }

  get isMultipleFile(): boolean {
    return this.mode == 'multiple' ? true : false;
  }

  get checkPresenzaDocsObbligatori(): boolean {
    return this.documenti.filter(doc => doc.opzionale == false).length > 0 ? true : false;
  }

  ngOnInit() {   
    if(!this.readonly && this.isMultipleFile)
        this.renderer.addClass(document.body, 'modal-open');

    if(this.pratica) {
      if(this.fp)
        this.fp.clear();
      this.initDocuments();
      this.getDocsFromDB();
    } 
  }

  ngOnChanges() {
    if(this.pratica) {
      if(this.fp)
        this.fp.clear();
      this.initDocuments();
      this.getDocsFromDB();
    }  
  }

  get isNewInstance(): boolean {
    return this.pratica?.stato_pratica == StatoPraticaPassiCarrabili.Bozza 
    || this.pratica?.stato_pratica == StatoPraticaPassiCarrabili['Richiesta lavori'] 
    || this.pratica?.stato_pratica == StatoPraticaPassiCarrabili['Attesa fine lavori'] ? true : false;
  }

  get isIntegrationInstance(): boolean {
    return (this.pratica?.stato_pratica == StatoPraticaPassiCarrabili['Necessaria integrazione'] || this.pratica?.stato_pratica == StatoPraticaPassiCarrabili['Preavviso diniego']) ? true : false;
  }

  get isIntegrazioneDecadenza(): boolean {
    return this.pratica?.stato_pratica == StatoPraticaPassiCarrabili['Verifica formale'] && this.pratica?.dati_istanza?.tipologia_processo == TipologiaPratica.Decadenza ? true : false;
  }

  get isAttesaPagamento(): boolean {
    return this.pratica?.stato_pratica == StatoPraticaPassiCarrabili['Attesa di pagamento'] 
            && this.pratica.dati_istanza.tipologia_processo != TipologiaPratica.Rettifica ? true : false;
  }

  sortDocs(documenti) {
    let orderedDocs = documenti.sort(function(x, y) {
      return (x.opzionale === y.opzionale)? 0 : (x.opzionale ? 1 : -1);
    });

    return orderedDocs;
  }

  isFileObbligatorio(document) {
    if(!document.opzionale){
      if(this.uploadedFiles && this.uploadedFiles.length){
        let doc_to_evaluate = this.uploadedFiles.filter(doc => doc.tipologia_documento.id == document.id);
        return doc_to_evaluate && doc_to_evaluate.length ? false : true;
      }
      else 
        return true;
    }
    else  
      return false;
  }

  initDocuments() {
    this.checkIntegrazioneFiles = false;

    //saranno differenti a seconda del type in input
    if(this.isMultipleFile) {
      if(this.isPregresso){
        this.documenti = [
          { id: 'planimetria_stato_luoghi', label: 'Planimetria stato dei luoghi', description: 'Planimetria quotata dello stato dei luoghi (scala1/200) a firma di tecnico abilitato', disabled: false, opzionale: true },
          { id: 'planimetria_locale', label: 'Planimetria locale ', description: 'Planimetria quotata del locale (scala1/100) e dell\'area interessata dal passo carrabile con sezione trasversale a firma di tecnico abilitato', disabled: false, opzionale: true },
          { id: 'documentazione_fotografica', label: 'Documentazione fotografica', description: 'Documentazione fotografica a colori dello stato dei luoghi', disabled: false, opzionale: true },
          { id: 'relazione_tecnica', label: 'Relazione tecnica descrittiva del tecnico', description: 'Relazione tecnica descrittiva dell\'intervento a firma di tecnico abilitato', disabled: false, opzionale: true },
          { id: 'documento_riconoscimento', label: 'Documento di riconoscimento', description: 'Copia documento di riconoscimento del sottoscrittore (carta d\'identità o patente)', disabled: false, opzionale: true },         
          { id: 'certificato_destinazione_uso', label: 'Certificato destinazione uso', description: 'Copia conforme dell\'atto di vincolo a parcheggio o ad autorimessa o del certificato di destinazione d\'uso, o denuncia di variazione di destinazione', disabled: false, opzionale: true },
          { id: 'verbale_assemblea', label: 'Verbale assemblea', description: 'Copia autentica del verbale di assemblea contenente l\'assenso del condominio alla realizzazione del passo carrabile ove trattasi di proprietà condominiale', disabled: false, opzionale: true },
          { id: 'documentazione_uso_locale', label: 'Documentazione uso locale/area', description: 'Documentazione comprovante l\'uso del locale/area che giustifica la deroga rispetto ai requisiti richiesti dall\'art. 22 del regolamento comunale', disabled: false, opzionale: true },
          { id: 'autocertificazione_conformita_tecnico', label: 'Autocertificazione conformità del tecnico', description: 'Nelle ipotesi di cui all\'art. 22 del regolamento: autocertificazione ai sensi del D.P.R.445/2000 da parte del direttore dei lavori o di tecnico abilitato circa la conformità del passo carrabile al progetto assentito', disabled: false, opzionale: true },
          { id: 'nulla_osta_soggetti', label: 'Nulla osta soggetti coinvolti', description: 'Nulla osta di altri soggetti coinvolti es. delega del comproprietario immobile all\'istante o eventuali usufruttuari dell\'immobile', disabled: false, opzionale: true },
          { id: 'visura_camerale', label: 'Visura camerale', description: 'Documentazione comprovante la visura camerale', disabled: false, opzionale: true },
          { id: 'altro_1', label: 'Altro', description: 'Altro documento di cui bisogna speficarne la tipologia', disabled: false, opzionale: true, custom_label: '', custom_id: '' },
        ];

        // La marca da bollo, per le pratiche dello storico, era applicata sul documento cartaceo
        // if(!this.pratica.dichiarazioni_aggiuntive.flag_esenzione){
        //   this.documenti.push({ id: 'dichiarazione_marca_bollo', label: 'Dichiarazione marca da bollo', description: 'Dichiarazione marca da bollo', disabled: false, opzionale: true })       
        // }
        // this.documenti = this.sortDocs(this.documenti);
      }
      else if(!this.readonly && this.pratica.stato_pratica == StatoPraticaPassiCarrabili['Attesa di pagamento']) {
        this.documenti = [
          { id: 'ricevuta_tributi', label: 'Ricevuta tributi', description: 'Ricevuta di pagamento dei tributi', disabled: false, opzionale: false },
          { id: 'atteso_pagamento', label: 'Avviso di pagamento', description: 'Avviso di pagamento', disabled: false, opzionale: true },
          { id: 'rilascio_fine_lavori', label: 'Dichiarazione di fine lavori', description: 'Dichiarazione di fine lavori ed esecuzione degli stessi a regola d\'arte a firma di tecnico abilitato', disabled: false, opzionale: true }          
        ];

        if(!this.pratica.dichiarazioni_aggiuntive.flag_esenzione && !this.pratica.marca_bollo_determina){
          this.documenti.push({ id: 'autocertificazione_pagamento_marca_bollo', label: 'Autocertificazione pagamento marca da bollo', description: 'Autocertificazione di avvenuto pagamento della marca da bollo', disabled: false, opzionale: false })
        }

        if(!this.pratica.dichiarazioni_aggiuntive.flag_esenzione_cup){
          this.documenti.push({ id: 'cup', label: 'Canone Unico Patrimoniale (CUP)', description: 'Canone Unico Patrimoniale (CUP) per l\'occupazione di suolo pubblico', disabled: false, opzionale: true });
        }

        this.documenti = this.sortDocs(this.documenti);
      }
      else {
        switch(this.pratica.dati_istanza.tipologia_processo) { 
          case TipologiaPratica['Concessione Temporanea']: 
          case TipologiaPratica['Concessione Permanente']:
          case TipologiaPratica.Rinnovo: { 
            this.documenti = [
              { id: 'planimetria_stato_luoghi', label: 'Planimetria stato dei luoghi', description: 'Planimetria quotata dello stato dei luoghi (scala1/200) a firma di tecnico abilitato', disabled: false, opzionale: false },
              { id: 'planimetria_locale', label: 'Planimetria locale ', description: 'Planimetria quotata del locale (scala1/100) e dell\'area interessata dal passo carrabile con sezione trasversale a firma di tecnico abilitato', disabled: false, opzionale: false },
              { id: 'documentazione_fotografica', label: 'Documentazione fotografica', description: 'Documentazione fotografica a colori dello stato dei luoghi', disabled: false, opzionale: false },
              { id: 'relazione_tecnica', label: 'Relazione tecnica descrittiva del tecnico', description: 'Relazione tecnica descrittiva dell\'intervento a firma di tecnico abilitato', disabled: false, opzionale: false },
              { id: 'documento_riconoscimento', label: 'Documento di riconoscimento', description: 'Copia documento di riconoscimento del sottoscrittore (carta d\'identità o patente)', disabled: false, opzionale: false },
              { id: 'certificato_destinazione_uso', label: 'Certificato destinazione uso', description: 'Copia conforme dell\'atto di vincolo a parcheggio o ad autorimessa o del certificato di destinazione d\'uso, o denuncia di variazione di destinazione', disabled: false, opzionale: true },
              { id: 'verbale_assemblea', label: 'Verbale assemblea', description: 'Copia autentica del verbale di assemblea contenente l\'assenso del condominio alla realizzazione del passo carrabile ove trattasi di proprietà condominiale', disabled: false, opzionale: true },
              { id: 'documentazione_uso_locale', label: 'Documentazione uso locale/area', description: 'Documentazione comprovante l\'uso del locale/area che giustifica la deroga rispetto ai requisiti richiesti dall\'art. 22 del regolamento comunale', disabled: false, opzionale: true },
              { id: 'autocertificazione_conformita_tecnico', label: 'Autocertificazione conformità del tecnico', description: 'Nelle ipotesi di cui all\'art. 22 del regolamento: autocertificazione ai sensi del D.P.R.445/2000 da parte del direttore dei lavori o di tecnico abilitato circa la conformità del passo carrabile al progetto assentito', disabled: false, opzionale: true },
              { id: 'nulla_osta_soggetti', label: 'Nulla osta soggetti coinvolti', description: 'Nulla osta di altri soggetti coinvolti es. delega del comproprietario immobile all\'istante o eventuali usufruttuari dell\'immobile', disabled: false, opzionale: true },
              { id: 'visura_camerale', label: 'Visura camerale', description: 'Documentazione comprovante la visura camerale', disabled: false, opzionale: true },
              { id: 'altro_1', label: 'Altro', description: 'Altro documento di cui bisogna speficarne la tipologia', disabled: false, opzionale: true, custom_label: '', custom_id: '' },
            ];

            if(!this.pratica.dichiarazioni_aggiuntive.flag_esenzione && !this.pratica.marca_bollo_pratica && !this.pratica.dichiarazioni_aggiuntive.flag_esenzione_modificato){
              this.documenti.push({ id: 'dichiarazione_marca_bollo', label: 'Dichiarazione marca da bollo', description: 'Dichiarazione marca da bollo', disabled: false, opzionale: false })
            }
            else if(!this.pratica.dichiarazioni_aggiuntive.flag_esenzione && !this.pratica.marca_bollo_pratica && this.pratica.dichiarazioni_aggiuntive.flag_esenzione_modificato){
              this.documenti.push({ id: 'dichiarazione_marca_bollo', label: 'Dichiarazione marca da bollo', description: 'Dichiarazione marca da bollo', disabled: false, opzionale: true })
              this.documenti.push({ id: 'dichiarazione_esenzione_marca_bollo', label: 'Dichiarazione esenzione marca da bollo', description: 'Dichiarazione esenzione marca da bollo', disabled: false, opzionale: true })
            }

            this.documenti = this.sortDocs(this.documenti);
            break; 
          } 
          case TipologiaPratica.Rinuncia: {
            this.documenti = [
              { id: 'documento_riconoscimento', label: 'Documento di riconoscimento', description: 'Copia documento di riconoscimento del sottoscrittore (carta d\'identità o patente)', disabled: false, opzionale: false },
              { id: 'ripristino_stato_dei_luoghi', label: 'Documentazione ripristino stato dei luoghi', description: 'Documentazione tecnica ripristino stato dei luoghi da tecnico abilitato', disabled: false, opzionale: false },
              { id: 'eliminazione_scivolo', label: 'Documentazione eliminazione scivolo', description: 'Documentazione fotografica a colori per asseveramento eliminazione scivolo passo carrabile', disabled: false, opzionale: false },
              { id: 'perizia_eliminazione_rampa', label: 'Perizia tecnica eliminazione rampa', description: 'Perizia di asseveramento tecnica per eliminazione rampa "a regola d\'arte" a firma di tecnico abilitato', disabled: false, opzionale: false },
              { id: 'iban', label: 'IBAN richiedente', description: 'Codice IBAN del richiedente per accreditamento cauzione infruttifera: documento di tipo privacy', disabled: false, opzionale: false },
              { id: 'documentazione_fotografica', label: 'Foto ripristino stato dei luoghi', description: 'Foto di ripristino dello stato dei luoghi redatto da tecnico abilitato', disabled: false, opzionale: true },
              { id: 'nulla_osta_soggetti', label: 'Nulla osta soggetti coinvolti', description: 'Nulla osta di altri soggetti coinvolti es. delega del comproprietario immobile all\'istante o eventuali usufruttuari dell\'immobile', disabled: false, opzionale: true },
              { id: 'visura_camerale', label: 'Visura camerale', description: 'Documentazione comprovante la visura camerale', disabled: false, opzionale: true },
              { id: 'altro_1', label: 'Altro', description: 'Altro documento di cui bisogna speficarne la tipologia', disabled: false, opzionale: true, custom_label: '', custom_id: '' },
            ];
            break; 
          }
          case TipologiaPratica.Proroga: {
            this.documenti = [
              { id: 'motivazione_proroga', label: 'Motivazione proroga', description: 'Documento di motivazione proroga redatto da tecnico', disabled: false, opzionale: false },          
              { id: 'altro_1', label: 'Altro', description: 'Altro documento di cui bisogna speficarne la tipologia', disabled: false, opzionale: true, custom_label: '', custom_id: '' },
            ];
            break; 
          }
          case TipologiaPratica['Trasferimento titolarità']: {
            this.documenti = [
              { id: 'planimetria_stato_luoghi', label: 'Planimetria stato dei luoghi', description: 'Planimetria quotata dello stato dei luoghi (scala1/200) a firma di tecnico abilitato', disabled: false, opzionale: false },
              { id: 'planimetria_locale', label: 'Planimetria locale ', description: 'Planimetria quotata del locale (scala1/100) e dell\'area interessata dal passo carrabile con sezione trasversale a firma di tecnico abilitato', disabled: false, opzionale: false },
              { id: 'documentazione_fotografica', label: 'Documentazione fotografica', description: 'Documentazione fotografica a colori dello stato dei luoghi', disabled: false, opzionale: false },
              { id: 'relazione_tecnica', label: 'Relazione tecnica descrittiva del tecnico', description: 'Relazione tecnica descrittiva dell\'intervento a firma di tecnico abilitato', disabled: false, opzionale: false },       
              { id: 'documento_riconoscimento', label: 'Documento di riconoscimento', description: 'Copia documento di riconoscimento del sottoscrittore (carta d\'identità o patente)', disabled: false, opzionale: false },
              { id: 'titolo_giustificativo', label: 'Titolo giustificativo', description: 'Titolo che giustifica la richiesta di variazione: atto di compravendita, denuncia di successione, contratto di locazione, altro', disabled: false, opzionale: false },
              { id: 'certificato_destinazione_uso', label: 'Certificato destinazione uso', description: 'Copia conforme dell\'atto di vincolo a parcheggio o ad autorimessa o del certificato di destinazione d\'uso, o denuncia di variazione di destinazione', disabled: false, opzionale: true },
              { id: 'verbale_assemblea', label: 'Verbale assemblea', description: 'Copia autentica del verbale di assemblea contenente l\'assenso del condominio alla realizzazione del passo carrabile ove trattasi di proprietà condominiale', disabled: false, opzionale: true },
              { id: 'documentazione_uso_locale', label: 'Documentazione uso locale/area', description: 'Documentazione comprovante l\'uso del locale/area che giustifica la deroga rispetto ai requisiti richiesti dall\'art. 22 del regolamento comunale', disabled: false, opzionale: true },
              { id: 'autocertificazione_conformita_tecnico', label: 'Autocertificazione conformità del tecnico', description: 'Nelle ipotesi di cui all\'art. 22 del regolamento: autocertificazione ai sensi del D.P.R.445/2000 da parte del direttore dei lavori o di tecnico abilitato circa la conformità del passo carrabile al progetto assentito', disabled: false, opzionale: true },
              { id: 'nulla_osta_soggetti', label: 'Nulla osta soggetti coinvolti', description: 'Nulla osta di altri soggetti coinvolti es. delega del comproprietario immobile all\'istante o eventuali usufruttuari dell\'immobile', disabled: false, opzionale: true },         
              { id: 'visura_catastale', label: 'Visura catastale', description: 'Visura catastale dell\'immobile', disabled: false, opzionale: true },
              { id: 'visura_camerale', label: 'Visura camerale', description: 'Documentazione comprovante la visura camerale', disabled: false, opzionale: true },
              { id: 'altro_1', label: 'Altro', description: 'Altro documento di cui bisogna speficarne la tipologia', disabled: false, opzionale: true, custom_label: '', custom_id: '' },
            ];

            if(!this.pratica.dichiarazioni_aggiuntive.flag_esenzione && !this.pratica.marca_bollo_pratica && !this.pratica.dichiarazioni_aggiuntive.flag_esenzione_modificato){
              this.documenti.push({ id: 'dichiarazione_marca_bollo', label: 'Dichiarazione marca da bollo', description: 'Dichiarazione marca da bollo', disabled: false, opzionale: false })
            }
            else if(!this.pratica.dichiarazioni_aggiuntive.flag_esenzione && !this.pratica.marca_bollo_pratica && this.pratica.dichiarazioni_aggiuntive.flag_esenzione_modificato){
              this.documenti.push({ id: 'dichiarazione_marca_bollo', label: 'Dichiarazione marca da bollo', description: 'Dichiarazione marca da bollo', disabled: false, opzionale: true })
              this.documenti.push({ id: 'dichiarazione_esenzione_marca_bollo', label: 'Dichiarazione esenzione marca da bollo', description: 'Dichiarazione esenzione marca da bollo', disabled: false, opzionale: true })
            }
            
            this.documenti = this.sortDocs(this.documenti);
            break; 
          }
          case TipologiaPratica['Regolarizzazione furto/deterioramento']: {
            this.documenti = [
              { id: 'denuncia_furto', label: 'Denuncia di furto', description: 'Copia della denuncia di furto alle autorità competenti', disabled: false, opzionale: true },
              { id: 'provvedimento_concessione_originario', label: 'Provvedimento concessione originario', description: 'Copia del provvedimento di concessione del suolo pubblico per passo carrabile del precedente segnale', disabled: false, opzionale: true },
              { id: 'visura_camerale', label: 'Visura camerale', description: 'Documentazione comprovante la visura camerale', disabled: false, opzionale: true },
              { id: 'altro_1', label: 'Altro', description: 'Altro documento di cui bisogna speficarne la tipologia', disabled: false, opzionale: true, custom_label: '', custom_id: '' },
            ];
            break; 
          }
          case TipologiaPratica.Revoca: {
            if(this.pratica.inizio_lavori == false) {
              this.documenti = [
                { id: 'inizio_lavori', label: 'Attestazione di inizio lavori', description: 'Attestazione di inizio lavori', disabled: false, opzionale: false },              
                { id: 'altro_1', label: 'Altro', description: 'Altro documento di cui bisogna speficarne la tipologia', disabled: false, opzionale: true, custom_label: '', custom_id: '' },
              ];
            }
            else {
              this.documenti = [
                { id: 'fine_lavori', label: 'Attestazione di fine lavori', description: 'Attestazione di fine lavori', disabled: false, opzionale: false },
                { id: 'altro_1', label: 'Altro', description: 'Altro documento di cui bisogna speficarne la tipologia', disabled: false, opzionale: true, custom_label: '', custom_id: '' },
              ];
            }         
            break; 
          }
          case TipologiaPratica.Decadenza: {
            this.documenti = [
              { id: 'relazione_decadenza', label: 'Relazione di necessaria decadenza', description: 'Relazione di necessaria decadenza', disabled: false, opzionale: true },           
              { id: 'altro_1', label: 'Altro', description: 'Altro documento di cui bisogna speficarne la tipologia', disabled: false, opzionale: true, custom_label: '', custom_id: '' },
            ];
            break; 
          }
        }
      }
       
    }
    else {
      switch(this.pratica.stato_pratica) { 
        case StatoPraticaPassiCarrabili['Richiesta pareri']: { 
          this.acceptedExtensions = '.pdf,.p7m,.zip,.rar,.7z';
          switch(this.authService.getGroup()) { 
            case Group.PoliziaLocale: { 
              this.documenti = [
                { id: 'relazione_servizio', label: 'Relazione servizio', description: 'Relazione servizio', disabled: false, opzionale: true },
              ];     
              break; 
            } 
            case Group.UfficioTecnicoDecentrato: { 
              this.documenti = [
                { id: 'istruttoria_utd', label: 'Istruttoria UTD', description: 'Istruttoria UTD', disabled: false, opzionale: true },
              ];
              break; 
            } 
            case Group.RipartizioneUrbanistica: { 
              this.documenti = [
                { id: 'istruttoria_urbanistica', label: 'Istruttoria urbanistica', description: 'Istruttoria urbanistica', disabled: false, opzionale: true },
              ];
              break;
            } 
            case Group.IstruttoreMunicipio: { 
              this.documenti = [
                { id: 'doc_richiesta_integrazione_diniego', label: 'Documentazione per integrazione/diniego', description: 'Documentazione per integrazione/diniego', disabled: false, opzionale: true },
              ];
              break;
            } 
          } 
          break; 
        } 
        case StatoPraticaPassiCarrabili['Verifica formale']: { 
          this.acceptedExtensions = '.pdf,.p7m,.zip,.rar,.7z';
          this.documenti = [
            { id: 'doc_richiesta_integrazione_diniego', label: 'Documentazione per integrazione/diniego', description: 'Documentazione per integrazione/diniego', disabled: false, opzionale: true },
          ];
          break; 
        } 
        case StatoPraticaPassiCarrabili.Approvata: 
        case StatoPraticaPassiCarrabili['Pratica da rigettare']:
        case StatoPraticaPassiCarrabili['Pratica da revocare']: { 
          this.setDeterminaDoc();
          break; 
        } 
        case StatoPraticaPassiCarrabili['Attesa di pagamento']: { 
          if(this.pratica.dati_istanza.tipologia_processo == TipologiaPratica.Rettifica) 
            this.setDeterminaDoc();
          else {
            this.documenti = [
              { id: 'ricevuta_tributi', label: 'Ricevuta tributi', description: 'Ricevuta di pagamento dei tributi', disabled: false, opzionale: false },
              { id: 'atteso_pagamento', label: 'Avviso di pagamento', description: 'Avviso di pagamento', disabled: false, opzionale: true },
              { id: 'rilascio_fine_lavori', label: 'Dichiarazione di fine lavori', description: 'Dichiarazione di fine lavori ed esecuzione degli stessi a regola d\'arte a firma di tecnico abilitato', disabled: false, opzionale: true }          
            ];

            if(!this.pratica.dichiarazioni_aggiuntive.flag_esenzione && !this.pratica.marca_bollo_determina){
              this.documenti.push({ id: 'autocertificazione_pagamento_marca_bollo', label: 'Autocertificazione pagamento marca da bollo', description: 'Autocertificazione di avvenuto pagamento della marca da bollo', disabled: false, opzionale: false });
            }
            
            if(!this.pratica.dichiarazioni_aggiuntive.flag_esenzione_cup){
              this.documenti.push({ id: 'cup', label: 'Canone Unico Patrimoniale (CUP)', description: 'Canone Unico Patrimoniale (CUP) per l\'occupazione di suolo pubblico', disabled: false, opzionale: true });
            }
          }
          this.documenti = this.sortDocs(this.documenti);
          break; 
        } 
        default: {
          switch(this.pratica.dati_istanza.tipologia_processo) { 
            case TipologiaPratica.Rettifica: { 
              this.setDeterminaDoc();
              break; 
            } 
          } 
          break;
        }
      } 
    }
  }

  setTooltipDocs() {
    this.tooltipDocs = 'I documenti da allegare alla pratica sono i seguenti:\n\n';
    this.documenti.forEach(el => {
      this.tooltipDocs += `- ${el.label} ${this.isFileObbligatorio(el) ? '(*)' : ''}\n`;
    });

    this.tooltipDocs += '\nN.B.: il simbolo (*) indica i documenti obbligatori.'
  }

  setDeterminaDoc(){
    this.acceptedExtensions = '.pdf,.p7m,.zip,.rar,.7z';
    let determinaID = this.utilityService.getIdDeterminaByType(this.pratica);
    let splitted = determinaID.split('_');
    splitted[0] = this.utilityService.capitalize(splitted[0]);
    this.documenti = [
      { id: determinaID, label: splitted.join(' '), description: splitted.join(' '), disabled: false, opzionale: true },
    ];
  }

  async getDocsFromDB() {
    this.loading = true;
    this.uploadedFiles = [];
    await this.passiCarrabiliService.documentiPraticaSync(this.pratica.id_doc).then(
      resp =>{
        let docs: any = resp;
        if(docs.length) {
          if(!this.readonly && !this.isPregresso) { // true solo per i dettagli pratica
            let tipologiaDocsID = this.documenti.map(doc => doc.id);
            docs = docs.filter(doc => tipologiaDocsID.indexOf(doc.tipologia_documento.id) > -1);
          }

          if(this.isMultipleFile) {
            this.updateDocuments(docs);
          }
          else {  
            let docs_not_protocollo = docs.filter(doc => !doc.numero_protocollo);
            if(docs_not_protocollo.length)
              this.idDocUploaded.emit(docs_not_protocollo[docs_not_protocollo.length-1].id);
          }
            
          this.uploadedFiles = docs.sort((a, b) => new Date(a.last_modification.data_operazione).getTime() - new Date(b.last_modification.data_operazione).getTime());
          this.updateDocumentState();
        }  
        
        this.setTooltipDocs();       
        this.loading = false;
      }
    ).catch( err => {
        this.loading = false;
        this.messageService.showMessage('error','Caricamento File', err.error.message);
      }
    );
  }

  updateDocuments(docs) {
    let tipologie_documenti = docs.map(el => { return el.tipologia_documento; });
    let docTipoAltro = tipologie_documenti.filter(doc => doc.id.startsWith('altro_'));
    let uniqueDocTipoAltro = [];

    for (let i=0; i<docTipoAltro.length; i++) {
      let currDoc = docTipoAltro[i];
      let trovato = false;
      for (let j=0; j<uniqueDocTipoAltro.length; j++) {
        if (uniqueDocTipoAltro[j].id == currDoc.id && uniqueDocTipoAltro[j].custom_label == currDoc.custom_label) {
          trovato = true;
        }
      }
      if (!trovato) {
        uniqueDocTipoAltro.push(currDoc);
      }
    }
  
    if(docTipoAltro.length) {
      this.documenti = this.documenti.filter(doc => !doc.id.startsWith('altro_'));
      this.documenti =  JSON.parse(JSON.stringify([...this.documenti, ...uniqueDocTipoAltro]));
    }
  }

  checkDocsTipizzati(): boolean {
    return this.fp.files.length == Object.keys(this.tipologiaDocumentoSelezionato).length
      ? true : false;
  }

  checkDocsObbligatori(): boolean {
    let docTipizzati = Object.keys(this.tipologiaDocumentoSelezionato).map(function(key){
      return this.tipologiaDocumentoSelezionato[key];
    }, this);

    let ids = docTipizzati.map(doc => { return doc.id});

    this.uploadedFiles.forEach(el => {
      if(ids.indexOf(el.tipologia_documento.id) == -1)
        docTipizzati.push(el.tipologia_documento);
    });

    return docTipizzati.filter(doc => doc.opzionale == false).length >= this.documenti.filter(doc => doc.opzionale == false).length
      ? true : false;
  }

  checkDocsAltroTipizzati(): boolean {
    let docTipizzati = Object.keys(this.tipologiaDocumentoSelezionato).map(function(key){
      return this.tipologiaDocumentoSelezionato[key];
    }, this);

    let docsAltro = docTipizzati.filter(doc => doc.id.startsWith("altro_"));
    if (docsAltro.length == 0) 
      return true;
    else
      return docsAltro.filter(doc => doc.custom_label == "").length == 0
        ? true : false;
  }

  async uploadFiles() {
    this.fp.uploading=true;

    if(!this.checkDocsTipizzati()) {
      this.messageService.showMessage('error','Upload File', 'E\' necessario tipizzare tutti i documenti per eseguire l\'upload');
    }
    else if(!this.checkDocsObbligatori()) {
      this.messageService.showMessage('error','Upload File', 'E\' necessario caricare tutti i file obbligatori per procedere con l\'upload');
    }
    else if(!this.checkDocsAltroTipizzati()) {
      this.messageService.showMessage('error','Upload File', 'E\' necessario tipizzare tutti i file di tipo \'Altro\'');
    }
    else {
      this.loading = true;

      for(let index = 0; index < this.fp.files.length ; index++) {
        let file = this.fp.files[index];

        let extensionFile = file.name.substr(file.name.lastIndexOf('.') + 1).toLowerCase();

        if(this.acceptedExtensions.indexOf(extensionFile) != -1) {
          let revision = this.getRevisionFile(this.tipologiaDocumentoSelezionato[index]);
          let blob = await this.utilityService.convertFileToBase64(file);
          let id = `${this.pratica.id_doc}_${this.tipologiaDocumentoSelezionato[index].id}_${revision}`;
          
          let documento = {
            id: id,
            name: file.name,
            mimeType: file.type,
            blob: blob,
            tipologia_documento: this.tipologiaDocumentoSelezionato[index],
            rev: revision,      
            id_doc: this.pratica.id_doc,
            numero_protocollo: ''
          };

          await this.passiCarrabiliService.uploadDocumentSync(documento).then(resp => {
            this.checkIntegrazioneFiles = true;
            if(this.isSingleFile) {
              this.idDocUploaded.emit(documento.id);
            }
          }).catch(err => {
            let errMessage = err.status = 413 ? 'Errore durante l\'inserimento del documento - dimensione massima file consentita 19mb' : (err.error.message ? err.error.message : err.statusText);
            this.messageService.showMessage('error', 'Upload file', errMessage);
          });     
        }
      }

      this.fp.clear();
      this.nomiUltimiFiles = [];
      this.tipologiaDocumentoSelezionato = {}; 
      setTimeout(async() => {
        await this.getDocsFromDB();
         this.messageService.showMessage('success','Upload File', 'Processo di upload dei file ultimato'); 
      }, 2000);  
    } 

    this.fp.uploadedFileCount = 0;
    this.fp.uploading=false;
  }

  getRevisionFile(tipologia_documento) {
    let files = this.uploadedFiles.filter(el => el.tipologia_documento.id == tipologia_documento.id);
    if (files.length == 0) 
      return 1;
    else { 
      let rev = 0;
      files.forEach(file => {
        if (file.rev > rev )
          rev = file.rev;
      });
      return rev + 1;
    } 
  }

  updateDocumentState(){
    let keys = Object.keys(this.tipologiaDocumentoSelezionato);
    let selectedDoc = keys.map(key => this.tipologiaDocumentoSelezionato[key].id);

    this.documenti.forEach(doc => doc.disabled = selectedDoc.indexOf(doc.id) == -1 ? false : true);

    let docTipoAltro = this.documenti.filter(doc => doc.id.startsWith('altro_'));

    if(this.isMultipleFile && docTipoAltro.length){
      let custom_docs = this.documenti.filter(doc => doc.id.startsWith('altro_') && !doc.custom_label).length;
      if(custom_docs == 0) {
        let altri_docs_ids = docTipoAltro.map(doc => parseInt(doc.id.replace(/\D/g,'')));
        let id = 1;
        while (altri_docs_ids.indexOf(id) != -1) {
          id++;
        }     
        this.documenti.push({ id: `altro_${id}`, label: 'Altro', description: 'Descrizione 6', disabled: false, opzionale: true, custom_label: '', custom_id: '' })
      }    
    }
  }

  onChangeDropDown(event){
    event.value.disabled = true;
    this.updateDocumentState();
    
    // if(this.isSingleFile){
    //   this.uploadFiles();
    // }
  }

  onRemoveFile(index: number) {
    delete this.tipologiaDocumentoSelezionato[index];

    let keys = Object.keys(this.tipologiaDocumentoSelezionato);
    keys = keys.filter(x => parseInt(x) > index);

    keys.forEach(key => {
      let currIndex = parseInt(key);
      let newIndex = currIndex -1;
      this.tipologiaDocumentoSelezionato[newIndex] = this.tipologiaDocumentoSelezionato[currIndex];
      delete this.tipologiaDocumentoSelezionato[currIndex];
    });

    this.updateDocumentState();
  }

  downloadDoc(file){
    this.loading = true;
    this.passiCarrabiliService.getDocumento(file.id).subscribe(file => {
      this.loading = false;
      saveAs(file.blob, file.name);
    },
    err => {
      this.messageService.showMessage('error', 'Download file', err.error.message);
    });
  }

  // removeDoc(index, file){
  //   //confirmationDialog elimazione file dopo upload
  //   this.confirmationService.confirm({
  //     icon: "pi pi-exclamation-triangle",
  //     acceptButtonStyleClass: "btn-custom-style btn-dialog-confirm",
  //     rejectButtonStyleClass: "btn-custom-style btn-dialog-confirm",
  //     acceptLabel: "Conferma",
  //     rejectLabel: "Annulla",
  //     header: "Eliminazione documento",
  //     message: "Confermi di voler eliminare il documento " + file.name + " ?",
  //     accept: async () => {
  //       await this.passiCarrabiliService.deleteDocumentSync(this.uploadedFiles[index].id).then(resp => {
  //         this.uploadedFiles.splice(index,1);
  //         this.updateDocuments(this.uploadedFiles);
  //         if (this.isSingleFile) {
  //           let id_blob = null;
  //           if (this.uploadedFiles.length > 0 ) {
  //             id_blob = this.uploadedFiles[this.uploadedFiles.length - 1 ].id;
  //           }
  //           this.idDocUploaded.emit(id_blob);
  //         }
  //       }).catch(err => {
  //         this.messageService.showMessage('error', 'Upload file', err.error.message ? err.error.message : err.statusText);
  //       });

  //       this.fp.uploadedFileCount = 0/*this.uploadedFiles.length*/;
  //       this.updateDocumentState();
  //     }
  //   });
  // }

  nomiUltimiFiles: string[] = []; //array persistente alla sessione nomi files inseriti

  //in caso di pre-upload di files duplicati avvisa l'utente 
  checkDuplicateFiles(event) {
    //rimuovo ulteriori duplicati da array contenente i nomi dei file inseriti nel pre-upload
    this.nomiUltimiFiles = this.removeDuplicates(this.nomiUltimiFiles);

    //creo due array con nomi dei files, quelli correnti e quelli selezionati dall'utente
    let nomiFilesCurrent = event.currentFiles.map(file => file.name);
    let nomiFilesSelected = [...event.files].map(file => file.name);

    //inserisco nell'array persistente di nomi dei files gli ultimi correnti
    nomiFilesCurrent.forEach(file => {
      this.nomiUltimiFiles.push(file);
    });

    //salvo in un array i nomi dei file duplicati dell'array persistente dei files
    let results = this.findDuplicates(this.nomiUltimiFiles);

    //per ogni file selezionato dall'utente verifico che non sia presente nell'array dei files duplicati
    nomiFilesSelected.forEach(fileSel => {
      results.forEach(file => {
        if (file == fileSel) {        
          this.messageService.showMessage('warn','Upload File', 'File già presente tra i documenti inseriti');
        }
      })
    });
  }

  //elimino dall'array persistente dei files in pre-upload il file selezionato dalla remove
  removeSingleFile(event) {
    this.nomiUltimiFiles = this.nomiUltimiFiles.filter(valore => {
      return valore != event.file.name;
    });
  }

  //restituisco array degli elementi duplicati
  findDuplicates = (arr) => {
    return arr.filter((nome, indice, array) => array.indexOf(nome) !== indice);
  }

  //rimuove i duplicati in un array
  removeDuplicates = (arr) => {
    return arr.filter((valore, indice, array) => array.indexOf(valore) === indice);
  }

  closeDialog(event?) {
    this.dialogRef.close(event);
  }

  checkSpecialCharactersFieldName(index) {
    let isValid = this.utilityService.excludeSpecialCharacters(this.tipologiaDocumentoSelezionato[index].custom_label);
    if(!isValid)
      this.tipologiaDocumentoSelezionato[index].custom_label = this.tipologiaDocumentoSelezionato[index].custom_label.replace(/[^A-Za-z0-9 -_.']/g, '').trim();
  }

  customLabelChange(index){
    if(this.tipologiaDocumentoSelezionato[index].custom_label) {
      this.tipologiaDocumentoSelezionato[index].custom_id = this.tipologiaDocumentoSelezionato[index].custom_label.toLowerCase().replace(/ /g, '_').replace(/-/g, '_').replace(/[^A-Za-z0-9_]/g, '');
      this.updateDocumentState();
    }  
  }

  inviaRichiesta() {
    //controllare che tutti i doc obbligatori sono stati caricati
    let docsObbligatori = this.uploadedFiles.map(doc => doc.tipologia_documento).filter(doc => !doc.opzionale);
    let uniqueDocsObbligatori = [];

    for (let i=0; i<docsObbligatori.length; i++) {
      let currDoc = docsObbligatori[i];
      let trovato = false;
      for (let j=0; j<uniqueDocsObbligatori.length; j++) {
        if (uniqueDocsObbligatori[j].id == currDoc.id) {
          trovato = true;
        }
      }
      if (!trovato) {
        uniqueDocsObbligatori.push(currDoc);
      }
    }

    let newDocsObbligatori = this.documenti.filter(doc => !doc.opzionale);
    uniqueDocsObbligatori = uniqueDocsObbligatori.filter(doc => {
      let fildDoc = newDocsObbligatori.find(el => el.id == doc.id);
      return !fildDoc ? false : true;
    });
    
    if(newDocsObbligatori.length == uniqueDocsObbligatori.length) 
      this.closeDialog(this.uploadedFiles);
    else 
      this.messageService.showMessage('error', 'Upload file', 'Prima di inviare la richiesta bisogna allegare tutti i documenti obbligatori');
  }

  selectedFile(event){
    if(event.files && event.files.length > 0)
      this.fileInCheckout.emit(true);
    else
      this.fileInCheckout.emit(false);
  }
}
