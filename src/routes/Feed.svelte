<script lang="ts">
  import { navigate } from "svelte-routing";
  import { fade } from "svelte/transition";
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

    if (urlParams.has("guid")) {
      let index = response.findIndex(
        response => response.guid == urlParams.get("guid")
      );
      return [response[index]];
    } else {
      return response;
    }
  }

  export let location;
  var urlParams = new URLSearchParams(location.search);

  let newsFeed = loadRss(`https://api.heythisischris.com/feed`);
  let name = "";
  let comment = "";
  async function showComments(guid, showAddComment) {
    let commentsData = await fetch(
      `https://api.heythisischris.com/comments?post_guid=${guid}`
    );
    let commentsResponse = await commentsData.json();

    let data = await newsFeed;
    let index = data.findIndex(item => item.guid == guid);
    if (
      (data[index].comments && data[index].showAddComment && showAddComment) ||
      (data[index].comments && !showAddComment)
    ) {
      delete data[index].comments;
      delete data[index].showAddComment;
      newsFeed[index] = data[index];
    } else {
      data[index].comments = commentsResponse;
      if (showAddComment) {
        data[index].showAddComment = true;
      }
      newsFeed[index] = data[index];
    }
  }
  async function addComment(guid) {
    let commentsData = await fetch(`https://api.heythisischris.com/comments`, {
      method: "post",
      body: JSON.stringify({ post_guid: guid, name: name, comment: comment })
    });
    let commentsResponse = await commentsData.json();

    let data = await newsFeed;
    let index = data.findIndex(item => item.guid == guid);
    data[index].comments.push({ name: name, comment: comment });
    data[index].commentCount = parseInt(data[index].commentCount) + 1;
    data[index].showAddComment = false;
    newsFeed[index] = data[index];

    name = "";
    comment = "";
  }
  async function deleteComment(id, guid) {
    let commentsData = await fetch(`https://api.heythisischris.com/comments`, {
      method: "delete",
      body: JSON.stringify({ id: id })
    });
    let commentsResponse = await commentsData.json();

    let data = await newsFeed;
    let index = data.findIndex(item => item.guid == guid);
    data[index].commentCount = parseInt(data[index].commentCount) - 1;
    delete data[index].comments;
    delete data[index].showAddComment;
    newsFeed[index] = data[index];
  }
</script>

{#await newsFeed}
  <div class="loader" />
{:then newsFeed}
  {#each newsFeed as item}
    <div in:fade>
      <div
        class="newsTitle"
        on:click={() => {
          navigate(`post?guid=${item.link}`);
        }}>
        <a href={"#"}>{item.title}</a>
        <span>
          {new Date(item.isoDate.replace(/ /g, 'T')).toLocaleString('en-US', localeStringOptions)}
        </span>
      </div>
      <div class="newsContent">
        {@html item.content}
      </div>
      <div class="newsComment">
        <div class="newsCommentTopBar">
          <a
            href={"#"}
            on:click={() => {
              showComments(item.guid, false);
            }}>
            {item.commentCount} comment{item.commentCount === '1' ? '' : 's'}
          </a>
          <a
            href={"#"}
            on:click={() => {
              showComments(item.guid, true);
            }}>
            Write a comment
          </a>
        </div>
        {#if item.comments}
          {#each item.comments as comment}
            <p>
              <b>{comment.name}</b>
              says: {comment.comment}
              {#if comment.canDelete}
                <a
                  href={"#"}
                  on:click={() => {
                    deleteComment(comment.id, item.guid);
                  }}
                  class="deleteComment">
                  Delete
                </a>
              {/if}
            </p>
          {/each}
          {#if item.showAddComment}
            <div class="addComment">
              <div class="addCommentInner">
                <div>Name:</div>
                <input bind:value={name} style="width: 100%;" />
              </div>
              <div class="addCommentInner">
                <div>Comment:</div>
                <textarea bind:value={comment} />
              </div>
              <div class="addCommentSubmit">
                <button
                  on:click={() => {
                    addComment(item.guid);
                  }}>
                  Submit
                </button>
              </div>
            </div>
          {/if}
        {/if}
      </div>
    </div>
  {/each}
{/await}
