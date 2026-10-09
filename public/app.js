const connectButton = document.querySelector("#connect-button");
const refreshButton = document.querySelector("#refresh-button");
const connectionStatus = document.querySelector("#connection-status");
const setupNotice = document.querySelector("#setup-notice");
const mailSection = document.querySelector("#mail-section");
const loading = document.querySelector("#loading");
const errorMessage = document.querySelector("#error-message");
const emailList = document.querySelector("#email-list");
const filters = document.querySelector("#category-filters");
const modeNotice = document.querySelector("#mode-notice");
const messageCount = document.querySelector("#message-count");
const trashDialog = document.querySelector("#trash-confirm-dialog");
const trashDialogSubject = document.querySelector("#trash-dialog-subject");
const cancelTrashButton = document.querySelector("#cancel-trash-button");

let allEmails = [];
let activeCategory = "Todos";
let canTrash = false;

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.hidden = false;
}

function clearError() {
  errorMessage.textContent = "";
  errorMessage.hidden = true;
}

function confirmTrash(email) {
  trashDialogSubject.textContent = `${email.from} · ${email.subject}`;
  return new Promise((resolve) => {
    trashDialog.addEventListener("close", () => resolve(trashDialog.returnValue === "trash"), { once: true });
    trashDialog.showModal();
  });
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, { cache: "no-store", ...options });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "No se pudo completar la solicitud.");
  return data;
}

async function loadStatus() {
  try {
    const status = await requestJson("/api/status");
    if (!status.configured) {
      connectionStatus.textContent = "Falta configurar OAuth de Google en el equipo.";
      connectButton.disabled = true;
      setupNotice.hidden = false;
      setupNotice.textContent = "Para conectar Gmail, sigue los pasos de configuración del README.md. No compartas el secreto OAuth ni el archivo de token.";
      return;
    }
    setupNotice.hidden = true;
    canTrash = status.canTrash;
    if (status.connected) {
      connectionStatus.textContent = status.canTrash
        ? "Cuenta conectada · puedes mover correos a la papelera."
        : "Cuenta conectada · autoriza el permiso de Gmail para mover correos a la papelera.";
      connectButton.textContent = status.canTrash ? "Gmail conectado" : "Autorizar eliminación";
      connectButton.disabled = status.canTrash;
      await loadEmails();
    } else {
      connectionStatus.textContent = "Aún no has conectado una cuenta.";
    }
  } catch (error) {
    connectionStatus.textContent = "No se pudo comprobar el estado.";
    showError(error.message);
  }
}

function addFilterButton(label, count) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `filter${activeCategory === label ? " active" : ""}`;
  button.textContent = `${label} · ${count}`;
  button.addEventListener("click", () => {
    activeCategory = label;
    renderEmails();
  });
  filters.append(button);
}

function renderFilters() {
  filters.replaceChildren();
  const counts = new Map();
  for (const email of allEmails) counts.set(email.category, (counts.get(email.category) || 0) + 1);
  addFilterButton("Todos", allEmails.length);
  for (const [category, count] of counts) addFilterButton(category, count);
}

function createEmailCard(email) {
  const card = document.createElement("details");
  card.className = "email-card";
  const summary = document.createElement("summary");
  const topLine = document.createElement("div");
  topLine.className = "email-topline";
  const sender = document.createElement("span");
  sender.className = "sender";
  sender.textContent = email.from;
  const date = document.createElement("span");
  date.className = "email-date";
  date.textContent = email.date ? new Date(email.date).toLocaleDateString("es", { day: "numeric", month: "short" }) : "";
  const tag = document.createElement("span");
  tag.className = "tag";
  tag.textContent = email.category;
  const subject = document.createElement("h3");
  subject.className = "email-subject";
  subject.textContent = email.subject;
  topLine.append(sender, date);
  summary.append(topLine, tag, subject);

  const detail = document.createElement("div");
  detail.className = "email-detail";
  const label = document.createElement("p");
  label.className = "summary-label";
  label.textContent = email.classificationMode === "ollama" ? "Resumen con IA local" : "Vista previa";
  const summaryText = document.createElement("p");
  summaryText.className = "email-summary";
  summaryText.textContent = email.summary || "No hay resumen disponible.";
  detail.append(label, summaryText);

  if (email.body) {
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "body-toggle";
    toggle.textContent = "Mostrar contenido del correo";
    const body = document.createElement("p");
    body.className = "email-body";
    body.textContent = email.body;
    body.hidden = true;
    toggle.addEventListener("click", (event) => {
      event.preventDefault();
      body.hidden = !body.hidden;
      toggle.textContent = body.hidden ? "Mostrar contenido del correo" : "Ocultar contenido del correo";
    });
    detail.append(toggle, body);
  }

  const trashButton = document.createElement("button");
  trashButton.type = "button";
  trashButton.className = "trash-button";
  trashButton.textContent = "Mover a la papelera";
  trashButton.disabled = !canTrash;
  trashButton.title = canTrash
    ? "El correo se moverá a la papelera de Gmail"
    : "Autoriza el permiso de Gmail para mover correos a la papelera";
  trashButton.addEventListener("click", async (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!canTrash || !await confirmTrash(email)) return;

    trashButton.disabled = true;
    clearError();
    try {
      await requestJson(`/api/emails/${encodeURIComponent(email.id)}/trash`, { method: "POST" });
      allEmails = allEmails.filter((item) => item.id !== email.id);
      renderEmails();
    } catch (error) {
      showError(error.message);
      trashButton.disabled = false;
    }
  });
  detail.append(trashButton);

  card.append(summary, detail);
  return card;
}

function renderEmails() {
  renderFilters();
  const visible = activeCategory === "Todos"
    ? allEmails
    : allEmails.filter((email) => email.category === activeCategory);
  messageCount.textContent = `(${allEmails.length})`;
  emailList.replaceChildren();
  if (!visible.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = allEmails.length ? "No hay correos en esta categoría." : "No encontramos mensajes en la bandeja de entrada.";
    emailList.append(empty);
    return;
  }
  for (const email of visible) emailList.append(createEmailCard(email));
}

async function loadEmails() {
  clearError();
  loading.hidden = false;
  refreshButton.disabled = true;
  try {
    const data = await requestJson("/api/emails");
    allEmails = data.emails;
    activeCategory = "Todos";
    mailSection.hidden = false;
    modeNotice.hidden = false;
    modeNotice.textContent = data.mode === "ollama"
      ? `Clasificación y resúmenes generados localmente con ${data.model}.`
      : "Ollama no está instalado o el modelo no está descargado. Se muestran categorías por reglas y una vista previa del texto.";
    renderEmails();
  } catch (error) {
    showError(error.message);
  } finally {
    loading.hidden = true;
    refreshButton.disabled = false;
  }
}

connectButton.addEventListener("click", () => {
  window.location.assign("/auth/google");
});
cancelTrashButton.addEventListener("click", () => trashDialog.close());
refreshButton.addEventListener("click", loadEmails);
loadStatus();
