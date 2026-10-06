<script>
  let { onadd } = $props();
  let form = $state({ name: "", type: "dog", age: "", weight: "", error: "" });

  function submit()
  {
    if (!form.name.trim())
    {
      form.error = "Please enter a name.";
      return;
    }
    onadd(form.name.trim(), form.type, form.age.trim(), form.weight.trim());
  }
</script>

<div class="addf">
  <h2>
    Add a pet
  </h2>
  <input aria-label="Pet name" placeholder="Name" maxlength="14" bind:value={form.name} />
  <div class="tt">
    <button class:on={form.type === "dog"} onclick={() => (form.type = "dog")}>
      Dog
    </button>
    <button class:on={form.type === "cat"} onclick={() => (form.type = "cat")}>
      Cat
    </button>
  </div>
  <input aria-label="Age" placeholder="Age (e.g. 3 year old)" maxlength="16" bind:value={form.age} />
  <input aria-label="Weight" placeholder="Weight (e.g. 40 Lbs)" maxlength="12" bind:value={form.weight} />
  <p class="err">
    {form.error}
  </p>
  <button class="go" onclick={submit}>
    Add pet
  </button>
</div>
