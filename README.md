Wallet System Backend

A production-inspired wallet system built to explore transactional consistency, concurrency control, idempotency, distributed messaging, and event-driven architecture.

Features:
Wallet Operations
1. Create Wallet
2. Credit Wallet
3. Debit Wallet
4. Transfer Funds
5. Transaction History
6. Balance Reconstruction

Reliability & Consistency
1. PostgreSQL Transactions
2. ACID Compliance
3. Transaction Rollbacks
4. Idempotency Protection
5. Transactional Outbox Pattern

Concurrency Handling
1. Row-Level Locking (FOR UPDATE)
2. Concurrent Transfer Protection
3. Deadlock Simulation
4. Deadlock Resolution via Lock Ordering
5. Retry Logic for Serialization Failures

Event-Driven Architecture
1. RabbitMQ Topic Exchange
2. Event Publishing
3. Audit Consumer
4. Notification Consumer
5. At-Least-Once Delivery
6. Consumer Deduplication

Authentication & Security
1. Access Token
2. Refresh Token Rotation
3. CSRF Protection
4. Secure Cookie Authentication
5. Role-Based Authorization

Database Layer
1. PostgreSQL
2. Direct SQL using pg
3. Repository Pattern
4. Transaction Wrapper

Tech Stack:

Backend
1. Node.js
2. Express.js

Database
1. PostgreSQL
2. pg

Messaging
1. RabbitMQ

Authentication
1. JWT
2. Refresh Tokens
3. CSRF Tokens

Validation
1. Joi

Logging
1. Pino
2. Pino Pretty

Architecture: 

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

Event Flow

              Transfer Completed
                      │
                      ▼
              RabbitMQ Exchange
                      │
                      ├── Audit Consumer
                      │
                      └── Notification Consumer

Concepts Explored:

1. ACID Transactions: Implemented transaction boundaries using PostgreSQL transactions to ensure atomic and consistent wallet operations.

2. Row-Level Locking
    Used:
    
    SELECT ... FOR UPDATE

to prevent race conditions during balance updates.

2. Deadlock Handling: Simulated deadlocks by acquiring locks in opposite order and resolved them using consistent lock ordering and retry logic.

3. Idempotency: Protected transfer endpoints against duplicate requests using idempotency keys.

4. Transactional Outbox: Implemented reliable event publishing to RabbitMQ without introducing dual-write inconsistencies.

5. Consumer Deduplication: Handled at-least-once delivery safely by preventing duplicate event processing.

Project Structure: 

                        src/
                        │
                        ├── config/
                        ├── db/
                        ├── middlewares/
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

API Highlights:

1. Authentication
POST /auth/register
POST /auth/login
POST /auth/refresh
POST /auth/logout
GET  /auth/profile

3. Wallet
POST /wallets/create
POST /wallets/credit
POST /wallets/debit
POST /wallets/transfer

4. Admin
GET /admin/users
GET /admin/wallets
GET /admin/ledger

Reliability Features

1. Transaction Rollback Support
2. Concurrent Transfer Safety
3. Deadlock Recovery
4. Retryable Transactions
5. Idempotent APIs
6. Reliable Event Publishing
7. Consumer Deduplication

Running Locally: 

Install Dependencies
npm install
Environment Variables

Create a .env file:

PORT=5001

DATABASE_URL=postgresql://username:password@localhost:5432/wallet_db

JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret

RABBITMQ_URL=amqp://localhost

Run PostgreSQL

Ensure PostgreSQL is running and the database exists.

Run RabbitMQ
docker run -d --hostname rabbitmq \
--name rabbitmq \
-p 5672:5672 \
-p 15672:15672 \
rabbitmq:3-management

Management UI:

http://localhost:15672

Start Server
npm run dev

Learning Outcomes

This project was built to deeply understand:

1. ACID Transactions
2. Isolation Levels
3. Row Locking
4. Deadlocks
5. Retry Mechanisms
6. Idempotency
7. Event-Driven Systems
8. RabbitMQ
9. Transactional Outbox Pattern
10. Distributed System Reliability
11. Production-Oriented Backend Design

Status

🚧 Currently under active development.

Implemented:
1. Authentication System
2. Wallet Operations
3. Concurrency Controls
4. RabbitMQ Integration
5. Transactional Outbox Pattern
6. Audit & Notification Consumers

Upcoming
1. Frontend Dashboard
2. Analytics
3. Monitoring
4. Metrics & Observability
5. Deployment
6. CI/CD
7. Dockerization

