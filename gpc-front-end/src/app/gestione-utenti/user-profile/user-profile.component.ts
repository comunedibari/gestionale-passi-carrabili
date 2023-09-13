import { Component, OnInit, Inject, Input } from '@angular/core';
import { User } from '../../shared/interface/user.interface';
import { Router } from '@angular/router';
import { AuthService } from '../../shared/service/auth.service';
import { UserService } from '../../shared/service/user.service';
import { UtilityService } from '../../shared/service/utility.service';
import { MessageService } from '../../shared/service/message.service';
import { Observable } from 'rxjs';
import { Group } from '../../shared/enums/Group.enum'
import { Municipio } from '../../shared/enums/Municipio.enum';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { NgForm } from '@angular/forms';
import { FormatDatePipe } from '../../shared/pipe/format-date.pipe';
import { ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit {

  user: User = <User>{};
  txtInsertRePassword: string = '';
  txtOldPassword: string = '';
  showMunicipiDialog: boolean = false;
  bkpUser: any;
  dateNow = new Date();
  showSpinner: boolean = false;
  automi: any[] = [];
  selectedAutoma: any = {};

  @Input() editUser: User;

  get isEditMode(): boolean {
    return this.editUser != null;
  }
  
  get isMyProfile(): boolean {
    return this.router.url.endsWith('/user');
  }

  get userRole(): string {
    return this.user.group_id ? this.utilityService.camelCaseToSpace(Group[this.user.group_id]) : '';
  }

  get isPoliziaLocale(): boolean {
    return this.user.group_id && this.user.group_id == Group.PoliziaLocale ? true : false;
  }

  get isUOIDRequired(): boolean {
    return this.user.group_id && 
      (
        this.user.group_id != Group.Admin 
        && this.user.group_id != Group.AmministratorePassiCarrabili 
        && this.user.group_id != Group.Concessionario 
        && this.user.group_id != Group.PoliziaLocaleControlliSulTerritorio 
        )
      ? true : false;
  }

  get isConcessionario(): boolean {
    return this.user.group_id && this.user.group_id == Group.Concessionario ? true : false;
  }

  get isNewConcessionario(): boolean {
    return this.user.group_id && this.user.group_id == Group.Concessionario 
        && !this.isEditMode && !this.isMyProfile
      ? true : false;
  }

  constructor(
    private userService: UserService,
    private router: Router,
    private authService: AuthService,
    public utilityService: UtilityService,
    private messageService: MessageService,
    private datePipe: FormatDatePipe,
    public confirmationService: ConfirmationService,
    private dialogRef: DynamicDialogRef,
    @Inject(DynamicDialogConfig) data: any) {
      this.editUser = data.data;
    }

  ruoloSchema = [];
  municipioSchema = [];

  setRuoli(){
    let indexes = Object.keys(Group).filter(x => {
        let el = parseInt(x, 10);
        if(!isNaN(el))
          return el;
      }
    );

    this.rimuoviRuoliDiNonCompetenza(indexes);

    indexes.forEach(x => {
      let id = parseInt(x);
      this.ruoloSchema.push(
        {
          label: this.utilityService.camelCaseToSpace(Group[id]).trim(),
          value: id
        }
      );
    });
  }

  rimuoviRuoliDiNonCompetenza(indexes){
    //rimuovo ruolo Admin
    indexes.splice(indexes.indexOf(Group.Admin.toString()), 1);
    if(this.authService.getGroup() != Group.Admin){
      indexes.splice(indexes.indexOf(Group.AmministratorePassiCarrabili.toString()), 1);
    }
  }

  setMunicipi(){
    let indexes = Object.keys(Municipio).filter(x => {
        let el = parseInt(x, 10);
        if(!isNaN(el))
          return el;
      }
    );

    indexes.forEach(x => {
      let id = parseInt(x);
      this.municipioSchema.push(
        {
          label: this.utilityService.camelCaseToSpace(Municipio[id]).trim(),
          value: id
        }
      );
    });
  }

  setAutomi(){
    this.showSpinner = true;
    this.utilityService.getConfiguration('uo_protocollo').subscribe(
      data => {
        delete data.id;
        let keys = Object.keys(data);
        this.automi = [];
        keys.forEach(key => this.automi.push(data[key]));
        if(!this.selectedAutoma && this.user && this.user.group_id)
          setTimeout(() => {
            this.setAutoma();
          }, 100);
        this.showSpinner = false;
      },
      err => {
        this.showSpinner = false;
        this.messageService.showMessage('error','Configurazione parametri', "Errore durante il ritrovamento dei parametri di configurazione"); 
      });
  }

  ngOnInit() {
    this.setRuoli();
    this.setMunicipi();
    this.setAutomi();

    if (this.isMyProfile) {
      this.userService.getUser(this.authService.getUsername()).subscribe(response => {
        this.user = Object.assign(<User>{}, response);
        this.user.password = null;
        this.user.datadinascita = this.user.datadinascita ? new Date(this.user.datadinascita) : undefined;
        this.user.lastLogin = this.datePipe.transform(this.user.lastLogin);
        this.bkpUser = Object.assign({}, this.user);
        setTimeout(() => {
          this.setAutoma();
        }, 100);
      });
    }
    else {
      this.user = this.isEditMode ? this.editUser : <User>{};
      this.user.datadinascita = this.isEditMode && this.user.datadinascita ? new Date(this.user.datadinascita) : undefined;
      this.bkpUser = Object.assign({}, this.user);
      setTimeout(() => {
        this.setAutoma();
      }, 100);
    }
  }

  onHideMunicipiDialog() {
    if(!this.bkpUser.successed){
      this.user.municipio_id = this.bkpUser.municipio_id;
      this.user.group_id = this.bkpUser.group_id;
      this.setAutoma();
    }
  }

  setAutoma() {
    if(this.user.group_id != Group.OperatoreSportello && this.user.group_id != Group.DirettoreMunicipio && this.user.group_id != Group.IstruttoreMunicipio)
      this.selectedAutoma = this.automi.find(el => el.group_id.indexOf(this.user.group_id) > -1);
    else
      this.selectedAutoma = this.automi.find(el => el.group_id.indexOf(this.user.group_id) > -1 && el.municipio_id == this.user.municipio_id);

    this.user.uoid = this.selectedAutoma ? this.selectedAutoma.uoid : '';
    this.user.denominazione = this.selectedAutoma ? this.selectedAutoma.denominazione : '';
  }

  resetControls(insertForm){
    let controls = insertForm.controls;
    for (var name in controls) {
      if (controls[name].disabled) {
        controls[name].reset();
      }
    }
  }

  onCheckedGroup(event: any) {    
    if(this.user.group_id == Group.OperatoreSportello || this.user.group_id == Group.DirettoreMunicipio 
      || this.user.group_id == Group.IstruttoreMunicipio || this.isPoliziaLocale) {
        
        this.municipioSchema = this.municipioSchema.filter(x => x.label != "Tutti");

        if(this.isPoliziaLocale) {
          this.municipioSchema.push({ label: "Tutti", value: null });
        }

        this.showMunicipiDialog = true;
      }     
    else 
      this.user.municipio_id = null;

    if(!this.isUOIDRequired) {
      this.user.uoid = '';
      this.user.denominazione = '';
      this.selectedAutoma = null;
    }
    else {
      this.setAutoma();
    }
  }

  checkConcessionario() {
    this.showSpinner = true;
    this.userService.getUsersConcessionario().subscribe(data => {
      this.showSpinner = false;
      if(data.data && data.data.length > 0){
        let concessionario = data.data.map(el => el.username).join(',');
        this.confirmationService.confirm({
          icon: "pi pi-exclamation-triangle",
          acceptLabel: "Conferma",
          rejectLabel: "Annulla",
          acceptButtonStyleClass: "btn-custom-style btn-dialog-confirm",
          rejectButtonStyleClass: "btn-custom-style btn-dialog-confirm",
          header: "Creazione nuovo utente concessionario",
          message: `Esiste già l'utente "${concessionario}" abilitato come Concessionario.<br/>Procedendo con l'operazione l'utente "${concessionario}" verrà disabilitato.<br/>Procedere comunque con la creazione dell'utente "${this.user.username}"?`,
          accept: () => {
            this.showSpinner = true;
            this.userService.disableUsersConcessionario(this.user.username).subscribe(response => {    
              this.user.denominazione = this.user.ragioneSociale;  
              this.submitDatiUtente();
            }, (err) => {
              this.showSpinner = false;
              this.messageService.showMessage('error', 'Disabilitazione utente concessionario', err.error.message);
            });
          }
        });
      }
      else 
        this.submitDatiUtente();
    });
  }

  submitDatiUtente(): void {
    this.showSpinner = true;
    this.user.provinciadinascita = this.user.provinciadinascita?.toUpperCase() || '';

    if((this.isEditMode || this.isMyProfile) && this.user.group_id == Group.Concessionario)
      this.user.denominazione = this.user.ragioneSociale;  

    if((this.isEditMode || this.isMyProfile) && !this.user.denominazione)
      this.setAutoma();

    let observable: Observable<any> =
      this.isEditMode || this.isMyProfile ? this.userService.modifyUser(this.user)
        : this.userService.inserisciUtente(this.user);

    if(!this.isEditMode && !this.isMyProfile && this.user.password != this.txtInsertRePassword){
      this.messageService.showMessage('error',this.isEditMode || this.isMyProfile ? 'Modifica utente' : 'Inserisci utente','Attenzione: le due password non coincidono');
    }
    else {
      observable.subscribe(response => {    
        this.showSpinner = false;  
        if (!this.isMyProfile) {
          let event = this.isEditMode ? 'updated' : response.obj;
          this.closeDialog(event);
        }
        this.messageService.showMessage('success', this.isEditMode || this.isMyProfile ? 'Modifica utente' : 'Inserisci utente',response.message);
      }, (err) => {
        this.showSpinner = false;
        this.messageService.showMessage('error', this.isEditMode || this.isMyProfile ? 'Modifica utente' : 'Inserisci utente',err.error.message);
      });
    }
  }

  cambiaPasswordUtente(cambioPasswordForm: NgForm): void {
    if (this.txtOldPassword == this.user.password)
      this.messageService.showMessage('warn','Modifica password','La nuova password è uguale a quella precedente');
    else {
      if (this.user.password != this.txtInsertRePassword)
        this.messageService.showMessage('error','Modifica password','Attenzione: le due password non coincidono');
      else {
        this.userService.cambiaPasswordUtente(this.user, this.txtOldPassword).subscribe(     
          response => {
            if(response.err)
              this.messageService.showMessage('error','Modifica password',response.message);
            else {
              this.messageService.showMessage('success','Modifica password',response.message);

              this.user.password = null;
              this.txtInsertRePassword = null;
              this.txtOldPassword = null;
              cambioPasswordForm.resetForm();
            }         
          }, error => {
            this.messageService.showMessage('error','Modifica password',error.message);
          }      
        );
      }
    }
  }

  calculateCF() {
    if(!this.user.ragioneSociale) {
      this.user.provinciadinascita = this.user.provinciadinascita?.toUpperCase() || '';

      if(this.user.provinciadinascita.length == 2 && this.user.nome 
          && this.user.cognome && this.user.sesso 
          && this.user.datadinascita && this.user.luogodinascita) {
            this.user.codicefiscale = this.utilityService.getCodiceFiscale(this.user);
  
            if(!this.user.codicefiscale)
              this.messageService.showMessage('warn', 'Codice fiscale', 'Attenzione: provincia e comune inseriti non corrispondono');
          }
        else 
          this.user.codicefiscale = '';
      }
  }

  closeDialog(event?) {
    this.dialogRef.close(event);
  }

  closeMunicipioDialog(event?){
    if(event == "annulla") {
      this.user.municipio_id = this.bkpUser.municipio_id;
      this.user.group_id = this.bkpUser.group_id;
      this.setAutoma();
      this.bkpUser.successed = false;
    }
    else {
      this.bkpUser.successed = true;
      this.setAutoma();
    }
    
    this.showMunicipiDialog = false;
  }

  //selectButton primeNG
  sessoUsers: any[] = [
    {label: "Maschio", code: "M"},
    {label: "Femmina", code: "F"}
  ]

  //yearRange per p-calendar
  calculateYearRange():string {
    let min = new Date().getFullYear()-100;
    let max = new Date().getFullYear()+1;
    return min.toString() + ":" + max.toString();
  }

  onChangeDropDown(event) {
    this.user.uoid = event.value.uoid;
    this.user.denominazione = event.value.denominazione;
  }

  onChangeEmail() {
    if(!this.isEditMode && !this.isMyProfile) {
      var regexp = new RegExp('[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$');
      if(regexp.test(this.user.email)) {
        var emailSplitted = this.user.email.split('@');
        this.user.username = emailSplitted[0];
      }
      else {
        this.user.username = '';
      }
    }
  }
}
