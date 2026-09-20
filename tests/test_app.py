import json
from pathlib import Path
import pytest
from app import app, QUOTES, DATA_FILE


@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


def test_quotes_dataset_integrity():
    """Verify data/quotes.json contains 100 valid, unique quotes."""
    assert DATA_FILE.exists()
    assert len(QUOTES) == 100

    ids = set()
    for q in QUOTES:
        assert "id" in q and isinstance(q["id"], int)
        assert "quote" in q and len(q["quote"].strip()) > 0
        assert "author" in q and len(q["author"].strip()) > 0
        assert "category" in q and len(q["category"].strip()) > 0
        assert q["id"] not in ids, f"Duplicate ID found: {q['id']}"
        ids.add(q["id"])

    assert ids == set(range(1, 101))


def test_index_route(client):
    """Verify index route serves HTML with title."""
    response = client.get("/")
    assert response.status_code == 200
    assert b"Quotes Explorer" in response.data
    assert "text/html" in response.content_type


def test_api_random_quote(client):
    """Verify random quote endpoint returns a valid quote."""
    response = client.get("/api/quotes/random")
    assert response.status_code == 200
    data = response.get_json()
    assert "id" in data
    assert "quote" in data
    assert "author" in data
    assert "category" in data


def test_api_random_quote_filtered_by_category(client):
    """Verify random quote filtered by category returns matching category."""
    response = client.get("/api/quotes/random?category=Science")
    assert response.status_code == 200
    data = response.get_json()
    assert data["category"] == "Science"


def test_api_random_quote_filtered_by_author(client):
    """Verify random quote filtered by author returns matching author."""
    response = client.get("/api/quotes/random?author=Einstein")
    assert response.status_code == 200
    data = response.get_json()
    assert "Albert Einstein" in data["author"]


def test_api_random_quote_not_found(client):
    """Verify random quote with non-existent filter returns 404."""
    response = client.get("/api/quotes/random?category=nonexistentcategory123")
    assert response.status_code == 404
    data = response.get_json()
    assert "error" in data


def test_api_quotes_all(client):
    """Verify /api/quotes returns all 100 quotes by default."""
    response = client.get("/api/quotes")
    assert response.status_code == 200
    data = response.get_json()
    assert data["total"] == 100
    assert len(data["quotes"]) == 100


def test_api_quotes_filter_by_query(client):
    """Verify searching by text keyword matches quotes."""
    response = client.get("/api/quotes?query=fear")
    assert response.status_code == 200
    data = response.get_json()
    assert data["total"] > 0
    for q in data["quotes"]:
        assert "fear" in q["quote"].lower() or "fear" in q["author"].lower()


def test_api_quotes_filter_by_category(client):
    """Verify category filtering."""
    response = client.get("/api/quotes?category=Philosophy")
    assert response.status_code == 200
    data = response.get_json()
    assert data["total"] > 0
    for q in data["quotes"]:
        assert q["category"].lower() == "philosophy"


def test_api_quotes_filter_by_author(client):
    """Verify author filtering."""
    response = client.get("/api/quotes?author=Mandela")
    assert response.status_code == 200
    data = response.get_json()
    assert data["total"] >= 2
    for q in data["quotes"]:
        assert "mandela" in q["author"].lower()


def test_api_categories(client):
    """Verify /api/categories returns categories and correct sum."""
    response = client.get("/api/categories")
    assert response.status_code == 200
    data = response.get_json()
    assert "categories" in data
    assert data["total"] > 0
    total_count = sum(c["count"] for c in data["categories"])
    assert total_count == 100


def test_api_authors(client):
    """Verify /api/authors returns sorted author list."""
    response = client.get("/api/authors")
    assert response.status_code == 200
    data = response.get_json()
    assert "authors" in data
    authors = data["authors"]
    assert len(authors) > 20
    assert authors == sorted(authors)


def test_static_assets(client):
    """Verify static CSS and JS are served properly."""
    css_res = client.get("/static/css/style.css")
    assert css_res.status_code == 200
    assert "text/css" in css_res.content_type

    js_res = client.get("/static/js/app.js")
    assert js_res.status_code == 200
    assert "javascript" in js_res.content_type


def test_export_csv_all(client):
    """Verify CSV export returns valid CSV content for all quotes."""
    res = client.get("/api/quotes/export")
    assert res.status_code == 200
    assert "text/csv" in res.content_type
    assert "attachment; filename=quotes.csv" in res.headers["Content-Disposition"]
    lines = res.data.decode("utf-8-sig").strip().splitlines()
    assert len(lines) == 101  # Header + 100 quotes
    assert lines[0] == "ID,Quote,Author,Category"


def test_export_csv_filtered(client):
    """Verify CSV export respects category and author filters."""
    res = client.get("/api/quotes/export?category=Science")
    assert res.status_code == 200
    lines = res.data.decode("utf-8-sig").strip().splitlines()
    assert len(lines) > 1
    assert lines[0] == "ID,Quote,Author,Category"
    # All rows should contain Science
    for row in lines[1:]:
        assert "Science" in row

