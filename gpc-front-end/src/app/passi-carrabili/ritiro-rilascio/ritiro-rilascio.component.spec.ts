import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RitiroRilascioComponent } from './ritiro-rilascio.component';

describe('RitiroRilascioComponent', () => {
  let component: RitiroRilascioComponent;
  let fixture: ComponentFixture<RitiroRilascioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RitiroRilascioComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RitiroRilascioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
