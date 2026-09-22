class Money {
  constructor(amountMinor, currency) {
    if (typeof amountMinor !== 'bigint') {
      throw new TypeError('Money amountMinor must be a bigint.');
    }
    if (amountMinor < 0n) {
      throw new RangeError('Money amountMinor cannot be negative.');
    }
    if (!Money.isValidCurrency(currency)) {
      throw new Error(`Unsupported currency: ${currency}`);
    }
    this.amountMinor = amountMinor;
    this.currency = currency;
    Object.freeze(this);
  }

  static SUPPORTED_CURRENCIES = new Set(['NGN', 'USD', 'EUR', 'GBP', 'KES', 'GHS', 'ZAR']);

  static isValidCurrency(currency) {
    return typeof currency === 'string' && Money.SUPPORTED_CURRENCIES.has(currency.toUpperCase());
  }

  static fromMinorUnits(amountMinor, currency = 'NGN') {
    return new Money(BigInt(amountMinor), currency);
  }

  static fromDecimalString(value, currency = 'NGN') {
    if (typeof value !== 'string' || value.trim() === '') {
      throw new TypeError('Money value must be a non-empty string.');
    }
    if (!/^-?\d+(\.\d+)?$/.test(value.trim())) {
      throw new Error('Malformed monetary value.');
    }
    if (value.includes('e') || value.includes('E') || value.includes(' ')) {
      throw new Error('Scientific notation and spaces are not allowed in money strings.');
    }
    const trimmed = value.trim();
    if (trimmed.startsWith('-')) {
      throw new Error('Negative monetary values are not allowed.');
    }
    const [whole, fraction = ''] = trimmed.split('.');
    if (fraction.length > 2) {
      throw new Error('Money values must not exceed two decimal places.');
    }
    const minor = BigInt(whole || '0') * 100n + BigInt((fraction + '00').slice(0, 2));
    return new Money(minor, currency);
  }

  add(other) {
    this.assertSameCurrency(other);
    return new Money(this.amountMinor + other.amountMinor, this.currency);
  }

  subtract(other) {
    this.assertSameCurrency(other);
    return new Money(this.amountMinor - other.amountMinor, this.currency);
  }

  compare(other) {
    this.assertSameCurrency(other);
    if (this.amountMinor < other.amountMinor) return -1;
    if (this.amountMinor > other.amountMinor) return 1;
    return 0;
  }

  equals(other) {
    return other instanceof Money && this.currency === other.currency && this.amountMinor === other.amountMinor;
  }

  isZero() {
    return this.amountMinor === 0n;
  }

  isPositive() {
    return this.amountMinor > 0n;
  }

  assertSameCurrency(other) {
    if (!(other instanceof Money)) {
      throw new TypeError('Currency comparison requires a Money value.');
    }
    if (this.currency !== other.currency) {
      throw new Error(`Currency mismatch: ${this.currency} vs ${other.currency}`);
    }
  }
}

module.exports = { Money };
