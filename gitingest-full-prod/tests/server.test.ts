import request from "supertest";
import express from "express";

const app = express();
app.get("/health", (_req, res) => res.json({ status: "ok" }));

test("health endpoint works", async () => {
  const res = await request(app).get("/health");
  expect(res.body.status).toBe("ok");
});
