const DATA_URL = "lic_commitments.json";
const HERO_QUERIES = {
  housing: "housing,architecture,nyc",
  parks: "park,bridge,greenspace",
  nycha: "public,housing,urban",
  community: "community,center,urban",
};

let dashboardData = null;

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, "-");
}

function statusBadge(status) {
  if (status === "Complete") {
    return '<span class="badge badge--complete">Complete</span>';
  }
  if (status === "In Progress") {
    return '<span class="badge badge--progress">In Progress</span>';
  }
  return '<span class="badge badge--planned">Planned</span>';
}

function categoryBadge(category) {
  return `<span class="badge badge--cat-${slugify(category)}">${esc(category)}</span>`;
}

function getStats(commitments) {
  const stats = {
    total: commitments.length,
    complete: 0,
    planned: 0,
    inProgress: 0,
    categories: {},
  };

  commitments.forEach((item) => {
    if (item.status === "Complete") stats.complete += 1;
    if (item.status === "Planned") stats.planned += 1;
    if (item.status === "In Progress") stats.inProgress += 1;
    stats.categories[item.category] = (stats.categories[item.category] || 0) + 1;
  });

  return stats;
}

function parseHashRoute() {
  const raw = window.location.hash || "#/";
  const clean = raw.startsWith("#") ? raw.slice(1) : raw;
  const [pathPart, queryPart] = clean.split("?");
  const path = pathPart || "/";
  const query = new URLSearchParams(queryPart || "");
  return { path, query };
}

function setActiveNav(path) {
  document.querySelectorAll("[data-route-prefix]").forEach((link) => {
    const prefix = link.getAttribute("data-route-prefix");
    const active = path === prefix.replace("#", "") || (prefix !== "#/" && path.startsWith(prefix.replace("#", "")));
    link.classList.toggle("nav-item--active", active);
  });
}

function renderNotFound() {
  return `
    <div class="error-page">
      <div class="error-page__code">404</div>
      <div class="error-page__title">Commitment Not Found</div>
      <div class="error-page__sub">The page or commitment ID you are looking for does not exist.</div>
      <a href="#/" class="btn btn--primary">Back to Overview</a>
    </div>
  `;
}

function renderLoadError(message) {
  return `
    <div class="error-page">
      <div class="error-page__code">500</div>
      <div class="error-page__title">Could not load data</div>
      <div class="error-page__sub">${esc(message || "Please try again shortly.")}</div>
      <a href="#/" class="btn btn--primary">Back to Overview</a>
    </div>
  `;
}

function kpiCard(label, value, sub, valueClass, barPercent) {
  return `
    <div class="kpi-card">
      <div class="kpi-card__label">${esc(label)}</div>
      <div class="kpi-card__value ${valueClass}">${esc(value)}</div>
      <div class="kpi-card__sub">${esc(sub)}</div>
      <div class="kpi-card__bar-track">
        <div class="kpi-card__bar-fill ${valueClass}" style="width: ${Math.max(0, Math.min(100, barPercent))}%"></div>
      </div>
    </div>
  `;
}

