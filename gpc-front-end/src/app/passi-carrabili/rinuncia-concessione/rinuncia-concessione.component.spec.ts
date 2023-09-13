import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RinunciaConcessioneComponent } from './rinuncia-concessione.component';

describe('RinunciaConcessioneComponent', () => {
  let component: RinunciaConcessioneComponent;
  let fixture: ComponentFixture<RinunciaConcessioneComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RinunciaConcessioneComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RinunciaConcessioneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
