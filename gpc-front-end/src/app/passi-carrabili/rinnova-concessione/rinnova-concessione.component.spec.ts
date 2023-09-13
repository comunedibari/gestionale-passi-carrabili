import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RinnovaConcessioneComponent } from './rinnova-concessione.component';

describe('RinnovaConcessioneComponent', () => {
  let component: RinnovaConcessioneComponent;
  let fixture: ComponentFixture<RinnovaConcessioneComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RinnovaConcessioneComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RinnovaConcessioneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
