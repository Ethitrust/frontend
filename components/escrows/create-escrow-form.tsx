"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm, type Resolver } from "react-hook-form";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  CalendarDays,
  Check,
  ChevronRight,
  Clock,
  LayoutList,
  PlusCircle,
  Repeat2,
  ShoppingCart,
  Trash2,
  Zap,
  ShieldAlert,
  type LucideProps,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  createEscrowFormSchema,
  type CreateEscrowFormInput,
  type CreateEscrowFormValues,
} from "@/lib/validators/create-escrow";
import { postInitializeEscrow } from "@/lib/escrows/me-escrows-api";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { useKycGuard } from "@/components/kyc/kyc-guard-provider";

// ─── helpers ────────────────────────────────────────────────────────────────

function toIsoOrThrow(local: string, label: string) {
  const t = Date.parse(local);
  if (Number.isNaN(t)) throw new Error(`${label} is not a valid date`);
  return new Date(t).toISOString();
}

function buildApiPayload(values: CreateEscrowFormValues) {
  const base = {
    invitee_email: values.invitee_email.trim(),
    escrow_type: values.escrow_type,
    initiator_role: values.initiator_role,
    title: values.title.trim(),
    description: values.description.trim(),
    currency: values.currency.trim().toUpperCase(),
    amount: values.amount,
    acceptance_criteria: values.acceptance_criteria.trim(),
    inspection_period: values.inspection_period,
    delivery_date: toIsoOrThrow(values.delivery_date, "Delivery target"),
    dispute_window: values.dispute_window,
    who_pays_fees: values.who_pays_fees,
  };
  if (values.escrow_type !== "milestone") return base;
  return {
    ...base,
    milestones: values.milestones.map((m) => ({
      title: m.title.trim(),
      description: m.description.trim(),
      amount: m.amount,
      due_date: toIsoOrThrow(
        m.due_date,
        `Milestone "${m.title.trim() || "Untitled"}" due date`,
      ),
      inspection_hrs: m.inspection_hrs,
    })),
  };
}

const defaultValues: CreateEscrowFormInput = {
  invitee_email: "",
  escrow_type: "onetime",
  initiator_role: "buyer",
  title: "",
  description: "",
  currency: "ETB",
  amount: undefined,
  acceptance_criteria: "",
  inspection_period: 48,
  delivery_date: "",
  dispute_window: 72,
  who_pays_fees: "buyer",
  milestones: [],
};

const defaultMilestone = (): NonNullable<
  CreateEscrowFormInput["milestones"]
>[number] => ({
  title: "",
  description: "",
  amount: undefined,
  due_date: "",
  inspection_hrs: 48,
});

// ─── step config ─────────────────────────────────────────────────────────────

type WizardStep = 1 | 2 | 3 | 4 | 5;

const STEP_LABELS: Record<WizardStep, string> = {
  1: "Parties",
  2: "Deal",
  3: "Rules",
  4: "Milestones",
  5: "Review",
};

const STEP_FIELDS: Record<WizardStep, (keyof CreateEscrowFormInput)[]> = {
  1: ["initiator_role", "escrow_type", "invitee_email"],
  2: ["title", "description", "currency", "amount"],
  3: [
    "acceptance_criteria",
    "delivery_date",
    "inspection_period",
    "dispute_window",
    "who_pays_fees",
  ],
  4: ["milestones"],
  5: [],
};

// ─── step indicator ──────────────────────────────────────────────────────────

