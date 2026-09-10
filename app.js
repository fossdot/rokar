"use strict";
/* ---------------- constants ---------------- */
var DENOMS=[500,200,100,50,20,10,5,2,1];
var CATS=["School","Residence","STL","Construction"];
/* Cost heads apply to STL alone; every other unit books straight to its account. */
var STL_HEADS=["Program Delivery","Beneficiary Support","Contingency"];
var HEADS_ALL=STL_HEADS;                       /* report columns */
function headsFor(cat){ return cat==="STL"?STL_HEADS:[]; }
var DEFAULT_PEOPLE=["Anand","Shams","Sukhal","Khurshid","Sajjad Miyan","Ajay Kumar","Chandan Kumar"];
var DEFAULT_APPROVERS=["Shams","Anand","Principal"];
var DEFAULT_PAYEES=["Local vegetable market"];
var DEFAULT_ACCOUNTS={School:"School EXP",Residence:"Residence EXP",STL:"STL A/c",Construction:"Construction A/c"};
var ORG="Noor Girls High School";
var PLACE="Meghwal, Mathiya";
var FYCODE="26-27";

/* ---------------- state ---------------- */
var S={entries:[],days:{},mode:"local",sample:true,openingSeed:0,
       people:DEFAULT_PEOPLE.slice(),approvers:DEFAULT_APPROVERS.slice(),
       payees:DEFAULT_PAYEES.slice(),accounts:[],particulars:[]};


/* ---------------- helpers ---------------- */
function $(s,r){return (r||document).querySelector(s);}
function $$(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));}
function el(t,c,x){var e=document.createElement(t); if(c)e.className=c; if(x!=null)e.textContent=x; return e;}
function n(v){v=Number(v); return isFinite(v)?v:0;}
function inr(v){
  v=Math.round(n(v));
  var neg=v<0; v=Math.abs(v);
  var s=String(v), last3=s.slice(-3), rest=s.slice(0,-3);
  if(rest) last3=","+last3;
  rest=rest.replace(/\B(?=(\d{2})+(?!\d))/g,",");
  return (neg?"-":"")+rest+last3;
}
function rs(v){return "₹"+inr(v);}
function iso(d){var p=function(x){return String(x).padStart(2,"0");}; return d.getFullYear()+"-"+p(d.getMonth()+1)+"-"+p(d.getDate());}
function todayISO(){return iso(new Date());}
function ym(d){return (d||"").slice(0,7);}
function dmy(d){if(!d)return ""; var a=d.split("-"); return a[2]+"-"+a[1]+"-"+a[0];}
function monthLabel(k){
  if(!k) return "";
  var M=["January","February","March","April","May","June","July","August","September","October","November","December"];
  var a=k.split("-"); return M[Number(a[1])-1]+" "+a[0];
}
/* Indian numbering, words */
var ONES=["","one","two","three","four","five","six","seven","eight","nine","ten","eleven","twelve","thirteen","fourteen","fifteen","sixteen","seventeen","eighteen","nineteen"];
var TENS=["","","twenty","thirty","forty","fifty","sixty","seventy","eighty","ninety"];
function under100(x){ if(x<20) return ONES[x]; var t=TENS[Math.floor(x/10)], o=ONES[x%10]; return o?t+"-"+o:t; }
function under1000(x){ var h=Math.floor(x/100), r=x%100; var out=[]; if(h)out.push(ONES[h]+" hundred"); if(r)out.push((h?"and ":"")+under100(r)); return out.join(" "); }
function words(v){
  v=Math.round(n(v));
  if(v<=0) return "—";
  var parts=[], units=[[10000000,"crore"],[100000,"lakh"],[1000,"thousand"]];
  for(var i=0;i<units.length;i++){
    var d=Math.floor(v/units[i][0]);
    if(d){ parts.push((d<1000?under1000(d):String(d))+" "+units[i][1]); v%=units[i][0]; }
  }
  if(v) parts.push(under1000(v));
  var s=parts.join(" ");
  return "Rupees "+s.charAt(0).toUpperCase()+s.slice(1)+" only";
}
function csv(rows){
  return rows.map(function(r){
    return r.map(function(c){
      c=(c==null?"":String(c));
      return /[",\n]/.test(c) ? '"'+c.replace(/"/g,'""')+'"' : c;
    }).join(",");
  }).join("\r\n");
}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7);}

/* ---------------- sample seed ---------------- */
function seed(){
  var t=new Date(), y=t.getFullYear(), m=t.getMonth();
  function dd(day){var d=new Date(y,m,day); return iso(d);}
  var day=Math.max(3,Math.min(t.getDate(),26));
  var E=[
    /* account, payee, address, particulars, amount, unit, head, by, mode */
    ["Residence EXP","Sabir Gas Agency","Mathiya","Gas cylinder refilling 1 pcs",1070,"Residence","Program Delivery","Anand","cash"],
    ["Residence EXP","Local vegetable market","Mathiya","Bhindi 1kg, mirchi 250g, aloo 5kg",265,"Residence","Program Delivery","Sukhal","cash"],
    ["School EXP","Firoj Ansari","Mathiya","Light repairing, labour charge",200,"School","Program Delivery","Shams","cash"],
    ["School EXP","Nashim Electricals","Lauriya","Classroom fan repairing 6 pcs",500,"School","Program Delivery","Shams","cash"],
    ["School EXP","Bharat Petroleum","Ramnagar","Petrol refilling - school bus",1200,"School","Program Delivery","Shams","cash"],
    ["School EXP","Century Stationers","Bettiah","A4 paper 1 packet, printer ink",995,"School","Beneficiary Support","Anand","upi"],
    ["STL A/c","Chandan Kumar","Mathiya","Scholarship form processing - 9 students",450,"STL","Beneficiary Support","Khurshid","cash"],
    ["STL A/c","Ajay Kumar","Meghwal","Emergency travel - district office",380,"STL","Contingency","Khurshid","cash"],
    ["Science Block Floor-3 Construction A/c","Sajjad Miyan","Lauriya","Payment of Mobilization Advance",50000,"Construction","Program Delivery","Shams","bank"]
  ];
  var dayOf=[day-2,day-2,day-1,day-1,day,day,day,day-1,day];
  S.entries=E.map(function(r,i){
    return {id:uid(),no:"NGHS/"+FYCODE+"/"+String(i+1).padStart(4,"0"),date:dd(dayOf[i]),
            account:r[0],payee:r[1],address:r[2],particulars:r[3],amount:r[4],
            category:r[5],head:(r[5]==="STL"?r[6]:""),by:r[7],mode:r[8],approved:"Shams",sample:true,ts:Date.now()+i};
  });
  var open=34530;
  [[dd(day-2),5000,800,0,0,2550],[dd(day-1),2500,400,0,0,400],[dd(day),1600,0,10000,0,550]].forEach(function(r){
    var expenses=S.entries.filter(function(e){return e.date===r[0]&&e.mode==="cash";})
                          .reduce(function(a,e){return a+e.amount;},0);
    var recd=r[1]+r[2]+r[4];
    var counted=(r[0]===dd(day-2))?recd-100:recd; /* mirrors the real 01-09 ₹100 gap */
    var dn={}; var rem=counted;
    DENOMS.forEach(function(f){ var q=Math.floor(rem/f); if(q){dn[f]=q; rem-=q*f;} });
    S.days[r[0]]={date:r[0],opening:open,fee:r[1],bus:r[2],wdl:r[3],other:r[4],deposit:0,upi:r[5],
                  denoms:dn,closed:true,sample:true};
    open=open+r[1]+r[2]+r[3]+r[4]-expenses-0;
  });
  S.accounts=[]; S.payees=[]; S.particulars=[];
  E.forEach(function(r){
    if(S.accounts.indexOf(r[0])<0) S.accounts.push(r[0]);
    if(S.payees.indexOf(r[1])<0) S.payees.push(r[1]);
    if(S.particulars.indexOf(r[3])<0) S.particulars.push(r[3]);
  });
  S.payees.sort();
  S.openingSeed=34530; S.sample=true;
}

