---
trigger: always_on
description: Universal rule strictly forbidding automatic git push across all projects to protect live production deployments. Always request user permission before pushing.
---

# Universal Git Push Safety Rule: Never Push Automatically

## 1. Strict Prohibition on Autonomous Git Push
- **Core Rule**: The AI agent must **NEVER** run `git push` on its own for any project in this workspace.
- **Why**: Repositories in this workspace are linked directly to live production environments (e.g. Vercel, GitHub Pages, CI/CD auto-deployments). Pushing changes autonomously deploys code directly to live production customers without user approval.

## 2. Mandatory Approval Protocol
Whenever code modifications, bug fixes, or feature additions are completed:
1. **Develop and Test Locally**: Perform all edits, builds, local server tests, and Playwright verification locally on the development machine.
2. **Local Commit (Optional / Safe)**: You may stage (`git add`) and commit (`git commit`) locally if requested or appropriate to save work.
3. **STOP AND ASK**: Always summarize the changes clearly to the user and explicitly ask:
   > *"Changes are tested and ready locally. Would you like me to push them to GitHub now to deploy to live production, or would you like to inspect them first?"*
4. **Push ONLY Upon Explicit Consent**: Run `git push` only when the user explicitly instructs you to push (e.g., "yes push", "push it", "go ahead and deploy").
