import { api } from "./api.js";

const nav = document.getElementById("nav");
const currentPage = location.pathname.split("/").pop() || "index.html";
const authPages = ["login.html", "register.html"];
const readUser = () => { try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; } };
let token = localStorage.getItem("token");
let storedUser = readUser();

// Gate every app page. Root opens login; a successful login/register returns to dashboard.
if (!token && !authPages.includes(currentPage)) location.replace("/login.html");


function makeSidebar() {
  const sidebar = document.createElement("aside");
  sidebar.className = "dashboard-sidebar shared-sidebar";
  const links = [
    ["index.html", "⌂", "Dashboard"],
    ["resources.html", "⌕", "Explore resources"],
    ["my-resources.html", "▤", "My listings"],
    ["add-resource.html", "＋", "List a resource"],
    ["requests.html", "▣", "Borrow requests"],
    ["profile.html", "♢", "Trust history"],
  ];
  sidebar.innerHTML = `<nav class="side-menu">${links.map(([href,icon,label])=>`<a class="side-link ${currentPage===href?'active':''}" href="${href}"><span>${icon}</span>${label}</a>`).join("")}</nav>
    <div class="sidebar-share"><div class="share-art">📚 <span>🤝</span></div><b>Share resources.<br>Build trust.<br>Strengthen campus.</b><i></i><small>Verified students. Real trust.</small></div>
    <div class="verified-strip"><span>✓</span><div><b>Student community</b><small>Real students. Shared value.</small></div></div>`;
  return sidebar;
}

// Give every authenticated page the same dashboard shell and navigation language.
if (!authPages.includes(currentPage) && currentPage !== "index.html" && nav) {
  const topbar = document.querySelector(".site-nav");
  if (topbar) {
    topbar.classList.add("dashboard-topbar", "shared-topbar");
    const search = document.createElement("div");
    search.className = "dashboard-search shared-search";
    search.innerHTML = '<span>⌕</span><input id="sharedSearch" type="search" placeholder="Search books, calculators, lab kits…" aria-label="Search resources"><button id="sharedSearchBtn" type="button" aria-label="Search resources">↗</button>';
    topbar.insertBefore(search, nav);
    const right = document.createElement("div");
    right.className = "dashboard-top-right shared-top-right";
    nav.replaceWith(right); right.append(nav);
    const main = document.querySelector("main");
    if (main) {
      const shell = document.createElement("div"); shell.className = "dashboard-shell shared-shell";
      topbar.after(shell); shell.append(makeSidebar(), main);
      main.classList.add("dashboard-main", "shared-page-main");
      main.classList.remove("container");
    }
    const searchAction = () => {
      const value = document.getElementById("sharedSearch")?.value.trim() || "";
      location.href = `resources.html${value ? `?q=${encodeURIComponent(value)}` : ""}`;
    };
    document.getElementById("sharedSearchBtn")?.addEventListener("click", searchAction);
    document.getElementById("sharedSearch")?.addEventListener("keydown", e => { if(e.key === "Enter") searchAction(); });
  }
}

if (nav) {
  nav.className = "nav-links";
  nav.innerHTML = `${!authPages.includes(currentPage) ? `<span class="nav-user shared-greeting">Hi, ${(storedUser?.fullName || "Student").split(" ")[0]}</span><button id="themeToggle" class="theme-toggle" type="button">🌙 Dark mode</button><button id="out" class="logout-button" type="button">Logout</button>` : `<a href="/login.html">Login</a><a class="btn small" href="/register.html">Register</a>`}`;
}

