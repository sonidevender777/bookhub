from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    PageTemplate,
    Paragraph,
    Spacer,
    PageBreak,
    Table,
    TableStyle,
    Preformatted,
    KeepTogether,
    HRFlowable,
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from xml.sax.saxutils import escape
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output" / "pdf" / "BookHub_Presentation_Study_Guide_Devender_Tech_Expanded.pdf"
OUT.parent.mkdir(parents=True, exist_ok=True)


def register_fonts():
    font_dir = Path("C:/Windows/Fonts")
    candidates = [
        ("GuideArial", font_dir / "arial.ttf"),
        ("GuideArialBold", font_dir / "arialbd.ttf"),
        ("GuideArialItalic", font_dir / "ariali.ttf"),
    ]
    if all(p.exists() for _, p in candidates):
        for name, path in candidates:
            pdfmetrics.registerFont(TTFont(name, str(path)))
        return "GuideArial", "GuideArialBold", "GuideArialItalic"
    return "Helvetica", "Helvetica-Bold", "Helvetica-Oblique"


REG, BOLD, ITALIC = register_fonts()

TEAL = colors.HexColor("#07554F")
TEAL2 = colors.HexColor("#0B7469")
NAVY = colors.HexColor("#243247")
CORAL = colors.HexColor("#C96A4C")
SAND = colors.HexColor("#E9D8C2")
MINT = colors.HexColor("#E7F1EC")
CREAM = colors.HexColor("#FBF7F1")
INK = colors.HexColor("#241C18")
MUTED = colors.HexColor("#6F625B")


styles = getSampleStyleSheet()
styles.add(ParagraphStyle(
    name="GuideTitle", fontName=BOLD, fontSize=26, leading=31, textColor=INK,
    spaceAfter=8, alignment=TA_LEFT
))
styles.add(ParagraphStyle(
    name="GuideSubTitle", fontName=REG, fontSize=12, leading=17, textColor=MUTED,
    spaceAfter=10
))
styles.add(ParagraphStyle(
    name="Section", fontName=BOLD, fontSize=19, leading=23, textColor=TEAL,
    spaceBefore=4, spaceAfter=8
))
styles.add(ParagraphStyle(
    name="SubSection", fontName=BOLD, fontSize=13, leading=17, textColor=NAVY,
    spaceBefore=8, spaceAfter=4
))
styles.add(ParagraphStyle(
    name="TableHead", fontName=BOLD, fontSize=10.2, leading=13, textColor=colors.white,
    spaceAfter=0
))
styles.add(ParagraphStyle(
    name="Body", fontName=REG, fontSize=10.3, leading=15, textColor=INK,
    spaceAfter=6
))
styles.add(ParagraphStyle(
    name="Small", fontName=REG, fontSize=8.5, leading=12, textColor=MUTED,
    spaceAfter=4
))
styles.add(ParagraphStyle(
    name="GuideBullet", fontName=REG, fontSize=10.1, leading=14.5, leftIndent=12,
    firstLineIndent=-8, bulletIndent=0, textColor=INK, spaceAfter=3
))
styles.add(ParagraphStyle(
    name="Q", fontName=BOLD, fontSize=10.6, leading=14, textColor=TEAL,
    spaceAfter=2
))
styles.add(ParagraphStyle(
    name="A", fontName=REG, fontSize=9.8, leading=14, textColor=INK,
    spaceAfter=5
))
styles.add(ParagraphStyle(
    name="GuideCode", fontName="Courier", fontSize=7.8, leading=10.2, textColor=NAVY,
    leftIndent=7, rightIndent=7, spaceBefore=3, spaceAfter=5
))


def p(text, style="Body"):
    return Paragraph(text, styles[style])


def bullets(items):
    return [p("- " + item, "GuideBullet") for item in items]


def callout(title, body, color=TEAL, fill=MINT):
    content = [p(title, "SubSection"), p(body, "Body")]
    t = Table([[content]], colWidths=[170 * mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), fill),
        ("BOX", (0, 0), (-1, -1), 0.7, color),
        ("LINEBEFORE", (0, 0), (0, -1), 4, color),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    return t


