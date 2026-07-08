import React, { useState, Component, type ReactNode } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminFetch } from '@/lib/adminClient'

// Error boundary — prevents a crash here from blanking the whole admin page
class PlanConfigsErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state = { error: null }
  static getDerivedStateFromError(e: Error) { return { error: e.message } }
  render() {
    if (this.state.error)
      return <p className="admin-error">Failed to render Plan Configs: {this.state.error}</p>
    return this.props.children
  }
}

// Defensive interface — covers snake_case and camelCase variants
interface PlanConfig {
  id: string
  // snake_case variants
  plan_name?: string
  plan?: string
  daily_limit?: number | null
  updated_at?: string | null
  // camelCase variants (live API may return these)
  planName?: string
  dailyLimit?: number | null
  updatedAt?: string | null
  // common to both
  description?: string | null
}

// Resolve plan name regardless of which field the API uses
function getPlanName(cfg: PlanConfig): string {
  return cfg.plan_name ?? cfg.planName ?? cfg.plan ?? ''
}

function getLimit(cfg: PlanConfig): number | null | undefined {
  // Cannot use ?? here because null means "Unlimited" and ?? treats null as
  // nullish — `null ?? cfg.dailyLimit` would return cfg.dailyLimit instead of
  // preserving the explicit null. Use explicit undefined checks instead.
  if (cfg.daily_limit !== undefined) return cfg.daily_limit   // null | number
  if (cfg.dailyLimit  !== undefined) return cfg.dailyLimit    // null | number
  return undefined // field absent entirely
}

function getUpdatedAt(cfg: PlanConfig): string | null | undefined {
  return cfg.updated_at ?? cfg.updatedAt
}

function fmtLimit(limit: number | null | undefined) {
  if (limit == null) return 'Unlimited'
  return limit.toLocaleString()
}

function fmt(ts: string | null | undefined) {
  if (!ts) return '—'
  return new Date(ts).toLocaleString()
}

export function PlanConfigs() {
  return (
    <PlanConfigsErrorBoundary>
      <PlanConfigsInner />
    </PlanConfigsErrorBoundary>
  )
}

