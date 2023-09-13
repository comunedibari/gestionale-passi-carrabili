import { Injectable } from '@angular/core';
import {MessageService as MSPrimeNG} from 'primeng/api';

@Injectable()
export class MessageService {

  constructor(private messageService: MSPrimeNG) { }

  showMessage(severity: string, summary: string, detail: string, life?: number){
    // this.close();

    if(!life)
      switch(severity) { 
          case 'success': { 
              life = 3000;
              break; 
          } 
          case 'warn': { 
              life = 5000; 
              break; 
          } 
          case 'error': { 
              life = 7000; 
              break; 
            }
          default: { 
              life = 3000;
              break; 
          } 
      } 

    this.messageService.add({severity: severity, summary: summary, detail: detail, life: life});
  }

  close(){
    this.messageService.clear();
  }
}
