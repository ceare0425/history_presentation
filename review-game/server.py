#!/usr/bin/env python3
"""세계사 복습 게임 - '탑 오르기' 로컬 서버.

외부 패키지 설치 없이 Python 표준 라이브러리만으로 동작한다.
같은 교실 와이파이(같은 네트워크 대역)에 있는 학생 노트북에서 접속해서 플레이하고,
교사는 관리자 화면에서 진행 상황을 보고 대형 화면에는 관전용 화면을 띄운다.

실행:
    python server.py [포트(기본 8899)]

접속:
    학생  http://<이 컴퓨터의 IP>:8899/play
    관리자 http://<이 컴퓨터의 IP>:8899/admin
    큰화면 http://<이 컴퓨터의 IP>:8899/board
"""
import json
import os
import random
import re
import socket
import sys
import threading
import time
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
STATIC_DIR = os.path.join(BASE_DIR, "static")
QUESTIONS_PATH = os.path.join(DATA_DIR, "questions.txt")

DEFAULT_DURATION_SEC = 300  # 5분

STATIC_FILES = {
    "/": "index.html",
    "/play": "play.html",
    "/admin": "admin.html",
    "/board": "board.html",
}

CONTENT_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
}

LOCK = threading.RLock()

STATE = {
    "questions": [],       # [{id, unit, question, answers:[...]}]
    "units": [],           # [{unit, count}]
    "round": {
        "status": "idle",  # idle | running | ended
        "units": [],        # 선택된 단원 목록 (빈 리스트 = 전체)
        "duration_sec": DEFAULT_DURATION_SEC,
        "end_time": None,
    },
    "players": {},          # player_id -> player dict
    "next_qid": 1,
}


# ───────────────────────── 문제 은행 로드 ─────────────────────────

def parse_questions_file(path):
    questions = []
    qid = 1
    if not os.path.exists(path):
        return questions
    with open(path, "r", encoding="utf-8") as f:
        for raw_line in f:
            line = raw_line.strip()
            if not line or line.startswith("#"):
                continue
            parts = [p.strip() for p in line.split("|")]
            if len(parts) != 3:
                continue
            unit, question, answer_field = parts
            if not unit or not question or not answer_field:
                continue
            if "____" not in question:
                question = question + " ____"
            answers = [a.strip() for a in answer_field.split("/") if a.strip()]
            if not answers:
                continue
            questions.append({
                "id": qid,
                "unit": unit,
                "question": question,
                "answers": answers,
            })
            qid += 1
    return questions


def reload_questions():
    with LOCK:
        questions = parse_questions_file(QUESTIONS_PATH)
        STATE["questions"] = questions
        counts = {}
        for q in questions:
            counts[q["unit"]] = counts.get(q["unit"], 0) + 1
        STATE["units"] = [{"unit": u, "count": c} for u, c in counts.items()]
        return len(questions)


def append_question(unit, question, answer):
    unit = unit.strip().replace("|", "/") or "미분류"
    question = question.strip().replace("|", "/")
    answer = answer.strip().replace("|", "/")
    if not question or not answer:
        raise ValueError("문제와 정답을 모두 입력하세요.")
    if "____" not in question:
        question = question + " ____"
    line = f"{unit} | {question} | {answer}\n"
    with LOCK:
        with open(QUESTIONS_PATH, "a", encoding="utf-8") as f:
            f.write(line)
        return reload_questions()


# ───────────────────────── 정답 채점 ─────────────────────────

_STRIP_RE = re.compile(r"[\s.,·・()\[\]{}'\"‘’“”\-·]")


def normalize_answer(text):
    text = text or ""
    text = _STRIP_RE.sub("", text)
    return text.casefold()


def is_correct(submitted, answers):
    norm_sub = normalize_answer(submitted)
    if not norm_sub:
        return False
    for a in answers:
        if norm_sub == normalize_answer(a):
            return True
    return False


# ───────────────────────── 문제 풀 / 큐 ─────────────────────────

def current_pool():
    units = STATE["round"]["units"]
    if not units:
        return STATE["questions"]
    unit_set = set(units)
    return [q for q in STATE["questions"] if q["unit"] in unit_set]


def build_queue(pool):
    ids = [q["id"] for q in pool]
    random.shuffle(ids)
    return ids


def assign_next_question(player):
    pool = current_pool()
    if not pool:
        player["current_qid"] = None
        player["current_started_at"] = None
        return
    if not player["queue"]:
        player["queue"] = build_queue(pool)
        # 방금 낸 문제가 새 큐 맨 앞과 같으면 살짝 섞어서 즉시 반복 방지
        if len(player["queue"]) > 1 and player["queue"][0] == player.get("last_qid"):
            player["queue"][0], player["queue"][1] = player["queue"][1], player["queue"][0]
    qid = player["queue"].pop(0)
    player["current_qid"] = qid
    player["current_started_at"] = time.time()
    player["last_qid"] = qid


