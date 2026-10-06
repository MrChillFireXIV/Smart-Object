
// Different types of pet actions
const MODES = {
  dog: ["Walking", "Napping", "Running", "Peeing", "Pooping"],
  cat: ["Prowling", "Napping", "Zoomies", "Peeing", "Pooping", "Grooming", "Scratching"],
};

const SPEED = [1, 0, 3, 0, 0, 0, 0]; // how far a pet moves for the map
const HEART = { dog: [85, 62, 130, 90, 95], cat: [130, 95, 185, 120, 125, 115, 130] };
const DURATION = [
  [5, 10],
  [6, 14],
  [3, 6],
  [2, 3],
  [3, 4],
  [3, 6],
  [2, 4],
];
const CHANCE = { dog: [35, 30, 15, 10, 10, 0, 0], cat: [18, 40, 10, 5, 5, 14, 8] };

const DEFAULT_ROOMS = [
  { id: 1, n: "Bedroom", l: "Bedroom", x: -54, y: -44, w: 46, h: 36 },
  { id: 2, n: "Bathroom", l: "Bath", x: -8, y: -44, w: 22, h: 36 },
  { id: 3, n: "Kitchen", l: "Kitchen", x: 14, y: -44, w: 40, h: 36 },
  { id: 4, n: "Living room", l: "Living room", x: -54, y: -8, w: 66, h: 52 },
  { id: 5, n: "Den", l: "Den", x: 12, y: -8, w: 42, h: 52 },
];
const DEFAULT_DOORS = [
  { id: 1, x: -32, y: -9.8, w: 10, h: 3.6 },
  { id: 2, x: -3, y: -9.8, w: 10, h: 3.6 },
  { id: 3, x: 26, y: -9.8, w: 10, h: 3.6 },
  { id: 4, x: -9.8, y: -30, w: 3.6, h: 10 },
  { id: 5, x: 10.2, y: 8, w: 3.6, h: 10 },
  { id: 6, x: -30, y: 42.2, w: 12, h: 3.6 },
];
const DEVICES = [
  { id: 1, name: "Collar", own: true, sig: 4, status: "connected" },
  { id: 2, name: "Collar (spare)", own: true, sig: 2, status: "idle" },
  { id: 3, name: "Fitness Band 7F2A", sig: 1, status: "idle" },
];
const STATUS_LABEL = { idle: "Connect", connecting: "Connecting…", connected: "Connected" };

const clone = o => JSON.parse(JSON.stringify(o));
const clamp = (v, lo, hi) => (lo > hi ? (lo + hi) / 2 : Math.max(lo, Math.min(hi, v)));
const snap = v => Math.round(v / 2) * 2; // map editor snaps to a 2-unit grid

// Name of the room containing pet coordinates.
function roomAt(rooms, x, y)
{
  const r = rooms.find(r => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h);
  return r ? r.n || "Room" : "Hallway";
}

function roamBounds(rooms)
{
  if (!rooms.length) return [-50, 50, -40, 40];
  return [
    Math.min(...rooms.map(r => r.x)) + 4,
    Math.max(...rooms.map(r => r.x + r.w)) - 4,
    Math.min(...rooms.map(r => r.y)) + 4,
    Math.max(...rooms.map(r => r.y + r.h)) - 4,
  ];
}
function logEvent(pet, text)
{
  const time = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  pet.history.unshift([time, text]);
  if (pet.history.length > 30) pet.history.pop();
}
function pickNextMode(prev, type)
{
  const odds = CHANCE[type];
  let next;
  do
  {
    let roll = Math.random() * 100,
      i = 0;
    while (roll >= odds[i])
    {
      roll -= odds[i];
      i++;
    }
    next = i;
  } while (next === prev);
  return next;
}
let markId = 100;
// When a pet finishes peeing/pooping they should raise an alert and leave a mark on the map.
function leaveMark(pet, rooms)
{
  if (pet.mode !== 3 && pet.mode !== 4) return;
  const t = pet.mode === 4 ? "poop" : "pee",
    room = roomAt(rooms, pet.x, pet.y);
  const text = (t === "poop" ? "Poop: " : "Pee: ") + room;
  pet.alert = text;
  logEvent(pet, text);
  pet.marks.push({ id: markId++, x: pet.x, y: pet.y, t, room, text });
  if (pet.marks.length > 20) pet.marks.shift();
}

