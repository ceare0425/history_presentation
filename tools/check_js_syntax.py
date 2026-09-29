# -*- coding: utf-8 -*-
"""커밋 전 자바스크립트 문법 검사.

HTML 안의 <script> 블록과 .js/.mjs 파일을 esprima로 파싱해서, 문법 오류가 있으면
어느 파일 몇째 줄인지 알려 주고 종료 코드 1을 돌려준다(커밋이 막힌다).

  python tools/check_js_syntax.py            # 스테이징된 파일만 (pre-commit 훅이 사용)
  python tools/check_js_syntax.py --all      # 저장소의 모든 HTML/JS
  python tools/check_js_syntax.py 파일 ...    # 지정한 파일만 (작업 폴더 기준)

esprima는 ES2017까지만 알기 때문에, 검사할 때만 최신 문법(?. ?? 등)을
옛 문법으로 바꾼다. 줄바꿈은 건드리지 않으므로 줄 번호는 원본과 그대로 맞는다.
"""
import re
import subprocess
import sys

try:  # 윈도우에서 한글 안내문이 깨지지 않도록
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

try:
    import esprima
except ImportError:
    print('[문법 검사] esprima가 설치되어 있지 않습니다. 다음 명령으로 설치하세요:')
    print('    python -m pip install esprima')
    sys.exit(1)

EXTS = ('.html', '.htm', '.js', '.mjs')
SCRIPT_RE = re.compile(r'<script\b([^>]*)>(.*?)</script\s*>', re.S | re.I)
TYPE_RE = re.compile(r'\btype\s*=\s*["\']?([^"\'\s>]+)', re.I)
JS_TYPES = ('', 'text/javascript', 'application/javascript', 'module')


def shim(code):
    """esprima가 모르는 최신 문법을 옛 문법으로 바꾼다 (문법 검사 전용, 줄바꿈 유지)."""
    code = code.replace('??=', '||=').replace('??', '||')
    code = code.replace('?.[', ' [').replace('?.(', ' (')
    code = re.sub(r'\?\.(?=[A-Za-z_$#])', ' .', code)
    code = re.sub(r'\bcatch(\s*)\{', r'catch(_)\1{', code)  # catch { (매개변수 없는 catch)
    code = re.sub(r'(?<=\d)_(?=\d)', '0', code)  # 숫자 구분자 1_000
    code = code.replace('import.meta', '__import_meta')  # ES2020 import.meta
    code = re.sub(r'\(\?<[=!]', '(?:', code)  # 정규식 후방탐색 (?<= (?<!
    code = re.sub(r'\(\?<[A-Za-z_]\w*>', '(?:', code)  # 정규식 이름 붙은 그룹 (?<이름>
    return code


def parse(code, module):
    code = shim(code)
    if module:
        esprima.parseModule(code, {'tolerant': False})
    else:
        try:
            esprima.parseScript(code, {'tolerant': False})
        except esprima.Error:
            # type 없는 스크립트라도 import/export를 쓰면 모듈로 한 번 더 확인
            esprima.parseModule(code, {'tolerant': False})


def check_text(path, text):
    errors = []
    if path.lower().endswith(('.js', '.mjs')):
        blocks = [(0, text, path.lower().endswith('.mjs') or bool(re.search(r'^\s*(import|export)\b', text, re.M)))]
    else:
        blocks = []
        for m in SCRIPT_RE.finditer(text):
            attrs, body = m.group(1), m.group(2)
            t = TYPE_RE.search(attrs)
            t = t.group(1).lower() if t else ''
            if t not in JS_TYPES or not body.strip():
                continue
            blocks.append((text.count('\n', 0, m.start(2)), body, t == 'module'))
    for offset, body, module in blocks:
        try:
            parse(body, module)
        except esprima.Error as e:
            line = getattr(e, 'lineNumber', None)
            real = offset + line if line else '?'
            src_line = ''
            if line:
                lines = text.split('\n')
                if 0 < real <= len(lines):
                    src_line = lines[real - 1].strip()[:120]
            msg = re.sub(r'^Line \d+:\s*', '', str(getattr(e, 'description', None) or e))
            errors.append((path, real, msg, src_line))
        except RecursionError:
            pass
    return errors


def git(*args):
    return subprocess.run(['git', *args], capture_output=True, check=True).stdout


def staged_files():
    out = git('diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z')
    return [p for p in out.decode('utf-8').split('\0') if p and p.lower().endswith(EXTS)]


def main():
    args = sys.argv[1:]
    items = []  # (path, text)
    if args == ['--all']:
        out = git('ls-files', '-z')
        for p in out.decode('utf-8').split('\0'):
            if p and p.lower().endswith(EXTS):
                with open(p, encoding='utf-8', errors='replace') as f:
                    items.append((p, f.read()))
    elif args:
        for p in args:
            with open(p, encoding='utf-8', errors='replace') as f:
                items.append((p, f.read()))
    else:
        for p in staged_files():
            # 작업 폴더가 아니라 '실제로 커밋될 내용(스테이징된 내용)'을 검사한다
            items.append((p, git('show', ':' + p).decode('utf-8', errors='replace')))

    errors = []
    for p, text in items:
        errors.extend(check_text(p, text.replace('\r\n', '\n')))

    if errors:
        print('')
        print('[문법 검사] 자바스크립트 문법 오류가 있어 커밋을 막았습니다.')
        for path, line, msg, src in errors:
            print(f'  - {path} : {line}번째 줄 : {msg}')
            if src:
                print(f'      {src}')
        print('  오류를 고친 뒤 다시 커밋하세요.')
        print('')
        return 1
    print(f'[문법 검사] 통과 ({len(items)}개 파일)')
    return 0


if __name__ == '__main__':
    sys.exit(main())
