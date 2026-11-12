import { render, type RenderResult } from "@testing-library/react";
import { App } from "../App";
export function renderTodoApp(): RenderResult { return render(<App />); }
