'use client'

import { type FormEvent, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { postOrgWalletWithdraw } from '@/lib/org/org-wallet-api'
import type { WalletRow } from '@/lib/wallets/wallet-types'
import { useAuthStore } from '@/stores/auth-store'

export function OrgWalletWithdrawForm({
  orgId,
  wallet,
  onSuccess,
}: {
  orgId: string
  wallet: WalletRow
  onSuccess?: () => void
}) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const [amount, setAmount] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [bankCode, setBankCode] = useState('')
  const [description, setDescription] = useState('')

  const withdrawMutation = useMutation({
    mutationFn: (body: Parameters<typeof postOrgWalletWithdraw>[3]) =>
      postOrgWalletWithdraw(accessToken!, orgId, wallet.id, body),
    onSuccess: () => {
      toast.success('Withdrawal request submitted.')
      setAmount('')
      setAccountNumber('')
      setBankCode('')
      setDescription('')
      onSuccess?.()
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : 'Withdrawal failed'),
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!accessToken) {
      toast.error('Sign in required')
      return
    }
    const n = Number(amount.replace(/,/g, ''))
    if (!Number.isFinite(n) || n <= 0) {
      toast.error('Enter a valid withdrawal amount')
      return
    }
    if (!accountNumber.trim() || !bankCode.trim()) {
      toast.error('Account number and bank code are required')
      return
    }
    withdrawMutation.mutate({
      amount: n,
      account_number: accountNumber.trim(),
      bank_code: bankCode.trim(),
      description: description.trim(),
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl border bg-card/40 p-6 shadow-sm">
      <div>
        <h3 className="text-sm font-semibold">Withdraw to bank</h3>
        <p className="mt-1 font-mono text-xs text-muted-foreground">
          POST /api/v1/organizations/{'{org_id}'}/wallets/{'{wallet_id}'}/withdraw
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`amt-${wallet.id}`}>Amount ({wallet.currency})</Label>
          <Input
            id={`amt-${wallet.id}`}
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(ev) => setAmount(ev.target.value)}
            className="rounded-lg"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`bank-${wallet.id}`}>Bank code</Label>
          <Input
            id={`bank-${wallet.id}`}
            placeholder="e.g. CBETETAA"
            value={bankCode}
            onChange={(ev) => setBankCode(ev.target.value)}
            className="rounded-lg"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor={`acct-${wallet.id}`}>Account number</Label>
          <Input
            id={`acct-${wallet.id}`}
            placeholder="Beneficiary account"
            value={accountNumber}
            onChange={(ev) => setAccountNumber(ev.target.value)}
            className="rounded-lg"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor={`desc-${wallet.id}`}>Description (optional)</Label>
          <Input
            id={`desc-${wallet.id}`}
            placeholder="Payout reference"
            value={description}
            onChange={(ev) => setDescription(ev.target.value)}
            className="rounded-lg"
          />
        </div>
      </div>
      <Button type="submit" className="rounded-full" disabled={withdrawMutation.isPending}>
        {withdrawMutation.isPending ? (
          <>
            <Spinner className="size-4" aria-hidden />
            Submitting…
          </>
        ) : (
          'Submit withdrawal'
        )}
      </Button>
    </form>
  )
}
