import { Component, OnInit } from '@angular/core';
import { MessageService } from 'src/app/shared/service/message.service';
import { UtilityService } from 'src/app/shared/service/utility.service';

@Component({
  selector: 'app-configuration',
  templateUrl: './configuration.component.html',
  styleUrls: ['./configuration.component.css']
})
export class ConfigurationComponent implements OnInit {

  constructor(
    private utilityService: UtilityService,
    private messageService: MessageService,
    ) { }

  showSpinner: boolean = false;
  hub_pagamenti: any;
  uo_protocollo: any;

  ngOnInit(): void {
    this.showSpinner = true;
    this.utilityService.getConfigurations().subscribe(
      data => {
        this.hub_pagamenti = data.data.find(x => x.id == 'hub_pagamenti');
        this.uo_protocollo = data.data.find(x => x.id == 'uo_protocollo');
        this.showSpinner = false;
      },
      err => {
        this.showSpinner = false;
        this.messageService.showMessage('error','Configurazione parametri', "Errore durante il ritrovamento dei parametri di configurazione"); 
      });
  }

  updateConfiguration(configuration){
    this.utilityService.updateConfiguration(configuration).subscribe(
      resp => {
        this.messageService.showMessage('success','Configurazione parametri',resp.message);
      },
      err => {
        this.messageService.showMessage('error', 'Configurazione parametri', err.message);
      }
    ); 
  }

}
