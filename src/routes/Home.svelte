<script lang="ts">
  import { fade } from "svelte/transition";
  import Feed from "./Feed.svelte";
  let localeStringOptions = {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true
  };
  async function loadRss(url) {
    let data = await fetch(url);
    let response = await data.json();
    return response;
  }
  let githubFeed = loadRss("https://api.heythisischris.com/github");
  export let location;
</script>

<div class="mainbarAndSidebarContainer">
  <div class="mainbar">
    <h1>Who is Chris?</h1>
    <div class="textBlock">
      <p>I'm a software developer based in Miami, FL.</p>
    </div>
    <h1>What does Chris do now?</h1>
    <div class="textBlock">
      <p>
        I work at
        <a target="_blank" href="https://teckpert.com">TECKpert</a>. In my spare-time, I'm building
        <a target="_blank" href="https://place4pals.com">place4pals</a> and <a target="_blank" href="https://productabot.com">productabot</a>.
      </p>
    </div>

    <div class="titleBar">
      <img alt="github" src="images/newspaper.svg" />
      <h1>Chris Feed</h1>
    </div>
    <Feed {location} />
  </div>
  <div class="sidebar">
    <div class="titleBar">
      <img alt="github" src="images/github.svg" />
      <h1>GitHub Feed</h1>
    </div>
    {#await githubFeed}
      <div class="loader" />
    {:then githubFeed}
      {#each githubFeed as item}
        <div class="commitBlock" in:fade>
          <p>
            <a target="_blank" href={item.commitUrl}>
              {item.repo}
            </a>
          </p>
          <p style="margin-top: -15px;font-size: 11px;color: #666666;">{new Date(item.date.replace(/ /g, 'T')).toLocaleString('en-US', localeStringOptions)}</p>
          <p style="margin-top: -7px;font-size: 11px;">{item.commit}</p>
        </div>
      {/each}
    {/await}
  </div>
</div>
