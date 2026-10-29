import { handle, idFrom } from "@/server/http";
import { createTicket, listTickets } from "@/server/services/tickets";
import { ticketInput } from "@/shared/types";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handle(async (_req: Request, { params }: Ctx) => listTickets(idFrom((await params).id)));

export const POST = handle(async (req: Request, { params }: Ctx) =>
  createTicket(idFrom((await params).id), ticketInput.parse(await req.json())),
);
