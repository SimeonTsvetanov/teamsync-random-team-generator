// Non-TypeScript imports Vite resolves for the body: screen.html as a string (`?raw`) and its CSS
// entry. Declared here so the package needs no `vite/client` types.
declare module "*.html?raw" {
  const markup: string;
  export default markup;
}

declare module "*.css";
