# First message to paste into Claude Code

Paste this as your first message after starting Claude Code in this folder:

---

Read CLAUDE.md, docs/PRODUCT_DECISIONS.md and README.md fully before doing anything. This is my PM assignment prototype for an AI Governance Dashboard. Then:

1. Summarise back to me in 5 bullets what the project is, who it's for, and the rules in "Golden rules" — so I know you've understood.
2. Run `npm install` and `npm run build`, and tell me if anything fails.
3. Don't change anything yet. Propose the top 3 improvements you'd make to the prototype, each tied to one of the brief's questions (who uses what / what it costs / within approved limits / Shadow AI), and wait for my go-ahead.

Rules: keep the language simple and jargon-free, never show data we couldn't really get, don't copy any company's design, keep all calculations in src/data/model.ts, and after every build copy dist/index.html to AI-Governance-Dashboard.html.

---

## Useful follow-up prompts
- "Write the submission doc for Parts 1–3 as docs/SUBMISSION.md using CLAUDE.md. Plain language, max 2 pages."
- "Add a 'View as' switcher for L1–L5 personas that changes which sections show, using the persona metrics in docs/PRODUCT_DECISIONS.md."
- "Change the assumed tool stack to <tools>, regenerate the data with scripts/generate_mock_data.py, rebuild, and tell me what changed in the headline numbers."
- "Review the dashboard as a sceptical CFO. List anything confusing, unsupported or jargon-heavy."
