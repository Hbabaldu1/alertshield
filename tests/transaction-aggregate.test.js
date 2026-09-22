const crypto = require('node:crypto');

const VALID_LIFECYCLE_TRANSITIONS = {
  DRAFT: new Set(['PAYMENT_PENDING', 'CANCELLED', 'EXPIRED']),
  PAYMENT_PENDING: new Set(['FUNDED', 'CANCELLED', 'EXPIRED']),
  FUNDED: new Set(['READY_TO_SHIP', 'CANCELLED']),
  READY_TO_SHIP: new Set(['SHIPPED', 'CANCELLED']),
  SHIPPED: new Set(['IN_TRANSIT', 'DELIVERED']),
  IN_TRANSIT: new Set(['DELIVERED', 'EXPIRED']),
  DELIVERED: new Set(['INSPECTION']),
  INSPECTION: new Set(['COMPLETED', 'EXPIRED']),
  EXPIRED: new Set(),
  CANCELLED: new Set(),
  COMPLETED: new Set(),
};

const VALID_PAYMENT_STATUSES = new Set([
  'NOT_CREATED',
  'ACCOUNT_PENDING',
  'AWAITING_PAYMENT',
  'PARTIALLY_PAID',
  'PAID_PENDING_RECONCILIATION',
  'CONFIRMED',
  'AMOUNT_MISMATCH',
  'FAILED',
  'REVERSED',
  'UNKNOWN',
  'REFUND_PENDING',
  'REFUNDED',
  'PARTIALLY_REFUNDED',
]);

const VALID_SHIPMENT_STATUSES = new Set([
  'NOT_CREATED',
  'CREATED',
  'DISPATCHED',
  'IN_TRANSIT',
  'DELIVERED',
  'DELIVERY_EXCEPTION',
  'MANUALLY_CONFIRMED',
  'UNKNOWN',
]);

const VALID_INSPECTION_STATUSES = new Set(['NOT_STARTED', 'OPEN', 'ACCEPTED', 'EXPIRED']);
const VALID_DISPUTE_STATUSES = new Set(['NONE', 'OPEN', 'UNDER_REVIEW', 'MORE_INFORMATION_REQUIRED', 'RESOLVED_BUYER', 'RESOLVED_MERCHANT', 'PARTIAL_SETTLEMENT', 'CLOSED']);
const VALID_PAYOUT_STATUSES = new Set(['NOT_ELIGIBLE', 'ELIGIBLE', 'RELEASE_AUTHORIZED', 'SUBMISSION_PENDING', 'SUBMITTED', 'PENDING', 'SUCCEEDED', 'FAILED', 'UNKNOWN', 'RECONCILIATION_REQUIRED']);
const VALID_HOLD_STATES = new Set(['NONE', 'FRAUD_HOLD', 'COMPLIANCE_HOLD', 'RECONCILIATION_HOLD', 'PAYMENT_REVERSAL_HOLD', 'PAYOUT_HOLD']);

