declare module "*.css";

interface ImportMetaEnv {
  readonly DEV: string;
  // add more variables here as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