def find_question(qid):
    for q in STATE["questions"]:
        if q["id"] == qid:
            return q
    return None


# ───────────────────────── 플레이어 ─────────────────────────

def new_player(name):
    return {
        "id": uuid.uuid4().hex[:12],
        "name": name[:20] if name else "이름없음",
        "floor": 0,
        "correct": 0,
        "wrong": 0,
        "streak": 0,
        "best_streak": 0,
        "queue": [],
        "current_qid": None,
        "current_started_at": None,
        "last_qid": None,
        "joined_at": time.time(),
        "last_active": time.time(),
    }


def public_player(p):
    total = p["correct"] + p["wrong"]
    accuracy = round(100 * p["correct"] / total) if total else None
    return {
        "id": p["id"],
        "name": p["name"],
        "floor": p["floor"],
        "correct": p["correct"],
        "wrong": p["wrong"],
        "streak": p["streak"],
        "best_streak": p["best_streak"],
        "accuracy": accuracy,
        "idle_sec": round(time.time() - p["last_active"]),
    }


def round_public():
    r = STATE["round"]
    remaining = None
    if r["status"] == "running" and r["end_time"]:
        remaining = max(0, round(r["end_time"] - time.time()))
        if remaining == 0:
            r["status"] = "ended"
    return {
        "status": r["status"],
        "units": r["units"],
        "duration_sec": r["duration_sec"],
        "remaining_sec": remaining,
    }


# ───────────────────────── HTTP 핸들러 ─────────────────────────

