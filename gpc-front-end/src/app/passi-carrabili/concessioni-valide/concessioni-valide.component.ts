import { Component, OnInit, Renderer2 } from '@angular/core';
import { StatoPraticaPassiCarrabili } from 'src/app/shared/enums/StatoPratica.enum';
import { TipologiaPratica } from 'src/app/shared/enums/TipologiaPratica.enum';
import { TableEvent } from 'src/app/shared/table-prime-ng/models/TableEvent';
import { PassiCarrabiliService } from 'src/app/shared/service/passi.carrabili.service';
import { MessageService } from 'src/app/shared/service/message.service';
import { AuthService } from 'src/app/shared/service/auth.service';
import { DialogService } from 'primeng/dynamicdialog';
import { DettaglioPraticaComponent } from '../dettaglio-pratica/dettaglio-pratica.component';
import { UtilityService } from 'src/app/shared/service/utility.service';
import { ConfirmationService } from 'primeng/api';
import { Group } from 'src/app/shared/enums/Group.enum';
import { EmailService } from 'src/app/shared/service/email.service';
import { RinunciaConcessioneComponent } from '../rinuncia-concessione/rinuncia-concessione.component';
import { RinnovaConcessioneComponent } from '../rinnova-concessione/rinnova-concessione.component';
import { ProrogaConcessioneComponent } from '../proroga-concessione/proroga-concessione.component';
import { TrasferimentoTitolaritaComponent } from '../trasferimento-titolarita/trasferimento-titolarita.component';
import { FurtoDeterioramentoComponent } from '../furto-deterioramento/furto-deterioramento.component';
import { RevocaConcessioneComponent } from '../revoca-concessione/revoca-concessione.component';
import { DecadenzaConcessioneComponent } from '../decadenza-concessione/decadenza-concessione.component';
import { MappaComponent } from 'src/app/shared/mappa/mappa.component';

@Component({
  selector: 'app-concessioni-valide',
  templateUrl: './concessioni-valide.component.html',
  styleUrls: ['./concessioni-valide.component.css']
})
export class ConcessioniValideComponent implements OnInit {

  constructor(
    private passiCarrabiliService: PassiCarrabiliService,
    private messageService: MessageService,
    public authService: AuthService,
    public dialogService: DialogService,
    private utilityService: UtilityService,
    public confirmationService: ConfirmationService,
    private emailService: EmailService,
    private renderer: Renderer2,
  ) { }

  pratica: any;
  showSpinner: boolean = false;
  dataSource: any[];
  showProcessiPostConcessioneDialog: boolean = false;

  showDichiarazioniModificheStatoLuoghiDialog: boolean = false;
  condizioniTrasferimentoTitolaritaSchema: any[] = [
    {
      label: 'Non sono intercorse modifiche dello stato dei luoghi',
      value: 'no_modifiche_stato_luoghi'
    },
    {
      label: 'Non sono intercorse modifiche nella destinazione d\'uso',
      value: 'no_modifiche_destinazione_uso'
    },
    {
      label: 'Non è tecnicamente possibile procedere alla regolarizzazione del passo carrabile ai sensi dell\'art. 46 D.P.R.495/1992',
      value: 'no_regolarizzazione'
    }
  ];
  selectedCondizioniTrasferimentoTitolarita: any[] = [];

  initSortColumn = 'last_modification.data_operazione';
  directionSortColumn = "-1"; //1=asc  0=rand   -1=desc 
  titleTable: string = 'Concessioni valide';
  exportName = 'Concessioni valide'; 
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
    {
      field: "stato_pratica",
      header: "Stato",
      type: "dropdown",
      show: (el) => {
        return StatoPraticaPassiCarrabili[el];
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
      key: 'processiPostConcessione',
      icon: "pi pi-arrow-circle-right",
      tooltip: 'AVVIA PROCESSO POST CONCESSIONE',
      hidden: (el) => {
        return this.authService.getGroup() != Group.OperatoreSportello 
                && this.authService.getGroup() != Group.IstruttoreMunicipio;
      }
    },
    {
      key: 'revocaConcessione',
      icon: "pi pi-ban",
      tooltip: 'REVOCA CONCESSIONE',
      hidden: (el) => {
        return this.authService.getGroup() != Group.DirettoreMunicipio 
          && this.authService.getGroup() != Group.IstruttoreMunicipio
          && this.authService.getGroup() != Group.PoliziaLocale;
      }
    },
    {
      key: 'decadenzaConcessione',
      icon: "pi pi-minus-circle",
      tooltip: 'DECADENZA CONCESSIONE',
      hidden: (el) => {
        return this.authService.getGroup() != Group.DirettoreMunicipio 
          && this.authService.getGroup() != Group.IstruttoreMunicipio
          && this.authService.getGroup() != Group.PoliziaLocale;
      }
    }
  ];