class TransactionAggregate {
  constructor({
    id,
    merchantId,
    buyerId = null,
    amountMinor,
    currency,
    description,
    status = 'DRAFT',
    paymentStatus = 'NOT_CREATED',
    shipmentStatus = 'NOT_CREATED',
    inspectionStatus = 'NOT_STARTED',
    disputeStatus = 'NONE',
    payoutStatus = 'NOT_ELIGIBLE',
    holdState = 'NONE',
    createdAt = new Date().toISOString(),
    updatedAt = new Date().toISOString(),
    publicReference = null,
    version = 1,
  }) {
    if (!id) throw new Error('TransactionAggregate id is required.');
    if (!merchantId) throw new Error('TransactionAggregate merchantId is required.');
    if (!amountMinor || typeof amountMinor !== 'bigint') throw new Error('TransactionAggregate amountMinor must be a bigint.');
    if (amountMinor < 0n) throw new Error('TransactionAggregate amountMinor cannot be negative.');
    if (!currency || typeof currency !== 'string') throw new Error('TransactionAggregate currency is required.');
    if (!description || typeof description !== 'string' || !description.trim()) throw new Error('TransactionAggregate description is required.');
    if (!VALID_LIFECYCLE_TRANSITIONS[status]) throw new Error(`Unsupported transaction lifecycle status: ${status}`);
    if (!VALID_PAYMENT_STATUSES.has(paymentStatus)) throw new Error(`Unsupported payment status: ${paymentStatus}`);
    if (!VALID_SHIPMENT_STATUSES.has(shipmentStatus)) throw new Error(`Unsupported shipment status: ${shipmentStatus}`);
    if (!VALID_INSPECTION_STATUSES.has(inspectionStatus)) throw new Error(`Unsupported inspection status: ${inspectionStatus}`);
    if (!VALID_DISPUTE_STATUSES.has(disputeStatus)) throw new Error(`Unsupported dispute status: ${disputeStatus}`);
    if (!VALID_PAYOUT_STATUSES.has(payoutStatus)) throw new Error(`Unsupported payout status: ${payoutStatus}`);
    if (!VALID_HOLD_STATES.has(holdState)) throw new Error(`Unsupported hold state: ${holdState}`);

    this.id = id;
    this.merchantId = merchantId;
    this.buyerId = buyerId;
    this.amountMinor = amountMinor;
    this.currency = currency.toUpperCase();
    this.description = description;
    this.status = status;
    this.paymentStatus = paymentStatus;
    this.shipmentStatus = shipmentStatus;
    this.inspectionStatus = inspectionStatus;
    this.disputeStatus = disputeStatus;
    this.payoutStatus = payoutStatus;
    this.holdState = holdState;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.publicReference = publicReference;
    this.version = version;
    this.inspectionStartedAt = null;
    this.inspectionExpiresAt = null;
    this.events = [];
    this._appendEvent('TransactionCreated', {
      id,
      merchantId,
      buyerId,
      amountMinor,
      currency: this.currency,
      description,
      publicReference,
      status,
      version,
    });
  }

  _appendEvent(type, payload, actor = 'system', requestId = null) {
    const event = {
      id: crypto.randomUUID(),
      transactionId: this.id,
      type,
      occurredAt: new Date().toISOString(),
      actor,
      requestId,
      payload,
    };
    this.events.push(event);
    this.updatedAt = event.occurredAt;
    return event;
  }

  assertNoBlockingConditions() {
    if (['OPEN', 'UNDER_REVIEW', 'MORE_INFORMATION_REQUIRED'].includes(this.disputeStatus)) {
      throw new Error('Transaction cannot progress while a dispute is open.');
    }
    if (['FRAUD_HOLD', 'COMPLIANCE_HOLD', 'RECONCILIATION_HOLD', 'PAYMENT_REVERSAL_HOLD', 'PAYOUT_HOLD'].includes(this.holdState)) {
      throw new Error(`Transaction cannot progress while hold is active: ${this.holdState}`);
    }
  }

  assertTransitionAllowed(targetStatus) {
    const allowed = VALID_LIFECYCLE_TRANSITIONS[this.status] ?? new Set();
    if (!allowed.has(targetStatus)) {
      throw new Error(`Invalid lifecycle transition from ${this.status} to ${targetStatus}.`);
    }
  }

  transitionLifecycle(targetStatus, actor = 'system', requestId = null) {
    this.assertNoBlockingConditions();
    this.assertTransitionAllowed(targetStatus);
    const previous = this.status;
    this.status = targetStatus;
    this._appendEvent('TransactionStateChanged', {
      previousStatus: previous,
      currentStatus: targetStatus,
      reason: 'lifecycle-transition',
    }, actor, requestId);
    return this;
  }

