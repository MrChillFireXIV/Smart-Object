<script>
  import { clone, DEFAULT_ROOMS, DEFAULT_DOORS, saveLayout } from "../logic.js";
  let { bluetooth = $bindable(), rooms = $bindable(), doors = $bindable(), onresetcounts } = $props();

  const LABEL = "Reset GPS house perimeter";
  let perimeterLabel = $state(LABEL);
  let armed = false;

  function resetPerimeter()
  {
    // first tap arms, second tap confirms
    if (!armed)
    {
      armed = true;
      perimeterLabel = "Tap again to confirm";
      setTimeout(() =>
      {
        armed = false;
        perimeterLabel = LABEL;
      }, 3000);
      return;
    }
    armed = false;
    rooms = clone(DEFAULT_ROOMS);
    doors = clone(DEFAULT_DOORS);
    saveLayout(rooms, doors);
    perimeterLabel = "Perimeter reset ✓";
    setTimeout(() => (perimeterLabel = LABEL), 2000);
  }
</script>

<h2>
  Settings
</h2>
<label>
  Bluetooth
  <input type="checkbox" bind:checked={bluetooth} />
</label>
<button class="rst" onclick={onresetcounts}>
  Reset today's counts
</button>
<button class="rst gps" onclick={resetPerimeter}>
  {perimeterLabel}
</button>
