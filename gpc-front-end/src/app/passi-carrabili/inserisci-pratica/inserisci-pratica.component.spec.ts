import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InserisciPraticaComponent } from './inserisci-pratica.component';

describe('InserisciPraticaComponent', () => {
  let component: InserisciPraticaComponent;
  let fixture: ComponentFixture<InserisciPraticaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InserisciPraticaComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InserisciPraticaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
