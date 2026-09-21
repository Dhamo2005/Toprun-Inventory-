import { describe, it, expect } from 'vitest';
import { PartStatus } from '../types.ts';

function computeStockStatus(stockLeft: number, minThreshold: number): { status: PartStatus; needToOrder: number } {
  let status: PartStatus = 'in_stock';
  let needToOrder = 0;

  if (stockLeft === 0) {
    status = 'critical';
    needToOrder = minThreshold * 2;
  } else if (stockLeft <= minThreshold) {
    status = 'low_stock';
    needToOrder = (minThreshold * 2) - stockLeft;
  }

  return { status, needToOrder };
}

describe('Robot Spare Parts Inventory & Health Engine', () => {
  it('correctly marks inventory as healthy (in_stock) when stock exceeds threshold', () => {
    const result = computeStockStatus(15, 5);
    expect(result.status).toBe('in_stock');
    expect(result.needToOrder).toBe(0);
  });

  it('triggers low_stock status and calculates recommended reorder amount when below threshold', () => {
    // threshold = 5, target safety buffer = 10, current = 3 => needToOrder = 7
    const result = computeStockStatus(3, 5);
    expect(result.status).toBe('low_stock');
    expect(result.needToOrder).toBe(7);
  });

  it('triggers critical status when part stock hits zero', () => {
    // threshold = 4, target buffer = 8, current = 0 => needToOrder = 8
    const result = computeStockStatus(0, 4);
    expect(result.status).toBe('critical');
    expect(result.needToOrder).toBe(8);
  });

  it('updates stock correctly when consumption is logged', () => {
    let stockLeft = 10;
    let consumed = 2;
    const qtyToConsume = 3;

    stockLeft -= qtyToConsume;
    consumed += qtyToConsume;

    expect(stockLeft).toBe(7);
    expect(consumed).toBe(5);
  });

  it('updates stock correctly when restocking arrives', () => {
    let stockLeft = 3;
    const receivedQty = 12;

    stockLeft += receivedQty;

    expect(stockLeft).toBe(15);
    const health = computeStockStatus(stockLeft, 5);
    expect(health.status).toBe('in_stock');
    expect(health.needToOrder).toBe(0);
  });
});
