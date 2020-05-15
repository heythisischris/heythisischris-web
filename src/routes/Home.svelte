<script>
  import { onMount } from "svelte";
  let githubFeed = [];
  let newsFeed = [];
  let localeStringOptions = {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true
  };
  onMount(async function() {
    let response, data;
    //get listed.to rss feed
    response = await fetch(
      "https://k1w3dj0nve.execute-api.us-east-2.amazonaws.com/prod?url=https://listed.to/@heythisischris/feed"
    );
    data = await response.json();
    newsFeed = data.items;
    console.log(newsFeed);
    //get github rss feed
    response = await fetch(
      "https://k1w3dj0nve.execute-api.us-east-2.amazonaws.com/prod?url=https://github.com/heythisischris/heythisischris-web/commits.atom"
    );
    data = await response.json();
    githubFeed = data.items;
  });
</script>

<div class="mainbarAndSidebarContainer">
  <div class="mainbar">
    <h1>Who is Chris?</h1>
    <div class="textBlock">
      <p>I'm a software developer in Miami, FL.</p>
    </div>
    <h1>What does Chris do now?</h1>
    <div class="textBlock">
      <p>
        He works at
        <a target="_blank" href="https://teckpert.com">TECKpert</a>. In his spare-time, he's building
        <a target="_blank" href="https://place4pals.com">place4pals</a>.
      </p>
    </div>

    <div class="titleBar">
      <img alt="github" src="images/newspaper.svg" />
      <h1>Chris Feed</h1>
    </div>
    {#each newsFeed as item}
      <div class="newsTitle">
        <a href={item.link}>{item.title}</a>
        <span>
          {new Date(item.isoDate.replace(/ /g, 'T')).toLocaleString('en-US', localeStringOptions)}
        </span>
      </div>
      <p class="newsContent">
        {@html item.content}
      </p>
    {/each}
  </div>
  <div class="sidebar">
    <div class="titleBar">
      <img alt="github" src="images/github.svg" />
      <h1>GitHub Feed</h1>
    </div>
    {#each githubFeed as item}
      <div class="commitBlock">
        <p>
          <a target="_blank" href={item.link}>
            {new Date(item.isoDate.replace(/ /g, 'T')).toLocaleString('en-US', localeStringOptions)}
          </a>
        </p>
        <p style="margin-top:-15px;">{item.title}</p>
      </div>
    {/each}
  </div>
</div>
