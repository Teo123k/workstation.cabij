'use client'

import React, { useEffect, useState } from 'react'
import { useFormFields } from '@payloadcms/ui'

import './index.scss'

export const ClientWorkspace: React.FC = () => {
  const clientIdField = useFormFields(([fields]) => fields.client_id)
  const clientId = clientIdField?.value as string

  const [workspaceData, setWorkspaceData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!clientId) return

    const fetchData = async () => {
      setLoading(true)
      try {
        const [
          assetsRes,
          strategiesRes,
          kitsRes,
          moodboardsRes,
          exportsRes,
          runsRes
        ] = await Promise.all([
          fetch(`/api/brand-assets?where[client_id][equals]=${clientId}&limit=100`),
          fetch(`/api/brand-strategies?where[client_id][equals]=${clientId}&limit=100`),
          fetch(`/api/brand-kits?where[client_id][equals]=${clientId}&limit=100`),
          fetch(`/api/brand-moodboards?where[client_id][equals]=${clientId}&limit=100`),
          fetch(`/api/brand-exports?where[client_id][equals]=${clientId}&limit=100`),
          fetch(`/api/agent-runs?where[client_id][equals]=${clientId}&limit=5&sort=-createdAt`)
        ])

        const assets = await assetsRes.json()
        const strategies = await strategiesRes.json()
        const kits = await kitsRes.json()
        const moodboards = await moodboardsRes.json()
        const exportsList = await exportsRes.json()
        const runs = await runsRes.json()

        setWorkspaceData({
          assets: assets.docs || [],
          strategies: strategies.docs || [],
          kits: kits.docs || [],
          moodboards: moodboards.docs || [],
          exportsList: exportsList.docs || [],
          runs: runs.docs || []
        })
      } catch (err) {
        console.error('Error fetching workspace data', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [clientId])

  if (!clientId) {
    return <div className="client-workspace">Save the client first to see the workspace.</div>
  }

  if (loading || !workspaceData) {
    return <div className="client-workspace">Loading workspace...</div>
  }

  const { assets, strategies, kits, moodboards, exportsList, runs } = workspaceData
  const activeKit = kits.find((k: any) => k.status === 'approved') || kits[0]
  const activeStrategy = strategies.find((s: any) => s.status === 'approved') || strategies[0]

  let readiness = { status: 'red', text: 'Missing Strategy or Kit' }
  if (activeStrategy && activeKit?.status === 'approved') {
    readiness = { status: 'green', text: 'Client Ready for Production' }
  } else if (activeStrategy || kits.length > 0) {
    readiness = { status: 'yellow', text: 'In Progress (Awaiting Approvals)' }
  }

  return (
    <div className="client-workspace">
      <div className={`readiness-panel status-${readiness.status}`}>
        <h3>Status: {readiness.text}</h3>
      </div>

      <div className="workspace-grid">
        <div className="workspace-column">
          <h4>Intake & References</h4>
          <div className="card">
            <h5>Assets ({assets.length})</h5>
            <ul>
              {assets.map((a: any) => (
                <li key={a.id}><a href={`/admin/collections/brand-assets/${a.id}`}>{a.platform} - {a.asset_type}</a></li>
              ))}
              {assets.length === 0 && <li>No assets found.</li>}
            </ul>
          </div>
        </div>

        <div className="workspace-column">
          <h4>Strategy & Kit</h4>
          <div className="card">
            <h5>Strategies ({strategies.length})</h5>
            <ul>
              {strategies.map((s: any) => (
                <li key={s.id}>
                  <a href={`/admin/collections/brand-strategies/${s.id}`}>
                    {s.target_audience ? 'Strategy Document' : 'Empty Strategy'} ({s.status})
                  </a>
                </li>
              ))}
              {strategies.length === 0 && <li>No strategies found.</li>}
            </ul>
            <h5>Brand Kits ({kits.length})</h5>
            <ul>
              {kits.map((k: any) => (
                <li key={k.id}>
                  <a href={`/admin/collections/brand-kits/${k.id}`}>
                    {k.direction_name} ({k.status})
                  </a>
                </li>
              ))}
              {kits.length === 0 && <li>No kits found.</li>}
            </ul>
          </div>
        </div>

        <div className="workspace-column">
          <h4>Visuals & Exports</h4>
          <div className="card">
            <h5>Moodboards ({moodboards.length})</h5>
            <ul>
              {moodboards.map((m: any) => (
                <li key={m.id}><a href={`/admin/collections/brand-moodboards/${m.id}`}>{m.board_type}</a></li>
              ))}
              {moodboards.length === 0 && <li>No moodboards generated.</li>}
            </ul>
            <h5>Exports ({exportsList.length})</h5>
            <ul>
              {exportsList.map((e: any) => (
                <li key={e.id}>
                  <a href={e.export_url} target="_blank" rel="noreferrer">{e.export_type} (Drive Link)</a>
                  {' '} | <a href={`/admin/collections/brand-exports/${e.id}`}>Edit</a>
                </li>
              ))}
              {exportsList.length === 0 && <li>No exports generated.</li>}
            </ul>
          </div>
        </div>
      </div>

      <div className="agent-runs">
        <h4>Recent Agent Runs</h4>
        <ul>
          {runs.map((r: any) => (
            <li key={r.id}>
              <strong>{r.agent_role}</strong>: {r.action_taken} 
              <br/><small>{new Date(r.createdAt).toLocaleString()}</small>
            </li>
          ))}
          {runs.length === 0 && <li>No agent runs recorded.</li>}
        </ul>
      </div>
    </div>
  )
}
