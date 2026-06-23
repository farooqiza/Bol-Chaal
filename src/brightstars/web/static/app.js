"use strict";

const $ = (s) => document.querySelector(s);
const STATUS_COLOR = { draft: "#9aa0a6", approved: "#2e9e5b", published: "#6b4ea8", skipped: "#c0392b" };
const PLATFORM_COLOR = { facebook: "#1877f2", instagram: "#d6249f", linkedin: "#0a66c2" };

const state = { tab: "dashboard", months: [], month: null, calendar: null, analytics: null, status: null };

/* ── helpers ─────────────────────────────────────────────── */
const esc = (s) => (s || "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const prettyPillar = (id) => id.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

async function api(path, opts) {
  const r = await fetch(path, opts);
  if (!r.ok) {
    const j = await r.json().catch(() => ({}));
    throw new Error(j.error || "HTTP " + r.status);
  }
  return r.json();
}
const post = (path, body) =>
  api(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body || {}) });

function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.remove("hidden");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.add("hidden"), 2600);
}

function nextMonth() {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/* ── tiny charts (no libraries) ──────────────────────────── */
function donutEl(segments, centerLabel) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  let acc = 0;
  const stops = segments.map((s) => {
    const from = (acc / total) * 100;
    acc += s.value;
    return `${s.color} ${from}% ${(acc / total) * 100}%`;
  });
  const legend = segments
    .map((s) => `<div class="row"><span class="sw" style="background:${s.color}"></span>${s.label}<span class="n">${s.value}</span></div>`)
    .join("");
  return `<div class="donutwrap">
    <div class="donut" style="background:conic-gradient(${stops.join(",")})">
      <div class="center"><b>${total}</b><span>${centerLabel || ""}</span></div>
    </div>
    <div class="legend">${legend}</div></div>`;
}

function barsEl(items) {
  if (!items.length) return '<div class="muted">No data yet.</div>';
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    '<div class="bars">' +
    items
      .map(
        (i) =>
          `<div class="bar"><span>${esc(i.label)}</span><span class="track"><span class="fill" style="width:${Math.round(
            (i.value / max) * 100
          )}%"></span></span><span class="val">${i.value}</span></div>`
      )
      .join("") +
    "</div>"
  );
}

/* ── social preview mockups ──────────────────────────────── */
const tagsLine = (t) => (t && t.length ? `<div class="sm-tags">${t.map(esc).join(" ")}</div>` : "");
function imgBlock(p, square) {
  if (p.image_url) return `<div class="sm-img${square ? " square" : ""}"><img src="${esc(p.image_url)}" alt=""></div>`;
  return `<div class="sm-img${square ? " square" : ""}"><span class="cam">📷</span>${esc(p.image_prompt)}</div>`;
}

function mockFacebook(p) {
  return `<div class="sm">
    <div class="sm-head"><div class="avatar">BS</div><div><div class="sm-name">Bright Stars Child Care &amp; Preschool</div><div class="sm-sub">${p.date} · 🌐</div></div></div>
    <div class="sm-body">${esc(p.caption)}</div>${imgBlock(p, false)}${tagsLine(p.hashtags)}
    <div class="sm-cta">👉 ${esc(p.call_to_action)}</div>
    <div class="sm-actions"><span>👍 Like</span><span>💬 Comment</span><span>↪️ Share</span></div></div>`;
}
function mockInstagram(p) {
  return `<div class="sm">
    <div class="sm-head"><div class="avatar ig">BS</div><div class="sm-name">brightstarsdaycarecenter</div></div>
    ${imgBlock(p, true)}
    <div class="sm-actions" style="border-top:none;padding-top:8px"><span>❤️</span><span>💬</span><span>✈️</span><span style="margin-left:auto">🔖</span></div>
    <div class="sm-body"><b>brightstarsdaycarecenter</b> ${esc(p.caption)}</div>${tagsLine(p.hashtags)}
    <div class="sm-cta">👉 ${esc(p.call_to_action)}</div></div>`;
}
function mockLinkedin(p) {
  return `<div class="sm">
    <div class="sm-head"><div class="avatar li">BS</div><div><div class="sm-name">Bright Stars Child Care &amp; Preschool</div><div class="sm-sub">Aurora, CO · ${p.date}</div></div></div>
    <div class="sm-body">${esc(p.caption)}</div>${imgBlock(p, false)}${tagsLine(p.hashtags)}
    <div class="sm-cta">👉 ${esc(p.call_to_action)}</div>
    <div class="sm-actions"><span>👍 Like</span><span>💬 Comment</span><span>🔁 Repost</span><span>➤ Send</span></div></div>`;
}

function actionButtons(p) {
  if (p.status === "published")
    return p.permalink ? `<a class="btn ghost sm" href="${esc(p.permalink)}" target="_blank">View live ↗</a>` : `<span class="muted">live</span>`;
  let b = "";
  if (p.status !== "approved") b += `<button class="btn ok sm" data-act="approve" data-id="${p.id}">✓ Approve</button>`;
  if (p.status !== "skipped") b += `<button class="btn warn sm" data-act="skip" data-id="${p.id}">Skip</button>`;
  if (p.status !== "draft") b += `<button class="btn ghost sm" data-act="reset" data-id="${p.id}" title="Back to draft">↺</button>`;
  return b;
}

