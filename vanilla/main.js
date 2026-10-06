// main.js — plain JavaScript UI. Requires logic.js and svg.js (loaded before this file).
const $ = (s, r = document) => r.querySelector(s);
const layout = loadLayout();
const S = {
  // all app state lives here
  pets: createPets(),
  cur: 0,
  rooms: layout ? layout.rooms : clone(DEFAULT_ROOMS),
  doors: layout ? layout.doors : clone(DEFAULT_DOORS),
  menu: false,
  modal: null,
  bluetooth: true,
  ping: false,
  allClear: false,
  editing: false,
  sel: null,
  devices: clone(DEVICES),
  scanning: false,
  uid: 1000,
  barking: false,
};
const pet = () => S.pets[S.cur];
const setText = (sel, v) => document.querySelectorAll(sel).forEach(e => (e.textContent = v));
const setHTML = (sel, v) => document.querySelectorAll(sel).forEach(e => (e.innerHTML = v));
const flash = (key, ms) =>
{
  S[key] = true;
  clearTimeout(flash[key]);
  flash[key] = setTimeout(() =>
  {
    S[key] = false;
    refresh();
  }, ms);
};
const save = () => saveLayout(S.rooms, S.doors);

/* ---------- SVG snippets ---------- */
const doorsSVG = editing =>
  S.doors
    .map(
      d =>
        `<rect class="door${editing ? " ed" : ""}${editing && S.sel?.kind === "door" && S.sel.id === d.id ? " sel" : ""}" data-kind="door" data-id="${d.id}" x="${d.x}" y="${d.y}" width="${d.w}" height="${d.h}"/>`
    )
    .join("");
const radarRooms = () =>
  S.rooms
    .map(
      r =>
        `<rect class="room" x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}"/><text class="rl" x="${r.x + r.w / 2}" y="${r.y + r.h / 2 + 2}">${r.l}</text>`
    )
    .join("");
const radarMarks = () =>
  pet()
    .marks.map(m => `<circle class="mk ${m.t}" cx="${m.x}" cy="${m.y}" r="2.6"/>`)
    .join("");
function mapLayer()
{
  const sel = S.sel,
    editing = S.editing;
  const rooms = S.rooms
    .map(
      r => `<rect class="room${editing && sel?.kind === "room" && sel.id === r.id ? " sel" : ""}" x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}"/>
    <text class="rl" x="${r.x + r.w / 2}" y="${r.y + 4.5}">${r.l}</text>${editing ? `<rect class="mv" data-kind="room" data-id="${r.id}" x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}"/>` : ""}`
    )
    .join("");
  const marks = pet()
    .marks.map(
      m =>
        `<g class="mkb${editing ? " off" : ""}" role="button" tabindex="0" data-mark="${m.id}" aria-label="Clear ${m.text}"><circle class="hit" cx="${m.x}" cy="${m.y}" r="5.5"/><circle class="mk ${m.t}" cx="${m.x}" cy="${m.y}" r="3"/></g>`
    )
    .join("");
  const room = editing && sel?.kind === "room" && S.rooms.find(r => r.id === sel.id);
  return (
    rooms +
    doorsSVG(editing) +
    marks +
    (room
      ? `<circle class="hd" data-kind="room" data-id="${room.id}" data-mode="size" cx="${room.x + room.w}" cy="${room.y + room.h}" r="3.4"/>`
      : "")
  );
}

