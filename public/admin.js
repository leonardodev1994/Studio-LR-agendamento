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
const weeklyHoursList = document.querySelector("#weeklyHoursList");
const settingsList = document.querySelector("#settingsList");
const adminTabs = document.querySelectorAll("[data-admin-module]");
const adminModules = document.querySelectorAll("[data-module-panel]");
const dashboardCards = document.querySelector("#dashboardCards");
const dashboardTodayList = document.querySelector("#dashboardTodayList");
const dashboardPendingList = document.querySelector("#dashboardPendingList");
const adminServicesList = document.querySelector("#adminServicesList");
const clientsList = document.querySelector("#clientsList");
const clientSearch = document.querySelector("#clientSearch");
const financeSummary = document.querySelector("#financeSummary");
const adminGalleryList = document.querySelector("#adminGalleryList");
const configSummary = document.querySelector("#configSummary");
const opsTodayLabel = document.querySelector("#opsTodayLabel");

const statuses = ["Pendente", "Confirmado", "Cancelado", "Concluído"];
const weekdays = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
let catalog = [];
let clientsCache = [];
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
  const response = await fetch(path, { method: "POST", body: formData });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "Algo deu errado.");
  return payload;
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
  const [year, month, day] = String(value).slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

function monthLabel(value) {
  return new Date(`${value}-01T12:00:00`).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function addDays(value, days) {
  const date = new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function addMonths(value, months) {
  const date = new Date(`${value}-01T12:00:00`);
  date.setMonth(date.getMonth() + months);
  return date.toISOString().slice(0, 7);
}

function statusClass(status = "") {
  return String(status).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function moneyLabel(cents = 0) {
  return `R$ ${(Number(cents || 0) / 100).toFixed(2).replace(".", ",")}`;
}

function metricCard(label, value, detail = "") {
  return `<article class="ops-card"><span>${label}</span><strong>${value}</strong>${detail ? `<p>${detail}</p>` : ""}</article>`;
}

function serviceOptions(selectedId) {
  return catalog
    .filter((service) => service.bookable !== false && service.service_id && service.active !== false)
    .map((service) => `<option value="${service.service_id}" ${Number(service.service_id) === Number(selectedId) ? "selected" : ""}>${escapeHtml(service.name)}</option>`)
    .join("");
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
  if (type === "reschedule") {
    return `Olá, ${item.client_name}! Precisamos ajustar seu horário no Studio LR.\n\nServiço: ${item.service_name}\nData atual: ${item.appointment_date}\nHorário atual: ${item.appointment_time}\n\nPodemos combinar um novo horário?`;
  }
  return `Olá, ${item.client_name}! Seu agendamento no Studio LR foi confirmado. 💅✨\n\nServiço: ${item.service_name}\nData: ${item.appointment_date}\nHorário: ${item.appointment_time}\n\nEsperamos você!`;
}

function setAuthed(value) {
  loginPanel.classList.toggle("hidden", value);
  adminPanel.classList.toggle("hidden", !value);
}

function setModule(moduleName) {
  adminTabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.adminModule === moduleName));
  adminModules.forEach((module) => module.classList.toggle("hidden", module.dataset.modulePanel !== moduleName));
}

function setActionMessage(message, success = false) {
  if (!appointmentActionMessage) return;
  appointmentActionMessage.textContent = message;
  appointmentActionMessage.className = success ? "ops-message success" : "ops-message";
}

async function updateAppointment(id, payload) {
  await api(`/api/admin/appointments/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
  setActionMessage("Agendamento atualizado.", true);
  await refreshAll();
}

async function deleteAppointment(id) {
  if (!confirm("Excluir este agendamento? Esta ação não pode ser desfeita.")) return;
  await api(`/api/admin/appointments/${id}`, { method: "DELETE" });
  setActionMessage("Agendamento excluído.", true);
  await refreshAll();
}

function appointmentSummary(item) {
  return `
    <div class="ops-appointment-main">
      <span class="ops-status ${statusClass(item.status)}">${item.reschedule_request_id ? "Reagendamento solicitado" : escapeHtml(item.status)}</span>
      <button class="ops-client-link" type="button" data-client-history="${item.client_id}">${escapeHtml(item.client_name)}</button>
      <p>${escapeHtml(item.client_phone)}${item.client_neighborhood ? ` · ${escapeHtml(item.client_neighborhood)}` : ""}</p>
      <p>${escapeHtml(item.service_name)} · ${escapeHtml(item.price_label || moneyLabel(item.price_cents))} · ${escapeHtml(item.duration_minutes)} min</p>
      <p>${escapeHtml(item.notes || "Sem observação")}</p>
      <small>Origem: ${item.source === "admin" ? "Admin" : "Site"} · Criado em ${escapeHtml(String(item.created_at || "").slice(0, 16).replace("T", " "))}</small>
    </div>
  `;
}

function appointmentActions(item) {
  return `
    <div class="ops-row-actions" data-actions-for="${item.id}">
      <button class="ops-button success" type="button" data-status="Confirmado">Confirmar</button>
      <button class="ops-button info" type="button" data-status="Concluído">Concluir</button>
      <button class="ops-button warn" type="button" data-status="Pendente">Pendente</button>
      <button class="ops-button danger" type="button" data-status="Cancelado">Cancelar</button>
      <a class="ops-button ghost" target="_blank" rel="noreferrer" href="${whatsappClientUrl(item.client_phone, whatsappMessage("confirm", item))}">WhatsApp</a>
    </div>
  `;
}

function appointmentEditForm(item) {
  return `
    <details class="ops-edit-box">
      <summary>Editar / reagendar</summary>
      <form data-edit-appointment="${item.id}" class="ops-inline-form">
        <label>Cliente<input name="client_name" value="${escapeHtml(item.client_name)}" required></label>
        <label>Telefone<input name="client_phone" value="${escapeHtml(item.client_phone)}" required></label>
        <label>Bairro<input name="client_neighborhood" value="${escapeHtml(item.client_neighborhood || "")}"></label>
        <label>Serviço<select name="service_id" required>${serviceOptions(item.service_id)}</select></label>
        <label>Data<input name="date" type="date" value="${escapeHtml(item.appointment_date)}" required></label>
        <label>Horário<input name="time" type="time" value="${escapeHtml(item.appointment_time)}" required></label>
        <label>Status<select name="status">${statuses.map((status) => `<option value="${status}" ${status === item.status ? "selected" : ""}>${status}</option>`).join("")}</select></label>
        <label class="wide">Observação<textarea name="notes" rows="2">${escapeHtml(item.notes || "")}</textarea></label>
        <button class="ops-button primary" type="submit">Salvar</button>
        <button class="ops-button danger" type="button" data-delete-appointment="${item.id}">Excluir</button>
      </form>
    </details>
  `;
}

function bindAppointmentActions(container) {
  container.querySelectorAll("[data-actions-for] [data-status]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await updateAppointment(button.closest("[data-actions-for]").dataset.actionsFor, { status: button.dataset.status });
      } catch (error) {
        setActionMessage(error.message || "Não foi possível atualizar.");
      }
    });
  });

  container.querySelectorAll("[data-edit-appointment]").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(form));
      try {
        await updateAppointment(form.dataset.editAppointment, data);
        adminDate.value = data.date;
        currentCalendarMonth = data.date.slice(0, 7);
      } catch (error) {
        setActionMessage(error.message || "Não foi possível salvar.");
      }
    });
  });

  container.querySelectorAll("[data-delete-appointment]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await deleteAppointment(button.dataset.deleteAppointment);
      } catch (error) {
        setActionMessage(error.message || "Não foi possível excluir.");
      }
    });
  });

  container.querySelectorAll("[data-client-history]").forEach((button) => {
    button.addEventListener("click", () => openClientHistory(button.dataset.clientHistory));
  });
}

function renderTimeline(items) {
  if (!items.length) {
    appointmentsList.innerHTML = `<p class="ops-empty">Nenhum agendamento para este dia.</p>`;
    return;
  }
  appointmentsList.innerHTML = items.map((item) => `
    <article class="ops-appointment status-border-${statusClass(item.status)}">
      <time>${escapeHtml(item.appointment_time)}</time>
      ${appointmentSummary(item)}
      ${appointmentActions(item)}
      ${appointmentEditForm(item)}
    </article>
  `).join("");
  bindAppointmentActions(appointmentsList);
}

function renderAppointmentTable(container, items, emptyMessage = "Nenhum registro encontrado.") {
  if (!items.length) {
    container.innerHTML = `<p class="ops-empty">${emptyMessage}</p>`;
    return;
  }
  container.innerHTML = `
    <table class="ops-table">
      <thead>
        <tr>
          <th>Data</th><th>Hora</th><th>Cliente</th><th>Serviço</th><th>Valor</th><th>Status</th><th>Ações</th>
        </tr>
      </thead>
      <tbody>
        ${items.map((item) => `
          <tr>
            <td>${formatDate(item.appointment_date)}</td>
            <td>${escapeHtml(item.appointment_time)}</td>
            <td><button class="ops-table-link" type="button" data-client-history="${item.client_id}">${escapeHtml(item.client_name)}</button><small>${escapeHtml(item.client_phone)}</small></td>
            <td>${escapeHtml(item.service_name)}<small>${escapeHtml(item.duration_minutes)} min</small></td>
            <td>${escapeHtml(item.price_label || moneyLabel(item.price_cents))}</td>
            <td><span class="ops-status ${statusClass(item.status)}">${escapeHtml(item.status)}</span></td>
            <td>${appointmentActions(item)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
  bindAppointmentActions(container);
}

function renderCalendar(calendar) {
  calendarMonthLabel.textContent = monthLabel(calendar.month);
  const dayMap = new Map(calendar.days.map((day) => [day.appointment_date, day]));
  const firstDate = new Date(`${calendar.start}T12:00:00`);
  const lastDate = new Date(`${calendar.end}T12:00:00`);
  const leadingBlanks = (firstDate.getDay() + 6) % 7;
  const cells = [];
  for (let index = 0; index < leadingBlanks; index += 1) cells.push("<span class='ops-day empty'></span>");
  for (let day = 1; day <= lastDate.getDate(); day += 1) {
    const date = `${calendar.month}-${String(day).padStart(2, "0")}`;
    const info = dayMap.get(date);
    cells.push(`
      <button class="ops-day ${date === todayIso() ? "today" : ""} ${date === adminDate.value ? "selected" : ""} ${info ? `density-${info.density}` : ""}" type="button" data-calendar-date="${date}">
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
    metricCard("Faturamento previsto", dashboard.forecast_today_label, "Hoje"),
    metricCard("Faturamento realizado", dashboard.realized_today_label, "Hoje"),
    metricCard("Próximo atendimento", next ? `${formatDate(next.appointment_date)} ${next.appointment_time}` : "Nenhum", next ? `${next.client_name} · ${next.service_name}` : "Agenda livre"),
  ].join("");
  const todayPayload = await api(`/api/admin/appointments?date=${todayIso()}`);
  dashboardTodayList.innerHTML = todayPayload.appointments.slice(0, 4).map((item) => `
    <div class="ops-mini-row"><strong>${escapeHtml(item.appointment_time)}</strong><span>${escapeHtml(item.client_name)} · ${escapeHtml(item.service_name)}</span><em>${escapeHtml(item.status)}</em></div>
  `).join("") || `<p class="ops-empty">Nenhum atendimento hoje.</p>`;
  const pendingPayload = await api("/api/admin/pending-appointments");
  dashboardPendingList.innerHTML = pendingPayload.appointments.slice(0, 4).map((item) => `
    <div class="ops-mini-row"><strong>${formatDate(item.appointment_date)}</strong><span>${escapeHtml(item.client_name)} · ${escapeHtml(item.service_name)}</span><em>${escapeHtml(item.appointment_time)}</em></div>
  `).join("") || `<p class="ops-empty">Sem pendências.</p>`;
}

async function loadAgendaFinance() {
  const payload = await api(`/api/admin/finance-summary?date=${adminDate.value}`);
  const finance = payload.finance;
  agendaFinanceCards.innerHTML = [
    metricCard("Previsto do dia", finance.day.forecast_label, "Pendentes + confirmados"),
    metricCard("Realizado do dia", finance.day.realized_label, "Somente concluídos"),
    metricCard("Previsto da semana", finance.week.forecast_label, `${formatDate(finance.week_start)} a ${formatDate(finance.week_end)}`),
    metricCard("Realizado da semana", finance.week.realized_label, "Somente concluídos"),
  ].join("");
}

async function loadCalendar() {
  const payload = await api(`/api/admin/calendar?month=${currentCalendarMonth}`);
  renderCalendar(payload.calendar);
}

async function loadAppointments() {
  const filters = new URLSearchParams(new FormData(appointmentFilters));
  filters.set("date", adminDate.value);
  const payload = await api(`/api/admin/appointments?${filters.toString()}`);
  selectedDateTitle.textContent = `Agenda de ${formatDate(adminDate.value)}`;
  renderTimeline(payload.appointments);
}

async function loadPendingAppointments() {
  const payload = await api("/api/admin/pending-appointments");
  renderAppointmentTable(pendingAppointmentsList, payload.appointments, "Nenhum agendamento pendente.");
}

async function refreshAgenda() {
  await Promise.all([loadAppointments(), loadCalendar(), loadAgendaFinance(), loadPendingAppointments()]);
}

async function refreshAll() {
  await Promise.all([loadDashboard(), refreshAgenda(), loadClients(), loadFinance()]);
}

async function loadClients() {
  const payload = await api("/api/admin/clients");
  clientsCache = payload.clients || [];
  renderClients();
}

function renderClients() {
  const term = String(clientSearch?.value || "").toLowerCase();
  const clients = clientsCache.filter((client) => [client.name, client.phone, client.neighborhood].join(" ").toLowerCase().includes(term));
  if (!clients.length) {
    clientsList.innerHTML = `<p class="ops-empty">Nenhuma cliente encontrada.</p>`;
    return;
  }
  clientsList.innerHTML = `
    <table class="ops-table">
      <thead><tr><th>Cliente</th><th>Telefone</th><th>Bairro</th><th>Visitas</th><th>Último</th><th>Próximo</th><th>Total gasto</th></tr></thead>
      <tbody>${clients.map((client) => `
        <tr>
          <td><button class="ops-table-link" type="button" data-client-history="${client.id}">${escapeHtml(client.name)}</button></td>
          <td>${escapeHtml(client.phone)}</td>
          <td>${escapeHtml(client.neighborhood || "Não informado")}</td>
          <td>${client.visits || 0}</td>
          <td>${client.last_visit ? formatDate(client.last_visit) : "-"}</td>
          <td>${client.next_visit ? escapeHtml(client.next_visit) : "-"}</td>
          <td>${escapeHtml(client.total_spent_label || "R$ 0,00")}</td>
        </tr>
      `).join("")}</tbody>
    </table>
  `;
  clientsList.querySelectorAll("[data-client-history]").forEach((button) => {
    button.addEventListener("click", () => openClientHistory(button.dataset.clientHistory));
  });
}

async function openClientHistory(clientId) {
  const payload = await api(`/api/admin/clients/${clientId}`);
  const history = payload.history;
  const client = history.client;
  let modal = document.querySelector("#opsModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "opsModal";
    modal.className = "ops-modal hidden";
    document.body.appendChild(modal);
  }
  modal.innerHTML = `
    <section class="ops-modal-panel">
      <button class="ops-modal-close" type="button" data-close-modal>Fechar</button>
      <span>Histórico da cliente</span>
      <h2>${escapeHtml(client.name)}</h2>
      <div class="ops-metrics compact">
        ${metricCard("Telefone", client.phone)}
        ${metricCard("Bairro", client.neighborhood || "Não informado")}
        ${metricCard("Visitas concluídas", history.total_visits)}
        ${metricCard("Total gasto", history.total_spent_label)}
        ${metricCard("Último atendimento", history.last_visit ? formatDate(history.last_visit) : "Nenhum")}
        ${metricCard("Status", history.recurring ? "Recorrente" : "Nova cliente")}
      </div>
      <h3>Serviços concluídos</h3>
      <div class="ops-list">
        ${history.services.length ? history.services.map((service) => `<div class="ops-mini-row"><span>${escapeHtml(service.name)}</span><strong>${service.total}</strong></div>`).join("") : `<p class="ops-empty">Nenhum serviço concluído ainda.</p>`}
      </div>
    </section>
  `;
  modal.classList.remove("hidden");
  modal.querySelector("[data-close-modal]").addEventListener("click", () => modal.classList.add("hidden"));
  modal.addEventListener("click", (event) => {
    if (event.target === modal) modal.classList.add("hidden");
  }, { once: true });
}

async function loadFinance() {
  const payload = await api("/api/admin/finance");
  const finance = payload.finance;
  financeSummary.innerHTML = [
    metricCard("Previsto hoje", finance.daily_forecast_label, "Pendentes + confirmados"),
    metricCard("Realizado hoje", finance.daily_realized_label, "Concluídos"),
    metricCard("Previsto semana", finance.weekly_forecast_label, "Pendentes + confirmados"),
    metricCard("Realizado semana", finance.weekly_realized_label, "Concluídos"),
    metricCard("Previsto mês", finance.monthly_forecast_label, "Pendentes + confirmados"),
    metricCard("Realizado mês", finance.monthly_realized_label, "Concluídos"),
  ].join("");
}

async function loadAdminServices() {
  const payload = await api("/api/admin/catalog");
  catalog = payload.catalog || [];
  const serviceFilter = appointmentFilters.querySelector("select[name='service_id']");
  serviceFilter.innerHTML = `<option value="">Todos os serviços</option>${serviceOptions("")}`;
  adminServicesList.innerHTML = catalog.map((service) => `
    <form class="ops-service-card" data-service-form="${service.key}">
      <button class="ops-service-photo" type="button" data-service-photo-pick="${service.key}">
        ${service.image ? `<img src="${service.image}" alt="${escapeHtml(service.name)}" loading="lazy" decoding="async">` : `<span>${escapeHtml(service.icon || "LR")}</span>`}
        <small>Alterar foto</small>
      </button>
      <input class="hidden" type="file" accept="image/jpeg,image/png,image/webp" data-service-photo-input="${service.key}">
      <label>Nome<input name="name" value="${escapeHtml(service.name)}" required></label>
      <label>Categoria<input name="category" value="${escapeHtml(service.category || "")}"></label>
      <label>Valor<input name="price_label" value="${escapeHtml(service.price_label || "")}" required></label>
      <label>Duração<input name="duration_label" value="${escapeHtml(service.duration_label || "")}" required></label>
      <label class="wide">Descrição<textarea name="description" rows="3">${escapeHtml(service.description || "")}</textarea></label>
      <label class="ops-check"><input name="active" type="checkbox" ${service.active === false ? "" : "checked"} ${service.bookable === false ? "disabled" : ""}> Ativo no agendamento</label>
      <button class="ops-button primary" type="submit">Salvar serviço</button>
      <p class="ops-message" data-service-message></p>
    </form>
  `).join("");

  adminServicesList.querySelectorAll("[data-service-photo-pick]").forEach((button) => {
    button.addEventListener("click", () => adminServicesList.querySelector(`[data-service-photo-input="${button.dataset.servicePhotoPick}"]`)?.click());
  });
  adminServicesList.querySelectorAll("[data-service-photo-input]").forEach((input) => {
    input.addEventListener("change", async () => {
      const file = input.files?.[0];
      if (!file) return;
      const message = input.closest(".ops-service-card").querySelector("[data-service-message]");
      message.textContent = "Enviando foto...";
      const formData = new FormData();
      formData.append("photo", file);
      try {
        await uploadApi(`/api/admin/catalog/photo/${input.dataset.servicePhotoInput}`, formData);
        await loadAdminServices();
      } catch (error) {
        message.textContent = error.message || "Não foi possível trocar a foto.";
      }
    });
  });
  adminServicesList.querySelectorAll("[data-service-form]").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(form));
      const message = form.querySelector("[data-service-message]");
      try {
        await api(`/api/admin/catalog/${form.dataset.serviceForm}`, {
          method: "PATCH",
          body: JSON.stringify({
            name: data.name,
            category: data.category,
            price_label: data.price_label,
            duration_label: data.duration_label,
            description: data.description,
            active: Boolean(data.active),
          }),
        });
        message.textContent = "Serviço atualizado.";
        await loadAdminServices();
      } catch (error) {
        message.textContent = error.message || "Não foi possível salvar.";
      }
    });
  });
}