function renderOverview(data) {
  const commitments = data.commitments || [];
  const stats = getStats(commitments);
  const recent = commitments.slice(0, 3);
  const completePct = stats.total ? Math.round((stats.complete / stats.total) * 100) : 0;
  const plannedPct = stats.total ? Math.round((stats.planned / stats.total) * 100) : 0;

  const priorityAreas = Object.entries(stats.categories)
    .map(([cat, count]) => {
      const pct = stats.total ? Math.round((count / stats.total) * 100) : 0;
      return `
        <div class="category-bar">
          <div class="category-bar__label">
            <span class="category-bar__name">${esc(cat)}</span>
            <span class="category-bar__count">${count} item${count === 1 ? "" : "s"}</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill bar-fill--${slugify(cat)}" style="width: ${pct}%"></div>
          </div>
        </div>
      `;
    })
    .join("");

  const completedMilestones = commitments
    .filter((item) => item.status === "Complete")
    .map(
      (item) => `
        <div class="milestone milestone--complete">
          <span class="milestone__dot milestone__dot--green"></span>
          <div class="milestone__text">
            <div class="milestone__name">${esc(item.id)} - ${esc(item.promise.slice(0, 45))}${item.promise.length > 45 ? "..." : ""}</div>
            <div class="milestone__sub">${esc(item.timeframe)}</div>
          </div>
        </div>
      `,
    )
    .join("");

  return `
    <div class="page-header">
      <div class="page-header__title-group">
        <h1 class="page-header__title">Neighborhood Plan Overview</h1>
        <p class="page-header__sub">Long Island City - Tracking ${stats.total} active commitments</p>
      </div>
      <div class="live-badge">
        <span class="live-badge__dot"></span>
        Live
      </div>
    </div>

    <div class="kpi-row">
      ${kpiCard("Total Commitments", stats.total, `Across ${Object.keys(stats.categories).length} categories`, "text-white", 100)}
      ${kpiCard("Complete", stats.complete, `${completePct}% completion rate`, "text-green", completePct)}
      ${kpiCard("Planned", stats.planned, `${plannedPct}% of plan pending`, "text-orange", plannedPct)}
    </div>

    <div class="bottom-row">
      <div class="card card--fill">
        <div class="card__header">
          <h2 class="card__title">Key Commitments</h2>
          <a href="#/projects" class="card__link">View all &rarr;</a>
        </div>
        <div class="mini-table">
          <div class="mini-table__head">
            <div class="mini-table__col mini-table__col--fill">COMMITMENT</div>
            <div class="mini-table__col" style="width:100px">CATEGORY</div>
            <div class="mini-table__col" style="width:90px">STATUS</div>
          </div>
          ${recent
            .map(
              (item) => `
              <a href="#/detail/${encodeURIComponent(item.id)}" class="mini-table__row">
                <div class="mini-table__col mini-table__col--fill">
                  <div class="row-title">${esc(item.promise)}</div>
                  <div class="row-sub">${esc(item.amount)} - ${esc(item.responsible_agency)}</div>
                </div>
                <div class="mini-table__col" style="width:100px">
                  ${categoryBadge(item.category)}
                </div>
                <div class="mini-table__col" style="width:90px">
                  ${statusBadge(item.status)}
                </div>
              </a>
            `,
            )
            .join("")}
        </div>
      </div>

      <div class="card card--sidebar">
        <h2 class="card__title">Priority Areas</h2>
        ${priorityAreas}
        <div class="milestones">
          <h3 class="milestones__title">Upcoming Milestones</h3>
          <div class="milestone">
            <span class="milestone__dot"></span>
            <div class="milestone__text">
              <div class="milestone__name">Rezoning Vote - LIC Neighborhood Plan</div>
              <div class="milestone__sub">Pending Council approval - 2025-2026</div>
            </div>
          </div>
          ${completedMilestones}
        </div>
      </div>
    </div>
  `;
}

