/**
 * Quotes Explorer — Plain Vanilla JavaScript Application
 */

// Application State
const state = {
  currentQuote: null,
  activeCategory: 'all',
  selectedAuthor: '',
  searchQuery: '',
  categories: [],
  authors: [],
  displayedQuotes: []
};

// DOM Element References
const DOM = {
  featuredCard: document.getElementById('featured-card'),
  featuredQuote: document.getElementById('featured-quote'),
  featuredAuthor: document.getElementById('featured-author'),
  featuredCategory: document.getElementById('featured-category'),
  featuredId: document.getElementById('featured-id'),
  featuredAvatar: document.getElementById('featured-avatar'),
  randomBtn: document.getElementById('random-btn'),
  copyBtn: document.getElementById('copy-btn'),
  
  searchInput: document.getElementById('search-input'),
  clearSearchBtn: document.getElementById('clear-search-btn'),
  authorSelect: document.getElementById('author-select'),
  categoryPillsContainer: document.getElementById('category-pills-container'),
  
  quotesGrid: document.getElementById('quotes-grid'),
  resultsCount: document.getElementById('results-count'),
  randomFilteredBtn: document.getElementById('random-filtered-btn'),
  emptyState: document.getElementById('empty-state'),
  resetFiltersBtn: document.getElementById('reset-filters-btn'),
  
  toast: document.getElementById('toast')
};

/**
 * Show a toast alert notification.
 */
function showToast(message, duration = 2500) {
  DOM.toast.textContent = message;
  DOM.toast.classList.add('show');
  
  if (DOM.toast._timeout) {
    clearTimeout(DOM.toast._timeout);
  }
  
  DOM.toast._timeout = setTimeout(() => {
    DOM.toast.classList.remove('show');
  }, duration);
}

/**
 * Copy text to clipboard with fallback.
 */
async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      showToast('✓ Quote copied to clipboard!');
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      showToast('✓ Quote copied to clipboard!');
    }
  } catch (err) {
    showToast('Failed to copy quote to clipboard');
  }
}

/**
 * Render the featured quote card with smooth transition.
 */
function displayFeaturedQuote(quote) {
  state.currentQuote = quote;
  
  DOM.featuredQuote.classList.add('fade-out');
  
  setTimeout(() => {
    DOM.featuredQuote.textContent = `“${quote.quote}”`;
    DOM.featuredAuthor.textContent = quote.author;
    DOM.featuredCategory.textContent = quote.category;
    DOM.featuredId.textContent = `Quote #${quote.id}`;
    DOM.featuredAvatar.textContent = quote.author.charAt(0).toUpperCase();
    
    DOM.featuredQuote.classList.remove('fade-out');
  }, 150);
}

/**
 * Fetch a random quote from backend API.
 */
async function fetchRandomQuote(category = '', author = '') {
  try {
    const params = new URLSearchParams();
    if (category && category !== 'all') params.append('category', category);
    if (author) params.append('author', author);

    const url = `/api/quotes/random${params.toString() ? '?' + params.toString() : ''}`;
    const res = await fetch(url);
    
    if (!res.ok) {
      throw new Error('No quotes available');
    }
    
    const quote = await res.json();
    displayFeaturedQuote(quote);
  } catch (err) {
    console.error('Error fetching random quote:', err);
    showToast('Could not load random quote');
  }
}

/**
 * Fetch and render all category filter pills.
 */
async function loadCategories() {
  try {
    const res = await fetch('/api/categories');
    const data = await res.json();
    state.categories = data.categories;
    
    const totalCount = state.categories.reduce((sum, c) => sum + c.count, 0);

    let html = `
      <button class="pill-btn ${state.activeCategory === 'all' ? 'active' : ''}" data-category="all">
        All <span class="pill-count">(${totalCount})</span>
      </button>
    `;

    state.categories.forEach(cat => {
      const isActive = state.activeCategory.toLowerCase() === cat.name.toLowerCase();
      html += `
        <button class="pill-btn ${isActive ? 'active' : ''}" data-category="${cat.name.toLowerCase()}">
          ${cat.name} <span class="pill-count">(${cat.count})</span>
        </button>
      `;
    });

    DOM.categoryPillsContainer.innerHTML = html;

    // Attach click listeners to pill buttons
    DOM.categoryPillsContainer.querySelectorAll('.pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const cat = btn.getAttribute('data-category');
        selectCategory(cat);
      });
    });
  } catch (err) {
    console.error('Error loading categories:', err);
  }
}

/**
 * Fetch and populate author dropdown.
 */
async function loadAuthors() {
  try {
    const res = await fetch('/api/authors');
    const data = await res.json();
    state.authors = data.authors;

    const optionsHtml = ['<option value="">All Authors</option>']
      .concat(state.authors.map(a => `<option value="${a}">${a}</option>`))
      .join('');

    DOM.authorSelect.innerHTML = optionsHtml;
  } catch (err) {
    console.error('Error loading authors:', err);
  }
}

/**
 * Render grid of filtered quotes.
 */
