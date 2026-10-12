#!/usr/bin/env python3
"""Check the skills offline: every skills/<name>/SKILL.md has the front matter the
skills CLI needs (name = folder, a description); local links stay inside their
skill; JSON parses; third-party skills carry their licence; boring-pm routes to
its files.

This does not validate the truth of claims, external link availability, or agent
behavior. It has no third-party dependencies and performs no mutations.
"""

from pathlib import Path
from urllib.parse import unquote, urlsplit
import json
import re
import sys


def check(root: Path) -> list[str]:
    errors = []
    skills = sorted(p for p in (root / "skills").iterdir() if p.is_dir())
    ours = set(json.loads((root / "SOURCE.json").read_text())["sources"][-1]["skills"]) | {"boring-pm", "boring-new-app", "boring-design-system"}
    for one in skills:
        text = (one / "SKILL.md").read_text() if (one / "SKILL.md").exists() else ""
        front = re.match(r"^---\n(.*?)\n---\n", text, re.S)
        if not front:
            errors.append(f"skills/{one.name}/SKILL.md has no front matter")
            continue
        name = re.search(r"^name:\s*\"?([^\"\n]+)\"?\s*$", front.group(1), re.M)
        if not name or name.group(1).strip() != one.name:
            errors.append(f"skills/{one.name}/SKILL.md: name must equal the folder name")
        if not re.search(r"^description:", front.group(1), re.M):
            errors.append(f"skills/{one.name}/SKILL.md needs a description")
        # The skills CLI parses the front matter as strict YAML and skips a skill it cannot
        # parse (an unquoted value containing ": " is the usual cause): parse it the same way.
        try:
            import yaml
            meta = yaml.safe_load(front.group(1))
            if not isinstance(meta, dict) or not isinstance(meta.get("description"), str):
                errors.append(f"skills/{one.name}/SKILL.md: the front matter must be a YAML mapping with a string description")
        except ImportError:
            pass
        except yaml.YAMLError as e:
            errors.append(f"skills/{one.name}/SKILL.md: front matter is not valid YAML (quote the value): {str(e).splitlines()[0]}")
        if one.name not in ours and not ((one / "LICENSE").exists() or (one / "LICENSE.txt").exists()):
            errors.append(f"skills/{one.name}: a third-party skill carries its LICENSE")
    skill = root / "skills" / "boring-pm"
    entry = (skill / "SKILL.md").read_text()
    for name in ("onboarding.md", "discovery.md", "tickets.md", "mockups.md", "templates/contract.md", "templates/mockup.html", "templates/scenario.md"):
        if not (skill / name).exists():
            errors.append(f"Missing skill file: {name}")
        elif name.endswith(".md") and "/" not in name and f"]({name})" not in entry:
            errors.append(f"SKILL.md does not route to {name}")
    if re.search(r"https?://(?![^\s)]*(github\.com|brew\.sh))", (skill / "templates" / "mockup.html").read_text()):
        errors.append("templates/mockup.html must not load anything from the network")

    for path in root.rglob("*"):
        if ".git" in path.parts or not path.is_file():
            continue
        if path.suffix == ".json":
            try:
                json.loads(path.read_text())
            except (ValueError, UnicodeError) as exc:
                errors.append(f"Invalid JSON in {path.relative_to(root)}: {exc}")
        if path.suffix != ".md":
            continue
        body = path.read_text()
        for link in re.findall(r"\]\(([^)]+)\)", body):
            parsed = urlsplit(link)
            if parsed.scheme or link.startswith("#") or "." not in link:
                continue
            target = (path.parent / unquote(parsed.path)).resolve()
            if not target.exists():
                errors.append(f"Broken link in {path.relative_to(root)}: {link}")
            # A skill may point to a sibling skill (the stack installs them together), never outside skills/.
            if path.is_relative_to(root / "skills") and not target.is_relative_to(root / "skills"):
                errors.append(f"Nonportable skill link in {path.relative_to(root)}: {link}")
        if "[TODO" in body:
            errors.append(f"Unfinished scaffold in {path.relative_to(root)}")
    return errors


if __name__ == "__main__":
    repo_root = Path(__file__).resolve().parent.parent
    try:
        failures = check(repo_root)
    except (OSError, KeyError, ValueError) as error:
        print(f"Check could not run: {error}", file=sys.stderr)
        raise SystemExit(1)
    if failures:
        print("\n".join(failures), file=sys.stderr)
        raise SystemExit(1)
    print(f"PASS: {len(list((repo_root / 'skills').iterdir()))} skills: front matter, licences, portable local links, JSON; boring-pm routes and offline mockup")
