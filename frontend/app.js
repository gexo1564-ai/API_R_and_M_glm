/**
 * app.js — Rick and Morty Explorer
 * Comunicación con backend propio, debounce, paginación, estados de UI.
 */

(() => {
  'use strict';

  // ===== Config =====
  const API_BASE = 'http://localhost:5001';
  const DEBOUNCE_MS = 300;

  // ===== DOM refs =====
  const searchInput   = document.getElementById('search-input');
  const searchSpinner = document.getElementById('search-spinner');
  const stateLoading  = document.getElementById('state-loading');
  const stateError    = document.getElementById('state-error');
  const stateEmpty    = document.getElementById('state-empty');
  const errorMessage  = document.getElementById('error-message');
  const btnRetry      = document.getElementById('btn-retry');
  const grid          = document.getElementById('character-grid');
  const pagination    = document.getElementById('pagination');
  const btnPrev       = document.getElementById('btn-prev');
  const btnNext       = document.getElementById('btn-next');
  const pageInfo      = document.getElementById('page-info');

  // ===== State =====
  let currentPage = 1;
  let totalPages  = 1;
  let currentName = '';
  let debounceTimer = null;

  // ===== Helpers: show / hide states =====
  function showOnly(state) {
    [stateLoading, stateError, stateEmpty].forEach(el => el.classList.add('hidden'));
    grid.innerHTML = '';
    pagination.classList.add('hidden');
    if (state) state.classList.remove('hidden');
  }

  function showGrid() {
    [stateLoading, stateError, stateEmpty].forEach(el => el.classList.add('hidden'));
    pagination.classList.remove('hidden');
  }

  // ===== Fetch characters =====
  async function fetchCharacters({ name = '', page = 1 } = {}) {
    currentName = name;
    currentPage = page;

    // UI: loading
    showOnly(stateLoading);
    searchInput.disabled = true;
    searchSpinner.classList.add('active');

    try {
      const params = new URLSearchParams();
      if (name) params.set('name', name);
      params.set('page', String(page));

      // ✅ Fetch al backend propio, NUNCA a rickandmortyapi.com
      const res = await fetch(`${API_BASE}/characters?${params}`);

      if (res.status === 404) {
        showOnly(stateEmpty);
        return;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Error ${res.status}`);
      }

      const json = await res.json();

      totalPages  = json.total_pages || 1;
      currentPage = json.page || 1;

      renderGrid(json.data);
      renderPagination();
      showGrid();

    } catch (err) {
      errorMessage.textContent = err.message || 'No se pudo conectar con el servidor.';
      showOnly(stateError);
    } finally {
      searchInput.disabled = false;
      searchSpinner.classList.remove('active');
      searchInput.focus();
    }
  }

  // ===== Render character cards =====
  function renderGrid(characters) {
    grid.innerHTML = characters.map(c => {
      const statusClass = c.status
        ? `card__status--${c.status.toLowerCase()}`
        : 'card__status--unknown';

      return `
        <article class="card">
          <div class="card__img-wrapper">
            <img class="card__img" src="${c.image}" alt="${c.name}" loading="lazy" />
            <span class="card__status ${statusClass}">
              <span class="card__status-dot"></span>
              ${c.status || 'Unknown'}
            </span>
            <span class="card__episodes">${c.episode_count} ep</span>
          </div>
          <div class="card__body">
            <h2 class="card__name" title="${c.name}">${c.name}</h2>
            <div class="card__meta">
              <span>🧬 ${c.species}</span>
              <span>🌍 ${c.location?.name || 'Unknown'}</span>
            </div>
          </div>
        </article>`;
    }).join('');
  }

  // ===== Render pagination =====
  function renderPagination() {
    pageInfo.textContent = `${currentPage} / ${totalPages}`;
    btnPrev.disabled = currentPage <= 1;
    btnNext.disabled = currentPage >= totalPages;
  }

  // ===== Events =====
  // Debounce search
  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      fetchCharacters({ name: e.target.value, page: 1 });
    }, DEBOUNCE_MS);
  });

  // Pagination
  btnPrev.addEventListener('click', () => {
    if (currentPage > 1) {
      fetchCharacters({ name: currentName, page: currentPage - 1 });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  btnNext.addEventListener('click', () => {
    if (currentPage < totalPages) {
      fetchCharacters({ name: currentName, page: currentPage + 1 });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  // Retry
  btnRetry.addEventListener('click', () => {
    fetchCharacters({ name: currentName, page: currentPage });
  });

  // ===== Init =====
  fetchCharacters({ name: '', page: 1 });
})();
