import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RichiestaPareriComponent } from './richiesta-pareri.component';

describe('RichiestaPareriComponent', () => {
  let component: RichiestaPareriComponent;
  let fixture: ComponentFixture<RichiestaPareriComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RichiestaPareriComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RichiestaPareriComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
