'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { companyData } from '@/lib/company-data'

export default function CompanyQABot() {
  const [messages, setMessages] = useState<Array<{ role: string, content: string }>>([
    { role: 'assistant', content: `Hello! I'm the AI assistant for ${companyData.name}. How can I help you today?` }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

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
      setMessages([...newMessages, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>{companyData.name} Assistant</CardTitle>
          <CardDescription>{companyData.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {messages.map((m, index) => (
              <div key={index} className={`p-2 rounded-lg ${m.role === 'user' ? 'bg-blue-100' : 'bg-green-100'}`}>
                <span className="font-bold">{m.role === 'user' ? 'You: ' : 'Assistant: '}</span>
                {m.content}
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <form onSubmit={handleSubmit} className="flex w-full space-x-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about our products, services, policies..."
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
