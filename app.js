(() => {
  "use strict";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const students = Array.isArray(window.SHIROKO_STUDENTS) ? window.SHIROKO_STUDENTS : [];
  const els = {
    search: $("#searchInput"), school: $("#schoolFilter"), sort: $("#sortFilter"), grid: $("#studentGrid"),
    empty: $("#emptyState"), results: $("#resultsLabel"), total: $("#studentTotal"), schools: $("#schoolTotal"),
    favoriteTotal: $("#favoriteTotal"), dialog: $("#studentDialog"), dialogContent: $("#dialogContent"), toast: $("#toast")
  };
  const FAVORITES_KEY = "shiroko-hub-favorites-v1";
  const THEME_KEY = "shiroko-hub-theme-v1";
  let favorites = readFavorites();
  let toastTimer;
  function readFavorites() {
    try { const value = JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]"); return new Set(Array.isArray(value) ? value : []); }
    catch { return new Set(); }
  }
  function saveFavorites() { try { localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favorites])); } catch {} }
  function escapeHTML(value) { return String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char])); }
  function initials(name) { return [...String(name).replace(/（[^）]*）/g, "")].slice(0, 2).join("") || "✦"; }
  function showToast(message) {
    els.toast.textContent = message; els.toast.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => els.toast.classList.remove("show"), 2100);
  }
  function setupSchoolFilter() {
    const schools = [...new Set(students.map(student => student.school).filter(school => school && school !== "待核实"))].sort((a,b) => a.localeCompare(b, "zh-CN"));
    for (const school of schools) { const option = document.createElement("option"); option.value = school; option.textContent = school; els.school.append(option); }
    els.schools.textContent = String(schools.length);
  }
  function getVisibleStudents() {
    const query = els.search.value.trim().toLocaleLowerCase();
    let visible = students.filter(student => {
      const matchesQuery = !query || [student.name, student.baseName, student.variant, student.school].some(value => String(value || "").toLocaleLowerCase().includes(query));
      const matchesSchool = els.school.value === "all" || student.school === els.school.value;
      const matchesFavorites = document.body.dataset.favoritesOnly !== "true" || favorites.has(student.id);
      return matchesQuery && matchesSchool && matchesFavorites;
    });
    if (els.sort.value === "name") visible.sort((a,b) => a.name.localeCompare(b.name, "zh-CN"));
    return visible;
  }
  function makeCard(student) {
    const card = document.createElement("article"); card.className = "student-card";
    const top = document.createElement("div"); top.className = "card-top";
    const avatar = document.createElement("div"); avatar.className = "student-avatar"; avatar.textContent = initials(student.name); avatar.setAttribute("aria-hidden", "true");
    const favorite = document.createElement("button"); favorite.type = "button"; favorite.className = `favorite-button${favorites.has(student.id) ? " is-favorite" : ""}`; favorite.textContent = favorites.has(student.id) ? "♥" : "♡"; favorite.setAttribute("aria-label", favorites.has(student.id) ? `取消收藏${student.name}` : `收藏${student.name}`); favorite.title = favorite.getAttribute("aria-label");
    favorite.addEventListener("click", () => toggleFavorite(student)); top.append(avatar, favorite);
    const main = document.createElement("div"); main.className = "card-main";
    const title = document.createElement("h3"); title.textContent = student.name;
    const variant = document.createElement("span"); variant.className = "variant-label"; variant.textContent = student.variant;
    const school = document.createElement("p"); school.className = "school-label"; school.textContent = student.school === "待核实" ? "学校资料待核实" : student.school;
    main.append(title, variant, school);
    const bottom = document.createElement("div"); bottom.className = "card-bottom";
    const status = document.createElement("span"); status.className = "status-pill"; status.textContent = "资料待核实";
    const details = document.createElement("button"); details.className = "details-button"; details.type = "button"; details.textContent = "查看档案 →"; details.addEventListener("click", () => openStudent(student));
    bottom.append(status, details); card.append(top, main, bottom); return card;
  }
  function render() {
    const visible = getVisibleStudents(); els.grid.replaceChildren();
    const fragment = document.createDocumentFragment(); visible.forEach(student => fragment.append(makeCard(student))); els.grid.append(fragment);
    els.results.textContent = `显示 ${visible.length} / ${students.length} 个档案`;
    els.empty.classList.toggle("hidden", visible.length > 0); els.grid.classList.toggle("hidden", visible.length === 0);
    els.total.textContent = String(students.length); els.favoriteTotal.textContent = String(favorites.size);
  }
  function toggleFavorite(student) {
    if (favorites.has(student.id)) { favorites.delete(student.id); showToast(`已从收藏中移除：${student.name}`); }
    else { favorites.add(student.id); showToast(`已收藏：${student.name}`); }
    saveFavorites(); render();
  }
  function openStudent(student) {
    els.dialogContent.replaceChildren();
    const wrapper = document.createElement("div"); wrapper.className = "dialog-content";
    wrapper.innerHTML = `<div class="dialog-kicker">STUDENT PROFILE · ${escapeHTML(student.id.toUpperCase())}</div><div class="dialog-avatar">${escapeHTML(initials(student.name))}</div><h2>${escapeHTML(student.name)}</h2><p>${escapeHTML(student.introduction)}</p><div class="detail-grid"><div class="detail-cell"><small>学校</small><strong>${escapeHTML(student.school)}</strong></div><div class="detail-cell"><small>形态</small><strong>${escapeHTML(student.variant)}</strong></div><div class="detail-cell"><small>战斗定位</small><strong>${escapeHTML(student.role)}</strong></div><div class="detail-cell"><small>攻击 / 防御</small><strong>${escapeHTML(student.attackType)} / ${escapeHTML(student.armorType)}</strong></div></div><section class="detail-block"><h3>技能资料</h3><p>${escapeHTML(student.skills)}</p></section><section class="detail-block"><h3>养成与升级</h3><p>${escapeHTML(student.growth)}</p></section><section class="detail-block"><h3>资料状态</h3><p>${escapeHTML(student.sourceStatus)}</p></section>`;
    els.dialogContent.append(wrapper);
    if (typeof els.dialog.showModal === "function") els.dialog.showModal(); else showToast("当前浏览器不支持档案弹窗，请尝试更新浏览器。");
  }
  function clearFilters() { els.search.value = ""; els.school.value = "all"; els.sort.value = "name"; document.body.dataset.favoritesOnly = "false"; $$("[data-view]").forEach(link => link.classList.remove("active")); render(); }
  function showFavorites() { document.body.dataset.favoritesOnly = "true"; els.search.value = ""; els.school.value = "all"; location.hash = "students"; $$("[data-view]").forEach(link => link.classList.toggle("active", link.dataset.view === "favorites")); render(); }
  function setTheme(theme) { document.body.classList.toggle("dark", theme === "dark"); $("#themeToggle").textContent = theme === "dark" ? "☀" : "☾"; try { localStorage.setItem(THEME_KEY, theme); } catch {} }
  function randomStudent() { if (!students.length) return; const student = students[Math.floor(Math.random() * students.length)]; openStudent(student); }
  els.search.addEventListener("input", () => { document.body.dataset.favoritesOnly = "false"; render(); });
  els.school.addEventListener("change", render); els.sort.addEventListener("change", render);
  $("#clearFiltersButton").addEventListener("click", clearFilters); $("#emptyResetButton").addEventListener("click", clearFilters);
  $("#exploreButton").addEventListener("click", () => { document.body.dataset.favoritesOnly = "false"; $("#students").scrollIntoView({behavior:"smooth"}); els.search.focus({preventScroll:true}); });
  $("#randomButton").addEventListener("click", randomStudent); $("#showFavoritesButton").addEventListener("click", showFavorites);
  $("#dialogClose").addEventListener("click", () => els.dialog.close());
  els.dialog.addEventListener("click", event => { if (event.target === els.dialog) els.dialog.close(); });
  $("#themeToggle").addEventListener("click", () => setTheme(document.body.classList.contains("dark") ? "light" : "dark"));
  $("#gridViewButton").addEventListener("click", () => { els.grid.classList.remove("list-view"); $("#gridViewButton").classList.add("active"); $("#listViewButton").classList.remove("active"); });
  $("#listViewButton").addEventListener("click", () => { els.grid.classList.add("list-view"); $("#listViewButton").classList.add("active"); $("#gridViewButton").classList.remove("active"); });
  $$("[data-view]").forEach(link => link.addEventListener("click", () => {
    const view = link.dataset.view;
    $$("[data-view]").forEach(item => item.classList.toggle("active", item.dataset.view === view));
    if (view === "favorites") showFavorites(); else if (view === "students" || view === "home" || view === "about") { document.body.dataset.favoritesOnly = "false"; render(); }
  }));
  document.addEventListener("keydown", event => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); els.search.focus(); }
    if (event.key === "Escape" && els.dialog.open) els.dialog.close();
  });
  try { setTheme(localStorage.getItem(THEME_KEY) || "light"); } catch { setTheme("light"); }
  setupSchoolFilter(); render();
})();
