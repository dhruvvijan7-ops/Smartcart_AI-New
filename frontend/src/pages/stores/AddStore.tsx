import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Store as StoreIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import { apiErrorMessage, storesApi } from '../../lib/api'
import { PageHeader } from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import { TextInput } from '../../components/ui/Forms'

export default function AddStore() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [lead, setLead] = useState('3')
  const [safety, setSafety] = useState('2')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErr, setFieldErr] = useState<{ name?: string; lead?: string; safety?: string }>({})

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs: { name?: string; lead?: string; safety?: string } = {}
    if (!name.trim()) errs.name = 'A store name is required.'
    else if (name.trim().length > 120) errs.name = 'Keep the name under 120 characters.'
    const leadN = Number(lead)
    const safetyN = Number(safety)
    if (!Number.isFinite(leadN) || leadN < 0 || !Number.isInteger(leadN)) errs.lead = 'Enter a whole number of days (0 or more).'
    if (!Number.isFinite(safetyN) || safetyN < 0 || !Number.isInteger(safetyN)) errs.safety = 'Enter a whole number of days (0 or more).'
    setFieldErr(errs)
    if (Object.keys(errs).length) return

    setBusy(true)
    setError(null)
    try {
      const res = await storesApi.create({
        name: name.trim(),
        city: city.trim() || null,
        lead_time_days: leadN,
        safety_days: safetyN,
      })
      const created = res.data as { id: number }
      toast.success(`Store “${name.trim()}” created`)
      navigate(`/stores/${created.id}`)
    } catch (err) {
      setError(apiErrorMessage(err, 'The store could not be created.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <PageHeader
        title="Add store"
        subtitle="A store starts empty. Attach a dataset from the upload screen, or add items manually."
        breadcrumb={[{ label: 'Stores', to: '/stores' }, { label: 'Add store' }]}
      />

      <form className="card card-pad stack" onSubmit={submit} noValidate>
        <TextInput
          label="Store name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Grocery Main"
          error={fieldErr.name}
          maxLength={120}
          autoComplete="off"
        />
        <TextInput
          label="City"
          hint="Optional. Used as a label on the store card and in comparisons."
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="e.g. Bengaluru"
          maxLength={120}
          autoComplete="off"
        />
        <div className="grid grid-2">
          <TextInput
            label="Lead time (days)"
            hint="Supplier lead time for this store. Default matches the API (3)."
            type="number"
            min={0}
            step={1}
            value={lead}
            onChange={(e) => setLead(e.target.value)}
            error={fieldErr.lead}
          />
          <TextInput
            label="Safety stock (days)"
            hint="Buffer days used in reorder calculations. Default matches the API (2)."
            type="number"
            min={0}
            step={1}
            value={safety}
            onChange={(e) => setSafety(e.target.value)}
            error={fieldErr.safety}
          />
        </div>

        {error ? (
          <div className="degraded-banner" role="alert">
            <StoreIcon size={16} aria-hidden="true" style={{ marginTop: 2, flex: 'none' }} />
            <div>{error}</div>
          </div>
        ) : null}

        <div className="row" style={{ gap: 12 }}>
          <Button type="submit" loading={busy} icon={<StoreIcon size={16} />}>
            Create store
          </Button>
          <Link to="/stores" className="btn btn-ghost">
            <ArrowLeft size={16} aria-hidden="true" /> Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
