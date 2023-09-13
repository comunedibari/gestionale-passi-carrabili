import { Component, Inject, OnInit, Input, OnDestroy, Renderer2} from '@angular/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { AbstractControl, FormBuilder, Validators } from '@angular/forms';
import { PagamentiService } from 'src/app/shared/service/pagamenti.service';
import { UtilityService } from 'src/app/shared/service/utility.service';
import { MessageService } from 'src/app/shared/service/message.service';
import { FormatDatePipe } from 'src/app/shared/pipe/format-date.pipe';
import { DialogService } from 'primeng/dynamicdialog';
import { ConfirmationService } from 'primeng/api';
import { AuthService } from 'src/app/shared/service/auth.service';
import * as JsonToXML from "js2xmlparser";
import { DateTime } from 'luxon';

@Component({
  selector: 'app-creazione-dovuto',
  templateUrl: './creazione-dovuto.component.html',
  styleUrls: ['./creazione-dovuto.component.css']
})
export class CreazioneDovutoComponent implements OnInit, OnDestroy {

  @Input() dataForm: any;
  dovutoForm: any;
  showSpinner: boolean = false;
  bilancio: any = {};
  dateNow = new Date();

  constructor(
    private fb: FormBuilder,
    private renderer: Renderer2,
    public dialogService: DialogService,
    private dialogRef: DynamicDialogRef,
    private messageService: MessageService,
    private pagamentiService: PagamentiService,
    private utilityService: UtilityService,
    public authService: AuthService,
    private datePipe: FormatDatePipe,
    public confirmationService: ConfirmationService,
    @Inject(DynamicDialogConfig) data: any) {
      this.renderer.addClass(document.body, 'modal-open');
      this.dataForm = data.data;
      
      if(!this.dataForm.data_scadenza_pagamento){
        this.dataForm.data_scadenza_pagamento = DateTime.local().plus({ days: 30 }).startOf('day').toISO();
      }

      this.utilityService.formattazioneDatePerFE(this.dataForm);

      this.dovutoForm = this.fb.group({
        anagrafica: this.fb.group({
          tipoIdentificativoUnivoco: [this.dataForm.anagrafica.tipologia_persona, [Validators.required]],
          codiceIdentificativoUnivoco: [this.dataForm.anagrafica.codice_fiscale, [Validators.required, Validators.maxLength(35), this.validCodFiscaleOrPartivaIva]],
          anagraficaPagatore: [`${this.dataForm.anagrafica.nome} ${this.dataForm.anagrafica.cognome}`, [Validators.required, Validators.maxLength(70)]],
          indirizzoPagatore: ['', [Validators.required, Validators.maxLength(70)]], //campo non obbligatorio per MyPay
          civicoPagatore: ['', [Validators.required, Validators.maxLength(16)]], //campo non obbligatorio per MyPay
          capPagatore: ['', [Validators.required, Validators.maxLength(16)]], //campo non obbligatorio per MyPay
          localitaPagatore: ['', [Validators.required, Validators.maxLength(35)]], //campo non obbligatorio per MyPay
          provinciaPagatore: ['', [Validators.required, Validators.maxLength(2)]], //campo non obbligatorio per MyPay
          nazionePagatore: ['', [Validators.required, Validators.maxLength(2)]], //campo non obbligatorio per MyPay
          mailPagatore: [this.dataForm.anagrafica.email, [Validators.required, Validators.email, Validators.pattern('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,4}$'), Validators.maxLength(256)]] //campo non obbligatorio per MyPay
        }), 
        dovuto: this.fb.group({
          dataEsecuzionePagamento: [this.dataForm.data_scadenza_pagamento, [Validators.required]],
          tipoDovuto: ['C_A662_PASSI_CARRABILI_ATTESO'],
          tipoVersamento: [['ALL']],
          causaleVersamento: [`PAGAMENTO CAUZIONE INFRUTTIFERA E COSTO SEGNALE INDICATORE - Municipio ${this.authService.getMunicipio()} - ${this.datePipe.transform(Date.now(), true)}`, [Validators.required, Validators.maxLength(140)]],
          datiSpecificiRiscossione: ['', [Validators.required, Validators.maxLength(140)]],
          flgGeneraIuv: [true],
          azione: ['I'],
          commissioneCaricoPa: [0, [Validators.required, Validators.maxLength(12), this.numberControl, Validators.min(0), Validators.max(1000)]]
        }),
        bilancio: this.fb.group({
          bilancio: ['', [Validators.maxLength(4096)]],
          importoDovuto: [0, [Validators.required, Validators.maxLength(12), this.numberControl]],
          cauzione_infruttifera: [null, [Validators.required, Validators.maxLength(12), this.numberControl, Validators.min(0), Validators.max(1000)]],
          codCapitolo_cauzione_infruttifera: [''],
          codUfficio_cauzione_infruttifera: [''],
          codAccertamento_cauzione_infruttifera: [''],
          costo_segnale_indicatore: [null, [Validators.required, Validators.maxLength(12), this.numberControl, Validators.min(0), Validators.max(1000)]],
          codCapitolo_costo_segnale_indicatore: [''],
          codUfficio_costo_segnale_indicatore: [''],
          codAccertamento_costo_segnale_indicatore: ['']
        })
      });
    }

