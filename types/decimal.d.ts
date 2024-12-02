// decimal.d.ts
import type { Decimal } from 'decimal.js';

declare module 'decimal.js' {
  namespace Decimal {
    function create(value?: string | number): Decimal;
  }
}