import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Cocina } from './cocina';

describe('Cocina', () => {
  let component: Cocina;
  let fixture: ComponentFixture<Cocina>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Cocina]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Cocina);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
