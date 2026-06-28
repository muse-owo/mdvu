<script>
  import { onMount, tick } from 'svelte';
  import { marked, Renderer } from 'marked';
  import hljs from 'highlight.js';
  import 'highlight.js/styles/github-dark.css';

  let content = $state('');
  let showLanding = $state(true);
  let dragDepth = 0;
  let scrollProgress = $state(0);
  let watchHandle = null;
  let watchInterval = null;
  let lastModified = 0;

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
    window.addEventListener('scroll', updateScrollProgress);
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('dragenter', handleDragEnter);
    document.addEventListener('dragleave', handleDragLeave);
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('scroll', updateScrollProgress);
      window.removeEventListener('keydown', handleKeyDown);
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
      content = marked.parse(text);
      showLanding = false;
      await tick();
      document.title = `mdvu | ${file.name}`;
      document.body.classList.add('reading');
      window.scrollTo(0, 0);
    } catch (err) {
      console.error(err);
    }
  }

    // loads a file from a FileSystemFileHandle and starts watching it
  async function loadFromHandle(handle) {
    stopWatching();                          // clear any previous watcher first
    watchHandle = handle;
    const file = await handle.getFile();    // get current snapshot
    lastModified = file.lastModified;
    await loadFile(file);                   // render it
    startWatching();                        // then begin polling
  }

  async function handleBrowseClick(e) {
    if (!('showOpenFilePicker' in window)) return;  // no api, let label trigger the input

    e.preventDefault();

    try {
      const [handle] = await window.ShowOpenFilePicker({
        types: [{
          description: 'Markdown';
          accept: { 'text/plain':['.md', '.markdown', '.txt']},
        }],
        await loadFromHandle(handle);   // loads+starts watchin
      } catch (err) {
        if (err.name !== 'AbortError') console.error(err);  // AbortError = user cancelled; ignore
      }
    )
    }
    
  }

  // poll the handle every 500ms, re-render on change
  function startWatching() {
    watchInterval = setInterval(async () => {
      if (!watchHandle) return;
      try {
        const file = await watchHandle.getFile();
        if (file.lastModified !== lastModified) {
          lastModified = file.lastModified;
          const text = await file.text();
          content = marked.parse(text);     // $state update - Svelte re-renders
        }
      } catch {
        stopWatching();                     // handle went stale (file deleted/moved)
      }
    }, 500);
  }

  // clean up err'tang
  function stopWatching() {
    if (watchInterval) {
      clearInterval(watchInterval);
      watchInterval = null;
    }
    watchHandle = null;
    lastModified = 0;
  }

  function handleFileSelect(e) {
    loadFile(e.target.files[0]);
    e.target.value = '';
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape' && !showLanding) {
      content = '';
      showLanding = true;
      document.title = 'mdvu';
      document.body.classList.remove('reading');
      scrollProgress = 0;
    }
  }

  function handleDragEnter(e) {
    e.preventDefault();
    if (++dragDepth === 1) document.body.classList.add('drag-over');
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

  async function handleDrop(e) {
      e.preventDefault();
      dragDepth = 0;
      document.body.classList.remove('drag-over');

      // try to get a FlieSystemFileHandle for live watching
      const item = e.dataTransfer.items(0)
      if (item?.kind === 'file' && item.getAsFileSystemHandle) {
        try {
            const handle = await item.getAsFileSystemHandle();
            if (handle.kind === 'file') {
              await loadFromHandle(handle);
              return;
            }
        } catch { /* fall through */ }
      }
      // fallback: plain File, no watching (old  browser, Safari, or weird drop source)
      loadFile(e.dataTransfer.files[0]);
  }
</script>

<div class="progress-bar" style="width: {scrollProgress}%"></div>

{#if showLanding}
  <div class="landing">
    <img
      class="hero-logo"
      src="./LL-mdvu-logo-v1.png"
      alt=""
      onerror={(e) => { e.currentTarget.style.display = 'none'; }}
    />
    <h1 class="wordmark">mdvu<span class="wolf">🐺</span></h1>
    <p class="drop-hint">
      drag+drop your .md anywhere &nbsp;·&nbsp;
      <label for="fileinput" onclick={handleBrowseClick}>browse</label>
    </p>
    <input
      id="fileinput"
      type="file"
      accept=".md,.markdown,.txt"
      onchange={handleFileSelect}
      style="display: none"
    />
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
</style>
