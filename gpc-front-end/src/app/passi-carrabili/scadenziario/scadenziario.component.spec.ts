import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScadenziarioComponent } from './scadenziario.component';

describe('ScadenziarioComponent', () => {
  let component: ScadenziarioComponent;
  let fixture: ComponentFixture<ScadenziarioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ScadenziarioComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ScadenziarioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
