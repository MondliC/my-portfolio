export default async () => new Response("Not Found", {
  status: 404,
  headers: {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Robots-Tag": "noindex, nofollow"
  }
});

export const config = {
  path: ["/mn-cloud-consulting", "/mn-cloud-consulting/*"]
};