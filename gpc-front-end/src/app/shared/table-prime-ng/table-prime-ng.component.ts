import { Component, OnInit, ViewChild, Input, Output, OnChanges, EventEmitter, ViewChildren, QueryList } from '@angular/core';
import { Table, ColumnFilter } from 'primeng/table';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import { saveAs } from 'file-saver';
import * as xlsx from 'xlsx';
import { ColumnSchema } from './models/ColumnSchema';
import { ActionColumnSchema } from './models/ActionColumnSchema';
import { TableEvent } from './models/TableEvent';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { FormatDatePipe } from '../pipe/format-date.pipe';

@Component({
  selector: 'table-prime-ng',
  templateUrl: './table-prime-ng.component.html',
  styleUrls: ['./table-prime-ng.component.css']
})
export class TablePrimeNGComponent implements OnInit, OnChanges {

  displayedColumns: Array<string>;
  _columnSchema: Array<ColumnSchema> = [];
  _actions: Array<ActionColumnSchema> = [];
  _dataSource: any[] = [];
  _bkpDataSource: any[] = [];

  @ViewChild('dt') table: Table;
  @ViewChildren(ColumnFilter) columnFilter: QueryList<ColumnFilter>;

  _selectedColumns: any[];

  selectedRows: any[];

  _globalFilters: any[];

  globalfilterUpdate: Subject<any> = new Subject();

  get thereIsActions(): boolean {
    return this._actions && this._actions.length ? true : false;
  }

  constructor(
    private datePipe: FormatDatePipe
  ) {
    this.globalfilterUpdate.pipe(debounceTime(600),
    distinctUntilChanged())
    .subscribe(value => {
      this.table.filterGlobal(value, 'contains');
    })
  }

  @Input() set columnSchema(value: Array<ColumnSchema>) {
    this._columnSchema = value.map(el => new ColumnSchema(el.field, el.header, el.type, el.pipe, el.show, el.inactive));
  };

  @Input() set actions(value: Array<ActionColumnSchema>) {
    this._actions = value.map(el => new ActionColumnSchema(el.key, el.name, el.icon, el.tooltip, el.hidden, el.disabled));
  };

  @Input() titleTable: string = '';
  @Input() inserisciFeature: string = '';
  @Input() initSortColumn: string = '';
  @Input() directionSortColumn: string = '';
  @Input() dataSource: any[] = [];
  @Input() showToolbar: boolean = true;
  @Input() showCaption: boolean = true; 
  @Input() exportName: string = '';
  @Input() globalFilters: any[] = [];
  @Input() rowsPerPageOptions: any[] = [5,10,20];
  @Input() isAutoLayout: boolean = /*window.innerWidth > 1036 ? true : */false;

  @Output() onEvent = new EventEmitter<TableEvent>();

  dropDownFilters: any = {};

  ngOnInit(): void {
    this._selectedColumns = this._columnSchema;
    this._globalFilters = this.globalFilters.map(el => el.value);
  }

  ngOnChanges() {
    const __this = this;
    this._dataSource = this.dataSource;

    if (this.dataSource && this.dataSource.length && this.columnFilter) {
      let dataFields = this.columnFilter.filter(x => x.type == 'date').map(y => y.field); 
      dataFields.forEach(el => {
        let field = '';
        let dominio = '';

        if(el.indexOf('.') != -1){
          let splitted = el.split('.');
          dominio = splitted[0];
          field = splitted[1];
        }
        else {
          field = el;
        }
        
        this.dataSource.forEach(row => {
          if(dominio) {
            row[dominio][field] = row[dominio][field] ? new Date(row[dominio][field]) : null;
          }
          else {
            row[field] = row[field] ? new Date(row[field]) : null;
          }
        }); 
      });
      this._bkpDataSource = this._dataSource;

      this.columnFilter.forEach(cf => {
        cf.clearFilter = function () {
          this.initFieldFilterConstraint();
          this.dt._filter();

          let dropDownFields = __this._columnSchema.filter(x => x.type == 'dropdown').map(y => y.field);
          if(dropDownFields.indexOf(this.field) != -1)
            __this.resetDropDown(this.field);
        }
      });

      this.initializeDropDownFields();
    }
  }

  getTooltipGlobalFilters():string {
    return `Ricerca per ${this.globalFilters.map(el => el.label).join(', ')} [Filtraggio per singolo campo]`;
  }

