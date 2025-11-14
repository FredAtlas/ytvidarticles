#!/usr/bin/env python3
"""
Test script to validate TAG AI Platform backend imports and structure.
"""
import sys
import os

# Add app to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Set test environment
os.environ['DATABASE_URL'] = 'postgresql://localhost:5432/test'
os.environ['REDIS_URL'] = 'redis://localhost:6379/1'
os.environ['SECRET_KEY'] = 'test-secret'
os.environ['OPENAI_API_KEY'] = 'sk-test'

print("🧪 Testing TAG AI Platform Backend Structure\n")
print("=" * 60)

test_results = []

def test_import(module_name, description):
    """Test if a module can be imported."""
    try:
        __import__(module_name)
        print(f"✅ {description}")
        test_results.append((description, True, None))
        return True
    except Exception as e:
        print(f"❌ {description}")
        print(f"   Error: {str(e)}")
        test_results.append((description, False, str(e)))
        return False

# Test imports
print("\n📦 Testing Configuration Modules:")
test_import('app.config.settings', 'Settings configuration')
test_import('app.config.database', 'Database configuration')

print("\n🔧 Testing Core Modules:")
test_import('app.core.logging', 'Logging utilities')
test_import('app.core.cache', 'Redis cache')
test_import('app.core.exceptions', 'Custom exceptions')
test_import('app.core.middleware', 'Middleware')

print("\n💾 Testing Database Models:")
test_import('app.database.models.article', 'Article model')
test_import('app.database.models.gaming', 'Gaming models')
test_import('app.database.models.content', 'Content models')
test_import('app.database.models.media', 'Media models')

print("\n📋 Testing Schemas:")
test_import('app.schemas.article', 'Article schemas')

print("\n🔄 Testing CRUD Operations:")
test_import('app.database.crud.articles', 'Article CRUD')

print("\n🌐 Testing API Routes:")
test_import('app.api.v1.router', 'API router')
test_import('app.api.v1.articles', 'Articles endpoints')

print("\n🚀 Testing Main Application:")
test_import('app.main', 'FastAPI application')

# Summary
print("\n" + "=" * 60)
print("📊 Test Summary:")
print("=" * 60)

passed = sum(1 for _, success, _ in test_results if success)
failed = sum(1 for _, success, _ in test_results if not success)
total = len(test_results)

print(f"\nTotal Tests: {total}")
print(f"✅ Passed: {passed}")
print(f"❌ Failed: {failed}")
print(f"Success Rate: {(passed/total)*100:.1f}%\n")

if failed > 0:
    print("Failed Tests:")
    for desc, success, error in test_results:
        if not success:
            print(f"  - {desc}: {error}")
    sys.exit(1)
else:
    print("🎉 All imports successful!")
    sys.exit(0)
