"use client";

import React, { useEffect, useRef, useState } from "react";
import { Wallet, CreditCard } from "lucide-react";
import { createPayment, verifyPayment } from "@/lib/payment";

type LinkData = { sellerName: string; description: string; amount: string; status?: string };

export default function PayWidget({ linkId, data }: { linkId: string; data: LinkData }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);
  const pollRef = useRef<number | null>(null);
  const checkoutWindowRef = useRef<Window | null>(null);

  useEffect(() => {
    // If the gateway redirects back with a reference param, verify immediately
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get("reference") || params.get("payment_reference") || params.get("chapa_reference");
      if (ref) {
        setReference(ref);
        verifyAndHandle(ref);
      }
    } catch (e) {
      // ignore server-side or invalid URL
    }

    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, []);

  const parseAmountToCents = (amtStr: string) => {
    const cleaned = amtStr.replace(/[^\d.]/g, "");
    const v = parseFloat(cleaned || "0");
    return Math.round(v * 100);
  };

  const verifyAndHandle = async (ref: string) => {
    setStatus("verifying");
    setError(null);
    try {
      const res: any = await verifyPayment(ref);
      if (res?.status === "success" || res?.paid === true) {
        setStatus("success");
        if (pollRef.current) {
          window.clearInterval(pollRef.current);
          pollRef.current = null;
        }
      } else {
        setStatus(res?.status ?? "pending");
        if (res?.status === "failed") setError(res?.message ?? "Payment failed");
      }
    } catch (err: any) {
      setStatus("error");
      setError(err?.message ?? "Verification failed");
    }
  };

  const startPolling = (ref: string) => {
    if (pollRef.current) window.clearInterval(pollRef.current);
    pollRef.current = window.setInterval(async () => {
      try {
        const res: any = await verifyPayment(ref);
        if (res?.status === "success" || res?.paid === true) {
          setStatus("success");
          if (pollRef.current) {
            window.clearInterval(pollRef.current);
            pollRef.current = null;
          }
          if (checkoutWindowRef.current && !checkoutWindowRef.current.closed) {
            checkoutWindowRef.current.close();
          }
        }
      } catch (e) {
        // ignore transient network errors while polling
      }
    }, 3000);
  };

  const handlePay = async () => {
    setLoading(true);
    setError(null);
    setStatus("creating");
    try {
      const amount_cents = parseAmountToCents(data.amount);
      const return_url = window.location.href;
      const res: any = await createPayment({ link_id: linkId, amount_cents, return_url });
      const checkoutUrl = res.checkout_url ?? res.checkoutUrl ?? res.url;
      const ref = res.reference ?? res.payment_reference ?? res.id ?? res.reference_id;
      if (!checkoutUrl || !ref) throw new Error("Invalid payment response from server");

      setReference(ref);
      setStatus("redirecting");
      // Open gateway in new tab/window to preserve current page
      checkoutWindowRef.current = window.open(checkoutUrl, "_blank", "noopener,noreferrer");
      startPolling(ref);
      setStatus("pending");
    } catch (err: any) {
      setError(err?.message ?? "Failed to start payment");
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 bg-blue-50/50 border border-blue-100 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-3">
          <Wallet className="size-5 text-emerald-600" strokeWidth={2} />
          <div>
            <div className="font-semibold text-[#001b44]">Telebirr Wallet</div>
            <div className="text-xs text-slate-600">Secure checkout powered by Chapa (redirect)</div>
          </div>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <label className="flex items-center justify-between p-4 border-2 border-emerald-500 bg-emerald-50/30 rounded-xl cursor-pointer">
          <div className="flex items-center gap-3">
            <Wallet className="size-5 text-emerald-600" strokeWidth={2} />
            <span className="font-semibold text-[#001b44]">Pay with Telebirr</span>
          </div>
          <div className="w-5 h-5 rounded-full border-4 border-emerald-500 bg-white"></div>
        </label>

        <label className="flex items-center justify-between p-4 border border-slate-200 rounded-xl opacity-60">
          <div className="flex items-center gap-3">
            <CreditCard className="size-5 text-slate-500" strokeWidth={2} />
            <span className="font-medium text-slate-600">Bank Transfer <span className="text-xs font-normal ml-1">(Coming soon)</span></span>
          </div>
          <div className="w-5 h-5 rounded-full border-2 border-slate-300"></div>
        </label>
      </div>

      <div>
        <button onClick={handlePay} disabled={loading || status === "pending" || status === "verifying"} className="w-full bg-[#69ff87] hover:bg-[#52e87c] text-[#002108] font-bold py-4 rounded-xl shadow-md shadow-emerald-500/20 transition-all active:scale-[0.98] text-lg">
          {loading ? "Starting payment..." : status === "pending" ? "Waiting for payment..." : "Fund Escrow Now"}
        </button>
      </div>

      {reference && <div className="mt-4 text-sm text-slate-600">Reference: {reference}</div>}
      {status === "success" && <div className="mt-4 text-sm text-emerald-700">Payment complete — funds secured in escrow.</div>}
      {error && <div className="mt-4 text-sm text-[#ba1a1a]">{error}</div>}
    </div>
  );
}