class Handler(BaseHTTPRequestHandler):
    server_version = "ReviewGame/1.0"

    def log_message(self, fmt, *args):
        pass  # 콘솔 스팸 방지

    def _send_json(self, obj, status=200):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _send_file(self, filename):
        path = os.path.join(STATIC_DIR, filename)
        if not os.path.isfile(path):
            self._send_json({"error": "not found"}, 404)
            return
        ext = os.path.splitext(path)[1]
        ctype = CONTENT_TYPES.get(ext, "application/octet-stream")
        with open(path, "rb") as f:
            body = f.read()
        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _read_json_body(self):
        length = int(self.headers.get("Content-Length", 0) or 0)
        if length == 0:
            return {}
        raw = self.rfile.read(length)
        try:
            return json.loads(raw.decode("utf-8"))
        except Exception:
            return {}

    def _path_and_query(self):
        from urllib.parse import urlsplit, parse_qs
        parts = urlsplit(self.path)
        return parts.path, parse_qs(parts.query)

    # ---------- GET ----------
    def do_GET(self):
        path, query = self._path_and_query()

        if path in STATIC_FILES:
            self._send_file(STATIC_FILES[path])
            return

        if path == "/api/units":
            with LOCK:
                self._send_json({
                    "units": STATE["units"],
                    "total": len(STATE["questions"]),
                    "round": round_public(),
                })
            return

        if path == "/api/state":
            player_id = (query.get("player_id") or [None])[0]
            with LOCK:
                r = round_public()
                player = STATE["players"].get(player_id)
                if not player:
                    self._send_json({"error": "unknown_player"}, 404)
                    return
                player["last_active"] = time.time()

                question_out = None
                if r["status"] == "running":
                    if player["current_qid"] is None:
                        assign_next_question(player)
                    q = find_question(player["current_qid"]) if player["current_qid"] else None
                    if q:
                        question_out = {"id": q["id"], "text": q["question"], "unit": q["unit"]}

                self._send_json({
                    "round": r,
                    "player": public_player(player),
                    "question": question_out,
                })
            return

        if path == "/api/admin/roster":
            with LOCK:
                players = sorted(STATE["players"].values(), key=lambda p: (-p["floor"], -p["correct"]))
                self._send_json({
                    "round": round_public(),
                    "pool_size": len(current_pool()),
                    "players": [public_player(p) for p in players],
                })
            return

        if path == "/api/board":
            with LOCK:
                players = sorted(STATE["players"].values(), key=lambda p: (-p["floor"], -p["correct"]))
                self._send_json({
                    "round": round_public(),
                    "players": [public_player(p) for p in players],
                })
            return

        self._send_json({"error": "not found"}, 404)

    # ---------- POST ----------
    def do_POST(self):
        path, _ = self._path_and_query()
        body = self._read_json_body()

        if path == "/api/join":
            name = (body.get("name") or "").strip()
            existing_id = (body.get("player_id") or "").strip()
            with LOCK:
                if existing_id and existing_id in STATE["players"]:
                    p = STATE["players"][existing_id]
                    if name:
                        p["name"] = name[:20]
                    p["last_active"] = time.time()
                    self._send_json({"player_id": p["id"], "name": p["name"]})
                    return
                if not name:
                    self._send_json({"error": "name_required"}, 400)
                    return
                p = new_player(name)
                if STATE["round"]["status"] == "running":
                    assign_next_question(p)
                STATE["players"][p["id"]] = p
                self._send_json({"player_id": p["id"], "name": p["name"]})
            return

        if path == "/api/answer":
            player_id = body.get("player_id")
            qid = body.get("question_id")
            text = body.get("text", "")
            with LOCK:
                player = STATE["players"].get(player_id)
                if not player:
                    self._send_json({"error": "unknown_player"}, 404)
                    return
                if STATE["round"]["status"] != "running":
                    self._send_json({"error": "round_not_running"}, 409)
                    return
                if player["current_qid"] != qid:
                    # 이미 다음 문제로 넘어간 뒤 늦게 도착한 답안 -> 무시
                    self._send_json({"stale": True})
                    return
                q = find_question(qid)
                player["last_active"] = time.time()
                if not q:
                    assign_next_question(player)
                    self._send_json({"error": "question_gone"})
                    return

                elapsed = time.time() - (player["current_started_at"] or time.time())
                correct = is_correct(text, q["answers"])
                gain = 0
                if correct:
                    if elapsed <= 5:
                        gain = 3
                    elif elapsed <= 10:
                        gain = 2
                    else:
                        gain = 1
                    player["floor"] += gain
                    player["correct"] += 1
                    player["streak"] += 1
                    player["best_streak"] = max(player["best_streak"], player["streak"])
                else:
                    player["wrong"] += 1
                    player["streak"] = 0

                assign_next_question(player)
                next_q = find_question(player["current_qid"]) if player["current_qid"] else None

                self._send_json({
                    "correct": correct,
                    "correct_answer": q["answers"][0],
                    "gain": gain,
                    "player": public_player(player),
                    "next_question": (
                        {"id": next_q["id"], "text": next_q["question"], "unit": next_q["unit"]}
                        if next_q else None
                    ),
                })
            return

        if path == "/api/admin/start":
            units = body.get("units") or []
            duration_sec = int(body.get("duration_sec") or DEFAULT_DURATION_SEC)
            duration_sec = max(30, min(duration_sec, 3600))
            with LOCK:
                STATE["round"]["units"] = units
                STATE["round"]["duration_sec"] = duration_sec
                STATE["round"]["status"] = "running"
                STATE["round"]["end_time"] = time.time() + duration_sec
                pool = current_pool()
                for p in STATE["players"].values():
                    p["floor"] = 0
                    p["correct"] = 0
                    p["wrong"] = 0
                    p["streak"] = 0
                    p["best_streak"] = 0
                    p["queue"] = build_queue(pool) if pool else []
                    p["current_qid"] = None
                    p["current_started_at"] = None
                self._send_json({"ok": True, "round": round_public(), "pool_size": len(pool)})
            return

        if path == "/api/admin/end":
            with LOCK:
                STATE["round"]["status"] = "ended"
                self._send_json({"ok": True, "round": round_public()})
            return

        if path == "/api/admin/reset":
            with LOCK:
                STATE["players"] = {}
                STATE["round"]["status"] = "idle"
                STATE["round"]["end_time"] = None
                self._send_json({"ok": True})
            return

        if path == "/api/admin/reload":
            with LOCK:
                n = reload_questions()
                self._send_json({"ok": True, "total": n, "units": STATE["units"]})
            return

        if path == "/api/admin/add_question":
            unit = body.get("unit", "")
            question = body.get("question", "")
            answer = body.get("answer", "")
            try:
                n = append_question(unit, question, answer)
            except ValueError as e:
                self._send_json({"error": str(e)}, 400)
                return
            with LOCK:
                self._send_json({"ok": True, "total": n, "units": STATE["units"]})
            return

        self._send_json({"error": "not found"}, 404)


def get_local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))
        return s.getsockname()[0]
    except Exception:
        return "127.0.0.1"
    finally:
        s.close()


def main():
    port = 8899
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            pass

    n = reload_questions()
    ip = get_local_ip()

    print("=" * 60)
    print(f"세계사 복습 게임 서버 시작 (문제 {n}개 로드됨)")
    print("=" * 60)
    print(f"  학생 접속   http://{ip}:{port}/play")
    print(f"  관리자 화면 http://{ip}:{port}/admin")
    print(f"  대형 화면   http://{ip}:{port}/board")
    print(f"  (이 컴퓨터에서만 열 경우 http://localhost:{port}/... 도 가능)")
    print("=" * 60)
    print("문제를 추가/수정하려면 review-game/data/questions.txt 를 편집한 뒤")
    print("관리자 화면의 '문제 다시 불러오기' 버튼을 누르세요.")
    print("종료하려면 Ctrl+C")
    print("=" * 60)

    httpd = ThreadingHTTPServer(("0.0.0.0", port), Handler)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n서버를 종료합니다.")
        httpd.shutdown()


if __name__ == "__main__":
    main()
