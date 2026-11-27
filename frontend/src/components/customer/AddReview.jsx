import { CheckIcon, StarIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import reviewService from "../../services/reviewService";
import Button from "../common/Button";

const AddReview = ({
  requestId,
  mechanicId,
  mechanicName,
  onClose,
  onSuccess,
}) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape" && !submitting) onClose();
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose, submitting]);

  const handleRatingChange = (newRating) => {
    setRating(newRating);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    try {
      setSubmitting(true);

      const reviewData = {
        serviceRequestId: requestId,
        mechanicId,
        rating,
        comment: `Rated ${rating} stars`,
      };

      const response = await reviewService.submitReview(reviewData);

      if (response.success) {
        toast.success("Review submitted successfully!");
        onSuccess && onSuccess(response.data);
        onClose();
      } else {
        toast.error(response.message || "Failed to submit review");
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error(error.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, index) => {
      const starValue = index + 1;
      const isFilled = starValue <= (hoveredRating || rating);

      return (
        <button
          key={index}
          type="button"
          onClick={() => handleRatingChange(starValue)}
          onMouseEnter={() => setHoveredRating(starValue)}
          onMouseLeave={() => setHoveredRating(0)}
          className="transform transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900 focus-visible:ring-offset-2 hover:scale-110"
        >
          <StarIcon
            className={`h-12 w-12 transition-all duration-200 ${
              isFilled
                ? "text-warning-400 fill-current drop-shadow-card-hover"
                : "text-secondary-300 hover:text-warning-200"
            }`}
          />
        </button>
      );
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div
        className="bg-white rounded-2xl max-w-md w-full shadow-modal transform transition-all duration-300 scale-100"
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-dialog-title"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <h2 id="review-dialog-title" className="text-xl font-bold">
              Rate Your Experience
            </h2>
            <button
              onClick={onClose}
              aria-label="Close review dialog"
              className="text-white hover:text-primary-100 transition-colors duration-200 p-2 rounded-full hover:bg-white hover:bg-opacity-20"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Stars */}
            <div className="text-center">
              <div className="flex justify-center space-x-4 mb-6">
                {renderStars()}
              </div>

              {rating > 0 && (
                <div className="text-lg font-semibold text-ink">
                  {rating}/5 stars
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={submitting}
                className="px-6 py-3"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={submitting}
                icon={!submitting && <CheckIcon className="h-5 w-5" />}
                disabled={rating === 0}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {submitting ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddReview;
