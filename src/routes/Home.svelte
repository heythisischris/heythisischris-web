<script>
  import { onMount } from "svelte";
  let githubFeed = [];
  onMount(async function() {
    const response = await fetch(
      "https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fgithub.com%2Fheythisischris.atom"
    );
    let data = await response.json();
    githubFeed = data.items;
  });
</script>

<div class="mainbarAndSidebarContainer">
  <div class="mainbar">
    <h1>Who is Chris?</h1>
    <div class="textBlock">
      <p>I'm an application developer based in Miami, FL.</p>
    </div>
    <h1>What does Chris do now?</h1>
    <div class="textBlock">
      <p>He works at TECKpert. In his spare-time, he's building place4pals.</p>
    </div>
  </div>
  <div class="sidebar">
    <h1>GitHub Feed</h1>
    {#each githubFeed as item}
    <div class="commitBlock">
      <p><a target="_blank" href="{item.link}">{new Date(item.pubDate.replace(/ /g,"T")).toLocaleString('en-US', { day:'numeric', month:'numeric', year:'numeric', hour: 'numeric', minute:'numeric', hour12: true })}</a></p>
      <p style="margin-top:-15px;">{item.title}</p>
    </div>
    {/each}
  </div>
</div>
