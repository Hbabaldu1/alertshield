export type NormalizedPaymentStatus =
  | "UNKNOWN"
  | "PENDING"
  | "SUCCEEDED"
  | "FAILED"
  | "REVERSED"
  | "PARTIALLY_REFUNDED"
  | "REFUNDED";

export type NormalizedPayoutStatus =
  | "NOT_ELIGIBLE"
  | "ELIGIBLE"
  | "RELEASE_AUTHORIZED"
  | "SUBMISSION_PENDING"
  | "SUBMITTED"
  | "PENDING"
  | "SUCCEEDED"
  | "FAILED"
  | "UNKNOWN"
  | "RECONCILIATION_REQUIRED";

export type NormalizedRefundStatus = "PENDING" | "SUCCEEDED" | "FAILED" | "UNKNOWN";

export interface ExactMoneyContract {
  readonly amountMinor: bigint;
  readonly currency: string;
}

export interface PaymentRequestInput {
  readonly transactionId: string;
  readonly amount: ExactMoneyContract;
  readonly currency: string;
  readonly idempotencyKey: string;
  readonly metadata?: Readonly<Record<string, string>>;
}

export interface PaymentRequest {
  readonly provider: string;
  readonly transactionId: string;
  readonly providerReference: string;
  readonly amount: ExactMoneyContract;
  readonly currency: string;
  readonly createdAt: string;
  readonly expiresAt?: string;
  readonly metadata?: Readonly<Record<string, string>>;
}

export interface NormalizedPayment {
  readonly provider: string;
  readonly providerPaymentId?: string;
  readonly providerReference: string;
  readonly transactionId: string;
  readonly amount: ExactMoneyContract;
  readonly currency: string;
  readonly status: NormalizedPaymentStatus;
  readonly providerTimestamp?: string;
  readonly metadata?: Readonly<Record<string, string>>;
}

export interface PaymentAccountRequest {
  readonly transactionId: string;
  readonly amount: ExactMoneyContract;
  readonly currency: string;
  readonly idempotencyKey: string;
}

export interface NormalizedPaymentAccount {
  readonly provider: string;
  readonly transactionId: string;
  readonly providerAccountId: string;
  readonly displayAccountNumber?: string;
  readonly currency: string;
  readonly expiresAt?: string;
}

export interface ProviderPaymentEvent {
  readonly provider: string;
  readonly eventId: string;
  readonly eventType: string;
  readonly providerTimestamp?: string;
  readonly receivedAt: string;
  readonly verified: boolean;
  readonly payment: NormalizedPayment;
  readonly processingStatus: "RECEIVED" | "PROCESSING" | "PROCESSED" | "FAILED" | "QUARANTINED";
  readonly errorCode?: string;
  readonly retryable?: boolean;
}

export interface PaymentAccountProvider {
  createOrResolvePaymentAccount(input: PaymentAccountRequest): Promise<NormalizedPaymentAccount>;
  getPaymentAccount(providerAccountId: string): Promise<NormalizedPaymentAccount>;
}

export interface PaymentCollectionProvider {
  createPaymentRequest(input: PaymentRequestInput): Promise<PaymentRequest>;
  getPaymentStatus(providerReference: string): Promise<NormalizedPayment>;
  getPayment(providerReference: string): Promise<NormalizedPayment>;
}

export interface PayoutProvider {
  initiatePayout(input: unknown): Promise<never>;
  getPayoutStatus(providerReference: string): Promise<NormalizedPayoutStatus>;
}

export interface RefundProvider {
  initiateRefund(input: unknown): Promise<never>;
  getRefundStatus(providerReference: string): Promise<NormalizedRefundStatus>;
}

export interface WebhookVerifier {
  verify(input: unknown): Promise<ProviderPaymentEvent>;
}

export interface ReconciliationProvider {
  listPayments(input: unknown): Promise<never>;
  listPayouts(input: unknown): Promise<never>;
  listRefunds(input: unknown): Promise<never>;
}

export interface ShipmentProvider {
  createShipment(input: unknown): Promise<unknown>;
  getTracking(reference: string): Promise<unknown>;
  verifyDelivery(reference: string): Promise<unknown>;
}
