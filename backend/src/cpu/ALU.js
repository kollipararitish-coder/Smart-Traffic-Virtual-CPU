/**
 * ALU.js
 * Arithmetic and Logic Unit for Educational Virtual CPU
 * Implements 16-bit arithmetic and bitwise logic operations with architectural flag updates.
 */

export class ALU {
  /**
   * Helper to evaluate Zero and Negative flags from 16-bit signed/unsigned result
   */
  static evaluateBasicFlags(val16) {
    const masked = val16 & 0xFFFF;
    const Z = masked === 0 ? 1 : 0;
    // 16-bit signed MSB bit 15
    const N = (masked & 0x8000) !== 0 ? 1 : 0;
    return { masked, Z, N };
  }

  /**
   * Addition (16-bit)
   */
  static add(a, b) {
    const full = (a & 0xFFFF) + (b & 0xFFFF);
    const { masked, Z, N } = this.evaluateBasicFlags(full);
    const C = full > 0xFFFF ? 1 : 0;

    // Signed overflow: sign of inputs is same, but sign of result is different
    const sa = (a & 0x8000) !== 0;
    const sb = (b & 0x8000) !== 0;
    const sr = (masked & 0x8000) !== 0;
    const V = sa === sb && sa !== sr ? 1 : 0;

    return {
      result: masked,
      flags: { Z, C, N, V }
    };
  }

  /**
   * Subtraction (16-bit: a - b)
   */
  static sub(a, b) {
    const diff = (a & 0xFFFF) - (b & 0xFFFF);
    const masked = diff & 0xFFFF;
    const Z = masked === 0 ? 1 : 0;
    const N = (masked & 0x8000) !== 0 ? 1 : 0;
    const C = (a & 0xFFFF) < (b & 0xFFFF) ? 1 : 0; // Borrow

    // Signed overflow for subtraction: signs differ, and result sign differs from operand A
    const sa = (a & 0x8000) !== 0;
    const sb = (b & 0x8000) !== 0;
    const sr = (masked & 0x8000) !== 0;
    const V = sa !== sb && sa !== sr ? 1 : 0;

    return {
      result: masked,
      flags: { Z, C, N, V }
    };
  }

  /**
   * Multiplication (16-bit: a * b)
   */
  static mul(a, b) {
    const full = (a & 0xFFFF) * (b & 0xFFFF);
    const { masked, Z, N } = this.evaluateBasicFlags(full);
    const C = full > 0xFFFF ? 1 : 0;
    const signedA = (a << 16) >> 16;
    const signedB = (b << 16) >> 16;
    const signedProduct = signedA * signedB;
    const V = signedProduct < -32768 || signedProduct > 32767 ? 1 : 0;

    return {
      result: masked,
      flags: { Z, C, N, V }
    };
  }

  /**
   * Division (16-bit: a / b)
   * Safely handles division by zero.
   */
  static div(a, b) {
    if ((b & 0xFFFF) === 0) {
      // Division by zero safe guard: returns 0 and sets Overflow/Error flag
      return {
        result: 0,
        flags: { Z: 1, C: 0, N: 0, V: 1 },
        error: 'DIVISION_BY_ZERO'
      };
    }
    const quotient = Math.floor((a & 0xFFFF) / (b & 0xFFFF));
    const { masked, Z, N } = this.evaluateBasicFlags(quotient);
    return {
      result: masked,
      flags: { Z, C: 0, N, V: 0 }
    };
  }

  /**
   * Bitwise AND
   */
  static and(a, b) {
    const masked = (a & b) & 0xFFFF;
    const { Z, N } = this.evaluateBasicFlags(masked);
    return {
      result: masked,
      flags: { Z, C: 0, N, V: 0 }
    };
  }

  /**
   * Bitwise OR
   */
  static or(a, b) {
    const masked = (a | b) & 0xFFFF;
    const { Z, N } = this.evaluateBasicFlags(masked);
    return {
      result: masked,
      flags: { Z, C: 0, N, V: 0 }
    };
  }

  /**
   * Bitwise XOR
   */
  static xor(a, b) {
    const masked = (a ^ b) & 0xFFFF;
    const { Z, N } = this.evaluateBasicFlags(masked);
    return {
      result: masked,
      flags: { Z, C: 0, N, V: 0 }
    };
  }

  /**
   * Bitwise NOT
   */
  static not(a) {
    const masked = (~a) & 0xFFFF;
    const { Z, N } = this.evaluateBasicFlags(masked);
    return {
      result: masked,
      flags: { Z, C: 0, N, V: 0 }
    };
  }

  /**
   * Compare (a CMP b)
   * Calculates a - b and updates flags WITHOUT modifying operands.
   */
  static cmp(a, b) {
    return this.sub(a, b);
  }

  /**
   * Increment (a + 1)
   */
  static inc(a) {
    return this.add(a, 1);
  }

  /**
   * Decrement (a - 1)
   */
  static dec(a) {
    return this.sub(a, 1);
  }
}
