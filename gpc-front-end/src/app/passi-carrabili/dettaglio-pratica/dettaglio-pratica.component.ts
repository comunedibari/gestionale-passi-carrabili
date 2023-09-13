import { Component, Inject, OnInit, Input, OnDestroy, Renderer2} from '@angular/core';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import { FormBuilder } from '@angular/forms';
import { TipologiaPratica } from 'src/app/shared/enums/TipologiaPratica.enum';
import { ProprietaImmobile } from 'src/app/shared/enums/ProprietaImmobile.enum';
import { Fabbricato } from 'src/app/shared/enums/Fabbricato.enum';
import { StatoPraticaPassiCarrabili } from 'src/app/shared/enums/StatoPratica.enum';
import { UtilityService } from 'src/app/shared/service/utility.service';
import { PassiCarrabiliService } from 'src/app/shared/service/passi.carrabili.service';
import { MessageService } from 'src/app/shared/service/message.service';
import { TableEvent } from 'src/app/shared/table-prime-ng/models/TableEvent';
import { DialogService } from 'primeng/dynamicdialog';
import { TitoloAutorizzativo } from 'src/app/shared/enums/TitoloAutorizzativo.enum';

@Component({
  selector: 'app-dettaglio-pratica',
  templateUrl: './dettaglio-pratica.component.html',
  styleUrls: ['./dettaglio-pratica.component.css']
})
export class DettaglioPraticaComponent implements OnInit, OnDestroy {

  constructor(
    private fb: FormBuilder,
    private renderer: Renderer2,
    public dialogService: DialogService,
    private messageService: MessageService,
    private passiCarrabiliService: PassiCarrabiliService,
    private utilityService: UtilityService,
    @Inject(DynamicDialogConfig) data: any) {
      this.renderer.addClass(document.body, 'modal-open');
      
      if(data.data.pratica){
        this.dataForm = data.data.pratica;
        this.showDocsAndStorico = data.data.showDocsAndStorico != undefined ? data.data.showDocsAndStorico : true;
        this.showStorico = data.data.showStorico != undefined ? data.data.showStorico : true;
        
        if(data.data.showDocsAndStorico != undefined)
          data.header += ' - dettaglio storico';
        else if(data.data.showStorico != undefined)
          data.header += ' - dettaglio pratica d\'origine';
      }
      else
        this.dataForm = data.data;
    }

  ngOnDestroy() {
    if(this.showDocsAndStorico)
      this.renderer.removeClass(document.body, 'modal-open');
  }

  @Input() dataForm: any;
  showDocsAndStorico: boolean = true;
  showStorico: boolean = true;
  dettaglioPraticaForm: any;
  hidePositionOnMap: boolean = true;
  showSpinner: boolean = false;
  dataSource: any[];

  initSortColumn = 'last_modification.data_operazione';
  directionSortColumn = "-1"; //1=asc  0=rand   -1=desc 

  columnSchema = [
    {
      field: "numero_protocollo_comunicazione",
      header: "N. Prot. Operazione",
      type:"text"
    },
    {
      field: "stato_pratica",
      header: "Stato pratica",
      type: "dropdown",
      show: (el) => {
        return StatoPraticaPassiCarrabili[el];
      }
    },
    {
      field: "info_passaggio_stato",
      header: "Descrizione operazione",
      type:"text"
    },
    {
      field: "last_modification.utente",
      header: "Op. eseguita da",
      type:"text"
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
    }
  ];

  onTableEvent(tableEvent: TableEvent) {
    this[tableEvent.actionKey](tableEvent.data);
  }

  dettaglioPratica(element: any) {
    let data = {
      pratica: element,
      showDocsAndStorico: false
    };

    this.dialogService.open(DettaglioPraticaComponent,  this.utilityService.configDynamicDialogFullScreen(data, "Pratica cittadino"));
  }

  getTooltipTipologiaFabbricato(value) {
    return this.tipologiaFabbricatoSchema.find(el => el.label == value)?.descrizione;
  }

  getTooltipTitoloAutorizzativo(value) {
    return this.titoloAutorizzativoSchema.find(el => el.label == value)?.descrizione;
  }

