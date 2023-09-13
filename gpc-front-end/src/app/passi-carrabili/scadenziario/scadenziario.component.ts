import { Component, Inject, OnInit, Input, OnDestroy, Renderer2 } from '@angular/core';
import { DynamicDialogConfig, DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { StatoPraticaPassiCarrabili } from 'src/app/shared/enums/StatoPratica.enum';
import { UtilityService } from 'src/app/shared/service/utility.service';
import { PassiCarrabiliService } from 'src/app/shared/service/passi.carrabili.service';
import { MessageService } from 'src/app/shared/service/message.service';
import { TableEvent } from 'src/app/shared/table-prime-ng/models/TableEvent';
import { DettaglioPraticaComponent } from 'src/app/passi-carrabili/dettaglio-pratica/dettaglio-pratica.component';
import { Scadenziario } from 'src/app/shared/enums/Scadenziario.enum';
import { ConfirmationService } from 'primeng/api';
import { AuthService } from 'src/app/shared/service/auth.service';

@Component({
  selector: 'app-scadenziario',
  templateUrl: './scadenziario.component.html',
  styleUrls: ['./scadenziario.component.css']
})
export class ScadenziarioComponent implements OnInit, OnDestroy {

  constructor(
    private dialogRef: DynamicDialogRef,
    private authService: AuthService,
    private renderer: Renderer2,
    public dialogService: DialogService,
    public confirmationService: ConfirmationService,
    private messageService: MessageService,
    private passiCarrabiliService: PassiCarrabiliService,
    private utilityService: UtilityService,
    @Inject(DynamicDialogConfig) data: any) {
      this.renderer.addClass(document.body, 'modal-open');
      this.dataSource = data.data;
    }

  showSpinner: boolean = false;
  @Input() dataSource: any[];

  initSortColumn = 'data_operazione';
  directionSortColumn = "-1"; //1=asc  0=rand   -1=desc 
  titleTable: string = 'Pratiche in scadenza';
  exportName = 'Pratiche in scadenza'; 
  globalFilters: any[] = [
    {value:'indirizzo',label:'Indirizzo'},
    {value:'proprietario_pratica',label:'Istruttore'}
  ];

  columnSchema = [
    {
      field: "codice_fiscale",
      header: "Cod. Fiscale/P. IVA",
      type:"text"
    },
    {
      field: "numero_protocollo",
      header: "Num. Protocollo",
      type: "text"
    },
    {
      field: "indirizzo",
      header: "Indirizzo",
      type: "text",
      inactive: true
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
      field: "proprietario_pratica",
      header: "Istruttore",
      type: "text",
    },
    {
      field: "info",
      header: "Informazioni",
      type: "dropdown",
      show: (el) => {
        return Scadenziario[el];
      }
    },
    {
      field: "data_operazione",
      header: "Data notifica",
      type: "date",
      pipe: "date"
    }
  ];

  actions = [
    {
      key: 'dettaglioPratica',
      icon: "pi pi-search",
      tooltip: 'DETTAGLIO',
      disabled: (el) => {
        return !el.codice_fiscale;
      }
    },
    {
      key: 'archiviaPratica',
      icon: "pi pi-inbox",
      tooltip: 'ARCHIVIA',
      hidden: (el) => {
        return el.info != Scadenziario['Scadenza tempistiche integrazione'] && el.info != Scadenziario['Scadenza tempistiche pagamento'];
      }
    }
  ];

  onTableEvent(tableEvent: TableEvent) {
    this[tableEvent.actionKey](tableEvent.data);
  }

  ngOnInit(): void {
    this.showSpinner = true;
    this.passiCarrabiliService.cercaNotificheScadenziario(this.authService.getMunicipio(), this.authService.getGroup()).subscribe(
      data => {
        this.showSpinner = false;
        this.dataSource = data.data.map(x => {
          x.data_operazione = new Date(x.data_operazione);
          return x;
        });
      },
      err => {
        this.showSpinner = false;
        this.messageService.showMessage('error','Ricerca pratiche', "Errore durante il ritrovamento delle pratiche"); 
      });
  }

  ngOnDestroy() {
    this.renderer.removeClass(document.body, 'modal-open');
  }

  dettaglioPratica(element: any) { 
    this.showSpinner = true;
    this.passiCarrabiliService.cercaPratica(element.id_doc).subscribe( pratica => {                  
      this.showSpinner = false;
      let dialogRef = this.dialogService.open(DettaglioPraticaComponent,  this.utilityService.configDynamicDialogFullScreen(pratica, "Pratica cittadino"));
      
      dialogRef.onClose.subscribe((element) => { 
        setTimeout(() => {
          this.renderer.addClass(document.body, 'modal-open');
        }, 0);
      });
    },
    err => {
      this.showSpinner = false;
      this.messageService.showMessage('error','Dettaglio pratica', 'Errore durante il recupero della pratica'); 
    });
  }

  archiviaPratica(element: any) { 
    this.confirmationService.confirm({
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Conferma",
      rejectLabel: "Annulla",
      acceptButtonStyleClass: "btn-custom-style btn-dialog-confirm",
      rejectButtonStyleClass: "btn-custom-style btn-dialog-confirm",
      header: "Archiviazione pratica",
      message: "Confermi di voler archiviare la pratica selezionata?",
      accept: () => {
        this.archiviazionePratica(element);
      }
    });
  }

  archiviazionePratica(element){
    this.showSpinner = true;
    this.passiCarrabiliService.cercaPratica(element.id_doc).subscribe( pratica => {  

      pratica.stato_pratica = StatoPraticaPassiCarrabili.Archiviata;      
      this.passiCarrabiliService.aggiornaPratica(pratica).subscribe( resp => {   

        this.passiCarrabiliService.eliminaPraticaDaScadenziario(resp.istanza.id_doc).subscribe( resp_scadenziario => {    

          this.messageService.showMessage('success', 'Archivia pratica', 'La pratica è stata archiviata');
          this.dataSource = this.dataSource.filter(el => el.id_doc != resp.istanza.id_doc);
          this.dataSource = [...this.dataSource];
          this.showSpinner = false;

        },
        err => {
          this.showSpinner = false;
          this.messageService.showMessage('error','Archivia pratica', 'Errore durante l\'eliminazione della notifica dallo scadenziario'); 
        });
      },
      err => {
        this.showSpinner = false;
        this.messageService.showMessage('error','Archivia pratica', 'Errore durante l\'archiviazione della pratica'); 
      });
    },
    err => {
      this.showSpinner = false;
      this.messageService.showMessage('error','Archivia pratica', 'Errore durante il recupero della pratica'); 
    });
  }

  closeDialog(event?) {
    this.dialogRef.close(event);
  }

}