/* ---------- main screen ---------- */
function refresh()
{
  const p = pet(),
    cat = p.type === "cat";
  setText(".pname", p.name);
  setText("#battery", p.battery + "%");
  $(".cell i").style.width = `${100 - p.battery}%`;
  setText("#steps", p.steps);
  setText("#barks", p.barks);
  setText("#lbl", cat ? "Meows" : "Barks");
  setText("#heart", p.heart);
  setText("#temp", p.temp);
  setText("#cal", p.cal);
  setText("#sleep", p.sleep + "h");
  setHTML("#x1", cat ? `Jumps <b>${p.jumps}</b>` : `Miles <b>${p.dist.toFixed(1)}</b>`);
  setHTML("#x2", cat ? `Purring <b>${Math.floor(p.purr)}m</b>` : `Active <b>${Math.floor(p.active)}m</b>`);
  setText("#state", p.mode === 1 ? "Resting" : "Active");
  setText("#doing", MODES[p.type][p.mode] + "...");
  $("#rRooms").innerHTML = radarRooms();
  $("#rDoors").innerHTML = doorsSVG(false);
  $("#rMarks").innerHTML = radarMarks();
  $("#rDot").style.transform = `translate(${p.x}px,${p.y}px)`;
  setText("#rName", p.name);
  $("#ping").classList.toggle("on", S.ping);
  $(".bt").classList.toggle("off", !S.bluetooth);
  // pet drawing: keep one .pup element, swap the SVG only when the species changes
  const pup = $("#pet .pup");
  if (pup.dataset.type !== p.type)
  {
    pup.innerHTML = SVG[p.type];
    pup.dataset.type = p.type;
  }
  pup.className =
    "pup " +
    (cat ? "cat " : "") +
    ["walk", "run", "rest", "pee", "poop", "groom", "scratch"]
      .filter(
        (c, i) =>
          ({
            walk: p.mode === 0 || p.mode === 2,
            run: p.mode === 2,
            rest: p.mode === 1,
            pee: p.mode === 3,
            poop: p.mode === 4,
            groom: cat && p.mode === 5,
            scratch: cat && p.mode === 6,
          })[c]
      )
      .join(" ") +
    (S.barking ? " bark" : "");
  pup.style.cssText = `--coat:${p.coat};--ear:${p.ear};--spot:${p.spot}`;
  // alert popup
  $("#alert").innerHTML = p.alert
    ? `<button class="pop hot" role="alert" data-act="dismiss"><b>Alert!!!</b><span>${p.alert}</span><small>Tap to dismiss</small></button>`
    : S.allClear
      ? `<div class="pop ok" role="status"><b>All clear</b><span>No alerts for ${p.name}</span></div>`
      : "";
  renderMenu();
  refreshModal();
}
function renderMenu()
{
  const p = pet(),
    m = $("#menu");
  m.hidden = !S.menu;
  $(".chev").classList.toggle("open", S.menu);
  $(".chev").setAttribute("aria-expanded", S.menu);
  if (!S.menu) return;
  m.innerHTML = `<div class="switch" role="group" aria-label="Choose pet">${S.pets.map((q, i) => `<button class="${i === S.cur ? "on" : ""}" aria-pressed="${i === S.cur}" data-act="pick" data-i="${i}">${q.name}</button>`).join("")}<button class="add" data-act="addForm" aria-label="Add a new pet">+</button></div>
    <a class="ph r1" href="tel:15134156363">1-513-415-6363</a><p class="r2">${p.age}</p><p class="r3">${p.weight}</p><button class="hb r4" data-act="history" aria-haspopup="dialog">History <span>≡</span></button>`;
}

