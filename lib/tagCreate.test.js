import assert from "node:assert/strict";
import test from "node:test";
import { createdTag, tagsForSave, upsertTagCatalog } from "./tagCreate.js";

test("a created tag keeps the id returned by the server", () => {
  assert.deepEqual(createdTag({ id: 4, name: "QA TEST Fresh" }, "QA TEST Fresh"), {
    id: 4,
    name: "QA TEST Fresh",
  });
});

test("an existing tag is reused when the server matches the name ignoring case", () => {
  assert.deepEqual(createdTag({ id: 2, name: "Seasonal" }, "seasonal"), {
    id: 2,
    name: "Seasonal",
  });
});

test("a response without an id is not added", () => {
  assert.equal(createdTag({ name: "Broken" }, "Broken"), null);
  assert.equal(createdTag(null, "Broken"), null);
});

test("the shared catalog gains the new tag once and keeps the saved name", () => {
  const first = upsertTagCatalog(
    [{ id: 1, name: "Retail" }],
    { id: 4, name: "QA TEST Fresh" }
  );
  assert.deepEqual(
    first.map((tag) => tag.name),
    ["QA TEST Fresh", "Retail"]
  );
  const again = upsertTagCatalog(first, { id: 4, name: "QA TEST Fresh" });
  assert.equal(again.filter((tag) => tag.id === 4).length, 1);
  const renamed = upsertTagCatalog(again, { id: 1, name: "Retail shop" });
  assert.equal(renamed.find((tag) => tag.id === 1).name, "Retail shop");
});

test("queued items store real tag ids and do not send a pending name", () => {
  assert.deepEqual(
    tagsForSave([
      { id: 4, name: "QA TEST Fresh" },
      { name: "Still pending" },
      { id: 4, name: "QA TEST Fresh" },
      { id: 1, name: "Retail" },
    ]),
    [
      { id: 4, name: "QA TEST Fresh" },
      { id: 1, name: "Retail" },
    ]
  );
});
