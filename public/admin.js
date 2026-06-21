const loginPanel = document.querySelector("#loginPanel");
const adminPanel = document.querySelector("#adminPanel");
const loginForm = document.querySelector("#loginForm");
const loginMessage = document.querySelector("#loginMessage");
const logoutButton = document.querySelector("#logoutButton");
const adminDate = document.querySelector("#adminDate");
const appointmentsList = document.querySelector("#appointmentsList");
const blockDayForm = document.querySelector("#blockDayForm");
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

function renderAppointments(items) {
  if (!items.length) {
    appointmentsList.innerHTML = "<p class='form-message'>Nenhum agendamento para este dia.</p>";
    return;
  }

  appointmentsList.innerHTML = items
    .map((item) => `
      <article class="appointment-card">
        <div class="appointment-time">${item.appointment_time}</div>
        <div>
          <h3>${item.client_name}</h3>
          <p>${item.service_name} · ${item.client_phone}${item.client_neighborhood ? ` · ${item.client_neighborhood}` : ""}</p>
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
          <select data-action="status">
            ${statuses.map((status) => `<option value="${status}" ${status === item.status ? "selected" : ""}>${status}</option>`).join("")}
          </select>
          <input type="date" data-action="date" value="${item.appointment_date}">
          <input type="time" data-action="time" value="${item.appointment_time}">
          <button class="button secondary" type="button" data-action="reschedule">Remarcar</button>
        </div>
      </article>
    `)
    .join("");

  appointmentsList.querySelectorAll("[data-action='status']").forEach((select) => {
    select.addEventListener("change", async () => {
      const id = select.closest("[data-id]").dataset.id;
      await api(`/api/admin/appointments/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: select.value }),
      });
      loadAppointments();
    });
  });

  appointmentsList.querySelectorAll("[data-action='reschedule']").forEach((button) => {
    button.addEventListener("click", async () => {
      const wrapper = button.closest("[data-id]");
      const id = wrapper.dataset.id;
      const date = wrapper.querySelector("[data-action='date']").value;
      const time = wrapper.querySelector("[data-action='time']").value;
      try {
        await api(`/api/admin/appointments/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ date, time }),
        });
        adminDate.value = date;
        loadAppointments();
      } catch (error) {
        alert(error.message);
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

  settingsList.innerHTML = `<div class="settings-items">${blocked || ""}${extras || ""}</div>` || "";
  if (!blocked && !extras) {
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
}

async function loadDashboard() {
  const payload = await api("/api/admin/dashboard");
  const dashboard = payload.dashboard;
  const next = dashboard.next_appointment;
  dashboardCards.innerHTML = [
    metricCard("Agendamentos hoje", dashboard.appointments_today),
    metricCard("Próximos 7 dias", dashboard.appointments_week),
    metricCard("Faturamento previsto", dashboard.forecast_week_label),
    metricCard(
      "Próximo atendimento",
      next ? `${next.appointment_date} às ${next.appointment_time}` : "Nenhum",
      next ? `${next.client_name} · ${next.service_name}` : "Agenda livre por enquanto",
    ),
  ].join("");
}

async function loadAdminServices() {
  const payload = await api("/api/admin/catalog");
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
  await Promise.all([
    loadDashboard(),
    loadAppointments(),
    loadSettings(),
    loadAdminServices(),
    loadClients(),
    loadFinance(),
    loadAdminGallery(),
    loadConfig(),
  ]);
}

async function loadAppointments() {
  const payload = await api(`/api/admin/appointments?date=${adminDate.value}`);
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

blockDayForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await api("/api/admin/blocked-days", {
    method: "POST",
    body: JSON.stringify(Object.fromEntries(new FormData(blockDayForm))),
  });
  blockDayForm.reset();
  await loadSettings();
});

extraSlotForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await api("/api/admin/extra-slots", {
    method: "POST",
    body: JSON.stringify(Object.fromEntries(new FormData(extraSlotForm))),
  });
  extraSlotForm.reset();
  await loadSettings();
});

bootAdmin().catch((error) => {
  loginMessage.textContent = error.message;
  setAuthed(false);
});
