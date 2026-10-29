import { handle, idFrom } from "@/server/http";
import { deleteCollaborator } from "@/server/services/projects";

type Ctx = { params: Promise<{ id: string; cid: string }> };

export const DELETE = handle(async (_req: Request, { params }: Ctx) => {
  const p = await params;
  deleteCollaborator(idFrom(p.id), idFrom(p.cid));
});
