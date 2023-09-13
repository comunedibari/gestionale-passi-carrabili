import { Component, OnInit } from '@angular/core';
import { PassiCarrabiliService } from 'src/app/shared/service/passi.carrabili.service';
import { MessageService } from 'src/app/shared/service/message.service';
import { AuthService } from 'src/app/shared/service/auth.service';

@Component({
  selector: 'app-statistiche',
  templateUrl: './statistiche.component.html',
  styleUrls: ['./statistiche.component.css']
})
export class StatisticheComponent implements OnInit {
  
  showSpinner: boolean = false;
  kibanaDashboard: string = "";

  constructor(
    private passiCarrabiliService: PassiCarrabiliService,
    private messageService: MessageService,
    public authService: AuthService,
  ) { }

  ngOnInit(): void {
    this.showSpinner = true;
    this.passiCarrabiliService.caricaDashboardKibana(this.authService.getMunicipio()).subscribe(
      data => {
        this.showSpinner = false;
        this.kibanaDashboard = data.data;
      },
      err => {
        this.showSpinner = false;
        this.messageService.showMessage('error','Caricamento dashboard', "Errore durante il caricamento della dashboard delle statistiche"); 
      });
  }

}