  initializeDropDownFields(){
    let dropDownFields = this._columnSchema.filter(x => x.type == 'dropdown');

    dropDownFields.forEach(x => {
      let field = '';
      let dominio = '';

      if(x.field.indexOf('.') > -1) {
        let splitted = x.field.split('.');
        dominio = splitted[0];
        field = splitted[1];
      }

      this.dropDownFilters[x.field] = [];
      this.dropDownFilters['selected_' + x.field] = [];

      var loadedFields = [];
      this._dataSource.forEach(row => {
        if(dominio) {
          if (loadedFields.indexOf(row[dominio][field]) === -1) {
            loadedFields.push(row[dominio][field]);
            this.dropDownFilters[x.field].push({label: x.show(row), value: row[dominio][field]});
          }
        }      
        else {
          if (loadedFields.indexOf(row[x.field]) === -1) {
            loadedFields.push(row[x.field]);
            this.dropDownFilters[x.field].push({label: x.show(row), value: row[x.field]});
          }
        }        
      });
    });
  }

  resetDropDown(field){
    this.dropDownFilters['selected_' + field] = [];
  }

  emitAction(event, data, actionKey) {
    this.onEvent.emit(new TableEvent(event, data, actionKey));
  }

  //gestisce l'input nel filtro globale
  onFilterGlobal(event: any) {
    // this.table.filterGlobal(event.target.value, 'contains');
    this.globalfilterUpdate.next(event.target.value);
  }

  @Input() get selectedColumns(): any[] {
    return this._selectedColumns;
  }

  set selectedColumns(val: any[]) {
    //ristora l'ordine originale
    this._selectedColumns = this._columnSchema.filter(col => val.includes(col));
  }

  //npm install jspdf jspdf-autotable
  exportPdf() {
    const doc = new jsPDF();
    let _schema: any = (this._selectedColumns.length === this._columnSchema.length) ? this._columnSchema : this._selectedColumns;
    let columns: any = _schema.map(col => ({ title: col.header, dataKey: `${col.field}_formatted` }));
    let rows: any[] = JSON.parse(JSON.stringify((this.selectedRows === undefined || this.selectedRows.length === 0) ? this._dataSource : this.selectedRows));
    this._columnSchema.forEach(x => {
      let field = x.field;
      rows.forEach(row => {
        if(x.pipe) {
          switch(x.pipe) { 
            case 'date': { 
              row[`${field}_formatted`] = this.datePipe.transform(x.show(row), false);
              break; 
            } 
            case 'onlyDate': {
              row[`${field}_formatted`] = this.datePipe.transform(x.show(row), true);
              break; 
            }          
          }
        }
        else {
          row[`${field}_formatted`] = x.show(row);
        }         
      });    
    });

    autoTable(doc, {
      columns: columns,
      body: rows,
      styles: { overflow: 'visible', minCellWidth: 20 },
      headStyles: { lineWidth: 0.5, overflow: 'linebreak'},
      bodyStyles: { overflow: 'linebreak' }
    });

    doc.save(`${this.exportName}_export_` + new Date().getTime());
  }

  //npm install xlsx
  exportExcel() {
    let data_to_export = [];
    let rows_to_export = this.selectedRows === undefined || this.selectedRows.length === 0 ? this._dataSource : this.selectedRows;

    let _schema: any = (this._selectedColumns.length === this._columnSchema.length) ? this._columnSchema : this._selectedColumns;
    let columns: any = _schema.map(col => ({ title: col.header, field: col.field }));

    rows_to_export.forEach(row => {
      let obj = {};

      columns.forEach(x => {
        let columnSchema = this._columnSchema.find(col => col.field == x.field);

        if(columnSchema.pipe) {
          switch(columnSchema.pipe) { 
            case 'date': { 
              obj[x.title] = this.datePipe.transform(columnSchema.show(row), false);
              break; 
            } 
            case 'onlyDate': {
              obj[x.title] = this.datePipe.transform(columnSchema.show(row), true);
              break; 
            }          
          }
        }
        else {
          obj[x.title] = columnSchema.show(row);
        }   
      });

      data_to_export.push(obj);
    }); 
    
    const worksheet = xlsx.utils.json_to_sheet(data_to_export);
    const workbook = { Sheets: { 'data': worksheet }, SheetNames: ['data'] };
    const excelBuffer: any = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' });
    this.saveAsExcelFile(excelBuffer, `${this.exportName}`);
  }

  /*
    npm install @types/file-saver --save-dev
    npm install file-saver --save
  */
  saveAsExcelFile(buffer: any, fileName: string): void {
    let EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    let EXCEL_EXTENSION = '.xlsx';
    const data: Blob = new Blob([buffer], {
      type: EXCEL_TYPE
    });
    saveAs(data, fileName + '_export_' + new Date().getTime() + EXCEL_EXTENSION);
  }
}
