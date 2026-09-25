"""Build ilt-bench.html: one self-contained file (page + ilt-core.js) you can open offline or email."""
from pathlib import Path

here = Path(__file__).parent
page = (here / "index.html").read_text(encoding="utf-8")
core = (here / "ilt-core.js").read_text(encoding="utf-8")
page = page.replace('<script src="ilt-core.js"></script>', "<script>\n" + core + "\n</script>")
head = '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n'
out = head + page.replace("<style>", "<style>\nbody { margin: 0; }", 1) + "\n</html>\n"
(here / "ilt-bench.html").write_text(out, encoding="utf-8")
print("wrote", here / "ilt-bench.html")