  ngOnDestroy() {
    this.renderer.removeClass(document.body, 'modal-open');
  }

  ngOnInit(): void {
    this.showSpinner = true;
    this.utilityService.getConfiguration('hub_pagamenti').subscribe(
      data => {
        this.setConfiguration(data);
        this.showSpinner = false;
      },
      err => {
        this.showSpinner = false;
        this.messageService.showMessage('error','Configurazione parametri', "Errore durante il ritrovamento dei parametri di configurazione"); 
      });
  }

  setConfiguration(config){
    switch(this.authService.getMunicipio()) { 
      case 1: { 
        this.dovutoForm.get('bilancio.codUfficio_cauzione_infruttifera').patchValue(config.codUfficio_municipio_1);
        this.dovutoForm.get('bilancio.codUfficio_costo_segnale_indicatore').patchValue(config.codUfficio_municipio_1);
        break; 
      } 
      case 2: { 
        this.dovutoForm.get('bilancio.codUfficio_cauzione_infruttifera').patchValue(config.codUfficio_municipio_2);
        this.dovutoForm.get('bilancio.codUfficio_costo_segnale_indicatore').patchValue(config.codUfficio_municipio_2);
        break; 
      } 
      case 3: { 
        this.dovutoForm.get('bilancio.codUfficio_cauzione_infruttifera').patchValue(config.codUfficio_municipio_3);
        this.dovutoForm.get('bilancio.codUfficio_costo_segnale_indicatore').patchValue(config.codUfficio_municipio_3);
        break; 
      } 
      case 4: { 
        this.dovutoForm.get('bilancio.codUfficio_cauzione_infruttifera').patchValue(config.codUfficio_municipio_4);
        this.dovutoForm.get('bilancio.codUfficio_costo_segnale_indicatore').patchValue(config.codUfficio_municipio_4);
        break; 
      } 
      case 5: { 
        this.dovutoForm.get('bilancio.codUfficio_cauzione_infruttifera').patchValue(config.codUfficio_municipio_5);
        this.dovutoForm.get('bilancio.codUfficio_costo_segnale_indicatore').patchValue(config.codUfficio_municipio_5); 
        break; 
      } 
    } 

    this.dovutoForm.get('dovuto.datiSpecificiRiscossione').patchValue(config.datiSpecificiRiscossione);
    this.dovutoForm.get('bilancio.cauzione_infruttifera').patchValue(Number(config.cauzione_infruttifera));
    this.dovutoForm.get('bilancio.costo_segnale_indicatore').patchValue(Number(config.costo_segnale_indicatore));
    this.dovutoForm.get('bilancio.codCapitolo_cauzione_infruttifera').patchValue(config.codCapitolo_cauzione_infruttifera);
    this.dovutoForm.get('bilancio.codCapitolo_costo_segnale_indicatore').patchValue(config.codCapitolo_costo_segnale_indicatore);
    
    this.calcolaImporto();
  }

