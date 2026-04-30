"use client";

import React, { useRef, useState, useEffect } from "react";

type BBox = { x: number; y: number; w: number; h: number };
type ReasoningCard = { id?: string; title?: string; detail?: string; bbox?: BBox };

export default function HeatmapViewer({
  originalUrl,
  heatmapUrl,
  reasoningCards = [],
  initialAlpha = 0.6,
}: {
  originalUrl?: string | null;
  heatmapUrl?: string | null;
  reasoningCards?: ReasoningCard[] | null;
  initialAlpha?: number;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const heatRef = useRef<HTMLImageElement | null>(null);

  const [alpha, setAlpha] = useState<number>(initialAlpha);
  const [scale, setScale] = useState<number>(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null);
  const [heatVisible, setHeatVisible] = useState(true);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);

  useEffect(() => {
    setAlpha(initialAlpha);
  }, [initialAlpha]);

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    setScale((s) => Math.min(5, Math.max(0.5, s * factor)));
  };

  const onMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    setLastPos({ x: e.clientX, y: e.clientY });
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging || !lastPos) return;
    const dx = e.clientX - lastPos.x;
    const dy = e.clientY - lastPos.y;
    setLastPos({ x: e.clientX, y: e.clientY });
    setTranslate((t) => ({ x: t.x + dx, y: t.y + dy }));
  };
  const onMouseUp = () => {
    setDragging(false);
    setLastPos(null);
  };

  const resetView = () => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  };

  const zoomIn = () => setScale((s) => Math.min(5, s * 1.2));
  const zoomOut = () => setScale((s) => Math.max(0.5, s / 1.2));

  const loadImage = (src?: string | null) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      if (!src) return reject(new Error("no-src"));
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
      img.src = src;
    });

  const handleDownload = async () => {
    try {
      const base = await loadImage(originalUrl ?? "");
      const canvas = document.createElement("canvas");
      canvas.width = base.naturalWidth;
      canvas.height = base.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("no-canvas");
      ctx.drawImage(base, 0, 0);
      if (heatmapUrl) {
        try {
          const heat = await loadImage(heatmapUrl);
          ctx.globalAlpha = alpha;
          ctx.drawImage(heat, 0, 0, canvas.width, canvas.height);
        } catch (err) {
          // ignore heatmap draw errors
        }
      }
      const data = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = data;
      a.download = "evidence.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      if (originalUrl) window.open(originalUrl, "_blank");
    }
  };

  const boxes = (reasoningCards ?? [])
    .map((c, i) => ({ c, i }))
    .filter(({ c }) => !!c?.bbox);

  return (
    <div className="rounded-md border p-3 bg-white">
      <div className="flex gap-4">
        <div
          ref={containerRef}
          onWheel={onWheel}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          className="relative w-full h-[480px] bg-slate-50 overflow-hidden rounded-md border"
        >
          <div
            className="absolute inset-0"
            style={{ cursor: dragging ? "grabbing" : "grab" }}
          >
            <div
              style={{
                transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
                transformOrigin: "center center",
                width: "100%",
                height: "100%",
              }}
            >
              <div className="relative w-full h-full">
                {originalUrl ? (
                  <img
                    ref={imgRef}
                    src={originalUrl}
                    alt="original"
                    className="w-full h-full object-contain select-none"
                    draggable={false}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    No original image
                  </div>
                )}

                {heatVisible && heatmapUrl ? (
                  <img
                    ref={heatRef}
                    src={heatmapUrl}
                    alt="heatmap"
                    className="pointer-events-none absolute inset-0 w-full h-full object-contain select-none"
                    style={{ opacity: alpha }}
                    draggable={false}
                  />
                ) : null}

                {boxes.map(({ c, i }) => {
                  const b = c.bbox as BBox;
                  if (!b) return null;
                  const isActive = selectedCard === i;
                  return (
                    <div
                      key={i}
                      className={`absolute border-2 ${isActive ? "border-yellow-400" : "border-red-400"} bg-red-400/10`}
                      style={{
                        left: `${b.x * 100}%`,
                        top: `${b.y * 100}%`,
                        width: `${b.w * 100}%`,
                        height: `${b.h * 100}%`,
                        pointerEvents: "none",
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="w-64 flex-shrink-0">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <button onClick={zoomOut} className="px-3 py-2 rounded-md border bg-white text-sm">−</button>
              <button onClick={resetView} className="px-3 py-2 rounded-md border bg-white text-sm">Reset</button>
              <button onClick={zoomIn} className="px-3 py-2 rounded-md border bg-white text-sm">+</button>
              <button onClick={() => setHeatVisible((v) => !v)} className="px-3 py-2 rounded-md border bg-white text-sm">
                {heatVisible ? "Hide Heatmap" : "Show Heatmap"}
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500">Heatmap Opacity</label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={alpha}
                onChange={(e) => setAlpha(parseFloat(e.target.value))}
                className="w-full mt-1"
              />
            </div>

            <div className="flex gap-2">
              <button onClick={handleDownload} className="flex-1 px-3 py-2 rounded-md bg-blue-600 text-white text-sm">Download</button>
              <a href={heatmapUrl ?? originalUrl ?? undefined} target="_blank" rel="noreferrer" className="px-3 py-2 rounded-md border bg-white text-sm">Open</a>
            </div>

            <div>
              <h5 className="text-xs font-bold text-slate-500 uppercase mb-2">Reasoning Cards</h5>
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-2">
                {(reasoningCards ?? []).length === 0 && <div className="text-sm text-slate-400">No reasoning cards.</div>}
                {(reasoningCards ?? []).map((c, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedCard(i === selectedCard ? null : i)}
                    className={`w-full text-left rounded-lg p-2 ${selectedCard === i ? "bg-yellow-50 border border-yellow-200" : "bg-white/40 hover:bg-white"}`}
                  >
                    <div className="text-sm font-semibold text-slate-700">{c.title ?? `Card ${i + 1}`}</div>
                    <div className="text-xs text-slate-400 mt-1 line-clamp-3">{c.detail}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
