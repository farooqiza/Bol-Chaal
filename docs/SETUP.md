# Setup Guide

Two layers of setup: the **content engine** (works today, only needs a Claude API
key) and **auto-publishing** (needs Meta/LinkedIn access). You can start with the
first and add the second when you're ready.

---

## 1. Content engine (required)

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # then edit .env
export PYTHONPATH=src       # so `python -m brightstars` works
```

### Claude API key (`ANTHROPIC_API_KEY`)
1. Go to <https://console.anthropic.com> → **API Keys** → create a key.
2. Put it in `.env` as `ANTHROPIC_API_KEY=sk-ant-...`.
3. Test offline first (no key needed): `python -m brightstars sample next`.
4. Then the real thing: `python -m brightstars generate next`.

That's all you need to generate, review, and approve content. Publishing can stay
manual (copy/paste from `REVIEW.md`) until you set up the APIs below.

---

## 2. Auto-publishing to Facebook + Instagram (Meta)

You confirmed you have **admin access to the Facebook Page and Instagram account** —
that's the hard prerequisite. Now connect them to the API.

### a. Link Instagram to the Facebook Page
- The Instagram account must be a **Business** (or Creator) account.
- In the Instagram app: Settings → **Account type** → switch to Business.
- Link it to the Facebook Page: Meta **Business Suite** → Settings → connect the IG account to the Page.

### b. Create a Meta app + get tokens
1. Go to <https://developers.facebook.com> → **My Apps** → **Create App** → type "Business".
2. Add the **Instagram Graph API** and **Facebook Login** products.
3. Open **Graph API Explorer**, select your app, and request these permissions:
   `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`,
   `instagram_basic`, `instagram_content_publish`, `business_management`.
4. Generate a **User access token**, then exchange it for a **long-lived Page
   access token** (Meta's docs: "Get a Page Access Token"). Long-lived Page tokens
   don't expire as long as the admin stays active.
5. Find your IDs:
   - **Page ID** — Graph API Explorer: `GET /me/accounts` → your Page's `id`.
   - **IG user id** — `GET /{page-id}?fields=instagram_business_account`.
6. Fill `.env`:
   ```
   META_PAGE_ID=...
   META_PAGE_ACCESS_TOKEN=...
   META_IG_USER_ID=...
   ```

> ⚠️ **App Review:** to publish on behalf of the Page in production, Meta usually
> requires your app to pass **App Review** for `pages_manage_posts` and
> `instagram_content_publish`. While in *Development mode* the API works for admins/
> testers of the app, which is enough to get going.

### c. Instagram needs a public image URL
Instagram's API can't accept raw image files — it needs a **public URL** for each
image. Set each post's `image_url` (in `calendar.json` or via your image step)
before publishing. Easy options:
- Put approved images in this repo under `assets/` and use the
  `https://raw.githubusercontent.com/...` URL, **or**
- Upload to Google Drive and use a public link, **or** any image host.

Facebook can post text-only or link posts without an image; Instagram always needs one.

---

## 3. Auto-publishing hiring posts to LinkedIn (optional)

1. Create an app at <https://www.linkedin.com/developers/> and associate it with
   your **Company Page**.
2. Request the **Community Management API** access (and the `w_organization_social`
   scope). This requires LinkedIn's approval.
3. Get an access token authorized for the organization, and your org URN
   (`urn:li:organization:XXXXXXX`).
4. Fill `.env`:
   ```
   LINKEDIN_ORG_URN=urn:li:organization:XXXXXXX
   LINKEDIN_ACCESS_TOKEN=...
   ```

LinkedIn is optional — if you skip it, LinkedIn posts simply stay in `REVIEW.md`
for you to post by hand (it's only ~1 hiring post/week).

---

## 4. Run it on autopilot (GitHub Actions)

Add each `.env` value as a **GitHub repository secret**
(Settings → Secrets and variables → Actions → New repository secret):

`ANTHROPIC_API_KEY`, `META_PAGE_ID`, `META_PAGE_ACCESS_TOKEN`, `META_IG_USER_ID`,
`LINKEDIN_ORG_URN`, `LINKEDIN_ACCESS_TOKEN`.

Then:
- **`.github/workflows/generate-content.yml`** runs monthly, drafts next month, and
  opens a Pull Request for you to review/approve.
- **`.github/workflows/publish-content.yml`** runs daily and publishes that day's
  **approved** posts.

You can also trigger either manually from the **Actions** tab ("Run workflow").

> **Token upkeep:** Meta long-lived Page tokens and LinkedIn tokens can expire or be
> revoked. If publishing starts failing with a 400/401, regenerate the token and
> update the secret.