function stepPet(d, rooms)
{
  const s = SPEED[d.mode],
    [x0, x1, y0, y1] = roamBounds(rooms),
    jitter = () => (Math.random() - 0.5) * 12 * s;
  let barked = false;
  d.steps += s * 4;
  d.cal += s;
  d.dist = +(d.dist + s * 0.004).toFixed(2);
  d.active += d.mode === 1 ? 0 : 0.03;
  d.heart = HEART[d.type][d.mode] + Math.round(Math.random() * 3);
  if (Math.random() < 0.05)
  {
    d.barks++;
    barked = true;
  }
  if (d.type === "cat")
  {
    if ((d.mode === 2 || d.mode === 6) && Math.random() < 0.5) d.jumps++;
    if (d.mode === 1 || d.mode === 5) d.purr += 0.03;
  }
  d.x = clamp(d.x + jitter(), x0, x1);
  d.y = clamp(d.y + jitter(), y0, y1);
  const dist = Math.hypot(d.x, d.y); // stay inside the GPS circle
  if (dist > 66)
  {
    d.x *= 66 / dist;
    d.y *= 66 / dist;
  }
  if (--d.left <= 0)
  {
    leaveMark(d, rooms);
    d.mode = pickNextMode(d.mode, d.type);
    const [lo, hi] = DURATION[d.mode];
    d.left = lo + Math.floor(Math.random() * (hi - lo + 1));
  }
  return barked;
}
function newPet(name, type, age, weight, index)
{
  const cat = type === "cat";
  const palette = cat
    ? [
      ["#d9a066", "#7a4a1e", "#7a4a1e"],
      ["#3a3a3a", "#111", "#111"],
      ["#e8d9c0", "#8a6a3a", "#8a6a3a"],
    ]
    : [
      ["#e0a45e", "#7a3f16", "#a86a32"],
      ["#8a6a4a", "#3a2412", "#3a2412"],
      ["#f4f0e8", "#3a3a3a", "#6b6b6b"],
    ];
  const [coat, ear, spot] = palette[index % palette.length];
  const pet = {
    name,
    type,
    age: age || "1 year old",
    weight: weight || (cat ? "9 Lbs" : "40 Lbs"),
    battery: 100,
    steps: 0,
    barks: 0,
    heart: cat ? 140 : 85,
    temp: 66,
    dist: 0,
    cal: 0,
    active: 0,
    sleep: 0,
    mode: 1,
    x: -20,
    y: 20,
    left: 6,
    marks: [],
    alert: null,
    coat,
    ear,
    spot,
    history: [["Now", "Added to the system"]],
  };
  if (cat)
  {
    pet.jumps = 0;
    pet.purr = 0;
  }
  return pet;
}
const LAYOUT_KEY = "collar-layout";
function loadLayout()
{
  try
  {
    const v = JSON.parse(localStorage.getItem(LAYOUT_KEY));
    if (v && Array.isArray(v.rooms) && Array.isArray(v.doors)) return v;
  }
  catch
  {}
  return null;
}
function saveLayout(rooms, doors)
{
  try
  {
    localStorage.setItem(LAYOUT_KEY, JSON.stringify({ rooms, doors }));
  }
  catch
  {}
}
/** Starting pets. */
function createPets()
{
  return [
    {
      name: "Martha",
      type: "dog",
      age: "6 year old",
      weight: "86 Lbs",
      battery: 57,
      steps: 5000,
      barks: 42,
      heart: 85,
      temp: 66,
      dist: 2.4,
      cal: 310,
      active: 96,
      sleep: 7.5,
      mode: 0,
      x: -30,
      y: 20,
      left: 6,
      marks: [
        {
          id: 1,
          x: -32,
          y: 24,
          t: "poop",
          room: "Living room",
          text: "Poop: Living room",
        },
      ],
      alert: "Poop: Living room",
      coat: "#e0a45e",
      ear: "#7a3f16",
      spot: "#a86a32",
      history: [
        ["Now", "Poop: Living room"],
        ["9:12 AM", "Left the yard"],
        ["8:40 AM", "Barked 12 times"],
        ["Yesterday", "Battery charged to 100%"],
      ],
    },
    {
      name: "Rex",
      type: "dog",
      age: "4 year old",
      weight: "72 Lbs",
      battery: 82,
      steps: 8420,
      barks: 15,
      heart: 112,
      temp: 68,
      dist: 4.1,
      cal: 520,
      active: 141,
      sleep: 6.8,
      mode: 2,
      x: 32,
      y: -24,
      left: 6,
      marks: [],
      alert: null,
      coat: "#c58a4d",
      ear: "#2f2118",
      spot: "#2f2118",
      history: [
        ["10:02 AM", "Ran 1.2 mi in the park"],
        ["8:15 AM", "Back inside the house"],
        ["Yesterday", "Chewed through 3 toys"],
      ],
    },
    {
      name: "Luna",
      type: "dog",
      age: "2 year old",
      weight: "48 Lbs",
      battery: 23,
      steps: 3100,
      barks: 88,
      heart: 92,
      temp: 65,
      dist: 1.3,
      cal: 180,
      active: 52,
      sleep: 9,
      mode: 1,
      x: -30,
      y: -25,
      left: 6,
      marks: [],
      alert: "Battery low: 23%",
      coat: "#f4f0e8",
      ear: "#3a3a3a",
      spot: "#6b6b6b",
      history: [
        ["Now", "Battery low"],
        ["9:40 AM", "Barked 30 times"],
        ["Yesterday", "Slept 9 hours"],
      ],
    },
    {
      name: "Clara",
      type: "cat",
      age: "3 year old",
      weight: "9 Lbs",
      battery: 71,
      steps: 2300,
      barks: 26,
      heart: 140,
      temp: 70,
      dist: 0.7,
      cal: 95,
      active: 38,
      sleep: 14,
      jumps: 12,
      purr: 46,
      mode: 1,
      x: 30,
      y: 20,
      left: 8,
      alert: null,
      marks: [],
      coat: "#b9c2cf",
      ear: "#4f5968",
      spot: "#4f5968",
      history: [
        ["9:05 AM", "Napped on the couch"],
        ["8:30 AM", "Meowed 8 times"],
        ["Yesterday", "Knocked a cup off the counter"],
      ],
    },
  ];
}

export {
  MODES,
  SPEED,
  HEART,
  DURATION,
  CHANCE,
  DEFAULT_ROOMS,
  DEFAULT_DOORS,
  DEVICES,
  STATUS_LABEL,
  clone,
  clamp,
  snap,
  roomAt,
  roamBounds,
  logEvent,
  pickNextMode,
  leaveMark,
  stepPet,
  newPet,
  LAYOUT_KEY,
  loadLayout,
  saveLayout,
  createPets,
};
