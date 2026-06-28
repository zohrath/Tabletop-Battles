import { pathToFileURL } from "node:url";
import { createApiServer, handleApiRequest } from "../server/api.mjs";

const port = Number(process.env.API_PORT ?? 8787);
const isDirectRun =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  const server = createApiServer();

  server.listen(port, () => {
    console.log(`Tabletop Battles API listening on http://localhost:${port}`);
  });
}

export default handleApiRequest;
