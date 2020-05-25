<style>
  .portfolioContainer {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
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

  .portfolioItem {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    width: 50%;
  }
  .portfolioItem div {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
    margin: 5px;
  }
  .portfolioItem img {
    width: 75px;
    height: 75px;
    margin-right: 5px;
  }
  .noLinkColor {
    text-decoration: none;
    color: #000000;
  }
@media only screen and (max-width: 850px) {
  .portfolioItem {
      width:100%;
      margin-bottom:30px;
  }
}
</style>

<h1>Apps & Websites</h1>
<div class="textBlock">
  <p>Here are some of my projects outside of work:</p>
</div>
<div class="portfolioContainer">
  <div class="portfolioItem">
    <a target="_blank" href="https://place4pals.com">
      <img alt="" src="/images/apps/place4pals.jpg" />
    </a>
    <div>
      <a class="noLinkColor" target="_blank" href="https://place4pals.com">
        <span>place4pals</span>
      </a>
      <span class="portfolioDate">Minimalist social media service</span>
      <span class="portfolioDate">Built with React Native and Hasura</span>
    </div>
  </div>
  <div class="portfolioItem">
    <a target="_blank" href="https://guardianbrothers.com">
      <img
        alt=""
        src="/images/apps/guardianbrothers.svg"
        style="height:auto;" />
    </a>
    <div>
      <a
        class="noLinkColor"
        target="_blank"
        href="https://guardianbrothers.com">
        <span>Guardian Brothers Holdings</span>
      </a>
      <span class="portfolioDate">Front-facing website for a mutual fund</span>
      <span class="portfolioDate">Built with Svelte</span>
    </div>
  </div>
</div>

<h1>Music</h1>
<div class="textBlock">
  <p>I also enjoy recording. Here are some albums I've released:</p>
</div>
<div class="portfolioContainer">
  <div class="musicItem">
    <a target="_blank" href="https://familyfilm.net">
      <img alt="" src="/images/music/familyfilm.jpg" />
    </a>
    <span>family film</span>
    <span class="portfolioDate">July 2020 (soon!)</span>
  </div>
  <div class="musicItem">
    <a target="_blank" href="https://poolhouselp.com">
      <img alt="" src="/images/music/poolhouselp.jpg" />
    </a>
    <span>poolhouse lp</span>
    <span class="portfolioDate">May 2020</span>
  </div>
  <div class="musicItem">
    <a target="_blank" href="https://thebreakersproject.bandcamp.com/">
      <img alt="" src="/images/music/4songsfromprovidence.jpg" />
    </a>
    <span>4 songs from pvd</span>
    <span class="portfolioDate">Dec 2018</span>
  </div>
  <div class="musicItem">
    <a
      target="_blank"
      href="https://heythisischris.bandcamp.com/album/canvas-face">
      <img alt="" src="/images/music/canvasface.jpg" />
    </a>
    <span>canvas face</span>
    <span class="portfolioDate">Oct 2016</span>
  </div>
  <div class="musicItem">
    <a
      target="_blank"
      href="https://heythisischris.bandcamp.com/album/lightheaded">
      <img alt="" src="/images/music/lightheaded.jpg" />
    </a>
    <span>lightheaded</span>
    <span class="portfolioDate">Feb 2013</span>
  </div>
</div>
