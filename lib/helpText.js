/**
 * Short notes for the question-mark control.
 * One string per topic so every screen says the same thing.
 */

export const HELP_TEXT = {
  bom: "BOM (bill of materials) is the recipe list: everything that goes into making one of this item.",
  usedIn: "Other items that list this one in their recipe.",
  productionPhases:
    "The ordered steps for making this item. On a batch, mark each step as the work gets done.",
  batches:
    "A batch is one production run of a make item: the quantity you plan to make, and the lot number for that run.",
  batchReceipt:
    "The cost and sales snapshot for this batch: what the purchased materials cost, and the revenue and margin from the sell price. It stays as it was when the batch was created.",
  plannedQty:
    "Planned quantity is what you will have on hand after open production batches. Make items go up by the amount you expect to finish. Buy items go down by what those batches will use.",
  goal: "An optional healthy range for how much to keep on hand. The bar shows whether current and planned quantities sit below, inside, or above that range.",
  makeVsBuy:
    "Buy means you purchase this item, such as a material or packaging. Make means you produce it, such as a finished good or a part you build.",
  routers:
    "A router is a saved list of production phases. Starting a make item from a router copies those phases onto the item. The item keeps its own copy, so later changes stay on the item and the saved router stays as it was.",
};

export const HELP_LABELS = {
  bom: "Help: BOM",
  usedIn: "Help: Used in",
  productionPhases: "Help: Production phases",
  batches: "Help: Batches",
  batchReceipt: "Help: Batch receipt",
  plannedQty: "Help: Planned quantity",
  goal: "Help: Goal",
  makeVsBuy: "Help: Make or buy",
  routers: "Help: Routers",
};
