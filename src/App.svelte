<script>
  import { Router, Route } from "svelte-routing";
  import NavLink from "./components/NavLink.svelte";
  import Home from "./routes/Home.svelte";
  import Test from "./routes/Test.svelte";

  // Used for SSR. A falsy value is ignored by the Router.
  export let url = "";
</script>

<Router url="{url}">
  <nav>
    <NavLink to="/">Home</NavLink>
    <NavLink to="resume">Resume</NavLink>
    <NavLink to="apps">Apps</NavLink>
    <NavLink to="sites">Sites</NavLink>
    <NavLink to="film">Film</NavLink>
    <NavLink to="music">Music</NavLink>
  </nav>
  <div>
    <Route path="/" component="{Home}" />
    <Route path="resume" component="{Test}" />
  </div>
</Router>
