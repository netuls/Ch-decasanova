/* ==========================================================================
   app.js — renderiza a página pública
   Os dados vêm do Firebase (nuvem). Qualquer alteração feita no admin
   aparece aqui automaticamente, em qualquer aparelho, sem precisar recarregar.
   ========================================================================== */

import {
  subscribeConfig,
  subscribeItems,
  seedIfEmpty,
  saveContribution,
} from "./firebase-config.js";

let currentConfig = SITE_CONFIG;
let currentItems = DEFAULT_ITEMS;

function formatBRL(value) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function renderHero() {
  const cfg = currentConfig;
  document.getElementById("hero-title").textContent = cfg.eventTitle;
  document.getElementById("hero-names").textContent = cfg.couple;
  document.getElementById("hero-intro").textContent = cfg.intro;
  document.title = `${cfg.eventTitle} — ${cfg.couple}`;
}

function itemMediaHTML(item) {
  if (item.image) {
    return `<img src="${item.image}" alt="${item.name}" />`;
  }
  return `<span>${item.emoji || "🎁"}</span>`;
}

function renderItems() {
  const items = currentItems;
  const cfg = currentConfig;
  const grid = document.getElementById("items-grid");
  grid.innerHTML = items
    .map((item, idx) => {
      const amounts = cfg.suggestedAmounts
        .map(
          (a) =>
            `<button class="amount-btn" data-amount="${a}" data-idx="${idx}">${formatBRL(
              a
            )}</button>`
        )
        .join("");
      return `
      <article class="item-card" data-idx="${idx}">
        <div class="item-media">${itemMediaHTML(item)}</div>
        <div class="item-body">
          <div class="item-name">${item.name}</div>
          <div class="amount-row">${amounts}</div>
          <label class="custom-amount">
            <span>R$</span>
            <input type="number" min="1" step="1" placeholder="Outro valor" class="custom-input" data-idx="${idx}" />
          </label>
          <button class="contribute-btn" data-idx="${idx}">Contribuir</button>
        </div>
      </article>`;
    })
    .join("");

  // amount button selection
  grid.querySelectorAll(".amount-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const card = btn.closest(".item-card");
      card.querySelectorAll(".amount-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      card.querySelector(".custom-input").value = "";
      card.dataset.selectedAmount = btn.dataset.amount;
    });
  });

  grid.querySelectorAll(".custom-input").forEach((input) => {
    input.addEventListener("input", () => {
      const card = input.closest(".item-card");
      card.querySelectorAll(".amount-btn").forEach((b) => b.classList.remove("active"));
      card.dataset.selectedAmount = input.value;
    });
  });

  grid.querySelectorAll(".contribute-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = btn.dataset.idx;
      const card = grid.querySelector(`.item-card[data-idx="${idx}"]`);
      const amount = parseFloat(card.dataset.selectedAmount || "0");
      if (!amount || amount <= 0) {
        showToast("Escolha ou digite um valor primeiro 💕");
        return;
      }
      openModal(items[idx], amount);
    });
  });
}

let pendingContribution = null;

function openModal(item, amount) {
  const cfg = currentConfig;
  pendingContribution = { itemName: item.name, amount };

  document.getElementById("modal-title").textContent = "Quase lá! 💛";
  document.getElementById("modal-item-name").textContent = item.name;
  document.getElementById("modal-amount").textContent = formatBRL(amount);
  document.getElementById("pix-key").textContent = cfg.pixKey;

  const nameInput = document.getElementById("contributor-name");
  nameInput.value = "";
  nameInput.disabled = false;
  document.getElementById("name-error").classList.remove("show");

  const confirmBtn = document.getElementById("confirm-contribution-btn");
  confirmBtn.disabled = false;
  confirmBtn.textContent = "Confirmar contribuição";

  document.getElementById("modal-overlay").classList.add("open");
  nameInput.focus();
}

async function confirmContribution() {
  const nameInput = document.getElementById("contributor-name");
  const errorEl = document.getElementById("name-error");
  const confirmBtn = document.getElementById("confirm-contribution-btn");
  const name = nameInput.value.trim();

  if (!name) {
    errorEl.classList.add("show");
    nameInput.focus();
    return;
  }
  errorEl.classList.remove("show");

  if (!pendingContribution) return;

  confirmBtn.disabled = true;
  confirmBtn.textContent = "Enviando...";

  try {
    await saveContribution({ name, ...pendingContribution });
    document.getElementById("modal-title").textContent = "Obrigado! 💛";
    nameInput.disabled = true;
    confirmBtn.textContent = "Contribuição registrada ✔";
    showToast(`Obrigado, ${name}! Sua contribuição foi registrada 💛`);
  } catch (e) {
    console.error("Erro ao registrar contribuição:", e);
    confirmBtn.disabled = false;
    confirmBtn.textContent = "Confirmar contribuição";
    showToast("Não foi possível registrar agora. Tente novamente.");
  }
}

function closeModal() {
  document.getElementById("modal-overlay").classList.remove("open");
}

function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2600);
}

function copyPix() {
  const cfg = currentConfig;
  navigator.clipboard
    .writeText(cfg.pixKey)
    .then(() => showToast("Chave Pix copiada!"))
    .catch(() => showToast("Não foi possível copiar. Copie manualmente."));
}

document.addEventListener("DOMContentLoaded", () => {
  // Mostra os dados padrão imediatamente, enquanto busca os dados da nuvem
  renderHero();
  renderItems();

  // Listeners essenciais de UI: registrados JÁ, sem depender da nuvem,
  // pra nunca ficar "travado" esperando o Firebase responder.
  document.getElementById("modal-close").addEventListener("click", closeModal);
  document.getElementById("modal-overlay").addEventListener("click", (e) => {
    if (e.target.id === "modal-overlay") closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });
  document.getElementById("copy-pix-btn").addEventListener("click", copyPix);
  document
    .getElementById("confirm-contribution-btn")
    .addEventListener("click", confirmContribution);
  document.getElementById("contributor-name").addEventListener("keydown", (e) => {
    if (e.key === "Enter") confirmContribution();
  });

  // Agora sim, conversa com a nuvem (não bloqueia mais a interface)
  initCloud();
});

async function initCloud() {
  try {
    await seedIfEmpty(SITE_CONFIG, DEFAULT_ITEMS);
  } catch (e) {
    console.error("Erro ao inicializar dados na nuvem:", e);
  }

  // Atualiza em tempo real sempre que algo mudar no admin
  subscribeConfig((cfg) => {
    currentConfig = cfg || SITE_CONFIG;
    renderHero();
  });
  subscribeItems((items) => {
    currentItems = items.length ? items : DEFAULT_ITEMS;
    renderItems();
  });
}
