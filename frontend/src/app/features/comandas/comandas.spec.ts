import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Comandas } from './comandas';

describe('Comandas', () => {
  let component: Comandas;
  let fixture: ComponentFixture<Comandas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Comandas]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Comandas);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
