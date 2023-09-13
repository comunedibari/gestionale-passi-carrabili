import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrasferimentoTitolaritaComponent } from './trasferimento-titolarita.component';

describe('TrasferimentoTitolaritaComponent', () => {
  let component: TrasferimentoTitolaritaComponent;
  let fixture: ComponentFixture<TrasferimentoTitolaritaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TrasferimentoTitolaritaComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TrasferimentoTitolaritaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
