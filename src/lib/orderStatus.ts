export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  shipped: "Shipped",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const HAPPY_PATH: OrderStatus[] = [
  "pending",
  "confirmed",
  "shipped",
  "out_for_delivery",
  "delivered",
];

export function statusStepIndex(status: string): number {
  return HAPPY_PATH.indexOf(status as OrderStatus);
}

export { HAPPY_PATH as ORDER_STATUS_STEPS };
