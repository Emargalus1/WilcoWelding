# Wilco Welding publishing and recovery

- Admin saves write to GitHub first; Vercel deployment is separate.
- If an editor reports a revision conflict, reload instead of retrying a stale form.
- Before major edits, verify the latest Vercel production deployment is green.
- If a deployment fails, use Vercel Deploy Logs to identify and fix or revert the failed commit.
- Use specialized admin screens for fields controlled by `content.json`; use the full-page editor for template-level changes.
- Image uploads accept JPG, PNG, WebP, and GIF up to 10 MB.
- Keep `ADMIN_PASSWORD`, `GITHUB_TOKEN`, and Blob credentials only in Vercel environment variables.
