# Map your week

A one-question-at-a-time form that maps where young grads in Delhi NCR live and work. Plain HTML + CSS + JavaScript, no build step. It's hosted free on GitHub Pages.

## Files
| File | What it is |
|---|---|
| `index.html` | The page shell (title, link preview tags, fonts) |
| `styles.css` | All the look: colours, fonts, spacing, animations, dark mode |
| `app.js` | All the questions, copy, reactions, the hidden clock and the end screen |
| `config.js` | Settings: `SCRIPT_URL` (Google Sheet link), `LEADERBOARD`, `SITE_URL` |
| `apps_script.gs` | Code to paste into Google Apps Script so answers land in a Google Sheet |
| `SETUP.md` | 5 steps to connect the Google Sheet |
| `og-image.png` | The picture shown when the link is pasted on WhatsApp |

## How to edit
- **Change any question text, option or reaction:** edit `app.js`. Search for the text you want to change.
- **Change colours or sizes:** edit `styles.css`. Colours are at the top (`:root`).
- On github.com you can open a file, click the ✏️ pencil, edit, and press **Commit changes**. The live site updates on its own in about 1 minute.

## Live link
https://prathamkathi.github.io/map-your-week/
