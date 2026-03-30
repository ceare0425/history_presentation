import fitz
import os

base = r"C:\Users\user\Documents\GitHub\history_presentation"
files = [
    ("세계사_2단원.pdf", "세계사_2단원_text.txt"),
    ("세계사_3단원.pdf", "세계사_3단원_text.txt"),
    ("세계사_4단원.pdf", "세계사_4단원_text.txt"),
]

for pdf_name, txt_name in files:
    pdf_path = os.path.join(base, pdf_name)
    out_path = os.path.join(base, txt_name)
    doc = fitz.open(pdf_path)
    print(f"{pdf_name}: 총 {len(doc)}페이지 처리 시작...")
    with open(out_path, "w", encoding="utf-8") as f:
        for i, page in enumerate(doc):
            text = page.get_text()
            f.write(f"\n{'='*60}\n페이지 {i+1}\n{'='*60}\n")
            f.write(text)
            if (i + 1) % 100 == 0:
                print(f"  {i+1}페이지 완료...")
    doc.close()
    print(f"완료 -> {txt_name}\n")

print("전체 완료!")
