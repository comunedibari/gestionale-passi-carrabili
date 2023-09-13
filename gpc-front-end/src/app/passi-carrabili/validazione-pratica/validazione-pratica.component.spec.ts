import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ValidazionePraticaComponent } from './validazione-pratica.component';

describe('ValidazionePraticaComponent', () => {
  let component: ValidazionePraticaComponent;
  let fixture: ComponentFixture<ValidazionePraticaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ValidazionePraticaComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ValidazionePraticaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