def qna(question, answer):
    content = [p(question, "Q"), p(answer, "A")]
    t = Table([[content]], colWidths=[170 * mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.white),
        ("BOX", (0, 0), (-1, -1), 0.45, SAND),
        ("LINEBEFORE", (0, 0), (0, -1), 3, CORAL),
        ("LEFTPADDING", (0, 0), (-1, -1), 9),
        ("RIGHTPADDING", (0, 0), (-1, -1), 9),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    return KeepTogether([t, Spacer(1, 4)])


def add_page_header_footer(canvas, doc):
    canvas.saveState()
    w, h = A4
    if doc.page > 1:
        canvas.setFillColor(TEAL)
        canvas.rect(0, h - 7 * mm, w, 7 * mm, fill=1, stroke=0)
        canvas.setFont(REG, 7.8)
        canvas.setFillColor(MUTED)
        canvas.drawString(20 * mm, h - 14 * mm, "BookHub presentation study guide")
        canvas.drawRightString(w - 20 * mm, h - 14 * mm, "Devender")
    canvas.setStrokeColor(SAND)
    canvas.line(20 * mm, 14 * mm, w - 20 * mm, 14 * mm)
    canvas.setFont(REG, 8)
    canvas.setFillColor(MUTED)
    canvas.drawString(20 * mm, 8 * mm, "Use simple language. Claim only what is implemented.")
    canvas.drawRightString(w - 20 * mm, 8 * mm, f"Page {doc.page}")
    canvas.restoreState()


doc = BaseDocTemplate(
    str(OUT), pagesize=A4, rightMargin=20 * mm, leftMargin=20 * mm,
    topMargin=22 * mm, bottomMargin=20 * mm, title="BookHub Presentation Study Guide",
    author="Devender"
)
frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="normal")
doc.addPageTemplates([PageTemplate(id="guide", frames=frame, onPage=add_page_header_footer)])

story = []

# Cover
story += [Spacer(1, 16 * mm)]
story.append(p("BOOKHUB", "GuideTitle"))
story.append(p("Project Presentation Study Guide", "GuideTitle"))
story.append(HRFlowable(width="100%", thickness=2, color=TEAL, spaceBefore=5, spaceAfter=12))
story.append(p("A simple speaking guide for your classroom presentation and viva", "GuideSubTitle"))
story.append(Spacer(1, 8 * mm))
cover = [
    [p("Student", "SubSection"), p("Devender", "Body")],
    [p("Roll number", "SubSection"), p("23001001023", "Body")],
    [p("Course", "SubSection"), p("B.Tech CSE - 4th year, 7th semester", "Body")],
    [p("University", "SubSection"), p("Deenbandhu Chhotu Ram University of Science and Technology, Murthal (DCRUST)", "Body")],
    [p("Academic session", "SubSection"), p("2026-2027", "Body")],
    [p("Submitted to", "SubSection"), p("Dr. Jitender Bharadwaj Sir", "Body")],
    [p("Internship", "SubSection"), p("Codtech CITS2765", "Body")],
]
ct = Table(cover, colWidths=[42 * mm, 128 * mm])
ct.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (0, -1), MINT),
    ("BOX", (0, 0), (-1, -1), 0.8, SAND),
    ("INNERGRID", (0, 0), (-1, -1), 0.3, SAND),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("LEFTPADDING", (0, 0), (-1, -1), 8),
    ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ("TOPPADDING", (0, 0), (-1, -1), 7),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
]))
story.append(ct)
story.append(Spacer(1, 10 * mm))
story.append(callout("How to use this guide", "Read the bold question first, then practise the answer in your own words. In the actual presentation, start with the problem, show the user flow, and only then explain the technology behind it.", TEAL, MINT))
story.append(PageBreak())

# Opening and project story
story.append(p("1. Your 60-second opening", "Section"))
story.append(callout("Opening speech", "Good morning Sir and everyone. My project is BookHub, a full-stack bookstore management platform for a physical bookstore. It connects customers and store staff in one system. Customers can browse books, search by title or author, buy or rent physical copies, reserve a book, access an eligible digital rental, write reviews, and track notifications. Staff and owners can manage books, copies, shelf locations, orders, rentals, and reports. I built the project with a React client, an Express and Node.js API, and MongoDB. The main goal is to make bookstore operations clear, searchable, and easy to manage while keeping customer actions and staff actions separate.", TEAL, MINT))
story.append(p("If you need a shorter version", "SubSection"))
story += bullets([
    "BookHub digitises the daily work of a physical bookstore.",
    "It combines catalog, inventory, orders, rentals, digital access, reviews, and admin operations.",
    "The project uses React on the client, Express/Node.js on the server, and MongoDB for data.",
])
story.append(p("2. Project in one clear story", "Section"))
story.append(p("The problem", "SubSection"))
story.append(p("A bookstore has more than a list of titles. It must know which physical copy is available, where that copy is shelved, which customer placed an order, which rental is overdue, and whether a digital rental is still active. If these details are handled separately, the customer view and the staff view can become inconsistent.", "Body"))
story.append(p("The solution", "SubSection"))
story.append(p("BookHub gives the store one connected system. A book stores title-level information such as title, author, section, price, and cover. A separate copy record stores the physical copy code, condition, availability, and shelf location. Orders, rentals, reservations, payments, notifications, reviews, and digital access are linked to the right user and book records.", "Body"))
story.append(p("The users", "SubSection"))
story += bullets([
    "Customer: searches, buys, rents, reserves, reviews, saves books, and manages their account.",
    "Inventory staff: manages copies, branches, locations, checkouts, and returns through protected APIs.",
    "Manager: manages catalog, customers, orders, rentals, and reports from the admin portal.",
    "Owner: has the highest business access for sensitive adjustments and full administration.",
])
story.append(PageBreak())

