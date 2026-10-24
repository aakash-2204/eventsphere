"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Camera, CircleAlert, CircleCheck } from "lucide-react";
import { SubmitButton } from "@/components/forms/submit-button";
import { formatEventDate } from "@/lib/format";
import { checkInAction, type CheckInState } from "@/lib/organizer/actions";

const messages: Record<string, string> = {
  checked_in: "Checked in — welcome!",
  already_checked_in: "Already checked in. This ticket cannot be used twice.",
  invalid: "Invalid ticket. No ticket exists with this code.",
  not_authorized: "You can only check in tickets for your own events.",
  ticket_cancelled: "This ticket was cancelled.",
  event_cancelled: "This event was cancelled.",
  event_ended: "This event has already ended.",
};

// Minimal typing for the browser's built-in BarcodeDetector (Chrome / Android).
type Detector = { detect: (source: HTMLVideoElement) => Promise<{ rawValue: string }[]> };
type DetectorConstructor = new (options: { formats: string[] }) => Detector;

function getDetector(): DetectorConstructor | undefined {
  return (window as unknown as { BarcodeDetector?: DetectorConstructor }).BarcodeDetector;
}

export function CheckInForm() {
  const [state, formAction] = useActionState<CheckInState, FormData>(checkInAction, { status: "idle" });
  const [code, setCode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const DetectorClass = getDetector();
    if (!scanning || !DetectorClass) return;
    let stream: MediaStream | undefined;
    let stopped = false;
    const detector = new DetectorClass({ formats: ["qr_code"] });

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then(async (media) => {
        stream = media;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = media;
        await video.play();
        while (!stopped) {
          const found = await detector.detect(video).catch(() => []);
          if (found[0]?.rawValue) {
            setCode(found[0].rawValue);
            setScanning(false);
            requestAnimationFrame(() => formRef.current?.requestSubmit());
            return;
          }
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      })
      .catch(() => {
        setScanError("Could not open the camera. Type the ticket ID instead.");
        setScanning(false);
      });

    return () => {
      stopped = true;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [scanning]);

  const result = state.result;
  const ok = result?.result === "checked_in";

  return (
    <div className="space-y-5">
      <form ref={formRef} action={formAction} className="space-y-3">
        <label className="block text-sm font-medium text-slate-200">
          Ticket ID (from the QR code)
          <input
            name="code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoComplete="off"
            placeholder="e.g. 3f2b8c1e-…"
            className="mt-1.5 w-full rounded-xl border border-white/10 bg-navy-950/80 px-4 py-3 font-mono text-sm text-white"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <SubmitButton pendingLabel="Checking…">Check in</SubmitButton>
          <button
            type="button"
            onClick={() => {
              if (!getDetector()) {
                setScanError("Camera scanning isn't supported in this browser. Type the ticket ID instead.");
                return;
              }
              setScanError("");
              setScanning((value) => !value);
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-slate-200 hover:bg-white/5"
          >
            <Camera aria-hidden="true" className="size-4" />
            {scanning ? "Stop camera" : "Scan QR with camera"}
          </button>
        </div>
      </form>

      {scanning ? <video ref={videoRef} muted playsInline className="w-full max-w-sm rounded-xl border border-white/10" /> : null}
      {scanError ? <p className="text-sm text-amber-200">{scanError}</p> : null}

      {state.status === "error" ? (
        <p role="alert" className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-100">{state.message}</p>
      ) : null}
      {result ? (
        <div role="status" className={`flex gap-3 rounded-2xl border p-5 ${ok ? "border-emerald-500/40 bg-emerald-500/10" : "border-rose-500/40 bg-rose-500/10"}`}>
          {ok ? <CircleCheck aria-hidden="true" className="size-6 shrink-0 text-emerald-300" /> : <CircleAlert aria-hidden="true" className="size-6 shrink-0 text-rose-300" />}
          <div className="text-sm">
            <p className="text-base font-semibold text-white">{messages[result.result]}</p>
            {result.event ? <p className="mt-1 text-slate-300">{result.event}</p> : null}
            {result.holder ? <p className="text-slate-300">Holder: {result.holder || "—"} · {result.ticket_type}</p> : null}
            {result.checked_in_at ? <p className="text-slate-400">Checked in at {formatEventDate(result.checked_in_at)}</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
