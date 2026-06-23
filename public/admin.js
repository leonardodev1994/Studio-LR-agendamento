const loginPanel = document.querySelector("#loginPanel");
const adminPanel = document.querySelector("#adminPanel");
const loginForm = document.querySelector("#loginForm");
const loginMessage = document.querySelector("#loginMessage");
const logoutButton = document.querySelector("#logoutButton");
const adminDate = document.querySelector("#adminDate");
const prevDayButton = document.querySelector("#prevDayButton");
const nextDayButton = document.querySelector("#nextDayButton");
const todayButton = document.querySelector("#todayButton");
const prevMonthButton = document.querySelector("#prevMonthButton");
const nextMonthButton = document.querySelector("#nextMonthButton");
const calendarMonthLabel = document.querySelector("#calendarMonthLabel");
const calendarGrid = document.querySelector("#calendarGrid");
const agendaFinanceCards = document.querySelector("#agendaFinanceCards");
const pendingAppointmentsList = document.querySelector("#pendingAppointmentsList");
const selectedDateTitle = document.querySelector("#selectedDateTitle");
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
let currentCalendarMonth = todayIso().slice(0, 7);

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

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value) {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function monthLabel(value) {
  const date = new Date(`${value}-01T12:00:00`);
  return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function addMonths(value, months) {
  const date = new Date(`${value}-01T12:00:00`);
  date.setMonth(date.getMonth() + months);
  return date.toISOString().slice(0, 7);
}

function sourceLabel(value) {
  return value === "admin" ? "Admin" : "Site";
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
    return `Olá, ${item.client_name}. Seu agendamento no Studio LR foi cancelado.\n\nServiço: ${item.service_name}\nData: ${item.appointment_date}\nHorário: ${item.appointment_time}\n\nQualquer dúvida, fale conosco.`;
  }
  if (type === "done") {
    return `Olá, ${item.client_name}! Obrigada por visitar o Studio LR hoje. 💅✨\n\nEsperamos você na próxima manutenção!`;
  }
  if (type === "reschedule") {
    return `Olá, ${item.client_name}! Precisamos ajustar seu horário no Studio LR.\n\nServiço: ${item.service_name}\nData atual: ${item.appointment_date}\nHorário atual: ${item.appointment_time}\n\nPodemos combinar um novo horário?`;
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

function statusClass(status = "") {
  return String(status)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function renderAppointmentCards(container, items, emptyMessage, compact = false) {
  if (!items.length) {
    container.innerHTML = `<p class="form-message">${emptyMessage}</p>`;
    return;
  }

  container.innerHTML = items
    .map((item) => `
      <article class="appointment-card ${compact ? "compact" : ""} status-${statusClass(item.status)} ${item.reschedule_request_id ? "has-reschedule" : ""}" data-appointment-card="${item.id}">
        <div class="appointment-time">${escapeHtml(item.appointment_time)}</div>
        <div class="appointment-main">
          <span class="appointment-status">${item.reschedule_request_id ? "Reagendamento solicitado" : escapeHtml(item.status)}</span>
          <button class="client-link" type="button" data-client-history="${item.client_id}">${escapeHtml(item.client_name)}</button>
          <p>${escapeHtml(item.client_phone)}${item.client_neighborhood ? ` · ${escapeHtml(item.client_neighborhood)}` : ""}</p>
          <p>${escapeHtml(item.service_name)} · ${escapeHtml(item.price_label || moneyLabel(item.price_cents))} · ${escapeHtml(item.duration_minutes)} min</p>
          <p>${escapeHtml(item.notes || "Sem observação")}</p>
          <p>Origem: ${escapeHtml(item.source_label || sourceLabel(item.source))} · Criado em ${escapeHtml(String(item.created_at || "").slice(0, 16).replace("T", " "))}</p>
          ${
            item.reschedule_request_id
              ? `
                <div class="reschedule-note">
                  <strong>Pedido de reagendamento</strong>
                  <span>${escapeHtml(item.requested_date || "Data a combinar")} · ${escapeHtml(item.requested_time || "Horário a combinar")} · ${escapeHtml(item.reschedule_status)}</span>
                  ${item.reschedule_message ? `<p>${escapeHtml(item.reschedule_message)}</p>` : ""}
                </div>
              `
              : ""
          }
        </div>
        <div class="appointment-actions" data-id="${item.id}">
          <button class="button secondary" type="button" data-quick-status="Confirmado">Confirmar</button>
          <button class="button secondary" type="button" data-quick-status="Pendente">Pendente</button>
          <button class="button secondary" type="button" data-quick-status="Concluído">Concluir</button>
          <button class="button secondary" type="button" data-quick-status="Cancelado">Cancelar</button>
          <a class="button secondary" href="${whatsappClientUrl(item.client_phone, whatsappMessage("reschedule", item))}" target="_blank" rel="noreferrer">Reagendar</a>
          <a class="button secondary" href="${whatsappClientUrl(item.client_phone, whatsappMessage("confirm", item))}" target="_blank" rel="noreferrer">WhatsApp confirmar</a>
          <a class="button secondary" href="${whatsappClientUrl(item.client_phone, whatsappMessage("cancel", item))}" target="_blank" rel="noreferrer">WhatsApp cancelar</a>
          <a class="button secondary" href="${whatsappClientUrl(item.client_phone, whatsappMessage("free", item))}" target="_blank" rel="noreferrer">WhatsApp</a>
        </div>
        <form class="appointment-edit-form" data-edit-appointment="${item.id}">
          <div class="form-row two">
            <label>Cliente<input name="client_name" value="${escapeHtml(item.client_name)}" required></label>
            <label>Telefone<input name="client_phone" value="${escapeHtml(item.client_phone)}" required></label>
          </div>
          <label>Bairro<input name="client_neighborhood" value="${escapeHtml(item.client_neighborhood || "")}"></label>
          <label>Serviço<select name="service_id" required>${serviceOptions(item.service_id)}</select></label>
          <div class="form-row two">
            <label>Data<input name="date" type="date" value="${escapeHtml(item.appointment_date)}" required></label>
            <label>Horário<input name="time" type="time" value="${escapeHtml(item.appointment_time)}" required></label>
          </div>
          <label>Status<select name="status">${statuses.map((status) => `<option value="${status}" ${status === item.status ? "selected" : ""}>${status}</option>`).join("")}</select></label>
          <label>Observação<textarea name="notes" rows="2">${escapeHtml(item.notes || "")}</textarea></label>
          <div class="appointment-actions">
            <button class="button primary" type="submit">Salvar alterações</button>
            <button class="button secondary danger" type="button" data-delete-appointment="${item.id}">Excluir</button>
          </div>
          <p class="form-message" data-card-message></p>
        </form>
      </article>
    `)
    .join("");

  attachAppointmentActions(container);
}

function renderAppointments(items) {
  renderAppointmentCards(appointmentsList, items, "Nenhum agendamento para este dia.");
}

function attachAppointmentActions(container) {
  container.querySelectorAll("[data-quick-status]").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = button.closest("[data-id]").dataset.id;
      try {
        await api(`/api/admin/appointments/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ status: button.dataset.quickStatus }),
        });
        setActionMessage(`Status atualizado para ${button.dataset.quickStatus}.`, true);
        await refreshAgenda();
      } catch (error) {
        setActionMessage(error.message || "Não foi possível atualizar o status.");
      }
    });
  });

  container.querySelectorAll("[data-edit-appointment]").forEach((form) => {
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
        currentCalendarMonth = data.date.slice(0, 7);
        await refreshAgenda();
      } catch (error) {
        message.textContent = error.message || "Não foi possível salvar.";
        button.disabled = false;
        button.textContent = "Salvar alterações";
      }
    });
  });

  container.querySelectorAll("[data-delete-appointment]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!confirm("Excluir este agendamento? Esta ação não pode ser desfeita.")) return;
      try {
        await api(`/api/admin/appointments/${button.dataset.deleteAppointment}`, { method: "DELETE" });
        setActionMessage("Agendamento excluído.", true);
        await refreshAgenda();
      } catch (error) {
        setActionMessage(error.message || "Não foi possível excluir.");
      }
    });
  });

  container.querySelectorAll("[data-client-history]").forEach((button) => {
    button.addEventListener("click", () => loadClientHistory(button.dataset.clientHistory));
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
      refreshAgenda();
    });
  });

  settingsList.querySelectorAll("[data-delete-extra]").forEach((button) => {
    button.addEventListener("click", async () => {
      await api(`/api/admin/extra-slots/${button.dataset.deleteExtra}`, { method: "DELETE" });
      loadSettings();
      refreshAgenda();
    });
  });

  settingsList.querySelectorAll("[data-delete-block-slot]").forEach((button) => {
    button.addEventListener("click", async () => {
      await api(`/api/admin/blocked-slots/${button.dataset.deleteBlockSlot}`, { method: "DELETE" });
      await loadSettings();
      await refreshAgenda();
    });
  });
}

function renderAgendaFinance(payload) {
  if (!agendaFinanceCards || !payload) return;
  agendaFinanceCards.innerHTML = [
    metricCard("Previsto do dia", payload.day.forecast_label, "Pendentes + confirmados"),
    metricCard("Realizado do dia", payload.day.realized_label, "Somente concluídos"),
    metricCard("Previsto da semana", payload.week.forecast_label, `${formatDate(payload.week_start)} a ${formatDate(payload.week_end)}`),
    metricCard("Realizado da semana", payload.week.realized_label, "Somente concluídos"),
  ].join("");
}

function renderCalendar(calendar) {
  if (!calendarGrid) return;
  calendarMonthLabel.textContent = monthLabel(calendar.month);
  const dayMap = new Map(calendar.days.map((day) => [day.appointment_date, day]));
  const firstDate = new Date(`${calendar.start}T12:00:00`);
  const lastDate = new Date(`${calendar.end}T12:00:00`);
  const leadingBlanks = (firstDate.getDay() + 6) % 7;
  const cells = [];
  for (let index = 0; index < leadingBlanks; index += 1) {
    cells.push("<span class='calendar-day empty'></span>");
  }
  for (let day = 1; day <= lastDate.getDate(); day += 1) {
    const date = `${calendar.month}-${String(day).padStart(2, "0")}`;
    const info = dayMap.get(date);
    const isToday = date === todayIso();
    const isSelected = date === adminDate.value;
    cells.push(`
      <button class="calendar-day ${info ? `density-${info.density}` : ""} ${isToday ? "today" : ""} ${isSelected ? "selected" : ""}" type="button" data-calendar-date="${date}">
        <span>${day}</span>
        ${info ? `<strong>${info.total}</strong>` : ""}
      </button>
    `);
  }
  calendarGrid.innerHTML = cells.join("");
  calendarGrid.querySelectorAll("[data-calendar-date]").forEach((button) => {
    button.addEventListener("click", async () => {
      adminDate.value = button.dataset.calendarDate;
      currentCalendarMonth = adminDate.value.slice(0, 7);
      await refreshAgenda();
    });
  });
}

function renderPending(items) {
  if (!pendingAppointmentsList) return;
  renderAppointmentCards(pendingAppointmentsList, items, "Nenhum agendamento pendente.", true);
}

async function loadCalendar() {
  const payload = await api(`/api/admin/calendar?month=${currentCalendarMonth}`);
  renderCalendar(payload.calendar);
}

async function loadPendingAppointments() {
  const payload = await api("/api/admin/pending-appointments");
  renderPending(payload.appointments);
}

async function loadAgendaFinance() {
  const payload = await api(`/api/admin/finance-summary?date=${adminDate.value}`);
  renderAgendaFinance(payload.finance);
}

async function refreshAgenda() {
  await Promise.all([
    loadAppointments(),
    loadCalendar(),
    loadPendingAppointments(),
    loadAgendaFinance(),
    loadDashboard(),
  ]);
}

async function loadClientHistory(clientId) {
  try {
    const payload = await api(`/api/admin/clients/${clientId}`);
    const history = payload.history;
    const client = history.client;
    const services = history.services.length
      ? history.services.map((service) => `<li>${escapeHtml(service.name)} <strong>${service.total}</strong></li>`).join("")
      : "Nenhum serviço concluído ainda";
    const next = history.next_appointment
      ? `${formatDate(history.next_appointment.appointment_date)} às ${history.next_appointment.appointment_time} · ${history.next_appointment.service_name}`
      : "Sem próximo atendimento";
    let modal = document.querySelector("#clientHistoryModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "clientHistoryModal";
      modal.className = "client-history-modal hidden";
      document.body.appendChild(modal);
    }
    modal.innerHTML = `
      <div class="client-history-panel">
        <button class="modal-close" type="button" data-close-client-history>Fechar</button>
        <p class="eyebrow">Histórico da cliente</p>
        <h2>${escapeHtml(client.name)}</h2>
        <div class="history-grid">
          <span>Telefone<strong>${escapeHtml(client.phone)}</strong></span>
          <span>Bairro<strong>${escapeHtml(client.neighborhood || "Não informado")}</strong></span>
          <span>Visitas concluídas<strong>${history.total_visits}</strong></span>
          <span>Total gasto<strong>${escapeHtml(history.total_spent_label)}</strong></span>
          <span>Último atendimento<strong>${history.last_visit ? formatDate(history.last_visit) : "Nenhum"}</strong></span>
          <span>Próximo atendimento<strong>${escapeHtml(next)}</strong></span>
          <span>Status<strong>${history.recurring ? "Cliente recorrente" : "Nova cliente"}</strong></span>
        </div>
        <h3>Serviços já realizados</h3>
        ${history.services.length ? `<ul>${services}</ul>` : `<p>${services}</p>`}
      </div>
    `;
    modal.classList.remove("hidden");
    modal.querySelector("[data-close-client-history]").addEventListener("click", () => modal.classList.add("hidden"));
    modal.addEventListener("click", (event) => {
      if (event.target === modal) modal.classList.add("hidden");
    }, { once: true });
  } catch (error) {
    setActionMessage(error.message || "Não foi possível carregar o histórico da cliente.");
  }
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
    metricCard("Previsto hoje", dashboard.forecast_today_label),
    metricCard("Realizado hoje", dashboard.realized_today_label),
    metricCard("Previsto semana", dashboard.forecast_week_label),
    metricCard("Realizado semana", dashboard.realized_week_label),
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
    metricCard("Previsto hoje", finance.daily_forecast_label, "Pendentes + confirmados."),
    metricCard("Realizado hoje", finance.daily_realized_label, "Somente concluídos."),
    metricCard("Previsto semana", finance.weekly_forecast_label, "Pendentes + confirmados."),
    metricCard("Realizado semana", finance.weekly_realized_label, "Somente concluídos."),
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
    loadCalendar(),
    loadPendingAppointments(),
    loadAgendaFinance(),
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
  if (selectedDateTitle) selectedDateTitle.textContent = `Agenda de ${formatDate(adminDate.value)}`;
  renderAppointments(payload.appointments);
}

async function loadSettings() {
  const payload = await api("/api/admin/settings");
  renderSettings(payload);
}

async function bootAdmin() {
  adminDate.value = todayIso();
  currentCalendarMonth = adminDate.value.slice(0, 7);
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

adminDate.addEventListener("change", async () => {
  currentCalendarMonth = adminDate.value.slice(0, 7);
  await refreshAgenda();
});
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
  currentCalendarMonth = adminDate.value.slice(0, 7);
  refreshAgenda();
});
nextDayButton?.addEventListener("click", () => {
  adminDate.value = addDays(adminDate.value, 1);
  currentCalendarMonth = adminDate.value.slice(0, 7);
  refreshAgenda();
});
todayButton?.addEventListener("click", () => {
  adminDate.value = todayIso();
  currentCalendarMonth = adminDate.value.slice(0, 7);
  refreshAgenda();
});

prevMonthButton?.addEventListener("click", () => {
  currentCalendarMonth = addMonths(currentCalendarMonth, -1);
  loadCalendar();
});

nextMonthButton?.addEventListener("click", () => {
  currentCalendarMonth = addMonths(currentCalendarMonth, 1);
  loadCalendar();
});

blockDayForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await api("/api/admin/blocked-days", {
    method: "POST",
    body: JSON.stringify(Object.fromEntries(new FormData(blockDayForm))),
  });
  blockDayForm.reset();
  await loadSettings();
  await refreshAgenda();
});

blockSlotForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  await api("/api/admin/blocked-slots", {
    method: "POST",
    body: JSON.stringify(Object.fromEntries(new FormData(blockSlotForm))),
  });
  blockSlotForm.reset();
  await loadSettings();
  await refreshAgenda();
});

extraSlotForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await api("/api/admin/extra-slots", {
    method: "POST",
    body: JSON.stringify(Object.fromEntries(new FormData(extraSlotForm))),
  });
  extraSlotForm.reset();
  await loadSettings();
  await refreshAgenda();
});

bootAdmin().catch((error) => {
  loginMessage.textContent = error.message;
  setAuthed(false);
});
