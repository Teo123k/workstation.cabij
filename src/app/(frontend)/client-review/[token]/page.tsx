import React from 'react';
import { notFound } from 'next/navigation';
import { Pool } from 'pg';

export const dynamic = 'force-dynamic';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function fetchTokenData(token: string) {
  const res = await pool.query(
    `
      SELECT crt.client_id, crt.brand_kit_ids, crt.expires_at,
             c.client_name
      FROM client_review_token crt
      JOIN client c ON c.client_id = crt.client_id
      WHERE crt.token = $1
      LIMIT 1
    `,
    [token],
  );

  return res.rows[0] || null;
}

async function fetchBrandKits(kitIds: string[]) {
  const res = await pool.query(
    `
      SELECT brand_kit_id, direction_name, colors_json, typography_json, logo_direction, photography_style, social_media_vibe, status
      FROM brand_kit
      WHERE brand_kit_id = ANY($1::text[])
      ORDER BY created_at ASC
    `,
    [kitIds],
  );

  return res.rows;
}

export default async function ClientReviewPage({ params }: { params: { token: string } }) {
  const tokenData = await fetchTokenData(params.token);
  
  if (!tokenData) {
    return notFound();
  }
  
  const now = new Date();
  const expiresAt = new Date(tokenData.expires_at);
  if (now > expiresAt) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center font-sans p-6">
        <div className="bg-[#111] border border-[#222] p-8 rounded-xl max-w-md text-center">
          <h1 className="text-2xl font-semibold mb-4 text-red-400">Link Expired</h1>
          <p className="text-gray-400">This review link has expired. Please contact your agency for a new link.</p>
        </div>
      </div>
    );
  }

  const kits = await fetchBrandKits(tokenData.brand_kit_ids);
  if (!kits || kits.length === 0) {
    return notFound();
  }

  // Check if any kit is already approved
  const isApproved = kits.some((k: any) => k.status === 'approved');

  return (
    <div className="min-h-screen bg-[#050505] text-[#eee] font-sans">
      <header className="bg-[#0f0f0f] border-b border-[#222] px-8 py-6 flex justify-between items-center sticky top-0 z-50">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1">Brand Presentation</p>
          <h1 className="text-xl font-medium tracking-wide">{tokenData.client_name}</h1>
        </div>
        {isApproved && (
          <div className="px-4 py-2 bg-green-900/30 text-green-400 border border-green-800 rounded-full text-sm font-medium">
            Direction Approved
          </div>
        )}
      </header>

      <main className="p-8 max-w-[1600px] mx-auto">
        <div className="mb-12">
          <h2 className="text-3xl font-light tracking-tight mb-4">Select Your Brand Direction</h2>
          <p className="text-gray-400 max-w-2xl leading-relaxed text-lg">
            Review the conceptual directions below. Each direction represents a unique strategic angle for your brand. 
            Once you find the direction that aligns best with your vision, click Approve.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {kits.map((kit: any) => (
            <div key={kit.brand_kit_id} className={`flex flex-col bg-[#111] rounded-2xl border ${kit.status === 'approved' ? 'border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.1)]' : 'border-[#222]'} overflow-hidden transition-all duration-300`}>
              <div className="p-8 border-b border-[#222]">
                <h3 className="text-2xl font-medium tracking-tight mb-2">{kit.direction_name}</h3>
                {kit.status === 'approved' && <span className="text-xs uppercase tracking-wider text-green-400 font-semibold">Approved Selection</span>}
              </div>
              
              <div className="p-8 flex-grow space-y-10">
                <section>
                  <h4 className="text-xs uppercase tracking-widest text-gray-500 mb-4 font-semibold">Color Palette</h4>
                  <div className="flex gap-3 flex-wrap">
                    {(kit.colors_json || []).map((color: any, idx: number) => (
                      <div key={idx} className="group relative">
                        <div 
                          className="w-12 h-12 rounded-full border border-white/10 shadow-inner" 
                          style={{ backgroundColor: color.hex }}
                        />
                        <div className="absolute opacity-0 group-hover:opacity-100 -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black text-xs px-2 py-1 rounded transition-opacity">
                          {color.name} ({color.hex})
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <h4 className="text-xs uppercase tracking-widest text-gray-500 mb-4 font-semibold">Typography</h4>
                  <div className="space-y-3 bg-[#0a0a0a] p-4 rounded-lg border border-[#1a1a1a]">
                    <div>
                      <span className="text-[10px] text-gray-500 uppercase">Heading</span>
                      <p className="text-lg font-medium">{kit.typography_json?.heading_font || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 uppercase">Body</span>
                      <p className="text-sm text-gray-300">{kit.typography_json?.body_font || 'N/A'}</p>
                    </div>
                  </div>
                </section>

                <section>
                  <h4 className="text-xs uppercase tracking-widest text-gray-500 mb-4 font-semibold">Photography & Vibe</h4>
                  <p className="text-sm text-gray-400 leading-relaxed mb-4">{kit.photography_style}</p>
                  <p className="text-sm text-gray-400 leading-relaxed italic border-l-2 border-gray-700 pl-4">{kit.social_media_vibe}</p>
                </section>
              </div>

              {!isApproved && (
                <div className="p-6 bg-[#0a0a0a] border-t border-[#222] mt-auto">
                  <form action="/api/client-review/approve" method="POST">
                    <input type="hidden" name="token" value={params.token} />
                    <input type="hidden" name="brand_kit_id" value={kit.brand_kit_id} />
                    <button 
                      type="submit"
                      className="w-full py-4 bg-white text-black font-semibold rounded-xl hover:bg-gray-200 transition-colors"
                    >
                      Approve This Direction
                    </button>
                  </form>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
