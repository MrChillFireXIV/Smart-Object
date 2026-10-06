<script>
  // SMART COLLAR title and alert area.
  let { pet, allClear, ondismiss } = $props();
</script>

<div class="slot">
  <span class="ttl">
    SMART
    <br/>
    COLLAR
  </span>
  {#if pet.alert}
    <button class="pop hot" role="alert" onclick={ondismiss}>
      <b>
        Alert!!!
      </b>
      <span>
        {pet.alert}
      </span>
      <small>
        Tap to dismiss
      </small>
    </button>
  {:else if allClear}
    <div class="pop ok" role="status">
      <b>
        All clear
      </b>
      <span>
        No alerts for {pet.name}
      </span>
    </div>
  {/if}
</div>
