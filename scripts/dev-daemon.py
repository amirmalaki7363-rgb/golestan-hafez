#!/usr/bin/env python3
"""
Double-fork daemon launcher for `bun run dev`.

Detaches the dev server from this shell session completely (new session,
PPID=1) so terminal/tool session cleanup cannot kill it.

After the server is up, it also WARMS the main routes: Turbopack in dev
compiles each route on first request, which made the visitor's very first
page view pay a 5-7s compile bill. Hitting the routes once right after
startup moves that cost to server boot, invisible to the user.
"""

import json
import os
import sys
import time
import urllib.request

DEV_DIR = "/home/z/my-project"
BASE = "http://localhost:3000"


def daemonize_and_run() -> None:
    # First fork: parent exits so the child is adopted by init.
    pid = os.fork()
    if pid > 0:
        sys.exit(0)

    # Child becomes session leader (loses controlling terminal).
    os.setsid()

    # Second fork: grandchild can never reacquire a controlling terminal.
    pid = os.fork()
    if pid > 0:
        # Parent of the grandchild: run the warmup, then exit.
        try:
            warm_routes()
        except Exception:
            pass
        sys.exit(0)

    os.chdir(DEV_DIR)
    # Redirect stdio away from the caller's streams.
    devnull = os.open(os.devnull, os.O_RDWR)
    os.dup2(devnull, 0)
    os.dup2(devnull, 1)
    os.dup2(devnull, 2)

    # Replace the grandchild with the dev server via bun.
    os.execvp("bun", ["bun", "run", "dev"])


def _get(path: str, timeout: int = 120) -> bytes | None:
    try:
        with urllib.request.urlopen(BASE + path, timeout=timeout) as res:
            return res.read()
    except Exception:
        return None


def warm_routes() -> None:
    """Wait for the server, then pre-compile the routes users visit first."""

    def log(msg: str) -> None:
        # Own log file: appending to dev.log fights the tee pipe's offset.
        try:
            with open(os.path.join(DEV_DIR, "warmup.log"), "a", encoding="utf-8") as f:
                f.write(f"{time.strftime('%H:%M:%S')} {msg}\n")
        except Exception:
            pass

    # 1) wait until the homepage answers (compiles «/»)
    for _ in range(90):
        body = _get("/", timeout=180)
        if body:
            break
        time.sleep(2)
    else:
        log("server never became ready")
        return
    log("GET / compiled")

    # 2) compile the product detail route with a real product slug
    data = _get("/api/products")
    slug = None
    if data:
        try:
            products = json.loads(data).get("products", [])
            if products:
                slug = products[0].get("sku")
        except Exception:
            slug = None
    if slug:
        if _get(f"/product/{urllib.request.quote(slug)}", timeout=180):
            log(f"GET /product/{slug} compiled")
    _get("/api/settings")
    _get("/api/custom-flower")
    log("warmup done")


if __name__ == "__main__":
    daemonize_and_run()
