const { Money } = require('../../../src/lib/ledger');

const PAYMENT_STATUSES = new Set(['UNKNOWN', 'PENDING', 'SUCCEEDED', 'FAILED', 'REVERSED', 'PARTIALLY_REFUNDED', 'REFUNDED']);
const FAILURE_CODES = Object.freeze({
  PROVIDER_UNAVAILABLE: 'PROVIDER_UNAVAILABLE',
  PROVIDER_TIMEOUT: 'PROVIDER_TIMEOUT',
  INVALID_PROVIDER_RESPONSE: 'INVALID_PROVIDER_RESPONSE',
  INVALID_SIGNATURE: 'INVALID_SIGNATURE',
  UNKNOWN_PROVIDER_STATUS: 'UNKNOWN_PROVIDER_STATUS',
  REFERENCE_MISMATCH: 'REFERENCE_MISMATCH',
  AMOUNT_MISMATCH: 'AMOUNT_MISMATCH',
  CURRENCY_MISMATCH: 'CURRENCY_MISMATCH',
  DUPLICATE_PROVIDER_EVENT: 'DUPLICATE_PROVIDER_EVENT',
  PAYMENT_REVERSED: 'PAYMENT_REVERSED',
  RECONCILIATION_REQUIRED: 'RECONCILIATION_REQUIRED',
});

class PaymentBoundaryError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'PaymentBoundaryError';
    this.code = code;
    this.retryable = Boolean(details.retryable);
    this.details = details;
  }
}

function normalizeStatus(status) {
  return PAYMENT_STATUSES.has(status) ? status : 'UNKNOWN';
}

function normalizePayment(input) {
  if (!input || typeof input !== 'object') {
    throw new PaymentBoundaryError(FAILURE_CODES.INVALID_PROVIDER_RESPONSE, 'Provider payment response is invalid.');
  }
  if (!input.provider || !input.providerReference || !input.transactionId) {
    throw new PaymentBoundaryError(FAILURE_CODES.INVALID_PROVIDER_RESPONSE, 'Provider payment response lacks a reference.');
  }
  const amount = input.amount instanceof Money
    ? input.amount
    : Money.fromMinorUnits(input.amount.amountMinor, input.amount.currency);
  return Object.freeze({
    provider: input.provider,
    providerPaymentId: input.providerPaymentId,
    providerReference: input.providerReference,
    transactionId: input.transactionId,
    amount,
    currency: amount.currency,
    status: normalizeStatus(input.status),
    providerTimestamp: input.providerTimestamp,
    metadata: input.metadata ? Object.freeze({ ...input.metadata }) : undefined,
  });
}

function assertConfirmationFacts({ transaction, payment, trustedSource, reconciliationStatus = 'PENDING' }) {
  if (!trustedSource) throw new PaymentBoundaryError(FAILURE_CODES.INVALID_SIGNATURE, 'Payment evidence is not trusted.');
  if (!payment || !payment.providerReference) throw new PaymentBoundaryError(FAILURE_CODES.INVALID_PROVIDER_RESPONSE, 'Payment reference is required.');
  if (payment.transactionId !== transaction.id) throw new PaymentBoundaryError(FAILURE_CODES.REFERENCE_MISMATCH, 'Payment transaction reference does not match.');
  if (payment.amount.currency !== transaction.currency) throw new PaymentBoundaryError(FAILURE_CODES.CURRENCY_MISMATCH, 'Payment currency does not match.');
  if (payment.amount.amountMinor !== transaction.amountMinor) throw new PaymentBoundaryError(FAILURE_CODES.AMOUNT_MISMATCH, 'Payment amount does not match.');
  if (payment.status === 'UNKNOWN') throw new PaymentBoundaryError(FAILURE_CODES.UNKNOWN_PROVIDER_STATUS, 'Provider payment status is unknown.', { retryable: true });
  if (payment.status === 'REVERSED') throw new PaymentBoundaryError(FAILURE_CODES.PAYMENT_REVERSED, 'Payment was reversed.');
  if (payment.status !== 'SUCCEEDED') throw new PaymentBoundaryError(FAILURE_CODES.RECONCILIATION_REQUIRED, 'Payment is not confirmed for funding.', { retryable: true });
  if (reconciliationStatus !== 'MATCHED') throw new PaymentBoundaryError(FAILURE_CODES.RECONCILIATION_REQUIRED, 'Payment requires reconciliation.', { retryable: true });
  return true;
}

class CreatePaymentRequest {
  constructor(provider) { this.provider = provider; }
  execute(input) { return this.provider.createPaymentRequest(input); }
}

class QueryPaymentStatus {
  constructor(provider) { this.provider = provider; }
  execute(providerReference) { return this.provider.getPaymentStatus(providerReference); }
}

class RecordProviderPaymentEvent {
  constructor(eventRepository) { this.eventRepository = eventRepository; }
  async execute(event) {
    const normalized = normalizePayment(event.payment);
    const result = await this.eventRepository.record({ ...event, payment: normalized });
    return Object.freeze({ duplicate: Boolean(result.duplicate), event: result.event || result });
  }
}

class ConfirmPayment {
  constructor({ paymentRepository, transactionRepository }) {
    this.paymentRepository = paymentRepository;
    this.transactionRepository = transactionRepository;
  }
  async execute({ transactionId, payment, trustedSource, reconciliationStatus = 'PENDING', idempotencyKey }) {
    const transaction = await this.transactionRepository.getById(transactionId);
    if (!transaction) throw new PaymentBoundaryError('NOT_FOUND', 'Transaction was not found.');
    const normalized = normalizePayment(payment);
    assertConfirmationFacts({ transaction, payment: normalized, trustedSource, reconciliationStatus });
    return this.paymentRepository.confirmOnce({ transaction, payment: normalized, idempotencyKey });
  }
}

module.exports = {
  FAILURE_CODES,
  PaymentBoundaryError,
  normalizeStatus,
  normalizePayment,
  assertConfirmationFacts,
  CreatePaymentRequest,
  QueryPaymentStatus,
  RecordProviderPaymentEvent,
  ConfirmPayment,
};