function renderProjects(data, query) {
  const all = data.commitments || [];
  const categories = ["All", ...new Set(all.map((item) => item.category))];
  const activeCategory = query.get("category") || "All";
  const activeStatus = query.get("status") || "All";

  const filtered = all.filter((item) => {
    const categoryMatch = activeCategory === "All" || item.category === activeCategory;
    const statusMatch = activeStatus === "All" || item.status === activeStatus;
    return categoryMatch && statusMatch;
  });

  const categoryChips = categories
    .map((cat) => {
      const href = `#/projects?category=${encodeURIComponent(cat)}&status=${encodeURIComponent(activeStatus)}`;
      return `<a href="${href}" class="chip ${activeCategory === cat ? "chip--active" : ""}">${esc(cat)}</a>`;
    })
    .join("");

  const rows = filtered.length
    ? filtered
        .map(
          (item) => `
            <tr class="data-table__row" data-detail-id="${esc(item.id)}">
              <td class="table-id">${esc(item.id)}</td>
              <td>${categoryBadge(item.category)}</td>
              <td>
                <div class="row-title">${esc(item.promise)}</div>
                <div class="row-sub">${esc(item.geography_site)}</div>
              </td>
              <td class="table-amount">${esc(item.amount)}</td>
              <td class="text-secondary">${esc(item.responsible_agency)}</td>
              <td>${statusBadge(item.status)}</td>
            </tr>
          `,
        )
        .join("")
    : '<tr><td colspan="6" class="table-empty">No commitments match the selected filters.</td></tr>';

  return `
    <div class="page-header">
      <div class="page-header__title-group">
        <h1 class="page-header__title">All Commitments</h1>
        <p class="page-header__sub">${filtered.length} item${filtered.length === 1 ? "" : "s"} - One LIC Neighborhood Plan</p>
      </div>
    </div>

    <div class="filter-row">
      <div class="chips">${categoryChips}</div>
      <div class="filter-status">
        <select id="status-filter" class="select" aria-label="Status Filter">
          <option value="All" ${activeStatus === "All" ? "selected" : ""}>All Statuses</option>
          <option value="Planned" ${activeStatus === "Planned" ? "selected" : ""}>Planned</option>
          <option value="In Progress" ${activeStatus === "In Progress" ? "selected" : ""}>In Progress</option>
          <option value="Complete" ${activeStatus === "Complete" ? "selected" : ""}>Complete</option>
        </select>
      </div>
    </div>

    <div class="data-table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th style="width:90px">ID</th>
            <th style="width:110px">CATEGORY</th>
            <th>COMMITMENT</th>
            <th style="width:130px">AMOUNT</th>
            <th style="width:140px">AGENCY</th>
            <th style="width:100px">STATUS</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function renderTimeline(data) {
  const commitments = data.commitments || [];
  const grouped = commitments.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const groups = Object.entries(grouped)
    .map(([category, items]) => {
      const capital = items
        .map((item) => item.amount)
        .filter((amount) => typeof amount === "string" && amount.includes("$"));

      const entries = items
        .map(
          (item) => `
            <a href="#/detail/${encodeURIComponent(item.id)}" class="timeline-item ${item.status === "Complete" ? "timeline-item--complete" : ""}">
              <div class="timeline-item__id">${esc(item.id)}</div>
              <div class="timeline-item__name">${esc(item.promise)}</div>
              <div class="timeline-item__time">${esc(item.timeframe)}</div>
              ${statusBadge(item.status)}
            </a>
          `,
        )
        .join("");

      return `
        <div class="timeline-category">
          <div class="timeline-category__header">
            <span class="timeline-category__dot timeline-category__dot--${slugify(category)}"></span>
            <span class="timeline-category__name">${esc(category)}</span>
            <span class="timeline-category__sub">${items.length} commitment${items.length === 1 ? "" : "s"}${capital.length ? ` - ${esc(capital.join(", "))}` : ""}</span>
          </div>
          <div class="timeline-items">${entries}</div>
        </div>
      `;
    })
    .join("");

  return `
    <div class="page-header">
      <div class="page-header__title-group">
        <h1 class="page-header__title">Commitment Timeline</h1>
        <p class="page-header__sub">${commitments.length} commitments across ${Object.keys(grouped).length} categories - Timeframes as stated</p>
      </div>
    </div>

    <div class="timeline-layout">
      <div class="timeline-legend">
        <div class="timeline-legend__card">
          <div class="timeline-legend__label">PHASE</div>
          <div class="timeline-legend__item timeline-legend__item--active">Upon Rezoning</div>
          <div class="timeline-legend__item">Short-term</div>
          <div class="timeline-legend__item">Long-term</div>
          <div class="timeline-legend__item">TBD</div>
        </div>
      </div>
      <div class="timeline-groups">${groups}</div>
    </div>
  `;
}

function renderDetail(data, id) {
  const commitments = data.commitments || [];
  const item = commitments.find((entry) => entry.id === id);
  if (!item) return renderNotFound();

  const related = commitments.filter((entry) => entry.category === item.category && entry.id !== item.id);
  const catSlug = slugify(item.category);
  const heroQuery = HERO_QUERIES[catSlug] || "urban,nyc";
  const heroImg = `https://source.unsplash.com/1200x400/?${heroQuery}`;

  return `
    <div class="hero" style="background-image: url('${heroImg}');">
      <div class="hero__overlay">
        <div class="hero__breadcrumb">
          <a href="#/projects" class="hero__bc-link">Projects</a>
          <span class="hero__bc-sep">/</span>
          <span>${esc(item.id)}</span>
        </div>
        <h1 class="hero__title">${esc(item.promise)}</h1>
        <div class="hero__meta">
          ${categoryBadge(item.category)}
          ${statusBadge(item.status)}
          <span class="hero__amount">${esc(item.amount)}</span>
        </div>
      </div>
    </div>

    <div class="detail-grid">
      <div class="detail-left">
        <div class="info-grid">
          <div class="info-card">
            <div class="info-card__label">AMOUNT</div>
            <div class="info-card__value text-green">${esc(item.amount)}</div>
          </div>
          <div class="info-card">
            <div class="info-card__label">AGENCY</div>
            <div class="info-card__value">${esc(item.responsible_agency)}</div>
          </div>
          <div class="info-card">
            <div class="info-card__label">TIMEFRAME</div>
            <div class="info-card__value text-orange">${esc(item.timeframe)}</div>
          </div>
        </div>

        <div class="card card--detail">
          <div class="detail-row">
            <span class="detail-row__label">Geography / Site</span>
            <span class="detail-row__value">${esc(item.geography_site)}</span>
          </div>
        </div>

        <div class="card card--detail">
          <h2 class="card__title">Notes</h2>
          <p class="card__body">${esc(item.notes)}</p>
        </div>

        <a href="${esc(item.verification_url)}" target="_blank" rel="noopener" class="card card--detail card--link verify-card">
          <i data-lucide="external-link" class="verify-card__icon"></i>
          <div>
            <div class="verify-card__label">Verification Source</div>
            <div class="verify-card__url">${esc(item.verification_url)}</div>
          </div>
        </a>
      </div>

      <div class="detail-right">
        <h2 class="card__title">Related Commitments</h2>
        ${related.length
          ? related
              .map(
                (rel) => `
                  <a href="#/detail/${encodeURIComponent(rel.id)}" class="related-card">
                    <div class="related-card__id">${esc(rel.id)}</div>
                    <div class="related-card__name">${esc(rel.promise)}</div>
                    ${statusBadge(rel.status)}
                  </a>
                `,
              )
              .join("")
          : '<p class="text-muted">No related commitments.</p>'}
      </div>
    </div>
  `;
}

