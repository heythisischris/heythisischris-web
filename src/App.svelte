<script>
  import { Router, Route } from "svelte-routing";
  import NavLink from "./components/NavLink.svelte";
  import Home from "./routes/Home.svelte";
  import Portfolio from "./routes/Portfolio.svelte";
  import Resume from "./routes/Resume.svelte";
  import Contact from "./routes/Contact.svelte";

  // Used for SSR. A falsy value is ignored by the Router.
  export let url = "";
</script>

<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0" />
  <title>heythisischris</title>
  <meta charset="utf-8" />
  <meta name="description" content="Chris Aitken's personal website" />
  <meta name="author" content="Chris Aitken" />
  <meta property="og:url" content="heythisischris.com" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="heythisischris" />
  <meta property="og:description" content="Chris Aitken's personal website" />
  <link
    rel="apple-touch-icon"
    sizes="180x180"
    href="/images/favicons/apple-touch-icon-180x180.png" />
  <link
    rel="icon"
    type="image/png"
    href="/images/favicons/favicon-32x32.png"
    sizes="32x32" />
  <link
    rel="icon"
    type="image/png"
    href="/images/favicons/android-chrome-192x192.png"
    sizes="192x192" />
  <link
    rel="icon"
    type="image/png"
    href="/images/favicons/favicon-96x96.png"
    sizes="96x96" />
  <link
    rel="icon"
    type="image/png"
    href="/images/favicons/favicon-16x16.png"
    sizes="16x16" />
  <link rel="manifest" href="/images/favicons/manifest.json" />
  <link
    rel="mask-icon"
    href="/images/favicons/safari-pinned-tab.svg"
    color="#5bbad5" />
  <meta name="apple-mobile-web-app-title" content="hey, this is chris" />
  <meta name="application-name" content="hey, this is chris" />
  <meta name="msapplication-TileColor" content="#da532c" />
  <meta
    name="msapplication-TileImage"
    content="/images/favicons/mstile-144x144.png" />
  <meta name="theme-color" content="#ffffff" />
</head>
<Router {url}>
  <div class="container">
    <nav>
      <div class="navContainer">
        <div class="navTitle">
          <NavLink to="/">
            <img class="logo" alt="" src="/images/logo.png" />
          </NavLink>
          <NavLink to="/">heythisischris</NavLink>
        </div>
        <div class="navLinks">
          <NavLink to="/">Home</NavLink>
          <NavLink to="portfolio">Portfolio</NavLink>
          <NavLink to="resume">Resume</NavLink>
          <NavLink to="contact">Contact</NavLink>
        </div>
        <div class="navSocial">
          <a target="_blank" href="https://github.com/heythisischris"><img class="socialIcon" alt="github" src="images/github.svg"></a>
          <a target="_blank" href="https://www.linkedin.com/in/chris-aitken-293045183/"><img class="socialIcon" alt="linkedin" src="images/linkedin.svg"></a>
          <a target="_blank" href="https://www.instagram.com/heythisischris/"><img class="socialIcon" alt="instagram" src="images/instagram.svg"></a>
          <!--<a target="_blank" href="https://www.youtube.com/user/thisischris22"><img class="socialIcon" alt="youtube" src="images/youtube.svg"></a>-->
          <a target="_blank" href="https://www.facebook.com/chrisaitken"><img class="socialIcon" alt="bandcamp" src="images/facebook.svg"></a>
          <a target="_blank" href="https://heythisischris.bandcamp.com/"><img class="socialIcon" alt="bandcamp" src="images/bandcamp.svg"></a>
          <!--<a target="_blank" href="https://www.reddit.com/u/heythisischris"><img class="socialIcon" alt="bandcamp" src="images/reddit.svg"></a>-->
        </div>
      </div>
    </nav>
    <div class="pageContainer">
      <Route path="/" component={Home} />
      <Route path="portfolio" component={Portfolio} />
      <Route path="resume" component={Resume} />
      <Route path="contact" component={Contact} />
    </div>
  </div>
  <div class="footer">Copyright © 2020 Chris Aitken</div>
</Router>