# Demo flow
story.append(p("3. End-to-end demo flow for class", "Section"))
story.append(p("Use this order when demonstrating the application. It tells a natural story and avoids jumping between unrelated pages.", "Body"))
story += bullets([
    "Open Home: explain that the homepage introduces the store and highlights book sections.",
    "Open Books: search for a title or author, filter by section or format, and explain that the list updates from the API.",
    "Open a book: show the title, author, price, availability, cover, review area, and whether digital access is available.",
    "Add to cart: add one purchase or physical rental and explain the order summary.",
    "Place a demo order: explain that this project records a demo payment and creates an order for owner confirmation; it is not a live payment gateway.",
    "Open My rentals or Digital library: show rental dates, expiry, and the backend access check for digital rentals.",
    "Open Profile, Wishlist, Notifications, and Payments: show the customer self-service features.",
    "Open Admin: explain that manager and owner accounts can manage the catalog, inventory, rentals, customers, and reports.",
])
story.append(callout("One sentence to connect the demo", "The same data moves through the system from catalog to cart, order, rental or digital access, and finally to notifications and admin records.", CORAL, colors.HexColor("#FFF1EA")))
story.append(p("What not to claim", "SubSection"))
story += bullets([
    "Do not say that a live payment provider is connected. The current project uses a clearly labelled demo payment flow.",
    "Do not say PDFs are publicly exposed. In a production deployment, private storage and short-lived signed URLs are recommended.",
    "Do not say inventory staff can open the manager admin page. Their role is supported by protected inventory and rental APIs; the visible admin portal is restricted to manager and owner accounts.",
])
story.append(PageBreak())

# Tech stack overview
story.append(p("4. Technology stack: the answer to 'what and why?'", "Section"))
story.append(p("A technology stack is the set of tools used to build the user interface, server logic, data storage, security, and development workflow. BookHub uses JavaScript across the client and server, which keeps the project consistent and easier to maintain for a small team.", "Body"))
stack = [
    [p("Layer", "TableHead"), p("Technology", "TableHead"), p("Simple role in BookHub", "TableHead")],
    [p("Frontend", "Body"), p("React 19, React Router, Vite", "Body"), p("Builds the pages, reusable components, and client-side navigation.", "Body")],
    [p("Client communication", "Body"), p("Axios", "Body"), p("Sends authenticated JSON requests to the backend and centralises errors and credentials.", "Body")],
    [p("Client state", "Body"), p("React Context", "Body"), p("Keeps the signed-in user and cart available to related pages. Redux Toolkit is installed but not used by the current source code.", "Body")],
    [p("Backend", "Body"), p("Node.js and Express", "Body"), p("Runs the HTTP API, routing, middleware, controllers, and error handling.", "Body")],
    [p("Database", "Body"), p("MongoDB and Mongoose", "Body"), p("Stores flexible bookstore records while Mongoose adds schemas, validation, and references.", "Body")],
    [p("Security", "Body"), p("JWT, bcryptjs, Zod, Helmet, CORS, rate limiting", "Body"), p("Authenticates users, protects passwords, validates input, and reduces common API risks.", "Body")],
    [p("Quality", "Body"), p("ESLint/Oxlint, smoke tests, Vite build", "Body"), p("Checks code quality, core API behaviour, and whether the client can be bundled.", "Body")],
]
st = Table(stack, colWidths=[32 * mm, 45 * mm, 93 * mm], repeatRows=1)
st.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), TEAL),
    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
    ("BACKGROUND", (0, 1), (-1, -1), colors.white),
    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, CREAM]),
    ("BOX", (0, 0), (-1, -1), 0.6, SAND),
    ("INNERGRID", (0, 0), (-1, -1), 0.3, SAND),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("LEFTPADDING", (0, 0), (-1, -1), 6),
    ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ("TOPPADDING", (0, 0), (-1, -1), 5),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
]))
story.append(st)
story.append(Spacer(1, 5))
story.append(callout("Easy stack answer", "I selected these tools because they are widely used, work well together, and let me build a complete application with one language. React handles the browser, Express handles the API, MongoDB stores the data, and the security tools protect the boundaries between them.", TEAL, MINT))
story.append(p("A small code-level view", "SubSection"))
story.append(p("These are short, simplified excerpts from the actual project. Use them to explain where each technology appears; you do not need to memorise every line.", "Body"))
story.append(p("1) React starts the client and shares app state", "SubSection"))
story.append(Preformatted(
    "createRoot(document.getElementById('root')).render(\n"
    "  <BrowserRouter>\n"
    "    <AuthProvider>\n"
    "      <CartProvider><App /></CartProvider>\n"
    "    </AuthProvider>\n"
    "  </BrowserRouter>\n"
    ");",
    styles["GuideCode"]
))
story.append(p("In simple words: main.jsx starts React, BrowserRouter enables page URLs, and the two Context providers make the signed-in user and cart available to many pages.", "Small"))
story.append(p("2) Axios gives every page one backend connection", "SubSection"))
story.append(Preformatted(
    "const api = axios.create({\n"
    "  baseURL: import.meta.env.VITE_API_BASE_URL ||\n"
    "    'http://localhost:5000/api',\n"
    "  withCredentials: true\n"
    "});",
    styles["GuideCode"]
))
story.append(p("In simple words: instead of writing a different connection in every page, api.js keeps the base URL and credentials in one place. Methods such as catalogApi and orderApi then reuse this client.", "Small"))

