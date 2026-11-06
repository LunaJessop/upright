/**
 * Case-insensitive A-to-Z order for picker labels.
 * "face oil" and "Face Oil" sort together.
 */
export function compareText(left, right) {
  return String(left ?? "").localeCompare(String(right ?? ""), undefined, {
    sensitivity: "base",
  });
}

export function sortByText(items, getText) {
  return [...(Array.isArray(items) ? items : [])].sort((a, b) =>
    compareText(getText(a), getText(b))
  );
}
