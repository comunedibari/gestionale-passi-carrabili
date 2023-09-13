import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AggiungiTagRfidComponent } from './aggiungi-tag-rfid.component';

describe('AggiungiTagRfidComponent', () => {
  let component: AggiungiTagRfidComponent;
  let fixture: ComponentFixture<AggiungiTagRfidComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AggiungiTagRfidComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AggiungiTagRfidComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
