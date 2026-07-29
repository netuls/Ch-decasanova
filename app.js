/* ==========================================================================
   admin.js
   Painel do administrador. As alterações são salvas direto no Firebase
   (nuvem) e aparecem para todo mundo, em qualquer aparelho, na hora.
   ========================================================================== */

import {
  fetchRemoteConfig,
  fetchRemoteItems,
  saveRemoteConfig,
  saveRemoteItems,
  seedIfEmpty,
  subscribeContributions,
} from "./firebase-config.js";

const ADMIN_PASSWORD = "casanova2026"; // troque aqui por sua senha

let workingItems = [];
let workingConfig = {};

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Tempo esgotado ao falar com a nuvem")), ms)
    ),
  ]);
}

async function loadState() {
  try {
    await withTimeout(seedIfEmpty(SITE_CONFIG, DEFAULT_ITEMS), 8000);
    const remoteConfig = await withTimeout(fetchRemoteConfig(), 8000);
    const remoteItems = await withTimeout(fetchRemoteItems(), 8000);
    workingConfig = { ...SITE_CONFIG, ...(remoteConfig || {}) };
    workingItems = remoteItems.length
      ? remoteItems
      : JSON.parse(JSON.stringify(DEFAULT_ITEMS));
  } catch (e) {
    console.error("Erro ao carregar dados da nuvem:", e);
    workingConfig = { ...SITE_CONFIG };
    workingItems = JSON.parse(JSON.stringify(DEFAULT_ITEMS));
    toast("Não consegui conectar à nuvem (verifique sua internet). Mostrando valores padrão — clique em Salvar para aplicá-los.");
  }
}

async function saveState() {
  try {
    toast("Salvando...");
    await saveRemoteConfig(workingConfig);
    await saveRemoteItems(workingItems);
    toast("Salvo! Já aparece pra todo mundo, em qualquer aparelho ✅");
  } catch (e) {
    console.error("Erro ao salvar na nuvem:", e);
    toast("Erro ao salvar. Verifique sua internet e tente de novo.");
  }
}

function toast(msg) {
  const t = document.getElementById("admin-toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2400);
}

function resizeImage(file, maxWidth = 700, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function renderConfigForm() {
  const el = document.getElementById("config-form");
  el.innerHTML = `
    <label>Título do evento
      <input type="text" data-field="eventTitle" value="${workingConfig.eventTitle}" />
    </label>
    <label>Nomes
      <input type="text" data-field="couple" value="${workingConfig.couple}" />
    </label>
    <label>Data
      <input type="text" data-field="date" value="${workingConfig.date}" />
    </label>
    <label>Horário
      <input type="text" data-field="time" value="${workingConfig.time}" />
    </label>
    <label>Local
      <input type="text" data-field="location" value="${workingConfig.location}" />
    </label>
    <label class="full">Texto de introdução
      <textarea data-field="intro" rows="3">${workingConfig.intro}</textarea>
    </label>
    <label>Chave Pix
      <input type="text" data-field="pixKey" value="${workingConfig.pixKey}" />
    </label>
  `;
  el.querySelectorAll("[data-field]").forEach((input) => {
    input.addEventListener("input", () => {
      workingConfig[input.dataset.field] = input.value;
    });
  });
}

function renderItemsForm() {
  const el = document.getElementById("items-form");
  el.innerHTML = workingItems
    .map(
      (item, idx) => `
    <div class="admin-item-card" data-idx="${idx}">
      <div class="admin-item-preview">
        ${
          item.image
            ? `<img src="${item.image}" alt="${item.name}" />`
            : `<span>${item.emoji || "🎁"}</span>`
        }
      </div>
      <div class="admin-item-fields">
        <label>Nome do item
          <input type="text" class="item-name-input" data-idx="${idx}" value="${item.name}" />
        </label>
        <label>Foto do item
          <input type="file" accept="image/*" class="item-image-input" data-idx="${idx}" />
        </label>
        ${
          item.image
            ? `<button type="button" class="remove-img-btn" data-idx="${idx}">Remover foto</button>`
            : ""
        }
      </div>
    </div>`
    )
    .join("");

  el.querySelectorAll(".item-name-input").forEach((input) => {
    input.addEventListener("input", () => {
      workingItems[input.dataset.idx].name = input.value;
    });
  });

  el.querySelectorAll(".item-image-input").forEach((input) => {
    input.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const dataUrl = await resizeImage(file);
      workingItems[input.dataset.idx].image = dataUrl;
      renderItemsForm();
    });
  });

  el.querySelectorAll(".remove-img-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      workingItems[btn.dataset.idx].image = null;
      renderItemsForm();
    });
  });
}

function formatBRL(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDate(timestamp) {
  if (!timestamp) return "—";
  return new Date(timestamp).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

let contributionsUnsubscribe = null;

function renderContributions(list) {
  const tbody = document.getElementById("contributions-tbody");
  const summary = document.getElementById("contributions-summary");

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="4" class="empty-row">Nenhuma contribuição registrada ainda.</td></tr>`;
    summary.textContent = "0 contribuições — total: R$ 0,00";
    return;
  }

  const total = list.reduce((sum, c) => sum + Number(c.amount || 0), 0);
  summary.textContent = `${list.length} contribuição${list.length > 1 ? "ões" : ""} — total: ${formatBRL(total)}`;

  tbody.innerHTML = list
    .map(
      (c) => `
    <tr>
      <td>${c.name || "—"}</td>
      <td>${c.itemName || "—"}</td>
      <td>${formatBRL(c.amount)}</td>
      <td>${formatDate(c.createdAt)}</td>
    </tr>`
    )
    .join("");
}

function startContributionsListener() {
  if (contributionsUnsubscribe) return;
  contributionsUnsubscribe = subscribeContributions((list) => {
    renderContributions(list);
  });
}

async function checkPassword() {
  const input = document.getElementById("password-input").value;
  if (input === ADMIN_PASSWORD) {
    document.getElementById("login-screen").style.display = "none";
    document.getElementById("admin-panel").style.display = "block";
    document.getElementById("config-form").innerHTML = "<p>Carregando...</p>";
    await loadState();
    renderConfigForm();
    renderItemsForm();
    startContributionsListener();
  } else {
    document.getElementById("password-error").style.display = "block";
  }
}

function resetForm() {
  if (
    !confirm(
      "Isso volta os campos para os valores padrão (não salva ainda — clique em Salvar depois se quiser aplicar). Continuar?"
    )
  )
    return;
  workingItems = JSON.parse(JSON.stringify(DEFAULT_ITEMS));
  workingConfig = { ...SITE_CONFIG };
  renderConfigForm();
  renderItemsForm();
  toast("Campos redefinidos (clique em Salvar para aplicar)");
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("login-btn").addEventListener("click", checkPassword);
  document.getElementById("password-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") checkPassword();
  });
  document.getElementById("save-preview-btn").addEventListener("click", saveState);
  document.getElementById("reset-btn").addEventListener("click", resetForm);
  document.getElementById("view-site-btn").addEventListener("click", () => {
    window.open("index.html", "_blank");
  });
});
