import { create } from 'zustand';

interface ChatSession {
    ticketId: string;
    ticketTitulo: string;
    minimized: boolean;
}

interface ChatStore {
    openChats: ChatSession[];

    openChat: (ticketId: string, ticketTitulo: string) => void;
    closeChat: (ticketId: string) => void;
    minimizeChat: (ticketId: string) => void;
    maximizeChat: (ticketId: string) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
    openChats: [],

    openChat: (ticketId, ticketTitulo) => set((state) => {
        // If already open, just ensure it's not minimized (optional logic) or do nothing
        if (state.openChats.find(c => c.ticketId === ticketId)) {
            return state;
        }
        // Limit max 3 chats for UI sanity
        const current = state.openChats;
        if (current.length >= 3) {
            return { openChats: [...current.slice(1), { ticketId, ticketTitulo, minimized: false }] };
        }
        return { openChats: [...current, { ticketId, ticketTitulo, minimized: false }] };
    }),

    closeChat: (ticketId) => set((state) => ({
        openChats: state.openChats.filter(c => c.ticketId !== ticketId)
    })),

    minimizeChat: (ticketId) => set((state) => ({
        openChats: state.openChats.map(c =>
            c.ticketId === ticketId ? { ...c, minimized: true } : c
        )
    })),

    maximizeChat: (ticketId) => set((state) => ({
        openChats: state.openChats.map(c =>
            c.ticketId === ticketId ? { ...c, minimized: false } : c
        )
    }))
}));
