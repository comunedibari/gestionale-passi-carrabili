import { Component, Inject, OnInit, Input, OnDestroy, Renderer2 } from '@angular/core';
import { DynamicDialogConfig, DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { TableEvent } from 'src/app/shared/table-prime-ng/models/TableEvent';
import { StatoPraticaPassiCarrabili } from '../enums/StatoPratica.enum';

@Component({
  selector: 'app-help',
  templateUrl: './help.component.html',
  styleUrls: ['./help.component.css']
})
export class HelpComponent implements OnInit {

  constructor(
    private dialogRef: DynamicDialogRef,
    private renderer: Renderer2,
    public dialogService: DialogService,
    @Inject(DynamicDialogConfig) data: any) {
      this.renderer.addClass(document.body, 'modal-open');
    }

  dataSource: any[] = [
    {
      stato_pratica: 'Bozza',
      explanation: 'Pratica in bozza da completare'
    },
    {
      stato_pratica: 'Inserita',
      explanation: 'Pratica completata e protocollata in attesa di essere assegnata dal dirigente/presa in carico dall\'istruttore'
    },
    {
      stato_pratica: 'Verifica formale',
      explanation: 'Pratica assegnata/presa in carico ed in lavorazione'
    },
    {
      stato_pratica: 'Richiesta pareri',
      explanation: 'Pratica in attesa di rilascio pareri'
    },
    {
      stato_pratica: 'Necessaria integrazione',
      explanation: 'Pratica in attesa di integrazione documentale da parte dell\'istante'
    },
    {
      stato_pratica: 'Pratica da rigettare',
      explanation: 'Pratica in attesa del rigetto da parte dell\'istruttore'
    },
    {
      stato_pratica: 'Approvata',
      explanation: 'Pratica approvata in attesa dell\'adozione della determina'
    },
    {
      stato_pratica: 'Preavviso diniego',
      explanation: 'Pratica in attesa di integrazione da parte dell\'istante dopo il preavviso di diniego'
    },
    {
      stato_pratica: 'Attesa di pagamento',
      explanation: 'In attesa dell\'effettuazione dei pagamenti'
    },
    {
      stato_pratica: 'Pronto al rilascio',
      explanation: 'In attesa del rilascio del segnale'
    },
    {
      stato_pratica: 'Concessione valida',
      explanation: 'Segnale indicatore consegnato'
    },
    {
      stato_pratica: 'Pronto alla restituzione',
      explanation: 'In attesa di restituzione del segnale indicatore'
    },
    {
      stato_pratica: 'Richiesta lavori',
      explanation: 'Pratica in attesa di inizio lavori da parte dell\'istante per evitare la revoca'
    },
    {
      stato_pratica: 'Attesa fine lavori',
      explanation: 'Pratica in attesa di fine lavori da parte dell\'istante per evitare la revoca'
    },
    {
      stato_pratica: 'Pratica da revocare',
      explanation: 'Pratica in attesa della revoca da parte dell\'istruttore'
    },
    {
      stato_pratica: 'Regolarizzazione',
      explanation: 'Richiesta di regolarizzazione inserita su istanza d\'ufficio'
    },
    {
      stato_pratica: 'Archiviata',
      explanation: 'Concessione archiviata'
    },
    {
      stato_pratica: 'Revocata',
      explanation: 'Concessione revocata'
    },
    {
      stato_pratica: 'Rigettata',
      explanation: 'Pratica rigettata'
    }
  ];


  initSortColumn = 'stato_pratica';
  directionSortColumn = "1"; //1=asc  0=rand   -1=desc 
  rowsPerPageOptions = [20];
  titleTable: string = 'Spiegazione stati pratica';
  exportName = 'Spiegazione stati pratica'; 
  globalFilters: any[] = [
    {value:'stato_pratica',label:'Stato pratica'},
  ];

  columnSchema = [
    {
      field: "stato_pratica",
      header: "Stato pratica",
      type: "text",
      inactive: true
    },
    {
      field: "explanation",
      header: "Spiegazione stato",
      type: "text"
    }
  ];

  actions = [];

  onTableEvent(tableEvent: TableEvent) {
    this[tableEvent.actionKey](tableEvent.data);
  }

  ngOnInit(): void {
  }

  ngOnDestroy() {
    this.renderer.removeClass(document.body, 'modal-open');
  }

  closeDialog(event?) {
    this.dialogRef.close(event);
  }

}
