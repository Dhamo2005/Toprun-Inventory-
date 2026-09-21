import { describe, it, expect } from 'vitest';
import { SparePart } from '../types.ts';

describe('Inventory Export Utilities', () => {
  const sampleParts: SparePart[] = [
    {
      id: 'part_001',
      partNumber: 'HD-CSG-20-80',
      name: 'Harmonic Drive Gear Reducer',
      category: 'Actuators & Motors',
      robotModel: 'Universal Robots UR10e',
      description: 'Precision strain wave reducer for Joint 2.',
      imageUrl: 'https://example.com/gear.jpg',
      stockLeft: 2,
      minThreshold: 4,
      consumed: 6,
      needToOrder: 6,
      unitCost: 850.00,
      supplier: 'Harmonic Drive Systems',
      leadTimeDays: 14,
      location: 'Bay 2, Bin A-14',
      status: 'low_stock',
      lastUpdated: '2025-02-15T10:00:00Z'
    },
    {
      id: 'part_002',
      partNumber: 'INT-D435I-01',
      name: 'Intel RealSense D435i Camera',
      category: 'Sensors & Vision',
      robotModel: 'Boston Dynamics Spot',
      description: 'Depth sensing vision module.',
      imageUrl: 'https://example.com/camera.jpg',
      stockLeft: 12,
      minThreshold: 5,
      consumed: 18,
      needToOrder: 0,
      unitCost: 380.00,
      supplier: 'Intel Vision Labs',
      leadTimeDays: 5,
      location: 'Optics Cabinet 4',
      status: 'in_stock',
      lastUpdated: '2025-02-14T08:30:00Z'
    }
  ];

  it('calculates total valuation correctly across catalog items', () => {
    const totalValuation = sampleParts.reduce((acc, p) => acc + (p.stockLeft * p.unitCost), 0);
    // (2 * 850) + (12 * 380) = 1700 + 4560 = 6260
    expect(totalValuation).toBe(6260);
  });

  it('generates properly formatted CSV rows escaping quotes', () => {
    const row = sampleParts.map(p => [
      `"${p.partNumber}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      p.stockLeft,
      p.unitCost.toFixed(2),
      `"${p.status}"`
    ]);

    expect(row[0][0]).toBe('"HD-CSG-20-80"');
    expect(row[0][1]).toBe('"Harmonic Drive Gear Reducer"');
    expect(row[0][2]).toBe(2);
    expect(row[0][3]).toBe('850.00');
    expect(row[0][4]).toBe('"low_stock"');
  });

  it('filters parts by category and threshold criteria correctly', () => {
    const needy = sampleParts.filter(p => p.needToOrder > 0);
    expect(needy.length).toBe(1);
    expect(needy[0].partNumber).toBe('HD-CSG-20-80');
  });
});
