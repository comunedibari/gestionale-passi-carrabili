import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StoricoPraticheComponent } from './storico-pratiche.component';

describe('StoricoPraticheComponent', () => {
  let component: StoricoPraticheComponent;
  let fixture: ComponentFixture<StoricoPraticheComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StoricoPraticheComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StoricoPraticheComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
