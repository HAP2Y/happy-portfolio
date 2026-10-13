/**
 * content.ts — every word on the site lives here.
 *
 * Edit this file to change the bio, projects, roles and links. Nothing else
 * needs to change. Interactions read their data from here too (the terraform
 * plan lines, the SmartSort lanes, the triage tickets), so you can tune what
 * each card shows without touching component code.
 *
 * Lines marked  ✎  are placeholders or wording I inferred — check them.
 */

export const site = {
  title: 'Happy Patel — Platform / DevOps / Frontend Engineer',
  description:
    'Happy Patel builds the infrastructure and automation other engineers depend on. AWS, Terraform, Kubernetes, Python and Go. Ex-Guidewire. India → Toronto, open to remote.',
  url: 'https://happypatel.dev', // ✎ your production URL (used for canonical + Open Graph)
  year: 2026,
}

export const person = {
  name: 'Happy Patel',
  firstName: 'Happy',
  lastName: 'Patel',
  role: 'Platform / DevOps / Frontend Engineer',
  tagline: 'I build the infrastructure and automation other engineers depend on.',
  location: 'Open to offers in Canada',
  /** Shown in the hero corner. A playful nod to the move. */
  regionLine: 'ca-central-1',
  email: 'phappy1422@gmail.com',
  resume: 'Happy-Patel-Resume.pdf', // file in /public — replace with your latest CV
}