  onTableEvent(tableEvent: TableEvent) {
    this[tableEvent.actionKey](tableEvent.data);
  }

  get isPermanente(): boolean {
    return this.pratica?.dati_istanza.concessione == TipologiaPratica['Concessione Permanente'] ? true : false;
  }

  ngOnInit(): void {
    this.cercaPratiche();
  }

  cercaPratiche(){
    this.showSpinner = true;
    this.passiCarrabiliService.cercaPratichePerStatoPratica(StatoPraticaPassiCarrabili['Concessione valida'], this.authService.getMunicipio()).subscribe(
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

  openMapDialog(){
    let data = {
      elements: this.dataSource,
      fullScreen: true,
      enableHeatmap: true
    }

    let dialogRef = this.dialogService.open(MappaComponent, this.utilityService.configDynamicDialogFullScreen(data, "Concessioni valide"));

    dialogRef.onClose.subscribe((element) => {
      if (element) {
        let el = this.dataSource.find(pratica => pratica.id_doc == element.id);
        this.dettaglioPratica(el);
      }
    });
  }

  processiPostConcessione(element: any) {
    this.pratica = element;
    this.showProcessiPostConcessioneDialog = true;
  }

  async rinunciaConcessione(element: any) {
    if(this.utilityService.checkPraticaPregresso(element)) {
      if(this.utilityService.checkDataAvvioProcesso(element.dati_istanza.data_scadenza_concessione, 90)) {
        var resp = await this.passiCarrabiliService.checkAvvioProcessiPostConcessioneMultipli(element).catch(err => {
          this.showSpinner = false;
          this.messageService.showMessage('warn', 'Avvio processo post concessione', err.error.message || err.message);
        });

        if(resp) {
          this.showProcessiPostConcessioneDialog = false;
          let dialogRef = this.dialogService.open(RinunciaConcessioneComponent, this.utilityService.configDynamicDialogFullScreen(element, "Rinuncia concessione"));
          
          dialogRef.onClose.subscribe((istanza) => {
            if (istanza) {
              // this.dataSource = this.dataSource.filter(el => el.id_doc != istanza.id_doc);
              // this.dataSource.push(istanza);
              // this.dataSource = [...this.dataSource];
            }
          });
        }
      }
      else {
        this.messageService.showMessage('warn', 'Rinuncia concessione', 'Non è più possibile avviare una rinuncia della concessione in quanto mancano meno di 90 giorni dalla data di scadenza della concessione');
      }
    }
    else {
      this.messageService.showMessage('warn', 'Rinuncia concessione', 'Non è possibile avviare la rinuncia della concessione in quanto bisogna prima bonificare la pratica proveniente dallo storico');
    }
  }

  async rinnovoConcessione(element: any) {
    if(this.utilityService.checkPraticaPregresso(element)) {
      if(this.utilityService.checkDataAvvioProcesso(element.dati_istanza.data_scadenza_concessione, 90)) {
        var resp = await this.passiCarrabiliService.checkAvvioProcessiPostConcessioneMultipli(element).catch(err => {
          this.showSpinner = false;
          this.messageService.showMessage('warn', 'Avvio processo post concessione', err.error.message || err.message);
        });

        if(resp) {
          this.showProcessiPostConcessioneDialog = false;
          let dialogRef = this.dialogService.open(RinnovaConcessioneComponent, this.utilityService.configDynamicDialogFullScreen(element, "Rinnovo concessione"));

          dialogRef.onClose.subscribe((istanza) => {
            if (istanza) {
              // this.dataSource = this.dataSource.filter(el => el.id_doc != istanza.id_doc);
              // this.dataSource.push(istanza);
              // this.dataSource = [...this.dataSource];
            }
          });
        }
      }
      else {
        this.messageService.showMessage('warn', 'Rinnovo concessione', 'Non è più possibile avviare un rinnovo della concessione in quanto mancano meno di 90 giorni dalla data di scadenza della concessione');
      }
    }
    else {
      this.messageService.showMessage('warn', 'Rinnovo concessione', 'Non è possibile avviare il rinnovo della concessione in quanto bisogna prima bonificare la pratica proveniente dallo storico');
    }
  }

  async prorogaConcessione(element: any) {
    if(this.utilityService.checkPraticaPregresso(element)) {
      if(this.utilityService.checkDataAvvioProcesso(element.dati_istanza.data_scadenza_concessione, 15)) {
        if(this.utilityService.checkAvvioProroga(element, true)) {
          var resp = await this.passiCarrabiliService.checkAvvioProcessiPostConcessioneMultipli(element).catch(err => {
            this.showSpinner = false;
            this.messageService.showMessage('warn', 'Avvio processo post concessione', err.error.message || err.message);
          });
        
          if(resp) {
            this.showProcessiPostConcessioneDialog = false;
            let dialogRef = this.dialogService.open(ProrogaConcessioneComponent, this.utilityService.configDynamicDialogFullScreen(element, "Proroga concessione"));

            dialogRef.onClose.subscribe((istanza) => {
              if (istanza) {
                // this.dataSource = this.dataSource.filter(el => el.id_doc != istanza.id_doc);
                // this.dataSource.push(istanza);
                // this.dataSource = [...this.dataSource];
              }
            });
          }
        }
        else {
          this.messageService.showMessage('warn', 'Proroga concessione', 'Non è più possibile avviare una proroga della concessione in quanto è stato raggiunto un anno di concessione');
        }
      }
      else {
        this.messageService.showMessage('warn', 'Proroga concessione', 'Non è più possibile avviare una proroga della concessione in quanto mancano meno di 15 giorni dalla data di scadenza della concessione');
      }
    }
    else {
      this.messageService.showMessage('warn', 'Proroga concessione', 'Non è possibile avviare la proroga della concessione in quanto bisogna prima bonificare la pratica proveniente dallo storico');
    }
  }

  async trasferimentoTitolarita(element: any) {
    if(this.utilityService.checkPraticaPregresso(element)) {
      if(this.utilityService.checkDataAvvioProcesso(element.dati_istanza.data_scadenza_concessione, 90)) {
        var resp = await this.passiCarrabiliService.checkAvvioProcessiPostConcessioneMultipli(element).catch(err => {
          this.showSpinner = false;
          this.messageService.showMessage('warn', 'Avvio processo post concessione', err.error.message || err.message);
        });
        
        if(resp) {
          this.showProcessiPostConcessioneDialog = false;
          this.renderer.addClass(document.body, 'modal-open');
          this.showDichiarazioniModificheStatoLuoghiDialog = true;
        }
      }
      else {
        this.messageService.showMessage('warn', 'Trasferimento titolarità', 'Non è più possibile avviare un trasferimento di titolarità in quanto mancano meno di 90 giorni dalla data di scadenza della concessione');
      }
    }
    else {
      this.messageService.showMessage('warn', 'Trasferimento titolarità', 'Non è possibile avviare il trasferimento di titolarità della concessione in quanto bisogna prima bonificare la pratica proveniente dallo storico');
    }
  }

  avviaTrasferimentoTitolarita(element){
    let dichiarazioni_modifiche_luoghi = {
      no_modifiche_stato_luoghi: this.selectedCondizioniTrasferimentoTitolarita.indexOf('no_modifiche_stato_luoghi') > -1,
      no_modifiche_destinazione_uso: this.selectedCondizioniTrasferimentoTitolarita.indexOf('no_modifiche_destinazione_uso') > -1,
      no_regolarizzazione: this.selectedCondizioniTrasferimentoTitolarita.indexOf('no_regolarizzazione') > -1
    }
    element.dichiarazioni_modifiche_luoghi = dichiarazioni_modifiche_luoghi;

    this.closeDichiarazioniModificheStatoLuoghiDialog();
    let dialogRef = this.dialogService.open(TrasferimentoTitolaritaComponent, this.utilityService.configDynamicDialogFullScreen(element, "Trasferimento Titolarità"));

    dialogRef.onClose.subscribe((istanza) => {
      if (istanza) {
        // this.dataSource = this.dataSource.filter(el => el.id_doc != istanza.id_doc);
        // this.dataSource.push(istanza);
        // this.dataSource = [...this.dataSource];
      }
    });
  }

  closeDichiarazioniModificheStatoLuoghiDialog(){
    this.showDichiarazioniModificheStatoLuoghiDialog = false;
    this.selectedCondizioniTrasferimentoTitolarita = [];
  }

  async regolarizzazioneFurto(element: any){
    if(this.utilityService.checkPraticaPregresso(element)) {
      if(this.utilityService.checkDataAvvioProcesso(element.dati_istanza.data_scadenza_concessione, 90)) {
        var resp = await this.passiCarrabiliService.checkAvvioProcessiPostConcessioneMultipli(element).catch(err => {
          this.showSpinner = false;
          this.messageService.showMessage('warn', 'Avvio processo post concessione', err.error.message || err.message);
        });
        
        if(resp) {
          this.showProcessiPostConcessioneDialog = false;
          let dialogRef = this.dialogService.open(FurtoDeterioramentoComponent, this.utilityService.configDynamicDialogFullScreen(element, "Regolarizzazione per furto/deterioramento"));

          dialogRef.onClose.subscribe((istanza) => {
            if (istanza) {
              // this.dataSource = this.dataSource.filter(el => el.id_doc != istanza.id_doc);
              // this.dataSource.push(istanza);
              // this.dataSource = [...this.dataSource];
            }
          });
        }
      }
      else {
        this.messageService.showMessage('warn', 'Regolarizzazione per furto/deterioramento', 'Non è più possibile avviare una regolarizzazione per furto/deterioramento in quanto mancano meno di 90 giorni dalla data di scadenza della concessione');
      }
    }
    else {
      this.messageService.showMessage('warn', 'Regolarizzazione per furto/deterioramento', 'Non è possibile avviare la regolarizzazione per furto/deterioramento della concessione in quanto bisogna prima bonificare la pratica proveniente dallo storico');
    }
  }

  async revocaConcessione(element: any){
    if(this.utilityService.checkPraticaPregresso(element)) {
      var resp = await this.passiCarrabiliService.checkAvvioProcessiPostConcessioneMultipli(element).catch(err => {
        this.showSpinner = false;
        this.messageService.showMessage('warn', 'Avvio processo post concessione', err.error.message || err.message);
      });
      
      if(resp) {
        let dialogRef = this.dialogService.open(RevocaConcessioneComponent, this.utilityService.configDynamicDialogFullScreen(element, "Revoca concessione"));

        dialogRef.onClose.subscribe((istanza) => {
          if (istanza) {
            // this.dataSource = this.dataSource.filter(el => el.id_doc != istanza.id_doc);
            // this.dataSource.push(istanza);
            // this.dataSource = [...this.dataSource];
          }
        });
      }
    }
    else {
      this.messageService.showMessage('warn', 'Revoca concessione', 'Non è possibile avviare la revoca della concessione in quanto bisogna prima bonificare la pratica proveniente dallo storico');
    }
  }

  async decadenzaConcessione(element: any){
    if(this.utilityService.checkPraticaPregresso(element)) {
      var resp = await this.passiCarrabiliService.checkAvvioProcessiPostConcessioneMultipli(element).catch(err => {
        this.showSpinner = false;
        this.messageService.showMessage('warn', 'Avvio processo post concessione', err.error.message || err.message);
      });
      
      if(resp) {
        let dialogRef = this.dialogService.open(DecadenzaConcessioneComponent, this.utilityService.configDynamicDialogFullScreen(element, "Decadenza concessione"));

        dialogRef.onClose.subscribe((istanza) => {
          if (istanza) {
            // this.dataSource = this.dataSource.filter(el => el.id_doc != istanza.id_doc);
            // this.dataSource.push(istanza);
            // this.dataSource = [...this.dataSource];
          }
        });
      }
    }
    else {
      this.messageService.showMessage('warn', 'Decadenza concessione', 'Non è possibile avviare la decadenza della concessione in quanto bisogna prima bonificare la pratica proveniente dallo storico');
    }
  }
}
