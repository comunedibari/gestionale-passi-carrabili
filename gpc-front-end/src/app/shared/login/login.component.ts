import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../service/auth.service';
import { UtilityService } from '../service/utility.service';
import { MessageService } from '../service/message.service';
import { FormatDatePipe } from '../pipe/format-date.pipe';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})

export class LoginComponent implements OnInit {

  //credenziali
  username: string = '';
  password: string = '';
  // privacyCheckBox: boolean = false;
  // condizioniUsoCheckBox: boolean = false;

  //recupero password
  recuperaPasswordModal: boolean = false;
  recuperaPasswordSpinner: boolean = false;

  constructor(private router: Router,
    private authService: AuthService,
    private utilityService: UtilityService,
    private messageService: MessageService,
    private datePipe: FormatDatePipe
  ) {
  }

  ngOnInit(){
    this.authService.resetTokenAndStorage();
  }

  login() {
    // if(this.privacyCheckBox && this.condizioniUsoCheckBox) {
      this.authService.login(this.username, this.password).subscribe(
        data => {
          if (data.auth) {
            this.authService.saveToken(data.token);
            this.authService.saveUsername(JSON.stringify(data.username));
            this.authService.saveCodFiscale(JSON.stringify(data.userlogged.codicefiscale));
            this.authService.saveUtente(JSON.stringify(data.userlogged.nome), JSON.stringify(data.userlogged.cognome));
            this.authService.saveRagioneSociale(JSON.stringify(data.userlogged.ragioneSociale));
            this.authService.saveGroups(data.groups);
            this.authService.saveMunicipio(JSON.stringify(data.userlogged.municipio_id));
            this.authService.saveLastLogin(JSON.stringify(this.datePipe.transform(data.userlogged.lastLogin)));
            this.authService.saveEmail(JSON.stringify(data.userlogged.email));
            this.authService.saveUOID(JSON.stringify(data.userlogged.uoid));
            this.utilityService.goHome();   
          } 
        },
        err => {
          this.messageService.showMessage('error', 'Login utente', err.error.message);
        }
      );
    // }
    // else {
    //   this.messageService.showMessage('warn', 'Login utente', 'Per accedere al sistema bisogna accettare l\'informativa sulla privacy e le condizioni d\'uso');
    // }
  }

  // redirectPrivacyPage(){
  //   this.router.navigate(['/privacy']);
  // }

  // redirectCondizioniUsoPage(){
  //   this.router.navigate(['/condizioniuso']);
  // }

  recuperaPasswordDialog(){
    this.recuperaPasswordModal = true;
  }

  recuperaPassword(){
    this.recuperaPasswordSpinner = true;
    this.authService.recuperoPassword(this.username).subscribe(
      data => {
      this.recuperaPasswordModal = false;
      this.recuperaPasswordSpinner = false;
      this.messageService.showMessage('success', 'Recupero password', data.message);  
      },
      err => {
        this.recuperaPasswordSpinner = false;
        this.recuperaPasswordModal = false;
        this.messageService.showMessage('warn', 'Recupera password', err.error.message);
      }
    ); 
  }

}
