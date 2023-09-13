import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {MenuItem} from 'primeng/api';
import { AuthService } from '../service/auth.service';
import { Group } from '../enums/Group.enum';
import { PassiCarrabiliService } from '../service/passi.carrabili.service';
import { StatoPraticaPassiCarrabili } from '../enums/StatoPratica.enum';
import { MessageService } from 'src/app/shared/service/message.service';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.css']
})
export class HomePageComponent implements OnInit {

  menuItems: MenuItem[] = [];
  thereAreUtilities: boolean = false;
  countPratichePerStato: any[] = [];
  countPratichePerFunzionalita: any[] = [];

  constructor(
    private authService: AuthService,
    private router: Router,
    private passiCarrabiliService: PassiCarrabiliService,
    private messageService: MessageService,
  ) { }

  getBadgeValue(stati_pratica: any[], array: any[]): string {
    var value = 0;
    stati_pratica.forEach(stato_pratica => {
      let count = array.find(el => el.stato_pratica == stato_pratica).count;
      if(count)
        value += count;
    });
    return value.toString();
  }

  async ngOnInit() {
    this.countPratichePerStato = await this.passiCarrabiliService.countPratichePerStato(this.authService.getMunicipio(), this.authService.getGroup()).catch(err => {
      this.messageService.showMessage('error','Conteggio pratiche', "Errore durante il conteggio delle pratiche"); 
    });

    if(this.countPratichePerStato)
      this.countPratichePerFunzionalita = await this.passiCarrabiliService.countPratichePerFunzionalita(this.authService.getMunicipio()).catch(err => {
        this.messageService.showMessage('error','Conteggio pratiche', "Errore durante il conteggio delle pratiche"); 
      });
 
    this.menuItems = [
      {
        label: 'Gestione richieste',
        icon:'pi pi-fw pi-list',
        visible: this.authService.isActiveLinkGestioneRichieste(),
        items: [
          {
              label: 'Inserisci pratica',
              title: 'Inserisci nuova pratica',
              icon:'pi pi-fw pi-plus',
              routerLink: '/gestione_richieste/inserisci_richiesta',
              visible: this.authService.checkGroups('auth.inserisciRichiesta')
          },
          {
            label: 'Pratiche in bozza',
            title: 'Completa pratica in bozza',
            icon:'pi pi-fw pi-pencil',
            routerLink: '/gestione_richieste/pratiche_bozza',
            badge: this.countPratichePerStato && this.countPratichePerStato.length ? this.getBadgeValue([StatoPraticaPassiCarrabili.Bozza], this.countPratichePerStato) : null,
            visible: this.authService.checkGroups('auth.praticheBozza')
          },
          {
              label: 'Concessioni valide',
              title: 'Elenco concessioni valide con segnale rilasciato',
              icon:'pi pi-fw pi-check',
              routerLink: '/gestione_richieste/concessioni_valide',
              badge: this.countPratichePerStato && this.countPratichePerStato.length ? this.getBadgeValue([StatoPraticaPassiCarrabili['Concessione valida']], this.countPratichePerStato) : null,
              visible: this.authService.checkGroups('auth.concessioniValide')
          },
          {
              label: 'Ricerca pratiche',
              title: 'Ricerca pratiche',
              icon:'pi pi-fw pi-search',
              routerLink: '/gestione_richieste/ricerca_pratiche',
              visible: this.authService.checkGroups('auth.fascicolo')
          },
          {
              label: 'Regolarizzazione',
              title: 'Regolarizza su istanza d\'ufficio',
              icon:'pi pi-fw pi-clock',
              routerLink: '/gestione_richieste/regolarizzazione',
              visible: this.authService.checkGroups('auth.regolarizzazione')
          },
          {
            label: 'Segnalazioni',
            title: 'Visualizza e gestisci segnalazioni',
            icon:'pi pi-fw pi-exclamation-triangle',
            routerLink: '/gestione_richieste/segnalazioni',
            visible: this.authService.checkGroups('auth.segnalazioni')
          },
          {
              label: 'Storico pratiche',
              title: 'Elenco pratiche storiche',
              icon:'pi pi-fw pi-inbox',
              routerLink: '/gestione_richieste/storico_pratiche',
              visible: this.authService.checkGroups('auth.storicoPratiche')
          },
          {
            label: 'Bonifica pratiche',
            title: 'Bonifica pratica storica',
            icon:'pi pi-fw pi-pencil',
            routerLink: '/gestione_richieste/bonifica_pratiche',
            badge: this.countPratichePerFunzionalita && this.countPratichePerFunzionalita.length ? this.getBadgeValue(['bonifica_pratica'], this.countPratichePerFunzionalita) : null,
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
            title: this.authService.getGroup() == Group.IstruttoreMunicipio || this.authService.getGroup() == Group.OperatoreSportello ? 'Prendi in carico' : 'Assegna pratica',
            icon:'pi pi-fw pi-paperclip',
            routerLink: '/pratiche_da_lavorare/presa_in_carico',
            badge: this.countPratichePerStato && this.countPratichePerStato.length ? this.getBadgeValue([StatoPraticaPassiCarrabili.Inserita], this.countPratichePerStato) : null,
            visible: this.authService.checkGroups('auth.presaInCarico')
          },
          {
            label: 'Validazione pratiche',
            title: 'Verifica formale e richiedi pareri/integrazione',
            icon:'pi pi-fw pi-check-circle',
            routerLink: '/pratiche_da_lavorare/validazione_pratiche',
            badge: this.countPratichePerStato && this.countPratichePerStato.length ? this.getBadgeValue([StatoPraticaPassiCarrabili['Verifica formale']], this.countPratichePerStato) : null,
            visible: this.authService.checkGroups('auth.validazionePratiche')
          },
          {
            label: this.authService.getGroup() == Group.IstruttoreMunicipio || this.authService.getGroup() == Group.DirettoreMunicipio ? 'Rielaborazione pareri' : 'Esprimi parere',
            title: this.authService.getGroup() == Group.IstruttoreMunicipio || this.authService.getGroup() == Group.DirettoreMunicipio ? 'Rielabora pareri ricevuti e approva/rigetta' : 'Rilascia parere',
            icon:'pi pi-fw pi-comments',
            routerLink: '/pratiche_da_lavorare/rielaborazione_pareri',
            badge: this.countPratichePerStato && this.countPratichePerStato.length ? this.getBadgeValue([StatoPraticaPassiCarrabili['Richiesta pareri']], this.countPratichePerStato) : null,
            visible: this.authService.checkGroups('auth.rielaborazionePareri')
          },
          {
            label: 'Pratiche approvate',
            title: 'Inserisci Determina esecutiva',
            icon:'pi pi-fw pi-check',
            routerLink: '/pratiche_da_lavorare/pratiche_approvate',
            badge: this.countPratichePerStato && this.countPratichePerStato.length ? this.getBadgeValue([StatoPraticaPassiCarrabili.Approvata], this.countPratichePerStato) : null,
            visible: this.authService.checkGroups('auth.praticheApprovate')
          },
          {
            label: 'Attesa di pagamento',
            title: 'Elenco pratiche in attesa del pagamento dei tributi',
            icon:'pi pi-fw pi-calendar-times',
            routerLink: '/pratiche_da_lavorare/attesa_pagamento',
            badge: this.countPratichePerStato && this.countPratichePerStato.length ? this.getBadgeValue([StatoPraticaPassiCarrabili['Attesa di pagamento']], this.countPratichePerStato) : null,
            visible: this.authService.checkGroups('auth.attesaPagamento')
          },
          {
            label: 'Restituzione e Rilascio',
            title: 'Ritira/Rilascia segnale indicatore',
            icon:'pi pi-fw pi-sign-in',
            routerLink: '/pratiche_da_lavorare/ritiro_rilascio',
            badge: this.countPratichePerStato && this.countPratichePerStato.length ? this.getBadgeValue([StatoPraticaPassiCarrabili['Pronto al rilascio'], StatoPraticaPassiCarrabili['Pronto alla restituzione']], this.countPratichePerStato) : null,
            visible: this.authService.checkGroups('auth.ritiroRilascio')
          },
          {
            label: 'Rigetto e Revoca',
            title: 'Inserisci determina esecutiva di Rigetto/Revoca',
            icon:'pi pi-fw pi-times-circle',
            routerLink: '/pratiche_da_lavorare/pratiche_da_rigettare_revocare',
            badge: this.countPratichePerStato && this.countPratichePerStato.length ? this.getBadgeValue([StatoPraticaPassiCarrabili['Pratica da rigettare'], StatoPraticaPassiCarrabili['Pratica da revocare']], this.countPratichePerStato) : null,
            visible: this.authService.checkGroups('auth.praticheDaRigettare')
          },
          {
            label: 'Aggiungi Tag RFID',
            title: 'Associa tag RFID a concessione valida',
            icon:'pi pi-fw pi-qrcode',
            routerLink: '/pratiche_da_lavorare/aggiungi_tag_rfid',
            badge: this.countPratichePerFunzionalita && this.countPratichePerFunzionalita.length ? this.getBadgeValue(['aggiungi_tag_rfid'], this.countPratichePerFunzionalita) : null,
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
              title: 'Elenco pratiche archiviate',
              icon:'pi pi-fw pi-inbox',
              routerLink: '/pratiche_concluse/pratiche_archiviate',
              badge: this.countPratichePerStato && this.countPratichePerStato.length ? this.getBadgeValue([StatoPraticaPassiCarrabili.Archiviata], this.countPratichePerStato) : null,
              visible: this.authService.checkGroups('auth.praticheArchiviate')
          },
          {
              label: 'Pratiche rigettate',
              title: 'Elenco pratiche rigettate',
              icon:'pi pi-fw pi-trash',
              routerLink: '/pratiche_concluse/pratiche_rigettate',
              badge: this.countPratichePerStato && this.countPratichePerStato.length ? this.getBadgeValue([StatoPraticaPassiCarrabili.Rigettata], this.countPratichePerStato) : null,
              visible: this.authService.checkGroups('auth.praticheRigettate')
          },
          {
              label: 'Pratiche revocate',
              title: 'Elenco concessioni revocate',
              icon:'pi pi-fw pi-ban',
              routerLink: '/pratiche_concluse/pratiche_revocate',
              badge: this.countPratichePerStato && this.countPratichePerStato.length ? this.getBadgeValue([StatoPraticaPassiCarrabili.Revocata], this.countPratichePerStato) : null,
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
            title: 'Visualizza statistiche pratiche passi carrabili',
            icon:'pi pi-fw pi-chart-line',
            routerLink: '/sistema/statistiche',
            visible: this.authService.checkGroups('auth.statistiche')
          },
          {
            label: 'Template documenti',
            title: 'Aggiorna template documentali',
            icon:'pi pi-fw pi-file',
            routerLink: '/sistema/template-documenti',
            visible: this.authService.checkGroups('auth.templates')
          },
          {
            label: 'Configurazione parametri',
            title: 'Configura parametri per HUB pagamenti e utenti automi per il protocollo',
            icon:'pi pi-fw pi-sliders-h',
            routerLink: '/sistema/configuration',
            visible: this.authService.checkGroups('auth.gestioneUtenti')
          },
          {
            label: 'Gestione utenti',
            title: 'Aggiungi, modifica, elimina e disabilita utenti',
            icon:'pi pi-fw pi-users',
            routerLink: '/sistema/usermanagement',
            visible: this.authService.checkGroups('auth.gestioneUtenti')
          },
          {
            label: 'Profilo utente',
            title: 'Modifica dati anagrafici e cambia password',
            icon:'pi pi-fw pi-user',
            routerLink: '/sistema/user',
            visible: this.authService.checkGroups('auth.ilMioProfilo')
          }     
        ]
      }
    ];

    this.thereAreUtilities = this.menuItems.filter(el => !el.items && el.visible).length > 0;
  }

  navigate(path) {
    this.router.navigate([path]);
  }

}
