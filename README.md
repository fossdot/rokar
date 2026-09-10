# Rokar — Cash Book & Voucher Register

Cash vouchers, daybook and monthly cost-head reports for **Noor Girls High School**
(Meghwal, Mathiya) — Hikmat Foundation.

A static site. No build step, no framework, no server. Five files.

```
index.html    markup
styles.css    all styling (light + dark)
app.js        all behaviour
storage.js    the only file that knows where the books are kept
netlify.toml  headers + publish config
```

## Run it locally

```bash
python3 -m http.server 4173
```

Then open <http://localhost:4173>.

## Deploy to Netlify

Drag the folder onto Netlify, or connect the repo — publish directory `.`,
build command empty. `netlify.toml` already sets `noindex` and the usual
security headers; this is an internal tool and should not be in search results.

**Put it behind a password.** Netlify's Site protection → Password protection
is enough. Anyone with the URL can otherwise read the school's books.

## What it does

| Tab | Purpose |
|---|---|
| **Cash Voucher** | Numbered voucher (`NGHS/26-27/0001`), amount auto-spelled in Indian words, prints A5 in the same layout as the paper voucher book |
| **Register** | Every voucher for a month; CSV export, plus a Tally-shaped CSV for the CA |
| **Daybook** | Opening balance carries forward, cash expenses auto-fill from that day's vouchers, denomination count reconciles live against the day's collection |
| **Reports** | Unit × cost-head matrix, spend by person, cash movement, daily collection summary |

### Units and cost heads

Four units: **School**, **Residence**, **STL**, **Construction**.

Cost heads (**Program Delivery**, **Beneficiary Support**, **Contingency**) apply to
**STL only** — the field is hidden for every other unit, which books straight to its
Debited A/c.

Construction vouchers print **two** signatures (Accountant, Signature of Contractor);
all others print three (Accountant, Passed by, Signature of Receiver).

## Storage — read this

The books live in **this browser, on this computer**. Nothing is sent anywhere.

That means clearing browser data, reinstalling, or moving to another computer
**loses everything**. So:

> **Press "Back up all books" in the Reports tab at the end of every working day**
> and keep the JSON file somewhere else — Drive, email, a pen drive.

"Restore from backup" reads that file back, after showing you what is in it versus
what is on the computer now.

### Moving the books to a server

`storage.js` is the seam. It exposes exactly two functions:

```js
Storage.load()      // -> raw JSON string, or null
Storage.save(obj)   // -> {ok:true} | {ok:false, error:"..."}
```

Point those at Supabase, Pocketbase, a Frappe endpoint, whatever — and make them
async, changing `boot()` in `app.js` to await the load. Nothing else in the app
knows or cares where the data sits.

## Notes

- Fonts come from Google Fonts; the page still works offline with fallbacks.
- Sample data (nine vouchers, three daybook days) loads on first run so the
  reports are not empty. **"Clear and start real books"** wipes it and asks for the
  opening cash balance. Do that before the first real entry.
- Serial numbers, payee list, approver list, account list and particulars history
  all persist and grow as the office uses it.
