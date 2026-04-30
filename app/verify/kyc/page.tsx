"use client";

import React, { useEffect, useState } from "react";
import { Camera, Check, IdCard, Upload } from "lucide-react";
import { UserShell } from "@/components/user-shell";
import { fetchApi } from "@/lib/api";
import { uploadFileToUrl } from "@/lib/upload";

const phases = [
  { n: 1, label: "Identity", state: "current" as const },
  { n: 2, label: "Liveness", state: "upcoming" as const },
  { n: 3, label: "Review", state: "upcoming" as const },
];

export default function KycPage() {
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docPreview, setDocPreview] = useState<string | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [docProgress, setDocProgress] = useState(0);
  const [selfieProgress, setSelfieProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (docPreview) URL.revokeObjectURL(docPreview);
      if (selfiePreview) URL.revokeObjectURL(selfiePreview);
    };
  }, [docPreview, selfiePreview]);

  const validateFile = (file: File) => {
    const max = 10 * 1024 * 1024; // 10MB
    if (file.size > max) return "File must be under 10MB";
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") return "Only images or PDFs are allowed";
    return null;
  };

  const handleDocChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage("");
    setError("");
    const f = e.target.files?.[0];
    if (!f) return;
    const err = validateFile(f);
    if (err) {
      setError(err);
      return;
    }
    setDocFile(f);
    setDocPreview(f.type === "application/pdf" ? null : URL.createObjectURL(f));
  };

  const handleSelfieChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage("");
    setError("");
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setError("Selfie must be an image");
      return;
    }
    setSelfieFile(f);
    setSelfiePreview(URL.createObjectURL(f));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError("");
    setMessage("");
    if (!docFile) return setError("Please upload your ID document");
    if (!selfieFile) return setError("Please capture a selfie for liveness");

    setSubmitting(true);
    try {
      // presign document
      const presignDoc = await fetchApi("/uploads/presign", {
        method: "POST",
        body: JSON.stringify({ filename: docFile.name, content_type: docFile.type, purpose: "kyc_document" }),
      });
      const uploadUrlDoc = presignDoc.upload_url ?? presignDoc.uploadUrl ?? presignDoc.url;
      const fileUrlDoc = presignDoc.file_url ?? presignDoc.fileUrl ?? presignDoc.url;

      await uploadFileToUrl(docFile, uploadUrlDoc, (p) => setDocProgress(p));

      // presign selfie
      const presignSelfie = await fetchApi("/uploads/presign", {
        method: "POST",
        body: JSON.stringify({ filename: selfieFile.name, content_type: selfieFile.type, purpose: "kyc_selfie" }),
      });
      const uploadUrlSelfie = presignSelfie.upload_url ?? presignSelfie.uploadUrl ?? presignSelfie.url;
      const fileUrlSelfie = presignSelfie.file_url ?? presignSelfie.fileUrl ?? presignSelfie.url;

      await uploadFileToUrl(selfieFile, uploadUrlSelfie, (p) => setSelfieProgress(p));

      // submit KYC
      await fetchApi("/kyc/submit", {
        method: "POST",
        body: JSON.stringify({ document_url: fileUrlDoc, selfie_url: fileUrlSelfie }),
      });

      setMessage("Submitted for review — typical turnaround under 24 hours.");
      setDocProgress(0);
      setSelfieProgress(0);
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? "Failed to submit KYC. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <UserShell>
      <header className="mb-8">
        <div className="flex items-start gap-3">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-[#d8e2ff] text-[#002f6c]">
            <IdCard className="size-6" strokeWidth={1.75} aria-hidden />
          </span>
          <div>
            <p className="text-xs font-normal uppercase tracking-[1.2px] text-[#434750]">Identity · Figma 2:3745</p>
            <h1 className="font-heading text-3xl font-normal tracking-[-0.5px] text-[#001b44]">KYC verification</h1>
            <p className="mt-1 text-base text-[#434750]">Upload Fayda ID and complete a short liveness check.</p>
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

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-[#e8eaf2] bg-white p-6 sm:p-8">
          <h2 className="flex items-center gap-2 font-heading text-lg font-normal text-[#001b44]">
            <IdCard className="size-5 text-[#002f6c]" strokeWidth={1.75} aria-hidden />
            National ID (Fayda)
          </h2>
          <p className="mt-2 text-sm text-[#434750]">PDF or clear photo, all four corners visible, under 10MB.</p>
          <label className="mt-6 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#dae2fd] bg-[#faf8ff] px-6 py-14 transition-colors hover:border-[#002f6c]/40">
            <Upload className="size-8 text-[#002f6c]" strokeWidth={1.5} aria-hidden />
            <span className="mt-3 text-sm font-semibold text-[#002f6c]">Tap to upload</span>
            <span className="mt-1 text-xs text-[#64748b]">or drag a file here</span>
            <input type="file" accept="image/*,.pdf" className="sr-only" onChange={handleDocChange} />
          </label>

          {docFile && (
            <div className="mt-4">
              <div className="flex items-center gap-3">
                {docPreview ? (
                  <img src={docPreview} alt="preview" className="h-20 w-20 rounded-md object-cover" />
                ) : (
                  <div className="h-20 w-20 rounded-md bg-slate-100 flex items-center justify-center text-sm text-slate-500">PDF</div>
                )}
                <div className="flex-1">
                  <div className="text-sm font-medium text-[#001b44]">{docFile.name}</div>
                  <div className="mt-2 h-2 w-full rounded-full bg-[#f1f5f9]">
                    <div className="h-full rounded-full bg-[#002f6c]" style={{ width: `${docProgress}%` }} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-[#e8eaf2] bg-white p-6 sm:p-8">
          <h2 className="flex items-center gap-2 font-heading text-lg font-normal text-[#001b44]">
            <Camera className="size-5 text-[#002f6c]" strokeWidth={1.75} aria-hidden />
            Selfie / liveness
          </h2>
          <p className="mt-2 text-sm text-[#434750]">We&apos;ll ask you to turn your head slowly — takes under a minute.</p>
          <label className="mt-6 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#dae2fd] bg-[#faf8ff] px-6 py-14 transition-colors hover:border-[#002f6c]/40">
            <Camera className="size-8 text-[#002f6c]" strokeWidth={1.5} aria-hidden />
            <span className="mt-3 text-sm font-semibold text-[#002f6c]">Start capture</span>
            <span className="mt-1 text-xs text-[#64748b]">Camera permission required</span>
            <input type="file" accept="image/*" capture="user" className="sr-only" onChange={handleSelfieChange} />
          </label>

          {selfieFile && (
            <div className="mt-4">
              <div className="flex items-center gap-3">
                <img src={selfiePreview ?? ""} alt="selfie" className="h-20 w-20 rounded-md object-cover" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-[#001b44]">{selfieFile.name}</div>
                  <div className="mt-2 h-2 w-full rounded-full bg-[#f1f5f9]">
                    <div className="h-full rounded-full bg-[#002f6c]" style={{ width: `${selfieProgress}%` }} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      <div className="mt-8 flex flex-wrap gap-3 items-center">
        <button onClick={handleSubmit} disabled={submitting} className="rounded-xl bg-[#002f6c] px-8 py-3.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(0,47,108,0.2)]">
          {submitting ? "Submitting..." : "Submit for review"}
        </button>
        <p className="flex items-center text-sm text-[#434750]">Typical review time: under 24 hours.</p>
      </div>

      {message && <div className="mt-4 text-sm text-[#006e2a]">{message}</div>}
      {error && <div className="mt-4 text-sm text-[#ba1a1a]">{error}</div>}
    </UserShell>
  );
}