/* ---------------- persistence ---------------- */
function payload(){return {v:1,savedAt:new Date().toISOString(),
                           entries:S.entries,days:S.days,sample:S.sample,openingSeed:S.openingSeed,
                           people:S.people,approvers:S.approvers,payees:S.payees,
                           accounts:S.accounts,particulars:S.particulars};}
function roster(){return {sample:S.sample,openingSeed:S.openingSeed,org:ORG,fy:FYCODE,
                          people:S.people,approvers:S.approvers,accounts:S.accounts};}
function saveLocal(){
  var r=Storage.save(payload());
  var el2=document.getElementById("backup-note");
  if(!r.ok&&el2){ el2.textContent="Could not save to this browser: "+r.error; el2.style.color="var(--bad)"; }
}
function persist(){ saveLocal(); }

/* ---------------- boot ---------------- */
function boot(){
  buildStatic();
  var raw=Storage.load();
  if(raw && typeof raw.then==="function"){
    /* Frappe adapter: render the empty shell now, fill it when the books arrive. */
    renderAll();
    raw.then(applyLoaded).catch(function(e){
      setBanner("info","Could not reach the server",
                (e&&e.message)||"The books could not be loaded. Nothing has been changed.");
    });
  } else {
    applyLoaded(raw);
  }
}
function applyLoaded(raw){
  try{
    if(raw){ var p=JSON.parse(raw);
             S.entries=p.entries||[]; S.days=p.days||{}; S.sample=!!p.sample; S.openingSeed=n(p.openingSeed);
             if(p.people&&p.people.length) S.people=p.people;
             if(p.approvers&&p.approvers.length) S.approvers=p.approvers;
             if(p.payees&&p.payees.length) S.payees=p.payees;
             if(p.accounts) S.accounts=p.accounts;
             if(p.particulars) S.particulars=p.particulars; }
  }catch(e){}
  if(!S.entries.length && !Object.keys(S.days).length && Storage.mode!=="frappe") seed();
  renderAll();
}

/* Storage lives in Storage.load/save (storage.js) so this file never
   assumes where the books are kept. Swap that module to move off the browser. */

/* ---------------- static build ---------------- */
function buildStatic(){
  $("#f-date").value=todayISO();
  $("#d-date").value=todayISO();
  buildCatChips();
  buildHeadChips("School");
  suggestAccount("School");
  applySigRules("School");
  fillPeople();
  var tb=$("#d-denoms");
  DENOMS.forEach(function(f){
    var tr=el("tr");
    tr.appendChild(el("td","face","₹"+f));
    var td=el("td","r"); var i=el("input"); i.type="number"; i.min="0"; i.step="1"; i.className="num";
    i.dataset.face=f; i.value=""; i.placeholder="0"; td.appendChild(i); tr.appendChild(td);
    var v=el("td","r num","0"); v.dataset.val=f; tr.appendChild(v);
    tb.appendChild(tr);
  });
  /* tabs */
  $$(".tab").forEach(function(t){
    t.addEventListener("click",function(){
      $$(".tab").forEach(function(o){o.setAttribute("aria-selected",String(o===t));});
      $$(".view").forEach(function(v){v.hidden=(v.id!=="v-"+t.dataset.v);});
      if(t.dataset.v==="reports") renderReports();
      if(t.dataset.v==="register") renderRegister();
    });
  });
  $("#add-by").addEventListener("click",function(){ addPerson("people","#f-by","Name of the person who spent the cash"); });
  $("#add-appr").addEventListener("click",function(){ addPerson("approvers","#f-appr","Name of the person who passes the voucher"); });
  $("#add-payee").addEventListener("click",function(){ addPerson("payees","#f-payee","Name of the vendor, contractor or person being paid"); });
  attachSuggest("#f-part","#part-sug",function(){return S.particulars;});
  ["f-date","f-payee","f-addr","f-acct","f-part","f-amt","f-by","f-mode","f-appr"].forEach(function(id){
    $("#"+id).addEventListener("input",function(){ if(id==="f-amt") $("#f-words").textContent=words($("#f-amt").value); renderSlip(); });
  });
  $("#vform").addEventListener("submit",addVoucher);
  $("#v-clear").addEventListener("click",resetForm);
  $("#btn-print").addEventListener("click",function(){ $("#printarea").innerHTML=$("#slip").outerHTML; window.print(); });
  $("#r-month").addEventListener("change",renderRegister);
  $("#r-cat").addEventListener("change",renderRegister);
  $("#p-month").addEventListener("change",renderReports);
  $("#d-date").addEventListener("change",loadDay);
  ["d-fee","d-bus","d-wdl","d-oth","d-dep","d-upi"].forEach(function(id){ $("#"+id).addEventListener("input",calcDay); });
  $("#d-denoms").addEventListener("input",calcDay);
  $("#d-save").addEventListener("click",saveDay);
  $("#d-clear").addEventListener("click",function(){ $$("#d-denoms input").forEach(function(i){i.value="";}); calcDay(); });
  $("#x-vouchers").addEventListener("click",exportRegister);
  $("#x-tally").addEventListener("click",exportTally);
  $("#x-daybook").addEventListener("click",exportDaybook);
  $("#x-backup").addEventListener("click",backupNow);
  $("#x-restore").addEventListener("click",function(){ $("#f-restore").click(); });
  $("#f-restore").addEventListener("change",function(){ if(this.files[0]) restoreFrom(this.files[0]); this.value=""; });
}

