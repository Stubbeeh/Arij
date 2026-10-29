import { handle, idFrom } from "@/server/http";
import { setStages } from "@/server/services/boards";
import { stagesInput } from "@/shared/types";

type Ctx = { params: Promise<{ id: string }> };

export const PUT = handle(async (req: Request, { params }: Ctx) =>
  setStages(idFrom((await params).id), stagesInput.parse(await req.json())),
);
