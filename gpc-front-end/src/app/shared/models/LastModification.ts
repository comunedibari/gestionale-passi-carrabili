import { AuthService } from '../../shared/service/auth.service';

export class LastModification {
    username: string;
    utente: string;
    data_operazione: string;

    constructor(authService: AuthService) {
		this.username = authService.getUsername();
    this.utente = authService.getInfoUtente();
		this.data_operazione = '';
	}
}