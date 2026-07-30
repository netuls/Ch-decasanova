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
  updateContribution,
  deleteContribution,
} from "./firebase-config.js?v=3";

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
    <label class="full">Foto do casal (medalhão da capa)
      <div class="couple-photo-editor">
        <div class="couple-photo-preview">
          ${
            workingConfig.couplePhoto
              ? `<img src="${workingConfig.couplePhoto}" alt="Foto do casal" />`
              : `<img src="casal.jpg?v=1" alt="Foto padrão" />`
          }
        </div>
        <div class="couple-photo-actions">
          <input type="file" accept="image/*" id="couple-photo-input" />
          ${
            workingConfig.couplePhoto
              ? `<button type="button" id="remove-couple-photo-btn" class="remove-img-btn">Usar foto padrão</button>`
              : `<span class="couple-photo-hint">Nenhuma foto enviada — usando a padrão do repositório</span>`
          }
        </div>
      </div>
    </label>
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

  document.getElementById("couple-photo-input").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const dataUrl = await resizeImage(file, 700, 0.75);
    workingConfig.couplePhoto = dataUrl;
    renderConfigForm();
  });

  const removeBtn = document.getElementById("remove-couple-photo-btn");
  if (removeBtn) {
    removeBtn.addEventListener("click", () => {
      workingConfig.couplePhoto = null;
      renderConfigForm();
    });
  }
}

function renderItemsForm() {
  const el = document.getElementById("items-form");
  el.innerHTML = workingItems
    .map((item, idx) => {
      const itemAmounts =
        item.amounts && item.amounts.length
          ? item.amounts
          : workingConfig.suggestedAmounts || [100, 200];
      return `
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
        <div class="item-amounts-row">
          <label>Valor sugerido 1
            <input type="number" min="0" step="1" class="item-amount-input" data-idx="${idx}" data-slot="0" value="${itemAmounts[0] ?? ""}" />
          </label>
          <label>Valor sugerido 2
            <input type="number" min="0" step="1" class="item-amount-input" data-idx="${idx}" data-slot="1" value="${itemAmounts[1] ?? ""}" />
          </label>
        </div>
      </div>
    </div>`;
    })
    .join("");

  el.querySelectorAll(".item-name-input").forEach((input) => {
    input.addEventListener("input", () => {
      workingItems[input.dataset.idx].name = input.value;
    });
  });

  el.querySelectorAll(".item-amount-input").forEach((input) => {
    input.addEventListener("input", () => {
      const idx = input.dataset.idx;
      const slot = Number(input.dataset.slot);
      const item = workingItems[idx];
      const base =
        item.amounts && item.amounts.length
          ? [...item.amounts]
          : [...(workingConfig.suggestedAmounts || [100, 200])];
      base[slot] = parseFloat(input.value) || 0;
      item.amounts = base;
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
let latestContributions = [];
let editingContributionId = null;

function renderContributions(list) {
  latestContributions = list;
  const tbody = document.getElementById("contributions-tbody");
  const summary = document.getElementById("contributions-summary");

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-row">Nenhuma contribuição registrada ainda.</td></tr>`;
    summary.textContent = "0 contribuições — total: R$ 0,00";
    return;
  }

  const total = list.reduce((sum, c) => sum + Number(c.amount || 0), 0);
  summary.textContent = `${list.length} contribuição${list.length > 1 ? "ões" : ""} — total: ${formatBRL(total)}`;

  tbody.innerHTML = list
    .map((c) => {
      const isEditing = editingContributionId === c.id;
      const valorCell = isEditing
        ? `<input type="number" min="0" step="1" class="edit-amount-input" data-id="${c.id}" value="${Number(c.amount || 0)}" />`
        : formatBRL(c.amount);
      const actionsCell = isEditing
        ? `<button type="button" class="table-action-btn save-contribution-btn" data-id="${c.id}">Salvar</button>
           <button type="button" class="table-action-btn ghost cancel-contribution-btn">Cancelar</button>`
        : `<button type="button" class="table-action-btn edit-contribution-btn" data-id="${c.id}">Editar</button>
           <button type="button" class="table-action-btn danger delete-contribution-btn" data-id="${c.id}">Excluir</button>`;
      return `
    <tr>
      <td>${c.name || "—"}</td>
      <td>${c.itemName || "—"}</td>
      <td>${valorCell}</td>
      <td>${formatDate(c.createdAt)}</td>
      <td class="contributions-actions">${actionsCell}</td>
    </tr>`;
    })
    .join("");

  tbody.querySelectorAll(".edit-contribution-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      editingContributionId = btn.dataset.id;
      renderContributions(latestContributions);
    });
  });

  tbody.querySelectorAll(".cancel-contribution-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      editingContributionId = null;
      renderContributions(latestContributions);
    });
  });

  tbody.querySelectorAll(".save-contribution-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const input = tbody.querySelector(`.edit-amount-input[data-id="${id}"]`);
      const newAmount = parseFloat(input.value);
      if (!newAmount || newAmount <= 0) {
        toast("Digite um valor válido antes de salvar.");
        return;
      }
      btn.disabled = true;
      btn.textContent = "Salvando...";
      try {
        await updateContribution(id, { amount: newAmount });
        editingContributionId = null;
        toast("Valor atualizado ✅");
      } catch (e) {
        console.error("Erro ao atualizar contribuição:", e);
        toast("Erro ao salvar. Tente de novo.");
        btn.disabled = false;
        btn.textContent = "Salvar";
      }
    });
  });

  tbody.querySelectorAll(".delete-contribution-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const c = latestContributions.find((item) => item.id === id);
      const label = c ? `${c.name} — ${formatBRL(c.amount)}` : "esta contribuição";
      if (!confirm(`Tem certeza que quer apagar ${label}? Essa ação não pode ser desfeita.`)) return;
      btn.disabled = true;
      try {
        await deleteContribution(id);
        toast("Contribuição apagada.");
      } catch (e) {
        console.error("Erro ao apagar contribuição:", e);
        toast("Erro ao apagar. Tente de novo.");
        btn.disabled = false;
      }
    });
  });
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
