# Company Context

**Company:** Harbor Property Management.

**Jehad's initiative:** Built an internal dashboard tool (Dashboard) originally for two portfolios, now being scaled company-wide with backing from leadership (Haider), who connected him to Harbor's Head of IT.

**Portfolios referenced across the project:** Awqaf, Al Naser Club (both live), plus RTA, National Bonds, VIP, Dubai Court, and Dubai Police as prospective/in-progress portfolios, each with a specific point of contact (see memory/people/).

**Working style notes:**
- Documents in this project have gone through a full docx-generation pipeline (Node `docx` library) with careful RTL handling for Arabic (paragraph + section + table + run-level bidi settings all required for Word to render correctly).
- Dashboard code uses a base64-embedded-blob pattern per report template (`EMBEDDED_DASHBOARDS`), decoded/patched/re-encoded with syntax verification (`node --check`, brace-balance checks) before any delivery.
