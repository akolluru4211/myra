function requireDatabaseUrl(variable = "DATABASE_URL") {
  const value = process.env[variable]?.trim();
  if (!value) throw new Error(`${variable} is required`);
  return value;
}

function requireTestDatabaseUrl() {
  return requireDatabaseUrl("TEST_DATABASE_URL");
}

module.exports = { requireDatabaseUrl, requireTestDatabaseUrl };
