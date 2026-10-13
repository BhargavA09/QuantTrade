#!/usr/bin/env python3
"""
Root entry point for QuantLab Python Suite.
Forwards execution to python/main.py
"""
import sys
import os

# Add python directory to sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "python"))

from main import main

if __name__ == "__main__":
    main()
