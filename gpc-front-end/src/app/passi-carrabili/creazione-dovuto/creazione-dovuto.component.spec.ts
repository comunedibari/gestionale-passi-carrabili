import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreazioneDovutoComponent } from './creazione-dovuto.component';

describe('CreazioneDovutoComponent', () => {
  let component: CreazioneDovutoComponent;
  let fixture: ComponentFixture<CreazioneDovutoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CreazioneDovutoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CreazioneDovutoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
