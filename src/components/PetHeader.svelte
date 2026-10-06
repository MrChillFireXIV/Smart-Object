<script>
  // Pet name with dropdown pet details and history.
  let { pets, cur, pet, menuOpen = $bindable(false), onpick, onadd, onhistory } = $props();
</script>

<div class="name">
  <h1>
    {pet.name}
    <button class="chev" class:open={menuOpen} aria-expanded={menuOpen} onclick={() => (menuOpen = !menuOpen)} aria-controls="menu" aria-label="Show details">
      <svg viewBox="0 0 24 24">
        <path d="m6 9 6 6 6-6">
        </path>
      </svg>
    </button>
  </h1>
  {#if menuOpen}
    <div class="menu" id="menu">
      <div class="switch" role="group" aria-label="Choose pet">
        {#each pets as q, i}
          <button class:on={i === cur} aria-pressed={i === cur} onclick={() => onpick(i)}>
            {q.name}
          </button>
        {/each}
        <button class="add" aria-label="Add a new pet" onclick={onadd}>
          +
        </button>
      </div>
      <a class="ph r1" href="tel:15134156363">
        1-513-415-6363
      </a>
      <p class="r2">
        {pet.age}
      </p>
      <p class="r3">
        {pet.weight}
      </p>
      <button class="hb r4" aria-haspopup="dialog" onclick={onhistory}>
        History
        <span>
          ≡
        </span>
      </button>
    </div>
  {/if}
</div>
