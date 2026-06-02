import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecuperoPassword } from './recupero-password';

describe('RecuperoPassword', () => {
  let component: RecuperoPassword;
  let fixture: ComponentFixture<RecuperoPassword>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecuperoPassword]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecuperoPassword);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