/* ---------------- banner ---------------- */
var forcedBanner=null;
function setBanner(kind,title,body){ forcedBanner={kind:kind,title:title,body:body}; renderBanner(); }
function renderBanner(){
  var slot=$("#banner-slot"); slot.innerHTML="";
  if(forcedBanner){
    var b=el("div","banner "+forcedBanner.kind);
    b.appendChild(el("b",null,forcedBanner.title)); b.appendChild(el("span",null,forcedBanner.body));
    slot.appendChild(b); return;
  }
  if(S.sample){
    var s=el("div","banner sample");
    s.appendChild(el("b",null,"Sample data"));
    s.appendChild(el("span",null,"Seven example vouchers and three daybook days are loaded so you can see the reports working. Clear them before the first real entry."));
    var btn=el("button","btn sm","Clear and start real books"); btn.type="button";
    btn.addEventListener("click",startReal);
    s.appendChild(btn); slot.appendChild(s);
  }
}
function startReal(){
  var open=prompt("Opening cash in hand today (₹)","0");
  if(open===null) return;
  S.entries=[]; S.days={}; S.sample=false; S.openingSeed=n(open);
  var d=todayISO();
  S.days[d]={date:d,opening:S.openingSeed,fee:0,bus:0,wdl:0,other:0,deposit:0,upi:0,denoms:{},closed:false};
  persist(); renderAll();
}

/* ---------------- chips & roster ---------------- */
function pressed(sel){ var c=$(sel+' .chip[aria-pressed="true"]'); return c?c.dataset.val:""; }
function buildCatChips(){
  var box=$("#f-cat"); box.innerHTML="";
  CATS.forEach(function(c,i){
    var b=el("button","chip",c); b.type="button"; b.dataset.val=c;
    b.setAttribute("aria-pressed",String(i===0));
    b.addEventListener("click",function(){
      $$(".chip",box).forEach(function(o){o.setAttribute("aria-pressed",String(o===b));});
      buildHeadChips(c);
      suggestAccount(c);
      applySigRules(c);
      renderSlip();
    });
    box.appendChild(b);
  });
}
/* Contingency is offered for STL only; any other unit falls back to a base head. */
function buildHeadChips(cat){
  var box=$("#f-head"), keep=pressed("#f-head"), opts=headsFor(cat);
  box.innerHTML="";
  $("#f-headwrap").hidden=!opts.length;
  if(!opts.length) return;                     /* no chips pressed => head stays "" */
  if(opts.indexOf(keep)<0) keep=opts[0];
  opts.forEach(function(h){
    var b=el("button","chip",h); b.type="button"; b.dataset.val=h;
    b.setAttribute("aria-pressed",String(h===keep));
    b.addEventListener("click",function(){
      $$(".chip",box).forEach(function(o){o.setAttribute("aria-pressed",String(o===b));});
      renderSlip();
    });
    box.appendChild(b);
  });
}
/* A contractor voucher is signed by the accountant and the contractor only —
   there is no "Passed by" block on the printed construction slip. */
function applySigRules(cat){
  var two=(cat==="Construction");
  $("#f-apprwrap").hidden=two;
  $("#f-sigrow").classList.toggle("one",two);
}
function suggestAccount(cat){
  var f=$("#f-acct"), was=f.value.trim();
  var isDefault=!was||Object.keys(DEFAULT_ACCOUNTS).some(function(k){return DEFAULT_ACCOUNTS[k]===was;});
  if(isDefault) f.value=DEFAULT_ACCOUNTS[cat]||"";
  f.placeholder=cat==="Construction"?"e.g. Science Block Floor-3 Construction A/c":(DEFAULT_ACCOUNTS[cat]||"");
}
function fillPeople(){
  [["#f-by",S.people],["#f-appr",S.approvers],["#f-payee",S.payees]].forEach(function(p){
    var sel=$(p[0]), was=sel.value;
    sel.innerHTML="";
    p[1].forEach(function(nm){ sel.appendChild(new Option(nm,nm)); });
    if(p[1].indexOf(was)>=0) sel.value=was;
  });
}
/* Adds to the saved roster so the name is picked from a list next time —
   matching case-insensitively so "anand" never becomes a second Anand. */
function addPerson(key,sel,ask){
  var nm=prompt(ask,"");
  if(nm===null) return;
  nm=nm.trim(); if(!nm) return;
  var exists=S[key].filter(function(x){return x.toLowerCase()===nm.toLowerCase();})[0];
  if(exists) nm=exists; else { S[key].push(nm); S[key].sort(); }
  fillPeople(); $(sel).value=nm; persist(); renderSlip();
  if(Storage.addMaster){
    var dt={people:"Rokar Person",approvers:"Rokar Person",payees:"Rokar Payee"}[key];
    if(dt) Storage.addMaster(dt,nm).catch(function(){ /* already exists: harmless */ });
  }
}

