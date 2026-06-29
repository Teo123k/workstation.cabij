'use client'

import React, { useEffect, useState } from 'react'
import './index.scss'

export const AgencyDashboard: React.FC = () => {
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await fetch('/api/clients?limit=50&sort=-createdAt')
        const data = await res.json()
        setClients(data.docs || [])
      } catch (err) {
        console.error('Failed to load clients', err)
      } finally {
        setLoading(false)
      }
    }
    fetchClients()
  }, [])

  return (
    <div className="agency-dashboard-container">
      <header className="dashboard-header">
        <h1>Agency Command Center</h1>
        <p>Open the client workspace first for daily operations, then use collection screens only when you need raw records.</p>
        <div className="dashboard-primary-links">
          <a href="/clients" className="workspace-link">
            Open workspace
          </a>
          <a href="/admin/collections/clients" className="workspace-link secondary">
            Raw clients collection
          </a>
        </div>
      </header>

      <div className="dashboard-content">
        {loading ? (
          <p>Loading active clients...</p>
        ) : (
          <div className="client-grid">
            <a href="/admin/collections/clients/create" className="client-card new-client-card">
              <div className="card-content">
                <h2>+ New Client</h2>
                <p>Create a blank project</p>
              </div>
            </a>
            
            {clients.map(client => (
              <a key={client.id} href={`/clients/${client.client_id}`} className="client-card">
                <div className="card-content">
                  <h2>{client.client_name}</h2>
                  <p className={`status-badge status-${client.status}`}>
                    {client.status}
                  </p>
                  <small className="client-id">ID: {client.client_id}</small>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
      
      <div className="dashboard-footer">
        <h3>Collection shortcuts</h3>
        <div className="quick-links">
          <a href="/admin/collections/brand-assets">Global Assets</a>
          <a href="/admin/collections/brand-strategies">Strategies</a>
          <a href="/admin/collections/brand-kits">Brand Kits</a>
          <a href="/admin/collections/brand-moodboards">Moodboards</a>
          <a href="/admin/collections/brand-exports">Exports</a>
        </div>
      </div>
    </div>
  )
}
