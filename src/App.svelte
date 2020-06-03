<script>
  import { Router, Route } from "svelte-routing";
  import NavLink from "./components/NavLink.svelte";
  import Home from "./routes/Home.svelte";
  import Portfolio from "./routes/Portfolio.svelte";
  import Resume from "./routes/Resume.svelte";
  import Contact from "./routes/Contact.svelte";
  import Post from "./routes/Post.svelte";

  // Used for SSR. A falsy value is ignored by the Router.
  export let url = "";
</script>
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
          <a target="_blank" href="https://www.facebook.com/chrisaitken"><img class="socialIcon" alt="bandcamp" src="images/facebook.svg"></a>
        </div>
      </div>
    </nav>
    <div class="pageContainer">
      <Route path="/" component={Home} />
      <Route path="portfolio" component={Portfolio} />
      <Route path="resume" component={Resume} />
      <Route path="contact" component={Contact} />
      <Route path="post" component={Post} />
    </div>
  </div>
  <div class="footer">Copyright © {new Date().getFullYear()} Chris Aitken</div>
</Router>
