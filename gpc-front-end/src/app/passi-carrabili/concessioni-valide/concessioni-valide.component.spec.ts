import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConcessioniValideComponent } from './concessioni-valide.component';

describe('ConcessioniValideComponent', () => {
  let component: ConcessioniValideComponent;
  let fixture: ComponentFixture<ConcessioniValideComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ConcessioniValideComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConcessioniValideComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
