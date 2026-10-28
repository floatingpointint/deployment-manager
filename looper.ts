// Request URL: https://artwork-estimation-developed-own.trycloudflare.com/webhooks/github-events
// Request method: POST
// Accept: */*
// Content-Type: application/x-www-form-urlencoded
// User-Agent: GitHub-Hookshot/51d2642
// X-Github-Delivery: 5a166ae4-d2a7-11f1-9667-039a5c582ac4
// X-Github-Event: push
// X-Github-Hook-Id: 704166557
// X-Github-Hook-Installation-Target-Id: 1168420272
// X-Github-Hook-Installation-Target-Type: repository
// X-Hub-Signature: sha1=7b09db1e3751dc1e801f96559edd59a68fd5d0d7
// X-Hub-Signature-256: sha256=d2d11b89a38764e6f73d9bf1591a7b60034d31dd3cfc8447158ee40a254f5160

await fetch(
  "https://vegetarian-entry-reading-victor.trycloudflare.com/webhooks/github-events",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "GitHub-Hookshot/51d2642",
      "X-Github-Delivery": "68d5e9a2-d2ce-11f1-8425-1a70c4fc7bfb",
      "X-Github-Event": "push",
      "X-Github-Hook-Id": "704166557",
      "X-Github-Hook-Installation-Target-Id": "1168420272",
      "X-Github-Hook-Installation-Target-Type": "repository",
      "X-Hub-Signature": "sha1=06c69fd33d45758bbb2cda328449c3a6f0f97117",
      "X-Hub-Signature-256":
        "sha256=edc3d37ea44d4cf8bec501e7d044479f2ade08728e59fe83286d95b439cf341d",
    },
    body: new URLSearchParams({
      payload: JSON.stringify({
        ref: "refs/heads/main",
        before: "1f6c2565d4af4387259efe034dc878568513e468",
        after: "714203ed2638dbb9cf84bc93af0e6daa052cf10f",
        repository: {
          id: 1168420272,
          node_id: "R_kgDORaStsA",
          name: "sites",
          full_name: "merciasquill/sites",
          private: true,
          owner: {
            name: "merciasquill",
            email: null,
            login: "merciasquill",
            id: 248976262,
            node_id: "O_kgDODtcThg",
            avatar_url: "https://avatars.githubusercontent.com/u/248976262?v=4",
            gravatar_id: "",
            url: "https://api.github.com/users/merciasquill",
            html_url: "https://github.com/merciasquill",
            followers_url:
              "https://api.github.com/users/merciasquill/followers",
            following_url:
              "https://api.github.com/users/merciasquill/following{/other_user}",
            gists_url:
              "https://api.github.com/users/merciasquill/gists{/gist_id}",
            starred_url:
              "https://api.github.com/users/merciasquill/starred{/owner}{/repo}",
            subscriptions_url:
              "https://api.github.com/users/merciasquill/subscriptions",
            organizations_url: "https://api.github.com/users/merciasquill/orgs",
            repos_url: "https://api.github.com/users/merciasquill/repos",
            events_url:
              "https://api.github.com/users/merciasquill/events{/privacy}",
            received_events_url:
              "https://api.github.com/users/merciasquill/received_events",
            type: "Organization",
            user_view_type: "public",
            site_admin: false,
          },
          html_url: "https://github.com/merciasquill/sites",
          description: null,
          fork: false,
          url: "https://api.github.com/repos/merciasquill/sites",
          forks_url: "https://api.github.com/repos/merciasquill/sites/forks",
          keys_url:
            "https://api.github.com/repos/merciasquill/sites/keys{/key_id}",
          collaborators_url:
            "https://api.github.com/repos/merciasquill/sites/collaborators{/collaborator}",
          teams_url: "https://api.github.com/repos/merciasquill/sites/teams",
          hooks_url: "https://api.github.com/repos/merciasquill/sites/hooks",
          issue_events_url:
            "https://api.github.com/repos/merciasquill/sites/issues/events{/number}",
          events_url: "https://api.github.com/repos/merciasquill/sites/events",
          assignees_url:
            "https://api.github.com/repos/merciasquill/sites/assignees{/user}",
          branches_url:
            "https://api.github.com/repos/merciasquill/sites/branches{/branch}",
          tags_url: "https://api.github.com/repos/merciasquill/sites/tags",
          blobs_url:
            "https://api.github.com/repos/merciasquill/sites/git/blobs{/sha}",
          git_tags_url:
            "https://api.github.com/repos/merciasquill/sites/git/tags{/sha}",
          git_refs_url:
            "https://api.github.com/repos/merciasquill/sites/git/refs{/sha}",
          trees_url:
            "https://api.github.com/repos/merciasquill/sites/git/trees{/sha}",
          statuses_url:
            "https://api.github.com/repos/merciasquill/sites/statuses/{sha}",
          languages_url:
            "https://api.github.com/repos/merciasquill/sites/languages",
          stargazers_url:
            "https://api.github.com/repos/merciasquill/sites/stargazers",
          contributors_url:
            "https://api.github.com/repos/merciasquill/sites/contributors",
          subscribers_url:
            "https://api.github.com/repos/merciasquill/sites/subscribers",
          subscription_url:
            "https://api.github.com/repos/merciasquill/sites/subscription",
          commits_url:
            "https://api.github.com/repos/merciasquill/sites/commits{/sha}",
          git_commits_url:
            "https://api.github.com/repos/merciasquill/sites/git/commits{/sha}",
          comments_url:
            "https://api.github.com/repos/merciasquill/sites/comments{/number}",
          issue_comment_url:
            "https://api.github.com/repos/merciasquill/sites/issues/comments{/number}",
          contents_url:
            "https://api.github.com/repos/merciasquill/sites/contents/{+path}",
          compare_url:
            "https://api.github.com/repos/merciasquill/sites/compare/{base}...{head}",
          merges_url: "https://api.github.com/repos/merciasquill/sites/merges",
          archive_url:
            "https://api.github.com/repos/merciasquill/sites/{archive_format}{/ref}",
          downloads_url:
            "https://api.github.com/repos/merciasquill/sites/downloads",
          issues_url:
            "https://api.github.com/repos/merciasquill/sites/issues{/number}",
          pulls_url:
            "https://api.github.com/repos/merciasquill/sites/pulls{/number}",
          milestones_url:
            "https://api.github.com/repos/merciasquill/sites/milestones{/number}",
          notifications_url:
            "https://api.github.com/repos/merciasquill/sites/notifications{?since,all,participating}",
          labels_url:
            "https://api.github.com/repos/merciasquill/sites/labels{/name}",
          releases_url:
            "https://api.github.com/repos/merciasquill/sites/releases{/id}",
          deployments_url:
            "https://api.github.com/repos/merciasquill/sites/deployments",
          created_at: 1772191020,
          updated_at: "2026-10-28T11:53:48Z",
          pushed_at: 1793191938,
          git_url: "git://github.com/merciasquill/sites.git",
          ssh_url: "git@github.com:merciasquill/sites.git",
          clone_url: "https://github.com/merciasquill/sites.git",
          svn_url: "https://github.com/merciasquill/sites",
          homepage: null,
          size: 1027,
          stargazers_count: 0,
          watchers_count: 0,
          language: "TypeScript",
          has_issues: true,
          has_projects: true,
          has_downloads: true,
          has_wiki: true,
          has_pages: false,
          has_discussions: false,
          forks_count: 0,
          mirror_url: null,
          archived: false,
          disabled: false,
          open_issues_count: 0,
          license: null,
          allow_forking: false,
          is_template: false,
          web_commit_signoff_required: false,
          has_pull_requests: true,
          pull_request_creation_policy: "all",
          topics: [],
          visibility: "private",
          forks: 0,
          open_issues: 0,
          watchers: 0,
          default_branch: "main",
          stargazers: 0,
          master_branch: "main",
          organization: "merciasquill",
          custom_properties: {},
        },
        pusher: {
          name: "floatingpointint",
          email: "137571897+floatingpointint@users.noreply.github.com",
        },
        forced: false,
        organization: {
          login: "merciasquill",
          id: 248976262,
          node_id: "O_kgDODtcThg",
          url: "https://api.github.com/orgs/merciasquill",
          repos_url: "https://api.github.com/orgs/merciasquill/repos",
          events_url: "https://api.github.com/orgs/merciasquill/events",
          hooks_url: "https://api.github.com/orgs/merciasquill/hooks",
          issues_url: "https://api.github.com/orgs/merciasquill/issues",
          members_url:
            "https://api.github.com/orgs/merciasquill/members{/member}",
          public_members_url:
            "https://api.github.com/orgs/merciasquill/public_members{/member}",
          avatar_url: "https://avatars.githubusercontent.com/u/248976262?v=4",
          description: "",
        },
        sender: {
          login: "floatingpointint",
          id: 137571897,
          node_id: "U_kgDOCDMuOQ",
          avatar_url: "https://avatars.githubusercontent.com/u/137571897?v=4",
          gravatar_id: "",
          url: "https://api.github.com/users/floatingpointint",
          html_url: "https://github.com/floatingpointint",
          followers_url:
            "https://api.github.com/users/floatingpointint/followers",
          following_url:
            "https://api.github.com/users/floatingpointint/following{/other_user}",
          gists_url:
            "https://api.github.com/users/floatingpointint/gists{/gist_id}",
          starred_url:
            "https://api.github.com/users/floatingpointint/starred{/owner}{/repo}",
          subscriptions_url:
            "https://api.github.com/users/floatingpointint/subscriptions",
          organizations_url:
            "https://api.github.com/users/floatingpointint/orgs",
          repos_url: "https://api.github.com/users/floatingpointint/repos",
          events_url:
            "https://api.github.com/users/floatingpointint/events{/privacy}",
          received_events_url:
            "https://api.github.com/users/floatingpointint/received_events",
          type: "User",
          user_view_type: "public",
          site_admin: false,
        },
        created: false,
        deleted: false,
        base_ref: null,
        compare:
          "https://github.com/merciasquill/sites/compare/1f6c2565d4af...714203ed2638",
        commits: [
          {
            id: "714203ed2638dbb9cf84bc93af0e6daa052cf10f",
            tree_id: "d2e320f397b516b508b7ac622dcffd874427bdcf",
            distinct: true,
            message:
              "feat: added vacuum for internal user ids\n\nSigned-off-by: floatingpointint <137571897+floatingpointint@users.noreply.github.com>",
            timestamp: "2026-10-28T07:52:16-05:00",
            url: "https://github.com/merciasquill/sites/commit/714203ed2638dbb9cf84bc93af0e6daa052cf10f",
            author: {
              name: "floatingpointint",
              email: "137571897+floatingpointint@users.noreply.github.com",
              date: "2026-10-28T07:52:16-05:00",
              username: "floatingpointint",
            },
            committer: {
              name: "floatingpointint",
              email: "137571897+floatingpointint@users.noreply.github.com",
              date: "2026-10-28T07:52:16-05:00",
              username: "floatingpointint",
            },
            added: ["scripts/vacuumInternalUserIds.ts"],
            removed: [],
            modified: ["src/models/Authentication/AlternateAccounts.ts"],
          },
        ],
        head_commit: {
          id: "714203ed2638dbb9cf84bc93af0e6daa052cf10f",
          tree_id: "d2e320f397b516b508b7ac622dcffd874427bdcf",
          distinct: true,
          message:
            "feat: added vacuum for internal user ids\n\nSigned-off-by: floatingpointint <137571897+floatingpointint@users.noreply.github.com>",
          timestamp: "2026-10-28T07:52:16-05:00",
          url: "https://github.com/merciasquill/sites/commit/714203ed2638dbb9cf84bc93af0e6daa052cf10f",
          author: {
            name: "floatingpointint",
            email: "137571897+floatingpointint@users.noreply.github.com",
            date: "2026-10-28T07:52:16-05:00",
            username: "floatingpointint",
          },
          committer: {
            name: "floatingpointint",
            email: "137571897+floatingpointint@users.noreply.github.com",
            date: "2026-10-28T07:52:16-05:00",
            username: "floatingpointint",
          },
          added: ["scripts/vacuumInternalUserIds.ts"],
          removed: [],
          modified: ["src/models/Authentication/AlternateAccounts.ts"],
        },
      }),
    }),
  }
);
