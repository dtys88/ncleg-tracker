export const SESSION_YEAR = "2025";
export const NCLEG_BASE = "https://www.ncleg.gov";
export const API_BASE = "https://webservices.ncleg.gov";

// Comprehensive healthcare keyword list for flagging relevant bills
export const HEALTH_KEYWORDS = [
  "health", "hospital", "medicaid", "medicare", "physician", "nurse",
  "pharmacy", "pharmaceutical", "drug", "mental health", "behavioral",
  "insurance", "provider", "patient", "medical", "clinical", "care",
  "telehealth", "telemedicine", "opioid", "substance abuse", "vaccine",
  "immunization", "public health", "epidemic", "pandemic", "disease",
  "dental", "optometry", "therapy", "rehabilitation", "emergency",
  "ambulance", "ems", "certificate of need", "con ", "medicaid expansion",
  "340b", "reimbursement", "dhhs", "hhs", "nursing", "assisted living",
  "long-term care", "home health", "hospice", "wellness", "maternal",
  "infant", "prenatal", "behavioral health", "psychiatric", "disability",
  "biotech", "biologics", "generic drug", "prescription", "copay",
  "deductible", "premium", "coverage", "uninsured", "underinsured",
  "workforce shortage", "scope of practice", "licensure", "trauma",
  "cancer", "chronic", "obesity", "diabetes", "cardiovascular",
  "fentanyl", "naloxone", "narcan", "overdose", "addiction",
  "eating disorder", "anorexia", "bulimia", "suicide prevention",
  "child welfare", "foster care", "abuse", "neglect",
  "organ donation", "transplant", "blood bank",
  "health equity", "disparity", "social determinants",
  "community health", "rural health", "critical access",
  "ambulatory", "outpatient", "inpatient", "surgical center",
  "value-based", "fee-for-service", "managed care",
  "prior authorization", "utilization review", "network adequacy",
];

export function isHealthBill(title, description = "") {
  const text = `${title} ${description}`.toLowerCase();
  return HEALTH_KEYWORDS.some((kw) => text.includes(kw));
}

export function formatDate(dateStr) {
  const date = new Date(dateStr);
  if (isNaN(date)) return "";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function daysAgo(dateStr) {
  const date = new Date(dateStr);
  if (isNaN(date)) return "";
  const diff = Math.floor((new Date() - date) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 0) return "Upcoming";
  return `${diff}d ago`;
}
