import type { Request, Response, NextFunction } from "express";
import { Router } from "express";

export interface CrudHandlers {
  list: () => Promise<unknown[]>;
  getById: (id: number) => Promise<unknown | null>;
  create: (body: Record<string, unknown>) => Promise<unknown>;
  update: (id: number, body: Record<string, unknown>) => Promise<unknown | null>;
  remove: (id: number) => Promise<boolean>;
}

function parseId(param: string | undefined): number | null {
  const id = Number(param);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export function createCrudRouter(h: CrudHandlers): Router {
  const r = Router();

  r.get("/", (req: Request, res: Response, next: NextFunction) => {
    void h
      .list()
      .then((rows) => res.json(rows))
      .catch(next);
  });

  r.get("/:id", (req: Request, res: Response, next: NextFunction) => {
    const id = parseId(req.params.id);
    if (id === null) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    void h
      .getById(id)
      .then((row) => {
        if (!row) {
          res.status(404).json({ error: "Not found" });
          return;
        }
        res.json(row);
      })
      .catch(next);
  });

  r.post("/", (req: Request, res: Response, next: NextFunction) => {
    void h
      .create(req.body as Record<string, unknown>)
      .then((row) => res.status(201).json(row))
      .catch(next);
  });

  r.put("/:id", (req: Request, res: Response, next: NextFunction) => {
    const id = parseId(req.params.id);
    if (id === null) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    void h
      .update(id, req.body as Record<string, unknown>)
      .then((row) => {
        if (!row) {
          res.status(404).json({ error: "Not found" });
          return;
        }
        res.json(row);
      })
      .catch(next);
  });

  r.patch("/:id", (req: Request, res: Response, next: NextFunction) => {
    const id = parseId(req.params.id);
    if (id === null) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    void h
      .update(id, req.body as Record<string, unknown>)
      .then((row) => {
        if (!row) {
          res.status(404).json({ error: "Not found" });
          return;
        }
        res.json(row);
      })
      .catch(next);
  });

  r.delete("/:id", (req: Request, res: Response, next: NextFunction) => {
    const id = parseId(req.params.id);
    if (id === null) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    void h
      .remove(id)
      .then((ok) => {
        if (!ok) {
          res.status(404).end();
          return;
        }
        res.status(204).end();
      })
      .catch(next);
  });

  return r;
}
