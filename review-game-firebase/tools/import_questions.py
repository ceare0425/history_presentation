#!/usr/bin/env python3
"""questions.txt 형식의 문제 은행을 Firebase Realtime Database로 가져오기.

사용법:
    python import_questions.py <questions.txt 경로> <room-id>

room-id 예: world, korea

주의: 대상 방(room)의 questions 전체를 이 파일 내용으로 덮어씁니다.
"""
import json
import sys
import urllib.request

DATABASE_URL = "https://history-review-game-default-rtdb.asia-southeast1.firebasedatabase.app"


def parse_questions_file(path):
    questions = {}
    n = 1
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
            questions[f"q{n:04d}"] = {"unit": unit, "question": question, "answers": answers}
            n += 1
    return questions


def main():
    if len(sys.argv) != 3:
        print("사용법: python import_questions.py <questions.txt 경로> <room-id>")
        sys.exit(1)
    path, room = sys.argv[1], sys.argv[2]
    questions = parse_questions_file(path)
    if not questions:
        print("파싱된 문제가 없습니다.")
        sys.exit(1)
    body = json.dumps(questions, ensure_ascii=False).encode("utf-8")
    url = f"{DATABASE_URL}/rooms/{room}/questions.json"
    req = urllib.request.Request(url, data=body, method="PUT", headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as resp:
        resp.read()
    print(f"{len(questions)}개 문제를 rooms/{room}/questions 에 저장했습니다.")


if __name__ == "__main__":
    main()
