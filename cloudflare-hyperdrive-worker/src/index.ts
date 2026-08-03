 import { Client } from "pg";

export interface Env {
  HYPERDRIVE: {
    connectionString: string;
  };
  PROXY_API_KEY?: string; // Optional security key to protect the proxy
}

// Common CORS headers helper
function getCorsHeaders(origin: string = "*") {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key",
    "Access-Control-Max-Age": "86400",
  };
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const corsHeaders = getCorsHeaders(request.headers.get("Origin") || "*");

    // Handle CORS preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    const url = new URL(request.url);

    // Endpoint for checking connection health
    if (url.pathname === "/health") {
      try {
        const client = new Client({ connectionString: env.HYPERDRIVE.connectionString });
        await client.connect();
        const res = await client.query("SELECT NOW();");
        await client.end();
        return Response.json(
          { status: "ok", timestamp: res.rows[0].now },
          { headers: corsHeaders },
        );
      } catch (err) {
        return Response.json(
          { status: "error", message: err instanceof Error ? err.message : String(err) },
          { status: 500, headers: corsHeaders },
        );
      }
    }

    // Endpoint to run custom SQL queries (POST /query)
    if (url.pathname === "/query" && request.method === "POST") {
      // 1. Optional API Key Validation if PROXY_API_KEY is configured
      if (env.PROXY_API_KEY) {
        const apiKeyHeader = request.headers.get("x-api-key");
        const authHeader = request.headers.get("Authorization");
        const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;

        if (apiKeyHeader !== env.PROXY_API_KEY && token !== env.PROXY_API_KEY) {
          return Response.json(
            { error: "Unauthorized: Invalid x-api-key or Bearer token." },
            { status: 401, headers: corsHeaders },
          );
        }
      }

      // 2. Parse request body
      let body: { query?: string; params?: any[] };
      try {
        body = (await request.json()) as { query?: string; params?: any[] };
      } catch (err) {
        return Response.json(
          { error: "Invalid JSON payload" },
          { status: 400, headers: corsHeaders },
        );
      }

      const { query, params = [] } = body;
      if (!query || typeof query !== "string") {
        return Response.json(
          { error: "Missing required 'query' string parameter in request body." },
          { status: 400, headers: corsHeaders },
        );
      }

      // 3. Connect and execute query
      const client = new Client({ connectionString: env.HYPERDRIVE.connectionString });
      try {
        await client.connect();
        const result = await client.query(query, params);
        await client.end();

        return Response.json(
          {
            success: true,
            rows: result.rows,
            rowCount: result.rowCount,
            command: result.command,
          },
          { headers: corsHeaders },
        );
      } catch (e) {
        // Ensure connection is closed even on failure
        try {
          await client.end();
        } catch {}
        return Response.json(
          {
            success: false,
            error: e instanceof Error ? e.message : String(e),
          },
          { status: 500, headers: corsHeaders },
        );
      }
    }

    // Default route: GET / or GET /tables -> runs the user's requested sample SQL query
    const client = new Client({ connectionString: env.HYPERDRIVE.connectionString });
    try {
      await client.connect();
      // Sample SQL query
      const result = await client.query("SELECT * FROM pg_tables");
      await client.end();

      return Response.json({ result: result.rows }, { headers: corsHeaders });
    } catch (e) {
      try {
        await client.end();
      } catch {}
      return Response.json(
        { error: e instanceof Error ? e.message : String(e) },
        { status: 500, headers: corsHeaders },
      );
    }
  },
};
