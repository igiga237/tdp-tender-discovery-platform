import { useState, useEffect } from "react";
import axios from "axios";

// Interface defining the structure of a Tender object
interface Tender {
  id: string;
  title: string;
  description: string;
  submission_deadline: string;
  budget_min: number;
  budget_max: number;
  status: string;
}

// State variables for search criteria
const TenderSearch = () => {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState("");
  const [deadlineFrom, setDeadlineFrom] = useState("");
  const [deadlineTo, setDeadlineTo] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [sortBy, setSortBy] = useState("relevance");
  const [order, setOrder] = useState("asc");

  // State to store fetched tenders
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

    // Mock authentication check
  const isAuthenticated = true;


   // Fetch tenders when search criteria change, with debounce effect
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchTenders();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [query, category, location, status, deadlineFrom, deadlineTo, budgetMin, budgetMax, sortBy, order]);


    // Fetch from API
  const fetchTenders = async () => {
    setLoading(true);
    setError("");
    try {
      const API_PORT = process.env.REACT_APP_BACKEND_PORT || 3000;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const response = await axios.get(`http://localhost:${API_PORT}/api/v1/tenders/search`, {
        params: {
          query: encodeURIComponent(query),
          category,
          location: encodeURIComponent(location),
          status,
          deadline_from: deadlineFrom,
          deadline_to: deadlineTo,
          budget_min: budgetMin,
          budget_max: budgetMax,
          sort_by: sortBy,
          order,
        },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      setTenders(response.data.tenders || []);
    } catch (error: any) {
      if (error.name === "AbortError") {
        setError("Search timed out after 2 seconds. Please try again.");
      } else {
        setError(error.response?.data?.message || "Failed to fetch tenders");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <p className="text-red-500">Please login to access tender search</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Search for Tenders</h1>
      <input
        type="text"
        placeholder="Search for tenders..."
        className="border p-2 rounded w-full mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {/* Search filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <select className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Select Category</option>
          <option value="construction">Construction</option>
          <option value="it">IT Services</option>
          <option value="healthcare">Healthcare</option>
        </select>
        <input type="text" placeholder="Location" className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" value={location} onChange={(e) => setLocation(e.target.value)} />
        <select className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Select Status</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
          <option value="awarded">Awarded</option>
        </select>
        <input type="date" className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" value={deadlineFrom} onChange={(e) => setDeadlineFrom(e.target.value)} />
        <input type="date" className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" value={deadlineTo} onChange={(e) => setDeadlineTo(e.target.value)} />
        <input type="number" placeholder="Min Budget" className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} />
        <input type="number" placeholder="Max Budget" className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} />
        <select className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="relevance">Relevance</option>
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="highest_budget">Highest Budget</option>
          <option value="lowest_budget">Lowest Budget</option>
        </select>
        <select className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" value={order} onChange={(e) => setOrder(e.target.value)}>
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </div>
       {/* Display search results */}
      <div className="mt-6">
        {loading && <p className="text-gray-500">Loading tenders...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {tenders.length === 0 && !loading && <p className="text-gray-500">No results found.</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tenders.map((tender) => (
            <div key={tender.id} className="border p-4 rounded shadow-sm hover:shadow-md transition-shadow">
              <h2 className="text-xl font-bold text-blue-600">{tender.title}</h2>
              <p className="text-gray-700">{tender.description}</p>
              <p className="text-sm"><strong>Deadline:</strong> {tender.submission_deadline}</p>
              <p className="text-sm"><strong>Budget:</strong> ${tender.budget_min} - ${tender.budget_max}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TenderSearch;