import { Component, OnInit, DoCheck, OnDestroy, Output, EventEmitter, ChangeDetectorRef  } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { AuthService } from '../service/auth.service';
import { UtilityService } from '../service/utility.service';
import { MessageService } from '../service/message.service';
import { Group } from '../enums/Group.enum';
import { MenuItem } from 'primeng/api';
import {MediaMatcher} from '@angular/cdk/layout';
import { filter } from 'rxjs/operators';
import { Municipio } from '../enums/Municipio.enum';
import { DialogService } from 'primeng/dynamicdialog';
import { ScadenziarioComponent } from '../../passi-carrabili/scadenziario/scadenziario.component';
import { PassiCarrabiliService } from '../service/passi.carrabili.service';
import { environment } from '../../../environments/environment';
import { HelpComponent } from '../help/help.component';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, DoCheck, OnDestroy {

  @Output() isLogged: EventEmitter<any> = new EventEmitter<any>();
  @Output() clickMenuButton: EventEmitter<any> = new EventEmitter<any>();
  isAuthenticate: boolean = false;
  routerLinkRielaborazionePareri: string = '/pratiche_da_lavorare/rielaborazione_pareri';
  routerLinkPresaInCarico: string = '/pratiche_da_lavorare/presa_in_carico';

  tipologiaAmbiente: string = environment.tipologiaAmbiente;

  //breadcrumbs
  menuItems: MenuItem[] = [];
  homeItems: MenuItem = {icon: 'pi pi-home', routerLink: '/home'};

  //scadenziario 
  badgeValue = null;
  showSpinner: boolean = false;
  dataSource: any[] = [];
  notificheControllate: boolean = false;

  mobileQuery: MediaQueryList;
  private _mobileQueryListener: () => void;

  constructor(
      public dialogService: DialogService,
      private router: Router, 
      private activatedRoute: ActivatedRoute,
      private authService: AuthService,
      private passiCarrabiliService : PassiCarrabiliService,
      public utilityService: UtilityService,
      private messageService: MessageService,
      changeDetectorRef: ChangeDetectorRef,
      media: MediaMatcher
    ) {
      this.mobileQuery = media.matchMedia('(max-width: 650px)');
      this._mobileQueryListener = () => changeDetectorRef.detectChanges();
      this.mobileQuery.addEventListener('change', this._mobileQueryListener);
  }

  get infoUtente(): string {
    return this.isAuthenticate ? this.authService.getInfoUtente() : '';
  }

  get tipoUtente(): string{
    return this.isAuthenticate ? Group[this.authService.getGroup()] : '';
  }

  get lastLogin(): string {
    return this.isAuthenticate ? this.authService.getLastLogin() : '';
  }

  get isAdmin(): boolean{
    return this.authService.getGroup() == Group.Admin ? true : false;
  }

  // get isPassiCarrabiliUser(): boolean{
  //   return this.utilityService.isPassiCarrabiliUser();
  // }

  get municipioAppartenenza(): string {
    let municipio_id = this.authService.getMunicipio();
    return municipio_id ? Municipio[municipio_id] : '';
  }

  get infoBadge(): string {
    return this.badgeValue ? 'Clicca qui per vedere le notifiche dello scadenziario' : 'Non ci sono notifiche dello scadenziario';
  }

  get abilitaNotifiche(): boolean{
    return this.authService.getGroup() == Group.DirettoreMunicipio 
            || this.authService.getGroup() == Group.IstruttoreMunicipio 
            || this.authService.getGroup() == Group.PoliziaLocale 
            || this.authService.getGroup() == Group.UfficioTecnicoDecentrato 
            || this.authService.getGroup() == Group.RipartizioneUrbanistica   
          ? true : false;
  }

  ngOnInit() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => this.menuItems = this.createBreadcrumbs(this.activatedRoute.root));
  }

  createBreadcrumbs(activatedRoute: ActivatedRoute, url: string = '', breadcrumbs: MenuItem[] = []): MenuItem[] {
    var children: ActivatedRoute[] = activatedRoute.children;

    if (children.length === 0) {
      return breadcrumbs;
    }

    for (var child of children) {
      var routeURL: string = child.snapshot.url.map(segment => segment.path).join('/');
      if (routeURL !== '') {
        url += `/${routeURL}`;
      }

      var label = child.snapshot.data['breadcrumb'];

      if(url == this.routerLinkRielaborazionePareri){
        label = this.authService.getGroup() == Group.IstruttoreMunicipio || this.authService.getGroup() == Group.DirettoreMunicipio ? 'Rielaborazione pareri' : 'Esprimi parere';
      }
      else if( url == this.routerLinkPresaInCarico){
        label = this.authService.getGroup() == Group.IstruttoreMunicipio || this.authService.getGroup() == Group.OperatoreSportello ? 'Presa in carico' : 'Assegnazione pratica';
      }
      
      if (label) {
        breadcrumbs.push({label, url});
      }

      return this.createBreadcrumbs(child, url, breadcrumbs);
    }
  }

  ngDoCheck() {
    this.isAuthenticate = this.authService.checkAuth(); 
    this.isLogged.emit(this.isAuthenticate);

    if(this.isAuthenticate) {
      if(this.abilitaNotifiche && !this.notificheControllate && !this.showSpinner && this.dataSource && !this.dataSource.length)
        this.initScadenziario();
    }
    else {
      if(this.dataSource && (this.dataSource.length || this.notificheControllate))
        this.resetNotificheScadenziario();
    }
  }

  ngOnDestroy() {
    this.mobileQuery.removeEventListener('change', this._mobileQueryListener);
  }

  signOut() {
    this.authService.updateLastLogin().subscribe(
      data => {
        this.authService.signOut();
        this.router.navigate(['/login']);
      });
  }

  goHome(){
    this.utilityService.goHome();
  }

  openMenu(){
    this.clickMenuButton.emit();
  }

  //scadenziario 

  initScadenziario() {
    this.showSpinner = true;
    this.passiCarrabiliService.cercaNotificheScadenziario(this.authService.getMunicipio(), this.authService.getGroup()).subscribe(
      data => {
        this.showSpinner = false;
        this.dataSource = data.data;
        this.notificheControllate = true;
        this.badgeValue = this.dataSource.length ? (this.dataSource.length > 10 ? '10+' : this.dataSource.length) : null;
      },
      err => {
        this.showSpinner = false;
        this.messageService.showMessage('error','Ricerca pratiche', "Errore durante il ritrovamento delle pratiche"); 
      });
  }

  openScadenziarioDialog(){
    let dialogRef = this.dialogService.open(ScadenziarioComponent,  this.utilityService.configDynamicDialogFullScreen(undefined, "Notifiche scadenziario"));
    dialogRef.onClose.subscribe( resp => {
      this.showSpinner = true;
      this.passiCarrabiliService.cercaNotificheScadenziario(this.authService.getMunicipio(), this.authService.getGroup()).subscribe(
        data => {
          this.showSpinner = false;
          this.dataSource = data.data;
          this.notificheControllate = true;
          this.badgeValue = this.dataSource.length ? (this.dataSource.length > 10 ? '10+' : this.dataSource.length) : null;
        },
        err => {
          this.showSpinner = false;
          this.messageService.showMessage('error','Ricerca pratiche', "Errore durante il ritrovamento delle pratiche"); 
        });
    });
  }

  resetNotificheScadenziario() {
    this.dataSource = [];
    this.badgeValue = null;
    this.notificheControllate = false;
  }

  helpStatiPratica() {
    this.dialogService.open(HelpComponent,  this.utilityService.configDynamicDialogFullScreen(undefined, ""));
  }
}
