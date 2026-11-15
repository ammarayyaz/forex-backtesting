"""
QUANTFX FigCraft Design System Generator
Builds the complete institutional AI-terminal Forex Backtesting UI layout inside FigCraft.
Connects via port 7979.
"""

import sys
import json
import socket
from pathlib import Path

DEFAULT_PORT = 7979

def create_quantfx_design(host="127.0.0.1", port=DEFAULT_PORT):
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(10)
    try:
        sock.connect((host, port))
        f = sock.makefile("rwb", buffering=0)
    except Exception as e:
        print(f"FigCraft is not currently running on {host}:{port}. Run FigCraft with --control 7979 to sync design live.")
        return

    msg_id = 0
    def send(method, params=None):
        nonlocal msg_id
        msg_id += 1
        req = {"id": msg_id, "method": method, "params": params or {}}
        f.write(json.dumps(req).encode("utf-8") + b"\n")
        line = f.readline()
        return json.loads(line.decode("utf-8")) if line else None

    def execute(cmd, p=None):
        return send("engine.execute", {"command": cmd, "params": p or {}})

    print("[QUANTFX] Initializing new FigCraft canvas...")
    execute("file.new")

    # 1. Main Terminal Shell Frame (1440 x 900)
    print("[QUANTFX] Creating Terminal Shell (1440x900)...")
    res = execute("node.create", {
        "type": "frame",
        "name": "QUANTFX_Terminal_Shell",
        "x": 0,
        "y": 0,
        "width": 1440,
        "height": 900,
        "props": {
            "fill": "#060709",
            "layout": "vertical",
            "gap": 0,
            "padding": 0
        }
    })

    # 2. Top Header Navigation (1440 x 48)
    execute("node.create", {
        "type": "frame",
        "name": "Header_Nav",
        "parent": {"$ref": "QUANTFX_Terminal_Shell"},
        "width": 1440,
        "height": 48,
        "props": {
            "fill": "#090B10",
            "layout": "horizontal",
            "padding": 12,
            "gap": 16,
            "alignItems": "center"
        }
    })

    # 3. Main Body Frame (Horizontal: Chart Area + Order Console)
    execute("node.create", {
        "type": "frame",
        "name": "Main_Workspace",
        "parent": {"$ref": "QUANTFX_Terminal_Shell"},
        "width": 1440,
        "height": 628,
        "props": {
            "fill": "#060709",
            "layout": "horizontal",
            "gap": 0
        }
    })

    # 4. Chart Canvas Container (1120 x 628)
    execute("node.create", {
        "type": "frame",
        "name": "Chart_Canvas_Area",
        "parent": {"$ref": "Main_Workspace"},
        "width": 1120,
        "height": 628,
        "props": {
            "fill": "#060709",
            "layout": "vertical"
        }
    })

    # 5. Right Order Console (320 x 628)
    execute("node.create", {
        "type": "frame",
        "name": "Order_Console_Panel",
        "parent": {"$ref": "Main_Workspace"},
        "width": 320,
        "height": 628,
        "props": {
            "fill": "#0A0D15",
            "padding": 16,
            "gap": 12,
            "layout": "vertical"
        }
    })

    # 6. Bottom Analytics Deck (1440 x 224)
    execute("node.create", {
        "type": "frame",
        "name": "Analytics_Deck",
        "parent": {"$ref": "QUANTFX_Terminal_Shell"},
        "width": 1440,
        "height": 224,
        "props": {
            "fill": "#080A10",
            "padding": 12,
            "layout": "vertical",
            "gap": 8
        }
    })

    send("view.zoomToFit")
    print("[QUANTFX] FigCraft vector layout generated successfully!")
    sock.close()

if __name__ == "__main__":
    create_quantfx_design()
