import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { User } from '../../shared/interface/user.interface';
import { UserService } from '../../shared/service/user.service';
import { MessageService } from '../../shared/service/message.service';
import { Group } from '../../shared/enums/Group.enum';
import { TableEvent } from '../../shared/table-prime-ng/models/TableEvent';
import { UserProfileComponent } from '../user-profile/user-profile.component';
import { UtilityService } from '../../shared/service/utility.service';
import { AuthService } from '../../shared/service/auth.service';
import { DialogService } from 'primeng/dynamicdialog';
import { ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-user-management',
  templateUrl: './user.management.component.html',
  styleUrls: ['./user.management.component.css']
})
export class UserManagementComponent implements OnInit {

  showSpinner: boolean = false;
  dataSource: any[];

  initSortColumn = 'nome';
  directionSortColumn = "1"; //1=asc  0=rand   -1=desc
  exportName = 'Lista Utenti'; 
  globalFilters: any[] = [
    {value:'nome', label:'Nome'},
    {value:'cognome', label:'Cognome'},
    {value:'denominazione', label:'Denominazione'},
    {value:'email', label:'Email'},
    {value:'username', label:'Username'},
  ];
  
  columnSchema = [
    {
      field: "username",
      header: "Username",
      type:"text"
    },
    {
      field: "nome",
      header: "Nome",
      type:"text"
    },
    {
      field: "cognome",
      header: "Cognome",
      type:"text"
    },
    {
      field: "denominazione",
      header: "Denominazione",
      type:"text"
    },
    {
      field: "email",
      header: "Email",
      type:"text"
    },
    {
      field: "group_id",
      header: "Profilo",
      type:"dropdown",
      show: (el) => {
        return this.utilityService.camelCaseToSpace(Group[el] || '--');
      }
    },
    {
      field:"municipio_id",
      header:"N. Municipio",
      type:"dropdown",
    },
    {
      field: "enabled",
      header: "Stato Utenza",
      type:"dropdown",
      show: (el) => {
        return el == true ? 'Abilitata' : 'Disabilitata';
      }
    }
  ];

  actions = [
    {
      key: "modifyDialog",
      icon: "fa fa-pencil",
      tooltip: "MODIFICA UTENTE"

    },
    {
      key: "deletingDialog",
      icon: "fa fa-trash",
      tooltip: "ELIMINA UTENTE"
    } 
  ];

  inserisciFeature: string = 'inserisciUtente';
  titleTable: string = 'Lista utenti a sistema';

  constructor(
    private userService: UserService,
    private utilityService: UtilityService,
    private authService: AuthService,
    private messageService: MessageService,
    public dialogService: DialogService,
    public confirmationService: ConfirmationService
    ) { }

  ngOnInit(): void {
    this.showSpinner = true;
    this.getUsers();
  }

  getUsers(){
    this.userService.getUsers().subscribe(data => {
      this.showSpinner = false;
      this.dataSource = this.authService.getGroup() == Group.Admin 
                          ? data.data.filter(x => x.group_id != Group.Admin)     
                          : data.data.filter(x => x.group_id != Group.Admin && x.group_id != Group.AmministratorePassiCarrabili);
    });
  }

  onTableEvent(tableEvent: TableEvent) {
    this[tableEvent.actionKey](tableEvent.data);
  }

  inserisciUtente(){
     let dialogRef = this.dialogService.open(UserProfileComponent, this.utilityService.configDynamicDialog(null,"Registrazione nuovo utente"));
     dialogRef.onClose.subscribe( resp => {
      if(resp) {
        this.showSpinner = true;
        setTimeout(() => { 
          this.getUsers();
        }, 1000);  
      }
    });
  }

  modifyDialog(user: User){
    let dialogRef  = this.dialogService.open(UserProfileComponent, this.utilityService.configDynamicDialog(user,`Modifica dati utente: ${user.username}`));

    dialogRef.onClose.subscribe( msg => { 
      if(msg == 'updated')
        this.dataSource = [...this.dataSource];
      else {
        this.showSpinner = true;
        setTimeout(() => { 
          this.getUsers();
        }, 1000);  
      }   
    });
  }

  deletingDialog(user: User) {
    this.confirmationService.confirm({
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Conferma",
      rejectLabel: "Annulla",
      acceptButtonStyleClass: "btn-custom-style btn-dialog-confirm",
      rejectButtonStyleClass: "btn-custom-style btn-dialog-confirm",
      header: "Eliminazione utente",
      message: "Confermi di voler eliminare l'utente '" + user.username + "'?",
      accept: () => {
        this.deleteUser(user);
      }
    });
  }

  deleteUser(user: User) {
    this.userService.eliminaUtente(user).subscribe(response => {
        this.messageService.showMessage('success','Elimazione utente',response.message);
        this.dataSource = this.dataSource.filter(x => x.username != user.username);
        this.dataSource = [...this.dataSource];
      },
      error => {
        this.messageService.showMessage('error','Elimazione utente',error.message);
      }    
    );
  }

}
