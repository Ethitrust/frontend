"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm, type Resolver } from "react-hook-form";
import { PlusCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  createEscrowFormSchema,
  type CreateEscrowFormInput,
  type CreateEscrowFormValues,
} from "@/lib/validators/create-escrow";
import { postInitializeEscrow } from "@/lib/escrows/me-escrows-api";
import { ethitrustThemeTokens } from "@/lib/ethitrust-theme";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

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
        `Milestone “${m.title.trim() || "Untitled"}” due date`,
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

export function CreateEscrowForm({ className }: { className?: string }) {
  const router = useRouter();
  const e = ethitrustThemeTokens;
  const accessToken = useAuthStore((s) => s.accessToken);

  const initMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const token = useAuthStore.getState().accessToken;
      if (!token) throw new Error("Sign in to create an escrow");
      return postInitializeEscrow(token, payload);
    },
    onSuccess: (row) => {
      toast.success("Escrow created", { description: row.title });
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
  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "milestones",
  });

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

  if (!accessToken) {
    return (
      <Card className={cn("max-w-3xl shadow-sm", className)}>
        <CardHeader className="border-b">
          <CardTitle className="text-lg font-semibold">
            Sign in required
          </CardTitle>
          <CardDescription>
            Creating an escrow uses your authenticated session. Sign in first,
            then you can invite a counterparty and define terms.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Button asChild className="rounded-full">
            <Link href="/signin">Sign in</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("max-w-3xl shadow-sm", className)}>
      <CardHeader className="border-b">
        <CardTitle className="text-lg font-semibold">Escrow details</CardTitle>
        <CardDescription>
          Define the counterparty, economics, and acceptance rules. Milestone
          schedules apply when you choose a milestone escrow.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="grid gap-6 pt-6">
            <FormField
              control={form.control}
              name="invitee_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Invitee email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      autoComplete="off"
                      placeholder="counterparty@company.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="escrow_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Escrow type</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(v) => {
                        field.onChange(v);
                        if (v === "milestone" && fields.length === 0) {
                          append(defaultMilestone());
                        }
                        if (v !== "milestone") {
                          replace([]);
                        }
                      }}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Choose type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="onetime">One-time</SelectItem>
                        <SelectItem value="milestone">Milestone</SelectItem>
                        <SelectItem value="recurring">Recurring</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="initiator_role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your role</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="buyer">Buyer (you fund)</SelectItem>
                        <SelectItem value="seller">
                          Seller (you deliver)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Short name for this deal" {...field} />
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
                      placeholder="What is being delivered or paid for?"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ETB">ETB</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Total amount</FormLabel>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="acceptance_criteria"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Acceptance criteria</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="What must be true before funds are released?"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="inspection_period"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inspection period (hours)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dispute_window"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dispute window (hours)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="delivery_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target delivery</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="who_pays_fees"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Platform fees paid by</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="buyer">Buyer</SelectItem>
                        <SelectItem value="seller">Seller</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {escrowType === "milestone" ? (
              <>
                <Separator />
                <div className="space-y-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className={cn(e.typography.statLabel, "mb-1")}>
                        Milestones
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Amounts should sum to the total escrow amount.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      onClick={() => append(defaultMilestone())}
                    >
                      <PlusCircle />
                      Add milestone
                    </Button>
                  </div>

                  {fields.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No milestones yet. Add at least one.
                    </p>
                  ) : (
                    <ul className="space-y-6">
                      {fields.map((row, index) => (
                        <li
                          key={row.id}
                          className="rounded-xl border bg-muted/15 p-4"
                        >
                          <div className="mb-4 flex items-center justify-between gap-2">
                            <span className="text-sm font-medium text-muted-foreground">
                              Milestone {index + 1}
                            </span>
                            {fields.length > 1 ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => remove(index)}
                              >
                                <Trash2 />
                                Remove
                              </Button>
                            ) : null}
                          </div>
                          <div className="grid gap-4">
                            <FormField
                              control={form.control}
                              name={`milestones.${index}.title`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Title</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
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
                                    <Textarea rows={2} {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <div className="grid gap-4 sm:grid-cols-3">
                              <FormField
                                control={form.control}
                                name={`milestones.${index}.amount`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Amount</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        inputMode="decimal"
                                        min={0}
                                        step="0.01"
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
                                          field.onChange(
                                            v === "" ? undefined : v,
                                          );
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
                                    <FormLabel>Due</FormLabel>
                                    <FormControl>
                                      <Input type="datetime-local" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`milestones.${index}.inspection_hrs`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Inspection (hrs)</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        inputMode="numeric"
                                        min={1}
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                  {form.formState.errors.milestones?.message ? (
                    <p className="text-sm font-medium text-destructive">
                      {form.formState.errors.milestones.message}
                    </p>
                  ) : null}
                </div>
              </>
            ) : null}

            <div className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                asChild
              >
                <Link href="/escrows">Cancel</Link>
              </Button>
              <Button
                type="submit"
                className="rounded-full"
                disabled={initMutation.isPending}
              >
                {initMutation.isPending ? "Creating…" : "Create escrow"}
              </Button>
            </div>
          </CardContent>
        </form>
      </Form>
    </Card>
  );
}