function PlanConfigsInner() {
  const qc = useQueryClient()

  const configs = useQuery({
    queryKey: ['admin', 'plan-configs'],
    queryFn: () => adminFetch<PlanConfig[]>('/admin/plan-configs'),
    retry: false,
  })

  // Track by cfg.id — guaranteed unique regardless of API field name shape
  const [editId, setEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<{ daily_limit: string; description: string }>({
    daily_limit: '',
    description: '',
  })
  const [inputError, setInputError] = useState<string | null>(null)

  const editMutation = useMutation({
    // PATCH /admin/plan-configs/{plan_name} per backend spec
    mutationFn: ({ planName, body }: { planName: string; body: { daily_limit?: number | null; description?: string } }) =>
      adminFetch<PlanConfig>(`/admin/plan-configs/${planName}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),

    // ── Global onSuccess — fires even if the component unmounts before the
    //    request resolves (e.g. admin clicks Save then immediately switches tabs).
    //    ALL cache-update logic lives here. Nothing is split to the per-mutate
    //    callback so there is no race condition and no silent no-op on unmount.
    onSuccess: (serverResponse, variables) => {
      // 1. Refresh the plan-configs table so the admin sees the new value.
      qc.invalidateQueries({ queryKey: ['admin', 'plan-configs'] })
      // Clear any cached score results (rate-limit metadata may have changed).
      qc.removeQueries({ queryKey: ['score'] })
      setEditId(null)

      // 2. Propagate the new anonymous plan limit to the homepage badge.
      //
      //    Use variables.planName (the name we sent in the PATCH request URL)
      //    as the primary gate — not the response body's plan name field, which
      //    may be absent or differently named depending on backend version.
      //    The response plan name is logged as a diagnostic only.
      const requestedPlanName = variables.planName.trim().toLowerCase()

      if (requestedPlanName !== 'anonymous') {
        // Log so a future debugging session can see that this save did NOT
        // affect the anonymous-limit cache (rather than wondering why).
        console.warn(
          '[PlanConfigs] Saved plan "' + variables.planName + '" — not "anonymous".' +
          ' anonymous-limit cache was NOT updated.',
        )
        return
      }

      // We know we saved the anonymous plan. Now decide how to update the cache.
      // getLimit() correctly preserves null (= Unlimited) without ?? eating it.
      const serverLimit = getLimit(serverResponse)   // number | null | undefined

      if (serverLimit !== undefined) {
        // Server response includes the limit field — use it for an optimistic
        // instant update (setQueryData) AND queue a background refetch
        // (invalidateQueries) so the cache converges to server truth even if
        // the optimistic value is somehow off.
        const newLimit: number | null = serverLimit   // null means Unlimited
        console.info(
          '[PlanConfigs] Anonymous plan saved — syncing anonymous-limit cache. New limit:',
          newLimit === null ? 'Unlimited' : newLimit,
        )
        qc.setQueryData(['anonymous-limit'], newLimit)
        qc.invalidateQueries({ queryKey: ['anonymous-limit'] })
      } else {
        // Response omitted the limit field (unexpected shape). Do NOT guess or
        // coerce to null/Unlimited — that would misrepresent the real value.
        // Rely on invalidateQueries alone to pull the correct value from the server.
        console.warn(
          '[PlanConfigs] Anonymous plan PATCH succeeded but response omitted daily_limit.' +
          ' Falling back to invalidateQueries — homepage badge will refetch from server.',
        )
        qc.invalidateQueries({ queryKey: ['anonymous-limit'] })
      }
    },

    // Bug 9: log mutation failures so they're visible without DevTools.
    onError: (error) => {
      console.warn(
        '[PlanConfigs] Plan config PATCH failed:',
        error instanceof Error ? error.message : String(error),
      )
    },
  })

  function startEdit(cfg: PlanConfig) {
    setEditId(cfg.id)
    setInputError(null)
    editMutation.reset()
    setEditForm({
      daily_limit: getLimit(cfg) != null ? String(getLimit(cfg)) : '',
      description: cfg.description ?? '',
    })
  }

  function cancelEdit() {
    setEditId(null)
    setInputError(null)
    editMutation.reset()
  }

  function handleSave(e: React.FormEvent, cfg: PlanConfig) {
    e.preventDefault()
    setInputError(null)
    const raw = editForm.daily_limit.trim()
    let daily_limit: number | null = null
    if (raw !== '') {
      const n = Number(raw)
      if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) {
        setInputError('Daily limit must be a whole number ≥ 0, or left blank for Unlimited.')
        return
      }
      daily_limit = n
    }
    // Only send description if the user actually typed something
    const body: { daily_limit: number | null; description?: string } = { daily_limit }
    if (editForm.description.trim()) body.description = editForm.description.trim()

    // No per-mutate callbacks — all cache-update logic lives in the global
    // onSuccess defined in useMutation({...}) above, which fires regardless
    // of whether this component is still mounted when the request resolves.
    editMutation.mutate({ planName: getPlanName(cfg), body })
  }

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2 className="admin-section-title">Plan Configs</h2>
      </div>
      <p className="admin-section-desc">
        Edit rate limits and descriptions for each plan. Leave Daily Limit blank to set it to
        Unlimited.
      </p>

      {configs.isLoading && <p className="admin-loading">Loading plan configs…</p>}

      {configs.isError && (
        <div className="admin-error-block">
          <p className="admin-error">
            {configs.error instanceof Error ? configs.error.message : String(configs.error)}
          </p>
          <button className="admin-btn admin-btn--ghost" onClick={() => configs.refetch()}>
            ↻ Retry
          </button>
        </div>
      )}

      {configs.isSuccess && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Plan</th>
                <th>Daily Limit</th>
                <th>Description</th>
                <th>Last Updated</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {configs.data.map(cfg => (
                <React.Fragment key={cfg.id}>
                  <tr>
                    <td className="admin-td-mono" style={{ maxWidth: 'unset' }}>
                      {getPlanName(cfg)}
                    </td>
                    <td>{fmtLimit(getLimit(cfg))}</td>
                    <td style={{ color: cfg.description ? 'var(--text)' : 'var(--text-dim)' }}>
                      {cfg.description || '—'}
                    </td>
                    <td>{fmt(getUpdatedAt(cfg))}</td>
                    <td>
                      <button
                        className="admin-btn admin-btn--ghost"
                        onClick={() => editId === cfg.id ? cancelEdit() : startEdit(cfg)}
                      >
                        {editId === cfg.id ? 'Cancel' : 'Edit'}
                      </button>
                    </td>
                  </tr>

                  {editId === cfg.id && (
                    <tr className="admin-edit-row">
                      <td colSpan={5}>
                        <form
                          className="admin-form admin-form--inline"
                          onSubmit={e => handleSave(e, cfg)}
                        >
                          <div className="admin-form-row">
                            <label>Daily Limit</label>
                            <input
                              className="admin-input"
                              type="number"
                              min={0}
                              step={1}
                              placeholder="Unlimited (leave blank)"
                              value={editForm.daily_limit}
                              onChange={e => setEditForm(f => ({ ...f, daily_limit: e.target.value }))}
                            />
                          </div>
                          <div className="admin-form-row">
                            <label>Description</label>
                            <input
                              className="admin-input"
                              type="text"
                              placeholder="e.g. Anonymous users"
                              value={editForm.description}
                              onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                            />
                          </div>
                          <div className="admin-form-row">
                            <button
                              className="admin-btn admin-btn--primary"
                              type="submit"
                              disabled={editMutation.isPending}
                            >
                              {editMutation.isPending ? 'Saving…' : 'Save'}
                            </button>
                            <button
                              className="admin-btn admin-btn--ghost"
                              type="button"
                              onClick={cancelEdit}
                            >
                              Cancel
                            </button>
                          </div>
                          {inputError && <p className="admin-error">{inputError}</p>}
                          {editMutation.isError && (
                            <p className="admin-error">{editMutation.error instanceof Error ? editMutation.error.message : String(editMutation.error)}</p>
                          )}
                          {editMutation.isSuccess && (
                            <p className="admin-success">Saved.</p>
                          )}
                        </form>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {configs.data.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-dim)' }}>
                    No plan configs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