async function loadSettings() {
  const payload = await api("/api/admin/settings");
  weeklyHoursList.innerHTML = payload.hours.map((hour) => `
    <form class="ops-week-row" data-week-hour="${hour.id}">
      <strong>${weekdays[hour.weekday] || `Dia ${hour.weekday}`}</strong>
      <input name="start_time" type="time" value="${escapeHtml(hour.start_time)}">
      <input name="end_time" type="time" value="${escapeHtml(hour.end_time)}">
      <input name="slot_minutes" type="number" min="15" max="240" step="15" value="${hour.slot_minutes}">
      <label><input name="active" type="checkbox" ${hour.active ? "checked" : ""}> Ativo</label>
      <button class="ops-button ghost" type="submit">Salvar</button>
    </form>
  `).join("");
  weeklyHoursList.querySelectorAll("[data-week-hour]").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(form));
      await api(`/api/admin/weekly-hours/${form.dataset.weekHour}`, {
        method: "PATCH",
        body: JSON.stringify({ ...data, active: Boolean(data.active) }),
      });
      await refreshAgenda();
    });
  });

  const blockedDays = payload.blocked_days.map((day) => `<div class="ops-mini-row"><span>Dia bloqueado: ${formatDate(day.block_date)} ${escapeHtml(day.reason || "")}</span><button class="ops-button danger" type="button" data-delete-block="${day.id}">Remover</button></div>`).join("");
  const blockedSlots = (payload.blocked_slots || []).map((slot) => `<div class="ops-mini-row"><span>Horário bloqueado: ${formatDate(slot.slot_date)} ${escapeHtml(slot.slot_time)} ${escapeHtml(slot.reason || "")}</span><button class="ops-button danger" type="button" data-delete-block-slot="${slot.id}">Remover</button></div>`).join("");
  const extras = payload.extra_slots.map((slot) => `<div class="ops-mini-row"><span>Extra: ${formatDate(slot.slot_date)} ${escapeHtml(slot.slot_time)} ${escapeHtml(slot.note || "")}</span><button class="ops-button danger" type="button" data-delete-extra="${slot.id}">Remover</button></div>`).join("");
  settingsList.innerHTML = blockedDays + blockedSlots + extras || `<p class="ops-empty">Nenhum bloqueio ou extra cadastrado.</p>`;
  settingsList.querySelectorAll("[data-delete-block]").forEach((button) => button.addEventListener("click", async () => {
    await api(`/api/admin/blocked-days/${button.dataset.deleteBlock}`, { method: "DELETE" });
    await loadSettings();
    await refreshAgenda();
  }));
  settingsList.querySelectorAll("[data-delete-block-slot]").forEach((button) => button.addEventListener("click", async () => {
    await api(`/api/admin/blocked-slots/${button.dataset.deleteBlockSlot}`, { method: "DELETE" });
    await loadSettings();
    await refreshAgenda();
  }));
  settingsList.querySelectorAll("[data-delete-extra]").forEach((button) => button.addEventListener("click", async () => {
    await api(`/api/admin/extra-slots/${button.dataset.deleteExtra}`, { method: "DELETE" });
    await loadSettings();
    await refreshAgenda();
  }));
}

