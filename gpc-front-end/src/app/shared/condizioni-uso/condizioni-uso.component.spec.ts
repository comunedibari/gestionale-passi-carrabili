import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CondizioniUsoComponent } from './condizioni-uso.component';

describe('CondizioniUsoComponent', () => {
  let component: CondizioniUsoComponent;
  let fixture: ComponentFixture<CondizioniUsoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CondizioniUsoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CondizioniUsoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
