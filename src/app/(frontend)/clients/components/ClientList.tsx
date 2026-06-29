'use client'

import React, { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { bulkDeleteClients } from '../actions'

type ClientListProps = {
  clients: any[]
}

const formatDate = (value: string | null) => {
  if (!value) return 'No activity yet'
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

export const ClientList: React.FC<ClientListProps> = ({ clients }) => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(clients.map(c => c.client_id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    e.stopPropagation()
    if (e.target.checked) {
      setSelectedIds(prev => [...prev, id])
    } else {
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id))
    }
  }

  const handleDelete = () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} client(s)? This action cannot be undone.`)) {
      return
    }

    startTransition(async () => {
      const res = await bulkDeleteClients(selectedIds)
      if (res.success) {
        setSelectedIds([])
        router.refresh()
      } else {
        alert(res.error || 'Failed to delete clients')
      }
    })
  }

  return (
    <>
      <div className="client-list-head" aria-hidden="true">
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input 
            type="checkbox" 
            checked={clients.length > 0 && selectedIds.length === clients.length}
            onChange={handleSelectAll}
            aria-label="Select all clients"
          />
          Client
        </span>
        <span>Progress</span>
        <span>Next action</span>
        <span>Last activity</span>
      </div>

      {selectedIds.length > 0 && (
        <div style={{ padding: '12px', background: 'var(--color-error-100, #fee2e2)', borderBottom: '1px solid var(--color-error-200, #fecaca)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--color-error-700, #b91c1c)', fontWeight: 500 }}>
            {selectedIds.length} client(s) selected
          </span>
          <button 
            onClick={handleDelete}
            disabled={isPending}
            style={{ 
              background: 'var(--color-error-600, #dc2626)', 
              color: 'white', 
              border: 'none', 
              padding: '6px 12px', 
              borderRadius: '4px',
              cursor: isPending ? 'wait' : 'pointer',
              fontWeight: 500
            }}
          >
            {isPending ? 'Deleting...' : 'Delete Selected'}
          </button>
        </div>
      )}

      <div className="client-list">
        {clients.map((client) => (
          <div 
            className="client-list-row enhanced" 
            key={client.client_id}
            onClick={() => router.push(`/clients/${client.client_id}`)}
            style={{ cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <input 
                type="checkbox" 
                checked={selectedIds.includes(client.client_id)}
                onChange={(e) => handleSelect(e, client.client_id)}
                onClick={(e) => e.stopPropagation()}
                aria-label={`Select ${client.client_name}`}
              />
              <div className="client-primary">
                <strong>{client.client_name}</strong>
                <span>{client.client_id}</span>
              </div>
            </div>

            <div className="client-secondary">
              <div className="client-metrics" aria-label="Client progress">
                <span>{client.brief_count} briefs</span>
                <span>{client.strategy_count} strategies</span>
                <span>{client.kit_count} kits</span>
                <span>{client.asset_count} refs</span>
                <span>{client.export_count} exports</span>
              </div>
              <p className="client-row-summary">{client.state.summary}</p>
            </div>

            <div className="client-next-step">
              <mark className={`status-${client.state.tone}`}>{client.state.nextAction}</mark>
              <span>{client.approved_kit_count ? 'Approved direction exists' : client.status}</span>
            </div>

            <time>{formatDate(client.latest_activity_at || client.created_at)}</time>
          </div>
        ))}

        {!clients.length ? (
          <div className="toolbar-empty">
            <strong>No clients matched this view.</strong>
            <span>Try a broader search or switch filter.</span>
          </div>
        ) : null}
      </div>
    </>
  )
}
