# TIMELY graph-report — public demo

A standalone static edition of the original graph-report dashboard. It preserves the existing research workspace: force-directed graph and filters, Criteria tables, Conflicts cards, OMOP coverage, Sources and all four report tabs. **Build demo** is the only added top-level view.

## Local development

Node.js 22 or newer:

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite (port 5191). No API credentials, backend, Pi installation or private repository are needed.

```sh
npm test
npm run build
npm run preview
```

## GitHub Pages

1. Copy this directory's contents to a new repository root, including `.github/`, `package-lock.json` and `.gitignore`. Do not copy `node_modules/`, the parent project or its Git history.
2. Push to `main` (or update the workflow's branch filter).
3. In **Settings → Pages**, choose **GitHub Actions**.
4. Run the included deployment workflow or push a commit. Its deployment job reports the public URL.

The production build uses relative asset URLs for GitHub project subpaths. The included workflow installs locked dependencies, tests the snapshot, builds and checks the public bundle, then deploys `dist/`.

For other static hosts, including Cloudflare Pages, use `npm ci && npm run build` and output directory `dist`. No server functions or secrets are required. The demo is not automatically published by creating this folder.

## Preserved content

The public AKI snapshot includes 551 concepts, 756 relationships, 480 claims, seven sources, 53 criteria across eight groups, 81 risk factors, 11 conflicts, OMOP mappings and four research reports. Stable research IDs, qualifiers, populations, source evidence, recommendation numbers and standard vocabulary identifiers are retained so the original tables and evidence inspection remain useful.

The graph defaults to minimum degree 1, so it initially shows 463 connected nodes; set minimum degree to 0 to include isolated nodes. Mouse wheel zoom, drag, node inspection, type filters, criteria-only mode, labels, search, and cross-navigation from Criteria/OMOP are preserved.

## Public boundary

Only the static frontend and a prepared public research snapshot are included. The private orchestration system, agent prompts, original logs, local source paths, executable SQL, private configuration and full source documents are excluded. Source filenames and research IDs are presentation metadata, not filesystem paths. Public data is downloadable; UI hiding and minification are not security boundaries.

Reports are lightly sanitized to remove private commands and runtime descriptions; scientific findings, numbers and review failures are retained. Archived verifier reports may describe earlier graph versions and are clearly labeled. Automated resolutions are labeled as recorded resolutions rather than human sign-off.

The Build demo is explicitly illustrative. It does not run models, upload documents, resolve real conflicts or sign off clinical criteria. The result pages show the existing snapshot immediately. This is a research demonstration, not a clinical decision tool. Source material remains attributable to its original authors and publishers; no endorsement or research-license approval is claimed.

## Layout

- `src/`: original dashboard components plus the Build demonstration.
- `public/data/aki-v2.json`: sanitized, dashboard-compatible AKI snapshot.
- `scripts/check-dist.mjs`: checks the production payload and rejects private runtime material/source maps.
- `tests/dashboard.test.mjs`: completeness, provenance and privacy checks.
- `.github/workflows/pages.yml`: standalone Pages workflow.

No analytics, remote fonts or remote runtime services are used. Update the public snapshot only after reviewing its complete downloadable contents.
