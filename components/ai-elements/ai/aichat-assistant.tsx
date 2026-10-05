import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Send, Bot, User, Sparkles, ThumbsUp, ThumbsDown } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
}

interface AIChatAssistantProps {
  welcomeMessage?: string
  placeholder?: string
  onSendMessage?: (message: string) => void
  className?: string
  height?: string
}

export function AIChatAssistant({
  welcomeMessage = "Hello! I'm your AI assistant. How can I help you today?",
  placeholder = "Type your message here...",
  onSendMessage,
  className,
  height = "400px"
}: AIChatAssistantProps) {
  const MAX_MESSAGES = 100; // Limit messages to prevent memory issues
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: welcomeMessage,
      role: "assistant",
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null); // Track timeout for cleanup

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Cleanup old messages when limit is exceeded
  const addMessage = (message: Message) => {
    setMessages(prev => {
      const updated = [...prev, message];
      // Keep only the last MAX_MESSAGES to prevent memory issues
      if (updated.length > MAX_MESSAGES) {
        return updated.slice(updated.length - MAX_MESSAGES);
      }
      return updated;
    });
  }

  const handleSend = () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: "user",
      timestamp: new Date()
    }

    addMessage(userMessage)
    setInput("")
    setIsTyping(true)

    // Simulate AI response - store timeout ref for cleanup
    timeoutRef.current = setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: "I received your message. This is a simulated response.",
        role: "assistant",
        timestamp: new Date()
      }
      addMessage(aiResponse)
      setIsTyping(false)
      timeoutRef.current = null;
    }, 1000)

    onSendMessage?.(input)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className={cn("flex flex-col border rounded-lg overflow-hidden", className)}>
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-muted/50">
        <div className="p-2 rounded-lg bg-primary/10">
          <Bot className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">AI Assistant</h3>
          <p className="text-xs text-muted-foreground">Ready to help</p>
        </div>
        <div className="ml-auto">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-4"
        style={{ height }}
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-3",
              message.role === "user" && "flex-row-reverse"
            )}
          >
            <div
              className={cn(
                "flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center",
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
              )}
            >
              {message.role === "user" ? (
                <User className="h-4 w-4" />
              ) : (
                <Bot className="h-4 w-4" />
              )}
            </div>
            <div
              className={cn(
                "max-w-[80%] rounded-lg px-4 py-2",
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary"
              )}
            >
              <p className="text-sm">{message.content}</p>
              <p className="text-xs opacity-70 mt-1">
                {message.timestamp.toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
              
              {message.role === "assistant" && message.id !== "1" && (
                <div className="flex gap-2 mt-2">
                  <Button variant="secondary" size="sm" className="h-6 w-6 p-0">
                    <ThumbsUp className="h-3 w-3" />
                  </Button>
                  <Button variant="secondary" size="sm" className="h-6 w-6 p-0">
                    <ThumbsDown className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
              <Bot className="h-4 w-4" />
            </div>
            <div className="bg-secondary rounded-lg px-4 py-2">
              <div className="flex gap-1">
                <div className="h-2 w-2 rounded-full bg-muted-foreground animate-pulse" />
                <div className="h-2 w-2 rounded-full bg-muted-foreground animate-pulse" style={{ animationDelay: "0.2s" }} />
                <div className="h-2 w-2 rounded-full bg-muted-foreground animate-pulse" style={{ animationDelay: "0.4s" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            className="min-h-[60px] resize-none"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="self-end"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}