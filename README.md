# InterestAccurate — Multi-Tenant Loan & Interest Management SaaS

A high-precision financial web application designed for private loan providers, financiers, and lending businesses, with automated borrower reminders and developer subscription controls.

---

## 🌟 Key Features

* **Precision Interest Engine**:
  * Accurately computes monthly interest (e.g. ₹2 per ₹100/mo) and annual % (p.a.).
  * Daily broken-period accruals and full closing settlement calculation.
  * Upfront interest deduction handling.
  * Automatic due date rollover to the next month upon interest payment.
* **Indian Financial Standards**:
  * Indian Standard Time (IST UTC+5:30) synchronized audit logs.
  * INR (`₹`) currency formatting and Indian numbering convention.
  * Monthly cycle tracking (e.g. 1st of every month).
* **Automated Reminders & Alerts**:
  * **Borrower Reminder SMS**: Dispatched 1 day before monthly due date.
  * **Lender Alert SMS**: Dispatched on the due date.
  * **1-Click WhatsApp**: Instant direct chat links with pre-filled reminder text.
  * **Multi-Gateway**: Integrations with Fast2SMS (India DLT), Twilio, and a built-in Free Simulator.
* **Multi-Tenant SaaS Architecture**:
  * Isolated workspaces partitioned by `client_id` across borrowers, loans, repayments, and SMS history.
  * Strict server-side JWT verification prevents tenant spoofing.
* **Developer Super-Admin Hub (`dev@1234`)**:
  * Onboard unlimited client financiers with custom monthly/yearly plans.
  * Real-time Monthly Recurring Revenue (MRR) tracking.
  * 1-click subscription extensions (`+30d`, `+1yr`).
  * Automatic lockout paywall for non-paying clients with custom renewal UPI/contact info.
* **Production Hardened**:
  * `bcryptjs` password hashing with auto-upgrade for legacy credentials.
  * Signed 7-day JWT tokens.
  * Rate-limiting on authentication and SMS dispatch (`express-rate-limit`).
  * Security headers via `helmet`.
  * High-concurrency SQLite Write-Ahead Logging (`WAL` mode).

---

## 🚀 Quick Start

### 1. Prerequisites
* Node.js v20+ or v22+
* npm

### 2. Installation
Clone the repository and install dependencies:

```bash
git clone <your-repo-url>
cd InterestAccurate

# Install root dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

### 3. Environment Setup
Copy the example environment file:

```bash
cp .env.example .env
```

Set your `JWT_SECRET` in `.env`.

### 4. Build the Frontend
```bash
npm run build:client
```

### 5. Run the Application
```bash
npm start
```

Open your browser at **`http://localhost:5000`**.

---

## 🔑 Default Access Credentials

| Role | Username / Identifier | Password / PIN | Description |
|---|---|---|---|
| **Developer Super-Admin** | `admin` | **`dev@1234`** | Access to client management, MRR, and renewal controls |
| **Client 1 (Demo Financier)** | `9876543210` | **`client123`** | Dedicated lending workspace |

---

## 🛠️ Tech Stack

* **Frontend**: React 18, Vite, Tailwind CSS v4, Lucide Icons
* **Backend**: Node.js, Express 5, `node:sqlite` (SQLite WAL mode)
* **Security**: `bcryptjs`, `jsonwebtoken`, `helmet`, `express-rate-limit`
* **Integrations**: Fast2SMS, Twilio, WhatsApp Click-to-Chat

---

## 📄 License
ISC
