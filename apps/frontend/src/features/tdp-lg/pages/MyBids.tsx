import React, { useState, useEffect } from "react";
import io from 'socket.io-client';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface Bid { // Interface for a bid object
  id: string | number;
  title: string;
  tenderName: string;
  submissionDate: string;
  status: "Pending" | "Under Review" | "Accepted" | "Rejected" | "Awarded";
  lastUpdated: string;
}

interface UpdatedBid { // Interface for real-time bid updates
  bid_id?: string;
  bid_status?: string;
  [key: string]: any;
}

const MyBids: React.FC = () => {
  const [bids, setBids] = useState<Bid[]>([]);
  const [allBids, setAllBids] = useState<Bid[]>([]);
  const [filteredBids, setFilteredBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [connected, setConnected] = useState<boolean>(false);
  const [bidEvents, setBidEvents] = useState<string[]>([]);

  const formatStatus = (status: string): string => { // Normalizes bid status to ensure case-insensitive comparisons.
    switch (status.toLowerCase()) {
      case "pending":
        return "Pending";
      case "under review":
        return "Under Review";
      case "approved":
        return "Approved";
      case "rejected":
        return "Rejected";
      case "awarded":
        return "Awarded";
      default:
        return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase(); 
    }
  };  
  
  const bidCounts = { // Calculates bid statistics for the dashboard.
    Pending: filteredBids.filter((b) => formatStatus(b.status) === "Pending").length,
    "Under Review": filteredBids.filter((b) => formatStatus(b.status) === "Under Review").length,
    Accepted: filteredBids.filter((b) => formatStatus(b.status) === "Accepted").length,
    Rejected: filteredBids.filter((b) => formatStatus(b.status) === "Rejected").length,
    Awarded: filteredBids.filter((b) => formatStatus(b.status) === "Awarded").length,
  };
  
  const totalBids =
    bidCounts.Pending +
    bidCounts["Under Review"] +
    bidCounts.Accepted +
    bidCounts.Rejected +
    bidCounts.Awarded;

  const getPercentage = (count: number) =>
    totalBids > 0 ? ((count / totalBids) * 100).toFixed(1) : "0";

  const statusColors: Record<string, string> = {
    Total: "bg-gray-200",
    Pending: "bg-yellow-100",
    "Under Review": "bg-blue-100",
    Accepted: "bg-green-100",
    Rejected: "bg-red-100",
    Awarded: "bg-purple-100",
  };

  // State for filter section visibility
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Function to clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("");
    setStartDate("");
    setEndDate("");
    setSortKey("submissionDate");
    setSortOrder("asc");
    setFilteredBids(allBids);
  };
  const fetchBids = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");

      if (!token) {
        setError("You must be logged in to view your bids.");
        setLoading(false);
        return;
      }

      const response = await fetch("http://localhost:3000/api/v1/bids", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: Failed to fetch bids`);
      }

      const data = await response.json();
      console.log("Raw response data:", data);

      const rawBids = data.bids || [];

      const mappedBids = rawBids.map((row: any) => ({ // Map database fields to frontend fields
        id: row.bid_id,
        title: row.bid_title,
        tenderName: row.tender_ref,
        submissionDate: row.submission_date,
        status: row.bid_status,
        lastUpdated: row.last_updated_date,
      }));

      console.log("Mapped bids:", mappedBids); 
      setAllBids(mappedBids);
      setFilteredBids(mappedBids);
    } catch (err) {
      setError("Error fetching bids. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchBids();
  }, []);
  useEffect(() => {
    const token = localStorage.getItem("access_token") || "";

    // Connect to socket
    const socket = io("http://localhost:3000", {
      transports: ["websocket"],
      query: { token },
    });

    // Handle connection status
    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
      setConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
      setConnected(false);
    });

    // Handle bid events
    const handleBidInserted = (data: { bid: UpdatedBid }) => {
      if (!data.bid) return;
      console.log("bidInserted event:", data.bid);
      toast.info(`New bid inserted: ${data.bid.bid_id}`);
      setBidEvents((prev) => [`INSERT => ID: ${data.bid.bid_id}`, ...prev]);
      fetchBids();
    };

    const handleBidUpdated = (data: { bid: UpdatedBid }) => {
      if (!data.bid) return;
      console.log("bidUpdated event:", data.bid);
      toast.info(`Bid updated: ${data.bid.bid_id} => ${data.bid.bid_status}`);
      setBidEvents((prev) => [
        `UPDATE => ID: ${data.bid.bid_id}, status: ${data.bid.bid_status}`,
        ...prev,
      ]);
      fetchBids();
    };

    const handleBidDeleted = (data: { bid: UpdatedBid }) => {
      if (!data.bid) return;
      console.log("bidDeleted event:", data.bid);
      toast.error(`Bid deleted: ${data.bid.bid_id}`);
      setBidEvents((prev) => [`DELETE => ID: ${data.bid.bid_id}`, ...prev]);
      fetchBids();
    };

    socket.on("bidInserted", handleBidInserted);
    socket.on("bidUpdated", handleBidUpdated);
    socket.on("bidDeleted", handleBidDeleted);

    return () => {
      socket.off("bidInserted", handleBidInserted);
      socket.off("bidUpdated", handleBidUpdated);
      socket.off("bidDeleted", handleBidDeleted);
      socket.disconnect();
    };
  }, []);

  // Filtering State
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Sorting State
  const [sortKey, setSortKey] = useState<string>("submissionDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const handleFilter = () => {
    let filtered = [...allBids];
  
    if (statusFilter) {
      filtered = filtered.filter((bid) => bid.status === statusFilter);
    }
  
    if (startDate && endDate) {
      filtered = filtered.filter(
        (bid) =>
          new Date(bid.submissionDate) >= new Date(startDate) &&
          new Date(bid.submissionDate) <= new Date(endDate)
      );
    }
  
    if (searchQuery) {
      filtered = filtered.filter((bid) =>
        bid.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
  
    console.log("Filtered bids:", filtered);
    const sortedFilteredBids = sortBids(filtered);
    setFilteredBids(sortedFilteredBids);
    setShowFilters(false);
  };

  // Sorting Function
  const sortBids = (bidsToSort: Bid[]) => {
    return [...bidsToSort].sort((a, b) => {
      let comparison = 0;
  
      if (sortKey === "submissionDate" || sortKey === "lastUpdated") {
        comparison = new Date(a[sortKey]).getTime() - new Date(b[sortKey]).getTime();
      } else if (sortKey === "status") {
        comparison = a.status.localeCompare(b.status);
      }
  
      return sortOrder === "asc" ? comparison : -comparison;
    });
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">My Bids</h1>
      <div className="grid grid-cols-6 gap-4 mb-6">
        {/* Total Section */}
        <div className={`p-4 rounded-lg text-center shadow bg-gray-200`}>
          <p className="text-lg font-semibold">Total</p>
          <p className="text-3xl font-bold">{totalBids}</p>
          <p className="text-sm text-gray-600">100%</p>
        </div>

        {/* Dynamic Status Sections */}
        {Object.entries(bidCounts).map(([status, count]) => (
          <div
            key={status}
            className={`p-4 rounded-lg text-center shadow ${statusColors[status]}`}
          >
            <p className="text-lg font-semibold">{status}</p>
            <p className="text-3xl font-bold">{count}</p>
            <p className="text-sm text-gray-600">{getPercentage(count)}%</p>
          </div>
        ))}
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search bids by title and hit apply (in Filters)."
          className="border p-2 rounded-md w-full"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Filters Toggle Button */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="bg-gray-200 px-4 py-2 rounded-md flex items-center"
        >
          ⚙️ Filters
        </button>
          <button
            onClick={clearFilters}
            className="text-red-500 hover:underline"
          >
            Clear Filters
          </button>
      </div>

      {/* Filters Section (Collapsible) */}
      {showFilters && (
        <div className="mb-4 flex flex-wrap items-end gap-6 bg-gray-100 p-4 rounded-lg">
          {/* Status Filter */}
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">Bid Status</label>
            <select
              className="border p-2 rounded-md"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Under Review">Under Review</option>
              <option value="Accepted">Accepted</option>
              <option value="Rejected">Rejected</option>
              <option value="Awarded">Awarded</option>
            </select>
          </div>

          {/* Date Range Filter */}
          <div className="flex items-center gap-2">
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">Start Date</label>
              <input
                type="date"
                className="border p-2 rounded-md"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <span className="text-gray-600 font-medium mt-5">to</span>

            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">End Date</label>
              <input
                type="date"
                className="border p-2 rounded-md"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Sorting Section */}
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">Sort By</label>
            <select
              className="border p-2 rounded-md"
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value)}
            >
              <option value="submissionDate">Submission Date</option>
              <option value="lastUpdated">Last Updated</option>
              <option value="status">Bid Status</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">Order</label>
            <select
              className="border p-2 rounded-md"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
      
          {/* Apply Filters & Close Button */}
          <div className="flex justify-between w-full mt-4">
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded-lg"
              onClick={handleFilter}
            >
              Apply Filters
            </button>
            <button
              className="text-gray-500 underline"
              onClick={() => setShowFilters(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Table and Bid Data */}
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Bid Title</th>
            <th className="border p-2">Tender Name</th>
            <th className="border p-2">Submission Date</th>
            <th className="border p-2">Status</th>
            <th className="border p-2">Last Updated</th>
          </tr>
        </thead>
        <tbody>
          {filteredBids.length === 0 ? (
            <tr>
              <td colSpan={5} className="text-center p-4 text-gray-600 text-lg font-medium">
                {allBids.length === 0 ? (
                  <>
                    You haven't submitted any bids yet.{" "}
                    <span className="text-blue-500 cursor-pointer hover:underline">
                      Start bidding now!
                    </span>
                  </>
                ) : (
                  <>No matching bids found.</>
                )}
              </td>
            </tr>
          ) : (
            filteredBids.map((bid) => (
              <tr key={bid.id} className="text-center">
                <td className="border p-2">{bid.title}</td>
                <td className="border p-2">{bid.tenderName}</td>
                <td className="border p-2">{bid.submissionDate}</td>
                <td className="border p-2">
                  <span
                    className={`px-2 py-1 rounded-md text-white text-sm font-medium ${getStatusColor(
                      bid.status.toLowerCase()
                    )}`}
                  >
                    {formatStatus(bid.status)}
                  </span>
                </td>
                <td className="border p-2">{bid.lastUpdated}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case "pending":
      return "bg-yellow-500";
    case "under review":
      return "bg-blue-500";
    case "accepted":
      return "bg-green-500";
    case "rejected":
      return "bg-red-500";
    case "awarded":
      return "bg-purple-500";
    default:
      return "bg-gray-500";
  }
}

export default MyBids;
