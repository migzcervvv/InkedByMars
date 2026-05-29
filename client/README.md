# InkedByMars

A modern tattoo artist portfolio and booking platform built to showcase artwork, streamline client inquiries, manage appointments, and create a premium digital experience for clients.

---

# Overview

InkedByMars is a full-stack tattoo artist website focused on:

- Professional portfolio presentation
- Booking and availability management
- Client inquiry handling
- Gallery and CSR content management
- Responsive modern UI/UX
- Admin-controlled scheduling flow
- Mobile-first image uploads
- Secure booking workflows

The platform combines a visually immersive frontend with a structured admin management system.

---

# Features

## Portfolio Showcase

- High-quality tattoo gallery
- Responsive Swiper carousels
- Categorized tattoo collections
- Animated transitions
- Lazy-loaded optimized images
- WebP image processing support

---

## Booking System

### Client Booking Flow

Clients can:

- Select preferred booking dates
- Choose desired starting time
- Upload tattoo references
- Submit design descriptions
- Place temporary booking holds

### Admin Booking Flow

Admins can:

- Receive booking email notifications
- Review pending requests
- Approve or reject holds
- Assign official booking start/end time
- Automatically block occupied slots

---

## Availability Management

- Real-time booking state tracking
- Temporary hold expiration countdown
- Slot conflict prevention
- Calendar-based booking control

---

## Image Upload System

- Camera upload support
- Gallery upload support
- Automatic WebP conversion
- File compression optimization
- Large image handling
- Preview rendering before upload

---

## Admin Dashboard

- Gallery management
- CSR management
- Booking management
- Image management
- Status control system
- Modal-based CRUD operations

---

## UI / UX

- Luxury-inspired tattoo aesthetic
- Cinematic typography
- Mobile-first responsiveness
- Smooth animations
- Flowbite React integration
- Tailwind CSS architecture

---

# Tech Stack

## Frontend

- React
- Vite
- Tailwind CSS
- Flowbite React
- Swiper.js
- Framer Motion

---

## Backend

- ASP.NET MVC / ASP.NET Core
- C#
- REST APIs

---

## Database

- Microsoft SQL Server

---

## CMS / Media

- Strapi v5

---

# Project Structure

```bash
InkedByMars/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── assets/
│   │
│   └── public/
│
├── server/
│   ├── Controllers/
│   ├── Models/
│   ├── Services/
│   ├── ViewModels/
│   └── Helpers/
│
├── cms/
│   └── strapi/
│
└── README.md
```

---

# Booking Workflow

## Step 1 — Client Request

Client:

- Selects preferred date
- Chooses desired time
- Uploads references
- Writes tattoo details
- Submits request

System:

- Places slot on temporary hold
- Starts expiration countdown
- Sends admin notification

---

## Step 2 — Admin Review

Admin:

- Reviews submission
- Checks references
- Confirms availability
- Adjusts official schedule

---

## Step 3 — Confirmation

System:

- Confirms booking
- Blocks official time slot
- Sends confirmation email
- Updates calendar availability

---

# Responsive Design

The platform is fully responsive and optimized for:

- Mobile devices
- Tablets
- Desktop displays
- Large ultra-wide screens

---

# Performance Optimizations

- Lazy image loading
- WebP conversion
- Image compression
- Component-level rendering optimization
- Optimized API requests
- Responsive asset loading

---

# Security

- Server-side validation
- Protected admin routes
- Sanitized uploads
- Rate-limited booking endpoints
- Secure authentication workflows

---

# Future Improvements

- Full calendar sync
- SMS notifications
- Stripe / GCash integration
- QRPH payment support
- Client dashboard
- Booking rescheduling
- Automated reminders
- Tattoo session tracking

---

# Environment Variables

```env
VITE_API_URL=
VITE_STRAPI_URL=

DB_CONNECTION_STRING=

SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=

JWT_SECRET=
```

---

# Installation

## Frontend

```bash
cd client
npm install
npm run dev
```

## Backend

```bash
cd server
dotnet restore
dotnet run
```

## Strapi CMS

```bash
cd cms
npm install
npm run develop
```

---

# Deployment

Recommended stack:

- Frontend: Vercel / Netlify
- Backend: IIS / Azure
- Database: SQL Server
- CMS: VPS / Railway / Render

---

# Screenshots

## Landing Page

Add screenshot here.

## Gallery

Add screenshot here.

## Booking Page

Add screenshot here.

## Admin Dashboard

Add screenshot here.

---

# License

This project is proprietary and owned by InkedByMars.

Unauthorized distribution or reproduction is prohibited.

---

# Author

Developed by Miggz Cervantes.
