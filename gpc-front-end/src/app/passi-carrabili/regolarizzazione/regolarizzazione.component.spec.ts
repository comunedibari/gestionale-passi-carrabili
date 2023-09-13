import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegolarizzazioneComponent } from './regolarizzazione.component';

describe('RegolarizzazioneComponent', () => {
  let component: RegolarizzazioneComponent;
  let fixture: ComponentFixture<RegolarizzazioneComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RegolarizzazioneComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RegolarizzazioneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
