import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BonificaPraticheComponent } from './bonifica-pratiche.component';

describe('BonificaPraticheComponent', () => {
  let component: BonificaPraticheComponent;
  let fixture: ComponentFixture<BonificaPraticheComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BonificaPraticheComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BonificaPraticheComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
