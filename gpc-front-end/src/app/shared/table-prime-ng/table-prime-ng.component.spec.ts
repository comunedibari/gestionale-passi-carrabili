import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TablePrimeNGComponent } from './table-prime-ng.component';

describe('TablePrimeNGComponent', () => {
  let component: TablePrimeNGComponent;
  let fixture: ComponentFixture<TablePrimeNGComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TablePrimeNGComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TablePrimeNGComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
