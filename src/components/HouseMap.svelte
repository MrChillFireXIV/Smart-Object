<script>
  // Floor plan modal with room/door editing.
  import { roomAt, clamp, snap, clone, DEFAULT_ROOMS, DEFAULT_DOORS, saveLayout } from "../logic.js";
  let { pet, rooms = $bindable(), doors = $bindable(), onclear } = $props();

  let editing = $state(false);
  let sel = $state(null); // { kind: "room" | "door", id }
  let svg = $state(); // the <svg> element (for pointer maths)
  let drag = null; // active drag: { item, mode, offsets... }
  let uid = 2000;

  const room = $derived(sel?.kind === "room" ? rooms.find(r => r.id === sel.id) : null);
  const door = $derived(sel?.kind === "door" ? doors.find(d => d.id === sel.id) : null);
  const hint = $derived(
    `${pet.name} is in the ${roomAt(rooms, pet.x, pet.y).toLowerCase()}. ` +
      (editing
        ? "Drag rooms and doors to move them. Drag the yellow dot to resize a room."
        : pet.marks.length
          ? "Tap a brown or blue dot to clear it."
          : "Everything is clean!")
  );

  const save = () => saveLayout(rooms, doors);
  function toPoint(e)
  {
    const p = svg.createSVGPoint();
    p.x = e.clientX;
    p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  }
  function start(e, kind, item, mode = "move")
  {
    if (!editing) return;
    sel = { kind, id: item.id };
    const p = toPoint(e);
    drag = { item, mode, ox: p.x - item.x, oy: p.y - item.y, ow: item.w, oh: item.h, px: p.x, py: p.y };
    svg.setPointerCapture(e.pointerId);
  }
  function move(e)
  {
    if (!drag) return;
    const p = toPoint(e),
      it = drag.item;
    if (drag.mode === "move")
    {
      it.x = snap(clamp(p.x - drag.ox, -58, 58 - it.w));
      it.y = snap(clamp(p.y - drag.oy, -48, 48 - it.h));
    }
    else
    {
      it.w = snap(clamp(drag.ow + p.x - drag.px, 12, 58 - it.x));
      it.h = snap(clamp(drag.oh + p.y - drag.py, 12, 48 - it.y));
    }
  }
  function end()
  {
    if (drag)
    {
      drag = null;
      save();
    }
  }
  function addRoom()
  {
    const r = { id: uid++, n: "New room", l: "New room", x: -20, y: -14, w: 30, h: 24 };
    rooms.push(r);
    sel = { kind: "room", id: r.id };
    save();
  }
  function addDoor()
  {
    const d = { id: uid++, x: -5, y: -2, w: 10, h: 3.6 };
    doors.push(d);
    sel = { kind: "door", id: d.id };
    save();
  }
  function reset()
  {
    rooms = clone(DEFAULT_ROOMS);
    doors = clone(DEFAULT_DOORS);
    sel = null;
    save();
  }
  function remove()
  {
    if (room) rooms = rooms.filter(r => r.id !== room.id);
    else doors = doors.filter(d => d.id !== door.id);
    sel = null;
    save();
  }
  function rotate()
  {
    [door.w, door.h] = [door.h, door.w];
    door.x = clamp(door.x, -58, 58 - door.w);
    door.y = clamp(door.y, -48, 48 - door.h);
    save();
  }
  function rename(e)
  {
    room.n = room.l = e.target.value;
    save();
  }
  function toggleEdit()
  {
    editing = !editing;
    sel = null;
  }
</script>

<div class="mh">
  <h2>
    {pet.name}'s house
  </h2>
  <button class="pen" class:on={editing} aria-pressed={editing} aria-label={editing ? "Finish editing map" : "Edit map"} onclick={toggleEdit}>
    <svg viewBox="0 0 24 24">
      <rect x="3" y="3" width="12" height="18" rx="2" />
      <path d="M7 8h4M7 12h2" />
      <path d="M19 8l2.5 2.5L14 18l-3.5 1 1-3.5z" />
    </svg>
  </button>
</div>
<p class="hint">
  {hint}
</p>
{#if editing}
  <div class="tb">
    <button onclick={addRoom}>
      + Room
    </button>
    <button onclick={addDoor}>
      + Door
    </button>
    <button onclick={reset}>
      Reset
    </button>
    <button class="done" onclick={toggleEdit}>
      Done
    </button>
  </div>
  {#if room}
    <div class="selrow">
      <input aria-label="Room name" maxlength="20" value={room.n} oninput={rename} />
      <button onclick={remove}>
        Delete room
      </button>
    </div>
  {:else if door}
    <div class="selrow">
      <span>
        Door
      </span>
      <button onclick={rotate}>
        Rotate
      </button>
      <button onclick={remove}>
        Delete door
      </button>
    </div>
  {/if}
{/if}
<svg bind:this={svg} class="bigmap" class:editing viewBox="-60 -50 120 100" role="img" aria-label="House floor plan" onpointermove={move} onpointerup={end} onpointercancel={end}>
  <defs>
    <pattern id="gridB" width="8" height="8" patternUnits="userSpaceOnUse">
      <path d="M8 0H0V8" class="gl" />
    </pattern>
  </defs>
  <rect class="bgb" x="-60" y="-50" width="120" height="100" />
  <rect class="grid2" x="-60" y="-50" width="120" height="100" />
  {#each rooms as r (r.id)}
    <rect class="room" class:sel={editing && room?.id === r.id} x={r.x} y={r.y} width={r.w} height={r.h} />
    <text class="rl" x={r.x + r.w / 2} y={r.y + 4.5}>
      {r.l}
    </text>
    {#if editing}
      <rect class="mv" x={r.x} y={r.y} width={r.w} height={r.h} onpointerdown={e => start(e, "room", r)} />
    {/if}
  {/each}
  {#each doors as d (d.id)}
    <rect class="door" class:ed={editing} class:sel={editing && door?.id === d.id} x={d.x} y={d.y} width={d.w} height={d.h} onpointerdown={e => start(e, "door", d)} />
  {/each}
  {#each pet.marks as m (m.id)}
    <g class="mkb" class:off={editing} role="button" tabindex="0" aria-label="Clear {m.text}" onclick={() => !editing && onclear(m)} onkeydown={e => (e.key === "Enter" || e.key === " ") && !editing && onclear(m)}>
      <circle class="hit" cx={m.x} cy={m.y} r="5.5" />
      <circle class="mk {m.t}" cx={m.x} cy={m.y} r="3" />
    </g>
  {/each}
  {#if editing && room}
    <circle class="hd" cx={room.x + room.w} cy={room.y + room.h} r="3.4" onpointerdown={e => start(e, "room", room, "size")} />
  {/if}
  <g style="transform:translate({pet.x}px,{pet.y}px);transition:transform 1s ease;pointer-events:none">
    <circle r="3.4" class="dot" />
    <text y="-5.5" class="nm">
      {pet.name}
    </text>
  </g>
</svg>