  rangeIsNotValid(key: string, group: string) {
    return this.dovutoForm.controls[group].get(key)?.errors?.max
      || this.dovutoForm.controls[group].get(key)?.errors?.min ? true : false;
  }

  //selectButton primeNG
  tipoIdentificativi: any[] = [
    { label: "Persona Giuridica", value: "G" },
    { label: "Persona Fisica", value: "F" }
  ]

  //yearRange per p-calendar
  calculateYearRange(): string {
    let min = new Date().getFullYear() - 100;
    let max = new Date().getFullYear() + 1;
    return min.toString() + ":" + max.toString();
  }

  numberControl(control: AbstractControl): { [key: string]: boolean } | null {
    let number = /^[.\d]+$/.test(control.value) ? +control.value : NaN;
    if (number !== number) {
      return { 'numberControl': true };
    }
    return null;
  }

  isNotValid(key: string, group: string) {
    return this.dovutoForm.controls[group].get(key)?.dirty
      && this.dovutoForm.controls[group].get(key)?.touched
      && !this.dovutoForm.controls[group].get(key)?.valid ? true : false;
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

  calcolaImporto(){
    let importo = Number(this.dovutoForm.get('bilancio.cauzione_infruttifera').value) 
                    + Number(this.dovutoForm.get('bilancio.costo_segnale_indicatore').value);
    this.dovutoForm.get('bilancio.importoDovuto').patchValue(importo?.toFixed(2));
  }

  confermaCreazioneDovuto() {
    this.confirmationService.confirm({
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Conferma",
      rejectLabel: "Annulla",
      acceptButtonStyleClass: "btn-custom-style btn-dialog-confirm",
      rejectButtonStyleClass: "btn-custom-style btn-dialog-confirm",
      header: "Creazione dovuto",
      message: "Confermi i dati inseriti per la creazione del dovuto?",
      accept: () => {
        this.creaDovuto();
      }
    });
  }

  cleanBilancio(bilancio, capitolo){
    if(!Number(bilancio[capitolo].accertamento.importo))
      delete bilancio[capitolo];
    else {
      if(!bilancio[capitolo].codCapitolo)
        delete bilancio[capitolo].codCapitolo;
      if(!bilancio[capitolo].codUfficio)
        delete bilancio[capitolo].codUfficio;
      if(!bilancio[capitolo].accertamento.codAccertamento)
        delete bilancio[capitolo].accertamento.codAccertamento;
    }
  }

  createBilancio() {
    this.bilancio = {
      capitolo_cauzione_infruttifera: {
        codCapitolo: this.dovutoForm.get('bilancio.codCapitolo_cauzione_infruttifera').value,
        codUfficio: this.dovutoForm.get('bilancio.codUfficio_cauzione_infruttifera').value,
        accertamento: {
          codAccertamento: this.dovutoForm.get('bilancio.codAccertamento_cauzione_infruttifera').value,
          importo: this.dovutoForm.get('bilancio.cauzione_infruttifera').value?.toFixed(2)
        }
      },
      capitolo_costo_segnale_indicatore: {
        codCapitolo: this.dovutoForm.get('bilancio.codCapitolo_costo_segnale_indicatore').value,
        codUfficio: this.dovutoForm.get('bilancio.codUfficio_costo_segnale_indicatore').value,
        accertamento: {
          codAccertamento: this.dovutoForm.get('bilancio.codAccertamento_costo_segnale_indicatore').value,
          importo: this.dovutoForm.get('bilancio.costo_segnale_indicatore').value?.toFixed(2)
        }
      }
    };

    this.cleanBilancio(this.bilancio, "capitolo_cauzione_infruttifera");
    this.cleanBilancio(this.bilancio, "capitolo_costo_segnale_indicatore");

    let xmlBilancio = JsonToXML.parse("bilancio", this.bilancio)
    xmlBilancio = xmlBilancio.replace('<?xml version=\'1.0\'?>\n','');
    xmlBilancio = xmlBilancio.replace(/capitolo_cauzione_infruttifera/g,'capitolo');
    xmlBilancio = xmlBilancio.replace(/capitolo_costo_segnale_indicatore/g,'capitolo');
    xmlBilancio = xmlBilancio.replace(/\n/g,'');
    xmlBilancio = xmlBilancio.replace(/ /g,'');
    this.dovutoForm.get('bilancio.bilancio').patchValue(xmlBilancio);
  }

  creaDovuto() {
    this.showSpinner = true;
    this.createBilancio();

    let request = {
      anagraficaPagatore: this.dovutoForm.get('anagrafica.anagraficaPagatore').value,
      azione: this.dovutoForm.get('dovuto.azione').value,
      capPagatore: this.dovutoForm.get('anagrafica.capPagatore').value,
      causaleVersamento: this.dovutoForm.get('dovuto.causaleVersamento').value,
      civicoPagatore: this.dovutoForm.get('anagrafica.civicoPagatore').value,
      codiceIdentificativoTipoDovuto: this.dovutoForm.get('dovuto.tipoDovuto').value,
      dataEsecuzionePagamento: this.utilityService.getFormattedDate(this.dovutoForm.get('dovuto.dataEsecuzionePagamento').value),
      datiSpecificiRiscossione: this.dovutoForm.get('dovuto.datiSpecificiRiscossione').value,
      idFiscalePagatore: this.dovutoForm.get('anagrafica.codiceIdentificativoUnivoco').value,
      importo: Number(this.dovutoForm.get('bilancio.importoDovuto').value), 
      commissioneCaricoPa: Number(this.dovutoForm.get('dovuto.commissioneCaricoPa').value),
      indirizzoPagatore: this.dovutoForm.get('anagrafica.indirizzoPagatore').value,
      localitaPagatore: this.dovutoForm.get('anagrafica.localitaPagatore').value.toUpperCase(),
      mailPagatore: this.dovutoForm.get('anagrafica.mailPagatore').value,
      nazionePagatore: this.dovutoForm.get('anagrafica.nazionePagatore').value.toUpperCase(),
      provinciaPagatore: this.dovutoForm.get('anagrafica.provinciaPagatore').value.toUpperCase(),
      tipoIdentificativoUnivoco: this.dovutoForm.get('anagrafica.tipoIdentificativoUnivoco').value,
      bilancio: this.dovutoForm.get('bilancio.bilancio').value,
      tipoVersamento: this.dovutoForm.get('dovuto.tipoVersamento').value,
    }

    this.pagamentiService.login().subscribe(
      resp_login => {
        let xauth = resp_login.headers.get('X-Auth');
        this.pagamentiService.creaDovuto(xauth, request).subscribe(
          resp_dovuto => {
            this.showSpinner = false;   
            let resp = {
              iud: resp_dovuto.iud,
              iuv: resp_dovuto.iuv,
              cauzione_infruttifera: this.bilancio?.capitolo_cauzione_infruttifera?.accertamento?.importo || null,
              costo_segnale_indicatore: this.bilancio?.capitolo_costo_segnale_indicatore?.accertamento?.importo || null
            }            
            this.closeDialog(resp);
          },
          err => {
            this.showSpinner = false;
            this.messageService.showMessage('error', 'Creazione dovuto' , err.error.errors?.length ? err.error.errors[0].errorMessage : 'Errore durante la creazione del dovuto');      
          }
        );
      },
      err => {
        this.showSpinner = false;
        this.messageService.showMessage('error', 'Creazione dovuto' , err.error.errors?.length ? err.error.errors[0].errorMessage : 'Errore durante la creazione del dovuto');      
      }
    ); 
  }

  closeDialog(event?) {
    this.dialogRef.close(event);
  }

}
