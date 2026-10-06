<script>
  import { STATUS_LABEL } from "../logic.js";
  let { pet, devices = $bindable(), bluetooth = $bindable() } = $props();

  let scanning = $state(false);
  let nextDeviceId = 100;

  function scan()
  {
    scanning = true;
    setTimeout(() =>
    {
      scanning = false;
      devices.push({
        id: nextDeviceId++,
        name: "Pet Tracker " + (1000 + Math.floor(Math.random() * 9000)),
        sig: 1 + Math.floor(Math.random() * 4),
        status: "idle",
      });
    }, 1800);
  }
  function connect(d)
  {
    if (d.status === "connecting") return;
    if (d.status === "connected")
    {
      d.status = "idle";
      bluetooth = false;
      return;
    }
    devices.forEach(x => x.status === "connected" && (x.status = "idle"));
    bluetooth = false;
    d.status = "connecting";
    setTimeout(() =>
    {
      d.status = "connected";
      bluetooth = true;
    }, 1300);
  }
</script>

<h2>
  Connect a device
</h2>
<p class="hint">
  {scanning ? "Scanning for nearby devices…" : "Turn the collar on and stay within 30 ft."}
</p>
<ul class="dev">
  {#each devices as d (d.id)}
    <li>
      <span class="sg" aria-label="Signal {d.sig} of 4">
        {#each [1, 2, 3, 4] as n}
          <i style="height:{n * 4 + 4}px" class:on={n <= d.sig}>
          </i>
        {/each}
      </span>
      <b>
        {d.own ? pet.name + " " + d.name : d.name}
      </b>
      <button class="cbtn {d.status}" onclick={() => connect(d)}>
        {STATUS_LABEL[d.status]}
      </button>
    </li>
  {/each}
</ul>
<button class="rst" disabled={scanning} onclick={scan}>
  {scanning ? "Scanning…" : "Scan again"}
</button>
