<script>
  import { Router, Route } from "svelte-routing";
  import NavLink from "./components/NavLink.svelte";
  import Home from "./routes/Home.svelte";
  import Test from "./routes/Test.svelte";

  // Used for SSR. A falsy value is ignored by the Router.
  export let url = "";
</script>

<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<Router {url}>
  <div class="container">
    <nav>
      <div class="navContainer">
        <div class="navTitle">
          <NavLink to="/">
            <img class="logo" alt="" src="/images/logo.png" />
          </NavLink>
          <NavLink to="/">
            heythisischris
          </NavLink>
        </div>
        <div class="navLinks">
          <NavLink to="/">Home</NavLink>
          <NavLink to="Portfolio">Portfolio</NavLink>
          <NavLink to="resume">Resume</NavLink>
          <NavLink to="contact">Contact</NavLink>
        </div>
      </div>
    </nav>
    <div class="pageContainer">
      <Route path="/" component={Home} />
      <Route path="resume" component={Test} />
    </div>
  </div>
</Router>
