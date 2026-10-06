<script>
  // Animated pet drawing with its current state.
  import { SVG } from "../svg.js";
  import { MODES } from "../logic.js";
  let { pet, barking } = $props();
  const cat = $derived(pet.type === "cat");
</script>

<div class="active" aria-live="polite">
  <span class="h">
    {pet.mode === 1 ? "Resting" : "Active"}
  </span>
  <div class={["pup", { cat, walk: pet.mode === 0 || pet.mode === 2, run: pet.mode === 2, rest: pet.mode === 1, pee: pet.mode === 3, poop: pet.mode === 4, groom: cat && pet.mode === 5, scratch: cat && pet.mode === 6, bark: barking }]} style="--coat:{pet.coat};--ear:{pet.ear};--spot:{pet.spot}">
    {@html SVG[pet.type]}
  </div>
  <span class="w">
    {MODES[pet.type][pet.mode]}...
  </span>
</div>
