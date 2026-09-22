export interface PaymentAccountProvider { createPaymentAccount(input: unknown): Promise<unknown>; getPaymentAccount(reference: string): Promise<unknown>; }
export interface PaymentCollectionProvider { getPaymentStatus(reference: string): Promise<unknown>; reconcilePayment(reference: string): Promise<unknown>; }
export interface PayoutProvider { createRecipient(input: unknown): Promise<unknown>; initiatePayout(input: unknown): Promise<unknown>; getPayoutStatus(reference: string): Promise<unknown>; }
export interface RefundProvider { initiateRefund(input: unknown): Promise<unknown>; getRefundStatus(reference: string): Promise<unknown>; }
export interface WebhookVerifier { verify(request: unknown): Promise<unknown>; }
export interface ReconciliationProvider { listPayments(input: unknown): Promise<unknown>; listPayouts(input: unknown): Promise<unknown>; listRefunds(input: unknown): Promise<unknown>; }
export interface ShipmentProvider { createShipment(input: unknown): Promise<unknown>; getTracking(reference: string): Promise<unknown>; verifyDelivery(reference: string): Promise<unknown>; }
