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

### Moving the books to a server — Frappe

`storage.js` is the seam. It exposes exactly two functions:

```js
Storage.load()      // -> raw JSON string, or null
Storage.save(obj)   // -> {ok:true} | {ok:false, error:"..."}
```

A **Frappe backend already exists**: the `rokar` app at
`~/code/frappe-bench/apps/rokar`. To use it, swap the script tag in `index.html`:

```html
<script src="storage-frappe.js"></script>   <!-- instead of storage.js -->
```

`storage-frappe.js` is async, so `boot()` in `app.js` must `await Storage.load()`.
The file's closing comment spells out that change.

**Install the Frappe app:**

```bash
cd ~/code/frappe-bench
bench start                                    # in another terminal
bench new-site rokar.localhost                 # asks for the MariaDB root password
bench --site rokar.localhost install-app rokar
bench --site rokar.localhost add-system-manager vishal@fossunited.org
```

What Frappe adds over browser storage:

| | Browser | Frappe |
|---|---|---|
| Survives a cleared browser | no | yes |
| Two people entering at once | no | yes |
| Voucher immutable once passed | no | yes — submit/cancel |
| Who changed what, when | no | yes — version history |
| Clerk enters, accountant approves | no | yes — Rokar Clerk / Rokar Auditor roles |
| Voucher print layout | in `app.js` | a Print Format the school can edit |

The DocTypes enforce the rules server-side, so they hold no matter which
frontend writes: cost head required for STL and stripped elsewhere, `passed_by`
cleared on Construction, opening balance carried from the last closed day, cash
expenses summed from submitted vouchers, and a **written reason required whenever
the denomination count does not match the day's collection** — the ₹100 gap on
01-09-2026 could not have passed silently.

## Notes

- Fonts come from Google Fonts; the page still works offline with fallbacks.
- Sample data (nine vouchers, three daybook days) loads on first run so the
  reports are not empty. **"Clear and start real books"** wipes it and asks for the
  opening cash balance. Do that before the first real entry.
- Serial numbers, payee list, approver list, account list and particulars history
  all persist and grow as the office uses it.
