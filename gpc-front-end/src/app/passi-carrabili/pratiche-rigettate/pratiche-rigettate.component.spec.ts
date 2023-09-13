import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PraticheRigettateComponent } from './pratiche-rigettate.component';

describe('PraticheRigettateComponent', () => {
  let component: PraticheRigettateComponent;
  let fixture: ComponentFixture<PraticheRigettateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PraticheRigettateComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PraticheRigettateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
