import { environment } from '../../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../interface/user.interface';
import { UtilityService } from '../service/utility.service';

@Injectable()
export class UserService {

  constructor(
    private http: HttpClient, 
    private utilityService: UtilityService
    ) {}

  public getUser(username: string): Observable<any> {
    let requiredGroup = this.utilityService.getRequiredGroup();
    let headers = { headers: new HttpHeaders({'requiredgroup': requiredGroup})};

    const userUrl = environment.apiServer + "/api/user/getUser/" + username;
    return this.http.get<any>(userUrl, headers);
  }

  public getUsers(): Observable<any> {
    let requiredGroup = this.utilityService.getRequiredGroup();
    let headers = { headers: new HttpHeaders({'requiredgroup': requiredGroup})};

    const url = environment.apiServer + '/api/user/getUsers';
    return this.http.get<any>(url, headers);
  }

  public getUsersConcessionario(): Observable<any> {
    let requiredGroup = this.utilityService.getRequiredGroup();
    let headers = { headers: new HttpHeaders({'requiredgroup': requiredGroup})};

    const url = environment.apiServer + '/api/user/getUsersConcessionario';
    return this.http.get<any>(url, headers);
  }

  public disableUsersConcessionario(username: string): Observable<any> {
    let requiredGroup = this.utilityService.getRequiredGroup();
    let headers = { headers: new HttpHeaders({'requiredgroup': requiredGroup})};

    const url = environment.apiServer + '/api/user/disableUsersConcessionario/' + username;
    return this.http.get<any>(url, headers);
  }

  inserisciUtente(nuovoutente: User): Observable<any> {
    let requiredGroup = this.utilityService.getRequiredGroup();
    let headers = { headers: new HttpHeaders({'requiredgroup': requiredGroup})};

    return this.http.post<any>(environment.apiServer + '/api/user/inserisciUtente',
     { newuser: nuovoutente }, headers);
  }

  modifyUser(user: User): Observable<any> {
    let requiredGroup = this.utilityService.getRequiredGroup();
    let headers = { headers: new HttpHeaders({'requiredgroup': requiredGroup})};

    return this.http.post<any>(
      environment.apiServer + "/api/user/modificaDatiUtente", user, headers
    );
  }

  cambiaPasswordUtente(user: User, oldPassword: string): Observable<any> {
    let requiredGroup = this.utilityService.getRequiredGroup();
    let headers = { headers: new HttpHeaders({'requiredgroup': requiredGroup})};

    return this.http.post<any>(environment.apiServer + '/api/user/cambiaPasswordUtente',
      { user: user, oldPassword: oldPassword }, headers);
  }

  eliminaUtente(user: User) {
    let requiredGroup = this.utilityService.getRequiredGroup();
    let headers = { headers: new HttpHeaders({'requiredgroup': requiredGroup})};

    return this.http.post<any>(
      environment.apiServer + "/api/user/deleteUser", user, headers
    );
  }

  cercaCittadino(searchObj: any): Observable<any> {
    let requiredGroup = this.utilityService.getRequiredGroup();
    let headers = { headers: new HttpHeaders({'requiredgroup': requiredGroup})};

    const url = environment.apiServer + '/api/user/cercaCittadino';
    return this.http.post<any>(url, searchObj, headers);
  }

}
