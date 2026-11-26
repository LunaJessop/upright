import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  batchCountLabel,
  formatDate,
  formatPlannedDelta,
  formatQty,
  formatSkuSource,
  itemToBomLines,
  itemToDraft,
  itemToRouterPhases,
  routerPhasesToPayload,
  stockStatusLabel,
} from "./itemDetail.js";

describe("itemToDraft", () => {
  it("fills a make item's sell price from the legacy default price", () => {
    const draft = itemToDraft({
      name: "Oil",
      sku: null,
      description: null,
      make_or_buy: "make",
      unit_of_measure: "oz",
      default_unit_price: 12,
      unit_cost: null,
      unit_sell_price: null,
      vendor: null,
      active: 1,
      tags: [{ id: "3", name: " Face " }],
    });
    assert.equal(draft.make_or_buy, "make");
    assert.equal(draft.unit_sell_price, "12");
    assert.equal(draft.unit_cost, "");
    assert.equal(draft.sku, "");
    assert.equal(draft.description, "");
    assert.equal(draft.vendor, "");
    assert.equal(draft.active, true);
    assert.deepEqual(draft.tags, [{ id: 3, name: "Face" }]);
  });

  it("fills a buy item's unit cost from the legacy default price", () => {
    const draft = itemToDraft({
      name: "Wax",
      make_or_buy: "buy",
      default_unit_price: "4.5",
      unit_cost: null,
      unit_sell_price: null,
      vendor: 8,
      active: false,
    });
    assert.equal(draft.make_or_buy, "buy");
    assert.equal(draft.unit_cost, "4.5");
    assert.equal(draft.unit_sell_price, "");
    assert.equal(draft.vendor, "8");
    assert.deepEqual(draft.tags, []);
  });

  it("keeps an edited unit cost when the item already has one", () => {
    const draft = itemToDraft({
      name: "Wax",
      make_or_buy: false,
      unit_cost: 2,
      default_unit_price: 9,
      vendor: 0,
    });
    assert.equal(draft.unit_cost, "2");
    assert.equal(draft.vendor, "0");
  });
});

describe("itemToBomLines", () => {
  it("returns an empty list when the item has no recipe", () => {
    assert.deepEqual(itemToBomLines({ name: "Oil" }, 4), []);
    assert.deepEqual(itemToBomLines({ bom_items: null }, 4), []);
  });

  it("maps recipe rows onto editor lines starting at the given id", () => {
    assert.deepEqual(
      itemToBomLines(
        {
          bom_items: [
            {
              component_item_id: 9,
              quantity: 2,
              unit_of_measure: "oz",
              phase_id: 4,
              phase_name: "Melt",
            },
            { component_item_id: 3, quantity: null, phase_id: "", phase_name: null },
          ],
        },
        10
      ),
      [
        {
          id: 10,
          itemId: "9",
          quantity: "2",
          unitOfMeasure: "oz",
          phaseId: "4",
          phaseName: "Melt",
        },
        {
          id: 11,
          itemId: "3",
          quantity: "1",
          unitOfMeasure: "",
          phaseId: "",
          phaseName: "",
        },
      ]
    );
  });
});

describe("itemToRouterPhases", () => {
  it("returns an empty list when phases are missing", () => {
    assert.deepEqual(itemToRouterPhases({}, 1), []);
  });

  it("copies phases into draft rows and falls back to position for sequence", () => {
    assert.deepEqual(
      itemToRouterPhases(
        {
          router_phases: [
            { sequence: 3, name: "Melt", description: null, estimated_minutes: 15 },
            { name: null, description: " Cool ", estimated_minutes: null },
          ],
        },
        5
      ),
      [
        {
          id: 5,
          sequence: 3,
          name: "Melt",
          description: "",
          estimated_minutes: "15",
        },
        {
          id: 6,
          sequence: 2,
          name: "",
          description: " Cool ",
          estimated_minutes: "",
        },
      ]
    );
  });
});

describe("routerPhasesToPayload", () => {
  it("renumbers from the current order and blanks empty minutes", () => {
    assert.deepEqual(
      routerPhasesToPayload([
        { sequence: 9, name: " Cool ", description: " rest ", estimated_minutes: "  " },
        { sequence: 1, name: "Melt", description: "", estimated_minutes: " 12 " },
      ]),
      [
        { sequence: 1, name: "Cool", description: "rest", estimated_minutes: null },
        { sequence: 2, name: "Melt", description: "", estimated_minutes: "12" },
      ]
    );
  });
});

describe("item detail formatters", () => {
  it("formats dates without shifting a calendar day", () => {
    assert.equal(formatDate(""), "—");
    assert.equal(formatDate(null), "—");
    assert.equal(formatDate("2026-03-05"), "Mar 5, 2026");
    assert.equal(formatDate("not-a-date"), "not-a-date");
    assert.equal(formatDate(new Date("2026-03-05T00:00:00.000Z")), "Mar 5, 2026");
    assert.equal(formatDate(new Date(2026, 2, 5, 15, 30)), "Mar 5, 2026");
  });

  it("formats quantities, stock status, and planned batch effect", () => {
    assert.equal(formatQty(4), "4");
    assert.equal(formatQty(1.25), "1.25");
    assert.equal(formatQty("nope"), "nope");
    assert.equal(formatQty(undefined), "—");
    assert.equal(stockStatusLabel("below"), "Below goal");
    assert.equal(stockStatusLabel("above"), "Above goal");
    assert.equal(stockStatusLabel("on_track"), "On track");
    assert.equal(stockStatusLabel("other"), null);
    assert.equal(formatPlannedDelta(0, "oz"), "No open batch effect");
    assert.equal(formatPlannedDelta("x", "oz"), "No open batch effect");
    assert.equal(formatPlannedDelta(4, "oz"), "After open batches (+4 oz)");
    assert.equal(formatPlannedDelta(-2, ""), "After open batches (−2)");
  });

  it("labels sku source and batch counts", () => {
    assert.equal(formatSkuSource("purchase"), "Purchase");
    assert.equal(formatSkuSource("production"), "Production");
    assert.equal(formatSkuSource("other"), "—");
    assert.equal(batchCountLabel(1), "1 batch");
    assert.equal(batchCountLabel(2), "2 batches");
  });
});
