import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModificaPraticaComponent } from './modifica-pratica.component';

describe('ModificaPraticaComponent', () => {
  let component: ModificaPraticaComponent;
  let fixture: ComponentFixture<ModificaPraticaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ModificaPraticaComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ModificaPraticaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
