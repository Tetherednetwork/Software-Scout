<img width="4070" height="4069" alt="image" src="https://github.com/user-attachments/assets/3eed91f0-4f96-4dee-a1fe-82a2be805d8d" />

SoftMonk.co [Secure Software Intelligence Platform]
SoftMonk is a cybersecurity-driven software discovery platform built to help individuals and organizations find verified, original software from trusted publishers. It eliminates the risks of malware, fake installers, and supply-chain compromise common in unverified downloads.

**Background**
SoftMonk was developed from over a decade of enterprise IT operations and cybersecurity experience.
The idea came after years of managing and supporting over 10,000 users across multiple organizations where infected or counterfeit software repeatedly caused downtime, data breaches, and performance issues. SoftMonk simplifies software acquisition by offering a single trusted source backed by security intelligence, compliance awareness, and automated verification logic.

**Overview**
Most users unknowingly download compromised software from unsafe mirrors or fake pages. SoftMonk solves this by maintaining a database of verified software entries backed by AI-driven link validation and human moderation.
The system checks every software link against:
•	OEM authenticity
•	File integrity (SHA256)
•	Malware scan results
•	HTTPS and domain trust score
The result is a curated, verified, and safe download experience.
<img width="1781" height="909" alt="image" src="https://github.com/user-attachments/assets/8f3b2180-6de4-40e1-a2b3-60ef90d2ba0c" />

**Mission**
To make software sourcing safe, compliant, and traceable for both individuals and enterprises by combining security principles, verified metadata, and transparent software intelligence.

**Key Features**
•	Security-First Software Index
Every listed software entry undergoes authenticity and integrity checks before publication.
•	Threat-Aware Download Management
Detects unsafe domains, redirects, and cloned sources.
•	Integrity and Metadata Validation
Verifies file hashes, SSL certificates, and digital signatures.
•	Publisher Verification Framework
Matches publishers to verified domains and certificates.
•	SafeLink Extension
Real-time browser extension that warns users about unsafe links.
•	Supabase-Backed Database
Stores verified entries with audit logs and version control.
•	Security Dashboard
Displays reports, flagged URLs, and verification statistics.
•	SoftMonk File Verifier
Allows users to confirm that a downloaded file is genuine and untampered.
Processing happens locally in the browser. No uploads, no data collection.
•	Community Forum
Discussions on OEM utilities, system tools, and cybersecurity practices.
Visit: https://softmonk.co/forum 

**Technology Stack**
Layer	Technology	Purpose
Frontend	Next.js + TypeScript	Modern UI, optimized for SEO
Styling	Tailwind CSS	Responsive, clean interface
Backend	Supabase (PostgreSQL, Auth, Storage)	Secure data and user management
Middleware	Custom verification engine	Software authenticity logic
Hosting	Vercel	Fast, global deployment
Browser Extension	Manifest v3 + JavaScript	Link protection tool
Security	JWT Auth, HTTPS, RLS	Enterprise-grade protection

**Architecture**
softmonk/
├── src/
│   ├── modules/
│   │   ├── verification/
│   │   ├── reporting/
│   │   └── analytics/
│   ├── components/
│   ├── pages/
│   └── utils/
├── database/
│   ├── migrations/
│   ├── policies/
│   └── seeds/
└── docs/
    └── system-architecture.md
**Workflow**
1.	User searches for software.
2.	Verified database returns safe entries.
3.	Verification engine validates source, SSL, and file hash.
4.	Moderation approves new entries.
5.	SafeLink and File Verifier protect end users in real time.

**Cybersecurity Design**
•	End-to-end HTTPS
•	Supabase Row-Level Security
•	JWT Authentication
•	Domain and SSL Validation
•	SHA256 File Fingerprinting
•	GDPR and NDPR Compliance
•	Suspicious Activity Logging

**Deployment**
Local Setup
1.	Install dependencies
npm install
2.	Configure environment variables
3.	NEXT_PUBLIC_SUPABASE_URL=
4.	NEXT_PUBLIC_SUPABASE_ANON_KEY=
5.	Run locally
npm run dev
Production
Deployed on Vercel with all secrets securely stored as environment variables.

**Security Philosophy**
“Trust nothing, verify everything.”
Every source, file, and publisher is validated through transparent and repeatable steps.

**Live Access**
•	Main Site: https://softmonk.co
•	About: https://softmonk.co/about
•	Forum: https://softmonk.co/forum
•	SoftMonk File Verifier: https://softmonk.co/verifier
•	SafeLink Checker: Coming soon
________________________________________
**Future Updates**
•	SoftMonk PC Plugin (Coming Soon)
o	Scans your system configuration and hardware details.
o	Detects missing drivers or OEM utilities.
o	Recommends official, verified downloads.
o	Performs local integrity checks before installation.
o	Designed for Windows 10 and 11 systems.

•	Enterprise Dashboard for IT administrators to manage software compliance across multiple users.
•	Public API for developers and cybersecurity analysts to query safety scores.
•	AI Anomaly Detection to detect cloned or malicious publisher domains.
•	Vendor Portal for OEMs to register verified software listings.

**Author**
**Emmanuel Folarin**
Cybersecurity and IT Systems Specialist
Founder, SupportNEX & Tethered Network Africa
Member, British Computer Society (BCS)
•	Website
•	LinkedIn

License
SoftMonk is released under the MIT License.
