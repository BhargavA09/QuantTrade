#!/usr/bin/env python3
"""
=============================================================================
QuantLab Institutional Python Backend Server (Symlinked / Mirrored in python/server.py)
=============================================================================
Forwards directly to backend/server.py
=============================================================================
"""
import sys
import os

BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from server import run_python_backend

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="QuantLab Python Backend Server")
    parser.add_argument("--port", type=int, default=5050, help="Port to listen on (default: 5050)")
    parser.add_argument("--host", type=str, default="0.0.0.0", help="Host interface (default: 0.0.0.0)")
    args = parser.parse_args()
    run_python_backend(port=args.port, host=args.host)
