import { Composition } from "remotion";
import { AlunosVisualizarEditar } from "./videos/AlunosVisualizarEditar";

// Cada propaganda nova = um arquivo em src/videos/ + uma linha aqui.
export const Root = () => (
  <>
    <Composition id="AlunosVisualizarEditar" component={AlunosVisualizarEditar} durationInFrames={480} fps={30} width={1920} height={1080} />
  </>
);