/* ---------- modals ---------- */
const PEN = `<svg viewBox="0 0 24 24"><rect x="3" y="3" width="12" height="18" rx="2"/><path d="M7 8h4M7 12h2"/><path d="M19 8l2.5 2.5L14 18l-3.5 1 1-3.5z"/></svg>`;
function openModal(kind)
{
  S.modal = kind;
  S.editing = false;
  S.sel = null;
  drawModal();
}
function drawModal()
{
  const root = $("#modal"),
    k = S.modal,
    p = pet();
  if (!k)
  {
    root.innerHTML = "";
    return;
  }
  const body = {
    history: `<h2>History</h2><ul class="hl" id="histList"></ul>`,
    settings: `<h2>Settings</h2><label>Bluetooth <input type="checkbox" id="btToggle" ${S.bluetooth ? "checked" : ""}></label>
      <button class="rst" data-act="resetCounts">Reset today's counts</button><button class="rst gps" data-act="resetPerimeter">Reset GPS house perimeter</button>`,
    addpet: `<div class="addf"><h2>Add a pet</h2><input id="np-name" aria-label="Pet name" placeholder="Name" maxlength="14"><div class="tt"><button class="on" data-t="dog">Dog</button><button data-t="cat">Cat</button></div>
      <input id="np-age" aria-label="Age" placeholder="Age (e.g. 3 year old)" maxlength="16"><input id="np-weight" aria-label="Weight" placeholder="Weight (e.g. 40 Lbs)" maxlength="12"><p class="err" id="np-err"></p><button class="go" data-act="addPet">Add pet</button></div>`,
    bluetooth: `<h2>Connect a device</h2><p class="hint" id="btHint"></p><ul class="dev" id="devList"></ul><button class="rst" id="scanBtn" data-act="scan"></button>`,
    map: `<div class="mh"><h2>${p.name}'s house</h2><button class="pen" id="penBtn" data-act="edit" aria-label="Edit map">${PEN}</button></div><p class="hint" id="mapHint"></p><div id="mapTools"></div>
      <svg id="bigmap" class="bigmap" viewBox="-60 -50 120 100" role="img" aria-label="House floor plan"><defs><pattern id="gridB" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M8 0H0V8" class="gl"/></pattern></defs>
      <rect class="bgb" x="-60" y="-50" width="120" height="100"/><rect class="grid2" x="-60" y="-50" width="120" height="100"/><g id="mapLayer"></g>
      <g id="mapDot" style="pointer-events:none;transition:transform 1s ease"><circle r="3.4" class="dot"/><text y="-5.5" class="nm">${p.name}</text></g></svg>`,
  }[k];
  root.innerHTML = `<div class="scrim"></div><div class="sheet" role="dialog"><button class="x" aria-label="Close">×</button>${body}</div>`;
  refreshModal();
}
function refreshModal()
{
  // cheap re-fill of the open modal (runs every tick)
  const k = S.modal,
    p = pet();
  if (!k) return;
  if (k === "history")
    $("#histList").innerHTML = p.history.map(([t, e]) => `<li><small>${t}</small> ${e}</li>`).join("");
  if (k === "bluetooth")
  {
    $("#btHint").textContent = S.scanning
      ? "Scanning for nearby devices…"
      : "Turn the collar on and stay within 30 ft.";
    $("#devList").innerHTML = S.devices
      .map(
        d =>
          `<li><span class="sg" aria-label="Signal ${d.sig} of 4">${[1, 2, 3, 4].map(n => `<i style="height:${n * 4 + 4}px" class="${n <= d.sig ? "on" : ""}"></i>`).join("")}</span> <b>${d.own ? p.name + " " + d.name : d.name}</b> <button class="cbtn ${d.status}" data-act="connect" data-id="${d.id}">${STATUS_LABEL[d.status]}</button></li>`
      )
      .join("");
    $("#scanBtn").disabled = S.scanning;
    $("#scanBtn").textContent = S.scanning ? "Scanning…" : "Scan again";
  }
  if (k === "map")
  {
    $("#penBtn").classList.toggle("on", S.editing);
    $("#bigmap").classList.toggle("editing", S.editing);
    $("#mapHint").textContent =
      `${p.name} is in the ${roomAt(S.rooms, p.x, p.y).toLowerCase()}. ` +
      (S.editing
        ? "Drag rooms and doors to move them. Drag the yellow dot to resize a room."
        : p.marks.length
          ? "Tap a brown or blue dot to clear it."
          : "Everything is clean!");
    if (!drag) $("#mapLayer").innerHTML = mapLayer();
    $("#mapDot").style.transform = `translate(${p.x}px,${p.y}px)`;
    const room = S.sel?.kind === "room" && S.rooms.find(r => r.id === S.sel.id),
      door = S.sel?.kind === "door" && S.doors.find(d => d.id === S.sel.id);
    if (!drag && !$("#mapTools input:focus"))
      $("#mapTools").innerHTML = !S.editing
        ? ""
        : `<div class="tb"><button data-act="addRoom">+ Room</button><button data-act="addDoor">+ Door</button><button data-act="resetMap">Reset</button><button class="done" data-act="edit">Done</button></div>` +
          (room
            ? `<div class="selrow"><input aria-label="Room name" maxlength="20" value="${room.n}"><button data-act="delSel">Delete room</button></div>`
            : door
              ? `<div class="selrow"><span>Door</span><button data-act="rotate">Rotate</button><button data-act="delSel">Delete door</button></div>`
              : "");
  }
}

