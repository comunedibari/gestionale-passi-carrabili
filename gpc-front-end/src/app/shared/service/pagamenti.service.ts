import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PagamentiService {

  loginCredentials = {
    username: "user",
    password: "pass"
  };

  constructor(
    private http: HttpClient
  ) { }

  login(): Observable<any> {
    let headers = new HttpHeaders({'Content-Type': 'application/json'});
    let url = environment.apiHUBPagamenti + '/api/login';
    return this.http.post(url, this.loginCredentials, { headers, observe: 'response'} );
  }

  creaDovuto(xauth: any, req: any): Observable<any> {
    let headers = { headers: new HttpHeaders({'Content-Type': 'application/json', 'Accept': 'application/json', 'X-Auth': xauth})};
    let url = environment.apiHUBPagamenti + '/api/dovuti?invioEmail=true';
    return this.http.post<any>(url, req, headers);
  }

  getDovuto(xauth: any, responseType: any, iud: any): Observable<any> {
    let headers =  new HttpHeaders({'Content-Type': 'application/json', 'Accept': `application/${responseType}`, 'X-Auth': xauth});
    let url = environment.apiHUBPagamenti + '/api/dovuti/' + iud;
    responseType = responseType == 'pdf' ? 'blob' : 'json';
    return this.http.get(url, { headers, responseType: responseType });
  }

  getPagamento(xauth: any, responseType: any, iuv: any): Observable<any> {
    let headers =  new HttpHeaders({'Content-Type': 'application/json', 'Accept': `application/${responseType}`, 'X-Auth': xauth});
    let url = environment.apiHUBPagamenti + '/api/pagamenti/' + iuv;
    responseType = responseType == 'pdf' ? 'blob' : 'json';
    return this.http.get(url, { headers, responseType: responseType });
  }
}
