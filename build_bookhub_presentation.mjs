import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const workspaceDir = "C:\\Users\\Admin\\Desktop\\Book Store";
const skillDir = "C:\\Users\\Admin\\\.codex\\plugins\\cache\\openai-primary-runtime\\presentations\\26.1025.11240\\skills\\presentations";
const runtimePython = "C:\\Users\\Admin\\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\python\\python.exe";
const buildDir = path.join(workspaceDir, ".codex-presentation-build");
const renderDir = path.join(buildDir, "renders");
const stagingDir = path.join(workspaceDir, ".codex-finalizer");
const outputDir = path.join(workspaceDir, "output", "presentation");
const finalPptx = path.join(outputDir, "BookHub_Internship_Project_Presentation_Classroom_Updated.pptx");

await fs.mkdir(renderDir, { recursive: true });
await fs.mkdir(stagingDir, { recursive: true });
await fs.mkdir(outputDir, { recursive: true });

const W = 1280;
const H = 720;
const C = {
  cream: "#F7F3ED",
  paper: "#FFFCF7",
  teal: "#0A6B64",
  tealDark: "#064C48",
  tealSoft: "#DCEBE6",
  peach: "#F4DEC9",
  gold: "#C88A34",
  ink: "#241C17",
  muted: "#6F645B",
  line: "#E5D3BC",
  white: "#FFFFFF",
  sage: "#E9EFE6",
  coral: "#CC5D5D",
  navy: "#173F54",
};
const FONT = "Arial";
const TITLE_FONT = "Arial";

const img = {
  home: "C:\\Users\\Admin\\AppData\\Local\\Temp\\codex-clipboard-968edb9b-d80b-4977-ba40-c1f550209092.png",
  sections: "C:\\Users\\Admin\\AppData\\Local\\Temp\\codex-clipboard-435b5bc2-0edf-43e4-b2dc-145d5a3a406c.png",
  books: "C:\\Users\\Admin\\AppData\\Local\\Temp\\codex-clipboard-16361610-720e-45fa-ac9a-ec0aae5ed07e.png",
  catalogLoading: "C:\\Users\\Admin\\AppData\\Local\\Temp\\codex-clipboard-292398dd-ad7e-4f28-9b91-4eda8d46a108.png",
  register: "C:\\Users\\Admin\\AppData\\Local\\Temp\\codex-clipboard-a4eae2f5-219c-4872-8aaf-7d3587cfcb2f.png",
  login: "C:\\Users\\Admin\\AppData\\Local\\Temp\\codex-clipboard-6de4a02a-5dd8-4294-8780-aae7adba5771.png",
  profile: "C:\\Users\\Admin\\AppData\\Local\\Temp\\codex-clipboard-52720e59-a0c4-47e1-a599-4cce141d2375.png",
  wishlist: "C:\\Users\\Admin\\AppData\\Local\\Temp\\codex-clipboard-77640d0c-1dcd-4038-81cd-ca5dc90fe61b.png",
  cart: "C:\\Users\\Admin\\AppData\\Local\\Temp\\codex-clipboard-c3b22a65-7f6b-428f-8160-f4f655338edc.png",
  payments: "C:\\Users\\Admin\\AppData\\Local\\Temp\\codex-clipboard-8f573388-cdcb-4bd5-a789-04b86e5e200f.png",
  notifications: "C:\\Users\\Admin\\AppData\\Local\\Temp\\codex-clipboard-b0734141-eccc-4877-a8d6-a2bb7f3c5f60.png",
  digital: "C:\\Users\\Admin\\AppData\\Local\\Temp\\codex-clipboard-5008fbb3-8585-40a5-a007-1e0f6be9ac2a.png",
  adminDash: "C:\\Users\\Admin\\AppData\\Local\\Temp\\codex-clipboard-5bdb7da7-8086-4bf3-abc1-54043995f3ea.png",
  branchShelf: "C:\\Users\\Admin\\AppData\\Local\\Temp\\codex-clipboard-97ef6a12-baa0-468d-993f-84558738d9ae.png",
  sectionForm: "C:\\Users\\Admin\\AppData\\Local\\Temp\\codex-clipboard-4e6ceb57-b9ab-423a-bc34-0376789c47d8.png",
  addBook: "C:\\Users\\Admin\\AppData\\Local\\Temp\\codex-clipboard-83cfe0ae-751e-4978-b08f-87eba67cfd6e.png",
  adminNotify: "C:\\Users\\Admin\\AppData\\Local\\Temp\\codex-clipboard-e0593687-cf51-41f0-9d57-db0305657fd8.png",
  filter: "C:\\Users\\Admin\\AppData\\Local\\Temp\\codex-clipboard-27f13ac4-938c-40f4-ae38-3f1d0235b3f7.png",
  offer: path.join(workspaceDir, "tmp", "pdf-review", "offer.png"),
  certificate: path.join(workspaceDir, "tmp", "pdf-review", "certificate.png"),
};

