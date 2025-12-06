# 🍹 What Should I Drink?

A full-stack Next.js application that generates **AI-created cocktails**, lets users like/dislike drinks, comment on them, and browse the global leaderboard.  
The app uses **Next.js 16 (App Router)**, **Prisma**, and a **PostgreSQL database**.

## ✨ Features

### 🔥 Drink Generator
- Generates fully unique cocktails using the OpenAI API.
- Each drink includes:
  - Name  
  - Description  
  - Ingredient list  
  - Step-by-step instructions  
- Saved automatically to the database.
- Opens on a dedicated drink page (`/drink/[id]`) for a clean viewing experience.

### 👍 Likes / Dislikes
- Users can like or dislike drinks.
- Leaderboard automatically updates.

### 💬 Comments
- Logged-in users can leave comments on any drink.

### 🏆 Leaderboard
- Ranks drinks by total score (likes - dislikes).
- Shows top users by engagement.

### 🔊 Narrator Mode
- Uses browser speech synthesis to read the drink out loud.

### 🔐 Authentication
- Email + password login/register.
- Secure HTTP-only JWT cookies.

### 🧼 No Images
- All image-related code has been removed for simplicity.
- The app is now 100% text-based.

### ❌ Removed Features
These were previously included but have been fully removed:
- Drink logging / "I drank this" button  
- User drink streaks  
- Drink images  

## 🛠 Tech Stack

- **Next.js 16 (App Router)**
- **Prisma ORM**
- **PostgreSQL**
- **OpenAI API (gpt-4.1-mini)**
- **NextAuth-style custom authentication**
- **Vercel-ready deployment**

## 🚀 Getting Started

Install dependencies:

```sh
npm install
npx prisma migrate dev
npm run dev
http://localhost:3000
DATABASE_URL="postgres://..."
OPENAI_API_KEY="sk-proj-..."
JWT_SECRET="your-secret"
app/
  page.jsx               ← Main UI
  drink/[id]/page.jsx    ← Dedicated drink page
api/
  generateDrink/route.js ← Drink generator
  drinks/route.js        ← Create drink
  drinks/[id]/route.js   ← Fetch drink
  likes/route.js         ← Like/dislike
  comments/route.js      ← Comments
  auth/...
lib/
  prisma.js
  auth.js
