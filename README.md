# Campus Lost & Found Portal

Full-stack individual project starter for Sai University — Web Technology and Internet Programming (2026–27). Built with HTML5, CSS3, JavaScript, Node.js, Express and MongoDB.

## Features
- Responsive home page, recently reported items, keyword/category/location/type filters and date sorting (additional feature).
- Registration, login, JWT-protected endpoints and user/admin roles.
- Create, browse, view, update and delete lost/found listings.
- Claims with duplicate prevention, owner review, approve/reject workflow.
- User dashboard for personal listings, submitted claims and received claims.
- Admin dashboard with basic statistics and item status management.
- Ten sample records and a Postman collection with more than eight test requests.

## Folder structure
```text
campus-lost-found/
  backend/
    middleware/       authMiddleware.js, validate.js
    models/           User.js, Item.js, Claim.js
    routes/            authRoutes.js, itemRoutes.js, claimRoutes.js, adminRoutes.js
    server.js
    seed.js
    .env.example
  frontend/
    index.html
    styles.css
    app.js
  postman/
    Campus-Lost-Found.postman_collection.json
  docs/
    PROJECT_REPORT_OUTLINE.md
```

## Requirements
- Node.js 18+ and npm
- MongoDB Community Server running locally, or a MongoDB Atlas connection string
- VS Code (recommended), Postman

## Run locally
1. Start MongoDB.
2. Open a terminal in `backend` and run:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env`. Set `MONGODB_URI` and replace `JWT_SECRET` with a long random secret.
4. Seed the database:
   ```bash
   npm run seed
   ```
   Demo accounts created by the seed script:
   - Admin: `admin@campus.edu` / `Admin@123`
   - Student: `student@campus.edu` / `Student@123`
   Change these passwords before any public deployment.
5. Start the API:
   ```bash
   npm run dev
   ```
   API: `http://localhost:5000/api`; health check: `http://localhost:5000/api/health`.
6. Serve the `frontend` folder with VS Code Live Server (for example `http://127.0.0.1:5500`). The frontend defaults to API `http://localhost:5000/api`.
   If your API is hosted elsewhere, set `window.API_BASE` before `app.js` in `index.html`.

## API overview
| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register |
| POST | `/api/auth/login` | Public | Login |
| GET | `/api/auth/me` | User | Current user |
| GET | `/api/items` | Public | Search/filter listings |
| GET | `/api/items/:id` | Public | Item details |
| POST | `/api/items` | User | Create listing |
| PATCH | `/api/items/:id` | Owner/Admin | Update listing |
| DELETE | `/api/items/:id` | Owner/Admin | Delete listing |
| POST | `/api/claims` | User | Submit claim |
| GET | `/api/claims/mine` | User | My claims |
| GET | `/api/claims/received` | User | Claims on my listings |
| PATCH | `/api/claims/:id/status` | Owner/Admin | Approve/reject |
| GET | `/api/admin/stats` | Admin | Dashboard statistics |
| PATCH | `/api/admin/items/:id/status` | Admin | Change item status |

All protected requests use `Authorization: Bearer <token>`.

## Postman testing
Import `postman/Campus-Lost-Found.postman_collection.json`. Run requests in order where indicated. Login requests save tokens to collection variables. The collection includes registration/login, unauthorised access, invalid input, list/retrieve/create/update, claim submission and claim review. Use a fresh email for registration tests.

## Important before submission
- This is a working project foundation, not a substitute for your own understanding, testing, screenshots, viva preparation or prescribed university report.
- The seed script creates demo accounts and sample items only when the relevant data is absent.
- Image support currently accepts an image URL (not file upload). If your instructor expects uploading an image from the device, implement and test Multer/cloud storage.
- Add pagination, stronger rate limiting, password reset, email notifications and production logging if required by your instructor.
- Before deployment, use a managed MongoDB database, HTTPS, a strong secret, restricted CORS, secure hosting environment variables, and change demo credentials.
- Update the report with your own screenshots, GitHub URL, deployment URL, test evidence, and AI-use disclosure according to Sai University's prescribed format.
