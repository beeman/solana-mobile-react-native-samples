# README Template Structure

This directory contains README templates for the react-native-samples repository.

**Important:** All sample apps in this repository are **Android only**. Do not include iOS-specific instructions, commands, or references in any documentation.

## Three-Tier Documentation Structure

Sample apps should follow a three-tier documentation structure:

### Tier 1: Root README (`app-name/README.md`)
High-level overview with screenshots, features, and basic setup for the entire app.

**Template:** [ROOT-README-TEMPLATE.md](ROOT-README-TEMPLATE.md)

**Purpose:**
- Give visitors a quick understanding of what the app does
- Show visual demos (screenshots/videos)
- List key features
- Explain project structure (frontend/backend/etc)
- Provide quick setup instructions for all parts
- Link to detailed submodule READMEs

### Tier 2: Submodule READMEs (`app-name/frontend/README.md`, `app-name/backend/README.md`)
Detailed technical documentation for specific parts of the app.

**Template:** [SUBMODULE-README-TEMPLATE.md](SUBMODULE-README-TEMPLATE.md)

**Purpose:**
- Detailed tech stack and dependencies
- Comprehensive setup and configuration
- Project structure for that module
- Key concepts and implementation details
- Common issues and troubleshooting
- Links to technical deep dives

### Tier 3: Technical Deep Dive (`TECHNICAL-GUIDE.md`) - Optional
For complex implementations, add a `TECHNICAL-GUIDE.md` in the submodule directory.

**Purpose:**
- In-depth explanation of implementation decisions
- Why specific approaches were chosen
- Code examples and detailed walkthroughs
- Advanced configuration options

## Example Structure

```
sample-app/
├── README.md                          # Root-level overview (use ROOT-README-TEMPLATE.md)
├── frontend/
│   ├── README.md                      # Detailed frontend docs (use SUBMODULE-README-TEMPLATE.md)
│   └── TECHNICAL-GUIDE.md             # Optional: Deep dive into complex features
└── backend/
    └── README.md                      # Detailed backend docs (use SUBMODULE-README-TEMPLATE.md)
```

## Templates

- **[ROOT-README-TEMPLATE.md](ROOT-README-TEMPLATE.md)** - Use for root-level app overview
- **[SUBMODULE-README-TEMPLATE.md](SUBMODULE-README-TEMPLATE.md)** - Use for frontend/backend/module-specific documentation

## Real Example

See the **Settle** app for a reference implementation:
- [settle/README.md](../settle/README.md) - Root overview with screenshots
- [settle/frontend/README.md](../settle/frontend/README.md) - Detailed frontend documentation
- [settle/frontend/TECHNICAL-GUIDE.md](../settle/frontend/TECHNICAL-GUIDE.md) - Deep dive into Solana integration
