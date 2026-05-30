const castrationDates = [
  { date: "2026-06-08", label: "Mutirão de castração", times: ["08:00", "09:00", "10:00", "11:00"] },
  { date: "2026-06-15", label: "Castração social", times: ["08:30", "09:30", "10:30", "13:30"] },
  { date: "2026-06-22", label: "Atendimento veterinário", times: ["08:00", "10:00", "14:00", "15:00"] }
];

const instituteActivities = [
  { date: "2026-06-05", title: "Entrega de alimentos", color: "yellow", details: "Atividade comunitária do Instituto Casa do Pai." },
  { date: "2026-06-12", title: "Roda de acolhimento", color: "blue", details: "Encontro com famílias atendidas pelo Instituto." },
  { date: "2026-06-19", title: "Oficina de cuidados com animais", color: "green", details: "Orientação gratuita para tutores." },
  { date: "2026-06-26", title: "Campanha de doação", color: "red", details: "Recebimento de ração, produtos de limpeza e itens básicos." }
];

const store = {
  get castrations() {
    return JSON.parse(localStorage.getItem("casaPaiCastrations") || "[]");
  },
  set castrations(value) {
    localStorage.setItem("casaPaiCastrations", JSON.stringify(value));
  },
  get courses() {
    return JSON.parse(localStorage.getItem("casaPaiCourses") || "[]");
  },
  set courses(value) {
    localStorage.setItem("casaPaiCourses", JSON.stringify(value));
  }
};

const castrationForm = document.querySelector("#castration-form");
const courseForm = document.querySelector("#course-form");
const castrationDate = document.querySelector("#castration-date");
const castrationTime = document.querySelector("#castration-time");
const slotList = document.querySelector("#slot-list");
const availabilityTitle = document.querySelector("#availability-title");
const castrationAgenda = document.querySelector("#castration-agenda");
const activityAgenda = document.querySelector("#activity-agenda");
const appointments = document.querySelector("#appointments");
const courseRegistrations = document.querySelector("#course-registrations");
const toast = document.querySelector("#toast");

const metricCastrations = document.querySelector("#metric-castrations");
const metricCourses = document.querySelector("#metric-courses");
const metricEvents = document.querySelector("#metric-events");
const heroCastrations = document.querySelector("#hero-castrations");
const heroCourses = document.querySelector("#hero-courses");
const heroEvents = document.querySelector("#hero-events");

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function id() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatDate(date) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 3200);
}

function selectedCastrationConfig() {
  return castrationDates.find((item) => item.date === castrationDate.value) || castrationDates[0];
}

function syncDateSelect() {
  castrationDate.innerHTML = castrationDates
    .map((item) => `<option value="${item.date}">${formatDate(item.date)} - ${escapeHtml(item.label)}</option>`)
    .join("");
}

function syncTimeSelect() {
  const config = selectedCastrationConfig();
  const booked = store.castrations.filter((item) => item.date === config.date);

  castrationTime.innerHTML = config.times
    .map((time) => {
      const isBooked = booked.some((item) => item.time === time);
      return `<option value="${time}" ${isBooked ? "disabled" : ""}>${time}${isBooked ? " - reservado" : ""}</option>`;
    })
    .join("");

  const firstFree = [...castrationTime.options].find((option) => !option.disabled);
  if (firstFree) castrationTime.value = firstFree.value;
}

function renderSlots() {
  const config = selectedCastrationConfig();
  const booked = store.castrations.filter((item) => item.date === config.date);

  availabilityTitle.textContent = formatDate(config.date);
  slotList.innerHTML = config.times
    .map((time) => {
      const appointment = booked.find((item) => item.time === time);
      return `
        <div class="slot ${appointment ? "booked" : "free"}">
          <strong>${time}</strong>
          <span>${appointment ? `Reservado para ${escapeHtml(appointment.animal)}` : "Horário livre"}</span>
        </div>
      `;
    })
    .join("");
}

function renderCastrationAgenda() {
  castrationAgenda.innerHTML = castrationDates
    .map((event) => {
      const count = store.castrations.filter((item) => item.date === event.date).length;
      return `
        <article class="event-item blue">
          <strong>${formatDate(event.date)} - ${escapeHtml(event.label)}</strong>
          <span>${count} agendamento(s) confirmado(s). Horários: ${event.times.join(", ")}</span>
        </article>
      `;
    })
    .join("");
}