# Frontend detail
story.append(p("5. Frontend stack in simple language", "Section"))
frontend_items = [
    ("React", "React lets me build the interface from reusable components. For example, the same BookCard idea can be reused in the full books list, homepage sections, wishlist, and search results. This reduces repeated UI code and makes changes easier."),
    ("Vite", "Vite gives a fast development server and creates the production client bundle. It is useful because I can see UI changes quickly while developing, then build an optimised set of browser files for deployment."),
    ("React Router", "React Router maps URLs to pages such as /books, /books/:slugOrId, /cart, /digital-library, and /admin. The user can move between page-like views without the browser reloading the entire app."),
    ("Axios", "Axios is the HTTP client used in client/src/services/api.js. The project creates one API instance with the backend base URL, cookies enabled, and common error handling. Feature groups such as catalogApi, orderApi, rentalApi, digitalAccessApi, and adminApi keep requests organised."),
    ("React Context", "AuthContext keeps the current user and sign-in actions available across pages. CartContext keeps selected cart items and cart actions available across the shopping flow. This is enough for the current scope. Redux Toolkit is present in package.json, but the current source does not use Redux Provider, slices, or selectors."),
    ("Tailwind tooling and custom CSS", "The Vite configuration includes Tailwind tooling, while the visible BookHub theme is also defined through custom CSS variables and classes in client/src/index.css. This combination gives fast utility support plus precise control over the warm off-white, teal, and coral visual design."),
    ("Lucide React", "Lucide provides consistent icons for search, heart, notifications, cart, books, and admin actions. Reusing icon components keeps the interface clearer than using unrelated image icons."),
]
for title, text in frontend_items:
    story.append(p(title, "SubSection"))
    story.append(p(text, "Body"))
story.append(p("React routing in this project", "SubSection"))
story.append(Preformatted(
    "<Routes>\n"
    "  <Route path=\"/books\" element={<BooksPage />} />\n"
    "  <Route path=\"/books/:slugOrId\" element={<BookDetailPage />} />\n"
    "  <Route path=\"/admin\" element={<AdminPage />} />\n"
    "</Routes>",
    styles["GuideCode"]
))
story.append(p("This is why a customer can open Books, a specific book, or the admin page by URL. App.jsx is the map between the address and the React screen.", "Small"))
story.append(p("Search logic in easy language", "SubSection"))
story.append(Preformatted(
    "const [query, setQuery] = useState('');\n"
    "const visibleBooks = books.filter(book =>\n"
    "  !query || `${book.title} ${book.author}`\n"
    "    .toLowerCase().includes(query.toLowerCase())\n"
    ");",
    styles["GuideCode"]
))
story.append(p("The real project requests catalog data through the API; this small example shows the rule: compare the typed text with title and author, and when query is empty, keep every book visible.", "Small"))

