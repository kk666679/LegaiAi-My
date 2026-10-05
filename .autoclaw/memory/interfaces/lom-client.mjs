// ESM shim that re-exports the CJS module's named properties.
import cjs from "./lom-client.js";
export const LOMClient = cjs.LOMClient;
export const normalizeActNumber = cjs.normalizeActNumber;
export const buildLegislationPdfUrl = cjs.buildLegislationPdfUrl;
export const inferDocumentType = cjs.inferDocumentType;
export default cjs;
