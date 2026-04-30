"use client";

import React, { useEffect, useState } from "react";
import { Building2, Check, FileStack, Upload } from "lucide-react";
import { UserShell } from "@/components/user-shell";
import { fetchApi } from "@/lib/api";
import { uploadFileToUrl } from "@/lib/upload";

type PhaseState = "current" | "upcoming" | "done";
const phases: { n: number; label: string; state: PhaseState }[] = [
  { n: 1, label: "Business profile", state: "current" },
  { n: 2, label: "Documents", state: "upcoming" },
  { n: 3, label: "Signatory", state: "upcoming" },
];

export default function KybPage() {
  const [tradeName, setTradeName] = useState("");
  const [tin, setTin] = useState("");
  const [industry, setIndustry] = useState("");
  const [regFile, setRegFile] = useState<File | null>(null);
  const [signFile, setSignFile] = useState<File | null>(null);
  const [regProgress, setRegProgress] = useState(0);
  const [signProgress, setSignProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      // Nothing to cleanup yet
    };
  }, []);

  const validateFile = (file: File) => {
    const max = 12 * 1024 * 1024; // 12MB
    if (file.size > max) return "File must be under 12MB";
    return null;
  };

  const handleRegFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage("");
    setError("");
    const f = e.target.files?.[0];
    if (!f) return;
    const err = validateFile(f);
    if (err) return setError(err);
    setRegFile(f);
  };

  const handleSignFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage("");
    setError("");
    const f = e.target.files?.[0];
    if (!f) return;
    const err = validateFile(f);
    if (err) return setError(err);
    setSignFile(f);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError("");
    setMessage("");
    if (!tradeName.trim()) return setError("Registered trade name is required");
    if (!regFile) return setError("Please upload the business registration document");
    if (!signFile) return setError("Please upload the authorized signatory ID");

    setSubmitting(true);
    try {
      const presignReg = await fetchApi("/uploads/presign", {
        method: "POST",
        body: JSON.stringify({ filename: regFile.name, content_type: regFile.type, purpose: "kyb_registration" }),
      });
      const uploadUrlReg = presignReg.upload_url ?? presignReg.uploadUrl ?? presignReg.url;
      const fileUrlReg = presignReg.file_url ?? presignReg.fileUrl ?? presignReg.url;

      await uploadFileToUrl(regFile, uploadUrlReg, (p) => setRegProgress(p));

      const presignSign = await fetchApi("/uploads/presign", {
        method: "POST",
        body: JSON.stringify({ filename: signFile.name, content_type: signFile.type, purpose: "kyb_signatory" }),
      });
      const uploadUrlSign = presignSign.upload_url ?? presignSign.uploadUrl ?? presignSign.url;
      const fileUrlSign = presignSign.file_url ?? presignSign.fileUrl ?? presignSign.url;

      await uploadFileToUrl(signFile, uploadUrlSign, (p) => setSignProgress(p));

      await fetchApi("/kyb/submit", {
        method: "POST",
        body: JSON.stringify({ trade_name: tradeName, tin, industry, registration_url: fileUrlReg, signatory_url: fileUrlSign }),
      });

      setMessage("Business profile submitted for review");
      setRegProgress(0);
      setSignProgress(0);
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? "Failed to submit business profile");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <UserShell>
      <header className="mb-8">
        <div className="flex items-start gap-3">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-[#d0e4ff] text-[#002f6c]">
            <Building2 className="size-6" strokeWidth={1.75} aria-hidden />
          </span>
          <div>
            <p className="text-xs font-normal uppercase tracking-[1.2px] text-[#434750]">Business · Figma 2:3509</p>
            <h1 className="font-heading text-3xl font-normal tracking-[-0.5px] text-[#001b44]">KYB verification</h1>
            <p className="mt-1 text-base text-[#434750]">Register your company for higher limits and team seats.</p>
          </div>
        </div>
      </header>

      <div className="mb-8 flex flex-wrap gap-3">
        {phases.map((p) => (
          <div
            key={p.n}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${
              p.state === "current"
                ? "bg-[#001b44] text-white"
                : p.state === "done"
                  ? "border border-[#69ff87]/50 bg-[#f2fff6] text-[#00732c]"
                  : "border border-[#e2e8f0] bg-white text-[#64748b]"
            }`}
          >
            {p.state === "done" ? (
              <Check className="size-4" strokeWidth={2.5} aria-hidden />
            ) : (
              <span className={`flex size-5 items-center justify-center rounded-full text-[11px] ${p.state === "current" ? "bg-white/20" : "bg-[#f2f3ff]"}`}>
                {p.n}
              </span>
            )}
            {p.label}
          </div>
        ))}
      </div>

      <section className="rounded-3xl border border-[#e8eaf2] bg-white p-6 sm:p-8">
        <h2 className="flex items-center gap-2 font-heading text-lg font-normal text-[#001b44]">
          <FileStack className="size-5 text-[#002f6c]" strokeWidth={1.75} aria-hidden />
          Company details
        </h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-xs font-normal uppercase tracking-[1.2px] text-[#434750]">Registered trade name</span>
            <input
              type="text"
              value={tradeName}
              onChange={(e) => setTradeName(e.target.value)}
              className="mt-2 w-full rounded-lg border border-transparent bg-[#dae2fd] px-4 py-3 text-sm text-[#001b44] outline-none focus:ring-2 focus:ring-[#002f6c]"
              placeholder="Blue Nile Logistics PLC"
            />
          </label>
          <label className="block">
            <span className="text-xs font-normal uppercase tracking-[1.2px] text-[#434750]">TIN</span>
            <input
              type="text"
              value={tin}
              onChange={(e) => setTin(e.target.value)}
              className="mt-2 w-full rounded-lg border border-transparent bg-[#dae2fd] px-4 py-3 text-sm text-[#001b44] outline-none focus:ring-2 focus:ring-[#002f6c]"
              placeholder="000012345678"
            />
          </label>
          <label className="block">
            <span className="text-xs font-normal uppercase tracking-[1.2px] text-[#434750]">Industry</span>
            <input
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="mt-2 w-full rounded-lg border border-transparent bg-[#dae2fd] px-4 py-3 text-sm text-[#001b44] outline-none focus:ring-2 focus:ring-[#002f6c]"
              placeholder="Logistics"
            />
          </label>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-normal uppercase tracking-[1.2px] text-[#434750]">Business registration</p>
            <label className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#dae2fd] bg-[#faf8ff] px-4 py-10">
              <Upload className="size-7 text-[#002f6c]" strokeWidth={1.5} aria-hidden />
              <span className="mt-2 text-sm font-semibold text-[#002f6c]">Upload certificate</span>
              <input type="file" className="sr-only" onChange={handleRegFileChange} />
            </label>

            {regFile && (
              <div className="mt-3 text-sm">
                <div className="font-medium text-[#001b44]">{regFile.name}</div>
                <div className="mt-2 h-2 w-full rounded-full bg-[#f1f5f9]"><div className="h-full rounded-full bg-[#002f6c]" style={{ width: `${regProgress}%` }} /></div>
              </div>
            )}
          </div>
          <div>
            <p className="text-xs font-normal uppercase tracking-[1.2px] text-[#434750]">Authorized signatory ID</p>
            <label className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#dae2fd] bg-[#faf8ff] px-4 py-10">
              <Upload className="size-7 text-[#002f6c]" strokeWidth={1.5} aria-hidden />
              <span className="mt-2 text-sm font-semibold text-[#002f6c]">Upload ID scan</span>
              <input type="file" className="sr-only" onChange={handleSignFileChange} />
            </label>

            {signFile && (
              <div className="mt-3 text-sm">
                <div className="font-medium text-[#001b44]">{signFile.name}</div>
                <div className="mt-2 h-2 w-full rounded-full bg-[#f1f5f9]"><div className="h-full rounded-full bg-[#002f6c]" style={{ width: `${signProgress}%` }} /></div>
              </div>
            )}
          </div>
        </div>

        <button onClick={handleSubmit} disabled={submitting} className="mt-8 rounded-xl bg-[#002f6c] px-8 py-3.5 text-sm font-semibold text-white">
          {submitting ? "Submitting..." : "Submit business profile"}
        </button>

        {message && <div className="mt-4 text-sm text-[#006e2a]">{message}</div>}
        {error && <div className="mt-4 text-sm text-[#ba1a1a]">{error}</div>}
      </section>
    </UserShell>
  );
}
