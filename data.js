/* ==========================================================================
   data.js
   Valores padrão / de exemplo, usados apenas:
   - na primeira vez que o site roda, para popular o banco de dados (Firebase);
   - como reserva, caso o site fique sem internet por um instante.

   Depois que o banco é populado, todas as edições passam a ser feitas
   direto pelo admin.html e salvas na nuvem — não precisa mais editar
   este arquivo manualmente nem mexer no GitHub.
   ========================================================================== */

const SITE_CONFIG = {
  eventTitle: "Chá de Casa Nova",
  couple: "Letícia e Agapito",
  date: "06 de Dezembro",
  time: "às 15h",
  location: "Condomínio Vistta Lagoon",
  intro:
    "Estamos montando nosso ninho e cada ajuda torna essa casa mais nossa. Escolha um item, contribua com o valor que puder e faça parte dessa nova fase com a gente!",
  pixKey: "85989625699",
  pixOwner: "Letícia & Agapito",
  whatsapp: "5585999999999",
  suggestedAmounts: [100, 200],
};

const DEFAULT_ITEMS = [
  { id: "geladeira", name: "Geladeira", emoji: "🧊", image: null },
  { id: "fogao", name: "Fogão", emoji: "🔥", image: null },
  { id: "cooktop", name: "Cooktop", emoji: "🍳", image: null },
  { id: "microondas", name: "Microondas", emoji: "📦", image: null },
  { id: "forno", name: "Forno", emoji: "🥧", image: null },
  { id: "lavaeseca", name: "Lava e Seca", emoji: "🧺", image: null },
  { id: "copos", name: "Conjunto de Copos", emoji: "🥂", image: null },
  { id: "jantar", name: "Conjunto de Jantar", emoji: "🍽️", image: null },
];
