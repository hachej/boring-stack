#!/bin/bash
# The daily provider update (README.md, "Daily updates"). Runs on the dev VM as ubuntu, where Claude Code
# and gh are signed in. Nothing here runs until the timer is installed (ops/boring-stack-update.timer).
set -euo pipefail
REPO_DIR="${BORING_STACK_REPO:-$HOME/fleet/boring-stack-upstream}"
DAY="$(date -u +%F)"
LOG_DIR="$HOME/fleet/evidence/boring-stack/$DAY"
mkdir -p "$LOG_DIR"
exec 9>"$HOME/.cache/boring-stack-update.lock"
flock -n 9 || { echo "another update is running"; exit 0; }

# A fresh checkout of main for every run (never the operator's checkout).
if [ ! -d "$REPO_DIR/.git" ]; then git clone -q https://github.com/hachej/boring-stack.git "$REPO_DIR"; fi
cd "$REPO_DIR"
git fetch -q origin
git checkout -q -B "upstream/$DAY" origin/main
PLUGIN="$REPO_DIR/plugins/boring-stack"

status=0
"$PLUGIN/bin/boring-stack" update --apply --report "$LOG_DIR/report.md" || status=$?

if ! git diff --quiet -- plugins/boring-stack/providers.json .claude-plugin/marketplace.json; then
  git add plugins/boring-stack/providers.json plugins/boring-stack/CHANGELOG.md .claude-plugin/marketplace.json
  git -c user.name="boring-stack update" -c user.email="noreply@boringbots.ai" commit -qm "chore(providers): adopt upstream skills of $DAY" -m "$(cat "$LOG_DIR/report.md")"
  git push -q origin "upstream/$DAY"
  url=$(gh pr create --repo hachej/boring-stack --base main --head "upstream/$DAY" --title "chore(providers): adopt upstream skills of $DAY" --body-file "$LOG_DIR/report.md")
  # Only providers whose scan was clean and whose gate passed are in this diff; the gate is the check.
  gh pr merge "$url" --squash --delete-branch
fi

# What was held back goes to a person, once per provider and target commit.
if [ "$status" -ne 0 ]; then
  title="boring-stack: upstream update held on $DAY"
  if ! gh issue list --repo hachej/boring-stack --state open --search "$title in:title" --json number --jq '.[0].number' | grep -q .; then
    gh issue create --repo hachej/boring-stack --title "$title" --body-file "$LOG_DIR/report.md" >/dev/null
  fi
fi

# Reach the workers: the Claude marketplace refreshes itself (auto-update on), Codex gets a fresh export.
claude plugin marketplace update boring-stack >/dev/null 2>&1 || true
"$PLUGIN/bin/boring-stack" export-codex --user >/dev/null || true
