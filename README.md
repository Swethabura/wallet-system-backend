# Wallet System Backend

A production-inspired digital wallet system built to explore transactional consistency, concurrency control, distributed messaging, and event-driven architecture using PostgreSQL and RabbitMQ.

The project focuses on solving real-world backend challenges such as concurrent balance updates, duplicate request handling, reliable event publishing, and transactional integrity.

---

## Overview

The system allows users to create wallets, perform balance operations, transfer funds between accounts, and maintain a complete transaction history while ensuring data consistency and reliability.

The primary goal of this project is not only implementing wallet functionality but also understanding how production systems handle failures, concurrency, and distributed communication.

---

## Key Features

### Wallet Management

- Create Wallet
- Credit Wallet
- Debit Wallet
- Transfer Funds
- Transaction History
- Double-Entry Transaction Recording
- Balance Verification from Transaction Records

### Authentication & Authorization

* JWT Access Tokens
* Refresh Token Rotation
* CSRF Protection
* Secure Cookie Authentication
* Role-Based Access Control (RBAC)

### Reliability & Consistency

* PostgreSQL Transactions
* ACID Compliance
* Automatic Rollbacks
* Idempotent API Operations
* Retryable Transactions
* Transactional Outbox Pattern

## Reliability Testing

The project includes scenarios to simulate and validate:

- Concurrent Wallet Transfers
- Race Conditions
- Deadlocks
- Serialization Failures
- Duplicate Requests
- Transaction Rollbacks
- Event Publishing Reliability

### Concurrency Handling

* Row-Level Locking (`FOR UPDATE`)
* Concurrent Transfer Protection
* Deadlock Simulation
* Deadlock Detection & Resolution
* Retry Logic for Serialization Failures

### Event-Driven Architecture

* RabbitMQ Topic Exchange
* Event Publishing
* Audit Event Consumer
* Notification Event Consumer
* At-Least-Once Delivery
* Consumer Deduplication

---

# Architecture

```text
                Client
                   │
                   ▼
                Routes
                   │
                   ▼
              Controllers
                   │
                   ▼
                Services
                   │
                   ▼
             Repositories
                   │
                   ▼
              PostgreSQL
```

The application follows a layered architecture to separate responsibilities and improve maintainability.

* Routes handle request mapping.
* Controllers process HTTP requests and responses.
* Services contain business logic.
* Repositories manage database access.
* PostgreSQL acts as the source of truth.

---

# Event Flow

```text
          Transfer Completed
                  │
                  ▼
         Transactional Outbox
                  │
                  ▼
          RabbitMQ Exchange
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
   Audit Consumer    Notification Consumer
```

Events are first written to an outbox table within the same database transaction as the wallet update.

This ensures that business data and event creation remain consistent and avoids dual-write problems.

A background publisher then forwards events to RabbitMQ for asynchronous processing.

---

### Architectural Patterns

- Layered Architecture
- Repository Pattern
- Service Layer Pattern
- Transaction Wrapper Pattern

---

# Reliability Guarantees

### ACID Transactions

All wallet operations execute within PostgreSQL transactions to ensure:

* Atomicity
* Consistency
* Isolation
* Durability

Either the entire operation succeeds or all changes are rolled back.

### Row-Level Locking

To prevent race conditions during balance updates, wallet rows are locked using:

```sql
SELECT * FROM wallets
WHERE id = $1
FOR UPDATE;
```

This guarantees that only one transaction can modify a wallet balance at a time.

### Deadlock Handling

Deadlocks were intentionally simulated by acquiring wallet locks in opposite order across concurrent transactions.

Resolution strategies included:

- Consistent Lock Ordering
- Retry Logic
- Transaction Rollbacks
- Serialization Failure Recovery

### Idempotency

Transfer endpoints support idempotency keys, preventing duplicate fund transfers caused by retries or network failures.

### Transactional Outbox Pattern

Instead of directly publishing messages after database updates, events are first stored in an outbox table within the same database transaction.

This eliminates dual-write problems and guarantees reliable event delivery.

### Consumer Deduplication

RabbitMQ provides at-least-once delivery, meaning messages may occasionally be delivered more than once.

Consumers maintain processed-event tracking to safely ignore duplicate events.

### Transaction Isolation

Explored PostgreSQL isolation levels while testing concurrent wallet operations and deadlock scenarios.

Used transaction boundaries and retry mechanisms to safely handle serialization failures.

---

# Database Design

### PostgreSQL

Used as the primary datastore for:

* Users
* Wallets
* Transactions
* Outbox Events
* Idempotency Records

### Data Access Layer

Implemented using:

* pg
* Repository Pattern
* Transaction Wrapper

This keeps database operations isolated from business logic.

---

# API Overview

## Authentication

```http
POST /auth/register
POST /auth/login
POST /auth/refresh
POST /auth/logout
GET  /auth/profile
```

## Wallet

```http
POST /wallets/create
POST /wallets/credit
POST /wallets/debit
POST /wallets/transfer
GET  /wallets/history
```

## Admin

```http
GET /admin/users
GET /admin/wallets
GET /admin/ledger
```

---

# Tech Stack

## Backend

* Node.js
* Express.js

## Database

* PostgreSQL
* pg

## Messaging

* RabbitMQ

## Authentication

* JWT
* Refresh Tokens
* CSRF Tokens

## Validation

* Joi

## Logging

* Pino
* Pino Pretty

---

# Project Structure

```text
src/
│
├── config/
├── db/
├── middlewares/
│
├── modules/
│   ├── auth/
│   ├── wallet/
│   └── admin/
│
├── consumers/
├── queues/
├── utils/
│
├── app.js
└── server.js
```

---

# Running Locally

## Install Dependencies

```bash
npm install
```

## Environment Variables

Create a `.env` file:

```env
PORT=5001

DATABASE_URL=postgresql://username:password@localhost:5432/wallet_db

JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret

RABBITMQ_URL=amqp://localhost
```

## Start PostgreSQL

Ensure PostgreSQL is running and the database exists.

## Start RabbitMQ

```bash
docker run -d \
--hostname rabbitmq \
--name rabbitmq \
-p 5672:5672 \
-p 15672:15672 \
rabbitmq:3-management
```

RabbitMQ Management UI:

```text
http://localhost:15672
```

## Start Development Server

```bash
npm run dev
```

---

# Learning Outcomes

This project was built to gain hands-on experience with:

* ACID Transactions
* Isolation Levels
* Row-Level Locking
* Concurrency Control
* Deadlock Detection & Resolution
* Idempotency
* RabbitMQ Messaging
* Event-Driven Architecture
* Transactional Outbox Pattern
* Distributed System Reliability
* Production-Oriented Backend Design

---

# Current Status

### Implemented

Implemented

✅ JWT Authentication
✅ Wallet Operations
✅ PostgreSQL Transactions
✅ Row-Level Locking
✅ Deadlock Simulation & Recovery
✅ Idempotency Protection
✅ Transactional Outbox Pattern
✅ RabbitMQ Event Publishing
✅ Audit Consumer
✅ Notification Consumer
✅ Concurrency Testing

### Planned Enhancements

* Frontend Dashboard
* Metrics & Observability
* Monitoring
* Dockerization
* CI/CD Pipeline
* Production Deployment
* Analytics Dashboard

```
```