/* ---------------- voucher ---------------- */
function nextNo(){
  var mx=0;
  S.entries.forEach(function(e){ var m=/(\d+)$/.exec(e.no||""); if(m) mx=Math.max(mx,Number(m[1])); });
  return "NGHS/"+FYCODE+"/"+String(mx+1).padStart(4,"0");
}
function formData(){
  return {date:$("#f-date").value,payee:$("#f-payee").value,particulars:$("#f-part").value.trim(),
          amount:n($("#f-amt").value),category:pressed("#f-cat"),head:pressed("#f-head"),
          account:$("#f-acct").value.trim(),address:$("#f-addr").value.trim(),
          by:$("#f-by").value,mode:$("#f-mode").value,
          approved:(pressed("#f-cat")==="Construction")?"":$("#f-appr").value};
}
/* Lays out the same form as the printed NGHS voucher book:
   masthead, Debited A/c / Paid to / Date / Address, a ruled
   S.NO.-Particulars-Amount table, Rupees in Word + Total, three signatures. */
function renderSlip(){
  var d=formData(), no=nextNo();
  $("#next-no").textContent="Next: "+no;
  var s=$("#slip"); s.innerHTML="";

  var mh=el("div","mh");
  mh.appendChild(el("div","nm",ORG));
  mh.appendChild(el("div","pl",PLACE));
  s.appendChild(mh);

  function fieldRow(pairs){
    var r=el("div","fr");
    pairs.forEach(function(p){
      r.appendChild(el("span","fl",p[0]));
      r.appendChild(el("span","fv"+(p[2]?" "+p[2]:""),p[1]||""));
    });
    return r;
  }
  var F=el("div","fields");
  F.appendChild(fieldRow([["Debited A/c :",d.account]]));
  F.appendChild(fieldRow([["Paid to Mr./Mrs./M/s:",d.payee,"grow2"],["Date :-",dmy(d.date)]]));
  F.appendChild(fieldRow([["Address :-",d.address]]));
  F.appendChild(fieldRow([["Voucher No. :",no],["Mode :-",d.mode.toUpperCase()]]));
  s.appendChild(F);

  var t=el("table","vt");
  var th=el("thead"), htr=el("tr");
  htr.appendChild(el("th","c-sn","S.NO."));
  htr.appendChild(el("th",null,"Particulars"));
  htr.appendChild(el("th","c-amt","Amount"));
  th.appendChild(htr); t.appendChild(th);

  var tb=el("tbody"), r1=el("tr");
  r1.appendChild(el("td","c-sn","1."));
  r1.appendChild(el("td",null,d.particulars||""));
  r1.appendChild(el("td","c-amt",d.amount?inr(d.amount):""));
  tb.appendChild(r1);
  var blank=el("tr","filler");
  blank.appendChild(el("td","c-sn")); blank.appendChild(el("td")); blank.appendChild(el("td","c-amt"));
  tb.appendChild(blank);
  t.appendChild(tb);

  var tf=el("tfoot"), wr=el("tr","wordrow");
  var wc=el("td"); wc.colSpan=2;
  wc.appendChild(el("span",null,"Rupees in Word"));
  wc.appendChild(el("span","w",d.amount?words(d.amount).replace(/^Rupees /,"").replace(/ only$/," Rupees Only"):""));
  wr.appendChild(wc);
  wr.appendChild(el("td","c-amt grand",d.amount?inr(d.amount):""));
  tf.appendChild(wr); t.appendChild(tf);
  s.appendChild(t);

  var isBuild=(d.category==="Construction");
  var blocks=isBuild
    ? [[d.by,"Accountant"],["","Signature of Contractor"]]
    : [[d.by,"Accountant"],[d.approved,"Passed by"],["","Signature of Receiver"]];
  var sg=el("div","sigs"+(isBuild?" two":""));
  blocks.forEach(function(p){
    var b=el("div","sig");
    b.appendChild(el("div","nm",p[0]||""));
    b.appendChild(el("div","lb",p[1]));
    sg.appendChild(b);
  });
  s.appendChild(sg);
}
function addVoucher(ev){
  ev.preventDefault();
  var d=formData();
  if(!d.amount||d.amount<=0){ alert("Enter an amount greater than zero."); return; }
  if(!d.payee||!d.particulars){ alert("Fill in who was paid and what for."); return; }
  if(!d.account){ alert("Enter the account to debit \u2014 it prints on the voucher."); $("#f-acct").focus(); return; }
  if(d.category==="STL"&&!d.head){ alert("Pick a cost head \u2014 STL vouchers need one."); return; }
  d.id=uid(); d.no=nextNo(); d.ts=Date.now();
  S.entries.push(d);
  if(d.account && S.accounts.indexOf(d.account)<0) S.accounts.push(d.account);
  if(d.particulars && S.particulars.indexOf(d.particulars)<0){
    S.particulars.unshift(d.particulars);
    S.particulars=S.particulars.slice(0,400);   /* keep the suggestion list bounded */
  }
  if(!S.days[d.date]) S.days[d.date]={date:d.date,opening:openingFor(d.date),fee:0,bus:0,wdl:0,other:0,deposit:0,upi:0,denoms:{},closed:false};
  persist(); resetForm(); renderAll();
  if(Storage.saveVoucher){
    Storage.saveVoucher(d).then(function(saved){
      d.no=saved.name; d.id=saved.name; d.serverSaved=true;   /* adopt Frappe's series number */
      persist(); renderAll();
    }).catch(function(err){
      S.entries=S.entries.filter(function(x){return x.id!==d.id;});   /* do not keep a row the server rejected */
      persist(); renderAll();
      alert("The server did not accept this voucher:\n\n"+((err&&err.message)||"unknown error")+
            "\n\nNothing was saved. Check the entry and try again.");
    });
  }
}
/* Keeps date, unit, cost head, Debited A/c and both signatories — a clerk
   entering ten School vouchers in a row only retypes payee, detail, amount. */
function resetForm(){
  var keepDate=$("#f-date").value;
  $("#f-addr").value=""; $("#f-part").value=""; $("#f-amt").value="";
  $("#f-date").value=keepDate||todayISO(); $("#f-words").textContent="—";
  renderSlip(); $("#f-payee").focus();
}
function delEntry(id){
  if(!confirm("Delete this voucher? It stays out of every report.")) return;
  S.entries=S.entries.filter(function(e){return e.id!==id;});
  persist(); renderAll();
}

