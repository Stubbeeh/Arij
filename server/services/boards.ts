import { db } from "../db";
import { ApiError, notFound } from "../http";
import { getProject, listStatuses } from "./projects";
import { listTickets } from "./tickets";
import { CATEGORIES, type Board, type BoardDetail, type Category, type Stage } from "@/shared/types";

type BoardRow = { id: number; project_id: number; name: string };
const toBoard = (r: BoardRow): Board => ({ id: r.id, projectId: r.project_id, name: r.name });

export function listBoards(projectId: number): Board[] {
  getProject(projectId);
  return (db.prepare("SELECT * FROM boards WHERE project_id = ? ORDER BY id").all(projectId) as BoardRow[]).map(toBoard);
}

function getBoardRow(id: number): BoardRow {
  const r = db.prepare("SELECT * FROM boards WHERE id = ?").get(id) as BoardRow | undefined;
  if (!r) throw notFound("Board");
  return r;
}

function writeStages(boardId: number, stages: { name: string; category: Category; statusIds: number[] }[]) {
  const ins = db.prepare("INSERT INTO stages (board_id, name, category, position) VALUES (?, ?, ?, ?)");
  const link = db.prepare("INSERT INTO stage_statuses (stage_id, board_id, status_id, position) VALUES (?, ?, ?, ?)");
  stages.forEach((s, i) => {
    const sid = Number(ins.run(boardId, s.name, s.category, i).lastInsertRowid);
    s.statusIds.forEach((st, j) => link.run(sid, boardId, st, j));
  });
}

export function createBoard(projectId: number, input: { name: string }): Board {
  getProject(projectId);
  const statuses = listStatuses(projectId);
  const id = db.transaction(() => {
    const bid = Number(db.prepare("INSERT INTO boards (project_id, name) VALUES (?, ?)").run(projectId, input.name).lastInsertRowid);
    // One stage per status, grouped by category.
    const stages = CATEGORIES.flatMap((c) =>
      statuses.filter((s) => s.category === c).map((s) => ({ name: s.name, category: c, statusIds: [s.id] })),
    );
    writeStages(bid, stages);
    return bid;
  })();
  return toBoard(getBoardRow(id));
}

export function renameBoard(id: number, input: { name: string }): Board {
  getBoardRow(id);
  db.prepare("UPDATE boards SET name = ? WHERE id = ?").run(input.name, id);
  return toBoard(getBoardRow(id));
}

export function deleteBoard(id: number) {
  getBoardRow(id);
  db.prepare("DELETE FROM boards WHERE id = ?").run(id);
}

export function getBoard(id: number): BoardDetail {
  const board = toBoard(getBoardRow(id));
  const stageRows = db.prepare("SELECT id, name, category FROM stages WHERE board_id = ? ORDER BY position").all(id) as {
    id: number;
    name: string;
    category: Category;
  }[];
  const links = db.prepare("SELECT stage_id, status_id FROM stage_statuses WHERE board_id = ? ORDER BY position").all(id) as {
    stage_id: number;
    status_id: number;
  }[];
  const stages: Stage[] = stageRows.map((s) => ({
    ...s,
    statusIds: links.filter((l) => l.stage_id === s.id).map((l) => l.status_id),
  }));
  return { ...board, stages, statuses: listStatuses(board.projectId), tickets: listTickets(board.projectId) };
}

export function setStages(id: number, input: { stages: { name: string; category: Category; statusIds: number[] }[] }): BoardDetail {
  const board = getBoardRow(id);
  const valid = new Set(listStatuses(board.project_id).map((s) => s.id));
  const seen = new Set<number>();
  for (const s of input.stages) {
    for (const st of s.statusIds) {
      if (!valid.has(st)) throw new ApiError(400, "Unknown status in stage");
      if (seen.has(st)) throw new ApiError(400, "A status can only be in one stage per board");
      seen.add(st);
    }
  }
  db.transaction(() => {
    db.prepare("DELETE FROM stages WHERE board_id = ?").run(id);
    writeStages(id, input.stages);
  })();
  return getBoard(id);
}
