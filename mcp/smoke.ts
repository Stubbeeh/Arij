// Manual check: requires `npm run dev` running. Usage: npx tsx mcp/smoke.ts
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const client = new Client({ name: "smoke", version: "0.0.0" });

async function call(name: string, args: Record<string, unknown> = {}) {
  const res = (await client.callTool({ name, arguments: args })) as { content: { text: string }[]; isError?: boolean };
  const text = res.content[0].text;
  console.log(`${res.isError ? "ERROR" : "ok   "} ${name}: ${text.slice(0, 300)}`);
  return res.isError ? null : JSON.parse(text);
}

async function main() {
  await client.connect(
    new StdioClientTransport({ command: "npx", args: ["tsx", "mcp/server.ts"], env: process.env as Record<string, string> }),
  );
  console.log((await client.listTools()).tools.map((t) => t.name).join(", "));
  await call("whoami");
  const projects = await call("list_projects");
  if (!projects?.length) throw new Error("No projects: create one in the UI first.");
  const project = await call("get_project", { project: projects[0].prefix });
  const reporter = project.collaborators[0];
  if (!reporter) throw new Error("No collaborators: add one in the UI first.");
  const created = await call("create_ticket", { project: project.prefix, type: "epic", title: "MCP smoke test", reporter });
  await call("update_ticket", { key: created.key, status: project.statuses.at(-1).name, description: "updated" });
  await call("get_ticket", { key: created.key });
  await call("list_tickets", { project: project.prefix, text: "smoke" });
  await call("create_ticket", { project: project.prefix, type: "epic", title: "x", reporter: "nobody" }); // expected ERROR
  await client.close();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
