# Campus Lost and Found Portal

A responsive full-stack web application built with HTML5, CSS3, vanilla JavaScript, Node.js, Express and MongoDB.

## Features
- Student registration, login and protected API access (JWT).
- Report lost/found items with optional JPG/PNG/WEBP photo upload.
- Browse, keyword search, category/location/type filters and date sorting.
- Submit claims; item owners can approve/reject them.
- Student dashboard for own reports, submitted claims and received claims.
- Admin dashboard with statistics, item status management and all claims.
- Ten sample records, Postman collection and API validation.
- Security basics: bcrypt password hashing, Helmet, API rate limiting, input validation and role checks.

## Requirements
- Node.js 18 or newer
- MongoDB Community Server running locally, or a MongoDB Atlas connection string
- npm

## Setup (Windows PowerShell)
1. Extract this ZIP.
2. Open the extracted `Campus-Lost-and-Found-Portal` folder in VS Code.
3. Open Terminal in that folder and run:
   ```powershell
   npm install
   Copy-Item .env.example .env
   notepad .env
   ```
4. For local MongoDB, keep:
   ```env
   MONGODB_URI=mongodb://127.0.0.1:27017/campus_lost_found
   ```
   If using MongoDB Atlas, replace it with your Atlas connection string. URL-encode special characters in the database password.
5. Change `JWT_SECRET` to a long random value. For a local demo, the sample admin credentials are configured in `.env`; change the password before sharing or deploying.
6. Create the admin and insert the 10 sample records:
   ```powershell
   npm run create-admin
   npm run seed
   ```
7. Start the application:
   ```powershell
   npm start
   ```
8. Open **http://localhost:5000** in your browser. Do not open the HTML file directly.

## Demo accounts
- Admin: `admin@campus.edu` / `ChangeMe123!` (unless changed in `.env`)
- Sample student: `sample.student@campus.edu` / `Student123!`

Change demo passwords before deployment. The sample student account is created by `npm run seed`.

## Folder structure
```text
Campus-Lost-and-Found-Portal/
├── config/db.js
├── middleware/auth.js
├── models/{User,Item,Claim}.js
├── routes/{auth,items,claims,admin}.js
├── public/
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── report.html
│   ├── dashboard.html
│   ├── admin.html
│   ├── app.js
│   └── style.css
├── uploads/
├── postman/Campus-Lost-and-Found.postman_collection.json
├── .env.example
├── create-admin.js
├── seed.js
└── server.js
```

## REST API overview
| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register student |
| POST | `/api/auth/login` | Public | Login |
| GET | `/api/auth/me` | Student/Admin | Current user |
| GET | `/api/items` | Public | Search/filter reports |
| GET | `/api/items/:id` | Public | Get one report |
| POST | `/api/items` | Student/Admin | Create report (multipart form) |
| GET | `/api/items/mine` | Student/Admin | Own reports |
| PATCH | `/api/items/:id` | Owner/Admin | Update report |
| DELETE | `/api/items/:id` | Owner/Admin | Delete report |
| POST | `/api/claims` | Student/Admin | Submit claim |
| GET | `/api/claims/mine` | Student/Admin | My claims |
| GET | `/api/claims/received` | Student/Admin | Claims on my reports |
| PATCH | `/api/claims/:id/status` | Owner/Admin | Approve/reject claim |
| GET | `/api/admin/stats` | Admin | Dashboard statistics |
| GET | `/api/admin/items` | Admin | All reports |
| PATCH | `/api/admin/items/:id/status` | Admin | Change item status |
| DELETE | `/api/admin/items/:id` | Admin | Delete report |
| GET | `/api/claims/all` | Admin | All claims |

For protected endpoints add `Authorization: Bearer YOUR_TOKEN`.

## Postman testing
Import `postman/Campus-Lost-and-Found.postman_collection.json`. Run the requests in order:
1. Health check
2. Register student (stores token)
3. Login (stores token)
4. Get all items
5. Get one item (replace `itemId` after reading the list)
6. Create item
7. Update item (replace `itemId`)
8. Submit claim (use another account and a valid `itemId`)
9. Get my claims
10. Unauthorized request (remove token and verify HTTP 401)
11. Admin login and admin stats

The collection includes tests for status codes and saves login tokens to collection variables. Set `itemId` and `claimId` variables using IDs returned by the API.

## Additional feature
The application implements **date sorting** (`newest` and `oldest`) as an additional feature. It is available in the home-page sort filter and `GET /api/items?sort=newest|oldest`.

## GitHub
```powershell
git init
git add .
git commit -m "Initial commit - Campus Lost and Found Portal"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git push -u origin main
```
Before committing, ensure `.env` is ignored and never push real database credentials or secrets.

## Deployment notes
Deploy to an instructor-approved Node hosting provider and use MongoDB Atlas or an approved persistent MongoDB service. Configure `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CLIENT_ORIGIN`, and `PORT` in the host's environment settings. Persistent uploads require a persistent disk or cloud object storage; local ephemeral host storage may erase uploaded photos on redeploy.

## Important academic note
This is a starter implementation for your individual project. Run it, test every flow, customize the UI and code, take your own screenshots, and be ready to explain the routes, models, middleware, JWT flow, CRUD operations and claim approval process in your viva. Disclose AI assistance as required by your university.