async function loadAdminGallery() {
  const payload = await api("/api/admin/gallery");
  adminGalleryList.innerHTML = payload.gallery.map((item) => `
    <article class="ops-gallery-card">
      <button type="button" data-gallery-pick="${item.index}">
        <img src="${item.src}" alt="${escapeHtml(item.alt)}" loading="lazy" decoding="async">
        <span>Foto ${String(item.index).padStart(2, "0")}</span>
      </button>
      <input class="hidden" type="file" accept="image/jpeg,image/png,image/webp" data-gallery-input="${item.index}">
    </article>
  `).join("");
  adminGalleryList.querySelectorAll("[data-gallery-pick]").forEach((button) => button.addEventListener("click", () => {
    adminGalleryList.querySelector(`[data-gallery-input="${button.dataset.galleryPick}"]`)?.click();
  }));
  adminGalleryList.querySelectorAll("[data-gallery-input]").forEach((input) => input.addEventListener("change", async () => {
    const file = input.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("index", input.dataset.galleryInput);
    formData.append("photo", file);
    await uploadApi("/api/admin/gallery", formData);
    await loadAdminGallery();
  }));
}

async function loadConfig() {
  const payload = await api("/api/admin/config");
  const config = payload.config;
  configSummary.innerHTML = [
    metricCard("Ambiente", config.app_env),
    metricCard("Banco", config.database),
    metricCard("WhatsApp", config.whatsapp_configured ? "Configurado" : "Pendente"),
    metricCard("Senha admin", config.admin_password_configured ? "Configurada" : "Pendente"),
  ].join("");
}

