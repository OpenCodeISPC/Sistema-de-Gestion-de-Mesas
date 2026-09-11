import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { ComandaService } from './comandas.service';

describe('ComandaService', () => {
  let service: ComandaService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(ComandaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});