// app.js · Colorado Referees Hub
// Reads from the database as the signed-in person. Writes (check-in, Help)
// go through the current backend this week so the sheet and the database
// both get them.
(function () {
  'use strict';
  // The version. Goes up with every change to any file in this folder.
  var VERSION = '2026.09.30-b';
  var C = window.HUB, L = window.LANG;
  var sb = window.supabase.createClient(C.supabaseUrl, C.publishableKey);
  var $ = function (id) { return document.getElementById(id); };
  var S = { lang: 'en', me: null, games: [], checkins: {}, notes: [], bulletins: [], events: [], game: null, reason: null,
            coach: { games: [], venue: null, game: null, ref: null, area: null, notes: [] } };

  // ── Words ────────────────────────────────────────────────────────
  function t(key) {
    var o = L[S.lang], parts = key.split('.');
    for (var i = 0; i < parts.length; i++) { if (o == null) return key; o = o[parts[i]]; }
    return o == null ? key : o;
  }
  function applyWords() {
    document.documentElement.lang = S.lang;
    document.querySelectorAll('[data-t]').forEach(function (el) { el.innerHTML = t(el.getAttribute('data-t')); });
    document.querySelectorAll('[data-title]').forEach(function (el) { el.setAttribute('aria-label', t(el.getAttribute('data-title'))); });
  }
  function setLang(l) { S.lang = l; try { localStorage.setItem('hub-lang', l); } catch (e) {} applyWords(); renderAll(); }

  // ── Theme ────────────────────────────────────────────────────────
  function setTheme(th) {
    if (th) document.documentElement.setAttribute('data-theme', th); else document.documentElement.removeAttribute('data-theme');
    try { th ? localStorage.setItem('hub-theme', th) : localStorage.removeItem('hub-theme'); } catch (e) {}
  }
  function toggleTheme() {
    var cur = document.documentElement.getAttribute('data-theme');
    var dark = cur ? cur === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(dark ? 'light' : 'dark');
  }

  // ── Small helpers ────────────────────────────────────────────────
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function key(n) { return String(n || '').trim().toLowerCase().replace(/\s+/g, ' '); }
  function todayStr() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function clock(iso) { var d = new Date(iso); if (isNaN(d)) return ''; return d.toLocaleTimeString(S.lang === 'es' ? 'es-US' : 'en-US', { hour: 'numeric', minute: '2-digit' }); }
  function dayLong(iso) { var d = iso ? new Date(iso + 'T12:00:00') : new Date(); return d.toLocaleDateString(S.lang === 'es' ? 'es-US' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' }); }
  function myRole(g) {
    var keys = S.me.nameKeys || [];
    if (keys.indexOf(key(g.cr)) >= 0) return 'cr';
    if (keys.indexOf(key(g.ar1)) >= 0) return 'ar1';
    if (keys.indexOf(key(g.ar2)) >= 0) return 'ar2';
    if (keys.indexOf(key(g.fourth)) >= 0) return 'fourth';
    return 'cr';
  }
  function myNameOn(g) { return g[myRole(g)] || (S.me.first_name + ' ' + S.me.last_name); }
  function fieldShort(f) { return String(f || '').replace(/^Field\s*/i, ''); }
  function eventFor(g) {
    var num = String(g.game_num || '').toUpperCase(), venue = key(g.venue);
    var hit = null;
    S.events.forEach(function (e) {
      if (hit) return;
      if (e.game_prefix && num.indexOf(String(e.game_prefix).toUpperCase()) === 0) hit = e;
    });
    if (!hit) S.events.forEach(function (e) {
      if (hit) return;
      if ((e.venues || []).some(function (v) { return key(v) === venue; })) hit = e;
    });
    return hit || S.events[0] || null;
  }
  function rulesFor(g) {
    var num = String(g && g.game_num || '').toUpperCase();
    for (var p in C.rules) if (num.indexOf(p) === 0) return C.rules[p];
    return null;
  }
  function show(id) {
    document.querySelectorAll('.screen').forEach(function (s) { s.classList.toggle('on', s.id === id); });
    window.scrollTo(0, 0);
  }

  // ── Data ─────────────────────────────────────────────────────────
  async function loadMe() {
    var who = await sb.rpc('whoami');
    if (who.error || !who.data) return null;
    var names = await sb.rpc('my_name_keys');
    who.data.nameKeys = (names.data || []).map(function (r) { return typeof r === 'string' ? r : r.my_name_keys; });
    return who.data;
  }
  async function loadDay() {
    var today = todayStr();
    var g = await sb.from('games').select('game_id,date,game_num,kickoff,field,age_group,gender,competition,home,away,cr,ar1,ar2,fourth,venue,status,home_club,away_club')
      .eq('date', today).neq('status', 'C').order('kickoff');
    S.games = g.data || [];
    var ev = await sb.from('events').select('id,name,game_prefix,venues,blurb,tools');
    S.events = ev.data || [];
    var ci = await sb.from('checkins').select('game_id,created_at').eq('date', today);
    S.checkins = {};
    (ci.data || []).forEach(function (r) { if (r.game_id) S.checkins[String(r.game_id)] = r.created_at; });
    var n = await sb.from('observations').select('date,observer,rater_role,final_note,cleaned_note,game_id,field').order('date', { ascending: false }).limit(50);
    S.notes = n.data || [];
    var b = await sb.from('announcements').select('title,body,severity,created_at,venue,event_id,start_date,end_date').lte('start_date', today).gte('end_date', today).order('created_at', { ascending: false }).limit(5);
    S.bulletins = b.data || [];
  }

  // ── Your day ─────────────────────────────────────────────────────
  function nextGame() {
    var now = Date.now();
    var upcoming = S.games.filter(function (g) { return new Date(g.kickoff).getTime() > now - 100 * 60000; });
    return upcoming[0] || null;
  }
  function renderDay() {
    var me = S.me, h = new Date().getHours();
    var greet = t(h < 12 ? 'greeting.morning' : h < 17 ? 'greeting.afternoon' : 'greeting.evening');
    var venue = S.games.length ? S.games[0].venue : '';
    $('dayLead').textContent = greet + ', ' + me.first_name + '. ' + dayLong() + (venue ? ', ' + venue : '') + '.';
    var g = nextGame();
    var cd = $('countdown');
    if (g) {
      var mins = Math.round((new Date(g.kickoff).getTime() - Date.now()) / 60000);
      cd.hidden = false;
      if (mins >= 0 && mins < 120) { $('countN').textContent = mins; $('countW').innerHTML = t('minutesToKickoff'); }
      else if (mins >= 120) { $('countN').textContent = Math.floor(mins / 60); $('countW').innerHTML = t('hoursToKickoff'); }
      else { $('countN').textContent = Math.abs(mins); $('countW').innerHTML = t('kickedOff') + '<br>' + t('minAgo'); }
      $('nextCard').innerHTML = cardHtml(g);
      wireCheckin(g, $('nextCard'));
    } else {
      cd.hidden = true;
      $('nextCard').innerHTML = '<div class="card"><div class="disp" style="font-size:28px">' + esc(t('noGamesToday')) + '</div><div class="hint">' + esc(t('noGamesHint')) + '</div></div>';
    }
    var later = S.games.filter(function (x) { return x !== g; });
    $('laterList').innerHTML = later.length ? '<div class="hint" style="padding-bottom:8px;font-weight:700">' + esc(t('laterToday')) + '</div>' + later.map(function (x) {
      var inAt = S.checkins[String(x.game_id)];
      return '<a class="item" href="#game/' + esc(x.game_id) + '"><div class="when"><div class="disp">' + esc(clock(x.kickoff)) + '</div><div class="sub">' + esc(x.field || '') + ', ' + esc(x.age_group || '') + '</div></div>' +
        (inAt ? '<div class="state in"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><circle cx="9" cy="9" r="8" fill="currentColor"></circle><path d="M5.5 9.5l2.3 2.3L12.8 6.8" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>' + esc(t('checkedIn').charAt(0) + t('checkedIn').slice(1).toLowerCase()) + '</div>' : '') + '</a>';
    }).join('') : '';
    var note = S.notes[0];
    $('noteBox').innerHTML = note ? '<div class="note"><div class="who">' + esc(note.observer || '') + (note.rater_role ? ', ' + esc(note.rater_role) : '') + (note.date ? ', ' + esc(t('noteFrom')) + ' ' + esc(dayLong(note.date)) : '') + '</div><div class="text">' + esc(note.final_note || note.cleaned_note || '') + '</div><a href="#notes">' + esc(t('allNotes')) + '</a></div>'
      : '<div class="note"><div class="text hint">' + esc(t('noNotes')) + '</div></div>';
    $('bulletins').innerHTML = S.bulletins.slice(0, 2).map(function (b) {
      return '<div class="bulletin"><svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="9" stroke="currentColor" stroke-width="2"></circle><path d="M11 6v6" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path><circle cx="11" cy="15.5" r="1.2" fill="currentColor"></circle></svg><div class="text">' + (b.title ? '<b>' + esc(b.title) + '</b> ' : '') + esc(b.body || '') + ' <span>' + esc(t('fromState')) + '.</span></div></div>';
    }).join('');
    $('coachEntry').innerHTML = iCan('coaching') ? '<a class="rowbtn" href="#coach" style="margin-top:14px"><span><span class="t">' + esc(t('coachingEntry')) + '</span><br><span class="s">' + esc(t('coachingEntryHint')) + '</span></span><svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M8 4l6 6-6 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"></path></svg></a>' : '';
    var r = rulesFor(g || S.games[0]);
    $('rulesLink').hidden = !r; if (r) $('rulesLink').href = r;
  }
  function cardHtml(g) {
    var inAt = S.checkins[String(g.game_id)];
    return '<div class="card"><div class="row"><div class="disp big">' + esc(clock(g.kickoff)) + '</div><div class="disp big">' + esc(String(g.field || '').toUpperCase()) + '</div></div>' +
      '<div>' + esc(g.age_group || '') + (g.competition ? ', ' + esc(g.competition) : '') + '. ' + esc(t('youAre')) + ' ' + esc(t('role.' + myRole(g))) + '.</div>' +
      '<div class="actions">' + checkinBtn(g, inAt) + '<a class="btn outline" href="#game/' + esc(g.game_id) + '">' + esc(t('details')) + '</a></div>' +
      '<div class="hint">' + esc(t('checkinWhere')) + '</div><div class="msg bad" id="ci-msg-' + esc(g.game_id) + '" hidden></div></div>';
  }
  function checkinBtn(g, inAt) {
    if (inAt) return '<div class="btn done" style="flex-grow:1"><span class="disp">' + esc(t('checkedIn')) + '</span><small>' + esc(clock(inAt)) + '. ' + esc(t('checkedInAt')) + '</small></div>';
    return '<button class="btn primary" id="ci-' + esc(g.game_id) + '">' + esc(t('checkIn')) + '</button>';
  }
  function wireCheckin(g, root) {
    var b = root.querySelector('#ci-' + g.game_id);
    if (!b) return;
    b.onclick = async function () {
      b.disabled = true; b.textContent = t('checkingIn');
      var ev = eventFor(g);
      try {
        var r = await fetch(C.backend, { method: 'POST', body: JSON.stringify({ action: 'checkinVenue', event: ev ? ev.id : '', refName: myNameOn(g), venue: g.venue, date: g.date }) });
        var j = await r.json();
        if (!j || j.status !== 'ok') throw new Error(j && j.message || 'error');
        var now = new Date().toISOString();
        S.games.forEach(function (x) { if (key(x.venue) === key(g.venue)) S.checkins[String(x.game_id)] = now; });
        renderAll();
      } catch (e) {
        b.disabled = false; b.textContent = t('checkIn');
        var m = root.querySelector('#ci-msg-' + g.game_id); if (m) { m.hidden = false; m.textContent = t('checkinFailed'); }
      }
    };
  }

  // ── Coaching ─────────────────────────────────────────────────────
  function iCan(section) { return !!(S.me && (S.me.unlocks || []).indexOf(section) >= 0); }
  var AREAS = ['laws', 'reading', 'fitness', 'presence'];
  async function loadCoach() {
    var today = todayStr();
    var g = await sb.from('games').select('game_id,date,game_num,kickoff,field,age_group,gender,competition,home,away,cr,ar1,ar2,fourth,venue,status')
      .eq('date', today).neq('status', 'C').order('venue').order('kickoff');
    S.coach.games = g.data || [];
    var n = await sb.from('observations').select('date,ref_name,observer,rater_role,public_notes,cleaned_note,final_note,cleanup_status,area,field,game_id,created_at')
      .order('created_at', { ascending: false }).limit(100);
    S.coach.notes = (n.data || []).filter(function (x) { return (S.me.nameKeys || []).indexOf(key(x.observer)) >= 0; });
  }
  function renderCoach() {
    var venues = [];
    S.coach.games.forEach(function (g) { if (g.venue && venues.indexOf(g.venue) < 0) venues.push(g.venue); });
    if (!S.coach.venue || venues.indexOf(S.coach.venue) < 0) S.coach.venue = venues[0] || null;
    $('venuePick').innerHTML = venues.length ? '<div class="pad" style="padding-top:14px"><div class="hint" style="font-weight:700;padding-bottom:8px">' + esc(t('venue')) + '</div><div class="chips">' + venues.map(function (v) {
      return '<button class="chip-btn' + (v === S.coach.venue ? ' on' : '') + '" data-venue="' + esc(v) + '">' + esc(v) + '</button>';
    }).join('') + '</div></div>' : '<div class="card"><div class="hint">' + esc(t('noVenuesToday')) + '</div></div>';
    $('venuePick').querySelectorAll('[data-venue]').forEach(function (b) { b.onclick = function () { S.coach.venue = b.getAttribute('data-venue'); renderCoach(); }; });
    var games = S.coach.games.filter(function (g) { return g.venue === S.coach.venue; });
    $('coachGames').innerHTML = '<div class="list">' + games.map(function (g) {
      var crew = ['cr', 'ar1', 'ar2', 'fourth'].map(function (k) { return g[k]; }).filter(Boolean).join(', ');
      return '<a class="item" href="#coach/game/' + esc(g.game_id) + '"><div><div class="when"><div class="disp">' + esc(clock(g.kickoff)) + '</div><div class="sub">' + esc(g.field || '') + ', ' + esc(g.age_group || '') + '</div></div><div class="hint">' + esc(crew) + '</div></div><svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M8 4l6 6-6 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"></path></svg></a>';
    }).join('') + '</div>';
  }
  function renderCoachGame(id) {
    var g = S.coach.games.filter(function (x) { return String(x.game_id) === String(id); })[0];
    S.coach.game = g || null;
    if (!g) { location.hash = '#coach'; return; }
    var crew = ['cr', 'ar1', 'ar2', 'fourth'].filter(function (k) { return g[k]; });
    if (!S.coach.ref || crew.indexOf(S.coach.ref) < 0) S.coach.ref = null;
    var signed = S.me.coaching_title || (S.me.titles || [])[0] || '';
    $('coachGameBody').innerHTML =
      '<div class="pad" style="padding-top:16px"><div class="lead">' + esc(g.venue || '') + ', ' + esc(dayLong(g.date)) + '</div>' +
      '<div style="display:flex;justify-content:space-between;align-items:baseline"><div class="disp" style="font-size:48px">' + esc(clock(g.kickoff)) + '</div><div class="disp" style="font-size:48px;color:var(--count)">' + esc(fieldShort(g.field)) + '</div></div>' +
      '<div>' + esc(g.age_group || '') + (g.competition ? ', ' + esc(g.competition) : '') + '. ' + esc(g.home || '') + ' v ' + esc(g.away || '') + '</div></div>' +
      '<div class="disp h2">' + esc(t('crewPick')) + '</div>' +
      crew.map(function (k) { return '<button class="crewbtn' + (S.coach.ref === k ? ' on' : '') + '" data-crew="' + k + '"><span><span class="t">' + esc(g[k]) + '</span><br><span class="s">' + esc(t('role.' + k)) + '</span></span>' + (S.coach.ref === k ? '<svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="10" fill="var(--navy)"></circle><path d="M6.5 11.5l3 3 6-6.5" stroke="var(--surface)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"></path></svg>' : '') + '</button>'; }).join('') +
      (S.coach.ref ? '<div class="card" style="gap:12px"><label for="noteText" style="font-weight:700">' + esc(t('noteLabel')) + '</label><textarea id="noteText" placeholder="' + esc(t('notePlaceholder')) + '"></textarea>' +
        '<div class="hint" style="font-weight:700">' + esc(t('areaLabel')) + '</div><div class="chips">' + AREAS.map(function (a) { return '<button class="chip-btn' + (S.coach.area === a ? ' on' : '') + '" data-area="' + a + '">' + esc(t('areas.' + a)) + '</button>'; }).join('') + '</div>' +
        '<div class="hint">' + esc(t('signedAs')) + ' ' + esc(S.me.first_name + ' ' + S.me.last_name) + ', ' + esc(signed) + '</div>' +
        '<button class="btn primary" id="saveNote">' + esc(t('saveNote')) + '</button><div class="msg" id="noteMsg" hidden></div></div>' : '');
    $('coachGameBody').querySelectorAll('[data-crew]').forEach(function (b) { b.onclick = function () { S.coach.ref = b.getAttribute('data-crew'); S.coach.area = null; renderCoachGame(id); var ta = $('noteText'); if (ta) ta.focus(); }; });
    $('coachGameBody').querySelectorAll('[data-area]').forEach(function (b) { b.onclick = function () { var a = b.getAttribute('data-area'); S.coach.area = S.coach.area === a ? null : a; $('coachGameBody').querySelectorAll('[data-area]').forEach(function (x) { x.classList.toggle('on', x.getAttribute('data-area') === S.coach.area); }); }; });
    var save = $('saveNote');
    if (save) save.onclick = async function () {
      var text = ($('noteText').value || '').trim();
      if (!text) { $('noteText').focus(); return; }
      save.disabled = true; save.textContent = t('savingNote');
      var ev = eventFor(g);
      try {
        var res = await fetch(C.backend, { method: 'POST', body: JSON.stringify({ action: 'observation', event: ev ? ev.id : '', refName: g[S.coach.ref], raterName: S.me.first_name + ' ' + S.me.last_name, raterRole: signed, gameId: g.game_id, date: g.date, field: g.field || '', ageGroup: g.age_group || '', kickoffTime: clock(g.kickoff), officialRole: S.coach.ref, notesPublic: text, area: S.coach.area || '' }) });
        var j = await res.json();
        if (!j || j.status !== 'ok') throw new Error(j && j.message || 'error');
        var refName = g[S.coach.ref];
        S.coach.notes.unshift({ date: g.date, ref_name: refName, observer: S.me.first_name + ' ' + S.me.last_name, rater_role: signed, public_notes: text, cleanup_status: 'pending', area: S.coach.area, field: g.field, created_at: new Date().toISOString() });
        $('coachGameBody').querySelector('.card').innerHTML = '<div class="btn done"><span class="disp">' + esc(t('noteSaved')) + '</span><small>' + esc(refName) + ', ' + esc(clock(new Date().toISOString())) + '</small></div><div class="hint">' + esc(t('noteSavedHint')) + '</div><button class="btn outline" id="anotherRef">' + esc(t('another')) + '</button>';
        $('anotherRef').onclick = function () { S.coach.ref = null; S.coach.area = null; renderCoachGame(id); };
      } catch (e) {
        save.disabled = false; save.textContent = t('saveNote');
        var m = $('noteMsg'); m.hidden = false; m.className = 'msg bad'; m.textContent = t('noteFailed');
      }
    };
  }
  function renderMyNotes() {
    $('myNotesList').innerHTML = S.coach.notes.length ? S.coach.notes.map(function (n) {
      var st = n.cleanup_status || 'pending', ok = st === 'approved' || st === 'edited';
      var label = t('status.' + st); if (label === 'status.' + st) label = t('status.pending');
      return '<div class="card" style="gap:8px"><div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px"><div><b>' + esc(n.ref_name || '') + '</b> <span class="hint">' + esc(dayLong(n.date)) + (n.field ? ', ' + esc(n.field) : '') + (n.area ? ', ' + esc(t('areas.' + n.area)) : '') + '</span></div><span class="pill' + (ok ? ' ok' : '') + '">' + esc(label) + '</span></div>' +
        '<div class="side"><div class="col"><b>' + esc(t('rawLabel')) + '</b>' + esc(n.public_notes || '') + '</div><div class="col"><b>' + esc(t('cleanLabel')) + '</b>' + (n.final_note || n.cleaned_note ? esc(n.final_note || n.cleaned_note) : '<span class="hint">' + esc(t('notCleaned')) + '</span>') + '</div></div></div>';
    }).join('') : '<div class="card"><div class="hint">' + esc(t('noMyNotes')) + '</div></div>';
  }

  // ── Game card ────────────────────────────────────────────────────
  function renderGame(id) {
    var g = S.games.filter(function (x) { return String(x.game_id) === String(id); })[0];
    S.game = g || null;
    if (!g) { show('s-day'); return; }
    var inAt = S.checkins[String(g.game_id)], mins = Math.round((new Date(g.kickoff).getTime() - Date.now()) / 60000);
    var ev = eventFor(g), r = rulesFor(g), role = myRole(g);
    var crew = ['cr', 'ar1', 'ar2', 'fourth'].filter(function (k) { return g[k]; }).map(function (k) { return esc(g[k]) + ' (' + esc(t('role.' + k)) + ')'; });
    $('gameBody').innerHTML =
      '<div class="pad" style="padding-top:16px"><div class="lead">' + esc(ev ? ev.name : g.competition || '') + (g.game_num ? ', ' + esc(g.game_num) : '') + ', ' + esc(dayLong(g.date)) + '</div>' +
      '<div class="row" style="display:flex;justify-content:space-between;align-items:baseline"><div class="disp" style="font-size:64px;line-height:.95">' + esc(clock(g.kickoff)) + '</div><div class="disp" style="font-size:64px;line-height:.95;color:var(--count)">' + esc(fieldShort(g.field)) + '</div></div>' +
      (mins > 0 ? '<div class="lead">' + esc(t('kicksIn')) + ' ' + mins + ' min</div>' : '') + '</div>' +
      '<div style="margin:14px 20px 0" id="gameCheckin">' + (inAt ? '<div class="btn done"><span class="disp">' + esc(t('checkedIn')) + '</span><small>' + esc(clock(inAt)) + '. ' + esc(t('checkedInAt')) + '</small></div>' : '<div class="actions" style="padding:0">' + checkinBtn(g, null) + '</div><div class="msg bad" id="ci-msg-' + esc(g.game_id) + '" hidden></div>') + '</div>' +
      '<div class="card"><div class="grid2"><div class="kv"><div class="k">' + esc(t('home')) + '</div><div class="v">' + esc(g.home || '') + '</div></div><div class="kv"><div class="k">' + esc(t('away')) + '</div><div class="v">' + esc(g.away || '') + '</div></div></div>' +
      '<div>' + esc(g.age_group || '') + (g.gender ? ', ' + esc(g.gender) : '') + (g.competition ? ', ' + esc(g.competition) : '') + '</div>' +
      '<div class="sep"><span class="hint">' + esc(t('crew')) + ':</span> ' + (crew.length > 1 ? crew.join(', ') : esc(myNameOn(g)) + ', ' + esc(t('role.' + role)) + '. ' + esc(t('alone'))) + '</div>' +
      (ev && ev.blurb ? '<div class="sep">' + esc(ev.blurb) + '</div>' : '') + '</div>' +
      '<div style="margin:14px 20px 0;display:grid;grid-template-columns:1fr 1fr;gap:10px">' + (r ? '<a class="btn outline" href="' + esc(r) + '">' + esc(t('rules')) + '</a>' : '') + '<a class="btn outline" href="../index.html">' + esc(t('map')) + '</a></div>' +
      '<div class="disp h2">' + esc(t('afterGame')) + '</div>' +
      '<a class="rowbtn" href="../scoreboard.html"><span><span class="t">' + esc(t('reportScore')) + '</span><br><span class="s">' + esc(t('reportScoreHint')) + '</span></span><svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M8 4l6 6-6 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"></path></svg></a>' +
      '<a class="rowbtn" href="../incident.html"><span><span class="t">' + esc(t('incident')) + '</span><br><span class="s">' + esc(t('incidentHint')) + '</span></span><svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M8 4l6 6-6 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"></path></svg></a>' +
      '<div class="hint" style="margin:8px 24px 0">' + esc(t('incidentNote')) + '</div>';
    wireCheckin(g, $('gameBody'));
  }

  // ── Notes ────────────────────────────────────────────────────────
  function renderNotes() {
    $('notesList').innerHTML = S.notes.length ? S.notes.map(function (n) {
      return '<div class="note"><div class="who">' + esc(n.observer || '') + (n.rater_role ? ', ' + esc(n.rater_role) : '') + (n.date ? ', ' + esc(dayLong(n.date)) : '') + (n.field ? ', ' + esc(n.field) : '') + '</div><div class="text">' + esc(n.final_note || n.cleaned_note || '') + '</div></div>';
    }).join('') : '<div class="note"><div class="text hint">' + esc(t('noNotes')) + '</div></div>';
  }

  // ── Help ─────────────────────────────────────────────────────────
  var REASONS = [
    { id: 'roster', urgent: false, backend: 'Roster or game card problem' },
    { id: 'spectator', urgent: true, backend: 'Coach or spectator problem' },
    { id: 'redcard', urgent: false, backend: 'Red card or send-off' },
    { id: 'fight', urgent: true, backend: 'Fight or threat' },
    { id: 'injury', urgent: true, backend: 'Injury, trainer needed' }
  ];
  var IS_PHONE = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  function reasonBtn(r) {
    var sel = S.reason === r.id;
    return '<button class="reason' + (r.urgent ? ' urgent' : '') + (sel ? ' selected' : '') + '" data-reason="' + r.id + '" aria-pressed="' + (sel ? 'true' : 'false') + '">' + esc(t('reasons.' + r.id)) +
      (sel ? '<svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="10" fill="currentColor"></circle><path d="M6.5 11.5l3 3 6-6.5" stroke="var(--surface)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"></path></svg>' : '') + '</button>';
  }
  function renderHelp() {
    var body = (S.me ? S.me.first_name + ' ' + S.me.last_name : '') + (S.game ? ', ' + S.game.venue + ' ' + S.game.field : '') + ': ';
    var sms = 'sms:' + C.hotline + '?&body=' + encodeURIComponent(body);
    var urgent = REASONS.filter(function (r) { return r.urgent; }), queue = REASONS.filter(function (r) { return !r.urgent; });
    $('reasons').innerHTML =
      '<div class="grouplbl urgent">' + esc(t('groupUrgent')) + '</div>' + urgent.map(reasonBtn).join('') +
      '<div class="grouplbl">' + esc(t('groupQueue')) + '</div>' + queue.map(reasonBtn).join('') +
      '<div class="grouplbl">' + esc(t('groupHotline')) + '</div>' +
      (IS_PHONE ? '<a class="reason" href="' + sms + '">' + esc(t('hotline')) + ' <small>' + esc(C.hotlineShown) + '</small></a>'
                : '<div class="reason" style="cursor:default">' + esc(t('hotlineDesktop')) + ' <small><b>' + esc(C.hotlineShown) + '</b></small></div>') +
      '<div class="hint" style="color:var(--ink);padding:0 4px">' + esc(t('hotlineNote')) + '</div>';
    $('reasons').querySelectorAll('[data-reason]').forEach(function (b) { b.onclick = function () { S.reason = b.getAttribute('data-reason'); renderHelp(); renderConfirm(); }; });
    if (!S.reason) $('helpConfirm').innerHTML = '';
  }
  function renderConfirm() {
    var r = REASONS.filter(function (x) { return x.id === S.reason; })[0];
    if (!r) return;
    var g = S.game || nextGame();
    var where = g ? (g.venue + ', ' + g.field + (g.game_num ? ', ' + g.game_num : '')) : '';
    $('helpConfirm').innerHTML = '<div class="confirm"><div class="k">' + esc(t('youPicked')) + '</div><div class="v">' + esc(t('reasons.' + r.id)) + '</div>' +
      '<div style="font-size:15px;line-height:1.4">' + esc(S.me.first_name + ' ' + S.me.last_name) + (where ? ', ' + esc(where) : '') + '. ' + esc(t(r.urgent ? 'goesTo' : 'goesToQueue')) + '</div>' +
      '<button class="send" id="sendHelp">' + esc(t('sendIt')) + '</button><button class="cancel" id="cancelHelp">' + esc(t('neverMind')) + '</button><div class="msg" id="helpMsg" hidden></div></div>';
    $('helpConfirm').scrollIntoView({ behavior: 'smooth', block: 'center' });
    $('cancelHelp').onclick = function () { S.reason = null; renderHelp(); $('helpConfirm').innerHTML = ''; };
    $('sendHelp').onclick = async function () {
      var b = $('sendHelp'); b.disabled = true; b.textContent = t('sendingHelp');
      var ev = g ? eventFor(g) : S.events[0];
      try {
        var res = await fetch(C.backend, { method: 'POST', body: JSON.stringify({ action: 'emergency', event: ev ? ev.id : '', refName: myNameOn(g || {}), venue: g ? g.venue : '', field: g ? g.field : '', gameId: g ? g.game_id : '', reason: r.backend, details: '' }) });
        var j = await res.json();
        if (!j || j.status !== 'ok') throw new Error(j && j.message || 'error');
        $('helpConfirm').innerHTML = '<div class="confirm" style="border-color:var(--green)"><div class="v">' + esc(t('helpSent')) + '</div><div class="hint" style="color:var(--ink)">' + esc(t('helpSentAt')) + ' ' + esc(clock(new Date().toISOString())) + '.</div></div>';
      } catch (e) {
        b.disabled = false; b.textContent = t('sendIt');
        var m = $('helpMsg'); m.hidden = false; m.className = 'msg bad'; m.innerHTML = esc(t('helpFailed')) + ' <a href="sms:' + C.hotline + '">' + esc(C.hotlineShown) + '</a>';
      }
    };
  }

  // ── Sign in ──────────────────────────────────────────────────────
  var email = '';
  function say(id, text, kind) { var el = $(id); el.hidden = false; el.textContent = text; el.className = 'msg ' + (kind || ''); }
  $('sendBtn').onclick = async function () {
    email = $('email').value.trim().toLowerCase();
    if (!email) return;
    $('sendBtn').disabled = true; say('msgEmail', t('sending'));
    var r = await sb.auth.signInWithOtp({ email: email });
    $('sendBtn').disabled = false;
    if (r.error) {
      var m = r.error.message || '';
      say('msgEmail', /No referee record|Database error/i.test(m) ? t('noRecord') : /rate limit|too many/i.test(m) ? t('tooMany') : t('couldNotSend') + m, 'bad');
      return;
    }
    $('stepEmail').hidden = true; $('stepCode').hidden = false; say('msgCode', t('codeSent'), 'good'); $('code').focus();
  };
  $('verifyBtn').onclick = async function () {
    var code = $('code').value.replace(/\D/g, '');
    if (code.length < 6) { say('msgCode', t('wholeCode'), 'bad'); return; }
    $('verifyBtn').disabled = true;
    var r = await sb.auth.verifyOtp({ email: email, token: code, type: 'email' });
    $('verifyBtn').disabled = false;
    if (r.error) { say('msgCode', t('badCode'), 'bad'); return; }
    await start();
  };

  // ── Routing ──────────────────────────────────────────────────────
  function route() {
    if (!S.me) { show('s-signin'); return; }
    var h = location.hash.replace(/^#/, '') || 'day';
    if (h.indexOf('coach') === 0 && !iCan('coaching')) { location.hash = '#day'; return; }
    if (h === 'coach') { loadCoach().then(function () { renderCoach(); }); show('s-coach'); }
    else if (h.indexOf('coach/game/') === 0) { (S.coach.games.length ? Promise.resolve() : loadCoach()).then(function () { renderCoachGame(h.slice(11)); }); show('s-coachgame'); }
    else if (h === 'coach/notes') { loadCoach().then(function () { renderMyNotes(); }); show('s-mynotes'); }
    else if (h.indexOf('game/') === 0) { renderGame(h.slice(5)); show('s-game'); }
    else if (h === 'notes') { renderNotes(); show('s-notes'); }
    else if (h === 'help') { renderHelp(); show('s-help'); }
    else { renderDay(); show('s-day'); }
  }
  function renderAll() { if (S.me) route(); }
  window.addEventListener('hashchange', function () { if (location.hash !== '#help') S.reason = null; });
  window.addEventListener('hashchange', route);

  async function start() {
    S.me = await loadMe();
    if (!S.me) { show('s-signin'); return; }
    if (S.me.language === 'es' && S.lang !== 'es') { S.lang = 'es'; applyWords(); }
    await loadDay();
    route();
    setInterval(function () { if (S.me && location.hash.indexOf('game') < 0) renderDay(); }, 60000);
  }

  // ── Boot ─────────────────────────────────────────────────────────
  (function boot() {
    try { S.lang = localStorage.getItem('hub-lang') || 'en'; } catch (e) {}
    try { var th = localStorage.getItem('hub-theme'); if (th) setTheme(th); } catch (e) {}
    ['themeBtn0', 'themeBtn1', 'themeBtn2'].forEach(function (id) { $(id).onclick = toggleTheme; });
    ['langBtn0', 'langBtn1'].forEach(function (id) { $(id).onclick = function () { setLang(S.lang === 'es' ? 'en' : 'es'); }; });
    $('markSignin').src = C.marks.csa; $('markDay').src = C.marks.csa;
    ['markGame', 'markNotes', 'markHelp', 'markCoach', 'markCoachGame', 'markMyNotes'].forEach(function (id) { $(id).src = C.marks.program; });
    ['ja0', 'ja1', 'ja2', 'ja3', 'ja4', 'ja5', 'ja6', 'ja7'].forEach(function (id) { $(id).src = C.marks.ja; });
    applyWords();
    document.querySelectorAll('.ver').forEach(function (el) { el.textContent = 'v' + VERSION; });
    sb.auth.getSession().then(function (r) { if (r.data && r.data.session) start(); else show('s-signin'); });
  })();
})();