async function loadAdminModules() {
  await loadAdminServices();
  await Promise.all([
    loadDashboard(),
    refreshAgenda(),
    loadClients(),
    loadFinance(),
    loadSettings(),
    loadAdminGallery(),
    loadConfig(),
  ]);
}

async function bootAdmin() {
  adminDate.value = todayIso();
  currentCalendarMonth = adminDate.value.slice(0, 7);
  opsTodayLabel.textContent = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
  const session = await api("/api/admin/session");
  setAuthed(session.authenticated);
  if (session.authenticated) await loadAdminModules();
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  loginMessage.textContent = "";
  try {
    await api("/api/admin/login", { method: "POST", body: JSON.stringify(Object.fromEntries(new FormData(loginForm))) });
    setAuthed(true);
    await loadAdminModules();
  } catch (error) {
    loginMessage.textContent = error.message;
  }
});

logoutButton.addEventListener("click", async () => {
  await api("/api/admin/logout", { method: "POST", body: "{}" });
  setAuthed(false);
});

adminTabs.forEach((tab) => tab.addEventListener("click", () => setModule(tab.dataset.adminModule)));
document.querySelectorAll("[data-jump-module]").forEach((button) => button.addEventListener("click", () => setModule(button.dataset.jumpModule)));
clientSearch?.addEventListener("input", renderClients);
appointmentFilters.addEventListener("submit", async (event) => {
  event.preventDefault();
  await loadAppointments();
});
appointmentFilters.addEventListener("input", () => window.setTimeout(loadAppointments, 250));
adminDate.addEventListener("change", async () => {
  currentCalendarMonth = adminDate.value.slice(0, 7);
  await refreshAgenda();
});
prevDayButton.addEventListener("click", async () => {
  adminDate.value = addDays(adminDate.value, -1);
  currentCalendarMonth = adminDate.value.slice(0, 7);
  await refreshAgenda();
});
nextDayButton.addEventListener("click", async () => {
  adminDate.value = addDays(adminDate.value, 1);
  currentCalendarMonth = adminDate.value.slice(0, 7);
  await refreshAgenda();
});
todayButton.addEventListener("click", async () => {
  adminDate.value = todayIso();
  currentCalendarMonth = adminDate.value.slice(0, 7);
  await refreshAgenda();
});
prevMonthButton.addEventListener("click", async () => {
  currentCalendarMonth = addMonths(currentCalendarMonth, -1);
  await loadCalendar();
});
nextMonthButton.addEventListener("click", async () => {
  currentCalendarMonth = addMonths(currentCalendarMonth, 1);
  await loadCalendar();
});

blockDayForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await api("/api/admin/blocked-days", { method: "POST", body: JSON.stringify(Object.fromEntries(new FormData(blockDayForm))) });
  blockDayForm.reset();
  await loadSettings();
  await refreshAgenda();
});
blockSlotForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await api("/api/admin/blocked-slots", { method: "POST", body: JSON.stringify(Object.fromEntries(new FormData(blockSlotForm))) });
  blockSlotForm.reset();
  await loadSettings();
  await refreshAgenda();
});
extraSlotForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await api("/api/admin/extra-slots", { method: "POST", body: JSON.stringify(Object.fromEntries(new FormData(extraSlotForm))) });
  extraSlotForm.reset();
  await loadSettings();
  await refreshAgenda();
});

bootAdmin().catch((error) => {
  loginMessage.textContent = error.message;
  setAuthed(false);
});
