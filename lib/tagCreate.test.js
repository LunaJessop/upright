import assert from "node:assert/strict";
import test from "node:test";
import {
  createdTag,
  removeTagById,
  removeTagFromItems,
  renameTagInList,
  renameTagOnItems,
  tagsForSave,
  upsertTagCatalog,
} from "./tagCreate.js";

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

test("renaming a tag updates the shared list and every queued item", () => {
  const catalog = [
    { id: 1, name: "retail" },
    { id: 2, name: "Wholesale" },
  ];
  assert.deepEqual(
    renameTagInList(catalog, 1, "Retail").map((tag) => tag.name),
    ["Retail", "Wholesale"]
  );

  const items = [
    {
      id: 10,
      name: "QA TEST Soap",
      tags: [
        { id: 1, name: "retail" },
        { id: 2, name: "Wholesale" },
      ],
    },
    { id: 11, name: "QA TEST Oil", tags: [{ id: 2, name: "Wholesale" }] },
  ];
  const renamed = renameTagOnItems(items, 1, "Retail");
  assert.equal(renamed[0].name, "QA TEST Soap");
  assert.deepEqual(renamed[0].tags, [
    { id: 1, name: "Retail" },
    { id: 2, name: "Wholesale" },
  ]);
  assert.deepEqual(renamed[1].tags, [{ id: 2, name: "Wholesale" }]);
});

test("deleting a tag removes it from the list, the current item, and every queued item", () => {
  const catalog = [
    { id: 1, name: "QA TEST Retail" },
    { id: 2, name: "Wholesale" },
  ];
  assert.deepEqual(
    removeTagById(catalog, 1).map((tag) => tag.name),
    ["Wholesale"]
  );

  const current = [
    { id: 1, name: "QA TEST Retail" },
    { id: 2, name: "Wholesale" },
  ];
  assert.deepEqual(removeTagById(current, "1"), [{ id: 2, name: "Wholesale" }]);

  const items = [
    { id: 10, tags: [{ id: 1, name: "QA TEST Retail" }] },
    {
      id: 11,
      tags: [
        { id: 1, name: "QA TEST Retail" },
        { id: 2, name: "Wholesale" },
      ],
    },
  ];
  const next = removeTagFromItems(items, 1);
  assert.deepEqual(next[0].tags, []);
  assert.deepEqual(next[1].tags, [{ id: 2, name: "Wholesale" }]);
});

test("rename and delete leave the list alone when the name is blank or the id is unknown", () => {
  const tags = [{ id: 2, name: "Wholesale" }];
  assert.deepEqual(renameTagInList(null, 1, "Retail"), []);
  assert.deepEqual(removeTagById(undefined, 1), []);
  assert.deepEqual(renameTagOnItems(null, 1, "Retail"), []);
  assert.deepEqual(removeTagFromItems(null, 1), []);
  assert.deepEqual(renameTagInList(tags, 9, "Nope"), tags);
  assert.deepEqual(renameTagInList(tags, 2, "   "), tags);
  assert.deepEqual(removeTagById(tags, 9), tags);
  assert.deepEqual(removeTagFromItems([{ id: 3 }], 2), [{ id: 3 }]);
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
