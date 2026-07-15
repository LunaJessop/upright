/** Display + checkout plan keys (server maps these to Stripe Price IDs). */

export const PLAN_FEATURES = [
  "Items, recipes (BOM), and batches in one place",
  "Multi-user workspace for your company",
  "Inventory and production visibility",
  "Sales tracking as you grow",
  "Empty workspace — your data, not sample junk",
  "Email support",
];

export const PLANS = [
  {
    id: "monthly",
    name: "Monthly",
    priceLabel: "$25",
    cadence: "per month",
    blurb: "Full access, billed monthly. Cancel anytime.",
    badge: null,
  },
  {
    id: "yearly",
    name: "Yearly",
    priceLabel: "$250",
    cadence: "per year",
    blurb: "Full access, billed yearly. Cancel anytime.",
    badge: "Save $50",
  },
];

export function getPlanById(id) {
  return PLANS.find((p) => p.id === id) ?? null;
}
