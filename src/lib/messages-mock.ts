export interface ChatMessage {
  id: string;
  fromMe: boolean;
  text: string;
  createdAt: number;
}

export interface Conversation {
  id: string;
  name: string;
  avatarColor: string;
  messages: ChatMessage[];
}

const MIN = 60 * 1000;

export const initialConversations: Conversation[] = [
  {
    id: "c1",
    name: "coach_maria",
    avatarColor: "bg-pink-500/40",
    messages: [
      { id: "m1", fromMe: false, text: "Olá! Vi o teu post sobre pernas, queres que te mande um plano?", createdAt: Date.now() - 60 * MIN },
      { id: "m2", fromMe: true, text: "Sim, era ótimo! Obrigado.", createdAt: Date.now() - 58 * MIN },
      { id: "m3", fromMe: false, text: "Envio-te logo à noite. Treinas em casa ou ginásio?", createdAt: Date.now() - 55 * MIN },
    ],
  },
  {
    id: "c2",
    name: "rafa_lifts",
    avatarColor: "bg-orange-500/40",
    messages: [
      { id: "m4", fromMe: true, text: "Bro, qual foi o teu PR no agacha?", createdAt: Date.now() - 6 * 60 * MIN },
      { id: "m5", fromMe: false, text: "180kg na semana passada 💪", createdAt: Date.now() - 5 * 60 * MIN },
    ],
  },
  {
    id: "c3",
    name: "ana_fit",
    avatarColor: "bg-purple-500/40",
    messages: [
      { id: "m6", fromMe: false, text: "Treinas amanhã?", createdAt: Date.now() - 26 * 60 * MIN },
    ],
  },
];
