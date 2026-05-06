export type Sex = "masculino" | "feminino" | "outro";
export type Goal =
  | "massa"
  | "gordura"
  | "flexibilidade"
  | "resistencia"
  | "forca"
  | "calistenia"
  | "crossfit";
export type Experience = "iniciante" | "intermediario" | "avancado";
export type SessionTime = "30" | "45" | "60" | "90";

export interface OnboardingData {
  age: number;
  weight: number;
  height: number;
  sex: Sex | null;
  goals: Goal[];
  experience: Experience | null;
  daysPerWeek: number;
  sessionTime: SessionTime | null;
}

export const initialData: OnboardingData = {
  age: 25,
  weight: 75,
  height: 175,
  sex: null,
  goals: [],
  experience: null,
  daysPerWeek: 4,
  sessionTime: null,
};

export const goalLabels: Record<Goal, string> = {
  massa: "Ganho de Massa",
  gordura: "Perda de Peso",
  flexibilidade: "Flexibilidade",
  resistencia: "Resistência",
  forca: "Força",
  calistenia: "Calistenia",
  crossfit: "CrossFit",
};

export const experienceLabels: Record<Experience, string> = {
  iniciante: "Iniciante",
  intermediario: "Intermédio",
  avancado: "Avançado",
};

export const sexLabels: Record<Sex, string> = {
  masculino: "Masculino",
  feminino: "Feminino",
  outro: "Outro",
};
