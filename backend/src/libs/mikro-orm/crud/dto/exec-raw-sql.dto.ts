export class ExecRawSqlDto {
  sql: string;
  parameters?: Record<string, any>;
}
