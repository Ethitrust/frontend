import { fetchApi } from "@/lib/api";

export type CreatePaymentOpts = {
  link_id: string;
  amount_cents: number;
  return_url: string;
};

export async function createPayment(opts: CreatePaymentOpts) {
  return fetchApi("/payments/create", {
    method: "POST",
    body: JSON.stringify(opts),
  });
}

export async function verifyPayment(reference: string) {
  return fetchApi("/payments/verify", {
    method: "POST",
    body: JSON.stringify({ reference }),
  });
}

export default createPayment;
