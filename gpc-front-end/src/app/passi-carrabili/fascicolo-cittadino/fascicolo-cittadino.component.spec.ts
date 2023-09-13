import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FascicoloCittadinoComponent } from './fascicolo-cittadino.component';

describe('FascicoloCittadinoComponent', () => {
  let component: FascicoloCittadinoComponent;
  let fixture: ComponentFixture<FascicoloCittadinoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FascicoloCittadinoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FascicoloCittadinoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
