export interface CommunityReply {
  id: string;
  author: string;
  avatarColor: string;
  content: string;
  createdAt: number;
}

export interface CommunityPost {
  id: string;
  author: string;
  avatarColor: string;
  title: string;
  content: string;
  hashtags: string[];
  upvotes: number;
  createdAt: number;
  replies: CommunityReply[];
}

const HOUR = 3600 * 1000;

export const initialPosts: CommunityPost[] = [
  {
    id: "p1",
    author: "rafa_lifts",
    avatarColor: "bg-orange-500/30",
    title: "Alguém tem uma boa rotina para pernas uma vez por semana?",
    content:
      "Treino 4x por semana e só consigo dedicar um dia a pernas. Querem partilhar a vossa rotina? Foco em hipertrofia.",
    hashtags: ["pernas", "hipertrofia"],
    upvotes: 42,
    createdAt: Date.now() - 2 * HOUR,
    replies: [
      {
        id: "r1",
        author: "coach_maria",
        avatarColor: "bg-pink-500/30",
        content: "Agacha pesado, RDL, prensa, extensões e gémeos. 16-20 séries totais.",
        createdAt: Date.now() - 1 * HOUR,
      },
    ],
  },
  {
    id: "p2",
    author: "joao_natural",
    avatarColor: "bg-emerald-500/30",
    title: "Quanta proteína por dia para ganhar massa?",
    content: "Peso 78kg. Ouvi de tudo, desde 1.6 a 2.5g/kg. O que recomendam?",
    hashtags: ["nutrição", "massa"],
    upvotes: 28,
    createdAt: Date.now() - 5 * HOUR,
    replies: [],
  },
  {
    id: "p3",
    author: "iniciante_total",
    avatarColor: "bg-blue-500/30",
    title: "Comecei há 1 mês — dicas para não desistir?",
    content: "Sinto-me motivado mas tenho medo de bater num plateau. Como mantêm a motivação a longo prazo?",
    hashtags: ["iniciantes", "motivação"],
    upvotes: 71,
    createdAt: Date.now() - 12 * HOUR,
    replies: [
      {
        id: "r2",
        author: "veterano_15a",
        avatarColor: "bg-yellow-500/30",
        content: "Regista os teus treinos. Ver progresso preto-no-branco é o melhor combustível.",
        createdAt: Date.now() - 10 * HOUR,
      },
      {
        id: "r3",
        author: "ana_fit",
        avatarColor: "bg-purple-500/30",
        content: "Arranja um parceiro de treino. Faz toda a diferença.",
        createdAt: Date.now() - 8 * HOUR,
      },
    ],
  },
  {
    id: "p4",
    author: "crossfit_pt",
    avatarColor: "bg-red-500/30",
    title: "WOD favorito da semana?",
    content: "Partilhem! O meu foi um Fran sub-4min finalmente.",
    hashtags: ["crossfit"],
    upvotes: 15,
    createdAt: Date.now() - 26 * HOUR,
    replies: [],
  },
  {
    id: "p5",
    author: "mind_muscle",
    avatarColor: "bg-cyan-500/30",
    title: "Como melhorar a conexão mente-músculo nas costas?",
    content: "Sinto sempre os bíceps a fazer o trabalho. Dicas de drills ou exercícios específicos?",
    hashtags: ["costas", "técnica"],
    upvotes: 33,
    createdAt: Date.now() - 30 * HOUR,
    replies: [],
  },
];

export const allHashtags = [
  "todos",
  "pernas",
  "costas",
  "hipertrofia",
  "nutrição",
  "iniciantes",
  "motivação",
  "técnica",
  "crossfit",
  "massa",
];
