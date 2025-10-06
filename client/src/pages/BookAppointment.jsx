import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  MapPinIcon,
  PhoneIcon,
  GlobeAltIcon,
  ClockIcon,
  StarIcon,
  MagnifyingGlassIcon,
  BuildingOffice2Icon,
  HeartIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import AnimatedButton from "../components/AnimatedButton";
import AnimatedCard from "../components/AnimatedCard";

export default function BookAppointment() {
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [specialty, setSpecialty] = useState("general");
  const [nearbyHospitals, setNearbyHospitals] = useState([]);
  const [loading, setLoading] = useState(false);

  const specialties = [
    { value: "general", label: "General Physician", icon: HeartIcon },
    { value: "cardiology", label: "Cardiology", icon: HeartIcon },
    { value: "orthopedic", label: "Orthopedic", icon: UserGroupIcon },
    { value: "pediatric", label: "Pediatric", icon: UserGroupIcon },
    { value: "dermatology", label: "Dermatology", icon: UserGroupIcon },
    { value: "neurology", label: "Neurology", icon: UserGroupIcon },
    { value: "gynecology", label: "Gynecology", icon: UserGroupIcon },
    { value: "emergency", label: "Emergency Care", icon: BuildingOffice2Icon },
  ];

  useEffect(() => {
    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(location);
          setLocationError(null);

          // Fetch hospitals after getting location
          fetchNearbyHospitals(location.lat, location.lng, specialty);
        },
        (error) => {
          setLocationError(
            "Unable to get your location. Using default location."
          );
          console.error("Location error:", error);
          // Use default location (example: New York City)
          const defaultLocation = { lat: 40.7128, lng: -74.006 };
          setUserLocation(defaultLocation);
          fetchNearbyHospitals(
            defaultLocation.lat,
            defaultLocation.lng,
            specialty
          );
        }
      );
    } else {
      setLocationError("Geolocation is not supported by your browser.");
      // Use default location
      const defaultLocation = { lat: 40.7128, lng: -74.006 };
      setUserLocation(defaultLocation);
      fetchNearbyHospitals(defaultLocation.lat, defaultLocation.lng, specialty);
    }
  }, []);

  useEffect(() => {
    // Fetch hospitals when specialty changes (if we have location)
    if (userLocation) {
      fetchNearbyHospitals(userLocation.lat, userLocation.lng, specialty);
    }
  }, [specialty]);

  const fetchNearbyHospitals = async (
    latitude,
    longitude,
    selectedSpecialty
  ) => {
    setLoading(true);
    try {
      const response = await fetch(
        "http://localhost:5000/api/hospitals/nearby",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            latitude,
            longitude,
            specialty: selectedSpecialty,
            radius: 5000, // 5km radius
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setNearbyHospitals(data.hospitals);
        console.log(
          `Found ${data.hospitals.length} hospitals (Source: ${data.source})`
        );
      } else {
        console.error("Failed to fetch hospitals:", data.message);
        setNearbyHospitals([]);
      }
    } catch (error) {
      console.error("Error fetching nearby hospitals:", error);
      setNearbyHospitals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (userLocation) {
      fetchNearbyHospitals(userLocation.lat, userLocation.lng, specialty);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Book Appointment
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Find nearby hospitals and clinics for your medical needs
        </p>
      </motion.div>

      {/* Location Status */}
      {locationError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-600 p-4"
        >
          <div className="flex">
            <MapPinIcon className="h-5 w-5 text-yellow-400" />
            <p className="ml-3 text-sm text-yellow-700 dark:text-yellow-300">
              {locationError}
            </p>
          </div>
        </motion.div>
      )}

      {/* Search and Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-8"
      >
        <AnimatedCard className="p-6">
          <form onSubmit={handleSearch} className="space-y-4">
            {/* Search Input */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search hospitals by name or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
            </div>

            {/* Specialty Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Specialty
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {specialties.map((spec) => (
                  <button
                    key={spec.value}
                    type="button"
                    onClick={() => setSpecialty(spec.value)}
                    className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                      specialty === spec.value
                        ? "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    <spec.icon className="h-5 w-5" />
                    <span className="text-sm font-medium">{spec.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </form>
        </AnimatedCard>
      </motion.div>

      {/* Results Count */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="mb-4"
      >
        <p className="text-gray-600 dark:text-gray-400">
          Found{" "}
          <span className="font-semibold text-gray-900 dark:text-white">
            {nearbyHospitals.length}
          </span>{" "}
          hospitals near you
        </p>
      </motion.div>

      {/* Hospital List */}
      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          // Loading skeletons
          [...Array(3)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse bg-white dark:bg-gray-800 rounded-lg shadow p-6"
            >
              <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
              <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          ))
        ) : nearbyHospitals.length === 0 ? (
          // No results
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <BuildingOffice2Icon className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No hospitals found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try adjusting your search or specialty filter
            </p>
          </motion.div>
        ) : (
          // Hospital cards
          nearbyHospitals.map((hospital, index) => (
            <motion.div
              key={hospital.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <AnimatedCard className="p-6 hover:shadow-xl transition-shadow">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                  {/* Hospital Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                          {hospital.name}
                        </h3>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <StarIcon
                                key={i}
                                className={`h-4 w-4 ${
                                  i < Math.floor(hospital.rating || 0)
                                    ? "text-yellow-400 fill-current"
                                    : "text-gray-300 dark:text-gray-600"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {hospital.rating || "N/A"}
                          </span>
                          {hospital.totalRatings && (
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              ({hospital.totalRatings} reviews)
                            </span>
                          )}
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            • {hospital.distance}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Address */}
                    <div className="flex items-start gap-2 mb-2 text-gray-600 dark:text-gray-400">
                      <MapPinIcon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <span>{hospital.address}</span>
                    </div>

                    {/* Hours */}
                    <div className="flex items-center gap-2 mb-3 text-gray-600 dark:text-gray-400">
                      <ClockIcon className="h-5 w-5 flex-shrink-0" />
                      <span>{hospital.openHours}</span>
                    </div>

                    {/* Services */}
                    {hospital.services && hospital.services.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {hospital.services.map((service, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full"
                          >
                            {service}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Contact Actions */}
                    <div className="flex flex-wrap gap-3">
                      <a
                        href={`tel:${hospital.phone}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <PhoneIcon className="h-5 w-5" />
                        <span>Call Now</span>
                      </a>
                      <a
                        href={hospital.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <GlobeAltIcon className="h-5 w-5" />
                        <span>Visit Website</span>
                      </a>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          hospital.name + " " + hospital.address
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 transition-colors"
                      >
                        <MapPinIcon className="h-5 w-5" />
                        <span>Get Directions</span>
                      </a>
                    </div>
                  </div>
                </div>
              </AnimatedCard>
            </motion.div>
          ))
        )}
      </div>

      {/* Help Text */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="mt-8 bg-blue-50 rounded-lg p-6"
      >
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          Need Help Booking?
        </h3>
        <p className="text-blue-800 mb-4">
          Click "Call Now" to directly contact the hospital, or "Visit Website"
          to book an appointment online. You can also get directions to navigate
          to the hospital.
        </p>
        <p className="text-sm text-blue-700">
          💡 Tip: For emergencies, call your local emergency number or visit the
          nearest emergency care center.
        </p>
      </motion.div>
    </div>
  );
}
