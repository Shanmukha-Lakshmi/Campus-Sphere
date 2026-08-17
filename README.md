# 🎓 Campusphere — Centralized College Information & Event Management System

[![Framework](https://img.shields.io/badge/Frontend-React_18_%7C_TypeScript_%7C_Vite-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![Styling](https://img.shields.io/badge/Styling-Tailwind_CSS_%7C_shadcn/ui-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Backend](https://img.shields.io/badge/Backend-Firebase_Auth_%7C_Firestore-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Campusphere** is a state-of-the-art, real-time centralized campus management platform engineered to streamline institutional communication, academic circular distribution, club event organization, and faculty webinar scheduling into a single, intuitive hub.

---

## 🚀 Key Highlights & Solved Problems

Traditional educational institutions suffer from fragmented communication across WhatsApp groups, physical notice boards, scattered emails, and external form links. This leads to missed deadlines, low event participation, and administrative opacity.

**Campusphere** solves this by providing:
* 📢 **Centralized Announcement Distribution**: Instant access to department-level and campus-wide circulars.
* 🎟️ **Seamless Event Registration**: One-click registration for student club events with participant limits.
* 📹 **Faculty Webinar Portal**: Schedule and join interactive webinars with direct meeting links.
* 📅 **1-Click Google Calendar Sync**: Export scheduled events and webinars directly to Google Calendar.
* 🔒 **Institutional Security**: Access control restricted strictly to verified institutional email domains (`@svecw.edu.in`).

---

## 👥 Role-Based Access Control (RBAC) Architecture

Campusphere enforces strict domain validation and role-based permissions stored securely in Firestore user documents:

| Role | Access Permissions |
| :--- | :--- |
| **🎓 Student** | Browse circulars, view club events, attend webinars, register for events/webinars, receive real-time notifications, add items to Google Calendar. |
| **👩‍🏫 Faculty** | All Student permissions + Create, edit, and delete official academic circulars and schedule webinars. |
| **🎯 Club Member** | All Student permissions + Publish and manage club events, monitor participant signups, and export attendee lists. |
| **⚡ Administrator** | Full platform control: Content moderation, user management, and system-wide analytics overview. |

---

## 🛠 Tech Stack & Architecture

### **Frontend Interface**
* **Core Framework**: React 18 with TypeScript for type-safe UI logic.
* **Build Tooling**: Vite for fast bundling and hot module replacement (HMR).
* **Routing**: React Router v6.
* **UI Components & Icons**: shadcn/ui built on Radix UI primitives, Lucide React icons.
* **Styling**: Tailwind CSS, custom design tokens, glassmorphism card styling, responsive layouts.
* **Data Visualization**: Recharts for interactive analytics dashboard rendering.

### **Backend Infrastructure & Database**
* **Authentication**: Firebase Auth with Google OAuth Sign-In & Email/Password validation.
* **Database**: Firebase Firestore NoSQL real-time database with real-time snapshots (`onSnapshot`).
* **Cloud Storage**: Firebase Storage for circular documents and banner image uploads.
* **Hosting**: Firebase Hosting.

---

## 💻 System Capabilities & Key Features

### 1. 📋 Real-Time Circulars Engine
* Categorized by department (CSE, ECE, EEE, IT, ME, General) and circular type (Academic, Examinations, Placements, Sports).
* Instant search and filtering.
* Image and attachment attachment previews.

### 2. 🎪 Club Events & Webinar Scheduler
* Real-time seat availability calculation (`max_participants` vs. `registered_users`).
* Automatic registration button state management (Registered / Capacity Full / Cancel Registration).
* Seamless integration with external virtual meeting tools (Google Meet, Zoom, MS Teams).

### 3. 🔔 Notification System & Calendar Sync
* Real-time unread notification badge counter.
* Automated notification triggers when new circulars, events, or webinars are posted.
* Direct URL generation for Google Calendar event addition (`generateGoogleCalendarLink`).

### 4. 📊 Analytics Dashboard
* Graphical visualization of user engagement, circular posting trends, and event registration distributions over time.

---

## 📦 Project Structure

```
campus-connect-hub-95/
├── public/                    # Static assets & public icons
├── src/
│   ├── components/            # Reusable UI & feature components
│   │   ├── dashboard/         # Dashboard dialogs, dropdowns & analytics
│   │   └── ui/                # Radix UI / shadcn design system primitives
│   ├── hooks/                 # Custom React hooks (RBAC, Notifications, Analytics)
│   ├── lib/                   # Firebase initialization & helper utilities
│   ├── pages/                 # Main route pages (Index, Auth, Dashboard, NotFound)
│   ├── App.tsx                # App routing & context providers
│   └── main.tsx               # Entry point
├── .env.example               # Environment variables configuration template
├── firebase.json              # Firebase Hosting configuration
├── package.json               # Node dependencies and scripts
├── tailwind.config.ts         # Custom Tailwind CSS theme configuration
└── vite.config.ts             # Vite build configuration
```

---

## ⚡ Getting Started & Local Setup

### **Prerequisites**
* [Node.js](https://nodejs.org/) (v18.x or higher)
* `npm` or `bun` package manager

### **Installation Steps**

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/Shanmukha-Lakshmi/camp1.git
   cd camp1
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory by copying the sample file:
   ```bash
   cp .env.example .env
   ```
   Fill in your Firebase project credentials in `.env`:
   ```env
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

4. **Run Local Development Server:**
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:8080` (or the port specified in terminal).

5. **Build for Production:**
   ```bash
   npm run build
   ```

---

## 🔒 Security & Best Practices

* **Domain Restriction**: Prevents unauthorized sign-ups by checking institutional domain constraints (`@svecw.edu.in`).
* **Environment Protection**: Secrets and private keys are ignored via `.gitignore` and managed using standard `.env` configuration files.
* **Type Safety**: End-to-end TypeScript types for Firestore models (`Circular`, `Event`, `Webinar`).

---

## 📜 License

This project is open-source and available under the [MIT License](LICENSE).
