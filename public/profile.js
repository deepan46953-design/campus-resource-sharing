import { api } from "./api.js";
const root = document.getElementById("profileContent");
const id = new URLSearchParams(location.search).get("id");
const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const date = v => v ? new Date(v).toLocaleDateString(undefined,{day:"numeric",month:"short",year:"numeric"}) : "Not recorded";
const statusLabel = s => ({pending:"Pending",accepted:"Accepted · awaiting return",completed:"Returned",declined:"Declined",cancelled:"Cancelled"}[s] || s || "Unknown");
function historyCard(x) {
  const borrowed = x.role === "borrowed";
  const rated = x.rating ? `<span class="history-rating ${esc(x.rating)}">${x.rating === "good" ? "★ Good rating" : "⚠ Poor rating"}</span>` : "";
  const other = x.otherStudentId
    ? `<a href="profile.html?id=${encodeURIComponent(x.otherStudentId)}">${esc(x.otherStudentName || "View student")}</a>`
    : esc(x.otherStudentName || "CampusShare student");
  return `<article class="history-card"><div class="history-card-top"><span class="history-role ${borrowed?"borrowed":"lent"}">${borrowed?"↓ Borrowed":"↑ Lent"}</span><span class="history-status ${x.status === "completed" ? "completed" : ""}">${esc(statusLabel(x.status))}</span></div><h3>${esc(x.resourceTitle)}</h3><p class="muted">${borrowed?"Lender":"Borrower"}: ${other}</p><div class="history-dates"><span>Request: ${date(x.createdAt)}</span><span>${x.returnedAt?"Returned: "+date(x.returnedAt):"Accepted: "+date(x.acceptedAt)}</span>${x.dueDate?`<span class="${x.isOverdue?"overdue-text":""}">${x.isOverdue?"Overdue · ":"Due: "}${date(x.dueDate)}</span>`:""}</div>${rated}${x.review?`<p class="history-review">“${esc(x.review)}”</p>`:""}</article>`;
}
async function load() {
  if (!id) { root.innerHTML = '<div class="empty"><h3>Student profile not selected</h3><a class="btn" href="resources.html">Browse resources</a></div>'; return; }
  try {
    const d = await api("/api/users/" + encodeURIComponent(id) + "/profile");
    const p=d.profile, r=d.reputation||{total:0,good:0,poor:0,score:null,reviews:[]};
    const st=d.stats||{timesBorrowed:0,itemsReturned:0,timesLent:0,itemsReturnedToMe:0};
    const reviews=d.reviews||[], history=d.history||[];
    root.innerHTML = `<div class="profile-page">
      <a class="btn outline" href="resources.html">← Browse resources</a>
      <section class="profile-hero"><div class="profile-avatar">${esc((p.fullName||"S").slice(0,1).toUpperCase())}</div><div><span class="tag">CampusShare student</span><h1>${esc(p.fullName)}</h1><p class="muted">${esc(p.rollNo)} · ${esc(p.department)} · Year ${esc(p.year)}</p><small class="muted">Member since ${date(p.createdAt)}</small></div></section>
      <section class="trust-summary profile-trust"><h2>⭐ Trust & reputation</h2><p class="muted">Feedback left by lenders after borrowing transactions.</p><div class="trust-stats"><span><strong>${r.total}</strong>Total ratings</span><span><strong>${r.good}</strong>Good</span><span><strong>${r.poor}</strong>Poor</span><span><strong>${r.total?r.score+"%":"—"}</strong>Positive</span></div>${r.total?`<p class="trust-note">${r.score>=80?"Strong positive track record":r.score>=50?"Mixed borrowing history":"Review the feedback carefully"}. Consider the full history, not only the percentage.</p>`:'<p class="trust-note">No ratings yet. This is not a negative rating.</p>'}</section>
      <section class="trust-summary profile-trust"><h2>📊 Verified borrowing activity</h2><p class="muted">Based on accepted requests and return confirmations.</p><div class="trust-stats"><span><strong>${st.timesBorrowed}</strong>Times borrowed</span><span><strong>${st.itemsReturned}</strong>Borrowed items returned</span><span><strong>${st.timesLent}</strong>Times lent</span><span><strong>${st.itemsReturnedToMe}</strong>Lent items returned</span><span><strong>${st.overdueLoans||0}</strong>Overdue loans</span></div><p class="trust-note">Pending and declined requests are not included in these totals.</p></section>
      <section class="profile-history"><div class="history-heading"><div><h2>📚 Trust history</h2><p class="muted">Accepted lending and borrowing transactions, return status, and feedback.</p></div><span class="history-count">${history.length} record${history.length===1?"":"s"}</span></div>${history.length?`<div class="history-grid">${history.map(historyCard).join("")}</div>`:'<div class="empty"><h3>No trust history yet</h3><p>Once this student has an accepted borrowing request, it will appear here. Returned items and ratings will be recorded too.</p></div>'}</section>
      <section class="profile-reviews"><h2>⭐ Lender feedback</h2>${reviews.length?reviews.map(x=>`<article class="profile-review ${esc(x.rating)}"><div class="review-top"><b>${x.rating==="good"?"★ Good return":"⚠ Poor return"}</b><span>${date(x.ratedAt)}</span></div><p>${esc(x.review||(x.rating==="good"?"Lender recorded a good return.":"Lender reported a problem with the return."))}</p><small>Resource: ${esc(x.resourceTitle)} · Reviewed by ${esc(x.lenderName)}</small></article>`).join(""):'<div class="empty"><h3>No reviews yet</h3><p>Ratings appear here after a lender reviews a borrowing transaction.</p></div>'}</section>
    </div>`;
  } catch(e) {
    root.innerHTML=`<div class="empty"><div class="empty-icon">⚠️</div><h3>Could not load trust history</h3><p>${esc(e.message)}</p><p>Check that the server is running and you are logged in.</p><a class="btn" href="resources.html">Back to resources</a><button class="btn outline" id="retryProfile">Try again</button></div>`;
    document.getElementById("retryProfile")?.addEventListener("click",load);
  }
}
load();