export const links = [
  { label: 'GitHub', href: 'https://github.com/HAP2Y', handle: 'HAP2Y' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/hap2y', handle: 'in/hap2y' },
  { label: 'X', href: 'https://x.com/notHAP2Y', handle: '@notHAP2Y' },
] as const

export const nav = [
  { id: 'about', label: 'About', path: '~/about.md' },
  { id: 'work', label: 'Work', path: '~/work/' },
  { id: 'experience', label: 'Experience', path: '~/experience.log' },
  { id: 'contact', label: 'Contact', path: '~/outputs.tf' },
] as const

/* ───────────────────────────── Hero ───────────────────────────── */

export const hero = {
  command: '$ terraform apply -target=module.happy_patel',
  /** Shown if the 3D scene is still loading when the command finishes typing. */
  waiting: 'Acquiring state lock. This may take a few moments...',
  creating: 'module.happy_patel: Creating...',
  created: 'module.happy_patel: Creation complete after 2s [id=hap2y]',
  complete: 'Apply complete! Resources: 1 added, 0 changed, 0 destroyed.',
  scrollCue: 'Scroll',
}

/* ───────────────────────────── About ──────────────────────────── */

export const about = {
  heading: ['Supporting it,', 'then automating it.'],
  lead:
    'Over four years at Guidewire, across Canada and India, I operated AWS infrastructure for an enterprise SaaS platform and moved steadily from supporting it to automating it.',
  body: [
    'I designed agentic workflows in Python and Node.js that removed manual triage from our platform pipeline, and spent a rotation on the product engineering team building backend features in Go.',
    'On my own time I build golden paths: tooling that makes the governed way to do something also the easiest way. Right now I’m going deeper on Kubernetes and writing platform tooling in Go.',
  ],
  /** Rendered like `terraform state show`. */
  state: [
    ['role', 'Platform / DevOps / Frontend Engineer'],
    ['tenure', '4y 1m @ Guidewire'],
    ['education', 'BSc Computer Science, York University'],
    ['certified', 'Terraform Associate (004)'],
    ['location', 'India → Toronto'],
  ] as [string, string][],
  tools: [
    { group: 'Cloud & IaC', items: ['AWS · IAM · EC2 · RDS', 'Terraform', 'Kubernetes', 'Docker', 'GitHub Actions'] },
    { group: 'Languages', items: ['Python', 'Go', 'Node.js', 'TypeScript', 'GLSL'] },
    { group: 'Data & Identity', items: ['PostgreSQL', 'MySQL', 'Redis Streams', 'Okta', 'Ollama'] },
  ],
  toolsNote: 'Kubernetes: in progress.',
}

/* ───────────────────────── Projects & certs ───────────────────── */

export type CardKind = 'repo-factory' | 'smartsort' | 'triage' | 'sea' | 'cert' | 'end'

export interface ProjectCard {
  kind: CardKind
  title: string
  kicker: string
  summary: string
  stack: string[]
  href?: string
  linkLabel?: string
  cursor?: string
}

export const work = {
  heading: ['Recent projects', '& certificates'],
  hint: 'Scroll, drag or swipe',
}

export const repoFactory = {
  /** What the card shows at rest: the ~8 lines that produce a repository. */
  input: [
    '# repositories.auto.tfvars',
    '"svc-billing" = {',
    '  description        = "Billing service"',
    '  topics             = ["service", "go"]',
    '  required_reviewers = 1',
    '}',
  ],
  /** What types out on hover / focus. */
  plan: [
    '$ terraform plan',
    'module.repo["svc-billing"] will be created',
    '  + github_repository.this',
    '  + github_branch_protection.this',
    '  + github_issue_labels.this',
    '  + github_repository_file.readme',
    '  + github_repository_deploy_key.this',
    '  + tls_private_key.deploy',
    'Plan: 6 to add, 0 to change, 0 to destroy.',
  ],
}

export const smartsort = {
  lanes: [
    { id: 'rules', weight: 0.34 },
    { id: 'ai-small', weight: 0.36 },
    { id: 'ai-large', weight: 0.14 },
    { id: 'ocr', weight: 0.16 },
  ],
}

export const triage = {
  columns: ['db', 'identity', 'infra'],
  tickets: [
    { id: 'DB-1042', text: 'slow query', col: 0 },
    { id: 'AUTH-311', text: 'okta loop', col: 1 },
    { id: 'INFRA-88', text: 'disk 91%', col: 2 },
    { id: 'DB-1047', text: 'replica lag', col: 0 },
    { id: 'AUTH-315', text: 'mfa reset', col: 1 },
    { id: 'INFRA-92', text: 'cert expiry', col: 2 },
  ],
  barLabel: 'Manual triage load',
  from: 100,
  to: 60,
}

export const cert = {
  name: 'HashiCorp Certified: Terraform Associate (004)',
  issuer: 'HashiCorp',
  credentialId: 'ADD-CREDENTIAL-ID', // ✎ paste your credential ID
  verifyUrl: 'https://www.credly.com/', // ✎ paste your Credly verification link
  tag: 'Repo Factory was built while preparing for this exam.',
}

export const projects: ProjectCard[] = [
  {
    kind: 'repo-factory',
    title: 'Repo Factory',
    kicker: 'Golden path · 2026',
    summary:
      'About eight lines in a .tfvars catalogue produce a fully governed GitHub repository: enforced naming, branch protection, validated review rules, org-standard labels, a README that can’t drift and a read-only ED25519 deploy key.',
    stack: ['Terraform', 'HCL', 'GitHub provider'],
    href: 'https://github.com/HAP2Y/repo-factory',
    linkLabel: 'github.com/HAP2Y/repo-factory',
  },
  {
    kind: 'smartsort',
    title: 'SmartSort',
    kicker: 'Inference orchestration',
    summary:
      'Local-first AI inference orchestration. A data-driven router sends files to per-model queues, worker pools classify them with a local LLM, and PII is redacted before the model sees anything. Covered by 175 offline tests.',
    stack: ['Python', 'Redis Streams', 'Docker', 'Ollama'],
    href: 'https://github.com/HAP2Y/smartsort',
    linkLabel: 'github.com/HAP2Y/smartsort',
  },
  {
    kind: 'triage',
    title: 'Agentic Triage Automation',
    kicker: 'Guidewire · production',
    summary:
      'Agentic workflows that removed manual triage from the platform pipeline and cut the global database pod’s workload by 40%.',
    stack: ['Python', 'Node.js', 'Agentic workflows'],
  },
  {
    kind: 'sea',
    title: 'Raging Sea Shader',
    kicker: 'Creative code',
    summary:
      'A real-time WebGL ocean: sine swells plus layered Perlin noise in a vertex shader, coloured by elevation. A calm version of it is the ground plane of this site.',
    stack: ['JavaScript', 'Three.js', 'GLSL'],
    href: 'https://github.com/HAP2Y/Raging-Sea-Shader-3D-Web',
    linkLabel: 'github.com/HAP2Y/Raging-Sea-Shader-3D-Web',
  },
  {
    kind: 'cert',
    title: 'Terraform Associate (004)',
    kicker: 'Certification',
    summary: cert.name,
    stack: ['HashiCorp'],
    href: cert.verifyUrl,
    linkLabel: 'Verify credential',
  },
  {
    kind: 'end',
    title: '32 more on GitHub',
    kicker: 'Everything else',
    summary: 'Experiments, tools and half-finished ideas.',
    stack: [],
    href: 'https://github.com/HAP2Y',
    linkLabel: 'github.com/HAP2Y',
    cursor: 'Explore',
  },
]

/* ─────────────────────────── Experience ───────────────────────── */

export const experience = {
  heading: ['Four years', 'at Guidewire'],
  company: 'Guidewire Software',
  span: '4 yrs 1 mo · Canada → India',
  roles: [
    {
      title: 'Platform Support Engineer II',
      dates: 'Nov 2024 — Aug 2026',
      place: 'Mississauga, ON → Bengaluru, IN',
      bullets: [
        'Built agentic workflows and Python / Node.js automation suites that eliminated manual triage, cutting the global database pod’s workload by 40%.',
        'Okta Verify SME for the India region, keeping identity lifecycles secure for Tier-1 enterprise clients.',
        'Led root-cause analysis and performance tuning for production PostgreSQL and MySQL, holding 99.9% availability.',
      ],
    },
    {
      title: 'Cloud Software Engineering',
      tag: 'Rotation',
      dates: 'Feb — Jun 2025',
      place: 'Mississauga, ON',
      bullets: [
        'Selected for a product engineering rotation, building core backend features in Go and Python in a fast Agile team.',
        'Provisioned cloud-native AWS resources with Terraform, matching infrastructure scaling to product performance needs.',
        'Kept 100% code coverage on new modules with unit and integration tests.',
      ],
    },
    {
      title: 'Platform Support Engineer',
      dates: 'May 2023 — Nov 2024',
      place: 'Mississauga, ON',
      bullets: [
        // ✎ inferred from your summary — replace with specifics
        'Operated the AWS infrastructure (IAM, EC2, RDS) behind Guidewire’s enterprise SaaS platform.',
        'Started automating the repetitive parts of support work, which became the groundwork for agentic triage.',
      ],
    },
    {
      title: 'Technical Support Engineer',
      dates: 'Aug 2022 — May 2023',
      place: 'Mississauga, ON',
      bullets: [
        // ✎ inferred — replace with specifics
        'First role at Guidewire: technical support for enterprise insurance customers on Guidewire Cloud.',
        'Learned the platform from the incident side: logs, escalations and the fixes that stick.',
      ],
    },
  ],
  footnote: 'Before Guidewire: Intern at GAOTek Inc. (2021). BSc Computer Science, York University (2019–2023).',
}

/* ──────────────────────────── Contact ─────────────────────────── */

export const contact = {
  heading: ['Let’s build', 'something'],
  intro: 'Open to Platform, DevOps, SRE and Infrastructure roles: remote worldwide, or on-site in Toronto / GTA once my PR is final.',
  copied: 'Email copied to clipboard',
  outputs: [
    ['status', '"open to work"'],
    ['location', '"India → Toronto"'],
    ['roles', '["platform", "devops", "sre", "infra"]'],
  ] as [string, string][],
}
