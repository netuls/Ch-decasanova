/* ==========================================================================
   data.js
   Configuração do evento e lista de itens.

   Para atualizar o site para TODOS os visitantes (não só no seu navegador):
   1. Entre em /admin.html e faça as alterações (fotos, nomes, valores).
   2. Clique em "Gerar código atualizado" e copie o texto gerado.
   3. Substitua o conteúdo deste arquivo (js/data.js) pelo texto copiado.
   4. Salve, faça commit e push para o GitHub. O GitHub Pages atualiza sozinho.
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
