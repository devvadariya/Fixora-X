import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { Link, useSearchParams } from "react-router-dom";
import ChatInterface from "../../components/chat/ChatInterface";
import Card from "../../components/common/Card";
import MechanicSurface from "../../components/mechanic/MechanicSurface";

const Chat = () => {
  const [searchParams] = useSearchParams();
  const requestId = searchParams.get("requestId");

  return (
    <MechanicSurface
      eyebrow="Messages"
      title={requestId ? "Service request chat" : "Customer messages"}
      description={
        requestId
          ? "Keep the conversation attached to the current job."
          : "Keep conversations tied to the request so context never gets lost."
      }
      stats={[
        { value: requestId ? "Live" : "Inbox", label: "conversation mode" },
        { value: "1", label: "workspace" },
      ]}
    >
      <Card className="p-0 overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-hairline px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="text-sm font-semibold text-primary-900">
              {requestId ? "Current service request" : "Message inbox"}
            </p>
            <p className="mt-1 text-sm text-secondary-600">
              {requestId
                ? "Use this thread to confirm updates and arrival timing."
                : "Use this space to handle customer follow-ups."}
            </p>
          </div>
          {requestId && (
            <Link
              to="/mechanic/requests"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary-900"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Back to requests
            </Link>
          )}
        </div>
        <div className="h-[70vh] min-h-[520px]">
          <ChatInterface requestId={requestId} />
        </div>
      </Card>
    </MechanicSurface>
  );
};

export default Chat;
