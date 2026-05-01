'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Copy } from 'lucide-react'
import { toast } from 'sonner'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { postOrgApiKey } from '@/lib/org/org-organizations-api'
import { useAuthStore } from '@/stores/auth-store'

export function OrgSettingsApiKeyActions({ orgId }: { orgId: string }) {
  const [open, setOpen] = useState(false)
  const [keyName, setKeyName] = useState('')
  const [createdSecret, setCreatedSecret] = useState<string | null>(null)

  const accessToken = useAuthStore((s) => s.accessToken)
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: (name: string) => postOrgApiKey(accessToken!, orgId, name),
    onSuccess: (res) => {
      void queryClient.invalidateQueries({ queryKey: ['me', 'organizations', orgId, 'api-keys'] })
      if (res.api_key) {
        setCreatedSecret(res.api_key)
      } else {
        toast.success('API key created')
        setKeyName('')
        setOpen(false)
      }
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : 'Could not create API key'),
  })

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) {
      setKeyName('')
      setCreatedSecret(null)
    }
  }

  function submit() {
    const name = keyName.trim()
    if (!name) {
      toast.error('Enter a key name')
      return
    }
    if (!accessToken) {
      toast.error('Sign in required')
      return
    }
    createMutation.mutate(name)
  }

  async function copySecret() {
    if (!createdSecret) return
    try {
      await navigator.clipboard.writeText(createdSecret)
      toast.success('Copied to clipboard')
    } catch {
      toast.error('Could not copy')
    }
  }

  function done() {
    toast.success('API key created')
    setKeyName('')
    setCreatedSecret(null)
    setOpen(false)
  }

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="shrink-0 rounded-full"
        onClick={() => handleOpenChange(true)}
      >
        New key
      </Button>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          {createdSecret ? (
            <>
              <DialogHeader>
                <DialogTitle>Save your API key</DialogTitle>
                <DialogDescription>
                  This value is shown only once. Store it somewhere safe before closing.
                </DialogDescription>
              </DialogHeader>
              <Alert>
                <AlertTitle>Secret</AlertTitle>
                <AlertDescription className="mt-2 space-y-2">
                  <Input readOnly className="font-mono text-xs" value={createdSecret} />
                  <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => void copySecret()}>
                    <Copy className="size-4" aria-hidden />
                    Copy
                  </Button>
                </AlertDescription>
              </Alert>
              <DialogFooter>
                <Button type="button" className="rounded-full" onClick={done}>
                  Done
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Create API key</DialogTitle>
                <DialogDescription>
                  POST <span className="font-mono text-xs">…/organizations/{'{org_id}'}/api-keys</span> with{' '}
                  <span className="font-mono text-xs">{`{ key_name }`}</span>.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2 py-2">
                <Label htmlFor="org-api-key-name">Key name</Label>
                <Input
                  id="org-api-key-name"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  placeholder="e.g. production-payouts"
                  className="rounded-lg"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      submit()
                    }
                  }}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" className="rounded-full" onClick={() => handleOpenChange(false)}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="rounded-full"
                  disabled={createMutation.isPending || !keyName.trim()}
                  onClick={submit}
                >
                  {createMutation.isPending ? 'Creating…' : 'Create'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
