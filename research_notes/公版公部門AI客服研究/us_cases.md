# 美國公部門 AI 客服 / 共用 AI 平台案例研究 (US public-sector AI chatbots, agents and shared AI platforms, 2024–2026)

> Research date: 2026-10-14. Several primary sites (nextgov.com, themarkup.org, statescoop.com, usai.gov) could not be fetched directly from the research environment (DNS failure), so some facts rely on search-result summaries of those pages. Such items are marked "(search summary)". Verify them before quoting in a formal document.

## 1. Federal shared platforms and policy (USAi, OneGov, FedRAMP 20x, OMB memos, use-case inventory)

### Takeaway
The US federal model has three layers: (1) a GSA-run **shared multi-model platform (USAi)**, started free and moving to **cost recovery** (platform fee plus pass-through usage); (2) **centralized government-wide price deals (OneGov)** with frontier-model vendors, priced at roughly US$1 per agency and placed on the GSA Multiple Award Schedule; (3) **fast-track security authorization (FedRAMP 20x AI prioritization)**. OMB memos then set the governance and contract terms each agency must follow: M-25-21 (use), M-25-22 (acquisition) and M-26-04 (unbiased-AI contract clauses). This maps closely onto a Taiwan "公版 platform + ministry-level vendors" design.

### Cited Findings
**USAi / USAi.gov (GSA)**
- USAi.gov went live in August 2025 as an "AI evaluation suite". Agencies could test models from Anthropic, OpenAI, Google and Meta at launch. xAI's Grok was not included. GSA acts as a "curator of sorts" that decides which models are offered, with a focus on American-made models. — [FedScoop](https://fedscoop.com/usai-general-services-administration-artificial-intelligence-google-meta-anthropic-claude/)
- The usai.gov chat page describes a multi-model chat interface: models from several vendors through one interface. — [USAi chat](https://www.usai.gov/chat) (search summary)
- Purpose: a secure, GSA-managed environment where agencies evaluate models and apps, run security and risk reviews, and test performance before deploying more widely. — [ExecutiveGov](https://executivegov.com/articles/gsa-usai-genai-evaluation-cloud-ai-experimentation); [FedTech Magazine, Dec 2025](https://fedtechmagazine.com/article/2025/12/gsas-usai-platform-helps-agencies-act-ai-action-plan-perfcon)
- Adoption figures conflict:
  - Nextgov (Apr 2026), citing GSA's FY2027 budget request published Apr 3, 2026: 15 agencies using USAi, with more on a waiting list. — [Nextgov, Apr 2026](https://www.nextgov.com/artificial-intelligence/2026/04/gsa-require-agencies-pay-usai-after-launching-it-free-service/412678) (search summary)
  - GSA Deputy Administrator Michael Lynch (June 11, 2026 conference): more than 25 agencies. — (search summary of [MeriTalk](https://www.meritalk.com/?p=207921))
  - Expansion target: MeriTalk says 60 more agencies by end of 2026. CDO Magazine says 16 more. — [CDO Magazine](https://www.cdomagazine.tech/us-federal-news-bureau/gsa-plans-to-expand-ai-evaluation-platform-to-16-more-federal-agencies-by-2026); [MeriTalk](https://www.meritalk.com/?p=207234) (conflict unresolved)
- **Cost recovery:**
  - The GSA FY2027 budget plan moves USAi to a cost-recoverable model. A GSA spokesperson said this supports long-term sustainability and scale, and matches how GSA runs its other shared services. — [Nextgov, Apr 2026](https://www.nextgov.com/artificial-intelligence/2026/04/gsa-require-agencies-pay-usai-after-launching-it-free-service/412678) (search summary)
  - A Sept 1, 2026 update to the GSA website shows USAi is no longer free. Agencies now pay a platform fee plus pass-through usage costs. — [Nextgov, Sep 2026 "Agencies now have to pay to use USAi"](https://www.nextgov.com/artificial-intelligence/2026/09/agencies-now-have-pay-use-usai/415816/) (search summary)
  - Background: GSA revolving funds are generally required to fully recover their costs through fees. — [GSA FY2027 Congressional Justification](https://origin-www.gsa.gov/system/files/GSA%20FY%202027%20Congressional%20Justification.pdf) (fee amounts not found)

**OneGov AI deals**
- OpenAI (Aug 2025): ChatGPT Enterprise for US$1 per agency for one year, plus 60 days of unlimited advanced-model use, a government user community and training. — [Nextgov](https://www.nextgov.com/acquisition/2025/08/openai-give-federal-agencies-chatgpt-access-1-year/407266/)
- Anthropic: Claude for Enterprise and Claude for Government for US$1 per agency for one year, covering all three branches of government. — [Nextgov](https://nextgov.com/artificial-intelligence/2025/08/gsa-and-anthropic-ink-deal-claude-ai-across-all-government-branches/407377/)
- Google Gemini: US$0.47 per agency for one year. ChatGPT, Gemini and Claude were all placed on the GSA Multiple Award Schedule (MAS). — (search summary of [Nextgov](https://www.nextgov.com/acquisition/2025/08/openai-give-federal-agencies-chatgpt-access-1-year/407266/))
- **Protest:** Ask Sage protested the deals. It argued they circumvent federal acquisition regulations, lack the required security authorizations (FedRAMP) and mislead agencies about true costs. — [Nextgov](https://www.nextgov.com/acquisition/2025/08/protest-hits-gsas-1-year-agreements-openai-and-anthropic/407615/)
- **Expiry and renewal (Sep 2026):**
  - Anthropic's US$1 OneGov deal was extended by one month. GSA is renewing agreements case by case as they expire. — [Washington Technology, Sep 2026](https://www.washingtontechnology.com/contracts/2026/09/anthropic-extends-1-user-onegov-deal-month/416062/)
  - The OneGov AI deals are nearing expiry, with only limited extensions granted. — (search summary of Federal News via [Govly](https://app.govly.com/public/signals/185047))

**FedRAMP for AI**
- In Aug 2025, GSA/FedRAMP announced it would prioritize 20x authorization for AI cloud services that give federal workers access to conversational AI. Eligibility:
  - enterprise-grade offering;
  - demonstrated government demand;
  - already on GSA MAS;
  - able to meet 20x pilot requirements within two months.

  Criteria are published at fedramp.gov/ai. — [GSA press release 2025-08-25](https://www.gsa.gov/about-gsa/newsroom/news-releases/gsa-fedramp-prioritize-20x-authorizations-for-ai-08252025)
- GSA says the change removes the requirement for an agency sponsor before an offering enters the FedRAMP pipeline. — [GSA blog, Dec 31 2025](https://www.gsa.gov/blog/2025/12/31/ai-in-action-how-gsa-is-transforming-federal-services)
- Consultancies describe a path to 20x Low in about 60 days, and say prioritization changes only review order, not control or ConMon obligations. This is a consultancy claim, not an official figure. — [Knox Systems](https://knoxsystems.com/resources/fedramp-ai-prioritization); [Coalfire](https://coalfire.com/the-coalfire-blog/your-express-lane-to-fedramp-authorization-for-ai-services)

**OMB memos**
- M-25-21 (AI use) and M-25-22 (AI acquisition) were both issued Apr 3, 2025, under EO 14179.
  - M-25-21: agencies must name a Chief AI Officer within 60 days and publish an AI strategy within 180 days. It creates a "high-impact AI" category that requires risk assessment, testing and ongoing monitoring. — [Mondaq](https://www.mondaq.com/unitedstates/new-technology/1620440/all-american-ai-new-omb-memos-set-priorities-for-federal-ai-use-and-acquisition); [HSToday](https://www.hstoday.us/subject-matter-areas/cybersecurity/ombs-new-memoranda-guide-responsible-use-of-ai-in-federal-operations/)
  - M-25-22 applies to solicitations issued after Oct 1, 2025 and supersedes M-24-18. Its main terms:
    - avoid vendor lock-in through open standards;
    - use performance-based contracting;
    - nonpublic government data may not train external models without agency consent;
    - prefer American AI.
    - Excludes national-security acquisitions and commercial products with embedded AI.

    — [Perkins Coie](https://legacy.perkinscoie.com/insights/update/white-house-unveils-updated-ai-guidelines-federal-agencies); [MobiHealthNews](https://www.mobihealthnews.com/news/white-house-releases-guidance-federal-ai-use-and-procurement)
- **M-26-04** (Dec 11, 2025), "Increasing Public Trust in AI Through Unbiased AI Principles", implements EO 14319:
  - Two principles: truth-seeking (including acknowledging uncertainty) and ideological neutrality.
  - All new LLM solicitations and orders must include contract clauses requiring compliance with these principles, and agencies must get enough information from vendors to judge compliance.
  - By Mar 11, 2026, agencies must update internal policies, including a channel for users to report non-compliant LLMs.

  — [OMB M-26-04 PDF](https://www.whitehouse.gov/wp-content/uploads/2025/12/M-26-04-Increasing-Public-Trust-in-Artificial-Intelligence-Through-Unbiased-AI-Principles-1.pdf); [Nextgov](https://www.nextgov.com/artificial-intelligence/2025/12/white-house-instructs-agencies-stop-using-biased-ai/410135/); DOE implemented it through [Acquisition Letter 2026-05 (May 8, 2026)](https://www.energy.gov/sites/default/files/2026-05/AL%202026-05%20Unbiased%20AI%20Principles%20M-26-04_5.8.26.pdf)

**AI use-case inventory**
- 2025 inventory (published Apr 2026): 3,611 use cases across 56 agencies, about 105% above 2024. About 1,818 are deployed or in pilot. Largest reporters: HHS 447, NASA 425, VA 367, DOE 340, DOJ 314. Sources disagree on the 2024 baseline (1,757 vs 2,133). — [Nextgov, Apr 2026](https://www.nextgov.com/artificial-intelligence/2026/04/agencies-report-over-3000-ai-use-cases-2025/412898/); [ExecutiveGov](https://executivegov.com/articles/omb-federal-ai-use-cases-2025); [CDO Magazine](https://www.cdomagazine.tech/us-federal-news-bureau/federal-agencies-report-3600-ai-use-cases-as-adoption-accelerates)
- GAO-25-107653 (Jul 29, 2025) covered 11 agencies:
  - AI use cases rose from 571 (2023) to 1,110 (2024); generative-AI use cases rose about ninefold, from 32 to 282.
  - Most use was in mission support (drafting communications, information access).
  - Challenges agencies cited: complying with existing federal policy, lack of technical resources and budget, keeping appropriate-use policies current. 10 of 12 agencies said privacy, cybersecurity and procurement rules can hinder deployment.

  — [GAO-25-107653](https://www.gao.gov/products/GAO-25-107653); [Akin Gump summary](https://www.akingump.com/en/insights/ai-law-and-regulation-tracker/gao-issues-report-on-generative-ai-use-and-management-at-federal-agencies)
- As of Jan 2025, 80% of documented federal GenAI use cases were chatbots or virtual assistants. This comes from a secondary source of uncertain origin. — (search summary; original source not confirmed)

### Inferences
- The US uses a "central multi-model platform + central price deals + agencies choose and pay for their own use" model. This is close to Taiwan's 公版 idea. The difference is that USAi is mainly an internal staff and evaluation platform, not a public-facing customer-service engine. Public-facing bots are still built and procured by each agency.
- The free → fee path (USAi charging from Sep 2026 / FY2027; OneGov US$1 deals expiring with only short extensions) shows a central platform needs a **sustainable funding model** from day one. Otherwise ministries face a budget cliff after the trial period.
- Contract clauses Taiwan's 公版 terms could borrow: data not used for training, open standards and anti-lock-in, performance-based contracting, a vendor duty to disclose model information, and a user channel for reporting bad outputs (M-25-22, M-26-04).

### Gaps
- USAi's exact fee rates, its technical architecture (API, RAG, guardrail features) and whether the code is open source could not be confirmed (usai.gov could not be fetched, and search found no open-source release).
- Whether the Ask Sage protest has been decided was not found.
- The 2025 inventory's count of public-facing customer-service bots was not found. It could be filtered from the OMB inventory data on GitHub.
- No reliable 2024–2026 source was found on 10x / TTS AI projects.

## 2. Federal agency public-facing bots: outcomes and failures (IRS, SSA, VA, USCIS, Direct File, and others)

### Takeaway
Real outcome data on federal public-facing bots is thin and mixed. The IRS chat audit (TIGTA, June 2026) found unrecognized questions and no performance measures. The SSA voice bot handled a large share of calls but was criticized for failed contacts and poor experience. VA launched an LLM helpdesk only in Aug 2026, as a beta without live-agent handoff. USCIS Emma is a long-running retrieval-style assistant, not a generative one.

### Cited Findings
**IRS (TIGTA, Jun 15, 2026, "Opportunities Exist to Improve the Quality of Chat Applications")**
- Scope: the chatbot and live chat run by the Automated Collection System (ACS).
- The chatbot gave insufficient information in 29 responses and failed to recognize 44 keywords or questions.
- 24 of 40 sampled live agents worked several chats at once, raising quality and disclosure risks.
- Reports showed one agent handling 603 concurrent chats. The system caps concurrency at 3, so the data was wrong.
- Because the tools were still treated as a pilot, IRS had set no performance measures.
- TIGTA also raised authentication and personal-data concerns. It made 9 recommendations; IRS agreed with all 9.

— [Journal of Accountancy](https://www.journalofaccountancy.com/issues/2026/oct/tigta-finds-shortcomings-in-irss-chat-service/); [TIGTA report PDF](https://www.oversight.gov/sites/default/files/documents/reports/2026-06/2026308029fr.pdf); [CPA Practice Advisor](https://www.cpapracticeadvisor.com/2026/07/08/are-irs-chatbots-really-helping-taxpayers/186261/)

**IRS Direct File (lessons)**
- The 2024 pilot (12 states, Feb–Apr) accepted 140,803 returns, and users found it easier than their prior method.
- GAO found IRS behind schedule in recruiting and training customer-service staff for the 2025 season, partly because IRS offices did not coordinate. GAO also noted lessons such as building website content more efficiently.

— [GAO-25-106933](https://www.gao.gov/products/GAO-25-106933)
- In the 2025 season, 94% of about 8,900 respondents rated their experience "excellent" or "above average". The pilot saved taxpayers about US$5.6 million. — [CRS IF13314 (Sep 2026)](https://www.everycrsreport.com/files/2026-09-17_IF13314_af1cd9ea8fa990c8d0be7cdec9338704558358d0.pdf)
- Direct File was ended under the Trump administration after Republican lawmakers called it wasteful. — [MeriTalk](https://www.meritalk.com/?p=206133); [NTU](https://www.ntu.org/foundation/detail/goodbye-and-good-riddance-to-direct-file) (primary decision document not found)

**SSA**
- An AI phone bot launched in April 2025. Callers can say "agent" to reach a person. In Sep 2025, about 1.6 million of roughly 5.1 million calls to the 800 number were handled by automated self-service. — [AARP](https://www.aarp.org/social-security/ai-customer-service/)
- SSA OIG audit:
  - Average speed of answer was 13 minutes in Oct 2024, peaked at 30 minutes in Jan 2025, and fell to 7 minutes in Sep 2025.
  - FY2025 served 68 million callers, live or automated, up 65%.
  - About 25 million calls ended without service (hang-ups, missed callbacks, busy signals) and were left out of the wait-time metric.

  — (search summary of [PSCA](https://www.psca.org/news/psca-news/2025/12/social-security-call-wait-times-improved-in-fy-2025/) and [Fox News on the OIG report](https://www.foxnews.com/politics/exclusive-oig-report-shows-major-turnaround-social-security-administrations-phone-service-under-trump.print))
- The Washington Post (as relayed by an advocacy group) reported callers going through unhelpful AI exchanges first. One caller said they spent 20 hours on the phone. — [Alliance for Retired Americans](https://retiredamericans.org/social-security-callers-waiting-hours-or-sometimes-days-for-help/)
- SSA rolled out the "Agency Support Companion" internal GenAI chatbot for employees in Apr 2025. — [Nextgov](https://www.nextgov.com/artificial-intelligence/2025/04/ssa-rolling-out-new-chatbot-employees/404658)

**VA**
- On Aug 28, 2026, VA launched an LLM helpdesk chatbot in beta on the VA.gov Contact Us page. It answers common questions and points to benefit information, but **cannot transfer to a person yet**. Planned for later in 2026: personalization after sign-in, live-agent support and more pages. — [aiunderstanding.org summarizing FedScoop](https://aiunderstanding.org/news/fedscoop-reports-va-launches-beta-ai-helpdesk-chatbot)
- A VA OIG report says VHA authorizes VA GPT and Microsoft 365 Copilot Chat for use with patient data. VA says these tools support providers behind the scenes and do not interact directly with veterans. — [VA OIG 2026-01](https://www.vaoig.gov/sites/default/files/reports/2026-01/vaoig-26-00182-42_final.pdf)

**USCIS Emma**
- Emma has been on the USCIS website since 2012 (Dec). USCIS calls it a success at reducing calls, but privacy, PII storage and security concerns have been raised. — [Notre Dame AEGAI](https://aegai.nd.edu/latest/who-is-emma-using-chatbots-in-immigration-services/)
- A 2025 analysis describes Emma as essentially a specialized Google search, with no generative AI producing original answers. — [Yale J. on Reg., Notice & Comment](https://www.yalejreg.com/nc/the-brave-new-world-of-automated-agency-guidance-by-lawrence-zelenak/)

### Inferences
- The TIGTA case argues strongly for building KPIs, logs and data quality into the 公版 platform from day one. A bot left in "pilot status" can escape performance measurement.
- SSA shows that the automation rate can look good while the share of contacts that never get service grows. Track end-to-end resolution, not just containment.
- VA launched without human handoff and EMMA uses retrieval answers. US agencies are cautious about generative answers on high-risk public channels, and tend to limit bots to navigation and information.

### Gaps
- No reliable 2024–2026 sources were found for Login.gov, Medicare (CMS) or State Department public-facing AI bots.
- The IRS voicebot (phone) has no recent outcome data.
- Whether Emma has added generative features is unconfirmed.

## 3. State and local case studies (NYC MyCity, California, Pennsylvania, New Jersey, Utah, Georgia, Indianapolis)

### Takeaway
At the state and local level, NYC MyCity is the classic failure: a public generative bot gave illegal advice and was shut down under a new mayor. The more successful state-level pattern is a **state-built shared GenAI platform** (California Poppy, New Jersey AI Assistant), plus agent-assist in call centers with a human in the loop (CDTFA), rather than letting a bot answer the public directly.

### Cited Findings
**NYC MyCity chatbot (failure case)**
- Launched by the Adams administration in fall 2023 for business owners, on Microsoft Azure AI.
- The Markup and THE CITY found it gave illegal advice. Examples:
  - said employers could take a cut of employees' tips (illegal);
  - said stores could go cashless, ignoring a 2020 city law;
  - housing and labor regulation errors.
- The city's response at the time was to add disclaimers ("responses may sometimes be inaccurate or incomplete" and "not legal advice") and keep the bot running.

— [TechRadar](https://www.techradar.com/pro/faulty-ai-that-told-people-to-break-the-law-defended-by-new-york-mayor); [CX Today](https://www.cxtoday.com/conversational-ai/new-york-citys-microsoft-powered-chatbot-tells-business-owners-to-break-the-law/); [OECD AI Incident](https://oecd.ai/en/incidents/2024-03-29-3dce)
- Jan 30, 2026: Mayor Zohran Mamdani said he would take it down to help close a roughly US$12 billion budget gap. He called it "functionally unusable" and said it cost about half a million dollars. A spokesperson, Dora Pekec, confirmed the plan. Reported build cost was over US$600,000. — [The Markup](https://themarkup.org/artificial-intelligence/2026/01/30/mamdani-to-kill-the-nyc-ai-chatbot-we-caught-telling-businesses-to-break-the-law); [Route Fifty](https://www.route-fifty.com/artificial-intelligence/2026/02/mamdani-kill-nyc-ai-chatbot-was-caught-telling-businesses-break-law/411116); [StateScoop](https://statescoop.com/mamdani-kill-nyc-ai-chatbot/) (search summary)
- Takedown date: only the Museum of Failure says it was "unplugged in 2026". Early reports said no takedown date had been set. — [Museum of Failure](https://museumoffailure.com/exhibition/nyc-ai-crime) (not independently confirmed)

**California**
- CDTFA (Department of Tax and Fee Administration) used generative AI as an **agent-assist** tool in its call center:
  - Vendor: SymSoft Axyom Assist (reported contract about US$445K).
  - Human agents review the AI's answer before giving it to the taxpayer.
  - A 10-month pilot shortened handling time; the simulated environment estimated savings of at least about 1.5% per call.
  - Production rollout started Mar 2025 and finished Aug 22, 2025; about 25% of agents were using it.
  - No audited final evaluation was found.

  — [CDTFA release 25-04](https://cdtfa.ca.gov/news/25-04.htm); [GovTech Insider](https://insider.govtech.com/california/news/cdtfa-moves-genai-assistant-into-call-center-production-environment); [CO/AI](https://getcoai.com/news/california-launches-445k-ai-assistant-to-handle-taxpayer-calls/); [CA GenAI project page](https://www.genai.ca.gov/ca-action/projects/call-center-productivity/)
- **Poppy (state-built shared GenAI platform):**
  - Pilot started Sep 29, 2025 with 70+ departments and 2,700+ employees.
  - Opened to all departments on Jul 1, 2026.
  - Offers multiple models through one state-managed platform, so departments do not run their own vendor selection, procurement or security review.
  - CDT handles security, compliance and integration centrally, including automatic PII detection and a no-training policy.
  - FY2026-27 budget request: US$1 million from the Technology Services Revolving Fund (TSRF) to run it as a shared statewide platform.

  — [CDT newsroom Jul 2026](https://www.cdt.ca.gov/newsroom/2026/07/poppy-california-digitals-assistant-now-available-statewide/); [genai.ca.gov/poppy](https://www.genai.ca.gov/poppy/); [Poppy pilot](https://www.genai.ca.gov/poppy-pilot/); [BCP](https://bcp.dof.ca.gov/2627/FY2627_ORG7502_BCP9063.pdf)

**Pennsylvania (ChatGPT Enterprise pilot)**
- Started Jan 2024: 175 employees in 14 agencies, with OpenAI.
- Users reported saving an average of 95 minutes a day (on days they used it). 85%+ rated it positive, and 48% had never used ChatGPT before.
- Results were self-reported through feedback sessions and interviews.
- Afterwards, the Office of Administration moved to buy a vetted suite of GenAI tools.

— [PA Governor press release, Mar 2025](https://www.pa.gov/governor/newsroom/2025-press-releases/-shapiro-administration-leads-the-way-in-ethical-use-of-ai.html); [WBNG](https://www.wbng.com/2025/03/21/shapiro-announces-results-commonwealth-generative-ai-pilot-program/)

**New Jersey AI Assistant (in-house, state-hosted)**
- Launched in 2024. About 300,000 sessions and 1 million prompts; thousands of employees use it weekly (out of a 70,000-person workforce).
- Hosted on state infrastructure; state data is not used to train third-party models.
- Version 2.0 added more transparent responses, conversation controls and built-in training, alongside a voluntary training course.

— [NJ Innovation Authority](https://innovation.nj.gov/projects/ai-assistant); [StateScoop](https://statescoop.com/new-jersey-releases-upgraded-ai-assistant-for-state-employees/)

**Utah**
- Gemini for Google Workspace went into production Feb 14, 2025 (about 7,500 active users; 9,649 by Oct 2025). A public itinerary chatbot for visitutah.com was still a proof of concept. — [Utah Legislature 2025](https://le.utah.gov/interim/2025/pdf/00002826.pdf); [Utah CIO deck, Oct 2025](https://www.aaas.org/sites/default/files/2025-10/AlanFuller_CSGWest_AAASEPI_ShapingAIFutureInYourState_Oct2025.pdf)
- Utah expanded GenAI call-center pilots into the Department of Human Services, with human oversight. — [babl.ai](https://babl.ai/state-cios-embrace-generative-ai-with-caution-and-optimism/)

**Georgia**
- The Georgia Technology Authority published GenAI standards for state agencies in Aug 2025. — [ai.georgia.gov](https://ai.georgia.gov/node/846)
- The Secretary of State's GABBY chatbot answers only from information on the agency's own website. Its launch year is unclear and may be 2020. — [WSB-TV](https://www.wsbtv.com/news/local/atlanta/built-you-georgia-sec-state-launches-new-gabby-ai-tool-online/IFXACTGJP5D5PJWDAEALM6ROAM/)

**Indianapolis / Marion County**
- The Marion County Public Health Department's LeadADVISOR chatbot lets residents look up lead information for a specific property. It had 121 interactions from Jan 1 to Aug 20, 2025. — [CDC success story](https://cdc.gov/lead-prevention/success-stories/marion-county-indiana.html)
- The City-County Council convened a Commission on AI Development on Jul 29, 2025. — (AI-generated meeting summary, [soar.com](https://cp.soar.com/articles/5503778/Indianapolis-City/Marion-County/Indiana/Marion-County-AI-Commission-Discusses-Responsible-AI-Use-in-City-Operations); low reliability)

### Inferences
- MyCity's lesson: in a high-liability domain (law and regulation), a disclaimer is not a guardrail. Public attention plus budget pressure eventually led a new administration to shut it down, which shows such projects are politically fragile.
- CDTFA uses agent-assist with human review; the risk is low but so is the measured gain (about 1.5%). A 公版 platform can start with agent-assist and move gradually to public self-service.
- Poppy and the NJ AI Assistant show a state-built, multi-model platform with centralized security review lets departments skip separate procurement and security checks. This is the pattern closest to a Taiwan 公版 platform.

### Gaps
- No public-facing GenAI chatbot was found for Washington State. The EDD (California unemployment) GenAI chatbot has no recent data.
- Poppy's internal architecture (models, vendors) is not public. Whether California made Claude available to all agencies is reported by only one GovTech source.
- Indianapolis has no official city-level public AI chatbot announcement.

## 4. Reusable shared-service and reference-platform patterns, and lessons (accuracy, liability, handoff, accessibility, plain language, multilingual)

### Takeaway
Reusable US patterns:
- (a) a central multi-model platform (USAi, Poppy, NJ AI Assistant);
- (b) central price deals placed on a common procurement schedule (OneGov + GSA MAS);
- (c) fast-track security authorization with shared criteria (FedRAMP 20x AI);
- (d) uniform contract clauses (M-25-22, M-26-04);
- (e) a public use-case inventory.

No open-source code release of a "public-facing customer-service bot reference platform" was found. Lessons centre on accuracy and measurement, human handoff, and liability.

### Cited Findings
- GSA policy takes an "open-first" approach to data, APIs, AI and source code, and requires new custom code to be listed in gsa.gov/code.json. — [GSA OSS Policy](https://www.gsa.gov/directives-library/gsa-open-source-software-oss-policy-1); [open.gsa.gov](https://open.gsa.gov/oss-policy/)
- Code.gov is the central catalog of federal open-source projects (Federal Source Code Policy M-16-21; its current status may be archived). — [18F](https://18f.gsa.gov/2016/11/07/code-gov-the-next-milestone-federal-open-source-code)
- Shared multi-model platform with central security review: Poppy ("departments don't need to independently manage vendor selection, procurement, or security reviews"). — [genai.ca.gov/poppy](https://www.genai.ca.gov/poppy/)
- Answer only from official content: Georgia's GABBY answers only from information on the agency's website. — [WSB-TV](https://www.wsbtv.com/news/local/atlanta/built-you-georgia-sec-state-launches-new-gabby-ai-tool-online/IFXACTGJP5D5PJWDAEALM6ROAM/)
- Human handoff:
  - SSA voice bot: say "agent" to reach a person. — [AARP](https://www.aarp.org/social-security/ai-customer-service/)
  - VA beta does not offer live-agent handoff yet. — [aiunderstanding.org/FedScoop](https://aiunderstanding.org/news/fedscoop-reports-va-launches-beta-ai-helpdesk-chatbot)
  - CDTFA: a person reviews every AI answer. — [GovTech Insider](https://insider.govtech.com/california/news/cdtfa-moves-genai-assistant-into-call-center-production-environment)
- Accuracy and measurement:
  - IRS chat had no performance measures and unreliable data. — [Journal of Accountancy](https://www.journalofaccountancy.com/issues/2026/oct/tigta-finds-shortcomings-in-irss-chat-service/)
  - SSA's 25 million unserved calls were left out of its metrics. — (search summary of [PSCA](https://www.psca.org/news/psca-news/2025/12/social-security-call-wait-times-improved-in-fy-2025/))
- Liability: MyCity used disclaimers but still gave illegal advice and was eventually shut down. — [TechRadar](https://www.techradar.com/pro/faulty-ai-that-told-people-to-break-the-law-defended-by-new-york-mayor); [Route Fifty](https://www.route-fifty.com/artificial-intelligence/2026/02/mamdani-kill-nyc-ai-chatbot-was-caught-telling-businesses-break-law/411116)
- Truthfulness and acknowledging uncertainty became a contract requirement (M-26-04 truth-seeking principle). — [OMB M-26-04](https://www.whitehouse.gov/wp-content/uploads/2025/12/M-26-04-Increasing-Public-Trust-in-Artificial-Intelligence-Through-Unbiased-AI-Principles-1.pdf)
- Data protection: Poppy uses automatic PII detection and a no-training policy; the NJ assistant is hosted on state infrastructure and does not train third-party models; M-25-22 bars using nonpublic data for external training. — [genai.ca.gov/poppy](https://www.genai.ca.gov/poppy/); [NJ](https://innovation.nj.gov/projects/ai-assistant); [Perkins Coie](https://legacy.perkinscoie.com/insights/update/white-house-unveils-updated-ai-guidelines-federal-agencies)

### Inferences
- Suggested design principles for a Taiwan 公版 platform:
  1. Answer only from authoritative content (RAG) and cite the source. For high-liability topics (law, tax, benefit eligibility), refuse or hand off to a person rather than rely on a disclaimer.
  2. Make human handoff a required feature, not a later add-on (contrast VA's beta).
  3. Define KPIs and logging from the start (resolution rate, error rate, share of unserved contacts) and require ministry vendors to report them.
  4. Plan funding for after the trial period (USAi lesson).
  5. Use centralized security authorization and contract templates (FedRAMP 20x, M-25-22/M-26-04), so ministry vendors plug into a common baseline.
- A suggested rollout order from the US experience: internal staff tools, then agent-assist, then limited public navigation and information, then public answers. High-risk domains go last.

### Gaps
- No specific 2024–2026 sources were found on Section 508 accessibility testing, plain-language rules or multilingual support for AI chatbots (for example, how a US government bot handles Spanish or other languages). Next steps: section508.gov, digital.gov and plainlanguage.gov guidance on AI.
- No open-source release of USAi or any federal public-facing chatbot reference platform was found.
- No court case was found on US government chatbot liability, for example whether a government is bound by wrong advice. Note: Air Canada's Moffatt case is from Canada, and was not researched here.
