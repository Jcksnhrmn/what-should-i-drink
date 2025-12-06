# 🍸 What Should I Drink?
A full-stack AI-powered cocktail generator where users can create custom drinks, view detailed recipe pages, leave comments, like drinks, and compete on a global leaderboard.
(I made a script because i couldnt afford the openai subscription sorry but the website doesnt behave differently)

Live Site: **https://what-should-i-drink-30lvoi0cb-jcksnhrmns-projects.vercel.app/**

---

## 🚀 Features

### 🔮 **AI Drink Generator**
- Generates a unique cocktail name, description, ingredients, and steps.
- Each generated drink is stored in the database.
- Automatically redirects to a dedicated drink detail page.

### 📄 **Drink Detail Pages**
Each drink gets its own dynamic route:

Pages include:
- Drink name & description  
- Ingredients list  
- Step-by-step instructions  
- Likes  
- Comments (with author names)  

---

### 🏆 **Leaderboard**
Users appear on the leaderboard based on:
- Total drinks generated
- Total likes received on their drinks

---

### 🔐 **User Authentication**
Includes:
- Register  
- Login  
- Logout  
- Persistent sessions using HTTP-only cookies  
- Password hashing with bcrypt  

---

### 🗃 **Tech Stack**
**Frontend:**
- Next.js 16 (App Router + Server Actions)
- React
- Turbopack
- Custom CSS theme (gold-on-black luxury design)

**Backend:**
- Prisma ORM
- PostgreSQL (Vercel Postgres or local)

**AI:**
- OpenAI API (uses `sk-proj-*` model keys)

**Deployment:**
- Vercel (includes Prisma Client auto-generation)

---

## ⚙️ Environment Variables

Create a `.env` file with:

DATABASE_URL="your postgres url"
OPENAI_API_KEY="sk-proj-..."
JWT_SECRET="your-secret"


For Vercel, set these in the Dashboard under **Project → Settings → Environment Variables**.

---

## 🧑‍💻 Running Locally

Install dependencies:

```bash
npm install
npx prisma generate
npm run dev
Local site:
http://localhost:3000

Deployment on Vercel

This project includes a fix required by Prisma:

package.json

"build": "prisma generate && next build"


To deploy:

vercel --prod


Vercel will:

Install dependencies

Generate Prisma Client

Build and deploy the Next.js 

Folder Structure
app/
  api/
    auth/
    drinks/
    comments/
    likes/
  drink/
    [id]/
      page.js        # Drink detail page

lib/
  prisma.js         # Prisma client
  auth.js           # JWT helpers

prisma/
  schema.prisma     # Database models
