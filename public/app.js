const state = {
  services: [],
  catalog: [],
  selectedServiceId: null,
  serviceSegment: "nails",
  consentConfig: null,
  config: {
    whatsapp_number: "",
    instagram_url: "https://www.instagram.com/leticiar_naildesigner",
  },
};

const servicesGrid = document.querySelector("#servicesGrid");
const bookingForm = document.querySelector("#bookingForm");
const bookingServiceInput = document.querySelector("#bookingServiceId");
const selectedServiceSummary = document.querySelector("#selectedServiceSummary");
const selectedServiceName = document.querySelector("#selectedServiceName");
const selectedServiceMeta = document.querySelector("#selectedServiceMeta");
const changeServiceButton = document.querySelector("#changeServiceButton");
const serviceQuickPicker = document.querySelector("#serviceQuickPicker");
const serviceQuickPickerList = document.querySelector("#serviceQuickPickerList");
const bookingClientDetails = document.querySelector("#bookingClientDetails");
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
const serviceSegmentButtons = document.querySelectorAll("[data-service-segment]");
const servicesTitle = document.querySelector("#servicesTitle");
const heroEyebrow = document.querySelector("#heroEyebrow");
const heroTitle = document.querySelector("#heroTitle");
const heroText = document.querySelector("#heroText");
const piercingBirthField = document.querySelector("#piercingBirthField");
const bookingBirthDate = document.querySelector("#bookingBirthDate");
const ageMessage = document.querySelector("#ageMessage");
const guardianCard = document.querySelector("#guardianCard");
const guardianAuthorizationLabel = document.querySelector("#guardianAuthorizationLabel");
const minorDocumentNote = document.querySelector("#minorDocumentNote");
const adultOnlyMessage = document.querySelector("#adultOnlyMessage");
const consentFieldset = document.querySelector("#consentFieldset");
const consentModal = document.querySelector("#consentModal");
const consentModalPanel = consentModal?.querySelector(".consent-modal-panel");
const consentTermContent = document.querySelector("#consentTermContent");
const consentTermVersion = document.querySelector("#consentTermVersion");
const openConsentModalButton = document.querySelector("#openConsentModal");
const closeConsentModalButton = document.querySelector("#closeConsentModal");
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
    image: "/assets/optimized/servicos/gel-tips.jpg",
  },
  {
    key: "fibra-vidro",
    category: "Alongamento",
    name: "Fibra de Vidro",
    price_label: "R$ 150,00",
    duration_label: "150 min",
    description: "Alongamento sofisticado com leveza, resistência e acabamento natural.",
    image: "/assets/optimized/servicos/fibra-vidro.jpg",
  },
  {
    key: "nail-art-elaborada",
    category: "Extras",
    name: "Nail art elaborada",
    price_label: "a partir de R$ 10,00",
    duration_label: "conforme desenho",
    description: "Adicional cobrado conforme a dificuldade do desenho escolhido.",
    bookable: false,
    image: "/assets/optimized/servicos/nail-art.jpg",
  },
  {
    key: "banho-gel",
    category: "Extras",
    name: "Banho de Gel",
    price_label: "R$ 65,00",
    duration_label: "75 min",
    description: "Camada de gel para brilho, resistência e aspecto impecável.",
    image: "/assets/optimized/servicos/banho-gel.jpg",
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
    src: `/assets/optimized/galeria/thumbs/galeria-${number}.jpg`,
    thumb_src: `/assets/optimized/galeria/thumbs/galeria-${number}.jpg`,
    full_src: `/assets/optimized/galeria/galeria-${number}.jpg`,
    alt: `Trabalho Studio LR ${number}`,
    caption: `Studio LR ${number}`,
  };
});
const instagramWorkIndexes = [0, 2, 4, 7, 10, 14];
let currentLightboxIndex = 0;
let bookingSubmitting = false;
let bookingCompleted = false;
let galleriesLoaded = false;
let lastConsentFocus = null;

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

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function selectedService() {
  return (state.catalog.length ? state.catalog : publicServices).find((item) => {
    const itemKey = item.service_id || item.serviceId || `custom:${item.key || item.name}`;
    return String(itemKey) === String(state.selectedServiceId);
  });
}