function renderActivityAgenda() {
  activityAgenda.innerHTML = instituteActivities
    .map((event) => `
      <article class="event-item ${event.color}">
        <strong>${formatDate(event.date)} - ${escapeHtml(event.title)}</strong>
        <span>${escapeHtml(event.details)}</span>
      </article>
    `)
    .join("");
}

function renderAppointments() {
  const items = store.castrations.sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));

  if (!items.length) {
    appointments.innerHTML = '<p class="empty">Nenhum agendamento de castração confirmado ainda.</p>';
    return;
  }

  appointments.innerHTML = items
    .map((item) => `
      <article class="appointment">
        <time>${formatDate(item.date)} às ${escapeHtml(item.time)}</time>
        <div>
          <strong>${escapeHtml(item.name)} - ${escapeHtml(item.animal)}</strong>
          <p>${escapeHtml(item.phone)} - ${escapeHtml(item.address)} - ${escapeHtml(item.animalType)}</p>
        </div>
        <button class="delete-button" type="button" data-cancel-castration="${item.id}">Cancelar</button>
      </article>
    `)
    .join("");
}

function renderCourses() {
  const courses = store.courses;

  if (!courses.length) {
    courseRegistrations.innerHTML = '<p class="empty">Nenhum cadastro de curso recebido ainda.</p>';
    return;
  }

  courseRegistrations.innerHTML = courses
    .map((item) => `
      <article class="registration-item">
        <strong>${escapeHtml(item.name)}</strong>
        <p>${escapeHtml(item.course)} - ${escapeHtml(item.phone)} - ${escapeHtml(item.address)}</p>
      </article>
    `)
    .join("");
}

function renderHeroEvents() {
  const events = [
    ...castrationDates.map((item) => ({ date: item.date, title: item.label, color: "blue" })),
    ...instituteActivities.map((item) => ({ date: item.date, title: item.title, color: item.color }))
  ]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

  heroEvents.innerHTML = events
    .map((event) => `
      <article class="event-item ${event.color}">
        <strong>${formatDate(event.date)}</strong>
        <span>${escapeHtml(event.title)}</span>
      </article>
    `)
    .join("");
}

function renderMetrics() {
  const castrationCount = store.castrations.length;
  const courseCount = store.courses.length;
  const eventCount = castrationDates.length + instituteActivities.length;

  metricCastrations.textContent = String(castrationCount);
  metricCourses.textContent = String(courseCount);
  metricEvents.textContent = String(eventCount);
  heroCastrations.textContent = String(castrationCount);
  heroCourses.textContent = String(courseCount);
}

function renderAll() {
  syncTimeSelect();
  renderSlots();
  renderCastrationAgenda();
  renderActivityAgenda();
  renderAppointments();
  renderCourses();
  renderHeroEvents();
  renderMetrics();
}

castrationForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(castrationForm));
  const conflict = store.castrations.some((item) => item.date === data.date && item.time === data.time);

  if (conflict) {
    showToast("Este horário já foi reservado. Escolha outro horário.");
    renderAll();
    return;
  }

  store.castrations = [...store.castrations, { id: id(), ...data }];
  castrationForm.reset();
  castrationDate.value = data.date;
  showToast("Agendamento de castração confirmado.");
  renderAll();
});

courseForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(courseForm));
  store.courses = [...store.courses, { id: id(), ...data }];
  courseForm.reset();
  showToast("Cadastro para curso salvo.");
  renderAll();
});

castrationDate.addEventListener("change", renderAll);

appointments.addEventListener("click", (event) => {
  const button = event.target.closest("[data-cancel-castration]");
  if (!button) return;

  store.castrations = store.castrations.filter((item) => item.id !== button.dataset.cancelCastration);
  showToast("Agendamento cancelado.");
  renderAll();
});

document.querySelectorAll("a[href^='#']").forEach((link) => {
  link.addEventListener("click", () => {
    link.classList.add("clicked");
    window.setTimeout(() => link.classList.remove("clicked"), 260);
  });
});

syncDateSelect();
renderAll();