/* ---------------- daybook ---------------- */
function cashExpFor(date){
  return S.entries.filter(function(e){return e.date===date&&e.mode==="cash";})
                  .reduce(function(a,e){return a+n(e.amount);},0);
}
function dayKeys(){ return Object.keys(S.days).sort(); }
function closingOf(d){
  var day=S.days[d]; if(!day) return 0;
  return n(day.opening)+n(day.fee)+n(day.bus)+n(day.wdl)+n(day.other)-cashExpFor(d)-n(day.deposit);
}
function openingFor(date){
  var prior=dayKeys().filter(function(k){return k<date;});
  if(!prior.length) return S.openingSeed;
  return closingOf(prior[prior.length-1]);
}
function loadDay(){
  var d=$("#d-date").value; if(!d) return;
  var day=S.days[d]||{date:d,opening:openingFor(d),fee:0,bus:0,wdl:0,other:0,deposit:0,upi:0,denoms:{},closed:false};
  $("#d-fee").value=n(day.fee); $("#d-bus").value=n(day.bus); $("#d-wdl").value=n(day.wdl);
  $("#d-oth").value=n(day.other); $("#d-dep").value=n(day.deposit); $("#d-upi").value=n(day.upi);
  $$("#d-denoms input").forEach(function(i){ var q=(day.denoms||{})[i.dataset.face]; i.value=q?q:""; });
  $("#d-note").textContent=day.closed?"Closed":"Open";
  calcDay();
}
function calcDay(){
  var d=$("#d-date").value; if(!d) return;
  var opening=openingFor(d), exp=cashExpFor(d);
  var fee=n($("#d-fee").value), bus=n($("#d-bus").value), wdl=n($("#d-wdl").value),
      oth=n($("#d-oth").value), dep=n($("#d-dep").value);
  $("#d-open").textContent=inr(opening);
  $("#d-exp").textContent=inr(exp);
  $("#d-close").textContent=inr(opening+fee+bus+wdl+oth-exp-dep);
  var counted=0;
  $$("#d-denoms input").forEach(function(i){
    var f=Number(i.dataset.face), q=n(i.value), v=f*q;
    counted+=v;
    var cell=$('#d-denoms td[data-val="'+f+'"]'); if(cell) cell.textContent=inr(v);
  });
  $("#d-dtot").textContent=inr(counted);
  var collected=fee+bus+oth, diff=counted-collected;
  var bar=$("#d-var");
  bar.className="varbar "+(diff===0?"ok":"bad");
  bar.innerHTML="";
  bar.appendChild(el("span",null, diff===0 ? "Count matches collection of "+rs(collected)
      : (diff>0?"Counted more than collected":"Counted short of collection")+" — collection "+rs(collected)));
  bar.appendChild(el("b",null,(diff>0?"+":"")+rs(diff)));
  var fl=$("#d-depflag"); fl.innerHTML="";
  if(dep>0){
    var b=el("div","banner info"); b.style.margin="12px 0 0";
    b.appendChild(el("b",null,"Deposited to bank"));
    b.appendChild(el("span",null,rs(dep)+" moved to ICICI on "+dmy(d)+". This is highlighted in the monthly report."));
    fl.appendChild(b);
  }
  renderDayTable();
}
function saveDay(){
  var d=$("#d-date").value; if(!d) return;
  var dn={};
  $$("#d-denoms input").forEach(function(i){ var q=n(i.value); if(q) dn[i.dataset.face]=q; });
  S.days[d]={date:d,opening:openingFor(d),fee:n($("#d-fee").value),bus:n($("#d-bus").value),
             wdl:n($("#d-wdl").value),other:n($("#d-oth").value),deposit:n($("#d-dep").value),
             upi:n($("#d-upi").value),denoms:dn,closed:true};
  persist(); $("#d-note").textContent="Closed"; renderAll();
  if(Storage.saveDay){
    Storage.saveDay(S.days[d]).catch(function(err){
      setBanner("info","Day not saved to the server",
                ((err&&err.message)||"unknown error")+" — it is still held in this browser.");
    });
  }
}
function countedOf(d){
  var day=S.days[d]||{}; var t=0;
  Object.keys(day.denoms||{}).forEach(function(f){ t+=Number(f)*n(day.denoms[f]); });
  return t;
}
function renderDayTable(){
  var mk=ym($("#d-date").value);
  var tb=$("#d-table tbody"); tb.innerHTML="";
  var keys=dayKeys().filter(function(k){return ym(k)===mk;});
  $("#d-mnote").textContent=monthLabel(mk)+" · "+keys.length+" day"+(keys.length===1?"":"s")+" recorded";
  if(!keys.length){
    var tr=el("tr"); var td=el("td","empty","No days recorded in "+monthLabel(mk)+" yet."); td.colSpan=10; tr.appendChild(td); tb.appendChild(tr); return;
  }
  keys.forEach(function(k){
    var day=S.days[k], exp=cashExpFor(k), counted=countedOf(k), coll=n(day.fee)+n(day.bus)+n(day.other);
    var tr=el("tr");
    tr.appendChild(el("td",null,dmy(k)));
    [day.opening,day.fee,day.bus,day.wdl,exp,day.deposit,closingOf(k),day.upi].forEach(function(v,i){
      var td=el("td","r num",inr(v));
      if(i===5&&n(v)>0) td.style.color="var(--blue)";
      if(i===6) td.style.fontWeight="600";
      tr.appendChild(td);
    });
    var td=el("td");
    if(!Object.keys(day.denoms||{}).length) td.appendChild(el("span","pill p-mute","not counted"));
    else if(counted===coll) td.appendChild(el("span","pill p-ok","tallies"));
    else { var p=el("span","pill p-bad",(counted-coll>0?"+":"")+inr(counted-coll)); td.appendChild(p); }
    tr.appendChild(td);
    tb.appendChild(tr);
  });
}

