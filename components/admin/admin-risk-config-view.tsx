'use client'

import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Save, Shield, Sliders } from 'lucide-react'
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
import { fetchRiskConfig, updateRiskConfig } from '@/lib/admin/admin-risk-monitoring-api'
import type { RiskConfig } from '@/lib/admin/admin-risk-monitoring-api'
import { ethitrustThemeTokens } from '@/lib/ethitrust-theme'
import { cn } from '@/lib/utils'

export function AdminRiskConfigView({ accessToken }: { accessToken: string }) {
  const e = ethitrustThemeTokens
  const qc = useQueryClient()

  const configQuery = useQuery({
    queryKey: ['admin', 'risk', 'config'],
    queryFn: () => fetchRiskConfig(accessToken),
    enabled: Boolean(accessToken),
  })

  const [formData, setFormData] = useState<RiskConfig | null>(null)

  useEffect(() => {
    if (configQuery.data) {
      setFormData(configQuery.data)
    }
  }, [configQuery.data])

  const updateMutation = useMutation({
    mutationFn: (newConfig: RiskConfig) => updateRiskConfig(accessToken, newConfig),
    onSuccess: () => {
      toast.success('Risk configuration updated')
      void qc.invalidateQueries({ queryKey: ['admin', 'risk', 'config'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const handleSave = () => {
    if (formData) {
      updateMutation.mutate(formData)
    }
  }

  const handleChange = (key: keyof RiskConfig, value: string) => {
    if (!formData) return
    const num = parseFloat(value)
    if (!isNaN(num)) {
      setFormData({ ...formData, [key]: num })
    }
  }

  return (
    <div className={cn(e.layout.container, 'py-8 lg:py-12')}>
      <header>
        <p className={cn(e.typography.eyebrow, 'text-muted-foreground')}>Risk monitoring</p>
        <h1 className={cn(e.typography.displayLG, 'mt-2 font-serif font-normal text-foreground')}>
          Risk Configuration
        </h1>
        <p className={cn(e.typography.bodyMuted, 'mt-3')}>
          Fine-tune the risk detection thresholds and behavioral analysis parameters.
        </p>
      </header>

      {configQuery.isError ? (
        <Alert variant="destructive" className="mt-8">
          <AlertTitle>Could not load risk config</AlertTitle>
          <AlertDescription>
            {configQuery.error instanceof Error ? configQuery.error.message : 'Request failed'}
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        {/* Behavioral Thresholds */}
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sliders className="size-5 text-primary" />
              <CardTitle className="text-base font-semibold">Behavioral Thresholds</CardTitle>
            </div>
            <CardDescription>Adjust triggers for suspicious transaction behavior</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {configQuery.isPending || !formData ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="instant-threshold">Instant Confirmation (minutes)</Label>
                  <Input
                    id="instant-threshold"
                    type="number"
                    value={formData.instant_confirmation_threshold_minutes}
                    onChange={(e) => handleChange('instant_confirmation_threshold_minutes', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Flag escrows confirmed within this many minutes of creation.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="repeated-threshold">Repeated Interaction Count</Label>
                  <Input
                    id="repeated-threshold"
                    type="number"
                    value={formData.repeated_interaction_count_threshold}
                    onChange={(e) => handleChange('repeated_interaction_count_threshold', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Flag when users transact with each other more than this many times.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dispute-rate-threshold">High Dispute Rate (%)</Label>
                  <Input
                    id="dispute-rate-threshold"
                    type="number"
                    step="0.1"
                    value={formData.seller_high_dispute_rate_threshold * 100}
                    onChange={(e) => handleChange('seller_high_dispute_rate_threshold', (parseFloat(e.target.value) / 100).toString())}
                  />
                  <p className="text-xs text-muted-foreground">
                    Flag sellers exceeding this dispute percentage.
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Risk Score Settings */}
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="size-5 text-primary" />
              <CardTitle className="text-base font-semibold">Risk Score Levels</CardTitle>
            </div>
            <CardDescription>Define how scores map to risk levels</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {configQuery.isPending || !formData ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="high-risk-threshold">High Risk Threshold</Label>
                  <Input
                    id="high-risk-threshold"
                    type="number"
                    value={formData.high_risk_score_threshold}
                    onChange={(e) => handleChange('high_risk_score_threshold', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Scores above this are classified as 'High Risk'.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="critical-risk-threshold">Critical Risk Threshold</Label>
                  <Input
                    id="critical-risk-threshold"
                    type="number"
                    value={formData.critical_risk_score_threshold}
                    onChange={(e) => handleChange('critical_risk_score_threshold', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Scores above this are classified as 'Critical' and may trigger auto-holds.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="velocity-threshold">Transaction Velocity (per hour)</Label>
                  <Input
                    id="velocity-threshold"
                    type="number"
                    value={formData.transaction_frequency_threshold}
                    onChange={(e) => handleChange('transaction_frequency_threshold', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Alert when a user creates more than this many escrows per hour.
                  </p>
                </div>
              </>
            )}
          </CardContent>
          <CardFooter className="border-t border-border pt-6">
            <Button
              className="w-full rounded-full"
              onClick={handleSave}
              disabled={updateMutation.isPending || configQuery.isPending}
            >
              <Save className="mr-2 size-4" />
              Save Configuration
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
