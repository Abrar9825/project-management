/**
 * AI Service - OpenRouter Integration
 * Uses OpenRouter API with GPT for intelligent document generation
 */

class AIService {
    static API_URL = 'https://openrouter.ai/api/v1/chat/completions';

    /**
     * Send a prompt to OpenRouter and get a response
     * @param {string} systemPrompt - The system context
     * @param {string} userPrompt - The user message / data
     * @param {boolean} jsonMode - Whether to request JSON output
     * @returns {string} AI response content
     */
    static async generate(systemPrompt, userPrompt, jsonMode = true) {
        const apiKey = process.env.OPENROUTER_API_KEY;
        const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4.1-nano';

        if (!apiKey) {
            console.warn('[AIService] No OPENROUTER_API_KEY set - falling back to template generation');
            return null;
        }

        try {
            const body = {
                model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.7,
                max_tokens: 4000
            };

            if (jsonMode) {
                body.response_format = { type: 'json_object' };
            }

            const res = await fetch(AIService.API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                    'HTTP-Referer': 'http://localhost:5000',
                    'X-Title': 'AgencyControl Document Generator'
                },
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                const errText = await res.text();
                console.error('[AIService] API error:', res.status, errText);
                return null;
            }

            const data = await res.json();
            const content = data.choices?.[0]?.message?.content;

            if (!content) {
                console.error('[AIService] Empty response from API');
                return null;
            }

            return content;
        } catch (err) {
            console.error('[AIService] Request failed:', err.message);
            return null;
        }
    }

    /**
     * Generate a structured document using AI
     * @param {string} docType - Document type label
     * @param {object} projectData - Sanitized project data for context
     * @returns {object|null} Parsed JSON content or null
     */
    static async generateDocument(docType, projectData) {
        const systemPrompt = `You are a professional document generator for KINNOVANCE, a digital agency. You create structured, detailed, and professional documents for agency-client engagements.

RULES:
- Generate the document in valid JSON format
- The JSON must have: "title" (string), "generatedDate" (ISO date string), "summary" (a brief 2-3 sentence summary derived from the project description), "sections" (object with nested data)
- Use professional, clear, formal language
- Include all relevant details from the project data provided
- The "summary" field MUST be generated from the project "description" field - summarize what the project is about
- Make sections organized with clear headings
- Include actual project data values - do NOT use placeholder text
- Dates should be formatted nicely
- Currency amounts should be numbers
- Be thorough but concise
- Always include client details (name, company, email, phone) in a "clientDetails" section
- The document footer should mention "KINNOVANCE"
- Company name is always "KINNOVANCE"`;

        const userPrompt = `Generate a professional "${docType}" document for this project:

${JSON.stringify(projectData, null, 2)}

IMPORTANT: The "summary" field must be derived from the project description: "${projectData.description || projectData.scopeOfWork || ''}"
Include all client info dynamically. Company name is KINNOVANCE.

Return a structured JSON document with "title", "generatedDate", "summary", and "sections" containing all relevant sections for a ${docType}.`;

        const result = await AIService.generate(systemPrompt, userPrompt, true);
        if (!result) return null;

        try {
            return JSON.parse(result);
        } catch (e) {
            // Try to extract JSON from the response
            const match = result.match(/\{[\s\S]*\}/);
            if (match) {
                try { return JSON.parse(match[0]); } catch (e2) { /* fall through */ }
            }
            console.error('[AIService] Failed to parse AI response as JSON');
            return null;
        }
    }

    /**
     * Generate a document from a user description (without full project data)
     * @param {string} docType - Document type (requirement, quotation, agreement, design-brief)
     * @param {string} description - User's description of what they need
     * @param {object} project - Project object with basic info (name, client details)
     * @returns {object|null} Parsed JSON content or null
     */
    static async generateDocumentFromDescription(docType, description, project) {
        const clientName = project?.clientDetails?.name || 'N/A';
        const clientCompany = project?.clientDetails?.company || 'N/A';
        const clientEmail = project?.clientDetails?.email || 'N/A';
        const clientPhone = project?.clientDetails?.phone || 'N/A';
        const projectName = project?.name || 'N/A';

        const prompts = AIService.getTypeSpecificPrompt(docType, {
            description, projectName, clientName, clientCompany, clientEmail, clientPhone
        });

        const result = await AIService.generate(prompts.system, prompts.user, true);
        if (!result) return null;

        try {
            return JSON.parse(result);
        } catch (e) {
            const match = result.match(/\{[\s\S]*\}/);
            if (match) {
                try { return JSON.parse(match[0]); } catch (e2) { /* fall through */ }
            }
            console.error('[AIService] Failed to parse AI response as JSON');
            return null;
        }
    }

    /**
     * Get type-specific system + user prompts for each document type
     */
    static getTypeSpecificPrompt(docType, ctx) {
        const baseRules = `
STRICT RULES:
- Return ONLY valid JSON. No markdown, no code blocks.
- Use professional, formal English.
- All money values must be realistic numbers (not $XX,XXX placeholders).
- Dates must be realistic ISO date strings.
- Company generating this document is always "KINNOVANCE".
- Include "companyBranding" object with: { "name": "KINNOVANCE", "logo": "/images/logo.svg", "tagline": "Digital Solutions Partner", "footer": "This document is generated by KINNOVANCE — Confidential" }
- Include "clientInfo" object with: { "name": "${ctx.clientName}", "company": "${ctx.clientCompany}", "email": "${ctx.clientEmail}", "phone": "${ctx.clientPhone}" }
- Include "projectName": "${ctx.projectName}"
- Include "generatedDate" as today's ISO date string.
- Be detailed and thorough in every section.`;

        const prompts = {

            // ─────────────────── REQUIREMENT DOCUMENT ───────────────────
            'requirement': {
                system: `You are a senior business analyst at KINNOVANCE (a digital agency). You write professional Software Requirement Specification (SRS) documents.
${baseRules}

JSON STRUCTURE (follow exactly):
{
  "title": "Requirement Document - [Project Name]",
  "generatedDate": "ISO date",
  "companyBranding": { "name": "KINNOVANCE", "logo": "/images/logo.svg", "tagline": "Digital Solutions Partner", "footer": "..." },
  "clientInfo": { "name", "company", "email", "phone" },
  "projectName": "...",
  "summary": "2-3 sentence overview of the project requirements",
  "sections": {
    "Project Overview": {
      "Project Name": "...",
      "Client": "...",
      "Prepared By": "KINNOVANCE",
      "Date": "...",
      "Purpose": "Brief purpose of this document"
    },
    "Business Requirements": {
      "Business Goals": ["goal1", "goal2", ...],
      "Target Users": "Who will use this system",
      "Business Rules": ["rule1", "rule2", ...]
    },
    "Functional Requirements": {
      "Core Features": ["feature1", "feature2", ...],
      "User Roles & Permissions": ["role1: description", ...],
      "Integrations": ["integration1", ...]
    },
    "Non-Functional Requirements": {
      "Performance": "...",
      "Security": "...",
      "Scalability": "...",
      "Availability": "..."
    },
    "Technical Specifications": {
      "Recommended Technology Stack": { "Frontend": "...", "Backend": "...", "Database": "...", "Hosting": "..." },
      "System Architecture": "Brief description"
    },
    "Deliverables": ["deliverable1", "deliverable2", ...],
    "Timeline": {
      "Estimated Duration": "...",
      "Phases": [{"phase": "...", "duration": "...", "deliverables": "..."}]
    },
    "Assumptions & Constraints": ["item1", "item2", ...],
    "Acceptance Criteria": ["criteria1", "criteria2", ...]
  }
}`,
                user: `Write a detailed Requirement Document for:

Project: ${ctx.projectName}
Client: ${ctx.clientName} (${ctx.clientCompany})
Description: "${ctx.description}"

Generate comprehensive functional & non-functional requirements, tech stack recommendations, timeline, and deliverables based on the description.`
            },

            // ─────────────────── QUOTATION ───────────────────
            'quotation': {
                system: `You are a senior project estimator at KINNOVANCE (a digital agency). You create professional, detailed quotations with realistic pricing.
${baseRules}

IMPORTANT: All prices MUST be realistic numbers based on the project scope. Use actual dollar amounts like $2500, $8000 etc. NEVER use placeholder values like $XX,XXX.

JSON STRUCTURE (follow exactly):
{
  "title": "Quotation - [Project Name]",
  "generatedDate": "ISO date",
  "companyBranding": { "name": "KINNOVANCE", "logo": "/images/logo.svg", "tagline": "Digital Solutions Partner", "footer": "..." },
  "clientInfo": { "name", "company", "email", "phone" },
  "projectName": "...",
  "summary": "2-3 sentence summary of what this quotation covers",
  "sections": {
    "Quotation Details": {
      "Quotation Number": "QTN-XXXX",
      "Date": "...",
      "Valid Until": "30 days from date",
      "Prepared For": "Client name & company",
      "Prepared By": "KINNOVANCE"
    },
    "Project Scope": {
      "Overview": "What will be built",
      "Key Features": ["feature1", "feature2", ...]
    },
    "Cost Breakdown": {
      "items": [
        {"description": "UI/UX Design", "details": "...", "amount": 2500},
        {"description": "Frontend Development", "details": "...", "amount": 5000},
        {"description": "Backend Development", "details": "...", "amount": 6000},
        {"description": "Testing & QA", "details": "...", "amount": 1500},
        {"description": "Deployment & Launch", "details": "...", "amount": 1000}
      ],
      "subtotal": 16000,
      "tax": 0,
      "discount": 0,
      "total": 16000,
      "currency": "USD"
    },
    "Timeline": {
      "Estimated Duration": "...",
      "Milestones": [{"milestone": "...", "duration": "...", "deliverable": "..."}]
    },
    "Payment Terms": {
      "Schedule": [
        {"percentage": 40, "description": "Upon project commencement"},
        {"percentage": 30, "description": "Upon mid-project milestone"},
        {"percentage": 30, "description": "Upon final delivery"}
      ],
      "Payment Methods": "Bank transfer / Online payment",
      "Late Payment": "..."
    },
    "Terms & Conditions": {
      "Revisions": "...",
      "Warranty": "...",
      "Confidentiality": "...",
      "Cancellation": "..."
    },
    "What's Included": ["item1", "item2", ...],
    "What's Not Included": ["item1", "item2", ...]
  }
}`,
                user: `Create a detailed professional quotation for:

Project: ${ctx.projectName}
Client: ${ctx.clientName} (${ctx.clientCompany})
Description: "${ctx.description}"

Generate realistic pricing based on the scope described. Include itemized costs, timeline, payment terms, and full terms & conditions.`
            },

            // ─────────────────── CLIENT AGREEMENT ───────────────────
            'agreement': {
                system: `You are a legal consultant at KINNOVANCE (a digital agency). You draft professional client service agreements / contracts.
${baseRules}

JSON STRUCTURE (follow exactly):
{
  "title": "Client Service Agreement - [Project Name]",
  "generatedDate": "ISO date",
  "companyBranding": { "name": "KINNOVANCE", "logo": "/images/logo.svg", "tagline": "Digital Solutions Partner", "footer": "..." },
  "clientInfo": { "name", "company", "email", "phone" },
  "projectName": "...",
  "summary": "2-3 sentence summary of the agreement",
  "sections": {
    "Parties": {
      "Service Provider": { "name": "KINNOVANCE", "type": "Digital Solutions Agency", "address": "..." },
      "Client": { "name": "client name", "company": "company", "email": "email" }
    },
    "Scope of Work": {
      "Project Description": "...",
      "Services to be Provided": ["service1", "service2", ...],
      "Deliverables": ["deliverable1", "deliverable2", ...],
      "Out of Scope": ["item1", "item2", ...]
    },
    "Project Timeline": {
      "Start Date": "...",
      "Estimated Completion": "...",
      "Milestones": [{"milestone": "...", "target": "..."}]
    },
    "Compensation & Payment": {
      "Total Project Cost": "$XX,XXX",
      "Payment Schedule": [{"percentage": 40, "when": "..."}],
      "Late Payment Penalty": "..."
    },
    "Intellectual Property": {
      "Ownership Transfer": "Upon full payment, all IP rights transfer to client",
      "Pre-existing IP": "KINNOVANCE retains rights to pre-existing tools and frameworks",
      "License": "..."
    },
    "Confidentiality": {
      "Obligations": "...",
      "Duration": "...",
      "Exceptions": ["..."]
    },
    "Warranties & Liability": {
      "Service Warranty": "...",
      "Bug Fix Period": "...",
      "Limitation of Liability": "..."
    },
    "Termination": {
      "By Client": "...",
      "By Provider": "...",
      "Effect of Termination": "..."
    },
    "Dispute Resolution": {
      "Governing Law": "...",
      "Resolution Process": "..."
    },
    "Signatures": {
      "Provider": { "name": "KINNOVANCE", "title": "Authorized Representative", "date": "___________" },
      "Client": { "name": "${ctx.clientName}", "title": "Authorized Representative", "date": "___________" }
    }
  }
}`,
                user: `Draft a professional client service agreement for:

Project: ${ctx.projectName}
Client: ${ctx.clientName} (${ctx.clientCompany})
Description: "${ctx.description}"

Create a comprehensive agreement covering scope, timeline, payment, IP rights, confidentiality, warranties, termination, and dispute resolution.`
            },

            // ─────────────────── DESIGN BRIEF ───────────────────
            'design-brief': {
                system: `You are a senior creative director at KINNOVANCE (a digital agency). You write professional design briefs that guide the design and development team.
${baseRules}

JSON STRUCTURE (follow exactly):
{
  "title": "Design Brief - [Project Name]",
  "generatedDate": "ISO date",
  "companyBranding": { "name": "KINNOVANCE", "logo": "/images/logo.svg", "tagline": "Digital Solutions Partner", "footer": "..." },
  "clientInfo": { "name", "company", "email", "phone" },
  "projectName": "...",
  "summary": "2-3 sentence overview of the design direction",
  "sections": {
    "Project Overview": {
      "Project Name": "...",
      "Client": "...",
      "Industry": "...",
      "Project Type": "Web App / Mobile App / SaaS / E-commerce / etc.",
      "Objective": "What this project aims to achieve"
    },
    "Target Audience": {
      "Primary Users": "...",
      "User Demographics": "...",
      "User Goals": ["goal1", "goal2", ...],
      "User Pain Points": ["pain1", "pain2", ...]
    },
    "Design Requirements": {
      "Brand Style": "Modern / Minimal / Corporate / Bold / etc.",
      "Color Palette": { "Primary": "#008080", "Secondary": "#1a1a2e", "Accent": "...", "Background": "...", "Text": "..." },
      "Typography": { "Headings": "...", "Body": "...", "Style": "..." },
      "Imagery Style": "...",
      "Iconography": "..."
    },
    "Pages & Screens": [
      {"page": "Dashboard", "description": "Main overview with key metrics and quick actions"},
      {"page": "...", "description": "..."}
    ],
    "Key Features & UX": {
      "Must-Have Features": ["feature1", "feature2", ...],
      "Nice-to-Have Features": ["feature1", "feature2", ...],
      "User Flow": "Brief description of primary user journey"
    },
    "Technical Considerations": {
      "Responsive Design": "Mobile-first / Desktop-first",
      "Browser Support": "...",
      "Accessibility": "WCAG 2.1 AA compliance",
      "Performance": "..."
    },
    "Inspiration & References": {
      "Similar Products": ["ref1", "ref2", ...],
      "Design Inspiration": "...",
      "What to Avoid": ["avoid1", "avoid2", ...]
    },
    "Deliverables": ["Wireframes", "High-fidelity mockups", "Design system", "Prototype", "..."],
    "Timeline": {
      "Design Phase Duration": "...",
      "Review Cycles": "...",
      "Final Handoff": "..."
    }
  }
}`,
                user: `Create a detailed design brief for:

Project: ${ctx.projectName}
Client: ${ctx.clientName} (${ctx.clientCompany})
Description: "${ctx.description}"

Generate comprehensive design direction including target audience, visual style, color palette, typography, pages/screens, UX requirements, and technical considerations.`
            }
        };

        return prompts[docType] || prompts['requirement'];
    }
}

module.exports = AIService;
