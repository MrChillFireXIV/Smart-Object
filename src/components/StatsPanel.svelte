<script>
  // Display of the stats list.
  let { pet, onsettings } = $props();
  const cat = $derived(pet.type === "cat");
</script>

<div class="batt">
  <button class="gear" onclick={onsettings} aria-label="Settings">
    <svg viewBox="0 0 24 24">
      <path d="M9.84 4.92 L10.23 1.95 L13.77 1.95 L14.16 4.92 L15.47 5.47 L17.85 3.64 L20.36 6.15 L18.53 8.53 L19.08 9.84 L22.05 10.23 L22.05 13.77 L19.08 14.16 L18.53 15.47 L20.36 17.85 L17.85 20.36 L15.47 18.53 L14.16 19.08 L13.77 22.05 L10.23 22.05 L9.84 19.08 L8.53 18.53 L6.15 20.36 L3.64 17.85 L5.47 15.47 L4.92 14.16 L1.95 13.77 L1.95 10.23 L4.92 9.84 L5.47 8.53 L3.64 6.15 L6.15 3.64 L8.53 5.47Z">
      </path>
      <circle cx="12" cy="12" r="3">
      </circle>
    </svg>
  </button>
  <div class="cell" role="img">
    <i style="width:{100 - pet.battery}%">
    </i>
  </div>
  <b>
    {pet.battery}%
  </b>
</div>
<ul class="stats">
  <li>
    Steps
    <b>
      {pet.steps}
    </b>
  </li>
  <li>
    {cat ? "Meows" : "Barks"}
    <b>
      {pet.barks}
    </b>
  </li>
  <li>
    Heartrate
    <b>
      {pet.heart}
    </b>
  </li>
  <li>
    Temp
    <b>
      {pet.temp}
    </b>
  </li>
  <li>
    {#if cat}
      Jumps
      <b>
        {pet.jumps}
      </b>
    {:else}
      Miles
      <b>
        {pet.dist.toFixed(1)}
      </b>
    {/if}
  </li>
  <li>
    Calories
    <b>
      {pet.cal}
    </b>
  </li>
  <li>
    {#if cat}
      Purring
      <b>
        {Math.floor(pet.purr)}m
      </b>
    {:else}
      Active
      <b>
        {Math.floor(pet.active)}m
      </b>
    {/if}
  </li>
  <li>
    Sleep
    <b>
      {pet.sleep}h
    </b>
  </li>
</ul>
