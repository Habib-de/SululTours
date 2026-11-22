<div align="center">

# ✈️ Sulul Tours

**A full-stack travel & tours management platform — car hire, tours, Hajj & Umra, hotels, flights and visa processing, with M-Pesa payments, role-based back office and a pluggable ML decision engine.**

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)
![Java](https://img.shields.io/badge/Java_8-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)

</div>

---

## About

Sulul Tours is a multi-tenant travel management platform built for a travel agency. It unifies six services — **car hire, tour packages, Hajj & Umra, hotels, flights and visa processing** — behind a single role-based back office. Clients book online (guest or registered), pay with M-Pesa, and track their bookings; fleet managers, car owners and brokers each get a scoped view of the same data.

## Highlights

- 🚗 **Multi-service bookings** — car hire, tours, Hajj & Umra, hotels, flights, all with one booking engine
- 💳 **M-Pesa STK Push** — authenticated and public (guest) payment flows, partial payments and callback reconciliation
- 👥 **Six roles** — Super Admin, Fleet Manager, Car Owner, Broker, Client, Guest
- 🧑‍💼 **Broker attribution** — bookings created by brokers are force-attributed server-side, with per-broker dashboards
- 📅 **Vehicle availability** — conflict-safe booking checks; guests can check availability without logging in
- 🗂️ **Compliance & maintenance** — vehicle documents, expiry tracking and maintenance records
- 💸 **Expenses** — per-vehicle, per-owner, per-category reporting
- 🔔 **Notifications & web push** — per-user feed with unread counts and broadcast
- 🛡️ **Audit log** — every login, logout and admin action recorded
- 🤖 **ML-ready** — the backend exposes a pluggable ML decision endpoint (see AMIR / ManPower sibling project for the orchestrator)

## Tech Stack

| Layer | Tools |
|---|---|
| Frontend | React, React Router, Tailwind CSS, Lucide icons, Context API |
| Backend | Java 8, Spring Boot, Spring Security (JWT), Spring Data JPA, Bean Validation |
| Database | MySQL |
| Integrations | M-Pesa Daraja, Web Push |
| Docs | Swagger / OpenAPI |

# Getting Started

### Backend

cd backend:
- mvn spring-boot:run

cd frontend:
- npm install
- npm run dev

## Author
**Ahmed Abib** · [Portfolio](https://abib-ahmed-portfolio.onrender.com) · [LinkedIn](https://www.linkedin.com/in/ahmed-abib-5b37a5184)
