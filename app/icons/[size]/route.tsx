import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { ImageResponse } from 'next/og'

const SIZES = new Set([180, 192, 512])

export async function GET(_req: Request, { params }: { params: Promise<{ size: string }> }) {
  const size = Number((await params).size)
  if (!SIZES.has(size)) return new Response('Not found', { status: 404 })

  const file = await readFile(path.join(process.cwd(), 'public', 'app-icon.png'))
  const src = `data:image/png;base64,${file.toString('base64')}`

  return new ImageResponse(
    (
      <div style={{ display: 'flex', width: '100%', height: '100%', background: '#0d2e1f' }}>
        <img src={src} alt="" width={size} height={size} />
      </div>
    ),
    {
      width: size,
      height: size,
      headers: { 'Cache-Control': 'public, max-age=86400' },
    },
  )
}
