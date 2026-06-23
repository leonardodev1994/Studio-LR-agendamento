const loginPanel = document.querySelector("#loginPanel");
const adminPanel = document.querySelector("#adminPanel");
const loginForm = document.querySelector("#loginForm");
const loginMessage = document.querySelector("#loginMessage");
const logoutButton = document.querySelector("#logoutButton");
const adminDate = document.querySelector("#adminDate");
const prevDayButton = document.querySelector("#prevDayButton");
const nextDayButton = document.querySelector("#nextDayButton");
const todayButton = document.querySelector("#todayButton");
const appointmentFilters = document.querySelector("#appointmentFilters");
const appointmentActionMessage = document.querySelector("#appointmentActionMessage");
const appointmentsList = document.querySelector("#appointmentsList");
const blockDayForm = document.querySelector("#blockDayForm");
const blockSlotForm = document.querySelector("#blockSlotForm");
const extraSlotForm = document.querySelector("#extraSlotForm");
const settingsList = document.querySelector("#settingsList");
const adminTabs = document.querySelectorAll("[data-admin-module]");
const adminModules = document.querySelectorAll("[data-module-panel]");
const dashboardCards = document.querySelector("#dashboardCards");
const adminServicesList = document.querySelector("#adminServicesList");
const clientsList = document.querySelector("#clientsList");
const financeSummary = document.querySelector("#financeSummary");
const adminGalleryList = document.querySelector("#adminGalleryList");
const configSummary = document.querySelector("#configSummary");

const statuses = ["Pendente", "Confirmado", "Cancelado", "Concluído"];
let adminServiceOptions = [];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "Algo deu errado.");
  return payload;
}

async function uploadApi(path, formData) {
  const response = await fetch(path, {
    method: "POST",
    body: formData,
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "Algo deu errado.");
  return payload;
}

function setAuthed(value) {
  loginPanel.classList.toggle("hidden", value);
  adminPanel.classList.toggle("hidden", !value);
  logoutButton.classList.toggle("hidden", !value);
}

function setModule(moduleName) {
  adminTabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.adminModule === moduleName);
  });
  adminModules.forEach((module) => {
    module.classList.toggle("hidden", module.dataset.modulePanel !== moduleName);
  });
}

function metricCard(label, value, detail = "") {
  return `
    <article class="admin-card">
      <span>${label}</span>
      <strong>${value}</strong>
      ${detail ? `<p>${detail}</p>` : ""}
    </article>
  `;
}

function setActionMessage(message, success = false) {
  if (!appointmentActionMessage) return;
  appointmentActionMessage.textContent = message;
  appointmentActionMessage.className = success ? "form-message success-box" : "form-message";
}

