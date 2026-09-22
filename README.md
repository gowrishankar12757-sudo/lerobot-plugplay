# Get Set Robotics — LeRobot SO101 Action Graph

A visual, block-based front end for [LeRobot](https://github.com/huggingface/lerobot) aimed at someone
setting up an SO-101 arm for the first time. Three kinds of blocks, run in order, wired together like
connectors on a breadboard:

1. **Install Dependencies** — sets up LeRobot's Python environment + the SO-101 motor driver.
2. **Calibrate** — one block per physical arm. Wire a detected USB device into it, then run calibration.
3. **Teleoperate** — wire in one calibrated Leader arm + one calibrated Follower arm, then drive the
   follower live.

It does not reimplement any of LeRobot's hardware logic. Every block runs the real `lerobot-calibrate` /
`lerobot-teleoperate` CLI commands inside a real pseudo-terminal, streamed live into the browser (via
`xterm.js`), so the exact interactive prompts ("move the arm to the middle and press ENTER…") show up
and work normally. The node graph (built with React Flow) only decides *when* a block is allowed to run —
you can't calibrate before wiring in a port, and you can't teleoperate before both arms are calibrated.

## Getting started (new machine, nothing installed yet)

You only need **git**, **Python 3.10+**, and **Node.js 18+** installed system-wide — LeRobot itself gets
cloned and installed for you by the app.

```bash
git clone https://github.com/gowrishankar12757-sudo/lerobot-plugplay.git
cd lerobot-plugplay
./start.sh
```

`start.sh` sets up its own backend venv and frontend `node_modules` on first run (takes a minute), then
prints two URLs. Open **http://127.0.0.1:5173** in your browser.

By default LeRobot itself gets cloned to `~/lerobot`. To use a different location (e.g. you already have
a LeRobot checkout somewhere), stop `start.sh` and re-run with:

```bash
LEROBOT_REPO_PATH=/path/to/lerobot ./start.sh
```

## Walkthrough

1. **Install Dependencies** block is on the canvas already. Click **Install now**. First run this clones
   LeRobot itself, then installs its Python environment and the SO-101 (Feetech) motor driver — watch it
   happen live in the block's terminal, and wait for the checklist to go green.
2. Plug an arm's USB cable in. It appears at the top as a **detected USB device**.
3. Click **+ Calibrate block**, pick its role (Leader/Follower), give it a name (e.g. `follower1`), and
   pick its port from the block's own **Port** dropdown (or drag a wire from a USB device block into it
   instead — either way works). Click **Start calibration** and follow the prompts in the embedded
   terminal (or use the Enter / Ctrl+C shortcut buttons).
4. Repeat step 2–3 for the other arm (one Leader, one Follower).
5. Click **+ Teleoperate block**, wire the Leader calibrate block into its top input and the Follower
   calibrate block into its bottom input, then **Start teleoperation**.

Calibration files already on disk (`~/.cache/huggingface/lerobot/calibration/...`) are detected
automatically — you don't have to recalibrate an arm that's already set up, just pick/wire its port in and
the Teleoperate block will treat it as ready.

## Troubleshooting

- **`Permission denied: '/dev/ttyACM0'`** (Linux) — your user isn't in the `dialout` group yet, which owns
  serial ports. Fix once, permanently:
  ```bash
  sudo usermod -aG dialout $USER
  ```
  Then **log out and back in** (group membership only applies to new sessions) and re-run `./start.sh`.
- **ffmpeg / git-lfs missing** — the Install block's checklist will flag these. They're only needed for
  recording camera datasets later, not for calibration/teleoperation, but install them when you see the
  warning: `sudo apt install ffmpeg git-lfs` (Debian/Ubuntu) or your distro's equivalent.
- **A block won't unlock ("🔒 ...")** — the banner tells you exactly what's missing (finish Install,
  pick/wire a port, wire in a calibrated arm). Nothing is hidden; every field stays visible even while
  locked.

## Architecture

```
backend/   FastAPI. Spawns lerobot-* CLI commands in a pty, streams raw bytes over a websocket,
           watches /dev/serial/by-id for plug/unplug events, reads calibration files.
frontend/  React + TypeScript + Vite. React Flow for the node graph, xterm.js for each block's
           embedded terminal, zustand for app state.
```

See `backend/app/` for the API (`routers/`) and process/port/device logic (`services/`).

## Not covered yet

- `lerobot-record` / `lerobot-train` / `lerobot-eval` blocks (recording a dataset and training a policy) —
  natural next blocks to add once install → calibrate → teleoperate feels solid.
- Multiple simultaneous followers from one leader (your own `teleop_multi.py` already does this outside
  the CLI) — the Teleoperate block wraps the stock `lerobot-teleoperate` CLI, which is one leader + one
  follower per run.

## License

[Apache License 2.0](./LICENSE).
