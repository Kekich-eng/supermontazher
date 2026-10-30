"""Сборка ролика. Положи рядом с edit.json. Режимы: references/engine.md плагина."""
import glob
import os
import runpy
import sys

root = os.environ.get("CLAUDE_PLUGIN_ROOT")
hits = [os.path.join(root, "skills/supermontazher/scripts/montage.py")] if root else glob.glob(os.path.expanduser("~/.claude/plugins/**/supermontazher/scripts/montage.py"), recursive=True)
if not hits:
    sys.exit("Не найден montage.py: задай CLAUDE_PLUGIN_ROOT или установи плагин")
sys.argv = [sys.argv[0], os.path.join(os.path.dirname(os.path.abspath(__file__)), "edit.json")] + sys.argv[1:]
runpy.run_path(hits[0], run_name="__main__")