function isPiercingSelection() {
  return selectedService()?.segment === "piercing";
}

function calculateAge(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return null;
  const birth = new Date(`${value}T12:00:00`);
  if (Number.isNaN(birth.getTime()) || birth > new Date()) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age -= 1;
  return age >= 0 && age <= 125 ? age : null;
}

function piercingFlowState() {
  const service = selectedService();
  const age = calculateAge(bookingBirthDate?.value);
  const minor = age !== null && age < 18;
  const minimumAge = Number(state.consentConfig?.minimum_age || 0);
  const belowMinimum = age !== null && age < minimumAge;
  const blocked = age !== null && age < 18 && service?.minor_policy === "adult_only";
  const guardianRequired = minor && service?.minor_policy !== "minors_allowed";
  return { age, minor, blocked: blocked || belowMinimum, guardianRequired, belowMinimum, minimumAge };
}

function updateSubmitAvailability() {
  if (!bookingSubmitButton || bookingSubmitting || bookingCompleted) return;
  if (!isPiercingSelection()) {
    bookingSubmitButton.disabled = false;
    return;
  }
  const flow = piercingFlowState();
  const checks = Array.from(consentFieldset.querySelectorAll("input[type='checkbox']"))
    .filter((input) => !input.closest(".hidden"));
  bookingSubmitButton.disabled = flow.age === null || flow.blocked || checks.some((input) => !input.checked);
}

function updatePiercingFlow() {
  const piercing = isPiercingSelection();
  piercingBirthField?.classList.toggle("hidden", !piercing);
  consentFieldset?.classList.toggle("hidden", !piercing);
  if (bookingBirthDate) bookingBirthDate.required = piercing;
  const flow = piercingFlowState();
  if (ageMessage) ageMessage.textContent = piercing && flow.age !== null
    ? `${flow.age} anos · ${flow.minor ? "fluxo para menor de idade" : "consentimento do próprio cliente"}`
    : piercing ? "A idade será calculada automaticamente." : "";
  guardianCard?.classList.toggle("hidden", !piercing || !flow.guardianRequired || flow.blocked);
  guardianAuthorizationLabel?.classList.toggle("hidden", !piercing || !flow.guardianRequired || flow.blocked);
  minorDocumentNote?.classList.toggle("hidden", !state.consentConfig?.document_check);
  adultOnlyMessage?.classList.toggle("hidden", !piercing || !flow.blocked);
  if (adultOnlyMessage && flow.belowMinimum) adultOnlyMessage.textContent = `Este procedimento está disponível a partir de ${flow.minimumAge} anos.`;
  else if (adultOnlyMessage) adultOnlyMessage.textContent = "Este procedimento está disponível somente para maiores de 18 anos.";
  bookingForm.querySelectorAll("#guardianCard input").forEach((input) => {
    input.required = piercing && flow.guardianRequired && !flow.blocked;
    if (!flow.guardianRequired) input.value = "";
  });
  const guardianCheck = bookingForm.querySelector("input[name='guardian_authorization']");
  if (guardianCheck) {
    guardianCheck.required = piercing && flow.guardianRequired && !flow.blocked;
    if (!flow.guardianRequired) guardianCheck.checked = false;
  }
  consentFieldset?.querySelectorAll("input[type='checkbox']").forEach((input) => {
    input.required = piercing && !input.closest(".hidden");
  });
  updateSubmitAvailability();
}

