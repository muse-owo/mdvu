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
      stopWatching();
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
    const file = await handle.getFile();
    await loadFile(file);
    startWatching();
  }

  async function handleBrowseClick() {
    try {
      const [handle] = await window.showOpenFilePicker({
        types: [{
          description: 'Markdown',
          accept: { 'text/plain': ['.md', '.markdown', '.txt'] },
        }],
        multiple: false,
      });
      await loadFromHandle(handle);
    } catch (err) {
      if (err.name !== 'AbortError') console.error(err);
    }
  }

  // poll the handle every 500ms, re-render on change
  function startWatching() {
    let lastContent = null;
    watchInterval = setInterval(async () => {
      if (!watchHandle) return;
      try {
        const file = await watchHandle.getFile();
        const text = await file.text();
        if (text !== lastContent) {
          lastContent = text;
          content = marked.parse(text);
        }
      } catch (err) {
        console.error('watch error:', err);
        stopWatching();
      }
    }, 500);
  }

  function stopWatching() {
    if (watchInterval) {
      clearInterval(watchInterval);
      watchInterval = null;
    }
    watchHandle = null;
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape' && !showLanding) {
      stopWatching();
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

      // try to get a FileSystemFileHandle for live watching (Chrome/Edge only)
      const item = e.dataTransfer.items[0];
      if (item?.kind === 'file' && item.getAsFileSystemHandle) {
        try {
          const handle = await item.getAsFileSystemHandle();
          if (handle.kind === 'file') {
            await loadFromHandle(handle);
            return;
          }
        } catch (err) {
          console.warn('getAsFileSystemHandle failed:', err);
        }
      }
      // fallback: plain File, no live watching (Firefox, Safari)
      loadFile(e.dataTransfer.files[0]);
  }
</script>

<div class="progress-bar" style="width: {scrollProgress}%"></div>

{#if showLanding}
  <div class="landing">
    <img
      class="hero-logo"
      src="/mdvu/LL-mdvu-logo-v1.png"
      alt=""
      onerror={(e) => { e.currentTarget.style.display = 'none'; }}
    />
    <h1 class="wordmark">mdvu<span class="wolf">🐺</span></h1>
    <p class="drop-hint">
      drag+drop your .md anywhere &nbsp;·&nbsp;
      <button type="button" onclick={handleBrowseClick}>browse</button>
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
</style>
