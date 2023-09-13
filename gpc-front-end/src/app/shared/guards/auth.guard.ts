import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import {AuthService} from '../service/auth.service';


@Injectable()
export class AuthGuard implements CanActivate {

    constructor(private router: Router
    , private auth: AuthService) { }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        if (this.auth.getToken()) {
            if (route.data.requiredGroup === undefined ||
                route.data.requiredGroup === null) {
                return true;
            } else if (this.auth.checkGroups(route.data.requiredGroup)) {
                return true;
            } else {
                this.router.navigate(['/unauthorized-error']);
                return false;
            }
        }

        // not logged in so redirect to login page with the return url
        this.router.navigate(['/login']);
        return false;
    }
}
