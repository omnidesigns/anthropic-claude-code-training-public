import { merchantById } from "@/data/merchants"
import { Payment, PaymentFilters } from "@/data/types"
import { formatMoney } from "./money"

/**
 * CSV export for the payments table.
 *
 * Ops chooses the columns and the scope (NWP-101). Both arrive from the
 * client, so the route checks them here against fixed lists before they
 * reach the serializer or the filename.
 */

export const EXPORT_COLUMNS = [
  "id",
  "created_at",
  "merchant",
  "description",
  "status",
  "method",
  "card_brand",
  "last4",
  "amount",
  "currency",
] as const

export type ExportColumn = (typeof EXPORT_COLUMNS)[number]

/**
 * Every column except the card last four. Files often go to merchants, so
 * card data is opt-in.
 */
export const DEFAULT_EXPORT_COLUMNS: readonly ExportColumn[] =
  EXPORT_COLUMNS.filter((column) => column !== "last4")

export const EXPORT_SCOPES = ["filter", "all"] as const

export type ExportScope = (typeof EXPORT_SCOPES)[number]

export type ParsedExportColumns =
  { ok: true; columns: ExportColumn[] } | { ok: false; error: string }

/**
 * Turns the comma-separated `columns` param into a checked list. Keeps the
 * requested order and drops repeats. A missing param means the defaults; an
 * empty list or any unknown name is rejected rather than silently dropped.
 */
export function parseExportColumns(raw: string | null): ParsedExportColumns {
  if (raw === null) return { ok: true, columns: [...DEFAULT_EXPORT_COLUMNS] }

  const names = raw
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean)

  if (names.length === 0) {
    return { ok: false, error: "Choose at least one column to export." }
  }

  const known = (name: string): name is ExportColumn =>
    (EXPORT_COLUMNS as readonly string[]).includes(name)

  if (!names.every(known)) {
    return {
      ok: false,
      error: `Unknown column. Allowed columns: ${EXPORT_COLUMNS.join(", ")}.`,
    }
  }

  return { ok: true, columns: [...new Set(names as ExportColumn[])] }
}

/** A missing scope means the current filter. Anything unknown is null. */
export function parseExportScope(raw: string | null): ExportScope | null {
  if (raw === null || raw === "") return "filter"
  return (EXPORT_SCOPES as readonly string[]).includes(raw)
    ? (raw as ExportScope)
    : null
}

/**
 * The scope word in the filename. Built only from checked values (the scope
 * and a status already allowlisted by parseFilters), never from raw input.
 */
export function exportScopeLabel(
  scope: ExportScope,
  filters: PaymentFilters,
): string {
  if (scope === "all") return "all"
  const status =
    filters.status && filters.status !== "all" ? filters.status : null
  const narrowed = Boolean(
    filters.merchantId || filters.search || filters.from || filters.to,
  )
  if (status) return narrowed ? `${status}-filtered` : status
  return narrowed ? "filtered" : "all"
}

function escapeCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

function cell(payment: Payment, column: ExportColumn): string {
  switch (column) {
    case "id":
      return payment.id
    case "created_at":
      return payment.createdAt
    case "merchant":
      return merchantById(payment.merchantId)?.name ?? payment.merchantId
    case "description":
      return payment.description
    case "status":
      return payment.status
    case "method":
      return payment.method
    case "card_brand":
      return payment.cardBrand ?? ""
    case "last4":
      return payment.last4 ?? ""
    case "amount":
      return formatMoney(payment.amount, payment.currency)
    case "currency":
      return payment.currency
  }
}

export function toCsv(
  payments: Payment[],
  columns: readonly ExportColumn[] = EXPORT_COLUMNS,
): string {
  const header = columns.join(",")
  const rows = payments.map((payment) =>
    columns.map((column) => escapeCell(cell(payment, column))).join(","),
  )
  return [header, ...rows].join("\n")
}

/** UTC date, with an optional scope label: payments-disputed-2026-08-13.csv */
export function exportFilename(date = new Date(), label?: string): string {
  const prefix = label ? `payments-${label}` : "payments"
  return `${prefix}-${date.toISOString().slice(0, 10)}.csv`
}
