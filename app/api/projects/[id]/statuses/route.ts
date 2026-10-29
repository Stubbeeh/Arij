import { handle, idFrom } from "@/server/http";
import { createStatus, listStatuses } from "@/server/services/projects";
import { statusInput } from "@/shared/types";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handle(async (_req: Request, { params }: Ctx) => listStatuses(idFrom((await params).id)));

export const POST = handle(async (req: Request, { params }: Ctx) =>
  createStatus(idFrom((await params).id), statusInput.parse(await req.json())),
);
