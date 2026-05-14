export type MuscleGroup = "Peito" | "Costas" | "Pernas" | "Ombros" | "Braços" | "Core";
export type Equipment = "Ginásio Completo" | "Halteres" | "Banda" | "Peso Corporal";
export type Level = "Iniciante" | "Intermédio" | "Avançado";

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  equipment: Equipment;
  level: Level;
  description: string;
}

export const muscleGroups: MuscleGroup[] = ["Peito", "Costas", "Pernas", "Ombros", "Braços", "Core"];
export const equipments: Equipment[] = ["Ginásio Completo", "Halteres", "Banda", "Peso Corporal"];
export const levels: Level[] = ["Iniciante", "Intermédio", "Avançado"];

export const exercises: Exercise[] = [
  { id: "1", name: "Supino Reto com Barra", muscleGroup: "Peito", equipment: "Ginásio Completo", level: "Intermédio", description: "Deita-te no banco, segura a barra com pegada média, baixa controladamente até ao peito e empurra para cima estendendo os cotovelos. Mantém os pés bem apoiados e as escápulas retraídas." },
  { id: "2", name: "Flexões", muscleGroup: "Peito", equipment: "Peso Corporal", level: "Iniciante", description: "Posição de prancha, mãos à largura dos ombros. Desce o corpo até o peito quase tocar o chão e empurra para cima mantendo o core ativado e o corpo alinhado." },
  { id: "3", name: "Crucifixo com Halteres", muscleGroup: "Peito", equipment: "Halteres", level: "Intermédio", description: "Deitado no banco, abre os braços lateralmente com leve flexão dos cotovelos, sentindo o alongamento do peitoral, e regressa de forma controlada." },
  { id: "4", name: "Remada Curvada", muscleGroup: "Costas", equipment: "Ginásio Completo", level: "Intermédio", description: "Inclina o tronco a 45º, costas neutras. Puxa a barra em direção ao abdómen contraindo as escápulas, e baixa controladamente." },
  { id: "5", name: "Pull-up", muscleGroup: "Costas", equipment: "Peso Corporal", level: "Avançado", description: "Pendurado na barra com pegada pronada, puxa o corpo até o queixo passar a barra. Desce de forma controlada até extensão completa." },
  { id: "6", name: "Remada com Banda", muscleGroup: "Costas", equipment: "Banda", level: "Iniciante", description: "Sentado com pernas estendidas, banda à volta dos pés. Puxa as pontas da banda em direção ao tronco contraindo as costas." },
  { id: "7", name: "Agachamento com Barra", muscleGroup: "Pernas", equipment: "Ginásio Completo", level: "Avançado", description: "Barra apoiada no trapézio, pés à largura dos ombros. Desce empurrando a anca para trás até as coxas ficarem paralelas ao chão e sobe estendendo joelhos e anca." },
  { id: "8", name: "Lunges com Halteres", muscleGroup: "Pernas", equipment: "Halteres", level: "Intermédio", description: "Halteres ao lado do corpo. Dá um passo à frente flexionando ambos os joelhos a 90º, depois empurra com o calcanhar para regressar." },
  { id: "9", name: "Wall Sit", muscleGroup: "Pernas", equipment: "Peso Corporal", level: "Iniciante", description: "Encosta as costas à parede e desliza até as coxas ficarem paralelas ao chão. Mantém a posição isométrica respirando de forma constante." },
  { id: "10", name: "Press Militar", muscleGroup: "Ombros", equipment: "Ginásio Completo", level: "Intermédio", description: "Em pé, barra à altura dos ombros. Empurra a barra acima da cabeça até extensão completa dos braços e baixa controladamente." },
  { id: "11", name: "Elevação Lateral", muscleGroup: "Ombros", equipment: "Halteres", level: "Iniciante", description: "Em pé, halteres ao lado do corpo. Eleva os braços lateralmente até à altura dos ombros, mantendo leve flexão dos cotovelos." },
  { id: "12", name: "Face Pull com Banda", muscleGroup: "Ombros", equipment: "Banda", level: "Iniciante", description: "Banda fixada à altura do rosto. Puxa em direção à testa abrindo os cotovelos para fora, ativando o deltoide posterior." },
  { id: "13", name: "Rosca Direta", muscleGroup: "Braços", equipment: "Halteres", level: "Iniciante", description: "Em pé, halteres ao lado do corpo com palmas para a frente. Flexiona os cotovelos elevando os halteres até aos ombros, sem balançar o tronco." },
  { id: "14", name: "Tríceps no Banco", muscleGroup: "Braços", equipment: "Peso Corporal", level: "Intermédio", description: "Mãos no banco atrás de ti, pernas estendidas. Desce o corpo flexionando os cotovelos a 90º e empurra para cima ativando os tríceps." },
  { id: "15", name: "Prancha", muscleGroup: "Core", equipment: "Peso Corporal", level: "Iniciante", description: "Apoia antebraços e pontas dos pés, corpo alinhado da cabeça aos calcanhares. Contrai o abdómen e glúteos, mantendo a respiração constante." },
  { id: "16", name: "Russian Twist", muscleGroup: "Core", equipment: "Halteres", level: "Intermédio", description: "Sentado com tronco inclinado e pés elevados, segura um haltere. Roda o tronco de um lado para o outro tocando o peso ao chão." },
  { id: "17", name: "Dragon Flag", muscleGroup: "Core", equipment: "Peso Corporal", level: "Avançado", description: "Deitado no banco, segura atrás da cabeça. Eleva o corpo mantendo-o rígido e desce lentamente apenas com controlo do core." },
];