/* ---------------- register ---------------- */
function months(){
  var set={};
  S.entries.forEach(function(e){ if(e.date) set[ym(e.date)]=1; });
  Object.keys(S.days).forEach(function(d){ set[ym(d)]=1; });
  set[ym(todayISO())]=1;
  return Object.keys(set).sort().reverse();
}
function fillMonths(sel){
  var cur=sel.value, ms=months();
  sel.innerHTML="";
  ms.forEach(function(m){ sel.appendChild(new Option(monthLabel(m),m)); });
  sel.value=(ms.indexOf(cur)>=0)?cur:ms[0];
}
function renderRegister(){
  fillMonths($("#r-month"));
  var mk=$("#r-month").value, cat=$("#r-cat").value;
  var rows=S.entries.filter(function(e){return ym(e.date)===mk&&(!cat||e.category===cat);})
                    .sort(function(a,b){return a.date<b.date?-1:a.date>b.date?1:(a.no<b.no?-1:1);});
  var tb=$("#r-table tbody"), tf=$("#r-table tfoot");
  tb.innerHTML=""; tf.innerHTML="";
  $("#r-note").textContent=rows.length+" voucher"+(rows.length===1?"":"s");
  if(!rows.length){
    var tr=el("tr"); var td=el("td","empty","No vouchers for "+monthLabel(mk)+(cat?" under "+cat:"")+"."); td.colSpan=11; tr.appendChild(td); tb.appendChild(tr); return;
  }
  var total=0;
  rows.forEach(function(e){
    total+=n(e.amount);
    var tr=el("tr");
    tr.appendChild(el("td","vno",e.no));
    tr.appendChild(el("td",null,dmy(e.date)));
    tr.appendChild(el("td",null,e.account||"\u2014"));
    tr.appendChild(el("td",null,e.payee));
    var pt=el("td",null,e.particulars); pt.style.maxWidth="280px"; tr.appendChild(pt);
    var c=el("td"); c.appendChild(el("span","pill p-"+e.category.toLowerCase(),e.category)); tr.appendChild(c);
    tr.appendChild(el("td",null,e.head||"\u2014"));
    tr.appendChild(el("td",null,e.by));
    var md=el("td"); md.appendChild(el("span","pill p-mute",e.mode)); tr.appendChild(md);
    tr.appendChild(el("td","r num",inr(e.amount)));
    var x=el("td"); var b=el("button","lnk","delete"); b.type="button";
    b.addEventListener("click",function(){delEntry(e.id);}); x.appendChild(b); tr.appendChild(x);
    tb.appendChild(tr);
  });
  var ftr=el("tr"); var f1=el("td",null,"Total — "+monthLabel(mk)); f1.colSpan=9;
  ftr.appendChild(f1); ftr.appendChild(el("td","r num",inr(total))); ftr.appendChild(el("td"));
  tf.appendChild(ftr);
}

