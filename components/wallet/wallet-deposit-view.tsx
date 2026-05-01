'use client'

import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Loader2Icon } from 'lucide-react'
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
      title="Fund wallet"
      description="You will leave this site briefly to authorize payment with our provider (for example Chapa). Your balance updates after payment completes."
    >
      {!originReady ? null : walletsQuery.isPending ? (
        <Skeleton className="h-56 w-full rounded-xl" />
      ) : walletsQuery.isError ? (
        <Alert variant="destructive">
          <AlertTitle>Could not load wallets</AlertTitle>
          <AlertDescription>
            {walletsQuery.error instanceof Error ? walletsQuery.error.message : 'Request failed'}
          </AlertDescription>
        </Alert>
      ) : (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Deposit details</CardTitle>
            <CardDescription>
              Enter how much to add and where you should land after checkout. If you have more than one wallet, choose
              which balance to credit below.
            </CardDescription>
          </CardHeader>
          <form onSubmit={onSubmit}>
            <CardContent className="space-y-6">
              {walletsQuery.data && walletsQuery.data.length > 1 ? (
                <div className="space-y-2">
                  <Label htmlFor="deposit-wallet">Wallet</Label>
                  <Select value={walletId} onValueChange={setWalletId}>
                    <SelectTrigger id="deposit-wallet" className="w-full rounded-lg">
                      <SelectValue placeholder="Select wallet" />
                    </SelectTrigger>
                    <SelectContent>
                      {(walletsQuery.data as WalletRow[]).map((w) => (
                        <SelectItem key={w.id} value={w.id}>
                          {w.currency} — {w.id.slice(0, 8)}…
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="deposit-amount">Amount {selectedWallet ? `(${selectedWallet.currency})` : ''}</Label>
                <Input
                  id="deposit-amount"
                  inputMode="decimal"
                  placeholder="1000"
                  value={amount}
                  onChange={(ev) => setAmount(ev.target.value)}
                  autoComplete="off"
                  className="rounded-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deposit-return-url">Return URL</Label>
                <Input
                  id="deposit-return-url"
                  type="url"
                  placeholder={`${typeof window !== 'undefined' ? window.location.origin : ''}/wallet`}
                  value={returnUrl}
                  onChange={(ev) => setReturnUrl(ev.target.value)}
                  className="rounded-lg font-mono text-xs sm:text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Where you land after checkout; defaults to /wallet on this origin.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-wrap gap-3 border-t bg-muted/20">
              <Button type="submit" className="rounded-full" disabled={fundMutation.isPending}>
                {fundMutation.isPending ? (
                  <>
                    <Loader2Icon className="size-4 animate-spin" aria-hidden />
                    Starting checkout…
                  </>
                ) : (
                  'Continue to payment'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}
    </WalletFlowShell>
  )
}