function applyTheme(theme) {
  const next = theme === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem("campusshare-theme", next); } catch {}
  const toggle = document.getElementById("themeToggle");
  if (toggle) {
    toggle.textContent = next === "dark" ? "☀️ Light" : "🌙 Dark";
    toggle.setAttribute("aria-label", next === "dark" ? "Switch to light mode" : "Switch to dark mode");
  }
}
applyTheme((() => { try { return localStorage.getItem("campusshare-theme") || "light"; } catch { return "light"; } })());
document.getElementById("themeToggle")?.addEventListener("click", () => applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark"));
document.getElementById("out")?.addEventListener("click", async () => {
  try { await api("/api/logout", { method: "POST" }); } catch {}
  localStorage.removeItem("token"); localStorage.removeItem("user"); location.replace("/login.html");
});

// Verify stored login with the server so expired/invalid sessions cannot enter app pages.
if (token) {
  api("/api/me").then(() => {
    if (authPages.includes(currentPage)) location.replace("/index.html");
  }).catch(() => {
    localStorage.removeItem("token"); localStorage.removeItem("user");
    if (!authPages.includes(currentPage)) location.replace("/login.html");
  });
}

// Built-in FAQ assistant; available only after login.
if (token && !authPages.includes(currentPage)) {
  const launcher = document.createElement("button"); launcher.type = "button"; launcher.className = "chat-launcher";
  launcher.innerHTML = '<span class="chat-launch-icon">✦</span><span>Campus help</span>'; launcher.setAttribute("aria-label", "Open CampusShare Assistant");
  const panel = document.createElement("section"); panel.className = "chat-panel"; panel.hidden = true; panel.setAttribute("aria-label", "CampusShare Assistant chat");
  panel.innerHTML = `<header class="chat-head"><div class="chat-avatar">✦</div><div class="chat-head-copy"><b>CampusShare Assistant</b><small><span class="online-dot"></span> Campus help · Available offline</small></div><button class="chat-close" type="button" aria-label="Close chat">×</button></header><div class="chat-messages" id="chatMessages"><div class="chat-bubble bot">Hey! 👋 Ask me about finding resources, borrowing, listing items, requests, returns, ratings, or your trust profile.</div><div class="chat-suggestions"><button type="button">How do I request a resource?</button><button type="button">When can I see contact details?</button><button type="button">How does trust history work?</button></div></div><form class="chat-compose" id="chatForm"><input id="chatInput" autocomplete="off" placeholder="Ask about CampusShare…" aria-label="Type your question" required><button type="submit" aria-label="Send message">➤</button></form><div class="chat-foot">CampusShare help assistant · No API key needed</div>`;
  document.body.append(launcher, panel);
  const messages = panel.querySelector("#chatMessages"), input = panel.querySelector("#chatInput");
  launcher.addEventListener("click", () => { panel.hidden = !panel.hidden; if (!panel.hidden) input.focus(); });
  panel.querySelector(".chat-close").addEventListener("click", () => panel.hidden = true);
  function answer(question) {
    const q = question.toLowerCase();
    if (/dark|light|theme|mode/.test(q)) return "Use the theme button in the top bar; your choice is saved in this browser.";
    if (/request|borrow|need|ask for/.test(q)) return "Browse resources, open an item marked for lending, and submit a request. Track it on Borrow requests.";
    if (/contact|phone|email|details/.test(q)) return "Contact details become visible after the resource owner accepts your request.";
    if (/rating|review|poor|damage|return|good|trust|history/.test(q)) return "Accepted and completed transactions appear in student trust history. After a return, the lender can leave an honest rating.";
    if (/accept|decline|approve/.test(q)) return "The owner can open Borrow requests and accept or decline a pending request.";
    if (/add|list|post|sell|lend|resource/.test(q)) return "Choose List a resource and enter its details, condition, location and whether it is for lending or sale.";
    if (/search|filter|find/.test(q)) return "Use the search bar or open Explore resources to search and filter listings.";
    if (/hello|hi|hey/.test(q)) return "Hi! 😊 I can help you find resources, manage requests, understand returns and build trust.";
    return "I can help with accounts, resources, borrowing requests, returns, contact details, ratings, trust history and dark mode.";
  }
  function addMessage(text, type) { const el=document.createElement("div"); el.className=`chat-bubble ${type}`; el.textContent=text; messages.appendChild(el); messages.scrollTop=messages.scrollHeight; }
  panel.querySelectorAll(".chat-suggestions button").forEach(b=>b.addEventListener("click",()=>{const q=b.textContent;addMessage(q,"user");addMessage(answer(q),"bot");}));
  panel.querySelector("#chatForm").addEventListener("submit",e=>{e.preventDefault();const q=input.value.trim();if(!q)return;addMessage(q,"user");input.value="";addMessage(answer(q),"bot");input.focus();});
}
