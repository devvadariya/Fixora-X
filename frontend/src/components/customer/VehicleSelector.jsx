import {
  ChevronDownIcon,
  PlusIcon,
  TruckIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import customerApi from "../../api/customerApi";

const VehicleSelector = ({
  selectedVehicle,
  onVehicleSelect,
  showAddOption = true,
  placeholder = "Select a vehicle",
  className = "",
}) => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const response = await customerApi.getVehicles();
      if (response.success) {
        setVehicles(response.data);
      }
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      toast.error("Failed to load vehicles");
    } finally {
      setLoading(false);
    }
  };

  const handleVehicleSelect = (vehicle) => {
    onVehicleSelect(vehicle);
    setIsOpen(false);
  };

  const getVehicleDisplayName = (vehicle) => {
    return `${vehicle.name} (${vehicle.make} ${vehicle.model} - ${vehicle.plate})`;
  };

  const getVehicleTypeIcon = (type) => {
    return <TruckIcon className="h-4 w-4" />;
  };

  return (
    <div className={`relative ${className}`}>
      <div
        className="w-full cursor-pointer rounded-md border border-hairline bg-white px-3 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900 focus-visible:ring-offset-0 focus:border-primary-900"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {selectedVehicle ? (
              <>
                {getVehicleTypeIcon(selectedVehicle.type)}
                <span className="text-sm">
                  {getVehicleDisplayName(selectedVehicle)}
                </span>
                {selectedVehicle.isDefault && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-warning-50 text-warning-700">
                    Default
                  </span>
                )}
              </>
            ) : (
              <span className="text-secondary-500">{placeholder}</span>
            )}
          </div>
          <ChevronDownIcon
            className={`h-4 w-4 text-secondary-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-hairline rounded-md shadow-card-hover max-h-60 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-secondary-500">
              Loading vehicles...
            </div>
          ) : vehicles.length === 0 ? (
            <div className="p-4 text-center text-secondary-500">
              No vehicles saved
              {showAddOption && (
                <div className="mt-2">
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      // Navigate to vehicle management page
                      window.location.href = "/customer/vehicles";
                    }}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    Add a vehicle
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="py-1">
              {vehicles.map((vehicle) => (
                <div
                  key={vehicle._id}
                  className="px-4 py-2 hover:bg-surface cursor-pointer border-b border-hairline-soft last:border-b-0"
                  onClick={() => handleVehicleSelect(vehicle)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getVehicleTypeIcon(vehicle.type)}
                      <div>
                        <div className="font-medium text-sm">
                          {vehicle.name}
                        </div>
                        <div className="text-xs text-secondary-500">
                          {vehicle.make} {vehicle.model} ({vehicle.year}) -{" "}
                          {vehicle.plate}
                        </div>
                      </div>
                    </div>
                    {vehicle.isDefault && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-warning-50 text-warning-700">
                        Default
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {showAddOption && (
                <div className="px-4 py-2 border-t border-hairline">
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      // Navigate to vehicle management page
                      window.location.href = "/customer/vehicles";
                    }}
                    className="flex items-center gap-2 text-primary-600 hover:text-primary-700 text-sm font-medium w-full"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Add New Vehicle
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
};

export default VehicleSelector;
