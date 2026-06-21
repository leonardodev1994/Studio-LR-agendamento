const state = {
  services: [],
  catalog: [],
  selectedServiceId: null,
  config: {
    whatsapp_number: "",
    instagram_url: "https://www.instagram.com/leticiar_naildesigner",
  },
};

const servicesGrid = document.querySelector("#servicesGrid");
const serviceChoices = document.querySelector("#serviceChoices");
const bookingForm = document.querySelector("#bookingForm");
const bookingDate = document.querySelector("#bookingDate");
const bookingTime = document.querySelector("#bookingTime");
const bookingMessage = document.querySelector("#bookingMessage");
const bookingPhone = bookingForm?.querySelector("input[name='phone']");
const bookingSubmitButton = bookingForm?.querySelector("button[type='submit']");
const clientLookupForm = document.querySelector("#clientLookupForm");
const clientLookupMessage = document.querySelector("#clientLookupMessage");
const clientAppointments = document.querySelector("#clientAppointments");
const floatingWhatsapp = document.querySelector("#floatingWhatsapp");
const workGallery = document.querySelector("#workGallery");
const instagramGallery = document.querySelector("#instagramGallery");
const lightbox = document.querySelector("#lightbox");
const lightboxImage = document.querySelector("#lightboxImage");
const lightboxCaption = document.querySelector("#lightboxCaption");
const publicServices = [
  {
    key: "manicure-simples",
    category: "Natural",
    name: "Manicure simples",
    price_label: "R$ 25,00",
    duration_label: "45 min",
    description: "Cuidado essencial para unhas naturais, com acabamento limpo e delicado.",
    icon: "◇",
  },
  {
    key: "pedicure-simples",
    category: "Natural",
    name: "Pedicure simples",
    price_label: "R$ 25,00",
    duration_label: "45 min",
    description: "Cuidado dos pés com acabamento confortável, bonito e bem feito.",
    icon: "◇",
  },
  {
    key: "manicure-pedicure",
    category: "Natural",
    name: "Manicure + Pedicure",
    price_label: "R$ 45,00",
    duration_label: "90 min",
    description: "Combo completo para mãos e pés com praticidade e cuidado.",
    icon: "◇",
  },
  {
    key: "gel-tips",
    category: "Alongamento",
    name: "Gel na Tips",
    price_label: "R$ 100,00",
    duration_label: "120 min",
    description: "Alongamento elegante com acabamento resistente e natural.",
    image: "/assets/servicos/gel-tips.jpg",
  },
  {
    key: "fibra-vidro",
    category: "Alongamento",
    name: "Fibra de Vidro",
    price_label: "R$ 150,00",
    duration_label: "150 min",
    description: "Alongamento sofisticado com leveza, resistência e acabamento natural.",
    image: "/assets/servicos/fibra-vidro.jpg",
  },
  {
    key: "nail-art-elaborada",
    category: "Extras",
    name: "Nail art elaborada",
    price_label: "a partir de R$ 10,00",
    duration_label: "conforme desenho",
    description: "Adicional cobrado conforme a dificuldade do desenho escolhido.",
    bookable: false,
    image: "/assets/servicos/nail-art.jpg",
  },
  {
    key: "banho-gel",
    category: "Extras",
    name: "Banho de Gel",
    price_label: "R$ 65,00",
    duration_label: "75 min",
    description: "Camada de gel para brilho, resistência e aspecto impecável.",
    image: "/assets/servicos/banho-gel.jpg",
  },
  {
    key: "manutencao-gel-tips",
    category: "Manutenção",
    name: "Manutenção Gel na tips",
    price_label: "R$ 85,00",
    duration_label: "90 min",
    description: "Manutenção para clientes que já fizeram Gel na Tips no Studio LR.",
    icon: "✦",
  },
  {
    key: "blindagem",
    category: "Extras",
    name: "Blindagem",
    price_label: "R$ 45,00",
    duration_label: "60 min",
    description: "Proteção para unhas naturais com acabamento delicado e resistente.",
    icon: "◇",
  },
];
let galleryItems = Array.from({ length: 18 }, (_, index) => {
  const number = String(index + 1).padStart(2, "0");
  return {
    src: `/assets/galeria/galeria-${number}.jpg`,
    alt: `Trabalho Studio LR ${number}`,
    caption: `Studio LR ${number}`,
  };
});
const instagramWorkIndexes = [0, 2, 4, 7, 10, 14];
let currentLightboxIndex = 0;
let bookingSubmitting = false;
let bookingCompleted = false;

