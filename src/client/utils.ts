/**
 * Client Utility Functions for Core SPA
 */

/**
 * Formats a resource key or param into a clean, human-readable title.
 * Examples:
 *   "order_items" -> "Order Items"
 *   "order_item"  -> "Order Item"
 *   "products"    -> "Products"
 *   "warehouses"  -> "Warehouses"
 */
export function formatResourceTitle(name: string): string {
  if (!name) return "";
  return name
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Formats a camelCase or snake_case field key into a human-friendly label.
 * Examples:
 *   "orderNumber"    -> "Order Number"
 *   "billingAddress" -> "Billing Address"
 *   "quantityOnHand" -> "Quantity On Hand"
 *   "leadTimeDays"   -> "Lead Time Days"
 */
export function formatFieldLabel(key: string): string {
  if (!key) return "";
  const spaced = key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
