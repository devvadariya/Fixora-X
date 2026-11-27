import {
  ChatBubbleLeftIcon,
  ClockIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  MapIcon,
  MapPinIcon,
  PhoneIcon,
  StarIcon,
  ViewColumnsIcon,
} from "@heroicons/react/24/outline";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import ChatModal from "../../components/chat/ChatModal";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import customerService from "../../services/customerService";
import { formatDistance } from "../../utils/helpers";

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

// Custom icons for better visibility
const userLocationIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const mechanicIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const availableMechanicIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [30, 46],
  iconAnchor: [15, 46],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const MechanicDiscovery = () => {
  const navigate = useNavigate();
  const [mechanics, setMechanics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("card"); // 'card' or 'map'
  const [selectedMechanic, setSelectedMechanic] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatMechanic, setChatMechanic] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    rating: "",
    distance: "all", // Default to 'all' so all mechanics are immediately discoverable
    sortBy: "distance",
  });

  const fetchMechanics = useCallback(async () => {
    try {
      setLoading(true);

      // Get user location first - ensure we have it before proceeding
      let currentLocation = userLocation;
      if (!currentLocation) {
        try {
          currentLocation = await getCurrentPosition();
          setUserLocation(currentLocation);
          setLocationError(null);
        } catch (error) {
          console.log("Using default location due to error:", error.message);
          // Use default location (Bangalore / Demo Workshop) if geolocation fails
          currentLocation = {
            latitude: 12.9716,
            longitude: 77.5946,
          };
          setUserLocation(currentLocation);
          setLocationError(error.message);
          toast.warning(
            "Using default location. Enable location services for better results.",
          );
        }
      }

      // Validate location data
      if (!currentLocation.latitude || !currentLocation.longitude) {
        throw new Error(
          "Unable to get your location. Please enable location services.",
        );
      }

      const params = {
        ...filters,
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        maxDistance: filters.distance,
      };

      console.log("Fetching mechanics with params:", params);
      const response = await customerService.getNearbyMechanics(params);

      if (response.success) {
        setMechanics(response.data.mechanics || []);
      }
    } catch (error) {
      console.error("Error fetching mechanics:", error);
      const errorMessage = error.message || "Failed to fetch nearby mechanics";
      toast.error(errorMessage);
      setMechanics([]);
    } finally {
      setLoading(false);
    }
  }, [filters, userLocation]);

  const getCurrentPosition = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by your browser"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("Location obtained:", position.coords);
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          let errorMessage = "Unable to get your location";

          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage =
                "Location permission denied. Please enable location services.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information unavailable.";
              break;
            case error.TIMEOUT:
              errorMessage = "Location request timed out.";
              break;
            default:
              errorMessage =
                "An unknown error occurred while getting location.";
          }

          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        },
      );
    });
  };

  useEffect(() => {
    fetchMechanics();
  }, [fetchMechanics]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleViewDetails = (mechanic) => {
    setSelectedMechanic(mechanic);
    setShowDetailsModal(true);
  };

  const handleBookService = (mechanic) => {
    // Navigate to booking page with mechanic pre-selected
    console.log("Navigating to book service with mechanic:", mechanic._id);
    const url = `/customer/book-service?mechanicId=${mechanic._id}`;
    console.log("Navigation URL:", url);
    navigate(url);
  };

  const handleStartChat = (mechanic) => {
    setChatMechanic(mechanic);
    setShowChatModal(true);
  };

  const getRatingStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <StarIcon
          key={i}
          className={`h-4 w-4 ${
            i <= rating ? "text-warning-500 fill-current" : "text-secondary-300"
          }`}
        />,
      );
    }
    return stars;
  };

  const getStatusBadge = (isAvailable) => {
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
          isAvailable
            ? "bg-success-50 text-success-700"
            : "bg-danger-50 text-danger-700"
        }`}
      >
        {isAvailable ? "Available" : "Busy"}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.04em] text-ink">
            Find mechanics
          </h1>
          <p className="text-sm text-secondary-600">
            Discover mechanics{" "}
            {filters.distance === "all"
              ? "at all distances"
              : `within ${filters.distance}km`}{" "}
            of your location
          </p>
          {locationError && (
            <p className="mt-1 text-sm text-warning-700">
              ⚠️ Using default location: {locationError}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === "card" ? "primary" : "secondary"}
            onClick={() => setViewMode("card")}
          >
            <ViewColumnsIcon className="h-4 w-4 mr-2" />
            Card View
          </Button>
          <Button
            variant={viewMode === "map" ? "primary" : "secondary"}
            onClick={() => setViewMode("map")}
          >
            <MapIcon className="h-4 w-4 mr-2" />
            Map View
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-hairline bg-white p-6 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium text-ink">Filters</h2>
          <div className="flex items-center space-x-2">
            <Button
              variant="secondary"
              onClick={async () => {
                setUserLocation(null);
                setLocationError(null);
                await fetchMechanics();
              }}
              disabled={loading}
            >
              Update Location
            </Button>
            <Button
              variant="secondary"
              onClick={fetchMechanics}
              disabled={loading}
            >
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            label="Search"
            placeholder="Search by name or services"
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            icon={<MagnifyingGlassIcon className="h-4 w-4" />}
          />

          <Select
            label="Rating"
            value={filters.rating}
            onChange={(e) => handleFilterChange("rating", e.target.value)}
          >
            <option value="">All Ratings</option>
            <option value="4">4+ Stars</option>
            <option value="3">3+ Stars</option>
            <option value="2">2+ Stars</option>
          </Select>

          <Select
            label="Distance"
            value={filters.distance}
            onChange={(e) => handleFilterChange("distance", e.target.value)}
          >
            <option value="5">5 km</option>
            <option value="10">10 km</option>
            <option value="15">15 km</option>
            <option value="20">20 km</option>
            <option value="25">25 km</option>
            <option value="all">All</option>
          </Select>

          <Select
            label="Sort By"
            value={filters.sortBy}
            onChange={(e) => handleFilterChange("sortBy", e.target.value)}
          >
            <option value="distance">Distance</option>
            <option value="rating">Rating</option>
            <option value="completedJobs">Experience</option>
            <option value="name">Name</option>
          </Select>
        </div>
      </div>

      {/* Content */}
      {viewMode === "card" ? (
        /* Card View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mechanics.map((mechanic) => (
            <div
              key={mechanic._id}
              className="overflow-hidden rounded-2xl border border-hairline bg-white shadow-card transition-shadow hover:shadow-soft"
            >
              <div className="p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
                      <span className="text-lg font-semibold text-primary-900">
                        {mechanic.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-ink">
                        {mechanic.name}
                      </h3>
                      <div className="flex items-center">
                        {getRatingStars(mechanic.rating || 0)}
                        <span className="ml-1 text-sm text-secondary-600">
                          ({mechanic.rating?.toFixed(1) || "N/A"})
                        </span>
                      </div>
                    </div>
                  </div>
                  {getStatusBadge(mechanic.isAvailable)}
                </div>

                <div className="mb-4 space-y-2">
                  <div className="flex items-center text-sm text-secondary-600">
                    <MapPinIcon className="mr-2 h-4 w-4" />
                    <span>{formatDistance(mechanic.distance)} away</span>
                  </div>
                  <div className="flex items-center text-sm text-secondary-600">
                    <ClockIcon className="mr-2 h-4 w-4" />
                    <span>{mechanic.completedJobs || 0} jobs completed</span>
                  </div>
                  {mechanic.phone && (
                    <div className="flex items-center text-sm text-secondary-600">
                      <PhoneIcon className="mr-2 h-4 w-4" />
                      <span>{mechanic.phone}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <Button
                    variant="secondary"
                    onClick={() => handleViewDetails(mechanic)}
                    className="flex-1"
                  >
                    <EyeIcon className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleStartChat(mechanic)}
                    className="flex-1"
                  >
                    <ChatBubbleLeftIcon className="h-4 w-4 mr-2" />
                    Chat
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => handleBookService(mechanic)}
                    className="flex-1"
                    disabled={!mechanic.isAvailable}
                  >
                    Book Service
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Map View */
        <div className="overflow-hidden rounded-2xl border border-hairline bg-white shadow-card">
          <div className="h-96">
            <MapContainer
              center={
                userLocation
                  ? [userLocation.latitude, userLocation.longitude]
                  : [40.7128, -74.006]
              }
              zoom={10}
              className="h-full w-full"
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />

              {/* User location marker */}
              {userLocation && (
                <Marker
                  position={[userLocation.latitude, userLocation.longitude]}
                  icon={userLocationIcon}
                >
                  <Popup>
                    <div className="text-center">
                      <strong>Your Location</strong>
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Mechanic markers */}
              {mechanics.map((mechanic) => {
                // Check if mechanic has valid location data
                if (
                  !mechanic.location ||
                  typeof mechanic.location.lat !== "number" ||
                  typeof mechanic.location.lng !== "number"
                ) {
                  console.warn(
                    "Invalid location data for mechanic:",
                    mechanic._id,
                    mechanic.location,
                  );
                  return null;
                }

                return (
                  <Marker
                    key={mechanic._id}
                    position={[mechanic.location.lat, mechanic.location.lng]}
                    icon={
                      mechanic.isAvailable
                        ? availableMechanicIcon
                        : mechanicIcon
                    }
                  >
                    <Popup>
                      <div className="p-2">
                        <h3 className="font-semibold text-ink">
                          {mechanic.name}
                        </h3>
                        <div className="mb-2 flex items-center">
                          {getRatingStars(mechanic.rating || 0)}
                          <span className="ml-1 text-sm text-secondary-600">
                            ({mechanic.rating?.toFixed(1) || "N/A"})
                          </span>
                        </div>
                        <p className="mb-2 text-sm text-secondary-600">
                          {formatDistance(mechanic.distance)} away
                        </p>
                        <p className="mb-3 text-sm text-secondary-600">
                          {mechanic.completedJobs || 0} jobs completed
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewDetails(mechanic)}
                            className="rounded px-2 py-1 text-xs text-white transition-colors bg-primary-900 hover:bg-primary-800"
                          >
                            View Details
                          </button>
                          <button
                            onClick={() => handleStartChat(mechanic)}
                            className="rounded px-2 py-1 text-xs text-white transition-colors bg-brand-purple hover:opacity-90"
                          >
                            Chat
                          </button>
                          <button
                            onClick={() => handleBookService(mechanic)}
                            className="rounded px-2 py-1 text-xs text-white transition-colors bg-success-600 hover:bg-success-700 disabled:opacity-50"
                            disabled={!mechanic.isAvailable}
                          >
                            Book Service
                          </button>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
        </div>
      )}

      {/* Mechanic Details Modal */}
      {showDetailsModal && selectedMechanic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary-900/70 backdrop-blur-sm">
          <div
            className="mx-4 w-full max-w-2xl overflow-y-auto rounded-3xl border border-hairline bg-white shadow-modal"
            style={{ maxHeight: "90vh" }}
          >
            <div className="p-6">
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-semibold tracking-[-0.04em] text-ink">
                    {selectedMechanic.name}
                  </h2>
                  <div className="mt-2 flex items-center">
                    {getRatingStars(selectedMechanic.rating || 0)}
                    <span className="ml-2 text-secondary-600">
                      {selectedMechanic.rating?.toFixed(1) || "N/A"} (
                      {selectedMechanic.completedJobs || 0} jobs)
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="rounded-lg p-1 text-secondary-500 hover:bg-surface hover:text-ink"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <h3 className="mb-3 text-base font-semibold text-ink">
                    Contact Information
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center text-secondary-600">
                      <PhoneIcon className="mr-2 h-4 w-4" />
                      <span>{selectedMechanic.phone || "Not provided"}</span>
                    </div>
                    <div className="flex items-center text-secondary-600">
                      <MapPinIcon className="mr-2 h-4 w-4" />
                      <span>
                        {selectedMechanic.location?.address ||
                          "Location not available"}
                      </span>
                    </div>
                    <div className="flex items-center text-secondary-600">
                      <ClockIcon className="mr-2 h-4 w-4" />
                      <span>
                        {formatDistance(selectedMechanic.distance)} away
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 text-base font-semibold text-ink">
                    Services & Specialties
                  </h3>
                  <div className="space-y-2">
                    {selectedMechanic.specialties?.map((specialty, index) => (
                      <div
                        key={index}
                        className="rounded-full bg-surface px-3 py-1 text-sm text-ink"
                      >
                        {specialty}
                      </div>
                    )) || (
                      <p className="text-secondary-500">
                        No specialties listed
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {selectedMechanic.reviews &&
                selectedMechanic.reviews.length > 0 && (
                  <div className="mt-6">
                    <h3 className="mb-3 text-base font-semibold text-ink">
                      Recent Reviews
                    </h3>
                    <div className="space-y-3">
                      {selectedMechanic.reviews
                        .slice(0, 3)
                        .map((review, index) => (
                          <div
                            key={index}
                            className="border-l-4 border-primary-900 pl-4"
                          >
                            <div className="mb-1 flex items-center">
                              {getRatingStars(review.rating)}
                              <span className="ml-2 text-sm font-medium text-ink">
                                {review.customerName}
                              </span>
                            </div>
                            <p className="text-sm text-secondary-600">
                              {review.comment}
                            </p>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

              <div className="mt-6 flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setShowDetailsModal(false)}
                  className="flex-1"
                >
                  Close
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleStartChat(selectedMechanic)}
                  className="flex-1"
                >
                  <ChatBubbleLeftIcon className="h-4 w-4 mr-2" />
                  Chat
                </Button>
                <Button
                  variant="primary"
                  onClick={() => handleBookService(selectedMechanic)}
                  className="flex-1"
                  disabled={!selectedMechanic.isAvailable}
                >
                  Book Service
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      <ChatModal
        isOpen={showChatModal}
        onClose={() => setShowChatModal(false)}
        mechanic={chatMechanic}
      />
    </div>
  );
};

export default MechanicDiscovery;