  updatePaymentStatus(targetStatus, actor = 'system', requestId = null) {
    if (!VALID_PAYMENT_STATUSES.has(targetStatus)) {
      throw new Error(`Unsupported payment status: ${targetStatus}`);
    }
    const previous = this.paymentStatus;
    this.paymentStatus = targetStatus;
    this._appendEvent('PaymentStateChanged', {
      previousStatus: previous,
      currentStatus: targetStatus,
    }, actor, requestId);

    if (targetStatus === 'CONFIRMED' && this.status === 'PAYMENT_PENDING') {
      this.transitionLifecycle('FUNDED', actor, requestId);
    }
    return this;
  }

  updateShipmentStatus(targetStatus, actor = 'system', requestId = null) {
    if (!VALID_SHIPMENT_STATUSES.has(targetStatus)) {
      throw new Error(`Unsupported shipment status: ${targetStatus}`);
    }
    const previous = this.shipmentStatus;
    this.shipmentStatus = targetStatus;
    this._appendEvent('ShipmentStateChanged', {
      previousStatus: previous,
      currentStatus: targetStatus,
    }, actor, requestId);

    if (targetStatus === 'CREATED' && this.status === 'FUNDED') {
      this.transitionLifecycle('READY_TO_SHIP', actor, requestId);
    }
    if (targetStatus === 'DISPATCHED' && this.status === 'READY_TO_SHIP') {
      this.transitionLifecycle('SHIPPED', actor, requestId);
    }
    return this;
  }

  openInspection({ expiresAt, actor = 'system', requestId = null } = {}) {
    if (this.status !== 'DELIVERED') {
      throw new Error('Inspection can only open after delivery.');
    }
    if (!expiresAt) {
      throw new Error('Inspection expiration timestamp is required.');
    }
    if (this.disputeStatus !== 'NONE') {
      throw new Error('Inspection cannot open while a dispute exists.');
    }
    this.transitionLifecycle('INSPECTION', actor, requestId);
    this.inspectionStatus = 'OPEN';
    this.inspectionStartedAt = new Date().toISOString();
    this.inspectionExpiresAt = new Date(expiresAt).toISOString();
    this._appendEvent('InspectionOpened', {
      startedAt: this.inspectionStartedAt,
      expiresAt: this.inspectionExpiresAt,
    }, actor, requestId);
    return this;
  }

  acceptInspection(actor = 'system', requestId = null) {
    if (this.status !== 'INSPECTION') {
      throw new Error('Only an in-inspection transaction can be accepted.');
    }
    if (this.inspectionStatus !== 'OPEN') {
      throw new Error('Inspection must be open before acceptance.');
    }
    this.inspectionStatus = 'ACCEPTED';
    this._appendEvent('InspectionAccepted', {
      acceptedAt: new Date().toISOString(),
    }, actor, requestId);
    return this;
  }

  expireInspection(actor = 'system', requestId = null) {
    if (this.status !== 'INSPECTION') {
      throw new Error('Only in-inspection transactions can expire.');
    }
    this.inspectionStatus = 'EXPIRED';
    this._appendEvent('InspectionExpired', {
      expiredAt: new Date().toISOString(),
    }, actor, requestId);
    this.transitionLifecycle('EXPIRED', actor, requestId);
    return this;
  }

  setDisputeStatus(targetStatus, actor = 'system', requestId = null) {
    if (!VALID_DISPUTE_STATUSES.has(targetStatus)) {
      throw new Error(`Unsupported dispute status: ${targetStatus}`);
    }
    const previous = this.disputeStatus;
    this.disputeStatus = targetStatus;
    this._appendEvent('DisputeStateChanged', {
      previousStatus: previous,
      currentStatus: targetStatus,
    }, actor, requestId);
    return this;
  }

