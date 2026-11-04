# Security Policy

## Supported versions

Only the current version on the `main` branch is supported. Fixes are made there and are not backported.

## Scope

PyLab for Beginners is a static website. It has no server, no accounts and no database. Python code written by users runs locally in their browser via Pyodide. Reports about the following are especially welcome:

- Cross-site scripting (XSS) or other injection issues in the pages or the scripts in `js/`
- Anything that could leak data from a user's browser or change the content they see
- Problems with the loaded Pyodide or font resources, such as a supply-chain risk

## Reporting a vulnerability

Please **do not** open a public issue for security problems.

Report it privately via GitHub: go to the **Security** tab of this repository and choose **Report a vulnerability**. This creates a private advisory that only the maintainer can see.

Please include:

- a description of the problem and its impact
- steps to reproduce it (a short code example or page URL is ideal)
- the browser and operating system you used, if relevant

## What to expect

This is a hobby project maintained in spare time. I will try to reply within about 7 days, confirm whether the issue is valid, and fix it as soon as reasonably possible. Once a fix is released, I am happy to credit you in the advisory if you wish.

There is no bug bounty.
