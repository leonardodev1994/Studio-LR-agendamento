const message = document.querySelector("#receiptMessage");
const content = document.querySelector("#receiptContent");
let receiptCode = "";

const escapeHtml = (value) => String(value ?? "")
  .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;").replaceAll("'", "&#039;");
const formatDate = (value) => {
  const raw = String(value || "");
  if (!raw) return "—";
  const [year, month, day] = raw.slice(0, 10).split("-");
  return day ? `${day}/${month}/${year}` : raw;
};
const yes = (value) => value ? "✓ Registrado" : "Não se aplica";

async function start() {
  receiptCode = new URLSearchParams(location.search).get("codigo") || "";
  const response = await fetch(`/api/public/consent-receipt?code=${encodeURIComponent(receiptCode)}`, { cache: "no-store" });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "Comprovante não encontrado.");
  const item = payload.receipt;
  document.title = `${item.receipt_code} | Studio LR`;
  message.classList.add("hidden");
  content.classList.remove("hidden");
  content.innerHTML = `
    <section class="receipt-code"><span>Código único</span><strong>${escapeHtml(item.receipt_code)}</strong><small>${item.integrity_verified ? "Integridade digital verificada" : "Registro anterior ao selo de integridade"}</small></section>
    <div class="receipt-grid">
      <section><h2>Cliente e procedimento</h2><p><strong>${escapeHtml(item.client_name)}</strong><br>Nascimento: ${formatDate(item.client_birth_date)} · ${escapeHtml(item.client_age)} anos<br>${escapeHtml(item.service_name)}<br>Agendamento: ${formatDate(item.appointment_date)} às ${escapeHtml(item.appointment_time)}</p></section>
      <section><h2>Registro do aceite</h2><p>${escapeHtml(String(item.accepted_at || "").replace("T", " ").slice(0, 19))}<br>Método: marcação eletrônica no site<br>Versão do termo: ${escapeHtml(item.term_version)}</p></section>
    </div>
    <section><h2>Declarações confirmadas</h2><ul class="receipt-checks"><li>${yes(item.term_accepted)} — leitura e aceite do termo</li><li>${yes(item.truth_confirmed)} — veracidade das informações</li><li>${yes(item.anatomy_confirmed)} — ciência da avaliação anatômica</li>${item.is_minor ? `<li>${yes(item.guardian_authorization)} — autorização do responsável legal</li>` : ""}</ul></section>
    ${item.is_minor ? `<section><h2>Responsável legal</h2><p>${escapeHtml(item.guardian_name)} · CPF ${escapeHtml(item.guardian_cpf)} · WhatsApp ${escapeHtml(item.guardian_phone)} · ${escapeHtml(item.guardian_relationship)}</p><h3>Política para menores · ${escapeHtml(item.minor_policy_version)}</h3><div class="receipt-term">${escapeHtml(item.minor_policy_content).replaceAll("\n", "<br>")}</div></section>` : ""}
    <section><h2>Texto aceito · ${escapeHtml(item.term_version)}</h2><div class="receipt-term">${escapeHtml(item.term_content).replaceAll("\n", "<br>")}</div></section>
    <footer class="receipt-integrity"><strong>Selo de integridade SHA-256</strong><code>${escapeHtml(item.evidence_hash || item.term_hash)}</code><p>O Studio LR mantém o registro original no banco de dados. Alterações no conteúdo registrado invalidam a verificação de integridade.</p></footer>`;
}

document.querySelector("#shareReceipt").addEventListener("click", async () => {
  const text = `Comprovante de consentimento Studio LR: ${receiptCode}. Guarde esta referência. O documento completo contém dados pessoais e não deve ser compartilhado publicamente.`;
  if (navigator.share) {
    try { await navigator.share({ title: "Comprovante Studio LR", text }); return; } catch (_) {}
  }
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
});

start().catch((error) => { message.textContent = error.message; });
