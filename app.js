/* ==========================================================================
   app.js — renderiza a página pública
   ========================================================================== */

const STORAGE_KEY = "cha_casa_nova_overrides_v1";

function loadOverrides() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function getConfig() {
  const overrides = loadOverrides();
  if (overrides && overrides.config) {
    return { ...SITE_CONFIG, ...overrides.config };
  }
  return SITE_CONFIG;
}

function getItems() {
  const overrides = loadOverrides();
  if (overrides && overrides.items) {
    return overrides.items;
  }
  return DEFAULT_ITEMS;
}

function formatBRL(value) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function renderHero() {
  const cfg = getConfig();
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
  const items = getItems();
  const cfg = getConfig();
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

function openModal(item, amount) {
  const cfg = getConfig();
  document.getElementById("modal-item-name").textContent = item.name;
  document.getElementById("modal-amount").textContent = formatBRL(amount);
  document.getElementById("pix-key").textContent = cfg.pixKey;

  const waMsg = encodeURIComponent(
    `Oi! Quero contribuir com ${formatBRL(amount)} para o ${item.name} do chá de casa nova de ${cfg.couple} 🎁`
  );
  document.getElementById("whatsapp-link").href = `https://wa.me/${cfg.whatsapp}?text=${waMsg}`;

  document.getElementById("modal-overlay").classList.add("open");
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
  const cfg = getConfig();
  navigator.clipboard
    .writeText(cfg.pixKey)
    .then(() => showToast("Chave Pix copiada!"))
    .catch(() => showToast("Não foi possível copiar. Copie manualmente."));
}

document.addEventListener("DOMContentLoaded", () => {
  renderHero();
  renderItems();
  document.getElementById("modal-close").addEventListener("click", closeModal);
  document.getElementById("modal-overlay").addEventListener("click", (e) => {
    if (e.target.id === "modal-overlay") closeModal();
  });
  document.getElementById("copy-pix-btn").addEventListener("click", copyPix);
});
