/* ==========================================================================
   admin.js
   Painel do administrador. Roda inteiramente no navegador (sem servidor).
   - As alterações ficam salvas no localStorage deste navegador (pré-visualização).
   - Para valer para todos os visitantes, gere o código e cole em js/data.js
     no repositório, depois faça commit/push.
   ========================================================================== */

const STORAGE_KEY = "cha_casa_nova_overrides_v1";
const ADMIN_PASSWORD = "casanova2026"; // troque aqui por sua senha

let workingItems = [];
let workingConfig = {};

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  const overrides = raw ? JSON.parse(raw) : null;
  workingItems = (overrides && overrides.items) || JSON.parse(JSON.stringify(DEFAULT_ITEMS));
  workingConfig = { ...SITE_CONFIG, ...((overrides && overrides.config) || {}) };
}

function saveState() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ items: workingItems, config: workingConfig })
  );
  toast("Alterações salvas neste navegador ✅");
}

function toast(msg) {
  const t = document.getElementById("admin-toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2400);
}

function resizeImage(file, maxWidth = 900, quality = 0.82) {
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
    <label>WhatsApp (só números, com DDI)
      <input type="text" data-field="whatsapp" value="${workingConfig.whatsapp}" />
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

function generateCode() {
  const itemsCode = workingItems
    .map(
      (i) =>
        `  { id: ${JSON.stringify(i.id)}, name: ${JSON.stringify(
          i.name
        )}, emoji: ${JSON.stringify(i.emoji || "🎁")}, image: ${
          i.image ? JSON.stringify(i.image) : "null"
        } },`
    )
    .join("\n");

  const code = `const SITE_CONFIG = ${JSON.stringify(workingConfig, null, 2)};

const DEFAULT_ITEMS = [
${itemsCode}
];
`;
  document.getElementById("code-output").value = code;
  document.getElementById("code-output-wrap").style.display = "block";
}

function checkPassword() {
  const input = document.getElementById("password-input").value;
  if (input === ADMIN_PASSWORD) {
    document.getElementById("login-screen").style.display = "none";
    document.getElementById("admin-panel").style.display = "block";
    loadState();
    renderConfigForm();
    renderItemsForm();
  } else {
    document.getElementById("password-error").style.display = "block";
  }
}

function resetPreview() {
  if (!confirm("Isso apaga a pré-visualização salva neste navegador e volta aos valores padrão de data.js. Continuar?")) return;
  localStorage.removeItem(STORAGE_KEY);
  loadState();
  renderConfigForm();
  renderItemsForm();
  toast("Pré-visualização redefinida");
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("login-btn").addEventListener("click", checkPassword);
  document.getElementById("password-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") checkPassword();
  });
  document.getElementById("save-preview-btn").addEventListener("click", saveState);
  document.getElementById("generate-code-btn").addEventListener("click", generateCode);
  document.getElementById("reset-btn").addEventListener("click", resetPreview);
  document.getElementById("copy-code-btn").addEventListener("click", () => {
    const ta = document.getElementById("code-output");
    ta.select();
    navigator.clipboard.writeText(ta.value).then(() => toast("Código copiado!"));
  });
  document.getElementById("view-site-btn").addEventListener("click", () => {
    window.open("index.html", "_blank");
  });
});
