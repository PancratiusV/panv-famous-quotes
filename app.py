import json
import os
import random
from pathlib import Path
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

DATA_FILE = Path(__file__).parent / "data" / "quotes.json"


def load_quotes():
    """Load quotes from JSON file."""
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


QUOTES = load_quotes()


@app.route("/")
def index():
    """Serve the main single-page application."""
    return render_template("index.html")


@app.route("/api/quotes/random", methods=["GET"])
def get_random_quote():
    """Return a single random quote, optionally filtered by category or author."""
    category = request.args.get("category", "").strip().lower()
    author = request.args.get("author", "").strip().lower()

    filtered = QUOTES

    if category and category != "all":
        filtered = [q for q in filtered if q["category"].lower() == category]

    if author:
        filtered = [q for q in filtered if author in q["author"].lower()]

    if not filtered:
        return jsonify({"error": "No quotes found matching criteria"}), 404

    return jsonify(random.choice(filtered))


@app.route("/api/quotes", methods=["GET"])
def get_quotes():
    """Return quotes filtered by query, category, and author."""
    query = request.args.get("query", "").strip().lower()
    category = request.args.get("category", "").strip().lower()
    author = request.args.get("author", "").strip().lower()

    results = QUOTES

    if category and category != "all":
        results = [q for q in results if q["category"].lower() == category]

    if author:
        results = [q for q in results if author in q["author"].lower()]

    if query:
        results = [
            q for q in results
            if query in q["quote"].lower() or query in q["author"].lower()
        ]

    return jsonify({
        "total": len(results),
        "quotes": results
    })


@app.route("/api/categories", methods=["GET"])
def get_categories():
    """Return a list of all distinct categories and their quote counts."""
    counts = {}
    for q in QUOTES:
        cat = q["category"]
        counts[cat] = counts.get(cat, 0) + 1

    categories = [
        {"name": cat, "count": count}
        for cat, count in sorted(counts.items())
    ]
    return jsonify({
        "total": len(categories),
        "categories": categories
    })


@app.route("/api/authors", methods=["GET"])
def get_authors():
    """Return an alphabetically sorted list of unique authors."""
    authors = sorted(list({q["author"] for q in QUOTES}))
    return jsonify({
        "total": len(authors),
        "authors": authors
    })


if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=5000)