/* ---------------- reports ---------------- */
function renderReports(){
  fillMonths($("#p-month"));
  var mk=$("#p-month").value;
  var ents=S.entries.filter(function(e){return ym(e.date)===mk;});
  var dks=dayKeys().filter(function(k){return ym(k)===mk;});
  var spend=ents.reduce(function(a,e){return a+n(e.amount);},0);
  var feeCash=dks.reduce(function(a,k){return a+n(S.days[k].fee);},0);
  var busCash=dks.reduce(function(a,k){return a+n(S.days[k].bus);},0);
  var upi=dks.reduce(function(a,k){return a+n(S.days[k].upi);},0);
  var wdl=dks.reduce(function(a,k){return a+n(S.days[k].wdl);},0);
  var dep=dks.reduce(function(a,k){return a+n(S.days[k].deposit);},0);
  var closing=dks.length?closingOf(dks[dks.length-1]):S.openingSeed;
  var opening=dks.length?n(S.days[dks[0]].opening):S.openingSeed;

  var T=$("#p-tiles"); T.innerHTML="";
  [["Total expense",rs(spend),ents.length+" vouchers","lead"],
   ["Fee collected — cash",rs(feeCash),dks.length+" days recorded",""],
   ["Bus fee — cash",rs(busCash),"",""],
   ["UPI received",rs(upi),"memo — outside cash book",""],
   ["Withdrawn from bank",rs(wdl),"ICICI",""],
   ["Deposited to bank",rs(dep),"ICICI",""],
   ["Closing cash",rs(closing),"opened at "+rs(opening),""]
  ].forEach(function(t){
    var d=el("div","tile"+(t[3]?" "+t[3]:""));
    d.appendChild(el("div","k",t[0])); d.appendChild(el("div","v",t[1]));
    if(t[2]) d.appendChild(el("div","s",t[2]));
    T.appendChild(d);
  });

  /* matrix */
  var M=$("#p-matrix"); M.innerHTML="";
  var th=el("thead"), htr=el("tr"); htr.appendChild(el("th",null,"Unit"));
  HEADS_ALL.forEach(function(h){ htr.appendChild(el("th","r",h)); });
  htr.appendChild(el("th","r","Total")); th.appendChild(htr); M.appendChild(th);
  var body=el("tbody"), colTot={}, grand=0;
  HEADS_ALL.forEach(function(h){colTot[h]=0;});
  CATS.forEach(function(c){
    var tr=el("tr"); var lab=el("td"); lab.appendChild(el("span","pill p-"+c.toLowerCase(),c)); tr.appendChild(lab);
    var mine=ents.filter(function(e){return e.category===c;});
    var rowTot=mine.reduce(function(a,e){return a+n(e.amount);},0);
    grand+=rowTot;
    if(c==="STL"){
      HEADS_ALL.forEach(function(h){
        var v=mine.filter(function(e){return e.head===h;}).reduce(function(a,e){return a+n(e.amount);},0);
        colTot[h]+=v;
        tr.appendChild(el("td","r num",v?inr(v):"\u2014"));
      });
    } else {
      var na=el("td","r"); na.colSpan=HEADS_ALL.length;
      na.style.cssText="background:var(--surface-2);color:var(--faint);font-size:11.5px;text-align:center";
      na.textContent="no cost head \u2014 booked to account";
      tr.appendChild(na);
    }
    var tt=el("td","r num",rowTot?inr(rowTot):"\u2014"); tt.style.fontWeight="600"; tr.appendChild(tt);
    body.appendChild(tr);
  });
  M.appendChild(body);
  var tf=el("tfoot"), ftr=el("tr"); ftr.appendChild(el("td",null,"Total"));
  HEADS_ALL.forEach(function(h){ ftr.appendChild(el("td","r num",colTot[h]?inr(colTot[h]):"\u2014")); });
  ftr.appendChild(el("td","r num",inr(grand))); tf.appendChild(ftr); M.appendChild(tf);

  /* people */
  var P=$("#p-people"); P.innerHTML="";
  var agg={}; ents.forEach(function(e){ agg[e.by]=(agg[e.by]||0)+n(e.amount); });
  var names=Object.keys(agg).sort(function(a,b){return agg[b]-agg[a];});
  var mx=names.length?agg[names[0]]:1;
  var ph=el("thead"); var phr=el("tr");
  ["Person","Share","Amount ₹"].forEach(function(h,i){ phr.appendChild(el("th",i===2?"r":"",h)); });
  ph.appendChild(phr); P.appendChild(ph);
  var pb=el("tbody");
  if(!names.length){ var etr=el("tr"); var etd=el("td","empty","No vouchers this month."); etd.colSpan=3; etr.appendChild(etd); pb.appendChild(etr); }
  names.forEach(function(nm,i){
    var tr=el("tr"); tr.appendChild(el("td",null,nm));
    var bc=el("td"); var w=el("div","barcell");
    var bar=el("div","bar"+(i%3===1?" b2":i%3===2?" b3":""));
    bar.style.width=Math.max(2,Math.round(agg[nm]/mx*130))+"px";
    w.appendChild(bar); w.appendChild(el("span","num",Math.round(agg[nm]/grand*100||0)+"%"));
    $$("span",w)[0].style.cssText="font-size:11.5px;color:var(--muted)";
    bc.appendChild(w); tr.appendChild(bc);
    tr.appendChild(el("td","r num",inr(agg[nm])));
    pb.appendChild(tr);
  });
  P.appendChild(pb);

  /* money movement */
  var MM=$("#p-money"); MM.innerHTML="";
  var mh=el("thead"), mhr=el("tr"); mhr.appendChild(el("th",null,"Line")); mhr.appendChild(el("th","r","Amount ₹"));
  mh.appendChild(mhr); MM.appendChild(mh);
  var mb=el("tbody");
  [["Opening cash",opening],["Fee cash received",feeCash],["Bus fee cash received",busCash],
   ["Withdrawn from bank",wdl],["Cash expenses",-ents.filter(function(e){return e.mode==="cash";}).reduce(function(a,e){return a+n(e.amount);},0)],
   ["Deposited to bank",-dep],["Closing cash",closing]].forEach(function(r,i,arr){
    var tr=el("tr");
    tr.appendChild(el("td",null,r[0]));
    var td=el("td","r num",(r[1]<0?"(":"")+inr(Math.abs(r[1]))+(r[1]<0?")":""));
    if(r[1]<0) td.style.color="var(--accent-ink)";
    if(i===arr.length-1||i===0) td.style.fontWeight="600";
    tr.appendChild(td); mb.appendChild(tr);
  });
  MM.appendChild(mb);

  /* collection */
  var C=$("#p-coll"); C.innerHTML="";
  var ch=el("thead"), chr=el("tr");
  ["Date","Fee cash","Bus cash","Total collected","Counted","Variance","UPI","Bank"].forEach(function(h,i){
    chr.appendChild(el("th",i>0&&i<7?"r":"",h));
  });
  ch.appendChild(chr); C.appendChild(ch);
  var cb=el("tbody");
  if(!dks.length){ var e2=el("tr"); var t2=el("td","empty","No daybook entries for "+monthLabel(mk)+"."); t2.colSpan=8; e2.appendChild(t2); cb.appendChild(e2); }
  dks.forEach(function(k){
    var day=S.days[k], coll=n(day.fee)+n(day.bus)+n(day.other), counted=countedOf(k), diff=counted-coll;
    var tr=el("tr");
    tr.appendChild(el("td",null,dmy(k)));
    tr.appendChild(el("td","r num",inr(day.fee)));
    tr.appendChild(el("td","r num",inr(day.bus)));
    var ct=el("td","r num",inr(coll)); ct.style.fontWeight="600"; tr.appendChild(ct);
    tr.appendChild(el("td","r num",Object.keys(day.denoms||{}).length?inr(counted):"—"));
    var vt=el("td","r");
    if(!Object.keys(day.denoms||{}).length) vt.appendChild(el("span","pill p-mute","not counted"));
    else if(diff===0) vt.appendChild(el("span","pill p-ok","0"));
    else vt.appendChild(el("span","pill p-bad",(diff>0?"+":"")+inr(diff)));
    tr.appendChild(vt);
    var ut=el("td","r num",inr(day.upi)); ut.style.color="var(--blue)"; tr.appendChild(ut);
    var bt=el("td");
    if(n(day.wdl)>0) bt.appendChild(el("span","pill p-warn","withdrew "+inr(day.wdl)));
    if(n(day.deposit)>0) bt.appendChild(el("span","pill p-ok","deposited "+inr(day.deposit)));
    tr.appendChild(bt);
    cb.appendChild(tr);
  });
  C.appendChild(cb);
}

/* ---------------- exports ---------------- */
function offer(filename,text,mime){
  var blob=new Blob(["\ufeff"+text],{type:(mime||"text/csv")+";charset=utf-8"});
  var url=URL.createObjectURL(blob);
  var a=document.createElement("a");
  a.href=url; a.download=filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(function(){URL.revokeObjectURL(url);},2000);
}

