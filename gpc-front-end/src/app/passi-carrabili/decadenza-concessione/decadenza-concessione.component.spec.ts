import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DecadenzaConcessioneComponent } from './decadenza-concessione.component';

describe('DecadenzaConcessioneComponent', () => {
  let component: DecadenzaConcessioneComponent;
  let fixture: ComponentFixture<DecadenzaConcessioneComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DecadenzaConcessioneComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DecadenzaConcessioneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
