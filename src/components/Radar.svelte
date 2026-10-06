<script>
  // GPS radar with the mini floor plan.  Also includes bluetooth and beep buttons.
  let { pet, rooms, doors, pinging, bluetooth, onmap, onbluetooth, onbeep } = $props();
</script>

<section class="radar">
  <button class="mapbtn" onclick={onmap} aria-label="Open house map">
    <svg viewBox="-100 -100 200 200" role="img">
      <defs>
        <clipPath id="fp">
          <circle r="72">
          </circle>
        </clipPath>
        <pattern id="grid" width="8" height="8" patternUnits="userSpaceOnUse">
          <path d="M8 0H0V8" class="gl">
          </path>
        </pattern>
      </defs>
      <circle class="yard" r="96">
      </circle>
      <circle class="bp" r="74">
      </circle>
      <text y="-80">
        N
      </text>
      <text y="90">
        S
      </text>
      <text x="-86" y="3">
        W
      </text>
      <text x="86" y="3">
        E
      </text>
      <g clip-path="url(#fp)">
        <rect class="grid" x="-74" y="-74" width="148" height="148">
        </rect>
        {#each rooms as r (r.id)}
          <rect class="room" x={r.x} y={r.y} width={r.w} height={r.h} />
          <text class="rl" x={r.x + r.w / 2} y={r.y + r.h / 2 + 2}>
            {r.l}
          </text>
        {/each}
        {#each doors as d (d.id)}
          <rect class="door" x={d.x} y={d.y} width={d.w} height={d.h} />
        {/each}
        {#each pet.marks as m (m.id)}
          <circle class="mk {m.t}" cx={m.x} cy={m.y} r="2.6" />
        {/each}
      </g>
      <g style="transform:translate({pet.x}px,{pet.y}px);transition:transform 1s ease">
        <circle r="4" class="dot" />
        <circle r="4" class="ping" class:on={pinging} />
        <text y="-8" class="s">
          {pet.name}
        </text>
      </g>
    </svg>
  </button>
  <button class="bt" class:off={!bluetooth} onclick={onbluetooth} aria-label="Bluetooth devices">
    <svg viewBox="0 0 24 24">
      <path d="m7 7 10 10-5 5V2l5 5L7 17">
      </path>
    </svg>
  </button>
  <button class="beep" onclick={onbeep} aria-label="Beep the collar">
    <svg viewBox="0 0 24 24">
      <path d="M3 9v6h4l5 4V5L7 9z">
      </path>
      <path d="M15 9a4 4 0 0 1 0 6M18 6a8 8 0 0 1 0 12">
      </path>
    </svg>
  </button>
  <p class="note beepn">
    Collar
    <br/>
    Beep ↙
  </p>
</section>
