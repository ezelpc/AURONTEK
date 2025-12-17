import React from 'react';
import { useChatStore } from '@/store/chat.store';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { X, Minus, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const FloatingChatContainer = () => {
    const { openChats, closeChat, minimizeChat, maximizeChat } = useChatStore();

    if (openChats.length === 0) return null;

    return (
        <div className="fixed bottom-0 right-10 z-[100] flex gap-6 items-end pointer-events-none">
            {openChats.map((chat) => (
                <div key={chat.ticketId} className="pointer-events-auto flex flex-col items-end">
                    {chat.minimized ? (
                        <div
                            className="bg-white border border-slate-200 shadow-lg rounded-t-lg p-3 w-64 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                            onClick={() => maximizeChat(chat.ticketId)}
                        >
                            <div className="flex items-center gap-2 truncate">
                                <div className="h-2 w-2 rounded-full bg-green-500" />
                                <span className="text-sm font-medium truncate">{chat.ticketTitulo}</span>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => { e.stopPropagation(); closeChat(chat.ticketId); }}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </div>
                    ) : (
                        <div className="bg-white border border-slate-200 shadow-xl rounded-t-lg w-80 flex flex-col h-[450px]">
                            {/* Header */}
                            <div
                                className="flex items-center justify-between p-3 border-b border-slate-100 bg-slate-50 rounded-t-lg cursor-pointer"
                                onClick={() => minimizeChat(chat.ticketId)}
                            >
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <MessageSquare className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                    <span className="text-sm font-semibold truncate">{chat.ticketTitulo}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={(e) => { e.stopPropagation(); minimizeChat(chat.ticketId); }}
                                    >
                                        <Minus className="h-3 w-3" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 hover:bg-red-100 hover:text-red-500"
                                        onClick={(e) => { e.stopPropagation(); closeChat(chat.ticketId); }}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>

                            {/* Body: Reuse ChatWindow code but adapted? 
                                Actually, ChatWindow expects ticketId prop. 
                                We might need to wrap it to fit in this height better or just use it as is.
                            */}
                            <div className="flex-1 overflow-hidden relative flex flex-col">
                                <ChatWindow ticketId={chat.ticketId} />
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};
