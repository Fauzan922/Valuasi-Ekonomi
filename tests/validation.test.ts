import { describe, expect, it } from 'vitest';
import {
  parseAreaInput,
  validateRequiredText,
} from '../src/lib/validation/inputs';

describe('parseAreaInput', () => {
  const valid: Array<[string, number]> = [
    ['145290', 145290],
    ['145.290', 145290],
    ['145.290,50', 145290.5],
    ['145,290.50', 145290.5],
    ['1.234', 1234],
    ['1.23', 1.23],
    ['12,5', 12.5],
    ['1.234,5', 1234.5],
    ['0', 0],
    ['0,5', 0.5],
    ['1.000.000', 1000000],
    ['  2.500  ', 2500],
  ];

  for (const [input, expected] of valid) {
    it(`parses ${JSON.stringify(input)} as ${expected}`, () => {
      const result = parseAreaInput(input);
      expect(result.ok).toBe(true);
      expect(result.value).toBeCloseTo(expected, 8);
      expect(result.message).toBeNull();
    });
  }

  it('rejects empty input', () => {
    const result = parseAreaInput('   ');
    expect(result.ok).toBe(false);
    expect(result.value).toBeNull();
    expect(result.message).toMatch(/wajib/i);
  });

  it('rejects letters', () => {
    expect(parseAreaInput('seratus hektare').ok).toBe(false);
  });

  it('rejects negative numbers', () => {
    expect(parseAreaInput('-5').ok).toBe(false);
  });

  it('rejects values above the processing limit', () => {
    expect(parseAreaInput('9.999.999.999').ok).toBe(false);
  });
});

describe('validateRequiredText', () => {
  it('accepts and trims text', () => {
    const result = validateRequiredText('  Catatan uji  ', 'Label');
    expect(result.ok).toBe(true);
    expect(result.value).toBe('Catatan uji');
  });

  it('rejects empty text', () => {
    const result = validateRequiredText('   ', 'Label');
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/Label wajib/);
  });

  it('rejects overlong text', () => {
    const result = validateRequiredText('a'.repeat(11), 'Label', 10);
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/maksimal 10/);
  });
});