function postCard(p) {
  const mock = p.platform === "instagram" ? mockInstagram(p) : p.platform === "linkedin" ? mockLinkedin(p) : mockFacebook(p);
  return `<div class="post">
    <div class="post-top">
      <span class="plat-pill ${p.platform}">${p.platform}</span>
      <span class="pillar">${prettyPillar(p.pillar)} · ${p.format}</span>
      <span class="date">${p.date}</span>
    </div>
    ${mock}
    <div class="consent">🔒 <span>${esc(p.notes)}</span></div>
    <div class="post-actions"><span class="badge ${p.status}">${p.status}</span><span style="flex:1"></span>${actionButtons(p)}</div>
  </div>`;
}

/* ── renderers ───────────────────────────────────────────── */
function renderConns(c) {
  const items = [["Claude", c.claude], ["Meta", c.meta], ["LinkedIn", c.linkedin]];
  $("#conns").innerHTML = items
    .map(([l, on]) => `<span class="conn"><span class="dot ${on ? "on" : ""}"></span>${l}</span>`)
    .join("");
}

function renderDashboard() {
  const c = state.analytics.content,
    pf = state.analytics.performance,
    foll = pf.followers;
  const totalFollowers = (foll.facebook || 0) + (foll.instagram || 0) + (foll.linkedin || 0);

  const kpis = [
    ["Posts this month", c.total, ""],
    ["Approved", c.by_status.approved || 0, `${c.by_status.published || 0} published`],
    ["Est. reach", pf.totals.reach.toLocaleString(), "sample"],
    ["Followers", totalFollowers.toLocaleString(), foll.source],
  ];
  const kpiHTML = kpis
    .map(([l, v, s]) => `<div class="kpi"><div class="v">${v}</div><div class="l">${l}</div>${s ? `<div class="s muted">${s}</div>` : ""}</div>`)
    .join("");

  const statusSeg = Object.entries(c.by_status).map(([k, v]) => ({ label: cap(k), value: v, color: STATUS_COLOR[k] || "#ccc" }));
  const platSeg = Object.entries(c.by_platform).map(([k, v]) => ({ label: cap(k), value: v, color: PLATFORM_COLOR[k] || "#ccc" }));
  const pillarBars = Object.entries(c.by_pillar).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ label: prettyPillar(k), value: v }));
  const weekBars = c.weekly.map((w) => ({ label: w.week, value: w.count }));
  const engBars = Object.entries(pf.per_platform).map(([k, v]) => ({ label: cap(k), value: v.interactions }));

  const follHTML = `<div class="foll">
    <div class="f"><div class="ico">📘</div><div class="v">${foll.facebook}</div><div class="l">Facebook</div></div>
    <div class="f"><div class="ico">📸</div><div class="v">${foll.instagram}</div><div class="l">Instagram</div></div>
    <div class="f"><div class="ico">💼</div><div class="v">${foll.linkedin}</div><div class="l">LinkedIn</div></div></div>`;

  const top =
    pf.top_posts
      .map(
        (t) =>
          `<div class="toprow"><span class="pill" style="background:${PLATFORM_COLOR[t.platform]}">${cap(t.platform)}</span> ${prettyPillar(
            t.pillar
          )} <span class="meta">${t.interactions} interactions · ${t.reach} reach</span></div>`
      )
      .join("") || '<div class="muted">No published or approved posts yet.</div>';

  const sampleTag = '<span class="tag sample">Sample</span>';
  const follTag = foll.source === "live" ? '<span class="tag live">Live</span>' : sampleTag;
  const connectNote = pf.connected.meta
    ? ""
    : `<div class="card" style="background:#fff8e6;border-color:#f0dca0"><b>Connect Meta &amp; LinkedIn for live numbers.</b>
       <div class="muted" style="margin-top:4px">Follower counts go live once connected; the engagement figures below are
       illustrative sample data derived from your content, so the dashboard is useful before launch. See <code>docs/SETUP.md</code>.</div></div>`;

  $("#dashboard").innerHTML = `
    <div class="kpis">${kpiHTML}</div>
    <div class="grid2">
      <div class="card"><h3>Posts by status</h3>${donutEl(statusSeg, "posts")}</div>
      <div class="card"><h3>Posts by platform</h3>${donutEl(platSeg, "posts")}</div>
    </div>
    <div class="grid2">
      <div class="card"><h3>Content mix (pillars)</h3>${barsEl(pillarBars)}</div>
      <div class="card"><h3>Posting cadence</h3>${barsEl(weekBars)}</div>
    </div>
    <div class="section-title">Performance</div>
    ${connectNote}
    <div class="card"><h3>Audience ${follTag}</h3>${follHTML}</div>
    <div class="grid2">
      <div class="card"><h3>Engagement by platform ${sampleTag}</h3>${barsEl(engBars)}</div>
      <div class="card"><h3>Top posts ${sampleTag}</h3><div class="toplist">${top}</div></div>
    </div>`;
}

