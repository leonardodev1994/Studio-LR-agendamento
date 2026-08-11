const message = document.querySelector("#aftercareMessage");

async function api(path, options = {}) {
  const response = await fetch(path, { headers: { "Content-Type": "application/json" }, ...options });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "Não foi possível carregar os cuidados.");
  return payload;
}

function paragraph(value) {
  const element = document.createElement("p");
  element.textContent = value || "";
  return element;
}

function careTopic(title, value) {
  const wrapper = document.createElement("section");
  const heading = document.createElement("h3");
  heading.textContent = title;
  wrapper.append(heading, paragraph(value));
  return wrapper;
}

function renderAftercare(care) {
  const general = care.general || {};
  document.querySelector("#aftercareIntro").textContent = general.intro || "";
  document.querySelector("#careHygiene").replaceChildren(
    paragraph(general.hygiene),
    careTopic("Mãos limpas primeiro", general.hygiene_hands),
    careTopic("Solução salina estéril", general.hygiene_saline),
    careTopic("Não gire a joia", general.hygiene_jewelry),
    careTopic("Seque com cuidado", general.hygiene_dry),
  );
  document.querySelector("#careAvoid").replaceChildren(paragraph(general.avoid));
  document.querySelector("#careNormal").replaceChildren(paragraph(general.normal));
  document.querySelector("#careAlert").textContent = general.alert || "";
  if (care.service_name) {
    document.querySelector("#aftercareTitle").textContent = `Cuidados para o seu ${care.service_name}`;
    document.querySelector("#specificCareTitle").textContent = `Orientações para ${care.service_name}`;
  }
  const details = (care.specific || []).filter(Boolean);
  const section = document.querySelector("#specificCareSection");
  section.classList.toggle("hidden", !details.length);
  document.querySelector("#specificCareList").replaceChildren(...details.map((text, index) => {
    const article = document.createElement("article");
    article.className = "aftercare-card specific";
    const marker = document.createElement("span");
    marker.textContent = String(index + 1).padStart(2, "0");
    article.append(marker, paragraph(text));
    return article;
  }));
  ["#aftercareWhatsapp", "#footerWhatsapp", "#floatingWhatsapp"].forEach((selector) => {
    document.querySelector(selector).href = care.whatsapp_url || "#";
  });
  document.querySelector("#aftercareSource").href = care.source_url || "https://safepiercing.org/aftercare/";
}

async function start() {
  let payload;
  const rawAccess = sessionStorage.getItem("studio_lr_aftercare_access");
  sessionStorage.removeItem("studio_lr_aftercare_access");
  if (rawAccess) {
    try {
      const access = JSON.parse(rawAccess);
      payload = await api("/api/public/client-aftercare", {
        method: "POST",
        body: JSON.stringify(access),
      });
      if (payload.aftercare.appointment_status === "Concluído") {
        message.textContent = "Seu piercing foi realizado. Siga as orientações para uma boa cicatrização.";
        message.className = "form-message success-box";
      }
    } catch (error) {
      message.textContent = error.message;
    }
  }
  if (!payload) payload = await api("/api/public/aftercare");
  renderAftercare(payload.aftercare);
}

start().catch((error) => { message.textContent = error.message; });