function setSubmitState(isLoading, label = "Confirmar agendamento") {
  if (!bookingSubmitButton) return;
  bookingSubmitButton.disabled = isLoading;
  bookingSubmitButton.textContent = label;
  if (!isLoading) updateSubmitAvailability();
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
    segment: service.segment || "nails",
  }));
  const visibleCatalog = normalizedCatalog.filter((service) => service.segment === state.serviceSegment);
  const bookableCatalog = visibleCatalog.filter((service) => service.bookable !== false);

  servicesGrid.innerHTML = visibleCatalog
    .map((service, index) => {
      return `
      <article class="service-card ${service.image ? "with-image" : "without-image"}">
        ${service.bookable === false
          ? (service.image
            ? `<img class="service-photo" src="${service.image}" alt="${service.name}" loading="lazy" decoding="async" fetchpriority="low" onerror="this.closest('.service-card')?.classList.add('image-failed')">`
            : `<div class="service-placeholder"><span class="service-icon">${service.icon || "✦"}</span></div>`)
          : `<button class="public-service-photo-button" type="button" data-service="${service.key}" aria-label="Agendar ${service.name}">
              ${service.image
                ? `<img class="service-photo" src="${service.image}" alt="${service.name}" loading="lazy" decoding="async" fetchpriority="low" onerror="this.closest('.service-card')?.classList.add('image-failed')">`
                : `<span class="service-placeholder"><span class="service-icon">${service.icon || "✦"}</span></span>`}
            </button>`}
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
            : `<a class="button secondary" href="#bookingClientDetails" data-service="${service.key}">Agendar</a>`
        }
      </article>
    `;
    })
    .join("");

  if (serviceQuickPickerList) {
    serviceQuickPickerList.innerHTML = bookableCatalog.map((service) => `
      <button type="button" data-quick-service="${service.key}">
        <span><strong>${service.name}</strong><small>${service.duration_label}</small></span>
        <em>${service.price_label}</em>
      </button>
    `).join("");
    serviceQuickPickerList.querySelectorAll("[data-quick-service]").forEach((button) => {
      button.addEventListener("click", () => {
        selectService(button.dataset.quickService);
        closeServicePicker();
      });
    });
  }

  document.querySelectorAll("[data-service]").forEach((button) => {
    button.addEventListener("click", (event) => {
      selectService(button.dataset.service);
      if (button.tagName === "BUTTON") {
        event.preventDefault();
        bookingClientDetails?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  if (bookableCatalog[0]) selectService(bookableCatalog[0].key);
}

function setServiceSegment(segment) {
  state.serviceSegment = segment === "piercing" ? "piercing" : "nails";
  document.body.dataset.serviceSegment = state.serviceSegment;
  serviceSegmentButtons.forEach((button) => button.classList.toggle("active", button.dataset.serviceSegment === state.serviceSegment));
  document.querySelectorAll("[data-segment-section]").forEach((section) => {
    section.hidden = section.dataset.segmentSection !== state.serviceSegment;
  });
  const piercingMode = state.serviceSegment === "piercing";
  servicesTitle.textContent = piercingMode ? "Escolha sua perfuração" : "Escolha seu cuidado";
  heroEyebrow.textContent = piercingMode ? "Studio LR · Body Piercing" : "Studio LR · Nail Design";
  heroTitle.textContent = piercingMode ? "Expressão, identidade e cuidado em cada detalhe." : "Beleza, cuidado e autoestima em cada detalhe.";
  heroText.textContent = piercingMode
    ? "Conheça as possibilidades de perfuração e agende uma avaliação personalizada de anatomia e posicionamento."
    : "Agende seu horário e escolha o cuidado ideal para unhas elegantes e acabamento impecável.";
  renderServices();
}

serviceSegmentButtons.forEach((button) => button.addEventListener("click", () => setServiceSegment(button.dataset.serviceSegment)));

function renderGalleries() {
  if (workGallery) {
    workGallery.innerHTML = galleryItems
      .map((item, index) => {
        const thumb = item.thumb_src || item.src;
        return `
        <button class="work-photo" type="button" data-gallery-index="${index}" aria-label="Ampliar ${item.alt}">
          <img src="${thumb}" alt="${item.alt}" loading="lazy" decoding="async" fetchpriority="low" onerror="this.closest('button')?.classList.add('image-failed')">
        </button>
      `;
      })
      .join("");
  }

  if (instagramGallery) {
    instagramGallery.innerHTML = instagramWorkIndexes
      .map((galleryIndex) => {
        const item = galleryItems[galleryIndex];
        const thumb = item.thumb_src || item.src;
        return `
        <button class="instagram-work-card" type="button" data-gallery-index="${galleryIndex}" aria-label="Ampliar ${item.alt}">
          <img src="${thumb}" alt="${item.alt}" loading="lazy" decoding="async" fetchpriority="low" onerror="this.closest('button')?.classList.add('image-failed')">
        </button>
      `;
      })
      .join("");
  }

  document.querySelectorAll("[data-gallery-index]").forEach((button) => {
    button.addEventListener("click", () => openLightbox(Number(button.dataset.galleryIndex)));
  });
}

function renderGalleryPlaceholders() {
  if (workGallery) {
    workGallery.innerHTML = Array.from({ length: 6 }, (_, index) => `
      <div class="work-photo media-skeleton" aria-hidden="true">
        <span>${String(index + 1).padStart(2, "0")}</span>
      </div>
    `).join("");
  }
  if (instagramGallery) {
    instagramGallery.innerHTML = Array.from({ length: 6 }, (_, index) => `
      <div class="instagram-work-card media-skeleton" aria-hidden="true">
        <span>${String(index + 1).padStart(2, "0")}</span>
      </div>
    `).join("");
  }
}

function openLightbox(index) {
  currentLightboxIndex = index;
  const item = galleryItems[currentLightboxIndex];
  lightboxImage.src = item.full_src || item.src;
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
  if (bookingServiceInput) bookingServiceInput.value = state.selectedServiceId;
  const service = selectedService();
  if (selectedServiceSummary && service) {
    selectedServiceName.textContent = service.name;
    selectedServiceMeta.textContent = `${service.price_label} · ${service.duration_label}${service.segment === "piercing" ? " · disponibilidade a confirmar" : ""}`;
    serviceQuickPickerList?.querySelectorAll("[data-quick-service]").forEach((button) => {
      const selected = String(button.dataset.quickService) === state.selectedServiceId;
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
  }
  setMessage("");
  updatePiercingFlow();
  loadAvailability();
}

function closeServicePicker() {
  serviceQuickPicker?.classList.add("hidden");
  changeServiceButton?.setAttribute("aria-expanded", "false");
  changeServiceButton?.focus({ preventScroll: true });
}

changeServiceButton?.addEventListener("click", () => {
  const willOpen = serviceQuickPicker?.classList.contains("hidden");
  serviceQuickPicker?.classList.toggle("hidden", !willOpen);
  changeServiceButton.setAttribute("aria-expanded", String(willOpen));
  if (willOpen) serviceQuickPicker?.scrollIntoView({ behavior: "smooth", block: "nearest" });
});

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

async function loadConsentConfig() {
  state.consentConfig = await api("/api/public/piercing-consent-config");
  consentTermVersion.textContent = `Versão ${state.consentConfig.term_version}`;
  consentTermContent.innerHTML = String(state.consentConfig.term_content || "")
    .split(/\n\s*\n/)
    .map((paragraph, index) => index === 0
      ? `<h3>${escapeHtml(paragraph)}</h3>`
      : `<p>${escapeHtml(paragraph).replaceAll("\n", "<br>")}</p>`)
    .join("");
  updatePiercingFlow();
}

function openConsentModal(content = null, version = "") {
  if (content !== null) {
    consentTermVersion.textContent = version ? `Versão ${version}` : "";
    consentTermContent.innerHTML = String(content)
      .split(/\n\s*\n/)
      .map((paragraph, index) => index === 0
        ? `<h3>${escapeHtml(paragraph)}</h3>`
        : `<p>${escapeHtml(paragraph).replaceAll("\n", "<br>")}</p>`)
      .join("");
  }
  lastConsentFocus = document.activeElement;
  consentModal?.classList.remove("hidden");
  consentModal?.setAttribute("aria-hidden", "false");
  document.body.classList.add("no-scroll");
  consentModalPanel?.focus();
}

function closeConsentModal() {
  consentModal?.classList.add("hidden");
  consentModal?.setAttribute("aria-hidden", "true");
  document.body.classList.remove("no-scroll");
  lastConsentFocus?.focus?.();
}

async function loadGalleryItems() {
  try {
    const payload = await api("/api/public/gallery");
    if (payload.gallery?.length) {
      galleryItems = payload.gallery.map((item, index) => ({
        src: item.src,
        thumb_src: item.thumb_src || item.src,
        full_src: item.full_src || item.src,
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

async function loadGalleriesWhenNeeded() {
  if (galleriesLoaded) return;
  galleriesLoaded = true;
  await loadGalleryItems();
  renderGalleries();
}

function observeOnce(elements, callback, rootMargin = "500px") {
  const targets = elements.filter(Boolean);
  if (!targets.length) return;
  if (!("IntersectionObserver" in window)) {
    callback();
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      observer.disconnect();
      callback();
    }
  }, { rootMargin });
  targets.forEach((target) => observer.observe(target));
}

function setupLazyVideos() {
  const videos = Array.from(document.querySelectorAll("[data-lazy-video]"));
  videos.forEach((video) => {
    observeOnce([video], () => {
      video.querySelectorAll("source[data-src]").forEach((source) => {
        source.src = source.dataset.src;
        source.removeAttribute("data-src");
      });
      if (video.hasAttribute("data-autoplay-video")) {
        video.muted = true;
        video.defaultMuted = true;
        video.loop = true;
        video.playsInline = true;
        const startPlayback = () => video.play().catch(() => {});
        video.addEventListener("canplay", startPlayback, { once: true });
        startPlayback();
      }
      video.load();
    }, "300px");
  });
}

bookingDate.min = todayIso();
bookingDate.value = todayIso();
bookingDate.addEventListener("change", loadAvailability);
if (bookingBirthDate) {
  bookingBirthDate.max = todayIso();
  bookingBirthDate.addEventListener("change", updatePiercingFlow);
  bookingBirthDate.addEventListener("input", updatePiercingFlow);
}
consentFieldset?.addEventListener("change", updateSubmitAvailability);
openConsentModalButton?.addEventListener("click", () => openConsentModal(
  state.consentConfig?.term_content || "",
  state.consentConfig?.term_version || "",
));
closeConsentModalButton?.addEventListener("click", closeConsentModal);
consentModal?.addEventListener("click", (event) => {
  if (event.target === consentModal) closeConsentModal();
});
bookingPhone?.addEventListener("input", () => {
  bookingPhone.value = bookingPhone.value.replace(/[^\d\s()+-]/g, "");
});
bookingForm?.querySelector("input[name='guardian_phone']")?.addEventListener("input", (event) => {
  event.currentTarget.value = event.currentTarget.value.replace(/[^\d\s()+-]/g, "");
});
bookingForm?.querySelector("input[name='guardian_cpf']")?.addEventListener("input", (event) => {
  event.currentTarget.value = event.currentTarget.value.replace(/\D/g, "").slice(0, 11);
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
  if (isPiercingSelection()) {
    const flow = piercingFlowState();
    if (flow.age === null) {
      setMessage("Informe uma data de nascimento válida.");
      bookingBirthDate?.focus();
      return;
    }
    if (flow.blocked) {
      setMessage(flow.belowMinimum ? `Este procedimento está disponível a partir de ${flow.minimumAge} anos.` : "Este procedimento está disponível somente para maiores de 18 anos.");
      return;
    }
    const requiredChecks = Array.from(consentFieldset.querySelectorAll("input[type='checkbox']"))
      .filter((input) => !input.closest(".hidden"));
    if (requiredChecks.some((input) => !input.checked)) {
      setMessage("Leia e aceite todos os itens obrigatórios do termo para continuar.");
      consentFieldset.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
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
        term_accepted: Boolean(data.term_accepted),
        truth_confirmed: Boolean(data.truth_confirmed),
        anatomy_confirmed: Boolean(data.anatomy_confirmed),
        guardian_authorization: Boolean(data.guardian_authorization),
      }),
    });
    const appointment = payload.appointment;
    setMessage(
      `
        <strong>${String(appointment.service_key || "").startsWith("piercing-") ? "Pedido de disponibilidade enviado!" : "Agendamento solicitado com sucesso!"}</strong><br>
        ${appointment.service_name} em ${appointment.appointment_date} às ${appointment.appointment_time}.<br><br>
        ${String(appointment.service_key || "").startsWith("piercing-") ? "A perfuração será confirmada pela profissional.<br><br>" : ""}
        <a class="button primary" href="${appointment.whatsapp_url}" target="_blank" rel="noreferrer">${String(appointment.service_key || "").startsWith("piercing-") ? "Perguntar disponibilidade no WhatsApp" : "Enviar confirmação pelo WhatsApp"}</a>
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
      const isPiercing = String(item.service_key || "").startsWith("piercing-");
      const completedPiercing = isPiercing && item.status === "Concluído";
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
            <span class="appointment-status">${String(item.service_key || "").startsWith("piercing-") && item.status === "Pendente" ? "Aguardando disponibilidade" : item.status}</span>
            <h3>${item.service_name}</h3>
            <p>${item.appointment_date} às ${item.appointment_time}</p>
            <p>${item.client_name}${item.client_neighborhood ? ` · ${item.client_neighborhood}` : ""}</p>
          </div>
          ${isPiercing ? `
            <div class="appointment-documentation">
              <strong>Documentação</strong>
              <p>${item.consent_id ? "✓ Termo de consentimento aceito" : "Termo de consentimento pendente"}</p>
              ${item.consent_id ? `<button class="button secondary" type="button" data-view-consent="${item.id}" data-client-phone="${phone}">Ver termo</button>` : ""}
              <a class="button secondary" href="/cuidados" data-view-aftercare="${item.id}" data-client-phone="${phone}">Ver cuidados</a>
            </div>
            ${completedPiercing ? `<div class="piercing-completed"><strong>Seu piercing foi realizado</strong><p>Veja agora os cuidados para uma boa cicatrização.</p><a class="button primary" href="/cuidados" data-view-aftercare="${item.id}" data-client-phone="${phone}">Ver cuidados pós-perfuração</a></div>` : ""}
          ` : ""}
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
  clientAppointments.querySelectorAll("[data-view-consent]").forEach((button) => {
    button.addEventListener("click", async () => {
      button.disabled = true;
      try {
        const payload = await api("/api/public/client-consent", {
          method: "POST",
          body: JSON.stringify({ appointment_id: button.dataset.viewConsent, phone: button.dataset.clientPhone }),
        });
        openConsentModal(payload.consent.term_content, payload.consent.term_version);
      } catch (error) {
        setClientMessage(error.message || "Não foi possível abrir o termo.");
      } finally {
        button.disabled = false;
      }
    });
  });
  clientAppointments.querySelectorAll("[data-view-aftercare]").forEach((link) => {
    link.addEventListener("click", () => {
      sessionStorage.setItem("studio_lr_aftercare_access", JSON.stringify({
        appointment_id: link.dataset.viewAftercare,
        phone: link.dataset.clientPhone,
      }));
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
  await Promise.all([loadCatalog(), loadConsentConfig()]);
  const payload = await api("/api/public/services");
  state.services = payload.services;
  renderServices();
  renderGalleryPlaceholders();
  observeOnce([workGallery, instagramGallery], loadGalleriesWhenNeeded, "700px");
  setupLazyVideos();
}

start().catch((error) => setMessage(error.message));

document.querySelector("[data-lightbox-close]")?.addEventListener("click", closeLightbox);
document.querySelector("[data-lightbox-prev]")?.addEventListener("click", () => moveLightbox(-1));
document.querySelector("[data-lightbox-next]")?.addEventListener("click", () => moveLightbox(1));
lightbox?.addEventListener("click", (event) => {
  if (event.target === lightbox) closeLightbox();
});
document.addEventListener("keydown", (event) => {
  if (consentModal && !consentModal.classList.contains("hidden")) {
    if (event.key === "Escape") closeConsentModal();
    if (event.key === "Tab") {
      const focusable = Array.from(consentModal.querySelectorAll("button, a[href], input, select, textarea, [tabindex]:not([tabindex='-1'])"))
        .filter((element) => !element.disabled);
      if (focusable.length) {
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    }
    return;
  }
  if (!lightbox || lightbox.classList.contains("hidden")) return;
  if (event.key === "Escape") closeLightbox();
  if (event.key === "ArrowLeft") moveLightbox(-1);
  if (event.key === "ArrowRight") moveLightbox(1);
});
