#!/usr/bin/env python3
"""Coletar comentários, reviews e threads de um PR explícito via GitHub GraphQL.

Uso:
    python3 fetch_pr_threads.py --repo OWNER/REPO --pr NUMERO

Requer o GitHub CLI (`gh`) autenticado. Somente leitura.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from typing import Any

QUERY = """
query(
  $owner: String!,
  $repo: String!,
  $number: Int!,
  $commentsCursor: String,
  $reviewsCursor: String,
  $threadsCursor: String
) {
  repository(owner: $owner, name: $repo) {
    pullRequest(number: $number) {
      number
      url
      title
      state
      comments(first: 100, after: $commentsCursor) {
        pageInfo { hasNextPage endCursor }
        nodes {
          id body createdAt updatedAt
          author { login }
        }
      }
      reviews(first: 100, after: $reviewsCursor) {
        pageInfo { hasNextPage endCursor }
        nodes {
          id state body submittedAt
          author { login }
        }
      }
      reviewThreads(first: 100, after: $threadsCursor) {
        pageInfo { hasNextPage endCursor }
        nodes {
          id isResolved isOutdated path line diffSide
          startLine startDiffSide originalLine originalStartLine
          resolvedBy { login }
          comments(first: 100) {
            nodes {
              id body createdAt updatedAt
              author { login }
            }
          }
        }
      }
    }
  }
}
"""


def run_json(command: list[str], stdin: str | None = None) -> dict[str, Any]:
    result = subprocess.run(
        command,
        input=stdin,
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        raise RuntimeError(
            f"Comando falhou ({result.returncode}): {' '.join(command)}\n"
            f"{result.stderr.strip()}"
        )

    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError as error:
        raise RuntimeError("GitHub retornou JSON inválido.") from error


def graphql(
    owner: str,
    repo: str,
    number: int,
    cursors: dict[str, str | None],
) -> dict[str, Any]:
    command = [
        "gh",
        "api",
        "graphql",
        "-F",
        "query=@-",
        "-F",
        f"owner={owner}",
        "-F",
        f"repo={repo}",
        "-F",
        f"number={number}",
    ]
    for name, cursor in cursors.items():
        if cursor:
            command.extend(["-F", f"{name}={cursor}"])

    return run_json(command, stdin=QUERY)


def collect(owner: str, repo: str, number: int) -> dict[str, Any]:
    cursors: dict[str, str | None] = {
        "commentsCursor": None,
        "reviewsCursor": None,
        "threadsCursor": None,
    }
    active = set(cursors)
    collected: dict[str, dict[str, dict[str, Any]]] = {
        "comments": {},
        "reviews": {},
        "reviewThreads": {},
    }
    metadata: dict[str, Any] | None = None

    while active:
        payload = graphql(owner, repo, number, cursors)
        if payload.get("errors"):
            raise RuntimeError(json.dumps(payload["errors"], ensure_ascii=False, indent=2))

        repository = payload.get("data", {}).get("repository")
        pull_request = repository.get("pullRequest") if repository else None
        if pull_request is None:
            raise RuntimeError(f"PR {owner}/{repo}#{number} não encontrado ou inacessível.")

        if metadata is None:
            metadata = {
                key: pull_request[key]
                for key in ("number", "url", "title", "state")
            }
            metadata.update({"owner": owner, "repo": repo})

        for field, cursor_name in (
            ("comments", "commentsCursor"),
            ("reviews", "reviewsCursor"),
            ("reviewThreads", "threadsCursor"),
        ):
            if cursor_name not in active:
                continue

            connection = pull_request[field]
            for node in connection.get("nodes") or []:
                collected[field][node["id"]] = node

            page_info = connection["pageInfo"]
            if page_info["hasNextPage"]:
                cursors[cursor_name] = page_info["endCursor"]
            else:
                cursors[cursor_name] = None
                active.remove(cursor_name)

    assert metadata is not None
    return {
        "pull_request": metadata,
        "conversation_comments": list(collected["comments"].values()),
        "reviews": list(collected["reviews"].values()),
        "review_threads": list(collected["reviewThreads"].values()),
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo", required=True, help="OWNER/REPO")
    parser.add_argument("--pr", required=True, type=int, help="Número explícito do PR")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        owner, repo = args.repo.split("/", 1)
        if not owner or not repo:
            raise ValueError
    except ValueError:
        print("--repo deve usar o formato OWNER/REPO.", file=sys.stderr)
        return 2

    try:
        print(
            json.dumps(
                collect(owner, repo, args.pr),
                ensure_ascii=False,
                indent=2,
            )
        )
    except (OSError, RuntimeError) as error:
        print(str(error), file=sys.stderr)
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
