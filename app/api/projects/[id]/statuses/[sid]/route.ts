import { handle, idFrom } from "@/server/http";
import { deleteStatus, updateStatus } from "@/server/services/projects";
import { statusUpdate } from "@/shared/types";

type Ctx = { params: Promise<{ id: string; sid: string }> };

export const PATCH = handle(async (req: Request, { params }: Ctx) => {
  const p = await params;
  return updateStatus(idFrom(p.id), idFrom(p.sid), statusUpdate.parse(await req.json()));
});

export const DELETE = handle(async (req: Request, { params }: Ctx) => {
  const p = await params;
  const r = new URL(req.url).searchParams.get("replaceWith");
  deleteStatus(idFrom(p.id), idFrom(p.sid), r ? idFrom(r) : undefined);
});
