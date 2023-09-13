import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PraticheRevocateComponent } from './pratiche-revocate.component';

describe('PraticheRevocateComponent', () => {
  let component: PraticheRevocateComponent;
  let fixture: ComponentFixture<PraticheRevocateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PraticheRevocateComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PraticheRevocateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
