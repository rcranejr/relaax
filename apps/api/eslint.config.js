// Boundary rule: only services/health may import the health schema or createHealthDb.
export default [
  {
    files: ["src/**/*.ts"],
    ignores: ["src/services/health/**"],
    rules: {
      "no-restricted-imports": ["error", {
        paths: [{ name: "@relaax/db", importNames: ["health", "healthSchema", "createHealthDb"], message: "Health vault access only from services/health." }],
      }],
    },
  },
];
