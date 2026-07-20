# Supabase PostgreSQL Hyperdrive Proxy (Cloudflare Worker)

This Cloudflare Worker acts as a high-performance database proxy for your Supabase Postgres database (`https://tffffvbaiccqndydsobg.supabase.co`) using **Cloudflare Hyperdrive**. It pools and caches connections securely, allowing you to execute database queries with ultra-low latency from the edge.

## Features

1. **High Performance**: Connection pooling and caching via Cloudflare Hyperdrive.
2. **Flexible Querying**: Supports executing arbitrary parameterized SQL queries via `POST /query`.
3. **CORS Enabled**: Out-of-the-box support for browser-based queries and client integrations.
4. **Health Check**: Endpoint `GET /health` to verify database connection status.
5. **Optional Security**: Protects your endpoints using an optional API Key (`PROXY_API_KEY`).

---

## Directory Structure

```
cloudflare-hyperdrive-worker/
├── src/
│   └── index.ts          # Worker code (CORS, endpoints, query execution)
├── wrangler.jsonc        # Worker wrangler configuration
├── package.json          # Package dependencies & scripts
└── README.md             # Setup guide
```

---

## Setup & Deployment Instructions

### 1. Prerequisites
Ensure you have the [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) installed globally, or use the local scripts:
```bash
npm install
```

### 2. Configure Hyperdrive Connection
Open `wrangler.jsonc` in this directory and make sure your Hyperdrive configuration is correct:
```jsonc
  "hyperdrive": [
    {
      "binding": "HYPERDRIVE",
      "id": "1afe639009974087bf6c8b4f8deb4c4a",
      // Local connection string for development:
      "localConnectionString": "postgresql://postgres:your-local-password@localhost:5432/postgres"
    }
  ]
```

To configure your Hyperdrive connection string in Cloudflare dashboard or wrangler command, run:
```bash
wrangler hyperdrive create my-supabase-hyperdrive --connection-string="postgresql://postgres:[YOUR-SUPABASE-PASSWORD]@aws-0-eu-west-2.pooler.supabase.com:6543/postgres"
```
*(Copy the generated Hyperdrive ID and place it in your `wrangler.jsonc`)*

### 3. Securing your Proxy (Optional but Recommended)
To prevent unauthorized users from executing arbitrary SQL against your database, you can define a `PROXY_API_KEY` secret:
```bash
wrangler secret put PROXY_API_KEY
```
Input your secret key. When this environment variable is present, the proxy will validate incoming requests.

---

## API Documentation

### 1. Test Endpoint (Default Sample)
* **URL**: `GET /`
* **Response**: Executes a sample table query (`SELECT * FROM pg_tables;`) to test the connection.
* **Returns**: List of all database tables.

### 2. Connection Health Check
* **URL**: `GET /health`
* **Response**:
```json
{
  "status": "ok",
  "timestamp": "2026-07-20T08:34:00.000Z"
}
```

### 3. Execute Custom Query
* **URL**: `POST /query`
* **Headers**:
  * `Content-Type: application/json`
  * `x-api-key: [YOUR_PROXY_API_KEY]` *(Only if PROXY_API_KEY secret is configured on Cloudflare)*
* **Body**:
```json
{
  "query": "SELECT id, display_name, role FROM public.profiles WHERE role = $1 LIMIT 5;",
  "params": ["teacher"]
}
```
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "rows": [
    {
      "id": "c5f538e5-87db-4889-ac06-dcf43ebc9913",
      "display_name": "Latty Ranks",
      "role": "institution_admin"
    }
  ],
  "rowCount": 1,
  "command": "SELECT"
}
```
* **Error Response (500 Internal Server Error)**:
```json
{
  "success": false,
  "error": "relation \"public.non_existent_table\" does not exist"
}
```

---

## Deployment
To deploy this proxy worker live to Cloudflare:
```bash
npm run deploy
```
