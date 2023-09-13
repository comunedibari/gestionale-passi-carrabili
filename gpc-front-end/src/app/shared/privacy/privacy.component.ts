import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-privacy',
  templateUrl: './privacy.component.html',
  styleUrls: ['./privacy.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class PrivacyComponent implements OnInit {

  constructor(private router: Router) { }

  ngOnInit(): void {
  }

  redirectHomePage(){
    this.router.navigate(['/login']);
  }

}
