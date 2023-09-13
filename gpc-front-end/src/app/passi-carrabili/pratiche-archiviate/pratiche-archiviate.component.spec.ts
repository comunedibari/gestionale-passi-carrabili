import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PraticheArchiviateComponent } from './pratiche-archiviate.component';

describe('PraticheArchiviateComponent', () => {
  let component: PraticheArchiviateComponent;
  let fixture: ComponentFixture<PraticheArchiviateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PraticheArchiviateComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PraticheArchiviateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