function renderQuotesGrid(quotes) {
  state.displayedQuotes = quotes;
  DOM.quotesGrid.innerHTML = '';

  if (quotes.length === 0) {
    DOM.quotesGrid.style.display = 'none';
    DOM.emptyState.style.display = 'block';
    DOM.resultsCount.textContent = 'No quotes found';
    DOM.randomFilteredBtn.style.display = 'none';
    return;
  }

  DOM.quotesGrid.style.display = 'grid';
  DOM.emptyState.style.display = 'none';
  DOM.randomFilteredBtn.style.display = 'inline-flex';
  DOM.resultsCount.textContent = `Showing ${quotes.length} quote${quotes.length === 1 ? '' : 's'}`;

  const fragment = document.createDocumentFragment();

  quotes.forEach(quote => {
    const card = document.createElement('article');
    card.className = 'grid-card';
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `Select quote by ${quote.author}`);

    card.innerHTML = `
      <div class="grid-card-top">
        <span class="category-badge">${quote.category}</span>
        <span class="quote-id-badge">#${quote.id}</span>
      </div>
      <blockquote class="grid-card-quote">“${quote.quote}”</blockquote>
      <div class="grid-card-bottom">
        <cite class="grid-author">
          <span style="opacity: 0.6;">—</span> ${quote.author}
        </cite>
        <div class="grid-actions">
          <button class="icon-btn copy-card-btn" title="Copy this quote" data-id="${quote.id}">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
        </div>
      </div>
    `;

    // Click card to display in featured hero
    card.addEventListener('click', (e) => {
      if (e.target.closest('.copy-card-btn')) return;
      displayFeaturedQuote(quote);
      DOM.featuredCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    // Enter/Space key support for card selection
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        displayFeaturedQuote(quote);
        DOM.featuredCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });

    // Individual copy button on card
    const copyBtn = card.querySelector('.copy-card-btn');
    copyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      copyToClipboard(`“${quote.quote}” — ${quote.author}`);
    });

    fragment.appendChild(card);
  });

  DOM.quotesGrid.appendChild(fragment);
}

/**
 * Fetch quotes based on current active filters.
 */
async function filterQuotes() {
  try {
    const params = new URLSearchParams();
    if (state.searchQuery) params.append('query', state.searchQuery);
    if (state.activeCategory && state.activeCategory !== 'all') params.append('category', state.activeCategory);
    if (state.selectedAuthor) params.append('author', state.selectedAuthor);

    const url = `/api/quotes${params.toString() ? '?' + params.toString() : ''}`;
    const res = await fetch(url);
    const data = await res.json();
    
    renderQuotesGrid(data.quotes);
  } catch (err) {
    console.error('Error filtering quotes:', err);
    showToast('Failed to filter quotes');
  }
}

/**
 * Handle category selection.
 */
function selectCategory(category) {
  state.activeCategory = category;
  
  // Update pills visual state
  DOM.categoryPillsContainer.querySelectorAll('.pill-btn').forEach(btn => {
    const cat = btn.getAttribute('data-category');
    if (cat === category) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  filterQuotes();
}

/**
 * Debounce helper.
 */
function debounce(func, delay = 250) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), delay);
  };
}

/**
 * Reset all search and category filters.
 */
function resetAllFilters() {
  state.searchQuery = '';
  state.activeCategory = 'all';
  state.selectedAuthor = '';
  
  DOM.searchInput.value = '';
  DOM.clearSearchBtn.style.display = 'none';
  DOM.authorSelect.value = '';
  
  DOM.categoryPillsContainer.querySelectorAll('.pill-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-category') === 'all');
  });

  filterQuotes();
}

/**
 * Attach Event Listeners
 */
function setupEventListeners() {
  // New random quote button
  DOM.randomBtn.addEventListener('click', () => {
    fetchRandomQuote(state.activeCategory, state.selectedAuthor);
  });

  // Featured copy button
  DOM.copyBtn.addEventListener('click', () => {
    if (state.currentQuote) {
      copyToClipboard(`“${state.currentQuote.quote}” — ${state.currentQuote.author}`);
    }
  });

  // Search input debounced
  const debouncedSearch = debounce(() => {
    state.searchQuery = DOM.searchInput.value.trim();
    DOM.clearSearchBtn.style.display = state.searchQuery ? 'block' : 'none';
    filterQuotes();
  }, 200);

  DOM.searchInput.addEventListener('input', debouncedSearch);

  // Clear search input button
  DOM.clearSearchBtn.addEventListener('click', () => {
    DOM.searchInput.value = '';
    state.searchQuery = '';
    DOM.clearSearchBtn.style.display = 'none';
    filterQuotes();
    DOM.searchInput.focus();
  });

  // Author select change
  DOM.authorSelect.addEventListener('change', (e) => {
    state.selectedAuthor = e.target.value;
    filterQuotes();
  });

  // Random from current filtered results
  DOM.randomFilteredBtn.addEventListener('click', () => {
    if (state.displayedQuotes.length > 0) {
      const randomIndex = Math.floor(Math.random() * state.displayedQuotes.length);
      const chosen = state.displayedQuotes[randomIndex];
      displayFeaturedQuote(chosen);
      DOM.featuredCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });

  // Reset filters button in empty state
  DOM.resetFiltersBtn.addEventListener('click', resetAllFilters);

  // Global Keyboard Shortcuts
  document.addEventListener('keydown', (e) => {
    // Ignore if typing in an input, textarea, or select
    const tag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

    if (e.code === 'Space' || e.key === 'r' || e.key === 'R') {
      e.preventDefault();
      fetchRandomQuote(state.activeCategory, state.selectedAuthor);
    }
  });
}

/**
 * Initialize Application
 */
async function init() {
  setupEventListeners();
  
  // Parallel initial data load
  await Promise.all([
    fetchRandomQuote(),
    loadCategories(),
    loadAuthors(),
    filterQuotes()
  ]);
}

// Run on DOM content loaded
document.addEventListener('DOMContentLoaded', init);
