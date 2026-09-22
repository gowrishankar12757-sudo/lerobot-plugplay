# Get Set Robotics — LeRobot SO101 Action Graph

A plug-and-play, block-based interface for setting up a LeRobot SO-101 arm — built for **beginners**,
no robotics experience needed. Wire blocks together like connectors: Install → Calibrate → Teleoperate.

## Setup

Requires **git**, **Python 3.10+**, **Node.js 18+**.

```bash
git clone https://github.com/gowrishankar12757-sudo/lerobot-plugplay.git
cd lerobot-plugplay
./start.sh
```

Open **http://127.0.0.1:5173**

## Steps

1. Click **Install now** on the Install block (sets up LeRobot automatically, first run only).
2. Plug in an arm, add a **Calibrate block**, pick its port, give it a name, click **Start calibration**
   and follow the on-screen prompts.
3. Repeat step 2 for the second arm (one Leader, one Follower).
4. Add a **Teleoperate block**, wire both calibrated arms into it, click **Start teleoperation**.

## Important

- **Linux "Permission denied" on the USB port?** Run `sudo usermod -aG dialout $USER`, then log out and
  back in.
- **Missing ffmpeg / git-lfs?** The Install block will flag it — only needed later for recording data.

## License

[Apache License 2.0](./LICENSE)
