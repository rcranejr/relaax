/**
 * Strips anything that looks like PII before a string leaves our account.
 * The structured planners never see PII by construction; this guards the free-text coach path.
 */
const EMAIL = /[\w.+-]+@[\w-]+\.[\w.]+/g;
const PHONE = /\b(\+?1[ -]?)?\(?\d{3}\)?[ -]?\d{3}[ -]?\d{4}\b/g;
const DOB = /\b(0?[1-9]|1[0-2])[\/-](0?[1-9]|[12]\d|3[01])[\/-](19|20)\d{2}\b/g;
const ADDRESS = /\b\d{1,5}\s+[A-Z][a-z]+\s+(St|Street|Ave|Avenue|Rd|Road|Dr|Drive|Ln|Lane|Blvd|Ct|Court)\b\.?/g;

export function scrubPii(text: string, knownNames: string[] = []): string {
  let out = text.replace(EMAIL, "[email]").replace(PHONE, "[phone]").replace(DOB, "[date]").replace(ADDRESS, "[address]");
  for (const n of knownNames) {
    if (n.length < 3) continue;
    out = out.replace(new RegExp(`\\b${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi"), "[name]");
  }
  return out;
}
