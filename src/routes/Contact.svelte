<style>
  .textarea {
    width: 90%;
    height: 125px;
    font-family: Arial;
    padding: 5px;
  }
  .input {
    width: 90%;
    padding: 5px;
  }
  .send {
    width: 90%;
    text-align: right;
  }
  .sendButton {
    padding: 10px 20px;
  }
  @media only screen and (max-width: 850px) {
    .textarea {
      width: 90%;
    }
    .input {
      width: 90%;
    }
    .send {
      width: 90%;
    }
  }
</style>

<div class="mainbarAndSidebarContainer">
  <div class="mainbar">
    <h1>Name</h1>
    <div class="textBlock">
      <p>Christopher James Aitken (I'm 25, he/him)</p>
    </div>

    <h1>Email</h1>
    <div class="textBlock">
      <p>
        <a target="_blank" href="mailto:chris@heythisischris.com">
          chris@heythisischris.com
        </a>
      </p>
    </div>
    

    <div id="mobileSocialMedia">
      <h1>Social Media</h1>
      <div class="textBlock">
        <p>
            <a target="_blank" href="https://github.com/heythisischris"><img class="socialIcon" alt="github" src="images/github.svg"></a>
            <a target="_blank" href="https://www.linkedin.com/in/chris-aitken-293045183/"><img class="socialIcon" alt="linkedin" src="images/linkedin.svg"></a>
            <a target="_blank" href="https://www.instagram.com/heythisischris/"><img class="socialIcon" alt="instagram" src="images/instagram.svg"></a>
            <a target="_blank" href="https://www.facebook.com/chrisaitken"><img class="socialIcon" alt="bandcamp" src="images/facebook.svg"></a>
        </p>
      </div>
    </div>

    <h1>Leave me a message</h1>
    <div class="textBlock">
      <p>
        <input class="input" placeholder="Name" />
      </p>
      <p>
        <input class="input" placeholder="Email" />
      </p>
      <p>
        <textarea class="textarea" placeholder="Message" />
      </p>
      <p class="send">
        <button
          class="sendButton"
          onclick="alert('Sorry, this feature doesn\'t work yet!')">
          Send
        </button>
      </p>
    </div>
  </div>

  <div class="sidebar">
    <h1>Response ETA?</h1>
    <div class="textBlock">
      <p>Usually within a few hours, I check my email pretty frequently.</p>
    </div>
  </div>
</div>