function bindProjectsInteractions(query) {
  const statusSelect = document.getElementById("status-filter");
  if (statusSelect) {
    statusSelect.addEventListener("change", (event) => {
      const status = event.target.value;
      const category = query.get("category") || "All";
      window.location.hash = `#/projects?category=${encodeURIComponent(category)}&status=${encodeURIComponent(status)}`;
    });
  }

  document.querySelectorAll("tr[data-detail-id]").forEach((row) => {
    row.addEventListener("click", () => {
      const id = row.getAttribute("data-detail-id");
      window.location.hash = `#/detail/${encodeURIComponent(id)}`;
    });
  });
}

function initializeIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function renderRoute() {
  const app = document.getElementById("app");
  if (!app) return;
  if (!dashboardData) {
    app.innerHTML = renderLoadError("Dashboard data is not available.");
    initializeIcons();
    return;
  }

  const { path, query } = parseHashRoute();
  setActiveNav(path);

  if (path === "/" || path === "") {
    app.innerHTML = renderOverview(dashboardData);
  } else if (path === "/projects") {
    app.innerHTML = renderProjects(dashboardData, query);
    bindProjectsInteractions(query);
  } else if (path === "/timeline") {
    app.innerHTML = renderTimeline(dashboardData);
  } else if (path.startsWith("/detail/")) {
    const id = decodeURIComponent(path.replace("/detail/", ""));
    app.innerHTML = renderDetail(dashboardData, id);
  } else {
    app.innerHTML = renderNotFound();
  }

  initializeIcons();
}

async function loadData() {
  const cacheBuster = Math.floor(Date.now() / (1000 * 60 * 5));
  const response = await fetch(`${DATA_URL}?v=${cacheBuster}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to load commitments (${response.status})`);
  }
  return response.json();
}

document.addEventListener("DOMContentLoaded", async () => {
  if (!window.location.hash) {
    window.location.hash = "#/";
  }

  try {
    dashboardData = await loadData();
    renderRoute();
  } catch (error) {
    const app = document.getElementById("app");
    if (app) {
      app.innerHTML = renderLoadError(error.message);
      initializeIcons();
    }
  }

  window.addEventListener("hashchange", renderRoute);
});
