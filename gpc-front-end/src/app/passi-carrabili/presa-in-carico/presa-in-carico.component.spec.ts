import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PresaInCaricoComponent } from './presa-in-carico.component';

describe('PresaInCaricoComponent', () => {
  let component: PresaInCaricoComponent;
  let fixture: ComponentFixture<PresaInCaricoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PresaInCaricoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PresaInCaricoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
