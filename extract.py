import sys
import subprocess

try:
    import docx2txt
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "docx2txt"])
    import docx2txt

text = docx2txt.process('DIRS_Developer_README.docx')
with open('docx.txt', 'w', encoding='utf-8') as f:
    f.write(text)
print("Extracted successfully.")
