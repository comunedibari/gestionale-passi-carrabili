import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RevocaConcessioneComponent } from './revoca-concessione.component';

describe('RevocaConcessioneComponent', () => {
  let component: RevocaConcessioneComponent;
  let fixture: ComponentFixture<RevocaConcessioneComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RevocaConcessioneComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RevocaConcessioneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
