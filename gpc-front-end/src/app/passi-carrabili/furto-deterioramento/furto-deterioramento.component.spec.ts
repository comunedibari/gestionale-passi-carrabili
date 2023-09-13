import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FurtoDeterioramentoComponent } from './furto-deterioramento.component';

describe('FurtoDeterioramentoComponent', () => {
  let component: FurtoDeterioramentoComponent;
  let fixture: ComponentFixture<FurtoDeterioramentoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FurtoDeterioramentoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FurtoDeterioramentoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