function todayIso() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function setMessage(html, success = false) {
  bookingMessage.innerHTML = html;
  bookingMessage.className = success ? "form-message success-box" : "form-message";
}

function isPastDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && value < todayIso();
}

function phoneDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

function validatePhone(value) {
  const digits = phoneDigits(value);
  return digits.length >= 10 && digits.length <= 13;
}

function setSubmitState(isLoading, label = "Confirmar agendamento") {
  if (!bookingSubmitButton) return;
  bookingSubmitButton.disabled = isLoading;
  bookingSubmitButton.textContent = label;
}

function setClientMessage(html, success = false) {
  if (!clientLookupMessage) return;
  clientLookupMessage.innerHTML = html;
  clientLookupMessage.className = success ? "form-message success-box" : "form-message";
}

function whatsappUrl(message = "") {
  const base = `https://wa.me/${state.config.whatsapp_number}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

function openWhatsapp(url) {
  window.open(url, "_blank", "noopener,noreferrer");
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

function renderServices() {
  const catalog = state.catalog.length ? state.catalog : publicServices;
  const normalizedCatalog = catalog.map((service) => ({
    ...service,
    key: service.service_id || service.serviceId || `custom:${service.key || service.name}`,
  }));
  const bookableCatalog = normalizedCatalog.filter((service) => service.bookable !== false);

  servicesGrid.innerHTML = normalizedCatalog
    .map((service, index) => {
      return `
      <article class="service-card ${service.image ? "with-image" : "without-image"}">
        ${
          service.image
            ? `<img class="service-photo" src="${service.image}" alt="${service.name}" loading="lazy" decoding="async">`
            : `<div class="service-placeholder"><span class="service-icon">${service.icon || "✦"}</span></div>`
        }
        ${service.category ? `<span class="service-category">${service.category}</span>` : ""}
        <h3>${service.name}</h3>
        <div class="service-meta">
          <span class="pill">${service.price_label}</span>
          <span class="pill">${service.duration_label}</span>
        </div>
        <p>${service.description}</p>
        ${
          service.bookable === false
            ? `<span class="button secondary service-disabled">Adicional no atendimento</span>`
            : `<a class="button secondary" href="#agendar" data-service="${service.key}">Agendar</a>`
        }
      </article>
    `;
    })
    .join("");

  serviceChoices.innerHTML = bookableCatalog
    .map((service) => `
      <label class="choice-card">
        <input type="radio" name="service_id" value="${service.key}" required>
        <span>
          <strong>${service.name}</strong>
          <small>${service.price_label} · ${service.duration_label}</small>
        </span>
      </label>
    `)
    .join("");

  document.querySelectorAll("[data-service]").forEach((button) => {
    button.addEventListener("click", () => selectService(button.dataset.service));
  });
  document.querySelectorAll("input[name='service_id']").forEach((input) => {
    input.addEventListener("change", () => {
      state.selectedServiceId = input.value;
      loadAvailability();
    });
  });

  if (bookableCatalog[0]) selectService(bookableCatalog[0].key);
}

function renderGalleries() {
  if (workGallery) {
    workGallery.innerHTML = galleryItems
      .map((item, index) => `
        <button class="work-photo" type="button" data-gallery-index="${index}" aria-label="Ampliar ${item.alt}">
          <img src="${item.src}" alt="${item.alt}" loading="${index < 4 ? "eager" : "lazy"}" decoding="async">
        </button>
      `)
      .join("");
  }

  if (instagramGallery) {
    instagramGallery.innerHTML = instagramWorkIndexes
      .map((galleryIndex) => {
        const item = galleryItems[galleryIndex];
        return `
        <button class="instagram-work-card" type="button" data-gallery-index="${galleryIndex}" aria-label="Ampliar ${item.alt}">
          <img src="${item.src}" alt="${item.alt}" loading="lazy" decoding="async">
        </button>
      `;
      })
      .join("");
  }

  document.querySelectorAll("[data-gallery-index]").forEach((button) => {
    button.addEventListener("click", () => openLightbox(Number(button.dataset.galleryIndex)));
  });
}

function openLightbox(index) {
  currentLightboxIndex = index;
  const item = galleryItems[currentLightboxIndex];
  lightboxImage.src = item.src;
  lightboxImage.alt = item.alt;
  lightboxCaption.textContent = item.caption;
  lightbox.classList.remove("hidden");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.classList.add("no-scroll");
}

function closeLightbox() {
  lightbox.classList.add("hidden");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.classList.remove("no-scroll");
}

function moveLightbox(direction) {
  const nextIndex = (currentLightboxIndex + direction + galleryItems.length) % galleryItems.length;
  openLightbox(nextIndex);
}

function selectService(serviceId) {
  state.selectedServiceId = String(serviceId);
  const input = document.querySelector(`input[name='service_id'][value='${serviceId}']`);
  if (input) input.checked = true;
  setMessage("");
  loadAvailability();
}

async function loadAvailability() {
  bookingTime.innerHTML = "<option value=''>Carregando horários...</option>";
  if (!state.selectedServiceId || !bookingDate.value) {
    bookingTime.innerHTML = "<option value=''>Escolha um horário</option>";
    return;
  }

  if (isPastDate(bookingDate.value)) {
    bookingTime.innerHTML = "<option value=''>Data indisponível</option>";
    bookingTime.disabled = true;
    setMessage("Escolha uma data atual ou futura para agendar.");
    return;
  }

  if (!/^\d+$/.test(state.selectedServiceId)) {
    bookingTime.innerHTML = "<option value=''>Combinar pelo WhatsApp</option>";
    bookingTime.disabled = true;
    setMessage("Esse serviço é personalizado. Clique em confirmar para enviar a solicitação pelo WhatsApp.");
    return;
  }

  bookingTime.disabled = false;
  setMessage("");

  try {
    const payload = await api(`/api/public/availability?date=${bookingDate.value}&service_id=${state.selectedServiceId}`);
    if (!payload.slots.length) {
      bookingTime.innerHTML = "<option value=''>Nenhum horário disponível</option>";
      setMessage("Não há horários disponíveis para esta data. Escolha outro dia ou fale pelo WhatsApp.");
      return;
    }
    bookingTime.innerHTML = [
      "<option value=''>Escolha um horário</option>",
      ...payload.slots.map((slot) => `<option value="${slot}">${slot}</option>`),
    ].join("");
  } catch (error) {
    bookingTime.innerHTML = "<option value=''>Erro ao carregar</option>";
  }
}

async function loadConfig() {
  try {
    state.config = await api("/api/public/config");
    const contactUrl = whatsappUrl();
    floatingWhatsapp.href = contactUrl;
    document.querySelectorAll(".whatsapp-link").forEach((link) => {
      link.href = contactUrl;
    });
    document.querySelectorAll(".instagram-link").forEach((link) => {
      link.href = state.config.instagram_url;
    });
  } catch (error) {
    console.warn(error);
  }
}

async function loadGalleryItems() {
  try {
    const payload = await api("/api/public/gallery");
    if (payload.gallery?.length) {
      galleryItems = payload.gallery.map((item, index) => ({
        src: item.src,
        alt: item.alt || `Trabalho Studio LR ${String(index + 1).padStart(2, "0")}`,
        caption: item.caption || `Studio LR ${String(index + 1).padStart(2, "0")}`,
      }));
    }
  } catch (error) {
    console.warn(error);
  }
}

async function loadCatalog() {
  try {
    const payload = await api("/api/public/catalog");
    state.catalog = payload.catalog || [];
  } catch (error) {
    console.warn(error);
  }
}

bookingDate.min = todayIso();
bookingDate.value = todayIso();
bookingDate.addEventListener("change", loadAvailability);
bookingPhone?.addEventListener("input", () => {
  bookingPhone.value = bookingPhone.value.replace(/[^\d\s()+-]/g, "");
});
clientLookupForm?.querySelector("input[name='phone']")?.addEventListener("input", (event) => {
  event.currentTarget.value = event.currentTarget.value.replace(/[^\d\s()+-]/g, "");
});

bookingForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (bookingSubmitting || bookingCompleted) return;

  const data = Object.fromEntries(new FormData(bookingForm));
  const customService = (state.catalog.length ? state.catalog : publicServices)
    .find((service) => `custom:${service.key || service.name}` === data.service_id);
  const cleanedPhone = phoneDigits(data.phone);
  const cleanedName = String(data.name || "").trim();
  const neighborhood = String(data.neighborhood || "").trim();

  if (!cleanedName) {
    setMessage("Informe seu nome para concluir o agendamento.");
    return;
  }
  if (!validatePhone(data.phone)) {
    setMessage("Informe um WhatsApp válido com DDD.");
    bookingPhone?.focus();
    return;
  }
  if (!neighborhood) {
    setMessage("Informe seu bairro para concluir o cadastro.");
    bookingForm.querySelector("input[name='neighborhood']")?.focus();
    return;
  }
  if (!data.date || isPastDate(data.date)) {
    setMessage("Escolha uma data atual ou futura para agendar.");
    bookingDate.focus();
    return;
  }

  bookingSubmitting = true;
  setSubmitState(true, "Confirmando...");

  if (customService) {
    const message = (
      `Olá, Letícia! Acabei de solicitar um agendamento.\n\n` +
      `Serviço: ${customService.name}\n` +
      `Data: ${data.date || "A combinar"}\n` +
      `Horário: ${data.time || "A combinar"}\n` +
      `Nome: ${cleanedName}\n` +
      `Telefone: ${cleanedPhone}\n\n` +
      `Aguardo confirmação. 💅✨`
    );
    const url = whatsappUrl(message);
    setMessage(
      `
        <strong>Solicitação pronta para envio.</strong><br>
        ${customService.name} será confirmado diretamente pelo WhatsApp.<br><br>
        <a class="button primary" href="${url}" target="_blank" rel="noreferrer">Enviar pelo WhatsApp</a>
      `,
      true,
    );
    openWhatsapp(url);
    bookingCompleted = true;
    bookingSubmitting = false;
    setSubmitState(true, "Solicitação enviada");
    return;
  }

  if (!data.time) {
    bookingSubmitting = false;
    setSubmitState(false);
    setMessage("Escolha um horário disponível para continuar.");
    bookingTime.focus();
    return;
  }

  try {
    const payload = await api("/api/public/appointments", {
      method: "POST",
      body: JSON.stringify({
        ...data,
        name: cleanedName,
        phone: cleanedPhone,
        neighborhood,
        notes: String(data.notes || "").trim(),
      }),
    });
    const appointment = payload.appointment;
    setMessage(
      `
        <strong>Agendamento solicitado com sucesso!</strong><br>
        ${appointment.service_name} em ${appointment.appointment_date} às ${appointment.appointment_time}.<br><br>
        <a class="button primary" href="${appointment.whatsapp_url}" target="_blank" rel="noreferrer">Enviar confirmação pelo WhatsApp</a>
      `,
      true,
    );
    openWhatsapp(appointment.whatsapp_url);
    bookingCompleted = true;
    setSubmitState(true, "Agendamento solicitado");
  } catch (error) {
    bookingSubmitting = false;
    setSubmitState(false);
    setMessage(error.message || "Não foi possível salvar o agendamento. Tente novamente.");
  }
});

function renderClientAppointments(items, phone) {
  if (!clientAppointments) return;
  if (!items.length) {
    clientAppointments.innerHTML = "<p class='form-message'>Nenhum agendamento encontrado para esse WhatsApp.</p>";
    return;
  }

  clientAppointments.innerHTML = items
    .map((item) => {
      const canRequest = ["Pendente", "Confirmado"].includes(item.status);
      const requestText = item.reschedule_request_id
        ? `
          <div class="reschedule-note">
            <strong>Solicitação de reagendamento enviada</strong>
            <span>${item.requested_date || "Data a combinar"} · ${item.requested_time || "Horário a combinar"} · ${item.reschedule_status}</span>
            ${item.reschedule_message ? `<p>${item.reschedule_message}</p>` : ""}
          </div>
        `
        : "";
      return `
        <article class="client-appointment-card">
          <div>
            <span class="appointment-status">${item.status}</span>
            <h3>${item.service_name}</h3>
            <p>${item.appointment_date} às ${item.appointment_time}</p>
            <p>${item.client_name}${item.client_neighborhood ? ` · ${item.client_neighborhood}` : ""}</p>
          </div>
          ${requestText}
          ${
            canRequest
              ? `
                <form class="reschedule-form" data-appointment-id="${item.id}" data-phone="${phone}">
                  <div class="form-row two">
                    <label>
                      Nova data sugerida
                      <input name="requested_date" type="date" min="${todayIso()}">
                    </label>
                    <label>
                      Horário sugerido
                      <input name="requested_time" type="time">
                    </label>
                  </div>
                  <label>
                    Observação
                    <textarea name="message" rows="2" placeholder="Ex.: precisei mudar por causa do trabalho"></textarea>
                  </label>
                  <button class="button secondary full" type="submit">Solicitar reagendamento</button>
                  <p class="form-message" data-reschedule-message></p>
                </form>
              `
              : ""
          }
        </article>
      `;
    })
    .join("");

  clientAppointments.querySelectorAll(".reschedule-form").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const message = form.querySelector("[data-reschedule-message]");
      const button = form.querySelector("button[type='submit']");
      const data = Object.fromEntries(new FormData(form));
      button.disabled = true;
      button.textContent = "Enviando...";
      message.textContent = "";
      try {
        await api("/api/public/reschedule-requests", {
          method: "POST",
          body: JSON.stringify({
            appointment_id: form.dataset.appointmentId,
            phone: form.dataset.phone,
            requested_date: data.requested_date,
            requested_time: data.requested_time,
            message: String(data.message || "").trim(),
          }),
        });
        message.textContent = "Solicitação enviada para a Letícia.";
        button.textContent = "Solicitação enviada";
      } catch (error) {
        button.disabled = false;
        button.textContent = "Solicitar reagendamento";
        message.textContent = error.message || "Não foi possível enviar a solicitação.";
      }
    });
  });
}

clientLookupForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(clientLookupForm));
  const phone = phoneDigits(data.phone);
  if (!validatePhone(phone)) {
    setClientMessage("Informe um WhatsApp válido com DDD.");
    return;
  }
  setClientMessage("Buscando seus agendamentos...");
  try {
    const payload = await api(`/api/public/client-appointments?phone=${phone}`);
    renderClientAppointments(payload.appointments || [], phone);
    setClientMessage(payload.appointments?.length ? "Agendamentos encontrados." : "", true);
  } catch (error) {
    setClientMessage(error.message || "Não foi possível consultar sua agenda.");
  }
});

async function start() {
  await loadConfig();
  await loadGalleryItems();
  await loadCatalog();
  const payload = await api("/api/public/services");
  state.services = payload.services;
  renderServices();
  renderGalleries();
}

start().catch((error) => setMessage(error.message));

document.querySelector("[data-lightbox-close]")?.addEventListener("click", closeLightbox);
document.querySelector("[data-lightbox-prev]")?.addEventListener("click", () => moveLightbox(-1));
document.querySelector("[data-lightbox-next]")?.addEventListener("click", () => moveLightbox(1));
lightbox?.addEventListener("click", (event) => {
  if (event.target === lightbox) closeLightbox();
});
document.addEventListener("keydown", (event) => {
  if (!lightbox || lightbox.classList.contains("hidden")) return;
  if (event.key === "Escape") closeLightbox();
  if (event.key === "ArrowLeft") moveLightbox(-1);
  if (event.key === "ArrowRight") moveLightbox(1);
});
