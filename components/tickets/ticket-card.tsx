import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatEventDate } from "@/lib/format";
import { ticketQrDataUrl } from "@/lib/tickets/qr";

export type TicketView = {
  id: string;
  status: "valid" | "cancelled";
  checked_in_at: string | null;
  event: { title: string; starts_at: string; venue: string; city: string; is_online: boolean; online_url: string | null; status: string } | null;
  ticket_type: { name: string } | null;
};

export async function TicketCard({ ticket, large = false }: { ticket: TicketView; large?: boolean }) {
  const qr = await ticketQrDataUrl(ticket.id);
  const status = ticket.status === "cancelled" || ticket.event?.status === "cancelled" ? "cancelled" : ticket.checked_in_at ? "checked_in" : "valid";

  return (
    <article className="flex flex-col gap-5 rounded-2xl border border-white/10 bg-navy-900/70 p-5 sm:flex-row sm:items-center">
      {/* eslint-disable-next-line @next/next/no-img-element -- generated data URL */}
      <img
        src={qr}
        alt={`QR code for ticket ${ticket.id.slice(0, 8)}`}
        width={large ? 240 : 140}
        height={large ? 240 : 140}
        className={`rounded-xl bg-white p-2 ${status === "cancelled" ? "opacity-30" : ""}`}
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={status} />
          <span className="text-xs text-slate-500">{ticket.ticket_type?.name}</span>
        </div>
        <h3 className="mt-2 text-lg font-semibold text-white">{ticket.event?.title}</h3>
        <p className="text-sm text-slate-400">{ticket.event ? formatEventDate(ticket.event.starts_at) : null}</p>
        <p className="text-sm text-slate-400">
          {ticket.event?.is_online ? (
            ticket.event.online_url && status !== "cancelled" ? (
              <a href={ticket.event.online_url} className="text-violet-300 hover:text-violet-200" rel="noopener noreferrer" target="_blank">
                Join online event
              </a>
            ) : (
              "Online event"
            )
          ) : (
            `${ticket.event?.venue}, ${ticket.event?.city}`
          )}
        </p>
        <p className="mt-2 break-all font-mono text-xs text-slate-500">Ticket ID: {ticket.id}</p>
        {ticket.checked_in_at ? <p className="text-xs text-violet-300">Checked in {formatEventDate(ticket.checked_in_at)}</p> : null}
        {!large ? (
          <Link href={`/tickets/${ticket.id}`} className="mt-3 inline-flex text-sm text-violet-300 hover:text-violet-200">
            Open ticket
          </Link>
        ) : null}
      </div>
    </article>
  );
}
