import { handle, idFrom } from "@/server/http";
import { createBoard, listBoards } from "@/server/services/boards";
import { boardInput } from "@/shared/types";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handle(async (_req: Request, { params }: Ctx) => listBoards(idFrom((await params).id)));

export const POST = handle(async (req: Request, { params }: Ctx) =>
  createBoard(idFrom((await params).id), boardInput.parse(await req.json())),
);
