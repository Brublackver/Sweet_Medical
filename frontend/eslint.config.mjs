import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

// Config oficial de Next 15 (flat config vía FlatCompat).
// "next/core-web-vitals" incluye: eslint-plugin-react (entiende uso de
// componentes en JSX), react-hooks (rules-of-hooks, exhaustive-deps),
// jsx-a11y (accesibilidad) y @next/next. Maneja browser + Node env.
const eslintConfig = [
  ...compat.extends("next/core-web-vitals"),
  {
    ignores: [".next/**", "node_modules/**"],
  },
];

export default eslintConfig;
