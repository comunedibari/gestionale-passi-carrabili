import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AttesaPagamentoComponent } from './attesa-pagamento.component';

describe('AttesaPagamentoComponent', () => {
  let component: AttesaPagamentoComponent;
  let fixture: ComponentFixture<AttesaPagamentoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AttesaPagamentoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AttesaPagamentoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
