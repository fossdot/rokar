/* storage-frappe.js — keep the books in Frappe instead of the browser.
 *
 * To switch: in index.html, replace
 *     <script src="storage.js"></script>
 * with
 *     <script src="storage-frappe.js"></script>
 *
 * Requires the `rokar` Frappe app installed on the site, and the page served
 * from that same site (so the session cookie is sent). If you host this on
 * Netlify and Frappe elsewhere, add the Netlify origin to Frappe's
 * `allow_cors` in site_config.json and set CREDENTIALS below to "include".
 *
 * Unlike the localStorage adapter, these calls are async — see the note at the
 * bottom about the one change app.js needs.
 */
(function () {
  "use strict";

  var BASE = "";            // same-origin. Otherwise: "https://books.example.org"
  var CREDENTIALS = "same-origin";

  function api(path, opts) {
    opts = opts || {};
    var headers = { Accept: "application/json" };
    if (opts.body) headers["Content-Type"] = "application/json";
    // Frappe requires the CSRF token on writes from a logged-in session.
    if (window.frappe && window.frappe.csrf_token) {
      headers["X-Frappe-CSRF-Token"] = window.frappe.csrf_token;
    }
    return fetch(BASE + path, {
      method: opts.method || "GET",
      credentials: CREDENTIALS,
      headers: headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined
    }).then(function (r) {
      return r.json().then(function (j) {
        if (!r.ok) {
          var msg = (j && (j.exception || j._server_messages || j.message)) || r.statusText;
          throw new Error(String(msg).slice(0, 300));
        }
        return j;
      });
    });
  }

  var FIELDS = [
    "name", "posting_date", "unit", "debited_account", "cost_head", "mode",
    "payee", "address", "particulars", "amount", "spent_by", "passed_by", "docstatus"
  ];

  window.Storage = {
    mode: "frappe",

    /** Pull submitted vouchers and daybook days back into the shape app.js uses. */
    load: function () {
      return Promise.all([
        api("/api/resource/Cash Voucher?limit_page_length=0&filters=" +
            encodeURIComponent('[["docstatus","<",2]]') +
            "&fields=" + encodeURIComponent(JSON.stringify(FIELDS))),
        api("/api/resource/Daybook Day?limit_page_length=0&filters=" +
            encodeURIComponent('[["docstatus","<",2]]') +
            "&fields=" + encodeURIComponent(JSON.stringify(["name"]))),
        api("/api/resource/Rokar Settings/Rokar Settings")
      ]).then(function (res) {
        var vouchers = res[0].data || [];
        var dayNames = (res[1].data || []).map(function (d) { return d.name; });
        var settings = res[2].data || {};

        // Daybook days carry a child table, so each needs its own fetch.
        return Promise.all(dayNames.map(function (nm) {
          return api("/api/resource/Daybook Day/" + encodeURIComponent(nm))
                   .then(function (r) { return r.data; });
        })).then(function (days) {
          var out = { entries: [], days: {}, sample: false };
          vouchers.forEach(function (v) {
            out.entries.push({
              id: v.name, no: v.name, date: v.posting_date, account: v.debited_account,
              payee: v.payee, address: v.address || "", particulars: v.particulars,
              amount: v.amount, category: v.unit, head: v.cost_head || "",
              by: v.spent_by, approved: v.passed_by || "",
              mode: (v.mode || "Cash").toLowerCase().indexOf("upi") === 0 ? "upi"
                  : (v.mode || "").toLowerCase().indexOf("bank") === 0 ? "bank" : "cash",
              submitted: v.docstatus === 1
            });
          });
          days.forEach(function (d) {
            var denoms = {};
            (d.denominations || []).forEach(function (r) {
              if (r.qty) denoms[r.denomination] = r.qty;
            });
            out.days[d.posting_date] = {
              date: d.posting_date, opening: d.opening_balance, fee: d.fee_cash,
              bus: d.bus_cash, wdl: d.bank_withdrawal, other: d.other_cash,
              deposit: d.bank_deposit, upi: d.upi_received, denoms: denoms,
              closed: d.docstatus === 1
            };
          });
          out.openingSeed = settings.opening_cash_balance || 0;
          return JSON.stringify(out);
        });
      });
    },

    /** Frappe owns naming, validation and the audit trail, so writes go
     *  per-document rather than as one blob. */
    saveVoucher: function (e) {
      return api("/api/resource/Cash Voucher", {
        method: "POST",
        body: {
          posting_date: e.date, unit: e.category,
          debited_account: e.account, cost_head: e.head || null,
          mode: e.mode === "upi" ? "UPI" : e.mode === "bank" ? "Bank / cheque" : "Cash",
          payee: e.payee, address: e.address, particulars: e.particulars,
          amount: e.amount, spent_by: e.by, passed_by: e.approved || null
        }
      }).then(function (r) { return r.data; });
    },

    submitVoucher: function (name) {
      return api("/api/method/frappe.client.submit", {
        method: "POST",
        body: { doc: { doctype: "Cash Voucher", name: name } }
      });
    },

    saveDay: function (d) {
      var denominations = Object.keys(d.denoms || {}).map(function (face) {
        return { denomination: Number(face), qty: d.denoms[face] };
      });
      return api("/api/method/rokar.rokar.doctype.daybook_day.daybook_day.get_or_create" +
                 "?posting_date=" + encodeURIComponent(d.date))
        .then(function (r) {
          var existing = r.message || {};
          var body = {
            posting_date: d.date, fee_cash: d.fee, bus_cash: d.bus,
            bank_withdrawal: d.wdl, other_cash: d.other, bank_deposit: d.deposit,
            upi_received: d.upi, denominations: denominations
          };
          if (existing.name) {
            return api("/api/resource/Daybook Day/" + encodeURIComponent(existing.name),
                       { method: "PUT", body: body });
          }
          return api("/api/resource/Daybook Day", { method: "POST", body: body });
        });
    },

    /** Masters, so "+ add new" creates a real record other screens can link to. */
    addMaster: function (doctype, title, extra) {
      var body = { title: title };
      if (extra) Object.keys(extra).forEach(function (k) { body[k] = extra[k]; });
      return api("/api/resource/" + encodeURIComponent(doctype), { method: "POST", body: body });
    },

    /* The blob interface app.js currently calls. Frappe saves per document, so
       this is a no-op kept for signature compatibility. */
    save: function () { return { ok: true }; }
  };
})();

/* ---------------------------------------------------------------------------
 * ONE CHANGE app.js NEEDS
 *
 * The localStorage adapter is synchronous; this one is not. In app.js, boot()
 * currently does:
 *
 *     var raw = Storage.load();
 *
 * Make boot() async and await it:
 *
 *     async function boot(){
 *       var raw = await Storage.load();
 *       ...
 *     }
 *
 * and have addVoucher() / saveDay() call Storage.saveVoucher() / saveDay()
 * instead of persist(). Everything else is untouched.
 * ------------------------------------------------------------------------- */
