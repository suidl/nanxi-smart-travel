from __future__ import annotations

import re
import wave
from array import array
from pathlib import Path

HERE = Path(__file__).resolve().parent
SRT = HERE.parent / "演示字幕-v1.srt"
OUT = HERE / "voice-track.wav"
RATE = 22050
TOTAL_SECONDS = 180


def seconds(stamp: str) -> float:
    hour, minute, rest = stamp.split(":")
    sec, millis = rest.split(",")
    return int(hour) * 3600 + int(minute) * 60 + int(sec) + int(millis) / 1000


track = array("h", [0]) * (RATE * TOTAL_SECONDS)
blocks = re.split(r"\r?\n\s*\r?\n", SRT.read_text(encoding="utf-8").strip())
for block in blocks:
    lines = block.splitlines()
    index = int(lines[0])
    start, end = (seconds(part) for part in lines[1].split(" --> "))
    wav_path = HERE / "audio_segments" / f"segment-{index:02d}.wav"
    with wave.open(str(wav_path), "rb") as audio:
        assert audio.getnchannels() == 1, wav_path
        assert audio.getsampwidth() == 2, wav_path
        assert audio.getframerate() == RATE, wav_path
        segment = array("h")
        segment.frombytes(audio.readframes(audio.getnframes()))
    duration = len(segment) / RATE
    if duration > end - start + 0.1:
        raise RuntimeError(f"Segment {index} exceeds subtitle window: {duration:.2f}s > {end-start:.2f}s")
    at = round(start * RATE)
    track[at:at+len(segment)] = segment
    print(f"segment {index:02d}: {start:.1f}s + {duration:.2f}s")

with wave.open(str(OUT), "wb") as output:
    output.setnchannels(1)
    output.setsampwidth(2)
    output.setframerate(RATE)
    output.writeframes(track.tobytes())
print(OUT)