# Backend detail
story.append(p("6. Backend, database, and security", "Section"))
backend_items = [
    ("Node.js", "Node.js runs JavaScript outside the browser. It is used to run the BookHub API server and scheduled rental jobs."),
    ("Express", "Express provides routes and middleware. A request enters through app.js, passes security and parsing middleware, then reaches a route, controller, service, and model operation."),
    ("MongoDB", "MongoDB is the document database. It suits a growing catalog and operational records because documents can contain nested data and references, while the project still keeps clear domain boundaries."),
    ("Mongoose", "Mongoose defines models such as User, Book, BookCopy, Order, Rental, Review, and Notification. It adds schema rules, references, indexes, and a safer way to query MongoDB."),
    ("JWT and cookies", "After login, the server signs a JSON Web Token. The client sends it through the configured authentication flow, and middleware checks it before protected work. Cookies are enabled for the request layer."),
    ("bcryptjs", "Passwords are never stored as plain text. bcryptjs creates a one-way hash and compares a login password with the stored hash."),
    ("Zod and validation", "Validation checks request data before business logic runs. This stops incomplete or wrongly typed values from travelling deeper into the system."),
    ("Helmet, CORS, and rate limiting", "Helmet adds safer HTTP headers, CORS limits which browser origins may call the API, and the rate limiter reduces repeated abusive requests."),
    ("Morgan and central error handling", "Morgan records request information for debugging. The notFound and errorHandler middleware provide one consistent way to respond to failures instead of exposing stack traces."),
]
for title, text in backend_items:
    story.append(p(title, "SubSection"))
    story.append(p(text, "Body"))
story.append(p("Express middleware and API mounting", "SubSection"))
story.append(Preformatted(
    "app.use(helmet());\n"
    "app.use(cors({ origin: config.clientUrl, credentials: true }));\n"
    "app.use(express.json());\n"
    "app.use('/api', apiRouter);\n"
    "app.use(notFound);\n"
    "app.use(errorHandler);",
    styles["GuideCode"]
))
story.append(p("In simple words: every request first passes safety and parsing middleware. Then /api routes handle the feature. If a route is missing or fails, the final handlers return a consistent response.", "Small"))
story.append(p("Role protection", "SubSection"))
story.append(Preformatted(
    "function authorize(...roles) {\n"
    "  if (!roles.includes(req.user.role)) {\n"
    "    throw new AppError('Forbidden', 403);\n"
    "  }\n"
    "  next();\n"
    "}",
    styles["GuideCode"]
))
story.append(p("This is the difference between authentication and authorization: authentication identifies the user; authorize checks whether that user's role may perform the action.", "Small"))
story.append(p("Mongoose model idea", "SubSection"))
story.append(Preformatted(
    "const bookSchema = new Schema({\n"
    "  title: { type: String, required: true },\n"
    "  author: { type: ObjectId, ref: 'Author' },\n"
    "  category: { type: ObjectId, ref: 'Category' }\n"
    "});",
    styles["GuideCode"]
))
story.append(p("The schema gives MongoDB records a predictable shape. References let a book point to its author and category while keeping those entities reusable.", "Small"))
story.append(callout("Why not use a live payment gateway here?", "The project intentionally uses a demo payment record so the full order workflow can be demonstrated without handling real money. In a production version, a provider such as Razorpay or Stripe would be added with webhook verification and stronger operational controls.", CORAL, colors.HexColor("#FFF1EA")))
story.append(PageBreak())

# Request flow and files
story.append(p("7. How one request moves through BookHub", "Section"))
story += bullets([
    "The user clicks a button in a React page.",
    "The page calls a named method from client/src/services/api.js.",
    "Axios sends an HTTPS-style JSON request to the Express API.",
    "Express middleware parses the request, applies security checks, and authenticates the user when required.",
    "The route calls a controller and service. The service applies the business rule, such as checking availability or rental expiry.",
    "Mongoose reads or updates MongoDB documents.",
    "The server returns a JSON response. React updates the page and shows a success or error message.",
])
story.append(Preformatted(
    "React page -> Axios API client -> Express route -> middleware -> controller/service -> Mongoose -> MongoDB\n"
    "                                                             <- JSON response <-",
    styles["GuideCode"]
))
story.append(p("8. Project file arrangement", "Section"))
story.append(p("Use this explanation if the teacher asks, 'Where is each part of your project stored?'</p>", "Body"))
tree = """Book Store/
  client/
    src/main.jsx                 Starts React, Router, AuthProvider, CartProvider
    src/App.jsx                  All main URL routes and page protection
    src/layouts/AppLayout.jsx   Shared navigation and page shell
    src/context/AuthContext.jsx Signed-in user and auth actions
    src/context/CartContext.jsx Shopping cart state and actions
    src/services/api.js         Axios client and feature API methods
    src/pages/                   Home, Books, BookDetail, Cart, Rentals, DigitalLibrary,
                                Profile, Wishlist, Notifications, Payments, Admin, Login
    src/components/              Reusable cards, buttons, form, and UI pieces
    src/index.css                BookHub theme, layout, responsive styling
    vite.config.js               Vite, React, and Tailwind tooling
  server/
    server.js                    Database connection, API start, scheduled jobs
    app.js                       Express app, security middleware, API mounting
    config/                      Environment and database settings
    routes/                      URL endpoints grouped by feature
    controllers/                 Request-level orchestration
    services/                    Business rules and workflows
    models/                      Mongoose data models
    validators/                  Request validation schemas
    middleware/                  Auth, role checks, errors, rate limits
    utils/                       Shared helpers and responses
    scripts/                     Setup, seed, and maintenance scripts
  docs/
    architecture.md             Component boundaries and request flow
    database-design.md          Entities, fields, keys, and relationships
    deployment.md                Environment and deployment guidance
  scripts/                       Smoke, production, and project checks"""
