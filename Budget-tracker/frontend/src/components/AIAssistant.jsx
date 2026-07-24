import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import apiClient from "../services/apiClient";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Send,
  X,
  Bot,
  RotateCcw,
  MessageSquare,
  AlertTriangle,
  TrendingUp,
  Wallet,
  Calendar,
  UserCheck
} from "lucide-react";

export default function AIAssistant() {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 100);
    }
  }, [isOpen, chatHistory, loading]);

  if (!isAuthenticated) return null;

  // Simple Markdown Parser (Escapes HTML, parses bold, italic, code, lists, headers)
  const renderMarkdown = (text) => {
    if (!text) return "";
    
    // 1. Escape HTML for safety
    let html = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // 2. Parse bold (**text**)
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

    // 3. Parse italic (*text*)
    html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");

    // 4. Parse inline code (`code`)
    html = html.replace(/`(.*?)`/g, "<code class='px-1.5 py-0.5 rounded bg-white/10 text-emerald-400 font-mono text-xs'>$1</code>");

    // 5. Parse line structure (Headers, Lists, Paragraphs, Code Blocks, Tables)
    const lines = html.split("\n");
    let inList = false;
    let listType = null; // 'ul' or 'ol'
    let inCodeBlock = false;
    let inTable = false;
    let tableHeaderDone = false;
    let processedLines = [];

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();

      // Handle Code Blocks (```)
      if (line.startsWith("```")) {
        if (inList) {
          processedLines.push(`</${listType}>`);
          inList = false;
          listType = null;
        }
        if (inTable) {
          processedLines.push(tableHeaderDone ? "</tbody></table></div>" : "</thead></table></div>");
          inTable = false;
          tableHeaderDone = false;
        }
        if (inCodeBlock) {
          processedLines.push("</code></pre>");
          inCodeBlock = false;
        } else {
          processedLines.push("<pre class='bg-gray-950 border border-white/10 p-3 rounded-xl text-[11px] font-mono my-2 overflow-x-auto text-violet-300'><code class='whitespace-pre'>");
          inCodeBlock = true;
        }
        continue;
      }

      if (inCodeBlock) {
        processedLines.push(line);
        continue;
      }

      // Handle Tables (| ... |)
      if (line.startsWith("|") && line.endsWith("|")) {
        if (inList) {
          processedLines.push(`</${listType}>`);
          inList = false;
          listType = null;
        }

        // Check if it is a separator row like |---|---|
        const isSeparator = line.replace(/[\s|:\-]/g, "") === "";
        if (isSeparator) {
          if (inTable && !tableHeaderDone) {
            processedLines.push("</thead><tbody class='divide-y divide-white/5'>");
            tableHeaderDone = true;
          }
          continue;
        }

        const cells = line.split("|").slice(1, -1).map(c => c.trim());

        if (!inTable) {
          processedLines.push("<div class='overflow-x-auto my-3 rounded-xl border border-white/10 bg-white/[0.02] shadow-sm'>");
          processedLines.push("<table class='min-w-full text-[11px] text-left text-gray-300'>");
          processedLines.push("<thead class='bg-white/[0.04] text-[10px] text-gray-400 uppercase font-semibold'>");
          processedLines.push("<tr>");
          cells.forEach(cell => {
            processedLines.push(`<th class='px-4 py-2 border-b border-white/10'>${cell}</th>`);
          });
          processedLines.push("</tr>");
          inTable = true;
          tableHeaderDone = false;
        } else {
          processedLines.push("<tr class='hover:bg-white/[0.02] transition-colors'>");
          cells.forEach(cell => {
            const tag = !tableHeaderDone ? "th" : "td";
            const classes = !tableHeaderDone ? "px-4 py-2 border-b border-white/10 font-semibold text-gray-300" : "px-4 py-2 text-gray-300";
            processedLines.push(`<${tag} class='${classes}'>${cell}</${tag}>`);
          });
          processedLines.push("</tr>");
        }
        continue;
      }

      // If we were in a table and this line is NOT a table row, close the table
      if (inTable) {
        processedLines.push(tableHeaderDone ? "</tbody></table></div>" : "</thead></table></div>");
        inTable = false;
        tableHeaderDone = false;
      }

      // Bullet Lists (- or *)
      if (line.startsWith("- ") || line.startsWith("* ")) {
        if (!inList || listType !== 'ul') {
          if (inList) processedLines.push(`</${listType}>`);
          processedLines.push("<ul class='list-disc pl-5 my-1.5 space-y-1 text-gray-300 text-sm'>");
          inList = true;
          listType = 'ul';
        }
        processedLines.push(`<li>${line.substring(2)}</li>`);
      } 
      // Numbered Lists (e.g. 1. 2.)
      else if (/^\d+\.\s/.test(line)) {
        const content = line.replace(/^\d+\.\s/, "");
        if (!inList || listType !== 'ol') {
          if (inList) processedLines.push(`</${listType}>`);
          processedLines.push("<ol class='list-decimal pl-5 my-1.5 space-y-1 text-gray-300 text-sm'>");
          inList = true;
          listType = 'ol';
        }
        processedLines.push(`<li>${content}</li>`);
      } 
      // Other text
      else {
        if (inList) {
          processedLines.push(`</${listType}>`);
          inList = false;
          listType = null;
        }

        if (line.startsWith("### ")) {
          processedLines.push(`<h4 class='text-xs font-bold text-violet-400 uppercase tracking-wide mt-3 mb-1'>${line.substring(4)}</h4>`);
        } else if (line.startsWith("## ")) {
          processedLines.push(`<h3 class='text-sm font-semibold text-white mt-4 mb-1.5 border-b border-white/5 pb-1'>${line.substring(3)}</h3>`);
        } else if (line.startsWith("# ")) {
          processedLines.push(`<h2 class='text-base font-bold text-white mt-4 mb-2 border-b border-white/10 pb-1'>${line.substring(2)}</h2>`);
        } else if (line === "") {
          processedLines.push("<div class='h-2'></div>");
        } else {
          processedLines.push(`<p class='my-1 text-gray-200 leading-relaxed text-sm'>${line}</p>`);
        }
      }
    }

    if (inList) {
      processedLines.push(`</${listType}>`);
    }
    if (inTable) {
      processedLines.push(tableHeaderDone ? "</tbody></table></div>" : "</thead></table></div>");
    }
    if (inCodeBlock) {
      processedLines.push("</code></pre>");
    }

    return processedLines.join("\n");
  };

  const handleSendMessage = async (msgText) => {
    const textToSend = msgText || message;
    if (!textToSend.trim()) return;

    // Add user message to state
    const newHistory = [...chatHistory, { role: "user", text: textToSend }];
    setChatHistory(newHistory);
    setMessage("");
    setLoading(true);
    setErrorMsg(null);

    try {
      // Send history mapped as raw text properties to backend
      const response = await apiClient.post("/api/ai/chat", {
        message: textToSend,
        history: chatHistory
      });

      setChatHistory([
        ...newHistory,
        { role: "model", text: response.data.reply }
      ]);
    } catch (err) {
      console.error("AI Assistant error:", err);
      let errMsg = "Something went wrong while talking to the assistant.";
      if (err?.response?.data) {
        errMsg = err.response.data.error || err.response.data.message || err.response.data.msg || errMsg;
      } else if (err?.message) {
        errMsg = err.message;
      }
      setErrorMsg(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearHistory = () => {
    setChatHistory([]);
    setErrorMsg(null);
  };

  const handleQuickAction = (actionText) => {
    handleSendMessage(actionText);
  };

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-gradient-to-r from-violet-600 via-indigo-600 to-indigo-700 text-white shadow-lg cursor-pointer hover:shadow-violet-500/20 hover:scale-105 active:scale-95 transition-all duration-300"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="relative">
          {/* Pulsing outer aura when closed */}
          {!isOpen && (
            <span className="absolute -inset-2 rounded-full bg-violet-500/30 animate-ping -z-10" />
          )}
          {isOpen ? <X className="w-6 h-6" /> : <Sparkles className="w-6 h-6 animate-pulse" />}
        </div>
      </motion.button>

      {/* Glassmorphic Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed bottom-24 right-6 w-96 h-[520px] max-w-[calc(100vw-3rem)] rounded-2xl border border-white/10 shadow-2xl bg-gray-950/90 backdrop-blur-xl flex flex-col overflow-hidden z-50 text-white"
          >
            {/* Header */}
            <div className="px-4 py-3 bg-white/[0.03] border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="p-1.5 rounded-lg bg-violet-500/10 text-violet-400">
                    <Bot className="w-5 h-5" />
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border border-gray-950 rounded-full" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm leading-none flex items-center gap-1">
                    FinAI Assistant
                    <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                  </h3>
                  <span className="text-[10px] text-emerald-400 font-medium">Online & Ready</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {chatHistory.length > 0 && (
                  <button
                    onClick={clearHistory}
                    title="Clear history"
                    className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-gradient-to-b from-transparent to-white/[0.01]">
              {chatHistory.length === 0 ? (
                /* Welcome Screen */
                <div className="h-full flex flex-col justify-center items-center text-center p-4 space-y-5">
                  <div className="p-4 rounded-full bg-violet-600/10 text-violet-400 border border-violet-500/20 animate-bounce">
                    <Bot className="w-10 h-10" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-white text-base">Meet FinAI</h4>
                    <p className="text-xs text-gray-400 max-w-[280px]">
                      I'm connected to your budgets, recent transactions, active subscriptions, and loans. Ask me anything to get started!
                    </p>
                  </div>

                  {/* Suggestion Pills */}
                  <div className="grid grid-cols-1 gap-2 w-full pt-2">
                    <button
                      onClick={() => handleQuickAction("Summarize my spending this month")}
                      className="p-2.5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-violet-600/10 hover:border-violet-500/30 text-left text-xs transition-all duration-200 flex items-center gap-2.5 group cursor-pointer text-gray-300 hover:text-white"
                    >
                      <TrendingUp className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                      <span>📊 Summarize my spending this month</span>
                    </button>
                    <button
                      onClick={() => handleQuickAction("Am I exceeding any of my budgets?")}
                      className="p-2.5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-violet-600/10 hover:border-violet-500/30 text-left text-xs transition-all duration-200 flex items-center gap-2.5 group cursor-pointer text-gray-300 hover:text-white"
                    >
                      <Wallet className="w-4 h-4 text-violet-400 group-hover:scale-110 transition-transform" />
                      <span>⚠️ Am I exceeding any of my budgets?</span>
                    </button>
                    <button
                      onClick={() => handleQuickAction("What subscriptions do I have active?")}
                      className="p-2.5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-violet-600/10 hover:border-violet-500/30 text-left text-xs transition-all duration-200 flex items-center gap-2.5 group cursor-pointer text-gray-300 hover:text-white"
                    >
                      <Calendar className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                      <span>🔄 What subscriptions do I have active?</span>
                    </button>
                    <button
                      onClick={() => handleQuickAction("Show my pending friend loans and loans summary")}
                      className="p-2.5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-violet-600/10 hover:border-violet-500/30 text-left text-xs transition-all duration-200 flex items-center gap-2.5 group cursor-pointer text-gray-300 hover:text-white"
                    >
                      <UserCheck className="w-4 h-4 text-teal-400 group-hover:scale-110 transition-transform" />
                      <span>💸 View pending friend loans list</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Chat Messages */
                <div className="space-y-4">
                  {chatHistory.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {msg.role !== "user" && (
                        <div className="w-7 h-7 rounded-full bg-violet-600/10 border border-violet-500/20 text-violet-400 flex items-center justify-center shrink-0 mr-2.5 mt-0.5">
                          <Bot className="w-4 h-4" />
                        </div>
                      )}
                      <div
                        className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-xs shadow-md border ${
                          msg.role === "user"
                            ? "bg-violet-600/20 border-violet-500/25 text-white"
                            : "bg-white/[0.03] border-white/5 text-gray-100"
                        }`}
                      >
                        {msg.role === "user" ? (
                          <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                        ) : (
                          <div
                            className="space-y-1.5"
                            dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }}
                          />
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Loading/Typing State */}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="w-7 h-7 rounded-full bg-violet-600/10 border border-violet-500/20 text-violet-400 flex items-center justify-center shrink-0 mr-2.5 mt-0.5">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div className="bg-white/[0.03] border border-white/5 text-gray-400 max-w-[78%] rounded-2xl px-3.5 py-3 flex items-center gap-1 shadow-md">
                        <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  )}

                  {/* Error State */}
                  {errorMsg && (
                    <div className="flex justify-start">
                      <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 max-w-[90%] rounded-2xl px-3.5 py-3 text-xs flex gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                        <div>
                          <p className="font-semibold text-rose-200">Assistant Offline</p>
                          <p className="mt-1 leading-normal text-gray-300">
                            {errorMsg.includes("Gemini API key is not configured") ? (
                              <>
                                Gemini API Key is missing. Ask the project administrator to add <strong>GEMINI_API_KEY</strong> to their backend <code>.env</code> file.
                              </>
                            ) : (
                              errorMsg
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Chat Footer */}
            <div className="p-3 bg-white/[0.01] border-t border-white/5 flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Ask FinAI..."
                  disabled={loading}
                  rows={1}
                  className="flex-1 bg-white/[0.03] hover:bg-white/[0.05] focus:bg-white/[0.07] border border-white/10 focus:border-violet-500/50 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 outline-none resize-none transition-all duration-200 custom-scrollbar max-h-16"
                  style={{ minHeight: "36px" }}
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={loading || !message.trim()}
                  className={`p-2 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer ${
                    loading || !message.trim()
                      ? "bg-white/[0.02] text-gray-600 border border-white/5 cursor-not-allowed"
                      : "bg-violet-600 hover:bg-violet-500 text-white shadow-md shadow-violet-600/10"
                  }`}
                >
                  <Send className="w-4.5 h-4.5" />
                </button>
              </div>
              <span className="text-[9px] text-center text-gray-600">
                FinAI can make mistakes. Powered by Mistral AI.
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