function exportRegister(){
  var mk=$("#r-month").value;
  var rows=[["Voucher No","Date","Debited A/c","Paid To","Address","Particulars","Unit","Cost Head","Spent By","Passed By","Mode","Amount"]];
  S.entries.filter(function(e){return ym(e.date)===mk;}).sort(function(a,b){return a.date<b.date?-1:1;})
    .forEach(function(e){ rows.push([e.no,dmy(e.date),e.account||"",e.payee,e.address||"",e.particulars,
                                     e.category,e.head,e.by,e.approved||"",e.mode,e.amount]); });
  offer("register-"+mk+".csv",csv(rows));
}
function exportTally(){
  var mk=$("#r-month").value;
  var rows=[["Date","Voucher No","Voucher Type","Dr Ledger","Cr Ledger","Cost Centre","Amount","Narration"]];
  S.entries.filter(function(e){return ym(e.date)===mk;}).sort(function(a,b){return a.date<b.date?-1:1;})
    .forEach(function(e){
      var cr=e.mode==="cash"?"Cash":(e.mode==="upi"?"ICICI Bank (UPI)":"ICICI Bank");
      rows.push([dmy(e.date),e.no,"Payment",e.account||(e.head+" - "+e.category),cr,
                 e.head?(e.category+" : "+e.head):e.category,e.amount,
                 e.particulars+" \u2014 paid to "+e.payee+", by "+e.by]);
    });
  offer("tally-"+mk+".csv",csv(rows));
}
function exportDaybook(){
  var mk=ym($("#d-date").value);
  var rows=[["Date","Opening","Fee Cash","Bus Cash","Other Cash","Bank Withdrawal","Cash Expenses","Bank Deposit","Closing","UPI (memo)","Counted","Variance"]];
  dayKeys().filter(function(k){return ym(k)===mk;}).forEach(function(k){
    var d=S.days[k], coll=n(d.fee)+n(d.bus)+n(d.other), counted=countedOf(k);
    rows.push([dmy(k),d.opening,d.fee,d.bus,d.other,d.wdl,cashExpFor(k),d.deposit,closingOf(k),d.upi,
               Object.keys(d.denoms||{}).length?counted:"",Object.keys(d.denoms||{}).length?counted-coll:""]);
  });
  offer("daybook-"+mk+".csv",csv(rows));
}

/* ---------------- render ---------------- */
function renderAll(){
  renderBanner();
  fillPeople();
  function datalist(sel,vals){
    var box=$(sel); box.innerHTML=""; var seen={};
    vals.forEach(function(v){ if(v&&!seen[v]){seen[v]=1; box.appendChild(new Option(v));} });
  }
  datalist("#addresses",S.entries.map(function(e){return e.address;}));
  datalist("#accounts",CATS.map(function(c){return DEFAULT_ACCOUNTS[c];})
            .concat(S.accounts).concat(S.entries.map(function(e){return e.account;})));
  var mk=ym(todayISO());
  var mEnt=S.entries.filter(function(e){return ym(e.date)===mk;});
  var dks=dayKeys();
  $("#m-cash").textContent=rs(dks.length?closingOf(dks[dks.length-1]):S.openingSeed);
  $("#m-vch").textContent=mEnt.length;
  $("#m-spend").textContent=rs(mEnt.reduce(function(a,e){return a+n(e.amount);},0));
  renderSlip(); loadDay(); renderRegister();
  if(!$("#v-reports").hidden) renderReports();
}
boot();

/* ---------------- suggestions from history ---------------- */
/* A <datalist> cannot attach to a <textarea>, so Particulars gets a small
   list of its own: the last matching entries the office actually typed. */
function attachSuggest(inputSel,listSel,getPool){
  var inp=$(inputSel), list=$(listSel), idx=-1;
  function close(){ list.hidden=true; list.innerHTML=""; idx=-1; }
  function choose(v){ inp.value=v; close(); inp.dispatchEvent(new Event("input",{bubbles:true})); inp.focus(); }
  function open(){
    var q=inp.value.trim().toLowerCase();
    var pool=getPool()||[];
    var hits=(q?pool.filter(function(t){return t.toLowerCase().indexOf(q)>=0 && t.toLowerCase()!==q;}):pool).slice(0,8);
    if(!hits.length){ close(); return; }
    list.innerHTML=""; idx=-1;
    hits.forEach(function(t){
      var li=el("li",null,t); li.tabIndex=-1;
      li.addEventListener("mousedown",function(ev){ ev.preventDefault(); choose(t); });
      list.appendChild(li);
    });
    list.hidden=false;
  }
  function mark(){
    $$("li",list).forEach(function(li,i){ li.classList.toggle("on",i===idx); });
    if(idx>=0) $$("li",list)[idx].scrollIntoView({block:"nearest"});
  }
  inp.addEventListener("input",open);
  inp.addEventListener("focus",open);
  inp.addEventListener("blur",function(){ setTimeout(close,120); });
  inp.addEventListener("keydown",function(e){
    if(list.hidden) return;
    var items=$$("li",list);
    if(e.key==="ArrowDown"){ e.preventDefault(); idx=(idx+1)%items.length; mark(); }
    else if(e.key==="ArrowUp"){ e.preventDefault(); idx=(idx-1+items.length)%items.length; mark(); }
    else if(e.key==="Enter"&&idx>=0){ e.preventDefault(); choose(items[idx].textContent); }
    else if(e.key==="Escape"){ close(); }
  });
}

/* ---------------- backup & restore ---------------- */
function backupNow(){
  var stamp=new Date().toISOString().slice(0,10);
  offer("rokar-backup-"+stamp+".json",JSON.stringify(payload(),null,2),"application/json");
  var note=$("#backup-note");
  note.textContent="Backed up "+dmy(stamp)+". Keep the file somewhere off this computer.";
  note.style.color="var(--ok)";
}
function restoreFrom(file){
  var fr=new FileReader();
  fr.onload=function(){
    var p;
    try{ p=JSON.parse(fr.result); }
    catch(e){ alert("That file isn't a Rokar backup — it could not be read as JSON."); return; }
    if(!p||!Array.isArray(p.entries)){ alert("That file isn't a Rokar backup — no voucher list inside."); return; }
    var msg="Replace the books on this computer with the backup?\n\n"+
            "Backup: "+p.entries.length+" vouchers, "+Object.keys(p.days||{}).length+" daybook days"+
            (p.savedAt?"\nSaved: "+p.savedAt.slice(0,10):"")+
            "\n\nOn this computer now: "+S.entries.length+" vouchers, "+Object.keys(S.days).length+" days.";
    if(!confirm(msg)) return;
    S.entries=p.entries||[]; S.days=p.days||{};
    S.sample=!!p.sample; S.openingSeed=n(p.openingSeed);
    if(p.people&&p.people.length) S.people=p.people;
    if(p.approvers&&p.approvers.length) S.approvers=p.approvers;
    if(p.payees&&p.payees.length) S.payees=p.payees;
    S.accounts=p.accounts||[]; S.particulars=p.particulars||[];
    persist(); renderAll(); renderReports();
    var note=$("#backup-note");
    note.textContent="Restored "+S.entries.length+" vouchers from backup.";
    note.style.color="var(--ok)";
  };
  fr.onerror=function(){ alert("The file could not be opened."); };
  fr.readAsText(file);
}
