import { Injectable } from '@angular/core';
import { PrimeNGConfig } from 'primeng/api';

@Injectable()
export class TranslationsService {

  constructor(
    private config: PrimeNGConfig,
  ) { }

  setTranslations() {
    this.config.setTranslation({
    startsWith: 'Inizia con',
    contains: 'Contiene',
    notContains: 'Non contiene',
    endsWith: 'Termina con',
    equals: 'Uguale',
    notEquals: 'Non uguale',
    noFilter: 'Nessun Filtro',
    lt: 'Minore di',
    lte: 'Minore o uguale a',
    gt: 'Maggiore di',
    gte: 'Maggiore o uguale a',
    is: 'È',
    isNot: 'Non è',
    before: 'Precedente',
    after: 'Successiva',
    clear: 'Pulisci',
    apply: 'Applica',
    matchAll: 'Confronta tutto',
    matchAny: 'Confronta alcuni',
    addRule: 'Aggiungi Regola',
    removeRule: 'Rimuovi Regola',
    accept: 'Si',
    reject: 'No',
    choose: 'Scegli',
    upload: 'Upload',
    cancel: 'Cancella',
    dayNames: ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"],
    dayNamesShort: ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"],
    dayNamesMin: ["Do", "Lu", "Ma", "Me", "Gi", "Ve", "Sa"],
    monthNames: ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"],
    monthNamesShort: ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"],
    today: 'Oggi',
    dateIs: 'Data uguale',
    dateIsNot: 'Data non uguale',
    dateAfter: 'Data successiva',
    dateBefore: 'Data precedente',
  });
  }
}
