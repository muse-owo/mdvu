<script>
  import { onMount, tick } from 'svelte';
  import { marked, Renderer } from 'marked';
  import hljs from 'highlight.js';
  import 'highlight.js/styles/github-dark.css';

  let fileInput = $state();
  let content = $state('');
  let fileName = $state('');
  let showLanding = $state(true);
  let dragDepth = 0;
  let scrollProgress = $state(0);

  // setup marked renderer with highlight.js
  const renderer = new Renderer();
  renderer.code = function(token) {
    const code = typeof token === 'object' ? token.text : token;
    const lang = typeof token === 'object' ? token.lang : '';
    const l = lang && hljs.getLanguage(lang) ? lang : 'plaintext';
    return `<pre><code class="hljs">${hljs.highlight(code, { language: l }).value}</code></pre>`;
  };
  marked.use({ renderer });

  onMount(() => {

    // scroll progress
    window.addEventListener('scroll', updateScrollProgress);

    // drag and drop — attached here for reliable Svelte 5 / Astro SSR hydration
    document.addEventListener('dragenter', handleDragEnter);
    document.addEventListener('dragleave', handleDragLeave);
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('scroll', updateScrollProgress);
      document.removeEventListener('dragenter', handleDragEnter);
      document.removeEventListener('dragleave', handleDragLeave);
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('drop', handleDrop);
    };
  });

  function updateScrollProgress() {
    if (!showLanding) {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      scrollProgress = scrollHeight > 0 ? (window.scrollY / scrollHeight) * 100 : 0;
    }
  }

  async function loadFile(file) {
    if (!file) return;
    try {
      const text = await file.text();
      console.log('[mdvu] file read ok, parsing...');
      content = marked.parse(text);
      fileName = file.name;
      showLanding = false;
      await tick();
      document.title = `mdvu — ${file.name}`;
      document.body.classList.add('reading');
      window.scrollTo(0, 0);
    } catch (err) {
      console.error('[mdvu] loadFile error:', err);
    }
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

  function openFileInput() {
    console.log('[mdvu] openFileInput, fileInput=', fileInput);
    const el = fileInput ?? document.getElementById('fileinput');
    if (el) el.click();
    else console.error('[mdvu] no file input found');
  }

  function handleLogoClick(e) {
    e.preventDefault();
    reset();
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

<div class="progress-bar" style="width: {scrollProgress}%"></div>

<nav>
  <a class="nav-brand" href="#" onclick={handleLogoClick}>
    <img
      class="nav-logo"
      src="/LL-mdvu-logo-v1.png"
      alt="mdvu"
      onerror={(e) => { e.currentTarget.style.display = 'none'; }}
    />
    <span class="nav-name">mdvu</span>
  </a>
  <span class="nav-file">{fileName}</span>
  <button
    onclick={openFileInput}
  >
    open
  </button>
    <input
        bind:this={fileInput}
        id="fileinput"
        type="file"
        accept=".md,.markdown,.txt"
        onchange={handleFileSelect}
        style="display: none"
    />
</nav>

{#if showLanding}
  <div class="landing">
    <img
      class="hero-logo"
      src="/LL-mdvu-logo-v1.png"
      alt=""
      onerror={(e) => { e.currentTarget.style.display = 'none'; }}
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
