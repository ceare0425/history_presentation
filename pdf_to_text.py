import fitz  # PyMuPDF
import sys

pdf_path = r"C:\Users\user\Documents\GitHub\history_presentation\세계사_1단원.pdf"
out_path = r"C:\Users\user\Documents\GitHub\history_presentation\세계사_1단원_text.txt"

doc = fitz.open(pdf_path)
print(f"총 페이지 수: {len(doc)}")

with open(out_path, "w", encoding="utf-8") as f:
    for i, page in enumerate(doc):
        text = page.get_text()
        f.write(f"\n{'='*60}\n페이지 {i+1}\n{'='*60}\n")
        f.write(text)
        if (i + 1) % 50 == 0:
            print(f"  {i+1}페이지 처리 완료...")

print(f"\n완료! 저장 위치: {out_path}")
doc.close()
