import { DEFAULT_CURRENT_DEPTH, DEFAULT_MAX_DEPTH } from '../constants/constants';

export class ToDoOptionsDto {
  maxDepth?: number = DEFAULT_MAX_DEPTH;
  currentDepth?: number = DEFAULT_CURRENT_DEPTH;
}
