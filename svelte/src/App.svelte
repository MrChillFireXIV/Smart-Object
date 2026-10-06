<script>
  // Smart collar screen.
  // Game logic lives in logic.js. 
  // There are many different compenents that combine to make up the screen.
  import "./style.css";
  import PetHeader from "./components/PetHeader.svelte";
  import StatsPanel from "./components/StatsPanel.svelte";
  import AlertSlot from "./components/AlertSlot.svelte";
  import Radar from "./components/Radar.svelte";
  import ActivePet from "./components/ActivePet.svelte";
  import HistoryModal from "./components/HistoryModal.svelte";
  import SettingsModal from "./components/SettingsModal.svelte";
  import AddPetModal from "./components/AddPetModal.svelte";
  import BluetoothModal from "./components/BluetoothModal.svelte";
  import HouseMap from "./components/HouseMap.svelte";
  import {
    DEFAULT_ROOMS,
    DEFAULT_DOORS,
    DEVICES,
    clone,
    createPets,
    newPet,
    stepPet,
    logEvent,
    loadLayout,
  } from "./logic.js";

  // ---- states ----
  const saved = loadLayout();
  let pets = $state(createPets());
  let rooms = $state(saved ? saved.rooms : clone(DEFAULT_ROOMS));
  let doors = $state(saved ? saved.doors : clone(DEFAULT_DOORS));
  let cur = $state(0);
  let menuOpen = $state(false); 
  let modal = $state(null);
  let bluetooth = $state(true);
  let pinging = $state(false);
  let allClear = $state(false);
  let barking = $state(false);
  let devices = $state(clone(DEVICES));

  const pet = $derived(pets[cur]);

  // ---- actions ----
  const open = name => (modal = name);
  const closeModal = () => (modal = null);
  function pick(i)
  {
    cur = i;
    menuOpen = false;
    allClear = false;
  }
  function flash(setter, ms)
  {
    setter(true);
    setTimeout(() => setter(false), ms);
  }
  const beep = () => flash(v => (pinging = v), 2500);
  function dismiss()
  {
    pet.alert = null;
    flash(v => (allClear = v), 2000);
  }
  function clearMark(m)
  {
    // tap a brown/blue dot on the map
    pet.marks = pet.marks.filter(x => x.id !== m.id);
    if (pet.alert === m.text) dismiss();
    logEvent(pet, "Cleaned up " + m.text.toLowerCase());
  }
  function addPet(name, type, age, weight)
  {
    pets.push(newPet(name, type, age, weight, pets.length));
    cur = pets.length - 1;
    menuOpen = false;
    modal = null;
  }
  function resetCounts()
  {
    pet.steps = 0;
    pet.barks = 0;
  }

  // Every 1.2 seconds each pet does an action.
  $effect(() =>
  {
    const timer = setInterval(() =>
    {
      for (const p of pets)
      {
        if (stepPet(p, rooms) && p === pet)
        {
          barking = false;
          setTimeout(() =>
          {
            barking = true;
            setTimeout(() => (barking = false), 1100);
          }, 40);
        }
      }
    }, 1200);
    return () => clearInterval(timer);
  });
</script>

<div class="paper">
  <div class="frame">
    <section class="left">
      <PetHeader {pets} {cur} {pet} bind:menuOpen onpick={pick} onadd={() => open("addpet")} onhistory={() => open("history")} />
      <StatsPanel {pet} onsettings={() => open("settings")} />
    </section>
    <AlertSlot {pet} {allClear} ondismiss={dismiss} />
    <Radar {pet} {rooms} {doors} {pinging} {bluetooth} onmap={() => open("map")} onbluetooth={() => open("bluetooth")} onbeep={beep} />
    <ActivePet {pet} {barking} />
  </div>
  {#if modal}
    <div class="scrim" role="presentation" onclick={closeModal}>
    </div>
    <div class="sheet" role="dialog">
      <button class="x" aria-label="Close" onclick={closeModal}>
        ×
      </button>
      {#if modal === "history"}
        <HistoryModal {pet} />
      {:else if modal === "settings"}
        <SettingsModal bind:bluetooth bind:rooms bind:doors onresetcounts={resetCounts} />
      {:else if modal === "addpet"}
        <AddPetModal onadd={addPet} />
      {:else if modal === "bluetooth"}
        <BluetoothModal {pet} bind:devices bind:bluetooth />
      {:else if modal === "map"}
        <HouseMap {pet} bind:rooms bind:doors onclear={clearMark} />
      {/if}
    </div>
  {/if}
</div>
