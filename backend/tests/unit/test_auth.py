# backend/tests/unit/test_auth.py
import pytest
from jose import jwt
from backend.auth import create_access_token, verify_token

def test_create_and_verify_token():
    token = create_access_token({"sub": "summer2hjp"})
    payload = verify_token(token)
    assert payload["sub"] == "summer2hjp"
