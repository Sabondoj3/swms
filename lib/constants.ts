export const WASTE_CATEGORIES = [
  { value: "PLASTIC", label: "Plastic" },
  { value: "PAPER", label: "Paper" },
  { value: "FOOD_ORGANIC", label: "Food / Organic" },
  { value: "METAL", label: "Metal" },
  { value: "GLASS", label: "Glass" },
  { value: "E_WASTE", label: "Electronic waste" },
  { value: "MIXED", label: "Mixed waste" },
  { value: "HAZARDOUS", label: "Hazardous waste" },
  { value: "OTHER", label: "Other" },
] as const;

export const PROBLEM_TYPES = [
  { value: "BIN_OVERFLOWING", label: "Bin overflowing" },
  { value: "ILLEGAL_DUMPING", label: "Illegal dumping" },
  { value: "BIN_DAMAGED", label: "Bin damaged" },
  { value: "MISSED_COLLECTION", label: "Missed collection" },
  { value: "NO_BIN", label: "No waste bin available" },
  { value: "SCATTERED", label: "Waste scattered around" },
  { value: "OTHER", label: "Other" },
] as const;

export const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export const STATUSES = ["SUBMITTED","UNDER_REVIEW","VERIFIED","ASSIGNED","ACCEPTED","ON_THE_WAY","COLLECTED","COMPLETED","REJECTED","CANCELLED"] as const;

export const ROLE_HOME: Record<string, string> = {
  PUBLIC: "/dashboard",
  COLLECTOR: "/collector",
  ADMIN: "/admin",
  SUPER_ADMIN: "/admin",
};
