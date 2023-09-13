import { Pipe, PipeTransform } from '@angular/core';
import { DateTime } from 'luxon';

@Pipe({
  name: 'formatDate'
})
export class FormatDatePipe implements PipeTransform {

  transform(value: any, onlyDate?: boolean): string {
    return (value && value != '--') ? this.formatDate(value, onlyDate) : '--';
  }

  formatDate(value: any, onlyDate: boolean): string {
    let date = (value instanceof Date) ? value : new Date(value);
    let dt = DateTime.fromISO(date.toISOString());
    let dtFormat = onlyDate ? "dd/LL/yyyy" : "dd/LL/yyyy HH:mm:ss";
    return dt.toFormat(dtFormat);
  }

}



