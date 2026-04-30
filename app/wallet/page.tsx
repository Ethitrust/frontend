"use client";

import { useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Eye,
  Landmark,
  Plus,
  ShieldAlert,
  Wallet,
  BadgeCheck,
  Leaf
} from "lucide-react";
import Link from "next/link";
import { UserShell } from "@/components/user-shell";

const ALL_TRANSACTIONS = [
  {
    id: "8934125",
    title: "Payment for Coffee Shipment",
    date: "May 24, 2024",
    type: "Escrow Pay",
    status: "COMPLETED",
    amount: "- 45,000.00 ETB",
    dir: "out",
    category: "In Escrow"
  },
  {
    id: "8933210",
    title: "Wallet Deposit via CBE",
    date: "May 23, 2024",
    type: "Deposit",
    status: "PENDING",
    amount: "+ 12,000.00 ETB",
    dir: "in",
    category: "Deposits"
  },
  {
    id: "8931105",
    title: "Land Sale Escrow Holding",
    date: "May 22, 2024",
    type: "In Escrow",
    status: "UNDER REVIEW",
    amount: "150,000.00 ETB",
    dir: "neutral",
    category: "In Escrow"
  },
  {
    id: "8931106",
    title: "Land Sale Escrow Holding",
    date: "May 22, 2024",
    type: "In Escrow",
    status: "UNDER REVIEW",
    amount: "150,000.00 ETB",
    dir: "neutral",
    category: "In Escrow"
  },
  {
    id: "8933211",
    title: "Wallet Deposit via CBE",
    date: "May 23, 2024",
    type: "Deposit",
    status: "PENDING",
    amount: "+ 12,000.00 ETB",
    dir: "in",
    category: "Deposits"
  },
  {
    id: "8931107",
    title: "Land Sale Escrow Holding",
    date: "May 22, 2024",
    type: "In Escrow",
    status: "UNDER REVIEW",
    amount: "150,000.00 ETB",
    dir: "neutral",
    category: "In Escrow"
  },
  {
    id: "8933212",
    title: "Wallet Deposit via CBE",
    date: "May 23, 2024",
    type: "Deposit",
    status: "PENDING",
    amount: "+ 12,000.00 ETB",
    dir: "in",
    category: "Deposits"
  },
];