  placeHold(holdState, actor = 'system', requestId = null) {
    if (!VALID_HOLD_STATES.has(holdState)) {
      throw new Error(`Unsupported hold state: ${holdState}`);
    }
    if (holdState === 'NONE') {
      throw new Error('Use releaseHold to clear a hold.');
    }
    const previous = this.holdState;
    this.holdState = holdState;
    this._appendEvent('HoldPlaced', {
      previousState: previous,
      currentState: holdState,
    }, actor, requestId);
    return this;
  }

  releaseHold(actor = 'system', requestId = null) {
    const previous = this.holdState;
    this.holdState = 'NONE';
    this._appendEvent('HoldReleased', {
      previousState: previous,
      currentState: 'NONE',
    }, actor, requestId);
    return this;
  }

  markTransactionCreated(actor = 'system', requestId = null) {
    this.transitionLifecycle('DRAFT', actor, requestId);
    return this;
  }

  requestPayment(actor = 'system', requestId = null) {
    if (this.status !== 'DRAFT') {
      throw new Error('Payment can only be requested from DRAFT.');
    }
    this.transitionLifecycle('PAYMENT_PENDING', actor, requestId);
    this.paymentStatus = 'AWAITING_PAYMENT';
    this._appendEvent('PaymentStateChanged', {
      previousStatus: 'NOT_CREATED',
      currentStatus: 'AWAITING_PAYMENT',
    }, actor, requestId);
    return this;
  }

  finalizePayment(actor = 'system', requestId = null) {
    if (this.status !== 'PAYMENT_PENDING' && this.status !== 'FUNDED') {
      throw new Error('Payment can only be finalized while awaiting funding.');
    }
    this.updatePaymentStatus('CONFIRMED', actor, requestId);
    return this;
  }

  submitShipment(actor = 'system', requestId = null) {
    if (this.status !== 'READY_TO_SHIP') {
      throw new Error('Shipment can only be submitted when the transaction is ready to ship.');
    }
    this.shipmentStatus = 'CREATED';
    this._appendEvent('ShipmentStateChanged', {
      previousStatus: 'NOT_CREATED',
      currentStatus: 'CREATED',
    }, actor, requestId);
    this.transitionLifecycle('SHIPPED', actor, requestId);
    return this;
  }

  confirmDelivery(actor = 'system', requestId = null) {
    if (this.status !== 'SHIPPED' && this.status !== 'IN_TRANSIT') {
      throw new Error('Delivery confirmation is only valid while shipment is in progress.');
    }
    this.shipmentStatus = 'DELIVERED';
    this._appendEvent('ShipmentStateChanged', {
      previousStatus: this.shipmentStatus,
      currentStatus: 'DELIVERED',
    }, actor, requestId);
    this.transitionLifecycle('DELIVERED', actor, requestId);
    return this;
  }

  completeTransaction(actor = 'system', requestId = null) {
    if (this.status !== 'INSPECTION') {
      throw new Error('A transaction can only complete from INSPECTION.');
    }
    if (this.inspectionStatus !== 'ACCEPTED') {
      throw new Error('A transaction cannot complete until inspection is accepted.');
    }
    this.assertNoBlockingConditions();
    this.transitionLifecycle('COMPLETED', actor, requestId);
    return this;
  }

  cancel(actor = 'system', requestId = null) {
    if (['CANCELLED', 'COMPLETED', 'EXPIRED'].includes(this.status)) {
      throw new Error(`Transaction status ${this.status} cannot be cancelled again.`);
    }
    this.status = 'CANCELLED';
    this._appendEvent('TransactionStateChanged', {
      previousStatus: this.status,
      currentStatus: 'CANCELLED',
    }, actor, requestId);
    return this;
  }
}

module.exports = {
  TransactionAggregate,
  VALID_LIFECYCLE_TRANSITIONS,
  VALID_PAYMENT_STATUSES,
  VALID_SHIPMENT_STATUSES,
  VALID_INSPECTION_STATUSES,
  VALID_DISPUTE_STATUSES,
  VALID_PAYOUT_STATUSES,
  VALID_HOLD_STATES,
};

