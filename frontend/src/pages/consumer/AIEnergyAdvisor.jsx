import React, { useState, useRef, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { aiService } from '../../services/aiService';
import { DEMO_AI_RECOMMENDATIONS } from '../../services/mockData';
import { Sparkles, Send, Bot, User, RefreshCw, AlertCircle } from 'lucide-react';

export const AIEnergyAdvisor = () => {
  const [messages, setMessages] = useState(DEMO_AI_RECOMMENDATIONS);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  const suggestedQuestions = [
    'Why is my electricity bill increasing?',
    'How can I reduce electricity consumption?',
    'Which appliances may be consuming more energy?',
    'How much could I save?',
    'What changes should I make this month?'
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || isLoading) return;

    const userMsg = { role: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await aiService.askAdvisor(text);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: response.reply,
          source: response.source
        }
      ]);
    } catch (err) {
      setError('Unable to get response from AI Energy Advisor. Please retry.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-cobalt-500 text-white flex items-center justify-center font-bold shadow-cobalt-sm">
            <Sparkles className="w-4 h-4 fill-white" />
          </div>
          <h2 className="text-2xl font-black text-midnight-900 tracking-tight">AI Energy Advisor</h2>
        </div>
        <p className="text-xs text-midnight-600 mt-1">
          Context-aware energy decision assistant. Ask tailored questions about your usage trends, tariff savings, or conservation recommendations.
        </p>
      </div>

      {/* Suggested Questions Pills */}
      <div className="space-y-2">
        <p className="text-[11px] font-mono text-midnight-500 uppercase tracking-wider">Suggested Questions</p>
        <div className="flex flex-wrap gap-2">
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q)}
              disabled={isLoading}
              className="text-xs px-3 py-1.5 rounded-xl border border-ivory-300 bg-white hover:border-cobalt-500 hover:bg-cobalt-50/50 text-midnight-800 transition-all text-left shadow-sm active:scale-[0.98]"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Conversation Card */}
      <div className="bg-white rounded-3xl border border-ivory-300 shadow-card flex flex-col h-[520px] overflow-hidden">
        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((m, index) => {
            const isBot = m.role === 'assistant';
            return (
              <div
                key={index}
                className={`flex items-start gap-3 ${isBot ? '' : 'flex-row-reverse'}`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    isBot
                      ? 'bg-midnight-900 text-cobalt-400 border border-midnight-700'
                      : 'bg-cobalt-500 text-white'
                  }`}
                >
                  {isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                <div
                  className={`p-4 rounded-2xl max-w-xl text-xs leading-relaxed whitespace-pre-line ${
                    isBot
                      ? 'bg-ivory-100 text-midnight-900 border border-ivory-200'
                      : 'bg-midnight-900 text-ivory-100'
                  }`}
                >
                  <p>{m.text}</p>
                  {m.source && (
                    <span className="block mt-2 text-[10px] font-mono text-midnight-500 border-t border-ivory-300/50 pt-1">
                      {m.source}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-midnight-900 text-cobalt-400 flex items-center justify-center">
                <Bot className="w-4 h-4 animate-pulse" />
              </div>
              <div className="bg-ivory-100 p-4 rounded-2xl border border-ivory-200 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cobalt-500 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-cobalt-500 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-cobalt-500 animate-bounce [animation-delay:0.4s]" />
                <span className="text-xs text-midnight-500 font-mono ml-1">Analyzing consumption profile...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-700">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>{error}</span>
              </div>
              <button
                onClick={() => handleSendMessage(inputMessage)}
                className="font-bold flex items-center gap-1 hover:underline"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Retry
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Bar */}
        <div className="p-4 bg-ivory-50 border-t border-ivory-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask WattWise AI about your energy usage..."
              disabled={isLoading}
              className="flex-1 bg-white border border-ivory-300 rounded-xl px-4 py-2.5 text-xs text-midnight-900 placeholder:text-midnight-400 focus:outline-none focus:ring-2 focus:ring-cobalt-500"
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!inputMessage.trim() || isLoading}
              leftIcon={Send}
            >
              Send
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AIEnergyAdvisor;

