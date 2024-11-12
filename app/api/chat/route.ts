import { NextResponse } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import OpenAI from "openai";
import { companyData } from '@/lib/company-data';

const openai = new OpenAI();

// Create a new ratelimiter, that allows 5 requests per 60 seconds
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '60 s'),
  analytics: true,
})

const generateSystemPrompt = (data: typeof companyData) => `
You are an AI assistant for ${data.name}. ${data.description}
Your role is to answer customer questions about our products, services, policies, and general inquiries.
Here are some key details about our company:

1. Products: ${data.products.join(', ')}
2. Services: ${data.services.join(', ')}
3. Support policy: ${data.policies.support}
4. Refund policy: ${data.policies.refund}
5. Privacy policy: ${data.policies.privacy}

Please provide helpful, concise answers to customer questions based on this information.
If you don't know the answer to a specific question, politely say so and offer to connect the customer with a human representative using our contact information:
Email: ${data.contactInfo.email}
Phone: ${data.contactInfo.phone}
`

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
      messages: [
        { role: 'system', content: generateSystemPrompt(companyData) },
        ...messages.map((message: { content: string, role: string }) => ({
          content: message.content,
          role: message.role,
        })),
      ],
    })

    const message = completion.choices[0].message?.content

    return NextResponse.json({ message })
  } catch {
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
