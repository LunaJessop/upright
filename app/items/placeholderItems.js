/** Placeholder catalog — swap for `items.list()` from apiHandler when API is wired up. */
export const PLACEHOLDER_ITEMS = [
  {
    id: 1,
    name: "Aluminum bracket",
    sku: "BRK-001",
    description: "6061-T6 mounting bracket",
    make_or_buy: "buy",
    unit_of_measure: "ea",
    default_unit_price: "12.50",
    active: true,
    vendor: "MetalWorks Co.",
  },
  {
    id: 2,
    name: "PCB assembly",
    sku: "PCB-100",
    description: "Main control board v2",
    item_type: "subassembly",
    make_or_buy: "make",
    unit_of_measure: "ea",
    default_unit_price: "48.00",
    active: true,
    vendor: "",
  },
  {
    id: 3,
    name: "Steel rod",
    sku: "STL-ROD-6",
    description: "6mm diameter steel rod",
    item_type: "raw_material",
    make_or_buy: "buy",
    unit_of_measure: "ft",
    default_unit_price: "2.15",
    active: false,
    vendor: "Steel Supply Inc.",
  },
];

export async function fetchCatalogItems() {
  return PLACEHOLDER_ITEMS;
}
