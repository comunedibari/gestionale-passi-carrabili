export interface User {
    group_id: number;
    municipio_id: number;
    nome: string;
    cognome: string;
    email: string;
    username: string;
    password: string;
    lastLogin: any;
    sesso: string;
    datadinascita: any;
    luogodinascita: string;
    provinciadinascita: string;
    codicefiscale: string;
    numtel: number;
    enabled: boolean;
    ragioneSociale: string;
    indirizzo: string;
    uoid: string;
    denominazione: string;
    deleted: boolean;
  }