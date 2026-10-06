<script>
  let { pet } = $props();
</script>

<h2>
  History
</h2>
<ul class="hl">
  {#each pet.history as [time, text]}
    <li>
      <small>
        {time}
      </small>
      {text}
    </li>
  {/each}
</ul>
