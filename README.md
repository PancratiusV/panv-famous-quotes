# Quotes Explorer (Inspire100)

A lightweight web application built with **Python Flask**, **Vanilla JavaScript**, **HTML5**, and **CSS3** that displays a random quote from 100 well-known quotes, with full-text search and category/author filtering.

---

## Features

- **100 Timeless Quotes**: Curated collection across *Philosophy*, *Science*, *Wisdom*, *Motivation*, *Literature*, *Leadership*, *Humor*, and *Life*.
- **Featured Random Quote**: Prominently highlights a quote with smooth transitions. Click **"New Random Quote"** or press <kbd>Space</kbd> / <kbd>R</kbd> anytime.
- **Search & Live Filtering**: Real-time debounced search by keyword or author name, combined with quick category filter pills and author dropdown.
- **Interactive Quote Grid**: Browse all matching quotes, copy to clipboard in one click, or click any card to load it directly into the featured card.
- **Clean Vanilla Architecture**: Pure vanilla JavaScript (Fetch API, DOM manipulation) with zero front-end bundlers or framework bloat.
- **REST API Endpoints**:
  - `GET /api/quotes/random`: Fetch a random quote (optionally filtered by `category` or `author`).
  - `GET /api/quotes`: Query quotes by `query`, `category`, and `author`.
  - `GET /api/categories`: List distinct categories with quote counts.
  - `GET /api/authors`: List all unique authors in alphabetical order.

---

## Project Structure

```
agy-cli-projects/
├── app.py                  # Flask web server & REST API
├── requirements.txt        # Python dependencies (Flask, pytest)
├── data/
│   └── quotes.json         # 100 curated quotes with author and category
├── static/
│   ├── css/
│   │   └── style.css       # Custom responsive modern CSS
│   └── js/
│       └── app.js          # Vanilla JavaScript application
├── templates/
│   └── index.html          # Semantic HTML5 template
└── tests/
    └── test_app.py         # Pytest automated test suite
```

---

## Getting Started

### 1. Activate Virtual Environment

```powershell
.\.venv\Scripts\Activate.ps1
```
*(Or run directly using `.\.venv\Scripts\python.exe`)*

### 2. Run the Application

```powershell
.\.venv\Scripts\python.exe app.py
```

Open your browser and navigate to:
```
http://127.0.0.1:5000
```

---

## Running Automated Tests

Run the test suite with pytest:

```powershell
.\.venv\Scripts\python.exe -m pytest -v
```