function StepIndicator({
  current,
  isMilestone,
}: {
  current: WizardStep;
  isMilestone: boolean;
}) {
  const steps: WizardStep[] = isMilestone ? [1, 2, 3, 4, 5] : [1, 2, 3, 5];

  return (
    <div className="flex items-center gap-0 px-6 pb-5 pt-6">
      {steps.map((step, i) => {
        const done = current > step;
        const active = current === step;
        const label = STEP_LABELS[step];

        return (
          <div key={step} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex size-8 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all",
                  done && "border-primary bg-primary text-primary-foreground",
                  active && "border-primary bg-primary/10 text-primary",
                  !done &&
                  !active &&
                  "border-border bg-background text-muted-foreground",
                )}
              >
                {done ? <Check className="size-4" /> : <span>{step}</span>}
              </div>
              <span
                className={cn(
                  "hidden text-[11px] font-medium sm:block",
                  active
                    ? "text-primary"
                    : done
                      ? "text-muted-foreground"
                      : "text-muted-foreground/50",
                )}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "mb-4 h-0.5 flex-1 transition-colors",
                  current > step ? "bg-primary" : "bg-border",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── selectable option cards ─────────────────────────────────────────────────

function OptionCard({
  selected,
  onClick,
  icon: Icon,
  title,
  description,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.FC<LucideProps>;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition-all",
        selected
          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
          : "border-border hover:border-primary/40 hover:bg-muted/30",
      )}
    >
      <div
        className={cn(
          "flex size-9 items-center justify-center rounded-lg",
          selected
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground",
        )}
      >
        <Icon className="size-4" />
      </div>
      <div>
        <p
          className={cn(
            "text-sm font-semibold",
            selected ? "text-primary" : "text-foreground",
          )}
        >
          {title}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
    </button>
  );
}

// ─── review summary ──────────────────────────────────────────────────────────

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="text-right text-sm font-medium text-foreground">
        {value}
      </span>
    </div>
  );
}

// ─── main component ──────────────────────────────────────────────────────────

