# Switching sign-in on

Stage 6 of `notes/app-plan.md` is built and checked on the `app` branch. It needs these from Mo before anyone can sign in. Until then the Account page says sign-in isn't switched on yet, and everything else works as before.

Use the Cloudflare account that has the `zi` Worker in it.

1. **The database.** In Cloudflare, Storage & databases, then D1, then Create. Call it `zi`. Copy its Database ID and send it to Claude, who puts it in `wrangler.jsonc`.
2. **The build commands.** Once the ID's in, go to Workers & Pages, `zi`, Settings, Build. Set the deploy command to `npm run deploy` and the non-production branch deploy command to `npm run deploy:preview`. They make the tables before each deploy. If a build says it isn't allowed to use D1, give the build's API token D1 Edit.
3. **Google.** At console.cloud.google.com, make a project called Zi'Dara. In Google Auth Platform (APIs & Services, OAuth consent screen), set it up with the name Zi'Dara, your email, and External for the audience. Under Clients, create a Web application client with the redirect URI `https://zidara.world/api/auth/callback/google`. Copy the Client ID and Client secret. Under Audience, publish the app, so any Google account can sign in. It only asks for a name and email, so Google doesn't need to review it.
4. **Discord.** At discord.com/developers/applications, make a New Application called Zi'Dara. Under OAuth2, add the redirect `https://zidara.world/api/auth/callback/discord` and save. Copy the Client ID, then Reset Secret and copy the Client Secret.
5. **The secrets.** In Workers & Pages, `zi`, Settings, Variables and Secrets, add each of these as a Secret:
   - `BETTER_AUTH_SECRET`: 32 or more random characters (a password manager's generator is fine). Changing it later signs everyone out.
   - `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
   - `DISCORD_CLIENT_ID` and `DISCORD_CLIENT_SECRET`
   - `ADMIN_EMAIL`: the email on Mo's Google or Discord account. That account needs no invite and is the admin.
6. **First sign-in.** Once it's on zidara.world, Mo signs in at `/account/` with that account. Invites makes a link for each player, and People makes someone a GM, so they can hand out invites too.

To try it on the `app` branch's Preview before it goes to zidara.world, send Claude the Preview's address. It goes in `AUTH_HOSTS`, its two callback addresses (the same paths on that host) go in Google and Discord, and the secrets go on the Preview too.

Opening sign-ups to everyone later is one more variable, `OPEN_SIGNUPS` set to `yes`.
