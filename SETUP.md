# Connecting the form to a Google Sheet

Right now the form sends nothing (`SCRIPT_URL = ""` in `config.js`). Every finished answer is still saved in the person's own browser as a backup (localStorage key `mapweek:last`). When you're ready to collect answers:

1. **Make the sheet.** Open a new Google Sheet (sheets.new) with the account that should own the data, and give it a name, e.g. "Map your week – responses".

2. **Paste the script.** In the sheet go to **Extensions → Apps Script**. Delete what's there, paste the whole of `apps_script.gs`, and press **Save**. Choose `setup` in the function dropdown and press **▶ Run**. Google asks for permission the first time: allow it. This creates three tabs: **Responses**, **Events** and **Referrals**.

3. **Deploy as a web app.** Click **Deploy → New deployment**. For the type, click the gear and choose **Web app**. Set *Execute as*: **Me**, and *Who has access*: **Anyone**. Press **Deploy**, then copy the **Web app URL** (it ends in `/exec`).

4. **Paste the URL in `config.js`.** Set `SCRIPT_URL = "https://script.google.com/macros/s/…/exec";`. Also set `SITE_URL` to the public link once you know it (e.g. `"https://mapmyweek.netlify.app"`). This link is printed on the My Week card and used in the WhatsApp challenge. In `index.html`, change `og:image` to the full address too, e.g. `https://mapmyweek.netlify.app/og-image.png`, so WhatsApp shows the preview.

5. **Test once.** Open the site, finish the form, and check that a row appears in **Responses** and `start`/`step_…` rows appear in **Events**. Open the site with `?r=TEST01` at the end of the link and finish again: **Referrals** should show `TEST01 · 1`.

## Later

- **College leaderboard:** after about 30 responses, set `LEADERBOARD = true` in `config.js`. The end screen then reads college counts from the same web app (counts only, never names or numbers). If the call fails, the block just stays hidden.
- **Changed the script?** Use **Deploy → Manage deployments → ✏️ → Version: New version → Deploy**. This keeps the same URL.
- **Referrals tab:** `referred_by_code` counts responses that came from each person's link, `referrer_name` shows who owns that code, and `sees_map_first` says "yes" at 2 or more.
- **Map contacts:** if someone adds a WhatsApp number on the end screen, it lands in the `map_contact` column of their row (matched by their `my_ref_code`).
