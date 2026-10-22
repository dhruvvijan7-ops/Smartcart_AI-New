import { ExternalLink, FileSpreadsheet, Info } from 'lucide-react'
import { Link } from 'react-router-dom'

interface Dataset {
  name: string
  publisher: string
  url: string
  rows: string
  format: string
  /** Best-fit description of what this file unlocks in SmartCart. */
  unlocks: string
  /** Column headers in the file that map to SmartCart fields. */
  columns: string[]
  /** True when the file is a near 1:1 match for the upload schema. */
  bestFit?: boolean
}

const DATASETS: Dataset[] = [
  {
    name: 'Grocery Inventory and Sales Dataset',
    publisher: 'Salahuddin Ahmed Shuvo · Kaggle',
    url: 'https://www.kaggle.com/datasets/salahuddinahmedshuvo/grocery-inventory-and-sales-dataset',
    rows: '990 products',
    format: 'CSV',
    unlocks: 'Everything at once — expiry bands, sales rankings, profit and reorder recommendations.',
    columns: [
      'Product_Name → product name',
      'Catagory → category',
      'Stock_Quantity → stock',
      'Reorder_Level → reorder level',
      'Reorder_Quantity → reorder quantity',
      'Unit_Price → unit price',
      'Sales_Volume → units sold',
      'Date_Received → received date',
      'Last_Order_Date → last order date',
      'Expiration_Date → expiry date',
    ],
    bestFit: true,
  },
  {
    name: 'Managing Perishable Inventory Data',
    publisher: 'Minahil Fatima · Kaggle',
    url: 'https://www.kaggle.com/datasets/minahilfatima12328/managing-perishable-inventory-data',
    rows: '100k rows · 42 cols',
    format: 'CSV',
    unlocks: 'Deep expiry + shelf-life analytics across many stores (use the store filter on upload).',
    columns: [
      'product_name → product name',
      'category → category',
      'store_id → store filter',
      'transaction_date → received date',
      'expiration_date → expiry date',
      'shelf_life_days',
    ],
  },
  {
    name: 'SuperMarket Sales',
    publisher: 'Paramvir_705 · Kaggle',
    url: 'https://www.kaggle.com/datasets/paramvir705/supermarket-sales',
    rows: '1,000 invoices',
    format: 'CSV',
    unlocks: 'Sales + revenue analytics. Map "Product line" to category and "Quantity" to units sold.',
    columns: [
      'Product line → category',
      'Unit price → unit price',
      'Quantity → units sold',
      'Total → (revenue)',
      'Date → received date',
      'City → (store)',
    ],
  },
]

export default function DatasetLinks({ compact = false }: { compact?: boolean }) {
  return (
    <div className="card card-pad">
      <div className="row-between" style={{ gap: 12, alignItems: 'flex-start' }}>
        <div>
          <h3 className="row" style={{ fontSize: '0.98rem', fontWeight: 700, gap: 8 }}>
            <FileSpreadsheet size={15} aria-hidden="true" /> Need a real dataset?
          </h3>
          <p className="text-secondary" style={{ fontSize: '0.82rem', marginTop: 4 }}>
            SmartCart ships with no bundled data. Download one of these public datasets, then upload it to a store to
            power live analytics.
          </p>
        </div>
      </div>

      <div className="stack" style={{ gap: 12, marginTop: 14 }}>
        {(compact ? DATASETS.slice(0, 2) : DATASETS).map((d) => (
          <div
            key={d.url}
            style={{
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              background: d.bestFit ? 'color-mix(in srgb, var(--brand, #ef8557) 5%, transparent)' : undefined,
            }}
          >
            <div className="row-between" style={{ gap: 10, alignItems: 'flex-start' }}>
              <div className="min-w-0">
                <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{d.name}</span>
                  {d.bestFit ? <span className="chip">Best fit</span> : null}
                </div>
                <div className="text-faint" style={{ fontSize: '0.74rem', marginTop: 2 }}>
                  {d.publisher} · {d.rows} · {d.format}
                </div>
              </div>
              <a
                href={d.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-sm"
                style={{ flex: 'none' }}
              >
                Download <ExternalLink size={13} aria-hidden="true" />
              </a>
            </div>

            <p className="text-secondary" style={{ fontSize: '0.8rem', marginTop: 8 }}>
              {d.unlocks}
            </p>

            <details style={{ marginTop: 8 }}>
              <summary
                className="text-faint"
                style={{ fontSize: '0.76rem', cursor: 'pointer', userSelect: 'none' }}
              >
                Column mapping ({d.columns.length})
              </summary>
              <ul
                className="text-secondary"
                style={{ fontSize: '0.76rem', marginTop: 6, paddingLeft: 18, lineHeight: 1.7 }}
              >
                {d.columns.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </details>
          </div>
        ))}
      </div>

      <div
        className="row"
        style={{ gap: 8, marginTop: 14, alignItems: 'flex-start', fontSize: '0.78rem' }}
      >
        <Info size={14} aria-hidden="true" style={{ marginTop: 1, flex: 'none' }} className="text-faint" />
        <div className="text-faint">
          Dates must be <code>yyyy-mm-dd</code>, <code>M/d/yyyy</code> or <code>dd-mm-yyyy</code> — any other format
          discards the row. Only a <strong>product name</strong> column is required; the more columns you map, the
          more analytics unlock. See the full expected schema in the{' '}
          <Link to="/history">data health</Link> guide.
        </div>
      </div>
    </div>
  )
}