/* ---------- map editing (drag to move / resize) ---------- */
let drag = null;
const svgPoint = (svg, e) =>
{
  const pt = svg.createSVGPoint();
  pt.x = e.clientX;
  pt.y = e.clientY;
  return pt.matrixTransform(svg.getScreenCTM().inverse());
};
document.addEventListener("pointerdown", e =>
{
  const el = e.target.closest("[data-kind]"),
    svg = $("#bigmap");
  if (!el || !S.editing || !svg?.contains(el)) return;
  const list = el.dataset.kind === "room" ? S.rooms : S.doors,
    item = list.find(i => i.id == el.dataset.id),
    pt = svgPoint(svg, e);
  S.sel = { kind: el.dataset.kind, id: item.id };
  drag = {
    item,
    mode: el.dataset.mode || "move",
    ox: pt.x - item.x,
    oy: pt.y - item.y,
    ow: item.w,
    oh: item.h,
    px: pt.x,
    py: pt.y,
  };
  svg.setPointerCapture(e.pointerId);
  $("#mapLayer").innerHTML = mapLayer();
  refreshModal();
});
document.addEventListener("pointermove", e =>
{
  if (!drag) return;
  const pt = svgPoint($("#bigmap"), e),
    it = drag.item;
  if (drag.mode === "move")
  {
    it.x = snap(clamp(pt.x - drag.ox, -58, 58 - it.w));
    it.y = snap(clamp(pt.y - drag.oy, -48, 48 - it.h));
  }
  else
  {
    it.w = snap(clamp(drag.ow + pt.x - drag.px, 12, 58 - it.x));
    it.h = snap(clamp(drag.oh + pt.y - drag.py, 12, 48 - it.y));
  }
  $("#mapLayer").innerHTML = mapLayer();
});
const endDrag = () =>
{
  if (drag)
  {
    drag = null;
    save();
    refresh();
  }
};
document.addEventListener("pointerup", endDrag);
document.addEventListener("pointercancel", endDrag);

/* ---------- actions ---------- */
let newType = "dog",
  armed = false;
