"use client"

import { Button } from "@/components/Button"
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/Drawer"
import type { ExportColumn, ExportScope } from "@/lib/csv"
import { Download } from "lucide-react"
import { useEffect, useState } from "react"

const COLUMN_LABELS: Record<ExportColumn, string> = {
  id: "Payment ID",
  created_at: "Date (UTC)",
  merchant: "Merchant",
  description: "Description",
  status: "Status",
  method: "Method",
  card_brand: "Card brand",
  last4: "Card last four",
  amount: "Amount",
  currency: "Currency",
}

type Count =
  { state: "loading" } | { state: "ready"; total: number } | { state: "error" }

/**
 * Export options for the payments table (NWP-101).
 *
 * The browser only chooses; the export route checks the columns and scope
 * again and builds the file from the shared query builder, so every matching
 * row ships, not just the page on screen. The row count comes from
 * GET /api/payments, which runs the same filters.
 */
export function ExportDialog({
  columns,
  defaultColumns,
  filterQuery,
}: {
  /** Every exportable column, in file order. */
  columns: readonly ExportColumn[]
  /** Columns ticked when the dialog opens. Excludes the card last four. */
  defaultColumns: readonly ExportColumn[]
  /** The table's current filters as a query string, without `page`. */
  filterQuery: string
}) {
  const [open, setOpen] = useState(false)
  const [scope, setScope] = useState<ExportScope>("filter")
  const [selected, setSelected] = useState<Set<ExportColumn>>(
    () => new Set(defaultColumns),
  )
  const [count, setCount] = useState<Count>({ state: "loading" })

  const scopeQuery = scope === "all" ? "" : filterQuery

  useEffect(() => {
    if (!open) return
    const controller = new AbortController()
    setCount({ state: "loading" })
    fetch(`/api/payments?${scopeQuery}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(String(response.status))
        return response.json() as Promise<{ total: number }>
      })
      .then(({ total }) => setCount({ state: "ready", total }))
      .catch((error: unknown) => {
        if ((error as Error).name !== "AbortError") setCount({ state: "error" })
      })
    return () => controller.abort()
  }, [open, scopeQuery])

  // Keep the file's column order fixed, whatever order boxes were ticked in.
  const chosen = columns.filter((column) => selected.has(column))
  const canDownload = chosen.length > 0

  const params = new URLSearchParams(scopeQuery)
  params.set("scope", scope)
  params.set("columns", chosen.join(","))
  const href = `/api/payments/export?${params.toString()}`

  const toggle = (column: ExportColumn, checked: boolean) => {
    setSelected((current) => {
      const next = new Set(current)
      if (checked) next.add(column)
      else next.delete(column)
      return next
    })
  }

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) {
          // Each export starts from the safe defaults.
          setScope("filter")
          setSelected(new Set(defaultColumns))
        }
      }}
    >
      <DrawerTrigger asChild>
        <Button variant="secondary" className="w-full gap-2 py-1.5 sm:w-fit">
          <Download
            className="-ml-0.5 size-4 shrink-0 text-gray-400 dark:text-gray-600"
            aria-hidden="true"
          />
          Export
        </Button>
      </DrawerTrigger>

      <DrawerContent className="sm:max-w-md">
        <DrawerHeader>
          <DrawerTitle>Export payments</DrawerTitle>
          <DrawerDescription>
            Choose which payments and columns go into the CSV file.
          </DrawerDescription>
        </DrawerHeader>

        <DrawerBody className="flex flex-col gap-6">
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium text-gray-900 dark:text-gray-50">
              Payments
            </legend>
            {(
              [
                [
                  "filter",
                  "Current filter",
                  "The payments matching the table's filters, across every page.",
                ],
                ["all", "All payments", "Every payment, ignoring the filters."],
              ] as const
            ).map(([value, label, hint]) => (
              <label
                key={value}
                htmlFor={`export-scope-${value}`}
                className="flex cursor-pointer items-start gap-2 text-sm"
              >
                <input
                  id={`export-scope-${value}`}
                  type="radio"
                  name="export-scope"
                  value={value}
                  checked={scope === value}
                  onChange={() => setScope(value)}
                  className="mt-0.5 size-4 accent-blue-600"
                />
                <span className="flex flex-col">
                  <span className="text-gray-900 dark:text-gray-50">
                    {label}
                  </span>
                  <span className="text-gray-500">{hint}</span>
                </span>
              </label>
            ))}
            <p
              className="mt-1 text-sm tabular-nums text-gray-700 dark:text-gray-300"
              aria-live="polite"
            >
              {count.state === "loading" && "Counting payments…"}
              {count.state === "ready" &&
                `${count.total.toLocaleString()} ${count.total === 1 ? "payment" : "payments"} will be exported.`}
              {count.state === "error" &&
                "Couldn't count the payments. The download still works."}
            </p>
          </fieldset>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium text-gray-900 dark:text-gray-50">
              Columns
            </legend>
            <div className="-mt-1 mb-1 flex gap-3 text-sm">
              <button
                type="button"
                className="text-blue-600 hover:underline dark:text-blue-500"
                onClick={() => setSelected(new Set(columns))}
              >
                Select all
              </button>
              <button
                type="button"
                className="text-blue-600 hover:underline dark:text-blue-500"
                onClick={() => setSelected(new Set())}
              >
                Clear
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {columns.map((column) => (
                <label
                  key={column}
                  htmlFor={`export-column-${column}`}
                  className="flex cursor-pointer items-center gap-2 text-sm text-gray-900 dark:text-gray-50"
                >
                  <input
                    id={`export-column-${column}`}
                    type="checkbox"
                    checked={selected.has(column)}
                    onChange={(event) => toggle(column, event.target.checked)}
                    className="size-4 accent-blue-600"
                  />
                  {COLUMN_LABELS[column]}
                </label>
              ))}
            </div>
            {selected.has("last4") && (
              <p className="text-sm text-amber-700 dark:text-amber-500">
                Card last four is included. Remove it before sending this file
                to a merchant.
              </p>
            )}
            {!canDownload && (
              <p className="text-sm text-gray-500">
                Choose at least one column to download.
              </p>
            )}
          </fieldset>
        </DrawerBody>

        <DrawerFooter className="gap-2">
          <DrawerClose asChild>
            <Button variant="secondary" className="w-full sm:w-fit">
              Cancel
            </Button>
          </DrawerClose>
          {canDownload ? (
            <Button asChild className="w-full sm:w-fit">
              <a href={href} onClick={() => setOpen(false)} download>
                Download CSV
              </a>
            </Button>
          ) : (
            <Button disabled className="w-full sm:w-fit">
              Download CSV
            </Button>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
