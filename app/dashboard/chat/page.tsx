'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { ThumbsUpIcon, ThumbsDownIcon, RefreshCwIcon, SendIcon } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSend = async () => {
    if (inputMessage.trim() === '') return;
    const userMessage: Message = { role: "user", content: inputMessage };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      console.log('Sending request to /api/chat');
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        throw new Error(`Failed to get response from AI: ${response.status} ${response.statusText}`);
      }

      const aiResponse = await response.json();
      console.log('AI response:', aiResponse);

      const aiMessage: Message = { role: "assistant", content: aiResponse.content };
      setMessages((prevMessages) => [...prevMessages, aiMessage]);
    } catch (error: any) {
      console.error('Error in handleSend:', error);
      toast({
        title: 'Error',
        description: `Failed to get response from AI: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = async () => {
    if (messages.length > 0) {
      setIsLoading(true);
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: messages.slice(0, -1) }),
        });

        if (!response.ok) {
          throw new Error('Failed to regenerate response');
        }

        const aiResponse = await response.json();
        const regeneratedMessage: Message = { role: "assistant", content: aiResponse.content };
        setMessages((prevMessages) => [...prevMessages.slice(0, -1), regeneratedMessage]);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to regenerate response. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleRate = (rating: 'up' | 'down') => {
    if (messages.length > 0) {
      setMessages((prevMessages) => {
        const lastMessage = prevMessages[prevMessages.length - 1];
        if (lastMessage.role === "assistant") {
          return [
            ...prevMessages.slice(0, -1),
            { ...lastMessage, rating: rating }
          ];
        }
        return prevMessages;
      });
      toast({
        title: 'Rating Submitted',
        description: `You ${rating === 'up' ? 'liked' : 'disliked'} the message.`,
      });
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto h-[80vh] flex flex-col">
      <CardContent className="flex-grow overflow-hidden p-4">
        <ScrollArea className="h-full">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`mb-4 ${message.role === "user" ? 'text-right' : 'text-left'
                }`}
            >
              <div
                className={`inline-block p-2 rounded-lg ${message.role === "user"
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground'
                  }`}
              >
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
              {message.role === "assistant" && (
                <div className="mt-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleRate('up')}
                  >
                    <ThumbsUpIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleRate('down')}
                  >
                    <ThumbsDownIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleRegenerate}
                  >
                    <RefreshCwIcon className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="mb-4">
              <Skeleton className="h-10 w-3/4" />
            </div>
          )}
        </ScrollArea>
      </CardContent>
      <CardFooter className="p-4">
        <div className="flex w-full space-x-2">
          <Textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.ctrlKey && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type your message here... (Press Enter to send, Ctrl+Enter for new line)"
            className="flex-grow"
          />
          <Button onClick={handleSend} disabled={isLoading}>
            <SendIcon className="h-4 w-4 mr-2" />
            Send
          </Button>
        </div>
      </CardFooter>
    </Card >
  );
}