const selected = () => S.sel && (S.sel.kind === "room" ? S.rooms : S.doors).find(i => i.id === S.sel.id);
const actions = {
  pick: t =>
  {
    S.cur = +t.dataset.i;
    S.menu = false;
    S.allClear = false;
  },
  history: () => openModal("history"),
  addForm: () =>
  {
    newType = "dog";
    openModal("addpet");
  },
  addPet: () =>
  {
    const name = $("#np-name").value.trim();
    if (!name)
    {
      $("#np-err").textContent = "Please enter a name.";
      return;
    }
    S.pets.push(newPet(name, newType, $("#np-age").value.trim(), $("#np-weight").value.trim(), S.pets.length));
    S.cur = S.pets.length - 1;
    S.menu = false;
    S.modal = null;
    drawModal();
  },
  dismiss: () =>
  {
    pet().alert = null;
    flash("allClear", 2000);
  },
  resetCounts: () =>
  {
    pet().steps = 0;
    pet().barks = 0;
  },
  resetPerimeter: t =>
  {
    // two taps: first arms, second confirms
    if (!armed)
    {
      armed = true;
      t.textContent = "Tap again to confirm";
      setTimeout(() =>
      {
        armed = false;
        t.textContent = "Reset GPS house perimeter";
      }, 3000);
      return;
    }
    armed = false;
    S.rooms = clone(DEFAULT_ROOMS);
    S.doors = clone(DEFAULT_DOORS);
    S.sel = null;
    save();
    t.textContent = "Perimeter reset ✓";
    setTimeout(() => (t.textContent = "Reset GPS house perimeter"), 2000);
  },
  edit: () =>
  {
    S.editing = !S.editing;
    S.sel = null;
  },
  addRoom: () =>
  {
    const r = { id: S.uid++, n: "New room", l: "New room", x: -20, y: -14, w: 30, h: 24 };
    S.rooms.push(r);
    S.sel = { kind: "room", id: r.id };
    save();
  },
  addDoor: () =>
  {
    const d = { id: S.uid++, x: -5, y: -2, w: 10, h: 3.6 };
    S.doors.push(d);
    S.sel = { kind: "door", id: d.id };
    save();
  },
  resetMap: () =>
  {
    S.rooms = clone(DEFAULT_ROOMS);
    S.doors = clone(DEFAULT_DOORS);
    S.sel = null;
    save();
  },
  delSel: () =>
  {
    if (S.sel.kind === "room") S.rooms = S.rooms.filter(r => r.id !== S.sel.id);
    else S.doors = S.doors.filter(d => d.id !== S.sel.id);
    S.sel = null;
    save();
  },
  rotate: () =>
  {
    const d = selected();
    [d.w, d.h] = [d.h, d.w];
    d.x = clamp(d.x, -58, 58 - d.w);
    d.y = clamp(d.y, -48, 48 - d.h);
    save();
  },
  scan: () =>
  {
    S.scanning = true;
    setTimeout(() =>
    {
      S.scanning = false;
      S.devices.push({
        id: S.uid++,
        name: "Pet Tracker " + (1000 + Math.floor(Math.random() * 9000)),
        sig: 1 + Math.floor(Math.random() * 4),
        status: "idle",
      });
      refresh();
    }, 1800);
  },
  connect: t =>
  {
    const d = S.devices.find(x => x.id == t.dataset.id);
    if (d.status === "connecting") return;
    if (d.status === "connected")
    {
      d.status = "idle";
      S.bluetooth = false;
      return;
    }
    S.devices.forEach(x => x.status === "connected" && (x.status = "idle"));
    S.bluetooth = false;
    d.status = "connecting";
    setTimeout(() =>
    {
      d.status = "connected";
      S.bluetooth = true;
      refresh();
    }, 1300);
  },
};
document.addEventListener("click", e =>
{
  const t = e.target.closest("button, .scrim, [data-mark]");
  if (!t) return;
  if (t.classList.contains("scrim") || t.classList.contains("x"))
  {
    S.modal = null;
    drawModal();
    return;
  }
  if (t.closest(".chev")) S.menu = !S.menu;
  else if (t.classList.contains("gear")) openModal("settings");
  else if (t.classList.contains("mapbtn")) openModal("map");
  else if (t.classList.contains("bt")) openModal("bluetooth");
  else if (t.classList.contains("beep")) flash("ping", 2500);
  else if (t.dataset.mark)
  {
    if (S.editing) return;
    const m = pet().marks.find(m => m.id == t.dataset.mark);
    pet().marks = pet().marks.filter(x => x !== m);
    if (pet().alert === m.text)
    {
      pet().alert = null;
      flash("allClear", 2000);
    }
    logEvent(pet(), "Cleaned up " + m.text.toLowerCase());
  }
  else if (t.dataset.t)
  {
    newType = t.dataset.t;
    document.querySelectorAll(".addf .tt button").forEach(b => b.classList.toggle("on", b === t));
    return;
  }
  else if (actions[t.dataset.act]) actions[t.dataset.act](t);
  refresh();
  if (["addForm", "history", "edit"].includes(t.dataset.act)) refreshModal();
});
document.addEventListener("change", e =>
{
  if (e.target.id === "btToggle")
  {
    S.bluetooth = e.target.checked;
    refresh();
  }
});
document.addEventListener("input", e =>
{
  const r = S.sel?.kind === "room" && selected();
  if (r && e.target.closest(".selrow"))
  {
    r.n = r.l = e.target.value;
    save();
    $("#mapLayer").innerHTML = mapLayer();
  }
});

/* ---------- simulation ---------- */
setInterval(() =>
{
  S.pets.forEach(p =>
  {
    if (stepPet(p, S.rooms) && p === pet())
    {
      S.barking = false;
      setTimeout(() =>
      {
        S.barking = true;
        refresh();
        setTimeout(() =>
        {
          S.barking = false;
          refresh();
        }, 1100);
      }, 40);
    }
  });
  refresh();
}, 1200);
refresh();
