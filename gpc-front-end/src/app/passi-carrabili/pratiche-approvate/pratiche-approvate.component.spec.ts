import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PraticheApprovateComponent } from './pratiche-approvate.component';

describe('PraticheApprovateComponent', () => {
  let component: PraticheApprovateComponent;
  let fixture: ComponentFixture<PraticheApprovateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PraticheApprovateComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PraticheApprovateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
