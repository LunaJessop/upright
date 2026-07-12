export const UNIT_OF_MEASURE_GROUPS = [
  {
    label: "Count",
    options: [{ value: "ea", label: "Each (ea)" }],
  },
  {
    label: "Weight — Imperial",
    options: [
      { value: "oz", label: "Ounce (oz)" },
      { value: "lb", label: "Pound (lb)" },
      { value: "short_ton", label: "Short ton (US ton)" },
    ],
  },
  {
    label: "Weight — Metric",
    options: [
      { value: "mg", label: "Milligram (mg)" },
      { value: "g", label: "Gram (g)" },
      { value: "kg", label: "Kilogram (kg)" },
      { value: "t", label: "Metric ton (t)" },
    ],
  },
  {
    label: "Length",
    options: [
      { value: "yd", label: "Yard (yd)" },
      { value: "ft", label: "Foot (ft)" },
      { value: "m", label: "Meter (m)" },
      { value: "cm", label: "Centimeter (cm)" },
      { value: "mm", label: "Millimeter (mm)" },
    ],
  },
  {
    label: "Area",
    options: [
      { value: "sq_yd", label: "Square yard (sq yd)" },
      { value: "sq_ft", label: "Square foot (sq ft)" },
      { value: "sq_m", label: "Square meter (sq m)" },
      { value: "sq_cm", label: "Square centimeter (sq cm)" },
      { value: "sq_mm", label: "Square millimeter (sq mm)" },
    ],
  },
  {
    label: "Volume — Imperial",
    options: [
      { value: "fl_oz", label: "Fluid ounce (fl oz)" },
      { value: "cup", label: "Cup" },
      { value: "pt", label: "Pint (pt)" },
      { value: "qt", label: "Quart (qt)" },
      { value: "gal", label: "Gallon (gal)" },
    ],
  },
  {
    label: "Volume — Metric",
    options: [
      { value: "mL", label: "Milliliter (mL)" },
      { value: "cL", label: "Centiliter (cL)" },
      { value: "dL", label: "Deciliter (dL)" },
      { value: "L", label: "Liter (L)" },
    ],
  },
];

export const UNIT_OF_MEASURE_OPTIONS = UNIT_OF_MEASURE_GROUPS.flatMap(
  (group) => group.options
);
