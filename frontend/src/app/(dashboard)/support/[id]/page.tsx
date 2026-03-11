"use client";

import { useGetTicketQuery, useReplyToTicketMutation, useUpdateTicketStatusMutation } from "@/store/api/supportApi";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";
import { useState } from "react";

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useGetTicketQuery(id);
  const [reply, { isLoading: replying }] = useReplyToTicketMutation();
  const [updateStatus] = useUpdateTicketStatusMutation();
  const [message, setMessage] = useState("");

  if (isLoading) return <div className="flex items-center justify-center h-64"><p>Loading...</p></div>;

  const ticket = data?.data;

  const handleReply = async () => {
    if (!message.trim()) return;
    await reply({ id, message: message.trim() });
    setMessage("");
  };

  return (
    <div className="space-y-6">
      <Link href="/support" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> Back to Tickets
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{ticket?.subject}</h1>
          <p className="text-sm text-gray-500 mt-1">by {ticket?.user?.name} &middot; {new Date(ticket?.createdAt).toLocaleString()}</p>
        </div>
        <div className="flex gap-2">
          {["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].map((s) => (
            <button
              key={s}
              onClick={() => updateStatus({ id, status: s })}
              className={`px-3 py-1.5 text-xs rounded-lg border ${
                ticket?.status === s ? "bg-primary text-white border-primary" : "hover:bg-gray-50"
              }`}
            >
              {s.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <p className="text-sm text-gray-700 whitespace-pre-wrap">{ticket?.description}</p>
      </div>

      {/* Messages */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Conversation</h3>
        <div className="space-y-4 max-h-[400px] overflow-y-auto mb-4">
          {ticket?.messages?.length === 0 ? (
            <p className="text-sm text-gray-500">No messages yet</p>
          ) : (
            ticket?.messages?.map((msg: any) => (
              <div key={msg.id} className={`flex ${msg.isAdmin ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[70%] rounded-lg p-3 ${
                  msg.isAdmin ? "bg-primary/10 text-gray-900" : "bg-gray-100 text-gray-900"
                }`}>
                  <p className="text-xs font-medium mb-1">{msg.isAdmin ? "Admin" : ticket?.user?.name}</p>
                  <p className="text-sm">{msg.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(msg.createdAt).toLocaleString()}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Reply Box */}
        <div className="flex gap-2 pt-4 border-t">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your reply..."
            className="flex-1 px-4 py-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-primary text-sm"
            onKeyDown={(e) => e.key === "Enter" && handleReply()}
          />
          <button
            onClick={handleReply}
            disabled={replying || !message.trim()}
            className="px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
