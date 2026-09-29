import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BagTipoProduto } from './bag-tipo-produto';

describe('BagTipoProduto', () => {
  let component: BagTipoProduto;
  let fixture: ComponentFixture<BagTipoProduto>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BagTipoProduto]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BagTipoProduto);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
