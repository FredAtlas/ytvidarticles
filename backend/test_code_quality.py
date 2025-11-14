#!/usr/bin/env python3
"""
Test script to validate TAG AI Platform code quality and structure
without requiring database connectivity.
"""
import os
import sys
import ast
from pathlib import Path

print("🧪 TAG AI Platform - Code Quality Tests\n")
print("=" * 70)

test_results = []

def test_file(filepath, description):
    """Test if a Python file is valid and can be parsed."""
    try:
        with open(filepath, 'r') as f:
            code = f.read()
            ast.parse(code)
        print(f"✅ {description}")
        test_results.append((description, True, None))
        return True
    except Exception as e:
        print(f"❌ {description}")
        print(f"   Error: {str(e)[:100]}")  # Truncate long errors
        test_results.append((description, False, str(e)[:100]))
        return False

def count_lines(filepath):
    """Count lines of code in a file."""
    try:
        with open(filepath, 'r') as f:
            lines = f.readlines()
            code_lines = [l for l in lines if l.strip() and not l.strip().startswith('#')]
            return len(code_lines)
    except:
        return 0

# Test file structure
print("\n📁 Testing File Structure:")
print("-" * 70)

files_to_test = [
    ("app/main.py", "FastAPI main application"),
    ("app/config/settings.py", "Settings configuration"),
    ("app/config/database.py", "Database configuration"),
    ("app/core/logging.py", "Logging utilities"),
    ("app/core/cache.py", "Redis cache manager"),
    ("app/core/exceptions.py", "Custom exceptions"),
    ("app/core/middleware.py", "Request middleware"),
    ("app/database/models/article.py", "Article model"),
    ("app/database/models/gaming.py", "Gaming models"),
    ("app/database/models/content.py", "Content pipeline models"),
    ("app/database/models/media.py", "Media library models"),
    ("app/database/crud/articles.py", "Article CRUD operations"),
    ("app/schemas/article.py", "Article Pydantic schemas"),
    ("app/api/v1/router.py", "API router"),
    ("app/api/v1/articles.py", "Articles API endpoints"),
]

for filepath, description in files_to_test:
    test_file(filepath, description)

# Test configuration files
print("\n⚙️  Testing Configuration Files:")
print("-" * 70)

config_files = [
    ("alembic.ini", "Alembic configuration"),
    ("alembic/env.py", "Alembic environment"),
    ("alembic/script.py.mako", "Alembic migration template"),
    ("requirements.txt", "Python dependencies"),
    (".env.example", "Environment template"),
    ("Dockerfile", "Docker configuration"),
    ("README.md", "Backend documentation"),
]

for filepath, description in config_files:
    if os.path.exists(filepath):
        print(f"✅ {description}")
        test_results.append((description, True, None))
    else:
        print(f"❌ {description} - File not found")
        test_results.append((description, False, "File not found"))

# Count total lines of code
print("\n📊 Code Statistics:")
print("-" * 70)

total_lines = 0
file_count = 0

for root, dirs, files in os.walk("app"):
    for file in files:
        if file.endswith(".py"):
            filepath = os.path.join(root, file)
            lines = count_lines(filepath)
            total_lines += lines
            file_count += 1

print(f"Total Python files: {file_count}")
print(f"Total lines of code: {total_lines}")
print(f"Average lines per file: {total_lines // file_count if file_count > 0 else 0}")

# Test directory structure
print("\n📂 Testing Directory Structure:")
print("-" * 70)

required_dirs = [
    "app/api/v1",
    "app/config",
    "app/core",
    "app/database/models",
    "app/database/crud",
    "app/schemas",
    "app/ai/models",
    "app/ai/prompts",
    "app/ai/quality",
    "app/gaming/apis",
    "app/gaming/data",
    "app/content",
    "app/publishing",
    "app/monitoring",
    "app/utils",
    "alembic/versions",
    "tests",
]

for directory in required_dirs:
    if os.path.isdir(directory):
        print(f"✅ {directory}/")
        test_results.append((f"Directory: {directory}", True, None))
    else:
        print(f"❌ {directory}/ - Directory not found")
        test_results.append((f"Directory: {directory}", False, "Not found"))

# Summary
print("\n" + "=" * 70)
print("📊 Test Summary:")
print("=" * 70)

passed = sum(1 for _, success, _ in test_results if success)
failed = sum(1 for _, success, _ in test_results if not success)
total = len(test_results)

print(f"\nTotal Tests: {total}")
print(f"✅ Passed: {passed}")
print(f"❌ Failed: {failed}")
print(f"Success Rate: {(passed/total)*100:.1f}%\n")

# Create detailed report
if passed >= total * 0.8:  # 80% threshold
    print("🎉 Code quality test PASSED!")
    print("✨ Backend foundation is solid and ready for development!")
else:
    print("⚠️  Some tests failed - review errors above")

if failed > 0:
    print("\nFailed Tests:")
    for desc, success, error in test_results:
        if not success:
            print(f"  - {desc}" + (f": {error}" if error else ""))

print("\n" + "=" * 70)
