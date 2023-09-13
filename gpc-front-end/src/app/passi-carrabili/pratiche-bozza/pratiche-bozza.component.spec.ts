import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PraticheBozzaComponent } from './pratiche-bozza.component';

describe('PraticheBozzaComponent', () => {
  let component: PraticheBozzaComponent;
  let fixture: ComponentFixture<PraticheBozzaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PraticheBozzaComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PraticheBozzaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