  getTooltipProprietarioImmobile(value) {
    return this.ruoloRichiedenteSchema.find(el => el.label == value)?.descrizione;
  }

  get isTrasferimentoTitolarita():boolean {
    return this.dataForm.dati_istanza.tipologia_processo == TipologiaPratica['Trasferimento titolarità'] ? true : false;
  }

  get typeTrasferimentoTitolarita(): string {
    let allTrue = this.utilityService.checkDichiarazioniTrasferimentoTitolarita(this.dataForm);
    return allTrue == true ? 'Flusso semplificato' : 'Flusso completo';
  }

  get currElement(){
    return { 0: this.dataForm };
  }

  ngOnInit(): void {
    this.utilityService.formattazioneDatePerFE(this.dataForm);

    this.dettaglioPraticaForm = this.fb.group({
      anagrafica: this.fb.group({
        nome: [this.dataForm.anagrafica.nome],
        cognome: [this.dataForm.anagrafica.cognome],
        sesso: [this.dataForm.anagrafica.sesso],
        data_nascita: [this.dataForm.anagrafica.data_nascita],
        luogo_nascita: [this.dataForm.anagrafica.luogo_nascita],
        luogo_residenza: [this.dataForm.anagrafica.luogo_residenza],
        codice_fiscale: [this.dataForm.anagrafica.codice_fiscale],
        recapito_telefonico: [this.dataForm.anagrafica.recapito_telefonico],
        email: [this.dataForm.anagrafica.email],
        tipologia_persona: [this.dataForm.anagrafica.tipologia_persona],
        ragione_sociale: [this.dataForm.anagrafica.ragione_sociale],
        codice_fiscale_piva: [this.dataForm.anagrafica.codice_fiscale_piva],
        indirizzo_sede_legale: [this.dataForm.anagrafica.indirizzo_sede_legale],
      }),
      dati_istanza: this.fb.group({
        concessione: [this.dataForm.dati_istanza.concessione],
        durata_giorni_concessione: [this.dataForm.dati_istanza.durata_giorni_concessione],
        anni: [this.dataForm.dati_istanza.anni],
        mesi: [this.dataForm.dati_istanza.mesi],
        giorni: [this.dataForm.dati_istanza.giorni],
        indirizzo_segnale_indicatore: [this.dataForm.dati_istanza.indirizzo_segnale_indicatore.indirizzo],
        motivazione_richiesta: [this.dataForm.dati_istanza.motivazione_richiesta],
        ruolo_richiedente: [ProprietaImmobile[this.dataForm.dati_istanza.ruolo_richiedente]],
        utilizzo_locali: [Fabbricato[this.dataForm.dati_istanza.utilizzo_locali]],
        specifica_utilizzo_locali: [this.dataForm.dati_istanza.specifica_utilizzo_locali],
        tipologia_processo: [TipologiaPratica[this.dataForm.dati_istanza.tipologia_processo]],
        data_scadenza_concessione: [this.dataForm.dati_istanza.data_scadenza_concessione]
      }),
      dichiarazioni_aggiuntive: this.fb.group({
        accettazione_suolo_pubblico: [this.dataForm.dichiarazioni_aggiuntive.accettazione_suolo_pubblico],
        conoscenza_spese_carico: [this.dataForm.dichiarazioni_aggiuntive.conoscenza_spese_carico],
        locale_area: [this.dataForm.dichiarazioni_aggiuntive.locale_area],
        capienza_min_veicoli: [this.dataForm.dichiarazioni_aggiuntive.capienza_min_veicoli],
        vincolo_parcheggio: [this.dataForm.dichiarazioni_aggiuntive.vincolo_parcheggio],
        distanza_intersezione: [this.dataForm.dichiarazioni_aggiuntive.distanza_intersezione],
        larghezza: [this.dataForm.dichiarazioni_aggiuntive.larghezza],
        profondita: [this.dataForm.dichiarazioni_aggiuntive?.profondita],
        titolo_autorizzativo: this.fb.group({
          tipologia: [TitoloAutorizzativo[this.dataForm.dichiarazioni_aggiuntive?.titolo_autorizzativo?.tipologia]],
          specifica_tipologia: [this.dataForm.dichiarazioni_aggiuntive?.titolo_autorizzativo?.specifica_tipologia],
          riferimento: [this.dataForm.dichiarazioni_aggiuntive?.titolo_autorizzativo?.riferimento]
        }),
        flag_esenzione: [this.dataForm.dichiarazioni_aggiuntive?.flag_esenzione],
        motivazione_esenzione: [this.dataForm.dichiarazioni_aggiuntive?.motivazione_esenzione],
        flag_esenzione_cup: [this.dataForm.dichiarazioni_aggiuntive?.flag_esenzione_cup],
        motivazione_esenzione_cup: [this.dataForm.dichiarazioni_aggiuntive?.motivazione_esenzione_cup],
      }),
      informazioni_aggiuntive: this.fb.group({
        numero_protocollo: [this.dataForm.numero_protocollo],
        stato_pratica: [StatoPraticaPassiCarrabili[this.dataForm.stato_pratica]],
        data_inserimento: [this.dataForm.data_inserimento],
        data_scadenza_procedimento: [this.dataForm.data_scadenza_procedimento],
        proprietario_pratica: [this.dataForm.proprietario_pratica?.utente],
        id_determina: [this.dataForm.determina?.id],
        determina_data_emissione: [this.dataForm.determina?.data_emissione],
        data_scadenza_pagamento: [this.dataForm.data_scadenza_pagamento],
        data_scadenza_restituzione: [this.dataForm.data_scadenza_restituzione],
        tag_rfid: [this.dataForm.tag_rfid],
        id_determina_rettifica: [this.dataForm.determina_rettifica?.id],
        determina_rettifica_data_emissione: [this.dataForm.determina_rettifica?.data_emissione],
        iud: [this.dataForm.dovuto?.iud],
        iuv: [this.dataForm.dovuto?.iuv],
        cauzione_infruttifera: [this.dataForm.dovuto?.cauzione_infruttifera],
        costo_segnale_indicatore: [this.dataForm.dovuto?.costo_segnale_indicatore]
      })
    });

    if (this.dataForm.marca_bollo_pratica) {
      this.dettaglioPraticaForm.addControl('marca_bollo_pratica',this.fb.group({
        iuv: [this.dataForm.marca_bollo_pratica.iuv],
        impronta_file: [this.dataForm.marca_bollo_pratica.impronta_file],
        importo_pagato: [this.dataForm.marca_bollo_pratica.importo_pagato],
        causale_pagamento: [this.dataForm.marca_bollo_pratica.causale_pagamento],
        id_richiesta: [this.dataForm.marca_bollo_pratica.id_richiesta],
        data_operazione: [this.dataForm.marca_bollo_pratica.data_operazione]
      })
      );
    }

    if (this.dataForm.marca_bollo_determina) {
      this.dettaglioPraticaForm.addControl('marca_bollo_determina',this.fb.group({
        iuv: [this.dataForm.marca_bollo_determina.iuv],
        impronta_file: [this.dataForm.marca_bollo_determina.impronta_file],
        importo_pagato: [this.dataForm.marca_bollo_determina.importo_pagato],
        causale_pagamento: [this.dataForm.marca_bollo_determina.causale_pagamento],
        id_richiesta: [this.dataForm.marca_bollo_determina.id_richiesta],
        data_operazione: [this.dataForm.marca_bollo_determina.data_operazione]
      })
      );
    }

    if (this.dataForm.dati_istanza.link_pratica_origine) {
      this.dettaglioPraticaForm.addControl('link_pratica_origine',this.fb.group({
        numero_protocollo: [this.dataForm.dati_istanza.link_pratica_origine.numero_protocollo],
        id_determina: [this.dataForm.dati_istanza.link_pratica_origine.id_determina],
        tag_rfid: [this.dataForm.dati_istanza.link_pratica_origine.tag_rfid]
      })
      );
    }

    if (this.dataForm.informazioni_rettifica) {
      this.dettaglioPraticaForm.addControl('informazioni_rettifica',this.fb.group({
        note: [this.dataForm.informazioni_rettifica?.note]
      })
      );
    }

    if (this.dataForm.parere_municipio) {
      this.dettaglioPraticaForm.addControl('parere_municipio',this.fb.group({
        note: [this.dataForm.parere_municipio?.note],
        data_scadenza_integrazione: [this.dataForm.data_scadenza_integrazione],
        data_scadenza_diniego: [this.dataForm.data_scadenza_diniego],
        lavori_richiesti: [this.dataForm.parere_municipio?.lavori_richiesti],
        data_scadenza_inizio_lavori: [this.dataForm.data_scadenza_inizio_lavori],
        data_scadenza_fine_lavori: [this.dataForm.data_scadenza_fine_lavori],
        note_decadenza: [this.dataForm.parere_municipio?.note_decadenza],
        data_scadenza_notifica_decadenza: [this.dataForm.data_scadenza_notifica_decadenza]
      })
      );
    }

    if (this.dataForm.parere_polizia && this.dataForm.parere_polizia?.note != '') {
      this.dettaglioPraticaForm.addControl('parere_polizia',this.fb.group({
          competenza: [this.dataForm.parere_polizia.competenza],
          parere: [this.dataForm.parere_polizia.parere],
          note: [this.dataForm.parere_polizia?.note]
      })
      );
    }

    if (this.dataForm.parere_utd && this.dataForm.parere_utd?.note != '') {
      this.dettaglioPraticaForm.addControl('parere_utd',this.fb.group({
          competenza: [this.dataForm.parere_utd.competenza],
          parere: [this.dataForm.parere_utd.parere],
          note: [this.dataForm.parere_utd?.note]
      })
      );
    }

    if (this.dataForm.parere_urbanistica && this.dataForm.parere_urbanistica?.note != '') {
      this.dettaglioPraticaForm.addControl('parere_urbanistica',this.fb.group({
          competenza: [this.dataForm.parere_urbanistica.competenza],
          parere: [this.dataForm.parere_urbanistica.parere],
          note: [this.dataForm.parere_urbanistica?.note]
      })
      );
    }

    if(this.showDocsAndStorico) {
      this.showSpinner = true;
      this.passiCarrabiliService.storicoPratica(this.dataForm.id_doc).subscribe( data => {                    
        this.showSpinner = false;
        this.dataSource = data.data;
      },
      err => {
        this.showSpinner = false;
        this.messageService.showMessage('error','Storico pratica', 'Errore durante il recupero dello storico della pratica'); 
      });
    }
  }//end ngOnInit()
  
