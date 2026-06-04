import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Mesas } from './mesas';

describe('Mesas', () => {
  let component: Mesas;
  let fixture: ComponentFixture<Mesas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Mesas]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Mesas);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