export function CreateEscrowForm({ className }: { className?: string }) {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const { isKycVerified, isKycLoading } = useKycGuard();
  const [step, setStep] = useState<WizardStep>(1);

  const initMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const token = useAuthStore.getState().accessToken;
      if (!token) throw new Error("Sign in to create an escrow");
      return postInitializeEscrow(token, payload);
    },
    onSuccess: (row) => {
      toast.success("Escrow created!", { description: row.title });
      router.push(`/escrows/${encodeURIComponent(row.id)}`);
    },
    onError: (err: unknown) =>
      toast.error(
        err instanceof Error ? err.message : "Could not create escrow",
      ),
  });

  const form = useForm<CreateEscrowFormInput, unknown, CreateEscrowFormValues>({
    resolver: zodResolver(createEscrowFormSchema) as Resolver<
      CreateEscrowFormInput,
      unknown,
      CreateEscrowFormValues
    >,
    defaultValues,
  });

  const escrowType = form.watch("escrow_type");
  const initiatorRole = form.watch("initiator_role");
  const whoPays = form.watch("who_pays_fees");
  const totalAmount = form.watch("amount");
  const isMilestone = escrowType === "milestone";

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "milestones",
  });

  // Compute actual steps (skip step 4 if not milestone)
  const stepSequence: WizardStep[] = isMilestone
    ? [1, 2, 3, 4, 5]
    : [1, 2, 3, 5];
  const currentIndex = stepSequence.indexOf(step);
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === stepSequence.length - 1;

  async function handleNext() {
    const fields = STEP_FIELDS[step];
    const valid = await form.trigger(fields as (keyof CreateEscrowFormInput)[]);
    if (!valid) return;
    const next = stepSequence[currentIndex + 1];
    if (next) setStep(next);
  }

  function handleBack() {
    const prev = stepSequence[currentIndex - 1];
    if (prev) setStep(prev);
  }

  function onSubmit(values: CreateEscrowFormValues) {
    if (!accessToken) {
      toast.error("Sign in to create an escrow");
      return;
    }
    let payload: Record<string, unknown>;
    try {
      payload = buildApiPayload(values) as Record<string, unknown>;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Check your dates");
      return;
    }
    initMutation.mutate(payload);
  }

  // Milestone sum progress
  const milestoneAmounts = form.watch("milestones") ?? [];
  const milestoneSum = milestoneAmounts.reduce(
    (s, m) => s + (Number(m.amount) || 0),
    0,
  );
  const milestonePct =
    totalAmount && Number(totalAmount) > 0
      ? Math.min(100, Math.round((milestoneSum / Number(totalAmount)) * 100))
      : 0;
  const milestoneMatch =
    totalAmount && Number(totalAmount) > 0
      ? Math.abs(milestoneSum - Number(totalAmount)) < 0.01
      : false;

  // ── unauthenticated ──────────────────────────────────────────────────────

  if (!accessToken) {
    return (
      <Card className={cn("max-w-2xl shadow-sm", className)}>
        <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10">
            <Zap className="size-8 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">
              Sign in to create an escrow
            </h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Your session is required to invite a counterparty and define deal
              terms.
            </p>
          </div>
          <Button asChild className="mt-2 rounded-full">
            <Link href="/signin">Sign in to continue</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ── wizard card ──────────────────────────────────────────────────────────

  return (
    <div className="relative">
      <div
        className={cn(
          "transition-all duration-500",
          !isKycVerified && !isKycLoading && accessToken && "opacity-25 pointer-events-none select-none blur-[1.5px]"
        )}
      >
        <Card className={cn("max-w-2xl shadow-sm", className)}>
          <StepIndicator current={step} isMilestone={isMilestone} />
          <Separator />

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              {/* ── STEP 1: Parties ─────────────────────────────────────── */}
              {step === 1 && (
                <CardContent className="space-y-7 py-8">
                  <div>
                    <CardTitle className="text-lg">Who is involved?</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Choose your role and how you want to structure the payment.
                    </p>
                  </div>

                  {/* Role */}
                  <FormField
                    control={form.control}
                    name="initiator_role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">
                          Your role
                        </FormLabel>
                        <div className="mt-2 grid grid-cols-2 gap-3">
                          <OptionCard
                            selected={field.value === "buyer"}
                            onClick={() => field.onChange("buyer")}
                            icon={ShoppingCart}
                            title="Buyer"
                            description="I'm paying for goods or services"
                          />
                          <OptionCard
                            selected={field.value === "seller"}
                            onClick={() => field.onChange("seller")}
                            icon={Briefcase}
                            title="Seller"
                            description="I'm delivering goods or services"
                          />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Escrow type */}
                  <FormField
                    control={form.control}
                    name="escrow_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">
                          Payment structure
                        </FormLabel>
                        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
                          <OptionCard
                            selected={field.value === "onetime"}
                            onClick={() => {
                              field.onChange("onetime");
                              replace([]);
                            }}
                            icon={LayoutList}
                            title="One-time"
                            description="Single payment on delivery"
                          />
                          <OptionCard
                            selected={field.value === "milestone"}
                            onClick={() => {
                              field.onChange("milestone");
                              if (fields.length === 0) append(defaultMilestone());
                            }}
                            icon={ChevronRight}
                            title="Milestone"
                            description="Pay in stages as work completes"
                          />
                          <OptionCard
                            selected={field.value === "recurring"}
                            onClick={() => {
                              field.onChange("recurring");
                              replace([]);
                            }}
                            icon={Repeat2}
                            title="Recurring"
                            description="Scheduled repeat payments"
                          />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Counterparty email */}
                  <FormField
                    control={form.control}
                    name="invitee_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Counterparty email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            autoComplete="off"
                            placeholder="partner@company.com"
                            {...field}
                          />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                          We'll send them an invitation to review and accept the
                          deal.
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              )}

              {/* ── STEP 2: Deal ────────────────────────────────────────── */}
              {step === 2 && (
                <CardContent className="space-y-7 py-8">
                  <div>
                    <CardTitle className="text-lg">
                      What's being exchanged?
                    </CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Give the deal a name, describe it clearly, and set the total
                      value.
                    </p>
                  </div>

                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deal title</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. Website Redesign Project"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={4}
                            placeholder="Describe what is being delivered or paid for. Be specific — this forms part of the legal record."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Currency</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              readOnly
                              className="bg-muted/40 text-center font-mono"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Total value</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              inputMode="decimal"
                              min={0}
                              step="0.01"
                              placeholder="0.00"
                              name={field.name}
                              ref={field.ref}
                              onBlur={field.onBlur}
                              value={field.value == null ? "" : String(field.value)}
                              onChange={(e) => {
                                const v = e.target.value;
                                field.onChange(v === "" ? undefined : v);
                              }}
                            />
                          </FormControl>
                          <p className="text-xs text-muted-foreground">
                            Enter the full escrow amount in ETB.
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              )}

              {/* ── STEP 3: Rules ───────────────────────────────────────── */}
              {step === 3 && (
                <CardContent className="space-y-7 py-8">
                  <div>
                    <CardTitle className="text-lg">Set the terms</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Define how delivery is confirmed and what happens if there's a
                      dispute.
                    </p>
                  </div>

                  <FormField
                    control={form.control}
                    name="acceptance_criteria"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Acceptance criteria</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={4}
                            placeholder="e.g. Delivered working source code, passing all unit tests, with documentation and deployment guide."
                            {...field}
                          />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                          Be specific. These criteria determine when funds are
                          released.
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="delivery_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5">
                          <CalendarDays className="size-3.5 text-muted-foreground" />
                          Target delivery date
                        </FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                          When do you expect the delivery to be complete?
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-6 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="inspection_period"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1.5">
                            <Clock className="size-3.5 text-muted-foreground" />
                            Inspection period
                          </FormLabel>
                          <div className="mt-1 flex items-center gap-2">
                            {[24, 48, 72].map((h) => (
                              <button
                                key={h}
                                type="button"
                                onClick={() => field.onChange(h)}
                                className={cn(
                                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                                  Number(field.value) === h
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-border hover:border-primary/50",
                                )}
                              >
                                {h}h
                              </button>
                            ))}
                          </div>
                          <FormControl>
                            <Input
                              type="number"
                              inputMode="numeric"
                              min={1}
                              placeholder="hours"
                              className="mt-2"
                              {...field}
                            />
                          </FormControl>
                          <p className="text-xs text-muted-foreground">
                            How long the buyer has to review after delivery before
                            funds auto-release.
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dispute_window"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1.5">
                            <Clock className="size-3.5 text-muted-foreground" />
                            Dispute window
                          </FormLabel>
                          <div className="mt-1 flex items-center gap-2">
                            {[24, 48, 72].map((h) => (
                              <button
                                key={h}
                                type="button"
                                onClick={() => field.onChange(h)}
                                className={cn(
                                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                                  Number(field.value) === h
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-border hover:border-primary/50",
                                )}
                              >
                                {h}h
                              </button>
                            ))}
                          </div>
                          <FormControl>
                            <Input
                              type="number"
                              inputMode="numeric"
                              min={1}
                              placeholder="hours"
                              className="mt-2"
                              {...field}
                            />
                          </FormControl>
                          <p className="text-xs text-muted-foreground">
                            How long after approval either party can raise a
                            dispute.
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="who_pays_fees"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">
                          Platform fees paid by
                        </FormLabel>
                        <div className="mt-2 grid grid-cols-2 gap-3">
                          <OptionCard
                            selected={field.value === "buyer"}
                            onClick={() => field.onChange("buyer")}
                            icon={ShoppingCart}
                            title="Buyer"
                            description="Buyer covers the platform fee"
                          />
                          <OptionCard
                            selected={field.value === "seller"}
                            onClick={() => field.onChange("seller")}
                            icon={Briefcase}
                            title="Seller"
                            description="Seller covers the platform fee"
                          />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              )}

              {/* ── STEP 4: Milestones ──────────────────────────────────── */}
              {step === 4 && isMilestone && (
                <CardContent className="space-y-7 py-8">
                  <div>
                    <CardTitle className="text-lg">Payment milestones</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Break the total into stages. Each milestone is released when
                      the buyer approves that deliverable.
                    </p>
                  </div>

                  {/* Allocation progress */}
                  {totalAmount && Number(totalAmount) > 0 ? (
                    <div className="rounded-xl border bg-muted/20 p-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">Amount allocated</span>
                        <span
                          className={cn(
                            "font-semibold tabular-nums",
                            milestoneMatch
                              ? "text-emerald-600 dark:text-emerald-400"
                              : milestoneSum > Number(totalAmount)
                                ? "text-destructive"
                                : "text-amber-600 dark:text-amber-400",
                          )}
                        >
                          ETB {milestoneSum.toLocaleString()} / ETB{" "}
                          {Number(totalAmount).toLocaleString()}
                        </span>
                      </div>
                      <Progress
                        value={milestonePct}
                        className={cn(
                          "mt-2 h-2",
                          milestoneMatch
                            ? "[&>div]:bg-emerald-500"
                            : milestoneSum > Number(totalAmount)
                              ? "[&>div]:bg-destructive"
                              : "",
                        )}
                      />
                      {milestoneMatch && (
                        <p className="mt-1.5 flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                          <Check className="size-3" /> Amounts balanced
                        </p>
                      )}
                      {!milestoneMatch && (
                        <p className="mt-1.5 text-xs text-muted-foreground">
                          Milestone totals must equal the deal amount.
                        </p>
                      )}
                    </div>
                  ) : null}

                  {/* Milestone list */}
                  <div className="space-y-4">
                    {fields.map((row, index) => (
                      <div
                        key={row.id}
                        className="rounded-xl border bg-muted/10 p-4"
                      >
                        <div className="mb-4 flex items-center justify-between">
                          <span className="text-sm font-semibold text-muted-foreground">
                            Milestone {index + 1}
                          </span>
                          {fields.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => remove(index)}
                            >
                              <Trash2 className="size-3.5" />
                              Remove
                            </Button>
                          )}
                        </div>
                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name={`milestones.${index}.title`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Title</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="e.g. Design mockups"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`milestones.${index}.description`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                  <Textarea
                                    rows={2}
                                    placeholder="What's included in this stage?"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name={`milestones.${index}.amount`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Amount (ETB)</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      inputMode="decimal"
                                      min={0}
                                      step="0.01"
                                      placeholder="0.00"
                                      name={field.name}
                                      ref={field.ref}
                                      onBlur={field.onBlur}
                                      value={
                                        field.value == null
                                          ? ""
                                          : String(field.value)
                                      }
                                      onChange={(e) => {
                                        const v = e.target.value;
                                        field.onChange(v === "" ? undefined : v);
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`milestones.${index}.due_date`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Due date</FormLabel>
                                  <FormControl>
                                    <Input type="datetime-local" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <FormField
                            control={form.control}
                            name={`milestones.${index}.inspection_hrs`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Inspection hours</FormLabel>
                                <div className="flex items-center gap-2">
                                  {[24, 48].map((h) => (
                                    <button
                                      key={h}
                                      type="button"
                                      onClick={() => field.onChange(h)}
                                      className={cn(
                                        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                                        Number(field.value) === h
                                          ? "border-primary bg-primary text-primary-foreground"
                                          : "border-border hover:border-primary/50",
                                      )}
                                    >
                                      {h}h
                                    </button>
                                  ))}
                                  <FormControl>
                                    <Input
                                      type="number"
                                      inputMode="numeric"
                                      min={1}
                                      className="h-8 w-20 text-sm"
                                      {...field}
                                    />
                                  </FormControl>
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full rounded-xl border-dashed"
                      onClick={() => append(defaultMilestone())}
                    >
                      <PlusCircle className="size-4" />
                      Add milestone
                    </Button>
                  </div>
                </CardContent>
              )}

              {/* ── STEP 5: Review ──────────────────────────────────────── */}
              {step === 5 && (
                <CardContent className="space-y-6 py-8">
                  <div>
                    <CardTitle className="text-lg">Review your escrow</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Check all details before creating. The counterparty will
                      receive an invitation email.
                    </p>
                  </div>

                  <div className="rounded-xl border divide-y overflow-hidden">
                    <div className="bg-muted/30 px-5 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Parties
                      </p>
                    </div>
                    <div className="px-5 divide-y">
                      <ReviewRow
                        label="Your role"
                        value={initiatorRole === "buyer" ? "🛒 Buyer" : "💼 Seller"}
                      />
                      <ReviewRow
                        label="Counterparty"
                        value={form.getValues("invitee_email") || "—"}
                      />
                      <ReviewRow
                        label="Payment structure"
                        value={
                          escrowType === "onetime"
                            ? "One-time"
                            : escrowType === "milestone"
                              ? "Milestone"
                              : "Recurring"
                        }
                      />
                    </div>

                    <div className="bg-muted/30 px-5 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Deal
                      </p>
                    </div>
                    <div className="px-5 divide-y">
                      <ReviewRow
                        label="Title"
                        value={form.getValues("title") || "—"}
                      />
                      <ReviewRow
                        label="Description"
                        value={
                          (form.getValues("description") || "").length > 80
                            ? form.getValues("description").slice(0, 80) + "…"
                            : form.getValues("description") || "—"
                        }
                      />
                      <ReviewRow
                        label="Total value"
                        value={`ETB ${Number(form.getValues("amount") ?? 0).toLocaleString()}`}
                      />
                    </div>

                    <div className="bg-muted/30 px-5 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Rules
                      </p>
                    </div>
                    <div className="px-5 divide-y">
                      <ReviewRow
                        label="Acceptance criteria"
                        value={
                          (form.getValues("acceptance_criteria") || "").length > 80
                            ? form.getValues("acceptance_criteria").slice(0, 80) +
                            "…"
                            : form.getValues("acceptance_criteria") || "—"
                        }
                      />
                      <ReviewRow
                        label="Target delivery"
                        value={
                          form.getValues("delivery_date")
                            ? new Date(
                              form.getValues("delivery_date"),
                            ).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                            : "—"
                        }
                      />
                      <ReviewRow
                        label="Inspection period"
                        value={`${form.getValues("inspection_period")} hours`}
                      />
                      <ReviewRow
                        label="Dispute window"
                        value={`${form.getValues("dispute_window")} hours`}
                      />
                      <ReviewRow
                        label="Platform fees"
                        value={`Paid by ${form.getValues("who_pays_fees")}`}
                      />
                    </div>

                    {isMilestone && fields.length > 0 && (
                      <>
                        <div className="bg-muted/30 px-5 py-3">
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Milestones ({fields.length})
                          </p>
                        </div>
                        <div className="px-5 divide-y">
                          {(form.getValues("milestones") ?? []).map((m, i) => (
                            <ReviewRow
                              key={i}
                              label={`${i + 1}. ${m.title || "Untitled"}`}
                              value={`ETB ${Number(m.amount ?? 0).toLocaleString("en-ET")}`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  <div className="rounded-xl bg-muted/30 px-5 py-4 text-xs text-muted-foreground leading-relaxed">
                    By creating this escrow you agree to the platform terms. The
                    counterparty must accept before funds can be deposited.
                  </div>
                </CardContent>
              )}

              {/* ── Navigation ──────────────────────────────────────────── */}
              <div className="flex items-center justify-between border-t px-6 py-4">
                {!isFirst ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="rounded-full text-muted-foreground"
                    onClick={handleBack}
                    disabled={initMutation.isPending}
                  >
                    <ArrowLeft className="size-4" />
                    Back
                  </Button>
                ) : (
                  <div />
                )}

                {!isLast ? (
                  <Button
                    type="button"
                    className="rounded-full"
                    onClick={handleNext}
                  >
                    Next
                    <ArrowRight className="size-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    className="rounded-full"
                    disabled={initMutation.isPending}
                  >
                    {initMutation.isPending ? "Creating…" : "Create escrow"}
                    {!initMutation.isPending && <ArrowRight className="size-4" />}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </Card>
      </div>

      {!isKycVerified && !isKycLoading && accessToken && (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-6">
          <Card className="max-w-md -translate-y-75 animate-in fade-in zoom-in border-none bg-background shadow-2xl rounded-2xl overflow-hidden duration-300">
            <CardHeader className="pb-2 text-center">
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <ShieldAlert className="size-6" />
              </div>
              <CardTitle className="text-2xl font-semibold">Secure Your Transaction</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-center">
              <p className="text-sm leading-relaxed text-muted-foreground">
                To initiate a secure escrow agreement under national compliance frameworks, both trading parties must hold a verified profile status. Verification takes less than 2 minutes.
              </p>
              <div className="flex flex-col gap-3">
                <Button
                  className="h-11 w-full rounded-full text-sm font-medium transition-transform active:scale-[0.98]"
                  onClick={() => router.push('/kyc')}
                >
                  Start Verification (2 Mins)
                </Button>
                <Button
                  variant="ghost"
                  className="h-11 w-full rounded-full text-sm text-muted-foreground hover:text-foreground"
                  onClick={() => router.push('/dashboard')}
                >
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
