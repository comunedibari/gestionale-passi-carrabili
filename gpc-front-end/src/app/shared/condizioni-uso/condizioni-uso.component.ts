import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-condizioni-uso',
  templateUrl: './condizioni-uso.component.html',
  styleUrls: ['./condizioni-uso.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class CondizioniUsoComponent implements OnInit {

  constructor(private router: Router) { }

  ngOnInit(): void {
  }

  redirectHomePage(){
    this.router.navigate(['/login']);
  }

}
