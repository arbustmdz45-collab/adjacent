// Data minimisation for free text: remove contact details people type into descriptions or notes.
// It can't catch names; the forms ask people not to include them.
const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const URL = /\b(?:https?:\/\/|www\.)\S+/gi;
const PHONE = /(?:\+?\d[\d\s().-]{7,}\d)/g;
const HANDLE = /(^|\s)@[A-Za-z0-9_.]{2,}/g;
const IBAN = /\b[A-Z]{2}\d{2}(?:\s?[A-Z0-9]{4}){3,7}\b/g;
const ID = /\b\d{8}[A-HJ-NP-TV-Z]\b|\b[XYZ]\d{7}[A-HJ-NP-TV-Z]\b/gi; // Spanish DNI / NIE

export function redact(text: string) {
  return String(text ?? "")
    .replace(EMAIL, "[email removed]")
    .replace(URL, "[link removed]")
    .replace(IBAN, "[account removed]")
    .replace(ID, "[ID removed]")
    .replace(PHONE, (m) => (m.replace(/\D/g, "").length >= 9 ? "[phone removed]" : m))
    .replace(HANDLE, "$1[handle removed]");
}
