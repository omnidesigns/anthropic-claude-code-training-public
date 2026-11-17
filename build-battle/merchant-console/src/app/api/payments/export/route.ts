import { filterPayments, parseFilters, sortPayments } from "@/data/queries"
import {
  exportFilename,
  exportScopeLabel,
  parseExportColumns,
  parseExportScope,
  toCsv,
} from "@/lib/csv"
import { NextRequest, NextResponse } from "next/server"

/**
 * Exports payments as CSV.
 *
 * Query params:
 * - `scope`: `filter` (default) uses the same filters as the table;
 *   `all` ignores them.
 * - `columns`: comma-separated, from EXPORT_COLUMNS, in output order.
 *   Missing means every column except the card last four.
 *
 * Rows come from the shared query builder and are not paginated, so the file
 * holds every matching payment, not just the page on screen.
 */
export function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams

  const scope = parseExportScope(params.get("scope"))
  if (!scope) {
    return badRequest('Scope must be "filter" or "all".')
  }

  const columns = parseExportColumns(params.get("columns"))
  if (!columns.ok) return badRequest(columns.error)

  const filters = parseFilters(scope === "all" ? new URLSearchParams() : params)
  const rows = sortPayments(
    filterPayments(filters),
    filters.sort,
    filters.direction,
  )
  const filename = exportFilename(new Date(), exportScopeLabel(scope, filters))

  return new Response(toCsv(rows, columns.columns), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
    },
  })
}

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 })
}
