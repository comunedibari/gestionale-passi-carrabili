import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PraticheDaRigettareComponent } from './pratiche-da-rigettare.component';

describe('PraticheDaRigettareComponent', () => {
  let component: PraticheDaRigettareComponent;
  let fixture: ComponentFixture<PraticheDaRigettareComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PraticheDaRigettareComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PraticheDaRigettareComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
