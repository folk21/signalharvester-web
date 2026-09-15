#!/usr/bin/env bash
set -euo pipefail

repo_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_name="$(basename "$repo_dir")"
parent_dir="$(dirname "$repo_dir")"
concat_tool="${SIGNALHARVESTER_CONCAT_TOOL:-$HOME/work/python/concat_files_to_txt.py}"
output_path="${1:-$parent_dir/signalharvester_web_files.txt}"
python_bin="${PYTHON:-python3}"

if [[ "$repo_name" != "signalharvester-web" ]]; then
  echo "Expected repository directory name 'signalharvester-web', got '$repo_name'." >&2
  exit 2
fi

if [[ ! -f "$concat_tool" ]]; then
  echo "Concat tool not found: $concat_tool" >&2
  echo "Set SIGNALHARVESTER_CONCAT_TOOL to the path of concat_files_to_txt.py." >&2
  exit 2
fi

"$python_bin" "$concat_tool" \
  "$repo_dir" \
  "$output_path" \
  -i .git -i '*/.git/*' \
  -i .idea -i '*/.idea/*' \
  -i .vscode -i '*/.vscode/*' \
  -i node_modules -i '*/node_modules/*' \
  -i dist -i '*/dist/*' \
  -i coverage -i '*/coverage/*' \
  -i test-results -i '*/test-results/*' \
  -i playwright-report -i '*/playwright-report/*' \
  -i blob-report -i '*/blob-report/*' \
  -i .vite -i '*/.vite/*' \
  -i .cache -i '*/.cache/*' \
  -i .turbo -i '*/.turbo/*' \
  -i .parcel-cache -i '*/.parcel-cache/*' \
  -i docs/specs/archive -i '*/docs/specs/archive/*' \
  -i .env -i '*/.env' \
  -i .env.local -i '*/.env.local' \
  -i '.env.*.local' -i '*/.env.*.local' \
  -i signalharvester_web_files.txt -i '*/signalharvester_web_files.txt' \
  -i signalharvester-web_files.txt -i '*/signalharvester-web_files.txt' \
  -i package-lock.json -i '*/package-lock.json' \
  -i src/api/generated.ts -i '*/src/api/generated.ts' \
  -i '*.tsbuildinfo' -i '*.map' -i '*.zip' -i '*.log' \
  -i '*.png' -i '*.jpg' -i '*.jpeg' -i '*.webp' -i '*.gif' -i '*.ico' \
  -e .ts -e .tsx -e .js -e .jsx -e .mjs -e .cjs \
  -e .css -e .scss -e .sass -e .less -e .html \
  -e .md -e .txt -e .yaml -e .yml -e .json -e .toml \
  -e .sh -e .properties -e .xml -e .graphql -e .gql -e .http -e .feature \
  -e .gitignore -e .editorconfig -e .env.example \
  -e Dockerfile -e Makefile -e VERSION

echo "Created $output_path"
