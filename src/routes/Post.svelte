<script lang="ts">
  import { navigate } from "svelte-routing";
  import Feed from "./Feed.svelte";
  export let location;
</script>

<div class="titleBar">
  <div
    style="cursor:pointer;display:flex;flex-direction:row;"
    on:click={() => {
      navigate('/');
    }}>
    <img
      alt="github"
      src="images/curvy-right-arrow.svg"
      style="transform: rotate(180deg);margin-top:5px;" />
    <h1>Go Back</h1>
  </div>
</div>
<Feed {location} />
