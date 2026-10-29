import { handle } from "@/server/http";
import { createProject, listProjects } from "@/server/services/projects";
import { projectInput } from "@/shared/types";

export const GET = handle(() => listProjects());

export const POST = handle(async (req: Request) => createProject(projectInput.parse(await req.json())));
