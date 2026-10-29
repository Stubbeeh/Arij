import { handle } from "@/server/http";
import { deleteTicket, getTicket, updateTicket } from "@/server/services/tickets";
import { ticketUpdate } from "@/shared/types";

type Ctx = { params: Promise<{ key: string }> };

export const GET = handle(async (_req: Request, { params }: Ctx) => getTicket((await params).key));

export const PATCH = handle(async (req: Request, { params }: Ctx) =>
  updateTicket((await params).key, ticketUpdate.parse(await req.json())),
);

export const DELETE = handle(async (_req: Request, { params }: Ctx) => deleteTicket((await params).key));
