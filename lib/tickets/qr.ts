import QRCode from "qrcode";

/**
 * QR image for a ticket. The QR only contains the opaque ticket id (a random
 * UUID) — no personal data. Scanning it grants nothing by itself: check-in
 * requires a signed-in organizer of that event and is validated on the server.
 */
export function ticketQrDataUrl(ticketId: string): Promise<string> {
  return QRCode.toDataURL(ticketId, { margin: 1, width: 240, color: { dark: "#0d1330", light: "#ffffff" } });
}
