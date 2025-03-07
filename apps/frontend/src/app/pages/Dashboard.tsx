import React, { useState, useMemo } from "react"

// 1. interface for your tender items
interface Tender {
  id: string
  title: string
  submissionDate: string // ISO date string
  status: "Pending" | "Approved" | "Rejected"
  updatedAt: string // ISO date string
}

// 2. Hardcode an initial list of tenders
const initialTenders: Tender[] = [
  {
    id: "1",
    title: "Build a Website",
    submissionDate: "2025-02-20T10:00:00Z",
    status: "Pending",
    updatedAt: "2025-02-20T11:00:00Z",
  },
  {
    id: "2",
    title: "Mobile App for HR",
    submissionDate: "2025-02-18T09:00:00Z",
    status: "Approved",
    updatedAt: "2025-02-19T08:00:00Z",
  },
  {
    id: "3",
    title: "Data Analytics Project",
    submissionDate: "2025-02-21T14:30:00Z",
    status: "Rejected",
    updatedAt: "2025-02-21T15:00:00Z",
  },
]

const Dashboard: React.FC = () => {
  // 3. Local state for data & filters
  const [tenders] = useState<Tender[]>(initialTenders)
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [sortField, setSortField] = useState<"submissionDate" | "status" | "updatedAt">("submissionDate")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [error, setError] = useState<string>("")

  // 4. Computed filtering & sorting
  const filteredTenders = useMemo(() => {
    try {
      let results = [...tenders]

      // (A) Filter by status
      if (statusFilter) {
        results = results.filter((t) => t.status === statusFilter)
      }

      // (B) Filter by date range
      if (startDate || endDate) {
        results = results.filter((t) => {
          const submissionTime = new Date(t.submissionDate).getTime()
          if (startDate) {
            const startTime = new Date(startDate).getTime()
            if (submissionTime < startTime) return false
          }
          if (endDate) {
            const endTime = new Date(endDate).getTime()
            if (submissionTime > endTime) return false
          }
          return true
        })
      }

      // (C) Sorting
      results.sort((a, b) => {
        const valA = new Date(a[sortField]).getTime()
        const valB = new Date(b[sortField]).getTime()
        return sortOrder === "asc" ? valA - valB : valB - valA
      })

      return results
    } catch (err: any) {
      console.error("Error filtering tenders:", err)
      setError("Error filtering tenders")
      return []
    }
  }, [tenders, statusFilter, startDate, endDate, sortField, sortOrder])

  const handleRefresh = () => {
    // Clears errors or would re-fetch if you had a real server
    setError("")
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4">My Tenders</h1>

      {/* FILTERS (stack on small screens, side-by-side on bigger) */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-4 mb-4">
        {/* Status Filter */}
        <div className="flex flex-col">
          <label className="block font-semibold">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1"
          >
            <option value="">All</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        {/* Start Date */}
        <div className="flex flex-col">
          <label className="block font-semibold">Start Date:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1"
          />
        </div>

        {/* End Date */}
        <div className="flex flex-col">
          <label className="block font-semibold">End Date:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1"
          />
        </div>

        {/* Sort Field */}
        <div className="flex flex-col">
          <label className="block font-semibold">Sort By:</label>
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value as any)}
            className="border border-gray-300 rounded px-2 py-1"
          >
            <option value="submissionDate">Submission Date</option>
            <option value="status">Status</option>
            <option value="updatedAt">Last Updated</option>
          </select>
        </div>

        {/* Sort Order */}
        <div className="flex flex-col">
          <label className="block font-semibold">Order:</label>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
            className="border border-gray-300 rounded px-2 py-1"
          >
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>
        </div>

        {/* Refresh Button */}
        <div className="flex flex-col justify-end">
          <button
            onClick={handleRefresh}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* ERROR HANDLING */}
      {error && <p className="text-red-500 font-semibold mb-2">{error}</p>}

      {/* TENDERS TABLE (Responsive) */}
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto border border-gray-300 text-sm sm:text-base">
          <thead>
            <tr className="bg-gray-200 text-left">
              <th className="px-4 py-2 w-1/3">Title</th>
              <th className="px-4 py-2 w-1/4">Submission Date</th>
              <th className="px-4 py-2 w-1/6">Status</th>
              <th className="px-4 py-2 w-1/4">Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {filteredTenders.map((tender) => (
              <tr key={tender.id} className="border-t border-gray-300">
                <td className="px-4 py-2">{tender.title}</td>
                <td className="px-4 py-2">
                  {new Date(tender.submissionDate).toLocaleDateString()}
                </td>
                <td className="px-4 py-2">{tender.status}</td>
                <td className="px-4 py-2">
                  {new Date(tender.updatedAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Dashboard
