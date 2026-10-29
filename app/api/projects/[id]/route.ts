import { handle, idFrom } from "@/server/http";
import { deleteProject, getProject, updateProject } from "@/server/services/projects";
import { projectUpdate } from "@/shared/types";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handle(async (_req: Request, { params }: Ctx) => getProject(idFrom((await params).id)));

export const PATCH = handle(async (req: Request, { params }: Ctx) =>
  updateProject(idFrom((await params).id), projectUpdate.parse(await req.json())),
);

export const DELETE = handle(async (_req: Request, { params }: Ctx) => deleteProject(idFrom((await params).id)));
