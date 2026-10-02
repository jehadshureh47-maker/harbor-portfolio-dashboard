# Haider Albayyaa

## Identity & contact

- **Full name:** Haider Albayyaa (signs some emails "Haider Al-Bayyaa" —
  same person, both spellings appear in his own sent mail).
- **Title:** Managing Partner, Harbor Real Estate (the dashboard project
  calls the company "Harbor Property Management" internally — same
  company, Property Management is one of its three divisions).
- **Email:** haider@harbordubai.com
- **Mobile:** +971 50 879 0448
- **Office:** +971 4 325 1616, P.O. Box 214636, Dubai, UAE — Ground Floor,
  AMAF Building, Al Garhoud.
- Source: his own email signature, confirmed across 10 emails in Jehad's
  inbox spanning June 2025 - September 2026.

## The company

Harbor Real Estate — a Dubai-headquartered full-service real estate firm
(Trade License 618031, RERA Reg. 2004), founded/led by CEO Mohanad
Alwadiya, with three divisions: property management; marketing, sales and
rental; and research/valuation. By its own published figures it manages
roughly AED 14 billion in assets and has served 12,000+ customers.
**Note:** don't confuse this with "Harbour Real Estate" / "Harbour
Residences" (Dubai Harbour-area developers) that turn up in web
searches for similar spellings — unrelated companies.

## His role in this project

He's the executive sponsor of the dashboard work, not a hands-on daily
user. He personally thanked Jehad for the original build (Awqaf + Al Naser
Club) and explicitly asked for it to be made "more user-friendly and
scalable for implementation across our portfolios... as part of our KPI
monitoring and performance management process" — his own words, from his
8/6/2026 email. He then introduced Jehad to Harbor's Head of IT to carry
that forward. The portfolio-wide rollout (Dubai Police, Dubai Court, RTA,
etc.) is Haider's mandate, not Jehad's own initiative — Jehad is executing
on a direction Haider set.

## How he actually works (pulled straight from his emails — this is the part worth giving to Claude Code)

- **Extremely short replies, almost always one line.** Real examples, verbatim:
  "Well done" · "Approved." · "Please make the pin 6776 for all" ·
  "I want the dashboard to have August data asap" · a heart emoji reaction
  on a longer update with no text at all. He does not write long feedback —
  silence/brevity means "fine," not "ignored."
- **Cares about outcomes and speed, not process or detail.** His one
  substantive piece of direction on the whole project is about *scale and
  usability across portfolios for KPI monitoring* — not a specific feature,
  color, chart type, or UI preference. He has never once commented on how
  anything looks.
- **Urgency is real when he states it.** "I want the dashboard to have
  August data asap" (sent to both Jehad and Bibin) got turned around same
  day. When he wants something fast, he says "asap" plainly and expects
  same-day turnaround.
- **Delegates execution, stays copied on everything.** He loops himself in
  via cc on nearly every portfolio thread (Dubai Police, RTA, Al Naser)
  without personally driving those conversations — he wants visibility,
  not to be the one answering data questions.
- **Simple, practical asks when he does ask for something** — e.g. "Please
  make the pin 6776 for all" (consolidating 4 separate portfolio PINs into
  one). He prefers one simple shared thing over several fragmented ones
  when there's no real reason for the fragmentation.
- **Formal but warm in tone when he does write more than a line** — e.g.
  his thank-you after the July reports: "I would like to take this
  opportunity to thank you for your hard work, dedication, and valuable
  contribution... I am confident that the impact of your work will be
  clearly reflected in our operations." Addresses people as "Dear [Name]",
  signs off "Best Regards."
- **Approves internship/HR-adjacent requests quickly and simply** — e.g.
  his entire reply to Jehad's internship-continuation request was
  "Approved."

## What he cares about (stated directly by Jehad)

- Numbers, details, integers, statistics — basically all of the underlying
  data, in depth. This is somewhat in tension with his one-line email style
  above: he's not asking for detail in the correspondence itself, but he
  wants the dashboard/reports themselves to be data-dense and precise, not
  simplified or summarized away.
- Everything needs to be clear, neat, and good-looking. Presentation
  quality matters to him even though he's never personally critiqued a
  specific design choice in writing — treat that as "hasn't needed to
  object yet," not "doesn't care."

## Standing asks / open threads

- Wants a short outcome update after every new-portfolio conversation (e.g.
  confirmed this pattern after the Diaa/Dubai Police meeting).
- Verbal guidance (~mid-August 2026): no need to rush the remaining
  portfolio rollouts — roughly one portfolio a week rather than pushing
  several simultaneously.
- One unanswered email (8/14/2026) asked his guidance on how to introduce
  the dashboard proposal to portfolios that had no prior context on who
  Jehad is — no reply on record, so this is still genuinely open, not
  something he addressed verbally instead.

## What this means for how Claude Code should build for him

Two things both matter here, not one at the expense of the other:

1. **Depth and accuracy of the underlying data.** Numbers, counts,
   statistics, breakdowns — don't simplify or summarize these away. More
   detail, more cross-checked precision, and more granular stats are a
   feature to him, not clutter. This is exactly why the September
   cross-check work (catching the New Lease / Bounced Cheques bugs) matters
   for his use case specifically — wrong or missing numbers are the one
   failure mode he'd actually notice and care about.
2. **Clear, neat, good-looking presentation of all that density.** The
   density above has to not read as cluttered — clean layout, consistent
   formatting, legible charts, no visual noise. The goal is "a lot of real
   data, organized so it's still easy to read at a glance," not "a simple
   dashboard with a few headline numbers."

Combine that with his working style: fast turnaround when he says "asap,"
consolidation over fragmentation when there's no reason for separate pieces
(one shared PIN, one unified dashboard), and don't expect detailed written
feedback on design choices — he reviews outcomes in one line, so get the
data right and the presentation clean rather than waiting for him to flag
something.
