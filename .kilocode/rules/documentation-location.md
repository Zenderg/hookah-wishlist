# Documentation Location Rules

## Rule

All additional project documentation MUST be placed in the `/docs` directory
located at the root of the repository.

This includes (but is not limited to):
- architecture documentation,
- ADRs (Architecture Decision Records),
- design explanations,
- constraints and conventions,
- setup and operational guides.

The AI MUST NOT:
- scatter documentation across arbitrary folders,
- keep important project decisions only in code comments,
- rely solely on the Memory Bank without corresponding files in `/docs`.

If documentation is required, it MUST be created or updated inside `/docs`.

## Intent

Project documentation must remain accessible and usable without AI assistance.
