import { initialBoard } from "@/domain/data/kanban-board";
import { Kanban } from "./_components/kanban";

export default function Page() {
  return (
    <div data-content-padding="false">
      <Kanban initialBoard={initialBoard} />
    </div>
  );
}
