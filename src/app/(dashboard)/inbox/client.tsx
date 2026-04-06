"use client";

import { useEffect, useState, useRef } from "react";
import { format } from "date-fns";
import { Search, Send, FileText, Phone, MessageCircle, AlertCircle, Clock, Inbox, MoreVertical, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface Conversation {
  id: string;
  agent_type: "whatsapp" | "voice" | "sms";
  contact_id: string;
  contact_name: string | null;
  status: "open" | "closed" | "snoozed";
  last_message_at: string;
  created_at: string;
}

interface Message {
  id: string;
  direction: "inbound" | "outbound";
  role: "user" | "agent" | "system";
  content: string;
  created_at: string;
  status: string;
}

export default function InboxClient() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [messageInput, setMessageInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo(0, scrollRef.current.scrollHeight);
    }
  }, [messages]);

  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .order("last_message_at", { ascending: false });

      if (error) throw error;
      
      // Insert mock data if empty for demonstration
      if (!data || data.length === 0) {
        setConversations([
          {
            id: "mock-1",
            agent_type: "whatsapp",
            contact_id: "+1234567890",
            contact_name: "John Doe",
            status: "open",
            last_message_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
          },
          {
            id: "mock-2",
            agent_type: "voice",
            contact_id: "+0987654321",
            contact_name: "Jane Smith",
            status: "closed",
            last_message_at: new Date(Date.now() - 3600000).toISOString(),
            created_at: new Date(Date.now() - 3600000).toISOString(),
          }
        ]);
      } else {
        setConversations(data as Conversation[]);
      }
    } catch (error: any) {
      toast.error("Failed to load conversations: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    if (conversationId.startsWith("mock-")) {
      // Mock messages
      setMessages([
        {
          id: "m-1",
          direction: "inbound",
          role: "user",
          content: "Hi, I received a notification about an abandoned cart?",
          created_at: new Date(Date.now() - 60000).toISOString(),
          status: "delivered"
        },
        {
          id: "m-2",
          direction: "outbound",
          role: "agent",
          content: "Yes! You left some amazing items in your cart. Would you like a 10% discount to complete your purchase today?",
          created_at: new Date(Date.now() - 30000).toISOString(),
          status: "delivered"
        }
      ]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data as Message[]);
    } catch (error: any) {
      toast.error("Failed to load messages: " + error.message);
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation) return;

    const optimisticMessage: Message = {
      id: `m-${Date.now()}`,
      direction: "outbound",
      role: "agent",
      content: messageInput,
      created_at: new Date().toISOString(),
      status: "sent"
    };

    setMessages(prev => [...prev, optimisticMessage]);
    const currentInput = messageInput;
    setMessageInput("");

    if (selectedConversation.id.startsWith("mock-")) {
      return;
    }

    try {
      const { error } = await supabase.from("messages").insert({
        conversation_id: selectedConversation.id,
        direction: "outbound",
        role: "agent",
        content: currentInput,
        status: "sent",
      });

      if (error) throw error;

      await supabase.from("conversations").update({
        last_message_at: new Date().toISOString()
      }).eq("id", selectedConversation.id);

    } catch (error: any) {
      toast.error("Failed to send message: " + error.message);
      // Remove optimistic update if it failed
      setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
      setMessageInput(currentInput);
    }
  };

  const getAgentIcon = (type: string) => {
    switch (type) {
      case "whatsapp": return <MessageCircle className="h-4 w-4 text-emerald-500" />;
      case "voice": return <Phone className="h-4 w-4 text-sky-500" />;
      case "sms": return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex bg-zinc-950/40 rounded-3xl border border-white/5 h-full overflow-hidden backdrop-blur-xl">
      {/* Sidebar - Conversation List */}
      <div className="w-[380px] flex flex-col border-r border-white/5 bg-zinc-950/20">
        <div className="p-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full bg-zinc-900/50 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-700 transition-all text-white placeholder:text-zinc-600"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col gap-4 p-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse flex gap-4">
                  <div className="h-12 w-12 rounded-full bg-zinc-900" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-3 w-1/3 rounded bg-zinc-900" />
                    <div className="h-2 w-full rounded bg-zinc-900" />
                  </div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-zinc-500 px-6 text-center">
              <Inbox className="h-8 w-8 mb-3 opacity-20" />
              <p className="text-sm">No conversations found</p>
            </div>
          ) : (
            <div className="flex flex-col px-3 gap-1">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`group flex items-start gap-4 p-4 rounded-2xl transition-all duration-200 ${
                    selectedConversation?.id === conv.id 
                    ? "bg-zinc-800/80 shadow-lg ring-1 ring-white/10" 
                    : "hover:bg-zinc-900/40"
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center border border-white/5 shadow-inner">
                      <span className="text-sm font-semibold text-zinc-300">
                        {conv.contact_name ? conv.contact_name.substring(0, 2).toUpperCase() : conv.contact_id.substring(conv.contact_id.length - 2)}
                      </span>
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-zinc-900 rounded-full p-1 border border-white/5">
                      {getAgentIcon(conv.agent_type)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-semibold text-zinc-100 truncate">
                        {conv.contact_name || conv.contact_id}
                      </h4>
                      <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-tighter">
                        {format(new Date(conv.last_message_at), "h:mm a")}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 line-clamp-1 mt-0.5 font-medium">
                      StorePilot Assistant active...
                    </p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <div className={`h-1.5 w-1.5 rounded-full ${conv.status === 'open' ? 'bg-emerald-500' : 'bg-zinc-700'}`} />
                      <span className="text-[10px] font-bold text-zinc-500 uppercase">
                        {conv.status}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Area - Chat History */}
      <div className="flex-1 flex flex-col bg-zinc-950/40">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-6 border-b border-white/5 bg-zinc-950/40 backdrop-blur-md flex flex-row items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-zinc-800 flex items-center justify-center border border-white/5">
                  <span className="font-bold text-zinc-300">
                    {selectedConversation.contact_name 
                      ? selectedConversation.contact_name.substring(0, 2).toUpperCase() 
                      : selectedConversation.contact_id.substring(selectedConversation.contact_id.length - 2)}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">{selectedConversation.contact_name || selectedConversation.contact_id}</h3>
                  <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Agent Live</span>
                    <span className="text-zinc-700">•</span>
                    <span>{selectedConversation.contact_id}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="px-3 py-1.5 rounded-xl border border-white/5 bg-zinc-900/50 text-xs font-bold text-zinc-400">
                  {selectedConversation.agent_type.toUpperCase()}
                </div>
                <button className="p-2 rounded-xl border border-white/5 hover:bg-zinc-800 text-zinc-400 transition-colors">
                  <MoreVertical className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8" ref={scrollRef}>
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-zinc-600 gap-2">
                  <Clock className="h-10 w-10 opacity-20" />
                  <p className="font-medium">Waiting for interaction...</p>
                </div>
              ) : (
                <div className="max-w-4xl mx-auto space-y-6">
                  {messages.map((message) => {
                    const isUser = message.role === "user";
                    const isSystem = message.role === "system";

                    if (isSystem) {
                      return (
                         <div key={message.id} className="flex justify-center my-6">
                           <span className="bg-zinc-800/40 border border-white/5 px-4 py-1.5 rounded-2xl text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                             <Clock className="w-3 h-3" />
                             {message.content}
                           </span>
                         </div>
                      );
                    }

                    return (
                      <div
                        key={message.id}
                        className={`flex ${isUser ? "justify-start" : "justify-end"} items-end gap-3`}
                      >
                        {isUser && (
                          <div className="h-8 w-8 rounded-lg bg-zinc-800 flex items-center justify-center border border-white/5 shrink-0">
                            <span className="text-[10px] font-black text-zinc-500">U</span>
                          </div>
                        )}
                        <div
                          className={`max-w-[70%] group relative ${
                            isUser
                              ? "bg-zinc-900 text-zinc-200 rounded-2xl rounded-bl-sm border border-white/5"
                              : "bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-2xl rounded-br-sm shadow-xl"
                          } px-5 py-3.5`}
                        >
                          <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{message.content}</p>
                          <div
                            className={`text-[9px] mt-2 font-bold uppercase tracking-tighter ${
                              isUser ? "text-zinc-600" : "text-white/50"
                            }`}
                          >
                            {format(new Date(message.created_at), "h:mm a")} • {message.status.toUpperCase()}
                          </div>
                        </div>
                        {!isUser && (
                          <div className="h-8 w-8 rounded-lg bg-indigo-500 flex items-center justify-center shadow-lg shrink-0 overflow-hidden">
                             <MessageCircle className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-8 shrink-0">
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                className="max-w-4xl mx-auto relative group"
              >
                <div className="bg-zinc-900 border border-white/5 rounded-3xl p-2 pl-4 pr-16 flex items-center shadow-2xl focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:border-indigo-500/50 transition-all">
                  <Paperclip className="h-5 w-5 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer mr-3" />
                  <input
                    type="text"
                    placeholder="Type your message to takeover from AI..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-semibold text-white placeholder:text-zinc-600 py-3"
                  />
                  <div className="absolute right-4 flex items-center">
                    <button 
                      type="submit" 
                      disabled={!messageInput.trim()}
                      className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-20 text-white h-10 w-10 rounded-2xl flex items-center justify-center transition-all shadow-lg active:scale-95"
                    >
                      <Send className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-center gap-6">
                   <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                     <div className="h-2 w-2 rounded-full bg-emerald-500" />
                     <span className="text-[10px] font-black uppercase text-zinc-500 tracking-tighter">AI Assistant: Active</span>
                   </div>
                   <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                     <div className="h-2 w-2 rounded-full bg-zinc-700" />
                     <span className="text-[10px] font-black uppercase text-zinc-500 tracking-tighter">Human Takeover: Standby</span>
                   </div>
                </div>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 text-center px-12">
            <div className="h-24 w-24 rounded-3xl bg-zinc-900 border border-white/5 flex items-center justify-center mb-8 shadow-2xl ring-1 ring-white/5">
               <Inbox className="h-10 w-10 text-zinc-700" />
            </div>
            <h2 className="text-xl font-bold text-zinc-200 mb-2">Select a thread</h2>
            <p className="max-w-xs text-sm font-semibold leading-relaxed">
              Monitoring conversation flows in real-time. Pick an active thread to audit AI responses or intervene manually.
            </p>
          </div>
        )}
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.03);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.08);
        }
      `}</style>
    </div>
  );
}

