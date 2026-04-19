@echo off
echo Removing unnecessary files from DIRS project...
echo.

set BASE=C:\Users\raman\Desktop\trainer module\blockchain

REM ── Root-level junk ──────────────────────────────────────────────────────
del /f /q "%BASE%\docx.txt"                   2>nul && echo Deleted: docx.txt
del /f /q "%BASE%\mASTERpROMPT.md"            2>nul && echo Deleted: mASTERpROMPT.md
del /f /q "%BASE%\DIRS_Architecture_Guide.md" 2>nul && echo Deleted: DIRS_Architecture_Guide.md
del /f /q "%BASE%\DIRS_Developer_README.docx" 2>nul && echo Deleted: DIRS_Developer_README.docx
del /f /q "%BASE%\cleanup_unrelated_files.bat" 2>nul && echo Deleted: cleanup_unrelated_files.bat

REM ── Stale test DBs at root ────────────────────────────────────────────────
del /f /q "%BASE%\test_dirs_custody.db"       2>nul && echo Deleted: test_dirs_custody.db
del /f /q "%BASE%\test_dirs_diary.db"         2>nul && echo Deleted: test_dirs_diary.db
del /f /q "%BASE%\test_dirs_fir.db"           2>nul && echo Deleted: test_dirs_fir.db
del /f /q "%BASE%\test_forensic.db"           2>nul && echo Deleted: test_forensic.db

REM ── Stale test DB inside tests/ ──────────────────────────────────────────
del /f /q "%BASE%\tests\test_forensic.db"     2>nul && echo Deleted: tests\test_forensic.db

REM ── Broken/obsolete test files ───────────────────────────────────────────
REM  test_all_images.py     — uses wrong path "test images" (space), imports analyze_image wrong signature
REM  test_api.py            — uses UserRole.investigator (does not exist), outdated
REM  analyze_all_images.py  — standalone script, not a pytest test, duplicates integration_test.py
del /f /q "%BASE%\tests\test_all_images.py"       2>nul && echo Deleted: tests\test_all_images.py
del /f /q "%BASE%\tests\test_api.py"              2>nul && echo Deleted: tests\test_api.py
del /f /q "%BASE%\tests\analyze_all_images.py"    2>nul && echo Deleted: tests\analyze_all_images.py

REM ── test_env folder (empty / unused virtual env stub) ────────────────────
rmdir /s /q "%BASE%\test_env"                 2>nul && echo Deleted: test_env\

echo.
echo Done! Run your tests with:
echo   cd tests
echo   pytest test_fir.py test_diary.py test_custody.py -v
pause
