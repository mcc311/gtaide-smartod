# 公版公部門 AI 客服／Agent 平台：參考架構、治理、需求探索與試點策略

> Research notes, compiled 2026-10-14. Budget-limited session (~16 tool calls). Several pages could not be fetched (DNS failures for fedscoop.com, apolitical.co), so some findings rely on search-result summaries; these are flagged. Items marked **[prior knowledge, not verified this session]** come from background knowledge with canonical URLs and should be re-checked before citing in a final report.

## Q1. Reference architecture for a government AI agent (RAG + citations, tool/API layer incl. MCP/A2A, identity, handoff, logging, PII, guardrails, local hosting)

### Takeaway
The most credible 2024–2026 government deployments (GOV.UK Chat, Estonia Bürokratt, Singapore VICA, US federal MCP pilots) converge on this pattern: a single shared front end and orchestration layer; answers grounded in official content with retrieval; a standardized tool/data connector layer (MCP is emerging fast in US government for data access); and strong guardrails tested against jailbreaks. Agencies plug in their own content and APIs.

### Cited Findings
**Grounded answers / RAG over official content**
- GOV.UK Chat (UK GDS) answers only from GOV.UK content. In its 2026 public pilots (10,000+ users, about 26,000 questions), accuracy rose from 76% to 90%, measured by a mix of expert assessment and automated tools. An answer counts as accurate only if it fully matches the original GOV.UK content, and partial answers remain the main source of inaccuracy. — [Civil Service World](https://www.civilserviceworld.com/professions/article/govuk-ai-chatbot-achieves-90-accuracy); [Inside GOV.UK blog, 2026-03-16](https://insidegovuk.blog.gov.uk/2026/03/16/5-things-we-learned-testing-gov-uk-chat-an-ai-assistant-for-government); [UKAuthority](https://www.ukauthority.com/articles/gov-uk-ai-chat-completes-public-pilot)
- GOV.UK Chat 2024 private pilot (about 1,000 invited users): about 65% satisfied, 70% found answers useful. Accuracy did not reach the level GOV.UK needs, and hallucinations clustered on "ambiguous or inappropriate queries". The pilot also flagged that users over-trust the GOV.UK brand. — [Inside GOV.UK blog, 2024-01-18](https://insidegovuk.blog.gov.uk/2024/01/18/the-findings-of-our-first-generative-ai-experiment-gov-uk-chat/); [PublicTechnology](https://www.publictechnology.net/2024/01/23/uncategorized/were-not-moving-fast-and-breaking-things-chatgpt-powered-gov-uk-chatbot-trials-show-promise-but-uncover-issues-of-accuracy-and-reliability/)
- Singapore VICA: agencies' default bots answer from their public content via the Whole-of-Government SearchSG crawler. Agencies log in with WOG credentials and sign a Project Commissioning Memorandum before an enterprise project. VICA uses NLP engines such as Dialogflow (the material is mostly 2020–21). — [Singapore Gov Developer Portal – VICA](https://developer.tech.gov.sg/products/categories/platform/vica/overview); [VICA getting started](https://www.developer.tech.gov.sg/products/categories/platform/vica/getting-started)

**Tool/API layer: MCP adoption in government**
- The US Census Bureau and the Government Publishing Office have published public MCP servers on GitHub, and federal officials are exploring MCP so third-party chatbots can use public data more accurately. A US Digital Corps pilot reportedly saw accuracy on USASpending / CDC PLACES queries rise "from near 0% to 95%" with MCP. This comes via a secondary summary; the original FedScoop page could not be fetched. — [FedScoop](https://fedscoop.com/federal-goverment-mcp-improve-ai-access-public-data/); [Paubox summary](https://www.paubox.com/blog/feds-adopt-open-source-protocol-to-connect-ai-chatbots-with-public-data)
- GSA ran a government-wide "MCP Server and AI Agent Government Hackathon" (2026), open to federal, state, local, territorial and tribal staff with .gov/.mil emails. Industry partners were Databricks, OpenAI and IBM, and the goal was to build MCP servers for agencies' open data and service-delivery use cases. — [GSA](https://www.gsa.gov/artificial-intelligence/ai-community-of-practice/events-and-training/mcp-server-and-ai-agent-government-hackathon)
- Code for America and Anthropic (May 2026) are building a "SNAP Policy Navigator" for caseworkers. It is grounded on federal regulations, state manuals and policy directives, and uses MCP for a secure two-way connection to data sources. This is an internal/caseworker-facing tool and has no published evaluation yet. — [Nextgov](https://www.nextgov.com/artificial-intelligence/2026/05/anthropic-and-nonprofit-partner-streamline-benefits-administration-ai/413455); [GovExec](https://www.govexec.com/technology/2026/05/anthropic-code-america-pilot-ai-tools-snap/413464/); [Code for America partnership page](https://codeforamerica.org/partner-with-us/anthropic/)
- I found no official OMB/GSA policy or procurement guidance that mandates MCP. Adoption is pilot- and hackathon-driven. — (search result; see GSA link above)

**Shared multi-agency assistant (federated) architecture**
- Bürokratt (Estonia, RIA) is open source (MIT; TypeScript/Java) and uses a modular architecture. Its central component, "Distributed Message Rooms" (DMR), routes messages between clients and decides who may talk to whom and under what conditions. It ships as a widget embeddable on any state institution's site. Each institution's assistant runs on the State Cloud for about €150 per institution per month, plus LLM usage. The roadmap includes an Estonian-adapted LLM and agents that file applications or make bookings. — [IDB Code for Development – Bürokratt](https://knowledge.iadb.org/en/code-development/open-source-solutions/buerokratt); [RIA](https://www.ria.ee/en/news/virtual-assistant-brings-benefits-technologies-every-citizen); [e-Estonia](https://e-estonia.com/estonia-partners-with-microsoft-in-developing-the-virtual-assistant-burokratt/)
- Bürokratt has been developed in the open since spring 2022, and 20 projects were on its GitHub four months after the pilot. — [IDB](https://knowledge.iadb.org/en/code-development/open-source-solutions/buerokratt)
- Apolitical describes Bürokratt as "a single network of AI assistants replacing dozens of separate agency chatbots" (page title; full content not fetched). — [Apolitical](https://apolitical.co/en/navigator/case-studies/burokratt-estonia-s-single-network-of-ai-assistants-replacing-dozens-of-separate-agency-chatbots)
- Singapore VICA aimed to become a unified chat front end with common branding across agencies, with a centralized "super chatbot" built from pooled cross-agency analytics. It replaced the older "Ask Jamie" bots. — [GovTech: conversation with Bertrand Lee](https://www.tech.gov.sg/media/technews/a-conversation-with-bertrand-lee); [STACK 2020 slides](https://www.developer.gov.sg/assets/files/STACK%202020%20-%20Bertrand%20Lee.pdf)

**Guardrails / prompt-injection defense**
- GOV.UK Chat 2026: all 508 jailbreak attempts were blocked by built-in safeguards (GDS self-reported). — [Civil Service World](https://www.civilserviceworld.com/professions/article/govuk-ai-chatbot-achieves-90-accuracy); [government-transformation.com](https://www.government-transformation.com/data/gds-reports-improved-accuracy-and-user-satisfaction-in-gov.uk-chat-pilots)

**Taiwan policy constraints relevant to architecture**
- 行政院及所屬機關（構）使用生成式 AI 參考指引 (approved 2023-08-31, 10 points) sets these rules:
  - Staff must judge the outputs themselves, and outputs may not be the sole basis of administrative acts.
  - Confidential documents must not be drafted with GenAI.
  - Confidential or personal data must not be entered into GenAI, except into closed, on-premise models after a security check, according to classification level.
  - GenAI use should be disclosed.

  — [iThome](https://www.ithome.com.tw/news/158607); [指引 PDF](https://www.ycvs.tn.edu.tw/df_ufiles/sub1/1130103行政院及所屬機關（構）使用生成式%20AI%20參考指引.pdf); [PTS](https://news.pts.org.tw/article/654050); [行政院](https://www.ey.gov.tw/Page/9277F759E41CCD91/e63572a7-fb79-4c02-9ea3-b731e7c06a56)
- TAIDE (國科會) aims to build a trustworthy dialogue engine for Taiwan users. Public-sector testing was planned to open to ministries in Sept–Oct 2023. — [iThome](https://www.ithome.com.tw/news/158328)

### Inferences
- **Proposed reference layers for 公版**, synthesized from the cases above:
  1. Channel/widget layer: an embeddable web widget plus LINE, à la the Bürokratt widget.
  2. Conversation orchestrator with routing across agencies, à la Bürokratt DMR.
  3. Retrieval layer over official sources (gov sites, 法規, FAQ), with mandatory citations and refusal when no source is found.
  4. Tool layer exposing agency APIs as MCP servers or OpenAPI. US Census/GPO show MCP works well for read-only public data first.
  5. Identity layer: TW FidO / 自然人憑證 / MyData for personalized or transactional services. This needs Taiwan-specific confirmation.
  6. Human-handoff connector to existing 1999 / agency call-center systems.
  7. Logging with PII redaction before storage.
  8. Input/output guardrails plus jailbreak red-teaming, using GOV.UK's 508-attempt test as the benchmark style.
  9. Model abstraction allowing on-prem TAIDE/open-weight models. The Executive Yuan guideline effectively forces on-prem/closed deployment whenever personal data is involved.
- Recommended sequencing: read-only informational RAG → read-only data tools (MCP over open data) → authenticated personalized queries → transactional agents. Bürokratt's roadmap and Gartner's "back office first" advice (Q5) both point this way.
- A2A (Agent2Agent protocol) could matter for agency-to-agency agent routing, but I found no government adoption evidence (see Gaps).

### Gaps
- No government adoption evidence found this session for **A2A**. Standard references from prior knowledge, not verified this session:
  - A2A was announced by Google in April 2025 and later moved to the Linux Foundation: https://github.com/a2aproject/A2A
  - MCP specification: https://modelcontextprotocol.io/specification
- Guardrail tools were not researched this session. Canonical URLs from prior knowledge, unverified:
  - NeMo Guardrails: https://github.com/NVIDIA/NeMo-Guardrails
  - Llama Guard / Llama Prompt Guard: https://github.com/meta-llama/PurpleLlama
  - Microsoft Presidio (PII redaction): https://github.com/microsoft/presidio

  Chinese-language PII detection quality for Taiwan ID numbers, addresses and phone formats needs testing.
- No source found on how GOV.UK Chat implements human handoff or logging retention.
- Taiwan identity integration (TW FidO, MyData) with AI agents: not researched.
- The current status of a 2024–2026 revision of the Executive Yuan GenAI guideline was not found; the search surfaced only the 2023 version.

## Q2. Risk frameworks (NIST AI RMF & GenAI Profile, ISO/IEC 42001, OWASP LLM / Agentic Top 10, EU AI Act)

### Takeaway
Use NIST AI 600-1 as the risk catalogue and the OWASP Agentic Top 10 (Dec 2025) as the security threat model for the tool/agent layer. Treat EU AI Act Article 50 (chatbot disclosure) as a design baseline. Under the EU model, informational chatbots are "limited risk", but bots that touch eligibility for public benefits fall into Annex III high-risk.

### Cited Findings
- **NIST AI 600-1 (Generative AI Profile)** was published July 2024 as a voluntary companion to AI RMF 1.0. It defines 12 GenAI risks, including "confabulation" (hallucination) and "information integrity", and maps suggested actions to the Govern/Map/Measure/Manage subcategories with IDs such as GV-1.6-001. — [NIST AI 600-1 draft PDF](https://airc.nist.gov/docs/NIST.AI.600-1.GenAI-Profile.ipd.pdf); [Modulos summary](https://docs.modulos.ai/frameworks/nist-ai-rmf/generative-ai-profile); [Anaconda guide](https://www.anaconda.com/blog/nist-ai-600-1-generative-ai-profile-guide)
  - Secondary mappings list grounding/RAG, citation requirements and uncertainty quantification as confabulation mitigations. This is not NIST's exact wording. — [Anaconda](https://www.anaconda.com/blog/nist-ai-600-1-generative-ai-profile-guide)
- **OWASP Top 10 for Agentic Applications 2026** was released 9 December 2025 by the OWASP GenAI Security Project with 100+ contributors. Its categories ASI01–ASI10 cover risks from autonomy, tool use, persistent memory and multi-agent coordination, e.g. goal hijacking, tool misuse, rogue agents and cascading failures. Vendor guides recommend least-privilege agent identities as a cross-cutting mitigation. — [OWASP GenAI](https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026); [Teleport summary](https://goteleport.com/blog/owasp-top-10-agentic-applications)
- **EU AI Act**, mostly from secondary sources:
  - Article 50 transparency duties (tell users they are interacting with AI) apply from 2 August 2026, whether or not the system is high-risk. — [SecurePrivacy](https://secureprivacy.ai/blog/eu-ai-act-article-50-transparency-obligations-for-chatbots-and-deepfakes-2026); [blckalpaca](https://blckalpaca.at/en/knowledge-base/ai-agents/eu-ai-act-for-ai-agents/art-50-fuer-chatbots-und-agents)
  - Annex III point 5(a) makes AI used by or for public authorities to evaluate eligibility for essential public assistance benefits and services (grant, reduce, revoke, recover) high-risk. A chatbot that asks upstream eligibility questions can fall into scope. Article 6(3) exempts narrow procedural or preparatory tasks unless they involve profiling. — [gurusup](https://gurusup.com/blog/ai-act-chatbot-requirements)
  - **Conflict on dates:** sources disagree on when Annex III high-risk obligations apply. One says a "Digital Omnibus" provisional deal (May 2026) delayed them, another says 2 December 2027, and a third says 2 August 2026. Verify against the official text. — [falconinternet](https://www.falconinternet.net/blog/eu-ai-act-article-50-transparency-rules-enforced-august-2026); [aiactpilot](https://aiactpilot.leandro-sierra.com/en/ai-act-article-50-transparency)
- **Taiwan**: the Executive Yuan guideline requires disclosure, human judgment and no sensitive data in non-closed models (see Q1). — [iThome](https://www.ithome.com.tw/news/158607)

### Inferences
- Practical mapping for 公版:
  - Informational FAQ bot: equivalent to EU "limited risk". Requires AI disclosure, citations and a human channel.
  - Personalized query bot: adds identity, privacy and logging controls.
  - Eligibility or transactional bot: treat as high-risk, which means human oversight of decisions, a conformity-style assessment and documented testing.
- The conformance test suite for vendor implementations (Q4) should embed OWASP LLM/Agentic test cases, e.g. prompt injection via retrieved documents and tool misuse, so that ministries' vendors inherit the security baseline.

### Gaps
- **ISO/IEC 42001** (AI management system, published Dec 2023) was not researched this session; https://www.iso.org/standard/81230.html is from prior knowledge. Whether Taiwan ministries will require 42001 certification of vendors is unknown.
- OWASP Top 10 for LLM Applications 2025 (LLM01 Prompt Injection, etc.) was not fetched; https://genai.owasp.org/llm-top-10/ is from prior knowledge.
- Taiwan's 人工智慧基本法 status and implications were not researched.
- The EU AI Act Annex III timeline after the Digital Omnibus is unresolved (conflicting secondary sources).

## Q3. Evaluation & monitoring (golden sets, LLM-as-judge, containment, CSAT, hallucination, WCAG, multilingual)

### Takeaway
GOV.UK Chat is the best public model for evaluation. It combines expert grading with automated (LLM-based) scoring against a strict "fully matches source content" accuracy definition, adds user usefulness and satisfaction surveys and red-team jailbreak counts, and iterates over successive pilots (76% → 90%).

### Cited Findings
- GOV.UK Chat accuracy was assessed by "a combination of expert assessments and automated tools". An answer counts as accurate only if it fully meets the GOV.UK content, and partial answers are the main error class. — [Civil Service World](https://www.civilserviceworld.com/professions/article/govuk-ai-chatbot-achieves-90-accuracy)
- GOV.UK Chat user metrics: 73% found the tool useful and 64% were satisfied overall (2026, GOV.UK app users). In 2024 the figures were 70% useful and about 65% satisfied. — [government-transformation.com](https://www.government-transformation.com/data/gds-reports-improved-accuracy-and-user-satisfaction-in-gov.uk-chat-pilots); [Inside GOV.UK 2024](https://insidegovuk.blog.gov.uk/2024/01/18/the-findings-of-our-first-generative-ai-experiment-gov-uk-chat/)
- Safety metric: 508 jailbreak attempts, all blocked. — [Civil Service World](https://www.civilserviceworld.com/professions/article/govuk-ai-chatbot-achieves-90-accuracy)
- Gartner (Dean Lacheca) attributes slow scaling of citizen-facing GenAI to the lack of traditional controls for drift and hallucination. — [Gartner press release 2024-03-06](https://www.gartner.com/en/newsroom/press-releases/2024-03-06-gartner-predicts-less-than-25-percent-of-government-organizations-will-have-genai-enabled-citizen-facing-services-by-2027)
- Top Tasks practice measures task completion rate, time to complete and satisfaction per top task, which gives a proxy KPI set for containment. — [koji.so guide](https://www.koji.so/docs/top-tasks-analysis-guide)

### Inferences
- Suggested 公版 evaluation kit:
  1. Golden question set per agency, about 200–500 Q&A, built from call-center logs (Q5) and labeled with source URL. Include the expected refusal cases.
  2. Accuracy rubric copied from GDS: fully correct / partial / wrong / unsupported claim, plus citation correctness.
  3. LLM-as-judge calibrated against expert grading on a sample.
  4. Red-team set: prompt injection, jailbreak, PII leakage, and Taiwan-specific political or sensitive topics.
  5. Production KPIs: containment/deflection, handoff rate, CSAT/usefulness, unanswered-rate, cost per conversation.
- Multilingual coverage (台語/客語/原住民族語/移工語言: 越南語、印尼語、泰語、菲律賓語/英語) should be a separate eval track. Low-resource languages will likely need translation fallback and human support.

### Gaps
- No sources were fetched this session on WCAG 2.2 conformance for chat widgets, or on multilingual evaluation for Hakka, Taiwanese or indigenous languages. These need dedicated research, e.g. 客家委員會 / 原住民族委員會 language-tech projects and MOE Taiwanese corpora.
- No public government benchmark for deflection or containment rates from GenAI chatbots was found.
- No published hallucination-rate benchmarks for Mandarin government RAG.

## Q4. Packaging a shared/reference platform for reuse (open source, reference implementation, conformance tests, integration spec, SDK)

### Takeaway
GovStack provides the most explicit model: each "building block" has a specification, an OpenAPI API, and a BDD-based automated test harness run against candidate products. Compliance has levels (deployment, requirements coverage, API). Existing products join via adapters. Bürokratt adds the open-source, shared-hosting model with per-agency pricing.

### Cited Findings
- **GovStack** testing and compliance:
  - Each building block has an OpenAPI spec and test suites. On every commit or PR, all test suites in /test/ run against all candidate applications, using a BDD test harness.
  - Compliance is measured in three categories: Deployment, Requirement Specification, and API Services (experimental). Requirements Level 2 means more than 90% of required features are met; API Level 2 means all required APIs are implemented.
  - Existing Digital Public Goods can be used, with an adaptor mapping their API to the GovStack spec (openIMIS needed a custom adapter).
  - Documentation is 2023-era.

  — [GovStack compliance steps](https://govstack-global.atlassian.net/wiki/spaces/GH/pages/221085697); [GovStack architecture spec](https://specs.govstack.global/architecture-and-nonfunctional-requirements/3-govstack-architecture); [How is compliance measured](https://govstack.global/?p=8977); [SolDevelo case](https://soldevelo.com/blog/how-soldevelo-supports-digital-public-services-with-govstack/)
- **Bürokratt:** MIT-licensed code on GitHub so other governments can replicate it, a widget embed for any institution, and centrally hosted State Cloud at about €150 per institution per month plus LLM costs. — [IDB](https://knowledge.iadb.org/en/code-development/open-source-solutions/buerokratt); [RIA](https://www.ria.ee/en/news/virtual-assistant-brings-benefits-technologies-every-citizen)
- **VICA:** onboarding uses WOG login plus a Project Commissioning Memorandum, a governance or contract artifact for agency onboarding to a shared platform. — [VICA getting started](https://www.developer.tech.gov.sg/products/categories/platform/vica/getting-started)

### Inferences
- The 公版 deliverable package should mirror GovStack:
  1. Integration spec: OpenAPI for the chat and handoff APIs, an MCP server template for agency data/tools, and a content-ingest schema.
  2. Reference implementation (open source).
  3. Automated conformance test harness with levels, so that ministry vendors self-certify (e.g. L1 = API conformance, L2 = eval-score thresholds on the golden set + OWASP red-team pass).
  4. Vendor SDK and adapter guidance for legacy chatbots.
  5. An onboarding agreement template à la VICA PCM (data ownership, content-update responsibility, logging and PII rules).
- Offer two consumption modes: (a) a centrally hosted shared service with per-agency tenancy, like Bürokratt's State Cloud; (b) a self-host by the agency's vendor that must pass conformance. This fits the "hand to own vendors" model.

### Gaps
- **X-Road** (Estonia/Finland data exchange; https://x-road.global) and DPGA Digital Public Goods standard (https://digitalpublicgoods.net/standard/) were not researched this session; the URLs are from prior knowledge.
- Whether GovStack has a "conversational AI / chatbot" building block in 2024–2026 was not confirmed.
- No evidence on how ministries' contract vendors actually comply with shared specs (procurement-clause examples).

## Q5. Requirements discovery & pilot strategy (service design, GDS phases, Top Tasks, call-log analysis; lighthouse pilots vs broad demo; evidence on pilot failure; use-case selection & metrics)

### Takeaway
Evidence points to the same approach:
- Discover needs from data rather than from interviews alone. Use Top Tasks voting plus call-center and search logs, since agencies are poor at articulating needs.
- Run a small number of targeted pilots with a clear roadmap past pilot. Start with informational, low-risk, high-volume intents.
- The integration, workflow and learning gap (MIT) and fear of public failure (Gartner) are the main failure causes, not model quality.

### Cited Findings
**Pilot failure evidence**
- **MIT NANDA, "The GenAI Divide: State of AI in Business 2025"**:
  - About 95% of enterprise GenAI pilots delivered no measurable P&L impact. Method: 150 interviews, a 350-employee survey and 300 public deployments analyzed.
  - The cause is a "learning gap" and flawed enterprise integration, not model quality.
  - Buying from specialized vendors or partnering succeeds about 67% of the time; internal builds succeed about one-third as often.
  - Budgets skew to sales and marketing, while the best ROI is in the back office.
  - Caveat: these are corporate, not government, and the methodology has been criticized in coverage.

  — [Fortune, 2025-08-18](https://fortune.com/2025/08/18/mit-report-95-percent-generative-ai-pilots-at-companies-failing-cfo); [Computing](https://computing.co.uk/news/2025/ai/mit-report-95pc-corporate-generative-ai-pilots-fail)
- **Gartner (March 2024):**
  - Fewer than 25% of government organizations will have GenAI-enabled citizen-facing services by 2027, slowed by "fear of public failure" and lack of community trust.
  - Gartner advises that back-office uses progress faster than citizen-facing ones.

  — [Gartner press release](https://www.gartner.com/en/newsroom/press-releases/2024-03-06-gartner-predicts-less-than-25-percent-of-government-organizations-will-have-genai-enabled-citizen-facing-services-by-2027)
- **Gartner (Sept 2025):**
  - By 2029, 60% of government agencies will use AI agents to automate more than half of citizen transactional interactions, up from under 10% in 2025.
  - AI agents and sovereign AI sit at the Peak of Inflated Expectations on the 2025 Hype Cycle for Government Services.
  - Advice: "run targeted pilots to manage expectations and address concerns, followed by a clear roadmap to ensure initiatives progress beyond the pilot phase."

  — [Gartner press release 2025-09-09](https://www.gartner.com/en/newsroom/press-releases/2025-09-09-gartner-reveals-top-technologies-shaping-government-ai-adoption)
- **Code for America 2026 Government AI Landscape Assessment:** efforts to operationalize AI and measure impact remain early-stage. CfA's AI Studio model is "pilot, test, then scale". — [Code for America](https://codeforamerica.org/news/code-for-america-unveils-second-annual-government-ai-landscape-assessment/); [AI Studio](https://codeforamerica.org/news/code-for-america-launches-ai-studio/)
- **GOV.UK Chat** shows a staged path: a private experiment with 1,000 users (2024), then public pilots with 10,000+ users (2025–26), then rollout via the GOV.UK app. Each stage had published metrics. — [Inside GOV.UK 2024](https://insidegovuk.blog.gov.uk/2024/01/18/the-findings-of-our-first-generative-ai-experiment-gov-uk-chat/); [Inside GOV.UK 2026](https://insidegovuk.blog.gov.uk/2026/03/16/5-things-we-learned-testing-gov-uk-chat-an-ai-assistant-for-government)
- **US MCP pilots** first exposed already-public data (Census, GPO, USASpending, CDC PLACES), which needs no agency-specific requirements gathering. — [FedScoop](https://fedscoop.com/federal-goverment-mcp-improve-ai-access-public-data/); [GSA hackathon](https://www.gsa.gov/artificial-intelligence/ai-community-of-practice/events-and-training/mcp-server-and-ai-agent-government-hackathon)
- **Earlier precedent:** Code for America's GetCalFresh chatbot handled common, simple questions and pointed applicants to resources, i.e. a high-volume informational scope. — [GovTech](https://govtech.com/civic/civic-tech-partnership-to-help-govt-caseworkers-use-ai)

**Discovery methods**
- **GDS phases:** Discovery, Alpha, Beta, Live. Discovery asks "should we?" and covers user needs, organizational goals and constraints, ending with ideas to test in Alpha. Alpha asks "can we, and how?" through prototypes. Beta builds production quality, followed by a service assessment. — [dxw playbook](https://playbook.dxw.com/guides/agile-delivery-phases); [cxpartners](https://www.cxpartners.co.uk/our-thinking/mind-the-gaps-how-to-get-more-from-discovery-and-alpha); [GDS service assessment example](https://www.gov.uk/service-standard-reports/service-manual-alpha-assessment)
- **Top Tasks (Gerry McGovern):**
  - Build a long list of 50–100 candidate tasks from search logs, analytics and interviews. Have a representative sample of users vote for their top 5. Usually fewer than 10 tasks dominate demand.
  - Measure completion rate, time and satisfaction per task.
  - Government use: Canada.ca structures the site on top tasks, and ran a COVID-19 top-tasks study in 2020.

  — [koji.so guide](https://www.koji.so/docs/top-tasks-analysis-guide); [Canada TBS COVID top tasks](https://blog.tbs.alpha.canada.ca/2020/09/24/COVID-top-tasks.html); [This is HCD podcast](https://www.thisishcd.com/episodes/gerry-mcgovern-top-tasks-a-method-for-understanding-peoples-product-and-service-requirements)

### Inferences
- **For agencies poor at articulating needs**, replace "ask them what they want" with evidence pulls:
  1. Export 3–12 months of call-center, 1999, email and 民意信箱 records. Cluster them into call reasons or intents using an LLM, and rank by volume × answerability from public content.
  2. Run a Top Tasks vote with the public and front-line staff.
  3. Review site-search logs.
  4. Shadow front-line staff for half a day.

  The output is a ranked intent list plus a deflection-opportunity sizing: volume × share answerable from official content × expected containment × cost per contact.
- **Hybrid pilot strategy recommended for the one-year program**, combining both options in the brief:
  - (a) Months 0–3: build a broad "public-data demo" on already-public content and open data (MCP servers over data.gov.tw, 法規資料庫, agency FAQ pages). This proves the platform, gives every ministry something tangible, and requires no requirements articulation. It mirrors US MCP pilots and GOV.UK's content-only grounding.
  - (b) In parallel, pick 2–4 willing lighthouse agencies with high-volume informational contact centers for GDS-style discovery → alpha → beta. These produce the golden sets, handoff integration and conformance-test evidence.
  - (c) Publish metrics per stage, as GDS did, to counter Gartner's "fear of public failure".
  - The broad demo alone risks the MIT "learning gap": no workflow integration, so no measurable impact.
- **Use-case selection criteria:**
  - High volume and repetitive questions.
  - Informational rather than eligibility or transactional, given EU Annex III high-risk logic and the Executive Yuan guideline.
  - Authoritative, current content exists and has an owner.
  - Clear human fallback exists.
  - A sponsoring official owns the content.
  - Measurable baseline: current call volume, AHT, wait time.
- **Success metrics:**
  - Accuracy on the golden set (GDS-style strict rubric).
  - Citation correctness.
  - Containment/deflection versus a call-volume baseline.
  - Handoff rate and handoff quality.
  - Usefulness/CSAT (GDS benchmark: about 64–73%).
  - Jailbreak block rate.
  - Cost per resolved query.
  - Agency onboarding time to the 公版 (platform-reuse KPI).

### Gaps
- McKinsey public-sector GenAI and OECD public-sector AI reports (e.g. "Governing with Artificial Intelligence", 2024–2025) were not fetched this session.
- No quantified government evidence was found directly comparing "lighthouse pilot" with "broad public-data demo" strategies. The hybrid recommendation is an inference.
- No published methodology was found specifically for "contact deflection opportunity sizing" in the public sector. The formula above is an inference, and the Top Tasks search returned nothing on call-reason analysis.
- The official GDS Service Manual pages (gov.uk/service-manual/agile-delivery) were not fetched, and no official phase durations were confirmed. A 6–8 week alpha appears only as a vendor offer.
- MIT NANDA methodology critiques were not reviewed in detail. The 95% figure concerns corporate pilots and P&L impact, not government services.
