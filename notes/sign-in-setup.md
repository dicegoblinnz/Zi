# Switching sign-in on

Stage 6 of `notes/app-plan.md`. Everything below was done on 18 Oct, and sign-in with Google has been live on zidara.world since. If a secret goes missing, the Account page says sign-in isn't switched on, and everything else works as before.

Use the Cloudflare account that has the `zi` Worker in it. Discord waits for now (Mo, 18 Oct). It switches on later with two more secrets, `DISCORD_CLIENT_ID` and `DISCORD_CLIENT_SECRET`, and a redirect of `https://zidara.world/api/auth/callback/discord` in a Discord app.

1. **The database.** Done 18 Oct: `zi`, in `wrangler.jsonc`.
2. **The build commands.** In Workers & Pages, `zi`, Settings, Build, the build command stays `npm run build`, the deploy command is `npm run deploy`, and the non-production branch deploy command is `npm run deploy:preview`. A deploy from `main` makes the tables first. If that build says it isn't allowed to use D1, give the build's API token D1 Edit.
3. **Google.** The client's made, and its id is in `wrangler.jsonc`. At console.cloud.google.com, in Google Auth Platform:
   - Branding: the app name Zi'Dara and a support email.
   - Audience: External, then Publish app, so any Google account can sign in. It only asks for a name and an email, so Google doesn't review it.
   - Clients: open the Web application client and add the authorised redirect URI `https://zidara.world/api/auth/callback/google`, then save. Copy its client secret, which starts with `GOCSPX-`. Google only shows a secret once and hides the panel on a phone, so use Chrome's Desktop site, Add secret and copy the new one straight away. A wrong secret shows on the Account page as `invalid_code`.
4. **The secrets.** In Workers & Pages, `zi`, Settings, Variables and Secrets, Add, with the type Secret:
   - `BETTER_AUTH_SECRET`: 32 or more random characters (a password manager's generator is fine). Changing it later signs everyone out.
   - `GOOGLE_CLIENT_SECRET`: from step 3.
   - `ADMIN_EMAIL`: the email on Mo's Google account. That account needs no invite and is the admin.
5. **First sign-in.** Mo signs in at `/account/`, makes an invite link for each player under Invites, and makes someone a GM under People, so they can hand out invites too.

Previews share the live database, so sign-in stays off on them. Trying it on a Preview first needs a second database for Previews.

Opening sign-ups to everyone later is one more variable, `OPEN_SIGNUPS` set to `yes`.
