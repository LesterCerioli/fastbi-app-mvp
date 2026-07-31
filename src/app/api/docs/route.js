import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";

const DIST = path.join(process.cwd(), "node_modules/swagger-ui-dist");

function checkAuth(request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Basic ")) return false;

  const user = process.env.SWAGGER_USER;
  const pass = process.env.SWAGGER_PASSWORD;
  if (!user || !pass) return false;

  try {
    const decoded = atob(authHeader.slice(6));
    const colon = decoded.indexOf(":");
    if (colon === -1) return false;
    return decoded.slice(0, colon) === user && decoded.slice(colon + 1) === pass;
  } catch {
    return false;
  }
}

export async function GET(request) {
  if (!checkAuth(request)) {
    return new NextResponse("Unauthorized", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Swagger Docs"' },
    });
  }

  const template = fs.readFileSync(path.join(DIST, "index.html"), "utf-8");

  const html = template
    .replace('href="./swagger-ui.css"', 'href="/api/docs/swagger-ui.css"')
    .replace('href="index.css"', 'href="/api/docs/index.css"')
    .replace('href="./favicon-32x32.png"', 'href="/api/docs/favicon-32x32.png"')
    .replace('href="./favicon-16x16.png"', 'href="/api/docs/favicon-16x16.png"')
    .replace('src="./swagger-ui-bundle.js"', 'src="/api/docs/swagger-ui-bundle.js"')
    .replace('src="./swagger-ui-standalone-preset.js"', 'src="/api/docs/swagger-ui-standalone-preset.js"')
    .replace('src="./swagger-initializer.js"', 'src="/api/docs/swagger-initializer.js"');

  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