story.append(Preformatted(tree, styles["GuideCode"]))
story.append(PageBreak())

# Data model and modules
story.append(p("9. Database design you can explain", "Section"))
story.append(p("The key design decision is separating title information from physical copy information. One Book can have many BookCopy records. A copy has its own condition, availability, copy code, and exact shelf location. That is why the system can say 'this title has five copies, two available, and one on Rack A4, Shelf 3' instead of treating all copies as one object.", "Body"))
story += bullets([
    "User: account, role, and status.",
    "Book, Author, Category, Publisher: title-level catalog information.",
    "BookCopy: a specific physical copy that can be available, rented, or unavailable.",
    "Location: branch, floor, section, rack, and shelf hierarchy.",
    "Cart and Order: selected items and the order created from them.",
    "Rental and Reservation: physical rental periods, returns, queues, and status.",
    "Review and Wishlist: customer engagement linked to a user and a book.",
    "Notification and Payment: user-facing events and demo payment records.",
    "Settings and AuditLog: configuration and traceability for important actions.",
])
story.append(p("10. Main modules", "Section"))
modules = [
    ("Catalog and search", "Books, sections, covers, formats, filters, sorting, and title/author matching."),
    ("Authentication and roles", "Register, sign in, active accounts, JWT authentication, and role-based permissions."),
    ("Shopping and demo checkout", "Cart, purchase or rental line items, order summary, and demo payment history."),
    ("Physical rental", "Copy availability, rental dates, returns, overdue status, and staff operations."),
    ("Digital library", "Digital rental access with an active and unexpired check before opening."),
    ("Inventory and shelf locations", "Branches, floors, sections, racks, shelves, copy codes, and conditions."),
    ("Engagement", "Reviews, wishlist, reservations, and customer notifications."),
    ("Admin portal", "Dashboard metrics, books, customers, orders, rentals, digital records, and inventory."),
]
for title, text in modules:
    story.append(p(title, "SubSection"))
    story.append(p(text, "Body"))
story.append(PageBreak())

# Challenges
story.append(p("11. Challenges and how I solved them", "Section"))
challenges = [
    ("Search should feel natural", "The challenge was returning useful results when a customer types a word or even one letter, and restoring the full list after clearing the search. I handled this by keeping the search term in the page state, sending it to the catalog query, and treating an empty term as 'show the complete catalog'.", "Say: 'Search is a filter, not a separate database. When the input changes I request the matching catalog; when it becomes empty I remove the filter and load all books again.'"),
    ("A title is not the same as a copy", "One title may have many physical copies. I kept Book for shared metadata and BookCopy for copy-level stock, condition, and location. This prevents a rental of one copy from making every copy unavailable.", "Say: 'This separation is important for real inventory accuracy.'"),
    ("Orders, rentals, and notifications must agree", "An order can lead to a payment record, a physical rental, a digital access record, and notifications. The services update these records in a predictable workflow, while the server also runs scheduled checks for overdue rentals and expiring digital access.", "Say: 'The workflow is connected, so the customer and owner see the same status.'"),
    ("Digital access must expire", "A digital rental is not permanently open. The backend checks that the rental is active and that its expiry date has not passed before returning reader access. This is safer than placing a permanent PDF link in the browser.", "Say: 'The backend is the final authority for access.'"),
    ("Covers and PDF links can fail", "External image and PDF URLs can be slow or unavailable. The UI shows an availability message, supports missing covers with a fallback, and the production architecture should move assets to reliable storage or a CDN. I should verify every source URL before using it.", "Say: 'A good interface must handle a missing asset without breaking the whole book card.'"),
    ("Different roles need different powers", "Customer actions and staff actions are separated with JWT authentication and role checks. Inventory staff can use protected inventory and rental APIs; manager and owner accounts can open the visible admin portal.", "Say: 'Authorization is checked on the server, not only hidden in the UI.'"),
]
for title, body, spoken in challenges:
    story.append(p(title, "SubSection"))
    story.append(p(body, "Body"))
    story.append(p("Classroom wording: " + spoken, "Small"))
