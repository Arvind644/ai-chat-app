import { NextResponse } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import OpenAI from "openai";

const openai = new OpenAI();

// Create a new ratelimiter, that allows 5 requests per 60 seconds
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '60 s'),
  analytics: true,
})

export async function POST(req: Request) {
  // Rate limiter check
  const ip = req.headers.get('x-forwarded-for') ?? '127.0.0.1'
  const { success } = await ratelimit.limit(ip)

  if (!success) {
    return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 })
  }

  try {
    const { messages } = await req.json()

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messages.map((message: { content: string, role: string }) => ({
        content: message.content,
        role: message.role,
      })),
    })

    const message = completion.choices[0].message?.content

    return NextResponse.json({ message })
  } catch {
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
