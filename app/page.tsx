'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"

export default function ChatComponent() {
  const [messages, setMessages] = useState<Array<{ role: string, content: string }>>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [rateLimitTest, setRateLimitTest] = useState<string[]>([])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() === '') return

    setIsLoading(true)
    const newMessages = [...messages, { role: 'user', content: input }]
    setMessages(newMessages)
    setInput('')

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: newMessages }),
      })

      if (!response.ok) {
        throw new Error(response.statusText)
      }

      const data = await response.json()
      setMessages([...newMessages, { role: 'assistant', content: data.message }])
    } catch (error) {
      console.error('Error:', error)
      setMessages([...newMessages, { role: 'assistant', content: 'Sorry, an error occurred. Please try again.' }])
    } finally {
      setIsLoading(false)
    }
  }

  const testRateLimit = async () => {
    setRateLimitTest([])
    for (let i = 0; i < 10; i++) {
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ messages: [{ role: 'user', content: 'Test message' }] }),
        })

        if (response.ok) {
          setRateLimitTest(prev => [...prev, `Request ${i + 1}: OK`])
        } else {
          setRateLimitTest(prev => [...prev, `Request ${i + 1}: Rate limited`])
        }
      } catch {
        setRateLimitTest(prev => [...prev, `Request ${i + 1}: Error`])
      }
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>AI Chat</CardTitle>
          <CardDescription>Chat with an AI assistant</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {messages.map((m, index) => (
              <div key={index} className={`p-2 rounded-lg ${m.role === 'user' ? 'bg-blue-100' : 'bg-green-100'}`}>
                <span className="font-bold">{m.role === 'user' ? 'You: ' : 'AI: '}</span>
                {m.content}
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Button onClick={testRateLimit}>Test Rate Limit</Button>
            {rateLimitTest.map((result, index) => (
              <div key={index} className="text-sm mt-1">{result}</div>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <form onSubmit={handleSubmit} className="flex w-full space-x-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Say something..."
              className="flex-grow"
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Send'}
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  )
}
