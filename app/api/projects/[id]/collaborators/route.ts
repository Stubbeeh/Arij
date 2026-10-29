import { handle, idFrom } from "@/server/http";
import { addCollaborator, listCollaborators } from "@/server/services/projects";
import { collaboratorInput } from "@/shared/types";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handle(async (req: Request, { params }: Ctx) =>
  listCollaborators(idFrom((await params).id), new URL(req.url).searchParams.get("q") ?? undefined),
);

export const POST = handle(async (req: Request, { params }: Ctx) =>
  addCollaborator(idFrom((await params).id), collaboratorInput.parse(await req.json())),
);