function renderPreview() {
  const fp = $("#fPlatform").value,
    fs = $("#fStatus").value;
  let posts = [...state.calendar.posts].sort((a, b) => a.date.localeCompare(b.date) || a.platform.localeCompare(b.platform));
  if (fp) posts = posts.filter((p) => p.platform === fp);
  if (fs) posts = posts.filter((p) => p.status === fs);
  $("#previewCount").textContent = `${posts.length} of ${state.calendar.posts.length} posts`;
  $("#cards").innerHTML = posts.map(postCard).join("") || '<div class="muted">No posts match these filters.</div>';
}

function renderCalendar() {
  const [y, m] = state.month.split("-").map(Number);
  const startDow = new Date(y, m - 1, 1).getDay();
  const days = new Date(y, m, 0).getDate();
  const byDate = {};
  state.calendar.posts.forEach((p) => (byDate[p.date] = byDate[p.date] || []).push(p));

  let cells = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => `<div class="cal-h">${d}</div>`).join("");
  for (let i = 0; i < startDow; i++) cells += `<div class="cal-cell empty"></div>`;
  for (let d = 1; d <= days; d++) {
    const ds = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const chips = (byDate[ds] || [])
      .map(
        (p) =>
          `<span class="cal-chip ${p.platform} ${p.status === "skipped" ? "skipped" : ""}" title="${esc(
            cap(p.platform) + " · " + prettyPillar(p.pillar) + " · " + p.status
          )}">${cap(p.platform[0])} ${prettyPillar(p.pillar).split(" ")[0]}</span>`
      )
      .join("");
    cells += `<div class="cal-cell"><div class="d">${d}</div>${chips}</div>`;
  }
  $("#calGrid").innerHTML = cells;
}

function renderAll() {
  if (!state.calendar) return;
  renderDashboard();
  renderPreview();
  renderCalendar();
}

/* ── view + data flow ────────────────────────────────────── */
function setView() {
  const empty = !state.months.length;
  $("#empty").classList.toggle("hidden", !empty);
  ["dashboard", "preview", "calendar"].forEach((t) => $("#" + t).classList.toggle("hidden", empty || t !== state.tab));
}

async function reloadAnalytics() {
  state.analytics = await api("/api/analytics/" + state.month);
}

async function loadMonth(month) {
  state.month = month;
  state.calendar = await api("/api/calendar/" + month);
  await reloadAnalytics();
  renderAll();
  setView();
}

async function refreshMonths(preferLatest) {
  const { months, latest } = await api("/api/months");
  state.months = months;
  $("#monthSelect").innerHTML = months.map((m) => `<option value="${m}">${m}</option>`).join("");
  if (!months.length) {
    setView();
    return;
  }
  const target = preferLatest && (!state.month || !months.includes(state.month)) ? latest : state.month || latest;
  $("#monthSelect").value = target;
  await loadMonth(target);
}

/* ── events ──────────────────────────────────────────────── */
function bind() {
  document.querySelectorAll(".tab").forEach((b) =>
    b.addEventListener("click", () => {
      state.tab = b.dataset.tab;
      document.querySelectorAll(".tab").forEach((x) => x.classList.toggle("active", x === b));
      setView();
    })
  );
  $("#monthSelect").addEventListener("change", (e) => loadMonth(e.target.value));
  $("#fPlatform").addEventListener("change", renderPreview);
  $("#fStatus").addEventListener("change", renderPreview);

  $("#approveAll").addEventListener("click", async () => {
    const ids = state.calendar.posts.filter((p) => p.status === "draft").map((p) => p.id);
    if (!ids.length) return toast("No drafts to approve");
    const res = await post(`/api/calendar/${state.month}/approve`, { ids });
    state.calendar = res.calendar;
    await reloadAnalytics();
    renderAll();
    toast(`Approved ${res.changed} post(s)`);
  });

  $("#cards").addEventListener("click", async (e) => {
    const b = e.target.closest("button[data-act]");
    if (!b) return;
    try {
      const res = await post(`/api/calendar/${state.month}/${b.dataset.act}`, { ids: [b.dataset.id] });
      state.calendar = res.calendar;
      await reloadAnalytics();
      renderAll();
    } catch (err) {
      toast("Error: " + err.message);
    }
  });

  $("#emptySample").addEventListener("click", async () => {
    const m = nextMonth();
    await post("/api/sample/" + m);
    state.month = m;
    toast("Sample month created");
    await refreshMonths(true);
  });
  $("#emptyGenerate").addEventListener("click", async () => {
    const m = nextMonth();
    toast("Generating with AI… (needs your Claude key)");
    try {
      await post("/api/generate/" + m);
      state.month = m;
      await refreshMonths(true);
      toast("Generated " + m);
    } catch (err) {
      toast("Generate failed: " + err.message);
    }
  });
}

async function init() {
  try {
    state.status = await api("/api/status");
    renderConns(state.status.connected);
    bind();
    await refreshMonths(true);
  } catch (err) {
    toast("Startup error: " + err.message);
  }
}

init();
