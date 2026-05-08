'use client'

import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { CheckIcon, CreditCardIcon, InfoIcon, Loader2Icon, Settings2Icon } from 'lucide-react'
import { toast } from 'sonner'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { WalletFlowShell } from '@/components/wallet/wallet-flow-shell'
import { WalletPaymentsGate } from '@/components/wallet/wallet-payments-gate'
import { cn } from '@/lib/utils'
import {
  extractPaymentRedirectUrl,
  fetchMeWalletList,
  pickDefaultWalletId,
  postFundWallet,
} from '@/lib/wallets/me-wallet-api'
import type { WalletRow } from '@/lib/wallets/wallet-types'

export function WalletDepositView() {
  return (
    <WalletPaymentsGate
      title="Fund wallet"
      description="Add money through a secure hosted checkout. You will return here when you are done."
    >
      {(accessToken) => <WalletDepositSignedIn accessToken={accessToken} />}
    </WalletPaymentsGate>
  )
}

function WalletDepositSignedIn({ accessToken }: { accessToken: string }) {
  const [walletId, setWalletId] = useState('')
  const [amount, setAmount] = useState('')
  const [returnUrl, setReturnUrl] = useState('')
  const [originReady, setOriginReady] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const presets = [500, 1000, 2500, 5000]

  useEffect(() => {
    const o = `${window.location.origin}/wallet`
    setReturnUrl((prev) => (prev.trim() === '' ? o : prev))
    setOriginReady(true)
  }, [])

  const walletsQuery = useQuery({
    queryKey: ['me', 'wallets'],
    queryFn: () => fetchMeWalletList(accessToken),
    enabled: Boolean(accessToken),
  })

  useEffect(() => {
    const list = walletsQuery.data
    if (!list?.length || walletId) return
    const id = pickDefaultWalletId(list)
    if (id) setWalletId(id)
  }, [walletsQuery.data, walletId])

  const selectedWallet = useMemo(
    () => walletsQuery.data?.find((w) => w.id === walletId),
    [walletsQuery.data, walletId],
  )

  const fundMutation = useMutation({
    mutationFn: async (payload: { amount: number; return_url: string }) => {
      return postFundWallet(accessToken, walletId, payload)
    },
    onSuccess: (data) => {
      const redirect = extractPaymentRedirectUrl(data)
      if (redirect) {
        toast.success('Redirecting to checkout')
        window.location.assign(redirect)
        return
      }
      toast.message('Funding initiated', {
        description:
          'If you were not redirected, finish payment using the link from your bank or SMS. Your balance updates when the payment clears.',
      })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!walletId) {
      toast.error('Choose a wallet')
      return
    }
    const n = Number(amount.replace(/,/g, ''))
    if (!Number.isFinite(n) || n <= 0) {
      toast.error('Enter a valid amount')
      return
    }
    let url = returnUrl.trim()
    if (!/^https?:\/\//i.test(url)) {
      toast.error('Return URL must be an absolute URL (https://…)')
      return
    }
    fundMutation.mutate({ amount: n, return_url: url })
  }

  return (
    <WalletFlowShell
      title="Add Funds"
      description="Safely deposit funds into your Ethi-Trust wallet using our secure payment partners. Your balance will be updated as soon as the transaction is confirmed."
    >
      {!originReady ? null : walletsQuery.isPending ? (
        <div className="grid gap-6">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      ) : walletsQuery.isError ? (
        <Alert variant="destructive" className="rounded-2xl border-destructive/20 bg-destructive/5">
          <AlertTitle>Could not load wallets</AlertTitle>
          <AlertDescription>
            {walletsQuery.error instanceof Error ? walletsQuery.error.message : 'Request failed'}
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-8 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <Card className="overflow-hidden rounded-2xl border-border/50 shadow-sm">
              <CardHeader className="bg-muted/30 pb-6">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <CreditCardIcon className="size-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold">Deposit funds</CardTitle>
                    <CardDescription>Configure your payment details below</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <form onSubmit={onSubmit}>
                <CardContent className="space-y-8 pt-8">
                  {/* Wallet Selection */}
                  {walletsQuery.data && walletsQuery.data.length > 1 ? (
                    <div className="space-y-4">
                      <Label className="text-sm font-medium">Target Wallet</Label>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {(walletsQuery.data as WalletRow[]).map((w) => {
                          const isActive = walletId === w.id
                          return (
                            <button
                              key={w.id}
                              type="button"
                              onClick={() => setWalletId(w.id)}
                              className={cn(
                                'relative flex flex-col items-start rounded-xl border p-4 text-left transition-all',
                                isActive
                                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                  : 'border-border bg-background hover:border-primary/50',
                              )}
                            >
                              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                {w.currency} Wallet
                              </span>
                              <span className="mt-1 font-mono text-sm font-medium">
                                {w.id.slice(0, 8)}…{w.id.slice(-4)}
                              </span>
                              {isActive && (
                                <div className="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                  <CheckIcon className="size-3" />
                                </div>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ) : null}

                  {/* Amount Selection */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="deposit-amount" className="text-sm font-medium">
                        Amount {selectedWallet ? `(${selectedWallet.currency})` : ''}
                      </Label>
                    </div>
                    <div className="relative">
                      <Input
                        id="deposit-amount"
                        inputMode="decimal"
                        placeholder="0.00"
                        value={amount}
                        onChange={(ev) => setAmount(ev.target.value)}
                        autoComplete="off"
                        className="h-14 rounded-xl border-border/60 bg-muted/20 px-4 text-xl font-semibold transition-all focus:bg-background focus:ring-2 focus:ring-primary/20"
                      />
                      {selectedWallet && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                          {selectedWallet.currency}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {presets.map((p) => (
                        <Button
                          key={p}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setAmount(String(p))}
                          className={cn(
                            'h-9 rounded-full px-4 text-xs font-medium transition-all',
                            amount === String(p)
                              ? 'border-primary bg-primary/10 text-primary hover:bg-primary/20'
                              : 'hover:border-primary/50',
                          )}
                        >
                          +{p.toLocaleString()}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Advanced Settings Toggle */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground"
                    >
                      <Settings2Icon className="size-3.5" />
                      {showAdvanced ? 'Hide advanced settings' : 'Show advanced settings'}
                    </button>
                    
                    {showAdvanced && (
                      <div className="mt-4 space-y-4 rounded-xl border bg-muted/10 p-4">
                        <div className="space-y-2">
                          <Label htmlFor="deposit-return-url" className="text-xs uppercase tracking-wider text-muted-foreground">
                            Return URL
                          </Label>
                          <Input
                            id="deposit-return-url"
                            type="url"
                            placeholder={`${typeof window !== 'undefined' ? window.location.origin : ''}/wallet`}
                            value={returnUrl}
                            onChange={(ev) => setReturnUrl(ev.target.value)}
                            className="h-9 rounded-lg border-border/40 bg-background font-mono text-xs"
                          />
                          <p className="text-[10px] text-muted-foreground">
                            The URL where you will be redirected after completing the payment.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4 bg-muted/30 p-8">
                  <Button 
                    type="submit" 
                    className="h-12 w-full rounded-xl text-base font-semibold shadow-lg shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.99]" 
                    disabled={fundMutation.isPending}
                  >
                    {fundMutation.isPending ? (
                      <>
                        <Loader2Icon className="mr-2 size-5 animate-spin" aria-hidden />
                        Initializing checkout…
                      </>
                    ) : (
                      'Proceed to Payment'
                    )}
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    You will be redirected to a secure payment gateway.
                  </p>
                </CardFooter>
              </form>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Card className="rounded-2xl border-none bg-primary/5 p-6">
              <h3 className="text-sm font-semibold text-primary">Payment Summary</h3>
              <div className="mt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-medium">
                    {amount ? Number(amount.replace(/,/g, '')).toLocaleString() : '0.00'} {selectedWallet?.currency}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Network Fee</span>
                  <span className="font-medium text-emerald-600">Free</span>
                </div>
                <div className="my-2 border-t border-primary/10 pt-2" />
                <div className="flex justify-between text-base font-bold">
                  <span>Total</span>
                  <span className="text-primary">
                    {amount ? Number(amount.replace(/,/g, '')).toLocaleString() : '0.00'} {selectedWallet?.currency}
                  </span>
                </div>
              </div>
            </Card>

            <div className="rounded-2xl border border-border/50 bg-background p-6">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <InfoIcon className="size-3" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">Secure Transfer</h4>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    We use industry-standard encryption to protect your transaction. Your funds are typically available immediately after payment confirmation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </WalletFlowShell>
  )
}
