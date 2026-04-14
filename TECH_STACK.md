# Ashoka Theatre Booking System - Tech Stack

This document outlines the technologies, frameworks, and deployment services currently powering the "All My Friends Are Cheaters" theatre booking platform.

## 🏗️ Core Technologies (The Stack)

### Frontend (Client-Side)
- **Next.js (React)**: The foundational framework driving the user interface and handling routing.
- **Vanilla CSS3**: Used exclusively for styling to maintain absolute control over the design. Features advanced modern techniques like `backdrop-filter` for glassmorphism, flexbox for the interactive seating layout, and CSS `text-shadow` for the RGB cinematic glitch effect.

### Backend (Server-Side)
- **Next.js API Routes**: Serverless functions handling the authentication bypass, seat locking, and final booking confirmations entirely within the Next.js ecosystem.
- **Node `qrcode`**: A lightweight server-side package used to instantly generate a scannable QR ticket encapsulating the booking details.

### Database Layer
- **PostgreSQL**: The relational database engine used to permanently and safely store User data, Seat statuses, and Booking logs.
- **Prisma ORM**: The Object-Relational Mapper that bridges the Next.js backend to PostgreSQL. Prisma is responsible for querying the database, atomic seat locking, and enforcing the global 2-seat booking limit across the platform.

---

## ☁️ Cloud Infrastructure & Hosting

### 1. Web Service Hosting
- **Render.com**: The Next.js application is hosted on Render's Free Tier Web Service. Render listens to the GitHub repository and automatically executes `npx prisma generate && npx prisma db push && next build` upon every new commit to sync the latest code and database schemas.

### 2. Database Hosting
- **Neon.tech**: Hosts the serverless PostgreSQL database. This was chosen specifically because Render's free native PostgreSQL databases expire after 30 days, whereas Neon natively supports persistent, free-tier relational data tailored for modern web apps.

### 3. Background Services & Cron
- **Cron-job.org**: An external, free cron service that perpetually pings the `/api/cron/release-seats` API endpoint every 5 minutes. This solves two massive problems on the free tier:
  1. It automatically hunts down any "Locked" seats that users abandoned and frees them up for other students.
  2. The recurrent ping prevents the Render Free Tier instance from "falling asleep", ensuring the website loads instantly for every Ashoka student without a 40-second cold-start delay.
