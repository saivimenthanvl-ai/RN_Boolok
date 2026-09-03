# RN_Boolok — AI Real Estate Intelligence & Social Network

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Live%20Demo-black?style=for-the-badge&logo=vercel)](https://boolokgpt.vercel.app)
[![React Native](https://img.shields.io/badge/React%20Native-Expo%2054-blue?style=for-the-badge&logo=react)](https://reactnative.dev)
[![Node.js](https://img.shields.io/badge/Node.js-Express%20API-green?style=for-the-badge&logo=node.js)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-darkgreen?style=for-the-badge&logo=mongodb)](https://mongodb.com)

> **Live Production Web App**: [https://boolokgpt.vercel.app](https://boolokgpt.vercel.app)

---

## 🌟 Overview

**RN_Boolok** is a full-stack, enterprise-grade AI real estate intelligence and broker networking platform built with React Native (Expo Router) and a Node.js/Express backend connected to MongoDB Atlas.

### 🚀 Key Features

1. **AI Search Hub**:
   - Multi-category search spanning **Properties**, **Global Real Estate Laws**, and **Financial News**.
   - Verified real-time property seller cards with dynamic avatar resolution (Google OAuth picture or stylized initial letter badges).
   - Live integration with member-submitted property listings.

2. **Professional Real Estate Feed**:
   - Social broker feed with property announcements, videos, and multi-photo reels.
   - Real-time like reactions, comments drawer, and detailed social proof.
   - Dynamic real-time followers & connections synchronized directly with MongoDB Atlas.

3. **Adaptive Light & Dark Modes**:
   - **Light Mode**: Crisp, pure white screens (`#ffffff`) with clean charcoal typography and subtle borders (`#e2e8f0`).
   - **Dark Mode**: Deep navy executive dark theme (`#060b13`) with gold accents (`#e6b800` / `#daa520`).
   - Zero black-screen flashes across loading states, navigation stacks, and modals.

4. **OAuth & Profile Authentication**:
   - Google Sign-In with automated profile picture sync from Google OAuth (`googleusercontent.com`).
   - Standardized avatar fallback to styled initials letter badges for community members.

---

## 🔗 Live Deployments

- **Web Application (Vercel)**: [https://boolokgpt.vercel.app](https://boolokgpt.vercel.app)
- **GitHub Repository**: [https://github.com/saivimenthanvl-ai/RN_Boolok](https://github.com/saivimenthanvl-ai/RN_Boolok)

---

## 🛠️ Tech Stack

- **Frontend**: React Native 0.81, Expo 54, Expo Router v6, React Native Reanimated, TypeScript
- **Backend**: Node.js, Express.js, MongoDB Atlas (Mongoose ODM), JWT Authentication
- **Hosting & CI/CD**: Vercel (Web Frontend)

---

## 💻 Local Development

### 1. Backend Setup
```bash
cd backend
npm install
node server.js
```
The API server runs on `http://localhost:5000`.

### 2. Frontend Setup
```bash
cd frontend
npm install
npx expo start -c
```
- Press `w` to open in browser (Web).
- Press `a` for Android or scan the QR code in Expo Go.

---

## 📄 License
MIT © [saivimenthanvl-ai](https://github.com/saivimenthanvl-ai)
