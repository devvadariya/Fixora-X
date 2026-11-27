import React, { useState, useEffect } from 'react';
import { 
  StarIcon,
  UserIcon,
  CalendarIcon,
  ChatBubbleLeftIcon,
  HandThumbUpIcon,
  HandThumbDownIcon
} from '@heroicons/react/24/outline';
import mechanicApi from '../../api/mechanicApi';
import { formatDate, getRelativeTime } from '../../utils/helpers';
import toast from 'react-hot-toast';

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: {}
  });
  const [filters, setFilters] = useState({
    rating: '',
    sortBy: 'newest'
  });

  useEffect(() => {
    fetchReviews();
  }, [filters]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await mechanicApi.getReviews(filters);
      
      if (response.success) {
        setReviews(response.data.reviews || []);
        setStats(response.data.stats || {
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: {}
        });
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <StarIcon
        key={index}
        className={`h-4 w-4 ${
          index < rating ? 'text-warning-500 fill-current' : 'text-secondary-300'
        }`}
      />
    ));
  };

  const getRatingColor = (rating) => {
    if (rating >= 4) return 'text-success-700';
    if (rating >= 3) return 'text-warning-700';
    return 'text-danger-700';
  };

  const getRatingLabel = (rating) => {
    if (rating >= 4.5) return 'Excellent';
    if (rating >= 4) return 'Very Good';
    if (rating >= 3.5) return 'Good';
    if (rating >= 3) return 'Average';
    if (rating >= 2) return 'Below Average';
    return 'Poor';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-primary-900">Customer Reviews</h1>
        <p className="mt-1 text-secondary-600">See what your customers are saying about your services</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-[24px] border border-hairline bg-white p-6">
          <div className="text-center">
            <div className="text-3xl font-semibold text-primary-900">{stats.averageRating.toFixed(1)}</div>
            <div className="mt-2 flex justify-center">
              {renderStars(Math.round(stats.averageRating))}
            </div>
            <p className="mt-1 text-sm text-secondary-600">{getRatingLabel(stats.averageRating)}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.12em] text-secondary-500">Average Rating</p>
          </div>
        </div>

        <div className="rounded-[24px] border border-hairline bg-white p-6">
          <div className="text-center">
            <div className="text-3xl font-semibold text-primary-900">{stats.totalReviews}</div>
            <p className="mt-1 text-sm text-secondary-600">Total Reviews</p>
          </div>
        </div>

        <div className="rounded-[24px] border border-hairline bg-white p-6">
          <div className="text-center">
            <div className="text-3xl font-semibold text-success-700">
              {stats.totalReviews > 0 ? Math.round((stats.ratingDistribution[5] || 0) / stats.totalReviews * 100) : 0}%
            </div>
            <p className="mt-1 text-sm text-secondary-600">5-Star Reviews</p>
          </div>
        </div>

        <div className="rounded-[24px] border border-hairline bg-white p-6">
          <div className="text-center">
            <div className="text-3xl font-semibold text-primary-900">
              {stats.totalReviews > 0 ? Math.round((stats.ratingDistribution[4] || 0) / stats.totalReviews * 100) : 0}%
            </div>
            <p className="mt-1 text-sm text-secondary-600">4-Star Reviews</p>
          </div>
        </div>
      </div>

      <div className="rounded-[24px] border border-hairline bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-primary-900">Rating Distribution</h3>
        <div className="space-y-3">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = stats.ratingDistribution[rating] || 0;
            const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;

            return (
              <div key={rating} className="flex items-center">
                <div className="flex w-16 items-center">
                  <span className="text-sm font-medium text-primary-900">{rating}</span>
                  <StarIcon className="ml-1 h-4 w-4 fill-current text-warning-500" />
                </div>
                <div className="mx-4 flex-1">
                  <div className="h-2 w-full rounded-full bg-surface">
                    <div
                      className="h-2 rounded-full bg-warning-500"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
                <div className="w-12 text-right">
                  <span className="text-sm text-secondary-600">{count}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-[24px] border border-hairline bg-white p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-secondary-700">
              Filter by Rating
            </label>
            <select
              value={filters.rating}
              onChange={(e) => setFilters(prev => ({ ...prev, rating: e.target.value }))}
              className="w-full rounded-full border border-hairline bg-surface px-4 py-2.5 text-sm text-primary-900 focus:border-primary-900 focus:outline-none focus-visible:ring-2 focus:ring-primary-900/10"
            >
              <option value="">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-secondary-700">
              Sort By
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
              className="w-full rounded-full border border-hairline bg-surface px-4 py-2.5 text-sm text-primary-900 focus:border-primary-900 focus:outline-none focus-visible:ring-2 focus:ring-primary-900/10"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Rating</option>
              <option value="lowest">Lowest Rating</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={fetchReviews}
              className="w-full rounded-full bg-primary-900 px-4 py-2.5 text-sm font-semibold text-white focus:outline-none focus-visible:ring-2 focus:ring-primary-900/20"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[24px] border border-hairline bg-white">
        <div className="border-b border-hairline px-6 py-4">
          <h3 className="text-lg font-semibold text-primary-900">
            Customer Reviews ({reviews.length})
          </h3>
        </div>

        {reviews.length === 0 ? (
          <div className="p-6 text-center">
            <ChatBubbleLeftIcon className="mx-auto mb-4 h-12 w-12 text-secondary-400" />
            <p className="text-primary-900">No reviews found</p>
            <p className="mt-1 text-sm text-secondary-500">Reviews will appear here once customers rate your services</p>
          </div>
        ) : (
          <div className="divide-y divide-hairline-soft">
            {reviews.map((review) => (
              <div key={review._id} className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-surface text-secondary-700">
                    <UserIcon className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-primary-900">
                          {review.customer?.name || 'Anonymous Customer'}
                        </h4>
                        <div className="mt-1 flex items-center">
                          <div className="flex">
                            {renderStars(review.rating)}
                          </div>
                          <span className={`ml-2 text-sm font-medium ${getRatingColor(review.rating)}`}>
                            {review.rating}/5
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center text-sm text-secondary-500">
                        <CalendarIcon className="mr-1 h-4 w-4" />
                        {getRelativeTime(review.createdAt)}
                      </div>
                    </div>

                    {review.comment && (
                      <div className="mt-3">
                        <p className="text-sm leading-6 text-secondary-700">{review.comment}</p>
                      </div>
                    )}

                    {review.serviceRequest && (
                      <div className="mt-3 rounded-[18px] bg-surface p-3">
                        <div className="text-sm">
                          <span className="font-medium text-primary-900">Service:</span>
                          <span className="ml-1 text-secondary-600">
                            {review.serviceRequest.issueType?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </div>
                        {review.serviceRequest.description && (
                          <div className="mt-1 text-sm">
                            <span className="font-medium text-primary-900">Details:</span>
                            <span className="ml-1 text-secondary-600">{review.serviceRequest.description}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {review.response && (
                      <div className="mt-3 rounded-[18px] bg-success-50 p-3">
                        <div className="text-sm">
                          <span className="font-medium text-success-800">Your Response:</span>
                          <p className="mt-1 text-success-700">{review.response}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-[24px] border border-success-200 bg-success-50 p-4">
        <h4 className="mb-2 text-sm font-semibold text-success-800">💡 Tips for Better Reviews</h4>
        <ul className="space-y-1 text-sm text-success-700">
          <li>• Provide excellent service and communicate clearly with customers</li>
          <li>• Respond to reviews professionally and address any concerns</li>
          <li>• Ask satisfied customers to leave reviews after service completion</li>
          <li>• Use negative feedback as an opportunity to improve your services</li>
        </ul>
      </div>
    </div>
  );
};

export default Reviews;