export default function WalletPage() {
  const [activeFilter, setActiveFilter] = useState("All");

  const filteredTransactions = ALL_TRANSACTIONS.filter((tx) => {
    if (activeFilter === "All") return true;
    return tx.category === activeFilter;
  });

  const handleWithdraw = () => {
    alert("Withdraw functionality coming soon!");
  };
  
  const handleAddBank = () => {
    alert("Add Bank functionality coming soon!");
  };

  return (
    <UserShell>
      <div className="mb-8 grid gap-6 lg:grid-cols-[1.3fr_1fr] xl:grid-cols-[1.5fr_1fr]">
        {/* Left Block: Available Balance */}
        <div className="relative flex flex-col justify-between overflow-hidden rounded-[32px] bg-[#051c48] p-10 text-white shadow-xl">
          {/* Subtle background glow/shape could be here */}
          <div className="absolute -right-20 -top-20 size-64 rounded-full bg-white/5 blur-3xl"></div>
          
          <div className="relative z-10">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">
              Available Balance
            </p>
            <div className="mt-2 flex items-baseline gap-1 font-heading">
              <span className="text-[56px] leading-none font-bold tracking-tight">125,450</span>
              <span className="text-2xl font-medium text-white/80">.00 ETB</span>
            </div>
          </div>
          <div className="relative z-10 mt-12 flex gap-4">
            <Link href="/escrow/payment" className="flex flex-1 items-center justify-center gap-2 rounded-[20px] bg-[#69ff87] py-4 text-sm font-bold text-[#002108] transition-colors hover:bg-[#5ce67a]">
              <Landmark className="size-5" strokeWidth={2} />
              Deposit
            </Link>
            <button onClick={handleWithdraw} className="flex flex-1 items-center justify-center gap-2 rounded-[20px] bg-white/20 py-4 text-sm font-bold text-white transition-colors hover:bg-white/30 backdrop-blur-sm">
              <Wallet className="size-5" strokeWidth={2} />
              Withdraw
            </button>
          </div>
        </div>

        {/* Right Block: Linked Banks */}
        <div className="flex flex-col rounded-[32px] border border-[#f1f5f9] bg-white p-8 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-heading text-xl font-bold text-[#001b44]">Linked Banks</h2>
            <button onClick={handleAddBank} className="flex size-8 items-center justify-center rounded-full bg-[#f1f5f9] text-[#001b44] transition-colors hover:bg-[#e2e8f0]">
              <Plus className="size-5" strokeWidth={2.5} />
            </button>
          </div>
          <div className="flex flex-col gap-4">
            {/* Telebirr */}
            <div className="flex items-center justify-between rounded-[24px] border-[1.5px] border-[#69ff87] bg-white p-4 shadow-[0_4px_14px_rgba(105,255,135,0.1)]">
              <div className="flex items-center gap-4">
                <div className="flex size-14 items-center justify-center rounded-xl bg-white border border-[#e2e8f0] text-[#00732c]">
                  {/* Fake Chapa/Telebirr Logo */}
                  <div className="flex flex-col items-center">
                    <Leaf className="size-5 text-[#69ff87]" fill="#69ff87" strokeWidth={1} />
                    <span className="mt-0.5 text-[8px] font-bold text-[#69ff87] italic">Chapa</span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-[#001b44]">Telebirr</p>
                    <span className="rounded bg-[#69ff87] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#002108]">
                      Default
                    </span>
                  </div>
                  <p className="mt-0.5 text-[13px] text-[#64748b]">+251 •••• 99</p>
                </div>
              </div>
              <BadgeCheck className="size-6 text-[#001b44]" strokeWidth={1.5} />
            </div>

            {/* CBE */}
            <div className="flex items-center justify-between rounded-[24px] border-[1.5px] border-[#69ff87] bg-white p-4 shadow-[0_4px_14px_rgba(105,255,135,0.1)]">
              <div className="flex items-center gap-4">
                <div className="flex size-14 items-center justify-center rounded-xl bg-white border border-[#e2e8f0] text-[#00732c]">
                  {/* Fake Logo */}
                  <div className="flex flex-col items-center">
                    <Leaf className="size-5 text-[#69ff87]" fill="#69ff87" strokeWidth={1} />
                    <span className="mt-0.5 text-[8px] font-bold text-[#69ff87] italic">Chapa</span>
                  </div>
                </div>
                <div>
                  <p className="font-bold text-[#001b44]">CBE</p>
                  <p className="mt-0.5 text-[13px] text-[#64748b]">+251 •••• 99</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="rounded-[32px] border border-[#f1f5f9] bg-white p-8 shadow-sm">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-heading text-[22px] font-bold text-[#001b44]">Recent Transactions</h2>
            <p className="mt-1 text-sm text-[#64748b]">Your financial activity and escrow history</p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-[#f1f5f9] bg-[#f8fafc] p-1">
            {["All", "In Escrow", "Deposits", "Withdrawals"].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`rounded-full px-5 py-2 text-[13px] font-semibold transition-colors ${
                  activeFilter === filter
                    ? "bg-[#001b44] text-white shadow-sm"
                    : "text-[#64748b] hover:bg-[#f1f5f9]"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <div className="min-w-[800px]">
            <div className="grid grid-cols-[1.5fr_150px_150px_200px_40px] items-center gap-4 border-b border-[#f1f5f9] pb-4 text-[10px] font-bold uppercase tracking-[1px] text-[#94a3b8]">
              <div>Transaction Details</div>
              <div>Type</div>
              <div>Status</div>
              <div className="pr-4 text-right">Amount</div>
              <div></div>
            </div>

            <div className="flex flex-col">
              {filteredTransactions.map((tx) => (
                <div key={tx.id} className="grid grid-cols-[1.5fr_150px_150px_200px_40px] items-center gap-4 border-b border-[#f8fafc] py-5 last:border-0 hover:bg-[#f8fafc]/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`flex size-[42px] shrink-0 items-center justify-center rounded-full ${
                      tx.dir === "out" ? "bg-[#e8fce8] text-[#00732c]" : 
                      tx.dir === "in" ? "bg-[#e5edff] text-[#002f6c]" : 
                      "bg-[#fff4e5] text-[#e67e22]"
                    }`}>
                      {tx.dir === "out" && <ArrowUpRight className="size-5" strokeWidth={2} />}
                      {tx.dir === "in" && <ArrowDownLeft className="size-5" strokeWidth={2} />}
                      {tx.dir === "neutral" && <ShieldAlert className="size-5" strokeWidth={2} />}
                    </div>
                    <div>
                      <p className="font-bold text-[#001b44]">{tx.title}</p>
                      <p className="mt-0.5 text-[11px] text-[#94a3b8]">{tx.date} • ID: {tx.id}</p>
                    </div>
                  </div>
                  <div>
                    <span className="inline-flex rounded-full bg-[#f1f5f9] px-3 py-1 text-[11px] font-bold text-[#64748b]">
                      {tx.type}
                    </span>
                  </div>
                  <div>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide ${
                      tx.status === "COMPLETED" ? "bg-[#ccfce3] text-[#00732c]" :
                      tx.status === "PENDING" ? "bg-[#e2e8f0] text-[#64748b]" :
                      "bg-[#fff4e5] text-[#e67e22]"
                    }`}>
                      {tx.status === "COMPLETED" && <span className="size-1.5 rounded-full bg-[#00732c]"></span>}
                      {tx.status === "PENDING" && <span className="flex gap-0.5"><span className="size-1 rounded-full bg-[#64748b]"></span><span className="size-1 rounded-full bg-[#64748b]"></span></span>}
                      {tx.status === "UNDER REVIEW" && <span className="size-1.5 rounded-full border-[1.5px] border-[#e67e22] bg-transparent"></span>}
                      {tx.status}
                    </span>
                  </div>
                  <div className={`pr-4 text-right font-bold ${
                    tx.dir === "in" ? "text-[#00732c]" : "text-[#001b44]"
                  }`}>
                    {tx.amount}
                  </div>
                  <div className="flex justify-end">
                    <Link href={`/escrow/tx-1`} className="text-[#94a3b8] transition-colors hover:text-[#001b44]">
                      <Eye className="size-5" strokeWidth={2} />
                    </Link>
                  </div>
                </div>
              ))}
              
              {filteredTransactions.length === 0 && (
                <div className="py-10 text-center text-[#64748b]">
                  <p>No transactions found for {activeFilter}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-between pt-2">
              <p className="text-[13px] text-[#94a3b8]">Showing {filteredTransactions.length} of 124 transactions</p>
              <div className="flex gap-2">
                <button className="flex size-8 items-center justify-center rounded-lg border border-[#e2e8f0] bg-white text-[#94a3b8] transition-colors hover:bg-[#f8fafc]">
                  <ChevronLeft className="size-4" strokeWidth={2} />
                </button>
                <button className="flex size-8 items-center justify-center rounded-lg border border-[#e2e8f0] bg-white text-[#001b44] transition-colors hover:bg-[#f8fafc]">
                  <ChevronRight className="size-4" strokeWidth={2} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </UserShell>
  );
}

