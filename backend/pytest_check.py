import subprocess
result = subprocess.run(["venv/Scripts/pytest"], capture_output=True, text=True)
with open("pytest_err.log", "w", encoding="utf-8") as f:
    f.write(result.stdout)
    f.write("\nSTDERR:\n")
    f.write(result.stderr)
