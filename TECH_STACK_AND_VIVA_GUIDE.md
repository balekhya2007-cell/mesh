# 🎓 MESH Project Review & Viva Preparation Guide

> **Project Name:** MESH — AI-Powered Interdisciplinary Collaboration Platform  
> **Repository:** [github.com/balekhya2007-cell/mesh](https://github.com/balekhya2007-cell/mesh)  
> **Live Frontend:** [unimesh.netlify.app](https://unimesh.netlify.app)  
> **Live Backend:** [mesh-1at8.onrender.com](https://mesh-1at8.onrender.com)  

---

## 📌 Executive Summary (1-Minute Elevator Pitch)

> *"MESH is an AI-powered full-stack web platform designed to solve a fundamental problem in universities: students from different academic departments (Computer Science, AI & ML, Electronics, Mechanical, Civil, etc.) often have great project ideas but struggle to find collaborators with complementary skill sets.  
> MESH enables students to create project proposals, automatically extract and analyze required skill sets and team roles using AI, find and match teammates based on skill compatibility percentages, collaborate via persistent join requests, and handle consensus-driven project closures."*

---

## 🏗️ Architecture Overview

The system uses a modern **3-tier decoupled microservices-ready architecture**:

```text
 ┌─────────────────────────────────────────────────────────────┐
 │                    CLIENT TIER (Frontend)                   │
 │                React 19 + Vite + Vanilla CSS                │
 │                     Hosted on Netlify                       │
 └──────────────────────────────┬──────────────────────────────┘
                                │ HTTPS / REST (JSON)
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │                   APPLICATION TIER (Backend)                │
 │              Java 21 + Spring Boot 4 / Maven                │
 │               Docker Containerized on Render                │
 └──────────────┬───────────────────────────────┬──────────────┘
                │ JDBC / JPA                    │ HTTPS (JSON)
                ▼                               ▼
 ┌──────────────────────────────┐ ┌────────────────────────────┐
 │        DATABASE TIER         │ │         AI SERVICE         │
 │     Managed PostgreSQL       │ │    Python + FastAPI        │
 │       Hosted on Render       │ │    Google Gemini API       │
 └──────────────────────────────┘ └────────────────────────────┘
```

---

## 🛠️ Complete Tech Stack & Justifications (The "Why")

### 1. Frontend: React 19 + Vite

| Technology | Role | Why We Chose It (Viva Answer) |
| :--- | :--- | :--- |
| **React 19** | UI Library | **Component-Driven Architecture:** Enables modular, reusable UI components (e.g. project cards, request badges, modals). React's **Virtual DOM** ensures high-performance rendering as project filters, tabs, and live status dots change dynamically without full-page reloads. |
| **Vite** | Build Tool & Dev Server | **Next-Generation Speed:** Replaces legacy Webpack. Vite uses native ES Modules (ESM) in development for near-instant Hot Module Replacement (HMR) and uses Rollup for highly optimized, tree-shaken production bundles. |
| **Vanilla CSS** | Styling System | **Custom Control & Zero Overhead:** Instead of heavy utility libraries like Tailwind or UI frameworks that introduce runtime overhead and cookie-cutter designs, Vanilla CSS provided complete control over clean glassmorphism, responsive grids, color systems, and micro-animations (like the pulsing notification dot). |

---

### 2. Backend: Java 21 + Spring Boot

| Technology | Role | Why We Chose It (Viva Answer) |
| :--- | :--- | :--- |
| **Java 21 (LTS)** | Programming Language | **Type Safety & Enterprise Stability:** Java provides robust compile-time type safety, exceptional multi-threading performance, and enterprise-grade reliability for handling financial, academic, and user-centric data models. |
| **Spring Boot** | REST API Framework | **Convention over Configuration:** Spring Boot eliminates boilerplate code. Features used include: <br>• **Spring Data JPA & Hibernate:** Object-Relational Mapping (ORM) to seamlessly map Java classes directly to PostgreSQL tables. <br>• **Spring Web MVC:** High-performance RESTful API controllers with automated JSON serialization/deserialization. <br>• **Declarative Transactions (`@Transactional`):** Guarantees ACID compliance (e.g., when a student leaves a team or closes a project, updating request statuses and decrementing member counts succeed or roll back together). |
| **Spring Security (BCrypt)** | Security & Authentication | **Secure Password Storage:** Plaintext passwords are never stored. BCrypt uses a salted cryptographic hashing algorithm with a work factor that defends against rainbow table and brute-force attacks. |

---

### 3. Database: PostgreSQL

| Technology | Role | Why We Chose It (Viva Answer) |
| :--- | :--- | :--- |
| **PostgreSQL (v18)** | Relational Database | **Relational Integrity & ACID Compliance:** Academic collaboration involves strict relationships: Students &harr; Projects &harr; Join Requests &harr; Closure Votes. A relational database enforces primary/foreign key constraints, unique email constraints, and transactional consistency. |
| **HikariCP** | Connection Pooling | Comes standard with Spring Boot; maintains an active pool of database connections, minimizing connection latency for concurrent HTTP requests. |

---

### 4. AI & Matching Engine: Python (FastAPI + Gemini) & Spring Boot Algorithmic Matching

| Technology | Role | Why We Chose It (Viva Answer) |
| :--- | :--- | :--- |
| **FastAPI + Google Gemini API** | AI Project Requirement Analysis | Python is the industry standard for AI integration. Using Gemini, students simply type a natural-language idea (e.g., *"Smart irrigation using sensors and weather forecasting"*), and the AI automatically extracts technical domains, required skills, recommended cross-department team roles, difficulty, and feasibility. |
| **Spring Boot Matching Engine** | Teammate Recommender (`/api/students/match`) | **Deterministic, Low-Latency Matching:** While LLMs are great for generative analysis, candidate recommendation needs fast, deterministic filtering. The Spring Boot backend computes set intersection between project required skills and student registered skills, calculating **match percentages** and excluding the searching owner in milliseconds. |

---

### 5. Deployment & Cloud Infrastructure

| Platform | Role | Why We Chose It (Viva Answer) |
| :--- | :--- | :--- |
| **Netlify** | Frontend Hosting (SPA) | Offers a global Edge CDN, automatic HTTPS/SSL certificates, and native Single Page Application (SPA) routing support via `_redirects` and `netlify.toml`. |
| **Render** | Backend & Database Hosting | **Full Docker & PostgreSQL Support:** Allows zero-friction deployment of multi-stage Docker containers with managed, persistent PostgreSQL instances on private internal networks. |
| **Docker** | Containerization | Multi-stage build (`maven:3.9` &rarr; `eclipse-temurin:21-jre`) packages the entire Java runtime and application into a lightweight, portable container, guaranteeing that *"it runs the same in production as on development."* |

---

## 🎯 Key Workflows & Features (What You Can Demo in Viva)

### 1. User Authentication & Profile
- Registration with validation (minimum 8 character password, unique email check).
- Passwords securely hashed using **BCrypt**.
- Department selection and personal skill tags.

### 2. Project Creation with AI Skill Analysis
- Students enter a project title, description, and department.
- **AI Analysis:** Automatically identifies skills, team roles, domain, difficulty, and feasibility with an intelligent, resilient fallback mechanism.
- Stored relationally in PostgreSQL.

### 3. AI-Assisted Teammate Matching ("Find Teammates")
- Select any created project &rarr; system analyzes the required skill set.
- Automatically queries the student database and computes **Match Percentage** (e.g. *75% skill match*).
- Explains *why* the student is recommended (e.g. *Matches: Java, React*).
- **Self-Exclusion:** The searching owner is never recommended to themselves.

### 4. Interactive Join Request Workflow
- Students can browse projects across departments and click **Request to join**.
- Project owners receive incoming requests with a **red pulsing notification dot** and counter badge.
- Owners can **Accept** or **Reject**.
- If a student changes their mind, they can **Withdraw** their request even after acceptance, automatically updating team counts and notifying the project owner.

### 5. Multi-Member Project Closure Workflow
- A project owner cannot arbitrarily delete an active multi-member project.
- The owner initiates a **Project Closure Request**.
- All team members receive closure notifications to **Approve** or **Reject**.
- Democratic consensus: all active members must approve for the project to close cleanly.

---

## 💡 Top 10 Anticipated Viva Questions & Model Answers

### Q1: Why did you choose a decoupled architecture (React + Spring Boot) instead of a monolithic setup (like Spring Boot with Thymeleaf/JSP)?
> **Answer:** *"A decoupled architecture separates client-side presentation from backend business logic. This allows independent scaling, deployment, and testing. It also makes the backend a pure REST API, which means tomorrow we could easily build a mobile app (Flutter/React Native) that consumes the exact same backend endpoints without changing a single line of backend code."*

### Q2: Why did you use PostgreSQL instead of MongoDB?
> **Answer:** *"Our domain model has structured relational data: users own projects, projects have join requests, and join requests link back to students. Relational integrity (foreign keys, cascading updates, and uniqueness constraints) is critical to prevent orphaned data. Additionally, transactional guarantees (ACID) ensure that actions like accepting a request and updating member count happen atomically."*

### Q3: How do you handle password security?
> **Answer:** *"Passwords are never stored in plaintext. We use Spring Security's `BCryptPasswordEncoder`. BCrypt automatically salts passwords to protect against rainbow table attacks and uses an adaptive hashing function that remains resistant to brute-force attacks."*

### Q4: How does the teammate matching algorithm work?
> **Answer:** *"When a project is selected, its required skills are normalized (trimmed, converted to lowercase, and tokenized). The backend filters student skills, calculates the intersection of matching skills, and derives a score: `(matched_skills / required_skills) * 100`. Results are sorted in descending order of match percentage, and the searching user is excluded using an `excludeId` filter."*

### Q5: How did you solve CORS (Cross-Origin Resource Sharing) between Netlify and Render?
> **Answer:** *"Because our frontend is hosted on `https://unimesh.netlify.app` and our backend is on `https://mesh-1at8.onrender.com`, browsers enforce the Same-Origin Policy. We configured Spring Web's `@CrossOrigin` annotations across our REST controllers to explicitly allow the Netlify origin with allowed HTTP methods (`GET`, `POST`, `PATCH`, `DELETE`)."*

### Q6: How do you prevent Mixed Content security errors?
> **Answer:** *"When deploying to Netlify (which enforces HTTPS), any API calls to HTTP (like `http://localhost:8080`) are blocked by modern browsers. We resolved this by deploying our Spring Boot backend over HTTPS on Render and injecting the production API URL via Vite's `VITE_API_URL` environment variable at build time."*

### Q7: What happens when an accepted student withdraws from a project?
> **Answer:** *"Previously, only pending requests could be cancelled. We enhanced the workflow so an accepted student can withdraw at any time. When withdrawn, the backend executes a transactional update: it decrements the project's active member count in the database and updates the request status to `WITHDRAWN`, giving the project owner immediate visibility."*

### Q8: Why did you containerize the backend with Docker?
> **Answer:** *"Docker eliminates the 'it works on my machine' problem. We used a multi-stage Dockerfile: Stage 1 builds the JAR using Maven and JDK 21, and Stage 2 runs the artifact in a lightweight Eclipse Temurin JRE container. This keeps the production image small and secure."*

### Q9: How are SPA routes handled on Netlify when the user refreshes the page?
> **Answer:** *"In single-page applications, client-side routing is handled by JavaScript. If a user refreshes a sub-route on Netlify, the server returns a 404 by default. We resolved this by configuring `_redirects` (`/* /index.html 200`) and `netlify.toml` so all routes are rewritten to `index.html`, allowing the client-side router to handle the page state."*

### Q10: What future enhancements can be added to MESH?
> **Answer:** *"Future enhancements include: (1) WebSocket-based real-time chat between teammates, (2) JWT (JSON Web Tokens) with refresh token rotation for stateless authentication, (3) automated resume parsing to auto-populate student skills, and (4) integration of WebRTC for student video collaboration."*
