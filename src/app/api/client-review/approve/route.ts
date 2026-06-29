import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function POST(request: Request) {
  const formData = await request.formData();
  const token = formData.get('token') as string;
  const brandKitId = formData.get('brand_kit_id') as string;

  if (!token || !brandKitId) {
    return NextResponse.json({ error: 'Missing token or brand_kit_id' }, { status: 400 });
  }

  // 1. Validate the token and fetch the associated client_id
  const tokenRes = await pool.query(
    `
      SELECT client_id, expires_at
      FROM client_review_token
      WHERE token = $1
      LIMIT 1
    `,
    [token],
  );

  if (tokenRes.rows.length === 0) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 403 });
  }

  const { client_id, expires_at } = tokenRes.rows[0];
  const now = new Date();
  if (now > new Date(expires_at)) {
    return NextResponse.json({ error: 'Token expired' }, { status: 403 });
  }

  // 2. Mark the selected brand kit as 'approved' and others as 'superseded' for this client
  const updateRes = await pool.query(
    `
      WITH update_approved AS (
        UPDATE brand_kit
        SET status = 'approved', approved_at = NOW()
        WHERE brand_kit_id = $1 AND client_id = $2
        RETURNING brand_kit_id
      ),
      update_others AS (
        UPDATE brand_kit
        SET status = 'superseded'
        WHERE client_id = $2
          AND brand_kit_id != $1
          AND status = 'draft'
          AND EXISTS (SELECT 1 FROM update_approved)
      )
      SELECT count(*)::int AS approved_count
      FROM update_approved;
    `,
    [brandKitId, client_id],
  );

  if (!updateRes.rows[0]?.approved_count) {
    return NextResponse.json({ error: 'Failed to update approval status' }, { status: 500 });
  }

  // Redirect back to the review portal so the client sees the "Approved Selection" UI
  return NextResponse.redirect(new URL(`/client-review/${token}`, request.url));
}
