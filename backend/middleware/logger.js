export function logger(req, res, next) {
  const now = new Date().toISOString();

  res.on("finish", () => {
    console.log(
      `[${now}] ${req.method} ${req.url} ${res.statusCode} ${res.statusMessage}`,
    );
  });

  res.on("error", (err) => {
    console.error(`[${now}] ERROR: ${req.method} ${req.url}`, err);
  });

  next();
}
