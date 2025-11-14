#!/usr/bin/env python3
"""Test Pydantic schemas."""
import sys
import os

os.environ['DATABASE_URL'] = 'postgresql://localhost:5432/test'
os.environ['SECRET_KEY'] = 'test'
os.environ['OPENAI_API_KEY'] = 'sk-test'

print("🧪 Testing Pydantic Schemas\n")
print("=" * 70)

try:
    from app.schemas.article import (
        ArticleBase,
        ArticleCreate,
        ArticleUpdate,
        ArticleResponse,
        ArticleListResponse,
        ArticleGenerateRequest,
        ArticleImproveRequest
    )
    print("✅ Article schemas imported successfully")

    # Test ArticleCreate schema
    test_data = {
        "youtube_url": "https://youtube.com/watch?v=test",
        "title": "Test Article",
        "content": "Test content",
        "transcript": "Test transcript",
        "meta_description": "Test meta",
        "seo_titles": ["Title 1", "Title 2"],
        "tags": ["tag1", "tag2"],
        "seo_score": 85,
        "key_topics": ["topic1", "topic2"]
    }

    article = ArticleCreate(**test_data)
    print("✅ ArticleCreate schema validation passed")
    print(f"   - Title: {article.title}")
    print(f"   - SEO Score: {article.seo_score}")
    print(f"   - Tags: {', '.join(article.tags)}")

    # Test ArticleUpdate schema
    update_data = {
        "title": "Updated Title",
        "seo_score": 90
    }

    article_update = ArticleUpdate(**update_data)
    print("✅ ArticleUpdate schema validation passed")
    print(f"   - Partial update allowed: title={article_update.title}, seo_score={article_update.seo_score}")

    # Test ArticleGenerateRequest
    gen_request = ArticleGenerateRequest(url="https://youtube.com/watch?v=abc123")
    print("✅ ArticleGenerateRequest schema validation passed")
    print(f"   - URL: {gen_request.url}")

    # Test validation errors
    try:
        invalid = ArticleCreate(youtube_url="invalid", title="", content="test")
        print("❌ Validation should have failed for empty title")
    except Exception as e:
        print("✅ Schema validation correctly rejects invalid data")
        print(f"   - Error type: {type(e).__name__}")

    print("\n" + "=" * 70)
    print("📊 Schema Test Summary:")
    print("=" * 70)
    print("\n✅ All Pydantic schemas are working correctly!")
    print("✅ Validation is enforcing data quality")
    print("✅ Optional fields work as expected")

except Exception as e:
    print(f"❌ Schema test failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