story.append(PageBreak())

# Testing and security
story.append(p("12. Testing, validation, and security", "Section"))
story.append(p("The project includes documented checks rather than invented pass percentages. Present this slide honestly: explain what each check is meant to catch and say that exact results should be shown only if you ran them in front of the teacher.", "Body"))
story += bullets([
    "Backend smoke test: checks core API areas such as authentication, catalog, inventory, orders, rentals, and notifications.",
    "Frontend lint: checks client code for known style and correctness problems.",
    "Production build: verifies that Vite can bundle the client for deployment.",
    "Project check scripts: combine the main repository checks.",
    "Production check: validates the readiness configuration described by the project.",
])
story.append(p("Security points to mention", "SubSection"))
story += bullets([
    "Passwords are hashed with bcryptjs, so plain passwords are not stored.",
    "JWT authentication and server-side role checks protect private endpoints.",
    "Zod validation checks request fields before database operations.",
    "Helmet, CORS, and rate limiting provide baseline API protection.",
    "Central error handling avoids returning internal stack details to customers.",
    "Production digital PDFs should use private storage and short-lived signed URLs.",
])
story.append(callout("If asked about a limitation", "This is an academic and demonstration project. The payment workflow is demo-only, and production deployment would need managed private file storage, stronger observability, automated end-to-end tests, and a real payment provider.", CORAL, colors.HexColor("#FFF1EA")))
story.append(PageBreak())

# Viva questions
story.append(p("13. Likely teacher questions and easy answers", "Section"))
qa = [
    ("Why did you choose BookHub as the problem?", "A bookstore must coordinate catalog, copies, shelves, orders, rentals, and customer communication. BookHub puts those related tasks into one workflow instead of separate manual records."),
    ("Why did you choose React?", "React provides reusable components and quick updates. Book cards, forms, navigation, and status areas can be reused across pages."),
    ("Why did you choose Vite?", "Vite gives fast development feedback and creates a clean production bundle. That keeps the frontend workflow simple and quick."),
    ("Why Node.js and Express together?", "They let me write the API in JavaScript, the same language used by the client. Express gives clear routing and middleware without forcing a large framework."),
    ("Why MongoDB instead of a relational database?", "The catalog contains flexible document data and the project is still evolving. MongoDB stores documents naturally, while Mongoose gives schema rules and references where structure is important."),
    ("Why use Mongoose?", "Mongoose gives model definitions, validation, relationships, and a consistent query layer over MongoDB."),
    ("Why use JWT?", "JWT gives the API a verifiable way to recognise a signed-in user on protected requests. The server still checks that the account is active and the role is allowed."),
    ("Why bcryptjs?", "It hashes passwords one way. If the database is exposed, the stored value is not the original password."),
    ("Why Axios?", "It centralises the API base URL, credentials, response handling, and feature-specific calls in one service file."),
    ("Why React Router?", "It maps application URLs to page components and lets the user navigate without a full browser reload."),
    ("Are you using Redux?", "Redux Toolkit is installed as a dependency, but the current source uses React Context for auth and cart state. I did not claim active Redux usage in the presentation."),
    ("Why separate Book and BookCopy?", "Book is shared title data. BookCopy is one physical item with its own code, condition, availability, and shelf. This makes stock and rentals accurate."),
    ("What does Reserve do?", "Reserve places a customer in a queue for a book that may not currently be available. When stock becomes available, the reservation can be processed according to its status and priority."),
    ("How does digital access expire?", "The backend checks the rental status and expiry time whenever the customer opens the digital item. An expired rental is rejected even if an old page is still open."),
    ("Is the payment gateway live?", "No. The project records a demo payment so the order workflow can be demonstrated safely. A real provider would require webhook verification and production secrets."),
    ("How are roles enforced?", "The server authenticates the JWT and then checks the user's role in authorize middleware. The client also hides pages, but the server is the real security boundary."),
    ("How does search work?", "The browser keeps the typed term and requests catalog results that match title or author. Clearing the term removes the filter and restores the complete list."),
    ("How do you handle an overdue rental?", "Rental records contain dates and status. Scheduled server jobs mark overdue rentals and can create notifications for the customer or staff."),
    ("How are reviews controlled?", "A review is linked to a user and book, and the design supports eligibility after a purchase or rental plus a unique user-book review rule."),
    ("How are PDF files protected?", "The backend checks active, unexpired access before opening. For production, private storage and short-lived signed URLs are the safer approach."),
    ("What tests did you perform?", "The repository includes a backend smoke test, lint checks, a Vite production build, project checks, and a production readiness check. I should show the actual command output instead of inventing percentages."),
    ("What is the biggest limitation?", "The current payment flow is a demo, and production would need managed private storage for covers/PDFs, stronger end-to-end testing, and deployment monitoring."),
    ("How would you scale to more branches?", "The Location hierarchy already models branch, floor, section, rack, and shelf. I would add branch-aware queries, stock transfer workflows, and reporting per branch."),
    ("How are notifications created?", "Business events such as an order, rental, overdue item, or expiring digital access create notification records. The customer or owner sees them through the notification page."),
    ("What happens if an image URL fails?", "The card should use a fallback visual and still show title and metadata. In production I would store images on reliable object storage or a CDN and verify URLs during administration."),
    ("What is the difference between authentication and authorization?", "Authentication answers 'who are you?' after sign-in. Authorization answers 'what are you allowed to do?' using the role and server-side permission checks."),
]
for question, answer in qa:
    story.append(qna(question, answer))

