import { handle, idFrom } from "@/server/http";
import { deleteBoard, getBoard, renameBoard } from "@/server/services/boards";
import { boardInput } from "@/shared/types";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handle(async (_req: Request, { params }: Ctx) => getBoard(idFrom((await params).id)));

export const PATCH = handle(async (req: Request, { params }: Ctx) =>
  renameBoard(idFrom((await params).id), boardInput.parse(await req.json())),
);

export const DELETE = handle(async (_req: Request, { params }: Ctx) => deleteBoard(idFrom((await params).id)));
