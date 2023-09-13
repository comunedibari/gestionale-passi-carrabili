import {Component, OnInit} from '@angular/core';
import { PrimeNGConfig } from 'primeng/api';
import { TranslationsService } from './shared/service/translations.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  
  isAuthenticate: boolean = false;
  showMenuSidebar: boolean = false;

  get minHeight(): string { // header + footer -16px padding del body
    return this.isAuthenticate ? 'calc(100% - 387.5px)' : 'calc(100% - 349.5px)';
  }

  constructor(
    private translationsService: TranslationsService,
    private primengConfig: PrimeNGConfig
    ) {
  }

  ngOnInit() {
    this.primengConfig.ripple = true;
    this.translationsService.setTranslations();
  }

  isLogged(state: any){
    this.isAuthenticate = state;
  }

  openMenu(){
    this.showMenuSidebar = true;
  }

  onClickItem() {
    this.showMenuSidebar = false;
  }
}