# Future and closing
story.append(p("14. Future improvements", "Section"))
story.append(p("Label these as proposed improvements, not completed features.", "Body"))
story += bullets([
    "High: connect a real payment provider with verified webhooks and secure secret management.",
    "High: move covers and PDFs to private object storage with short-lived signed URLs and a CDN for covers.",
    "High: add automated browser tests for login, search, cart, checkout, rental return, and PDF access.",
    "Medium: add branch-to-branch stock transfer and richer manager reports.",
    "Medium: add email or SMS notifications for order confirmation and due dates.",
    "Medium: improve accessibility with keyboard navigation, labels, focus states, and screen-reader checks.",
    "Low: add recommendations based on categories, wishlist activity, and previous rentals.",
])
story.append(p("15. Closing speech", "Section"))
story.append(callout("Closing speech", "To conclude, BookHub solves a practical bookstore problem by connecting customers, inventory, rentals, digital access, and administration in one system. Its main design strength is the separation between title data and copy-level inventory, supported by role-based API security. The current version is a working academic demonstration, and its next step would be production integrations such as a real payment provider, private file storage, automated end-to-end testing, and deployment monitoring. Thank you. I am happy to answer questions.", TEAL, MINT))
story.append(p("16. Quick glossary", "Section"))
glossary = [
    ("API", "A set of URLs through which the client asks the server to read or change data."),
    ("Component", "A reusable piece of a React interface."),
    ("Middleware", "Code that runs between the incoming request and the final route handler."),
    ("Schema", "The expected shape and rules for stored data."),
    ("JWT", "A signed token used to identify a logged-in user."),
    ("Hash", "A one-way transformed value used here to protect passwords."),
    ("CRUD", "Create, read, update, and delete operations."),
    ("Signed URL", "A temporary URL that grants limited access to a private file."),
    ("Rate limiting", "A rule that restricts how many requests can arrive in a time window."),
]
for term, meaning in glossary:
    story.append(p(f"<b>{escape(term)}</b>: {escape(meaning)}", "Body"))
story.append(Spacer(1, 6))
story.append(p("17. Last-minute practice plan", "Section"))
story += bullets([
    "First 30 seconds: say the project name, the bookstore problem, and the one-sentence solution.",
    "Next 60 seconds: show search, a book detail, cart, and one customer status page.",
    "Next 60 seconds: show the admin dashboard and explain roles, inventory copies, and shelf locations.",
    "Final 30 seconds: explain the stack, one challenge you solved, one limitation, and the next improvement.",
    "If interrupted by a question, answer the exact question first, then return to the planned flow.",
])
story.append(callout("Final revision checklist", "Practise the opening twice, demonstrate one customer flow, demonstrate one admin flow, explain the Book versus BookCopy decision, and remember the honest limitation: payments are demo-only. Keep answers short first, then add detail if the teacher asks a follow-up.", CORAL, colors.HexColor("#FFF1EA")))

doc.build(story)
print(OUT)
