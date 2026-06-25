import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { streamCopilotResponse } from '@/lib/ai/copilot'
import type { ScanResult, CopilotMessage } from '@/types'

export async function POST(
  req: NextRequest,
  { params }: { params: { siteId: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { message } = await req.json()
  if (!message?.trim()) return NextResponse.json({ error: 'Message required' }, { status: 400 })

  // Get site + latest scan data
  const { data: site } = await supabase.from('sites').select('*').eq('id', params.siteId).single()
  if (!site) return NextResponse.json({ error: 'Site not found' }, { status: 404 })

  const { data: scans } = await supabase
    .from('scans').select('*').eq('site_id', params.siteId)
    .eq('status', 'complete').order('completed_at', { ascending: false }).limit(1)

  const latestScan = scans?.[0]
  if (!latestScan) return NextResponse.json({ error: 'No completed scan found. Run a scan first.' }, { status: 400 })

  const { data: findings } = await supabase
    .from('findings').select('*').eq('scan_id', latestScan.id)

  // Build scan result context
  const scanResult = {
    ...latestScan,
    site,
    site_id: params.siteId,
    categories: [],
    allFindings: findings || [],
  } as unknown as ScanResult

  // Get chat history (last 10 messages)
  const { data: history } = await supabase
    .from('copilot_messages')
    .select('*')
    .eq('site_id', params.siteId)
    .order('created_at', { ascending: false })
    .limit(10)

  const historyOrdered: CopilotMessage[] = (history || []).reverse()

  // Save user message
  await supabase.from('copilot_messages').insert({
    site_id: params.siteId,
    user_id: user.id,
    role: 'user',
    content: message,
  })

  // Stream AI response
  const encoder = new TextEncoder()
  let fullResponse = ''

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of streamCopilotResponse(message, historyOrdered, scanResult)) {
          fullResponse += chunk
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`))
        }

        // Save assistant response
        await supabase.from('copilot_messages').insert({
          site_id: params.siteId,
          user_id: user.id,
          role: 'assistant',
          content: fullResponse,
        })

        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      } catch (err) {
        controller.error(err)
      }
    },
  })

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { siteId: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: messages } = await supabase
    .from('copilot_messages')
    .select('*')
    .eq('site_id', params.siteId)
    .order('created_at', { ascending: true })
    .limit(50)

  return NextResponse.json(messages || [])
}
