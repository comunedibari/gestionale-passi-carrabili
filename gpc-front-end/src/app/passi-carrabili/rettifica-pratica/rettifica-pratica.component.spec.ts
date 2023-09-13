import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RettificaPraticaComponent } from './rettifica-pratica.component';

describe('RettificaPraticaComponent', () => {
  let component: RettificaPraticaComponent;
  let fixture: ComponentFixture<RettificaPraticaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RettificaPraticaComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RettificaPraticaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
