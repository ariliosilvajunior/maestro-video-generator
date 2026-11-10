import { Composition } from "remotion";
import { AlunosVisualizarEditar } from "./videos/AlunosVisualizarEditar";
import { FichaDoAluno, DURACAO_FICHA } from "./videos/FichaDoAluno";
import { FichaDoAlunoH } from "./videos/FichaDoAlunoH";

// Cada propaganda nova = um arquivo em src/videos/ + uma linha aqui.
export const Root = () => (
  <>
    <Composition id="AlunosVisualizarEditar" component={AlunosVisualizarEditar} durationInFrames={480} fps={30} width={1920} height={1080} />
    <Composition id="FichaDoAluno" component={FichaDoAluno} durationInFrames={DURACAO_FICHA} fps={30} width={1080} height={1920} />
    <Composition id="FichaDoAlunoH" component={FichaDoAlunoH} durationInFrames={DURACAO_FICHA} fps={30} width={1920} height={1080} />
  </>
);
