import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProrogaConcessioneComponent } from './proroga-concessione.component';

describe('ProrogaConcessioneComponent', () => {
  let component: ProrogaConcessioneComponent;
  let fixture: ComponentFixture<ProrogaConcessioneComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProrogaConcessioneComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProrogaConcessioneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