function sliceBuffer(buf) {
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

function addShape(slide, geometry, x, y, w, h, fill, lineFill = "none", lineWidth = 0, extra = {}) {
  return slide.shapes.add({
    geometry,
    position: { left: x, top: y, width: w, height: h },
    fill,
    line: { style: "solid", fill: lineFill, width: lineWidth },
    ...extra,
  });
}

function addText(slide, value, x, y, w, h, size = 18, color = C.ink, opts = {}) {
  const box = addShape(slide, "textbox", x, y, w, h, "none", "none", 0);
  box.text = value;
  box.text.style = {
    fontSize: size,
    color,
    typeface: opts.typeface || FONT,
    bold: opts.bold || false,
    italic: opts.italic || false,
    alignment: opts.align || "left",
    verticalAlignment: opts.valign || "top",
    lineSpacing: opts.lineSpacing || 1.12,
    autoFit: "shrinkText",
    wrap: "square",
    insets: opts.insets ?? 0,
  };
  return box;
}

function addRule(slide, x, y, w, color = C.line, width = 1) {
  return addShape(slide, "line", x, y, w, 0, "none", color, width);
}

function addFooter(slide, num, label = "") {
  addRule(slide, 54, 684, 1172, C.line, 1);
  if (label) addText(slide, label, 54, 691, 420, 16, 10, C.muted, { bold: true });
  addText(slide, String(num).padStart(2, "0"), 1194, 689, 32, 18, 11, C.teal, { bold: true, align: "right" });
}

function addHeader(slide, eyebrow, title, subtitle = "", num = null, dark = false) {
  const titleColor = dark ? C.white : C.ink;
  addShape(slide, "rect", 54, 42, 92, 6, dark ? C.gold : C.teal, "none", 0);
  addText(slide, title, 54, 65, 1120, 58, 34, titleColor, { bold: true, typeface: TITLE_FONT, lineSpacing: 0.96 });
  if (subtitle) addText(slide, subtitle, 56, 127, 1080, 34, 16, dark ? "#DDEDEA" : C.muted, { lineSpacing: 1.1 });
  if (num != null) addFooter(slide, p.slides.items.length);
}

function addPill(slide, label, x, y, w, fill = C.tealSoft, color = C.teal) {
  addShape(slide, "roundRect", x, y, w, 28, fill, "none", 0, { borderRadius: "rounded-xl" });
  addText(slide, label, x + 10, y + 6, w - 20, 18, 11, color, { bold: true, align: "center" });
}

function addCard(slide, x, y, w, h, fill = C.paper, line = C.line, radius = "rounded-xl") {
  return addShape(slide, "roundRect", x, y, w, h, fill, line, 1, { borderRadius: radius });
}

async function addImage(slide, filePath, x, y, w, h, opts = {}) {
  const buf = await fs.readFile(filePath);
  return slide.images.add({
    blob: sliceBuffer(buf),
    contentType: "image/png",
    alt: opts.alt || path.basename(filePath),
    fit: opts.fit || "contain",
    position: { left: x, top: y, width: w, height: h },
    geometry: "roundRect",
    borderRadius: opts.radius || "rounded-xl",
  });
}

function addBulletList(slide, items, x, y, w, lineH = 31, size = 17, color = C.ink) {
  items.forEach((item, i) => {
    addShape(slide, "ellipse", x, y + i * lineH + 7, 8, 8, C.gold, "none", 0);
    addText(slide, item, x + 18, y + i * lineH, w - 18, lineH + 4, size, color, { lineSpacing: 1.05 });
  });
}

function addMetric(slide, x, y, w, h, value, label, accent = C.teal) {
  addCard(slide, x, y, w, h, C.paper, C.line);
  addShape(slide, "ellipse", x + w - 56, y + h - 48, 70, 70, C.tealSoft, "none", 0);
  addText(slide, value, x + 18, y + 17, w - 40, 35, 27, accent, { bold: true });
  addText(slide, label, x + 18, y + 56, w - 24, 26, 13, C.muted, { bold: true });
}

function addNotes(slide, noteText) {
  slide.speakerNotes.text = noteText;
  slide.speakerNotes.setVisible(true);
}

function setBg(slide, color = C.cream) {
  slide.background.fill = color;
}

function addArrow(slide, x1, y1, x2, y2, color = C.gold, width = 2) {
  const line = addShape(slide, "line", x1, y1, x2 - x1, y2 - y1, "none", color, width);
  return line;
}

const p = Presentation.create({ slideSize: { width: W, height: H } });

// 1. Cover
{
  const s = p.slides.add(); setBg(s, C.tealDark);
  addShape(s, "rect", 0, 0, 1280, 12, C.gold, "none", 0);
  addShape(s, "rect", 0, 708, 1280, 12, C.teal, "none", 0);
  addText(s, "INTERNSHIP PROJECT PRESENTATION", 66, 62, 520, 24, 13, "#BFE7DF", { bold: true });
  addText(s, "BookHub", 64, 124, 520, 76, 54, C.white, { bold: true, typeface: TITLE_FONT, lineSpacing: 0.9 });
  addText(s, "Online Bookstore & Digital Library Management System", 66, 210, 530, 60, 23, "#E5F3EF", { lineSpacing: 1.12 });
  addRule(s, 66, 304, 430, "#65B7A8", 2);
  addText(s, "Presented by", 66, 332, 180, 22, 13, "#BFE7DF", { bold: true });
  addText(s, "Devender", 66, 356, 310, 36, 24, C.white, { bold: true });
  addText(s, "Roll No. 23001001023\nB.Tech CSE • 4th Year • 7th Semester\nDCRUST, Murthal\nAcademic Session 2026–2027", 66, 402, 420, 108, 16, "#E5F3EF", { lineSpacing: 1.22 });
  addText(s, "Submitted to\nDr. Jitender Bharadwaj", 66, 560, 300, 52, 14, "#D6EBE7", { bold: true, lineSpacing: 1.24 });
  addCard(s, 690, 94, 500, 520, "#F8F1E8", "#D3B899");
  await addImage(s, img.home, 716, 122, 448, 210, { alt: "BookHub home page" });
  addText(s, "A practical MERN-stack bookstore experience", 720, 356, 430, 30, 18, C.tealDark, { bold: true });
  addText(s, "Catalog discovery • rentals • digital access • inventory operations", 720, 396, 415, 44, 15, C.muted, { lineSpacing: 1.15 });
  addPill(s, "ACADEMIC PROJECT DEFENSE", 720, 482, 240, C.tealSoft, C.teal);
  addNotes(s, "Opening: Good morning everyone. I am Devender, a B.Tech CSE student at DCRUST, Murthal. This presentation explains BookHub, the bookstore and digital-library platform I developed during my MERN Stack Web Development internship. I will walk through the problem, the design, the user workflows, and what I learned. Transition: I will begin with the structure of the presentation.");
}

// 2. Roadmap
{
  const s = p.slides.add(); setBg(s); addHeader(s, "01 / Roadmap", "How the presentation is organised", "A clear path from internship context to working product evidence.", 2);
  const items = [
    ["01", "Context", "Internship, company, motivation"],
    ["02", "Design", "Requirements, architecture, data model"],
    ["03", "Build", "Technology stack and core modules"],
    ["04", "Evidence", "Screenshots and end-to-end workflow"],
    ["05", "Reflection", "Testing, limitations and future scope"],
  ];
  items.forEach((it, i) => {
    const x = 70 + i * 232;
    addCard(s, x, 224, 200, 208, i === 2 ? C.teal : C.paper, i === 2 ? C.teal : C.line);
    addText(s, it[0], x + 20, 246, 52, 30, 18, i === 2 ? "#BFE7DF" : C.gold, { bold: true });
    addText(s, it[1], x + 20, 294, 160, 34, 21, i === 2 ? C.white : C.ink, { bold: true });
    addText(s, it[2], x + 20, 350, 160, 48, 14, i === 2 ? "#E5F3EF" : C.muted, { lineSpacing: 1.18 });
  });
  addText(s, "The narrative follows a problem → solution → evidence → learning structure.", 70, 493, 1060, 28, 17, C.teal, { bold: true });
  addNotes(s, "This roadmap keeps the presentation easy to follow. I will first establish the internship and business context, then explain the architecture and database, demonstrate the actual application screens, and finish with testing, limitations, and future improvements. Transition: Before discussing the product, I will introduce the internship setting.");
}

// 3. Internship profile
{
  const s = p.slides.add(); setBg(s); addHeader(s, "02 / Internship context", "Internship profile and completion", "The internship gave the project its technical direction and learning objectives.", 3);
  addCard(s, 64, 184, 410, 420, C.paper, C.line);
  addPill(s, "CODTECH IT SOLUTIONS PVT. LTD.", 92, 212, 248);
  addText(s, "MERN Stack Web Development", 92, 263, 330, 34, 22, C.ink, { bold: true });
  addBulletList(s, ["Intern ID: CITS2765", "Duration: 8 weeks", "30 May 2026 – 25 July 2026", "Focus: practical skill development", "Outcome: successfully completed"], 92, 329, 330, 43, 16);
  addText(s, "The company letter describes an educational experience built around assignments, feedback, collaboration, progress updates, and professional conduct.", 92, 526, 325, 52, 13, C.muted, { lineSpacing: 1.2 });
  addCard(s, 520, 184, 300, 420, C.paper, C.line); await addImage(s, img.offer, 540, 204, 260, 380, { alt: "Internship offer letter" });
  addCard(s, 850, 184, 300, 420, C.paper, C.line); await addImage(s, img.certificate, 870, 204, 260, 380, { alt: "Internship completion certificate" });
  addNotes(s, "The offer letter confirms my selection for MERN Stack Web Development at Codtech IT Solutions Private Limited, for an eight-week period from 30 May to 25 July 2026. The completion certificate records the same internship details and marks the status as successfully completed. I have used the documents as evidence without adding any unsupported claims. Transition: The next question is what the host company does and why this project fits the internship.");
}

// 4. Company overview
{
  const s = p.slides.add(); setBg(s, C.paper); addHeader(s, "03 / Company context", "About Codtech IT Solutions", "A technology-services environment focused on practical digital solutions and technical learning.", 4);
  addCard(s, 70, 200, 510, 350, C.tealDark, C.tealDark);
  addText(s, "Codtech IT Solutions Private Limited", 102, 236, 430, 52, 28, C.white, { bold: true, lineSpacing: 0.95 });
  addText(s, "Information Technology Services", 102, 309, 360, 26, 17, "#BFE7DF", { bold: true });
  addText(s, "The internship setting emphasised learning by building: completing assignments, participating in discussions, sharing progress, collaborating with peers, and applying feedback to improve technical work.", 102, 364, 410, 98, 16, "#E5F3EF", { lineSpacing: 1.22 });
  addPill(s, "HYDERABAD • INDIA", 102, 495, 155, "#215C57", "#D9F1EB");
  addCard(s, 630, 200, 520, 350, C.sage, C.line);
  addText(s, "Why this context mattered", 664, 236, 400, 34, 23, C.ink, { bold: true });
  addBulletList(s, ["It encouraged an end-to-end application mindset.", "It connected frontend experience to backend business rules.", "It made documentation, testing, and professional communication part of the deliverable."], 664, 310, 420, 56, 17);
  addNotes(s, "The company context is important because the internship was not only about writing screens. The offer letter explicitly frames the experience around learning, assignments, collaboration, feedback, and professional conduct. BookHub reflects that full-stack mindset: it connects the interface, API, database, and operational workflows in one system. Transition: I will now introduce the product itself.");
}

// 5. Project introduction
{
  const s = p.slides.add(); setBg(s); addHeader(s, "04 / Project introduction", "BookHub at a glance", "A single-store bookstore platform for discovery, commerce, rentals, digital reading, and staff operations.", 5);
  addCard(s, 70, 205, 520, 330, C.paper, C.line);
  addText(s, "BookHub brings the bookstore together in one place.", 104, 236, 430, 70, 28, C.ink, { bold: true, lineSpacing: 0.96 });
  addText(s, "Customers can discover titles, buy or rent physical copies, access digital reading, save books, follow orders, and receive updates. Staff can manage catalog records, inventory locations, orders, and operational signals.", 104, 335, 420, 104, 17, C.muted, { lineSpacing: 1.22 });
  addPill(s, "SINGLE-STORE • REWARI", 104, 480, 190);
  addCard(s, 630, 205, 520, 330, C.tealDark, C.tealDark);
  addText(s, "The product promise", 662, 238, 400, 28, 17, "#BFE7DF", { bold: true });
  addText(s, "Make every title discoverable, every copy traceable, and every customer interaction understandable.", 662, 284, 420, 100, 28, C.white, { bold: true, lineSpacing: 1.02 });
  addText(s, "Implemented evidence is shown later through real BookHub screens.", 662, 454, 395, 30, 14, "#D6EBE7", { italic: true });
  addNotes(s, "BookHub is designed for a single physical store in Rewari, India. The customer side focuses on discovery and self-service, while the staff side focuses on operational visibility. The important design decision is to keep title-level catalog data separate from copy-level inventory data so that every physical copy can have its own location and status. Transition: That design starts with a real problem faced by readers and store staff.");
}

// 6. Motivation
{
  const s = p.slides.add(); setBg(s, C.paper); addHeader(s, "05 / Motivation", "Why this project was needed", "The experience of a book is often split across discovery, stock checking, rental tracking, and support conversations.", 6);
  const cards = [
    ["For readers", "Finding a title is easy; knowing whether it is available, rentable, digital, or reserved is not always easy.", C.teal],
    ["For stores", "Inventory, shelf locations, orders, rental status, and customer updates are often managed in separate places.", C.gold],
    ["For learning", "A complete platform is a practical way to connect UI design, APIs, database modelling, security, and testing.", C.navy],
  ];
  cards.forEach((c, i) => {
    const x = 72 + i * 390;
    addCard(s, x, 235, 340, 235, C.paper, C.line);
    addShape(s, "rect", x, 235, 340, 12, c[2], "none", 0);
    addText(s, c[0], x + 26, 276, 260, 28, 22, C.ink, { bold: true });
    addText(s, c[1], x + 26, 326, 278, 88, 16, C.muted, { lineSpacing: 1.23 });
  });
  addText(s, "The project therefore treats a bookstore as both a customer experience and an operational system.", 72, 535, 1000, 30, 18, C.teal, { bold: true });
  addNotes(s, "The motivation is two-sided. A reader wants a simple, trustworthy journey from finding a title to receiving access or a confirmation. A store owner needs operational control over copies, locations, rentals, and orders. BookHub is a useful internship project because it connects these needs into one full-stack workflow. Transition: I will state the problem in a form that can be evaluated technically.");
}

// 7. Problem statement
{
  const s = p.slides.add(); setBg(s); addHeader(s, "06 / Problem", "Problem statement", "How can a local bookstore provide a modern self-service experience without losing operational control?", 7);
  addCard(s, 70, 210, 520, 340, C.tealDark, C.tealDark);
  addText(s, "The core problem", 104, 244, 420, 28, 17, "#BFE7DF", { bold: true });
  addText(s, "Customers need more than a list of titles. They need confidence about availability, format, pricing, rental windows, order progress, and access expiry.", 104, 302, 420, 124, 27, C.white, { bold: true, lineSpacing: 1.06 });
  addCard(s, 650, 210, 500, 340, C.paper, C.line);
  addText(s, "What breaks in a fragmented process", 684, 244, 410, 30, 22, C.ink, { bold: true });
  addBulletList(s, ["Stock is hard to locate or explain.", "Order and rental states are unclear.", "Digital access can outlive its entitlement.", "Staff updates are disconnected from customer notifications."], 684, 310, 420, 48, 17);
  addNotes(s, "The problem is not simply that a store needs a website. The real problem is a lack of shared state: catalog, copy availability, order status, rental expiry, and notifications need to agree. The system should make these states visible to the right user and enforce them on the server. Transition: I will compare that fragmented approach with the proposed solution.");
}

// 8. Existing vs proposed
{
  const s = p.slides.add(); setBg(s, C.paper); addHeader(s, "07 / Solution", "From fragmented tasks to one operational flow", "The comparison is conceptual; no unsupported performance claims are made.", 8);
  const x0 = 70, y0 = 210, rowH = 60;
  const cols = [240, 390, 430];
  const headers = ["Area", "Typical fragmented approach", "BookHub approach"];
  let x = x0;
  headers.forEach((h, i) => { addShape(s, "rect", x, y0, cols[i], 52, i === 2 ? C.teal : C.tealDark, "none", 0); addText(s, h, x + 14, y0 + 15, cols[i] - 28, 24, 15, C.white, { bold: true }); x += cols[i]; });
  const rows = [
    ["Discovery", "Static list or in-person enquiry", "Search, sections, filters, book cards"],
    ["Availability", "Manual stock check", "BookCopy status and exact location"],
    ["Orders", "Messages or spreadsheets", "Order state plus customer/admin notifications"],
    ["Rentals", "Paper due dates", "Server-calculated due date and penalty"],
    ["Digital", "Uncontrolled file sharing", "Authenticated, time-limited access"],
  ];
  rows.forEach((r, ri) => { let xx = x0; const fill = ri % 2 ? C.cream : C.paper; r.forEach((v, ci) => { addShape(s, "rect", xx, y0 + 52 + ri * rowH, cols[ci], rowH, fill, C.line, 1); addText(s, v, xx + 14, y0 + 68 + ri * rowH, cols[ci] - 28, rowH - 18, 14, ci === 2 ? C.tealDark : C.muted, { bold: ci === 2, lineSpacing: 1.05 }); xx += cols[ci]; }); });
  addNotes(s, "This table describes the design intent rather than claiming measured business improvements. BookHub replaces disconnected tasks with a shared model: titles, copies, orders, rentals, access records, and notifications are linked by the backend. That makes each customer-facing message explainable and each staff action traceable. Transition: The solution becomes clearer when its objectives and scope are explicit.");
}

// 9. Objectives and scope
{
  const s = p.slides.add(); setBg(s); addHeader(s, "08 / Objectives", "What BookHub is designed to achieve", "The project scope balances a credible college demonstration with a production-aware architecture.", 9);
  addCard(s, 70, 200, 520, 360, C.paper, C.line);
  addText(s, "Objectives", 104, 234, 360, 28, 24, C.ink, { bold: true });
  addBulletList(s, ["Create a polished bookstore discovery experience.", "Support purchase, physical rental, and digital rental journeys.", "Track copies, shelf locations, and operational statuses.", "Give customers and owners role-specific visibility.", "Keep business rules on the server and document future integrations."], 104, 292, 420, 47, 16);
  addCard(s, 650, 200, 500, 360, C.tealDark, C.tealDark);
  addText(s, "Scope boundary", 684, 234, 360, 28, 24, C.white, { bold: true });
  addText(s, "Implemented now", 684, 290, 200, 22, 15, "#BFE7DF", { bold: true });
  addText(s, "Catalog, auth, cart, demo checkout, rentals, digital access, notifications, wishlist, reservations, admin dashboard, inventory locations, and security middleware.", 684, 320, 410, 82, 16, "#E5F3EF", { lineSpacing: 1.16 });
  addText(s, "Planned later", 684, 433, 200, 22, 15, "#BFE7DF", { bold: true });
  addText(s, "Live payment gateway, provider email/SMS, private object storage for production PDFs, and deeper multi-branch operations.", 684, 463, 410, 58, 16, "#E5F3EF", { lineSpacing: 1.16 });
  addNotes(s, "The objective is not to pretend that every production integration is already present. The current build implements the full demo workflow and keeps production boundaries explicit. For example, checkout creates a clearly labelled demo payment record, while a real payment adapter can be added later. Transition: These objectives serve two distinct user groups.");
}

// 10. Roles
{
  const s = p.slides.add(); setBg(s, C.paper); addHeader(s, "09 / Stakeholders", "Who uses the system?", "BookHub separates customer self-service from staff operations using role-aware access.", 10);
  const roles = [
    ["Customer", "Browse, buy/rent, reserve, review, manage account", C.teal],
    ["Inventory staff", "Manage copies, locations, checkouts, returns", C.gold],
    ["Manager", "Manage catalog, customers, orders, reports", C.navy],
    ["Owner", "Full access and sensitive business adjustments", C.coral],
  ];
  roles.forEach((r, i) => { const x = 72 + (i % 2) * 560; const y = 214 + Math.floor(i / 2) * 180; addCard(s, x, y, 510, 140, C.paper, C.line); addShape(s, "ellipse", x + 26, y + 28, 52, 52, r[2], "none", 0); addText(s, String(i + 1), x + 26, y + 41, 52, 22, 18, C.white, { bold: true, align: "center" }); addText(s, r[0], x + 100, y + 30, 330, 26, 22, C.ink, { bold: true }); addText(s, r[1], x + 100, y + 68, 360, 42, 15, C.muted, { lineSpacing: 1.12 }); });
  addNotes(s, "The role model is important because customers should not see staff operations, and staff actions need permission checks. The database design supports customer, inventory staff, manager, and owner roles. In the screenshots, the difference is visible in the navigation and in the admin dashboard. Transition: These roles interact with a set of connected features rather than isolated pages.");
}

// 11. Feature map
{
  const s = p.slides.add(); setBg(s); addHeader(s, "10 / Feature map", "The BookHub capability map", "The system is best understood as connected experiences around a shared operational core.", 11);
  const nodes = [
    ["Discover", "Home • sections • search • filters", 80, 225, C.teal],
    ["Engage", "Wishlist • reviews • reservations", 80, 392, C.gold],
    ["Transact", "Cart • orders • demo payments", 440, 225, C.navy],
    ["Access", "Physical rentals • digital library", 440, 392, C.coral],
    ["Operate", "Inventory • branches • shelf locations", 800, 225, C.tealDark],
    ["Inform", "Notifications • status updates", 800, 392, C.gold],
  ];
  nodes.forEach((n) => { addCard(s, n[2], n[3], 300, 116, C.paper, C.line); addShape(s, "rect", n[2], n[3], 10, 116, n[4], "none", 0); addText(s, n[0], n[2] + 26, n[3] + 20, 230, 26, 21, C.ink, { bold: true }); addText(s, n[1], n[2] + 26, n[3] + 58, 245, 32, 14, C.muted, { lineSpacing: 1.08 }); });
  addArrow(s, 380, 283, 440, 283, C.gold, 2); addArrow(s, 740, 283, 800, 283, C.gold, 2); addArrow(s, 380, 450, 440, 450, C.gold, 2); addArrow(s, 740, 450, 800, 450, C.gold, 2);
  addText(s, "One account, one stateful journey", 440, 555, 410, 30, 20, C.teal, { bold: true, align: "center" });
  addNotes(s, "This feature map shows how the product hangs together. Discovery feeds engagement and transactions; transactions create access and operational work; notifications keep the user informed. The architecture is intentionally modular so that a new provider or workflow can be added without rewriting the whole system. Transition: The technology stack provides the implementation foundation for this map.");
}

// 12. Stack overview
{
  const s = p.slides.add(); setBg(s, C.paper); addHeader(s, "11 / Technology stack", "The verified implementation stack", "The technologies below are taken from the project package files and architecture documentation.", 12);
  const stack = [
    ["React + Vite", "React builds the screens; Vite runs and bundles the app quickly.", C.teal],
    ["Routing & state", "Router changes pages; Redux and context remember login, cart, wishlist, and alerts.", C.gold],
    ["Node + Express", "The server receives requests and applies the bookstore rules.", C.navy],
    ["Mongoose + Zod", "Mongoose connects to MongoDB; Zod checks incoming data before it is saved.", C.coral],
    ["MongoDB Atlas", "Stores users, books, copies, orders, rentals, and notifications.", C.tealDark],
    ["Security tools", "JWT identifies users; bcrypt protects passwords; Helmet, CORS, and rate limits reduce risk.", C.gold],
  ];
  stack.forEach((r, i) => { const x = 74 + (i % 3) * 378; const y = 208 + Math.floor(i / 3) * 175; addCard(s, x, y, 340, 130, C.paper, C.line); addShape(s, "ellipse", x + 20, y + 24, 38, 38, r[2], "none", 0); addText(s, String(i + 1), x + 20, y + 33, 38, 16, 13, C.white, { bold: true, align: "center" }); addText(s, r[0], x + 76, y + 23, 230, 24, 18, C.ink, { bold: true }); addText(s, r[1], x + 24, y + 74, 290, 38, 14, C.muted, { lineSpacing: 1.1 }); });
  addNotes(s, "This is the verified stack from the client and server package files and the project README. The frontend is React with Vite and React Router; the backend is Node and Express with Mongoose; MongoDB Atlas stores the data. Redux Toolkit and Axios support cross-page state and API calls, while JWT, bcrypt, Helmet, CORS controls, validation, and rate limiting provide the security boundary. Transition: I will explain how the frontend turns that stack into a usable interface.");
}

// 13. Frontend
{
  const s = p.slides.add(); setBg(s); addHeader(s, "12 / Frontend", "Frontend technologies in context", "The client combines reusable React screens with a consistent bookstore design system.", 13);
  addCard(s, 70, 200, 500, 350, C.tealDark, C.tealDark);
  addText(s, "React + Vite", 104, 236, 390, 34, 26, C.white, { bold: true });
  addText(s, "React builds each screen from reusable pieces. Vite starts the project quickly and creates the production build.", 104, 296, 400, 70, 18, "#E5F3EF", { lineSpacing: 1.18 });
  addText(s, "Example from BookHub", 104, 404, 300, 24, 15, "#BFE7DF", { bold: true });
  addText(s, "The same BookCard pattern appears in the home page, section pages, catalogue, wishlist, and related book views.", 104, 438, 400, 58, 16, "#E5F3EF", { lineSpacing: 1.14 });
  addCard(s, 630, 200, 520, 350, C.paper, C.line);
  addText(s, "Supporting frontend pieces", 664, 236, 410, 28, 23, C.ink, { bold: true });
  addBulletList(s, ["React Router moves between customer and admin pages.", "Tailwind CSS controls the spacing, colour, and responsive layout.", "Redux Toolkit and context remember login, cart, wishlist, and notifications.", "Axios sends requests to the backend and shows safe errors."], 664, 296, 420, 56, 16);
  addNotes(s, "The frontend is not a collection of static pages. React components are reused across the customer journey, and routing creates separate experiences for customers and staff. Vite keeps local development fast, Tailwind supplies the visual system, and the state layer ensures that actions such as adding to a cart or marking a notification as read can update multiple screens. Transition: The frontend depends on a server API for business rules.");
}

// 14. Backend
{
  const s = p.slides.add(); setBg(s, C.paper); addHeader(s, "13 / Backend", "Backend and API responsibilities", "The server is the authority for authentication, business rules, and durable state changes.", 14);
  const layers = [
    ["Routes", "The named doors the frontend calls, such as books, orders, and rentals.", C.teal],
    ["Controllers", "Read the request, call the right rule, and prepare the response.", C.gold],
    ["Services", "Apply the real rules, such as copy availability and rental expiry.", C.navy],
    ["Models", "Describe how each MongoDB document is stored and related.", C.coral],
  ];
  layers.forEach((r, i) => { const y = 198 + i * 92; addCard(s, 90, y, 1030, 70, C.paper, C.line); addShape(s, "rect", 90, y, 170, 70, r[2], "none", 0); addText(s, r[0], 108, y + 22, 130, 25, 19, C.white, { bold: true }); addText(s, r[1], 292, y + 19, 780, 34, 16, C.muted, { lineSpacing: 1.12 }); });
  addText(s, "In simple words: request → rule → database → response", 90, 590, 1030, 28, 19, C.teal, { bold: true, align: "center" });
  addNotes(s, "BookHub keeps the browser from deciding important business outcomes. The route receives the request, the controller coordinates it, the service applies the business rule, and the model persists the result. For example, a digital PDF can only be opened after the server checks the user's active, unexpired entitlement. Transition: The database stores the state that makes these checks possible.");
}

// 15. Database
{
  const s = p.slides.add(); setBg(s); addHeader(s, "14 / Database", "MongoDB Atlas and the operational data model", "MongoDB stores documents that match the bookstore domain while preserving relationships through references and snapshots.", 15);
  addCard(s, 70, 200, 510, 360, C.tealDark, C.tealDark);
  addText(s, "Why MongoDB fits BookHub", 104, 236, 410, 30, 24, C.white, { bold: true });
  addText(s, "A collection is like a smart folder of related documents. The server reads and updates these folders through Mongoose.", 104, 286, 410, 64, 16, "#E5F3EF", { lineSpacing: 1.16 });
  addBulletList(s, ["MongoDB Atlas keeps the data in the cloud.", "Book stores a title; BookCopy stores each physical copy.", "Orders and rentals keep their own history.", "Indexes help common searches stay fast.", "Atlas lets the local app use the same shared database."], 104, 370, 420, 42, 15, "#E5F3EF");
  addCard(s, 640, 200, 500, 360, C.paper, C.line);
  addText(s, "Key collections", 674, 236, 380, 28, 23, C.ink, { bold: true });
  const names = ["User", "Book", "BookCopy", "Location", "Cart", "Order", "Rental", "Notification", "Wishlist", "Reservation", "Review"];
  names.forEach((n, i) => { const x = 674 + (i % 3) * 134; const y = 292 + Math.floor(i / 3) * 48; addPill(s, n, x, y, 118, i % 2 ? C.cream : C.tealSoft, i % 2 ? C.muted : C.teal); });
  addNotes(s, "MongoDB Atlas is the actual database platform used for local development. The data model separates catalog titles from physical copies, which is critical for stock and shelf tracking. Orders and rentals snapshot key commercial details so historical records remain correct even when a book is later edited. Transition: The next slide turns that data model into an overall architecture.");
}

// 16. Architecture
{
  const s = p.slides.add(); setBg(s, C.tealDark); addHeader(s, "15 / Architecture", "System architecture", "A layered MERN design keeps interface, business rules, and persistence understandable.", 16, true);
  addCard(s, 76, 220, 230, 240, "#F8F1E8", "#D3B899"); addText(s, "React client", 104, 248, 170, 30, 22, C.ink, { bold: true }); addText(s, "Pages\nComponents\nState\nAPI client", 104, 302, 160, 104, 18, C.muted, { lineSpacing: 1.3 });
  addCard(s, 362, 220, 240, 240, "#F8F1E8", "#D3B899"); addText(s, "Express API", 392, 248, 180, 30, 22, C.ink, { bold: true }); addText(s, "Routes\nControllers\nServices\nValidation", 392, 302, 160, 104, 18, C.muted, { lineSpacing: 1.3 });
  addCard(s, 660, 220, 240, 240, "#F8F1E8", "#D3B899"); addText(s, "MongoDB Atlas", 690, 248, 190, 30, 22, C.ink, { bold: true }); addText(s, "Users\nBooks & copies\nOrders & rentals\nNotifications", 690, 302, 180, 104, 18, C.muted, { lineSpacing: 1.3 });
  addCard(s, 958, 220, 240, 240, "#F8F1E8", "#D3B899"); addText(s, "Future storage", 988, 248, 180, 30, 22, C.ink, { bold: true }); addText(s, "Private covers\nProtected PDFs\nSigned URLs\nProvider adapters", 988, 302, 180, 104, 18, C.muted, { lineSpacing: 1.3 });
  addArrow(s, 306, 340, 362, 340, "#D7B063", 3); addArrow(s, 602, 340, 660, 340, "#D7B063", 3); addArrow(s, 900, 340, 958, 340, "#D7B063", 3);
  addText(s, "HTTPS JSON API", 304, 310, 78, 20, 11, "#E5F3EF", { align: "center" }); addText(s, "Mongoose", 600, 310, 70, 20, 11, "#E5F3EF", { align: "center" }); addText(s, "storage abstraction", 894, 310, 84, 20, 11, "#E5F3EF", { align: "center" });
  addNotes(s, "The architecture follows the project documentation: a React client calls an Express JSON API, which applies authentication, validation, business rules, and persistence through Mongoose. MongoDB Atlas stores operational and customer data. Private storage for covers and PDFs is a future production integration, so it is shown as an extension rather than as an already-implemented service. Transition: The next slide describes a typical customer order journey through these layers.");
}

// 17. Workflow
{
  const s = p.slides.add(); setBg(s); addHeader(s, "16 / Workflow", "End-to-end customer order flow", "A single order creates a chain of state changes that can be explained and audited.", 17);
  const steps = [
    ["1", "Discover", "Search or browse a section"],
    ["2", "Choose", "Select purchase or rental format"],
    ["3", "Cart", "Review quantities and totals"],
    ["4", "Checkout", "Create order + demo payment record"],
    ["5", "Review", "Owner accepts or updates order"],
    ["6", "Notify", "Customer sees status and access"],
  ];
  steps.forEach((st, i) => { const x = 62 + i * 194; addCard(s, x, 258, 160, 190, i === 3 ? C.teal : C.paper, i === 3 ? C.teal : C.line); addShape(s, "ellipse", x + 52, 282, 56, 56, i === 3 ? C.gold : C.tealSoft, "none", 0); addText(s, st[0], x + 52, 299, 56, 18, 15, i === 3 ? C.white : C.teal, { bold: true, align: "center" }); addText(s, st[1], x + 16, 367, 128, 26, 18, i === 3 ? C.white : C.ink, { bold: true, align: "center" }); addText(s, st[2], x + 16, 404, 128, 42, 13, i === 3 ? "#E5F3EF" : C.muted, { align: "center", lineSpacing: 1.1 }); if (i < steps.length - 1) addArrow(s, x + 160, 352, x + 194, 352, C.gold, 2); });
  addText(s, "The cart is emptied after order creation; the order remains visible in payment history and notifications.", 100, 530, 1080, 28, 17, C.teal, { bold: true, align: "center" });
  addNotes(s, "This is the main demonstration flow. A customer discovers a book, chooses a format, adds it to the cart, and creates an order. The backend keeps the commercial record separate from fulfillment status, so an owner can accept or update the order later. Notifications make the transition visible to the customer. Transition: The entities behind this flow are represented in the ER model.");
}

// 18. ER diagram
{
  const s = p.slides.add(); setBg(s, C.paper); addHeader(s, "17 / Data model", "Entity-Relationship view", "The diagram follows the documented Mongoose domain model and relationship map.", 18);
  const boxes = [
    ["User", "_id (PK)\nrole\nemail", 72, 206, C.teal],
    ["Book", "_id (PK)\ntitle\npricing\ncover", 300, 206, C.gold],
    ["BookCopy", "_id (PK)\nbookId (FK)\nlocationId (FK)\nstatus", 528, 206, C.navy],
    ["Location", "_id (PK)\nparentLocation\ntype\ncode", 756, 206, C.coral],
    ["Order", "_id (PK)\nuserId (FK)\nitems\nstatus", 72, 420, C.tealDark],
    ["Rental", "_id (PK)\nuserId (FK)\nbookId (FK)\ndueAt / status", 300, 420, C.gold],
    ["Notification", "_id (PK)\nrecipientId (FK)\ntype\nread", 528, 420, C.navy],
    ["Wishlist", "_id (PK)\nuserId (FK)\nbookIds", 756, 420, C.coral],
  ];
  boxes.forEach((b) => { addCard(s, b[2], b[3], 190, 132, C.paper, C.line); addShape(s, "rect", b[2], b[3], 190, 31, b[4], "none", 0); addText(s, b[0], b[2] + 12, b[3] + 8, 166, 18, 16, C.white, { bold: true }); addText(s, b[1], b[2] + 12, b[3] + 46, 165, 75, 12, C.muted, { lineSpacing: 1.2 }); });
  addArrow(s, 262, 272, 300, 272, C.gold, 2); addArrow(s, 490, 272, 528, 272, C.gold, 2); addArrow(s, 718, 272, 756, 272, C.gold, 2);
  addArrow(s, 167, 338, 167, 420, C.gold, 2); addArrow(s, 395, 338, 395, 420, C.gold, 2); addArrow(s, 623, 338, 623, 420, C.gold, 2); addArrow(s, 851, 338, 851, 420, C.gold, 2);
  addText(s, "1 → many", 257, 246, 46, 18, 10, C.muted, { align: "center" }); addText(s, "title → copies", 498, 300, 90, 18, 10, C.muted, { align: "center" }); addText(s, "user → orders / rentals / notices", 86, 566, 870, 22, 14, C.teal, { bold: true, align: "center" });
  addNotes(s, "The ER diagram is based on the documented core models. A Book represents a title, while BookCopy represents an individual physical item. User relationships connect orders, rentals, notifications, and wishlist records. Location is self-referencing so the hierarchy can represent branch, floor, section, rack, and shelf. Transition: The next slides show how this model becomes visible in the actual application.");
}

// 19. Catalog module
{
  const s = p.slides.add(); setBg(s); addHeader(s, "18 / Core module", "Catalog and section discovery", "BookHub uses curated sections, thumbnails, search, filters, and book cards to make the catalogue approachable.", 19);
  addCard(s, 70, 190, 560, 390, C.paper, C.line); await addImage(s, img.sections, 86, 208, 528, 235, { alt: "BookHub section browsing" }); addText(s, "Curated sections", 96, 465, 240, 24, 19, C.ink, { bold: true }); addText(s, "Sections such as Fiction, Science Fiction, Fantasy, Romance, Mythology & Folklore, and Biography & Memoir give the home page a human browsing rhythm.", 96, 504, 480, 48, 14, C.muted, { lineSpacing: 1.16 });
  addCard(s, 670, 190, 540, 390, C.paper, C.line); await addImage(s, img.books, 688, 208, 504, 235, { alt: "BookHub book cards" }); addText(s, "Reusable book cards", 700, 465, 240, 24, 19, C.ink, { bold: true }); addText(s, "Cards expose category, title, author, rating, and wishlist affordance while retaining the visual identity of the bookstore.", 700, 504, 465, 48, 14, C.muted, { lineSpacing: 1.16 });
  addNotes(s, "These screenshots demonstrate the discovery layer. The section page gives the catalogue a visual taxonomy, while the book cards keep important signals consistent across pages. The exact book count is dynamic and depends on the current database; the presentation uses the screen as a UI example rather than a permanent statistic. Transition: Search and filtering extend this discovery layer.");
}

// 20. Search and filters
{
  const s = p.slides.add(); setBg(s, C.paper); addHeader(s, "19 / Core module", "Search, filters, and sort controls", "The catalogue supports title, author, ISBN, category, format, and sorting signals.", 20);
  addCard(s, 70, 190, 590, 390, C.paper, C.line); await addImage(s, img.filter, 88, 212, 554, 250, { alt: "BookHub search and filter controls" }); addText(s, "Filterable discovery", 102, 489, 300, 24, 20, C.ink, { bold: true }); addText(s, "The screenshot shows category, format, and sort controls working together. The dropdown is intentionally kept as evidence of the interaction, while the final deck frame is contained so it is not stretched.", 102, 528, 500, 40, 14, C.muted, { lineSpacing: 1.12 });
  addCard(s, 710, 190, 440, 390, C.tealDark, C.tealDark);
  addText(s, "Why this matters", 742, 228, 330, 28, 23, C.white, { bold: true });
  addBulletList(s, ["Reduces search effort for a growing catalog.", "Lets the user compare physical and digital formats.", "Creates a clear path from discovery to book details."], 742, 292, 340, 68, 17, "#E5F3EF");
  addPill(s, "CATALOG API", 742, 505, 125, "#215C57", "#D9F1EB");
  addNotes(s, "The catalogue API accepts search and filter parameters, and the client exposes them through these controls. This is a good example of how the frontend and backend cooperate: the browser collects user intent, while the API returns a filtered result set. Transition: Once a user finds a book, account and preference features continue the journey.");
}

// 21. Auth/profile
{
  const s = p.slides.add(); setBg(s); addHeader(s, "20 / Core module", "Accounts and profile experience", "Authentication turns the bookstore from a catalogue into a personalised service.", 21);
  addCard(s, 72, 200, 360, 350, C.paper, C.line); await addImage(s, img.register, 88, 218, 328, 218, { alt: "BookHub registration screen" }); addText(s, "Registration", 94, 458, 240, 24, 20, C.ink, { bold: true }); addText(s, "Creates a customer identity with password rules and a clear entry point to sign in.", 94, 496, 280, 44, 14, C.muted, { lineSpacing: 1.12 });
  addCard(s, 460, 200, 360, 350, C.paper, C.line); await addImage(s, img.login, 476, 218, 328, 218, { alt: "BookHub login screen" }); addText(s, "Login", 482, 458, 240, 24, 20, C.ink, { bold: true }); addText(s, "Returns an authenticated session so protected customer routes can load personal data.", 482, 496, 280, 44, 14, C.muted, { lineSpacing: 1.12 });
  addCard(s, 848, 200, 360, 350, C.tealDark, C.tealDark); await addImage(s, img.profile, 864, 218, 328, 218, { alt: "BookHub customer profile" }); addText(s, "Profile", 874, 458, 250, 24, 20, C.white, { bold: true }); addText(s, "Shows account identity, role, status, store, orders, rentals, wishlist, and digital access entry points.", 874, 496, 280, 44, 14, "#E5F3EF", { lineSpacing: 1.12 });
  addNotes(s, "These screens show the authentication and profile surface. The account model supports roles and account status, while the UI makes the customer experience feel personal. In a public presentation, any private email shown in the screenshot should be masked; the presentation layout treats these screenshots as interface evidence rather than credential examples. Transition: Personalised actions lead to wishlist and cart behaviour.");
}

// 22. Wishlist/cart/payments
{
  const s = p.slides.add(); setBg(s, C.paper); addHeader(s, "21 / Core module", "Wishlist, cart, and payment history", "The commerce flow keeps intent, checkout, and historical records distinct.", 22);
  addCard(s, 58, 194, 370, 390, C.paper, C.line); await addImage(s, img.wishlist, 74, 212, 338, 210, { alt: "BookHub wishlist" }); addText(s, "Wishlist", 82, 456, 210, 24, 20, C.ink, { bold: true }); addText(s, "Save titles for later and move a saved book toward purchase.", 82, 496, 285, 38, 14, C.muted, { lineSpacing: 1.14 });
  addCard(s, 455, 194, 370, 390, C.paper, C.line); await addImage(s, img.cart, 471, 212, 338, 210, { alt: "BookHub cart" }); addText(s, "Cart and checkout", 479, 456, 280, 24, 20, C.ink, { bold: true }); addText(s, "Review quantities, formats, totals, and the order confirmation step.", 479, 496, 285, 38, 14, C.muted, { lineSpacing: 1.14 });
  addCard(s, 852, 194, 370, 390, C.tealDark, C.tealDark); await addImage(s, img.payments, 868, 212, 338, 210, { alt: "BookHub payment history" }); addText(s, "Payment history", 876, 456, 250, 24, 20, C.white, { bold: true }); addText(s, "The current experience records a clearly labelled demo payment status; no live gateway is claimed.", 876, 496, 285, 48, 14, "#E5F3EF", { lineSpacing: 1.14 });
  addNotes(s, "The wishlist is a customer preference, the cart is an active request, and payment history is a historical record. Keeping these separate prevents confusion when a cart is emptied after checkout. The README explicitly labels the current checkout as demo mode, so I present it honestly as a foundation for a future payment-provider adapter. Transition: Orders and rentals create a second layer of customer-visible updates.");
}

// 23. Notifications and digital
{
  const s = p.slides.add(); setBg(s); addHeader(s, "22 / Core module", "Notifications and digital access", "Notifications explain state changes while the digital library enforces time-limited access.", 23);
  addCard(s, 70, 194, 560, 390, C.paper, C.line); await addImage(s, img.notifications, 88, 212, 524, 228, { alt: "BookHub notifications" }); addText(s, "Event-driven messages", 98, 466, 300, 24, 20, C.ink, { bold: true }); addText(s, "Order confirmations, rental starts, due dates, overdue updates, and digital access events are stored in the notification centre.", 98, 506, 490, 44, 14, C.muted, { lineSpacing: 1.14 });
  addCard(s, 670, 194, 540, 390, C.tealDark, C.tealDark); await addImage(s, img.digital, 688, 212, 504, 228, { alt: "BookHub digital library" }); addText(s, "Digital library", 700, 466, 250, 24, 20, C.white, { bold: true }); addText(s, "The backend checks an active entitlement every time a digital rental is opened. Production private storage and signed URLs remain future work.", 700, 506, 465, 44, 14, "#E5F3EF", { lineSpacing: 1.14 });
  addNotes(s, "The notification screen demonstrates that the system speaks in professional, user-oriented messages rather than technical status codes. The digital library is not just a list of PDF links: the backend checks whether the user's access is still active before opening the reader. The project documentation intentionally keeps production object storage and signed URL delivery as a future integration. Transition: Staff users see the operational side of the same state.");
}

// 24. Admin dashboard
{
  const s = p.slides.add(); setBg(s, C.paper); addHeader(s, "23 / Admin portal", "Owner dashboard and operational visibility", "The staff portal turns bookstore state into a compact set of management signals.", 24);
  addCard(s, 70, 190, 760, 390, C.paper, C.line); await addImage(s, img.adminDash, 88, 208, 724, 324, { alt: "BookHub admin dashboard" }); addText(s, "Captured dashboard snapshot", 98, 548, 320, 22, 13, C.muted, { italic: true });
  addCard(s, 870, 190, 340, 390, C.tealDark, C.tealDark);
  addText(s, "Signals shown", 900, 228, 250, 26, 22, C.white, { bold: true });
  addBulletList(s, ["Total titles and copies", "Available and rented copies", "Overdue rentals", "Customers and orders", "Revenue snapshot"], 900, 286, 250, 46, 16, "#E5F3EF");
  addNotes(s, "This screenshot shows the owner dashboard as it appeared during testing. The metric values are a point-in-time snapshot, not a promise that they are permanent. The dashboard combines catalogue, inventory, rental, customer, order, and revenue signals so a store owner can decide what needs attention next. Transition: Inventory and shelf locations make the physical store traceable.");
}

// 25. Inventory and locations
{
  const s = p.slides.add(); setBg(s); addHeader(s, "24 / Admin portal", "Inventory, branches, shelves, and sections", "Physical copies become operationally useful when every copy can be placed and counted.", 25);
  addCard(s, 60, 195, 370, 390, C.paper, C.line); await addImage(s, img.branchShelf, 78, 214, 334, 225, { alt: "BookHub branch and shelf creation" }); addText(s, "Location hierarchy", 86, 466, 240, 24, 20, C.ink, { bold: true }); addText(s, "Branch → floor → section → rack → shelf", 86, 506, 280, 24, 15, C.teal, { bold: true });
  addCard(s, 455, 195, 370, 390, C.paper, C.line); await addImage(s, img.sectionForm, 473, 214, 334, 225, { alt: "BookHub section creation form" }); addText(s, "Curated sections", 481, 466, 240, 24, 20, C.ink, { bold: true }); addText(s, "Sections connect the operational catalogue to the home-page discovery experience.", 481, 506, 285, 40, 14, C.muted, { lineSpacing: 1.12 });
  addCard(s, 850, 195, 370, 390, C.tealDark, C.tealDark); await addImage(s, img.addBook, 868, 214, 334, 225, { alt: "BookHub add book form" }); addText(s, "Add a title", 876, 466, 240, 24, 20, C.white, { bold: true }); addText(s, "The owner can assign a section, cover, PDF metadata, pricing, rental rules, and copy count.", 876, 506, 285, 40, 14, "#E5F3EF", { lineSpacing: 1.12 });
  addNotes(s, "The admin inventory experience connects two concepts: catalogue titles and physical copy placement. A branch and shelf form creates the location hierarchy, while the add-book form captures title metadata, section, price, rental settings, and copy count. The model is ready for future branches without changing the core copy-location relationship. Transition: Operations also include order review and acceptance.");
}

// 26. Admin notifications/order review
{
  const s = p.slides.add(); setBg(s, C.paper); addHeader(s, "25 / Admin portal", "Order review and owner confirmation", "A customer order can remain pending until the owner reviews and accepts it.", 26);
  addCard(s, 70, 200, 760, 360, C.paper, C.line); await addImage(s, img.adminNotify, 88, 220, 724, 278, { alt: "BookHub admin notification with accept order" }); addText(s, "The owner sees the order request and an explicit acceptance action.", 96, 520, 650, 26, 16, C.teal, { bold: true });
  addCard(s, 870, 200, 340, 360, C.tealDark, C.tealDark); addText(s, "State transition", 900, 236, 240, 28, 22, C.white, { bold: true }); addText(s, "PLACED", 900, 300, 230, 25, 18, "#BFE7DF", { bold: true }); addText(s, "↓ owner review", 900, 337, 230, 24, 16, "#E5F3EF", { italic: true }); addText(s, "CONFIRMED", 900, 382, 230, 25, 18, "#D9F1EB", { bold: true }); addText(s, "The customer receives a professional notification after acceptance.", 900, 446, 250, 60, 15, "#E5F3EF", { lineSpacing: 1.15 });
  addNotes(s, "This screen demonstrates the operational hand-off. The customer can place an order, but the owner remains responsible for confirming availability and fulfilment. The notification and order state are designed to tell the same story. This is more professional than showing an order as completed before staff review. Transition: The next slide combines the screenshots into one realistic demonstration.");
}

// 27. Visual evidence appendix — larger screenshots for classroom projection
{
  const s = p.slides.add(); setBg(s); addHeader(s, "Visual evidence", "Discovery sections — enlarged view", "The section browser is shown at a readable scale so the audience can see the visual taxonomy.", 27);
  addCard(s, 66, 194, 820, 390, C.paper, C.line); await addImage(s, img.sections, 84, 214, 784, 350, { alt: "BookHub sections enlarged" });
  addCard(s, 930, 194, 280, 390, C.tealDark, C.tealDark); addText(s, "What to notice", 956, 230, 220, 28, 22, C.white, { bold: true }); addBulletList(s, ["Curated book genres", "Visible book counts", "Direct path to explore all books"], 956, 294, 220, 70, 16, "#E5F3EF");
  addNotes(s, "This enlarged evidence slide is included because the section screen contains several small labels in the original browser capture. The design uses a wide image frame so the audience can see the section names and book counts. Transition: The next visual slide focuses on the actual book cards.");
}
{
  const s = p.slides.add(); setBg(s, C.paper); addHeader(s, "Visual evidence", "Book cards — enlarged view", "Book cards carry category, title, author, rating, cover, and wishlist affordance.", 28);
  addCard(s, 66, 194, 820, 390, C.paper, C.line); await addImage(s, img.books, 84, 214, 784, 350, { alt: "BookHub book cards enlarged" });
  addCard(s, 930, 194, 280, 390, C.cream, C.line); addText(s, "Card anatomy", 956, 230, 220, 28, 22, C.ink, { bold: true }); addBulletList(s, ["Category label", "Cover and title", "Author and review signal", "Wishlist action"], 956, 294, 220, 58, 16, C.muted);
  addNotes(s, "The book-card layout is a reusable visual component used across discovery surfaces. Showing it at a larger scale makes the user interface easier to understand than placing multiple tiny cards on one slide. Transition: The next slide shows a complete customer action rather than only discovery.");
}
{
  const s = p.slides.add(); setBg(s); addHeader(s, "Visual evidence", "Cart and checkout — enlarged view", "The cart keeps selected titles, formats, quantities, and the order summary together.", 29);
  addCard(s, 66, 194, 820, 390, C.paper, C.line); await addImage(s, img.cart, 84, 214, 784, 350, { alt: "BookHub cart enlarged" });
  addCard(s, 930, 194, 280, 390, C.tealDark, C.tealDark); addText(s, "Interaction", 956, 230, 220, 28, 22, C.white, { bold: true }); addBulletList(s, ["Quantity controls", "Format-aware pricing", "Order summary", "Place order action"], 956, 294, 220, 58, 16, "#E5F3EF");
  addNotes(s, "This view is enlarged so the teacher can read the selected books and the order summary. The cart is an active request, not the historical payment record. After checkout, the cart is cleared and the order becomes visible in payment history and notifications. Transition: A digital rental has a different access surface.");
}
{
  const s = p.slides.add(); setBg(s, C.paper); addHeader(s, "Visual evidence", "Digital library — enlarged view", "Digital rentals remain visible with their expiry and protected open action.", 30);
  addCard(s, 66, 194, 820, 390, C.paper, C.line); await addImage(s, img.digital, 84, 214, 784, 350, { alt: "BookHub digital library enlarged" });
  addCard(s, 930, 194, 280, 390, C.cream, C.line); addText(s, "Access rules", 956, 230, 220, 28, 22, C.ink, { bold: true }); addBulletList(s, ["Active rental badge", "Expiry date", "Rental charge", "Open digital edition"], 956, 294, 220, 58, 16, C.muted);
  addNotes(s, "This enlarged digital-library view makes the active badge, expiry date, rental charge, and open action visible. The backend checks access each time the user opens a digital rental. The current project keeps private production PDF storage as a future integration rather than claiming a permanent public file URL. Transition: The same readability principle applies to staff operations.");
}
{
  const s = p.slides.add(); setBg(s); addHeader(s, "Visual evidence", "Admin dashboard — enlarged view", "The owner dashboard turns bookstore activity into operational signals.", 31);
  addCard(s, 66, 194, 940, 390, C.paper, C.line); await addImage(s, img.adminDash, 84, 214, 904, 350, { alt: "BookHub admin dashboard enlarged" });
  addCard(s, 1034, 194, 176, 390, C.tealDark, C.tealDark); addText(s, "Signals", 1052, 230, 140, 28, 22, C.white, { bold: true }); addText(s, "Books\nCopies\nCustomers\nOrders\nRevenue", 1052, 294, 130, 150, 17, "#E5F3EF", { bold: true, lineSpacing: 1.38 });
  addNotes(s, "This enlarged dashboard screenshot is easier to present than the smaller earlier frame. It shows the operational overview: titles, copies, availability, rentals, overdue items, customers, orders, and revenue. The numbers are a captured snapshot from the supplied screen, not a permanent business claim. Transition: The next visual slide focuses on the owner-side order action.");
}
{
  const s = p.slides.add(); setBg(s, C.paper); addHeader(s, "Visual evidence", "Order acceptance — enlarged view", "Owner review creates a clear transition from placed to confirmed.", 32);
  addCard(s, 66, 194, 820, 390, C.paper, C.line); await addImage(s, img.adminNotify, 84, 214, 784, 350, { alt: "BookHub order acceptance enlarged" });
  addCard(s, 930, 194, 280, 390, C.cream, C.line); addText(s, "Professional state", 956, 230, 220, 28, 22, C.ink, { bold: true }); addText(s, "PLACED\n\nOwner review\n\nCONFIRMED", 956, 300, 220, 150, 20, C.teal, { bold: true, lineSpacing: 1.4 }); addText(s, "The customer receives a status notification after acceptance.", 956, 492, 220, 52, 14, C.muted, { lineSpacing: 1.12 });
  addNotes(s, "The owner notification is shown at a larger scale to make the acceptance action visible. The important design decision is to keep a pending order pending until the owner confirms it. That state change then produces a professional customer update. Transition: The final visual evidence slide shows the physical-store location model.");
}
{
  const s = p.slides.add(); setBg(s); addHeader(s, "Visual evidence", "Inventory placement — enlarged view", "The owner can create a branch and shelf hierarchy and attach titles to operational locations.", 33);
  addCard(s, 66, 194, 820, 390, C.paper, C.line); await addImage(s, img.branchShelf, 84, 214, 784, 350, { alt: "BookHub branch and shelf creation enlarged" });
  addCard(s, 930, 194, 280, 390, C.tealDark, C.tealDark); addText(s, "Location chain", 956, 230, 220, 28, 22, C.white, { bold: true }); addText(s, "Branch\n↓\nFloor\n↓\nSection\n↓\nRack\n↓\nShelf", 956, 292, 220, 230, 18, "#E5F3EF", { bold: true, align: "center", lineSpacing: 1.18 });
  addNotes(s, "This visual evidence slide enlarges the branch and shelf form. The hierarchy lets the store explain exactly where a physical copy belongs. It is a small example of the project’s larger principle: operational data should be specific enough to support real staff decisions. Transition: I will now return to the end-to-end scenario.");
}

// 34. End-to-end demo
{
  const s = p.slides.add(); setBg(s); addHeader(s, "26 / Demonstration", "A realistic BookHub scenario", "One story connects discovery, purchase, inventory, notification, and access.", 27);
  const demo = [
    ["Customer", "Finds a title in a section and checks the book card."],
    ["Decision", "Adds a purchase or rental format to the cart."],
    ["Checkout", "Places the order; the cart clears and a payment record is created in demo mode."],
    ["Owner", "Reviews the pending order and accepts it from the admin portal."],
    ["Update", "Customer sees a confirmation notification and the relevant order/rental/digital status."],
  ];
  demo.forEach((d, i) => { const y = 198 + i * 84; addShape(s, "ellipse", 84, y + 8, 42, 42, i === 4 ? C.gold : C.teal, "none", 0); addText(s, String(i + 1), 84, y + 20, 42, 18, 14, C.white, { bold: true, align: "center" }); addCard(s, 154, y, 970, 60, i === 4 ? C.tealSoft : C.paper, C.line); addText(s, d[0], 180, y + 18, 130, 22, 17, C.teal, { bold: true }); addText(s, d[1], 330, y + 18, 740, 24, 15, C.muted); if (i < demo.length - 1) addArrow(s, 105, y + 50, 105, y + 84, C.gold, 2); });
  addNotes(s, "This scenario is the story I would demonstrate live. It begins with a customer selecting a title and ends with a state-aware update after owner confirmation. The key learning is that a full-stack product is a sequence of dependable state transitions, not only a collection of attractive screens. Transition: The quality of those transitions depends on testing and validation.");
}

// 28. Testing
{
  const s = p.slides.add(); setBg(s, C.paper); addHeader(s, "27 / Quality", "Testing and validation", "The repository includes automated checks and project-level verification commands.", 28);
  const checks = [
    ["Backend smoke test", "API health, authentication, catalog, inventory, orders, rentals, notifications", C.teal],
    ["Frontend lint", "Oxlint checks client code; current project notes report warnings only", C.gold],
    ["Production build", "Vite verifies the client can be bundled for deployment", C.navy],
    ["Project check", "A root script combines the main backend and frontend checks", C.coral],
  ];
  checks.forEach((c, i) => { const x = 72 + (i % 2) * 560; const y = 210 + Math.floor(i / 2) * 174; addCard(s, x, y, 510, 130, C.paper, C.line); addShape(s, "rect", x, y, 10, 130, c[2], "none", 0); addText(s, c[0], x + 32, y + 22, 410, 24, 19, C.ink, { bold: true }); addText(s, c[1], x + 32, y + 62, 420, 42, 14, C.muted, { lineSpacing: 1.12 }); });
  addText(s, "Evidence boundary: this slide reports the documented checks; it does not invent pass percentages.", 72, 566, 1060, 24, 15, C.teal, { bold: true });
  addNotes(s, "The project documentation lists a backend smoke test, frontend lint check, production build, and a combined project-check script. The correct academic claim is that these checks exist and are part of the validation workflow; I should not invent percentages or test coverage values that were not measured. Transition: Security is another quality boundary that deserves its own explanation.");
}

// 29. Security
{
  const s = p.slides.add(); setBg(s); addHeader(s, "28 / Quality", "Security and reliability boundaries", "Security is implemented as a set of small controls around authentication, input, access, and data handling.", 29);
  const sec = [
    ["Identity", "JWT access tokens, refresh sessions, bcrypt password hashing", C.teal],
    ["Authorization", "Role and ownership checks on protected operations", C.gold],
    ["Input safety", "Zod validation, ObjectId validation, sanitization", C.navy],
    ["Transport", "Helmet headers, CORS restrictions, request rate limits", C.coral],
    ["Digital access", "Server checks active, unexpired entitlement before open", C.tealDark],
    ["Secrets", "Environment variables keep credentials out of source", C.gold],
  ];
  sec.forEach((c, i) => { const x = 72 + (i % 3) * 378; const y = 210 + Math.floor(i / 3) * 170; addCard(s, x, y, 340, 126, C.paper, C.line); addShape(s, "ellipse", x + 22, y + 24, 34, 34, c[2], "none", 0); addText(s, "✓", x + 22, y + 31, 34, 18, 16, C.white, { bold: true, align: "center" }); addText(s, c[0], x + 74, y + 22, 240, 22, 18, C.ink, { bold: true }); addText(s, c[1], x + 22, y + 70, 292, 40, 14, C.muted, { lineSpacing: 1.08 }); });
  addNotes(s, "The project applies security in layers. Authentication establishes identity, authorization limits sensitive actions, validation protects routes, and the server makes time-based decisions for digital access and rentals. The security boundary also includes environment variables and production startup checks. Transition: Honest documentation also means acknowledging what is not yet production-ready.");
}

// 30. Limitations
{
  const s = p.slides.add(); setBg(s, C.paper); addHeader(s, "29 / Reflection", "Current limitations and challenges", "The project is a strong functional demonstration, but it is not presented as a finished commercial platform.", 30);
  addCard(s, 72, 210, 520, 335, C.paper, C.line);
  addText(s, "Current limitations", 106, 244, 360, 28, 23, C.ink, { bold: true });
  addBulletList(s, ["Checkout remains explicitly demo payment mode.", "Email, SMS, and WhatsApp delivery are not connected.", "Production PDF storage should use private object storage and signed URLs.", "Deeper multi-branch transfer and supplier workflows are deferred."], 106, 302, 420, 55, 16);
  addCard(s, 650, 210, 500, 335, C.tealDark, C.tealDark);
  addText(s, "Challenges solved during development", 684, 244, 420, 28, 23, C.white, { bold: true });
  addBulletList(s, ["Making search return the right books from a title or author.", "Tracking each physical copy and its exact shelf location.", "Handling buy, rent, reserve, and digital-reading choices together.", "Keeping customer and admin status updates consistent."], 684, 302, 420, 55, 16, "#E5F3EF");
  addNotes(s, "A professional project presentation should be honest about boundaries. BookHub intentionally avoids claiming a live payment gateway or production PDF delivery. The main technical challenges were consistency across stateful workflows, the separation of title and copy data, and maintaining a shared visual system across customer and admin screens. Transition: These limitations suggest concrete future enhancements.");
}

// 31. Future enhancements
{
  const s = p.slides.add(); setBg(s); addHeader(s, "30 / Roadmap", "Future enhancements", "These are proposed next steps, not current claims.", 31);
  const futures = [
    ["High", "Live payment gateway", "Replace demo payment adapter with provider webhooks and reconciliation.", C.coral],
    ["High", "Private PDF storage", "Move files to object storage and return short-lived signed URLs.", C.teal],
    ["Medium", "Email/SMS delivery", "Add provider adapters for order and rental reminders.", C.gold],
    ["Medium", "Operational reporting", "Add exportable sales, stock, and overdue dashboards.", C.navy],
    ["Low", "Mobile client", "Reuse the API for a responsive mobile experience.", C.tealDark],
    ["Low", "Supplier workflows", "Add purchase orders, receiving, and stock transfers.", C.gold],
  ];
  futures.forEach((f, i) => { const x = 72 + (i % 2) * 560; const y = 202 + Math.floor(i / 2) * 140; addCard(s, x, y, 510, 108, C.paper, C.line); addPill(s, f[0], x + 20, y + 18, 72, f[3] === C.coral ? "#F7E3E3" : C.tealSoft, f[3]); addText(s, f[1], x + 112, y + 18, 350, 22, 18, C.ink, { bold: true }); addText(s, f[2], x + 20, y + 58, 460, 28, 14, C.muted, { lineSpacing: 1.08 }); });
  addNotes(s, "The future roadmap is grounded in the architecture already present. Payments and storage are high priority because they move the demonstration toward production trust. Provider adapters, reporting, mobile, and supplier workflows can be added later without changing the core title-copy-order-rental model. Transition: The current implementation already delivers a meaningful set of outcomes.");
}

// 32. Achievements and learning
{
  const s = p.slides.add(); setBg(s, C.paper); addHeader(s, "31 / Outcome", "What I achieved and learned", "The project became a practical exercise in turning a product idea into a documented full-stack system.", 32);
  addMetric(s, 72, 214, 250, 112, "01", "Full-stack product narrative", C.teal);
  addMetric(s, 350, 214, 250, 112, "02", "Stateful customer workflows", C.gold);
  addMetric(s, 628, 214, 250, 112, "03", "Operational data modelling", C.navy);
  addMetric(s, 906, 214, 250, 112, "04", "Security + validation mindset", C.coral);
  addCard(s, 72, 380, 1084, 160, C.tealDark, C.tealDark);
  addText(s, "The most important learning", 104, 414, 350, 26, 19, "#BFE7DF", { bold: true });
  addText(s, "A professional application is not only a polished interface. It is a set of understandable states, dependable rules, and honest boundaries that users can trust.", 104, 452, 940, 52, 25, C.white, { bold: true, lineSpacing: 1.05 });
  addNotes(s, "The project helped me practise more than individual technologies. I learned to think about a product as a set of stateful workflows, to model physical copies separately from titles, to keep security decisions on the server, and to document what is implemented versus what is planned. These are transferable software-engineering skills. Transition: I will close by summarising the project value.");
}

// 33. Conclusion
{
  const s = p.slides.add(); setBg(s, C.tealDark); addHeader(s, "32 / Conclusion", "BookHub turns a bookstore into a connected experience", "The product connects discovery, commerce, access, and operations around one reliable source of state.", 33, true);
  addText(s, "Problem", 92, 238, 160, 26, 17, "#BFE7DF", { bold: true });
  addText(s, "Fragmented discovery, availability, orders, rentals, and updates.", 92, 276, 260, 62, 24, C.white, { bold: true, lineSpacing: 1.02 });
  addText(s, "Solution", 442, 238, 160, 26, 17, "#BFE7DF", { bold: true });
  addText(s, "A MERN-stack platform with customer and owner workflows.", 442, 276, 280, 62, 24, C.white, { bold: true, lineSpacing: 1.02 });
  addText(s, "Value", 810, 238, 160, 26, 17, "#BFE7DF", { bold: true });
  addText(s, "Clearer decisions, traceable stock, and professional status communication.", 810, 276, 300, 84, 24, C.white, { bold: true, lineSpacing: 1.02 });
  addRule(s, 92, 418, 1000, "#65B7A8", 2);
  addText(s, "Thank you", 92, 472, 300, 48, 38, C.white, { bold: true });
  addText(s, "I welcome your questions and feedback.", 92, 536, 430, 30, 18, "#E5F3EF", { italic: true });
  addNotes(s, "Closing speech: BookHub addresses a practical bookstore problem by connecting catalogue discovery, customer actions, inventory operations, and state-aware notifications. The project is honest about its demo boundaries while keeping the architecture ready for production integrations. Thank you for listening. I welcome your questions.\n\nViva preparation prompts: 1) Why did you separate Book from BookCopy? 2) Why MongoDB Atlas? 3) What is the role of Express services? 4) How does JWT authentication work? 5) How are roles enforced? 6) How does digital access expire? 7) Why is checkout called demo mode? 8) How are rental penalties calculated? 9) What does a notification represent? 10) What is the relationship between Order and Payment? 11) What does the location hierarchy solve? 12) How would you add live payments? 13) How would you secure production PDFs? 14) What testing did you run? 15) What are the main limitations? 16) How would you scale to multiple branches? 17) Why use Vite? 18) How does the frontend communicate with the backend? 19) What happens when a copy is returned damaged? 20) What did you learn from the project?");
}

// Render previews
for (const [index, slide] of p.slides.items.entries()) {
  const blob = await p.export({ slide, format: "png", scale: 1 });
  await fs.writeFile(path.join(renderDir, `slide-${String(index + 1).padStart(2, "0")}.png`), new Uint8Array(await blob.arrayBuffer()));
}

const candidatePath = path.join(stagingDir, "BookHub_Internship_Project_Presentation_candidate.pptx");
await (await PresentationFile.exportPptx(p)).save(candidatePath);

const { finalizePresentation } = await import(pathToFileURL(path.join(skillDir, "container_tools", "artifact_tool_utils.mjs")).href);
const requirements = {
  explicitTotalSlideCount: 40,
  requiredNativeTableOwnerSlides: [],
  requiredNativeChartOwnerSlides: [],
};
const fontPolicy = { basis: "user_request", families: ["Arial", "Arial Bold"] };
const validation = await finalizePresentation({
  ...requirements,
  workspaceDir,
  candidatePath,
  finalPath: finalPptx,
  pythonExecutable: runtimePython,
  integrityValidatorPath: path.join(skillDir, "container_tools", "inspect_presentation_package_integrity.py"),
  layoutValidatorPath: path.join(skillDir, "container_tools", "inspect_presentation_layout_geometry.py"),
  layoutArgs: ["--expected-slide-size-emu", "12192000,6858000", "--validate-bullet-geometry", "--validate-heading-fit"],
  fontPolicy,
  verifyArtifactToolImport: true,
  receiptPath: path.join(stagingDir, "BookHub_Internship_Project_Presentation_Classroom_Updated.validation.json"),
});
console.log(JSON.stringify(validation, null, 2));
console.log(`FINAL_PPTX=${finalPptx}`);
