import { z } from "zod";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export const notFound = (what: string) => new ApiError(404, `${what} not found`);

export function handle<A extends unknown[]>(fn: (...args: A) => unknown | Promise<unknown>) {
  return async (...args: A): Promise<Response> => {
    try {
      const result = await fn(...args);
      return result === undefined ? new Response(null, { status: 204 }) : Response.json(result);
    } catch (e) {
      if (e instanceof ApiError) return Response.json({ error: e.message }, { status: e.status });
      if (e instanceof z.ZodError) {
        return Response.json({ error: e.issues.map((i) => i.message).join("; ") }, { status: 400 });
      }
      if (e instanceof SyntaxError) return Response.json({ error: "Invalid JSON" }, { status: 400 });
      console.error(e);
      return Response.json({ error: "Internal error" }, { status: 500 });
    }
  };
}

export const idFrom = (raw: string) => {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1) throw new ApiError(400, "Invalid id");
  return n;
};
