import ChatInterface from "../../components/chat/ChatInterface";
import Card from "../../components/common/Card";
import CustomerSurface from "../../components/customer/CustomerSurface";

const Chat = () => {
  return (
    <CustomerSurface
      eyebrow="Messages"
      title="Chat with mechanics from one place."
      description="Keep service conversations attached to the request so updates, confirmations, and follow-ups stay in context."
      stats={[
        { value: "Live", label: "conversation flow" },
        { value: "1", label: "workspace" },
      ]}
    >
      <Card className="p-0 overflow-hidden">
        <div className="border-b border-hairline px-5 py-4 sm:px-6">
          <p className="text-sm font-semibold text-primary-900">
            Conversation panel
          </p>
          <p className="mt-1 text-sm text-secondary-600">
            The chat surface now sits inside the same framed layout as the rest
            of the customer workspace.
          </p>
        </div>
        <div className="h-[70vh] min-h-[520px]">
          <ChatInterface />
        </div>
      </Card>
    </CustomerSurface>
  );
};

export default Chat;
