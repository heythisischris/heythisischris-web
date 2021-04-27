<h1>Apps</h1>
<div class="textBlock">
  <p>Here are some of my projects outside of work:</p>
</div>
<div class="portfolioContainer">
  <div class="portfolioItem">
    <a target="_blank" href="https://place4pals.com">
      <img alt="" src="/images/apps/place4pals.svg" />
    </a>
    <a class="noLinkColor" target="_blank" href="https://place4pals.com">
      <div>
        <span class="titleUnderline">place4pals</span>
        <span class="portfolioDate">Non-profit social media service</span>
        <span class="portfolioDate" style="padding-top:2px;">
          <span>React Native</span>
          <span>GraphQL</span>
        </span>
      </div>
    </a>
  </div>
  <div class="portfolioItem">
    <a target="_blank" href="https://productabot.com">
      <img alt="" src="/images/apps/productabot.svg" />
    </a>
    <a class="noLinkColor" target="_blank" href="https://productabot.com">
      <div>
        <span class="titleUnderline">productabot</span>
        <span class="portfolioDate">Minimalist project management</span>
        <span class="portfolioDate" style="padding-top:2px;">
          <span>React Native</span>
          <span>GraphQL</span>
        </span>
      </div>
    </a>
  </div>
  <div class="portfolioItem">
    <a target="_blank" href="https://guardianbrothers.com">
      <img
        alt=""
        src="/images/apps/guardianbrothers.svg"
        style="height:auto;"
      />
    </a>
    <a class="noLinkColor" target="_blank" href="https://guardianbrothers.com">
      <div>
        <span class="titleUnderline">Guardian Brothers Holdings</span>
        <span class="portfolioDate">
          Front-facing website for a mutual fund
        </span>
        <span class="portfolioDate" style="padding-top:2px;">
          <span>Svelte</span>
          <span>Node.js</span>
        </span>
      </div>
    </a>
  </div>
</div>

<h1>Music</h1>
<div class="textBlock">
  <p>I also enjoy recording music. Here are some albums I've released:</p>
</div>
<div class="portfolioContainer">
  <div class="musicItem">
    <a target="_blank" href="https://familyfilm.net">
      <img alt="" src="/images/music/familyfilm.jpg" />
    </a>
    <span class="titleUnderline">family film</span>
    <span class="portfolioDate">July 2020</span>
  </div>
  <div class="musicItem">
    <a target="_blank" href="https://poolhouselp.com">
      <img alt="" src="/images/music/poolhouselp.jpg" />
    </a>
    <span class="titleUnderline">poolhouse lp</span>
    <span class="portfolioDate">May 2020</span>
  </div>
  <div class="musicItem">
    <a target="_blank" href="https://thebreakersproject.bandcamp.com/">
      <img alt="" src="/images/music/4songsfromprovidence.jpg" />
    </a>
    <span class="titleUnderline">4 songs from pvd</span>
    <span class="portfolioDate">Dec 2018</span>
  </div>
  <div class="musicItem">
    <a target="_blank" href="https://familyfilm.bandcamp.com/album/canvas-face">
      <img alt="" src="/images/music/canvasface.jpg" />
    </a>
    <span class="titleUnderline">canvas face</span>
    <span class="portfolioDate">Oct 2016</span>
  </div>
  <div class="musicItem">
    <a target="_blank" href="https://familyfilm.bandcamp.com/album/lightheaded">
      <img alt="" src="/images/music/lightheaded.jpg" />
    </a>
    <span class="titleUnderline">lightheaded</span>
    <span class="portfolioDate">Feb 2013</span>
  </div>
  <div class="musicItem" />
  <div class="musicItem" />
</div>

<style>
  .portfolioContainer {
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    margin-top: -15px;
    flex-wrap: wrap;
    width: 100%;
    padding: 10px;
  }
  .musicItem {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    margin: 5px;
    width: 125px;
  }
  .musicItem img {
    width: 125px;
    height: 125px;
  }
  .portfolioDate {
    font-size: 11px;
    color: #666666;
  }
  .portfolioDate span {
    background-color: #999999;
    color: #ffffff;
    font-size: 10px;
    padding: 2px 4px;
    border-radius: 6px;
  }

  .portfolioItem {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    width: 33%;
  }
  .portfolioItem div {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
    margin: 5px;
  }
  .portfolioItem img {
    width: 100px;
    height: 100px;
    margin-right: 5px;
  }
  .noLinkColor {
    text-decoration: none;
    color: #000000;
  }
  .portfolioItem:hover .titleUnderline,
  .musicItem:hover .titleUnderline {
    text-decoration-line: underline;
  }
  @media only screen and (max-width: 850px) {
    .portfolioItem {
      width: 100%;
      margin-bottom: 30px;
    }
  }
</style>