  //selectButton Competenza Attori Coinvolti
  competenza: any[] = [
    { label: "Competenza", value: true },
    { label: "Non Competenza", value: false }
  ]
 //selectButton Pareri Attori Coinvolti
  parere: any[] = [
    { label: "Positivo", value: true },
    { label: "Negativo", value: false },
    { label: "Non di Competenza", value: null }
  ]
  //selectButton primeNG
  sessoUsers: any[] = [
    { label: "Maschio", value: "M" },
    { label: "Femmina", value: "F" }
  ]

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

  tipologiaFabbricatoSchema = [
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

  dettaglioPraticaOrigine() {
    this.showSpinner = true;
    this.passiCarrabiliService.cercaPratica(this.dataForm.dati_istanza.link_pratica_origine.id_doc).subscribe( pratica => {                  
      this.showSpinner = false;
      let data = {
        pratica: pratica,
        showStorico: false
      }; 
      this.dialogService.open(DettaglioPraticaComponent,  this.utilityService.configDynamicDialogFullScreen(data, "Pratica cittadino"));
    },
    err => {
      this.showSpinner = false;
      this.messageService.showMessage('error','Dettagli pratica d\'origine', 'Errore durante il recupero della pratica d\'origine'); 
    });
  }

  get isPersonaGiuridica(): boolean {
    return this.dettaglioPraticaForm.get('anagrafica.tipologia_persona').value == 'G' ? true : false;
  }
}