function addDays(value, days) {
  const date = new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function moneyLabel(cents = 0) {
  return `R$ ${(Number(cents || 0) / 100).toFixed(2).replace(".", ",")}`;
}

function whatsappClientUrl(phone, message = "") {
  const digits = String(phone || "").replace(/\D/g, "");
  const normalized = digits.startsWith("55") ? digits : `55${digits}`;
  const base = `https://wa.me/${normalized}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

function whatsappMessage(type, item) {
  if (type === "cancel") {
    return `Olá, ${item.client_name}! Seu agendamento no Studio LR foi cancelado.\n\nServiço: ${item.service_name}\nData: ${item.appointment_date}\nHorário: ${item.appointment_time}\n\nSe quiser remarcar, fale conosco por aqui.`;
  }
  if (type === "done") {
    return `Olá, ${item.client_name}! Obrigada por visitar o Studio LR hoje. 💅✨\n\nEsperamos você na próxima manutenção!`;
  }
  if (type === "free") {
    return `Olá, ${item.client_name}! Aqui é do Studio LR.`;
  }
  return `Olá, ${item.client_name}! Seu agendamento no Studio LR foi confirmado. 💅✨\n\nServiço: ${item.service_name}\nData: ${item.appointment_date}\nHorário: ${item.appointment_time}\n\nEsperamos você!`;
}

function serviceOptions(selectedId) {
  return adminServiceOptions
    .filter((service) => service.bookable !== false && service.service_id)
    .map((service) => `<option value="${service.service_id}" ${Number(service.service_id) === Number(selectedId) ? "selected" : ""}>${service.name}</option>`)
    .join("");
}

function renderAppointments(items) {
  if (!items.length) {
    appointmentsList.innerHTML = "<p class='form-message'>Nenhum agendamento para este dia.</p>";
    return;
  }

  appointmentsList.innerHTML = items
    .map((item) => `
      <article class="appointment-card status-${item.status.toLowerCase().replace("í", "i")} ${item.reschedule_request_id ? "has-reschedule" : ""}" data-appointment-card="${item.id}">
        <div class="appointment-time">${item.appointment_time}</div>
        <div class="appointment-main">
          <span class="appointment-status">${item.reschedule_request_id ? "Reagendamento solicitado" : item.status}</span>
          <h3>${item.client_name}</h3>
          <p>${item.client_phone}${item.client_neighborhood ? ` · ${item.client_neighborhood}` : ""}</p>
          <p>${item.service_name} · ${item.price_label || moneyLabel(item.price_cents)} · ${item.duration_minutes} min</p>
          <p>${item.notes || "Sem observação"}</p>
          ${
            item.reschedule_request_id
              ? `
                <div class="reschedule-note">
                  <strong>Pedido de reagendamento</strong>
                  <span>${item.requested_date || "Data a combinar"} · ${item.requested_time || "Horário a combinar"} · ${item.reschedule_status}</span>
                  ${item.reschedule_message ? `<p>${item.reschedule_message}</p>` : ""}
                </div>
              `
              : ""
          }
        </div>
        <div class="appointment-actions" data-id="${item.id}">
          <button class="button secondary" type="button" data-quick-status="Confirmado">Confirmar</button>
          <button class="button secondary" type="button" data-quick-status="Cancelado">Cancelar</button>
          <button class="button secondary" type="button" data-quick-status="Concluído">Concluir</button>
          <button class="button secondary" type="button" data-quick-status="Pendente">Pendente</button>
          <a class="button secondary" href="${whatsappClientUrl(item.client_phone, whatsappMessage("confirm", item))}" target="_blank" rel="noreferrer">Confirmar WhatsApp</a>
          <a class="button secondary" href="${whatsappClientUrl(item.client_phone, whatsappMessage("cancel", item))}" target="_blank" rel="noreferrer">Avisar cancelamento</a>
          <a class="button secondary" href="${whatsappClientUrl(item.client_phone, whatsappMessage("done", item))}" target="_blank" rel="noreferrer">Avisar conclusão</a>
          <a class="button secondary" href="${whatsappClientUrl(item.client_phone, whatsappMessage("free", item))}" target="_blank" rel="noreferrer">Mensagem livre</a>
        </div>
        <form class="appointment-edit-form" data-edit-appointment="${item.id}">
          <div class="form-row two">
            <label>Cliente<input name="client_name" value="${item.client_name}" required></label>
            <label>Telefone<input name="client_phone" value="${item.client_phone}" required></label>
          </div>
          <label>Bairro<input name="client_neighborhood" value="${item.client_neighborhood || ""}"></label>
          <label>Serviço<select name="service_id" required>${serviceOptions(item.service_id)}</select></label>
          <div class="form-row two">
            <label>Data<input name="date" type="date" value="${item.appointment_date}" required></label>
            <label>Horário<input name="time" type="time" value="${item.appointment_time}" required></label>
          </div>
          <label>Status<select name="status">${statuses.map((status) => `<option value="${status}" ${status === item.status ? "selected" : ""}>${status}</option>`).join("")}</select></label>
          <label>Observação<textarea name="notes" rows="2">${item.notes || ""}</textarea></label>
          <div class="appointment-actions">
            <button class="button primary" type="submit">Salvar alterações</button>
            <button class="button secondary danger" type="button" data-delete-appointment="${item.id}">Excluir</button>
          </div>
          <p class="form-message" data-card-message></p>
        </form>
      </article>
    `)
    .join("");

  appointmentsList.querySelectorAll("[data-quick-status]").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = button.closest("[data-id]").dataset.id;
      try {
        await api(`/api/admin/appointments/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ status: button.dataset.quickStatus }),
        });
        setActionMessage(`Status atualizado para ${button.dataset.quickStatus}.`, true);
        await loadAppointments();
        await loadDashboard();
      } catch (error) {
        setActionMessage(error.message || "Não foi possível atualizar o status.");
      }
    });
  });

  appointmentsList.querySelectorAll("[data-edit-appointment]").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const message = form.querySelector("[data-card-message]");
      const button = form.querySelector("button[type='submit']");
      const data = Object.fromEntries(new FormData(form));
      button.disabled = true;
      button.textContent = "Salvando...";
      message.textContent = "";
      try {
        const payload = {
          service_id: data.service_id,
          client_name: data.client_name,
          client_phone: data.client_phone,
          client_neighborhood: data.client_neighborhood,
          date: data.date,
          time: data.time,
          status: data.status,
          notes: data.notes,
        };
        await api(`/api/admin/appointments/${form.dataset.editAppointment}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        setActionMessage("Agendamento atualizado.", true);
        adminDate.value = data.date;
        await loadAppointments();
        await loadDashboard();
      } catch (error) {
        message.textContent = error.message || "Não foi possível salvar.";
        button.disabled = false;
        button.textContent = "Salvar alterações";
      }
    });
  });

  appointmentsList.querySelectorAll("[data-delete-appointment]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!confirm("Excluir este agendamento? Esta ação não pode ser desfeita.")) return;
      try {
        await api(`/api/admin/appointments/${button.dataset.deleteAppointment}`, { method: "DELETE" });
        setActionMessage("Agendamento excluído.", true);
        await loadAppointments();
        await loadDashboard();
      } catch (error) {
        setActionMessage(error.message || "Não foi possível excluir.");
      }
    });
  });
}

function renderSettings(payload) {
  const blocked = payload.blocked_days
    .map((day) => `
      <div class="settings-item">
        <span>Bloqueado: ${day.block_date}${day.reason ? ` · ${day.reason}` : ""}</span>
        <button class="button secondary" type="button" data-delete-block="${day.id}">Remover</button>
      </div>
    `)
    .join("");

  const extras = payload.extra_slots
    .map((slot) => `
      <div class="settings-item">
        <span>Extra: ${slot.slot_date} às ${slot.slot_time}${slot.note ? ` · ${slot.note}` : ""}</span>
        <button class="button secondary" type="button" data-delete-extra="${slot.id}">Remover</button>
      </div>
    `)
    .join("");
  const blockedSlots = (payload.blocked_slots || [])
    .map((slot) => `
      <div class="settings-item">
        <span>Horário bloqueado: ${slot.slot_date} às ${slot.slot_time}${slot.reason ? ` · ${slot.reason}` : ""}</span>
        <button class="button secondary" type="button" data-delete-block-slot="${slot.id}">Remover</button>
      </div>
    `)
    .join("");

  settingsList.innerHTML = `<div class="settings-items">${blocked || ""}${blockedSlots || ""}${extras || ""}</div>` || "";
  if (!blocked && !blockedSlots && !extras) {
    settingsList.innerHTML = "<p class='form-message'>Nenhum bloqueio ou horário extra cadastrado.</p>";
  }

  settingsList.querySelectorAll("[data-delete-block]").forEach((button) => {
    button.addEventListener("click", async () => {
      await api(`/api/admin/blocked-days/${button.dataset.deleteBlock}`, { method: "DELETE" });
      loadSettings();
      loadAppointments();
    });
  });

  settingsList.querySelectorAll("[data-delete-extra]").forEach((button) => {
    button.addEventListener("click", async () => {
      await api(`/api/admin/extra-slots/${button.dataset.deleteExtra}`, { method: "DELETE" });
      loadSettings();
    });
  });

  settingsList.querySelectorAll("[data-delete-block-slot]").forEach((button) => {
    button.addEventListener("click", async () => {
      await api(`/api/admin/blocked-slots/${button.dataset.deleteBlockSlot}`, { method: "DELETE" });
      await loadSettings();
      await loadAppointments();
    });
  });
}

async function loadDashboard() {
  const payload = await api("/api/admin/dashboard");
  const dashboard = payload.dashboard;
  const next = dashboard.next_appointment;
  dashboardCards.innerHTML = [
    metricCard("Agendamentos hoje", dashboard.appointments_today),
    metricCard("Pendentes", dashboard.pending_today),
    metricCard("Confirmados", dashboard.confirmed_today),
    metricCard("Concluídos", dashboard.completed_today),
    metricCard("Cancelados", dashboard.canceled_today),
    metricCard("Faturamento hoje", dashboard.forecast_today_label),
    metricCard("Faturamento semana", dashboard.forecast_week_label),
    metricCard(
      "Próximo atendimento",
      next ? `${next.appointment_date} às ${next.appointment_time}` : "Nenhum",
      next ? `${next.client_name} · ${next.service_name}` : "Agenda livre por enquanto",
    ),
  ].join("");
}

async function loadAdminServices() {
  const payload = await api("/api/admin/catalog");
  adminServiceOptions = payload.catalog || [];
  const serviceFilter = appointmentFilters?.querySelector("select[name='service_id']");
  if (serviceFilter && serviceFilter.options.length <= 1) {
    serviceFilter.innerHTML = `<option value="">Todos</option>${serviceOptions("")}`;
  }
  adminServicesList.classList.add("service-editor-grid");
  adminServicesList.innerHTML = payload.catalog
    .map((service) => `
      <form class="service-editor-card" data-service-form="${service.key}">
        <button class="service-photo-button" type="button" data-service-photo-pick="${service.key}" aria-label="Alterar foto de ${service.name}">
          ${
            service.image
              ? `<img src="${service.image}" alt="${service.name}" loading="lazy" decoding="async">`
              : `<span>${service.icon || "✦"}</span>`
          }
          <small>Alterar foto</small>
        </button>
        <input class="hidden" type="file" accept="image/jpeg,image/png,image/webp" data-service-photo-input="${service.key}">
        <div>
          <span>Serviço</span>
          <strong>${service.name}</strong>
          <small>${service.category || "Catálogo"} · ${service.duration_label} · ${service.bookable === false ? "Adicional" : service.service_id ? "Agendamento direto" : "Sob consulta"}</small>
        </div>
        <label>
          Nome no catálogo
          <input name="name" value="${service.name}" required>
        </label>
        <label>
          Valor
          <input name="price_label" value="${service.price_label}" required>
        </label>
        <label>
          Duração
          <input name="duration_label" value="${service.duration_label}" required>
        </label>
        <button class="button secondary full" type="submit">Salvar serviço</button>
        <p class="form-message" data-service-message></p>
      </form>
    `)
    .join("") || "<p class='form-message'>Nenhum serviço cadastrado.</p>";

  adminServicesList.querySelectorAll("[data-service-photo-pick]").forEach((button) => {
    button.addEventListener("click", () => {
      adminServicesList.querySelector(`[data-service-photo-input="${button.dataset.servicePhotoPick}"]`)?.click();
    });
  });

  adminServicesList.querySelectorAll("[data-service-photo-input]").forEach((input) => {
    input.addEventListener("change", async () => {
      const file = input.files?.[0];
      if (!file) return;
      const form = input.closest(".service-editor-card");
      const message = form?.querySelector("[data-service-message]");
      if (message) message.textContent = "Enviando foto...";
      const formData = new FormData();
      formData.append("photo", file);
      try {
        await uploadApi(`/api/admin/catalog/photo/${input.dataset.servicePhotoInput}`, formData);
        if (message) message.textContent = "Foto atualizada.";
        await loadAdminServices();
      } catch (error) {
        if (message) message.textContent = error.message || "Não foi possível trocar a foto.";
        input.value = "";
      }
    });
  });

  adminServicesList.querySelectorAll("[data-service-form]").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const message = form.querySelector("[data-service-message]");
      const button = form.querySelector("button[type='submit']");
      const data = Object.fromEntries(new FormData(form));
      if (!data.name.trim()) {
        message.textContent = "Informe o nome do serviço.";
        return;
      }
      if (!data.price_label.trim()) {
        message.textContent = "Informe o valor do serviço.";
        return;
      }
      if (!data.duration_label.trim()) {
        message.textContent = "Informe a duração do serviço.";
        return;
      }
      button.disabled = true;
      button.textContent = "Salvando...";
      message.textContent = "";
      try {
        await api(`/api/admin/catalog/${form.dataset.serviceForm}`, {
          method: "PATCH",
          body: JSON.stringify({
            name: data.name.trim(),
            price_label: data.price_label.trim(),
            duration_label: data.duration_label.trim(),
          }),
        });
        message.textContent = "Serviço atualizado.";
        await loadAdminServices();
      } catch (error) {
        message.textContent = error.message || "Não foi possível salvar.";
        button.disabled = false;
        button.textContent = "Salvar serviço";
      }
    });
  });
}

async function loadClients() {
  const payload = await api("/api/admin/clients");
  clientsList.innerHTML = payload.clients
    .map((client) => metricCard(client.name, client.phone, `${client.neighborhood || "Bairro não informado"} · ${client.visits} visita(s) · Última: ${client.last_visit || "sem histórico"}`))
    .join("") || "<p class='form-message'>Nenhuma cliente cadastrada ainda.</p>";
}

async function loadFinance() {
  const payload = await api("/api/admin/finance");
  const finance = payload.finance;
  financeSummary.innerHTML = [
    metricCard("Faturamento diário", "Preparado", "Será calculado a partir dos pagamentos."),
    metricCard("Faturamento semanal", `R$ ${(finance.weekly_revenue_cents / 100).toFixed(0)}`, "Baseado em agendamentos não cancelados."),
    metricCard("Despesas", "Preparado", "Módulo pronto para receber despesas."),
    metricCard("Lucro estimado", "Preparado", "Será ativado junto ao financeiro completo."),
  ].join("");
}

async function loadAdminGallery() {
  const payload = await api("/api/admin/gallery");
  adminGalleryList.classList.add("admin-gallery-grid");
  adminGalleryList.innerHTML = payload.gallery
    .map((item) => {
      const number = String(item.index).padStart(2, "0");
      return `
        <article class="admin-gallery-card">
          <button class="gallery-replace-button" type="button" data-gallery-pick="${item.index}" aria-label="Alterar foto ${number}">
            <img src="${item.src}" alt="${item.alt}" loading="lazy" decoding="async">
            <span>${item.featured ? "Destaque" : `Foto ${number}`}</span>
          </button>
          <input class="hidden" type="file" accept="image/jpeg,image/png,image/webp" data-gallery-input="${item.index}">
          <p>Toque na foto para substituir.</p>
        </article>
      `;
    })
    .join("");

  adminGalleryList.querySelectorAll("[data-gallery-pick]").forEach((button) => {
    button.addEventListener("click", () => {
      adminGalleryList.querySelector(`[data-gallery-input="${button.dataset.galleryPick}"]`)?.click();
    });
  });

  adminGalleryList.querySelectorAll("[data-gallery-input]").forEach((input) => {
    input.addEventListener("change", async () => {
      const file = input.files?.[0];
      if (!file) return;
      const card = input.closest(".admin-gallery-card");
      const message = card?.querySelector("p");
      if (message) message.textContent = "Enviando foto...";
      const formData = new FormData();
      formData.append("index", input.dataset.galleryInput);
      formData.append("photo", file);
      try {
        await uploadApi("/api/admin/gallery", formData);
        await loadAdminGallery();
      } catch (error) {
        if (message) message.textContent = error.message || "Não foi possível trocar a foto.";
        input.value = "";
      }
    });
  });
}

async function loadConfig() {
  const payload = await api("/api/admin/config");
  const config = payload.config;
  configSummary.innerHTML = [
    metricCard("Ambiente", config.app_env),
    metricCard("Banco de dados", config.database),
    metricCard("WhatsApp", config.whatsapp_configured ? "Configurado" : "Pendente"),
    metricCard("Senha admin", config.admin_password_configured ? "Configurada" : "Pendente"),
  ].join("");
}

async function loadAdminModules() {
  await loadAdminServices();
  await Promise.all([
    loadDashboard(),
    loadAppointments(),
    loadSettings(),
    loadClients(),
    loadFinance(),
    loadAdminGallery(),
    loadConfig(),
  ]);
}

async function loadAppointments() {
  const filters = appointmentFilters ? new URLSearchParams(new FormData(appointmentFilters)) : new URLSearchParams();
  filters.set("date", adminDate.value);
  const payload = await api(`/api/admin/appointments?${filters.toString()}`);
  renderAppointments(payload.appointments);
}

async function loadSettings() {
  const payload = await api("/api/admin/settings");
  renderSettings(payload);
}

async function bootAdmin() {
  adminDate.value = todayIso();
  logoutButton.classList.add("hidden");
  const session = await api("/api/admin/session");
  setAuthed(session.authenticated);
  if (session.authenticated) {
    setModule("dashboard");
    await loadAdminModules();
  }
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  loginMessage.textContent = "";
  try {
    await api("/api/admin/login", {
      method: "POST",
      body: JSON.stringify(Object.fromEntries(new FormData(loginForm))),
    });
    setAuthed(true);
    setModule("dashboard");
    await loadAdminModules();
  } catch (error) {
    loginMessage.textContent = error.message;
  }
});

logoutButton.addEventListener("click", async () => {
  await api("/api/admin/logout", { method: "POST", body: "{}" });
  setAuthed(false);
});

adminTabs.forEach((tab) => {
  tab.addEventListener("click", () => setModule(tab.dataset.adminModule));
});

adminDate.addEventListener("change", loadAppointments);
appointmentFilters?.addEventListener("submit", async (event) => {
  event.preventDefault();
  await loadAppointments();
});
appointmentFilters?.addEventListener("input", () => {
  window.clearTimeout(appointmentFilters._timer);
  appointmentFilters._timer = window.setTimeout(loadAppointments, 350);
});

prevDayButton?.addEventListener("click", () => {
  adminDate.value = addDays(adminDate.value, -1);
  loadAppointments();
});
nextDayButton?.addEventListener("click", () => {
  adminDate.value = addDays(adminDate.value, 1);
  loadAppointments();
});
todayButton?.addEventListener("click", () => {
  adminDate.value = todayIso();
  loadAppointments();
});

blockDayForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await api("/api/admin/blocked-days", {
    method: "POST",
    body: JSON.stringify(Object.fromEntries(new FormData(blockDayForm))),
  });
  blockDayForm.reset();
  await loadSettings();
  await loadAppointments();
});

blockSlotForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  await api("/api/admin/blocked-slots", {
    method: "POST",
    body: JSON.stringify(Object.fromEntries(new FormData(blockSlotForm))),
  });
  blockSlotForm.reset();
  await loadSettings();
  await loadAppointments();
});

extraSlotForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await api("/api/admin/extra-slots", {
    method: "POST",
    body: JSON.stringify(Object.fromEntries(new FormData(extraSlotForm))),
  });
  extraSlotForm.reset();
  await loadSettings();
  await loadAppointments();
});

bootAdmin().catch((error) => {
  loginMessage.textContent = error.message;
  setAuthed(false);
});
