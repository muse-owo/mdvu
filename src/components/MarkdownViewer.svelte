<script>
  import { onMount } from 'svelte';

  let fileInput;
  let content = '';
  let fileName = '';
  let showLanding = true;
  let dragDepth = 0;
  let scrollProgress = 0;
  let markedRenderer;

  onMount(() => {
    // setup marked renderer with highlight.js
    markedRenderer = new window.marked.Renderer();
    markedRenderer.code = function(token) {
      const code = typeof token === 'object' ? token.text : token;
      const lang = typeof token === 'object' ? token.lang : arguments[1];
      const l = lang && window.hljs.getLanguage(lang) ? lang : 'plaintext';
      return `<pre><code class="hljs">${
        window.hljs.highlight(code, { language: l }).value
      }</code></pre>`;
    };
    window.marked.use({ renderer: markedRenderer });

    // handle scroll progress
    window.addEventListener('scroll', updateScrollProgress);
    return () => {
      window.removeEventListener('scroll', updateScrollProgress);
    };
  });

  function updateScrollProgress() {
    if (!showLanding) {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      scrollProgress = scrollHeight > 0 ? (window.scrollY / scrollHeight) * 100 : 0;
    }
  }

  function loadFile(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      content = window.marked.parse(e.target.result);
      fileName = file.name;
      showLanding = false;
      document.title = `mdvu — ${file.name}`;
      document.body.classList.add('reading');

      setTimeout(() => {
        window.scrollTo(0, 0);
      }, 10);
    };
    reader.readAsText(file);
  }

  function reset() {
    content = '';
    fileName = '';
    showLanding = true;
    document.title = 'mdvu';
    document.body.classList.remove('reading');
    scrollProgress = 0;
  }

  function handleFileSelect(e) {
    loadFile(e.target.files[0]);
    e.target.value = '';
  }

  function handleDragEnter(e) {
    e.preventDefault();
    if (++dragDepth === 1) {
      document.body.classList.add('drag-over');
    }
  }

  function handleDragLeave() {
    if (--dragDepth <= 0) {
      dragDepth = 0;
      document.body.classList.remove('drag-over');
    }
  }

  function handleDragOver(e) {
    e.preventDefault();
  }

  function handleDrop(e) {
    e.preventDefault();
    dragDepth = 0;
    document.body.classList.remove('drag-over');
    loadFile(e.dataTransfer.files[0]);
  }
</script>

<svelte:document
  on:dragenter={handleDragEnter}
  on:dragleave={handleDragLeave}
  on:dragover={handleDragOver}
  on:drop={handleDrop}
/>

<div class="progress-bar" style="width: {scrollProgress}%"></div>

<nav>
  <a class="nav-brand" href="#" on:click={(e) => {
    e.preventDefault();
    reset();
  }}>
    <img
      class="nav-logo"
      src="/LL-mdvu-logo-v1.png"
      alt="mdvu"
      onerror="this.style.display='none'"
    />
    <span class="nav-name">mdvu</span>
  </a>
  <span class="nav-file">{fileName}</span>
  <button
    on:click={() => fileInput?.click()}
  >
    open
  </button>
  <input
    bind:this={fileInput}
    type="file"
    accept=".md,.markdown,.txt"
    on:change={handleFileSelect}
    style="display: none"
  />
</nav>

{#if showLanding}
  <div class="landing">
    <img
      class="hero-logo"
      src="/LL-mdvu-logo-v1.png"
      alt=""
      onerror="this.style.display='none'"
    />
    <h1 class="wordmark">mdvu</h1>
    <p class="drop-hint">
      drop a .md file anywhere &nbsp;·&nbsp;
      <label for="fileinput">click to open</label>
    </p>
  </div>
{:else}
  <div class="reader">
    <article>{@html content}</article>
  </div>
{/if}

<style>
  .progress-bar {
    position: fixed;
    top: 0;
    left: 0;
    height: 2px;
    background: var(--ink);
    z-index: 999;
    transition: width 0.1s linear;
    opacity: 0;
  }

  :global(body.reading) .progress-bar {
    opacity: 1;
  }

  button {
    flex-shrink: 0;
  }
</style>
