'use client'

import { useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, type Resolver } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { patchOrgProfile } from '@/lib/org/org-organizations-api'
import type { OrganizationProfileRow } from '@/lib/organizations/organization-types'
import {
  orgProfilePatchSchema,
  type OrgProfilePatchInput,
  type OrgProfilePatchValues,
} from '@/lib/validators/org-profile-patch'
import { useAuthStore } from '@/stores/auth-store'

export function OrgSettingsProfileForm({
  orgId,
  profile,
}: {
  orgId: string
  profile: OrganizationProfileRow
}) {
  const queryClient = useQueryClient()
  const accessToken = useAuthStore((s) => s.accessToken)

  const mutation = useMutation({
    mutationFn: (values: OrgProfilePatchValues) => patchOrgProfile(accessToken!, orgId, values),
    onSuccess: () => {
      toast.success('Profile updated')
      void queryClient.invalidateQueries({ queryKey: ['me', 'organizations', orgId, 'profile'] })
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : 'Could not update profile'),
  })

  const form = useForm<OrgProfilePatchInput, unknown, OrgProfilePatchValues>({
    resolver: zodResolver(orgProfilePatchSchema) as Resolver<OrgProfilePatchInput, unknown, OrgProfilePatchValues>,
    defaultValues: {
      name: profile.name,
      slug: profile.slug,
      logo: profile.logo,
      email: profile.email,
      phone_number: profile.phone_number,
      address: profile.address,
      tin: profile.tin,
    },
  })

  useEffect(() => {
    form.reset({
      name: profile.name,
      slug: profile.slug,
      logo: profile.logo,
      email: profile.email,
      phone_number: profile.phone_number,
      address: profile.address,
      tin: profile.tin,
    })
  }, [profile.org_id, profile.updated_at, form, profile])

  function onSubmit(values: OrgProfilePatchValues) {
    if (!accessToken) {
      toast.error('Sign in required')
      return
    }
    mutation.mutate(values)
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b">
        <CardTitle className="text-base font-semibold">Organization profile</CardTitle>
        <CardDescription>
          Fields mirror <span className="font-mono text-xs">PATCH /api/v1/organizations/{'{org_id}'}/profile</span>.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input disabled className="rounded-lg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input disabled className="rounded-lg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="logo"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Logo URL</FormLabel>
                    <FormControl>
                      <Input className="rounded-lg font-mono text-xs" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" autoComplete="email" className="rounded-lg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input className="rounded-lg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input className="rounded-lg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>TIN</FormLabel>
                    <FormControl>
                      <Input disabled className="rounded-lg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button type="submit" className="rounded-full" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
