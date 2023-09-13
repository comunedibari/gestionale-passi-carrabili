import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import {MenuItem} from 'primeng/api';
import { Group } from '../enums/Group.enum';
import { AuthService } from '../service/auth.service';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css']
})
export class MenuComponent implements OnInit {

  menuItems: MenuItem[] = [];
  @Output() clickItem: EventEmitter<any> = new EventEmitter<any>();

  constructor(
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.menuItems = [
      {
        label: 'Gestione richieste',
        icon:'pi pi-fw pi-list',
        visible: this.authService.isActiveLinkGestioneRichieste(),
        items: [
          {
              label: 'Inserisci pratica',
              icon:'pi pi-fw pi-plus',
              command: (event: any) => {
                this.clickMenuItem();
              },
              routerLink: '/gestione_richieste/inserisci_richiesta',
              visible: this.authService.checkGroups('auth.inserisciRichiesta')
          },
          {
            label: 'Pratiche in bozza',
            icon:'pi pi-fw pi-pencil',
            command: (event: any) => {
              this.clickMenuItem();
            },
            routerLink: '/gestione_richieste/pratiche_bozza',
            visible: this.authService.checkGroups('auth.praticheBozza')
          },
          {
              label: 'Concessioni valide',
              icon:'pi pi-fw pi-check',
              command: (event: any) => {
                this.clickMenuItem();
              },
              routerLink: '/gestione_richieste/concessioni_valide',
              visible: this.authService.checkGroups('auth.concessioniValide')
          },
          {
              label: 'Ricerca pratiche',
              icon:'pi pi-fw pi-search',
              command: (event: any) => {
                this.clickMenuItem();
              },
              routerLink: '/gestione_richieste/ricerca_pratiche',
              visible: this.authService.checkGroups('auth.fascicolo')
          },
          {
              label: 'Regolarizzazione',
              icon:'pi pi-fw pi-clock',
              command: (event: any) => {
                this.clickMenuItem();
              },
              routerLink: '/gestione_richieste/regolarizzazione',
              visible: this.authService.checkGroups('auth.regolarizzazione')
          },
          {
            label: 'Segnalazioni',
            icon:'pi pi-fw pi-exclamation-triangle',
            command: (event: any) => {
              this.clickMenuItem();
            },
            routerLink: '/gestione_richieste/segnalazioni',
            visible: this.authService.checkGroups('auth.segnalazioni')
          },
          {
              label: 'Storico pratiche',
              icon:'pi pi-fw pi-inbox',
              command: (event: any) => {
                this.clickMenuItem();
              },
              routerLink: '/gestione_richieste/storico_pratiche',
              visible: this.authService.checkGroups('auth.storicoPratiche')
          },
          {
            label: 'Bonifica pratiche',
            icon:'pi pi-fw pi-pencil',
            command: (event: any) => {
              this.clickMenuItem();
            },
            routerLink: '/gestione_richieste/bonifica_pratiche',
            visible: this.authService.checkGroups('auth.storicoPratiche')
          }  
        ]
      },
      {
        label: 'Pratiche da lavorare',
        icon:'pi pi-fw pi-lock-open',
        visible: this.authService.isActiveLinkPraticheDaLavorare(),
        items: [
          {
              label: this.authService.getGroup() == Group.IstruttoreMunicipio || this.authService.getGroup() == Group.OperatoreSportello ? 'Presa in carico' : 'Assegnazione pratica',
              icon:'pi pi-fw pi-paperclip',
              command: (event: any) => {
                this.clickMenuItem();
              },
              routerLink: '/pratiche_da_lavorare/presa_in_carico',
              visible: this.authService.checkGroups('auth.presaInCarico')
          },
          {
            label: 'Validazione pratiche',
            icon:'pi pi-fw pi-check-circle',
            command: (event: any) => {
              this.clickMenuItem();
            },
            routerLink: '/pratiche_da_lavorare/validazione_pratiche',
            visible: this.authService.checkGroups('auth.validazionePratiche')
          },
          {
            label: this.authService.getGroup() == Group.IstruttoreMunicipio || this.authService.getGroup() == Group.DirettoreMunicipio ? 'Rielaborazione pareri' : 'Esprimi parere',
            icon:'pi pi-fw pi-comments',
            command: (event: any) => {
              this.clickMenuItem();
            },
            routerLink: '/pratiche_da_lavorare/rielaborazione_pareri',
            visible: this.authService.checkGroups('auth.rielaborazionePareri')
          },
          {
            label: 'Pratiche approvate',
            icon:'pi pi-fw pi-check',
            command: (event: any) => {
              this.clickMenuItem();
            },
            routerLink: '/pratiche_da_lavorare/pratiche_approvate',
            visible: this.authService.checkGroups('auth.praticheApprovate')
          },
          {
            label: 'Attesa di pagamento',
            icon:'pi pi-fw pi-calendar-times',
            command: (event: any) => {
              this.clickMenuItem();
            },
            routerLink: '/pratiche_da_lavorare/attesa_pagamento',
            visible: this.authService.checkGroups('auth.attesaPagamento')
          },
          {
            label: 'Restituzione e Rilascio',
            icon:'pi pi-fw pi-sign-in',
            command: (event: any) => {
              this.clickMenuItem();
            },
            routerLink: '/pratiche_da_lavorare/ritiro_rilascio',
            visible: this.authService.checkGroups('auth.ritiroRilascio')
          },
          {
            label: 'Rigetto e Revoca',
            icon:'pi pi-fw pi-times-circle',
            command: (event: any) => {
              this.clickMenuItem();
            },
            routerLink: '/pratiche_da_lavorare/pratiche_da_rigettare_revocare',
            visible: this.authService.checkGroups('auth.praticheDaRigettare')
          },
          {
            label: 'Aggiungi Tag RFID',
            icon:'pi pi-fw pi-qrcode',
            command: (event: any) => {
              this.clickMenuItem();
            },
            routerLink: '/pratiche_da_lavorare/aggiungi_tag_rfid',
            visible: this.authService.checkGroups('auth.aggiungiTagRfid')
          }
        ]
      },
      {
        label: 'Pratiche concluse',
        icon:'pi pi-fw pi-lock',
        visible: this.authService.isActiveLinkPraticheConcluse(),
        items: [
          {
              label: 'Pratiche archiviate',
              icon:'pi pi-fw pi-inbox',
              command: (event: any) => {
                this.clickMenuItem();
              },
              routerLink: '/pratiche_concluse/pratiche_archiviate',
              visible: this.authService.checkGroups('auth.praticheArchiviate')
          },
          {
              label: 'Pratiche rigettate',
              icon:'pi pi-fw pi-trash',
              command: (event: any) => {
                this.clickMenuItem();
              },
              routerLink: '/pratiche_concluse/pratiche_rigettate',
              visible: this.authService.checkGroups('auth.praticheRigettate')
          },
          {
              label: 'Pratiche revocate',
              icon:'pi pi-fw pi-ban',
              command: (event: any) => {
                this.clickMenuItem();
              },
              routerLink: '/pratiche_concluse/pratiche_revocate',
              visible: this.authService.checkGroups('auth.praticheRevocate')
          }
        ]
      },
      {
        label: 'Sistema',
        icon:'pi pi-fw pi-cog',
        visible: this.authService.isActiveLinksSistema(),
        items: [
          {
            label: 'Statistiche',
            icon:'pi pi-fw pi-chart-line',
            command: (event: any) => {
              this.clickMenuItem();
            },
            routerLink: '/sistema/statistiche',
            visible: this.authService.checkGroups('auth.statistiche')
          },
          {
            label: 'Template documenti',
            icon:'pi pi-fw pi-book',
            command: (event: any) => {
              this.clickMenuItem();
            },
            routerLink: '/sistema/template-documenti',
            visible: this.authService.checkGroups('auth.templates')
          },
          {
            label: 'Configurazione parametri',
            icon:'pi pi-fw pi-sliders-h',
            command: (event: any) => {
              this.clickMenuItem();
            },
            routerLink: '/sistema/configuration',
            visible: this.authService.checkGroups('auth.gestioneUtenti')
          },
          {
            label: 'Gestione utenti',
            icon:'pi pi-fw pi-users',
            command: (event: any) => {
              this.clickMenuItem();
            },
            routerLink: '/sistema/usermanagement',
            visible: this.authService.checkGroups('auth.gestioneUtenti')
          },
          {
            label: 'Profilo utente',
            icon:'pi pi-fw pi-user',
            command: (event: any) => {
              this.clickMenuItem();
            },
            routerLink: '/sistema/user',
            visible: this.authService.checkGroups('auth.ilMioProfilo')
          }     
        ]
      }
    ];
  }

  clickMenuItem() {
    this.clickItem.emit();
  }
}
